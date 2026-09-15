/**
 * Identifiants des éléments que `app.js` attend dans `index.html`.
 *
 * Cette liste vit dans son propre module pour être vérifiable : un test
 * confronte chaque identifiant au HTML réel, ce qui attrape la faute la plus
 * banale d'une application web — un `id` renommé d'un côté seulement, qui ne
 * produit qu'une erreur `null` à l'exécution.
 */

export const ELEMENT_IDS = Object.freeze([
  'count',
  'add-form',
  'url-input',
  'add-error',
  'search',
  'select-all',
  'select-none',
  'list',
  'empty',
  'export-xlsx',
  'export-csv',
  'export-md',
  'export-json',
  'import',
  'import-file',
  'clear',
  'preset',
  'sheet-qr',
  'sheet-info',
  'table-qr',
  'table-note',
  'density',
  'copies',
  'show-title',
  'printer-dot',
  'printer-name',
  'connect',
  'disconnect',
  'ble-support',
  'print-label',
  'print-status',
  'preview',
  'print',
  'print-root',
  'toast',
]);
