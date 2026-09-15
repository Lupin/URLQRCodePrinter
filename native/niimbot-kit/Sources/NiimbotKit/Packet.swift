//
//  Packet.swift
//  NiimbotKit
//
//  Encodage et décodage des trames du protocole Niimbot.
//
//  Trame standard :
//
//    0x55 0x55 │ CMD │ LEN │ DATA[0..LEN-1] │ XOR │ 0xAA 0xAA
//
//  Le checksum est le OU exclusif de CMD, LEN et de tous les octets de DATA.
//  L'en-tête et le pied de trame n'y participent pas.
//
//  Le flux reçu n'est pas aligné sur les trames : plusieurs peuvent arriver
//  collées dans une notification, et une trame peut être coupée entre deux
//  notifications. `PacketStreamDecoder` tamponne et resynchronise sur
//  l'en-tête — c'est le point que ratent la plupart des implémentations.
//
//  Références : MultiMote/niimbluelib, iscarelli/niimbot-web-bluetooth
//  (pilote validé sur D110 et M2-H), printers.niim.blue/interfacing/proto/.
//

import Foundation

/// Octets d'en-tête et de pied de trame.
public let packetHead: [UInt8] = [0x55, 0x55]
public let packetTail: [UInt8] = [0xAA, 0xAA]

/// Préfixe ajouté uniquement à la commande de connexion.
public let connectPrefix: UInt8 = 0x03

/// Commandes envoyées à l'imprimante.
public enum Command: UInt8, Sendable {
    case connect = 0xC1
    case printStart = 0x01
    case pageStart = 0x03
    case pageEnd = 0xE3
    case printEnd = 0xF3
    case printClear = 0x20
    case setDensity = 0x21
    case setLabelType = 0x23
    case setPageSize = 0x13
    case printQuantity = 0x15
    case printBitmapRow = 0x85
    case printEmptyRow = 0x84
    case printerCheckLine = 0x86
    case printStatus = 0xA3
    case printerStatusData = 0xA5
    case printerInfo = 0x40
    case heartbeat = 0xDC
}

/// Notifications reçues de l'imprimante.
public enum IncomingCommand: UInt8, Sendable {
    case connect = 0xC2
    case printStart = 0x02
    case pageStart = 0x04
    case pageEnd = 0xE4
    case printEnd = 0xF4
    case printClear = 0x30
    case setDensity = 0x31
    case setLabelType = 0x33
    case setPageSize = 0x14
    case printQuantity = 0x16
    case printerCheckLine = 0xD3
    case printStatus = 0xB3
    case printerStatusData = 0xB5
    case printerInfo = 0x48
    case heartbeat = 0xD9
    /// Réponse à la sonde de largeur de tête (`heartbeat 0xDC [03]`).
    /// Distincte de `printerInfo` : le code diffère et la charge utile aussi.
    case headInfo = 0xDE
    case printError = 0xDB
    case notSupported = 0x00
}

/// Codes d'erreur transportés par la notification `printError`.
public enum PrintError: UInt8, Sendable {
    case coverOpen = 0x01
    case lackPaper = 0x02
    case lowBattery = 0x03
    case userCancel = 0x05
    case dataError = 0x06
    case overheat = 0x07
    case printerBusy = 0x09
    case noRibbon = 0x0D
    case usedRibbon = 0x0F
    case wrongPaper = 0x10
    case communicationException = 0x16
    case disconnect = 0x17
    case receiveDataTimeout = 0x34

    /// Libellé lisible, pour les messages d'erreur.
    public var label: String {
        switch self {
        case .coverOpen: return "capot ouvert"
        case .lackPaper: return "plus de papier"
        case .lowBattery: return "batterie faible"
        case .userCancel: return "annulé par l'utilisateur"
        case .dataError: return "erreur de données (format de page refusé)"
        case .overheat: return "surchauffe"
        case .printerBusy: return "imprimante occupée"
        case .noRibbon: return "ruban absent"
        case .usedRibbon: return "ruban usagé"
        case .wrongPaper: return "papier incorrect"
        case .communicationException: return "exception de communication"
        case .disconnect: return "déconnexion"
        case .receiveDataTimeout: return "délai de réception dépassé"
        }
    }
}

/// Types d'étiquette acceptés par `setLabelType`.
public enum LabelType: UInt8, Sendable {
    case withGaps = 1
    case blackMark = 2
    case continuous = 3
    case perforated = 4
    case transparent = 5
    case pvcTag = 6
    case blackMarkGap = 10
    case heatShrinkTube = 11
}

/// Trame décodée.
public struct Packet: Equatable, Sendable {
    public let command: UInt8
    public let data: [UInt8]

    public init(command: UInt8, data: [UInt8]) {
        self.command = command
        self.data = data
    }

    /// Notification typée, si le code est connu.
    public var incoming: IncomingCommand? { IncomingCommand(rawValue: command) }

    /// Première valeur de la charge utile, si elle existe.
    public var firstByte: UInt8? { data.first }

    /// Entier 16 bits gros-boutiste lu à partir de `offset`.
    public func uint16(at offset: Int) -> UInt16? {
        guard offset >= 0, offset + 1 < data.count else { return nil }
        return UInt16(data[offset]) << 8 | UInt16(data[offset + 1])
    }
}

/// Calcule le checksum d'une trame.
public func checksum(command: UInt8, data: [UInt8]) -> UInt8 {
    var value = command ^ UInt8(truncatingIfNeeded: data.count)
    for byte in data { value ^= byte }
    return value
}

/// Encode un entier non signé sur 16 bits, gros-boutiste.
public func uint16BE(_ value: UInt16) -> [UInt8] {
    [UInt8(value >> 8), UInt8(value & 0xFF)]
}

/// Construit une trame complète.
///
/// - Parameter prefix: ajoute l'octet `0x03`, réservé à la commande de connexion.
public func buildPacket(_ command: UInt8, _ data: [UInt8] = [], prefix: Bool = false) -> [UInt8] {
    precondition(data.count <= 0xFF, "charge utile de \(data.count) octets, maximum 255")

    var packet: [UInt8] = []
    packet.reserveCapacity(data.count + 7)
    if prefix { packet.append(connectPrefix) }
    packet.append(contentsOf: packetHead)
    packet.append(command)
    packet.append(UInt8(data.count))
    packet.append(contentsOf: data)
    packet.append(checksum(command: command, data: data))
    packet.append(contentsOf: packetTail)
    return packet
}

/// Trame de connexion, la seule à porter le préfixe.
public func buildConnect() -> [UInt8] {
    buildPacket(Command.connect.rawValue, [0x01], prefix: true)
}

/// Décodeur incrémental de flux.
///
/// Absorbe des fragments d'octets et restitue les trames complètes qu'il
/// reconnaît. Les octets parasites sont ignorés jusqu'à retrouver un en-tête
/// cohérent ; un checksum invalide ne fait pas perdre le flux, on repart de
/// l'octet suivant.
public final class PacketStreamDecoder {
    private var buffer: [UInt8] = []

    /// Nombre d'octets écartés, exposé pour le diagnostic.
    public private(set) var rejected = 0

    public init() {}

    /// Vide le tampon, à appeler à la reconnexion.
    public func reset() {
        buffer.removeAll(keepingCapacity: true)
    }

    /// Absorbe des octets et renvoie les trames reconnues.
    public func push(_ bytes: [UInt8]) -> [Packet] {
        buffer.append(contentsOf: bytes)
        var packets: [Packet] = []

        while true {
            guard let start = findHead(from: 0) else {
                // Aucun en-tête : on ne garde que le dernier octet, susceptible
                // d'être le premier 0x55 d'un en-tête coupé.
                if buffer.count > 1 {
                    rejected += buffer.count - 1
                    buffer.removeFirst(buffer.count - 1)
                }
                break
            }

            if start > 0 {
                rejected += start
                buffer.removeFirst(start)
            }

            switch parse(at: 0) {
            case .success(let packet, let total):
                packets.append(packet)
                buffer.removeFirst(total)

            case .invalid:
                rejected += 1
                buffer.removeFirst(min(2, buffer.count))

            case .incomplete:
                // Avant d'attendre la suite, écarter le cas d'un 0x55 parasite :
                // si une trame complète et valide commence plus loin, l'en-tête
                // repéré n'en était pas un. Sans ce contrôle, un seul octet
                // 0x55 isolé bloquerait le décodeur indéfiniment.
                if let alternative = findNextCompleteFrame(from: 1) {
                    rejected += alternative
                    buffer.removeFirst(alternative)
                    continue
                }
                return packets
            }
        }

        return packets
    }

    private enum ParseResult {
        case success(Packet, Int)
        case incomplete
        case invalid
    }

    private func parse(at index: Int) -> ParseResult {
        guard buffer.count >= index + 4 else { return .incomplete }

        let length = Int(buffer[index + 3])
        let total = 4 + length + 1 + 2
        guard buffer.count >= index + total else { return .incomplete }

        let command = buffer[index + 2]
        let data = Array(buffer[(index + 4)..<(index + 4 + length)])
        let declared = buffer[index + 4 + length]
        let tailOK = buffer[index + 5 + length] == packetTail[0]
            && buffer[index + 6 + length] == packetTail[1]

        guard declared == checksum(command: command, data: data), tailOK else { return .invalid }
        return .success(Packet(command: command, data: data), total)
    }

    private func findHead(from index: Int) -> Int? {
        var i = index
        while i + 1 < buffer.count {
            if buffer[i] == packetHead[0] && buffer[i + 1] == packetHead[1] { return i }
            i += 1
        }
        return nil
    }

    private func findNextCompleteFrame(from index: Int) -> Int? {
        var i = index
        while i + 1 < buffer.count {
            if buffer[i] == packetHead[0] && buffer[i + 1] == packetHead[1] {
                if case .success = parse(at: i) { return i }
            }
            i += 1
        }
        return nil
    }
}
