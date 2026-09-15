//
//  LabelComposer.swift
//  NiimbotKit
//
//  Composition d'une étiquette : un QR code et une URL lisible.
//
//  Pendant Swift de `src/core/label.js`, avec les mêmes règles : la hauteur
//  découle du nombre de lignes de texte, le QR reste sur un nombre entier de
//  pixels par module, et une échelle minimale empêche de produire un code
//  illisible. Le rendu passe par CoreGraphics et CoreText, disponibles à
//  l'identique sur macOS et iOS.
//

import Foundation
import CoreGraphics
import CoreText

/// Géométrie d'une étiquette, en pixels.
public struct LabelGeometry: Sendable, Equatable {
    public let width: Int
    public let height: Int
    public let padding: Int
    public let qrSize: Int
    public let qrScale: Int
    public let pxPerModule: Double
    /// `false` si le QR ne tient pas dans la largeur utile.
    public let fits: Bool
    public let lines: [String]
    public let fontSize: Int
    public let lineHeight: Int
    public let textTop: Int
}

/// Échelle minimale : sous 2 px par module, la tête thermique fusionne les points.
public let minimumQrScale = 2

/// Compose une étiquette et renvoie un bitmap prêt à imprimer.
public enum LabelComposer {

    /// Assemble l'étiquette d'un lien pour un profil d'imprimante.
    ///
    /// - Parameters:
    ///   - link: lien dont l'URL est encodée.
    ///   - profile: profil qui fixe la largeur de tête et la résolution.
    ///   - showTitle: ajoute le titre au-dessus de l'URL.
    ///   - correctionLevel: niveau de correction d'erreur du QR.
    /// - Returns: un bitmap monochrome à la largeur exacte de la tête.
    public static func compose(
        link: StoredLink,
        profile: PrinterProfile,
        showTitle: Bool = false,
        correctionLevel: QrCorrectionLevel = .medium,
        maxLines: Int = 4
    ) throws -> MonoBitmap {
        let matrix = try qrMatrix(for: link.url, correctionLevel: correctionLevel, border: 2)
        let geometry = computeGeometry(
            text: link.url,
            widthPx: profile.printheadPixels,
            qrModules: matrix.size,
            maxLines: maxLines
        )
        return try render(
            link: link,
            geometry: geometry,
            matrix: matrix,
            showTitle: showTitle
        )
    }

    /// Calcule la géométrie d'une étiquette.
    ///
    /// La hauteur n'est jamais fixée à l'avance : elle découle du nombre de
    /// lignes nécessaires. Cela évite de rogner une URL longue ou, à l'inverse,
    /// de gaspiller une étiquette sur une URL courte.
    public static func computeGeometry(
        text: String,
        widthPx: Int,
        qrModules: Int,
        fontSize: Int? = nil,
        padding: Int? = nil,
        qrRatio: Double = 0.95,
        minScale: Int = minimumQrScale,
        lineSpacing: Double = 1.15,
        maxLines: Int = 4
    ) -> LabelGeometry {
        let width = max(1, widthPx)
        let resolvedPadding = max(0, padding ?? Int((Double(width) * 0.06).rounded()))
        let resolvedFontSize = max(6, fontSize ?? Int((Double(width) * 0.085).rounded()))
        let lineHeight = max(1, Int((Double(resolvedFontSize) * lineSpacing).rounded(.up)))
        let ratio = min(1, max(0.3, qrRatio))

        let innerWidth = max(1, width - resolvedPadding * 2)
        let qrTarget = Int(Double(innerWidth) * ratio)

        let lines = wrap(
            text: text,
            maxWidth: innerWidth,
            fontSize: resolvedFontSize,
            maxLines: maxLines
        )

        // Le QR a une taille entière en modules : on arrondit au multiple
        // inférieur. Une échelle minimale est imposée, sans quoi une URL longue
        // produirait un code à 1 px par module, illisible une fois imprimé.
        let scale = max(minScale, max(1, qrTarget / max(1, qrModules)))
        let qrSize = qrModules * scale
        let fits = qrSize <= innerWidth

        let textHeight = lines.count * lineHeight
        let height = qrSize + resolvedPadding * 2 + (lines.isEmpty ? 0 : resolvedPadding + textHeight)

        return LabelGeometry(
            width: width,
            height: max(1, height),
            padding: resolvedPadding,
            qrSize: qrSize,
            qrScale: scale,
            pxPerModule: Double(qrSize) / Double(max(1, qrModules)),
            fits: fits,
            lines: lines,
            fontSize: resolvedFontSize,
            lineHeight: lineHeight,
            textTop: resolvedPadding + qrSize + resolvedPadding
        )
    }

    /// Vérifie qu'un QR restera imprimable et lisible.
    public static func checkLegibility(_ geometry: LabelGeometry) -> (ok: Bool, reason: String?) {
        if !geometry.fits {
            return (
                false,
                "URL trop longue : le QR fait \(geometry.qrSize) px pour \(geometry.width) px de large. "
                + "Raccourcissez l'URL ou utilisez une étiquette plus large."
            )
        }
        if geometry.pxPerModule < Double(minimumQrScale) {
            return (
                false,
                String(
                    format: "QR trop dense : %.2f px par module (minimum %d).",
                    geometry.pxPerModule, minimumQrScale
                )
            )
        }
        return (true, nil)
    }

    // MARK: - Rendu

    /// Dessine l'étiquette et convertit le résultat en bitmap monochrome.
    static func render(
        link: StoredLink,
        geometry: LabelGeometry,
        matrix: QrMatrix,
        showTitle: Bool
    ) throws -> MonoBitmap {
        let width = geometry.width
        let height = geometry.height
        let bytesPerRow = (width + 7) / 8

        guard let context = CGContext(
            data: nil,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: width,
            space: CGColorSpaceCreateDeviceGray(),
            bitmapInfo: CGImageAlphaInfo.none.rawValue
        ) else {
            throw QrCodeError.renderFailed
        }

        // Fond blanc.
        context.setFillColor(gray: 1, alpha: 1)
        context.fill(CGRect(x: 0, y: 0, width: width, height: height))

        // Origine en haut à gauche : les calculs de mise en page se font dans
        // le même repère que côté JavaScript.
        context.translateBy(x: 0, y: CGFloat(height))
        context.scaleBy(x: 1, y: -1)
        // Le texte doit être redressé après cette bascule.
        context.textMatrix = CGAffineTransform(scaleX: 1, y: -1)

        // QR code : un rectangle par module, sans lissage.
        context.setFillColor(gray: 0, alpha: 1)
        let originX = (width - geometry.qrSize) / 2
        let scale = geometry.qrScale
        for y in 0..<matrix.size {
            for x in 0..<matrix.size where matrix.modules[y][x] {
                context.fill(
                    CGRect(
                        x: originX + x * scale,
                        y: geometry.padding + y * scale,
                        width: scale,
                        height: scale
                    )
                )
            }
        }

        // Texte.
        let font = systemFont(size: CGFloat(geometry.fontSize))
        var lines = geometry.lines
        if showTitle, !link.title.isEmpty {
            lines.insert(link.title, at: 0)
        }

        for (index, line) in lines.enumerated() {
            let y = geometry.textTop + index * geometry.lineHeight
            // Une ligne de titre est mise en gras.
            let isTitle = showTitle && index == 0 && !link.title.isEmpty
            drawCentered(
                text: line,
                in: context,
                width: width,
                top: y,
                lineHeight: geometry.lineHeight,
                font: isTitle ? boldFont(size: CGFloat(geometry.fontSize)) : font
            )
        }

        guard let data = context.data else { throw QrCodeError.renderFailed }
        let pixels = data.bindMemory(to: UInt8.self, capacity: width * height)

        return monoBitmap(
            from: pixels,
            width: width,
            height: height,
            bytesPerRow: bytesPerRow,
            threshold: 128
        )
    }

    /// Convertit des pixels en niveaux de gris en bitmap 1 bit par pixel.
    ///
    /// 1 = noir, poids fort en premier, chaque ligne complétée à l'octet —
    /// exactement ce qu'attend la tête thermique.
    static func monoBitmap(
        from pixels: UnsafePointer<UInt8>,
        width: Int,
        height: Int,
        bytesPerRow: Int,
        threshold: UInt8
    ) -> MonoBitmap {
        var rows: [[UInt8]] = []
        rows.reserveCapacity(height)

        for y in 0..<height {
            var row = [UInt8](repeating: 0, count: bytesPerRow)
            for x in 0..<width where pixels[y * width + x] < threshold {
                row[x >> 3] |= 0x80 >> UInt8(x & 7)
            }
            rows.append(row)
        }

        return MonoBitmap(width: width, height: height, bytesPerRow: bytesPerRow, rows: rows)
    }

    // MARK: - Texte

    /// Découpe un texte en lignes tenant dans une largeur donnée.
    ///
    /// Le découpage se fait sur les espaces, mais aussi après « / », « - » et
    /// « . » car les URL n'ont souvent pas d'espace. Un mot plus long que la
    /// largeur disponible est coupé caractère par caractère.
    static func wrap(text: String, maxWidth: Int, fontSize: Int, maxLines: Int) -> [String] {
        guard !text.isEmpty else { return [] }
        if maxWidth <= 0 { return [text] }

        let font = systemFont(size: CGFloat(fontSize))
        func width(_ value: String) -> Int {
            Int(measure(value, font: font).rounded(.up))
        }

        var lines: [String] = []
        var current = ""

        // Les séparateurs restent attachés au fragment précédent.
        let tokens = tokenize(text)

        for token in tokens {
            let candidate = (current + token).trimmingCharacters(in: .whitespaces)
            if width(candidate) <= maxWidth {
                current += token
                continue
            }
            let trimmed = current.trimmingCharacters(in: .whitespaces)
            if !trimmed.isEmpty {
                lines.append(trimmed)
                if lines.count >= maxLines { return lines }
                current = ""
            }

            let word = token.trimmingCharacters(in: .whitespaces)
            if word.isEmpty { continue }

            if width(word) <= maxWidth {
                current = word + (token.hasSuffix(" ") ? " " : "")
            } else {
                var chunk = ""
                var pieces: [String] = []
                for character in word {
                    let candidateChunk = chunk + String(character)
                    if width(candidateChunk) > maxWidth && !chunk.isEmpty {
                        pieces.append(chunk)
                        chunk = String(character)
                    } else {
                        chunk = candidateChunk
                    }
                }
                if !chunk.isEmpty { pieces.append(chunk) }
                for piece in pieces.dropLast() {
                    lines.append(piece)
                    if lines.count >= maxLines { return lines }
                }
                current = pieces.last ?? ""
            }
        }

        let trailing = current.trimmingCharacters(in: .whitespaces)
        if !trailing.isEmpty, lines.count < maxLines { lines.append(trailing) }
        return lines
    }

    /// Découpe en conservant les séparateurs, comme le fait la version JavaScript.
    private static func tokenize(_ text: String) -> [String] {
        var tokens: [String] = []
        var current = ""
        let separators = Set<Character>(["/", "-", ".", " "])

        for character in text {
            current.append(character)
            if separators.contains(character) {
                tokens.append(current)
                current = ""
            }
        }
        if !current.isEmpty { tokens.append(current) }
        return tokens
    }

    /// Dessine une ligne centrée horizontalement.
    private static func drawCentered(
        text: String,
        in context: CGContext,
        width: Int,
        top: Int,
        lineHeight: Int,
        font: CTFont
    ) {
        guard !text.isEmpty else { return }
        let attributed = attributedString(text, font: font)
        let line = CTLineCreateWithAttributedString(attributed)
        let bounds = CTLineGetBoundsWithOptions(line, .useOpticalBounds)

        let x = (CGFloat(width) - bounds.width) / 2 - bounds.minX
        // La ligne est centrée verticalement dans sa case.
        let y = CGFloat(top) + (CGFloat(lineHeight) - bounds.height) / 2 - bounds.minY

        context.textPosition = CGPoint(x: x, y: y)
        CTLineDraw(line, context)
    }

    private static func attributedString(_ text: String, font: CTFont) -> CFAttributedString {
        let attributes: [CFString: Any] = [
            kCTFontAttributeName: font,
            kCTForegroundColorAttributeName: CGColor(gray: 0, alpha: 1),
        ]
        return CFAttributedStringCreate(nil, text as CFString, attributes as CFDictionary)!
    }

    /// Largeur typographique d'un texte.
    static func measure(_ text: String, font: CTFont) -> CGFloat {
        let line = CTLineCreateWithAttributedString(attributedString(text, font: font))
        return CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil))
    }

    /// Police système à la taille demandée.
    static func systemFont(size: CGFloat) -> CTFont {
        CTFontCreateUIFontForLanguage(.system, size, nil)
            ?? CTFontCreateWithName("Helvetica" as CFString, size, nil)
    }

    /// Police système en gras.
    static func boldFont(size: CGFloat) -> CTFont {
        let base = systemFont(size: size)
        let bold = CTFontCreateCopyWithSymbolicTraits(base, size, nil, .traitBold, .traitBold)
        return bold ?? base
    }
}
