//
//  ProfilesTests.swift
//  NiimbotKitTests
//
//  Ces tests verrouillent les deux constats qui invalidaient le prototype
//  d'origine : la tête du D110 fait 96 px (12 mm) et non 120 px (15 mm), et le
//  dialogue d'impression n'est pas le même selon le modèle.
//

import XCTest
@testable import NiimbotKit

final class ProfilesTests: XCTestCase {

    func testD110HeadIs96PixelsNot120() {
        XCTAssertEqual(d110Profile.printheadPixels, 96)
        XCTAssertEqual(d110Profile.dpi, 203)
        // 96 px à 203 dpi = 12 mm : la largeur réellement imprimable.
        XCTAssertEqual(d110Profile.printableWidthMM, 12, accuracy: 0.05)
    }

    func testFifteenMillimetreLabelIsClippedOnD110() {
        let clipped = clippedWidthMM(d110Profile, labelWidthMM: 15)
        XCTAssertEqual(clipped, 3, accuracy: 0.05)
    }

    func testTwelveMillimetreLabelIsNotClipped() {
        XCTAssertEqual(clippedWidthMM(d110Profile, labelWidthMM: 12), 0, accuracy: 0.001)
    }

    func testM2Profile() {
        XCTAssertEqual(m2Profile.printheadPixels, 576)
        XCTAssertEqual(m2Profile.dpi, 300)
        XCTAssertEqual(m2Profile.printTask, .b1)
    }

    func testProfileLookupByModelID() {
        XCTAssertEqual(profile(forModelID: 2304)?.id, "D110")
        XCTAssertEqual(profile(forModelID: 2320)?.id, "D110")
        XCTAssertEqual(profile(forModelID: 4608)?.id, "M2")
        XCTAssertNil(profile(forModelID: 9999))
    }

    func testProfileLookupByName() {
        XCTAssertEqual(profile(forName: "D110-FC06023035")?.id, "D110")
        XCTAssertEqual(profile(forName: "M2_H-H107060027")?.id, "M2")
        XCTAssertNil(profile(forName: "inconnu"))
    }

    func testReportedHeadIsAcceptedWhenPlausible() {
        let patched = NiimbotKit.profile(d110Profile, withReportedHead: 120)
        XCTAssertEqual(patched.printheadPixels, 120)
        XCTAssertEqual(patched.id, "D110", "le reste du profil est conservé")
    }

    func testReportedHeadIgnoresAbsurdValues() {
        XCTAssertEqual(NiimbotKit.profile(d110Profile, withReportedHead: 0).printheadPixels, 96)
        XCTAssertEqual(NiimbotKit.profile(d110Profile, withReportedHead: -5).printheadPixels, 96)
        XCTAssertEqual(NiimbotKit.profile(d110Profile, withReportedHead: 99_999).printheadPixels, 96)
    }

    func testDensityIsClampedToProfileBounds() {
        XCTAssertEqual(d110Profile.clampDensity(99), 3)
        XCTAssertEqual(d110Profile.clampDensity(0), 1)
        XCTAssertEqual(d110Profile.clampDensity(2), 2)
        XCTAssertEqual(m2Profile.clampDensity(5), 5)
    }

    func testMaxPrintHeightInPixels() {
        // 100 mm à 203 dpi ≈ 799 px.
        XCTAssertEqual(d110Profile.maxPrintHeightPx, 799)
    }

    func testNamePrefixesAreUsable() {
        XCTAssertFalse(allNamePrefixes.isEmpty)
        XCTAssertTrue(allNamePrefixes.contains("D110"))
        // Dédoublonnés.
        XCTAssertEqual(allNamePrefixes.count, Set(allNamePrefixes).count)
    }

    // MARK: - Compactage des lignes

    func testPrepareRowsMergesIdenticalRows() {
        let bitmap = MonoBitmap(
            width: 8,
            height: 4,
            bytesPerRow: 1,
            rows: [[0x00], [0xFF], [0xFF], [0x00]]
        )
        let frames = prepareRows(bitmap)

        XCTAssertEqual(frames.count, 3)
        XCTAssertEqual(frames[0], RowFrame(row: 0, run: 1, bytes: nil))
        XCTAssertEqual(frames[1].row, 1)
        XCTAssertEqual(frames[1].run, 2)
        XCTAssertNotNil(frames[1].bytes)
        XCTAssertEqual(frames[2], RowFrame(row: 3, run: 1, bytes: nil))
    }

    func testPrepareRowsClampsRunAndAdvancesRowNumbers() {
        let bitmap = MonoBitmap(
            width: 8,
            height: 500,
            bytesPerRow: 1,
            rows: Array(repeating: [0xFF], count: 500)
        )
        let frames = prepareRows(bitmap, maxRun: 200)

        XCTAssertEqual(frames.map(\.run), [200, 200, 100])
        // Les numéros de ligne avancent du nombre de lignes couvertes.
        XCTAssertEqual(frames.map(\.row), [0, 200, 400])
    }

    func testBitmapFramesUsesEmptyRowForBlankLines() {
        let bitmap = MonoBitmap(width: 8, height: 2, bytesPerRow: 1, rows: [[0x00], [0xFF]])
        let frames = bitmapFrames(bitmap)

        XCTAssertEqual(frames.count, 2)
        XCTAssertEqual(frames[0][2], Command.printEmptyRow.rawValue)
        XCTAssertEqual(frames[1][2], Command.printBitmapRow.rawValue)
    }

    func testBitmapValidation() {
        let valid = MonoBitmap(width: 96, height: 2, bytesPerRow: 12, rows: [[UInt8](repeating: 0, count: 12), [UInt8](repeating: 0, count: 12)])
        XCTAssertTrue(valid.validate(printheadPixels: 96).isEmpty)

        let tooWide = MonoBitmap(width: 120, height: 1, bytesPerRow: 15, rows: [[UInt8](repeating: 0, count: 15)])
        let problems = tooWide.validate(printheadPixels: 96)
        XCTAssertEqual(problems.count, 1)
        XCTAssertTrue(problems[0].contains("rogné"))
    }

    func testBitmapValidationDetectsInconsistentStride() {
        let broken = MonoBitmap(width: 96, height: 1, bytesPerRow: 5, rows: [[UInt8](repeating: 0, count: 5)])
        let problems = broken.validate(printheadPixels: 96)
        XCTAssertTrue(problems.contains { $0.contains("bytesPerRow") })
    }
}
