//
//  ModelTests.swift
//  NiimbotKitTests
//
//  Le format d'archive doit rester compatible avec celui produit par
//  `src/core/exporters.js` : c'est le seul pont entre ce que le navigateur
//  collecte et ce que le téléphone imprime.
//

import XCTest
@testable import NiimbotKit

final class ModelTests: XCTestCase {

    // MARK: - Normalisation d'URL

    func testAddsMissingScheme() throws {
        XCTAssertEqual(try LinkURL.normalize("example.com/page"), "https://example.com/page")
    }

    func testStripsFragment() throws {
        XCTAssertEqual(try LinkURL.normalize("https://example.com/a#section"), "https://example.com/a")
    }

    func testStripsTrackingParametersButKeepsUsefulOnes() throws {
        let result = try LinkURL.normalize("https://example.com/p?utm_source=news&id=42&fbclid=xyz")
        XCTAssertEqual(result, "https://example.com/p?id=42")
    }

    func testStripsTrailingSlashOnRoot() throws {
        XCTAssertEqual(try LinkURL.normalize("https://example.com/"), "https://example.com")
    }

    func testRejectsNonWebSchemes() {
        XCTAssertThrowsError(try LinkURL.normalize("mailto:a@b.com"))
        XCTAssertThrowsError(try LinkURL.normalize("ftp://example.com"))
    }

    func testRejectsHostWithoutDot() {
        XCTAssertThrowsError(try LinkURL.normalize("pasunhote"))
    }

    func testAcceptsLocalhostAndHostPort() throws {
        XCTAssertEqual(try LinkURL.normalize("localhost:3000"), "https://localhost:3000")
    }

    func testNormalisationIsIdempotent() throws {
        let once = try LinkURL.normalize("HTTPS://WWW.Example.COM/a/?utm_medium=x#frag")
        XCTAssertEqual(try LinkURL.normalize(once), once)
    }

    func testHostStripsWww() {
        XCTAssertEqual(LinkURL.host(of: "https://www.lemonde.fr/article"), "lemonde.fr")
        XCTAssertEqual(LinkURL.host(of: "pas une url"), "")
    }

    func testNormalizeTags() {
        XCTAssertEqual(
            LinkURL.normalizeTags(["#Projet", "projet", " Ma Tag ", ""]),
            ["projet", "ma-tag"]
        )
    }

    func testSameTargetIgnoresWwwAndTrailingSlash() {
        XCTAssertTrue(LinkURL.isSameTarget("https://www.Example.com/a/", "https://example.com/a"))
        XCTAssertFalse(LinkURL.isSameTarget("https://example.com/a", "https://example.com/b"))
    }

    // MARK: - Archive

    /// Échantillon produit par l'export du navigateur.
    private let browserArchive = """
    {
      "format": "url-qr-code-printer/links",
      "version": 1,
      "exportedAt": "2025-01-15T10:30:00.000Z",
      "app": "url-qr-code-printer",
      "count": 2,
      "links": [
        {
          "id": "11111111-1111-4111-8111-111111111111",
          "url": "https://example.com/article",
          "title": "Un article",
          "note": "",
          "tags": ["veille"],
          "createdAt": 1736937000000,
          "updatedAt": 1736937000000,
          "source": "context-menu",
          "favicon": ""
        },
        {
          "id": "22222222-2222-4222-8222-222222222222",
          "url": "https://autre.fr/page?utm_source=x",
          "title": "",
          "note": "à relire",
          "tags": [],
          "createdAt": 1736930000000,
          "updatedAt": 1736930000000,
          "source": "toolbar",
          "favicon": ""
        }
      ]
    }
    """.data(using: .utf8)!

    func testDecodesBrowserArchive() throws {
        let links = try LinkArchiveCoding.decode(browserArchive)
        XCTAssertEqual(links.count, 2)
        XCTAssertEqual(links[0].url, "https://example.com/article")
        XCTAssertEqual(links[0].title, "Un article")
        XCTAssertEqual(links[0].tags, ["veille"])
        XCTAssertEqual(links[0].source, "context-menu")
    }

    func testDecodesBareArray() throws {
        let bare = #"[{"id":"a","url":"https://a.com","title":"","note":"","tags":[],"createdAt":1,"updatedAt":1,"source":"manual","favicon":""}]"#
        let links = try LinkArchiveCoding.decode(Data(bare.utf8))
        XCTAssertEqual(links.count, 1)
        XCTAssertEqual(links[0].url, "https://a.com")
    }

    func testRejectsUnrecognisedArchive() {
        XCTAssertThrowsError(try LinkArchiveCoding.decode(Data(#"{"foo":1}"#.utf8)))
    }

    func testArchiveRoundTrip() throws {
        let links = [
            StoredLink(url: "https://example.com/a", title: "T", tags: ["z"], source: "import")
        ]
        let data = try LinkArchiveCoding.encode(links)
        let decoded = try LinkArchiveCoding.decode(data)
        XCTAssertEqual(decoded, links)
    }

    func testEncodedArchiveDeclaresTheSameFormatAsTheBrowser() throws {
        let data = try LinkArchiveCoding.encode([])
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        XCTAssertEqual(json?["format"] as? String, "url-qr-code-printer/links")
        XCTAssertEqual(json?["version"] as? Int, 1)
        XCTAssertEqual(json?["count"] as? Int, 0)
    }

    // MARK: - Collection

    func testCollectionAddNormalisesAndDeduplicates() throws {
        var collection = LinkCollection()
        XCTAssertTrue(try collection.add(url: "example.com/a"))
        XCTAssertFalse(try collection.add(url: "https://www.example.com/a/"))
        XCTAssertEqual(collection.links.count, 1)
        XCTAssertEqual(collection.links[0].url, "https://example.com/a")
    }

    func testCollectionImportSkipsDuplicatesAndInvalidEntries() throws {
        var collection = LinkCollection()
        let added = try collection.add(url: "https://example.com/article")

        XCTAssertTrue(added)
        let result = try collection.importArchive(browserArchive)

        // Le premier lien de l'archive est déjà présent ; le second est ajouté
        // et normalisé, ce qui retire son paramètre de campagne.
        XCTAssertEqual(result.added, 1)
        XCTAssertEqual(result.skipped, 1)
        XCTAssertEqual(collection.links.count, 2)
        XCTAssertTrue(collection.links.contains { $0.url == "https://autre.fr/page" })
    }

    func testCollectionSortsNewestFirst() throws {
        var collection = LinkCollection()
        let older = Date(timeIntervalSince1970: 1_000_000)
        let newer = Date(timeIntervalSince1970: 2_000_000)
        try collection.add(url: "https://vieux.com", now: older)
        try collection.add(url: "https://recent.com", now: newer)
        XCTAssertEqual(collection.links.first?.url, "https://recent.com")
    }

    func testCollectionRemove() throws {
        var collection = LinkCollection()
        try collection.add(url: "https://a.com")
        let id = collection.links[0].id
        collection.remove(id: id)
        XCTAssertTrue(collection.links.isEmpty)
    }

    func testDisplayTitleFallsBackToHost() {
        let link = StoredLink(url: "https://www.example.com/a", title: "")
        XCTAssertEqual(link.displayTitle, "example.com")
    }
}
