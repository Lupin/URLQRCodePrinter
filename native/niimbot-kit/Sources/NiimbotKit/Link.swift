//
//  Link.swift
//  NiimbotKit
//
//  Abstraction du lien vers l'imprimante.
//
//  La session d'impression ne connaît que ce protocole, jamais CoreBluetooth.
//  C'est ce qui permet de la tester intégralement hors matériel — une séquence
//  erronée n'échoue pas bruyamment sur une imprimante, elle sort une étiquette
//  blanche — et de substituer un autre transport si besoin.
//
//  L'enregistrement d'une attente est **synchrone** (`expect`), et sa
//  résolution est asynchrone (`value()`). Ce n'est pas un détail de style :
//  avec `async let`, la tâche d'attente n'est pas garantie de démarrer avant
//  l'envoi, et une réponse rapide serait perdue. Le JavaScript arme l'attente
//  avant d'écrire, pour la même raison.
//

import Foundation

/// Erreurs remontées par un lien ou une session.
public enum NiimbotError: Error, LocalizedError, Equatable {
    case notConnected
    case timeout(expected: UInt8, seconds: TimeInterval)
    case printerReported(PrintError)
    case printerReportedUnknown(code: UInt8)
    case incompatibleBitmap([String])
    case printIncomplete(seconds: TimeInterval)
    case disconnected(String)

    public var errorDescription: String? {
        switch self {
        case .notConnected:
            return "Aucune imprimante connectée."
        case let .timeout(expected, seconds):
            return String(
                format: "Aucune réponse 0x%02X de l'imprimante après %.0f ms. "
                    + "Vérifiez que l'appareil est allumé et à portée.",
                expected, seconds * 1000
            )
        case let .printerReported(error):
            return "L'imprimante a signalé une erreur : \(error.label)."
        case let .printerReportedUnknown(code):
            return String(format: "L'imprimante a signalé une erreur inconnue (0x%02X).", code)
        case let .incompatibleBitmap(reasons):
            return "Image incompatible : " + reasons.joined(separator: " ; ")
        case let .printIncomplete(seconds):
            return String(
                format: "L'impression n'a pas confirmé son achèvement après %.0f s. "
                    + "L'étiquette est peut-être incomplète.",
                seconds
            )
        case let .disconnected(reason):
            return "Imprimante déconnectée : \(reason)"
        }
    }
}

/// Attente d'une notification précise.
///
/// L'enregistrement est immédiat ; la réponse peut être livrée avant que
/// `value()` ne soit appelée, auquel cas elle est conservée. Sans ce tampon,
/// une réponse plus rapide que l'attente serait perdue — et le symptôme serait
/// un délai d'attente inexplicable.
public final class Expectation: @unchecked Sendable {
    public let command: IncomingCommand
    private let lock = NSLock()
    private var pending: CheckedContinuation<Packet, Error>?
    private var settled: Result<Packet, Error>?

    init(command: IncomingCommand) {
        self.command = command
    }

    /// Livre le résultat, une seule fois.
    func settle(_ result: Result<Packet, Error>) {
        lock.lock()
        guard settled == nil else {
            lock.unlock()
            return
        }
        settled = result
        let continuation = pending
        pending = nil
        lock.unlock()
        continuation?.resume(with: result)
    }

    /// Attend le résultat.
    public func value() async throws -> Packet {
        try await withCheckedThrowingContinuation { continuation in
            lock.lock()
            if let settled {
                lock.unlock()
                continuation.resume(with: settled)
            } else {
                pending = continuation
                lock.unlock()
            }
        }
    }
}

/// Transport d'octets vers une imprimante connectée.
///
/// La session n'appelle que ces méthodes. Le groupage des écritures et le
/// rythme sont la responsabilité de l'implémentation : sur Apple, une rafale
/// d'écritures sans réponse sature le tampon de CoreBluetooth, qui ne le
/// signale pas.
public protocol NiimbotLink: AnyObject, Sendable {
    /// Arme une attente **immédiatement**, avant tout envoi.
    ///
    /// - Parameters:
    ///   - command: notification attendue.
    ///   - timeout: délai au-delà duquel l'attente échoue.
    ///   - matching: filtre supplémentaire, pour attendre un statut précis.
    func expect(
        _ command: IncomingCommand,
        timeout: TimeInterval,
        matching: ((Packet) -> Bool)?
    ) -> Expectation

    /// Écrit une trame, en la groupant avec les suivantes si possible.
    func send(_ frame: [UInt8]) async throws

    /// Vide le groupe d'écriture courant.
    ///
    /// Indispensable avant toute attente de réponse : sans lui, une commande
    /// peut rester en tampon et l'imprimante ne jamais la recevoir.
    func flush() async throws

    /// Enregistre un observateur de toutes les trames reçues.
    /// - Returns: une fonction de désinscription.
    @discardableResult
    func onPacket(_ handler: @escaping @Sendable (Packet) -> Void) -> () -> Void
}

public extension NiimbotLink {
    func expect(_ command: IncomingCommand, timeout: TimeInterval) -> Expectation {
        expect(command, timeout: timeout, matching: nil)
    }
}
