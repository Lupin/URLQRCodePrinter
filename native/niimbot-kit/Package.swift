// swift-tools-version:5.9
import PackageDescription

// Socle natif Niimbot, partagé entre macOS et iOS.
//
// Il existe parce qu'aucun navigateur iOS n'expose Web Bluetooth : imprimer
// depuis un iPhone impose CoreBluetooth, donc du code natif. Le protocole est
// le même que celui de `src/core/printer/`, et les tests utilisent les mêmes
// trames de référence — deux implémentations qui se confirment mutuellement.
let package = Package(
    name: "NiimbotKit",
    platforms: [
        .macOS(.v13),
        .iOS(.v16),
    ],
    products: [
        .library(name: "NiimbotKit", targets: ["NiimbotKit"]),
    ],
    targets: [
        .target(name: "NiimbotKit"),
        .testTarget(name: "NiimbotKitTests", dependencies: ["NiimbotKit"]),
    ]
)
