//
//  LabelComposerTests.swift
//  NiimbotKitTests
//
//  Une étiquette mal composée ne produit pas d'erreur : elle sort blanche, ou
//  avec un QR illisible. Ces tests vérifient donc les propriétés qui comptent
//  à l'impression, pas seulement que le code s'exécute.
//

import XCTest
@testable import NiimbotKit

final class LabelComposerTests: XCTestCase {

    private func link(_ url: String, title: String = "") -> StoredLink {
        StoredLink(url: url, title: title)
    }

    // MARK: - Géométrie

    func testQrSizeIsAWholeNumberOfModules() throws {
        let matrix = try qrMatrix(for: "https://example.com", border: 2)
        let geometry = LabelComposer.computeGeometry(
            text: "https://example.com",
            widthPx: 96,
            qrModules: matrix.size
        )
        XCTAssertEqual(geometry.qrSize % matrix.size, 0)
        XCTAssertEqual(geometry.qrScale, geometry.qrSize / matrix.size)
    }

    func testGeometryFitsWithinThePrinthead() throws {
        let matrix = try qrMatrix(for: "https://example.com", border: 2)
        let geometry = LabelComposer.computeGeometry(
            text: "https://example.com",
            widthPx: 96,
            qrModules: matrix.size
        )
        XCTAssertTrue(geometry.fits)
        XCTAssertLessThanOrEqual(geometry.qrSize, 96)
    }

    /// Régression : une URL longue faisait tomber l'échelle à 1 px par module,
    /// ce qui produisait un QR illisible à l'impression thermique.
    func testScaleNeverDropsBelowTheMinimum() throws {
        let long = "https://example.com/" + String(repeating: "tres-long-segment/", count: 10)
        let matrix = try qrMatrix(for: long, border: 2)
        let geometry = LabelComposer.computeGeometry(
            text: long,
            widthPx: 96,
            qrModules: matrix.size
        )
        XCTAssertGreaterThanOrEqual(geometry.qrScale, minimumQrScale)
        XCTAssertGreaterThanOrEqual(geometry.pxPerModule, Double(minimumQrScale))
    }

    func testOverlongUrlIsFlaggedRatherThanSilentlyCropped() throws {
        let huge = "https://example.com/" + String(repeating: "x", count: 600)
        let matrix = try qrMatrix(for: huge, border: 2)
        let geometry = LabelComposer.computeGeometry(
            text: huge,
            widthPx: 96,
            qrModules: matrix.size
        )
        XCTAssertFalse(geometry.fits)
        XCTAssertFalse(LabelComposer.checkLegibility(geometry).ok)
    }

    func testShortUrlProducesALargeQr() throws {
        let matrix = try qrMatrix(for: "https://a.co", border: 2)
        let geometry = LabelComposer.computeGeometry(
            text: "https://a.co",
            widthPx: 96,
            qrModules: matrix.size
        )
        XCTAssertGreaterThan(geometry.qrSize, 48, "le QR doit occuper l'étiquette")
    }

    func testHeightGrowsWithTextLines() throws {
        let matrix = try qrMatrix(for: "https://example.com", border: 2)
        let short = LabelComposer.computeGeometry(
            text: "https://a.co", widthPx: 96, qrModules: matrix.size, maxLines: 4
        )
        let long = LabelComposer.computeGeometry(
            text: "https://example.com/un/chemin/assez/long/pour/tenir/sur/plusieurs/lignes",
            widthPx: 96,
            qrModules: matrix.size,
            maxLines: 4
        )
        XCTAssertGreaterThanOrEqual(long.lines.count, short.lines.count)
        XCTAssertGreaterThanOrEqual(long.height, short.height)
    }

    func testLegibilityAcceptsAWellSizedQr() throws {
        let matrix = try qrMatrix(for: "https://a.co", border: 2)
        let geometry = LabelComposer.computeGeometry(
            text: "https://a.co", widthPx: 96, qrModules: matrix.size
        )
        XCTAssertTrue(LabelComposer.checkLegibility(geometry).ok)
    }

    // MARK: - Découpe du texte

    func testWrapSplitsOnSpaces() {
        let lines = LabelComposer.wrap(
            text: "aaa bbb ccc", maxWidth: 1000, fontSize: 10, maxLines: 8
        )
        XCTAssertEqual(lines, ["aaa bbb ccc"])
    }

    func testWrapSplitsLongUrlWithoutSpaces() {
        let lines = LabelComposer.wrap(
            text: "https://example.com/un/chemin/tres/long/a/imprimer",
            maxWidth: 60,
            fontSize: 10,
            maxLines: 8
        )
        XCTAssertGreaterThan(lines.count, 1)
    }

    func testWrapRespectsMaxLines() {
        let lines = LabelComposer.wrap(
            text: String(repeating: "a", count: 200), maxWidth: 30, fontSize: 10, maxLines: 2
        )
        XCTAssertEqual(lines.count, 2)
    }

    func testWrapLosesNoSignificantCharacter() {
        let text = "https://example.com/actualites/2025/01/15/article"
        let lines = LabelComposer.wrap(text: text, maxWidth: 80, fontSize: 10, maxLines: 20)
        let rejoined = lines.joined().filter { !$0.isWhitespace }
        XCTAssertEqual(rejoined, text.filter { !$0.isWhitespace })
    }

    func testWrapHandlesEmptyText() {
        XCTAssertTrue(LabelComposer.wrap(text: "", maxWidth: 60, fontSize: 10, maxLines: 4).isEmpty)
    }

    // MARK: - Composition

    func testComposeProducesABitmapAtPrintheadWidth() throws {
        let bitmap = try LabelComposer.compose(
            link: link("https://example.com/article"),
            profile: d110Profile
        )
        XCTAssertEqual(bitmap.width, 96)
        XCTAssertGreaterThan(bitmap.height, 0)
        XCTAssertEqual(bitmap.bytesPerRow, 12)
        XCTAssertEqual(bitmap.rows.count, bitmap.height)
    }

    func testComposedLabelPassesValidation() throws {
        let bitmap = try LabelComposer.compose(
            link: link("https://example.com/article"),
            profile: d110Profile
        )
        XCTAssertEqual(
            bitmap.validate(printheadPixels: d110Profile.printheadPixels),
            []
        )
    }

    func testComposedLabelContainsInk() throws {
        let bitmap = try LabelComposer.compose(
            link: link("https://example.com/article"),
            profile: d110Profile
        )
        let inked = bitmap.rows.reduce(0) { total, row in
            total + row.reduce(0) { $0 + $1.nonzeroBitCount }
        }
        XCTAssertGreaterThan(inked, 50, "l'étiquette semble vide")
    }

    func testComposedLabelIsNotEntirelyBlack() throws {
        let bitmap = try LabelComposer.compose(
            link: link("https://example.com/article"),
            profile: d110Profile
        )
        let pixels = bitmap.rows.reduce(0) { $0 + $1.count * 8 }
        let inked = bitmap.rows.reduce(0) { total, row in
            total + row.reduce(0) { $0 + $1.nonzeroBitCount }
        }
        XCTAssertLessThan(inked, pixels * 3 / 4, "l'étiquette est presque entièrement noire")
    }

    /// Le QR commence exactement après la marge haute et sa zone de silence.
    ///
    /// L'assertion précédente cherchait de l'encre dans les dix premières
    /// lignes, ce qui était faux par construction : les deux modules de blanc
    /// qui entourent le code — sans lesquels un lecteur n'accroche rien —
    /// occupent précisément cette bande. On vérifie donc la position, pas la
    /// simple présence d'encre.
    func testQrCodeStartsUnderTheTopMargin() throws {
        let url = "https://a.co"
        let bitmap = try LabelComposer.compose(link: link(url), profile: d110Profile)
        let matrix = try qrMatrix(for: url, correctionLevel: .medium, border: 2)
        let geometry = LabelComposer.computeGeometry(
            text: url,
            widthPx: d110Profile.printheadPixels,
            qrModules: matrix.size
        )

        let firstInked = bitmap.rows.firstIndex { row in row.contains { $0 != 0 } }
        XCTAssertEqual(firstInked, geometry.padding + 2 * geometry.qrScale)
    }

    /// Régression : le titre était dessiné par-dessus la première ligne d'URL,
    /// et la dernière ligne d'URL sortait du bas de l'image.
    func testTitleGetsItsOwnLineAndNothingIsClipped() throws {
        let url = "https://example.com/a"
        let matrix = try qrMatrix(for: url, correctionLevel: .medium, border: 2)
        let withoutTitle = try LabelComposer.compose(link: link(url), profile: d110Profile)
        let withTitle = try LabelComposer.compose(
            link: link(url, title: "Un titre"),
            profile: d110Profile,
            showTitle: true
        )
        let geometry = LabelComposer.computeGeometry(
            text: url,
            widthPx: d110Profile.printheadPixels,
            qrModules: matrix.size,
            reservedLines: 1
        )

        // Une ligne de plus, exactement.
        XCTAssertEqual(withTitle.height, withoutTitle.height + geometry.lineHeight)
        XCTAssertEqual(geometry.reservedLines, 1)

        // Et le texte reste entièrement dans l'image.
        let textBottom = geometry.textTop
            + (geometry.lines.count + geometry.reservedLines) * geometry.lineHeight
        XCTAssertLessThanOrEqual(textBottom, withTitle.height)
    }

    /// Le titre ne doit pas chasser l'URL : le plafond de lignes porte sur le total.
    func testTitleCountsTowardsTheLineBudget() throws {
        let url = "https://example.com/" + String(repeating: "segment/", count: 12)
        let matrix = try qrMatrix(for: url, correctionLevel: .medium, border: 2)
        let withoutTitle = LabelComposer.computeGeometry(
            text: url, widthPx: d110Profile.printheadPixels, qrModules: matrix.size, maxLines: 4
        )
        let withTitle = LabelComposer.computeGeometry(
            text: url, widthPx: d110Profile.printheadPixels, qrModules: matrix.size,
            maxLines: 4, reservedLines: 1
        )

        XCTAssertEqual(withoutTitle.lines.count, 4)
        XCTAssertEqual(withTitle.lines.count, 3)
        XCTAssertEqual(
            withTitle.lines.count + withTitle.reservedLines,
            withoutTitle.lines.count,
            "le nombre total de lignes ne doit pas augmenter"
        )
    }

    func testCompositionIsDeterministic() throws {
        let first = try LabelComposer.compose(link: link("https://example.com/a"), profile: d110Profile)
        let second = try LabelComposer.compose(link: link("https://example.com/a"), profile: d110Profile)
        XCTAssertEqual(first.rows, second.rows)
    }

    func testShowTitleChangesTheRenderedLabel() throws {
        let withoutTitle = try LabelComposer.compose(
            link: link("https://example.com/a"), profile: d110Profile
        )
        let withTitle = try LabelComposer.compose(
            link: link("https://example.com/a", title: "Un titre"),
            profile: d110Profile,
            showTitle: true
        )
        XCTAssertNotEqual(withoutTitle.height, withTitle.height)
    }

    func testM2ProfileProducesAWiderLabel() throws {
        let bitmap = try LabelComposer.compose(
            link: link("https://example.com/a"),
            profile: m2Profile
        )
        XCTAssertEqual(bitmap.width, 576)
        XCTAssertEqual(bitmap.bytesPerRow, 72)
    }
}
