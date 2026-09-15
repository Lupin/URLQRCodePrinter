//
//  PacketTests.swift
//  NiimbotKitTests
//
//  Les trames attendues sont celles documentées par les implémentations de
//  référence et recalculées à la main. Elles servent de vérité terrain : si
//  l'encodage dérive, ces tests cassent avant qu'on envoie quoi que ce soit à
//  une imprimante.
//
//  Ces mêmes vecteurs existent côté JavaScript, dans `test/printer.test.js` :
//  deux implémentations indépendantes qui se confirment mutuellement.
//

import XCTest
@testable import NiimbotKit

/// Rend un tableau d'octets lisible : « 55 55 21 01 ».
func hex(_ bytes: [UInt8]) -> String {
    bytes.map { String(format: "%02x", $0) }.joined(separator: " ")
}

/// Convertit « 55 55 21 » en tableau d'octets.
func bytes(_ text: String) -> [UInt8] {
    text.split(separator: " ").compactMap { UInt8($0, radix: 16) }
}

final class PacketTests: XCTestCase {

    // MARK: - Checksum et trame de base

    func testChecksumFollowsXorRule() {
        // 0x21 ^ 0x01 ^ 0x03 = 0x23
        XCTAssertEqual(checksum(command: 0x21, data: [0x03]), 0x23)
        // 0xC1 ^ 0x01 ^ 0x01 = 0xC1
        XCTAssertEqual(checksum(command: 0xC1, data: [0x01]), 0xC1)
        XCTAssertEqual(checksum(command: 0x40, data: [0x08]), 0x49)
    }

    func testConnectPacketCarriesPrefix() {
        XCTAssertEqual(hex(buildConnect()), "03 55 55 c1 01 01 c1 aa aa")
    }

    func testStandardPacketHasNoPrefix() {
        XCTAssertEqual(hex(setDensityFrame(3)), "55 55 21 01 03 23 aa aa")
    }

    func testUint16BEIsBigEndian() {
        XCTAssertEqual(uint16BE(0x0240), [0x02, 0x40])
        XCTAssertEqual(uint16BE(400), [0x01, 0x90])
        XCTAssertEqual(uint16BE(0), [0, 0])
    }

    // MARK: - Trames de réglage documentées

    func testDocumentedFrames() {
        XCTAssertEqual(hex(setLabelTypeFrame(.withGaps)), "55 55 23 01 01 23 aa aa")
        XCTAssertEqual(hex(printClearFrame()), "55 55 20 01 01 20 aa aa")
        XCTAssertEqual(hex(pageStartFrame()), "55 55 03 01 01 03 aa aa")
        XCTAssertEqual(hex(pageEndFrame()), "55 55 e3 01 01 e3 aa aa")
        XCTAssertEqual(hex(printEndFrame()), "55 55 f3 01 01 f3 aa aa")
        XCTAssertEqual(hex(printStatusFrame()), "55 55 a3 01 01 a3 aa aa")
        XCTAssertEqual(hex(printerStatusDataFrame()), "55 55 a5 01 01 a5 aa aa")
        XCTAssertEqual(hex(printerInfoFrame()), "55 55 40 01 08 49 aa aa")
        XCTAssertEqual(hex(heartbeatFrame()), "55 55 dc 01 04 d9 aa aa")
        XCTAssertEqual(hex(printQuantityFrame(1)), "55 55 15 02 00 01 16 aa aa")
        XCTAssertEqual(hex(printEmptyRowFrame(row: 0, run: 4)), "55 55 84 03 00 00 04 83 aa aa")
    }

    // MARK: - printStart : les variantes ne sont pas interchangeables

    func testPrintStartD110IsOneByte() {
        let frame = printStartFrame(.d110)
        XCTAssertEqual(hex(frame), "55 55 01 01 01 01 aa aa")
        XCTAssertEqual(frame[3], 1)
    }

    func testPrintStartB1DeclaresPages() {
        XCTAssertEqual(hex(printStartFrame(.b1)), "55 55 01 07 00 01 00 00 00 00 00 07 aa aa")
        XCTAssertEqual(hex(printStartFrame(.b1, pages: 3)), "55 55 01 07 00 03 00 00 00 00 00 05 aa aa")
    }

    func testPrintStartV4IsNineBytes() {
        let frame = printStartFrame(.v4, speed: 1)
        XCTAssertEqual(frame[3], 9)
        XCTAssertEqual(hex(frame), "55 55 01 09 00 01 00 00 00 00 00 01 00 08 aa aa")
    }

    // MARK: - setPageSize : la largeur est celle de la tête

    func testSetPageSizeD110IsFourBytes() {
        XCTAssertEqual(
            hex(setPageSizeFrame(.d110, rows: 400, cols: 96)),
            "55 55 13 04 01 90 00 60 e6 aa aa"
        )
    }

    func testSetPageSizeB1IsSixBytes() {
        XCTAssertEqual(
            hex(setPageSizeFrame(.b1, rows: 354, cols: 576, copies: 1)),
            "55 55 13 06 01 62 02 40 00 01 35 aa aa"
        )
    }

    func testSetPageSizeV4IsThirteenBytes() {
        XCTAssertEqual(
            hex(setPageSizeFrame(.v4, rows: 354, cols: 576, copies: 1)),
            "55 55 13 0d 01 62 02 40 00 01 00 00 00 00 00 00 00 3e aa aa"
        )
    }

    // MARK: - Ligne bitmap

    func testDocumentedBitmapRow() {
        let bitmap: [UInt8] = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0, 0, 0, 0, 0, 0]
        let frame = printBitmapRowFrame(row: 0, bitmap: bitmap, counts: [0x00, 0x30, 0x00])
        XCTAssertEqual(
            hex(frame),
            "55 55 85 12 00 00 00 30 00 01 ff ff ff ff ff ff 00 00 00 00 00 00 a6 aa aa"
        )
    }

    func testBitmapRowLengthDerivesFromPayload() {
        let frame = printBitmapRowFrame(row: 0, bitmap: [UInt8](repeating: 0, count: 12))
        // 2 (ligne) + 3 (compteurs) + 1 (répétition) + 12 (bitmap) = 18
        XCTAssertEqual(frame[3], 18)
    }

    func testBitmapRowClampsRun() {
        let frame = printBitmapRowFrame(row: 0, bitmap: [UInt8](repeating: 0, count: 12), run: 255)
        XCTAssertEqual(frame[9], 255)
    }

    // MARK: - Décodeur de flux

    func testDecoderRestoresWholeFrame() {
        let decoder = PacketStreamDecoder()
        let packets = decoder.push(bytes("55 55 31 01 02 32 aa aa"))
        XCTAssertEqual(packets.count, 1)
        XCTAssertEqual(packets.first?.command, 0x31)
        XCTAssertEqual(packets.first?.data, [0x02])
    }

    func testDecoderReassemblesFragmentedFrame() {
        let decoder = PacketStreamDecoder()
        let full = buildPacket(0xB3, [0x00, 0x02, 0x40])
        XCTAssertEqual(full.count, 10)

        XCTAssertTrue(decoder.push(Array(full[0..<3])).isEmpty)
        XCTAssertTrue(decoder.push(Array(full[3..<7])).isEmpty)

        let packets = decoder.push(Array(full[7...]))
        XCTAssertEqual(packets.count, 1)
        XCTAssertEqual(packets.first?.command, 0xB3)
        XCTAssertEqual(packets.first?.data, [0x00, 0x02, 0x40])
    }

    func testDecoderSplitsConcatenatedFrames() {
        let decoder = PacketStreamDecoder()
        let packets = decoder.push(setDensityFrame(3) + pageStartFrame())
        XCTAssertEqual(packets.count, 2)
        XCTAssertEqual(packets[0].command, Command.setDensity.rawValue)
        XCTAssertEqual(packets[1].command, Command.pageStart.rawValue)
    }

    func testDecoderSkipsLeadingNoise() {
        let decoder = PacketStreamDecoder()
        let packets = decoder.push([0x12, 0x34, 0x55, 0x00] + pageEndFrame())
        XCTAssertEqual(packets.count, 1)
        XCTAssertEqual(packets.first?.command, Command.pageEnd.rawValue)
        XCTAssertGreaterThan(decoder.rejected, 0)
    }

    func testDecoderResynchronisesAfterBadChecksum() {
        let decoder = PacketStreamDecoder()
        let corrupted = bytes("55 55 21 01 03 ff aa aa")
        let packets = decoder.push(corrupted + printEndFrame())
        XCTAssertEqual(packets.count, 1)
        XCTAssertEqual(packets.first?.command, Command.printEnd.rawValue)
    }

    func testDecoderWaitsForIncompleteFrame() {
        let decoder = PacketStreamDecoder()
        let full = setPageSizeFrame(.d110, rows: 400, cols: 96)
        XCTAssertTrue(decoder.push(Array(full.dropLast())).isEmpty)
        XCTAssertEqual(decoder.push([full.last!]).count, 1)
    }

    /// Régression : un 0x55 parasite formait un faux en-tête, la trame
    /// paraissait incomplète et le décodeur attendait indéfiniment au lieu de
    /// resynchroniser.
    func testDecoderHandlesStrayHeadByte() {
        let decoder = PacketStreamDecoder()
        XCTAssertTrue(decoder.push([0x55]).isEmpty)
        let packets = decoder.push(pageStartFrame())
        XCTAssertEqual(packets.count, 1)
        XCTAssertEqual(packets.first?.command, Command.pageStart.rawValue)
    }

    func testDecoderResetClearsBuffer() {
        let decoder = PacketStreamDecoder()
        _ = decoder.push([0x55, 0x55, 0x21])
        decoder.reset()
        XCTAssertEqual(decoder.push(pageStartFrame()).count, 1)
    }

    // MARK: - Interprétation des notifications

    func testParsePrintStatus() {
        let status = PrintStatus(data: [0x00, 0x02, 0x40, 0x01])
        XCTAssertEqual(status.page, 2)
        XCTAssertEqual(status.printProgress, 0x40)
        XCTAssertEqual(status.feedProgress, 0x01)
        XCTAssertEqual(status.error, 0)
    }

    func testParsePrintStatusToleratesShortPayload() {
        let status = PrintStatus(data: [0x00, 0x01])
        XCTAssertEqual(status.page, 1)
        XCTAssertEqual(status.printProgress, 0)
    }

    func testParsePrintStatusReadsErrorOnTenBytePayload() {
        let status = PrintStatus(data: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0x07])
        XCTAssertEqual(status.error, 0x07)
    }

    func testParsePrinterInfoBothWidths() {
        XCTAssertEqual(PrinterIdentity(data: [0x09, 0x00]).modelID, 2304)
        XCTAssertEqual(PrinterIdentity(data: [0x09]).modelID, 0x0900)
    }

    func testPacketHelpers() {
        let packet = Packet(command: 0xB3, data: [0x00, 0x02, 0x40, 0x01])
        XCTAssertEqual(packet.incoming, .printStatus)
        XCTAssertEqual(packet.firstByte, 0x00)
        XCTAssertEqual(packet.uint16(at: 0), 2)
        XCTAssertNil(packet.uint16(at: 3))
    }
}
