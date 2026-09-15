//
//  SessionTests.swift
//  NiimbotKitTests
//
//  La session est testée contre une liaison simulée qui décode les trames
//  réellement écrites et rejoue les acquittements attendus. C'est le seul moyen
//  de vérifier l'ordre exact du dialogue sans imprimante : une séquence erronée
//  n'échoue pas bruyamment sur le matériel, elle sort une étiquette blanche.
//

import XCTest
@testable import NiimbotKit

/// Liaison factice : rejoue les réponses documentées d'un D110.
final class FakeLink: NiimbotLink, @unchecked Sendable {
    private struct PendingExpectation {
        let command: IncomingCommand
        let matching: ((Packet) -> Bool)?
        let expectation: Expectation
    }

    private let lock = NSLock()
    private var expectations: [PendingExpectation] = []
    private var handlers: [(Packet) -> Void] = []
    private var decoder = PacketStreamDecoder()

    /// Commandes reçues, dans l'ordre.
    private(set) var commands: [UInt8] = []
    /// Pages renvoyées successivement par les sondes de statut.
    var statusPages: [UInt16] = [1]
    private var statusIndex = 0
    /// Commandes auxquelles l'imprimante ne répond pas.
    var silent: Set<UInt8> = []
    /// Réponses par commande.
    var responses: [UInt8: [UInt8]] = FakeLink.defaultResponses
    /// Dernière densité reçue, pour vérifier la borne appliquée.
    private(set) var lastDensityValue: UInt8?
    /// Quand la commande envoyée correspond, l'imprimante signale une erreur.
    var errorAfter: UInt8?
    var errorCode: UInt8 = PrintError.coverOpen.rawValue

    static let defaultResponses: [UInt8: [UInt8]] = [
        Command.connect.rawValue: [IncomingCommand.connect.rawValue, 0x01],
        Command.printerStatusData.rawValue: [IncomingCommand.printerStatusData.rawValue, 0x03, 0x00],
        Command.printerInfo.rawValue: [IncomingCommand.printerInfo.rawValue, 0x09, 0x00],
        Command.setDensity.rawValue: [IncomingCommand.setDensity.rawValue, 0x02],
        Command.setLabelType.rawValue: [IncomingCommand.setLabelType.rawValue, 0x01],
        Command.printStart.rawValue: [IncomingCommand.printStart.rawValue, 0x01],
        Command.printClear.rawValue: [IncomingCommand.printClear.rawValue, 0x01],
        Command.pageStart.rawValue: [IncomingCommand.pageStart.rawValue, 0x01],
        Command.setPageSize.rawValue: [IncomingCommand.setPageSize.rawValue, 0x01],
        Command.printQuantity.rawValue: [IncomingCommand.printQuantity.rawValue, 0x00, 0x01],
        Command.pageEnd.rawValue: [IncomingCommand.pageEnd.rawValue, 0x01],
        Command.printEnd.rawValue: [IncomingCommand.printEnd.rawValue, 0x01],
        // 0xDC [03] → 0xDE, largeur de tête sur les octets 4-5 (0x0060 = 96).
        Command.heartbeat.rawValue: [
            IncomingCommand.headInfo.rawValue,
            0x00, 0x01, 0x00, 0x00, 0x00, 0x60, 0x00, 0x00, 0x00, 0x00,
        ],
    ]

    /// Confine `NSLock` à un contexte synchrone.
    ///
    /// Verrouiller depuis une fonction asynchrone est un avertissement qui
    /// deviendra une erreur en mode langage Swift 6 ; le code de production
    /// applique déjà la même discipline.
    private func withState<T>(_ body: () -> T) -> T {
        lock.lock()
        defer { lock.unlock() }
        return body()
    }

    func send(_ frame: [UInt8]) async throws {
        let packets = decoder.push(frame)
        for packet in packets {
            // Le verrou est pris dans une fonction locale synchrone : appelé
            // directement depuis `send`, il déclencherait l'avertissement
            // « NSLock unavailable from asynchronous contexts », qui deviendra
            // une erreur en mode langage Swift 6.
            var response: Packet?
            var shouldFail = false
            var code: UInt8 = 0

            func prepareReaction() {
                lock.lock()
                defer { lock.unlock() }
                commands.append(packet.command)
                if packet.command == Command.setDensity.rawValue {
                    lastDensityValue = packet.firstByte
                }
                response = silent.contains(packet.command) ? nil : self.response(for: packet)
                shouldFail = errorAfter == packet.command
                code = errorCode
            }

            prepareReaction()
            let observers = withState { handlers }

            for observer in observers { observer(packet) }
            if let response { deliver(response) }
            // Une erreur est signalée après l'acquittement : c'est l'ordre réel,
            // l'imprimante accepte la commande puis refuse le travail.
            if shouldFail {
                for observer in observers {
                    observer(Packet(command: IncomingCommand.printError.rawValue, data: [code]))
                }
            }
        }
    }

    func flush() async throws {}

    func expect(
        _ command: IncomingCommand,
        timeout: TimeInterval,
        matching: ((Packet) -> Bool)?
    ) -> Expectation {
        // Enregistrement synchrone : c'est ce qui garantit qu'une réponse
        // arrivant pendant `send` trouve preneur.
        let expectation = Expectation(command: command)
        withState {
            expectations.append(
                PendingExpectation(command: command, matching: matching, expectation: expectation)
            )
        }

        Task { [weak self] in
            // Le délai est plafonné : ce double simule une imprimante muette, et
            // attendre les secondes du vrai délai rendrait la suite pénible à
            // exécuter sans rien vérifier de plus.
            let delay = min(timeout, 0.05)
            try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            self?.expire(expectation, command: command)
        }
        return expectation
    }

    @discardableResult
    func onPacket(_ handler: @escaping @Sendable (Packet) -> Void) -> () -> Void {
        lock.lock()
        handlers.append(handler)
        let index = handlers.count - 1
        lock.unlock()
        return { [weak self] in
            guard let self else { return }
            self.lock.lock()
            if index < self.handlers.count { self.handlers.remove(at: index) }
            self.lock.unlock()
        }
    }

    private func response(for packet: Packet) -> Packet? {
        if packet.command == Command.printStatus.rawValue {
            let page = statusPages[min(statusIndex, statusPages.count - 1)]
            statusIndex += 1
            return Packet(
                command: IncomingCommand.printStatus.rawValue,
                data: [UInt8(page >> 8), UInt8(page & 0xFF), 0x00, 0x00]
            )
        }
        guard let entry = responses[packet.command], let command = entry.first else { return nil }
        return Packet(command: command, data: Array(entry.dropFirst()))
    }

    private func deliver(_ packet: Packet) {
        lock.lock()
        guard let index = expectations.firstIndex(where: {
            $0.command.rawValue == packet.command && ($0.matching?(packet) ?? true)
        }) else {
            lock.unlock()
            return
        }
        let entry = expectations.remove(at: index)
        lock.unlock()
        entry.expectation.settle(.success(packet))
    }

    private func expire(_ expectation: Expectation, command: IncomingCommand) {
        lock.lock()
        guard let index = expectations.firstIndex(where: { $0.expectation === expectation }) else {
            lock.unlock()
            return
        }
        expectations.remove(at: index)
        lock.unlock()
        expectation.settle(.failure(NiimbotError.timeout(expected: command.rawValue, seconds: 0)))
    }

    /// Commandes reçues après un index donné.
    func since(_ index: Int) -> [UInt8] {
        lock.lock()
        defer { lock.unlock() }
        return Array(commands.dropFirst(index))
    }

    var commandCount: Int {
        lock.lock()
        defer { lock.unlock() }
        return commands.count
    }
}

/// Construit une image monochrome de test.
func makeBitmap(width: Int = 96, patterns: [UInt8?]) -> MonoBitmap {
    let bytesPerRow = (width + 7) / 8
    let rows = patterns.map { pattern -> [UInt8] in
        var row = [UInt8](repeating: 0, count: bytesPerRow)
        if let pattern { row[0] = pattern }
        return row
    }
    return MonoBitmap(width: width, height: rows.count, bytesPerRow: bytesPerRow, rows: rows)
}

final class SessionTests: XCTestCase {

    func testStartIdentifiesModelAndProfile() async throws {
        let link = FakeLink()
        let session = PrinterSession(link: link)
        let profile = try await session.start()

        XCTAssertEqual(session.modelID, 2304)
        XCTAssertEqual(profile.id, "D110")
        XCTAssertEqual(session.reportedHeadPixels, 96)
        XCTAssertEqual(session.protocolVersion, 0x03)
    }

    func testStartFallsBackOnDeviceNameWhenModelSilent() async throws {
        let link = FakeLink()
        link.silent = [Command.printerInfo.rawValue]
        let session = PrinterSession(link: link)

        let profile = try await session.start(deviceName: "D110-FC06023035")
        XCTAssertNil(session.modelID)
        XCTAssertEqual(profile.id, "D110")
    }

    func testStartUsesDefaultProfileOnUnknownDevice() async throws {
        let link = FakeLink()
        link.silent = [Command.printerInfo.rawValue, Command.heartbeat.rawValue]
        let session = PrinterSession(link: link)

        let profile = try await session.start(deviceName: "Truc")
        XCTAssertEqual(profile.id, "D110")
        XCTAssertNil(session.reportedHeadPixels)
    }

    func testPrintSendsDocumentedD110Sequence() async throws {
        let link = FakeLink()
        let session = PrinterSession(link: link)
        _ = try await session.start()

        let marker = link.commandCount
        let bitmap = makeBitmap(patterns: [0x00, 0xFF, 0xFF, 0x00])
        _ = try await session.print(bitmap, density: 2, copies: 1)

        XCTAssertEqual(link.since(marker), [
            Command.setDensity.rawValue,
            Command.setLabelType.rawValue,
            Command.printStart.rawValue,
            Command.printClear.rawValue,
            Command.pageStart.rawValue,
            Command.setPageSize.rawValue,
            Command.printQuantity.rawValue,
            Command.printEmptyRow.rawValue,
            Command.printBitmapRow.rawValue,
            Command.printEmptyRow.rawValue,
            Command.pageEnd.rawValue,
            Command.printStatus.rawValue,
            Command.printEnd.rawValue,
        ])
    }

    func testPrintRefusesBitmapWiderThanHead() async throws {
        let link = FakeLink()
        let session = PrinterSession(link: link)
        _ = try await session.start()

        let tooWide = makeBitmap(width: 120, patterns: [0xFF])
        do {
            _ = try await session.print(tooWide)
            XCTFail("une image plus large que la tête doit être refusée")
        } catch let error as NiimbotError {
            guard case let .incompatibleBitmap(reasons) = error else {
                return XCTFail("erreur inattendue : \(error)")
            }
            XCTAssertTrue(reasons.contains { $0.contains("rogné") })
        }
    }

    func testPrintClampsDensityToProfileBounds() async throws {
        let link = FakeLink()
        let session = PrinterSession(link: link)
        _ = try await session.start()

        let marker = link.commandCount
        _ = try await session.print(makeBitmap(patterns: [0xFF]), density: 99)

        // La trame de densité est la première envoyée : [55 55 21 01 densité cks aa aa]
        let densityFrameIndex = marker
        XCTAssertEqual(link.since(densityFrameIndex).first, Command.setDensity.rawValue)
        XCTAssertEqual(link.lastDensityValue, 3, "99 doit être ramené à 3 sur un D110")
    }

    func testPrintReportsCompletionForEachCopy() async throws {
        let link = FakeLink()
        link.statusPages = [1, 2]
        let session = PrinterSession(link: link)
        _ = try await session.start()

        let pages = Counter()
        _ = try await session.print(makeBitmap(patterns: [0xFF]), copies: 2) { page, _ in
            pages.increment(page)
        }

        XCTAssertEqual(pages.values, [1, 2])
    }

    func testPrintSurfacesPrinterError() async throws {
        let link = FakeLink()
        let session = PrinterSession(link: link)
        _ = try await session.start()

        link.errorAfter = Command.printStart.rawValue
        link.errorCode = PrintError.coverOpen.rawValue

        do {
            _ = try await session.print(makeBitmap(patterns: [0xFF]))
            XCTFail("une erreur signalée doit être remontée")
        } catch let error as NiimbotError {
            XCTAssertEqual(error, .printerReported(.coverOpen))
        }
    }

    func testTimeoutFailsCleanly() async throws {
        let link = FakeLink()
        link.silent = [Command.setDensity.rawValue]
        let session = PrinterSession(link: link)
        _ = try await session.start()

        do {
            _ = try await session.print(makeBitmap(patterns: [0xFF]))
            XCTFail("une imprimante muette doit produire une erreur")
        } catch let error as NiimbotError {
            guard case .timeout = error else { return XCTFail("erreur inattendue : \(error)") }
        }
    }
}

/// Compteur partagé entre la tâche d'impression et le test.
final class Counter: @unchecked Sendable {
    private let lock = NSLock()
    private var storage: [Int] = []

    func increment(_ value: Int) {
        lock.lock()
        storage.append(value)
        lock.unlock()
    }

    var values: [Int] {
        lock.lock()
        defer { lock.unlock() }
        return storage
    }
}
