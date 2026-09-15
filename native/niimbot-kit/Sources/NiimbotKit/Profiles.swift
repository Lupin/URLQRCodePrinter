//
//  Profiles.swift
//  NiimbotKit
//
//  Profils d'imprimantes Niimbot.
//
//  Deux chiffres sont critiques et contre-intuitifs :
//
//  1. `printheadPixels` est la largeur de la **tête**, pas celle de
//     l'étiquette. Un D110 accepte des rouleaux de 15 mm mais sa tête ne fait
//     que 96 px (12 mm à 203 dpi). Envoyer 120 colonnes ne provoque aucune
//     erreur : l'imprimante rogne silencieusement à 96.
//  2. `printTask` détermine la grammaire du dialogue. Router un D110 vers le
//     task « v4 » le fait refuser la page avec une erreur `dataError`.
//

import Foundation

/// Caractéristiques d'un modèle.
public struct PrinterProfile: Sendable, Equatable {
    public let id: String
    /// `modelId` rapportés par `printerInfo`.
    public let modelIDs: [Int]
    public let dpi: Int
    /// Largeur de la tête en pixels — donc largeur utile maximale.
    public let printheadPixels: Int
    public let maxLabelWidthMM: Double
    public let maxPrintHeightMM: Double
    public let minDensity: UInt8
    public let maxDensity: UInt8
    public let defaultDensity: UInt8
    public let printTask: PrintTaskVariant
    /// Préfixes du nom Bluetooth annoncé.
    public let namePrefixes: [String]

    /// Hauteur maximale en pixels, à la résolution du modèle.
    public var maxPrintHeightPx: Int {
        Int((maxPrintHeightMM / 25.4 * Double(dpi)).rounded())
    }

    /// Largeur réellement imprimable, en millimètres.
    public var printableWidthMM: Double {
        Double(printheadPixels) / Double(dpi) * 25.4
    }

    /// Ramène une densité demandée dans les bornes du modèle.
    public func clampDensity(_ density: Int) -> UInt8 {
        let lower = Int(minDensity)
        let upper = Int(maxDensity)
        return UInt8(max(lower, min(upper, density)))
    }
}

/// Profil D110 — famille 203 dpi, tête 96 px.
///
/// `2304` = D110, `2305` = Hi-D110, `2320` = D110_M. « D110A » n'apparaît dans
/// aucune source : le `modelId` réel sera lu à la connexion.
public let d110Profile = PrinterProfile(
    id: "D110",
    modelIDs: [2304, 2305, 2320],
    dpi: 203,
    printheadPixels: 96,
    maxLabelWidthMM: 15,
    maxPrintHeightMM: 100,
    minDensity: 1,
    maxDensity: 3,
    defaultDensity: 2,
    printTask: .d110,
    namePrefixes: ["D110", "D11", "D101"]
)

/// Profil M2 (M2_H) — 300 dpi, tête 576 px.
public let m2Profile = PrinterProfile(
    id: "M2",
    modelIDs: [4608],
    dpi: 300,
    printheadPixels: 576,
    maxLabelWidthMM: 50,
    maxPrintHeightMM: 240,
    minDensity: 1,
    maxDensity: 5,
    defaultDensity: 3,
    printTask: .b1,
    namePrefixes: ["M2"]
)

/// Tous les profils connus.
public let allProfiles: [PrinterProfile] = [d110Profile, m2Profile]

/// Profil utilisé quand le modèle n'est pas identifié.
public let defaultProfile = d110Profile

/// Préfixes de nom à proposer au sélecteur d'appareils.
public let allNamePrefixes: [String] = Array(Set(allProfiles.flatMap(\.namePrefixes))).sorted()

/// Retrouve un profil à partir du `modelId` rapporté par l'imprimante.
public func profile(forModelID modelID: Int) -> PrinterProfile? {
    allProfiles.first { $0.modelIDs.contains(modelID) }
}

/// Devine un profil à partir du nom Bluetooth annoncé.
///
/// Ne sert que de repli : le `modelId` lu à la connexion fait foi. On teste les
/// préfixes du plus long au plus court pour que « B21 » ne soit pas capté par
/// « B1 ».
public func profile(forName name: String) -> PrinterProfile? {
    let upper = name.uppercased()
    let candidates = allProfiles
        .flatMap { profile in profile.namePrefixes.map { (profile, $0) } }
        .sorted { $0.1.count > $1.1.count }

    for (profile, prefix) in candidates where upper.hasPrefix(prefix.uppercased()) {
        return profile
    }
    return nil
}

/// Ajuste un profil avec la largeur de tête réellement rapportée.
///
/// C'est la mesure la plus fiable — elle vient du matériel — mais on n'accepte
/// qu'une valeur plausible, pour ne pas écraser un profil correct avec une
/// lecture erronée.
public func profile(_ base: PrinterProfile, withReportedHead pixels: Int) -> PrinterProfile {
    guard pixels >= 8, pixels <= 4096 else { return base }
    return PrinterProfile(
        id: base.id,
        modelIDs: base.modelIDs,
        dpi: base.dpi,
        printheadPixels: pixels,
        maxLabelWidthMM: base.maxLabelWidthMM,
        maxPrintHeightMM: base.maxPrintHeightMM,
        minDensity: base.minDensity,
        maxDensity: base.maxDensity,
        defaultDensity: base.defaultDensity,
        printTask: base.printTask,
        namePrefixes: base.namePrefixes
    )
}

/// Écart entre une largeur d'étiquette annoncée et la largeur réellement
/// imprimable, en millimètres.
public func clippedWidthMM(_ profile: PrinterProfile, labelWidthMM: Double) -> Double {
    max(0, labelWidthMM - profile.printableWidthMM)
}
