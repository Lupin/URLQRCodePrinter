/**
 * Export tableur, avec les QR codes intégrés.
 *
 * Un CSV ne peut pas transporter d'image : c'est la raison d'être de cet
 * export, qui produit un vrai classeur `.xlsx` où chaque ligne porte son QR.
 *
 * La construction du classeur vit dans `core/xlsx.js` ; ce module ne fait que
 * décider de sa mise en forme — quelles colonnes, quelle taille d'image, quels
 * en-têtes.
 */

import { hostOf } from './link.js';
import { qrPng } from './qr.js';
import { buildXlsx } from './xlsx.js';
import { formatDateTime } from './exporters.js';

/** Taille d'image visée, en pixels, avant réduction au besoin. */
const QR_TARGET_PX = 128;

/** En-têtes du classeur, dans l'ordre des colonnes. */
export const SPREADSHEET_HEADERS = ['N°', 'URL', 'Titre', 'Domaine', 'Tags', 'Ajouté le', 'QR code'];

/** Index de la colonne qui reçoit les images. */
export const QR_COLUMN_INDEX = SPREADSHEET_HEADERS.indexOf('QR code');

/**
 * Construit le classeur des liens, avec leurs QR codes.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @param {{ now?: number, onProgress?: (done: number, total: number) => void }} [options]
 * @returns {Promise<Uint8Array>}
 */
export async function buildLinkSpreadsheet(links, options = {}) {
  const now = options.now ?? Date.now();

  const rows = links.map((link, index) => [
    index + 1,
    link.url,
    link.title,
    hostOf(link.url),
    link.tags.map((tag) => `#${tag}`).join(' '),
    formatDateTime(link.createdAt),
    // La cellule sous l'image reste vide : le QR est ancré par-dessus.
    '',
  ]);

  const images = [];
  for (const [index, link] of links.entries()) {
    const png = await qrPng(link.url, { scale: 8, maxSize: QR_TARGET_PX, border: 2 });
    // `row` compte la ligne d'en-tête : les données commencent à la ligne 1.
    images.push({
      row: index + 1,
      column: QR_COLUMN_INDEX,
      data: png,
      widthPx: QR_TARGET_PX,
      heightPx: QR_TARGET_PX,
    });
    options.onProgress?.(index + 1, links.length);
  }

  const widths = [5, 55, 32, 20, 18, 17, 14];

  return buildXlsx({
    sheetName: 'Liens',
    headers: SPREADSHEET_HEADERS,
    rows,
    images,
    widths,
    date: new Date(now),
  });
}
