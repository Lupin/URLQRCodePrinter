//
//  QrCode.swift
//  NiimbotKit
//
//  Encodage QR natif.
//
//  CoreImage fournit un générateur de QR codes, disponible aussi bien sur macOS
//  que sur iOS : inutile d'embarquer une bibliothèque pour cela. On récupère la
//  matrice à raison d'un pixel par module, puis on la met à l'échelle nous-mêmes
//  — un redimensionnement par CoreImage introduirait un lissage qui rendrait le
//  code illisible une fois imprimé sur une tête thermique.
//

import Foundation
import CoreImage
import CoreGraphics

/// Matrice de modules d'un QR code.
public struct QrMatrix: Sendable, Equatable {
    /// `modules[y][x] == true` pour un module noir.
    public let modules: [[Bool]]
    /// Nombre de modules par côté, bordure comprise.
    public let size: Int

    public init(modules: [[Bool]]) {
        self.modules = modules
        self.size = modules.count
    }
}

/// Erreurs d'encodage.
public enum QrCodeError: Error, LocalizedError {
    case emptyInput
    case generatorUnavailable
    case renderFailed

    public var errorDescription: String? {
        switch self {
        case .emptyInput: return "Aucun texte à encoder."
        case .generatorUnavailable: return "Le générateur de QR codes n'est pas disponible."
        case .renderFailed: return "Le rendu du QR code a échoué."
        }
    }
}

/// Niveaux de correction d'erreur acceptés par CoreImage.
public enum QrCorrectionLevel: String, Sendable {
    /// Jusqu'à 7 % de perte.
    case low = "L"
    /// Jusqu'à 15 % — le compromis retenu par défaut.
    case medium = "M"
    /// Jusqu'à 25 %.
    case quartile = "Q"
    /// Jusqu'à 30 %.
    case high = "H"
}

/// Encode un texte en matrice QR.
///
/// - Parameter border: nombre de modules de marge blanche ajoutés autour du
///   code. Deux modules suffisent à la plupart des lecteurs ; CoreImage en
///   ajoute déjà un, qu'on retire pour maîtriser la valeur exacte.
public func qrMatrix(
    for text: String,
    correctionLevel: QrCorrectionLevel = .medium,
    border: Int = 2
) throws -> QrMatrix {
    guard !text.isEmpty else { throw QrCodeError.emptyInput }
    guard let filter = CIFilter(name: "CIQRCodeGenerator") else {
        throw QrCodeError.generatorUnavailable
    }

    filter.setValue(Data(text.utf8), forKey: "inputMessage")
    filter.setValue(correctionLevel.rawValue, forKey: "inputCorrectionLevel")

    guard let output = filter.outputImage else { throw QrCodeError.renderFailed }

    let extent = output.extent
    let width = Int(extent.width)
    let height = Int(extent.height)
    guard width > 0, height > 0 else { throw QrCodeError.renderFailed }

    // Rendu en niveaux de gris, un octet par pixel : le QR n'a que deux
    // valeurs, aucun antialiasing n'est souhaitable ici.
    let context = CIContext(options: [.useSoftwareRenderer: true])
    var buffer = [UInt8](repeating: 0, count: width * height)
    buffer.withUnsafeMutableBytes { raw in
        guard let base = raw.baseAddress else { return }
        context.render(
            output,
            toBitmap: base,
            rowBytes: width,
            bounds: extent,
            format: .L8,
            colorSpace: CGColorSpaceCreateDeviceGray()
        )
    }

    // CoreImage ajoute une marge blanche dont l'épaisseur n'est pas documentée
    // — mesurée à un module sur macOS 26, alors que la croyance courante est
    // quatre. On la **détecte** plutôt que de la supposer : la boîte englobante
    // des pixels sombres est exactement le cœur du code, puisque les repères
    // d'orientation occupent les quatre coins.
    var top = height
    var bottom = -1
    var left = width
    var right = -1

    for y in 0..<height {
        for x in 0..<width where buffer[y * width + x] < 128 {
            if y < top { top = y }
            if y > bottom { bottom = y }
            if x < left { left = x }
            if x > right { right = x }
        }
    }

    guard bottom >= top, right >= left else { throw QrCodeError.renderFailed }

    let coreWidth = right - left + 1
    let coreHeight = bottom - top + 1

    let padded = max(0, border)
    let size = max(coreWidth, coreHeight) + padded * 2
    var modules = Array(
        repeating: Array(repeating: false, count: size),
        count: size
    )

    for y in 0..<coreHeight {
        for x in 0..<coreWidth {
            let offset = (y + top) * width + (x + left)
            // Un pixel sombre devient un module noir.
            modules[y + padded][x + padded] = buffer[offset] < 128
        }
    }

    return QrMatrix(modules: modules)
}
