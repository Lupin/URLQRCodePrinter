//
//  PrinterSession.swift
//  NiimbotKit
//
//  Session d'impression Niimbot.
//
//  Enchaîne le dialogue documenté en vérifiant chaque acquittement. Le principe
//  directeur : ne jamais supposer qu'une commande a été acceptée. L'imprimante
//  rogne ou ignore en silence ; seule la lecture des réponses révèle l'échec.
//
//  Deux pièges structurels sont explicitement gérés :
//
//  - Le D110 refuse un `setPageSize` au format des firmwares v4 (13 octets) en
//    répondant une erreur `dataError` **au lieu d'imprimer**.
//  - L'imprimante rogne les colonnes au-delà de la largeur de tête sans
//    renvoyer d'erreur ; `print` refuse donc une image trop large.
//

import Foundation

/// Délais par défaut.
public enum Timeouts {
    /// Réponse à une commande de réglage.
    public static let ack: TimeInterval = 3
    /// Attente de fin d'impression : la tête chauffe, c'est lent.
    public static let print: TimeInterval = 60
    /// Intervalle entre deux interrogations de statut.
    public static let poll: TimeInterval = 0.3
    /// Sonde de largeur de tête, souvent ignorée par le firmware.
    public static let headProbe: TimeInterval = 0.6
}

/// Résultat d'une impression.
public struct PrintResult: Sendable, Equatable {
    public let pages: Int
    public let rows: Int
    public let frames: Int
}

/// Pilote une imprimante sur un lien donné.
public final class PrinterSession {
    private let link: NiimbotLink

    /// Profil retenu, affiné après lecture du `modelId`.
    public private(set) var profile: PrinterProfile

    /// Identité lue à la connexion.
    public private(set) var modelID: Int?
    public private(set) var protocolVersion: UInt8?
    public private(set) var reportedHeadPixels: Int?

    /// Dernière erreur signalée par l'imprimante, remise à zéro avant chaque
    /// travail.
    private var lastError: UInt8?
    private var unsubscribe: (() -> Void)?

    public init(link: NiimbotLink, profile: PrinterProfile = defaultProfile) {
        self.link = link
        self.profile = profile
    }

    deinit {
        unsubscribe?()
    }

    /// Établit la session : connexion, lecture de l'identité, choix du profil.
    @discardableResult
    public func start(deviceName: String? = nil) async throws -> PrinterProfile {
        unsubscribe = link.onPacket { [weak self] packet in
            guard let self else { return }
            if packet.command == IncomingCommand.printError.rawValue {
                self.lastError = packet.firstByte
            }
        }

        try await acknowledge(buildConnect(), expecting: .connect)

        let status = try await acknowledge(printerStatusDataFrame(), expecting: .printerStatusData)
        protocolVersion = status.firstByte

        // Certains firmwares ne répondent pas à cette interrogation : ce n'est
        // pas bloquant, on retombe sur le nom annoncé.
        if let info = try? await acknowledge(printerInfoFrame(0x08), expecting: .printerInfo) {
            modelID = PrinterIdentity(data: info.data).modelID
        }

        // Les fonctions globales sont qualifiées par le module : la propriété
        // `profile` de cette classe masquerait leurs noms autrement.
        var resolved = modelID.flatMap { NiimbotKit.profile(forModelID: $0) }
            ?? deviceName.flatMap { NiimbotKit.profile(forName: $0) }
            ?? defaultProfile

        if let head = await readHeadWidth() {
            reportedHeadPixels = head
            resolved = NiimbotKit.profile(resolved, withReportedHead: head)
        }

        profile = resolved
        return resolved
    }

    /// Imprime une image.
    ///
    /// - Parameters:
    ///   - bitmap: largeur égale à celle de la tête, multiple de 8.
    ///   - density: ramenée dans les bornes du profil.
    ///   - copies: nombre d'exemplaires.
    ///   - onProgress: appelé à chaque avancement, `(page, total)`.
    public func print(
        _ bitmap: MonoBitmap,
        density: Int? = nil,
        copies: Int = 1,
        labelType: LabelType = .withGaps,
        onProgress: (@Sendable (Int, Int) -> Void)? = nil
    ) async throws -> PrintResult {
        let problems = bitmap.validate(
            printheadPixels: profile.printheadPixels,
            maxHeightPx: profile.maxPrintHeightPx
        )
        guard problems.isEmpty else { throw NiimbotError.incompatibleBitmap(problems) }

        let copies = max(1, copies)
        let density = profile.clampDensity(density ?? Int(profile.defaultDensity))
        let task = profile.printTask
        lastError = nil

        try await acknowledge(setDensityFrame(density), expecting: .setDensity)
        try await acknowledge(setLabelTypeFrame(labelType), expecting: .setLabelType)

        // Le D110 n'accepte qu'un octet ici et ne peut donc pas déclarer de
        // travail multi-pages ; les autres modèles reçoivent la variante adaptée.
        try await acknowledge(
            printStartFrame(task, pages: UInt16(copies)),
            expecting: .printStart
        )

        if task == .d110 {
            try await acknowledge(printClearFrame(), expecting: .printClear)
        }

        try await acknowledge(pageStartFrame(), expecting: .pageStart)
        try await acknowledge(
            setPageSizeFrame(
                task,
                rows: UInt16(bitmap.height),
                cols: UInt16(profile.printheadPixels),
                copies: UInt16(copies)
            ),
            expecting: .setPageSize
        )
        try await acknowledge(printQuantityFrame(UInt16(copies)), expecting: .printQuantity)

        let frames = bitmapFrames(bitmap)
        for frame in frames {
            try await link.send(frame)
        }
        try await link.flush()

        try await acknowledge(pageEndFrame(), expecting: .pageEnd, timeout: Timeouts.print)
        try await waitForCompletion(copies: copies, onProgress: onProgress)
        try await acknowledge(printEndFrame(), expecting: .printEnd, timeout: Timeouts.print)

        if let code = lastError {
            throw NiimbotError.printerReported(PrintError(rawValue: code) ?? .dataError)
        }

        return PrintResult(pages: copies, rows: bitmap.height, frames: frames.count)
    }

    // MARK: - Interne

    /// Envoie une trame et attend son acquittement.
    ///
    /// L'attente est armée **avant** l'envoi, de façon synchrone : une réponse
    /// très rapide ne doit pas être manquée. Utiliser `async let` ici serait un
    /// bug — la tâche d'attente n'est pas garantie de démarrer avant `send`.
    ///
    /// Le résultat est le plus souvent ignoré — seule compte l'absence
    /// d'erreur — d'où `@discardableResult`.
    @discardableResult
    private func acknowledge(
        _ frame: [UInt8],
        expecting: IncomingCommand,
        timeout: TimeInterval = Timeouts.ack
    ) async throws -> Packet {
        let expectation = link.expect(expecting, timeout: timeout, matching: nil)
        try await link.send(frame)
        try await link.flush()
        return try await expectation.value()
    }

    private func waitForCompletion(
        copies: Int,
        onProgress: (@Sendable (Int, Int) -> Void)?
    ) async throws {
        let deadline = Date().addingTimeInterval(Timeouts.print)

        while Date() < deadline {
            let response = try await acknowledge(printStatusFrame(), expecting: .printStatus)
            let status = PrintStatus(data: response.data)
            onProgress?(Int(status.page), copies)

            if Int(status.page) >= copies { return }
            try await Task.sleep(nanoseconds: UInt64(Timeouts.poll * 1_000_000_000))
        }

        throw NiimbotError.printIncomplete(seconds: Timeouts.print)
    }

    /// Tente de lire la largeur de tête réellement rapportée.
    ///
    /// La sonde est `heartbeat 0xDC [03]`, à laquelle l'imprimante répond `0xDE`
    /// avec la largeur sur les octets 4-5. Elle n'a été observée que sur M2_H, et
    /// beaucoup de firmwares l'ignorent : le délai est court et l'échec
    /// silencieux, pour ne pas ralentir la connexion d'un D110.
    private func readHeadWidth() async -> Int? {
        guard let response = try? await acknowledge(
            buildPacket(Command.heartbeat.rawValue, [0x03]),
            expecting: .headInfo,
            timeout: Timeouts.headProbe
        ) else { return nil }

        guard let width = response.uint16(at: 4), width > 0 else { return nil }
        return Int(width)
    }
}
