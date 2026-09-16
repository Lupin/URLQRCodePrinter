/**
 * Vérifie l'extension Safari — ce qui peut l'être, et dit ce qui ne peut pas.
 *
 * Ce script existe parce que le README annonçait « reste à éprouver :
 * l'extension chargée dans Safari » depuis le début du projet. Voici ce que
 * l'épreuve a appris, et pourquoi le script est bâti ainsi.
 *
 * **Safari ne s'automate pas comme Brave.** `verify-brave.mjs` lance un Brave
 * isolé, charge l'extension par `--load-extension` et parle à son service
 * worker par DevTools. Safari n'a aucun équivalent :
 *
 * - `safaridriver` pilote le **vrai** Safari, avec le profil réel de
 *   l'utilisateur. Il n'y a pas de profil isolé ; le script ne touche donc à
 *   aucun réglage et ferme ses fenêtres.
 * - `POST /session/{id}/extension` — la commande WebDriver d'installation
 *   d'extension — **n'existe pas** dans SafariDriver : il répond
 *   `unknown command`. C'est constaté, pas supposé.
 * - La page `app.html`, elle, est une vraie page web : on peut la servir en
 *   HTTP et l'éprouver pour de bon. C'est ce que fait la moitié dynamique du
 *   script.
 *
 * Ce qui reste **hors de portée** est annoncé à la fin, en clair, plutôt que
 * présenté comme vérifié : chargement de l'extension par Safari, menu
 * contextuel, fenêtre de la barre d'outils, service worker. Ces points
 * dépendent de réglages de Safari que WebDriver n'expose pas.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { serve } from './serve.mjs';
import { toCsv } from '../src/core/exporters.js';
import { encodeQr, toSvg } from '../src/core/qr.js';
import { demarrerPilote, ouvrirSession } from './webdriver-safari.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXTENSION = join(ROOT, 'dist', 'extension-safari');
const APP_BUNDLE = join(
  ROOT, 'native', 'safari', 'build', 'dd', 'Build', 'Products', 'Debug',
  'URLQRCodePrinter.app',
);
const PORT = 4187;

/** URL de contrôle : volontairement longue et paramétrée. */
const URL_SOURCE = 'https://exemple.fr/article?utm_source=safari&id=42';
const URL_NETTOYEE = 'https://exemple.fr/article?id=42';

const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));

/** Exécute une commande et rend sa sortie, sans lever. */
function sortie(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  return (result.stdout ?? '').trim();
}

/**
 * Vérifie qu'un morceau de code JavaScript est syntaxiquement valide.
 *
 * @param {string} chemin
 * @returns {boolean}
 */
function syntaxeValide(chemin) {
  const resultat = spawnSync(process.execPath, ['--check', chemin], { stdio: 'ignore' });
  return resultat.status === 0;
}

/** Ports qu'un navigateur refuse par conception (liste « bad port »). */
const PORTS_INTERDITS = new Set([
  1, 7, 9, 11, 13, 15, 17, 19, 20, 21, 22, 23, 25, 37, 42, 43, 53, 69, 77, 79,
  87, 95, 101, 102, 103, 104, 109, 110, 111, 113, 115, 117, 119, 123, 135, 137,
  139, 143, 161, 179, 389, 427, 465, 512, 513, 514, 515, 526, 530, 531, 532,
  540, 548, 554, 556, 563, 587, 601, 636, 989, 990, 993, 995, 1719, 1720, 1723,
  2049, 3659, 4045, 4190, 5060, 5061, 6000, 6566, 6665, 6666, 6667, 6668, 6669,
  6679, 6697, 10080,
]);

/**
 * Choisit un port libre que le navigateur acceptera de visiter.
 *
 * Ce détail a coûté un diagnostic entier : le port 4190 est refusé par les
 * navigateurs — `fetch` lève « bad port », WebKit n'ouvre même pas la page. Un
 * serveur qui écoute sur un port interdit donne une page blanche, pas une
 * erreur lisible.
 *
 * @param {number} depart
 * @returns {Promise<number>}
 */
async function portLibre(depart) {
  for (let port = depart; port < depart + 40; port++) {
    if (PORTS_INTERDITS.has(port)) continue;
    try {
      await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(400) });
      // Quelqu'un écoute déjà : on essaie le suivant.
    } catch (error) {
      const cause = String(error?.cause?.message ?? error?.message ?? '');
      if (cause.includes('bad port')) continue;
      return port;
    }
  }
  throw new Error(`Aucun port libre à partir de ${depart}.`);
}

async function main() {
  if (!existsSync(EXTENSION)) {
    console.error(
      `Extension absente : ${EXTENSION}\nLancez d'abord « npm run build ».`,
    );
    process.exit(1);
  }

  /** @type {Array<{ ok: boolean, label: string, detail: string }>} */
  const resultats = [];
  /** Points qui ne peuvent pas être vérifiés ici, et pourquoi. */
  const horsPortee = [];

  const record = (label, ok, detail = '') => {
    resultats.push({ label, ok, detail });
    console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  };

  const pilote = await demarrerPilote({ port: 4444 });
  const portPage = await portLibre(PORT);
  const serveur = await serve({ dir: EXTENSION, port: portPage });
  const page = `http://127.0.0.1:${portPage}/app.html`;
  let safari = null;

  /**
   * Ferme la session et le pilote, même si le script est interrompu.
   *
   * Sans cela, un `Ctrl+C` laisse Safari apparié à une session morte : la
   * vérification suivante échoue alors sur `The Safari instance is already
   * paired with another WebDriver session`, un défaut qui n'existe pas. C'est
   * arrivé pendant l'écriture de ce script.
   */
  let nettoyageFait = false;
  const nettoyer = async () => {
    if (nettoyageFait) return;
    nettoyageFait = true;
    if (safari) await safari.fermer().catch(() => null);
    await serveur.close().catch(() => null);
    pilote.arreter();
  };

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      nettoyer().finally(() => process.exit(130));
    });
  }

  try {
    // ---------------------------------------------------------------------
    // 1. Préalables
    // ---------------------------------------------------------------------
    console.log('— Safari et outillage —');

    const versionSafari = sortie('defaults', [
      'read', '/Applications/Safari.app/Contents/Info.plist',
      'CFBundleShortVersionString',
    ]);
    record(
      'Safari est installé et sa version est relevée',
      versionSafari !== '',
      `Safari ${versionSafari || 'inconnu'}`,
    );

    const versionPilote = sortie('/System/Cryptexes/App/usr/bin/safaridriver', ['--version']);
    record(
      'safaridriver répond',
      versionPilote !== '',
      versionPilote.split('\n')[0],
    );

    // Le projet Xcode doit avoir été généré et compilé : sans l'application
    // conteneur, Safari n'a rien à découvrir.
    record(
      'l\'application conteneur macOS est compilée',
      existsSync(APP_BUNDLE),
      existsSync(APP_BUNDLE) ? APP_BUNDLE.replace(`${ROOT}/`, '') : 'absente — lancez npm run install:safari',
    );

    const appex = join(APP_BUNDLE, 'Contents', 'PlugIns', 'URLQRCodePrinter Extension.appex');
    if (existsSync(appex)) {
      const info = readFileSync(join(appex, 'Contents', 'Info.plist'), 'utf8');
      record(
        'l\'appex embarque bien le point d\'extension Safari',
        info.includes('com.apple.Safari.web-extension')
          || sortie('plutil', ['-p', join(appex, 'Contents', 'Info.plist')])
            .includes('com.apple.Safari.web-extension'),
        'NSExtensionPointIdentifier',
      );
    } else {
      record('l\'appex de l\'extension est présente dans l\'application', false, appex);
    }

    // ---------------------------------------------------------------------
    // 2. Le paquet de l'extension, statiquement
    // ---------------------------------------------------------------------
    console.log('\n— Le paquet de l\'extension —');

    const manifeste = JSON.parse(readFileSync(join(EXTENSION, 'manifest.json'), 'utf8'));

    record(
      'le manifeste est en version 3',
      manifeste.manifest_version === 3,
      `manifest_version ${manifeste.manifest_version}`,
    );

    record(
      'le service worker est déclaré et présent sur le disque',
      manifeste.background?.service_worker === 'background.js'
        && existsSync(join(EXTENSION, 'background.js')),
      manifeste.background?.service_worker ?? 'non déclaré',
    );

    record(
      'la clé browser_specific_settings vise Safari 16.4 ou plus',
      manifeste.browser_specific_settings?.safari?.strict_min_version
        >= '16.4',
      `strict_min_version ${manifeste.browser_specific_settings?.safari?.strict_min_version ?? 'absente'}`,
    );

    // Un `import` dans un fichier du paquet ne serait pas une faute de style :
    // Safari répond « Unable to find "core/store.js" in the extension's
    // resources » et l'extension ne démarre pas. `scripts/bundle.mjs` aplatit
    // donc les modules, et l'on vérifie ici que le résultat l'est bien.
    //
    // La détection s'appuie sur une propriété de l'assembleur plutôt que sur un
    // lexeur JavaScript : il écrit chaque déclaration en début de ligne. Un
    // lexeur écrit ici a d'abord été essayé — il se désynchronisait sur les
    // gabarits imbriqués et sur les backticks contenus dans les commentaires,
    // et déclarait un échec à cause du mot « export » d'une phrase en français.
    // `node --check`, exécuté juste après, écarte par ailleurs toute syntaxe
    // invalide : les deux contrôles se complètent.
    const declarationEnTete = (source) => source
      .split('\n')
      .filter((ligne) => /^(import|export)\b/.test(ligne));

    const avecImport = readdirSync(EXTENSION)
      .filter((nom) => nom.endsWith('.js'))
      .filter((nom) => declarationEnTete(readFileSync(join(EXTENSION, nom), 'utf8')).length > 0);

    record(
      'aucun fichier du paquet ne contient de déclaration d\'import ou d\'export',
      avecImport.length === 0,
      avecImport.length === 0
        ? 'modules aplatis par scripts/bundle.mjs'
        : `à plat incomplet : ${avecImport.join(', ')}`,
    );

    const scripts = readdirSync(EXTENSION).filter((nom) => nom.endsWith('.js'));
    const invalides = scripts.filter((nom) => !syntaxeValide(join(EXTENSION, nom)));
    record(
      'chaque script du paquet est syntaxiquement valide',
      invalides.length === 0,
      invalides.length === 0 ? `${scripts.length} fichiers` : invalides.join(', '),
    );

    // Tous les fichiers cités par le manifeste doivent exister : un chemin
    // fantôme ne se voit qu'au chargement, dans Safari, sans message clair.
    const cites = [
      manifeste.background?.service_worker,
      manifeste.action?.default_popup,
      ...Object.values(manifeste.icons ?? {}),
      ...Object.values(manifeste.action?.default_icon ?? {}),
    ].filter(Boolean);
    const manquants = [...new Set(cites)].filter((nom) => !existsSync(join(EXTENSION, nom)));
    record(
      'tous les fichiers cités par le manifeste existent',
      manquants.length === 0,
      manquants.length === 0 ? `${new Set(cites).size} fichiers` : `manquants : ${manquants.join(', ')}`,
    );

    // ---------------------------------------------------------------------
    // 3. Session Safari
    // ---------------------------------------------------------------------
    console.log('\n— Session Safari —');

    safari = await ouvrirSession({ port: 4444 });
    record(
      'une session WebDriver s\'ouvre sur le Safari réel',
      true,
      `Safari ${safari.capabilities.browserVersion} · macOS ${safari.capabilities['safari:platformVersion']}`,
    );

    // Constaté : la commande d'installation d'extension n'existe pas. On le
    // vérifie ici plutôt que de le supposer, parce que toute la stratégie de
    // vérification en dépend.
    const installation = await safari.send('POST', `/session/${safari.sessionId}/extension`, {
      path: EXTENSION,
    });
    record(
      'SafariDriver n\'expose pas d\'installation d\'extension par WebDriver',
      installation.value?.error === 'unknown command',
      installation.value?.error === 'unknown command'
        ? 'aucun chargement automatique possible — réglage manuel dans Safari'
        : `réponse inattendue : ${JSON.stringify(installation.value)?.slice(0, 120)}`,
    );

    // ---------------------------------------------------------------------
    // 4. La page app.html, pour de bon
    // ---------------------------------------------------------------------
    console.log('\n— L\'application dans Safari —');

    await safari.aller(page);
    await safari.installerCollecteErreurs();
    await sleep(2500);

    const titre = await safari.titre();
    record(
      'app.html se charge et son titre est celui de l\'application',
      titre === 'Mes liens — URLQRCodePrinter',
      titre,
    );

    const html = await safari.evaluer('document.documentElement.lang');
    record('la page est servie en français', html === 'fr', `lang="${html}"`);

    // Le démarrage de l'application : les listes déroulantes ne sont remplies
    // que par `app.js`, donc leur contenu prouve que le script a bien tourné.
    const amorcage = await safari.evaluer(`({
      cibles: document.querySelectorAll('#qr-target option').length,
      planches: document.querySelectorAll('#preset option').length,
      raccourcisseurs: document.querySelectorAll('#shortener option').length,
      boutons: document.querySelectorAll('button').length,
      feuilles: document.styleSheets.length,
    })`);

    record(
      'le script principal s\'exécute et remplit l\'interface',
      amorcage.cibles > 0 && amorcage.planches > 0 && amorcage.boutons > 10,
      `${amorcage.cibles} cibles QR, ${amorcage.planches} planches, ${amorcage.raccourcisseurs} raccourcisseurs, ${amorcage.boutons} boutons`,
    );

    record(
      'la feuille de style est appliquée',
      amorcage.feuilles >= 1
        && await safari.evaluer('getComputedStyle(document.body).margin !== ""'),
      `${amorcage.feuilles} feuille(s)`,
    );

    record(
      'le bandeau « feuille de style obsolète » reste caché',
      (await safari.evaluer('document.getElementById("stale-style").hidden')) === true,
      'le style servi est bien celui du build',
    );

    // ---------------------------------------------------------------------
    // 5. Ce que Safari n'a pas
    // ---------------------------------------------------------------------
    console.log('\n— Capacités absentes de Safari —');

    const bluetooth = await safari.evaluer('typeof navigator.bluetooth');
    record(
      'Web Bluetooth est absent de Safari',
      bluetooth === 'undefined',
      'WebKit ne l\'implémente sur aucune version',
    );

    const picker = await safari.evaluer('typeof window.showSaveFilePicker');
    record(
      'l\'API File System Access est absente de Safari',
      picker === 'undefined',
      'l\'export ne peut donc pas passer par un sélecteur de fichier',
    );

    // L'application doit le dire, pas laisser un bouton mort. On lit le
    // message tel qu'il s'affiche, sans supposer son texte.
    const messageBle = (await safari.evaluer(
      'document.getElementById("ble-support").textContent.trim()',
    )).replace(/\s+/g, ' ');
    const boutonConnecter = await safari.evaluer('document.getElementById("connect").disabled');

    record(
      'l\'onglet Niimbot annonce l\'absence de Web Bluetooth au lieu de la subir',
      messageBle.includes('Web Bluetooth n\'est pas disponible')
        && messageBle.includes('Safari'),
      messageBle.slice(0, 150),
    );

    record(
      'le bouton de connexion à l\'imprimante reste inactif',
      boutonConnecter === true,
      'un bouton actif échouerait après le clic, en anglais',
    );

    // ---------------------------------------------------------------------
    // 6. Collecte et rendu
    // ---------------------------------------------------------------------
    console.log('\n— Collecte et rendu —');

    await safari.evaluer(`(() => {
      const champ = document.getElementById('url-input');
      champ.value = ${JSON.stringify(URL_SOURCE)};
      champ.dispatchEvent(new Event('input', { bubbles: true }));
      document.getElementById('add-form')
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return true;
    })()`);

    await sleep(1800);

    const liste = await safari.evaluer(`({
      compteur: document.getElementById('count').textContent,
      liens: document.querySelectorAll('#list .link').length,
      premier: (document.querySelector('#list .link') || {}).textContent || '',
      erreur: document.getElementById('add-error').hidden
        ? ''
        : document.getElementById('add-error').textContent,
    })`);

    record(
      'un lien ajouté apparaît dans la liste',
      liste.liens === 1 && liste.compteur === '1 lien' && liste.erreur === '',
      `${liste.compteur}, texte « ${liste.premier.replace(/\s+/g, ' ').trim().slice(0, 60)} »`,
    );

    record(
      'l\'URL est normalisée comme dans le cœur : les paramètres de suivi partent',
      liste.premier.includes(URL_NETTOYEE) && !liste.premier.includes('utm_source'),
      URL_NETTOYEE,
    );

    const apercu = await safari.evaluer(`({
      cadres: document.querySelectorAll('#preview .preview__frame').length,
      cellules: document.querySelectorAll('#preview .print-cell').length,
      qr: document.querySelectorAll('#preview .print-cell__qr svg').length,
      page: (document.querySelector('#preview .print-page') || {}).style
        ? document.querySelector('#preview .print-page').style.width : '',
    })`);

    record(
      'l\'aperçu de planche est réellement composé',
      apercu.cadres === 1 && apercu.cellules === 1 && apercu.qr === 1,
      `${apercu.cadres} page(s), ${apercu.cellules} étiquette(s), ${apercu.qr} QR`,
    );

    // Le QR de la page est comparé **module à module** à celui que le cœur
    // encode hors navigateur. C'est l'observable qui change quand et seulement
    // quand l'encodage change.
    //
    // La comparaison ne porte pas sur la chaîne SVG : le DOM la sérialise
    // autrement (`<rect …></rect>` au lieu de `<rect …/>`), et trois tentatives
    // de normalisation textuelle ont chacune produit un décalage différent.
    // Elle porte sur la matrice, extraite du tracé `d`. Attention à l'échelle :
    // les coordonnées du tracé se lisent en pixels de viewBox, et le viewBox
    // vaut `taille × échelle` — il faut donc diviser par l'échelle pour retomber
    // sur les indices de modules. L'oublier donnait un décalage d'un module sur
    // la dernière rangée, et un faux échec.
    const matrice = await safari.evaluer(`(() => {
      const svg = document.querySelector('#preview .print-cell__qr svg');
      const chemin = svg.querySelector('path').getAttribute('d');
      const modules = [...chemin.matchAll(/M(\\d+) (\\d+)h(\\d+)/g)]
        .map((m) => [Number(m[1]), Number(m[2]), Number(m[3])]);
      const pas = modules.length ? modules[0][2] : 0;
      const indices = modules.map(([x, y]) => [x / pas, y / pas]);
      const taille = Math.max(...indices.map(([x, y]) => Math.max(x, y))) + 1;
      const cases = Array.from({ length: taille }, () => new Array(taille).fill(0));
      let hors = 0;
      for (const [x, y] of indices) {
        if (x < 0 || y < 0 || x >= taille || y >= taille) { hors++; continue; }
        cases[y][x] = 1;
      }
      return { pas, taille, cases, hors, viewBox: svg.getAttribute('viewBox') };
    })()`);

    const attendue = encodeQr(URL_NETTOYEE, { ecc: 'M', border: 1 });
    const attendu = attendue.data.map((ligne) => ligne.map((valeur) => (valeur ? 1 : 0)));

    // La comparaison parcourt toute la matrice du cœur, pas seulement la zone
    // dessinée par le navigateur : un module sombre émis hors de cette zone
    // serait ainsi compté comme un écart, au lieu d'être ignoré.
    //
    // La taille lue (`matrice.taille`) n'est qu'un repère : elle se déduit des
    // coordonnées émises, et vaut un cran de moins quand la dernière rangée est
    // blanche — c'est le cas ici, la bordure du QR étant blanche par
    // construction. La taille qui fait foi est celle du cœur, `attendue.size`.
    let ecarts = 0;
    let premier = null;
    for (let y = 0; y < attendue.size; y++) {
      for (let x = 0; x < attendue.size; x++) {
        const lue = matrice.cases[y]?.[x] ?? 0;
        if (lue !== attendu[y][x]) {
          ecarts++;
          if (!premier) premier = [x, y];
        }
      }
    }

    record(
      'le QR rendu par Safari est identique à celui du cœur, module pour module',
      matrice.hors === 0 && ecarts === 0,
      `cœur ${attendue.size} × ${attendue.size}, zone dessinée ${matrice.taille} × ${matrice.taille}, `
        + `${matrice.cases.flat().filter(Boolean).length} modules sombres, `
        + `${ecarts} écart(s)${premier ? ` — premier en ${premier}` : ''}, échelle ${matrice.pas}`,
    );

    // ---------------------------------------------------------------------
    // 7. Exports : ce qui sortirait, sans écrire chez l'utilisateur
    // ---------------------------------------------------------------------
    console.log('\n— Exports —');

    // L'ancre `download` est le seul mécanisme d'enregistrement disponible
    // (ni `browser.downloads`, ni File Access). On intercepte donc `click` et
    // `URL.createObjectURL` : on mesure ce qui serait écrit, sans rien écrire.
    await safari.executer(`(() => {
      window.__safariCaptures = [];
      const vraiCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = function (blob) {
        window.__safariDernierBlob = blob;
        return vraiCreateObjectURL.call(URL, blob);
      };
      const vraiCreateElement = document.createElement.bind(document);
      document.createElement = function (nom, ...reste) {
        const noeud = vraiCreateElement(nom, ...reste);
        if (String(nom).toLowerCase() === 'a') {
          noeud.click = function () {
            window.__safariCaptures.push({
              nom: this.download || '',
              href: String(this.href).split(':')[0],
            });
          };
        }
        return noeud;
      };
      return true;
    })()`);

    const declencher = async (bouton) => {
      await safari.executer('(() => { window.__safariCaptures.length = 0; return true; })()');
      const actif = await safari.evaluer(`!document.getElementById('${bouton}').disabled`);
      if (!actif) return { actif: false, capture: null, blob: null };
      await safari.evaluer(`document.getElementById('${bouton}').click()`);
      await sleep(1000);
      const capture = await safari.evaluer('window.__safariCaptures[0] ?? null');
      // Le contenu est lu **en octets**, pas seulement en texte : `Blob.text()`
      // retire le BOM UTF-8, et c'est justement ce BOM qui permet de comparer
      // l'export à la sortie du cœur octet pour octet.
      const blob = await safari.evaluerAsync(`(async () => {
        const b = window.__safariDernierBlob;
        if (!b) return null;
        const octets = new Uint8Array(await b.arrayBuffer());
        return { type: b.type, taille: b.size, octets: Array.from(octets) };
      })()`);
      if (blob) blob.texte = Buffer.from(blob.octets).toString('utf8');
      return { actif: true, capture, blob };
    };

    const csv = await declencher('export-csv');
    record(
      'l\'export CSV déclenche un enregistrement de fichier',
      csv.actif && csv.capture?.href === 'blob' && /\.csv$/.test(csv.capture?.nom ?? ''),
      csv.actif ? `${csv.capture?.nom} · ${csv.blob?.taille} octets` : 'bouton inactif',
    );

    // Le fichier exporté est comparé **octet pour octet** à ce que le cœur
    // produit pour le même lien : deux chemins indépendants — Safari d'un côté,
    // Node de l'autre — qui doivent écrire exactement le même fichier.
    const lien = {
      url: URL_NETTOYEE,
      title: '',
      tags: [],
      note: '',
      createdAt: Date.now(),
      source: 'manual',
    };
    const csvAttendu = toCsv([lien]);
    const octetsAttendus = Buffer.from(csvAttendu, 'utf8');

    record(
      'le fichier CSV exporté par Safari est identique à celui du cœur, octet pour octet',
      csv.blob
        && csv.blob.taille === octetsAttendus.length
        && Buffer.from(csv.blob.octets).equals(octetsAttendus),
      csv.blob
        ? `${csv.blob.taille} octets · BOM UTF-8 ${csv.blob.octets[0] === 0xEF
          && csv.blob.octets[1] === 0xBB && csv.blob.octets[2] === 0xBF ? 'présent' : 'ABSENT'}`
        : 'aucun blob',
    );

    record(
      'le CSV exporté contient l\'URL normalisée',
      (csv.blob?.texte ?? '').includes(URL_NETTOYEE)
        && !(csv.blob?.texte ?? '').includes('utm_source'),
      (csv.blob?.texte ?? '').split('\r\n')[1]?.slice(0, 70) ?? '',
    );

    const md = await declencher('export-md');
    record(
      'l\'export Markdown déclenche un enregistrement de fichier',
      md.actif && md.capture?.href === 'blob' && /\.md$/.test(md.capture?.nom ?? ''),
      md.actif ? `${md.capture?.nom} · ${md.blob?.taille} octets` : 'bouton inactif',
    );

    const json = await declencher('export-json');
    let jsonValide = false;
    let jsonDetail = '';
    try {
      const parsed = JSON.parse(json.blob?.texte ?? '');
      const entree = Array.isArray(parsed?.links)
        ? parsed.links.find((candidat) => candidat.url === URL_NETTOYEE)
        : null;
      jsonValide = Boolean(entree) && parsed.count === 1;
      jsonDetail = entree
        ? `format ${parsed.format}, count ${parsed.count}`
        : 'lien absent du JSON';
    } catch (error) {
      jsonDetail = `JSON illisible : ${error.message}`;
    }
    record(
      'l\'export JSON est un document valide qui contient l\'URL normalisée',
      json.actif && json.capture?.href === 'blob' && jsonValide,
      json.actif
        ? `${json.capture?.nom} · ${json.blob?.taille} octets · ${jsonDetail}`
        : 'bouton inactif',
    );

    // ---------------------------------------------------------------------
    // 8. Rendu Niimbot et impression
    // ---------------------------------------------------------------------
    console.log('\n— Étiquette Niimbot, images et impression —');

    await safari.evaluer('document.querySelector(".tab[data-mode=\'images\']").click()');
    await sleep(1500);

    const images = await safari.evaluer(`(() => {
      const c = document.querySelector('#preview canvas');
      if (!c) return { canvas: 0 };
      const donnees = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let sombres = 0;
      for (let i = 0; i < donnees.length; i += 4) if (donnees[i] < 128) sombres++;
      return {
        canvas: document.querySelectorAll('#preview canvas').length,
        largeur: c.width, hauteur: c.height, sombres,
        png: c.toDataURL('image/png').startsWith('data:image/png;base64,iVBOR'),
        export: !document.getElementById('export-labels').disabled,
      };
    })()`);

    record(
      'l\'onglet Images compose un canevas réellement encré et un PNG valide',
      images.canvas === 1 && images.sombres > 100 && images.png === true,
      images.canvas ? `${images.largeur}×${images.hauteur} px, ${images.sombres} pixels d'encre, signature PNG` : 'aucun canevas',
    );

    record(
      'l\'export d\'images (ZIP) est disponible — la voie utile sans Web Bluetooth',
      images.export === true,
      'bouton actif',
    );

    await safari.evaluer('document.querySelector(".tab[data-mode=\'single\']").click()');
    await sleep(1500);

    const etiquette = await safari.evaluer(`({
      canvas: document.querySelectorAll('#preview canvas').length,
      texte: document.getElementById('preview').textContent.trim().replace(/[ ]+/g, ' ').slice(0, 90),
    })`);

    record(
      'l\'aperçu d\'étiquette Niimbot se compose sans imprimante connectée',
      etiquette.canvas === 1 && /D110/.test(etiquette.texte),
      etiquette.texte,
    );

    await safari.evaluer('document.querySelector(".tab[data-mode=\'sheet\']").click()');
    await sleep(1200);

    const impression = await safari.evaluer(`({
      api: typeof window.print,
      desactive: document.getElementById('print').disabled,
      libelle: document.getElementById('print').textContent.trim(),
      page: [...document.querySelectorAll('style')]
        .map((e) => e.textContent)
        .filter((t) => t.includes('@page'))[0] ?? '',
    })`);

    record(
      'le bouton d\'impression est prêt et nomme sa portée',
      impression.desactive === false && impression.libelle !== '',
      `« ${impression.libelle} »`,
    );

    record(
      'la taille de papier @page est posée pour l\'impression',
      /@page\s*\{\s*size:\s*210mm\s+297mm/.test(impression.page),
      impression.page.trim().slice(0, 60),
    );

    // ---------------------------------------------------------------------
    // 9. Aucune erreur pendant tout le parcours
    // ---------------------------------------------------------------------
    const erreurs = await safari.erreurs();
    record(
      'aucune erreur JavaScript ni promesse rejetée pendant le parcours',
      erreurs.erreurs.length === 0 && erreurs.promesses.length === 0,
      erreurs.erreurs.length + erreurs.promesses.length === 0
        ? 'collecte armée avant le chargement de la page'
        : JSON.stringify(erreurs).slice(0, 160),
    );

    const journal = await safari.journal();
    const graves = journal.filter((entrée) => entrée.level === 'SEVERE');
    record(
      'aucune erreur grave dans la console de Safari',
      graves.length === 0,
      graves.length === 0
        ? `${journal.length} entrée(s) de journal`
        : graves.map((e) => String(e.message).slice(0, 80)).join(' | '),
    );
  } catch (error) {
    record('vérification interrompue', false, error.message);
  } finally {
    await nettoyer();
  }

  // -----------------------------------------------------------------------
  // Ce que ce script ne peut pas prouver, dit plutôt que tu
  // -----------------------------------------------------------------------
  horsPortee.push(
    'le chargement de l\'extension par Safari (réglages → Extensions) : WebDriver ne connaît pas de commande d\'installation, et Safari n\'a pas de profil isolé',
    'le menu contextuel « Enregistrer cette page / ce lien » : il n\'existe que dans le processus d\'extension, invisible depuis une page',
    'la fenêtre de la barre d\'outils et le badge de l\'icône : même raison',
    'le service worker et la lecture de l\'onglet actif par « Ajouter cette page » : idem',
  );

  const échecs = resultats.filter((entrée) => !entrée.ok);
  console.log(`\n${resultats.length - échecs.length}/${resultats.length} vérifications réussies.`);

  console.log('\nCe que ce script ne peut pas vérifier, et pourquoi :');
  for (const point of horsPortee) console.log(`  · ${point}`);

  console.log('\nCe qui reste à faire une fois, à la main, dans Safari, dans cet ordre :');
  console.log('  1. npm run install:safari — compile et lance l\'application conteneur,');
  console.log('     sans quoi Safari ne connaît pas encore l\'extension');
  console.log('  2. Safari → Réglages → Avancé → « Afficher le menu Développeur »');
  console.log('  3. menu Développeur → « Autoriser les extensions non signées »');
  console.log('  4. Réglages → Extensions → cocher « URLQRCodePrinter »');
  console.log('');
  console.log('Les étapes 2 à 4 sont des réglages de Safari : ni WebDriver ni un script');
  console.log('ne peuvent les écrire, et les modifier d\'autorité changerait la');
  console.log('configuration du navigateur de l\'utilisateur sans son accord.');

  process.exit(échecs.length === 0 ? 0 : 1);
}

await main();
