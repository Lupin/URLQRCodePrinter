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
  "Ouvrir l'application": "Open the app",
  "Titre du lien": "Link title",
  // Planche : recadrage de la grille, mise en page, tri et note de collection
  "{asked} colonnes ne tiennent pas : {kept} au maximum sur cette feuille.":
    "{asked} columns do not fit: {kept} at most on this sheet.",
  "{asked} rangées ne tiennent pas : {kept} au maximum sur cette feuille.":
    "{asked} rows do not fit: {kept} at most on this sheet.",
  "Réduisez l'écart ou la marge pour en placer davantage.":
    "Reduce the gap or the margin to fit more.",
  "Les marges ne laissent aucune place à une étiquette sur cette feuille.":
    "The margins leave no room for a label on this sheet.",
  "Page d'information": "Information page",
  "Découpe": "Cutting",
  "Page": "Page",
  "Ce qu'on imprime": "What gets printed",
  "Trier": "Sort",
  "{label} pour {title}": "{label} for {title}",
  "raison inconnue": "unknown reason",
  "{label} — n'a pas répondu": "{label} — did not respond",
  "{label} n'a pas répondu à l'instant : {message} Essayez {autre}.":
    "{label} did not respond just now: {message} Try {autre}.",
  "{label} n'a pas répondu à l'instant : {message} Aucun autre service n'est proposé.":
    "{label} did not respond just now: {message} No other service is offered.",
  "Réorganiser": "Reorder",
  "Terminer le rangement": "Finish reordering",
  "Le rangement déplace un lien dans la collection, et le tableau imprimé suit cet ordre. Un tri le renumérote.":
    "Reordering moves a link within the collection, and the printed table follows that order. Sorting renumbers it instead.",
  "Faites glisser une ligne par sa poignée, ou servez-vous des flèches. Échap referme le rangement.":
    "Drag a row by its handle, or use the arrows. Escape closes reordering.",
  "Ordre manuel": "Manual order",
  "Titre, A → Z": "Title, A → Z",
  "Titre, Z → A": "Title, Z → A",
  "Domaine, A → Z": "Domain, A → Z",
  "Domaine, Z → A": "Domain, Z → A",
  "Tag, A → Z": "Tag, A → Z",
  "Tag, Z → A": "Tag, Z → A",
  "Date, du plus récent": "Date, newest first",
  "Date, du plus ancien": "Date, oldest first",
  "Monter": "Move up",
  "Descendre": "Move down",
  "Déplacer {title} vers le haut": "Move {title} up",
  "Déplacer {title} vers le bas": "Move {title} down",
  "Le tri range la liste et renumérote le tableau imprimé. Le rangement n'existe qu'en ordre manuel : on ne réordonne pas une liste triée.":
    "Sorting orders the list and renumbers the printed table. Reordering exists only in manual order: you do not reorder a sorted list.",
  "Note de la collection (facultative)": "Collection note (optional)",
  "Numéroter à partir de": "Number from",
  "Le numéro du premier lien. Il s'affiche dans la liste et s'imprime avec la planche et le tableau ; effacer les liens ne le remet pas à 1.":
    "The number of the first link. It shows in the list and prints with the sheet and the table; clearing the links does not reset it to 1.",
  "De quoi parle cette collection…": "What this collection is about…",
  "Exporter ces étiquettes (ZIP)": "Export these labels (ZIP)",
  "Export impossible": "Export failed",
  "Étiquettes exportées : {filename}": "Labels exported: {filename}",
  "{count} étiquette — {filename} enregistré": "{count} label — {filename} saved",
  "{count} étiquettes — {filename} enregistré": "{count} labels — {filename} saved",
  "Exemplaires": "Copies",
  "Un seul lien": "A single link",
  "Plusieurs": "Several",
  "Toute la collection ({count} lien)": "The whole collection ({count} link)",
  "Toute la collection ({count} liens)": "The whole collection ({count} links)",
  "Seulement ceux que je coche ({count} lien coché)": "Only the ones I tick ({count} link ticked)",
  "Seulement ceux que je coche ({count} liens cochés)": "Only the ones I tick ({count} links ticked)",
  "le lien affiché": "the displayed link",
  "Arrêter": "Stop",
  "Aperçu à la taille réelle": "Preview at real size",
  "Étiquette": "Label",
  "En-tête de page": "Page header",
  "Exporter la planche (ZIP)": "Export the sheet (ZIP)",
  "Planche exportée : {filename}": "Sheet exported: {filename}",
  "Nom de la collection en haut de chaque page": "Collection name at the top of every page",
  "Avec la date d'impression": "With the print date",
  "Avec la note de collection": "With the collection note",
  "Ajuster l'espacement": "Adjust the spacing",
  "Aperçu à {multiple} × la taille réelle ({width} × {height} mm).":
    "Preview at {multiple} × real size ({width} × {height} mm).",
  "Aperçu à la taille réelle ({width} × {height} mm).":
    "Preview at real size ({width} × {height} mm).",
  "Date non imprimée : elle exigerait un texte trop petit pour être lu.":
    "Date not printed: it would need text too small to read.",
  "Date non imprimée : elle ne tient pas sur ce format, réduisez la taille du texte.":
    "Date not printed: it does not fit this format, reduce the text size.",
  "Texte empilé : le QR Code laisse trop peu de largeur pour une colonne de texte.":
    "Text stacked: the QR Code leaves too little width for a text column.",
  "Orientation : {label}": "Orientation: {label}",
  "Ce lien a un raccourci : cochez son adresse courte dans la liste, et le QR Code l'encodera à la place.":
    "This link has a short URL: tick its short address in the list, and the QR Code will encode that instead.",
  "Lien court :": "Short link:",
  "Encoder {url} pour « {title} »": "Encode {url} for “{title}”",
  "Encoder ce lien dans le QR Code, à la place de l'adresse d'origine.":
    "Encode this link in the QR Code, instead of the original address.",
  "Le texte imprimé n'y change rien : c'est la largeur du QR Code qui dépasse celle de l'étiquette.":
    "The printed text changes nothing here: it is the QR Code's width that exceeds the label's.",
  "La place manque en hauteur : décochez du texte sous le QR Code, ou prenez une étiquette plus longue.":
    "Height is what runs short: untick some text below the QR Code, or use a longer label.",
  "Disposition précédente": "Previous layout",
  "Disposition suivante": "Next layout",
  "Les {asked} ne peuvent pas tenir sur une page : {columns} × {rows} à la place.":
    "The {asked} cannot fit on one page: {columns} × {rows} instead.",
  "Écart {gap} mm et marge {margin} mm : les {columns} × {rows} tiennent sur la feuille.":
    "Gap {gap} mm and margin {margin} mm: the {columns} × {rows} fit on the sheet.",
  "Imprimer la note de collection sous le nom": "Print the collection note under the name",
  "Écrivez d'abord la note de collection, dans le panneau de gauche.":
    "Write the collection note first, in the left-hand panel.",
  "L'en-tête a besoin de {need} mm de marge en haut, et la marge actuelle est de {margin} mm. Augmentez la marge, ou décochez l'en-tête.":
    "The header needs {need} mm of top margin, and the current margin is {margin} mm. Increase the margin, or untick the header.",
  "Tracer une bordure autour de chaque étiquette": "Draw a border around each label",
  "Vider la collection": "Clear collection",
  "Collection": "Collection",
  "Collection précédente": "Previous collection",
  "Collection suivante": "Next collection",
  "Nouvelle collection": "New collection",
  "Mise en page automatique": "Automatic layout",
  "Mise en page automatique : {columns} × {rows} = {perPage} étiquettes de {width} × {height} mm par page, calculées pour ce contenu.":
    "Automatic layout: {columns} × {rows} = {perPage} labels of {width} × {height} mm per page, computed for this content.",
  "Mise en page automatique : non appliquée — les cotes du fabricant sont conservées.":
    "Automatic layout: not applied — the manufacturer’s dimensions are kept.",
  "Les {count} étiquettes ne tiennent pas sur une page : la planche en demande {pages}.":
    "The {count} labels do not fit on one page: the sheet needs {pages}.",
  "Une planche du commerce garde les cotes de son fabricant : la mise en page automatique ne s'y applique pas.":
    "A commercial sheet keeps its manufacturer’s dimensions: automatic layout does not apply to it.",
  "Création impossible": "Could not create the collection",
  "Suppression impossible": "Could not delete the collection",
  "Il doit rester au moins une collection": "At least one collection must remain",
  "Renommage impossible": "Could not rename the collection",
  "Collection supprimée": "Collection deleted",
  "Collection affichée": "Displayed collection",
  "Nouvelle": "New",
  "Déplacer vers…": "Move to…",
  "Déplacer vers une collection": "Move to a collection",
  "{count} lien déplacé vers « {name} »": "{count} link moved to “{name}”",
  "{count} liens déplacés vers « {name} »": "{count} links moved to “{name}”",
  "{count} adresse déjà présente : fusionnée": "{count} address already there: merged",
  "{count} adresses déjà présentes : fusionnées": "{count} addresses already there: merged",
  "Confirmer : {count} lien sera perdu": "Confirm: {count} link will be lost",
  "Confirmer : {count} liens seront perdus": "Confirm: {count} links will be lost",
  "Les collections ne sont disponibles que dans l'extension":
    "Collections are available in the extension only",
  "Navigation privée : ces liens ne sont conservés que jusqu'à la fermeture du navigateur.":
    "Private browsing: these links are kept only until the browser closes.",
  "Si vous voulez un lien plus court, choisissez un service puis cliquez sur Raccourcir. Rien ne change tant que vous ne le faites pas.":
    "If you want a shorter link, choose a service and then click Shorten. Nothing changes until you do.",
  "T.LY est proposé par défaut : le lien est plus court et reste anonyme.":
    "T.LY is offered by default: the link is shorter and stays anonymous.",
  "{name} est le service que vous avez choisi : {note}":
    "{name} is the service you chose: {note}",
  "Vous pouvez aussi choisir un autre service de raccourcissement.":
    "You can also choose another shortening service.",
  "{reason} Portez la marge haute à {mm} mm, ou décochez l'en-tête.":
    "{reason} Raise the top margin to {mm} mm, or untick the header.",
  "Créer un compte T.LY (parrainage)": "Create a T.LY account (referral)",
  "Ouvre la page d'inscription T.LY : le projet est crédité du parrainage.":
    "Opens the T.LY sign-up page: the project is credited with the referral.",
  "Navigation privée": "Private browsing",
  "Fenêtre privée : cette collection n'est conservée que jusqu'à la fermeture du navigateur.":
    "Private window: this collection is kept only until the browser closes.",
  "Fenêtre privée : les liens enregistrés rejoignent une collection conservée sur votre appareil.":
    "Private window: saved links go to a collection kept on your device.",
  "Chargement…": "Loading…",
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
  "Collectez vos liens, imprimez-les en QR Codes.": "Collect your links, print them as QR Codes.",
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
  "T.LY (défaut) — lien plus court": "T.LY (default) — shorter link",
  "TinyURL — liens durables": "TinyURL — durable links",
  "Lien plus court, servi par t.ly. Les liens créés ici sont anonymes : ils ne sont rattachés à aucun compte T.LY.":
    "Shorter link, served by t.ly. Links created here are anonymous: they are not attached to any T.LY account.",
  "Sans clé d'API, HTTPS, liens durables. Service commercial.":
    "No API key, HTTPS, durable links. Commercial service.",
  "Sans clé ni statistiques. Service bénévole, régulièrement indisponible.":
    "No key and no statistics. Volunteer-run service, regularly unavailable.",
  "Même infrastructure que is.gd, mais les liens affichent un avertissement avant redirection.":
    "Same infrastructure as is.gd, but links show a warning before redirecting.",
  "Sans clé, statistiques de clics. Répond en HTTP : le lien est ramené en HTTPS.":
    "No key, click statistics. Answers over HTTP: the link is brought back to HTTPS.",
  "T.LY n'accepte un lien anonyme que depuis l'extension. Choisissez un autre service, ou passez par la fenêtre de l'extension.":
    "T.LY accepts an anonymous link only from the extension. Choose another service, or use the extension window.",
  "is.gd — sans statistiques": "is.gd — no statistics",
  "v.gd — avertissement avant redirection": "v.gd — warning before redirect",
  "spoo.me — statistiques de clics": "spoo.me — click statistics",
  "Tout sélectionner": "Select all",
  "Aucun lien.": "No links.",
  "Ajoutez-en un ci-dessus, importez une archive, ou utilisez l'extension navigateur pour les collecter au clic droit.": "Add one above, import an archive, or use the browser extension to collect them by right-clicking.",
  "Exporter": "Export",
  "Tableur + QR Code": "Spreadsheet + QR Code",
  "Archive": "Archive",
  "Importer…": "Import…",
  "Relit l'archive JSON, le dossier d'étiquettes .zip ou un CSV exporté d'ici": "Reads back the JSON archive, the .zip label folder or a CSV exported from here",
  "Importer relit l'Archive, le .zip d'étiquettes ou un CSV, puis demande s'il faut fusionner, remplacer ou créer une collection ; les liens déjà présents sont ignorés.":
    "Import reads back the Archive, the label .zip or a CSV, then asks whether to merge, replace or create a collection; links already present are ignored.",
  "{count} lien lu dans {file}": "{count} link read from {file}",
  "{count} liens lus dans {file}": "{count} links read from {file}",
  "Fusionner avec « {name} »": "Merge into “{name}”",
  "Ajoute les liens lus à la collection affichée ; son nom et sa note ne changent pas.":
    "Adds the links read to the displayed collection; its name and note stay unchanged.",
  "Remplacer « {name} »": "Replace “{name}”",
  "Vide la collection affichée, puis y met les liens du fichier : son nom et sa note deviennent ceux du fichier.":
    "Empties the displayed collection, then puts the file’s links in it: its name and note become those of the file.",
  "Nouvelle collection « {name} »": "New collection “{name}”",
  "Crée une collection à part et y range les liens lus ; la collection affichée n'est pas touchée.":
    "Creates a separate collection and files the links read there; the displayed collection is left untouched.",
  "Le fichier porte le nom de collection « {name} ».":
    "The file carries the collection name “{name}”.",
  "Le fichier porte le nom de collection « {name} » et sa note.":
    "The file carries the collection name “{name}” and its note.",
  "Le fichier ne porte ni nom ni note de collection : « Remplacer » viderait aussi le nom et la note de la collection affichée.":
    "The file carries no collection name or note: “Replace” would also empty the name and note of the displayed collection.",
  "Navigation privée : seuls les liens changent ; son nom et sa note ne sont pas modifiables.":
    "Private browsing: only the links change; its name and note cannot be edited.",
  "Nom vide : cette collection s'affiche et s'exporte sous le nom « {name} ».":
    "Empty name: this collection is displayed and exported as “{name}”.",
  "Mise en forme": "Layout",
  "Le QR Code pointe vers": "The QR Code points to",
  "Planche d'étiquettes": "Label sheet",
  "Tableau": "Table",
  "Étiquette Niimbot": "Niimbot label",
  "Étiquette (divers)": "Label (misc.)",
  "Disposition": "Layout",
  "Largeur du QR Code": "QR Code width",
  "Taille du texte (pt)": "Text size (pt)",
  "Sous chaque QR Code": "Below each QR Code",
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
  "Taille du QR Code": "QR Code size",
  "Orientation de la page": "Page orientation",
  // Le sens de la feuille, sous « Orientation de la page ». Les deux libellés
  // sont donnés à `t()` par variable : ils échappaient au relevé des clés, et
  // « Paysage » s'affichait en français dans l'interface anglaise.
  "Portrait": "Portrait",
  "Paysage": "Landscape",
  "Tableau imprimé": "Printed table",
  "N°": "No.",
  "QR Code": "QR Code",
  "Titre": "Title",
  "Tags": "Tags",
  "Note": "Note",
  "Date": "Date",
  "Grille et bordures": "Grid and borders",
  "{count} ligne imprimée sur {pages} page.": "{count} row printed on {pages} page.",
  "{count} lignes imprimées sur {pages} pages.": "{count} rows printed on {pages} pages.",
  "Un tableau dense, adapté à une relecture ou à un archivage papier.": "A dense table, suited to review or paper archiving.",
  "Exporter le tableau (ZIP)": "Export table (ZIP)",
  "L'export du tableau produit un modèle JSON, les QR Codes en PNG et une page HTML. La sélection et les colonnes cochées s'appliquent.": "The table export produces a JSON model, the QR Codes as PNG and an HTML page. The selection and checked columns apply.",
  "Format d'étiquette": "Label format",
  "Densité": "Density",
  "Copies": "Copies",
  "Disposition du texte": "Text orientation",
  // Les cinq dispositions de texte. Mêmes mots que le guide anglais, qui les
  // portait déjà : les libellés vivent dans un tableau d'`app.js` et sont donnés
  // à `t()` par variable, donc le relevé des clés ne les voyait pas — la liste
  // entière s'affichait en français dans l'interface anglaise.
  "Texte droit, sous le QR Code": "Text upright, below the QR Code",
  "Texte droit, au-dessus du QR Code": "Text upright, above the QR Code",
  "Texte tourné, se lit de bas en haut": "Rotated text, read bottom to top",
  "Texte tourné, se lit de haut en bas": "Rotated text, read top to bottom",
  "Texte à droite du QR Code": "Text to the right of the QR Code",
  "Lien à imprimer": "Link to print",
  "Consommable": "Supply",
  "Taille du texte (mm)": "Text size (mm)",
  "Taille du titre (mm)": "Title size (mm)",
  "Taille du QR Code (mm)": "QR Code size (mm)",
  "QR Code : {mm} mm de côté, {px} px par module. Réglable de {min} à {max} mm sur cette tête.": "QR Code: {mm} mm wide, {px} px per module. Adjustable from {min} to {max} mm on this printhead.",
  "La taille demandée a été ramenée à ce qui tient.": "The requested size was brought back to what fits.",
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
  "Marge (mm)": "Margin (mm)",
  "Traits de coupe": "Cut marks",
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
  " — texte empilé : le QR Code laisse trop peu de largeur pour une colonne de texte.": " — stacked text: the QR Code leaves too little width for a text column.",
  " — {count} raccourci en place": " — {count} short link in place",
  " — {count} raccourcis en place": " — {count} short links in place",
  "Ajoutez des liens pour voir un aperçu.": "Add links to see a preview.",
  "Ajoutez un tag ou une note depuis la liste (bouton ✎) pour pouvoir les imprimer.": "Add a tag or a note from the list (✎ button) to be able to print them.",
  "Annuler": "Cancel",
  "Enregistrer": "Save",
  "Fermer": "Close",
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
  "Chaque ligne de plus réduit la place du QR Code.": "Each extra line reduces the space for the QR Code.",
  "Collection vidée": "Collection cleared",
  "Composition de l'étiquette…": "Composing the label…",
  "Connecté : {details}.": "Connected: {details}.",
  "Date de collecte sur sa propre ligne — {sample}.": "Collection date on its own line — {sample}.",
  "Date non imprimée sur {count} étiquette : elle ne tient pas sur une ligne à cette largeur.": "Date not printed on {count} label: it does not fit on one line at this width.",
  "Texte coupé sur {count} étiquette : il ne tient pas entier à cette taille. Raccourcissez l'adresse, réduisez le QR Code, décochez le titre ou l'URL, ou prenez une étiquette plus grande.":
    "Text cut on {count} label: it does not fit whole at this size. Shorten the address, reduce the QR Code, untick the title or the URL, or use a larger label.",
  "Texte coupé sur {count} étiquettes : ils ne tiennent pas entiers à cette taille. Raccourcissez les adresses, réduisez le QR Code, décochez le titre ou l'URL, ou prenez une étiquette plus grande.":
    "Text cut on {count} labels: they do not fit whole at this size. Shorten the addresses, reduce the QR Code, untick the title or the URL, or use a larger label.",
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
  "Le QR Code encode l'URL collectée.": "The QR Code encodes the collected URL.",
  "Ce choix vaut pour toute la collection ; chaque lien peut dire le contraire dans la liste.":
    "This choice applies to the whole collection; each link can say the opposite in the list.",
  "Le QR Code seul, sans texte sous lui.": "The QR Code alone, with no text below it.",
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
  "QR Code de {side} mm ({module} mm par module, minimum {minimum} mm) — réglable de {range} — {lines} de texte.": "QR Code {side} mm ({module} mm per module, minimum {minimum} mm) — adjustable from {range} — {lines} of text.",
  "QR Code {done}/{total}…": "QR Code {done}/{total}…",
  "Raccourcissement impossible : {message}": "Shortening failed: {message}",
  "Raccourcissement via {name}…": "Shortening via {name}…",
  "Rang dans la collection, celui du tableau imprimé": "Rank in the collection, the one in the printed table",
  "Recherche de l'imprimante…": "Searching for the printer…",
  "Rouleau continu : la longueur suit le contenu.": "Continuous roll: the length follows the content.",
  "Saisissez une URL.": "Enter a URL.",
  "Sous le QR Code : {list}. Le texte est découpé à la largeur de la tête.": "Below the QR Code: {list}. The text is wrapped to the width of the printhead.",
  "Stockage temporaire : IndexedDB indisponible, les liens seront perdus": "Temporary storage: IndexedDB unavailable, links will be lost",
  "Supprimer {title}": "Delete {title}",
  "Sélectionner {title}": "Select {title}",
  "Rien à imprimer : cochez au moins un lien dans la liste, ou choisissez « Toute la collection ».":
    "Nothing to print: tick at least one link in the list, or choose \u201cThe whole collection\u201d.",
  "{profile} — « {title} » : {reason}": "{profile} — \u201c{title}\u201d: {reason}",
  "Taille des étiquettes déduite de ces six valeurs : {size}, {columns} × {rows} par feuille.": "Label size derived from these six values: {size}, {columns} × {rows} per sheet.",
  "Texte de {size} mm de haut, {lines} de texte.": "Text {size} mm high, {lines} of text.",
  "Texte coupé : il ne tient pas entier sur cette étiquette. Raccourcissez l'adresse, décochez du contenu, ou prenez une étiquette plus longue.": "Text cut off: it does not fit whole on this label. Shorten the address, untick some content, or take a longer label.",
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
  "{count} lien raccourci : un QR Code plus court se scanne plus vite et tient sur une plus petite étiquette.": "{count} shortened link: a shorter QR Code scans faster and fits on a smaller label.",
  "{count} liens": "{count} links",
  "{count} liens cochés": "{count} checked links",
  "{count} liens importés": "{count} imported links",
  "{count} liens raccourcis : un QR Code plus court se scanne plus vite et tient sur une plus petite étiquette.": "{count} shortened links: a shorter QR Code scans faster and fits on a smaller label.",
  "{count} ligne": "{count} line",
  "{count} lignes": "{count} lines",
  "{count} page": "{count} page",
  "{count} pages": "{count} pages",
  "{count} px de tête": "{count} px printhead",
  "{count} raccourci retiré": "{count} short link removed",
  "{count} raccourcis retirés": "{count} short links removed",
  "{count} étiquette imprimée": "{count} label printed",
  "{count} étiquette par page": "{count} label per page",
  "{count} étiquettes imprimées": "{count} labels printed",
  "{count} étiquettes par page": "{count} labels per page",
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
  // Les consommables dont le libellé porte un mot français — les cotes seules
  // s'écrivent pareil dans les deux langues et n'ont pas besoin d'entrée. Ces
  // libellés sont eux aussi donnés à `t()` par variable : ils manquaient sans
  // que rien ne le signale, et s'affichaient en français.
  "25 × 9,5 mm": "25 × 9.5 mm",
  "36,5 × 9,5 mm": "36.5 × 9.5 mm",
  "30 × 70 mm (bijouterie)": "30 × 70 mm (jewellery)",
  "25 × 78 mm (câble)": "25 × 78 mm (cable)",
  "35,25 × 50 mm (auto-pelliculé)": "35.25 × 50 mm (self-laminating)",
  "20 × 20 mm (rond)": "20 × 20 mm (round)",
  "24 × 13 mm (rond)": "24 × 13 mm (round)",
  "28 × 14 mm (rond)": "28 × 14 mm (round)",
  "28 × 15 mm (rond)": "28 × 15 mm (round)",
  "31 × 31 mm (rond)": "31 × 31 mm (round)",
  "34 × 17 mm (rond)": "34 × 17 mm (round)",
  "50 × 50 mm (rond)": "50 × 50 mm (round)",
  "Niimbot D110 — 12 mm utile (203 dpi)": "Niimbot D110 — 12 mm usable (203 dpi)",
  "Zebra 2 pouces — 54 mm (203 dpi)": "Zebra 2 inches — 54 mm (203 dpi)",
  "Générique — 50 × 30 mm (300 dpi)": "Generic — 50 × 30 mm (300 dpi)",
  "Générique — 70 × 40 mm (300 dpi)": "Generic — 70 × 40 mm (300 dpi)",
  "Planche A4 — 3 × 8 (63,5 × 33,9 mm)": "A4 sheet — 3 × 8 (63.5 × 33.9 mm)",
  "Centré": "Centered",
  "En haut": "Top",
  "Réparti (QR Code en haut, texte en bas)": "Spread (QR Code at top, text at bottom)",
  "URL trop longue : le QR Code fait {size} px pour {width} px de large. Raccourcissez l'URL ou utilisez une étiquette plus large.": "URL too long: the QR Code is {size} px for {width} px of width. Shorten the URL or use a wider label.",
  "QR Code trop dense : {px} px par module (minimum {min}). Raccourcissez l'URL ou augmentez la largeur de l'étiquette.": "QR Code too dense: {px} px per module (minimum {min}). Shorten the URL or increase the label width.",
  "Dispositions génériques": "Generic layouts",
  "Avery — A4": "Avery — A4",
  "Avery — Letter (US)": "Avery — Letter (US)",
  "A4 — 3 × 4 grandes étiquettes QR Code (60 × 60 mm)": "A4 — 3 × 4 large QR Code labels (60 × 60 mm)",
  "L'imprimante a signalé une erreur : {label}": "The printer reported an error: {label}",
  "L'impression n'a pas confirmé son achèvement après {ms} ms. L'étiquette est peut-être incomplète.": "Printing did not confirm completion after {ms} ms. The label may be incomplete.",
  "URL attendue sous forme de chaîne": "URL must be a string",
  "URL vide": "Empty URL",
  "Seuls les schémas http et https sont pris en charge": "Only http and https schemes are supported",
  "URL invalide : {input}": "Invalid URL: {input}",
  "Nom d'hôte invalide : {host}": "Invalid host name: {host}",
  "createLink exige au minimum { url }": "createLink requires at least { url }",
  "{width} mm × {height} px — {widthPx} × {heightPx} px à {dpi} dpi": "{width} mm × {height} px — {widthPx} × {heightPx} px at {dpi} dpi",
  "URL trop longue pour ce format : le QR Code fait {size} px pour {width} px de large.": "URL too long for this format: the QR Code is {size} px for {width} px of width.",
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

  // Mention de confidentialité — page présentée avant toute collecte.
  "Confidentialité — URLQRCodePrinter": "Privacy — URLQRCodePrinter",
  "Confidentialité": "Privacy",
  "URLQRCodePrinter collecte les liens que vous choisissez, et rien d'autre. Avant de commencer, voici exactement ce qu'il lit.":
    "URLQRCodePrinter collects the links you choose, and nothing else. Before you start, here is exactly what it reads.",
  "Ce que l'extension lit": "What the extension reads",
  "L'adresse et le titre de la page sur laquelle vous agissez — celle du clic droit, ou celle de l'onglet courant quand vous cliquez sur le bouton. Uniquement à ce moment-là.":
    "The address and title of the page you act on — the one you right-clicked, or the current tab when you click the button. Only at that moment.",
  "Ce que l'extension ne fait pas": "What the extension does not do",
  "Aucun accès à votre historique de navigation.": "No access to your browsing history.",
  "Aucune lecture en arrière-plan, ni des onglets que vous ne visez pas.":
    "No reading in the background, and no reading of tabs you did not target.",
  "Aucun compte, aucun serveur de l'éditeur.": "No account, and no server run by the publisher.",
  "Aucune mesure d'audience, aucune publicité, aucune revente de données.":
    "No analytics, no advertising, no selling of data.",
  "Aucun code hébergé à distance : tout est embarqué dans l'extension.":
    "No remotely hosted code: everything ships inside the extension.",
  "Où vont vos liens": "Where your links go",
  "Ils restent sur votre appareil, dans le stockage local du navigateur. Une seule action envoie quelque chose sur le réseau : si vous demandez le raccourcissement d'un lien, cette adresse est transmise au service que vous avez choisi (TinyURL, is.gd, v.gd ou spoo.me).":
    "They stay on your device, in the browser's local storage. One action alone sends anything over the network: if you ask for a link to be shortened, that address is sent to the service you chose (TinyURL, is.gd, v.gd or spoo.me).",
  "Votre accord": "Your consent",
  "J'accepte": "I accept",
  "Je refuse": "I decline",
  "Sans votre accord, l'extension reste installée mais n'enregistre aucun lien. Vous pourrez changer d'avis depuis sa fenêtre.":
    "Without your consent, the extension stays installed but records no link. You can change your mind from its popup.",
  "En savoir plus": "Learn more",
  "La politique de confidentialité complète est publiée avec le code source du projet.":
    "The full privacy policy is published alongside the project's source code.",
  "Accord enregistré. Vous pouvez ajouter des liens.":
    "Consent recorded. You can now add links.",
  "Refus enregistré. Aucun lien ne sera collecté.":
    "Refusal recorded. No link will be collected.",
  "Enregistrement impossible : stockage indisponible.":
    "Could not record your choice: storage is unavailable.",

  // Rappel dans la fenêtre tant que la mention n'a pas été acceptée.
  "Avant d'enregistrer un lien, lisez la mention de confidentialité.":
    "Before recording a link, please read the privacy notice.",
  "Lire la mention": "Read the notice",
  "La mention a changé : relisez-la pour continuer à enregistrer.":
    "The notice has changed: read it again to keep saving links.",
  "Refus enregistré : acceptez la mention pour enregistrer un lien.":
    "Consent declined: accept the notice to record a link.",
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
 * @property {string}   url       URL absolue normalisée — c'est elle qui est encodée dans le QR Code.
 * @property {string}   title     Titre lisible de la page (peut être vide).
 * @property {string}   note      Note libre de l'utilisateur.
 * @property {string[]} tags      Étiquettes de classement, sans « # », dédoublonnées.
 * @property {number}   createdAt Date de collecte (epoch ms).
 * @property {number}   updatedAt Dernière modification (epoch ms).
 * @property {string}   source    Origine : 'context-menu' | 'toolbar' | 'manual' | 'import' | 'share'.
 * @property {string}   favicon   URL du favicon, ou chaîne vide.
 * @property {number}   [order]   Position voulue dans la collection, ou absente.
 *   Absente tant que l'utilisateur n'a rien réordonné : la collection suit alors
 *   la date, comme avant. Un rang explicite est un entier croissant ; les liens
 *   qui en portent un passent devant ceux qui n'en ont pas.
 * @property {boolean}  [useShort] Ce que le QR Code de **ce lien** doit encoder.
 *   `true` le lien raccourci, `false` l'URL collectée, absent : le réglage
 *   global décide. L'absence n'est pas `false` — elle veut dire « je n'ai rien
 *   décidé pour celui-ci », et c'est ce qui permet à un réglage global de
 *   continuer de valoir pour les liens qu'on n'a pas touchés.
 * @property {string}   shortUrl  Lien raccourci, ou chaîne vide. N'écrase jamais `url` :
 *   le lien d'origine reste la source de vérité, un service tiers pouvant fermer.
 * @property {string}   shortProvider Identifiant du service qui a produit `shortUrl`.
 * @property {number}   shortenedAt Date du raccourcissement (epoch ms), 0 si jamais raccourci.
 * @property {string}   [collectionId] Collection à laquelle le lien appartient.
 *   Absente sur les liens enregistrés avant que les collections existent : ils
 *   appartiennent alors à la collection par défaut (voir `collections.js`), et
 *   on ne les réécrit pas — une migration qui toucherait chaque enregistrement
 *   pour un champ que personne n'a demandé serait un coût sans contrepartie.
 */

/** Origines reconnues. Toute autre valeur est ramenée à 'manual'. */
const SOURCES = ['context-menu', 'toolbar', 'manual', 'import', 'share'];

/**
 * Longueur maximale d'un titre conservé.
 *
 * Exporté : le champ de saisie du titre, dans la fenêtre de l'extension, doit
 * porter la même borne. Une seconde valeur écrite dans le HTML finirait par
 * diverger, et la saisie se ferait couper sans que rien ne l'annonce.
 */
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
 * Règles de dépliage des redirections de moteur de recherche.
 *
 * Un moteur enveloppe chaque résultat dans une adresse de son cru : cliquer sur
 * « Wikipédia » dans une page de résultats donne `google.com/url?q=<destination>`
 * et non la destination. Enregistrée telle quelle, cette adresse est longue — le
 * QR Code s'en trouve plus dense, et ne tient plus sur une étiquette étroite —,
 * elle porte le contexte de la recherche (`sa=U&ved=…`), et elle ne dit rien de
 * ce qu'elle contient : la liste affiche « google.com ».
 *
 * Chaque règle est un hôte, un chemin, et les paramètres qui portent la
 * destination, du plus explicite au plus ancien. La liste est **courte à
 * dessein** : chaque entrée est une convention d'un tiers, qui peut changer sans
 * prévenir, et une règle fausse vaut moins qu'une règle absente. Un moteur absent
 * de cette table garde son adresse d'origine.
 */
const REDIRECTIONS = Object.freeze([
  {
    // Google : /url?q=<destination>, et /url?url=<destination> sur les anciennes
    // pages. Le domaine varie selon le pays (google.fr, google.co.uk).
    hote: /^(?:www\.)?google\.[a-z]{2,}(?:\.[a-z]{2})?$/i,
    chemin: '/url',
    parametres: ['q', 'url'],
  },
  {
    // Bing : /ck/a?…&u=a1<destination en base64url>.
    hote: /^(?:www\.)?bing\.com$/i,
    chemin: '/ck/a',
    parametres: ['u'],
    base64: true,
  },
  {
    // DuckDuckGo : /l/?uddg=<destination encodée>.
    hote: /^(?:www\.)?duckduckgo\.com$/i,
    chemin: '/l',
    parametres: ['uddg'],
  },
]);

/** Nombre de redirections suivies avant de garder ce qu'on a. */
const REDIRECTIONS_MAX = 4;

/**
 * Décode la charge d'une redirection Bing : `a1` puis du base64url.
 *
 * Rend une chaîne vide quand la charge n'est pas du base64 : mieux vaut garder
 * l'adresse d'origine que d'inventer une destination.
 *
 * @param {string} value
 * @returns {string}
 */
function decodeBase64Url(value) {
  const charge = value.replace(/^a1/, '').replace(/-/g, '+').replace(/_/g, '/');
  if (charge === '') return '';
  try {
    // `atob` rend du latin-1 : on repasse par les octets, sans quoi une adresse
    // accentuée reviendrait abîmée.
    const binaire = atob(charge.padEnd(Math.ceil(charge.length / 4) * 4, '='));
    const octets = Uint8Array.from(binaire, (caractere) => caractere.charCodeAt(0));
    return new TextDecoder().decode(octets);
  } catch {
    return '';
  }
}

/**
 * La destination portée par une adresse de redirection, ou `null`.
 *
 * Seule une destination **http(s) absolue** est acceptée : une valeur relative,
 * un `javascript:` ou un texte quelconque laissent l'enveloppe en place. Le
 * contrôle est refait ici, et non supposé : c'est ce qui empêche une adresse
 * fabriquée de faire entrer autre chose qu'un lien web dans la collection.
 *
 * @param {URL} parsed
 * @returns {URL|null}
 */
function destinationPortee(parsed) {
  // Un chemin se compare sans son slash final : `/l/` et `/l` sont le même.
  const chemin = parsed.pathname.replace(/\/+$/, '') || '/';

  for (const regle of REDIRECTIONS) {
    if (!regle.hote.test(parsed.hostname) || chemin !== regle.chemin) continue;
    for (const nom of regle.parametres) {
      const brut = parsed.searchParams.get(nom);
      if (brut === null || brut === '') continue;
      const valeur = regle.base64 ? decodeBase64Url(brut) : brut;
      if (valeur === '') continue;
      try {
        const cible = new URL(valeur);
        if (cible.protocol === 'http:' || cible.protocol === 'https:') return cible;
      } catch {
        // Pas une adresse absolue : on essaie le paramètre suivant, et à
        // défaut on gardera l'enveloppe.
      }
    }
  }
  return null;
}

/**
 * Suit les redirections connues, jusqu'à la destination réelle.
 *
 * La boucle est **bornée** et garde les adresses déjà vues : un moteur qui
 * renverrait vers lui-même ne doit pas faire tourner l'application
 * indéfiniment, et une chaîne de redirections n'a aucune raison d'être plus
 * longue que quelques sauts.
 *
 * @param {URL} parsed
 * @returns {URL}
 */
function sansRedirection(parsed) {
  const vues = new Set([parsed.href]);
  let courante = parsed;

  for (let saut = 0; saut < REDIRECTIONS_MAX; saut += 1) {
    const cible = destinationPortee(courante);
    if (!cible || vues.has(cible.href)) break;
    vues.add(cible.href);
    courante = cible;
  }
  return courante;
}

/**
 * Déplie une adresse de redirection de moteur de recherche.
 *
 * Rendue telle quelle quand ce n'en est pas une, quand la destination n'est pas
 * un lien web, ou quand l'adresse est illisible : cette fonction ne lève jamais
 * et ne sert qu'à **améliorer** ce qu'on enregistre.
 *
 * @param {unknown} input
 * @returns {string}
 */
function unwrapRedirectUrl(input) {
  if (typeof input !== 'string' || input.trim() === '') return typeof input === 'string' ? input : '';
  try {
    return sansRedirection(new URL(input.trim())).href;
  } catch {
    return input;
  }
}

/**
 * Normalise une URL saisie ou capturée.
 *
 * - ajoute `https://` si le schéma est absent ;
 * - **remplace une adresse de redirection de moteur de recherche par sa
 *   destination** (`unwrapRedirectUrl`) : c'est la page visée qui est
 *   enregistrée, et non l'enveloppe du moteur ;
 * - retire les identifiants de session et le fragment, qui n'ont pas leur place
 *   dans un QR Code imprimé (le fragment n'est jamais envoyé au serveur, et un
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

  // La redirection est dépliée **avant** le nettoyage : c'est la destination
  // qui porte les paramètres de campagne à retirer, et non l'enveloppe.
  parsed = sansRedirection(parsed);

  parsed.hash = '';

  // Paramètres de campagne : ils polluent le QR Code et le rendent plus dense.
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
    // Conservé tel quel, et **absent** s'il n'a jamais été posé : `undefined`
    // n'est pas `0`, et un rang nul compterait comme un rang explicite.
    ...(Number.isFinite(input.order) ? { order: input.order } : {}),
    // Même règle : un booléen explicite est conservé, une absence le reste.
    ...(typeof input.useShort === 'boolean' ? { useShort: input.useShort } : {}),
    // Et pour la collection : un identifiant explicite est conservé, une
    // absence le reste. C'est cette absence qui rattache les liens déjà
    // enregistrés à la collection par défaut, sans rien réécrire.
    ...(typeof input.collectionId === 'string' && input.collectionId.trim() !== ''
      ? { collectionId: input.collectionId.trim() }
      : {}),
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
 * L'ordre manuel d'une collection.
 *
 * Deux groupes, dans cet ordre : les liens qui portent un rang explicite, par
 * rang croissant, puis ceux qui n'en portent pas, par date décroissante. Le
 * second groupe n'existe que tant que personne n'a réordonné — c'est-à-dire
 * exactement l'ancien comportement, conservé pour qui ne touche à rien.
 *
 * Un tri à deux étages plutôt qu'une migration : attribuer un rang à tous les
 * liens au premier chargement aurait réécrit la collection entière pour un
 * réglage que l'utilisateur n'a pas demandé.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @returns {import('./link.js').LinkRecord[]}
 */
function sortByManualOrder(links) {
  const avec = [];
  const sans = [];
  for (const link of links) {
    if (Number.isFinite(link.order)) avec.push(link);
    else sans.push(link);
  }
  avec.sort((a, b) => a.order - b.order);
  sans.sort((a, b) => b.createdAt - a.createdAt);
  return [...avec, ...sans];
}

/**
 * Replace dans l'ordre manuel les seuls liens dont on donne la suite.
 *
 * Une recherche peut filtrer la liste : les lignes déplacées à l'écran ne sont
 * alors qu'une partie de la collection. Elles reprennent donc les **places**
 * qu'elles occupaient, dans l'ordre où on les a mises, et les liens invisibles
 * gardent la leur — sans quoi ranger deux lignes filtrées bouleverserait toute
 * la collection.
 *
 * @param {LinkRecord[]} links
 * @param {string[]} orderedIds - Les identifiants dans leur nouvel ordre.
 * @returns {LinkRecord[]} La collection entière, dans son nouvel ordre manuel.
 */
function applyVisibleOrder(links, orderedIds) {
  const ordre = sortByManualOrder(links);
  const places = [];
  for (let index = 0; index < ordre.length; index += 1) {
    if (orderedIds.includes(ordre[index].id)) places.push(index);
  }

  const suite = [...ordre];
  orderedIds.forEach((id, rang) => {
    const lien = ordre.find((candidat) => candidat.id === id);
    if (lien && places[rang] !== undefined) suite[places[rang]] = lien;
  });
  return suite;
}

/**
 * Comparaison de texte pour les tris : insensible à la casse et aux accents, et
 * numérique sur les chiffres, pour que « article 2 » précède « article 10 ».
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
const compareTexte = (a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base', numeric: true });

/**
 * Les tris proposés. `manual` est le seul qui ne dépend pas du contenu.
 *
 * Chaque tri range selon une clé, et **départage par l'ordre manuel** : sans
 * cela, deux liens de même titre changeraient de place à chaque rendu, et la
 * liste paraîtrait instable sans raison.
 */
const SORT_MODES = Object.freeze([
  { id: 'manual', label: 'Ordre manuel' },
  { id: 'title-asc', label: 'Titre, A → Z' },
  { id: 'title-desc', label: 'Titre, Z → A' },
  { id: 'domain-asc', label: 'Domaine, A → Z' },
  { id: 'domain-desc', label: 'Domaine, Z → A' },
  { id: 'tag-asc', label: 'Tag, A → Z' },
  { id: 'tag-desc', label: 'Tag, Z → A' },
  { id: 'date-desc', label: 'Date, du plus récent' },
  { id: 'date-asc', label: 'Date, du plus ancien' },
]);

/** L'identifiant de tri est-il connu ? */
function isSortMode(value) {
  return SORT_MODES.some((mode) => mode.id === value);
}

/**
 * Range une collection selon le tri demandé.
 *
 * Le tri est une **vue** : rien n'est écrit, et revenir à « Ordre manuel »
 * retrouve la collection telle qu'elle était. C'est ce qui permet d'essayer un
 * tri sans le subir.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @param {string} [mode]
 * @returns {import('./link.js').LinkRecord[]}
 */
function sortLinks(links, mode = 'manual') {
  const base = sortByManualOrder(links);
  if (mode === 'manual' || !isSortMode(mode)) return base;

  const rang = new Map(base.map((link, index) => [link.id, index]));
  const cle = (link) => {
    switch (mode) {
      case 'title-asc':
      case 'title-desc':
        return (link.title || link.url || '').trim();
      case 'domain-asc':
      case 'domain-desc':
        return hostOf(link.url);
      case 'tag-asc':
      case 'tag-desc':
        // Un lien sans tag n'a pas de clé : il se range à part, et non en tête
        // comme le ferait une chaîne vide comparée avant les autres.
        return link.tags.length > 0 ? link.tags[0] : '\uffff';
      default:
        return '';
    }
  };

  // Les tris de texte portent leur sens dans leur suffixe ; la date est traitée
  // à part, parce qu'elle ne se compare pas comme du texte.
  const signe = mode.endsWith('-desc') ? -1 : 1;

  return [...base].sort((a, b) => {
    if (mode === 'date-asc' || mode === 'date-desc') {
      const ecart = mode === 'date-asc' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
      return ecart !== 0 ? ecart : rang.get(a.id) - rang.get(b.id);
    }
    const ecart = compareTexte(cle(a), cle(b));
    if (ecart !== 0) return signe * ecart;
    return rang.get(a.id) - rang.get(b.id);
  });
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
 * Décide de ce qu'on fait d'un lien **déjà présent**.
 *
 * Recollecter une page déjà enregistrée était un refus sec : « déjà
 * enregistré ». Or le cas courant n'est pas un doublon mais une **correction** —
 * la page a changé de titre, ou on en a saisi un meilleur dans la fenêtre avant
 * d'enregistrer — et se voir refuser sa correction oblige à supprimer le lien
 * pour le rajouter. Le titre différent est donc adopté.
 *
 * Ce qui n'est **pas** touché : la date de collecte, le rang, les tags, la note,
 * le raccourci. Seul le titre change, parce que c'est la seule chose que
 * l'appelant apporte ; écraser une note ou un tag par leur absence serait une
 * perte silencieuse.
 *
 * Un titre vide, ou identique, ne change rien : on ne remplace pas un titre
 * choisi par une absence, et un enregistrement identique ne mérite pas une
 * écriture.
 *
 * @param {LinkRecord} existing
 * @param {{ title?: unknown }} record
 * @returns {{ link: LinkRecord, updated: boolean }}
 */
function mergeDuplicate(existing, record) {
  const titre = typeof record?.title === 'string'
    ? record.title.trim().slice(0, DEFAULT_TITLE_MAX)
    : '';

  if (titre === '' || titre === existing.title) return { link: existing, updated: false };
  return { link: { ...existing, title: titre }, updated: true };
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
 * Destinations possibles du QR Code.
 * - `original` : l'URL collectée (comportement par défaut) ;
 * - `short` : le lien raccourci quand il existe, l'URL d'origine sinon.
 */
const TARGET_MODES = Object.freeze(['original', 'short']);

/**
 * Prépare un enregistrement pour l'affichage ou l'impression.
 *
 * Renvoie toujours une copie portant :
 * - `url` : la destination retenue, celle que le QR Code encode ;
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
  // Le choix du lien prime sur le réglage global ; sans choix, le global
  // s'applique. `undefined` et `false` ne veulent donc pas dire la même chose.
  const veutLeRaccourci = typeof link.useShort === 'boolean'
    ? link.useShort
    : mode === 'short';
  const useShort = veutLeRaccourci && shortUrl !== '' && shortUrl !== originalUrl;

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
// dist/extension-safari/core/collections.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Collections : le rangement des liens, et la collection de navigation privée.
 *
 * Jusqu'ici, « la collection » était une notion implicite : tous les liens
 * collectés vivaient dans un seul ensemble, et `settings.collectionName` ne
 * servait qu'à nommer les exports. Ce module donne à cette notion une existence
 * propre — un identifiant, un nom, une note — pour que l'utilisateur puisse en
 * tenir plusieurs : une veille, un projet, des liens de famille.
 *
 * Trois choix structurent le module, et chacun répond à un défaut précis :
 *
 * - **Il reste toujours au moins une collection.** Un utilisateur qui ne crée
 *   jamais de collection doit continuer d'avoir exactement le produit d'avant,
 *   avec ses liens déjà enregistrés. `sanitizeCollections` synthétise donc la
 *   collection par défaut **quand la liste est vide**, et son nom vide veut
 *   dire « prenez le nom intégré » — « Mes liens » dans la langue de
 *   l'utilisateur, et non une chaîne figée à l'écriture dans la langue du jour.
 *   Cette distinction compte : réinjecter la collection par défaut à chaque
 *   lecture la rendrait impérissable, alors qu'elle est une collection comme
 *   une autre — c'est seulement la **dernière** qui ne se supprime pas.
 * - **Un nom vide est un état, pas un refus.** Vider le champ du nom ne
 *   renommait rien : le nom précédent restait, et l'écran ne le disait pas.
 *   `rename` accepte donc le vide, et l'affichage retombe alors sur le nom
 *   intégré — le même que la collection par défaut, traduit au moment de
 *   l'affichage. Un nom vide n'entre pas dans le contrôle des doublons : deux
 *   collections sans nom sont deux collections distinctes, et leur refuser
 *   cela interdirait de les vider l'une après l'autre.
 * - **La collection de navigation privée n'est jamais écrite.** Elle n'existe
 *   pas dans le stockage : elle est synthétisée quand — et seulement quand —
 *   le contexte est privé. Ses liens vivent dans `chrome.storage.session`
 *   (voir `store.js` et `PRIVATE_LINKS_KEY`), donc en mémoire, et disparaissent
 *   à la fermeture du navigateur. Une collection privée persistée par accident
 *   serait un fichier d'URL privées sur le disque : le module n'offre aucun
 *   chemin qui permette d'y arriver.
 * - **Les opérations impossibles lèvent, elles ne devinent pas.** Renommer ou
 *   supprimer la collection privée, supprimer la dernière collection, créer une
 *   collection sans nom ou sous un nom déjà pris : des erreurs typées, que
 *   l'interface attrape et explique. Un silence laisserait l'utilisateur devant
 *   un clic sans effet.
 *
 * Le stockage est injecté — une zone au format `chrome.storage.local`, c'est-à-
 * dire un `get(clé)` qui rend `{ [clé]: valeur }` et un `set({ [clé]: valeur })`.
 * Le module se teste donc sans navigateur, comme `settings.js` et `privacy.js`.
 * Une zone absente ou en panne ne fait jamais échouer l'appelant : on retombe
 * sur une collection par défaut en mémoire, exactement comme si l'utilisateur
 * n'en avait jamais créé.
 */




/**
 * Longueur maximale du nom d'une collection.
 *
 * Le nom tient dans un nom de fichier et sous un en-tête imprimé : au-delà, il
 * ne tient plus nulle part. La borne vit ici, avec la notion qu'elle borne, et
 * non dans les réglages : c'est `createCollection` qui la fait respecter.
 */
const COLLECTION_NAME_MAX = 80;

/**
 * Longueur maximale de la note de collection.
 *
 * Plus large que le nom, parce que ce n'est pas la même chose : la note est un
 * paragraphe qui explique de quoi la collection parle, le nom une étiquette.
 * Elle reste bornée — elle finit dans un fichier et sur une page.
 */
const COLLECTION_NOTE_MAX = 600;

/**
 * Bornes du premier numéro d'une collection.
 *
 * Le numéro s'imprime sur l'étiquette, sous le QR Code : au-delà de quatre
 * chiffres, la ligne ne tient plus sur une étiquette étroite et se ferait
 * rogner. Zéro est permis — une série peut commencer à zéro — et le défaut
 * reste 1, qui est ce que faisait la numérotation avant que ce réglage existe.
 *
 * **Chaque collection a le sien.** Numéroter une série d'objets est un geste
 * qui appartient à la collection qu'on range : reprendre la suite d'un lot
 * terminé ici n'a rien à voir avec ce qui se numérote ailleurs, et un réglage
 * commun obligeait à le re-régler à chaque bascule.
 */
const START_INDEX_MIN = 0;
const START_INDEX_MAX = 9999;

/** Premier numéro d'une collection qui n'en a jamais réglé un. */
const DEFAULT_START_INDEX = 1;

/**
 * Nom de la collection de qui n'en a jamais nommé aucune.
 *
 * Une chaîne, jamais écrite dans le stockage : le nom vide d'une collection
 * veut dire « prenez celui-ci », et il est traduit au moment de l'affichage.
 * L'écrire figerait la langue du jour dans le document.
 *
 * Elle vaut pour **toutes** les collections, et pas seulement pour celle par
 * défaut : vider le nom d'une collection rangée à côté laisse une collection
 * sans nom, que la liste et les exports présentent sous ce libellé. Un nom
 * d'emprunt plutôt qu'une option vide, où personne ne saurait ce qu'elle
 * contient.
 */
const DEFAULT_COLLECTION_NAME = 'Mes liens';

/**
 * Clé de stockage du document des collections.
 *
 * Préfixée, comme les autres clés du projet, pour ne pas entrer en collision
 * avec un autre outil qui partagerait `chrome.storage.local`.
 */
const COLLECTIONS_KEY = 'url-qr-code-printer/collections';

/** Clé de la collection courante, mémorisée séparément du document. */
const ACTIVE_COLLECTION_KEY = 'url-qr-code-printer/active-collection';

/** Version du document écrit. À incrémenter si sa forme change. */
const COLLECTIONS_VERSION = 1;

/** Identifiant de la collection par défaut : celle de qui n'en crée aucune. */
const DEFAULT_COLLECTION_ID = 'default';

/**
 * Identifiant de la collection de navigation privée.
 *
 * Réservé : un document stocké qui le porterait est écarté à la lecture, pour
 * qu'une valeur écrite à la main ou par une version antérieure ne puisse pas
 * faire croire à une collection privée persistée.
 */
const PRIVATE_COLLECTION_ID = 'private';

/** Clé des liens dans le stockage local — la collection courante, hors privé. */
const COLLECTION_LINKS_KEY = 'links';

/**
 * Clé des liens de la collection privée, dans `chrome.storage.session`.
 *
 * Volontairement distincte de `COLLECTION_LINKS_KEY` : les deux zones sont
 * différentes, et une clé identique dans deux zones rendrait une fuite de
 * l'une vers l'autre indétectable à la lecture du code.
 */
const PRIVATE_LINKS_KEY = 'links/private';

/**
 * Les documents dont un changement déplace ce qui est affiché.
 *
 * Trois contextes partagent ces documents sans se parler — la fenêtre de
 * l'extension, l'application, et le service worker qui peint le compteur de
 * l'icône —, et chacun doit savoir lesquels surveiller. La liste vit donc **ici**,
 * avec les clés qu'elle nomme : un contexte qui en oublierait un garderait un
 * affichage périmé, et rien ne le lui dirait avant un rechargement.
 *
 * Deux réponses, parce que les liens de la collection privée vivent dans
 * `storage.session` : une zone, un jeu de clés.
 *
 * @param {string} area
 * @returns {string[]}
 */
function displayedDocuments(area) {
  if (area === 'local') return [COLLECTION_LINKS_KEY, COLLECTIONS_KEY, ACTIVE_COLLECTION_KEY];
  if (area === 'session') return [PRIVATE_LINKS_KEY];
  return [];
}

/**
 * Erreur d'opération sur une collection, avec un code exploitable.
 *
 * Codes : `empty-name` (création sans nom), `duplicate-name` (nom déjà pris),
 * `reserved` (collection privée, jamais renommable ni supprimable), `last`
 * (dernière collection : il en faut toujours une), `unknown` (identifiant
 * inconnu).
 */
class CollectionError extends Error {
  /**
   * @param {string} message
   * @param {string} code
   * @param {{ id?: string }} [details]
   */
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'CollectionError';
    this.code = code;
    this.id = details.id ?? '';
  }
}

/**
 * Le contexte est-il privé ?
 *
 * Deux sources, dans cet ordre : l'onglet visé, puis l'API d'extension.
 *
 * L'onglet d'abord, parce qu'il est le plus précis — c'est **cette** page qui
 * est privée — et le plus largement disponible : `tabs.Tab.incognito` existe
 * depuis Chrome 16 et **Safari 14**, alors que
 * `extension.inIncognitoContext` n'arrive sur Safari qu'en version 18. Le
 * service worker, lui, n'a pas d'onglet à interroger : il passe le contexte
 * qu'il connaît du clic, et l'API comble le reste quand elle existe.
 *
 * @param {{ tabIncognito?: unknown, inIncognitoContext?: unknown }} [sources]
 * @returns {boolean}
 */
function isPrivateContext(sources = {}) {
  return Boolean(sources.tabIncognito) || Boolean(sources.inIncognitoContext);
}

/**
 * Collection d'un enregistrement.
 *
 * L'absence n'est pas une anomalie : tous les liens enregistrés avant que ce
 * module existe n'ont pas de `collectionId`, et ils appartiennent à la
 * collection par défaut. On ne les réécrit pas — une migration qui toucherait
 * chaque enregistrement pour un champ que l'utilisateur n'a pas demandé serait
 * exactement ce que `sortByManualOrder` évite déjà pour les rangs.
 *
 * @param {Partial<import('./link.js').LinkRecord>} [link]
 * @returns {string}
 */
function collectionOf(link) {
  const id = link?.collectionId;
  return typeof id === 'string' && id.trim() !== '' ? id.trim() : DEFAULT_COLLECTION_ID;
}

/** La collection est-elle celle de la navigation privée ? */
function isPrivateCollection(collection) {
  const id = typeof collection === 'string' ? collection : collection?.id;
  return id === PRIVATE_COLLECTION_ID;
}

/**
 * Borne et nettoie un nom de collection.
 *
 * Le repli sur une chaîne vide n'est pas un refus : c'est le appelant qui
 * décide si un nom vide est acceptable — il l'est pour la collection par
 * défaut, qui porte alors le nom intégré, et ne l'est pas pour une collection
 * créée à la main.
 *
 * @param {unknown} value
 * @returns {string}
 */
function cleanName(value) {
  return typeof value === 'string' ? value.trim().slice(0, COLLECTION_NAME_MAX) : '';
}

/**
 * Clé de comparaison des noms : sans casse ni accents.
 *
 * Deux collections nommées « Veille » et « veille » seraient indiscernables
 * dans la fenêtre : la comparaison les tient pour le même nom, sans imposer à
 * l'utilisateur une casse précise.
 *
 * @param {string} value
 * @returns {string}
 */
function nameKey(value) {
  return cleanName(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * Construit une collection normale validée.
 *
 * Le premier numéro est **borné, pas refusé** : une valeur hors bornes est
 * ramenée dans l'intervalle — un utilisateur qui tape 100000 veut une série
 * longue, pas une erreur — et un nombre à virgule est tronqué, puisqu'on
 * numérote des objets et non des mesures.
 *
 * @param {{ id?: unknown, name?: unknown, note?: unknown, startIndex?: unknown, createdAt?: unknown }} [input]
 * @param {{ now?: number }} [options]
 * @returns {{ id: string, name: string, note: string, startIndex: number, createdAt: number }}
 */
function createCollection(input = {}, options = {}) {
  const now = Number.isFinite(options.now) ? options.now : Date.now();
  const id = typeof input.id === 'string' && input.id.trim() !== '' && input.id !== PRIVATE_COLLECTION_ID
    ? input.id.trim()
    : newId();

  return {
    id,
    name: cleanName(input.name),
    note: typeof input.note === 'string' ? input.note.trim().slice(0, COLLECTION_NOTE_MAX) : '',
    startIndex: cleanStartIndex(input.startIndex),
    createdAt: Number.isFinite(input.createdAt) ? input.createdAt : now,
  };
}

/**
 * Ramène un premier numéro dans ses bornes.
 *
 * Une valeur illisible rend le défaut — un enregistrement écrit avant que ce
 * champ existe n'a pas de numéro, et sa série commence à 1. Une chaîne vide
 * compte comme une absence, et non comme un zéro : le champ est un
 * `<input type="number">`, et le vider pour le retaper ne doit pas faire passer
 * la numérotation par zéro.
 *
 * @param {unknown} value
 * @returns {number}
 */
function cleanStartIndex(value) {
  // **Une chaîne vide n'est pas zéro.** `Number('')` vaut 0, et prendre ce zéro
  // pour une valeur ferait sauter la numérotation à 0 dès qu'on vide le champ
  // pour le retaper — puis à la valeur suivante. Une absence rend le défaut :
  // c'est ce que veut dire un enregistrement écrit avant que ce champ existe.
  if (value === '' || value === null || value === undefined) return DEFAULT_START_INDEX;
  const brut = Number(value);
  if (!Number.isFinite(brut)) return DEFAULT_START_INDEX;
  return Math.min(START_INDEX_MAX, Math.max(START_INDEX_MIN, Math.trunc(brut)));
}

/**
 * La collection de navigation privée, telle qu'elle s'affiche.
 *
 * Elle n'est jamais stockée : son nom est traduit à l'affichage, comme le nom
 * intégré de la collection par défaut. Deux propriétés la distinguent d'une
 * collection ordinaire, et l'interface s'y fie : `private` pour l'annoncer, et
 * un identifiant réservé qui la met hors de portée du renommage et de la
 * suppression.
 *
 * @param {(message: string) => string} [translate]
 * @returns {{ id: string, name: string, note: string, createdAt: number, private: true }}
 */
function privateCollection(translate = t) {
  return {
    id: PRIVATE_COLLECTION_ID,
    name: translate('Navigation privée'),
    note: '',
    startIndex: DEFAULT_START_INDEX,
    createdAt: 0,
    private: true,
  };
}

/**
 * Range les collections : la collection par défaut d'abord, puis par date.
 *
 * L'ordre est stable et volontairement pauvre — pas de rang manuel à
 * entretenir pour un objet qu'on crée rarement, et une place fixe pour la
 * collection par défaut, qui est celle où atterrissent les liens de qui n'a
 * rien créé.
 *
 * @param {Array<object>} items
 * @returns {Array<object>}
 */
function orderCollections(items) {
  return [...items].sort((a, b) => {
    if (a.id === DEFAULT_COLLECTION_ID) return -1;
    if (b.id === DEFAULT_COLLECTION_ID) return 1;
    return a.createdAt - b.createdAt;
  });
}

/**
 * Lit le tableau d'items d'un document stocké, quelle que soit sa forme.
 *
 * Deux formes sont acceptées : le document `{ version, items }` écrit par ce
 * module, et un tableau nu — la tolérance coûte trois lignes et évite qu'une
 * valeur écrite à la main rende toutes les collections invisibles.
 *
 * @param {unknown} value
 * @returns {unknown[]}
 */
function storedItems(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && Array.isArray(value.items)) return value.items;
  return [];
}

/**
 * Assainit un document de collections, en garantissant qu'il en reste une.
 *
 * Une entrée illisible est écartée plutôt que refusée : une collection
 * corrompue ne doit pas emporter les autres. Les entrées de la collection
 * privée sont ignorées — elle est synthétisée, jamais stockée.
 *
 * @param {unknown} value
 * @returns {{ version: number, migratedAt: number, items: Array<{ id: string, name: string, note: string, startIndex: number, createdAt: number }> }}
 */
function sanitizeCollections(value) {
  const seen = new Set();
  const items = [];

  for (const entry of storedItems(value)) {
    if (!entry || typeof entry !== 'object') continue;
    const id = typeof entry.id === 'string' ? entry.id.trim() : '';
    if (id === '' || id === PRIVATE_COLLECTION_ID || seen.has(id)) continue;
    seen.add(id);
    items.push(createCollection({ ...entry, id }));
  }

  // La collection par défaut n'est injectée que si la liste est **vide** : elle
  // est celle des liens enregistrés avant les collections, et il faut bien
  // qu'elle existe pour eux. La réinjecter dès qu'elle manque la rendrait
  // impérissable — la supprimer serait sans effet, puisqu'elle reviendrait à la
  // lecture suivante.
  if (items.length === 0) {
    items.unshift({
      id: DEFAULT_COLLECTION_ID,
      name: '',
      note: '',
      startIndex: DEFAULT_START_INDEX,
      createdAt: 0,
    });
  }

  const migratedAt = value && typeof value === 'object' && Number.isFinite(value.migratedAt)
    ? value.migratedAt
    : 0;

  return { version: COLLECTIONS_VERSION, migratedAt, items: orderCollections(items) };
}

/**
 * Assainit la collection courante mémorisée.
 *
 * Deux champs, un par contexte : la collection courante d'une fenêtre normale
 * et celle d'une fenêtre privée n'ont aucune raison d'être la même, et les
 * confondre ferait basculer l'utilisateur d'une collection à l'autre selon la
 * fenêtre qu'il vient d'ouvrir. Une chaîne vide veut dire « pas encore
 * décidée » ; c'est `getActive` qui tranche, en retombant sur la première
 * collection visible.
 *
 * @param {unknown} value
 * @returns {{ normal: string, private: string }}
 */
function sanitizeActive(value) {
  const source = value && typeof value === 'object' ? value : {};
  const champ = (candidat) => (typeof candidat === 'string' ? candidat.trim() : '');
  return { normal: champ(source.normal), private: champ(source.private) };
}

/**
 * Les collections visibles dans un contexte donné.
 *
 * La collection privée n'est ajoutée qu'en contexte privé, et en dernier : elle
 * n'existe nulle part ailleurs, et aucune interface ne doit pouvoir la proposer
 * en navigation ordinaire. C'est la seule fonction qui décide de cette
 * visibilité — les appelants ne la filtrent pas eux-mêmes, sans quoi la règle
 * vivrait à trois endroits et finirait par diverger.
 *
 * @param {Array<object>} items Collections assainies.
 * @param {{ isPrivate?: boolean, translate?: (message: string) => string }} [options]
 * @returns {Array<object>}
 */
function visibleCollections(items, options = {}) {
  const liste = orderCollections(Array.isArray(items) ? items : []);
  if (!options.isPrivate) return liste;
  return [...liste, privateCollection(options.translate)];
}

/**
 * Nom affichable d'une collection.
 *
 * Un nom vide n'est pas une absence de nom : c'est une collection qu'on n'a pas
 * nommée — celle par défaut, que personne n'a renommée, ou une autre dont on a
 * vidé le champ. Elle porte donc le nom intégré du produit, traduit au moment de
 * l'affichage, jamais écrit.
 *
 * @param {{ name?: unknown } | undefined} collection
 * @param {(message: string) => string} [translate]
 * @returns {string}
 */
function collectionDisplayName(collection, translate = t) {
  const nom = typeof collection?.name === 'string' ? collection.name.trim() : '';
  return nom === '' ? translate(DEFAULT_COLLECTION_NAME) : nom;
}

/**
 * Un nom de collection **libre**, dérivé de celui qu'on voudrait.
 *
 * Créer une collection refuse un nom déjà pris — c'est la bonne règle pour un
 * geste où l'utilisateur a tapé le nom lui-même. Mais ici le nom vient d'ailleurs
 * — un import qui apporte le sien, ou un bouton qui propose le premier nom venu —
 * et un refus obligerait à en inventer un autre à la main. On rend donc le nom
 * demandé s'il est libre, et « Veille 2 », « Veille 3 »… sinon.
 *
 * Le rang est un nombre, écrit pareil dans les deux langues : aucun libellé à
 * traduire. Le suffixe est **réservé avant** la troncature, sans quoi un nom
 * déjà à la longueur maximale rendrait toujours le même candidat — et la
 * recherche ne s'arrêterait jamais.
 *
 * @param {unknown} desired Nom souhaité ; vide, le nom intégré est proposé.
 * @param {Array<object>} [items] Collections déjà présentes.
 * @param {(message: string) => string} [translate]
 * @returns {string}
 */
function freeCollectionName(desired, items = [], translate = t) {
  const voulu = cleanName(desired);
  const base = voulu === '' ? cleanName(translate(DEFAULT_COLLECTION_NAME)) : voulu;
  const pris = new Set((Array.isArray(items) ? items : []).map((item) => nameKey(item?.name)));
  if (!pris.has(nameKey(base))) return base;

  // La boucle se termine toujours : `pris` est fini, et chaque rang produit une
  // chaîne différente de la précédente.
  for (let rang = 2; ; rang += 1) {
    const marque = ` ${rang}`;
    const candidat = cleanName(
      base.slice(0, Math.max(1, COLLECTION_NAME_MAX - marque.length)) + marque,
    );
    if (!pris.has(nameKey(candidat))) return candidat;
  }
}

/**
 * Accès aux collections, adossé à une zone de stockage d'extension.
 *
 * Toutes les méthodes sont asynchrones et ne lèvent jamais pour une panne de
 * stockage : au pire, elles travaillent sur la collection par défaut en
 * mémoire. Seules les opérations **impossibles** lèvent — création sans nom,
 * nom déjà pris, collection réservée, identifiant inconnu — et c'est alors une
 * `CollectionError`, que l'interface attrape pour l'expliquer.
 *
 * @param {{ area?: any, now?: () => number }} [options]
 * @returns {{
 *   available: boolean,
 *   list: () => Promise<Array<object>>,
 *   visible: (options?: { isPrivate?: boolean }) => Promise<Array<object>>,
 *   ensureDefault: () => Promise<boolean>,
 *   create: (name: string) => Promise<object>,
 *   rename: (id: string, name: string) => Promise<object>,
 *   setNote: (id: string, note: string) => Promise<object>,
 *   setStartIndex: (id: string, value: unknown) => Promise<object>,
 *   remove: (id: string) => Promise<boolean>,
 *   getActive: (isPrivate?: boolean) => Promise<string>,
 *   setActive: (id: string, isPrivate?: boolean) => Promise<string>,
 *   needsMigration: () => Promise<boolean>,
 *   markMigrated: () => Promise<boolean>,
 * }}
 */
function createCollectionStore(options = {}) {
  const area = options.area ?? null;
  const now = typeof options.now === 'function' ? options.now : () => Date.now();
  const available = Boolean(area && typeof area.get === 'function' && typeof area.set === 'function');

  /**
   * Lit la valeur brute, en avalant une panne de stockage.
   * @returns {Promise<unknown>}
   */
  async function readRaw() {
    if (!available) return null;
    try {
      const data = await area.get(COLLECTIONS_KEY);
      return data?.[COLLECTIONS_KEY] ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Lit le document, et dit s'il portait déjà la collection par défaut.
   *
   * La distinction sert à `ensureDefault` : écrire à chaque lecture ferait une
   * écriture par ouverture de la fenêtre, pour un document qui n'a pas changé.
   *
   * @returns {Promise<{ document: object, stored: boolean }>}
   */
  async function load() {
    const raw = await readRaw();
    // « Déjà en place » veut dire : au moins une collection est écrite. C'est
    // cette condition qui décide si `ensureDefault` a quelque chose à
    // matérialiser — et non la présence de la collection par défaut, qui peut
    // avoir été supprimée comme une autre.
    const stored = sanitizeCollections(raw).items.length > 0
      && storedItems(raw).some(
        (entry) => entry && typeof entry === 'object' && typeof entry.id === 'string',
      );
    return { document: sanitizeCollections(raw), stored };
  }

  /**
   * Écrit le document. Rend `false` quand le stockage refuse (quota, mode
   * privé restrictif) : l'appelant le sait sans qu'une exception remonte.
   *
   * @param {object} document
   * @returns {Promise<boolean>}
   */
  async function write(document) {
    if (!available) return false;
    try {
      await area.set({ [COLLECTIONS_KEY]: document });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Écrit le document modifié par `change`.
   * @param {(document: object) => object} change
   * @returns {Promise<object>} Le document écrit.
   */
  async function update(change) {
    const { document } = await load();
    const next = sanitizeCollections(change(document));
    await write(next);
    return next;
  }

  /**
   * Refuse un nom vide, à la **création** d'une collection.
   *
   * Une collection qu'on crée sans nom n'aurait rien pour la distinguer des
   * autres dans la liste, et le bouton qui la crée propose donc toujours un nom.
   * Le renommage, lui, accepte le vide : vider le champ est un geste, et il doit
   * produire une collection sans nom plutôt que de laisser l'ancien en place,
   * sans que rien ne le dise.
   *
   * Le nom déjà pris se contrôle séparément, dans `nameTaken` : cette
   * comparaison a besoin de la liste des collections, que l'appelant a de toute
   * façon déjà chargée.
   *
   * @param {unknown} name
   * @returns {string} Le nom nettoyé.
   */
  function requireName(name) {
    const clean = cleanName(name);
    if (clean === '') {
      throw new CollectionError(t('Une collection doit porter un nom'), 'empty-name');
    }
    return clean;
  }

  /**
   * Le nom est-il déjà porté par une autre collection ?
   * @param {Array<object>} items
   * @param {string} name
   * @param {string} [exceptId]
   * @returns {boolean}
   */
  function nameTaken(items, name, exceptId = '') {
    const cle = nameKey(name);
    return items.some((item) => item.id !== exceptId && nameKey(item.name) === cle && cle !== '');
  }

  /**
   * Retrouve une collection normale, ou lève.
   * @param {Array<object>} items
   * @param {string} id
   * @returns {object}
   */
  function requireNormal(items, id) {
    if (id === PRIVATE_COLLECTION_ID) {
      throw new CollectionError(t('La collection de navigation privée n\'est pas modifiable'), 'reserved', { id });
    }
    const found = items.find((item) => item.id === id);
    if (!found) {
      throw new CollectionError(t('Collection inconnue : {id}', { id }), 'unknown', { id });
    }
    return found;
  }

  /** Lit la collection courante mémorisée, brute puis assainie. */
  async function readActive() {
    if (!available) return sanitizeActive(null);
    try {
      const data = await area.get(ACTIVE_COLLECTION_KEY);
      return sanitizeActive(data?.[ACTIVE_COLLECTION_KEY]);
    } catch {
      return sanitizeActive(null);
    }
  }

  /**
   * Mémorise la collection courante d'un contexte.
   * @param {{ normal: string, private: string }} value
   * @returns {Promise<boolean>}
   */
  async function writeActive(value) {
    if (!available) return false;
    try {
      await area.set({ [ACTIVE_COLLECTION_KEY]: value });
      return true;
    } catch {
      return false;
    }
  }

  return {
    available,

    async list() {
      return (await load()).document.items;
    },

    async visible(visibleOptions = {}) {
      const { document } = await load();
      return visibleCollections(document.items, visibleOptions);
    },

    async ensureDefault() {
      const { document, stored } = await load();
      if (stored) return false;
      // Rend `false` quand rien n'a pu être écrit : sans zone de stockage, il
      // n'y a pas de collection à retrouver à la prochaine ouverture, et le
      // dire vaut mieux que de prétendre avoir installé quelque chose.
      return write(document);
    },

    async create(name) {
      const clean = requireName(name);
      const { document } = await load();
      if (nameTaken(document.items, clean)) {
        throw new CollectionError(t('Une collection porte déjà ce nom'), 'duplicate-name');
      }
      const collection = createCollection({ name: clean, createdAt: now() });
      await update((current) => ({ ...current, items: [...current.items, collection] }));
      return collection;
    },

    async rename(id, name) {
      // **Un nom vide est accepté.** C'est la seule façon de vider le nom d'une
      // collection : refuser le vide laissait l'ancien nom en place, et l'écran
      // affichait un champ vide sous une collection qui portait toujours son
      // nom d'avant. La collection s'affiche alors sous le nom intégré, et elle
      // n'entre pas dans le contrôle des doublons — deux collections sans nom
      // restent deux collections.
      const clean = cleanName(name);
      let renamed = null;
      await update((document) => {
        const target = requireNormal(document.items, id);
        if (clean !== '' && nameTaken(document.items, clean, id)) {
          throw new CollectionError(t('Une collection porte déjà ce nom'), 'duplicate-name', { id });
        }
        renamed = { ...target, name: clean };
        return {
          ...document,
          items: document.items.map((item) => (item.id === id ? renamed : item)),
        };
      });
      return renamed;
    },

    async setNote(id, note) {
      let updated = null;
      await update((document) => {
        const target = requireNormal(document.items, id);
        updated = {
          ...target,
          note: typeof note === 'string' ? note.trim().slice(0, COLLECTION_NOTE_MAX) : '',
        };
        return {
          ...document,
          items: document.items.map((item) => (item.id === id ? updated : item)),
        };
      });
      return updated;
    },

    async setStartIndex(id, value) {
      const startIndex = cleanStartIndex(value);
      let updated = null;
      await update((document) => {
        const target = requireNormal(document.items, id);
        updated = { ...target, startIndex };
        return {
          ...document,
          items: document.items.map((item) => (item.id === id ? updated : item)),
        };
      });
      return updated;
    },

    async remove(id) {
      if (id === PRIVATE_COLLECTION_ID) {
        throw new CollectionError(
          t('La collection de navigation privée n\'est pas modifiable'),
          'reserved',
          { id },
        );
      }

      // **Toutes les collections se suppriment, sauf la dernière.** La
      // collection par défaut n'a rien de particulier : elle est celle de qui
      // n'en crée jamais, et la supprimer quand une autre existe est un
      // rangement légitime. Ce qui ne peut pas arriver, c'est qu'il n'en reste
      // aucune : la fenêtre et l'application n'auraient plus où enregistrer.
      const { document } = await load();
      if (!document.items.some((item) => item.id === id)) return false;
      if (document.items.length <= 1) {
        throw new CollectionError(
          t('Il doit rester au moins une collection'),
          'last',
          { id },
        );
      }

      const before = document.items.length;
      await update((current) => ({
        ...current,
        items: current.items.filter((item) => item.id !== id),
      }));

      // La collection courante ne doit pas désigner une collection disparue :
      // sans cela, la fenêtre suivante s'ouvrirait sur un repli silencieux.
      const actives = await readActive();
      if (actives.normal === id || actives.private === id) {
        await writeActive({
          normal: actives.normal === id ? '' : actives.normal,
          private: actives.private === id ? '' : actives.private,
        });
      }
      return before !== (await load()).document.items.length;
    },

    async getActive(isPrivate = false) {
      const { document } = await load();
      const actives = await readActive();
      const items = visibleCollections(document.items, { isPrivate });
      const voulu = isPrivate ? actives.private : actives.normal;
      if (items.some((item) => item.id === voulu)) return voulu;
      // À défaut de choix valide, une fenêtre privée ouvre la collection
      // privée : c'est la raison d'être de la navigation privée, et l'inverse
      // enverrait les premiers liens privés sur le disque sans que personne ne
      // l'ait demandé.
      return isPrivate ? PRIVATE_COLLECTION_ID : items[0].id;
    },

    async setActive(id, isPrivate = false) {
      const actives = await readActive();
      const next = isPrivate ? { ...actives, private: id } : { ...actives, normal: id };
      await writeActive(next);
      return id;
    },

    async needsMigration() {
      return (await load()).document.migratedAt === 0;
    },

    async markMigrated() {
      const { document } = await load();
      if (document.migratedAt !== 0) return false;
      await write({ ...document, migratedAt: now() });
      return true;
    },
  };
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
 *   add(record, options?): Promise<{ link, duplicate, updated }>
 *   put(record): Promise<LinkRecord>
 *   putMany(records): Promise<number>
 *   remove(id): Promise<void>
 *   clear(): Promise<void>
 *
 * L'implémentation par défaut utilise IndexedDB, disponible à la fois dans une
 * page web et dans un service worker d'extension MV3.
 *
 * ## Les collections
 *
 * Depuis que les liens se rangent en collections, trois ajouts s'ajoutent à
 * cette interface, sans la remplacer :
 *
 * - **`add` accepte un `collectionId`.** Il borne alors la recherche de doublon
 *   à cette collection — la même adresse peut donc figurer dans deux
 *   collections, ce qui est le sens même du rangement — et il estampille
 *   l'enregistrement. Sans cet argument, le comportement d'origine est conservé
 *   à l'identique : un `add` sans collection se dédoublonne sur tout le store.
 * - **`withCollection(store, id)`** rend une façade aux mêmes méthodes, bornée
 *   à une collection : lectures filtrées, écritures estampillées, et un
 *   `clear()` qui ne vide que la sienne. C'est ce que manipulent la fenêtre,
 *   le service worker et l'application, qui n'ont jamais à connaître les autres
 *   collections.
 * - **`createCompositeStore`** réunit deux zones de stockage — les liens
 *   ordinaires dans `chrome.storage.local`, ceux de la navigation privée dans
 *   `chrome.storage.session` — et route chaque écriture vers celle qui possède
 *   la collection visée. Une collection privée ne peut donc pas se retrouver
 *   sur le disque par inadvertance : sa zone ne l'écrit nulle part.
 */




const DB_NAME = 'url-qr-code-printer';
const DB_VERSION = 1;
const STORE = 'links';

/**
 * @typedef {Object} LinkStore
 * @property {() => Promise<import('./link.js').LinkRecord[]>} list
 * @property {(id: string) => Promise<import('./link.js').LinkRecord|undefined>} get
 * @property {(record: Partial<import('./link.js').LinkRecord> & {url: string}, options?: {collectionId?: string, allowDuplicate?: boolean, now?: number, source?: string}) => Promise<{link: import('./link.js').LinkRecord, duplicate: boolean, updated: boolean}>} add
 * @property {(record: import('./link.js').LinkRecord) => Promise<import('./link.js').LinkRecord>} put
 * @property {(records: import('./link.js').LinkRecord[]) => Promise<number>} putMany
 * @property {(id: string) => Promise<void>} remove
 * @property {() => Promise<void>} clear
 */

/**
 * Collection visée par un `add`.
 *
 * L'argument explicite l'emporte sur le champ porté par l'enregistrement :
 * c'est l'appelant qui sait dans quelle collection il collecte, alors que le
 * champ vient d'un objet qui peut avoir traversé un import. Sans l'un ni
 * l'autre, c'est la collection par défaut — le cas des liens anciens, qu'on ne
 * réécrit pas.
 *
 * @param {{ collectionId?: unknown }} record
 * @param {{ collectionId?: unknown }} [addOptions]
 * @returns {string}
 */
function targetCollection(record, addOptions = {}) {
  const explicite = typeof addOptions.collectionId === 'string' ? addOptions.collectionId.trim() : '';
  return explicite !== '' ? explicite : collectionOf(record);
}

/**
 * Tranche le cas du lien déjà présent, et l'enregistre si le titre a changé.
 *
 * La décision elle-même vit dans le cœur (`mergeDuplicate`) : les trois
 * implémentations la partagent, et ne diffèrent que par leur façon d'écrire.
 * L'écriture passe par le `put` du magasin plutôt que dans son dos — chaque
 * implémentation range ses enregistrements à sa manière, et `put` pose aussi
 * `updatedAt`, ce qui est exactement ce qu'on veut dire : le lien a changé.
 *
 * @param {{ put: (record: object) => Promise<object> }} store
 * @param {import('./link.js').LinkRecord} existing
 * @param {{ title?: unknown }} record
 * @returns {Promise<{ link: import('./link.js').LinkRecord, duplicate: true, updated: boolean }>}
 */
async function mergeOrKeep(store, existing, record) {
  const { link, updated } = mergeDuplicate(existing, record);
  if (!updated) return { link, duplicate: true, updated: false };
  return { link: await store.put(link), duplicate: true, updated: true };
}

/**
 * Trie les liens du plus récent au plus ancien.
 * @param {import('./link.js').LinkRecord[]} links
 * @returns {import('./link.js').LinkRecord[]}
 */
function sortByDateDesc(links) {
  return [...links].sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * L'ordre de lecture d'une collection : le rang explicite s'il existe, la date
 * sinon.
 *
 * C'est `sortByManualOrder` qui décide, et le magasin s'y tient : les trois
 * implémentations — IndexedDB, `chrome.storage`, mémoire — rendent donc la même
 * liste, et la fenêtre de l'extension comme le service worker voient le même
 * ordre que l'application.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @returns {import('./link.js').LinkRecord[]}
 */
function sortForDisplay(links) {
  return sortByManualOrder(links);
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
      return sortForDisplay(all);
    },

    async get(id) {
      const db = await getDb();
      const tx = db.transaction(STORE, 'readonly');
      return promisifyRequest(tx.objectStore(STORE).get(id));
    },

    async add(record, addOptions = {}) {
      const collectionId = targetCollection(record, addOptions);
      const existing = await this.list();
      const dansLaCollection = existing.filter((link) => collectionOf(link) === collectionId);
      const duplicate = addOptions.allowDuplicate
        ? undefined
        : findDuplicate(dansLaCollection, record.url);
      if (duplicate) return mergeOrKeep(this, duplicate, record);

      const link = createLink({ ...record, collectionId }, addOptions);
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
      return sortForDisplay([...map.values()]);
    },
    async get(id) {
      return map.get(id);
    },
    async add(record, addOptions = {}) {
      const collectionId = targetCollection(record, addOptions);
      const dansLaCollection = [...map.values()]
        .filter((link) => collectionOf(link) === collectionId);
      const duplicate = addOptions.allowDuplicate
        ? undefined
        : findDuplicate(dansLaCollection, record.url);
      if (duplicate) return mergeOrKeep(this, duplicate, record);
      const link = createLink({ ...record, collectionId }, addOptions);
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
 * Store adossé à une zone de `chrome.storage` (extension uniquement).
 *
 * Utile quand on veut que les données soient visibles depuis le service worker
 * et la page d'options sans ouvrir IndexedDB. Le quota par défaut est de 10 Mo
 * (ou illimité avec la permission `unlimitedStorage`).
 *
 * **La clé est un paramètre**, et ce n'est pas un détail de confort : la
 * collection de navigation privée vit dans `chrome.storage.session` sous
 * `links/private`. Deux zones distinctes, donc, et deux clés distinctes — une
 * clé unique employée dans deux zones rendrait une fuite de l'une vers l'autre
 * indétectable à la lecture du code.
 *
 * @param {{ area?: any, key?: string }} [options]
 * @returns {LinkStore}
 */
function createChromeStorageStore(options = {}) {
  const area = options.area ?? (globalThis.chrome?.storage?.local);
  if (!area) throw new Error('chrome.storage.local indisponible');

  const KEY = typeof options.key === 'string' && options.key !== ''
    ? options.key
    : COLLECTION_LINKS_KEY;

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
      return sortForDisplay(await readAll());
    },
    async get(id) {
      return (await readAll()).find((link) => link.id === id);
    },
    async add(record, addOptions = {}) {
      const collectionId = targetCollection(record, addOptions);
      const all = await readAll();
      const dansLaCollection = all.filter((link) => collectionOf(link) === collectionId);
      const duplicate = addOptions.allowDuplicate
        ? undefined
        : findDuplicate(dansLaCollection, record.url);
      if (duplicate) return mergeOrKeep(this, duplicate, record);
      const link = createLink({ ...record, collectionId }, addOptions);
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

/**
 * Borne un store à une collection.
 *
 * C'est la seule interface dont ont besoin la fenêtre, le service worker et
 * l'application : elles affichent **une** collection, y écrivent, et n'ont
 * jamais à connaître les autres. Le filtrage vit donc ici, une fois, plutôt
 * qu'à chaque appel — c'est ce qui garantit qu'aucune liste ne mélange deux
 * collections par oubli.
 *
 * Trois comportements méritent d'être notés :
 *
 * - **`add` dédoublonne dans la collection.** La même adresse peut figurer dans
 *   deux collections : c'est le sens du rangement, et un dédoublonnage global
 *   l'interdirait.
 * - **`clear` ne vide que la collection.** « Vider la collection » dans la
 *   fenêtre ne doit pas emporter les autres, qui ne sont même pas à l'écran.
 * - **`remove` est sans effet sur un lien d'une autre collection.** Un
 *   identifiant périmé ne doit pas permettre de supprimer ailleurs.
 *
 * @param {LinkStore} store
 * @param {string} collectionId
 * @returns {LinkStore}
 */
function withCollection(store, collectionId) {
  const cible = typeof collectionId === 'string' && collectionId.trim() !== ''
    ? collectionId.trim()
    : DEFAULT_COLLECTION_ID;

  return {
    async list() {
      return (await store.list()).filter((link) => collectionOf(link) === cible);
    },

    async get(id) {
      const link = await store.get(id);
      return link && collectionOf(link) === cible ? link : undefined;
    },

    async add(record, addOptions = {}) {
      return store.add({ ...record, collectionId: cible }, { ...addOptions, collectionId: cible });
    },

    async put(record) {
      return store.put({ ...record, collectionId: cible });
    },

    async putMany(records) {
      return store.putMany(records.map((record) => ({ ...record, collectionId: cible })));
    },

    async remove(id) {
      const link = await store.get(id);
      if (!link || collectionOf(link) !== cible) return;
      await store.remove(id);
    },

    async clear() {
      // Une suppression par lien, et non un `clear` du store : c'est la seule
      // façon d'épargner les autres collections avec les trois implémentations,
      // dont aucune ne sait filtrer ses suppressions.
      const liens = await this.list();
      for (const link of liens) await store.remove(link.id);
    },
  };
}

/**
 * Réunit plusieurs zones de stockage en un seul store.
 *
 * Les liens ordinaires vivent dans `chrome.storage.local`, ceux de la
 * navigation privée dans `chrome.storage.session`. La fenêtre et l'application
 * doivent pouvoir lire les deux — la collection courante peut être l'une ou
 * l'autre — mais **écrire chacune dans sa zone** : c'est `match` qui décide, à
 * partir de l'identifiant de collection de l'enregistrement. Sans ce routage,
 * une collection privée finirait sur le disque, ce que tout le reste du projet
 * cherche à empêcher.
 *
 * La première zone qui reconnaît la collection gagne. Une écriture dont aucune
 * zone ne veut est ignorée plutôt que dirigée au hasard : mieux vaut un lien
 * manquant qu'un lien privé écrit au mauvais endroit.
 *
 * @param {Array<{ store: LinkStore, match?: (collectionId: string) => boolean }>} zones
 * @returns {LinkStore}
 */
function createCompositeStore(zones = []) {
  const connues = zones.filter((zone) => zone?.store);

  /**
   * @param {string} collectionId
   * @returns {{ store: LinkStore }|undefined}
   */
  const zonePour = (collectionId) => connues.find((zone) => {
    try {
      return zone.match ? zone.match(collectionId) : true;
    } catch {
      return false;
    }
  });

  return {
    async list() {
      const listes = await Promise.all(connues.map((zone) => zone.store.list()));
      return sortForDisplay(listes.flat());
    },

    async get(id) {
      for (const zone of connues) {
        const link = await zone.store.get(id);
        if (link) return link;
      }
      return undefined;
    },

    async add(record, addOptions = {}) {
      const zone = zonePour(targetCollection(record, addOptions));
      if (!zone) return { link: undefined, duplicate: false };
      return zone.store.add(record, addOptions);
    },

    async put(record) {
      const zone = zonePour(collectionOf(record));
      if (!zone) return record;
      const ecrit = await zone.store.put(record);

      // Un `put` qui change la collection d'un enregistrement est un
      // **déplacement** : la copie restée dans une autre zone doit partir.
      // Sans cela, déplacer un lien de la collection privée vers une collection
      // ordinaire le laisserait en mémoire de session sous son ancien
      // identifiant — invisible en navigation normale, et perdu à la fermeture
      // du navigateur —, et le chemin inverse laisserait une copie sur le
      // disque, ce que tout le reste du projet cherche à empêcher.
      for (const autre of connues) {
        if (autre === zone) continue;
        const reste = await autre.store.get(record.id);
        if (reste) await autre.store.remove(record.id);
      }
      return ecrit;
    },

    async putMany(records) {
      let ecrits = 0;
      for (const record of records) {
        const zone = zonePour(collectionOf(record));
        if (!zone) continue;
        ecrits += await zone.store.putMany([record]);
      }
      return ecrits;
    },

    async remove(id) {
      for (const zone of connues) {
        const link = await zone.store.get(id);
        if (link) {
          await zone.store.remove(id);
          return;
        }
      }
    },

    async clear() {
      for (const zone of connues) await zone.store.clear();
    },
  };
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
 * **L'item de menu choisi commande.** Chrome remplit `info.linkUrl` dès que le
 * clic tombe sur un lien, *quel que soit l'item ensuite choisi* : un clic droit
 * sur une vignette de l'accueil de YouTube, suivi de « Ajouter cette page »,
 * fournit donc à la fois l'URL de la page et celle de la vidéo. La version
 * précédente donnait la priorité au lien, si bien que « Ajouter cette page »
 * enregistrait la vidéo — et l'utilisateur, ne trouvant pas la page qu'il avait
 * demandée, concluait que l'ajout n'avait pas eu lieu.
 *
 * Chaque item est donc traité pour ce qu'il annonce. Un identifiant inconnu —
 * Safari, ou un item ajouté plus tard — retombe sur l'ancienne heuristique, du
 * plus précis au plus général : sélection, lien, image, page.
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
  const lien = typeof info.linkUrl === 'string' && info.linkUrl !== '' && isValidUrl(info.linkUrl)
    ? info.linkUrl
    : '';
  const page = typeof info.pageUrl === 'string' && info.pageUrl !== ''
    ? info.pageUrl
    : (typeof tab?.url === 'string' ? tab.url : '');

  /** La page courante, avec le titre que le navigateur en donne. */
  const depuisLaPage = () => (isValidUrl(page)
    ? {
      url: page,
      title: typeof tab?.title === 'string' ? tab.title : '',
      source: 'context-menu',
      note: '',
    }
    : null);

  /** Le lien visé. Le texte sélectionné sert de titre faute de mieux. */
  const depuisLeLien = () => (lien === ''
    ? null
    : {
      url: lien,
      // Le texte du lien n'est pas exposé par l'API ; le domaine est la
      // meilleure description disponible sans requête réseau.
      //
      // Le domaine est celui de la **destination** : un résultat de moteur de
      // recherche passe par une adresse du moteur, et titrer « google.com » un
      // lien qui mène à Wikipédia ne dit rien de ce qu'on vient d'enregistrer.
      title: selection !== '' && !looksLikeUrl(selection)
        ? selection
        : hostOf(unwrapRedirectUrl(lien)),
      source: 'context-menu',
      note: selection !== '' && !looksLikeUrl(selection) ? selection : '',
    });

  switch (info.menuItemId) {
    case MENU_IDS.page:
      // Ce que l'utilisateur a demandé, littéralement. Une page interne du
      // navigateur n'est pas enregistrable : on le dit en renvoyant `null`,
      // plutôt que de retomber sur le lien visé.
      return depuisLaPage();

    case MENU_IDS.link:
      // Un lien visé qui serait inexploitable fait retomber sur la page : mieux
      // vaut un enregistrement utile qu'un refus sec.
      return depuisLeLien() ?? depuisLaPage();

    case MENU_IDS.selection: {
      // La sélection prime : l'utilisateur a désigné ce qu'il veut. Si elle
      // n'est pas une URL, elle devient une note sur le lien visé, ou sur la
      // page.
      if (looksLikeUrl(selection)) {
        return { url: selection, title: '', source: 'context-menu', note: '' };
      }
      const parLeLien = depuisLeLien();
      if (parLeLien && selection !== '') return { ...parLeLien, note: selection };
      return parLeLien ?? depuisLaPage();
    }

    default:
      break;
  }

  // Item inconnu : l'ancienne heuristique, du plus précis au plus général.
  if (looksLikeUrl(selection)) {
    return { url: selection, title: '', source: 'context-menu', note: '' };
  }

  const parLeLien = depuisLeLien();
  if (parLeLien) return parLeLien;

  // Image cliquée : le plus souvent ce que l'utilisateur vise.
  if (typeof info.srcUrl === 'string' && info.srcUrl !== '' && isValidUrl(info.srcUrl)) {
    return { url: info.srcUrl, title: '', source: 'context-menu', note: '' };
  }

  return depuisLaPage();
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
 * La zone de stockage de session, ou `null` si elle n'existe pas.
 *
 * C'est là que vivent les liens de la collection de navigation privée : en
 * mémoire, pour la durée du navigateur, et nulle part sur le disque. L'API
 * existe depuis Chrome 102 et **Safari 16.4** — la version minimale du projet —
 * mais on ne la suppose pas : une zone absente fait disparaître la collection
 * privée de l'interface plutôt que de laisser croire à une persistance qui
 * n'aurait pas lieu.
 *
 * @param {any} api
 * @returns {any|null}
 */
function sessionStorageArea(api) {
  const area = api?.storage?.session;
  if (!area || typeof area.get !== 'function' || typeof area.set !== 'function') return null;
  return area;
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
// dist/extension-safari/core/privacy.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Consentement à la mention de confidentialité.
 *
 * La FAQ du Chrome Web Store est explicite (questions 10 et 13) : la mention
 * doit être présentée **dans l'interface du produit**, et l'utilisateur doit
 * accomplir une action claire pour l'accepter *avant* toute collecte. Une
 * description soignée sur la fiche du magasin ne satisfait pas cette exigence.
 *
 * D'où ce module : il porte l'état du consentement, et c'est lui qui décide si
 * une collecte peut avoir lieu. Les chemins de collecte — clic droit et fenêtre
 * — l'interrogent avant d'enregistrer quoi que ce soit.
 *
 * `DISCLOSURE_VERSION` existe pour pouvoir **redemander** le consentement si le
 * texte change de nature. Sans elle, un consentement donné pour une version
 * antérieure vaudrait pour une version qui dit autre chose.
 *
 * Le stockage est injecté, comme pour les réglages : le module se teste sans
 * navigateur. L'interface attendue est celle de `chrome.storage.local` — un
 * `get(clé)` qui rend `{ [clé]: valeur }`, et un `set({ [clé]: valeur })`.
 * C'est le seul stockage auquel le service worker a accès.
 */

/** Clé de stockage, préfixée pour ne pas entrer en collision avec un autre outil. */
const CONSENT_KEY = 'url-qr-code-printer/privacy-consent';

/**
 * Version du texte de mention affiché.
 *
 * À incrémenter dès que la mention dit autre chose. Un consentement enregistré
 * pour une version antérieure ne vaut alors plus rien, et la mention est
 * présentée de nouveau.
 *
 * Version 2 : cinq services de raccourcissement au lieu de quatre, T.LY proposé
 * d'emblée, et une collection de navigation privée dont les liens vivent en
 * mémoire. Trois ajouts qui changent ce que la mention décrit — donc un accord à
 * redemander, comme la règle ci-dessus l'exige.
 */
const DISCLOSURE_VERSION = 2;

/** Décisions possibles. Le refus est un état de plein droit, pas une absence. */
const CONSENT_DECISIONS = Object.freeze(['accepted', 'declined']);

/**
 * Valide un enregistrement de consentement lu du stockage.
 *
 * Un enregistrement illisible ou d'une version périmée vaut `null` — c'est-à-dire
 * « pas de consentement ». Le défaut penche du côté sûr : on redemande, on ne
 * suppose jamais l'accord.
 *
 * @param {unknown} value
 * @returns {{ version: number, decision: 'accepted'|'declined', at: number } | null}
 */
function sanitizeConsent(value) {
  if (!value || typeof value !== 'object') return null;

  const version = Number.isInteger(value.version) ? value.version : null;
  if (version === null || version < 1) return null;

  if (!CONSENT_DECISIONS.includes(value.decision)) return null;

  const at = Number.isFinite(value.at) ? value.at : 0;
  return { version, decision: value.decision, at };
}

/**
 * Le consentement autorise-t-il la collecte ?
 *
 * Il faut une acceptation **à la version courante**. Un refus, une absence, ou
 * une acceptation d'une version antérieure rendent tous `false`.
 *
 * @param {{ version: number, decision: string } | null} record
 * @returns {boolean}
 */
function isAccepted(record) {
  return Boolean(record) && record.decision === 'accepted' && record.version === DISCLOSURE_VERSION;
}

/**
 * Faut-il présenter la mention avant de collecter ?
 * @param {{ version: number, decision: string } | null} record
 * @returns {boolean}
 */
function needsDisclosure(record) {
  return !isAccepted(record);
}

/**
 * Lit le consentement enregistré.
 *
 * Une lecture qui échoue vaut « pas de consentement » : c'est le seul défaut
 * acceptable, puisqu'il empêche la collecte au lieu de la permettre.
 *
 * @param {{ get: (key: string) => Promise<object> }} area
 * @returns {Promise<{ version: number, decision: 'accepted'|'declined', at: number } | null>}
 */
async function readConsent(area) {
  if (!area || typeof area.get !== 'function') return null;

  try {
    const data = await area.get(CONSENT_KEY);
    return sanitizeConsent(data?.[CONSENT_KEY]);
  } catch {
    return null;
  }
}

/**
 * Enregistre une décision.
 *
 * @param {{ set: (items: object) => Promise<void> }} area
 * @param {'accepted'|'declined'} decision
 * @param {{ now?: number, version?: number }} [options]
 * @returns {Promise<{ version: number, decision: 'accepted'|'declined', at: number }>}
 * @throws {TypeError} si la décision n'est pas reconnue.
 */
async function writeConsent(area, decision, options = {}) {
  if (!CONSENT_DECISIONS.includes(decision)) {
    throw new TypeError(`Décision de consentement inconnue : ${decision}`);
  }

  const record = {
    version: Number.isInteger(options.version) ? options.version : DISCLOSURE_VERSION,
    decision,
    at: Number.isFinite(options.now) ? options.now : Date.now(),
  };

  await area.set({ [CONSENT_KEY]: record });
  return record;
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
 *
 * Un doublon **inverse** le badge au lieu de prendre une teinte de plus. La
 * version précédente lui donnait l'encre du compteur, c'est-à-dire exactement la
 * couleur de l'état habituel : « déjà présent » et « rien ne s'est passé »
 * étaient indiscernables, et un lien déjà collecté passait pour un ajout raté.
 * Éclaircir le gris n'aurait fait qu'amoindrir le contraste sur une icône
 * orange ; l'inversion, elle, se voit. Le glyphe reste distinct dans les quatre
 * cas, si bien que la couleur n'est jamais la seule information (1.4.1).
 */
const BADGE_COUNT = { fond: '#1a1a1a', texte: '#ffffff' };
const BADGE_ADDED = { fond: '#1c7c4a', texte: '#ffffff' };
const BADGE_DUPLICATE = { fond: '#f4f4f4', texte: '#161616' };
// Un titre adopté **change** la collection, comme un ajout : mêmes teintes que
// l'ajout, et c'est le signe qui les sépare. Le fond clair reste réservé à ce
// qui ne change rien.
const BADGE_UPDATED = { fond: '#1c7c4a', texte: '#ffffff' };
const BADGE_ERROR = { fond: '#b3122b', texte: '#ffffff' };

/**
 * Durée d'un retour transitoire sur l'icône, en millisecondes.
 *
 * Le retour dure 2,5 s : un clic droit se fait en regardant la page, pas la
 * barre d'outils, et 1,5 s s'écoulaient souvent avant que l'œil n'y arrive.
 */
const FLASH_MS = 2500;

/**
 * Jusqu'à quand un retour transitoire occupe l'icône.
 *
 * La collecte écrit dans le stockage **avant** de poser son signe, et cette
 * écriture réveille l'écouteur de `storage.onChanged` ci-dessous : sans cette
 * échéance, le compteur remplacerait le « + » dans le même souffle, et le clic
 * droit n'aurait plus aucun retour visible.
 */
let flashUntil = 0;

/**
 * Les deux zones de liens, et la composition qui les réunit.
 *
 * Les liens ordinaires vivent dans `chrome.storage.local`. Ceux de la
 * collection de navigation privée vivent dans `chrome.storage.session` : en
 * mémoire, pour la durée du navigateur. C'est le routage par identifiant de
 * collection qui garantit qu'une URL privée ne peut pas être écrite sur le
 * disque — il n'existe aucun chemin qui l'y conduise.
 *
 * Sans `storage.session` (Chrome antérieur à 102, Safari antérieur à 16.4), la
 * collection privée n'existe pas : `privateStore` vaut `null` et une capture
 * faite depuis une fenêtre privée rejoint la collection courante ordinaire,
 * plutôt que d'inventer une persistance qui n'aurait pas lieu.
 */
const localStore = createChromeStorageStore({ area: api?.storage?.local });
const privateStore = (() => {
  const area = sessionStorageArea(api);
  if (!area) return null;
  try {
    return createChromeStorageStore({ area, key: PRIVATE_LINKS_KEY });
  } catch {
    return null;
  }
})();

const store = createCompositeStore([
  { store: localStore, match: (collectionId) => collectionId !== PRIVATE_COLLECTION_ID },
  ...(privateStore
    ? [{ store: privateStore, match: (collectionId) => collectionId === PRIVATE_COLLECTION_ID }]
    : []),
]);

/** La liste des collections, et celle qui est courante. */
const collections = createCollectionStore({ area: api?.storage?.local });

/**
 * La collection de navigation privée est-elle utilisable dans ce contexte ?
 * @param {boolean} isPrivate
 * @returns {boolean}
 */
function privateCollectionUsable(isPrivate) {
  return Boolean(isPrivate) && privateStore !== null;
}

/**
 * La collection courante d'un contexte, ou la collection par défaut.
 *
 * Ne lève jamais : une lecture impossible retombe sur la collection par défaut,
 * qui existe toujours — c'est la seule qui ne peut pas manquer.
 *
 * @param {boolean} isPrivate
 * @returns {Promise<string>}
 */
async function activeCollection(isPrivate) {
  try {
    return await collections.getActive(privateCollectionUsable(isPrivate));
  } catch {
    return DEFAULT_COLLECTION_ID;
  }
}

/**
 * Impose la couleur du texte du badge, si l'API existe.
 *
 * `setBadgeTextColor` n'existe que depuis Chrome 110 et Safari l'ignore. L'appel
 * est isolé pour qu'une absence n'interrompe pas la pose du texte : sans cette
 * précaution, un `await` qui échoue laisserait le badge **vide** au lieu de le
 * laisser au navigateur le soin de choisir une couleur lisible.
 *
 * @param {string} couleur
 * @returns {Promise<void>}
 */
async function applyBadgeTextColor(couleur) {
  try {
    await api.action.setBadgeTextColor?.({ color: couleur });
  } catch {
    // Le navigateur choisira lui-même une couleur de texte.
  }
}

/**
 * Met à jour le badge avec le nombre de liens de la collection courante.
 *
 * Le badge compte **ce qui est affiché** dans la fenêtre, et non la base
 * entière : un compteur qui annoncerait douze liens quand la collection en
 * contient deux ne dirait rien d'utile. Le contexte est celui de l'appelant —
 * une fenêtre privée a sa propre collection courante.
 *
 * @param {{ isPrivate?: boolean }} [options]
 */
async function refreshBadge(options = {}) {
  try {
    const collectionId = await activeCollection(Boolean(options.isPrivate));
    const links = await withCollection(store, collectionId).list();
    await api.action.setBadgeBackgroundColor({ color: BADGE_COUNT.fond });
    await applyBadgeTextColor(BADGE_COUNT.texte);
    await api.action.setBadgeText({ text: links.length ? String(links.length) : '' });
  } catch {
    // L'API badge peut être absente ou refusée : ce n'est pas bloquant.
  }
}

/**
 * Affiche brièvement un retour sur l'icône.
 *
 * @param {string} text
 * @param {{ fond: string, texte: string }} badge
 */
async function flashBadge(text, badge) {
  try {
    await api.action.setBadgeBackgroundColor({ color: badge.fond });
    await applyBadgeTextColor(badge.texte);
    await api.action.setBadgeText({ text });
    // L'échéance est posée **après** le signe : c'est ce qui garantit qu'aucun
    // rafraîchissement ne le remplace avant son terme.
    flashUntil = Date.now() + FLASH_MS;
    setTimeout(refreshBadge, FLASH_MS);
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
  // L'entrée de sélection est **activée**. Elle était créée désactivée, faute
  // d'argument à `buildMenuDefinitions()` : l'utilisateur voyait une entrée
  // grisée, et la justification de permission publiée sur le Chrome Web Store
  // annonçait pourtant trois entrées fonctionnelles, dont « Add the selected
  // text ». L'écart entre la fiche et le comportement est exactement ce qu'un
  // examinateur du magasin recherche.
  //
  // L'argument `appUrl` reste absent : il ne sert qu'à créer le séparateur et
  // l'entrée « Ouvrir URLQRCodePrinter », que la fiche ne décrit pas. En créer
  // une de plus rouvrirait le même écart dans l'autre sens.
  await installContextMenus(api, buildMenuDefinitions({ includeSelection: true }));
}

/**
 * Enregistre une capture et signale le résultat sur l'icône.
 *
 * Le contrôle du consentement est **ici**, et non chez les appelants. C'est le
 * seul point par lequel passe toute collecte du service worker — clic droit,
 * message venu d'une page, ou appel ajouté plus tard. Le placer chez les
 * appelants ferait dépendre la garantie de leur discipline : un chemin oublié
 * collecterait sans que personne ne l'ait accepté.
 *
 * Le rangement dans une collection est ici pour la même raison. Le contexte est
 * celui de l'onglet visé : une capture faite depuis une fenêtre privée rejoint
 * la collection privée, et une capture faite ailleurs ne peut pas l'atteindre.
 * C'est ce qui rend la sauvegarde spontanée — l'utilisateur n'a rien à choisir,
 * la collection courante est déjà la bonne — sans qu'une URL privée puisse
 * atterrir sur le disque.
 *
 * @param {object|null} capture
 * @param {{ isPrivate?: boolean }} [options]
 * @returns {Promise<{ recorded: boolean, reason?: 'consent'|'empty' }>}
 */
async function record(capture, options = {}) {
  if (!capture) {
    await flashBadge('!', BADGE_ERROR);
    return { recorded: false, reason: 'empty' };
  }

  const consent = await readConsent(api?.storage?.local);
  if (!isAccepted(consent)) {
    // La mention est rouverte dans deux cas, et deux seulement : l'utilisateur
    // ne s'est **jamais** prononcé, ou son accord portait sur un texte qui a
    // changé depuis — il doit alors lire celui qui s'applique. Après un refus
    // explicite, rouvrir un onglet à chaque tentative serait du harcèlement : le
    // refus est une décision, pas une absence.
    if (consent === null || consent.decision === 'accepted') {
      // Le badge est posé **dans les deux cas**. Il ne l'était pas à la première
      // installation : l'onglet de la mention s'ouvrait, et rien n'expliquait
      // sur l'icône pourquoi le clic droit n'avait rien enregistré. Un refus
      // explicite donnait un « ! » là où une installation neuve ne donnait rien
      // du tout — l'utilisateur le moins au fait était le moins renseigné.
      openPrivacyNotice();
    }
    await flashBadge('!', BADGE_ERROR);
    return { recorded: false, reason: 'consent' };
  }

  try {
    const collectionId = await activeCollection(Boolean(options.isPrivate));
    const { duplicate, updated } = await withCollection(store, collectionId).add(capture);
    // Trois retours distincts, du plus informatif au plus plat : le titre a été
    // adopté, le lien était déjà là, ou il vient d'arriver.
    if (updated) await flashBadge('✎', BADGE_UPDATED);
    else if (duplicate) await flashBadge('=', BADGE_DUPLICATE);
    else await flashBadge('+', BADGE_ADDED);
    return { recorded: true };
  } catch {
    await flashBadge('!', BADGE_ERROR);
    return { recorded: false };
  }
}

/**
 * Ouvre la mention de confidentialité.
 *
 * Elle doit être présentée **dans l'interface du produit**, avant toute
 * collecte : une description soignée sur la fiche du magasin ne la remplace pas
 * (FAQ Chrome Web Store, question 10). C'est aussi ce que fait ce service worker
 * lorsque le clic droit est utilisé sans consentement.
 */
function openPrivacyNotice() {
  api?.tabs?.create?.({ url: api.runtime.getURL('privacy.html') });
}

api?.runtime?.onInstalled?.addListener((details) => {
  installMenus();
  // La collection par défaut est matérialisée à l'installation : c'est elle qui
  // reçoit les liens de qui n'en crée jamais d'autre.
  collections.ensureDefault().catch(() => {});
  refreshBadge();

  // Seulement à la première installation. Rouvrir un onglet à chaque mise à
  // jour serait une intrusion, alors que le consentement est déjà enregistré.
  if (details?.reason === 'install') openPrivacyNotice();
});

api?.runtime?.onStartup?.addListener(() => {
  installMenus();
  collections.ensureDefault().catch(() => {});
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

    // Le consentement est contrôlé par `record` lui-même : le clic droit serait
    // sinon un chemin de collecte contournant la mention, que personne
    // n'ouvrirait jamais depuis la fenêtre.
    //
    // `tab.incognito` dit de quelle fenêtre vient le clic : c'est la seule
    // source fiable ici, le service worker n'ayant pas d'onglet à lui.
    await record(captureFromClick(info, tab), { isPrivate: Boolean(tab?.incognito) });
  });
}

// Un changement de langue depuis la fenêtre ou l'application reconstruit le
// menu : sans cela, les libellés resteraient ceux de la langue précédente
// jusqu'au prochain démarrage du navigateur.
api?.storage?.onChanged?.addListener((changes, area) => {
  if (area === 'local' && changes?.locale) installMenus();
});

// Le compteur suit le stockage, quel que soit celui qui l'écrit.
//
// L'application écrit dans les mêmes documents que la fenêtre — vider la
// collection, supprimer un lien, importer une archive — et elle ne parle pas au
// service worker, qui n'a aucune raison d'être connu d'elle. Le compteur gardait
// donc le nombre d'avant : un « 3 » qui survivait à une collection vidée, posé
// sur l'icône jusqu'au prochain événement. Le badge se réconcilie désormais **à
// la source**, plutôt que de demander à chaque page d'y penser — la même règle
// que le consentement, qui vit dans `record()` et non chez ses appelants.
api?.storage?.onChanged?.addListener((changes, area) => {
  // Les liens de la collection privée vivent dans `storage.session`, et le
  // compteur d'une fenêtre privée est posé par la fenêtre elle-même : elle seule
  // sait dans quelle fenêtre elle s'affiche. Un rafraîchissement déclenché d'ici
  // annoncerait à cette fenêtre le compte de la collection ordinaire.
  if (area !== 'local') return;
  if (!displayedDocuments('local').some((cle) => cle in changes)) return;
  // Un retour transitoire est à l'écran : c'est lui que l'œil doit voir, et
  // l'échéance posée par `flashBadge` repose le compteur juste après.
  if (Date.now() < flashUntil) return;
  // Volontairement non attendu : l'écouteur n'a rien à rendre à personne, et
  // `refreshBadge` ne lève jamais.
  refreshBadge();
});

api?.runtime?.onMessage?.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'refresh-badge') {
    // Le contexte vient de la page qui demande : elle seule sait dans quelle
    // fenêtre elle s'affiche.
    refreshBadge({ isPrivate: Boolean(message.isPrivate) }).then(() => sendResponse({ ok: true }));
    return true; // réponse asynchrone
  }
  if (message?.type === 'record-capture') {
    record(message.capture, { isPrivate: Boolean(message.isPrivate) })
      .then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});
