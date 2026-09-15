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

    func testTopRowsContainTheQrCode() throws {
        let bitmap = try LabelComposer.compose(
            link: link("https://a.co"),
            profile: d110Profile
        )
        // Les premières lignes de l'étiquette portent le QR : elles doivent
        // contenir de l'encre.
        let topInked = bitmap.rows.prefix(10).reduce(0) { total, row in
            total + row.reduce(0) { $0 + $1.nonzeroBitCount }
        }
        XCTAssertGreaterThan(topInked, 0)
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
