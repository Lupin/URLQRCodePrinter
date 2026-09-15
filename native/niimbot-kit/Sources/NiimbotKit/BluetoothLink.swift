//
//  BluetoothLink.swift
//  NiimbotKit
//
//  Liaison CoreBluetooth vers une imprimante Niimbot.
//
//  Ce fichier existe parce qu'aucun navigateur iOS n'expose Web Bluetooth :
//  sur iPhone, imprimer passe forcément par le Bluetooth natif.
//
//  Trois points résultent de mesures de la communauté sur matériel réel :
//
//  1. **Le filtrage par service ne trouve rien.** Les imprimantes Niimbot
//     n'annoncent pas leur UUID de service dans leur paquet d'advertising ; il
//     n'est visible qu'après connexion. On filtre donc sur le nom.
//  2. **Écrire en rafale produit des étiquettes blanches ou tronquées.** La
//     caractéristique n'expose que l'écriture sans réponse, et CoreBluetooth ne
//     signale pas la saturation de son tampon. Le bon levier n'est pas de
//     ralentir mais d'écrire moins souvent : le protocole est un flux de
//     trames, plusieurs tiennent dans une seule écriture.
//  3. **Les notifications arrivent en flux d'octets**, pas en trames. Le
//     `PacketStreamDecoder` s'en charge.
//

#if canImport(CoreBluetooth)
import Foundation
import CoreBluetooth

/// Service exposé par la quasi-totalité des imprimantes Niimbot.
public let niimbotServiceUUID = CBUUID(string: "e7810a71-73ae-499d-8c15-faa9aef0c3f2")

/// Caractéristique principale : elle porte à la fois les notifications et les
/// écritures sans réponse. Le code ne s'y fie pas aveuglément — si elle est
/// absente, on découvre la bonne par ses propriétés.
public let niimbotCharacteristicUUID = CBUUID(string: "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f")

/// Taille maximale d'un groupe d'écriture.
///
/// Contrairement au Web Bluetooth, CoreBluetooth expose
/// `maximumWriteValueLength(for:)` : on lit la vraie limite après connexion et
/// on ne garde cette valeur que comme plafond de sécurité.
public let defaultMaxBundleBytes = 240

/// Intervalle minimal entre deux écritures.
///
/// Sur Apple, le Bluetooth passe par CoreBluetooth, dont le tampon sature sans
/// le signaler : la rafale y est systématiquement perdante.
public let defaultPace: TimeInterval = 0.010

/// Erreurs propres à la couche Bluetooth.
public enum BluetoothLinkError: Error, LocalizedError {
    case unsupported
    case unauthorized
    case poweredOff
    case noDeviceFound
    case serviceNotFound
    case characteristicNotFound
    case cancelled

    public var errorDescription: String? {
        switch self {
        case .unsupported: return "Le Bluetooth n'est pas disponible sur cet appareil."
        case .unauthorized: return "L'accès au Bluetooth a été refusé dans les réglages."
        case .poweredOff: return "Le Bluetooth est désactivé."
        case .noDeviceFound: return "Aucune imprimante trouvée. Vérifiez qu'elle est allumée et à portée."
        case .serviceNotFound: return "Le service Niimbot est introuvable sur cet appareil."
        case .characteristicNotFound:
            return "Aucune caractéristique utilisable : ce n'est probablement pas une imprimante compatible."
        case .cancelled: return "Recherche interrompue."
        }
    }
}

/// Une imprimante repérée.
public struct DiscoveredPrinter: Sendable, Equatable, Identifiable {
    public let id: UUID
    public let name: String
    public let rssi: Int

    public init(id: UUID, name: String, rssi: Int) {
        self.id = id
        self.name = name
        self.rssi = rssi
    }
}

/// Liaison vers une imprimante connectée.
public final class CoreBluetoothLink: NSObject, NiimbotLink, @unchecked Sendable {

    // MARK: État

    private let lock = NSLock()
    private var central: CBCentralManager!
    private var peripheral: CBPeripheral?
    private var characteristic: CBCharacteristic?
    private var decoder = PacketStreamDecoder()
    private var handlers: [(Packet) -> Void] = []
    private var expectations: [PendingExpectation] = []

    /// Trames en attente d'écriture, groupées.
    private var pendingFrames: [[UInt8]] = []
    private var pendingBytes = 0
    private var lastWriteAt = Date.distantPast
    /// Limite réelle, lue après connexion.
    private var maxWriteBytes = defaultMaxBundleBytes

    private var scanContinuation: CheckedContinuation<DiscoveredPrinter, Error>?
    private var connectContinuation: CheckedContinuation<Void, Error>?

    private let pace: TimeInterval
    private static let queue = DispatchQueue(label: "niimbot.kit.bluetooth")

    private struct PendingExpectation {
        let command: IncomingCommand
        let matching: ((Packet) -> Bool)?
        let expectation: Expectation
    }

    // MARK: Cycle de vie

    public init(pace: TimeInterval = defaultPace) {
        self.pace = pace
        super.init()
    }

    /// Prépare le gestionnaire central. Idempotent.
    public func activate() {
        lock.lock()
        let existing = central
        lock.unlock()
        guard existing == nil else { return }

        let manager = CBCentralManager(delegate: self, queue: Self.queue)
        lock.lock()
        central = manager
        lock.unlock()
    }

    /// Cherche la première imprimante dont le nom commence par l'un des préfixes.
    ///
    /// Le filtrage porte sur le nom : le service n'est pas annoncé, un filtre
    /// par service ne remonterait rien.
    public func discover(
        namePrefixes: [String] = allNamePrefixes,
        timeout: TimeInterval = 10
    ) async throws -> DiscoveredPrinter {
        activate()
        try await waitUntilPoweredOn()

        return try await withCheckedThrowingContinuation { continuation in
            lock.lock()
            scanContinuation = continuation
            lock.unlock()

            // On scanne sans filtre de service, puis on trie sur le nom.
            central.scanForPeripherals(withServices: nil, options: nil)

            Task { [weak self] in
                try? await Task.sleep(nanoseconds: UInt64(timeout * 1_000_000_000))
                self?.finishScan(with: .failure(BluetoothLinkError.noDeviceFound))
            }

            // Les préfixes sont mémorisés pour le délégué.
            self.pendingPrefixes = namePrefixes.map { $0.uppercased() }
        }
    }

    private var pendingPrefixes: [String] = []

    /// Se connecte à une imprimante repérée.
    public func connect(to printer: DiscoveredPrinter) async throws {
        activate()
        let peripheral = await withCheckedContinuation { continuation in
            lock.lock()
            let found = central.retrievePeripherals(withIdentifiers: [printer.id]).first
            lock.unlock()
            continuation.resume(returning: found)
        }

        guard let peripheral else { throw BluetoothLinkError.noDeviceFound }

        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            lock.lock()
            connectContinuation = continuation
            self.peripheral = peripheral
            lock.unlock()

            peripheral.delegate = self
            central.connect(peripheral, options: nil)

            Task { [weak self] in
                try? await Task.sleep(nanoseconds: 15 * 1_000_000_000)
                self?.finishConnect(with: .failure(BluetoothLinkError.noDeviceFound))
            }
        }
    }

    /// Coupe la liaison.
    public func disconnect() {
        lock.lock()
        let peripheral = self.peripheral
        let expectations = self.expectations
        self.expectations = []
        self.pendingFrames = []
        self.pendingBytes = 0
        self.peripheral = nil
        self.characteristic = nil
        lock.unlock()

        decoder.reset()
        for pending in expectations {
            pending.expectation.settle(.failure(NiimbotError.disconnected("liaison fermée")))
        }
        if let peripheral { central.cancelPeripheralConnection(peripheral) }
    }

    // MARK: NiimbotLink

    public func expect(
        _ command: IncomingCommand,
        timeout: TimeInterval,
        matching: ((Packet) -> Bool)?
    ) -> Expectation {
        let expectation = Expectation(command: command)
        lock.lock()
        expectations.append(
            PendingExpectation(command: command, matching: matching, expectation: expectation)
        )
        lock.unlock()

        Task { [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(timeout * 1_000_000_000))
            self?.expire(expectation, command: command, timeout: timeout)
        }
        return expectation
    }

    @discardableResult
    public func onPacket(_ handler: @escaping @Sendable (Packet) -> Void) -> () -> Void {
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

    /// Exécute `body` en tenant le verrou.
    ///
    /// Le verrou n'est jamais tenu à travers un `await` : la concurrence
    /// structurée de Swift interdit d'ailleurs de verrouiller depuis une
    /// fonction asynchrone, et ce qui n'est aujourd'hui qu'un avertissement
    /// devient une erreur en mode langage Swift 6. Confiner `NSLock` à ce
    /// helper synchrone règle les deux points.
    private func withState<T>(_ body: () -> T) -> T {
        lock.lock()
        defer { lock.unlock() }
        return body()
    }

    /// Décision prise sous verrou, avant toute attente.
    private enum SendDecision {
        case queued
        case notConnected
        case split
        case flushFirst
    }

    public func send(_ frame: [UInt8]) async throws {
        let decision = withState { () -> SendDecision in
            guard characteristic != nil else { return .notConnected }
            if frame.count > maxWriteBytes { return .split }
            if pendingBytes + frame.count > maxWriteBytes { return .flushFirst }
            pendingFrames.append(frame)
            pendingBytes += frame.count
            return .queued
        }

        switch decision {
        case .notConnected:
            throw NiimbotError.notConnected

        case .queued:
            return

        case .split:
            // Une trame plus grosse que la limite partirait en une écriture
            // refusée : on la fractionne.
            try await flush()
            var offset = 0
            while offset < frame.count {
                let end = min(offset + maxWriteBytes, frame.count)
                try await writeChunk(Array(frame[offset..<end]))
                offset = end
            }

        case .flushFirst:
            try await flush()
            withState {
                pendingFrames.append(frame)
                pendingBytes += frame.count
            }
        }
    }

    public func flush() async throws {
        let bundle = withState { () -> [UInt8]? in
            guard !pendingFrames.isEmpty else { return nil }
            let merged = pendingFrames.flatMap { $0 }
            pendingFrames = []
            pendingBytes = 0
            return merged
        }

        guard let bundle else { return }
        try await writeChunk(bundle)
    }

    // MARK: Écriture

    private func writeChunk(_ bytes: [UInt8]) async throws {
        let context = withState {
            () -> (CBPeripheral, CBCharacteristic, TimeInterval)? in
            guard let peripheral, let characteristic else { return nil }
            let elapsed = Date().timeIntervalSince(lastWriteAt)
            lastWriteAt = Date()
            return (peripheral, characteristic, elapsed)
        }

        guard let (peripheral, characteristic, elapsed) = context else {
            throw NiimbotError.notConnected
        }

        // Le rythme est imposé par le temps d'envoi, pas par les données.
        let silence = pace - elapsed
        if silence > 0 {
            try? await Task.sleep(nanoseconds: UInt64(silence * 1_000_000_000))
        }

        let type: CBCharacteristicWriteType =
            characteristic.properties.contains(.writeWithoutResponse) ? .withoutResponse : .withResponse
        peripheral.writeValue(Data(bytes), for: characteristic, type: type)
    }

    // MARK: Réception

    private func ingest(_ data: Data) {
        let packets = decoder.push([UInt8](data))
        guard !packets.isEmpty else { return }

        lock.lock()
        let observers = handlers
        lock.unlock()

        for packet in packets {
            for observer in observers { observer(packet) }
            deliver(packet)
        }
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

    private func expire(_ expectation: Expectation, command: IncomingCommand, timeout: TimeInterval) {
        lock.lock()
        guard let index = expectations.firstIndex(where: { $0.expectation === expectation }) else {
            lock.unlock()
            return
        }
        expectations.remove(at: index)
        lock.unlock()
        expectation.settle(.failure(NiimbotError.timeout(expected: command.rawValue, seconds: timeout)))
    }

    private func finishScan(with result: Result<DiscoveredPrinter, Error>) {
        lock.lock()
        guard let continuation = scanContinuation else {
            lock.unlock()
            return
        }
        scanContinuation = nil
        central?.stopScan()
        lock.unlock()
        continuation.resume(with: result)
    }

    private func finishConnect(with result: Result<Void, Error>) {
        lock.lock()
        guard let continuation = connectContinuation else {
            lock.unlock()
            return
        }
        connectContinuation = nil
        lock.unlock()
        continuation.resume(with: result)
    }

    private func waitUntilPoweredOn() async throws {
        for _ in 0..<50 {
            let state = withState { central?.state }

            switch state {
            case .poweredOn: return
            case .unsupported: throw BluetoothLinkError.unsupported
            case .unauthorized: throw BluetoothLinkError.unauthorized
            case .poweredOff: throw BluetoothLinkError.poweredOff
            default: break
            }
            try? await Task.sleep(nanoseconds: 100_000_000)
        }
        throw BluetoothLinkError.poweredOff
    }
}

// MARK: - Délégués

extension CoreBluetoothLink: CBCentralManagerDelegate {
    public func centralManagerDidUpdateState(_ central: CBCentralManager) {
        if central.state == .poweredOn {
            // Une recherche peut avoir été demandée avant que l'état soit prêt.
            return
        }
        if central.state == .unsupported { finishScan(with: .failure(BluetoothLinkError.unsupported)) }
        if central.state == .unauthorized { finishScan(with: .failure(BluetoothLinkError.unauthorized)) }
    }

    public func centralManager(
        _ central: CBCentralManager,
        didDiscover peripheral: CBPeripheral,
        advertisementData: [String: Any],
        rssi RSSI: NSNumber
    ) {
        let name = peripheral.name
            ?? (advertisementData[CBAdvertisementDataLocalNameKey] as? String)
            ?? ""
        guard !name.isEmpty else { return }

        let upper = name.uppercased()
        let prefixes: [String] = {
            lock.lock()
            defer { lock.unlock() }
            return pendingPrefixes
        }()
        guard prefixes.isEmpty || prefixes.contains(where: { upper.hasPrefix($0) }) else { return }

        finishScan(with: .success(
            DiscoveredPrinter(id: peripheral.identifier, name: name, rssi: RSSI.intValue)
        ))
    }

    public func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        peripheral.discoverServices([niimbotServiceUUID])
    }

    public func centralManager(
        _ central: CBCentralManager,
        didFailToConnect peripheral: CBPeripheral,
        error: Error?
    ) {
        finishConnect(with: .failure(error ?? BluetoothLinkError.noDeviceFound))
    }

    public func centralManager(
        _ central: CBCentralManager,
        didDisconnectPeripheral peripheral: CBPeripheral,
        error: Error?
    ) {
        lock.lock()
        let pending = expectations
        expectations = []
        self.peripheral = nil
        characteristic = nil
        lock.unlock()

        for entry in pending {
            entry.expectation.settle(
                .failure(NiimbotError.disconnected(error?.localizedDescription ?? "appareil hors de portée"))
            )
        }
    }
}

extension CoreBluetoothLink: CBPeripheralDelegate {
    public func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        guard error == nil, let service = peripheral.services?.first(where: {
            $0.uuid == niimbotServiceUUID
        }) else {
            finishConnect(with: .failure(error ?? BluetoothLinkError.serviceNotFound))
            return
        }
        peripheral.discoverCharacteristics(nil, for: service)
    }

    public func peripheral(
        _ peripheral: CBPeripheral,
        didDiscoverCharacteristicsFor service: CBService,
        error: Error?
    ) {
        guard error == nil, let characteristics = service.characteristics else {
            finishConnect(with: .failure(error ?? BluetoothLinkError.characteristicNotFound))
            return
        }

        // On privilégie l'UUID documenté, puis on retombe sur une découverte
        // par propriétés : c'est ce que font niimbluelib et LibreNiim, et cela
        // couvre les variantes de firmware.
        let chosen = characteristics.first { $0.uuid == niimbotCharacteristicUUID }
            ?? characteristics.first { $0.properties.contains(.notify) && $0.properties.contains(.writeWithoutResponse) }
            ?? characteristics.first { $0.properties.contains(.writeWithoutResponse) || $0.properties.contains(.write) }

        guard let chosen else {
            finishConnect(with: .failure(BluetoothLinkError.characteristicNotFound))
            return
        }

        lock.lock()
        characteristic = chosen
        maxWriteBytes = max(20, peripheral.maximumWriteValueLength(for: .withoutResponse))
        lock.unlock()

        peripheral.setNotifyValue(true, for: chosen)
        finishConnect(with: .success(()))
    }

    public func peripheral(
        _ peripheral: CBPeripheral,
        didUpdateValueFor characteristic: CBCharacteristic,
        error: Error?
    ) {
        guard error == nil, let data = characteristic.value else { return }
        ingest(data)
    }
}
#endif
