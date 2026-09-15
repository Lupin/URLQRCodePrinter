/**
 * Écriture de classeurs `.xlsx`, sans dépendance.
 *
 * Un `.xlsx` est une archive ZIP de fichiers XML. On l'écrit directement plutôt
 * que d'embarquer une bibliothèque : le besoin est modeste — un tableau, des
 * images ancrées dans une colonne — et cela évite d'alourdir l'extension, qui
 * embarque déjà ce code.
 *
 * Un CSV ne peut pas contenir d'image : c'est la raison d'être de ce module.
 * Les QR codes sont intégrés comme parties `xl/media/*.png`, référencées par le
 * dessin de la feuille.
 */

import { createZip } from './zip.js';

/** Un pixel à 96 dpi, exprimé en EMU — l'unité des dessins Office. */
const EMU_PER_PIXEL = 9525;

/**
 * Échappe un texte pour le XML.
 * @param {unknown} value
 * @returns {string}
 */
function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // Les caractères de contrôle sont interdits en XML 1.0 : Excel refuse
    // d'ouvrir un classeur qui en contient.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
}

/**
 * Convertit un index de colonne (0-based) en lettre Excel : 0 → A, 26 → AA.
 * @param {number} index
 * @returns {string}
 */
export function columnLetter(index) {
  let n = index;
  let letters = '';
  do {
    letters = String.fromCharCode(65 + (n % 26)) + letters;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return letters;
}

/** Déclaration des types de parties. */
const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="png" ContentType="image/png"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

/** Styles : le seul dont on a besoin est un gras pour la ligne d'en-tête. */
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="2">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

/**
 * Construit une feuille de calcul.
 *
 * @param {Array<Array<string|number>>} rows
 * @param {number[]} widths Largeurs de colonnes, en caractères.
 * @param {Map<number, number>} rowHeights Hauteurs de lignes imposées, en points.
 * @returns {string}
 */
function buildSheet(rows, widths, rowHeights) {
  const cols = widths.length > 0
    ? `<cols>${widths
        .map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`)
        .join('')}</cols>`
    : '';

  const body = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => {
          const reference = `${columnLetter(columnIndex)}${rowIndex + 1}`;
          if (typeof value === 'number' && Number.isFinite(value)) {
            return `<c r="${reference}"><v>${value}</v></c>`;
          }
          const style = rowIndex === 0 ? ' s="1"' : '';
          return `<c r="${reference}"${style} t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
        })
        .join('');

      const height = rowHeights.get(rowIndex);
      const attributes = height ? ` ht="${height}" customHeight="1"` : '';
      return `<row r="${rowIndex + 1}"${attributes}>${cells}</row>`;
    })
    .join('');

  const drawing = rowHeights.size > 0 ? '<drawing r:id="rId1"/>' : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
${cols}<sheetData>${body}</sheetData>${drawing}</worksheet>`;
}

/**
 * Construit le dessin : une image ancrée par QR code.
 *
 * @param {Array<{ row: number, column: number, widthPx: number, heightPx: number }>} images
 * @returns {string}
 */
function buildDrawing(images) {
  const anchors = images
    .map((image, index) => {
      const cx = image.widthPx * EMU_PER_PIXEL;
      const cy = image.heightPx * EMU_PER_PIXEL;
      return `<xdr:oneCellAnchor>
<xdr:from><xdr:col>${image.column}</xdr:col><xdr:colOff>${EMU_PER_PIXEL}</xdr:colOff><xdr:row>${image.row}</xdr:row><xdr:rowOff>${EMU_PER_PIXEL}</xdr:rowOff></xdr:from>
<xdr:ext cx="${cx}" cy="${cy}"/>
<xdr:pic>
<xdr:nvPicPr><xdr:cNvPr id="${index + 2}" name="QR ${index + 1}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>
<xdr:blipFill><a:blip r:embed="rId${index + 1}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>
<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr>
</xdr:pic>
<xdr:clientData/>
</xdr:oneCellAnchor>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
${anchors}</xdr:wsDr>`;
}

/**
 * Assemble un classeur `.xlsx`.
 *
 * @param {{
 *   sheetName?: string,
 *   headers: string[],
 *   rows: Array<Array<string|number>>,
 *   images?: Array<{ row: number, column: number, data: Uint8Array, widthPx: number, heightPx: number }>,
 *   widths?: number[],
 *   date?: Date,
 * }} options
 *   `rows` contient les données **sans** la ligne d'en-tête ; `images[].row` est
 *   l'index 0-based dans la feuille, en-tête compris.
 * @returns {Promise<Uint8Array>}
 */
export async function buildXlsx(options) {
  const sheetName = options.sheetName ?? 'Liens';
  const headers = options.headers ?? [];
  const rows = options.rows ?? [];
  const images = options.images ?? [];

  const allRows = [headers, ...rows];
  const widths = options.widths
    ?? headers.map((header, index) => {
      const longest = Math.max(
        String(header).length,
        ...rows.map((row) => String(row[index] ?? '').length),
      );
      // Excel exprime les largeurs en caractères ; on borne pour rester lisible.
      return Math.min(60, Math.max(8, longest + 2));
    });

  // Une ligne portant un QR doit être assez haute pour l'afficher.
  const rowHeights = new Map();
  for (const image of images) {
    const points = Math.ceil(image.heightPx * 0.75) + 4;
    rowHeights.set(image.row, Math.max(rowHeights.get(image.row) ?? 0, points));
  }

  const entries = [
    { name: '[Content_Types].xml', data: CONTENT_TYPES },
    { name: '_rels/.rels', data: ROOT_RELS },
    {
      name: 'xl/workbook.xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    { name: 'xl/styles.xml', data: STYLES },
    { name: 'xl/worksheets/sheet1.xml', data: buildSheet(allRows, widths, rowHeights) },
  ];

  if (images.length > 0) {
    entries.push({
      name: 'xl/worksheets/_rels/sheet1.xml.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`,
    });

    entries.push({ name: 'xl/drawings/drawing1.xml', data: buildDrawing(images) });

    entries.push({
      name: 'xl/drawings/_rels/drawing1.xml.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${images
  .map(
    (_, index) =>
      `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${index + 1}.png"/>`,
  )
  .join('')}
</Relationships>`,
    });

    images.forEach((image, index) => {
      entries.push({ name: `xl/media/image${index + 1}.png`, data: image.data });
    });
  }

  return createZip(entries, { date: options.date });
}
