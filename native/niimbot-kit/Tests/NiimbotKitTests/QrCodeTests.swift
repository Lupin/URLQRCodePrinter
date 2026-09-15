//
//  QrCodeTests.swift
//  NiimbotKitTests
//
//  Le QR est produit par CoreImage. On vérifie surtout ce qui compte pour
//  l'impression : une matrice carrée, entière, avec une bordure blanche, des
//  modules noirs et blancs, et une taille qui croît avec la longueur de l'URL.
//

import XCTest
@testable import NiimbotKit

final class QrCodeTests: XCTestCase {

    func testMatrixIsSquareAndPadded() throws {
        let matrix = try qrMatrix(for: "https://example.com", border: 2)
        XCTAssertEqual(matrix.modules.count, matrix.size)
        for row in matrix.modules {
            XCTAssertEqual(row.count, matrix.size)
        }
        // La bordure est blanche sur toute sa largeur.
        for i in 0..<matrix.size {
            XCTAssertFalse(matrix.modules[0][i], "bordure supérieure")
            XCTAssertFalse(matrix.modules[i][0], "bordure gauche")
            XCTAssertFalse(matrix.modules[matrix.size - 1][i], "bordure inférieure")
            XCTAssertFalse(matrix.modules[i][matrix.size - 1], "bordure droite")
        }
    }

    func testMatrixContainsBothValues() throws {
        let matrix = try qrMatrix(for: "https://example.com")
        let flat = matrix.modules.flatMap { $0 }
        XCTAssertTrue(flat.contains(true), "aucun module noir")
        XCTAssertTrue(flat.contains(false), "aucun module blanc")
    }

    func testLongerUrlProducesLargerMatrix() throws {
        let short = try qrMatrix(for: "https://a.co", border: 0)
        let long = try qrMatrix(for: "https://example.com/" + String(repeating: "segment/", count: 20), border: 0)
        XCTAssertGreaterThan(long.size, short.size)
    }

    func testBorderWidthIsRespected() throws {
        let none = try qrMatrix(for: "https://example.com", border: 0)
        let two = try qrMatrix(for: "https://example.com", border: 2)
        XCTAssertEqual(two.size, none.size + 4)

        // Les quatre modules ajoutés de chaque côté sont blancs.
        XCTAssertFalse(two.modules[0][0])
        XCTAssertEqual(two.modules[2][2], none.modules[0][0])
    }

    func testFinderPatternsArePresent() throws {
        // Un QR commence par un repère d'orientation de 7 modules dans le coin
        // supérieur gauche : anneau noir, intérieur blanc, cœur noir.
        let matrix = try qrMatrix(for: "https://example.com", border: 0)
        XCTAssertTrue(matrix.modules[0][0], "coin du repère")
        XCTAssertTrue(matrix.modules[0][6], "coin opposé du repère")
        XCTAssertFalse(matrix.modules[1][1], "intérieur blanc du repère")
        XCTAssertTrue(matrix.modules[3][3], "cœur du repère")
    }

    func testEncodingIsDeterministic() throws {
        let first = try qrMatrix(for: "https://example.com/page")
        let second = try qrMatrix(for: "https://example.com/page")
        XCTAssertEqual(first, second)
    }

    func testHigherCorrectionLevelProducesLargerMatrix() throws {
        let medium = try qrMatrix(for: "https://example.com/a/b/c", correctionLevel: .medium, border: 0)
        let high = try qrMatrix(for: "https://example.com/a/b/c", correctionLevel: .high, border: 0)
        XCTAssertGreaterThanOrEqual(high.size, medium.size)
    }

    func testEmptyInputIsRefused() {
        XCTAssertThrowsError(try qrMatrix(for: "")) { error in
            XCTAssertEqual(error as? QrCodeError, .emptyInput)
        }
    }

    func testNonAsciiUrlIsEncoded() throws {
        let matrix = try qrMatrix(for: "https://exemple.fr/café/naïve?q=été")
        XCTAssertGreaterThan(matrix.size, 0)
    }
}
