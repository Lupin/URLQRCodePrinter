/**
 * Enregistrement d'un fichier côté navigateur.
 *
 * On n'utilise ni `chrome.downloads` (absent de Safari) ni l'API File System
 * Access (`showSaveFilePicker`, absente de Safari et désactivée par défaut dans
 * Brave). L'ancre avec attribut `download` fonctionne dans tous les contextes
 * visés : page web, popup d'extension, page d'options.
 *
 * Un objet-URL est créé puis révoqué : sans révocation, le blob reste en
 * mémoire jusqu'au rechargement de la page.
 */

/**
 * Déclenche le téléchargement d'un contenu texte.
 *
 * @param {string} filename
 * @param {string} text
 * @param {{ mime?: string, document?: Document, url?: typeof URL }} [options]
 *   `document` et `url` sont injectables pour les tests.
 * @returns {boolean} true si le téléchargement a pu être déclenché.
 */
export function downloadText(filename, text, options = {}) {
  return downloadBlob(filename, new Blob([text], { type: options.mime ?? 'text/plain;charset=utf-8' }), options);
}

/**
 * Déclenche le téléchargement d'un contenu binaire.
 *
 * Utilisé pour les classeurs `.xlsx`, qui ne sont pas du texte.
 *
 * @param {string} filename
 * @param {Uint8Array} bytes
 * @param {{ mime?: string, document?: Document, url?: typeof URL }} [options]
 * @returns {boolean}
 */
export function downloadBytes(filename, bytes, options = {}) {
  const type = options.mime ?? 'application/octet-stream';
  // On copie dans un tableau neuf : un `Uint8Array` peut être une vue sur un
  // tampon plus grand, que le Blob embarquerait en entier.
  return downloadBlob(filename, new Blob([bytes.slice().buffer], { type }), options);
}

/**
 * Déclenche le téléchargement d'un Blob.
 *
 * @param {string} filename
 * @param {Blob} blob
 * @param {{ document?: Document, url?: typeof URL }} [options]
 * @returns {boolean}
 */
export function downloadBlob(filename, blob, options = {}) {
  const doc = options.document ?? globalThis.document;
  const urlApi = options.url ?? globalThis.URL;

  if (!doc || !urlApi?.createObjectURL) return false;

  const objectUrl = urlApi.createObjectURL(blob);

  const anchor = doc.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';

  doc.body.appendChild(anchor);
  anchor.click();

  // La révocation est différée largement : un navigateur lit le blob de façon
  // asynchrone, et révoquer trop tôt peut le laisser croire à un téléchargement
  // en cours — Brave affichait alors « Downloads are in progress » alors que
  // rien ne se téléchargeait plus. Une minute est sans risque : le blob est de
  // toute façon libéré à la fermeture de la page.
  const revoke = () => urlApi.revokeObjectURL(objectUrl);
  if (typeof globalThis.setTimeout === 'function') globalThis.setTimeout(revoke, 60_000);
  else revoke();

  if (anchor.parentNode) anchor.parentNode.removeChild(anchor);
  return true;
}

/**
 * Copie un texte dans le presse-papiers, avec repli sur une zone de texte.
 *
 * `navigator.clipboard` n'est pas disponible partout (et exige un contexte
 * sécurisé) ; le repli `execCommand` reste la seule option dans certains
 * contextes d'extension Safari.
 *
 * @param {string} text
 * @param {{ navigator?: Navigator, document?: Document }} [options]
 * @returns {Promise<boolean>}
 */
export async function copyText(text, options = {}) {
  const nav = options.navigator ?? globalThis.navigator;
  const doc = options.document ?? globalThis.document;

  try {
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Refus de permission ou contexte non sécurisé : on tente le repli.
  }

  if (!doc?.createElement) return false;

  try {
    const area = doc.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    doc.body.appendChild(area);
    area.select();
    const ok = doc.execCommand?.('copy') ?? false;
    doc.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
