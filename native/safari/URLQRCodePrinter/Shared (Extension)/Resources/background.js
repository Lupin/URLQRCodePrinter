// background.js — fichier assemblé par scripts/build.mjs.
// Ne pas modifier ici : éditez les modules de src/ et reconstruisez.

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/locales/en.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Traductions anglaises.
 *
 * Les clés sont les messages français **tels qu'ils apparaissent dans le code**
 * (interface, infobulles, messages transitoires). Un message absent d'ici
 * s'affiche en français : la table peut donc être complétée sans jamais casser
 * l'interface. `test/i18n.test.js` vérifie qu'aucune clé employée ne manque.
 */
const EN_MESSAGES = {
  // -------------------------------------------------------------------------
  // Fenêtre de l'extension
  // -------------------------------------------------------------------------
  "Liens enregistrés :": "Saved links:",
  "Liens enregistrés": "Saved links",
  "Ajouter la page courante": "Add the current page",
  "Ajouter cette page": "Add this page",
  "Aucun lien pour l'instant.": "No links yet.",
  "Utilisez le clic droit sur une page ou un lien.": "Right-click a page or a link to save it.",
  "Voir les QR codes": "View the QR codes",
  "Tout effacer": "Clear all",
  "Chargement…": "Loading…",
  "lien": "link",
  "liens": "links",
  "Cette page ne peut pas être enregistrée.": "This page cannot be saved.",
  "Lien supprimé": "Link deleted",
  "Rien à enregistrer sur cette page": "Nothing to save on this page",
  "Déjà enregistré": "Already saved",
  "Page ajoutée": "Page added",
  "Liste vidée": "List cleared",
  "Téléchargement impossible": "Download failed",
  "{filename} enregistré": "{filename} saved",
  " (ouvre un nouvel onglet)": " (opens in a new tab)",
  "Supprimer": "Delete",
  "Supprimer « {title} »": "Delete “{title}”",
  "{label} : aucune réponse après {ms} ms": "{label}: no response after {ms} ms",
  "tabs.query": "tabs.query",
  "lecture de l'onglet": "reading the tab",
  "Démarrage impossible": "Startup failed",
  "API détectée :": "API detected:",
  "{message} — API détectée : {api}": "{message} — detected API: {api}",
  "Erreur :": "Error:",

  // -------------------------------------------------------------------------
  // Menus contextuels
  // -------------------------------------------------------------------------
  "Ajouter cette page à URLQRCodePrinter": "Add this page to URLQRCodePrinter",
  "Ajouter ce lien à URLQRCodePrinter": "Add this link to URLQRCodePrinter",
  "Ajouter « %s » à URLQRCodePrinter": "Add “%s” to URLQRCodePrinter",
  "Ouvrir URLQRCodePrinter": "Open URLQRCodePrinter",

  // -------------------------------------------------------------------------
  // Application — coquille HTML
  // -------------------------------------------------------------------------
  "Collectez vos liens, imprimez-les en QR codes.": "Collect your links, print them as QR codes.",
  "Feuille de style obsolète.": "Outdated stylesheet.",
  "Le navigateur utilise une ancienne version du style : l'aperçu de la planche ne reflète pas ce qui sera imprimé.": "The browser is using an old version of the stylesheet: the sheet preview does not reflect what will be printed.",
  "Rechargez l'extension (↻ dans brave://extensions), puis rouvrez cette page. Si cela persiste, videz le cache du navigateur.": "Reload the extension (↻ in brave://extensions), then reopen this page. If it persists, clear the browser cache.",
  "Ma collection": "My collection",
  "Nom de la collection": "Collection name",
  "Mes liens": "My links",
  "URL à ajouter": "URL to add",
  "https://exemple.com/page": "https://example.com/page",
  "Ajouter": "Add",
  "Rechercher": "Search",
  "Rechercher…": "Search…",
  "Raccourcir les liens": "Shorten links",
  "(option)": "(optional)",
  "Raccourcir": "Shorten",
  "Retirer": "Remove",
  "Service": "Service",
  "TinyURL — recommandé": "TinyURL — recommended",
  "is.gd — sans statistiques": "is.gd — no statistics",
  "v.gd — avertissement avant redirection": "v.gd — warning before redirect",
  "spoo.me — statistiques de clics": "spoo.me — click statistics",
  "Tout sélectionner": "Select all",
  "Aucun lien.": "No links.",
  "Ajoutez-en un ci-dessus, importez une archive, ou utilisez l'extension navigateur pour les collecter au clic droit.": "Add one above, import an archive, or use the browser extension to collect them by right-clicking.",
  "Exporter": "Export",
  "Tableur + QR": "Spreadsheet + QR",
  "Archive": "Archive",
  "Importer…": "Import…",
  "Relit l'archive JSON, le dossier d'étiquettes .zip ou un CSV exporté d'ici": "Reads back the JSON archive, the .zip label folder or a CSV exported from here",
  "Importer relit l'Archive, le .zip d'étiquettes ou un CSV ; les liens déjà présents sont ignorés.": "Import reads back the Archive, the label .zip or a CSV; links already present are ignored.",
  "Mise en forme": "Layout",
  "Le QR code pointe vers": "The QR code points to",
  "Planche d'étiquettes": "Label sheet",
  "Tableau": "Table",
  "Étiquette Niimbot": "Niimbot label",
  "Étiquette (divers)": "Label (misc.)",
  "Disposition": "Layout",
  "Largeur du QR": "QR width",
  "Taille du texte (pt)": "Text size (pt)",
  "Sous chaque QR": "Below each QR",
  "URL": "URL",
  "Date de collecte": "Collection date",
  "Avec l'heure": "With time",
  "N° du lien": "Link no.",
  "Colonnes": "Columns",
  "Rangées": "Rows",
  "Marge gauche et droite (mm)": "Left and right margin (mm)",
  "Marge haut et bas (mm)": "Top and bottom margin (mm)",
  "Écart entre étiquettes — horizontal (mm)": "Gap between labels — horizontal (mm)",
  "Écart entre étiquettes — vertical (mm)": "Gap between labels — vertical (mm)",
  "Décalage horizontal (mm)": "Horizontal offset (mm)",
  "Décalage vertical (mm)": "Vertical offset (mm)",
  "Imprimez d'abord sur papier ordinaire, superposez la feuille obtenue à votre planche : si le texte est trop haut ou trop à gauche, corrigez ici.": "Print on plain paper first and overlay the result on your sheet: if the text is too high or too far left, correct it here.",
  "Taille du QR": "QR size",
  "Orientation de la page": "Page orientation",
  "En-tête de page": "Page header",
  "Avec la date d'impression": "With print date",
  "Tableau imprimé": "Printed table",
  "N°": "No.",
  "QR": "QR",
  "Titre": "Title",
  "Tags": "Tags",
  "Note": "Note",
  "Date": "Date",
  "Grille et bordures": "Grid and borders",
  "Un tableau dense, adapté à une relecture ou à un archivage papier.": "A dense table, suited to review or paper archiving.",
  "Exporter le tableau (ZIP)": "Export table (ZIP)",
  "L'export du tableau produit un modèle JSON, les QR en PNG et une page HTML. La sélection et les colonnes cochées s'appliquent.": "The table export produces a JSON model, the QR codes as PNG and an HTML page. The selection and checked columns apply.",
  "Format d'étiquette": "Label format",
  "Densité": "Density",
  "Copies": "Copies",
  "Disposition du texte": "Text orientation",
  "Lien à imprimer": "Link to print",
  "Consommable": "Supply",
  "Taille du texte (mm)": "Text size (mm)",
  "Contenu de l'étiquette": "Label content",
  "Domaine seul": "Host only",
  "Aucune imprimante connectée": "No printer connected",
  "Connecter": "Connect",
  "Déconnecter": "Disconnect",
  "Imprimer cette étiquette": "Print this label",
  "Imprimer en série": "Batch printing",
  "Quels liens": "Which links",
  "Exemplaires de chacun": "Copies of each",
  "Imprimer la collection": "Print the collection",
  "Texte imprimé": "Printed text",
  "Marge (mm)": "Margin (mm)",
  "Traits de coupe": "Cut marks",
  "Sous le QR": "Below the QR",
  "Un dossier d'images prêtes à imprimer, avec une planche HTML et un CSV. Fonctionne avec n'importe quelle étiqueteuse, ou sur papier.": "A folder of print-ready images, with an HTML sheet and a CSV. Works with any label printer, or on paper.",
  "Exporter les images (ZIP)": "Export images (ZIP)",
  "Exporter l'image (ZIP)": "Export image (ZIP)",
  "Exporter les {count} images (ZIP)": "Export {count} images (ZIP)",
  "Exporter la sélection ({count})": "Export selection ({count})",
  "Imprimer": "Print",
  "Langue": "Language",

  // -------------------------------------------------------------------------
  // Application — messages dynamiques
  // -------------------------------------------------------------------------
  " Le lien le plus dense est « {title} ».": " The densest link is “{title}”.",
  " et ": " and ",
  " — aucune date : elle ne tient pas sur une ligne à cette taille de texte.": " — no date: it does not fit on one line at this text size.",
  " — date non imprimée : elle exigerait un texte trop petit pour être lu.": " — date not printed: it would require text too small to read.",
  " — orientation : {label}": " — orientation: {label}",
  " — texte empilé : le QR laisse trop peu de largeur pour une colonne de texte.": " — stacked text: the QR leaves too little width for a text column.",
  " — {count} raccourci en place": " — {count} short link in place",
  " — {count} raccourcis en place": " — {count} short links in place",
  "Ajoutez des liens pour voir un aperçu.": "Add links to see a preview.",
  "Ajoutez un tag ou une note depuis la liste (bouton ✎) pour pouvoir les imprimer.": "Add a tag or a note from the list (✎ button) to be able to print them.",
  "Annuler": "Cancel",
  "Aperçu composé avec le {profile} ({mm} mm utiles, {dpi} dpi), sans imprimante connectée : les dimensions et le nombre de modules sont exacts.": "Preview composed with the {profile} ({mm} mm usable, {dpi} dpi), without a connected printer: the dimensions and module count are exact.",
  "Arrêt demandé : la série s'arrête après l'étiquette en cours.": "Stop requested: the series stops after the current label.",
  "Arrêter la série": "Stop the series",
  "Assemblage…": "Assembling…",
  "Aucun lien coché : cochez les liens à imprimer dans la liste, ou choisissez « Toute la collection ».": "No link checked: check the links to print in the list, or choose “the whole collection”.",
  "Aucun lien coché : cochez les étiquettes à imprimer, ou choisissez « toute la collection »": "No link checked: check the labels to print, or choose “the whole collection”",
  "Aucun lien coché : l'impression portera sur toute la collection": "No link checked: printing will cover the whole collection",
  "Aucun lien coché : l'impression portera sur toute la collection ({count}).": "No link checked: printing will cover the whole collection ({count}).",
  "Aucun lien dans la collection": "No link in the collection",
  "Aucun lien dans la collection.": "No link in the collection.",
  "Aucun lien exploitable dans {file}": "No usable link in {file}",
  "Aucun lien n'a de {what} : ajoutez-en un avec le bouton ✎ de la liste.": "No link has a {what}: add one with the ✎ button in the list.",
  "Aucun lien ne correspond à la recherche.": "No link matches the search.",
  "Aucun lien à imprimer": "No link to print",
  "Aucun lien. Ajoutez-en un ci-dessus, importez une archive, ou utilisez l'extension navigateur.": "No links. Add one above, import an archive, or use the browser extension.",
  "Aucune colonne sélectionnée : cochez au moins une colonne.": "No column selected: check at least one column.",
  "Aucune date imprimée.": "No date printed.",
  "CSV": "CSV",
  "Ce lien est déjà dans la collection": "This link is already in the collection",
  "Chaque ligne de plus réduit la place du QR code.": "Each extra line reduces the space for the QR code.",
  "Collection vidée": "Collection cleared",
  "Composition de l'étiquette…": "Composing the label…",
  "Connecté : {details}.": "Connected: {details}.",
  "Date de collecte sur sa propre ligne — {sample}.": "Collection date on its own line — {sample}.",
  "Date non imprimée sur {count} étiquette : elle ne tient pas sur une ligne à cette largeur.": "Date not printed on {count} label: it does not fit on one line at this width.",
  "Date non imprimée sur {count} étiquettes : elle ne tient pas sur une ligne à cette largeur.": "Date not printed on {count} labels: it does not fit on one line at this width.",
  "Décalage appliqué : {moves}.": "Offset applied: {moves}.",
  "Entrée pour enregistrer, Échap pour annuler. Tags séparés par des virgules.": "Enter to save, Escape to cancel. Tags separated by commas.",
  "Envoi en cours…": "Sending…",
  "Export impossible : {message}": "Export failed: {message}",
  "Filtrer sur le tag « {tag} »": "Filter by tag “{tag}”",
  "Génération…": "Generating…",
  "Import impossible : {message}": "Import failed: {message}",
  "Impression directe indisponible — voir le message ci-dessus.": "Direct printing unavailable — see the message above.",
  "Impression impossible": "Printing failed",
  "Impression {page}/{copies}…": "Printing {page}/{copies}…",
  "Imprimante connectée : {id}. Aperçu et impression identiques.": "Printer connected: {id}. Preview and printing are identical.",
  "Imprimante connectée : {id}. L'aperçu montre le {profile} choisi ; « Imprimer » se fera au format du {connected}.": "Printer connected: {id}. The preview shows the chosen {profile}; “Print” will use the format of the {connected}.",
  "Imprimante déconnectée": "Printer disconnected",
  "Imprimer la colonne « {what} »": "Print the “{what}” column",
  "Imprimer la sélection ({count})": "Print the selection ({count})",
  "Imprimer le lien": "Print the link",
  "Imprimer les {count} liens": "Print the {count} links",
  "Imprimer {count} étiquette": "Print {count} label",
  "Imprimer {count} étiquettes": "Print {count} labels",
  "L'URL collectée": "The collected URL",
  "Le QR code encode l'URL collectée.": "The QR code encodes the collected URL.",
  "Le QR code seul, sans texte sous lui.": "The QR code alone, with no text below it.",
  "Le lien raccourci": "The shortened link",
  "Le navigateur n'a pas pu encoder l'image.": "The browser could not encode the image.",
  "Le numéro du lien s'imprime au-dessus du titre.": "The link number is printed above the title.",
  "Lecture…": "Reading…",
  "Les tags et la note saisis dans la liste (bouton ✎) peuvent être imprimés ici.": "Tags and the note entered in the list (✎ button) can be printed here.",
  "Les {count} liens sont cochés.": "All {count} links are checked.",
  "Lien ajouté": "Link added",
  "Lien mis à jour": "Link updated",
  "Longueur imposée par le rouleau : {mm} mm.": "Length imposed by the roll: {mm} mm.",
  "Markdown": "Markdown",
  "Modifier le titre, les tags et la note": "Edit the title, tags and note",
  "Modifier titre, tags et note de {title}": "Edit title, tags and note for {title}",
  "Niimbot {id} — {mm} mm utiles, {dpi} dpi": "Niimbot {id} — {mm} mm usable, {dpi} dpi",
  "Note libre": "Free note",
  "QR de {side} mm ({module} mm par module, minimum {minimum} mm) — réglable de {range} — {lines} de texte.": "QR {side} mm ({module} mm per module, minimum {minimum} mm) — adjustable from {range} — {lines} of text.",
  "QR {done}/{total}…": "QR {done}/{total}…",
  "Raccourcissement impossible : {message}": "Shortening failed: {message}",
  "Raccourcissement via {name}…": "Shortening via {name}…",
  "Rang dans la collection, celui du tableau imprimé": "Rank in the collection, the one in the printed table",
  "Recherche de l'imprimante…": "Searching for the printer…",
  "Rouleau continu : la longueur suit le contenu.": "Continuous roll: the length follows the content.",
  "Saisissez une URL.": "Enter a URL.",
  "Sous le QR : {list}. Le texte est découpé à la largeur de la tête.": "Below the QR: {list}. The text is wrapped to the width of the printhead.",
  "Stockage temporaire : IndexedDB indisponible, les liens seront perdus": "Temporary storage: IndexedDB unavailable, links will be lost",
  "Supprimer {title}": "Delete {title}",
  "Sélectionner {title}": "Select {title}",
  "Sélectionnez un lien pour voir l'étiquette.": "Select a link to see the label.",
  "Taille des étiquettes déduite de ces six valeurs : {size}, {columns} × {rows} par feuille.": "Label size derived from these six values: {size}, {columns} × {rows} per sheet.",
  "Texte de {size} mm de haut, {lines} de texte.": "Text {size} mm high, {lines} of text.",
  "Titre de la page": "Page title",
  "Tous les liens visés sont déjà raccourcis.": "All targeted links are already shortened.",
  "bas": "bottom",
  "droite": "right",
  "gauche": "left",
  "haut": "top",
  "impression impossible": "printing failed",
  "l'URL": "the URL",
  "la date de collecte": "the collection date",
  "la date et l'heure": "the date and time",
  "largeur mesurée {count} px": "measured width {count} px",
  "le domaine": "the host",
  "le numéro du lien": "the link number",
  "le titre": "the title",
  "les {count} liens de la collection": "the {count} links in the collection",
  "longueur libre": "free length",
  "modèle non rapporté": "model not reported",
  "modèle {id}": "model {id}",
  "note": "note",
  "sur {count}.": "out of {count}.",
  "série arrêtée": "series stopped",
  "tag": "tag",
  "toute la collection": "the whole collection",
  "veille, travail": "reading, work",
  "{columns} × {rows} = {perPage} de {size} mm, {pages}": "{columns} × {rows} = {perPage} of {size} mm, {pages}",
  "{count} déjà présent": "{count} already present",
  "{count} déjà présents": "{count} already present",
  "{count} en échec — {message}": "{count} failed — {message}",
  "{count} illisible": "{count} unreadable",
  "{count} illisibles": "{count} unreadable",
  "{count} lien": "{count} link",
  "{count} lien coché": "{count} checked link",
  "{count} lien importé": "{count} imported link",
  "{count} lien raccourci : un QR plus court se scanne plus vite et tient sur une plus petite étiquette.": "{count} shortened link: a shorter QR scans faster and fits on a smaller label.",
  "{count} liens": "{count} links",
  "{count} liens cochés": "{count} checked links",
  "{count} liens importés": "{count} imported links",
  "{count} liens raccourcis : un QR plus court se scanne plus vite et tient sur une plus petite étiquette.": "{count} shortened links: a shorter QR scans faster and fits on a smaller label.",
  "{count} ligne": "{count} line",
  "{count} lignes": "{count} lines",
  "{count} page": "{count} page",
  "{count} pages": "{count} pages",
  "{count} px de tête": "{count} px printhead",
  "{count} raccourci retiré": "{count} short link removed",
  "{count} raccourcis retirés": "{count} short links removed",
  "{count} étiquette imprimée": "{count} label printed",
  "{count} étiquette par page": "{count} label per page",
  "{count} étiquette — {filename} enregistré": "{count} label — {filename} saved",
  "{count} étiquettes imprimées": "{count} labels printed",
  "{count} étiquettes par page": "{count} labels per page",
  "{count} étiquettes — {filename} enregistré": "{count} labels — {filename} saved",
  "{label} pour {url}": "{label} for {url}",
  "{min} à {max} %": "{min} to {max} %",
  "{mm} mm vers la {direction}": "{mm} mm to the {direction}",
  "{mm} mm vers le {direction}": "{mm} mm to the {direction}",
  "{name} · {done}/{total}…": "{name} · {done}/{total}…",
  "{label} · {scope}{done}. L'URL complète est transmise au service.": "{label} · {scope}{done}. The full URL is sent to the service.",
  "{profile} — {reason}": "{profile} — {reason}",
  "{profile} — {width} × {height} px, {px} px par module": "{profile} — {width} × {height} px, {px} px per module",
  "{source}, {count} exemplaire de chacun.": "{source}, {count} copy of each.",
  "{source}, {count} exemplaires de chacun.": "{source}, {count} copies of each.",
  "Étiquette imprimée : {rows} lignes, {frames} trames.": "Label printed: {rows} lines, {frames} frames.",
  "Étiquette {index}/{total} — {title}": "Label {index}/{total} — {title}",
  "Étiquette {index}/{total}…": "Label {index}/{total}…",

  // -------------------------------------------------------------------------
  // Cœur — messages visibles (Bluetooth, raccourcissement, erreurs)
  // -------------------------------------------------------------------------
  "Brave désactive Web Bluetooth par défaut. Ouvrez brave://flags/#brave-web-bluetooth-api, mettez « Web Bluetooth API » sur Enabled, puis relancez Brave. Chrome et Edge fonctionnent sans réglage.": "Brave disables Web Bluetooth by default. Open brave://flags/#brave-web-bluetooth-api, set “Web Bluetooth API” to Enabled, then restart Brave. Chrome and Edge work without any setting.",
  "Web Bluetooth n'est pas disponible dans ce navigateur.": "Web Bluetooth is not available in this browser.",
  "Safari (macOS et iOS) ne l'implémente pas. {brave}": "Safari (macOS and iOS) does not implement it. {brave}",
  "Web Bluetooth exige un contexte sécurisé (HTTPS ou localhost).": "Web Bluetooth requires a secure context (HTTPS or localhost).",
  "Ouvrez l'application via https:// ou http://localhost.": "Open the app over https:// or http://localhost.",
  "Web Bluetooth est désactivé dans ce navigateur — ou le Bluetooth de cet ordinateur est éteint.": "Web Bluetooth is disabled in this browser — or this computer's Bluetooth is off.",
  "Web Bluetooth est désactivé dans ce navigateur. {brave}": "Web Bluetooth is disabled in this browser. {brave}",
  "Aucun appareil choisi. Réveillez l'imprimante, puis relancez la connexion.": "No device chosen. Wake the printer, then start the connection again.",
  "Le navigateur a refusé l'accès au Bluetooth : autorisez-le pour cette page, puis réessayez.": "The browser denied Bluetooth access: allow it for this page, then try again.",
  "Connexion impossible : {message}": "Connection failed: {message}",
  "Transport non connecté": "Transport not connected",
  "Service de raccourcissement inconnu : {provider}": "Unknown shortening service: {provider}",
  "Raccourcissement indisponible : fetch absent": "Shortening unavailable: fetch is missing",
  "Lien à raccourcir invalide : {url}": "Invalid link to shorten: {url}",
  "Raccourcissement annulé": "Shortening cancelled",
  "{name} n'a pas répondu en {seconds} s": "{name} did not respond within {seconds} s",
  "Impossible de joindre {name} : {message}": "Could not reach {name}: {message}",
  "{count} lien raccourci": "{count} shortened link",
  "{count} liens raccourcis": "{count} shortened links",
  "{count} déjà fait": "{count} already done",
  "{count} déjà faits": "{count} already done",
  "{count} échec": "{count} failure",
  "{count} échecs": "{count} failures",
  "Rouleau continu 12 mm (longueur libre)": "Continuous roll 12 mm (free length)",
  "Rouleau continu 48 mm (longueur libre)": "Continuous roll 48 mm (free length)",
  "trop large pour cette tête": "too wide for this printhead",
  "plus longue que la fenêtre d'impression": "longer than the print window",
  "marge non imprimée sur les côtés": "unprinted margin on the sides",
  "Niimbot D110 — 12 mm utile (203 dpi)": "Niimbot D110 — 12 mm usable (203 dpi)",
  "Zebra 2 pouces — 54 mm (203 dpi)": "Zebra 2 inches — 54 mm (203 dpi)",
  "Générique — 50 × 30 mm (300 dpi)": "Generic — 50 × 30 mm (300 dpi)",
  "Générique — 70 × 40 mm (300 dpi)": "Generic — 70 × 40 mm (300 dpi)",
  "Planche A4 — 3 × 8 (63,5 × 33,9 mm)": "A4 sheet — 3 × 8 (63.5 × 33.9 mm)",
  "Titre puis URL": "Title then URL",
  "URL seule": "URL only",
  "Titre seul": "Title only",
  "Aucun texte": "No text",
  "Centré": "Centered",
  "En haut": "Top",
  "Réparti (QR en haut, texte en bas)": "Spread (QR at top, text at bottom)",
  "URL trop longue : le QR fait {size} px pour {width} px de large. Raccourcissez l'URL ou utilisez une étiquette plus large.": "URL too long: the QR is {size} px for {width} px of width. Shorten the URL or use a wider label.",
  "QR trop dense : {px} px par module (minimum {min}). Raccourcissez l'URL ou augmentez la largeur de l'étiquette.": "QR too dense: {px} px per module (minimum {min}). Shorten the URL or increase the label width.",
  "Dispositions génériques": "Generic layouts",
  "Avery — A4": "Avery — A4",
  "Avery — Letter (US)": "Avery — Letter (US)",
  "A4 — 3 × 4 grandes étiquettes QR (60 × 60 mm)": "A4 — 3 × 4 large QR labels (60 × 60 mm)",
  "L'imprimante a signalé une erreur : {label}": "The printer reported an error: {label}",
  "L'impression n'a pas confirmé son achèvement après {ms} ms. L'étiquette est peut-être incomplète.": "Printing did not confirm completion after {ms} ms. The label may be incomplete.",
  "URL attendue sous forme de chaîne": "URL must be a string",
  "URL vide": "Empty URL",
  "Seuls les schémas http et https sont pris en charge": "Only http and https schemes are supported",
  "URL invalide : {input}": "Invalid URL: {input}",
  "Nom d'hôte invalide : {host}": "Invalid host name: {host}",
  "createLink exige au minimum { url }": "createLink requires at least { url }",
  "{width} mm × {height} px — {widthPx} × {heightPx} px à {dpi} dpi": "{width} mm × {height} px — {widthPx} × {heightPx} px at {dpi} dpi",
  "URL trop longue pour ce format : le QR fait {size} px pour {width} px de large.": "URL too long for this format: the QR is {size} px for {width} px of width.",
  " — date non imprimée : elle ne tient pas sur ce format, réduisez la taille du texte.": " — date not printed: it does not fit on this format, reduce the text size.",
  "{detail} Formats acceptés : l'archive JSON du bouton « Archive », le dossier d'étiquettes (.zip) ou son export.json, ou un CSV exporté d'ici.": "{detail} Accepted formats: the JSON archive from the “Archive” button, the label folder (.zip) or its export.json, or a CSV exported from here.",
  "Fichier illisible : {message}.": "Unreadable file: {message}.",
  "Archive JSON sans liste de liens": "JSON archive without a link list",
  "Archive JSON sans liste de liens (format « {format} »)": "JSON archive without a link list (format “{format}”)",
  "CSV sans ligne de données.": "CSV without a data row.",
  "CSV sans colonne « URL » (colonnes trouvées : {columns}).": "CSV without an “URL” column (columns found: {columns}).",
  "Rouleau continu 72 mm (longueur libre)": "Continuous roll 72 mm (free length)",
  "Brother DK-11218 — 24 mm rond (300 dpi)": "Brother DK-11218 — 24 mm round (300 dpi)",
  "Brother DK-11219 — 12 mm rond (300 dpi)": "Brother DK-11219 — 12 mm round (300 dpi)",
  "Brother DK-22205 — 62 mm continu (300 dpi)": "Brother DK-22205 — 62 mm continuous (300 dpi)",
  "Brother DK-22210 — 29 mm continu (300 dpi)": "Brother DK-22210 — 29 mm continuous (300 dpi)",
  "Zebra 4 × 6 po — 104 × 152 mm (203 dpi)": "Zebra 4 × 6 in — 104 × 152 mm (203 dpi)",
};

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/i18n.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Internationalisation de l'interface — français et anglais.
 *
 * Le français est la langue source : les messages sont écrits en français dans
 * le code, et le catalogue ne contient que les traductions. Une clé absente
 * retombe donc sur le texte français, jamais sur un identifiant technique — ce
 * qui rend la migration incrémentale sans jamais afficher de « clé manquante ».
 *
 * Les messages peuvent contenir des emplacements `{nom}`, remplacés par `t()`.
 * Le pluriel passe par `tpl()`, qui choisit la forme adaptée à la langue avec
 * `Intl.PluralRules` : le français met « 0 lien » au singulier, l'anglais écrit
 * « 0 links » au pluriel.
 *
 * La langue retenue est mémorisée — `chrome.storage.local` dans l'extension
 * (le service worker y a accès, contrairement à `localStorage`), `localStorage`
 * sur le Web. La première visite suit la langue du navigateur.
 */



/** Langues proposées, dans l'ordre d'affichage. */
const SUPPORTED_LOCALES = Object.freeze(['fr', 'en']);

/** Langue de repli, et langue source des messages. */
const DEFAULT_LOCALE = 'fr';

/** Clé de mémorisation, partagée avec le service worker. */
const LOCALE_STORAGE_KEY = 'locale';

/** Catalogues de traduction. Le français est le texte source, donc absent. */
const CATALOGS = Object.freeze({ en: EN_MESSAGES });

let currentLocale = DEFAULT_LOCALE;
const listeners = new Set();

/**
 * Ramène un code de langue à une langue gérée : « en-GB » → « en ».
 * @param {unknown} value
 * @returns {'fr'|'en'|null}
 */
function normalizeLocale(value) {
  if (typeof value !== 'string') return null;
  const base = value.trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LOCALES.includes(base) ? base : null;
}

/**
 * Choisit la langue du navigateur, ou le français par défaut.
 * @param {Navigator|undefined} [navigatorLike]
 * @returns {'fr'|'en'}
 */
function detectLocale(navigatorLike = globalThis.navigator) {
  const candidates = [navigatorLike?.languages, navigatorLike?.language]
    .flat()
    .filter((entry) => typeof entry === 'string' && entry !== '');
  for (const candidate of candidates) {
    const normalized = normalizeLocale(candidate);
    if (normalized) return normalized;
  }
  return DEFAULT_LOCALE;
}

/** La langue actuellement appliquée. */
function getLocale() {
  return currentLocale;
}

/** L'espace de stockage à utiliser, ou `null` hors extension. */
function resolveArea(area) {
  if (area) return area;
  return globalThis.chrome?.storage?.local ?? null;
}

/**
 * Lit la langue mémorisée. Ne lève jamais : un stockage indisponible n'est pas
 * une raison d'échouer au démarrage.
 * @param {any} [area]
 * @returns {Promise<'fr'|'en'|null>}
 */
async function readStoredLocale(area) {
  const resolved = resolveArea(area);
  if (resolved) {
    try {
      const data = await resolved.get(LOCALE_STORAGE_KEY);
      return normalizeLocale(data?.[LOCALE_STORAGE_KEY]);
    } catch {
      return null;
    }
  }
  try {
    return normalizeLocale(globalThis.localStorage?.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return null;
  }
}

/**
 * Mémorise la langue. Ne lève jamais.
 * @param {any} [area]
 * @param {'fr'|'en'} locale
 * @returns {Promise<void>}
 */
async function writeStoredLocale(area, locale) {
  const resolved = resolveArea(area);
  if (resolved) {
    try {
      await resolved.set({ [LOCALE_STORAGE_KEY]: locale });
    } catch {
      // La langue reste appliquée pour la session en cours.
    }
    return;
  }
  try {
    globalThis.localStorage?.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Idem.
  }
}

/**
 * Détermine la langue de départ d'une page.
 *
 * L'ordre reflète les priorités : un choix explicite passé en option, puis la
 * langue mémorisée, puis celle du navigateur.
 *
 * @param {{ area?: any, locale?: unknown, navigator?: Navigator }} [options]
 * @returns {Promise<'fr'|'en'>}
 */
async function initI18n(options = {}) {
  const stored = await readStoredLocale(options.area);
  currentLocale =
    normalizeLocale(options.locale) ?? stored ?? detectLocale(options.navigator);
  return currentLocale;
}

/**
 * Change la langue, la mémorise et prévient les abonnés.
 * @param {unknown} locale
 * @param {{ area?: any }} [options]
 * @returns {Promise<'fr'|'en'>}
 */
async function setLocale(locale, options = {}) {
  const normalized = normalizeLocale(locale);
  if (!normalized) return currentLocale;
  currentLocale = normalized;
  await writeStoredLocale(options.area, normalized);
  for (const listener of listeners) {
    try {
      listener(normalized);
    } catch {
      // Un abonné fautif ne doit pas empêcher les autres d'être prévenus.
    }
  }
  return currentLocale;
}

/**
 * S'abonne aux changements de langue.
 * @param {(locale: 'fr'|'en') => void} listener
 * @returns {() => void} désabonnement
 */
function onLocaleChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Traduit un message source.
 * @param {string} source
 * @param {Record<string, string|number>} [params]
 * @returns {string}
 */
function t(source, params) {
  const table = CATALOGS[currentLocale];
  const message = table?.[source] ?? source;
  if (!params) return message;
  return message.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}

/**
 * Traduit un message au pluriel.
 *
 * `one` et `other` sont les deux formes françaises ; la règle de la langue
 * courante choisit laquelle traduire. `count` est fourni d'office aux
 * emplacements du message.
 *
 * @param {number} count
 * @param {string} one
 * @param {string} other
 * @param {Record<string, string|number>} [params]
 * @returns {string}
 */
function tpl(count, one, other, params = {}) {
  const rule = typeof Intl !== 'undefined' && Intl.PluralRules
    ? new Intl.PluralRules(currentLocale).select(count)
    : (count === 1 ? 'one' : 'other');
  return t(rule === 'one' ? one : other, { ...params, count });
}

/**
 * Applique les traductions aux éléments balisés du document.
 *
 * Les attributs reconnus : `data-i18n` (texte), `data-i18n-placeholder`,
 * `data-i18n-title` et `data-i18n-aria-label`. Seuls des éléments sans balise
 * enfant portent `data-i18n` : le texte remplace tout le contenu.
 *
 * @param {ParentNode} [root]
 */
function applyTranslations(root = globalThis.document) {
  if (!root?.querySelectorAll) return;

  for (const node of root.querySelectorAll('[data-i18n]')) {
    const key = node.getAttribute('data-i18n');
    if (key) node.textContent = t(key);
  }
  for (const node of root.querySelectorAll('[data-i18n-placeholder]')) {
    const key = node.getAttribute('data-i18n-placeholder');
    if (key) node.setAttribute('placeholder', t(key));
  }
  for (const node of root.querySelectorAll('[data-i18n-title]')) {
    const key = node.getAttribute('data-i18n-title');
    if (key) node.setAttribute('title', t(key));
  }
  for (const node of root.querySelectorAll('[data-i18n-aria-label]')) {
    const key = node.getAttribute('data-i18n-aria-label');
    if (key) node.setAttribute('aria-label', t(key));
  }
  if (root.documentElement) root.documentElement.lang = currentLocale;
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/link.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Modèle de données : un « lien » collecté.
 *
 * Ce module est volontairement pur (aucun accès DOM, réseau ou stockage) afin
 * d'être réutilisé tel quel par l'application web autonome, l'extension
 * navigateur et, plus tard, une couche native.
 */



/**
 * @typedef {Object} LinkRecord
 * @property {string}   id        Identifiant stable (UUID v4).
 * @property {string}   url       URL absolue normalisée — c'est elle qui est encodée dans le QR.
 * @property {string}   title     Titre lisible de la page (peut être vide).
 * @property {string}   note      Note libre de l'utilisateur.
 * @property {string[]} tags      Étiquettes de classement, sans « # », dédoublonnées.
 * @property {number}   createdAt Date de collecte (epoch ms).
 * @property {number}   updatedAt Dernière modification (epoch ms).
 * @property {string}   source    Origine : 'context-menu' | 'toolbar' | 'manual' | 'import' | 'share'.
 * @property {string}   favicon   URL du favicon, ou chaîne vide.
 * @property {string}   shortUrl  Lien raccourci, ou chaîne vide. N'écrase jamais `url` :
 *   le lien d'origine reste la source de vérité, un service tiers pouvant fermer.
 * @property {string}   shortProvider Identifiant du service qui a produit `shortUrl`.
 * @property {number}   shortenedAt Date du raccourcissement (epoch ms), 0 si jamais raccourci.
 */

/** Origines reconnues. Toute autre valeur est ramenée à 'manual'. */
const SOURCES = ['context-menu', 'toolbar', 'manual', 'import', 'share'];

const DEFAULT_TITLE_MAX = 300;

/**
 * Génère un identifiant unique. `crypto.randomUUID` existe dans tous les
 * environnements visés (navigateurs modernes, service worker MV3, Node >= 19).
 * @returns {string}
 */
function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Repli : ne devrait jamais servir sur les plateformes ciblées.
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

/**
 * Normalise une URL saisie ou capturée.
 *
 * - ajoute `https://` si le schéma est absent ;
 * - retire les identifiants de session et le fragment, qui n'ont pas leur place
 *   dans un QR code imprimé (le fragment n'est jamais envoyé au serveur, et un
 *   `#` allonge inutilement la matrice) ;
 * - supprime un éventuel slash final redondant sur la racine.
 *
 * @param {string} input
 * @returns {string} URL normalisée.
 * @throws {TypeError} si l'entrée ne peut pas être analysée comme une URL http(s).
 */
function normalizeUrl(input) {
  if (typeof input !== 'string') throw new TypeError(t('URL attendue sous forme de chaîne'));
  let raw = input.trim();
  if (raw === '') throw new TypeError(t('URL vide'));

  // Un schéma explicite non http(s) (mailto:, tel:, ftp:) est rejeté : ces
  // chaînes ne sont pas des liens web et fausseraient le rendu des colonnes.
  // Exception : « hote:3000 » ressemble à un schéma mais désigne un hôte suivi
  // d'un port ; on le traite comme une URL sans schéma plutôt que de le refuser.
  const isHostPort = /^[^\s/?#@]+:\d+(?:[/?#]|$)/.test(raw);
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^https?:/i.test(raw) && !isHostPort) {
    throw new TypeError(t('Seuls les schémas http et https sont pris en charge'));
  }
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new TypeError(t('URL invalide : {input}', { input }));
  }
  if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
    throw new TypeError(t("Nom d'hôte invalide : {host}", { host: parsed.hostname }));
  }

  parsed.hash = '';

  // Paramètres de campagne : ils polluent le QR et le rendent plus dense.
  for (const key of [...parsed.searchParams.keys()]) {
    if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$|ref_src$)/i.test(key)) {
      parsed.searchParams.delete(key);
    }
  }

  let out = parsed.toString();
  if (parsed.pathname === '/' && !parsed.search) out = out.replace(/\/$/, '');
  return out;
}

/**
 * Indique si une chaîne est une URL http(s) exploitable.
 * @param {string} input
 * @returns {boolean}
 */
function isValidUrl(input) {
  try {
    normalizeUrl(input);
    return true;
  } catch {
    return false;
  }
}

/**
 * Attribut `href` sûr pour une URL, ou chaîne vide si elle est inexploitable.
 *
 * La liste des liens est une porte de sortie vers l'extérieur, et son contenu
 * peut venir d'un import ou d'une page web : un `href` ne doit donc jamais
 * recevoir autre chose qu'une URL http(s), jamais un `javascript:` ni un `data:`.
 * Les appelants affichent du texte simple quand cette fonction renvoie `''`.
 *
 * @param {unknown} url
 * @returns {string}
 */
function safeHref(url) {
  if (typeof url !== 'string' || url.trim() === '') return '';
  try {
    return normalizeUrl(url);
  } catch {
    return '';
  }
}

/**
 * Domaine affichable d'une URL (sans « www. »).
 * @param {string} url
 * @returns {string}
 */
function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return '';
  }
}

/**
 * Nettoie et dédoublonne une liste de tags.
 * @param {unknown} tags
 * @returns {string[]}
 */
function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  const out = [];
  for (const tag of tags) {
    if (typeof tag !== 'string') continue;
    const clean = tag.trim().replace(/^#+/, '').replace(/\s+/g, '-').toLowerCase();
    if (clean === '' || seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
  }
  return out;
}

/**
 * Valide un lien raccourci.
 *
 * Une valeur illisible est ignorée au lieu de faire échouer la construction :
 * un raccourci abîmé ne doit pas empêcher d'importer un enregistrement dont
 * l'URL d'origine, elle, est intacte.
 *
 * @param {unknown} value
 * @returns {string}
 */
function normalizeShortUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') return '';
  try {
    return normalizeUrl(value);
  } catch {
    return '';
  }
}

/**
 * Construit un LinkRecord complet et validé à partir d'une saisie partielle.
 *
 * @param {Partial<LinkRecord> & { url: string }} input
 * @param {{ now?: number, source?: string }} [options]
 * @returns {LinkRecord}
 */
function createLink(input, options = {}) {
  if (!input || typeof input.url !== 'string') {
    throw new TypeError(t('createLink exige au minimum { url }'));
  }
  const now = options.now ?? Date.now();
  const title = typeof input.title === 'string'
    ? input.title.trim().slice(0, DEFAULT_TITLE_MAX)
    : '';

  return {
    id: typeof input.id === 'string' && input.id !== '' ? input.id : newId(),
    url: normalizeUrl(input.url),
    title,
    note: typeof input.note === 'string' ? input.note.trim() : '',
    tags: normalizeTags(input.tags),
    createdAt: Number.isFinite(input.createdAt) ? input.createdAt : now,
    updatedAt: now,
    source: SOURCES.includes(options.source) ? options.source
      : SOURCES.includes(input.source) ? input.source
      : 'manual',
    favicon: typeof input.favicon === 'string' ? input.favicon : '',
    shortUrl: normalizeShortUrl(input.shortUrl),
    shortProvider: typeof input.shortProvider === 'string' ? input.shortProvider : '',
    shortenedAt: Number.isFinite(input.shortenedAt) && input.shortenedAt > 0
      ? input.shortenedAt
      : 0,
  };
}

/**
 * Indique si deux liens désignent la même ressource.
 * La comparaison ignore le « www. », le slash final et la casse de l'hôte.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function isSameTarget(a, b) {
  const key = (value) => {
    try {
      const u = new URL(normalizeUrl(value));
      const path = u.pathname.replace(/\/$/, '');
      return (u.hostname.replace(/^www\./i, '') + path + u.search).toLowerCase();
    } catch {
      return String(value).trim().toLowerCase();
    }
  };
  return key(a) === key(b);
}

/**
 * Trouve un lien existant pointant vers la même ressource.
 * @param {LinkRecord[]} links
 * @param {string} url
 * @returns {LinkRecord|undefined}
 */
function findDuplicate(links, url) {
  let target;
  try {
    target = normalizeUrl(url);
  } catch {
    return undefined;
  }
  return links.find((link) => isSameTarget(link.url, target));
}

/**
 * Indique si un enregistrement possède un lien raccourci exploitable.
 * @param {Partial<LinkRecord>} [link]
 * @returns {boolean}
 */
function hasShortUrl(link) {
  return typeof link?.shortUrl === 'string' && link.shortUrl !== '';
}

/**
 * URL d'origine d'un enregistrement, même après passage par `resolveTarget`.
 *
 * C'est elle qui identifie le lien : le domaine affiché, le nom des fichiers
 * d'étiquettes et la colonne « Domaine » des exports doivent la refléter, sans
 * quoi une collection raccourcie deviendrait une liste de « tinyurl.com ».
 *
 * @param {Partial<LinkRecord>} [link]
 * @returns {string}
 */
function sourceUrl(link) {
  if (!link) return '';
  return typeof link.originalUrl === 'string' && link.originalUrl !== ''
    ? link.originalUrl
    : link.url ?? '';
}

/**
 * Domaine d'origine d'un enregistrement (sans « www. »).
 * @param {Partial<LinkRecord>} [link]
 * @returns {string}
 */
function sourceHost(link) {
  return hostOf(sourceUrl(link));
}

/**
 * Destinations possibles du QR code.
 * - `original` : l'URL collectée (comportement par défaut) ;
 * - `short` : le lien raccourci quand il existe, l'URL d'origine sinon.
 */
const TARGET_MODES = Object.freeze(['original', 'short']);

/**
 * Prépare un enregistrement pour l'affichage ou l'impression.
 *
 * Renvoie toujours une copie portant :
 * - `url` : la destination retenue, celle que le QR code encode ;
 * - `originalUrl` : l'URL collectée, jamais perdue ;
 * - `shortUrl` : le lien raccourci, ou une chaîne vide.
 *
 * L'enregistrement stocké n'est pas modifié : on ne remplace jamais `url` en
 * base, un service de raccourcissement pouvant disparaître du jour au
 * lendemain.
 *
 * @param {LinkRecord} link
 * @param {'original'|'short'} [mode]
 * @returns {LinkRecord & { originalUrl: string }}
 */
function resolveTarget(link, mode = 'original') {
  const originalUrl = link.url;
  const shortUrl = hasShortUrl(link) ? link.shortUrl : '';
  const useShort = mode === 'short' && shortUrl !== '' && shortUrl !== originalUrl;

  return {
    ...link,
    url: useShort ? shortUrl : originalUrl,
    originalUrl,
    shortUrl,
  };
}

/**
 * Applique `resolveTarget` à une collection.
 * @param {LinkRecord[]} links
 * @param {'original'|'short'} [mode]
 * @returns {Array<LinkRecord & { originalUrl: string }>}
 */
function resolveTargets(links, mode = 'original') {
  return links.map((link) => resolveTarget(link, mode));
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/store.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Persistance des liens.
 *
 * Un « store » expose toujours la même interface, ce qui permet de réutiliser
 * l'application web, l'extension et (plus tard) un pont natif sans changer le
 * reste du code :
 *
 *   list(): Promise<LinkRecord[]>
 *   get(id): Promise<LinkRecord|undefined>
 *   add(record): Promise<{ link, duplicate }>
 *   put(record): Promise<LinkRecord>
 *   putMany(records): Promise<number>
 *   remove(id): Promise<void>
 *   clear(): Promise<void>
 *
 * L'implémentation par défaut utilise IndexedDB, disponible à la fois dans une
 * page web et dans un service worker d'extension MV3.
 */



const DB_NAME = 'url-qr-code-printer';
const DB_VERSION = 1;
const STORE = 'links';

/**
 * @typedef {Object} LinkStore
 * @property {() => Promise<import('./link.js').LinkRecord[]>} list
 * @property {(id: string) => Promise<import('./link.js').LinkRecord|undefined>} get
 * @property {(record: Partial<import('./link.js').LinkRecord> & {url: string}, options?: object) => Promise<{link: import('./link.js').LinkRecord, duplicate: boolean}>} add
 * @property {(record: import('./link.js').LinkRecord) => Promise<import('./link.js').LinkRecord>} put
 * @property {(records: import('./link.js').LinkRecord[]) => Promise<number>} putMany
 * @property {(id: string) => Promise<void>} remove
 * @property {() => Promise<void>} clear
 */

/**
 * Trie les liens du plus récent au plus ancien.
 * @param {import('./link.js').LinkRecord[]} links
 * @returns {import('./link.js').LinkRecord[]}
 */
function sortByDateDesc(links) {
  return [...links].sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Enveloppe une promesse IndexedDB en promesse native.
 * @param {IDBRequest} request
 * @returns {Promise<any>}
 */
function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Ouvre (et migre si besoin) la base IndexedDB.
 * @param {string} [dbName]
 * @returns {Promise<IDBDatabase>}
 */
function openDatabase(dbName = DB_NAME) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id' });
        os.createIndex('createdAt', 'createdAt');
        os.createIndex('url', 'url', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Store persistant adossé à IndexedDB.
 *
 * @param {{ dbName?: string, indexedDB?: IDBFactory }} [options]
 * @returns {LinkStore}
 */
function createIndexedDbStore(options = {}) {
  const factory = options.indexedDB ?? globalThis.indexedDB;
  if (!factory) throw new Error('IndexedDB indisponible dans cet environnement');

  let dbPromise = null;
  const getDb = () => (dbPromise ??= openDatabase(options.dbName ?? DB_NAME));

  /**
   * Exécute une transaction et attend sa complétion.
   * @param {IDBTransactionMode} mode
   * @param {(store: IDBObjectStore) => any} fn
   */
  async function withStore(mode, fn) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const os = tx.objectStore(STORE);
      let result;
      try {
        result = fn(os);
      } catch (error) {
        reject(error);
        return;
      }
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  return {
    async list() {
      const db = await getDb();
      const tx = db.transaction(STORE, 'readonly');
      const all = await promisifyRequest(tx.objectStore(STORE).getAll());
      return sortByDateDesc(all);
    },

    async get(id) {
      const db = await getDb();
      const tx = db.transaction(STORE, 'readonly');
      return promisifyRequest(tx.objectStore(STORE).get(id));
    },

    async add(record, addOptions = {}) {
      const existing = await this.list();
      const duplicate = addOptions.allowDuplicate ? undefined : findDuplicate(existing, record.url);
      if (duplicate) return { link: duplicate, duplicate: true };

      const link = createLink(record, addOptions);
      await withStore('readwrite', (os) => os.put(link));
      return { link, duplicate: false };
    },

    async put(record) {
      const link = { ...record, updatedAt: Date.now() };
      await withStore('readwrite', (os) => os.put(link));
      return link;
    },

    async putMany(records) {
      await withStore('readwrite', (os) => {
        for (const record of records) os.put(record);
      });
      return records.length;
    },

    async remove(id) {
      await withStore('readwrite', (os) => os.delete(id));
    },

    async clear() {
      await withStore('readwrite', (os) => os.clear());
    },
  };
}

/**
 * Store volatil, utilisé par les tests et comme repli si IndexedDB est
 * indisponible (navigation privée restrictive, contexte non documenté).
 *
 * @param {import('./link.js').LinkRecord[]} [initial]
 * @returns {LinkStore}
 */
function createMemoryStore(initial = []) {
  /** @type {Map<string, import('./link.js').LinkRecord>} */
  const map = new Map(initial.map((link) => [link.id, link]));

  return {
    async list() {
      return sortByDateDesc([...map.values()]);
    },
    async get(id) {
      return map.get(id);
    },
    async add(record, addOptions = {}) {
      const duplicate = addOptions.allowDuplicate
        ? undefined
        : findDuplicate([...map.values()], record.url);
      if (duplicate) return { link: duplicate, duplicate: true };
      const link = createLink(record, addOptions);
      map.set(link.id, link);
      return { link, duplicate: false };
    },
    async put(record) {
      const link = { ...record, updatedAt: Date.now() };
      map.set(link.id, link);
      return link;
    },
    async putMany(records) {
      for (const record of records) map.set(record.id ?? newId(), record);
      return records.length;
    },
    async remove(id) {
      map.delete(id);
    },
    async clear() {
      map.clear();
    },
  };
}

/**
 * Store adossé à `chrome.storage.local` (extension uniquement).
 *
 * Utile quand on veut que les données soient visibles depuis le service worker
 * et la page d'options sans ouvrir IndexedDB. Le quota par défaut est de 10 Mo
 * (ou illimité avec la permission `unlimitedStorage`).
 *
 * @param {{ area?: chrome.storage.StorageArea }} [options]
 * @returns {LinkStore}
 */
function createChromeStorageStore(options = {}) {
  const area = options.area ?? (globalThis.chrome?.storage?.local);
  if (!area) throw new Error('chrome.storage.local indisponible');

  const KEY = 'links';

  async function readAll() {
    const data = await area.get(KEY);
    const value = data?.[KEY];
    return Array.isArray(value) ? value : [];
  }

  async function writeAll(links) {
    await area.set({ [KEY]: links });
  }

  return {
    async list() {
      return sortByDateDesc(await readAll());
    },
    async get(id) {
      return (await readAll()).find((link) => link.id === id);
    },
    async add(record, addOptions = {}) {
      const all = await readAll();
      const duplicate = addOptions.allowDuplicate ? undefined : findDuplicate(all, record.url);
      if (duplicate) return { link: duplicate, duplicate: true };
      const link = createLink(record, addOptions);
      all.push(link);
      await writeAll(all);
      return { link, duplicate: false };
    },
    async put(record) {
      const all = await readAll();
      const link = { ...record, updatedAt: Date.now() };
      const index = all.findIndex((item) => item.id === link.id);
      if (index === -1) all.push(link);
      else all[index] = link;
      await writeAll(all);
      return link;
    },
    async putMany(records) {
      const all = await readAll();
      const byId = new Map(all.map((item) => [item.id, item]));
      for (const record of records) byId.set(record.id, record);
      await writeAll([...byId.values()]);
      return records.length;
    },
    async remove(id) {
      await writeAll((await readAll()).filter((link) => link.id !== id));
    },
    async clear() {
      await writeAll([]);
    },
  };
}

/**
 * Choisit le meilleur store disponible pour l'environnement courant.
 *
 * Dans une extension on privilégie `chrome.storage.local`, dont le contenu est
 * partagé entre le service worker et les pages ; ailleurs on utilise IndexedDB,
 * avec un repli en mémoire pour ne jamais laisser l'application inutilisable.
 *
 * @param {{ prefer?: 'auto'|'indexeddb'|'chrome'|'memory' }} [options]
 * @returns {{ store: LinkStore, kind: 'indexeddb'|'chrome'|'memory' }}
 */
function resolveDefaultStore(options = {}) {
  const prefer = options.prefer ?? 'auto';
  const hasChrome = Boolean(globalThis.chrome?.storage?.local);
  const hasIdb = Boolean(globalThis.indexedDB);

  if (prefer === 'chrome' && hasChrome) {
    return { store: createChromeStorageStore(), kind: 'chrome' };
  }
  if (prefer === 'indexeddb' && hasIdb) {
    return { store: createIndexedDbStore(), kind: 'indexeddb' };
  }
  if (prefer === 'memory') {
    return { store: createMemoryStore(), kind: 'memory' };
  }

  if (hasChrome) return { store: createChromeStorageStore(), kind: 'chrome' };
  if (hasIdb) return { store: createIndexedDbStore(), kind: 'indexeddb' };
  return { store: createMemoryStore(), kind: 'memory' };
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/capture.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Capture d'un lien depuis une interaction navigateur.
 *
 * Ce module ne touche à aucune API d'extension : il transforme les
 * informations qu'un navigateur fournit lors d'un clic contextuel en une
 * entrée exploitable par `createLink`. Cela permet de le tester hors
 * navigateur, et de le partager entre l'extension Brave/Chrome et l'extension
 * Safari, dont les objets `info` diffèrent légèrement.
 */




/** Identifiants des entrées de menu contextuel. Stables : ils sont persistés. */
const MENU_IDS = Object.freeze({
  page: 'urq-add-page',
  link: 'urq-add-link',
  selection: 'urq-add-selection',
  separator: 'urq-separator',
  openApp: 'urq-open-app',
});

/**
 * Définition des entrées de menu contextuel.
 *
 * `contexts` est volontairement restreint : déclarer une entrée « link » dans
 * le contexte d'une page sans lien la rendrait invisible sans explication.
 *
 * @param {{ includeSelection?: boolean, appUrl?: string }} [options]
 * @returns {Array<object>} définitions prêtes pour `contextMenus.create`
 */
function buildMenuDefinitions(options = {}) {
  const menus = [
    {
      id: MENU_IDS.page,
      title: t('Ajouter cette page à URLQRCodePrinter'),
      contexts: ['page'],
    },
    {
      id: MENU_IDS.link,
      title: t('Ajouter ce lien à URLQRCodePrinter'),
      contexts: ['link'],
    },
    {
      id: MENU_IDS.selection,
      title: t('Ajouter « %s » à URLQRCodePrinter'),
      contexts: ['selection'],
      enabled: Boolean(options.includeSelection),
    },
  ];

  if (options.appUrl) {
    menus.push(
      { id: MENU_IDS.separator, type: 'separator', contexts: ['page', 'link', 'selection'] },
      {
        id: MENU_IDS.openApp,
        title: t('Ouvrir URLQRCodePrinter'),
        contexts: ['page', 'link', 'selection'],
      },
    );
  }

  return menus;
}

/**
 * Décide si un texte sélectionné peut raisonnablement être une URL.
 *
 * On reste permissif : « example.com » sans schéma est accepté, car c'est un
 * usage courant. En revanche une phrase contenant un point ne doit pas passer.
 *
 * @param {unknown} text
 * @returns {boolean}
 */
function looksLikeUrl(text) {
  if (typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed === '' || trimmed.length > 2048) return false;
  // Un texte contenant une espace n'est pas une URL, sauf s'il s'agit d'une
  // phrase dont on pourrait extraire un lien — cas qu'on ne devine pas.
  if (/\s/.test(trimmed)) return false;
  return isValidUrl(trimmed);
}

/**
 * Construit l'entrée de lien correspondant à un clic contextuel.
 *
 * Priorité au lien explicitement visé : dans un clic sur un lien, `pageUrl`
 * désigne la page qui le contient, ce qui n'est presque jamais ce que
 * l'utilisateur veut enregistrer.
 *
 * @param {{
 *   menuItemId?: string,
 *   linkUrl?: string,
 *   pageUrl?: string,
 *   selectionText?: string,
 *   srcUrl?: string,
 * }} info
 * @param {{ title?: string, url?: string }} [tab]
 * @returns {{ url: string, title: string, source: string, note: string }|null}
 *   `null` si rien d'exploitable n'a été fourni.
 */
function captureFromClick(info, tab) {
  if (!info || typeof info !== 'object') return null;

  const selection = typeof info.selectionText === 'string' ? info.selectionText.trim() : '';

  // 1. Sélection explicite : elle prime, l'utilisateur a désigné ce qu'il veut.
  if (info.menuItemId === MENU_IDS.selection || (selection !== '' && looksLikeUrl(selection))) {
    if (looksLikeUrl(selection)) {
      return { url: selection, title: '', source: 'context-menu', note: '' };
    }
  }

  // 2. Lien cliqué.
  if (typeof info.linkUrl === 'string' && info.linkUrl !== '' && isValidUrl(info.linkUrl)) {
    return {
      url: info.linkUrl,
      // Le texte du lien n'est pas exposé par l'API ; le domaine est la
      // meilleure description disponible sans requête réseau.
      title: selection || hostOf(info.linkUrl),
      source: 'context-menu',
      note: selection && !looksLikeUrl(selection) ? selection : '',
    };
  }

  // 3. Image cliquée : le plus souvent ce que l'utilisateur vise.
  if (typeof info.srcUrl === 'string' && info.srcUrl !== '' && isValidUrl(info.srcUrl)) {
    return { url: info.srcUrl, title: '', source: 'context-menu', note: '' };
  }

  // 4. Page courante, en dernier recours.
  const pageUrl = typeof info.pageUrl === 'string' && info.pageUrl !== ''
    ? info.pageUrl
    : tab?.url;
  if (typeof pageUrl === 'string' && pageUrl !== '' && isValidUrl(pageUrl)) {
    return {
      url: pageUrl,
      title: typeof tab?.title === 'string' ? tab.title : '',
      source: 'context-menu',
      note: '',
    };
  }

  return null;
}

/**
 * Construit l'entrée de lien pour « ajouter l'onglet courant » (bouton de la
 * barre d'outils). Distinct du clic contextuel : ici la page est la cible.
 *
 * @param {{ url?: string, title?: string }} tab
 * @param {{ source?: string }} [options]
 * @returns {{ url: string, title: string, source: string }|null}
 */
function captureFromTab(tab, options = {}) {
  if (!tab || typeof tab.url !== 'string' || !isValidUrl(tab.url)) return null;
  return {
    url: tab.url,
    title: typeof tab.title === 'string' ? tab.title : '',
    source: options.source ?? 'toolbar',
  };
}

/**
 * Résume une capture pour l'afficher à l'utilisateur.
 * @param {{ url: string, title?: string }} link
 * @param {number} [maxLength]
 * @returns {string}
 */
function describeCapture(link, maxLength = 60) {
  const label = link.title?.trim() || hostOf(link.url) || link.url;
  if (label.length <= maxLength) return label;
  return label.slice(0, maxLength - 1) + '…';
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/api.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Adaptateur entre les deux implémentations d'API d'extension.
 *
 * Chrome expose `chrome`, Safari expose `browser` (et accepte `chrome` en
 * alias). Les deux renvoient des promesses pour `storage` en MV3, mais leurs
 * surfaces diffèrent sur des points qui comptent ici :
 *
 * - **`contextMenus` n'existe pas sur Safari iOS.** MDN l'annonce non supporté
 *   et l'API n'y est pas documentée ; le code doit donc se contenter de son
 *   absence plutôt que d'échouer au chargement.
 * - **`tab.url` n'est pas garanti sur Safari iOS** avec la seule permission
 *   `activeTab`. Le motif recommandé par Apple passe par l'injection d'un
 *   script dans l'onglet actif, ce que fait `readTabContext`.
 *
 * Ces fonctions reçoivent l'API en paramètre plutôt que de lire un global :
 * elles restent ainsi testables hors navigateur.
 */

/**
 * Retrouve l'espace de noms des API d'extension.
 *
 * @param {any} [scope]
 * @returns {any|null} `browser` s'il existe, sinon `chrome`, sinon null.
 */
function resolveApi(scope = globalThis) {
  if (scope?.browser?.runtime) return scope.browser;
  if (scope?.chrome?.runtime) return scope.chrome;
  // Certains environnements exposent `browser` sans `runtime` : on l'accepte
  // en dernier recours plutôt que de déclarer l'extension inutilisable.
  if (scope?.browser) return scope.browser;
  if (scope?.chrome) return scope.chrome;
  return null;
}

/**
 * Indique si le menu contextuel est utilisable.
 *
 * @param {any} api
 * @returns {boolean}
 */
function contextMenusAvailable(api) {
  return Boolean(api?.contextMenus?.create && api?.contextMenus?.onClicked);
}

/**
 * Lit l'URL et le titre de l'onglet actif.
 *
 * On tente d'abord `tab.url`, qui suffit sur Chrome et sur Safari macOS. En
 * l'absence — cas attendu sur Safari iOS — on injecte une lecture dans la page,
 * ce qui fonctionne avec la seule permission `activeTab`, accordée au moment
 * où l'utilisateur ouvre la fenêtre de l'extension.
 *
 * @param {any} api
 * @param {{ id?: number, url?: string, title?: string }} tab
 * @returns {Promise<{ url: string, title: string, injected: boolean }|null>}
 */
async function readTabContext(api, tab) {
  if (!tab) return null;

  if (typeof tab.url === 'string' && tab.url !== '') {
    return { url: tab.url, title: tab.title ?? '', injected: false };
  }

  if (typeof tab.id !== 'number' || !api?.scripting?.executeScript) return null;

  try {
    const results = await api.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({ url: location.href, title: document.title }),
    });
    const first = Array.isArray(results) ? results[0] : results;
    const value = first?.result;
    if (!value || typeof value.url !== 'string' || value.url === '') return null;
    return { url: value.url, title: value.title ?? '', injected: true };
  } catch {
    // Page interne du navigateur, onglet non autorisé, injection refusée :
    // dans tous ces cas il n'y a simplement rien à enregistrer.
    return null;
  }
}

/**
 * Enregistre les entrées de menu en tolérant leur absence.
 *
 * @param {any} api
 * @param {Array<object>} definitions
 * @returns {Promise<{ supported: boolean, created: number }>}
 */
async function installContextMenus(api, definitions) {
  if (!contextMenusAvailable(api)) return { supported: false, created: 0 };

  try {
    await api.contextMenus.removeAll();
  } catch {
    // `removeAll` peut échouer au tout premier lancement : sans conséquence.
  }

  let created = 0;
  for (const definition of definitions) {
    try {
      await api.contextMenus.create(definition);
      created++;
    } catch {
      // Un identifiant déjà pris fait échouer `create` : on continue, le menu
      // existant reste utilisable.
    }
  }
  return { supported: true, created };
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/background.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Service worker de l'extension.
 *
 * Rôle volontairement mince : enregistrer le menu contextuel, enregistrer les
 * captures, et tenir le compteur affiché sur l'icône. La logique de décision
 * vit dans `core/capture.js`, testée hors navigateur.
 *
 * Un service worker MV3 est arrêté dès qu'il devient inactif : aucun état ne
 * doit vivre dans une variable de module. Le store relit donc `storage.local`
 * à chaque opération.
 *
 * Le module ne suppose ni l'espace de noms `chrome`, ni la présence du menu
 * contextuel : Safari expose `browser` et **ne fournit pas `contextMenus` sur
 * iOS**. Sans ces précautions, l'extension échouerait au chargement sur iPhone.
 */






const api = resolveApi();

/**
 * Couleurs du badge.
 *
 * Le badge est peint par le service worker, **pas** par la feuille de style :
 * c'est le troisième endroit où vivait la charte, et le seul qui ait gardé le
 * teal d'origine après la refonte. Il ne se voit nulle part dans le code de
 * l'interface — seulement dans la barre d'outils.
 *
 * Le compteur est à l'encre, comme celui de la fenêtre, et surtout **pas à
 * l'accent** : l'icône de la barre d'outils est déjà orange, un badge orange s'y
 * fondrait au lieu de s'en détacher.
 */
const BADGE_COUNT = '#1a1a1a';
const BADGE_ADDED = '#1c7c4a';
const BADGE_DUPLICATE = '#1a1a1a';
const BADGE_ERROR = '#b3122b';
/** Texte du badge : les quatre fonds sont sombres, le texte est donc clair. */
const BADGE_TEXT = '#ffffff';

const store = createChromeStorageStore({ area: api?.storage?.local });

/**
 * Impose la couleur du texte du badge, si l'API existe.
 *
 * `setBadgeTextColor` n'existe que depuis Chrome 110 et Safari l'ignore. L'appel
 * est isolé pour qu'une absence n'interrompe pas la pose du texte : sans cette
 * précaution, un `await` qui échoue laisserait le badge **vide** au lieu de le
 * laisser au navigateur le soin de choisir une couleur lisible.
 *
 * @returns {Promise<void>}
 */
async function applyBadgeTextColor() {
  try {
    await api.action.setBadgeTextColor?.({ color: BADGE_TEXT });
  } catch {
    // Le navigateur choisira lui-même une couleur de texte.
  }
}

/** Met à jour le badge avec le nombre de liens, ou le vide. */
async function refreshBadge() {
  try {
    const links = await store.list();
    await api.action.setBadgeBackgroundColor({ color: BADGE_COUNT });
    await applyBadgeTextColor();
    await api.action.setBadgeText({ text: links.length ? String(links.length) : '' });
  } catch {
    // L'API badge peut être absente ou refusée : ce n'est pas bloquant.
  }
}

/** Affiche brièvement un retour sur l'icône. */
async function flashBadge(text, color) {
  try {
    await api.action.setBadgeBackgroundColor({ color });
    await applyBadgeTextColor();
    await api.action.setBadgeText({ text });
    setTimeout(refreshBadge, 1500);
  } catch {
    // Idem : le badge est un confort, pas une fonction.
  }
}

/**
 * Installe le menu contextuel.
 *
 * `installContextMenus` absorbe l'absence de l'API : sur Safari iOS, cette
 * fonction ne fait rien et l'extension reste pleinement utilisable depuis la
 * fenêtre de la barre d'outils.
 *
 * @returns {Promise<void>}
 */
async function installMenus() {
  // La langue doit être connue avant de construire les libellés du menu :
  // le service worker lit `storage.local`, contrairement à `localStorage`.
  await initI18n();
  await installContextMenus(api, buildMenuDefinitions());
}

/**
 * Enregistre une capture et signale le résultat sur l'icône.
 * @param {object|null} capture
 */
async function record(capture) {
  if (!capture) {
    await flashBadge('!', BADGE_ERROR);
    return;
  }
  try {
    const { duplicate } = await store.add(capture);
    await flashBadge(duplicate ? '=' : '+', duplicate ? BADGE_DUPLICATE : BADGE_ADDED);
  } catch {
    await flashBadge('!', BADGE_ERROR);
  }
}

api?.runtime?.onInstalled?.addListener(() => {
  installMenus();
  refreshBadge();
});

api?.runtime?.onStartup?.addListener(() => {
  installMenus();
  refreshBadge();
});

// Reprise du badge au démarrage du service worker.
//
// `onInstalled` et `onStartup` ne couvrent pas le rechargement d'une extension
// non empaquetée, et `onStartup` ne se déclenche qu'au démarrage du navigateur.
// Le badge gardait donc la couleur de l'exécution précédente — c'est ainsi
// qu'une pastille teal a survécu à la refonte de la palette alors que le code
// livré ne contenait plus un seul teal.
//
// Le worker se réveille à chaque événement : le badge se réconcilie avec le
// stockage à ce moment-là. L'appel est volontairement non attendu : un `await`
// de premier niveau empêcherait l'enregistrement des écouteurs qui suivent, et
// la fenêtre resterait muette — panne déjà observée sur Safari.
refreshBadge();

// Le menu contextuel n'est branché que s'il existe réellement.
if (contextMenusAvailable(api)) {
  api.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === MENU_IDS.openApp) {
      api.tabs.create({ url: api.runtime.getURL('popup.html') });
      return;
    }
    await record(captureFromClick(info, tab));
  });
}

// Un changement de langue depuis la fenêtre ou l'application reconstruit le
// menu : sans cela, les libellés resteraient ceux de la langue précédente
// jusqu'au prochain démarrage du navigateur.
api?.storage?.onChanged?.addListener((changes, area) => {
  if (area === 'local' && changes?.locale) installMenus();
});

api?.runtime?.onMessage?.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'refresh-badge') {
    refreshBadge().then(() => sendResponse({ ok: true }));
    return true; // réponse asynchrone
  }
  if (message?.type === 'record-capture') {
    record(message.capture).then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});
