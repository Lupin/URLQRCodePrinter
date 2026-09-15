//
//  Frames.swift
//  NiimbotKit
//
//  Constructeurs de trames de haut niveau.
//
//  Ces fonctions sont le pendant Swift de `src/core/printer/packet.js`. Les
//  tests les confrontent aux mêmes trames d'octets documentées, ce qui fait de
//  chaque implémentation une vérification de l'autre.
//

import Foundation

/// Grammaire du dialogue d'impression, qui dépend du modèle.
///
/// Un D110 attend un `setPageSize` de 4 octets ; lui envoyer le format « v4 »
/// de 13 octets le fait répondre une erreur `dataError` **au lieu d'imprimer**.
public enum PrintTaskVariant: Sendable {
    case d110
    case b1
    case v4
}

/// Image monochrome prête à imprimer.
///
/// Une ligne par entrée, 1 bit par pixel, poids fort en premier, 1 = noir.
public struct MonoBitmap: Sendable {
    public let width: Int
    public let height: Int
    public let bytesPerRow: Int
    public let rows: [[UInt8]]

    public init(width: Int, height: Int, bytesPerRow: Int, rows: [[UInt8]]) {
        self.width = width
        self.height = height
        self.bytesPerRow = bytesPerRow
        self.rows = rows
    }

    /// Vérifie la cohérence interne et la compatibilité avec une tête.
    public func validate(printheadPixels: Int, maxHeightPx: Int? = nil) -> [String] {
        var problems: [String] = []
        let expectedStride = (width + 7) / 8

        if width > printheadPixels {
            problems.append(
                "largeur \(width) px supérieure à la tête (\(printheadPixels) px) : "
                + "le surplus serait rogné sans erreur"
            )
        }
        if bytesPerRow != expectedStride {
            problems.append("bytesPerRow incohérent : \(bytesPerRow) au lieu de \(expectedStride)")
        }
        if rows.count != height {
            problems.append("\(rows.count) lignes fournies pour une hauteur de \(height)")
        }
        if rows.contains(where: { $0.count != bytesPerRow }) {
            problems.append("au moins une ligne n'a pas la longueur annoncée")
        }
        if let maxHeightPx, height > maxHeightPx {
            problems.append("hauteur \(height) px supérieure au maximum (\(maxHeightPx) px)")
        }
        return problems
    }
}

// MARK: - Réglages

public func setDensityFrame(_ density: UInt8) -> [UInt8] {
    buildPacket(Command.setDensity.rawValue, [density])
}

public func setLabelTypeFrame(_ type: LabelType) -> [UInt8] {
    buildPacket(Command.setLabelType.rawValue, [type.rawValue])
}

/// `printStart`. Le D110 n'accepte **qu'un seul octet** et ne peut donc pas
/// déclarer de travail multi-pages ; les autres modèles reçoivent la variante
/// adaptée.
public func printStartFrame(
    _ variant: PrintTaskVariant,
    pages: UInt16 = 1,
    pageColor: UInt8 = 0,
    speed: UInt8 = 1
) -> [UInt8] {
    switch variant {
    case .b1:
        return buildPacket(
            Command.printStart.rawValue,
            uint16BE(pages) + [0, 0, 0, 0, pageColor]
        )
    case .v4:
        return buildPacket(
            Command.printStart.rawValue,
            uint16BE(pages) + [0, 0, 0, 0, pageColor, speed, 0]
        )
    case .d110:
        return buildPacket(Command.printStart.rawValue, [0x01])
    }
}

/// `setPageSize`.
///
/// `cols` est la largeur de la **tête**, pas celle de l'étiquette : 96 pour un
/// D110, même avec une étiquette de 15 mm. L'imprimante rogne au-delà sans
/// renvoyer d'erreur.
public func setPageSizeFrame(
    _ variant: PrintTaskVariant,
    rows: UInt16,
    cols: UInt16,
    copies: UInt16 = 1
) -> [UInt8] {
    switch variant {
    case .b1:
        return buildPacket(
            Command.setPageSize.rawValue,
            uint16BE(rows) + uint16BE(cols) + uint16BE(copies)
        )
    case .v4:
        return buildPacket(
            Command.setPageSize.rawValue,
            uint16BE(rows) + uint16BE(cols) + uint16BE(copies) + [0, 0, 0, 0, 0, 0, 0]
        )
    case .d110:
        return buildPacket(Command.setPageSize.rawValue, uint16BE(rows) + uint16BE(cols))
    }
}

public func printQuantityFrame(_ quantity: UInt16) -> [UInt8] {
    buildPacket(Command.printQuantity.rawValue, uint16BE(quantity))
}

public func printClearFrame() -> [UInt8] { buildPacket(Command.printClear.rawValue, [0x01]) }
public func pageStartFrame() -> [UInt8] { buildPacket(Command.pageStart.rawValue, [0x01]) }
public func pageEndFrame() -> [UInt8] { buildPacket(Command.pageEnd.rawValue, [0x01]) }
public func printEndFrame() -> [UInt8] { buildPacket(Command.printEnd.rawValue, [0x01]) }
public func printStatusFrame() -> [UInt8] { buildPacket(Command.printStatus.rawValue, [0x01]) }
public func printerStatusDataFrame() -> [UInt8] {
    buildPacket(Command.printerStatusData.rawValue, [0x01])
}
public func printerInfoFrame(_ sub: UInt8 = 0x08) -> [UInt8] {
    buildPacket(Command.printerInfo.rawValue, [sub])
}
public func heartbeatFrame() -> [UInt8] { buildPacket(Command.heartbeat.rawValue, [0x04]) }

// MARK: - Lignes bitmap

/// Trame de ligne bitmap.
///
/// - Parameters:
///   - run: nombre de lignes couvertes par cette trame (1 = une seule).
///   - counts: triplet de comptage des pixels noirs. `00 00 00` est accepté par
///     tous les modèles connus et c'est la valeur par défaut.
public func printBitmapRowFrame(
    row: UInt16,
    bitmap: [UInt8],
    counts: [UInt8] = [0, 0, 0],
    run: UInt8 = 1
) -> [UInt8] {
    let safeCounts = counts.count == 3 ? counts : [0, 0, 0]
    let payload = uint16BE(row) + safeCounts + [max(1, run)] + bitmap
    return buildPacket(Command.printBitmapRow.rawValue, payload)
}

/// Trame de ligne vide — n'embarque aucun octet de pixels, ce qui allège
/// fortement les marges blanches d'une étiquette.
public func printEmptyRowFrame(row: UInt16, run: UInt8 = 1) -> [UInt8] {
    buildPacket(Command.printEmptyRow.rawValue, uint16BE(row) + [max(1, run)])
}

/// Une ligne compactée : soit des pixels, soit un blanc implicite.
public struct RowFrame: Equatable, Sendable {
    public let row: Int
    public let run: Int
    /// `nil` pour une ligne entièrement blanche.
    public let bytes: [UInt8]?
}

/// Répétition maximale d'une ligne dans une trame, valeur pratique constatée.
public let maxRowRun = 200

/// Compacte les lignes identiques consécutives.
///
/// Une ligne entièrement blanche devient une trame « ligne vide », qui ne
/// transporte aucun octet : c'est ce qui divise le trafic Bluetooth par trois à
/// cinq sur une étiquette réelle.
public func prepareRows(_ bitmap: MonoBitmap, maxRun: Int = maxRowRun) -> [RowFrame] {
    let limit = max(1, min(255, maxRun))
    var frames: [RowFrame] = []
    var index = 0

    let isBlank = { (row: [UInt8]) in row.allSatisfy { $0 == 0 } }

    while index < bitmap.rows.count {
        var run = 1
        while run < limit,
              index + run < bitmap.rows.count,
              bitmap.rows[index + run] == bitmap.rows[index] {
            run += 1
        }
        frames.append(
            RowFrame(
                row: index,
                run: run,
                bytes: isBlank(bitmap.rows[index]) ? nil : bitmap.rows[index]
            )
        )
        index += run
    }

    return frames
}

/// Traduit un bitmap en trames prêtes à être écrites.
public func bitmapFrames(_ bitmap: MonoBitmap, maxRun: Int = maxRowRun) -> [[UInt8]] {
    prepareRows(bitmap, maxRun: maxRun).map { frame in
        if let bytes = frame.bytes {
            return printBitmapRowFrame(row: UInt16(frame.row), bitmap: bytes, run: UInt8(frame.run))
        }
        return printEmptyRowFrame(row: UInt16(frame.row), run: UInt8(frame.run))
    }
}

// MARK: - Interprétation des notifications

/// État d'avancement rapporté par la notification `printStatus`.
public struct PrintStatus: Equatable, Sendable {
    public let page: UInt16
    public let printProgress: UInt8
    public let feedProgress: UInt8
    public let error: UInt8

    /// Interprète une charge utile.
    ///
    /// On lit par longueur et non par offset fixe : la taille varie selon les
    /// modèles (10 octets sur M2-H, 11 sur B1 Pro).
    public init(data: [UInt8]) {
        page = data.count >= 2 ? UInt16(data[0]) << 8 | UInt16(data[1]) : 0
        printProgress = data.count >= 3 ? data[2] : 0
        feedProgress = data.count >= 4 ? data[3] : 0
        error = data.count >= 10 ? data[9] : 0
    }
}

/// Identité de l'imprimante, lue via `printerInfo`.
public struct PrinterIdentity: Equatable, Sendable {
    public let modelID: Int

    /// Un firmware renvoie deux octets, un autre un seul ; un octet seul vaut
    /// `octet << 8`, convention reprise de niimbluelib.
    public init(data: [UInt8]) {
        if data.count >= 2 {
            modelID = Int(data[0]) << 8 | Int(data[1])
        } else if data.count == 1 {
            modelID = Int(data[0]) << 8
        } else {
            modelID = 0
        }
    }
}
