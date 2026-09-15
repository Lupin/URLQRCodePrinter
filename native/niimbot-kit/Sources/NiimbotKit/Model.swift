//
//  Model.swift
//  NiimbotKit
//
//  Modèle de lien et archive JSON.
//
//  Le format reproduit **exactement** celui produit par `src/core/exporters.js`
//  et consommé par l'application web. C'est ce qui permet à l'app iOS de
//  récupérer une collection constituée dans Brave ou Safari : on exporte
//  l'archive depuis le navigateur, on l'importe sur le téléphone, et les liens
//  sont imprimables sans qu'aucune synchronisation réseau n'existe.
//

import Foundation

/// Un lien collecté.
///
/// Les noms de propriétés sont ceux du format JavaScript : la sérialisation
/// JSON est donc directement compatible, sans table de correspondance.
public struct StoredLink: Codable, Sendable, Equatable, Identifiable {
    public var id: String
    public var url: String
    public var title: String
    public var note: String
    public var tags: [String]
    /// Date de collecte, en millisecondes depuis l'époque Unix.
    public var createdAt: Double
    public var updatedAt: Double
    public var source: String
    public var favicon: String

    public init(
        id: String = UUID().uuidString,
        url: String,
        title: String = "",
        note: String = "",
        tags: [String] = [],
        createdAt: Double = Date().timeIntervalSince1970 * 1000,
        updatedAt: Double = Date().timeIntervalSince1970 * 1000,
        source: String = "manual",
        favicon: String = ""
    ) {
        self.id = id
        self.url = url
        self.title = title
        self.note = note
        self.tags = tags
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.source = source
        self.favicon = favicon
    }

    /// Date de collecte, en `Date`.
    public var createdAtDate: Date {
        Date(timeIntervalSince1970: createdAt / 1000)
    }

    /// Libellé affichable : le titre s'il existe, sinon le domaine.
    public var displayTitle: String {
        title.isEmpty ? LinkURL.host(of: url) : title
    }
}

/// Normalisation d'URL — pendant Swift de `normalizeUrl` en JavaScript.
public enum LinkURL {

    /// Erreurs de normalisation.
    public enum Failure: Error, LocalizedError, Equatable {
        case empty
        case unsupportedScheme
        case invalidHost(String)

        public var errorDescription: String? {
            switch self {
            case .empty: return "URL vide."
            case .unsupportedScheme: return "Seuls les schémas http et https sont pris en charge."
            case let .invalidHost(host): return "Nom d'hôte invalide : \(host)."
            }
        }
    }

    /// Paramètres de campagne retirés : ils polluent le QR et le densifient.
    private static let trackingPrefixes = ["utm_", "fbclid", "gclid", "mc_cid", "mc_eid", "ref_src"]

    /// Normalise une URL saisie ou capturée.
    ///
    /// - ajoute `https://` si le schéma est absent ;
    /// - retire le fragment, jamais envoyé au serveur et inutile dans un QR ;
    /// - retire les paramètres de campagne ;
    /// - supprime le slash final redondant sur la racine.
    public static func normalize(_ input: String) throws -> String {
        var raw = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !raw.isEmpty else { throw Failure.empty }

        // « hote:3000 » ressemble à un schéma mais désigne un hôte suivi d'un
        // port : on le traite comme une URL sans schéma.
        let isHostPort = raw.range(of: #"^[^\s/?#@]+:\d+([/?#]|$)"#, options: .regularExpression) != nil
        let hasScheme = raw.range(of: #"^[a-z][a-z0-9+.-]*:"#, options: [.regularExpression, .caseInsensitive]) != nil
        let isWebScheme = raw.range(of: #"^https?:"#, options: [.regularExpression, .caseInsensitive]) != nil

        if hasScheme && !isWebScheme && !isHostPort { throw Failure.unsupportedScheme }
        if !isWebScheme { raw = "https://" + raw }

        guard var components = URLComponents(string: raw) else {
            throw Failure.invalidHost(input)
        }

        let host = components.host ?? ""
        guard !host.isEmpty else { throw Failure.invalidHost(input) }
        if !host.contains(".") && host.lowercased() != "localhost" {
            throw Failure.invalidHost(host)
        }

        components.fragment = nil

        if let items = components.queryItems {
            let kept = items.filter { item in
                let name = item.name.lowercased()
                return !trackingPrefixes.contains { name.hasPrefix($0) || name == $0 }
            }
            components.queryItems = kept.isEmpty ? nil : kept
        }

        var out = components.string ?? raw
        if components.path == "/" || components.path.isEmpty, components.query == nil {
            if out.hasSuffix("/") { out.removeLast() }
        }
        return out
    }

    /// Indique si une chaîne est une URL http(s) exploitable.
    public static func isValid(_ input: String) -> Bool {
        (try? normalize(input)) != nil
    }

    /// Domaine affichable, sans « www. ».
    public static func host(of url: String) -> String {
        guard let host = URLComponents(string: url)?.host else { return "" }
        return host.hasPrefix("www.") ? String(host.dropFirst(4)) : host
    }

    /// Nettoie et dédoublonne une liste d'étiquettes.
    public static func normalizeTags(_ tags: [String]) -> [String] {
        var seen = Set<String>()
        var out: [String] = []
        for tag in tags {
            let clean = tag
                .trimmingCharacters(in: .whitespacesAndNewlines)
                .trimmingCharacters(in: CharacterSet(charactersIn: "#"))
                .replacingOccurrences(of: #"\s+"#, with: "-", options: .regularExpression)
                .lowercased()
            guard !clean.isEmpty, !seen.contains(clean) else { continue }
            seen.insert(clean)
            out.append(clean)
        }
        return out
    }

    /// Clé de comparaison, insensible au « www. », au slash final et à la casse.
    public static func comparisonKey(_ url: String) -> String {
        guard let normalized = try? normalize(url),
              var components = URLComponents(string: normalized) else {
            return url.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        }
        var path = components.path
        if path.hasSuffix("/") { path.removeLast() }
        let host = (components.host ?? "").hasPrefix("www.")
            ? String((components.host ?? "").dropFirst(4))
            : (components.host ?? "")
        components.path = path
        return (host + path + (components.query ?? "")).lowercased()
    }

    /// Indique si deux URL désignent la même ressource.
    public static func isSameTarget(_ a: String, _ b: String) -> Bool {
        comparisonKey(a) == comparisonKey(b)
    }
}

/// Archive JSON, compatible avec l'export du navigateur.
public struct LinkArchive: Codable, Sendable {
    public static let formatIdentifier = "url-qr-code-printer/links"
    public static let currentVersion = 1

    public let format: String
    public let version: Int
    public let exportedAt: String
    public let app: String
    public let count: Int
    public let links: [StoredLink]

    public init(links: [StoredLink], now: Date = Date(), app: String = "url-qr-code-printer") {
        self.format = Self.formatIdentifier
        self.version = Self.currentVersion
        self.exportedAt = ISO8601DateFormatter().string(from: now)
        self.app = app
        self.count = links.count
        self.links = links
    }
}

/// Lecture et écriture d'archives.
public enum LinkArchiveCoding {

    /// Erreurs de lecture.
    public enum Failure: Error, LocalizedError {
        case unrecognised

        public var errorDescription: String? {
            "Archive non reconnue : la clé « links » est absente."
        }
    }

    private static let decoder = JSONDecoder()
    private static let encoder: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        return encoder
    }()

    /// Décode une archive, en tolérant un tableau nu.
    public static func decode(_ data: Data) throws -> [StoredLink] {
        if let archive = try? decoder.decode(LinkArchive.self, from: data) {
            return archive.links
        }
        if let bare = try? decoder.decode([StoredLink].self, from: data) {
            return bare
        }
        throw Failure.unrecognised
    }

    /// Encode une archive.
    public static func encode(_ links: [StoredLink], now: Date = Date()) throws -> Data {
        try encoder.encode(LinkArchive(links: links, now: now))
    }
}

/// Collection de liens en mémoire, avec dédoublonnage.
///
/// Volontairement dépourvue de persistance : le stockage appartient à l'app,
/// qui choisit entre un fichier, un conteneur partagé ou `UserDefaults`.
public struct LinkCollection: Sendable {
    public private(set) var links: [StoredLink] = []

    public init(links: [StoredLink] = []) {
        self.links = links.sorted { $0.createdAt > $1.createdAt }
    }

    /// Ajoute un lien après normalisation.
    ///
    /// - Returns: `true` si le lien a été ajouté, `false` s'il existait déjà.
    @discardableResult
    public mutating func add(
        url: String,
        title: String = "",
        tags: [String] = [],
        source: String = "manual",
        now: Date = Date()
    ) throws -> Bool {
        let normalized = try LinkURL.normalize(url)
        guard !links.contains(where: { LinkURL.isSameTarget($0.url, normalized) }) else {
            return false
        }
        let stamp = now.timeIntervalSince1970 * 1000
        links.insert(
            StoredLink(
                url: normalized,
                title: title,
                tags: LinkURL.normalizeTags(tags),
                createdAt: stamp,
                updatedAt: stamp,
                source: source
            ),
            at: 0
        )
        return true
    }

    /// Importe une archive, en ignorant les doublons.
    ///
    /// - Returns: le nombre de liens ajoutés et le nombre ignorés.
    @discardableResult
    public mutating func importArchive(_ data: Data) throws -> (added: Int, skipped: Int) {
        let incoming = try LinkArchiveCoding.decode(data)
        var added = 0
        var skipped = 0

        for record in incoming {
            guard LinkURL.isValid(record.url) else {
                skipped += 1
                continue
            }
            let normalized = (try? LinkURL.normalize(record.url)) ?? record.url
            if links.contains(where: { LinkURL.isSameTarget($0.url, normalized) }) {
                skipped += 1
                continue
            }
            var copy = record
            copy.url = normalized
            copy.tags = LinkURL.normalizeTags(record.tags)
            links.append(copy)
            added += 1
        }

        links.sort { $0.createdAt > $1.createdAt }
        return (added, skipped)
    }

    public mutating func remove(id: String) {
        links.removeAll { $0.id == id }
    }

    public mutating func removeAll() {
        links.removeAll()
    }
}
