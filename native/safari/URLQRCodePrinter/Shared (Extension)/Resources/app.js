// app.js — fichier assemblé par scripts/build.mjs.
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
// dist/extension-safari/element-ids.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Identifiants des éléments que `app.js` attend dans `index.html`.
 *
 * Cette liste vit dans son propre module pour être vérifiable : un test
 * confronte chaque identifiant au HTML réel, ce qui attrape la faute la plus
 * banale d'une application web — un `id` renommé d'un côté seulement, qui ne
 * produit qu'une erreur `null` à l'exécution.
 */

const ELEMENT_IDS = Object.freeze([
  'stale-style',
  'count',
  'collection-picker',
  'collection-select',
  'collection-add',
  'collection-delete',
  'collection-hint',
  'collection-name',
  'collection-note',
  'collection-start',
  'shortener-hint',
  'add-form',
  'url-input',
  'add-error',
  'search',
  'sort-mode',
  'sort-hint',
  'select-all-box',
  'selection-hint',
  'reorder',
  'move-group',
  'move-to',
  'move-menu',
  'shortener',
  'shorten',
  'shorten-clear',
  'shorten-status',
  'qr-target',
  'target-hint',
  'list',
  'empty',
  'export-xlsx',
  'export-csv',
  'export-md',
  'export-json',
  'import',
  'import-file',
  'import-menu',
  'import-menu-title',
  'import-menu-hint',
  'import-merge',
  'import-replace',
  'import-add',
  'import-cancel',
  'clear',
  'preset',
  'preset-prev',
  'preset-next',
  'sheet-qr',
  'sheet-font',
  'sheet-qr-info',
  'sheet-title',
  'sheet-url',
  'sheet-date',
  'sheet-date-time',
  'sheet-date-index',
  'sheet-date-hint',
  'sheet-fit-hint',
  'sheet-auto',
  'sheet-auto-hint',
  'sheet-columns',
  'sheet-rows',
  'sheet-grid-hint',
  'sheet-fit',
  'sheet-border',
  'sheet-header',
  'sheet-header-date',
  'sheet-header-note',
  'sheet-header-hint',
  'sheet-margin-x',
  'sheet-margin-y',
  'sheet-gap-x',
  'sheet-gap-y',
  'sheet-offset-x',
  'sheet-offset-y',
  'sheet-info',
  'table-qr',
  'table-orientation',
  'table-margin-x',
  'table-margin-y',
  'table-title',
  'table-title-date',
  'table-title-note',
  'table-col-index',
  'table-col-qr',
  'table-col-url',
  'table-col-title',
  'table-col-tags',
  'table-col-note',
  'table-col-date',
  'table-col-date-time',
  'table-grid',
  'table-hint',
  'export-table',
  'export-sheet',
  'panel-actions',
  'label-profile',
  'profile-hint',
  'supply-hint',
  'density',
  'copies',
  'label-rotation',
  'label-link',
  'label-show-index',
  'label-show-title',
  'label-show-url',
  'label-show-host',
  'label-show-date',
  'label-date-time',
  'label-content-hint',
  'label-supply',
  'label-alignment',
  'label-font-size',
  'label-title-size',
  'label-qr-field',
  'label-qr-size',
  'label-qr-hint',
  'label-font-hint',
  'print-scope-hint',
  'label-format',
  'label-margin',
  'label-font',
  'label-cut',
  'label-real-size',
  'export-index',
  'export-title',
  'export-url',
  'export-host',
  'export-real-size',
  'export-date',
  'export-date-time',
  'export-labels',
  'printer-dot',
  'printer-name',
  'connect',
  'disconnect',
  'ble-support',
  'print-label',
  'export-niimbot',
  'print-status',
  'preview',
  'print',
  'print-root',
  'site-link',
  'footer-year',
  'toast',
]);

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/exporters.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Exports texte : CSV, Markdown et JSON.
 *
 * Fonctions pures : elles reçoivent un tableau de LinkRecord et renvoient une
 * chaîne. L'écriture disque est laissée à l'appelant (téléchargement, API
 * File System Access, ou pont natif), ce qui rend ces fonctions testables
 * hors navigateur.
 */



/**
 * Modes d'affichage de la date sous un QR Code.
 *
 * `none` par défaut : un QR Code doit rester lisible, et chaque ligne de texte
 * supplémentaire réduit la place disponible. Le mode `datetime` sert aux cas où
 * l'heure compte — recherche, essais, prototypes — où l'on doit pouvoir dater
 * une capture à la minute près.
 */
const DATE_MODES = Object.freeze(['none', 'date', 'datetime']);

/**
 * Formate la date de collecte d'un lien, sans l'heure.
 * @param {number} epochMs
 * @returns {string} `JJ/MM/AAAA`, ou chaîne vide si la date est inutilisable.
 */
function formatDate(epochMs) {
  if (!Number.isFinite(epochMs)) return '';
  const d = new Date(epochMs);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/**
 * Texte de date à imprimer sous un QR Code, selon le mode retenu.
 *
 * Une date illisible ne doit pas produire une ligne vide dans une étiquette :
 * on renvoie une chaîne vide, que les appelants n'impriment pas.
 *
 * @param {number} epochMs
 * @param {string} [mode] `none`, `date` ou `datetime`.
 * @returns {string}
 */
function formatCaptureDate(epochMs, mode = 'none') {
  if (mode === 'date') return formatDate(epochMs);
  if (mode === 'datetime') return formatDateTime(epochMs);
  return '';
}

/**
 * Colonnes de l'export tabulaire, dans l'ordre d'affichage.
 * `get` extrait la valeur brute ; `header` est le libellé de la colonne.
 */
const COLUMNS = [
  { key: 'index', header: 'N°', get: (_link, i) => String(i + 1) },
  { key: 'url', header: 'URL', get: (link) => link.url },
  { key: 'title', header: 'Titre', get: (link) => link.title },
  { key: 'host', header: 'Domaine', get: (link) => hostOf(link.url) },
  { key: 'tags', header: 'Tags', get: (link) => link.tags.join(' ') },
  { key: 'note', header: 'Note', get: (link) => link.note },
  { key: 'createdAt', header: 'Ajouté le', get: (link) => formatDateTime(link.createdAt) },
];

/**
 * Colonne ajoutée en fin de tableau quand au moins un lien est raccourci.
 *
 * L'export texte reste ainsi un export de **données** : il conserve l'URL
 * d'origine en colonne principale — c'est elle qui identifie le lien dans le
 * temps — et consigne le raccourci à côté, sans jamais l'y substituer. Le choix
 * « le QR Code encode le raccourci » ne concerne que les sorties imprimées.
 */
const SHORT_COLUMN = {
  key: 'shortUrl',
  header: 'URL courte',
  get: (link) => (hasShortUrl(link) ? link.shortUrl : ''),
};

/**
 * Indique si au moins un lien porte une note.
 *
 * Règle du projet : une colonne facultative — note, tags, URL courte — ne
 * s'affiche que si elle a quelque chose à montrer. Un tableau dont une colonne
 * reste vide sur toute sa hauteur ne fait qu'occuper la place.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @returns {boolean}
 */
function hasAnyNote(links) {
  return links.some((link) => typeof link.note === 'string' && link.note !== '');
}

/**
 * Indique si au moins un lien porte un tag.
 * @param {import('./link.js').LinkRecord[]} links
 * @returns {boolean}
 */
function hasAnyTag(links) {
  return links.some((link) => Array.isArray(link.tags) && link.tags.length > 0);
}

/**
 * Colonnes à écrire pour une collection : la colonne « URL courte » n'apparaît
 * que si elle a quelque chose à contenir.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @param {typeof COLUMNS} [base]
 * @returns {typeof COLUMNS}
 */
function columnsFor(links, base = COLUMNS) {
  return links.some(hasShortUrl) ? [...base, SHORT_COLUMN] : base;
}

/**
 * Formate une date en `JJ/MM/AAAA HH:MM` (heure locale).
 * @param {number} epochMs
 * @returns {string}
 */
function formatDateTime(epochMs) {
  if (!Number.isFinite(epochMs)) return '';
  const d = new Date(epochMs);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Formate une date en `AAAA-MM-JJ` (tri lexicographique correct).
 * @param {number} epochMs
 * @returns {string}
 */
function formatDateIso(epochMs) {
  if (!Number.isFinite(epochMs)) return '';
  return new Date(epochMs).toISOString().slice(0, 10);
}

/**
 * Échappe un champ CSV selon la RFC 4180.
 * Le champ est entouré de guillemets s'il contient le séparateur, un guillemet,
 * un retour à la ligne, ou une espace de début/fin.
 *
 * @param {unknown} value
 * @param {string} delimiter
 * @returns {string}
 */
function escapeCsvField(value, delimiter = ';') {
  const text = value == null ? '' : String(value);
  const mustQuote =
    text.includes(delimiter) ||
    text.includes('"') ||
    text.includes('\n') ||
    text.includes('\r') ||
    text !== text.trim();
  if (!mustQuote) return text;
  return '"' + text.replace(/"/g, '""') + '"';
}

/**
 * Sérialise les liens en CSV.
 *
 * Le séparateur par défaut est le point-virgule : c'est ce qu'attendent Excel
 * et Numbers en configuration française. `delimiter: ','` produit un CSV
 * strictement conforme à la RFC 4180.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @param {{ delimiter?: string, bom?: boolean, columns?: typeof COLUMNS }} [options]
 * @returns {string}
 */
function toCsv(links, options = {}) {
  const delimiter = options.delimiter === ',' ? ',' : ';';
  const columns = options.columns ?? columnsFor(links);

  const lines = [columns.map((c) => escapeCsvField(c.header, delimiter)).join(delimiter)];
  links.forEach((link, index) => {
    lines.push(
      columns.map((c) => escapeCsvField(c.get(link, index), delimiter)).join(delimiter),
    );
  });

  const body = lines.join('\r\n') + '\r\n';
  // Le BOM aide Excel à détecter l'UTF-8 ; il gêne certains scripts.
  return options.bom === false ? body : '\uFEFF' + body;
}

/**
 * Assemble un CSV à partir d'un en-tête et de lignes de cellules.
 *
 * Le point-virgule est le séparateur, et le BOM aide Excel à reconnaître
 * l'UTF-8. La convention vit ici, une fois : les dossiers exportés — planche,
 * tableau, étiquettes — la partageaient en la recopiant chacun, et le build
 * refuse d'ailleurs deux déclarations de même nom, ce qui a fait remonter la
 * duplication.
 *
 * @param {unknown[]} entetes
 * @param {unknown[][]} lignes
 * @returns {string}
 */
function toCsvTable(entetes, lignes) {
  const delimiter = ';';
  return '\uFEFF' + [entetes, ...lignes]
    .map((ligne) => ligne.map((cellule) => escapeCsvField(cellule, delimiter)).join(delimiter))
    .join('\r\n') + '\r\n';
}

/**
 * Échappe le contenu d'une cellule de tableau Markdown.
 * @param {unknown} value
 * @returns {string}
 */
function escapeMarkdownCell(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ');
}

/**
 * Sérialise les liens en Markdown lisible par un humain.
 *
 * Deux présentations :
 * - `'table'` (défaut) : un tableau, pratique à relire sur GitHub/Obsidian ;
 * - `'list'` : une liste à puces, plus adaptée aux longues notes.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @param {{
 *   title?: string,
 *   layout?: 'table' | 'list',
 *   frontmatter?: boolean,
 *   includeQr?: boolean,
 *   now?: number,
 * }} [options]
 * @returns {string}
 */
function toMarkdown(links, options = {}) {
  const {
    title = 'Mes liens QR Code',
    // La note de collection n'est pas un lien : elle décrit l'ensemble. Elle
    // n'apparaît donc que dans les sorties qui portent un en-tête — Markdown et
    // archive — et jamais dans un CSV, qui n'a que des lignes de liens.
    note = '',
    layout = 'table',
    frontmatter = true,
    includeQr = false,
    now = Date.now(),
  } = options;

  const out = [];

  if (frontmatter) {
    out.push('---');
    out.push(`title: ${JSON.stringify(title)}`);
    if (note) out.push(`note: ${JSON.stringify(note)}`);
    out.push(`count: ${links.length}`);
    out.push(`generated: ${new Date(now).toISOString()}`);
    out.push('---');
    out.push('');
  }

  out.push(`# ${title}`);
  out.push('');
  if (note) {
    // Chaque ligne du paragraphe est citée : sans cela, un retour à la ligne
    // dans la note casserait la mise en forme du document.
    for (const ligne of note.split('\n')) out.push(ligne === '' ? '>' : `> ${ligne}`);
    out.push('');
  }
  out.push(`_${links.length} lien${links.length > 1 ? 's' : ''} — exporté le ${formatDateTime(now)}_`);
  out.push('');

  if (links.length === 0) {
    out.push('_Aucun lien enregistré._');
    return out.join('\n') + '\n';
  }

  if (layout === 'list') {
    for (const link of links) {
      const label = link.title || link.url;
      out.push(`- [${escapeMarkdownCell(label)}](${link.url})`);
      const meta = [];
      if (link.tags.length) meta.push(link.tags.map((t) => '`#' + t + '`').join(' '));
      if (link.note) meta.push(escapeMarkdownCell(link.note));
      meta.push(`_ajouté le ${formatDateIso(link.createdAt)}_`);
      out.push('  ' + meta.join(' — '));
      if (includeQr) {
        // Chemin relatif : l'image est produite à côté du fichier .md.
        out.push(`  ![](qr/${link.id}.png)`);
      }
      out.push('');
    }
    return out.join('\n');
  }

  // La colonne « Note » n'apparaît que si elle a du contenu : un tableau
  // Markdown se lit mal quand une colonne reste vide, et la note est le seul
  // champ dont la longueur n'est pas bornée.
  const withNote = hasAnyNote(links);

  out.push(withNote
    ? '| N° | URL | Titre | Tags | Note | Ajouté le |'
    : '| N° | URL | Titre | Tags | Ajouté le |');
  out.push(withNote
    ? '| ---: | --- | --- | --- | --- | --- |'
    : '| ---: | --- | --- | --- | --- |');

  links.forEach((link, index) => {
    const linkCell = `[${escapeMarkdownCell(link.url)}](${link.url})`;
    const noteCell = withNote ? `${escapeMarkdownCell(link.note)} | ` : '';
    out.push(
      `| ${index + 1} | ${linkCell} | ${escapeMarkdownCell(link.title)} | ` +
        `${link.tags.map((t) => '`#' + t + '`').join(' ')} | ${noteCell}` +
        `${formatDateIso(link.createdAt)} |`,
    );
  });
  out.push('');

  if (includeQr) {
    out.push('## Planches de QR Codes');
    out.push('');
    out.push('Les images correspondantes sont dans le dossier `qr/`.');
    out.push('');
  }

  return out.join('\n');
}

/**
 * Sérialise les liens en JSON indenté (format d'archive et d'import).
 * @param {import('./link.js').LinkRecord[]} links
 * @param {{ now?: number, app?: string }} [options]
 * @returns {string}
 */
/** Nom de collection par défaut, partagé avec l'export Markdown. */
const DEFAULT_COLLECTION_TITLE = 'Mes liens QR Code';

function toJson(links, options = {}) {
  return JSON.stringify(
    {
      format: 'url-qr-code-printer/links',
      version: 1,
      exportedAt: new Date(options.now ?? Date.now()).toISOString(),
      app: options.app ?? 'url-qr-code-printer',
      // Le nom et la note décrivent la **collection**, pas les liens : ils sont
      // donc à côté d'eux, et non mêlés à eux.
      collection: {
        name: options.title ?? DEFAULT_COLLECTION_TITLE,
        ...(options.note ? { note: options.note } : {}),
      },
      count: links.length,
      links,
    },
    null,
    2,
  );
}

/**
 * Relit une archive JSON produite par `toJson`, en tolérant un tableau nu.
 * @param {string} text
 * @returns {unknown[]} enregistrements bruts, à passer à `createLink`.
 */
function parseJsonExport(text) {
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.links)) return parsed.links;
  throw new TypeError('Archive JSON non reconnue : clé « links » absente');
}

/**
 * Construit un nom de fichier horodaté et sûr.
 * @param {string} base
 * @param {string} extension
 * @param {number} [now]
 * @returns {string}
 */
function exportFilename(base, extension, now = Date.now()) {
  const d = new Date(now);
  const pad = (n) => String(n).padStart(2, '0');
  const stamp =
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}`;
  const safe = base.replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') || 'liens';
  return `${safe}-${stamp}.${extension}`;
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/shorten.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Raccourcissement d'URL — fonctionnalité optionnelle.
 *
 * Deux raisons de raccourcir un lien avant de l'imprimer :
 *   - un QR Code plus court est moins dense, donc plus facile à scanner et
 *     imprimable plus petit (c'est décisif sur une étiquette de 12 mm) ;
 *   - l'URL tient sur une seule ligne sous le QR Code.
 *
 * Deux raisons de s'en méfier, qu'il ne faut pas cacher à l'utilisateur :
 *   - le lien imprimé dépend d'un service tiers : s'il ferme, l'étiquette est
 *     morte. L'URL d'origine reste donc **toujours** conservée dans le modèle,
 *     et le raccourcissement n'écrase jamais `url` ;
 *   - raccourcir transmet l'URL complète à ce tiers. C'est pour cela que la
 *     fonction est désactivée par défaut.
 *
 * Ce module est pur : le réseau est injecté via `options.fetch`, ce qui permet
 * de le tester sans sortir de la machine. Aucun service n'est appelé au
 * chargement de la page — uniquement sur action explicite. Cette règle vaut
 * aussi pour T.LY, désormais proposé d'emblée : présélectionner un service ne
 * raccourcit rien, et le QR Code encode l'URL collectée tant que l'utilisateur
 * n'a pas cliqué sur le bouton de raccourcissement.
 *
 * ## T.LY, et pourquoi il est le seul service à dépendre de l'origine
 *
 * T.LY accepte un raccourcissement **sans clé d'API**, mais uniquement quand la
 * requête vient d'une origine d'extension (`chrome-extension://`,
 * `safari-web-extension://`, `moz-extension://`) : la même requête depuis une
 * page web ordinaire reçoit un `403`. Mesuré le 29 septembre 2026, sur les
 * quatre cas — origine d'extension acceptée, origine web refusée, absence
 * d'`Origin` refusée, jeton invalide ignoré. La réponse porte
 * `access-control-allow-origin` sur l'origine appelante, donc aucune permission
 * d'hôte supplémentaire n'est nécessaire, et le quota annoncé est de 50
 * requêtes (`x-ratelimit-limit`).
 *
 * Deux conséquences, tenues par le code plutôt que par un commentaire :
 * `defaultShortenerId()` ne propose T.LY que là où il peut répondre, et un
 * refus y reçoit une phrase lisible plutôt qu'un code de statut.
 */




/** Délai au-delà duquel une requête est abandonnée. */
const SHORTENER_TIMEOUT_MS = 12000;

/**
 * Erreur de raccourcissement, avec un code exploitable par l'interface.
 *
 * Codes : `unsupported` (pas de `fetch`), `unknown` (service inconnu),
 * `invalid` (URL d'entrée refusée ou réponse illisible), `network`, `timeout`,
 * `aborted`, `http` (statut hors 2xx), `service` (le service a répondu une
 * erreur en clair), `unchanged` (le service a renvoyé l'URL d'origine).
 */
class ShortenError extends Error {
  /**
   * @param {string} message
   * @param {string} code
   * @param {{ provider?: string, status?: number, cause?: unknown }} [details]
   */
  constructor(message, code, details = {}) {
    super(message, details.cause ? { cause: details.cause } : undefined);
    this.name = 'ShortenError';
    this.code = code;
    this.provider = details.provider ?? '';
    this.status = details.status ?? 0;
  }
}

/**
 * Extrait le premier lien d'une réponse texte.
 * @param {string} text
 * @returns {string}
 */
function firstUrl(text) {
  const match = String(text).match(/https?:\/\/[^\s"'<>\\]+/i);
  return match ? match[0] : '';
}

/** Clés JSON susceptibles de porter le lien court, par ordre de priorité. */
const SHORT_KEYS = ['short_url', 'shortUrl', 'shortURL', 'short', 'result_url', 'resultUrl', 'url', 'link'];

/**
 * Cherche un lien court dans une réponse JSON, à plat ou imbriquée.
 * @param {unknown} value
 * @param {number} [depth]
 * @returns {string}
 */
function urlFromJson(value, depth = 0) {
  if (depth > 3 || value == null || typeof value !== 'object') return '';
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = urlFromJson(item, depth + 1);
      if (found) return found;
    }
    return '';
  }
  for (const key of SHORT_KEYS) {
    const candidate = value[key];
    if (typeof candidate === 'string' && /^https?:\/\//i.test(candidate.trim())) {
      return candidate.trim();
    }
  }
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === 'object') {
      const found = urlFromJson(nested, depth + 1);
      if (found) return found;
    }
  }
  return '';
}

/**
 * Tronque un corps de réponse pour l'afficher dans un message d'erreur.
 * @param {string} text
 * @returns {string}
 */
function excerpt(text) {
  const clean = String(text).replace(/\s+/g, ' ').trim().slice(0, 120);
  return clean === '' ? '(vide)' : clean;
}

/**
 * Catalogue des services proposés.
 *
 * Tous fonctionnent sans clé d'API et sans autorisation d'hôte supplémentaire :
 * leur réponse porte un en-tête CORS permissif, ce qui évite d'élargir les
 * permissions de l'extension — un point important pour un outil qui lit les URL
 * de tous vos onglets.
 *
 * `spacingMs` est le délai minimal entre deux requêtes : il respecte les limites
 * documentées par les services bénévoles (`is.gd` et `v.gd` refusent au-delà de
 * cinq créations par tranche de dix secondes).
 *
 * `label` est le texte montré dans la liste déroulante. Il ne dit pas ce que le
 * service *est* (`note`, réservé à l'infobulle et à la documentation) mais ce
 * qu'il **change pour l'utilisateur** : quelqu'un qui veut seulement un lien
 * plus court doit pouvoir choisir sans connaître ces marques. D'où le
 * « (défaut) » sur le premier, et un différenciateur concret sur les autres.
 *
 * `extensionOnly` signale un service qui ne répond que depuis une origine
 * d'extension (T.LY). `explain` remplace le message technique du service par
 * une phrase lisible, pour les statuts où la réponse brute ne dit rien
 * d'utilisable — un « 403 » n'apprend rien à qui veut seulement un lien court.
 */
const SHORTENERS = Object.freeze([
  {
    id: 'tly',
    name: 'T.LY',
    label: 'T.LY (défaut) — lien plus court',
    site: 'https://t.ly',
    note: 'Lien plus court, servi par t.ly. Les liens créés ici sont anonymes : ils ne sont rattachés à aucun compte T.LY.',
    spacingMs: 700,
    upgradeToHttps: false,
    extensionOnly: true,
    explain: {
      403: 'T.LY n\'accepte un lien anonyme que depuis l\'extension. Choisissez un autre service, ou passez par la fenêtre de l\'extension.',
    },
    /**
     * @param {string} url
     * @returns {{ url: string, init: RequestInit }}
     */
    build(url) {
      return {
        url: 'https://api.t.ly/api/v1/link/shorten',
        init: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          // Le service attend `long_url` : `url` répondrait
          // « The long url field is required. » (422).
          body: JSON.stringify({ long_url: url }),
        },
      };
    },
  },
  {
    id: 'tinyurl',
    name: 'TinyURL',
    label: 'TinyURL — liens durables',
    site: 'https://tinyurl.com',
    note: 'Sans clé d\'API, HTTPS, liens durables. Service commercial.',
    spacingMs: 500,
    upgradeToHttps: false,
    /**
     * @param {string} url
     * @returns {{ url: string, init: RequestInit }}
     */
    build(url) {
      const query = new URLSearchParams({ url });
      return { url: `https://tinyurl.com/api-create.php?${query}`, init: { method: 'GET' } };
    },
  },
  {
    id: 'isgd',
    name: 'is.gd',
    label: 'is.gd — sans statistiques',
    site: 'https://is.gd',
    note: 'Sans clé ni statistiques. Service bénévole, régulièrement indisponible.',
    spacingMs: 2200,
    upgradeToHttps: false,
    build(url) {
      const query = new URLSearchParams({ format: 'simple', url });
      return { url: `https://is.gd/create.php?${query}`, init: { method: 'GET' } };
    },
  },
  {
    id: 'vgd',
    name: 'v.gd',
    label: 'v.gd — avertissement avant redirection',
    site: 'https://v.gd',
    note: 'Même infrastructure que is.gd, mais les liens affichent un avertissement avant redirection.',
    spacingMs: 2200,
    upgradeToHttps: false,
    build(url) {
      const query = new URLSearchParams({ format: 'simple', url });
      return { url: `https://v.gd/create.php?${query}`, init: { method: 'GET' } };
    },
  },
  {
    id: 'spoome',
    name: 'spoo.me',
    label: 'spoo.me — statistiques de clics',
    site: 'https://spoo.me',
    note: 'Sans clé, statistiques de clics. Répond en HTTP : le lien est ramené en HTTPS.',
    spacingMs: 700,
    upgradeToHttps: true,
    build(url) {
      const body = new URLSearchParams({ url }).toString();
      return {
        url: 'https://spoo.me/',
        init: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body,
        },
      };
    },
  },
]);

/** Service utilisé par défaut : T.LY, le seul qui raccourcisse sans clé ni compte. */
const DEFAULT_SHORTENER = 'tly';

/**
 * Adresse du programme d'affiliation T.LY.
 *
 * Le lien « Créer un compte T.LY » apparaît sous le sélecteur quand elle est
 * remplie, et lui seul l'utilise : **aucune donnée envoyée au service ne
 * change**. L'identifiant de parrainage ne part que si l'utilisateur suit ce
 * lien, et le libellé le dit — « (parrainage) » — plutôt que de le taire. Un
 * raccourcissement reste anonyme, avec ou sans ce lien.
 *
 * Le parrainage n'a donc rien d'un pistage : il ne se déclenche pas à
 * l'installation, ni au premier raccourcissement, mais sur un clic explicite,
 * vers une page dont c'est l'objet.
 */
const TLY_AFFILIATE_URL = 'https://t.ly/register?via=gael';

/**
 * Le code tourne-t-il dans une extension ?
 *
 * `chrome.runtime.id` n'existe que dans une page d'extension : une page web
 * ordinaire expose bien `window.chrome` sur les navigateurs Chromium, mais sans
 * `runtime`. C'est donc le seul test fiable, et il décide du service proposé
 * d'emblée — T.LY refuse les origines web ordinaires.
 *
 * @param {any} [scope]
 * @returns {boolean}
 */
function hasExtensionRuntime(scope = globalThis) {
  const runtime = scope?.chrome?.runtime ?? scope?.browser?.runtime;
  return typeof runtime?.id === 'string' && runtime.id !== '';
}

/**
 * Service proposé d'emblée, selon l'environnement.
 *
 * T.LY là où il peut répondre — c'est-à-dire dans l'extension — et le premier
 * service qui fonctionne depuis n'importe quelle origine ailleurs. Le choix
 * reste modifiable, et ce n'est qu'une présélection : changer de service
 * n'écrit rien d'autre que la préférence.
 *
 * @param {boolean} [isExtension]
 * @returns {string}
 */
function defaultShortenerId(isExtension = hasExtensionRuntime()) {
  if (isExtension) return DEFAULT_SHORTENER;
  const portable = SHORTENERS.find((shortener) => !shortener.extensionOnly);
  return portable ? portable.id : DEFAULT_SHORTENER;
}

/**
 * Retrouve un service par son identifiant.
 * @param {string} id
 * @returns {typeof SHORTENERS[number]|undefined}
 */
function findShortener(id) {
  return SHORTENERS.find((shortener) => shortener.id === id);
}

/**
 * Les codes d'échec qui accusent le **service**, et non le lien.
 *
 * La distinction commande tout le reste : « ce lien est déjà court » ne dit rien
 * de la santé du service, alors qu'un délai dépassé, un statut HTTP en erreur ou
 * une réponse qui n'est pas un lien disent que le service ne répond pas —
 * aujourd'hui, pour ce lien-là, et peut-être pour les suivants.
 *
 * `unsupported` est écarté pour la même raison : il signale que le navigateur
 * n'offre pas `fetch`, ce qui n'est la faute de personne. `aborted` aussi : c'est
 * l'utilisateur qui a annulé.
 *
 * `network` et `timeout` sont les deux codes de l'injoignable, et ce sont ceux
 * qu'on rencontre vraiment : un service qui bloque, un délai dépassé. Ils
 * manquaient à la première version de cette liste, qui ne retenait que ce que
 * `shortenUrl` sait produire — l'épreuve dans Chrome a montré le vrai cas, une
 * requête bloquée, classée `network` et donc ignorée.
 */
const SERVICE_FAILURE_CODES = Object.freeze(['http', 'service', 'network', 'timeout']);

/**
 * @param {string} [code]
 * @returns {boolean}
 */
function isServiceFailure(code) {
  return SERVICE_FAILURE_CODES.includes(code);
}

/**
 * Le premier service qui n'a pas échoué, en partant du service choisi.
 *
 * **Aucune substitution automatique.** Changer de service sans le dire enverrait
 * l'adresse de l'utilisateur à un tiers qu'il n'a pas choisi : c'est exactement
 * ce que ce produit s'interdit. On propose, l'utilisateur décide.
 *
 * @param {string} currentId
 * @param {Iterable<string>} failedIds
 * @returns {object|undefined} Le service à suggérer, ou `undefined` si aucun.
 */
function suggestShortener(currentId, failedIds) {
  const enEchec = new Set(failedIds);
  return SHORTENERS.find((shortener) => shortener.id !== currentId && !enEchec.has(shortener.id));
}

/**
 * Analyse la réponse d'un service et en extrait le lien court.
 *
 * Les services bénévoles signalent leurs pannes par un texte en clair
 * (« Error, database insert failed ») accompagné d'un statut 200 : se fier au
 * statut seul laisserait passer ce texte pour une URL. D'où la validation
 * systématique du résultat.
 *
 * @param {string} text
 * @param {number} status
 * @param {typeof SHORTENERS[number]} shortener
 * @param {string} originalUrl
 * @returns {string} lien court validé
 * @throws {ShortenError}
 */
function parseShortResponse(text, status, shortener, originalUrl) {
  const fail = (message, code) =>
    new ShortenError(message, code, { provider: shortener.id, status });

  if (status < 200 || status >= 300) {
    // Un statut hors 2xx donne le message générique du service, sauf quand le
    // catalogue en déclare un meilleur : « T.LY a répondu 403 (Invalid
    // request…) » est exact et inutilisable, là où la phrase de `explain` dit
    // quoi faire. Le code d'erreur, lui, ne change pas — c'est encore le
    // service qui a refusé, et c'est ce que lit la proposition de le changer.
    const explication = shortener.explain?.[status];
    throw fail(
      explication
        ? t(explication)
        : `${shortener.name} a répondu ${status} (${excerpt(text)})`,
      'http',
    );
  }

  const body = String(text ?? '').trim();
  // Une réponse vide est une réponse du **service** : c'est lui qui n'a rien
  // dit, et non le lien qui serait mauvais. Le code le dit, sinon l'appelant ne
  // peut pas distinguer les deux — et c'est cette distinction qui décide si l'on
  // propose un autre service.
  if (body === '') throw fail(`${shortener.name} a renvoyé une réponse vide`, 'service');

  let candidate = '';
  if (body.startsWith('{') || body.startsWith('[')) {
    try {
      candidate = urlFromJson(JSON.parse(body));
    } catch {
      // Corps annoncé JSON mais illisible : on retombe sur la recherche texte.
      candidate = '';
    }
  }
  if (candidate === '') candidate = firstUrl(body);

  if (candidate === '') {
    throw fail(`${shortener.name} a répondu « ${excerpt(body)} » au lieu d'un lien`, 'service');
  }

  let short;
  try {
    short = normalizeUrl(candidate);
  } catch (error) {
    throw fail(`${shortener.name} a renvoyé un lien inexploitable : ${excerpt(candidate)}`, 'service');
  }

  if (shortener.upgradeToHttps && short.startsWith('http://')) {
    short = 'https://' + short.slice('http://'.length);
  }

  if (isSameTarget(short, originalUrl)) {
    throw fail(`${shortener.name} n'a pas raccourci ce lien (déjà court)`, 'unchanged');
  }

  return short;
}

/**
 * Raccourcit une URL auprès d'un service.
 *
 * @param {string} url
 * @param {{
 *   provider?: string|typeof SHORTENERS[number],
 *   fetch?: typeof fetch,
 *   timeoutMs?: number,
 *   signal?: AbortSignal,
 * }} [options]
 * @returns {Promise<string>} lien court
 * @throws {ShortenError}
 */
async function shortenUrl(url, options = {}) {
  const {
    provider = DEFAULT_SHORTENER,
    fetch: fetchImpl = globalThis.fetch,
    timeoutMs = SHORTENER_TIMEOUT_MS,
    signal,
  } = options;

  const shortener = typeof provider === 'string' ? findShortener(provider) : provider;
  if (!shortener) {
    throw new ShortenError(t('Service de raccourcissement inconnu : {provider}', { provider }), 'unknown');
  }
  if (typeof fetchImpl !== 'function') {
    throw new ShortenError(t('Raccourcissement indisponible : fetch absent'), 'unsupported', {
      provider: shortener.id,
    });
  }

  let target;
  try {
    target = normalizeUrl(url);
  } catch (error) {
    throw new ShortenError(t('Lien à raccourcir invalide : {url}', { url }), 'invalid', {
      provider: shortener.id,
      cause: error,
    });
  }

  const { url: endpoint, init } = shortener.build(target);

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, Math.max(0, timeoutMs));

  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timer);
      throw new ShortenError(t('Raccourcissement annulé'), 'aborted', { provider: shortener.id });
    }
    signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    const response = await fetchImpl(endpoint, {
      ...init,
      signal: controller.signal,
      // `omit` : aucun cookie n'est envoyé au service tiers, et la réponse CORS
      // reste lisible même quand le service renvoie `allow-credentials: true`.
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'follow',
    });
    const text = await response.text();
    return parseShortResponse(text, response.status, shortener, target);
  } catch (error) {
    if (error instanceof ShortenError) throw error;
    if (error?.name === 'AbortError') {
      throw timedOut
        ? new ShortenError(t("{name} n'a pas répondu en {seconds} s", { name: shortener.name, seconds: Math.round(timeoutMs / 1000) }), 'timeout', { provider: shortener.id, cause: error })
        : new ShortenError(t('Raccourcissement annulé'), 'aborted', { provider: shortener.id, cause: error });
    }
    throw new ShortenError(
      t('Impossible de joindre {name} : {message}', { name: shortener.name, message: error?.message ?? error }),
      'network',
      { provider: shortener.id, cause: error },
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener?.('abort', onAbort);
  }
}

/**
 * Attend un délai, en s'interrompant si le lot est annulé.
 * @param {number} ms
 * @param {AbortSignal} [signal]
 * @returns {Promise<void>}
 */
function sleep(ms, signal) {
  if (!(ms > 0)) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      signal?.removeEventListener?.('abort', done);
      resolve();
    }
    signal?.addEventListener?.('abort', done, { once: true });
  });
}

/**
 * Crée un raccourcisseur : un service retenu, un cache, un rythme.
 *
 * Le cache évite de recréer un lien déjà obtenu (les services ne facturent pas
 * mais limitent le débit, et un même lien raccourci deux fois donnerait deux
 * adresses différentes pour la même destination).
 *
 * @param {{
 *   provider?: string,
 *   fetch?: typeof fetch,
 *   timeoutMs?: number,
 *   spacingMs?: number,
 *   cache?: Map<string, string>,
 *   maxCache?: number,
 * }} [options]
 * @returns {{
 *   provider: typeof SHORTENERS[number],
 *   spacingMs: number,
 *   shorten: (url: string) => Promise<string>,
 *   shortenMany: (records: Array<{id: string, url: string, shortUrl?: string}>, options?: object) => Promise<{ok: object[], failed: object[], skipped: object[]}>,
 *   clearCache: () => void,
 * }}
 */
function createShortener(options = {}) {
  const shortener = typeof options.provider === 'string'
    ? findShortener(options.provider)
    : options.provider;
  if (!shortener) {
    throw new ShortenError(t('Service de raccourcissement inconnu : {provider}', { provider: options.provider }), 'unknown');
  }

  const fetchImpl = options.fetch ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? SHORTENER_TIMEOUT_MS;
  const spacingMs = options.spacingMs ?? shortener.spacingMs ?? 800;
  const cache = options.cache ?? new Map();
  const maxCache = options.maxCache ?? 500;

  /**
   * @param {string} url
   * @param {{ signal?: AbortSignal, force?: boolean }} [callOptions]
   * @returns {Promise<string>}
   */
  async function shorten(url, callOptions = {}) {
    const target = normalizeUrl(url);
    if (!callOptions.force && cache.has(target)) return cache.get(target);

    const short = await shortenUrl(target, {
      provider: shortener,
      fetch: fetchImpl,
      timeoutMs,
      signal: callOptions.signal,
    });

    if (cache.size >= maxCache) cache.clear();
    cache.set(target, short);
    return short;
  }

  /**
   * Raccourcit une série de liens, dans l'ordre et à débit maîtrisé.
   *
   * Ne lève jamais : un échec isolé n'interrompt pas le lot, il est consigné
   * dans `failed` pour que l'appelant puisse le montrer sans perdre le travail
   * déjà fait.
   *
   * @param {Array<{id: string, url: string, shortUrl?: string}>} records
   * @param {{
   *   onProgress?: (done: number, total: number, record: object) => void,
   *   signal?: AbortSignal,
   *   force?: boolean,
   * }} [batchOptions]
   * @returns {Promise<{ ok: Array<{id: string, url: string, shortUrl: string}>, failed: Array<{id: string, url: string, message: string, code: string}>, skipped: Array<{id: string, url: string, reason: string}> }>}
   */
  async function shortenMany(records, batchOptions = {}) {
    const { onProgress, signal, force = false } = batchOptions;
    const ok = [];
    const failed = [];
    const skipped = [];
    const total = records.length;
    let done = 0;
    let sent = 0;

    for (const record of records) {
      if (signal?.aborted) break;

      // Une URL illisible n'est pas un échec du service : elle est écartée
      // avant tout appel réseau, et comptée à part.
      if (!record || !isValidUrl(record.url)) {
        skipped.push({
          id: record?.id ?? '',
          url: typeof record?.url === 'string' ? record.url : '',
          reason: 'invalid',
        });
        done += 1;
        onProgress?.(done, total, record);
        continue;
      }

      if (!force && typeof record.shortUrl === 'string' && record.shortUrl !== '') {
        skipped.push({ id: record.id, url: record.url, reason: 'already' });
        done += 1;
        onProgress?.(done, total, record);
        continue;
      }

      // Rythme : on n'attend qu'entre deux requêtes réellement émises.
      if (sent > 0) await sleep(spacingMs, signal);
      if (signal?.aborted) break;
      sent += 1;

      try {
        const shortUrl = await shorten(record.url, { signal, force });
        ok.push({ id: record.id, url: record.url, shortUrl });
      } catch (error) {
        failed.push({
          id: record.id,
          url: record.url,
          message: error?.message ?? String(error),
          code: error?.code ?? 'unknown',
        });
      }

      done += 1;
      onProgress?.(done, total, record);
    }

    return { ok, failed, skipped };
  }

  return {
    provider: shortener,
    spacingMs,
    shorten,
    shortenMany,
    clearCache: () => cache.clear(),
  };
}

/**
 * Résume un lot en une phrase lisible pour l'utilisateur.
 * @param {{ ok: object[], failed: object[], skipped: object[] }} report
 * @returns {string}
 */
function describeShortenReport(report) {
  const parts = [];
  const okCount = report.ok?.length ?? 0;
  const failed = report.failed ?? [];
  const skipped = report.skipped?.filter((item) => item.reason === 'already').length ?? 0;

  parts.push(tpl(okCount, '{count} lien raccourci', '{count} liens raccourcis'));
  if (skipped > 0) parts.push(tpl(skipped, '{count} déjà fait', '{count} déjà faits'));
  if (failed.length > 0) parts.push(tpl(failed.length, '{count} échec', '{count} échecs'));

  const first = failed[0];
  return first ? `${parts.join(', ')} — ${first.message}` : parts.join(', ');
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/settings.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Réglages persistants de l'application.
 *
 * Deux préférences seulement, mais deux préférences qu'on ne veut pas rechoisir
 * à chaque ouverture : le service de raccourcissement retenu et ce que le QR Code
 * code doit encoder. Elles sont enregistrées dans `localStorage` — disponible
 * aussi bien dans l'onglet de l'application que dans la page embarquée de
 * l'extension — et **jamais** dans le stockage des liens : un réglage n'est pas
 * une donnée de collection, et une archive exportée n'a pas à l'emporter.
 *
 * Le stockage est injectable pour être testable sans navigateur. Toute lecture
 * ou écriture est protégée : `localStorage` peut lever (navigation privée,
 * contexte cloisonné), et une préférence perdue ne doit pas empêcher l'app de
 * démarrer.
 */






/** Clé de stockage, préfixée pour ne pas entrer en collision avec un autre outil. */
const SETTINGS_KEY = 'url-qr-code-printer/settings';

/** Valeurs par défaut : aucun raccourcissement, le QR Code encode l'URL collectée. */
const DEFAULT_SETTINGS = Object.freeze({
  shortener: DEFAULT_SHORTENER,
  targetMode: 'original',
  collectionName: DEFAULT_COLLECTION_NAME,
  // Vide par défaut : une collection n'a pas toujours quelque chose à dire, et
  // une note inventée serait pire qu'une absence.
  collectionNote: '',
  dateMode: 'none',
  // L'ordre manuel par défaut : une collection qu'on n'a pas réordonnée suit la
  // date, et un tri choisi par le programme serait une décision qu'on n'a pas
  // prise.
  sortMode: 'manual',
  // Le premier numéro, **hérité** : chaque collection porte désormais le sien.
  // Cette valeur est celle de la page web autonome — qui n'a qu'une collection,
  // celle des réglages — et celle dont la reprise seeds la collection par
  // défaut d'une installation existante. Les bornes, elles, appartiennent au
  // module des collections : c'est lui qui les fait respecter.
  startIndex: DEFAULT_START_INDEX,
});

/**
 * Valide un objet de réglages, en retombant sur les valeurs par défaut.
 *
 * Une préférence inconnue ou d'un type inattendu est ignorée plutôt que
 * refusée : un réglage corrompu ne doit pas bloquer l'application.
 *
 * `options.shortener` remplace le service proposé d'emblée quand rien n'a été
 * choisi. Ce n'est pas un détail : T.LY, désormais le défaut, ne répond que
 * depuis une origine d'extension — l'application web autonome doit donc
 * présélectionner un service qui fonctionne depuis une page ordinaire. Le
 * cinquième paramètre reste optionnel, et sans lui le comportement d'avant est
 * conservé à l'identique.
 *
 * @param {unknown} value
 * @param {{ shortener?: string }} [options]
 * @returns {{ shortener: string, targetMode: 'original'|'short',
 *   collectionName: string, collectionNote: string, dateMode: string,
 *   sortMode: string, startIndex: number }}
 */
function sanitizeSettings(value, options = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const defaut = typeof options.shortener === 'string' && findShortener(options.shortener)
    ? options.shortener
    : DEFAULT_SETTINGS.shortener;
  const shortener = typeof source.shortener === 'string' && findShortener(source.shortener)
    ? source.shortener
    : defaut;
  const targetMode = TARGET_MODES.includes(source.targetMode)
    ? source.targetMode
    : DEFAULT_SETTINGS.targetMode;

  // Un nom vide retombe sur le défaut : un export sans titre n'aurait aucun
  // intérêt, et l'utilisateur n'a pas à saisir « Mes liens » pour l'obtenir.
  const rawName = typeof source.collectionName === 'string' ? source.collectionName.trim() : '';
  const collectionName = rawName === ''
    ? DEFAULT_SETTINGS.collectionName
    : rawName.slice(0, COLLECTION_NAME_MAX);

  const dateMode = DATE_MODES.includes(source.dateMode)
    ? source.dateMode
    : DEFAULT_SETTINGS.dateMode;

  // Une note vide est un état normal, contrairement au nom : on ne retombe pas
  // sur un texte par défaut, on garde le vide.
  const rawNote = typeof source.collectionNote === 'string' ? source.collectionNote.trim() : '';
  const collectionNote = rawNote.slice(0, COLLECTION_NOTE_MAX);

  // Un tri inconnu retombe sur l'ordre manuel : mieux vaut une liste dans son
  // ordre naturel qu'un tri que personne n'a demandé.
  const sortMode = isSortMode(source.sortMode) ? source.sortMode : DEFAULT_SETTINGS.sortMode;

  // Le premier numéro est **borné**, pas refusé : une valeur hors bornes est
  // ramenée dans l'intervalle plutôt que de faire retomber toute la collection
  // au numéro 1. Un nombre à virgule est tronqué — on numérote des objets, pas
  // des mesures.
  const brut = Number(source.startIndex);
  const startIndex = Number.isFinite(brut)
    ? Math.min(START_INDEX_MAX, Math.max(START_INDEX_MIN, Math.trunc(brut)))
    : DEFAULT_SETTINGS.startIndex;

  return { shortener, targetMode, collectionName, collectionNote, dateMode, sortMode, startIndex };
}

/**
 * Stockage en mémoire, utilisé quand `localStorage` est indisponible.
 * @returns {{ getItem: (key: string) => string|null, setItem: (key: string, value: string) => void }}
 */
function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, String(value));
    },
  };
}

/**
 * Détecte `localStorage`, ou bascule en mémoire.
 *
 * Le simple fait de *lire* `globalThis.localStorage` peut lever selon le
 * contexte : la détection est donc elle-même protégée.
 *
 * @returns {{ getItem: Function, setItem: Function, persistent: boolean }}
 */
function detectStorage() {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return { ...createMemoryStorage(), persistent: false };
    // Écriture d'essai : certains navigateurs exposent l'objet mais refusent
    // l'écriture (mode privé, quota à zéro).
    const probe = SETTINGS_KEY + '/probe';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return { getItem: (k) => storage.getItem(k), setItem: (k, v) => storage.setItem(k, v), persistent: true };
  } catch {
    return { ...createMemoryStorage(), persistent: false };
  }
}

/**
 * Crée l'accès aux réglages.
 *
 * @param {{ storage?: { getItem: Function, setItem: Function } }} [options]
 * @returns {{
 *   load: () => { shortener: string, targetMode: 'original'|'short' },
 *   save: (patch: object) => { shortener: string, targetMode: 'original'|'short' },
 *   reset: () => object,
 *   persistent: boolean,
 * }}
 */
function createSettingsStore(options = {}) {
  const detected = options.storage ? { ...options.storage, persistent: true } : detectStorage();
  const storage = detected;
  // Le service proposé d'emblée, quand l'appelant en connaît un meilleur que le
  // défaut du catalogue : c'est ainsi que l'application web autonome évite de
  // présélectionner T.LY, qui ne répond pas depuis une origine ordinaire.
  const defaults = options.defaultShortener
    ? sanitizeSettings(null, { shortener: options.defaultShortener })
    : { ...DEFAULT_SETTINGS };

  /** @type {{ shortener: string, targetMode: 'original'|'short', collectionName: string, dateMode: string }} */
  let current = { ...defaults };
  let loaded = false;

  function load() {
    if (loaded) return { ...current };
    loaded = true;
    try {
      const raw = storage.getItem(SETTINGS_KEY);
      if (typeof raw === 'string' && raw !== '') {
        current = sanitizeSettings(JSON.parse(raw), { shortener: defaults.shortener });
      }
    } catch {
      // Réglage illisible : on garde les valeurs par défaut.
      current = { ...defaults };
    }
    return { ...current };
  }

  function save(patch) {
    current = sanitizeSettings({ ...load(), ...patch }, { shortener: defaults.shortener });
    try {
      storage.setItem(SETTINGS_KEY, JSON.stringify(current));
    } catch {
      // Quota, mode privé : le réglage vaut pour la session en cours.
    }
    return { ...current };
  }

  function reset() {
    current = { ...defaults };
    try {
      storage.setItem(SETTINGS_KEY, JSON.stringify(current));
    } catch {
      // Sans effet si l'écriture est impossible.
    }
    return { ...current };
  }

  return { load, save, reset, persistent: Boolean(storage.persistent) };
}

// ────────────────────────────────────────────────────────────────────────
// node_modules/uqr/dist/index.mjs
// ────────────────────────────────────────────────────────────────────────

var QrCodeDataType = /* @__PURE__ */ ((QrCodeDataType2) => {
  QrCodeDataType2[QrCodeDataType2["Border"] = -1] = "Border";
  QrCodeDataType2[QrCodeDataType2["Data"] = 0] = "Data";
  QrCodeDataType2[QrCodeDataType2["Function"] = 1] = "Function";
  QrCodeDataType2[QrCodeDataType2["Position"] = 2] = "Position";
  QrCodeDataType2[QrCodeDataType2["Timing"] = 3] = "Timing";
  QrCodeDataType2[QrCodeDataType2["Alignment"] = 4] = "Alignment";
  return QrCodeDataType2;
})(QrCodeDataType || {});

const LOW = [0, 1];
const MEDIUM = [1, 0];
const QUARTILE = [2, 3];
const HIGH = [3, 2];
const EccMap = {
  L: LOW,
  M: MEDIUM,
  Q: QUARTILE,
  H: HIGH
};
const NUMERIC_REGEX = /^\d*$/;
const ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+./:-]*$/;
const ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
const MIN_VERSION = 1;
const MAX_VERSION = 40;
const PENALTY_N1 = 3;
const PENALTY_N2 = 3;
const PENALTY_N3 = 40;
const PENALTY_N4 = 10;
const ECC_CODEWORDS_PER_BLOCK = [
  // Version: (note that index 0 is for padding, and is set to an illegal value)
  // 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40    Error correction level
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  // Low
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  // Medium
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  // Quartile
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  // High
];
const NUM_ERROR_CORRECTION_BLOCKS = [
  // Version: (note that index 0 is for padding, and is set to an illegal value)
  // 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40    Error correction level
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  // Low
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  // Medium
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  // Quartile
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  // High
];
class QrCode {
  /* -- Constructor (low level) and fields -- */
  // Creates a new QR Code with the given version number,
  // error correction level, data codeword bytes, and mask number.
  // This is a low-level API that most users should not use directly.
  // A mid-level API is the encodeSegments() function.
  constructor(version, ecc, dataCodewords, msk) {
    this.version = version;
    this.ecc = ecc;
    if (version < MIN_VERSION || version > MAX_VERSION)
      throw new RangeError("Version value out of range");
    if (msk < -1 || msk > 7)
      throw new RangeError("Mask value out of range");
    this.size = version * 4 + 17;
    const row = Array.from({ length: this.size }).fill(false);
    for (let i = 0; i < this.size; i++) {
      this.modules.push(row.slice());
      this.types.push(row.map(() => 0));
    }
    this.drawFunctionPatterns();
    const allCodewords = this.addEccAndInterleave(dataCodewords);
    this.drawCodewords(allCodewords);
    if (msk === -1) {
      let minPenalty = 1e9;
      for (let i = 0; i < 8; i++) {
        this.applyMask(i);
        this.drawFormatBits(i);
        const penalty = this.getPenaltyScore();
        if (penalty < minPenalty) {
          msk = i;
          minPenalty = penalty;
        }
        this.applyMask(i);
      }
    }
    this.mask = msk;
    this.applyMask(msk);
    this.drawFormatBits(msk);
  }
  /* -- Fields -- */
  // The width and height of this QR Code, measured in modules, between
  // 21 and 177 (inclusive). This is equal to version * 4 + 17.
  size;
  // The index of the mask pattern used in this QR Code, which is between 0 and 7 (inclusive).
  // Even if a QR Code is created with automatic masking requested (mask = -1),
  // the resulting object still has a mask value between 0 and 7.
  mask;
  // The modules of this QR Code (false = light, true = dark).
  // Immutable after constructor finishes. Accessed through getModule().
  modules = [];
  types = [];
  /* -- Accessor methods -- */
  // Returns the color of the module (pixel) at the given coordinates, which is false
  // for light or true for dark. The top left corner has the coordinates (x=0, y=0).
  // If the given coordinates are out of bounds, then false (light) is returned.
  getModule(x, y) {
    return x >= 0 && x < this.size && y >= 0 && y < this.size && this.modules[y][x];
  }
  /* -- Private helper methods for constructor: Drawing function modules -- */
  // Reads this object's version field, and draws and marks all function modules.
  drawFunctionPatterns() {
    for (let i = 0; i < this.size; i++) {
      this.setFunctionModule(6, i, i % 2 === 0, QrCodeDataType.Timing);
      this.setFunctionModule(i, 6, i % 2 === 0, QrCodeDataType.Timing);
    }
    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(this.size - 4, 3);
    this.drawFinderPattern(3, this.size - 4);
    const alignPatPos = this.getAlignmentPatternPositions();
    const numAlign = alignPatPos.length;
    for (let i = 0; i < numAlign; i++) {
      for (let j = 0; j < numAlign; j++) {
        if (!(i === 0 && j === 0 || i === 0 && j === numAlign - 1 || i === numAlign - 1 && j === 0))
          this.drawAlignmentPattern(alignPatPos[i], alignPatPos[j]);
      }
    }
    this.drawFormatBits(0);
    this.drawVersion();
  }
  // Draws two copies of the format bits (with its own error correction code)
  // based on the given mask and this object's error correction level field.
  drawFormatBits(mask) {
    const data = this.ecc[1] << 3 | mask;
    let rem = data;
    for (let i = 0; i < 10; i++)
      rem = rem << 1 ^ (rem >>> 9) * 1335;
    const bits = (data << 10 | rem) ^ 21522;
    for (let i = 0; i <= 5; i++)
      this.setFunctionModule(8, i, getBit(bits, i));
    this.setFunctionModule(8, 7, getBit(bits, 6));
    this.setFunctionModule(8, 8, getBit(bits, 7));
    this.setFunctionModule(7, 8, getBit(bits, 8));
    for (let i = 9; i < 15; i++)
      this.setFunctionModule(14 - i, 8, getBit(bits, i));
    for (let i = 0; i < 8; i++)
      this.setFunctionModule(this.size - 1 - i, 8, getBit(bits, i));
    for (let i = 8; i < 15; i++)
      this.setFunctionModule(8, this.size - 15 + i, getBit(bits, i));
    this.setFunctionModule(8, this.size - 8, true);
  }
  // Draws two copies of the version bits (with its own error correction code),
  // based on this object's version field, iff 7 <= version <= 40.
  drawVersion() {
    if (this.version < 7)
      return;
    let rem = this.version;
    for (let i = 0; i < 12; i++)
      rem = rem << 1 ^ (rem >>> 11) * 7973;
    const bits = this.version << 12 | rem;
    for (let i = 0; i < 18; i++) {
      const color = getBit(bits, i);
      const a = this.size - 11 + i % 3;
      const b = Math.floor(i / 3);
      this.setFunctionModule(a, b, color);
      this.setFunctionModule(b, a, color);
    }
  }
  // Draws a 9*9 finder pattern including the border separator,
  // with the center module at (x, y). Modules can be out of bounds.
  drawFinderPattern(x, y) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size)
          this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4, QrCodeDataType.Position);
      }
    }
  }
  // Draws a 5*5 alignment pattern, with the center module
  // at (x, y). All modules must be in bounds.
  drawAlignmentPattern(x, y) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        this.setFunctionModule(
          x + dx,
          y + dy,
          Math.max(Math.abs(dx), Math.abs(dy)) !== 1,
          QrCodeDataType.Alignment
        );
      }
    }
  }
  // Sets the color of a module and marks it as a function module.
  // Only used by the constructor. Coordinates must be in bounds.
  setFunctionModule(x, y, isDark, type = QrCodeDataType.Function) {
    this.modules[y][x] = isDark;
    this.types[y][x] = type;
  }
  /* -- Private helper methods for constructor: Codewords and masking -- */
  // Returns a new byte string representing the given data with the appropriate error correction
  // codewords appended to it, based on this object's version and error correction level.
  addEccAndInterleave(data) {
    const ver = this.version;
    const ecl = this.ecc;
    if (data.length !== getNumDataCodewords(ver, ecl))
      throw new RangeError("Invalid argument");
    const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl[0]][ver];
    const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl[0]][ver];
    const rawCodewords = Math.floor(getNumRawDataModules(ver) / 8);
    const numShortBlocks = numBlocks - rawCodewords % numBlocks;
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);
    const blocks = [];
    const rsDiv = reedSolomonComputeDivisor(blockEccLen);
    for (let i = 0, k = 0; i < numBlocks; i++) {
      const dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
      k += dat.length;
      const ecc = reedSolomonComputeRemainder(dat, rsDiv);
      if (i < numShortBlocks)
        dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    const result = [];
    for (let i = 0; i < blocks[0].length; i++) {
      blocks.forEach((block, j) => {
        if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks)
          result.push(block[i]);
      });
    }
    return result;
  }
  // Draws the given sequence of 8-bit codewords (data and error correction) onto the entire
  // data area of this QR Code. Function modules need to be marked off before this is called.
  drawCodewords(data) {
    if (data.length !== Math.floor(getNumRawDataModules(this.version) / 8))
      throw new RangeError("Invalid argument");
    let i = 0;
    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6)
        right = 5;
      for (let vert = 0; vert < this.size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = (right + 1 & 2) === 0;
          const y = upward ? this.size - 1 - vert : vert;
          if (!this.types[y][x] && i < data.length * 8) {
            this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  }
  // XORs the codeword modules in this QR Code with the given mask pattern.
  // The function modules must be marked and the codeword bits must be drawn
  // before masking. Due to the arithmetic of XOR, calling applyMask() with
  // the same mask value a second time will undo the mask. A final well-formed
  // QR Code needs exactly one (not zero, two, etc.) mask applied.
  applyMask(mask) {
    if (mask < 0 || mask > 7)
      throw new RangeError("Mask value out of range");
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        let invert;
        switch (mask) {
          case 0:
            invert = (x + y) % 2 === 0;
            break;
          case 1:
            invert = y % 2 === 0;
            break;
          case 2:
            invert = x % 3 === 0;
            break;
          case 3:
            invert = (x + y) % 3 === 0;
            break;
          case 4:
            invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
            break;
          case 5:
            invert = x * y % 2 + x * y % 3 === 0;
            break;
          case 6:
            invert = (x * y % 2 + x * y % 3) % 2 === 0;
            break;
          case 7:
            invert = ((x + y) % 2 + x * y % 3) % 2 === 0;
            break;
          default:
            throw new Error("Unreachable");
        }
        if (!this.types[y][x] && invert)
          this.modules[y][x] = !this.modules[y][x];
      }
    }
  }
  // Calculates and returns the penalty score based on state of this QR Code's current modules.
  // This is used by the automatic mask choice algorithm to find the mask pattern that yields the lowest score.
  getPenaltyScore() {
    let result = 0;
    for (let y = 0; y < this.size; y++) {
      let runColor = false;
      let runX = 0;
      const runHistory = [0, 0, 0, 0, 0, 0, 0];
      for (let x = 0; x < this.size; x++) {
        if (this.modules[y][x] === runColor) {
          runX++;
          if (runX === 5)
            result += PENALTY_N1;
          else if (runX > 5)
            result++;
        } else {
          this.finderPenaltyAddHistory(runX, runHistory);
          if (!runColor)
            result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
          runColor = this.modules[y][x];
          runX = 1;
        }
      }
      result += this.finderPenaltyTerminateAndCount(runColor, runX, runHistory) * PENALTY_N3;
    }
    for (let x = 0; x < this.size; x++) {
      let runColor = false;
      let runY = 0;
      const runHistory = [0, 0, 0, 0, 0, 0, 0];
      for (let y = 0; y < this.size; y++) {
        if (this.modules[y][x] === runColor) {
          runY++;
          if (runY === 5)
            result += PENALTY_N1;
          else if (runY > 5)
            result++;
        } else {
          this.finderPenaltyAddHistory(runY, runHistory);
          if (!runColor)
            result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
          runColor = this.modules[y][x];
          runY = 1;
        }
      }
      result += this.finderPenaltyTerminateAndCount(runColor, runY, runHistory) * PENALTY_N3;
    }
    for (let y = 0; y < this.size - 1; y++) {
      for (let x = 0; x < this.size - 1; x++) {
        const color = this.modules[y][x];
        if (color === this.modules[y][x + 1] && color === this.modules[y + 1][x] && color === this.modules[y + 1][x + 1]) {
          result += PENALTY_N2;
        }
      }
    }
    let dark = 0;
    for (const row of this.modules)
      dark = row.reduce((sum, color) => sum + (color ? 1 : 0), dark);
    const total = this.size * this.size;
    const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    result += k * PENALTY_N4;
    return result;
  }
  /* -- Private helper functions -- */
  // Returns an ascending list of positions of alignment patterns for this version number.
  // Each position is in the range [0,177), and are used on both the x and y axes.
  // This could be implemented as lookup table of 40 variable-length lists of integers.
  getAlignmentPatternPositions() {
    if (this.version === 1) {
      return [];
    } else {
      const numAlign = Math.floor(this.version / 7) + 2;
      const step = this.version === 32 ? 26 : Math.ceil((this.version * 4 + 4) / (numAlign * 2 - 2)) * 2;
      const result = [6];
      for (let pos = this.size - 7; result.length < numAlign; pos -= step)
        result.splice(1, 0, pos);
      return result;
    }
  }
  // Can only be called immediately after a light run is added, and
  // returns either 0, 1, or 2. A helper function for getPenaltyScore().
  finderPenaltyCountPatterns(runHistory) {
    const n = runHistory[1];
    const core = n > 0 && runHistory[2] === n && runHistory[3] === n * 3 && runHistory[4] === n && runHistory[5] === n;
    return (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0) + (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0);
  }
  // Must be called at the end of a line (row or column) of modules. A helper function for getPenaltyScore().
  finderPenaltyTerminateAndCount(currentRunColor, currentRunLength, runHistory) {
    if (currentRunColor) {
      this.finderPenaltyAddHistory(currentRunLength, runHistory);
      currentRunLength = 0;
    }
    currentRunLength += this.size;
    this.finderPenaltyAddHistory(currentRunLength, runHistory);
    return this.finderPenaltyCountPatterns(runHistory);
  }
  // Pushes the given value to the front and drops the last value. A helper function for getPenaltyScore().
  finderPenaltyAddHistory(currentRunLength, runHistory) {
    if (runHistory[0] === 0)
      currentRunLength += this.size;
    runHistory.pop();
    runHistory.unshift(currentRunLength);
  }
}
function appendBits(val, len, bb) {
  if (len < 0 || len > 31 || val >>> len !== 0)
    throw new RangeError("Value out of range");
  for (let i = len - 1; i >= 0; i--)
    bb.push(val >>> i & 1);
}
function getBit(x, i) {
  return (x >>> i & 1) !== 0;
}
class QrSegment {
  // Creates a new QR Code segment with the given attributes and data.
  // The character count (numChars) must agree with the mode and the bit buffer length,
  // but the constraint isn't checked. The given bit buffer is cloned and stored.
  constructor(mode, numChars, bitData) {
    this.mode = mode;
    this.numChars = numChars;
    this.bitData = bitData;
    if (numChars < 0)
      throw new RangeError("Invalid argument");
    this.bitData = bitData.slice();
  }
  /* -- Methods -- */
  // Returns a new copy of the data bits of this segment.
  getData() {
    return this.bitData.slice();
  }
}
const MODE_NUMERIC = [1, 10, 12, 14];
const MODE_ALPHANUMERIC = [2, 9, 11, 13];
const MODE_BYTE = [4, 8, 16, 16];
function numCharCountBits(mode, ver) {
  return mode[Math.floor((ver + 7) / 17) + 1];
}
function makeBytes(data) {
  const bb = [];
  for (const b of data)
    appendBits(b, 8, bb);
  return new QrSegment(MODE_BYTE, data.length, bb);
}
function makeNumeric(digits) {
  if (!isNumeric(digits))
    throw new RangeError("String contains non-numeric characters");
  const bb = [];
  for (let i = 0; i < digits.length; ) {
    const n = Math.min(digits.length - i, 3);
    appendBits(Number.parseInt(digits.substring(i, i + n), 10), n * 3 + 1, bb);
    i += n;
  }
  return new QrSegment(MODE_NUMERIC, digits.length, bb);
}
function makeAlphanumeric(text) {
  if (!isAlphanumeric(text))
    throw new RangeError("String contains unencodable characters in alphanumeric mode");
  const bb = [];
  let i;
  for (i = 0; i + 2 <= text.length; i += 2) {
    let temp = ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)) * 45;
    temp += ALPHANUMERIC_CHARSET.indexOf(text.charAt(i + 1));
    appendBits(temp, 11, bb);
  }
  if (i < text.length)
    appendBits(ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)), 6, bb);
  return new QrSegment(MODE_ALPHANUMERIC, text.length, bb);
}
function makeSegments(text) {
  if (text === "")
    return [];
  else if (isNumeric(text))
    return [makeNumeric(text)];
  else if (isAlphanumeric(text))
    return [makeAlphanumeric(text)];
  else
    return [makeBytes(toUtf8ByteArray(text))];
}
function isNumeric(text) {
  return NUMERIC_REGEX.test(text);
}
function isAlphanumeric(text) {
  return ALPHANUMERIC_REGEX.test(text);
}
function getTotalBits(segs, version) {
  let result = 0;
  for (const seg of segs) {
    const ccbits = numCharCountBits(seg.mode, version);
    if (seg.numChars >= 1 << ccbits)
      return Number.POSITIVE_INFINITY;
    result += 4 + ccbits + seg.bitData.length;
  }
  return result;
}
function toUtf8ByteArray(str) {
  str = encodeURI(str);
  const result = [];
  for (let i = 0; i < str.length; i++) {
    if (str.charAt(i) !== "%") {
      result.push(str.charCodeAt(i));
    } else {
      result.push(Number.parseInt(str.substring(i + 1, i + 3), 16));
      i += 2;
    }
  }
  return result;
}
function getNumRawDataModules(ver) {
  if (ver < MIN_VERSION || ver > MAX_VERSION)
    throw new RangeError("Version number out of range");
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (ver >= 7)
      result -= 36;
  }
  return result;
}
function getNumDataCodewords(ver, ecl) {
  return Math.floor(getNumRawDataModules(ver) / 8) - ECC_CODEWORDS_PER_BLOCK[ecl[0]][ver] * NUM_ERROR_CORRECTION_BLOCKS[ecl[0]][ver];
}
function reedSolomonComputeDivisor(degree) {
  if (degree < 1 || degree > 255)
    throw new RangeError("Degree out of range");
  const result = [];
  for (let i = 0; i < degree - 1; i++)
    result.push(0);
  result.push(1);
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = reedSolomonMultiply(result[j], root);
      if (j + 1 < result.length)
        result[j] ^= result[j + 1];
    }
    root = reedSolomonMultiply(root, 2);
  }
  return result;
}
function reedSolomonComputeRemainder(data, divisor) {
  const result = divisor.map((_) => 0);
  for (const b of data) {
    const factor = b ^ result.shift();
    result.push(0);
    divisor.forEach((coef, i) => result[i] ^= reedSolomonMultiply(coef, factor));
  }
  return result;
}
function reedSolomonMultiply(x, y) {
  if (x >>> 8 !== 0 || y >>> 8 !== 0)
    throw new RangeError("Byte out of range");
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = z << 1 ^ (z >>> 7) * 285;
    z ^= (y >>> i & 1) * x;
  }
  return z;
}
function encodeSegments(segs, ecl, minVersion = 1, maxVersion = 40, mask = -1, boostEcl = true) {
  if (!(MIN_VERSION <= minVersion && minVersion <= maxVersion && maxVersion <= MAX_VERSION) || mask < -1 || mask > 7) {
    throw new RangeError("Invalid value");
  }
  let version;
  let dataUsedBits;
  for (version = minVersion; ; version++) {
    const dataCapacityBits2 = getNumDataCodewords(version, ecl) * 8;
    const usedBits = getTotalBits(segs, version);
    if (usedBits <= dataCapacityBits2) {
      dataUsedBits = usedBits;
      break;
    }
    if (version >= maxVersion)
      throw new RangeError("Data too long");
  }
  for (const newEcl of [MEDIUM, QUARTILE, HIGH]) {
    if (boostEcl && dataUsedBits <= getNumDataCodewords(version, newEcl) * 8)
      ecl = newEcl;
  }
  const bb = [];
  for (const seg of segs) {
    appendBits(seg.mode[0], 4, bb);
    appendBits(seg.numChars, numCharCountBits(seg.mode, version), bb);
    for (const b of seg.getData())
      bb.push(b);
  }
  const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
  appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
  appendBits(0, (8 - bb.length % 8) % 8, bb);
  for (let padByte = 236; bb.length < dataCapacityBits; padByte ^= 236 ^ 17)
    appendBits(padByte, 8, bb);
  const dataCodewords = Array.from({ length: Math.ceil(bb.length / 8) }, () => 0);
  bb.forEach((b, i) => dataCodewords[i >>> 3] |= b << 7 - (i & 7));
  return new QrCode(version, ecl, dataCodewords, mask);
}

function encode(data, options) {
  const {
    ecc = "L",
    boostEcc = false,
    minVersion = 1,
    maxVersion = 40,
    maskPattern = -1,
    border = 1
  } = options || {};
  const segment = typeof data === "string" ? makeSegments(data) : Array.isArray(data) ? [makeBytes(data)] : void 0;
  if (!segment)
    throw new Error(`uqr only supports encoding string and binary data, but got: ${typeof data}`);
  const qr = encodeSegments(
    segment,
    EccMap[ecc],
    minVersion,
    maxVersion,
    maskPattern,
    boostEcc
  );
  const result = addBorder({
    version: qr.version,
    maskPattern: qr.mask,
    size: qr.size,
    data: qr.modules,
    types: qr.types
  }, border);
  if (options?.invert)
    result.data = result.data.map((row) => row.map((mod) => !mod));
  options?.onEncoded?.(result);
  return result;
}
function addBorder(input, border = 1) {
  if (!border)
    return input;
  const { size } = input;
  const newSize = size + border * 2;
  input.size = newSize;
  input.data.forEach((row) => {
    for (let i = 0; i < border; i++) {
      row.unshift(false);
      row.push(false);
    }
  });
  for (let i = 0; i < border; i++) {
    input.data.unshift(Array.from({ length: newSize }, (_) => false));
    input.data.push(Array.from({ length: newSize }, (_) => false));
  }
  const b = QrCodeDataType.Border;
  input.types.forEach((row) => {
    for (let i = 0; i < border; i++) {
      row.unshift(b);
      row.push(b);
    }
  });
  for (let i = 0; i < border; i++) {
    input.types.unshift(Array.from({ length: newSize }, (_) => b));
    input.types.push(Array.from({ length: newSize }, (_) => b));
  }
  return input;
}
function getDataAt(data, x, y, defaults = false) {
  if (x < 0 || y < 0 || x >= data.length || y >= data.length)
    return defaults;
  return data[y][x];
}

function renderUnicode(data, options = {}) {
  const {
    whiteChar = "\u2588",
    blackChar = "\u2591"
  } = options;
  const result = encode(data, options);
  return result.data.map((row) => {
    return row.map((mod) => mod ? blackChar : whiteChar).join("");
  }).join("\n");
}
function renderANSI(data, options = {}) {
  return renderUnicode(data, {
    ...options,
    blackChar: "\x1B[40m\u3000\x1B[0m",
    whiteChar: "\x1B[47m\u3000\x1B[0m"
  });
}
function renderUnicodeCompact(data, options = {}) {
  const palette = {
    WHITE_ALL: "\u2588",
    WHITE_BLACK: "\u2580",
    BLACK_WHITE: "\u2584",
    BLACK_ALL: " "
  };
  const result = encode(data, options);
  const WHITE = false;
  const BLACK = true;
  const at = (x, y) => getDataAt(result.data, x, y, true);
  const lines = [];
  let line = "";
  for (let row = 0; row < result.size; row += 2) {
    for (let col = 0; col < result.size; col++) {
      if (at(col, row) === WHITE && at(col, row + 1) === WHITE)
        line += palette.WHITE_ALL;
      else if (at(col, row) === WHITE && at(col, row + 1) === BLACK)
        line += palette.WHITE_BLACK;
      else if (at(col, row) === BLACK && at(col, row + 1) === WHITE)
        line += palette.BLACK_WHITE;
      else
        line += palette.BLACK_ALL;
    }
    lines.push(line);
    line = "";
  }
  return lines.join("\n");
}

function escapeAttr(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function renderSVG(data, options = {}) {
  const result = encode(data, options);
  const {
    pixelSize = 10,
    whiteColor = "white",
    blackColor = "black"
  } = options;
  const height = result.size * pixelSize;
  const width = result.size * pixelSize;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`;
  const paths = [];
  for (let row = 0; row < result.size; row++) {
    for (let col = 0; col < result.size; col++) {
      const x = col * pixelSize;
      const y = row * pixelSize;
      if (result.data[row][col])
        paths.push(`M${x},${y}h${pixelSize}v${pixelSize}h-${pixelSize}z`);
    }
  }
  svg += `<rect fill="${escapeAttr(whiteColor)}" width="${width}" height="${height}"/>`;
  svg += `<path fill="${escapeAttr(blackColor)}" d="${paths.join("")}"/>`;
  svg += "</svg>";
  return svg;
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/png.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Encodage PNG minimal, sans dépendance.
 *
 * Un PNG est une suite de blocs : signature, `IHDR` (dimensions et format),
 * `IDAT` (les pixels, compressés en zlib), `IEND`. Chaque bloc porte son CRC32.
 *
 * On n'encode qu'un seul format — RVBA 8 bits, non entrelacé — ce qui suffit
 * pour des QR Codes et des icônes, et évite d'embarquer une bibliothèque
 * graphique. Le même encodeur sert aux icônes de l'extension et aux images
 * intégrées dans l'export tableur.
 *
 * La compression passe par `CompressionStream('deflate')`, qui produit
 * exactement le flux zlib attendu par `IDAT` et existe aussi bien dans les
 * navigateurs que dans Node. `node:zlib` n'est donc pas nécessaire : il
 * n'existe pas dans une page web.
 */

/** Table de contrôle CRC32, calculée une fois. */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

/**
 * Calcule le CRC32 d'un tampon, tel qu'attendu par les blocs PNG.
 * @param {Uint8Array} bytes
 * @returns {number}
 */
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Compresse un tampon en flux zlib.
 *
 * `CompressionStream('deflate')` produit un flux zlib — en-tête et somme de
 * contrôle Adler-32 comprises — soit exactement ce qu'attend le bloc `IDAT`.
 * Le mode `'deflate-raw'` ne conviendrait pas.
 *
 * @param {Uint8Array} bytes
 * @returns {Promise<Uint8Array>}
 */
async function deflate(bytes) {
  if (typeof CompressionStream !== 'function') {
    throw new Error(
      'CompressionStream est indisponible : impossible de produire un PNG. ' +
      'Cet environnement est trop ancien.',
    );
  }

  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * Assemble un bloc PNG : longueur, type, données, CRC.
 * @param {string} type
 * @param {Uint8Array} body
 * @returns {Uint8Array}
 */
function chunk(type, body) {
  const out = new Uint8Array(12 + body.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, body.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(body, 8);
  view.setUint32(8 + body.length, crc32(out.subarray(4, 8 + body.length)));
  return out;
}

/**
 * Encode une image RVBA en PNG.
 *
 * @param {{ width: number, height: number, data: Uint8Array }} image
 *   `data` contient 4 octets par pixel, ligne par ligne.
 * @returns {Promise<Uint8Array>}
 * @throws {RangeError} si les dimensions sont absurdes ou les données incohérentes.
 */
async function encodePng(image) {
  const { width, height } = image;
  const data = image.data;

  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new RangeError(`dimensions invalides : ${width} × ${height}`);
  }
  if (data.length !== width * height * 4) {
    throw new RangeError(
      `données incohérentes : ${data.length} octets pour ${width} × ${height} pixels RVBA`,
    );
  }

  const signature = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, width);
  ihdrView.setUint32(4, height);
  ihdr[8] = 8; // 8 bits par composante
  ihdr[9] = 6; // type de couleur : RVBA
  ihdr[10] = 0; // compression : deflate
  ihdr[11] = 0; // filtrage : standard
  ihdr[12] = 0; // entrelacement : aucun

  // Chaque ligne est précédée d'un octet de filtre, ici « aucun ».
  const stride = width * 4;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    raw.set(data.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }

  const idat = await deflate(raw);
  const parts = [signature, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', new Uint8Array(0))];

  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const png = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    png.set(part, offset);
    offset += part.length;
  }
  return png;
}

/**
 * Construit un tampon RVBA à partir d'une matrice monochrome.
 *
 * @param {boolean[][]} pixels `pixels[y][x] === true` pour un pixel noir.
 * @param {{ dark?: [number, number, number], light?: [number, number, number] }} [options]
 * @returns {{ width: number, height: number, data: Uint8Array }}
 */
function rgbaFromMatrix(pixels, options = {}) {
  const height = pixels.length;
  const width = height > 0 ? pixels[0].length : 0;
  const dark = options.dark ?? [0, 0, 0];
  const light = options.light ?? [255, 255, 255];

  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = pixels[y][x] ? dark : light;
      const offset = (y * width + x) * 4;
      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 0xff;
    }
  }
  return { width, height, data };
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/qr.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Encodage QR Code.
 *
 * On s'appuie sur `uqr` (ESM pur, sans dépendance) qui renvoie une matrice
 * booléenne. C'est exactement la représentation dont a besoin le pipeline
 * d'impression thermique : on évite ainsi tout aller-retour par une image
 * bitmap intermédiaire, qui dégraderait la netteté du QR Code à l'impression.
 */





/** Niveaux de correction d'erreur acceptés par `uqr`. */
const ECC_LEVELS = ['L', 'M', 'Q', 'H'];

/**
 * @typedef {Object} QrMatrix
 * @property {boolean[][]} data   `data[y][x] === true` pour un module noir.
 * @property {number}      size   Nombre de modules par côté, bordure comprise.
 * @property {number}      version Version QR Code (1-40).
 * @property {number}      border Taille de la bordure (en modules).
 */

/**
 * Encode une chaîne en matrice QR Code.
 *
 * @param {string} text
 * @param {{ ecc?: 'L'|'M'|'Q'|'H', border?: number, minVersion?: number }} [options]
 * @returns {QrMatrix}
 */
function encodeQr(text, options = {}) {
  if (typeof text !== 'string' || text === '') {
    throw new TypeError('encodeQr exige une chaîne non vide');
  }
  const ecc = ECC_LEVELS.includes(options.ecc) ? options.ecc : 'M';
  const border = Number.isInteger(options.border) ? options.border : 2;

  const result = encode(text, {
    ecc,
    border,
    minVersion: options.minVersion ?? 1,
  });

  return {
    data: result.data,
    size: result.size,
    version: result.version,
    border,
  };
}

/**
 * Nombre de pixels par module nécessaire pour qu'un QR Code reste lisible à une
 * densité d'impression donnée. En dessous de 3 px/module, la tête thermique
 * (203 dpi) fusionne les modules et le code devient illisible.
 *
 * @param {number} targetPx Largeur disponible en pixels.
 * @param {number} moduleCount Nombre de modules du QR Code, bordure comprise.
 * @returns {number} Échelle entière >= 1.
 */
function pickScale(targetPx, moduleCount) {
  if (!Number.isFinite(targetPx) || !Number.isFinite(moduleCount) || moduleCount <= 0) return 1;
  return Math.max(1, Math.floor(targetPx / moduleCount));
}

/**
 * Rend la matrice dans un contexte 2D de canvas, à l'échelle demandée.
 *
 * L'arrondi de `size * scale` est important : sans lui, les modules ne tombent
 * pas sur des pixels entiers et le QR Code est flou.
 *
 * @param {QrMatrix} matrix
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x?: number, y?: number, scale?: number, dark?: string, light?: string|null }} [options]
 * @returns {{ width: number, height: number }}
 */
function drawQr(matrix, ctx, options = {}) {
  const scale = Math.max(1, Math.floor(options.scale ?? 1));
  const x0 = options.x ?? 0;
  const y0 = options.y ?? 0;
  const dark = options.dark ?? '#000000';
  const light = options.light ?? null;
  const side = matrix.size * scale;

  if (light) {
    ctx.fillStyle = light;
    ctx.fillRect(x0, y0, side, side);
  }

  ctx.fillStyle = dark;
  for (let y = 0; y < matrix.size; y++) {
    const row = matrix.data[y];
    let runStart = -1;
    // On fusionne les modules noirs contigus en un seul rectangle : beaucoup
    // moins d'appels de dessin, donc un rendu nettement plus rapide sur les
    // planches de plusieurs dizaines d'étiquettes.
    for (let x = 0; x <= matrix.size; x++) {
      const isDark = x < matrix.size && row[x];
      if (isDark && runStart === -1) {
        runStart = x;
      } else if (!isDark && runStart !== -1) {
        ctx.fillRect(x0 + runStart * scale, y0 + y * scale, (x - runStart) * scale, scale);
        runStart = -1;
      }
    }
  }

  return { width: side, height: side };
}

/**
 * Rend la matrice en chaîne SVG (aperçu vectoriel, impression papier).
 *
 * @param {QrMatrix} matrix
 * @param {{ scale?: number, dark?: string, light?: string, margin?: number }} [options]
 * @returns {string}
 */
function toSvg(matrix, options = {}) {
  const scale = Math.max(1, Math.floor(options.scale ?? 1));
  const dark = options.dark ?? '#000000';
  const light = options.light ?? '#ffffff';
  const margin = options.margin ?? 0;
  const side = matrix.size * scale + margin * 2;

  const parts = [];
  for (let y = 0; y < matrix.size; y++) {
    const row = matrix.data[y];
    for (let x = 0; x < matrix.size; x++) {
      if (!row[x]) continue;
      parts.push(
        `M${margin + x * scale} ${margin + y * scale}h${scale}v${scale}h-${scale}z`,
      );
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}" ` +
    `viewBox="0 0 ${side} ${side}" shape-rendering="crispEdges">` +
    `<rect width="${side}" height="${side}" fill="${light}"/>` +
    `<path d="${parts.join('')}" fill="${dark}"/>` +
    '</svg>'
  );
}

/**
 * Encode une matrice QR Code en flux noir & blanc 1 bit par pixel.
 *
 * C'est le format d'image natif des têtes thermiques : un bit à 1 = point
 * chauffé = pixel noir. Les lignes sont rembourrées à l'octet.
 *
 * @param {QrMatrix} matrix
 * @param {number} scale Pixels par module.
 * @param {{ quietZone?: boolean }} [options] Si false, la bordure déjà incluse
 *   dans la matrice est conservée telle quelle (cas de l'impression d'étiquette
 *   où l'on maîtrise la marge par ailleurs).
 * @returns {{ width: number, height: number, bytesPerRow: number, rows: Uint8Array[] }}
 */
function toMonoBitmap(matrix, scale, options = {}) {
  const s = Math.max(1, Math.floor(scale));
  const size = matrix.size;
  const width = size * s;
  const height = size * s;
  const bytesPerRow = Math.ceil(width / 8);
  const rows = [];

  for (let y = 0; y < height; y++) {
    const row = new Uint8Array(bytesPerRow);
    const srcRow = matrix.data[Math.floor(y / s)];
    for (let x = 0; x < width; x++) {
      if (!srcRow[Math.floor(x / s)]) continue;
      row[x >> 3] |= 0x80 >> (x & 7);
    }
    rows.push(row);
  }

  return { width, height, bytesPerRow, rows };
}

/**
 * Rend un QR Code en image PNG.
 *
 * C'est le format attendu par un tableur : un CSV ne peut pas transporter
 * d'image, un `.xlsx` si. Le rendu se fait par plus proche voisin — un
 * redimensionnement lissé rendrait le code illisible.
 *
 * @param {string} text
 * @param {{
 *   ecc?: 'L'|'M'|'Q'|'H',
 *   border?: number,
 *   scale?: number,
 *   dark?: [number, number, number],
 *   light?: [number, number, number],
 *   maxSize?: number,
 * }} [options]
 * @returns {Promise<Uint8Array>}
 */
async function qrPng(text, options = {}) {
  const matrix = encodeQr(text, {
    ecc: options.ecc ?? 'M',
    border: options.border ?? 2,
  });

  // L'échelle est entière, et bornée pour qu'une URL longue ne produise pas une
  // image démesurée dans le classeur.
  const requested = Math.max(1, Math.floor(options.scale ?? 8));
  const maxSize = options.maxSize ?? 512;
  const scale = Math.max(1, Math.min(requested, Math.floor(maxSize / matrix.size)));

  const size = matrix.size * scale;
  const dark = options.dark ?? [0, 0, 0];
  const light = options.light ?? [255, 255, 255];
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    const sourceRow = matrix.data[Math.floor(y / scale)];
    for (let x = 0; x < size; x++) {
      const color = sourceRow[Math.floor(x / scale)] ? dark : light;
      const offset = (y * size + x) * 4;
      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 0xff;
    }
  }

  return encodePng({ width: size, height: size, data });
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/label.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Composition d'une étiquette : un QR Code et une URL lisible.
 *
 * Ce module ne dépend d'aucune imprimante : il décrit une géométrie en pixels
 * pour une largeur de tête et une résolution données. Les profils concrets
 * (D110, M2) vivent dans `printer/profiles.js`, ce qui permet de tester la mise
 * en page sans matériel.
 */





/**
 * @typedef {Object} LabelGeometry
 * @property {number} width       Largeur totale en pixels.
 * @property {number} height      Hauteur totale en pixels.
 * @property {number} padding     Marge intérieure en pixels.
 * @property {number} qrSize      Côté du QR Code en pixels (multiple de l'échelle).
 * @property {number} textTop     Ordonnée du premier texte.
 * @property {number} lineHeight  Hauteur de ligne de texte.
 * @property {string[]} lines     Lignes de texte déjà découpées.
 * @property {number} fontSize    Taille de police en pixels.
 * @property {number} qrScale     Pixels par module du QR Code.
 * @property {number} pxPerModule Pixels par module.
 * @property {boolean} fits       false si le QR Code ne tient pas dans la largeur utile.
 * @property {import('./qr.js').QrMatrix} qrMatrix Matrice encodée.
 */

/**
 * Prépare la date à imprimer sous le QR Code, en la découpant si elle ne tient pas.
 *
 * `drawLabel` écrit chaque ligne supplémentaire telle quelle, sans la découper :
 * une date trop large déborderait. On lui fournit donc des lignes déjà prêtes.
 * La date est rendue **entière** ou pas du tout.
 *
 * @param {(text: string) => number} measure Mesure du texte, à la taille de police retenue.
 * @param {string} dateText Date déjà mise en forme.
 * @param {number} maxWidth Largeur utile, en pixels.
 * @param {number} maxLines Nombre de lignes que la date peut occuper.
 * @returns {string[]} Lignes de la date, ou un tableau vide si elle ne tient pas.
 */
function wrapDate(measure, dateText, maxWidth, maxLines, options = {}) {
  if (dateText === '' || maxLines <= 0) return [];
  // Mode strict : on ne coupe qu'à l'endroit qui se lit bien — l'espace entre la
  // date et l'heure. C'est ce que veut la recherche de taille de police, qui
  // préfère réduire la police plutôt que de couper au milieu.
  const strict = options.strict !== false;

  // Une ligne entière d'abord : couper « 15/09/2026 10:30 » en deux alors qu'il
  // tient d'un seul tenant gaspille une ligne et allonge l'étiquette pour rien.
  if (measure(dateText) <= maxWidth) return [dateText];

  // Sinon, la date ne se coupe pas n'importe où : « 15/09/ » puis « 2026 » se
  // lit mal et fait hésiter. Le seul point de coupure acceptable est l'espace
  // entre la date et l'heure, qui donne deux morceaux entiers et lisibles.
  const parts = dateText.trim().split(/\s+/);
  if (parts.length > 1) {
    const [jour, heure] = [parts[0], parts.slice(1).join(' ')];
    if (measure(jour) <= maxWidth && measure(heure) <= maxWidth) return [jour, heure];
  }

  if (strict) return [];

  // Repli : on découpe au plus près, quitte à couper dans la date. C'est ce que
  // fait un rendu à police imposée — un export où l'utilisateur a réglé la
  // taille. Mieux vaut une date coupée proprement qu'aucune date, et rien n'est
  // perdu : le découpage est vérifié avant d'être retenu.
  const lignes = wrapText(measure, dateText, maxWidth, { maxLines });
  const entier = lignes.join('').replace(/\s/g, '') === dateText.replace(/\s/g, '');
  return entier ? lignes : [];
}

/**
 * Plus grande taille de police à laquelle la date tient sur une ligne entière.
 *
 * La date est écrite d'un bloc : si la police retenue la fait déborder, elle
 * était jusqu'ici coupée en plein milieu (« 15/09/ » puis « 2026 »). On préfère
 * réduire la police du texte — l'étiquette entière reste cohérente — plutôt que
 * d'amputer la date. Renvoie `0` si même le plancher de lisibilité ne suffit
 * pas, auquel cas la date est abandonnée et l'interface le dit.
 *
 * @param {(size: number) => ((text: string) => number)} measureFactory
 * @param {string} dateText
 * @param {number} maxWidth
 * @param {number} floor Taille minimale acceptable, en pixels.
 * @returns {number} Taille retenue, ou 0.
 */
function fontSizeForDate(measureFactory, dateText, maxWidth, floor, maxLines = 2) {
  // On juge sur le découpage réel, pas sur la ligne entière. Exiger que
  // « 15/09/2026 21:07 » tienne d'un seul tenant rejetait la date en bloc,
  // alors que `wrapDate` la coupe proprement en « 15/09/2026 » et « 21:07 » :
  // cocher « Avec l'heure » ne donnait donc aucune date du tout.
  for (let size = 40; size >= floor; size--) {
    const lignes = wrapDate(measureFactory(size), dateText, maxWidth, maxLines);
    if (lignes.length > 0) return size;
  }
  return 0;
}

/**
 * Plancher de police, en pixels, pour une largeur de tête donnée.
 *
 * `MIN_FONT_MM` est la cible, mais une tête plus étroite que la police minimale
 * ne pourrait rien imprimer : on ne descend jamais sous la moitié de cette
 * cible, quelle que soit la largeur.
 *
 * @param {number} width Largeur de tête en pixels.
 * @param {number} dpi
 * @returns {number}
 */
function pxToMmFloor(width, dpi) {
  // C'est la lisibilité qui fixe le plancher, pas la largeur. Prendre le
  // minimum des deux faisait toujours gagner la valeur dérivée de la largeur
  // (8 px sur une tête de 96, soit 1 mm) : le texte descendait sous le seuil
  // de lisibilité dès qu'on cochait titre et URL. Une police plus étroite que
  // la tête se découpe en lignes ; elle n'a pas besoin d'être rapetissée.
  return Math.max(6, mmToPx(MIN_FONT_MM, dpi));
}

/**
 * Compose le contenu d'une étiquette à partir de choix indépendants.
 *
 * Remplace l'ancien mode unique — « QR Code + titre », « QR Code + URL »… — par des cases
 * qui se cumulent : le titre, l'URL, le domaine, le numéro et la date ne
 * s'excluent pas. Le numéro sert à retrouver la ligne de la liste quand
 * l'étiquette est trop petite pour porter l'URL entière.
 *
 * @param {{ url: string, title?: string }} link
 * @param {{
 *   index?: number|null,
 *   title?: boolean,
 *   url?: boolean,
 *   host?: boolean,
 *   indexVisible?: boolean,
 *   dateLines?: string[],
 * }} options
 * @returns {{ text: string, showTitle: boolean, extraLines: number, extraText: string[] }}
 */
function labelContentFromChoices(link, options = {}) {
  const title = typeof link.title === 'string' ? link.title.trim() : '';
  // Le titre n'est repris que s'il existe : cocher « Titre » sur un lien sans
  // titre ne doit pas laisser une ligne vide sous le QR Code.
  const showTitle = options.title === true && title !== '';

  const parts = [];
  // Le numéro vient en tête : c'est ce qu'on cherche des yeux sur une petite
  // étiquette, avant même le titre.
  if (options.indexVisible === true && Number.isFinite(options.index)) {
    parts.push(`N° ${options.index}`);
  }
  if (showTitle) parts.push(title);
  if (options.url === true) parts.push(link.url);
  if (options.host === true) parts.push(hostOf(link.url));

  // Le titre est rendu en gras par `drawLabel`, donc à part du texte courant :
  // le mêler aux autres segments lui ferait perdre sa mise en forme.
  const text = parts.filter((part) => part !== '' && part !== title).join(' ');
  const extraText = Array.isArray(options.dateLines) ? options.dateLines.filter(Boolean) : [];

  // Le titre est découpé comme le reste du texte. Il était réservé sur **une**
  // ligne puis écrit sans découpe : un titre long débordait de l'étiquette, ou
  // se faisait couper au bord. `options.titleLines` porte les lignes déjà
  // découpées ; `titleLines` vaut 1 par défaut, pour ne rien changer aux
  // appelants qui n'en fournissent pas.
  const titleLines = Array.isArray(options.titleLines) && options.titleLines.length > 0
    ? options.titleLines
    : (showTitle ? [title] : []);

  return {
    text,
    showTitle,
    titleLines,
    extraLines: titleLines.length + extraText.length,
    extraText,
  };
}

/** Échelle minimale : sous 2 px par module, la tête thermique fusionne les points. */
const MIN_QR_SCALE = 2;

/**
 * Hauteur de texte minimale, en millimètres.
 *
 * À 203 dpi, `width * 0.085` donnait 8 px sur une tête de 96 px — soit 1 mm de
 * haut. Les chiffres montaient à 3 px : illisible à l'œil nu, et c'est le
 * défaut que ce plancher corrige. 1,6 mm est le minimum qu'on lise sans effort
 * sur une étiquette thermique.
 */
const MIN_FONT_MM = 1.6;

/**
 * Part de la hauteur que le texte peut occuper au maximum.
 *
 * Le reste va au QR Code : une étiquette où le texte mange les deux tiers de la
 * longueur ne se scanne plus. Sans ce plafond, une URL longue sur une longueur
 * de rouleau confortable ferait exactement cela.
 */
const LABEL_TEXT_HEIGHT_RATIO = 0.45;

/**
 * Disposition verticale de l'étiquette.
 *
 * `top` garde la composition resserrée en haut, telle qu'elle était avant que
 * la longueur du rouleau soit connue : c'est le repli quand aucune longueur
 * n'est renseignée.
 */
const LABEL_ALIGNMENTS = Object.freeze([
  { id: 'center', label: 'Centré' },
  { id: 'top', label: 'En haut' },
  { id: 'spread', label: 'Réparti (QR Code en haut, texte en bas)' },
]);

/** Disposition retenue par défaut. */
const DEFAULT_LABEL_ALIGNMENT = 'center';

/**
 * Taille de police maximale, en part de la largeur de la tête.
 *
 * Une longueur de rouleau confortable donne envie de grossir le texte jusqu'à
 * remplir la place. Au-delà de ce plafond, le texte devient plus gros que le QR Code
 * qu'il accompagne : l'étiquette perd son équilibre et le QR Code, seul élément
 * utile, passe au second plan. Le reste de la place va aux marges.
 */
const MAX_FONT_WIDTH_RATIO = 0.18;

/**
 * Largeur minimale d'une colonne de texte, en pixels.
 *
 * En dessous, la disposition latérale n'a plus de sens : une URL dense occupe
 * tant de modules qu'il ne reste que quelques pixels, soit deux ou trois
 * caractères par ligne. Mieux vaut empiler, et le dire, que produire un texte
 * illisible.
 */
const MIN_LATERAL_TEXT_PX = 18;

/**
 * Découpe un texte en lignes tenant dans une largeur donnée.
 *
 * Le découpage se fait sur les espaces, mais aussi après « / », « - » et « . »
 * car les URL n'ont souvent pas d'espace avant la fin du domaine. Un mot plus
 * long que la largeur disponible est coupé caractère par caractère plutôt que
 * de déborder.
 *
 * @param {(text: string) => number} measure Largeur d'un texte, en pixels.
 * @param {string} text
 * @param {number} maxWidth
 * @param {{ maxLines?: number }} [options]
 * @returns {string[]}
 */
function wrapText(measure, text, maxWidth, options = {}) {
  const maxLines = options.maxLines ?? Infinity;
  if (!text) return [];
  if (maxWidth <= 0) return [text];

  const lines = [];
  let current = '';

  /** Découpe un « mot » trop long en morceaux qui tiennent seuls. */
  const splitLongWord = (word) => {
    const chunks = [];
    let chunk = '';
    for (const char of word) {
      if (measure(chunk + char) > maxWidth && chunk !== '') {
        chunks.push(chunk);
        chunk = char;
      } else {
        chunk += char;
      }
    }
    if (chunk) chunks.push(chunk);
    return chunks;
  };

  // On conserve les séparateurs en les rattachant au fragment précédent.
  const tokens = text.split(/(?<=[\s/\-.])/).filter((token) => token !== '');

  for (const token of tokens) {
    const candidate = current + token;
    const trimmed = candidate.replace(/\s+$/, '');

    if (measure(trimmed) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current.trim() !== '') {
      lines.push(current.trim());
      if (lines.length >= maxLines) return lines;
      current = '';
    }
    const word = token.trim();
    if (word === '') continue;

    if (measure(word) <= maxWidth) {
      current = word + (/[\s]$/.test(token) ? ' ' : '');
    } else {
      const chunks = splitLongWord(word);
      for (let i = 0; i < chunks.length - 1; i++) {
        lines.push(chunks[i]);
        if (lines.length >= maxLines) return lines;
      }
      current = chunks[chunks.length - 1] ?? '';
    }
  }

  if (current.trim() !== '' && lines.length < maxLines) lines.push(current.trim());
  return lines;
}

/**
 * Calcule la géométrie d'une étiquette.
 *
 * La hauteur n'est jamais fixée à l'avance : elle découle du nombre de lignes
 * de texte nécessaires. Cela évite de rogner une URL longue ou, à l'inverse,
 * de gaspiller une étiquette sur une URL courte.
 *
 * @param {object} options
 * @param {string} options.text           Texte à imprimer sous le QR Code (généralement l'URL).
 * @param {string} [options.qrText]       Contenu réellement encodé dans le QR Code.
 *   Distinct de `text` : les deux ne coïncident que par hasard. Un QR Code
 *   peut n'avoir aucun texte sous lui (mode « QR Code seul »), et un titre imprimé
 *   n'est pas ce qu'on encode. Les confondre faisait lever l'encodage dès que
 *   le texte était vide — « QR Code seul » et « QR Code + titre » ne rendaient rien.
 * @param {number} options.widthPx        Largeur utile de la tête, en pixels.
 * @param {number} [options.dpi]          Résolution, pour les conversions mm <-> px.
 * @param {number} [options.fontSize]     Taille de police en pixels.
 * @param {number} [options.padding]      Marge intérieure en pixels.
 * @param {number} [options.qrRatio]      Part maximale de la largeur utile occupée par le QR Code (0-1).
 * @param {number} [options.minScale]     Pixels par module minimum (défaut : MIN_QR_SCALE).
 * @param {number} [options.lineSpacing]  Interligne, en multiple de la police.
 * @param {number} [options.maxLines]     Nombre maximal de lignes de texte.
 * @param {number} [options.maxHeightPx]  Hauteur maximale imposée (0 = illimitée).
 * @param {number} [options.minHeightPx]  Hauteur minimale de l'étiquette.
 * @param {string} [options.alignment]    `center`, `top` ou `spread` : où placer
 *   le contenu quand une longueur est imposée et qu'il y a de la place en trop.
 * @param {number} [options.extraLines]   Lignes de texte supplémentaires à
 *   réserver sous celles du texte principal — la date, quand elle est demandée.
 *   Les ignorer rognerait la dernière ligne en silence.
 * @param {(text: string) => number} [options.measure] Mesure de texte injectée
 *   (obligatoire hors navigateur ; en navigateur, un canvas est créé au besoin).
 * @returns {LabelGeometry}
 */
function computeLabelGeometry(options) {
  const width = Math.max(1, Math.floor(options.widthPx));
  const dpi = options.dpi ?? 203;
  const padding = Math.max(0, Math.floor(options.padding ?? Math.round(width * 0.06)));
  const fontSize = Math.max(6, Math.floor(options.fontSize ?? mmToPx(MIN_FONT_MM, dpi)));
  const lineSpacing = options.lineSpacing ?? 1.15;
  // **Le titre a sa propre taille**, comme le texte : un titre long se lit mieux
  // un peu plus petit, un titre court peut dominer. Tant que l'appelant ne
  // demande rien, il vaut la taille du texte — le comportement d'avant, au pixel
  // près. Ce que la géométrie doit connaître, c'est **combien de ses rangées
  // supplémentaires sont des rangées de titre** : elles ne s'interlignent pas
  // comme le corps.
  // `undefined` = « la taille du texte », et non « la taille demandée » : la
  // géométrie peut retenir une police plus petite que celle qu'on lui donne, et
  // le titre doit suivre **celle qui est retenue**, sans quoi il s'interlignerait
  // sur une taille qui n'est pas la sienne.
  const titreTailleDemandee = Number.isFinite(options.titleFontSize)
    ? Math.max(6, Math.floor(options.titleFontSize))
    : undefined;
  const titleRows = Math.max(0, Math.trunc(options.titleRows ?? 0));
  const alignment = options.alignment ?? DEFAULT_LABEL_ALIGNMENT;

  const innerWidth = Math.max(1, width - padding * 2);
  const qrRatio = Math.min(1, Math.max(0.3, options.qrRatio ?? 0.95));
  const minScale = Math.max(1, Math.floor(options.minScale ?? MIN_QR_SCALE));
  const maxLines = options.maxLines ?? 4;

  const extraLines = Math.max(0, Math.trunc(options.extraLines ?? 0));
  const requestedAlign = LABEL_ALIGNMENTS.some((entry) => entry.id === alignment)
    ? alignment
    : DEFAULT_LABEL_ALIGNMENT;

  const minHeight = Math.max(0, Math.floor(options.minHeightPx ?? 0));
  const maxHeight = Math.max(0, Math.floor(options.maxHeightPx ?? 0));

  // La longueur du rouleau est une contrainte, pas un plancher : composer plus
  // court ne raccourcit pas l'étiquette, l'imprimante avance jusqu'à la découpe
  // suivante et le reste sort blanc. On remplit donc exactement la place.
  let target = minHeight;
  if (maxHeight > 0) target = target > 0 ? Math.min(target, maxHeight) : maxHeight;

  // Le QR Code a une taille entière en modules : on arrondit au multiple inférieur.
  // Ce qui est encodé n'est pas ce qui est imprimé : `qrText` prime, et à
  // défaut on retombe sur le texte affiché, comportement d'origine.
  const qrText = options.qrText ?? options.text ?? '';
  const matrix = encodeQr(qrText === '' ? ' ' : qrText, { ecc: options.ecc ?? 'M', border: 2 });
  // La mesure doit suivre la taille de police essayée : une mesure fixe servait
  // à découper pour toutes les tailles candidates, si bien que le texte découpé
  // pour 13 px était tracé à 17 px et débordait de l'étiquette. `measureFactory`
  // reçoit la taille et rend la mesure correspondante ; `measure` reste accepté
  // pour les appelants qui n'ont qu'une taille (tests, exports).
  const measureFactory = options.measureFactory
    ?? (options.measure ? () => options.measure : (size) => defaultMeasure(size));
  const measure = options.measure ?? measureFactory(fontSize);

  /** Découpe le texte pour une taille de police, dans les limites de la cible. */
  const layoutText = (size) => {
    const height = Math.ceil(size * lineSpacing);
    const mesure = measureFactory(size);
    // Le texte ne peut pas manger toute la longueur : au-delà, le QR Code n'a plus
    // de place et la disposition répartie le pousserait hors de l'étiquette.
    const cap = target > 0
      ? Math.max(extraLines, Math.floor((target * LABEL_TEXT_HEIGHT_RATIO) / height))
      : maxLines;
    // Le plafond de lignes protège l'équilibre entre le QR Code et son texte, mais il
    // ne doit pas amputer le texte : une URL coupée après « com/ » est fausse,
    // pas seulement tronquée. On compte donc les lignes qu'il faut réellement,
    // et on ne retient le plafond que s'il suffit. S'il ne suffit pas, la police
    // sera réduite par `tryFont`, qui juge sur la hauteur obtenue.
    const complet = wrapText(mesure, options.text ?? '', innerWidth, { maxLines: Infinity });
    // Ce que la longueur du rouleau peut réellement contenir : le QR Code, l'écart,
    // la marge, et le reste pour le texte. C'est cette borne qui empêche le
    // texte entier de dépasser l'étiquette — sans elle, garder le texte complet
    // faisait sortir 292 px sur une cible de 176.
    const placeTexte = target > 0
      ? target - padding * 2 - qrSize - (extraLines > 0 || true ? padding : 0)
      : Infinity;
    const lignesPossibles = Number.isFinite(placeTexte)
      ? Math.max(1, Math.floor(placeTexte / height))
      : Infinity;

    const plafond = Math.min(maxLines, cap, lignesPossibles);
    const suffisant = plafond >= complet.length;
    // Le plafond cède pour ne pas amputer le texte, mais jamais au-delà de ce
    // que la hauteur permet : la réduction de police fait le reste.
    const limite = suffisant ? plafond : Math.min(Math.max(plafond, complet.length), lignesPossibles);
    const limits = [Math.max(1, limite)];
    if (target > 0 && extraLines > 0) {
      // La date s'écrit sur une seule ligne, sans découpage : un interligne qui
      // la ferait dépasser ne doit pas être retenu.
      limits.push(Math.floor((target - padding) / height));
    }
    const lignes = wrapText(mesure, options.text ?? '', innerWidth, {
      maxLines: Math.max(0, Math.min(...limits)),
    });
    return {
      lines: lignes,
      lineHeight: height,
      // Le texte est-il entier ? Le plafond de lignes peut céder avant la fin
      // du texte quand la place manque, et `tryFont` refuse alors cette taille :
      // une URL coupée après « com/ » est fausse, pas seulement tronquée.
      complete: lignes.length >= complet.length,
    };
  };

  // Le texte dispose de la place que le QR Code lui laisse. L'ordre des candidats
  // décide de tout :
  //
  // 1. **La taille demandée passe en premier.** C'est un réglage de
  //    l'utilisateur, pas une suggestion. Elle était essayée en second, après
  //    un candidat « remplir la longueur » qui, borné par le plafond de largeur,
  //    tenait toujours — si bien que le réglage « Taille du texte » n'avait
  //    aucun effet : de 2 à 7 mm, la même police sortait. Un réglage sans effet
  //    est pire que pas de réglage.
  // 2. À défaut, remplir la longueur du rouleau.
  // 3. À défaut, la lisibilité minimale.
  //
  // Le nombre de lignes n'est pas décidé ici : il découle de la taille retenue
  // et de la place réellement disponible, un peu plus bas (`lignesPossibles`).
  const requested = Math.floor(options.fontSize ?? 0);
  const candidates = [];
  if (requested > 0) candidates.push({ size: requested, explicit: true });
  if (target > 0) candidates.push({ size: Math.floor((target * 0.22) / lineSpacing), explicit: false });
  candidates.push({ size: fontSize, explicit: false });

  const textTarget = Math.floor(innerWidth * qrRatio);
  // **Une taille de QR Code demandée** remplace la règle « aussi large que
  // possible ». C'était le seul comportement : sur une tête de 12 mm le QR Code
  // occupe déjà toute la largeur utile, mais sur une tête de 48 ou 72 mm il en
  // prenait la même part, et rien ne permettait de le réduire pour laisser de la
  // place au texte. La demande est **bornée des deux côtés** :
  //   - en bas par la lisibilité, 2 px par module : sous ce seuil une tête
  //     thermique fusionne les points, et un QR Code illisible n'est pas un
  //     réglage, c'est une panne ;
  //   - en haut par la largeur utile.
  // Le côté obtenu est un **nombre entier de modules** : un QR Code arrondi au
  // pixel près ne se lirait pas.
  const demandé = Math.floor(options.qrTargetPx ?? 0);
  const echelleMin = matrix.size * minScale;
  const maxParLargeur = Math.floor(innerWidth / matrix.size) * matrix.size;
  const ajusté = Math.floor(demandé / matrix.size) * matrix.size;
  const tailleDemandee = demandé > 0
    ? Math.max(echelleMin, Math.min(ajusté > 0 ? ajusté : echelleMin, maxParLargeur))
    : 0;
  const scale = tailleDemandee > 0
    ? tailleDemandee / matrix.size
    : Math.max(minScale, pickScale(textTarget, matrix.size));
  const qrSize = tailleDemandee > 0 ? tailleDemandee : matrix.size * scale;
  const fits = qrSize <= innerWidth;

  // Le texte ne monte pas plus haut que cette part de la largeur de la tête :
  // au-delà il dominerait le QR Code au lieu de l'accompagner. C'est une règle
  // d'**équilibre**, et elle ne vaut que pour le choix automatique — voir
  // `tryFont`.
  const fontCeiling = Math.max(6, Math.floor(width * MAX_FONT_WIDTH_RATIO));

  /**
   * Essaie une taille de police et dit si elle tient.
   *
   * « Tenir » veut dire deux choses, et les deux comptent : le contenu garde la
   * marge basse de l'étiquette, et le QR Code conserve sa place au-dessus. Ne
   * vérifier que la première laissait passer une taille qui chassait le QR Code ou
   * qui collait le texte au bord.
   *
   * @param {number} size
   * @param {boolean} [explicit] Taille demandée par l'utilisateur : elle échappe
   *   au plafond d'équilibre. Le plafond existe pour empêcher le **choix
   *   automatique** de laisser le texte dominer le QR Code ; il n'a pas à annuler un
   *   réglage explicite, sans quoi le réglage n'a aucun effet — c'était le cas,
   *   et de 2 à 7 mm la même police sortait. La place réellement disponible
   *   reste vérifiée juste en dessous, et c'est elle qui borne.
   */
  const tryFont = (size, explicit = false) => {
    const borné = explicit ? Math.min(size, innerWidth) : Math.min(size, fontCeiling);
    const usable = Math.max(6, borné);
    const attempt = layoutText(usable);
    // Les rangées de titre s'interlignent à **leur** hauteur, le reste à celle du
    // corps. Sans taille de titre demandée, les deux valent la même chose — la
    // police retenue — et le total est celui d'avant, au pixel près.
    // La police **essayée** est `usable` : `attempt` ne porte pas de taille, et
    // lire la sienne donnait `NaN` jusque dans la hauteur de l'étiquette.
    const titreTaille = titreTailleDemandee ?? usable;
    // Sans demande, l'interligne du titre est **celui du corps**, tel quel : le
    // défaut reproduit l'ancien comportement au pixel près, sans dépendre d'un
    // `ceil` recalculé qui pourrait en différer d'un pixel.
    const titreInterligne = titreTailleDemandee === undefined
      ? attempt.lineHeight
      : Math.ceil(titreTaille * lineSpacing);
    const corpsRangees = attempt.lines.length + Math.max(0, extraLines - titleRows);
    const textHeight = titleRows * titreInterligne + corpsRangees * attempt.lineHeight;
    // Hauteur complète : marge haute, QR Code, écart, texte, **et marge basse**.
    // C'est la plus petite hauteur d'étiquette qui contienne le tout. Oublier
    // la marge basse donnait une étiquette dont le texte touchait le bord, et
    // une disposition répartie qui n'avait plus rien à répartir.
    const natural = qrSize + (attempt.lines.length + extraLines > 0 ? padding + textHeight : 0)
      + padding * 2;
    return {
      fontSize: usable,
      lines: attempt.lines,
      lineHeight: attempt.lineHeight,
      titleFontSize: titreTaille,
      titleLineHeight: titreInterligne,
      textHeight,
      naturalHeight: natural,
      // Deux conditions, et la seconde est la plus importante : la taille doit
      // tenir **et** le texte doit être entier. Une taille qui coupe le texte
      // n'est pas une taille qui tient.
      ok: (target === 0 ? true : natural <= target) && attempt.complete,
    };
  };

  let placed = null;
  let fallback = null;
  for (const candidat of candidates) {
    const attempt = tryFont(candidat.size, candidat.explicit);
    if (attempt.ok) {
      placed = attempt;
      break;
    }
    // Aucune taille ne tient : on garde la plus petite essayée, c'est-à-dire la
    // dernière, plutôt que d'abandonner le texte ou de le laisser déborder.
    fallback = attempt;
  }

  // Aucune taille essayée ne tient ? Le texte déborde parce qu'il est trop
  // gros, pas parce qu'il est trop long : on réduit alors la police jusqu'à ce
  // qu'il entre, sans descendre sous le plancher de lisibilité. Sans cette
  // recherche, `maxLines` tronquait l'URL en silence — l'étiquette sortait
  // amputée, ce qui est pire qu'un texte petit.
  if (placed === null) {
    const floor = Math.max(6, Math.floor(pxToMmFloor(width, dpi)));
    for (let size = (fallback?.fontSize ?? floor) - 1; size >= floor; size--) {
      const attempt = tryFont(size);
      if (attempt.ok) {
        placed = attempt;
        break;
      }
      fallback = attempt;
    }
  }

  placed = placed ?? fallback;

  const { lines, lineHeight } = placed;
  const textHeight = placed.textHeight;
  const contentLines = lines.length + extraLines;

  // Plus petite hauteur d'étiquette qui contienne le contenu et ses deux
  // marges. C'est elle qui décide si la longueur demandée suffit.
  const naturalHeight = placed.naturalHeight;
  // Une longueur plus courte que le contenu ne peut pas être remplie : on rend
  // la hauteur naturelle, la plus petite qui contienne tout avec ses marges.
  // La borner à la longueur annoncée ferait déborder le contenu sous le bord.
  const height = target > 0 && naturalHeight <= target ? target : naturalHeight;

  // `spread` et `center` n'ont de sens que si le contenu tient : sans cette
  // garde, une longueur trop courte placerait le texte **sous** le bord.
  const effectiveAlign = target > 0 && naturalHeight <= target ? requestedAlign : 'top';
  const slack = height - naturalHeight;

  let qrTop;
  let spreadGap = padding;
  if (effectiveAlign === 'spread') {
    qrTop = padding;
    // Le texte finit à `height - padding`. `naturalHeight` comprend déjà cette
    // marge basse : l'écart cherché est donc `slack`, et non `slack + padding`.
    spreadGap = padding + slack;
  } else if (effectiveAlign === 'center') {
    // **Le bloc se centre**, il ne s'étire pas. Une moitié de la place libre va
    // au-dessus du QR Code, l'autre **sous le texte** — c'est ce que ce
    // commentaire annonçait déjà, mais la seconde moitié s'ajoutait à l'écart
    // entre le QR Code et le texte, si bien que le code flottait loin de son
    // texte. Mesuré sur une 14 × 50 mm d'un D110 (1 mm = 8 px) : l'écart valait
    // **124 px = 15,5 mm** au lieu des 6 px de la disposition « en haut », et le
    // texte se retrouvait collé au bas de l'étiquette — l'inverse d'un centrage.
    // Signalé : « l'interlignage entre le QR Code et le texte est trop large,
    // surtout pour les étiquettes de 14 × 50 ».
    qrTop = padding + Math.floor(slack / 2);
  } else {
    qrTop = padding;
  }

  // Le texte peut se placer au-dessus du QR Code : on remonte alors le QR Code de la
  // hauteur du texte, pour que les deux ne se chevauchent pas. Sans ce
  // décalage, « texte au-dessus » dessinait le texte par-dessus le code.
  const blockHeight = qrSize + (contentLines > 0 ? spreadGap + textHeight : 0);
  const top = options.textFirst === true
    ? padding + (contentLines > 0 ? textHeight + spreadGap : 0)
    : qrTop;
  const textAtTop = options.textFirst === true
    ? padding
    : qrTop + qrSize + spreadGap;

  return {
    width,
    height,
    padding,
    qrSize,
    qrScale: scale,
    pxPerModule: qrSize / matrix.size,
    fits,
    qrMatrix: matrix,
    qrTop: Math.round(top),
    qrLeft: Math.floor((width - qrSize) / 2),
    qrTextGap: spreadGap,
    textTop: Math.round(textAtTop),
    blockHeight,
    lineHeight,
    // Le titre se dessine à sa propre taille : les deux valeurs voyagent avec la
    // géométrie, sans quoi `drawLabel` le remettrait à la taille du corps et le
    // réglage n'aurait aucun effet visible.
    titleFontSize: placed.titleFontSize,
    titleLineHeight: placed.titleLineHeight,
    titleRows,
    lines,
    extraLines,
    fontSize: placed.fontSize,
    targetHeight: target,
    naturalHeight,
    slack,
    alignment: effectiveAlign,
  };
}

/**
 * Dispose le QR Code et le texte côte à côte, sur la largeur de la tête.
 *
 * L'orientation « horizontale » ne tourne rien : elle change l'axe de
 * composition. Le QR Code garde sa taille, le texte se découpe sur la largeur qui
 * reste et se cale à droite du code. C'est ce qui permet de garder le texte
 * lisible et paramétrable quelle que soit l'orientation du support.
 *
 * @param {LabelGeometry} geometry Géométrie verticale déjà calculée.
 * @param {{
 *   measure: (text: string) => number,
 *   maxLines?: number,
 *   gap?: number,
 * }} options
 * @returns {LabelGeometry}
 */
function layoutLabelLateral(geometry, options) {
  const gap = Math.max(1, Math.floor(options.gap ?? geometry.padding));
  const maxLines = Math.max(1, Math.trunc(options.maxLines ?? 4));

  // Le QR Code ne descend jamais sous son échelle minimale : un code illisible ne
  // sert à rien, et c'est le texte qui cède, pas le code. Sa taille plancher
  // est donc celle qui décide s'il reste une colonne utilisable pour le texte.
  const minQr = geometry.qrMatrix.size * MIN_QR_SCALE;
  const usable = geometry.width - geometry.padding * 2 - gap;
  const textWidth = usable - minQr;

  // Sous ce seuil, il n'y a pas de colonne de texte : une URL dense occupe tant
  // de modules qu'il ne reste que quelques pixels. Plutôt que d'écrire trois
  // caractères par ligne, on refuse la disposition latérale et on le signale —
  // c'est à l'appelant de retomber sur l'empilement.
  if (textWidth < MIN_LATERAL_TEXT_PX) {
    return { ...geometry, lateral: false, lateralRefused: true, lateralTextWidth: textWidth };
  }

  // Le texte a la place qu'il lui faut ; le QR Code prend le reste, jusqu'à être
  // aussi grand que possible sans jamais empiéter sur cette colonne.
  const qrMax = Math.max(minQr, usable - MIN_LATERAL_TEXT_PX);
  let qrSize = geometry.qrSize;
  let qrScale = geometry.qrScale;
  if (qrSize > qrMax) {
    qrScale = Math.max(MIN_QR_SCALE, Math.floor(qrMax / geometry.qrMatrix.size));
    qrSize = geometry.qrMatrix.size * qrScale;
  }

  const textLeft = geometry.padding + qrSize + gap;
  const realTextWidth = Math.max(1, geometry.width - geometry.padding - textLeft);

  const lines = wrapText(options.measure, options.text ?? '', realTextWidth, { maxLines });
  const lineHeight = geometry.lineHeight;
  const textHeight = (lines.length + geometry.extraLines) * lineHeight;

  // Le contenu occupe la hauteur qu'il faut, jamais plus que l'étiquette.
  const contentHeight = Math.max(qrSize, textHeight);
  const height = Math.max(
    geometry.height,
    contentHeight + geometry.padding * 2,
  );

  return {
    ...geometry,
    height,
    qrSize,
    qrScale,
    pxPerModule: qrSize / geometry.qrMatrix.size,
    qrTop: Math.floor((height - qrSize) / 2),
    qrLeft: geometry.padding,
    textLeft,
    textWidth: realTextWidth,
    textAlign: 'left',
    textTop: Math.floor((height - textHeight) / 2),
    lines,
    lateral: true,
  };
}

/**
 * Dispose le QR Code en haut et son texte tourné d'un quart de tour en dessous.
 *
 * C'est la disposition qui rend le texte lisible sur un rouleau étroit : droit,
 * il ne dispose que de la largeur de la tête moins le QR Code — 18 px sur 12 mm, soit
 * trois caractères par ligne. Tourné, il profite de toute la hauteur restante.
 *
 * @param {LabelGeometry} geometry Géométrie empilée déjà calculée.
 * @param {{
 *   measure: (text: string) => number,
 *   text?: string,
 *   maxLines?: number,
 *   gap?: number,
 * }} options
 * @returns {LabelGeometry}
 */
function layoutLabelRotated(geometry, options) {
  const gap = Math.max(1, Math.floor(options.gap ?? geometry.padding));
  const padding = geometry.padding;
  const lineHeight = geometry.lineHeight;

  // Les lignes du titre font partie de la bande : les oublier laissait le titre
  // sans place réservée, et il ne s'imprimait pas du tout en mode tourné.
  //
  // Mais ces lignes viennent de l'appelant, qui les a découpées à la **largeur**
  // de l'étiquette — la contrainte de la disposition empilée. Ici, chaque rangée
  // court sur la **longueur** : réutiliser ces lignes tronquait le titre à deux
  // rangées étroites alors que la bande avait de quoi l'écrire entier. Mesuré sur
  // un 12 × 75 mm : deux rangées de 72 px occupées dans une bande de 490 px, et la
  // moitié du titre perdue. Quand l'appelant fournit le titre **en clair**, la
  // bande le redécoupe donc elle-même, comme elle redécoupe déjà le corps du
  // texte. Sans lui, les lignes fournies sont conservées telles quelles : les
  // appelants qui ne passent que des lignes ne changent pas de comportement.
  const titreTexte = typeof options.title === 'string' ? options.title.trim() : '';
  const titleLines = Array.isArray(options.titleLines) ? options.titleLines.filter(Boolean) : [];
  const titreRangeesMax = Math.max(1, Math.trunc(options.titleMaxLines ?? 2));
  // Les lignes de la date, s'il en reste : le titre peut occuper plusieurs
  // rangées, et les compter par déduction se trompait dès qu'il en prenait deux.
  const dateLignes = Array.isArray(options.dateLines) ? options.dateLines.filter(Boolean) : null;

  // Le nombre de lignes n'est pas un réglage : c'est la largeur de la bande qui
  // le décide, et le texte est découpé à nouveau ici. Réutiliser les lignes de
  // la disposition empilée les bornait à quatre — l'URL était coupée après
  // « com/ » et sa fin perdue, pas seulement tronquée à l'affichage.
  const maxLines = Math.max(
    1,
    Math.trunc(options.maxLines ?? Math.floor((geometry.width - padding * 2) / lineHeight)),
  );

  // La bande de texte commence sous le QR Code. Sa longueur ne peut pas dépasser ce
  // qui reste jusqu'à la marge basse : c'est cette borne qui l'empêche de
  // remonter sur le code — le texte monte depuis le bas de sa bande.
  // Le texte monte depuis le bas de sa bande : sa longueur est donc bornée par
  // la hauteur qui reste sous le QR Code, marge basse déduite.
  const afterQr = padding + geometry.qrSize + gap;
  const fixed = geometry.targetHeight > 0;
  // La bande part du bas du QR Code et s'arrête à la marge basse. Le texte monte
  // depuis son extrémité basse : si la bande descendait jusque dans la marge,
  // le texte s'y écrivait et touchait le bord de l'étiquette.
  const bottom = Math.max(afterQr, geometry.targetHeight - padding);
  const available = fixed
    ? Math.max(geometry.width, bottom - afterQr)
    // Sans longueur imposée, on part de la longueur du contenu : l'étiquette
    // s'ajuste au texte au lieu de réserver une bande vide.
    : Math.max(geometry.width, Math.ceil(options.measure(options.text ?? '')));

  // Le texte doit tenir dans la bande **en largeur comme en longueur** : ses
  // lignes s'empilent sur la largeur de l'étiquette, et chacune court sur la
  // longueur disponible. Une URL dense demandait sept lignes là où quatre
  // tenaient : sa fin était perdue. On réduit donc la police jusqu'à ce que
  // tout entre, sans descendre sous le plancher de lisibilité.
  const bandWidth = Math.max(1, geometry.width - padding * 2);
  const floor = Math.max(6, Math.floor(width_floor(geometry, options)));
  // La boucle doit toujours s'exécuter au moins une fois : si la police de la
  // composition empilée est déjà sous le plancher, `placed` restait nul et le
  // rendu levait « Cannot read properties of null ». On part donc du plus grand
  // des deux.
  const depart = Math.max(floor, Math.floor(geometry.fontSize));
  let chosen = null;
  let last = null;
  for (let size = depart; size >= floor; size--) {
    const mesure = options.measureFactory ? options.measureFactory(size) : options.measure;
    const height = Math.ceil(size * (options.lineSpacing ?? 1.15));
    // Les lignes du titre et de la date sont réservées d'abord : le corps du
    // texte prend ce qui reste. Sans cette réservation, le corps occupait toute
    // la bande et la date — écrite en dernier — débordait et se faisait rogner.
    const rangees = Math.max(1, Math.floor(bandWidth / height));
    // Le titre est redécoupé à la **longueur de la bande**, pas à la largeur de
    // l'étiquette : c'est ici que se perdait la moitié d'un titre sur une
    // étiquette large, sans que rien ne le dise.
    const titreEssai = titreTexte !== ''
      ? wrapText(mesure, titreTexte, available, { maxLines: titreRangeesMax })
      : titleLines;
    const titreRangees = titreEssai.length;
    // Les lignes de la date se comptent d'elles-mêmes quand l'appelant les
    // fournit. Sinon on retombe sur la déduction d'avant, qui suppose le titre
    // sur une seule rangée.
    const dateRangees = dateLignes !== null
      ? dateLignes.length
      : Math.max(0, geometry.extraLines - titreRangees);
    const reservees = titreRangees + dateRangees;
    const essai = wrapText(mesure, options.text ?? '', available, {
      maxLines: Math.max(1, rangees - reservees),
    });
    // L'épaisseur compte les lignes du titre et de la date, pas seulement le
    // corps : ce sont elles qui décident si la bande déborde.
    const epaisseur = (essai.length + reservees) * height;
    const corpsComplet = essai.join('').replace(/\s/g, '')
      === (options.text ?? '').replace(/\s/g, '');
    const titreComplet = titreTexte === ''
      || titreEssai.join('').replace(/\s/g, '') === titreTexte.replace(/\s/g, '');
    const complet = corpsComplet && titreComplet;
    last = {
      lines: essai, lineHeight: height, fontSize: size, thickness: epaisseur,
      titleLines: titreEssai, complet, corpsComplet, titreComplet,
    };
    if (epaisseur <= bandWidth && (complet || options.text === '')) {
      chosen = last;
      break;
    }
  }
  // Aucune taille ne contient tout le texte : on garde la plus petite essayée,
  // qui en montre le plus, plutôt que d'abandonner. Et si rien n'a pu être
  // essayé, on compose au plancher plutôt que de lever.
  const placed = chosen ?? last ?? {
    lines: wrapText(
      options.measureFactory ? options.measureFactory(floor) : options.measure,
      options.text ?? '',
      available,
      { maxLines: 1 },
    ),
    lineHeight: Math.ceil(floor * (options.lineSpacing ?? 1.15)),
    fontSize: floor,
    thickness: Math.ceil(floor * (options.lineSpacing ?? 1.15)),
    titleLines,
  };
  const lines = placed.lines;
  const thickness = placed.thickness;
  // **Le texte a-t-il été coupé ?** La boucle le savait — `complet` — et le
  // résultat le taisait : une adresse tronquée sortait sans un mot, comme si la
  // composition avait tout gardé. L'appelant peut désormais le dire.
  const texteCoupe = placed.complet === false;

  // Le texte est dessiné depuis le **bas** de sa bande, en remontant : c'est
  // donc `textTop + textWidth` qui doit tomber sur la marge basse. Placer la
  // bande juste après le QR Code la faisait descendre dans la marge.
  const bandTop = fixed
    ? geometry.targetHeight - padding - available
    : afterQr;

  return {
    ...geometry,
    height: fixed ? geometry.targetHeight : afterQr + available + padding * 2,
    qrLeft: Math.floor((geometry.width - geometry.qrSize) / 2),
    qrTop: padding,
    textRotated: true,
    // Le sens de rotation : « horaire » se lit de bas en haut, « antihoraire »
    // de haut en bas. Les deux ancrages diffèrent, d'où ce transport.
    textSens: options.sens === 'antihoraire' ? 'antihoraire' : 'horaire',
    textTop: bandTop,
    // La bande tournée fait `thickness` de large : on la centre.
    textLeft: Math.max(0, Math.floor((geometry.width - thickness) / 2)),
    textWidth: available,
    lines,
    // Les lignes du titre voyagent avec la géométrie : `drawLabel` les écrit
    // dans le même repère tourné que le corps du texte. Ce sont celles **que la
    // bande a découpées**, et non celles de la disposition empilée.
    titleLines: placed.titleLines ?? titleLines,
    // Ce que la composition a dû laisser de côté, faute de place : l'appelant le
    // dit à l'utilisateur au lieu de laisser une adresse tronquée passer pour
    // une adresse entière.
    textCut: texteCoupe,
    // La police retenue peut être plus petite que celle de la composition
    // empilée : c'est elle qui est dessinée.
    fontSize: placed.fontSize,
    lineHeight: placed.lineHeight,
    rotatedTextLength: available,
    rotatedTextThickness: thickness,
  };
}

/**
 * Plancher de police pour la disposition tournée.
 *
 * C'est la lisibilité qui le fixe, pas la largeur : `width * 0.07` laissait
 * descendre à 6 px sur une tête de 96 px, soit 0,75 mm — une trame grise. Le
 * texte doit rester lisible même s'il faut alors renoncer à une partie du
 * contenu, et l'aperçu le dit.
 */
function width_floor(geometry, options) {
  const cible = options.minFont ?? 0;
  if (cible > 0) return cible;
  return Math.max(6, Math.round((MIN_FONT_MM / 25.4) * (options.dpi ?? 203)));
}

/**
 * Mesure par défaut. En navigateur on crée un canvas hors écran ; ailleurs on
 * approxime, ce qui suffit à découper des URL en police monospace.
 *
 * @param {number} fontSize
 * @returns {(text: string) => number}
 */
function defaultMeasure(fontSize) {
  const canvasFactory = globalThis.document?.createElement?.bind(globalThis.document);
  if (canvasFactory) {
    const canvas = canvasFactory('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = `${fontSize}px -apple-system, system-ui, sans-serif`;
      return (text) => ctx.measureText(text).width;
    }
  }
  // Approximation : ratio moyen constaté pour une police sans-serif.
  return (text) => text.length * fontSize * 0.55;
}

/**
 * Dessine une étiquette complète (QR Code + texte) dans un contexte 2D.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {LabelGeometry} geometry
 * @param {{
 *   fontFamily?: string,
 *   showTitle?: boolean,
 *   title?: string,
 *   showHost?: boolean,
 * }} [options]
 * @returns {LabelGeometry}
 */
function drawLabel(ctx, geometry, options = {}) {
  const {
    fontFamily = '-apple-system, system-ui, "Helvetica Neue", Arial, sans-serif',
    showTitle = false,
    title = '',
    showHost = false,
    // Lignes à imprimer sous le texte principal — la date, le plus souvent.
    // Leur place a été réservée par `extraLines` dans la géométrie.
    extraText = [],
  } = options;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, geometry.width, geometry.height);

  // `qrLeft` et `qrTop` viennent de la géométrie : le QR Code ne part plus du coin
  // supérieur gauche, il se place dans la disposition retenue.
  const qrX = geometry.qrLeft ?? Math.floor((geometry.width - geometry.qrSize) / 2);
  drawQr(geometry.qrMatrix, ctx, { x: qrX, y: geometry.qrTop, scale: geometry.qrScale });

  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'top';

  // En disposition latérale, le texte se cale à gauche dans la colonne qui lui
  // reste ; sinon il reste centré sous le QR Code.
  const lateral = geometry.lateral === true;
  const textX = lateral ? geometry.textLeft : geometry.width / 2;
  const maxWidth = lateral ? geometry.textWidth : undefined;

  // Texte tourné d'un quart de tour, dans sa bande sous le QR Code.
  //
  // Le bloc est **centré** dans sa bande, sur l'épaisseur comme sur la longueur.
  // Auparavant chaque sens s'ancrait d'un côté différent — l'un au bord du QR Code,
  // l'autre au bord de l'étiquette — et le titre, compté deux fois dans
  // l'épaisseur réservée, décalait encore le bloc d'un demi-interligne. Résultat
  // visible à l'impression : un sens rognait le texte, l'autre non.
  if (geometry.textRotated === true) {
    const blockLeft = geometry.textLeft ?? geometry.padding;
    const thickness = geometry.rotatedTextThickness ?? geometry.lineHeight;
    const bandLength = geometry.textWidth ?? 0;
    const lineHeight = geometry.lineHeight;

    // Les rangées réellement écrites, dans l'ordre de lecture.
    // Chaque rangée porte **sa** hauteur : le titre peut être plus grand ou plus
    // petit que le corps, et une hauteur unique pour toutes les rangees decalait
    // celles du dessous.
    const titreTaille = geometry.titleFontSize ?? geometry.fontSize;
    const titreInterligne = geometry.titleLineHeight ?? lineHeight;
    const rangees = [
      ...(geometry.titleLines ?? (showTitle && title ? [title] : []))
        .filter(Boolean).map((contenu) => ({
          contenu, gras: true, taille: titreTaille, interligne: titreInterligne,
        })),
      ...geometry.lines.filter(Boolean).map((contenu) => ({
        contenu, gras: false, taille: geometry.fontSize, interligne: lineHeight,
      })),
      ...extraText.filter(Boolean).map((contenu) => ({
        contenu, gras: false, taille: geometry.fontSize, interligne: lineHeight,
      })),
    ];

    // L'épaisseur occupée n'est pas l'épaisseur réservée : la dernière rangée
    // descend d'une hauteur de police sous son origine, pas d'un interligne.
    // Centrer sur la valeur réservée décalait le bloc d'un demi-interligne.
    const occupee = rangees.length > 0
      ? rangees.reduce((total, r) => total + r.interligne, 0) - rangees[rangees.length - 1].interligne
        + rangees[rangees.length - 1].taille
      : 0;
    const travers = Math.max(0, (thickness - occupee) / 2);

    ctx.save();
    if (geometry.textSens === 'antihoraire') {
      // Sens inverse : après une rotation de +90°, (x, y) devient (-y, x). Les
      // rangées s'empilent vers la gauche, d'où l'ancrage au bord droit du bloc.
      ctx.translate(blockLeft + thickness - travers, geometry.textTop);
      ctx.rotate(Math.PI / 2);
    } else {
      // Sens ordinaire : après une rotation de -90°, (x, y) devient (y, -x).
      // Les rangées s'empilent vers la droite, et le texte va vers le haut.
      ctx.translate(blockLeft + travers, geometry.textTop + bandLength);
      ctx.rotate(-Math.PI / 2);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Chaque ligne occupe sa propre rangée : dans le repère tourné, `x` avance
    // le long de la bande et `y` empile les lignes. Les écrire bout à bout sur
    // un même `x` cumulait leurs longueurs et faisait dépasser le texte, qui
    // remontait alors par-dessus le QR Code.
    let rangee = 0;
    for (const { contenu, gras, taille, interligne } of rangees) {
      ctx.font = `${gras ? 'bold ' : ''}${taille}px ${fontFamily}`;
      // La longueur occupée est mesurée, jamais supposée : `fillText` condense
      // un texte trop long, et centrer sur une longueur fausse décalerait le
      // bloc dans un sens sans décaler l'autre.
      const largeur = Math.min(ctx.measureText(contenu).width, bandLength);
      ctx.fillText(
        contenu,
        Math.max(0, (bandLength - largeur) / 2),
        rangee,
        bandLength,
      );
      rangee += interligne;
    }

    ctx.restore();
    return geometry;
  }

  ctx.textAlign = lateral ? 'left' : 'center';

  let y = geometry.textTop;
  // Le titre a sa **propre** taille depuis que l'interface l'offre : l'écrire à
  // celle du corps rendait le réglage sans effet visible.
  const titreTaille = geometry.titleFontSize ?? geometry.fontSize;
  const titreInterligne = geometry.titleLineHeight ?? geometry.lineHeight;
  ctx.font = `bold ${titreTaille}px ${fontFamily}`;
  // Le titre peut occuper plusieurs lignes : il est découpé par l'appelant, qui
  // seul connaît la largeur utile. `titleLines` prime sur `title`.
  const titreLignes = Array.isArray(options.titleLines) && options.titleLines.length > 0
    ? options.titleLines
    : (showTitle && title ? [title] : []);
  for (const ligne of titreLignes) {
    ctx.fillText(ligne, textX, y, maxWidth);
    y += titreInterligne;
  }

  ctx.font = `${geometry.fontSize}px ${fontFamily}`;
  for (const line of geometry.lines) {
    ctx.fillText(line, textX, y, maxWidth);
    y += geometry.lineHeight;
  }

  if (showHost) {
    ctx.font = `${Math.round(geometry.fontSize * 0.9)}px ${fontFamily}`;
    ctx.fillText(hostOf(options.url ?? ''), textX, y, maxWidth);
    y += geometry.lineHeight;
  }

  // Les lignes supplémentaires viennent en dernier : la date se lit comme une
  // mention, sous l'information principale.
  for (const line of extraText) {
    if (!line) continue;
    ctx.fillText(line, textX, y, maxWidth);
    y += geometry.lineHeight;
  }

  return geometry;
}

/**
 * Convertit une longueur en millimètres vers des pixels.
 * @param {number} mm
 * @param {number} dpi
 * @returns {number}
 */
function mmToPx(mm, dpi) {
  return Math.round((mm / 25.4) * dpi);
}

/**
 * Convertit des pixels vers des millimètres.
 * @param {number} px
 * @param {number} dpi
 * @returns {number}
 */
function pxToMm(px, dpi) {
  return (px / dpi) * 25.4;
}

/**
 * Vérifie qu'un QR Code restera imprimable et lisible.
 *
 * Deux causes d'échec, dans cet ordre :
 * 1. le QR Code déborde de la largeur utile — l'URL est trop longue pour cette
 *    étiquette, aucune mise à l'échelle ne peut le sauver ;
 * 2. la densité est insuffisante (moins de 2 px par module), cas que
 *    `computeLabelGeometry` évite normalement via `minScale`, mais qui peut
 *    survenir si l'appelant a forcé `minScale: 1`.
 *
 * @param {LabelGeometry} geometry
 * @param {{ minPxPerModule?: number }} [options]
 * @returns {{ ok: boolean, pxPerModule: number, reason?: string }}
 */
function checkQrLegibility(geometry, options = {}) {
  const minPx = options.minPxPerModule ?? MIN_QR_SCALE;
  const pxPerModule = geometry.qrSize / geometry.qrMatrix.size;

  if (geometry.fits === false) {
    return {
      ok: false,
      pxPerModule,
      reason: t(
        "URL trop longue : le QR Code fait {size} px pour {width} px de large. Raccourcissez l'URL ou utilisez une étiquette plus large.",
        { size: geometry.qrSize, width: geometry.width },
      ),
    };
  }
  if (pxPerModule < minPx) {
    return {
      ok: false,
      pxPerModule,
      reason: t(
        "QR Code trop dense : {px} px par module (minimum {min}). Raccourcissez l'URL ou augmentez la largeur de l'étiquette.",
        { px: pxPerModule.toFixed(2), min: minPx },
      ),
    };
  }
  return { ok: true, pxPerModule };
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/raster.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Conversion d'une image en bitmap monochrome pour tête thermique.
 *
 * Les têtes Niimbot attendent un flux de lignes, 1 bit par pixel, poids fort
 * en premier, 1 = noir, chaque ligne complétée à l'octet. Ce module fait cette
 * conversion depuis un `ImageData` de canvas, ce qui permet d'imprimer une
 * étiquette composée (QR Code + texte) et pas seulement un QR Code nu.
 *
 * La fonction est pure : elle ne dépend que de son entrée, donc testable hors
 * navigateur.
 */

/**
 * @typedef {Object} MonoBitmap
 * @property {number} width       Largeur en pixels.
 * @property {number} height      Hauteur en pixels.
 * @property {number} bytesPerRow Octets par ligne, largeur complétée à l'octet.
 * @property {Uint8Array[]} rows  Une entrée par ligne.
 */

/**
 * Convertit des données RGBA en bitmap monochrome.
 *
 * @param {{ data: Uint8ClampedArray|Uint8Array, width: number, height: number }} imageData
 * @param {{
 *   threshold?: number,
 *   invert?: boolean,
 *   paddingByte?: number,
 * }} [options]
 *   `threshold` : luminance (0-255) en dessous de laquelle un pixel est noir.
 *   `invert` : à activer si la source est claire sur fond sombre.
 * @returns {MonoBitmap}
 * @throws {TypeError} si les dimensions sont incohérentes avec les données.
 */
function imageDataToMono(imageData, options = {}) {
  if (!imageData || typeof imageData.width !== 'number' || typeof imageData.height !== 'number') {
    throw new TypeError('imageData doit exposer width et height');
  }
  const { data } = imageData;
  const { width, height } = imageData;

  if (!data || data.length < width * height * 4) {
    throw new TypeError(
      `données insuffisantes : ${data?.length ?? 0} octets pour ${width} × ${height} pixels RGBA`,
    );
  }

  const threshold = Number.isFinite(options.threshold) ? options.threshold : 128;
  const invert = Boolean(options.invert);
  const paddingByte = options.paddingByte ?? 0;
  const bytesPerRow = Math.ceil(width / 8);
  const rows = [];

  for (let y = 0; y < height; y++) {
    const row = new Uint8Array(bytesPerRow);
    if (paddingByte !== 0 && width % 8 !== 0) row.fill(paddingByte);

    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const alpha = data[offset + 3];

      // Un pixel transparent est traité comme blanc : sinon une étiquette
      // composée sur canvas transparent sortirait entièrement noire.
      let dark;
      if (alpha === 0) {
        dark = false;
      } else {
        const luminance =
          0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2];
        dark = luminance < threshold;
      }
      if (invert) dark = !dark;
      if (dark) row[x >> 3] |= 0x80 >> (x & 7);
    }

    rows.push(row);
  }

  return { width, height, bytesPerRow, rows };
}

/**
 * Vérifie qu'un bitmap respecte les contraintes d'une tête d'impression.
 *
 * @param {MonoBitmap} bitmap
 * @param {{ printheadPixels: number, maxHeightPx?: number }} profile
 * @returns {{ ok: boolean, reasons: string[] }}
 */
function validateBitmap(bitmap, profile) {
  const reasons = [];

  if (bitmap.width > profile.printheadPixels) {
    reasons.push(
      `largeur ${bitmap.width} px supérieure à la tête (${profile.printheadPixels} px) : ` +
      'le surplus serait rogné sans erreur',
    );
  }
  if (bitmap.bytesPerRow !== Math.ceil(bitmap.width / 8)) {
    reasons.push(
      `bytesPerRow incohérent : ${bitmap.bytesPerRow} au lieu de ${Math.ceil(bitmap.width / 8)}`,
    );
  }
  if (bitmap.rows.length !== bitmap.height) {
    reasons.push(`${bitmap.rows.length} lignes fournies pour une hauteur de ${bitmap.height}`);
  }
  for (const row of bitmap.rows) {
    if (row.length !== bitmap.bytesPerRow) {
      reasons.push('au moins une ligne n\'a pas la longueur annoncée');
      break;
    }
  }
  if (profile.maxHeightPx && bitmap.height > profile.maxHeightPx) {
    reasons.push(
      `hauteur ${bitmap.height} px supérieure au maximum du profil (${profile.maxHeightPx} px)`,
    );
  }

  return { ok: reasons.length === 0, reasons };
}

/**
 * Réduit un bitmap à la largeur de tête en le rognant par la droite.
 *
 * Utile quand la source est légèrement trop large : mieux vaut rogner
 * explicitement et le signaler que laisser l'imprimante le faire en silence.
 *
 * @param {MonoBitmap} bitmap
 * @param {number} maxWidth
 * @returns {MonoBitmap}
 */
function cropBitmap(bitmap, maxWidth) {
  if (bitmap.width <= maxWidth) return bitmap;

  const width = Math.max(1, Math.trunc(maxWidth));
  const bytesPerRow = Math.ceil(width / 8);
  const rows = bitmap.rows.map((row) => {
    const cropped = new Uint8Array(bytesPerRow);
    for (let x = 0; x < width; x++) {
      if (row[x >> 3] & (0x80 >> (x & 7))) cropped[x >> 3] |= 0x80 >> (x & 7);
    }
    return cropped;
  });

  return { width, height: bitmap.height, bytesPerRow, rows };
}

/**
 * Fait pivoter un bitmap monochrome d'un quart de tour.
 *
 * Sert à rattraper une étiquette qui sort dans le mauvais sens. Les têtes
 * thermiques impriment ligne par ligne dans le sens du défilement : selon le
 * rouleau et le modèle, la même image peut sortir à l'endroit, pivotée, ou à
 * l'envers. Plutôt que de le deviner une fois pour toutes, on laisse le choix —
 * et le profil garde sa valeur par défaut.
 *
 * La rotation est un quart de tour dans le sens des aiguilles d'une montre :
 * `turns = 1` met la première colonne en première ligne.
 *
 * @param {import('./raster.js').MonoBitmap} bitmap
 * @param {number} turns Nombre de quarts de tour (0 à 3, ou négatif).
 * @returns {import('./raster.js').MonoBitmap} nouveau bitmap ; l'entrée n'est pas modifiée.
 * @throws {TypeError} si le bitmap est inexploitable.
 */
function rotateBitmap(bitmap, turns = 0) {
  if (!bitmap || !Number.isFinite(bitmap.width) || !Number.isFinite(bitmap.height)) {
    throw new TypeError('rotateBitmap exige un bitmap avec width et height');
  }
  if (!Array.isArray(bitmap.rows) || bitmap.rows.length !== bitmap.height) {
    throw new TypeError('rotateBitmap : lignes incohérentes avec la hauteur');
  }

  // Un tour complet ne change rien : on évite une copie inutile.
  const quarter = ((Math.trunc(turns) % 4) + 4) % 4;
  if (quarter === 0) {
    return {
      width: bitmap.width,
      height: bitmap.height,
      bytesPerRow: bitmap.bytesPerRow,
      rows: bitmap.rows.map((row) => Uint8Array.from(row)),
    };
  }

  const swapped = quarter === 1 || quarter === 3;
  const width = swapped ? bitmap.height : bitmap.width;
  const height = swapped ? bitmap.width : bitmap.height;
  const bytesPerRow = Math.ceil(width / 8);
  const rows = [];

  /** Lit un bit du bitmap d'origine : 1 = noir. */
  const bitAt = (x, y) => (bitmap.rows[y][x >> 3] & (0x80 >> (x & 7))) !== 0;

  for (let y = 0; y < height; y++) {
    const row = new Uint8Array(bytesPerRow);
    for (let x = 0; x < width; x++) {
      // Correspondance inverse : d'où vient ce pixel dans l'image d'origine.
      let sourceX;
      let sourceY;
      if (quarter === 1) {
        sourceX = y;
        sourceY = bitmap.height - 1 - x;
      } else if (quarter === 2) {
        sourceX = bitmap.width - 1 - x;
        sourceY = bitmap.height - 1 - y;
      } else {
        sourceX = bitmap.width - 1 - y;
        sourceY = x;
      }

      if (sourceX >= 0 && sourceX < bitmap.width && sourceY >= 0 && sourceY < bitmap.height
        && bitAt(sourceX, sourceY)) {
        row[x >> 3] |= 0x80 >> (x & 7);
      }
    }
    rows.push(row);
  }

  return { width, height, bytesPerRow, rows };
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/sheet.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Géométrie des planches d'impression.
 *
 * Calcule où tombe chaque étiquette sur une feuille (A4 le plus souvent), en
 * millimètres. Le rendu s'appuie ensuite sur ces positions : c'est ce qui
 * permet d'imprimer sur une planche d'étiquettes autocollantes sans décalage
 * cumulatif, contrairement à une grille CSS dont les arrondis dérivent.
 */




/** Dimensions des formats papier courants, en millimètres. */
const PAGE_SIZES = Object.freeze({
  a4: { widthMm: 210, heightMm: 297, label: 'A4 (210 × 297 mm)' },
  a5: { widthMm: 148, heightMm: 210, label: 'A5 (148 × 210 mm)' },
  letter: { widthMm: 215.9, heightMm: 279.4, label: 'Letter (8,5 × 11 po)' },
});

/**
 * Familles de dispositions, dans l'ordre d'affichage.
 *
 * Le regroupement n'est pas cosmétique : une planche générique se règle à la
 * main, une planche Avery se choisit par sa référence imprimée sur l'emballage.
 * Ce ne sont pas les mêmes gestes.
 */
const SHEET_GROUPS = Object.freeze([
  { id: 'generic', label: 'Dispositions génériques' },
  { id: 'avery-a4', label: 'Avery — A4' },
  { id: 'avery-letter', label: 'Avery — Letter (US)' },
]);

/**
 * Dispositions d'étiquettes.
 *
 * **`marginXMm` et `marginYMm` sont les distances du bord gauche et du bord
 * haut au coin de la première étiquette** — pas des marges symétriques. C'est
 * ainsi que les fabricants publient leurs cotes, et c'est la seule convention
 * qui décrive une planche réelle : sur une L7160, il y a 8,6 mm à gauche et
 * 5,1 mm à droite. Un modèle symétrique perdrait une colonne entière.
 *
 * Les dispositions génériques sont des points de départ géométriquement
 * valides, et **leur écart est le même dans les deux sens** : c'est ce qui se
 * voit sur une planche, et rien ne l'imposait — aucune référence du commerce ne
 * les définit. L'écart unique et la marge unique se déduisent alors de la page
 * et de la grille : `n` colonnes de largeur `w`, `r` rangées de hauteur `h`,
 * `g` d'écart partout et `m` de marge partout donnent
 * `2g + 2m = W - n·w` et `r·g + 2m = H - r·h` — deux équations, deux inconnues,
 * une seule solution. Elle n'existe que si la marge reste positive : pour
 * `a4-qr-3x4` (60 mm de haut, quatre rangées), elle vaut −12 mm, et l'écart y
 * est donc égal sans que les marges puissent l'être.
 *
 * Les dispositions `avery-*`, elles, gardent leurs cotes : sur une planche
 * prédécoupée, l'écart vertical vaut zéro parce que les rangées se touchent, et
 * l'égaliser décalerait les étiquettes par rapport au papier. Les dispositions `avery-*` reproduisent les cotes publiées pour ces
 * références : largeur et hauteur d'étiquette, marge haute et gauche, et pas
 * horizontal et vertical. `declaredColumns` et `declaredRows` portent le nombre
 * d'étiquettes annoncé pour cette référence, et servent aux tests, qui le
 * **confrontent à la géométrie** : un préréglage qui ne place pas le nombre
 * annoncé est un préréglage faux. Les appeler `columns`/`rows` serait un piège :
 * `computeSheet` y verrait une grille explicite à honorer telle quelle, et le
 * test deviendrait circulaire.
 *
 * Source des cotes commerciales : les fiches de gabarit publiées pour ces
 * références (voir `test/sheet.test.js`, qui vérifie que la grille calculée
 * correspond au nombre d'étiquettes par feuille annoncé). Une planche
 * autocollante reste sensible au passage papier de chaque imprimante : les
 * décalages `offsetXMm` / `offsetYMm` servent à corriger ce qui reste.
 */
/**
 * La disposition proposée d'emblée.
 *
 * **3 × 4 sur une A4**, et non 3 × 8 : huit rangées ne laissent que 33,9 mm de
 * haut, où le QR Code et deux lignes de texte se disputent la place — chaque
 * réglage en corrige un autre, et l'étiquette finit par être coupée. Quatre
 * rangées donnent 69,1 mm : le QR Code tient à sa taille lisible et le texte
 * garde ses lignes. Moins d'étiquettes par page, mais des étiquettes qui
 * s'impriment.
 */
const DEFAULT_SHEET_PRESET = 'a4-3x4';

const SHEET_PRESETS = Object.freeze({
  // --- Dispositions génériques ---------------------------------------------
  'a4-3x4': {
    label: 'A4 — 3 × 4 (63,5 × 69,1 mm)',
    group: 'generic',
    page: 'a4',
    declaredColumns: 3,
    declaredRows: 4,
    labelWidthMm: 63.5,
    labelHeightMm: 69.06,
    marginXMm: 8.5,
    marginYMm: 8.5,
    gapXMm: 1.25,
    gapYMm: 1.25,
  },
  'a4-3x8': {
    label: 'A4 — 3 × 8 (63,5 × 33,9 mm)',
    group: 'generic',
    page: 'a4',
    declaredColumns: 3,
    declaredRows: 8,
    labelWidthMm: 63.5,
    labelHeightMm: 33.9,
    marginXMm: 8.5,
    marginYMm: 8.5,
    gapXMm: 1.25,
    gapYMm: 1.25,
  },
  'a4-2x7': {
    label: 'A4 — 2 × 7 (99,1 × 38,1 mm)',
    group: 'generic',
    page: 'a4',
    declaredColumns: 2,
    declaredRows: 7,
    labelWidthMm: 99.1,
    labelHeightMm: 38.1,
    marginXMm: 4.05,
    marginYMm: 4.05,
    gapXMm: 3.7,
    gapYMm: 3.7,
  },
  'a4-4x10': {
    label: 'A4 — 4 × 10 (48 × 25 mm)',
    group: 'generic',
    page: 'a4',
    declaredColumns: 4,
    declaredRows: 10,
    labelWidthMm: 48,
    labelHeightMm: 25,
    marginXMm: 1.75,
    marginYMm: 1.75,
    gapXMm: 4.8,
    gapYMm: 4.8,
  },
  'a4-qr-3x4': {
    label: 'A4 — 3 × 4 grandes étiquettes QR Code (60 × 60 mm)',
    group: 'generic',
    page: 'a4',
    declaredColumns: 3,
    declaredRows: 4,
    labelWidthMm: 60,
    labelHeightMm: 60,
    marginXMm: 10,
    marginYMm: 21,
    gapXMm: 5,
    gapYMm: 5,
  },

  // --- Avery A4 -------------------------------------------------------------
  // Le pas horizontal vaut 66,4 mm pour 63,5 mm d'étiquette : 2,9 mm d'écart.
  'avery-l7160': {
    label: 'Avery L7160 — 3 × 7 (63,5 × 38,1 mm)',
    group: 'avery-a4',
    reference: 'L7160',
    page: 'a4',
    declaredColumns: 3,
    declaredRows: 7,
    labelWidthMm: 63.5,
    labelHeightMm: 38.1,
    marginXMm: 8.6,
    marginYMm: 15.1,
    gapXMm: 2.9,
    gapYMm: 0,
  },
  'avery-l7159': {
    label: 'Avery L7159 — 3 × 8 (63,5 × 33,9 mm)',
    group: 'avery-a4',
    reference: 'L7159',
    page: 'a4',
    declaredColumns: 3,
    declaredRows: 8,
    labelWidthMm: 63.5,
    labelHeightMm: 33.9,
    marginXMm: 8.6,
    marginYMm: 13.1,
    gapXMm: 2.9,
    gapYMm: 0,
  },
  'avery-l7162': {
    label: 'Avery L7162 — 2 × 8 (99,1 × 33,9 mm)',
    group: 'avery-a4',
    reference: 'L7162',
    page: 'a4',
    declaredColumns: 2,
    declaredRows: 8,
    labelWidthMm: 99.1,
    labelHeightMm: 33.9,
    marginXMm: 6.1,
    marginYMm: 13,
    gapXMm: 2.9,
    gapYMm: 0,
  },
  'avery-l7163': {
    label: 'Avery L7163 — 2 × 7 (99,1 × 38,1 mm)',
    group: 'avery-a4',
    reference: 'L7163',
    page: 'a4',
    declaredColumns: 2,
    declaredRows: 7,
    labelWidthMm: 99.1,
    labelHeightMm: 38.1,
    marginXMm: 6.1,
    marginYMm: 15.1,
    gapXMm: 2.9,
    gapYMm: 0,
  },
  'zweckform-3475': {
    label: 'Avery Zweckform 3475 — 3 × 8 (70 × 36 mm)',
    group: 'avery-a4',
    reference: '3475',
    page: 'a4',
    declaredColumns: 3,
    declaredRows: 8,
    // 3 × 70 mm = 210 mm : cette planche occupe toute la largeur, sans marge
    // horizontale ni écart entre colonnes.
    labelWidthMm: 70,
    labelHeightMm: 36,
    marginXMm: 0,
    marginYMm: 4.5,
    gapXMm: 0,
    gapYMm: 0,
  },

  // --- Avery Letter (US) ----------------------------------------------------
  // Références historiques 5160 / 5162 / 5163, vendues aussi sous 8160 / 8162 /
  // 8163 : mêmes cotes, seule la découpe diffère.
  'avery-5160': {
    label: 'Avery 5160 / 8160 — 3 × 10 (66,7 × 25,4 mm)',
    group: 'avery-letter',
    reference: '5160',
    page: 'letter',
    declaredColumns: 3,
    declaredRows: 10,
    labelWidthMm: 66.7,
    labelHeightMm: 25.4,
    marginXMm: 4.8,
    marginYMm: 12.7,
    gapXMm: 3.1,
    gapYMm: 0,
  },
  'avery-5162': {
    label: 'Avery 5162 / 8162 — 2 × 7 (101,6 × 33,9 mm)',
    group: 'avery-letter',
    reference: '5162',
    page: 'letter',
    declaredColumns: 2,
    declaredRows: 7,
    labelWidthMm: 101.6,
    labelHeightMm: 33.9,
    marginXMm: 4,
    marginYMm: 21.2,
    gapXMm: 4.8,
    gapYMm: 0,
  },
  'avery-5163': {
    label: 'Avery 5163 / 8163 — 2 × 5 (101,6 × 50,8 mm)',
    group: 'avery-letter',
    reference: '5163',
    page: 'letter',
    declaredColumns: 2,
    declaredRows: 5,
    labelWidthMm: 101.6,
    labelHeightMm: 50.8,
    marginXMm: 4,
    marginYMm: 12.7,
    gapXMm: 4.8,
    gapYMm: 0,
  },
  'avery-6871': {
    label: 'Avery 6871 — 3 × 6 (60,3 × 31,8 mm)',
    group: 'avery-letter',
    reference: '6871',
    page: 'letter',
    declaredColumns: 3,
    declaredRows: 6,
    // Ici le pas vertical (38,1 mm) dépasse la hauteur d'étiquette : la planche
    // laisse 6,3 mm entre deux rangées.
    labelWidthMm: 60.3,
    labelHeightMm: 31.8,
    marginXMm: 9.5,
    marginYMm: 27.6,
    gapXMm: 8,
    gapYMm: 6.3,
  },
});

/**
 * @typedef {Object} SheetCell
 * @property {number} index  Index global de l'étiquette (0-based).
 * @property {number} page   Numéro de page (0-based).
 * @property {number} column Colonne dans la page (0-based).
 * @property {number} row    Rangée dans la page (0-based).
 * @property {number} xMm    Abscisse du coin supérieur gauche.
 * @property {number} yMm    Ordonnée du coin supérieur gauche.
 */

/**
 * @typedef {Object} SheetLayout
 * @property {number} pageWidthMm
 * @property {number} pageHeightMm
 * @property {number} labelWidthMm
 * @property {number} labelHeightMm
 * @property {number} marginXMm  Marge à gauche de la grille, en millimètres.
 * @property {number} marginYMm  Marge au-dessus de la grille.
 * @property {number} columns
 * @property {number} rows
 * @property {number} perPage
 * @property {number} pages
 * @property {number} count
 * @property {number} capacity
 * @property {number} offsetXMm  Décalage appliqué à toute la grille.
 * @property {number} offsetYMm
 * @property {SheetCell[]} cells
 * @property {string[]} warnings
 */

/**
 * Hauteur de la bande d'en-tête d'une planche, en millimètres.
 *
 * 12 pt de titre — environ 4,2 mm — plus 4 mm de respiration au-dessous : les
 * valeurs qu'emploie déjà la page du tableau (`.print-page__title` et
 * `.print-page__spacer`). Exportée pour que le contrôle de place et le dessin
 * partent du même nombre. Une seconde valeur écrite dans la feuille de style
 * finirait par diverger, et l'en-tête mordrait sur la première rangée
 * d'étiquettes sans que rien ne le signale.
 */
const SHEET_HEADER_MM = 9;

/**
 * L'en-tête de page tient-il dans la marge du haut ?
 *
 * L'en-tête vit **dans la marge du haut**, comme celui du tableau : les
 * étiquettes ne bougent pas. C'est une contrainte de cette planche-ci, où les
 * cellules sont positionnées en absolu — les déplacer pour faire de la place
 * changerait toutes les cotes calculées, donc la taille des étiquettes, en
 * fonction d'une case à cocher.
 *
 * Une marge plus courte que la bande ferait recouvrir la première rangée. C'est
 * pire qu'une absence, et c'est refusé avec ses chiffres, comme partout ailleurs
 * dans ce produit.
 *
 * @param {{ marginYMm?: number }} options
 * @returns {{ fits: boolean, needed: number, reason: string }}
 */
function sheetHeaderFits(options = {}) {
  const marge = nonNegative(options.marginYMm ?? 0);
  if (marge >= SHEET_HEADER_MM) {
    return { fits: true, needed: SHEET_HEADER_MM, reason: '' };
  }
  return {
    fits: false,
    needed: SHEET_HEADER_MM,
    reason: t(
      "L'en-tête a besoin de {need} mm de marge en haut, et la marge actuelle est de {margin} mm. "
      + "Augmentez la marge, ou décochez l'en-tête.",
      { need: SHEET_HEADER_MM, margin: round1(marge) },
    ),
  };
}

/**
 * Ce qui s'imprime sous le QR Code d'une planche.
 *
 * Quatre états, dont deux n'étaient pas atteignables auparavant : le titre
 * s'imprimait **toujours** quand il existait, et il n'y avait aucun moyen
 * d'obtenir l'URL seule, ni aucune ligne de texte.
 *
 * | titre | URL | résultat |
 * |---|---|---|
 * | coché | décoché | le titre ; l'URL prend sa place s'il n'y en a pas |
 * | coché | coché | « titre URL » |
 * | décoché | coché | l'URL seule |
 * | décoché | décoché | rien : le QR Code occupe toute l'étiquette |
 *
 * Le repli sur l'URL quand le titre est demandé mais absent n'est pas un détail :
 * une étiquette sans aucun texte ne dit plus ce qu'elle désigne, et c'est le
 * comportement d'origine — on le conserve.
 *
 * Pure, et appelée aux **deux** endroits qui doivent s'accorder : le calcul du
 * nombre de lignes réservées et le rendu de la cellule. Deux expressions
 * séparées auraient réservé un nombre de lignes qui ne correspondait pas au
 * texte réellement écrit, et le QR Code aurait rogné le texte ou laissé un vide.
 *
 * @param {{ title?: string, url?: string }} link
 * @param {{ title?: boolean, url?: boolean }} [options] `title` est vrai par
 *   défaut : c'est l'ancien comportement, et l'absence d'option ne doit pas
 *   changer ce qui s'imprime.
 * @returns {string}
 */
function sheetCellBlocks(link, options = {}) {
  const veutTitre = options.title !== false;
  const veutUrl = options.url === true;
  const titre = typeof link?.title === 'string' ? link.title.trim() : '';
  const url = typeof link?.url === 'string' ? link.url : '';

  /** @type {Array<{ kind: 'title'|'url'|'index'|'date', text: string }>} */
  const blocs = [];
  // **Le titre est un bloc, l'URL en est un autre.** Ils étaient concaténés en
  // une seule chaîne, puis repliés ensemble : l'URL commençait donc au bout de
  // la dernière ligne du titre, les deux se partageaient des lignes, et c'était
  // le **titre** qui se faisait couper — la partie lisible par un humain, alors
  // que l'adresse, elle, est faite pour être scannée. Deux blocs, chacun replié
  // pour lui-même, et le budget de lignes donné au titre d'abord.
  if (veutTitre && titre !== '') blocs.push({ kind: 'title', text: titre });
  // L'URL s'écrit quand elle est demandée — et **aussi** quand le titre est vide
  // et qu'il n'y a donc rien d'autre : une étiquette sans aucun texte ne dirait
  // plus ce qu'elle désigne. C'est le comportement d'origine, conservé.
  if (url !== '' && (veutUrl || (veutTitre && titre === ''))) {
    blocs.push({ kind: 'url', text: url });
  }
  return blocs;
}

/**
 * Calcule la disposition d'une planche.
 *
 * `marginXMm` et `marginYMm` situent le coin de la **première** étiquette par
 * rapport aux bords gauche et haut. La place restante à droite et en bas est ce
 * qu'elle est : c'est ainsi que se décrit une planche réelle.
 *
 * `offsetXMm` et `offsetYMm` déplacent toute la grille sans changer sa forme.
 * Ils servent à rattraper le décalage d'entraînement d'une imprimante donnée —
 * le seul écart qu'aucune cote de fabricant ne peut prévoir.
 *
 * `adviseDenser` (vrai par défaut) émet un avertissement quand une bande
 * inutilisée à droite laisse penser qu'une colonne de plus tiendrait. Utile
 * quand on ajuste une disposition à la main ; à couper quand la grille a été
 * **calculée pour remplir la feuille** : l'espace restant est alors la marge
 * demandée, pas une place perdue, et l'avertissement serait du bruit.
 *
 * `columns` et `rows` rendent la grille **explicite** au lieu de la déduire des
 * cotes. C'est le cas de « remplir la feuille », où l'utilisateur choisit le
 * nombre de colonnes et de rangées et où la taille des étiquettes en découle :
 * déduire ensuite le nombre de colonnes de la taille qu'on vient de calculer
 * donnait un résultat absurde — 31 rangées pour une demande de 30, parce que la
 * zone utile va du coin de la première étiquette au bord de la feuille. Une
 * grille explicite est honorée, et signalée si elle ne tient pas.
 *
 * @param {{
 *   count: number,
 *   page?: keyof typeof PAGE_SIZES,
 *   pageWidthMm?: number,
 *   pageHeightMm?: number,
 *   labelWidthMm: number,
 *   labelHeightMm: number,
 *   marginXMm?: number,
 *   marginYMm?: number,
 *   gapXMm?: number,
 *   gapYMm?: number,
 *   offsetXMm?: number,
 *   offsetYMm?: number,
 *   adviseDenser?: boolean,
 *   columns?: number,
 *   rows?: number,
 * }} options
 * @returns {SheetLayout}
 * @throws {TypeError} si les dimensions sont inutilisables.
 */
function computeSheet(options) {
  const preset = options.page ? PAGE_SIZES[options.page] : undefined;
  const pageWidthMm = options.pageWidthMm ?? preset?.widthMm ?? PAGE_SIZES.a4.widthMm;
  const pageHeightMm = options.pageHeightMm ?? preset?.heightMm ?? PAGE_SIZES.a4.heightMm;

  const labelWidthMm = positive(options.labelWidthMm, 'labelWidthMm');
  const labelHeightMm = positive(options.labelHeightMm, 'labelHeightMm');
  const marginXMm = nonNegative(options.marginXMm ?? 10);
  const marginYMm = nonNegative(options.marginYMm ?? 10);
  const gapXMm = nonNegative(options.gapXMm ?? 0);
  const gapYMm = nonNegative(options.gapYMm ?? 0);
  const offsetXMm = Number.isFinite(options.offsetXMm) ? options.offsetXMm : 0;
  const offsetYMm = Number.isFinite(options.offsetYMm) ? options.offsetYMm : 0;
  // Un compte non fini produirait `pages: NaN` et un « NaN page » à l'écran :
  // on le ramène à zéro plutôt que de laisser la valeur se propager.
  const requested = Number.isFinite(options.count) ? options.count : 0;
  const count = Math.max(0, Math.trunc(requested));

  // La zone utile part du coin de la première étiquette jusqu'au bord de la
  // feuille : la marge de droite et du bas n'est pas imposée.
  const usableWidth = pageWidthMm - marginXMm;
  const usableHeight = pageHeightMm - marginYMm;

  // Les cotes sont décimales : « 297 - 2 × 15,15 » vaut 266,69999999999993 en
  // flottant, et la division tombe alors juste sous l'entier attendu. Sans
  // tolérance, une planche prévue pour 7 rangées n'en placerait que 6.
  // L'epsilon reste très inférieur à toute imprécision d'impression.
  const EPSILON = 1e-9;
  const fittingColumns = Math.max(
    0,
    Math.floor((usableWidth + gapXMm) / (labelWidthMm + gapXMm) + EPSILON),
  );
  const fittingRows = Math.max(
    0,
    Math.floor((usableHeight + gapYMm) / (labelHeightMm + gapYMm) + EPSILON),
  );

  // Une grille explicite est une consigne, pas une suggestion : on la respecte
  // telle quelle, quitte à prévenir si elle déborde.
  const askedColumns = Number.isFinite(options.columns)
    ? Math.max(0, Math.trunc(options.columns))
    : null;
  const askedRows = Number.isFinite(options.rows)
    ? Math.max(0, Math.trunc(options.rows))
    : null;
  const columns = askedColumns ?? fittingColumns;
  const rows = askedRows ?? fittingRows;
  const explicit = askedColumns !== null || askedRows !== null;

  const warnings = [];
  if (columns > fittingColumns || rows > fittingRows) {
    warnings.push(
      `La grille demandée (${columns} × ${rows}) ne tient pas : ` +
      `${fittingColumns} × ${fittingRows} au maximum pour des étiquettes de ` +
      `${round1(labelWidthMm)} × ${round1(labelHeightMm)} mm.`,
    );
  }
  if (columns === 0 || rows === 0) {
    warnings.push(
      `Aucune étiquette ne tient sur ${round1(pageWidthMm)} × ${round1(pageHeightMm)} mm : ` +
      `une étiquette mesure ${round1(labelWidthMm)} × ${round1(labelHeightMm)} mm ` +
      `pour une zone utile de ${round1(usableWidth)} × ${round1(usableHeight)} mm.`,
    );
  } else if (!explicit && options.adviseDenser !== false) {
    // Signale le gaspillage : un demi-centimètre perdu suffit souvent à faire
    // tenir une colonne de plus.
    const slackX = usableWidth - (columns * labelWidthMm + (columns - 1) * gapXMm);
    if (slackX > labelWidthMm * 0.6) {
      warnings.push(
        `Il reste ${round1(slackX)} mm à droite de la dernière colonne : une ` +
        'colonne supplémentaire tiendrait peut-être en réduisant la marge gauche.',
      );
    }
  } else if (explicit && options.adviseDenser === true
    && (fittingColumns > columns || fittingRows > rows)) {
    warnings.push(
      `${fittingColumns} × ${fittingRows} étiquettes tiendraient sur cette ` +
      'feuille : augmentez le nombre de colonnes ou de rangées pour la remplir.',
    );
  }

  const perPage = columns * rows;
  const pages = perPage > 0 ? Math.ceil(count / perPage) : 0;
  const cells = [];

  // Aucune étiquette ne peut être placée si la grille est vide : sans cette
  // garde, `index % 0` produirait des cellules à des positions NaN.
  if (perPage > 0) {
    for (let index = 0; index < count; index++) {
      const slot = index % perPage;
      const column = slot % columns;
      const row = Math.floor(slot / columns);
      cells.push({
        index,
        page: Math.floor(index / perPage),
        column,
        row,
        xMm: round2(marginXMm + offsetXMm + column * (labelWidthMm + gapXMm)),
        yMm: round2(marginYMm + offsetYMm + row * (labelHeightMm + gapYMm)),
      });
    }
  }

  return {
    pageWidthMm,
    pageHeightMm,
    labelWidthMm,
    labelHeightMm,
    // Les marges sont rendues avec le reste.
    //
    // Elles manquaient, et leur absence ne se voyait pas : les positions des
    // cellules les contiennent déjà. Mais un appelant qui veut savoir où
    // **commence** la grille — l'en-tête de page, par exemple — n'avait aucun
    // moyen de les retrouver, sinon en défaisant le calcul de la première
    // cellule. La première version de l'en-tête lisait `layout.marginYMm`, qui
    // valait `undefined`, donc zéro, et refusait de se dessiner en annonçant une
    // marge de 0 mm alors que l'étiquette était à 15.
    marginXMm,
    marginYMm,
    columns,
    rows,
    perPage,
    pages,
    count,
    capacity: perPage * Math.max(1, pages),
    offsetXMm,
    offsetYMm,
    cells,
    warnings,
  };
}

/**
 * Répartit des éléments sur plusieurs pages.
 *
 * @template T
 * @param {T[]} items
 * @param {SheetLayout} layout
 * @returns {Array<{ page: number, items: Array<{ item: T, cell: SheetCell }> }>}
 */
function paginate(items, layout) {
  if (layout.perPage <= 0) return [];

  const pages = [];
  items.forEach((item, index) => {
    const cell = layout.cells[index];
    if (!cell) return;
    if (!pages[cell.page]) pages[cell.page] = { page: cell.page, items: [] };
    pages[cell.page].items.push({ item, cell });
  });

  return pages.filter(Boolean);
}

/**
 * Arrondit à 0,1 mm, précision suffisante pour l'impression.
 *
 * Exporté : l'interface affiche les cotes avec la même précision que le calcul,
 * et une seconde définition finirait par diverger — le concatenateur du build
 * refuse d'ailleurs deux déclarations de même nom.
 *
 * @param {number} value
 * @returns {number}
 */
function round1(value) {
  return Math.round(value * 10) / 10;
}

/** Arrondit à 0,01 mm. */
function round2(value) {
  return Math.round(value * 100) / 100;
}

function positive(value, name) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${name} doit être un nombre strictement positif`);
  }
  return value;
}

function nonNegative(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

// ---------------------------------------------------------------------------
// Contenu d'une étiquette de planche
// ---------------------------------------------------------------------------

/**
 * Garde-fou du curseur : le QR Code ne disparaît jamais.
 *
 * Ce n'est **pas** le plancher du QR Code. Le vrai plancher est ce que
 * l'imprimante peut rendre lisible — les modules de l'adresse fois
 * `MIN_MODULE_MM_PAPER` —, et il se calcule pour chaque lien : `qrRatioBounds`
 * le pose comme minimum du curseur.
 *
 * Il valait 30 % du petit côté de l'étiquette, ce qui n'a rien à voir avec la
 * lisibilité : sur une A4 3 × 8 et une adresse courte (21 modules, 8,4 mm
 * lisibles), il interdisait de descendre sous 10,2 mm, et le texte perdait une
 * ligne de place **pour rien** — un titre était coupé alors que le QR Code
 * aurait pu céder un millimètre et demi. Une proportion choisie à l'œil ne doit
 * pas limiter ce qu'on peut imprimer.
 */
const MIN_QR_RATIO = 0.05;
/** Proportion maximale : au-delà, le QR Code chasse le texte hors de l'étiquette. */
const MAX_QR_RATIO = 1;
/** Écart entre le QR Code et le texte, identique à celui de la feuille de style. */
const SHEET_QR_GAP_MM = 1.5;
/** Marge intérieure d'une étiquette de planche, pour ne pas toucher les bords. */
const SHEET_CELL_MARGIN_MM = 0.5;

/** Taille de police du texte des étiquettes de planche, en points. */
const SHEET_FONT_PT = 7;
/** Interligne, en multiple de la taille de police. */
const SHEET_LINE_SPACING = 1.15;

/**
 * Taille minimale d'un module de QR Code **sur papier**, en millimètres.
 *
 * C'est la contrainte qui manquait : un module plus petit n'est plus résolu
 * proprement par une imprimante laser ou jet d'encre, et un téléphone a du mal
 * à faire la mise au point dessus. 0,4 mm correspond à la recommandation
 * courante pour un QR Code imprimé lu à bout portant.
 */
const MIN_MODULE_MM_PAPER = 0.4;

/**
 * Taille minimale d'un module sur une **tête thermique**, en millimètres.
 *
 * Une tête Niimbot fusionne les points sous 2 pixels par module. La contrainte
 * dépend donc de la résolution, contrairement à celle du papier.
 *
 * @param {number} dpi
 * @returns {number} millimètres par module
 */
function minModuleMmThermal(dpi) {
  const resolution = Number.isFinite(dpi) && dpi > 0 ? dpi : 203;
  return (2 / resolution) * 25.4;
}

/**
 * Hauteur d'une ligne de texte d'étiquette, en millimètres.
 *
 * Dérivée de la taille de police plutôt que codée en dur : la feuille de style
 * et le calcul de mise en page doivent partir du même chiffre, sinon le texte
 * calculé ne tient plus dans la place réservée.
 *
 * @param {{ fontSizePt?: number, lineSpacing?: number }} [options]
 * @returns {{ fontSizePt: number, fontSizePx: number, lineHeightMm: number }}
 */
function sheetTextMetrics(options = {}) {
  const fontSizePt = Number.isFinite(options.fontSizePt)
    ? options.fontSizePt
    : SHEET_FONT_PT;
  const lineSpacing = Number.isFinite(options.lineSpacing)
    ? options.lineSpacing
    : SHEET_LINE_SPACING;
  const fontSizePx = (fontSizePt * 96) / 72;
  return {
    fontSizePt,
    fontSizePx,
    lineHeightMm: (fontSizePx * lineSpacing * 25.4) / 96,
  };
}

/**
 * Bornes de la proportion du QR Code dans une étiquette de planche.
 *
 * Le calcul est fait **avant** le rendu, pour que le curseur ne puisse pas
 * demander un QR Code impossible à imprimer :
 *
 * - **borne basse** : un module doit rester lisible une fois imprimé, donc le QR Code
 *   ne peut pas descendre sous `qrModules × minModuleMm`. Sur une planche papier
 *   la contrainte est physique (0,4 mm) ; sur une tête thermique elle vient de
 *   la résolution (2 px par module).
 * - **borne haute** : le QR Code est carré, il doit tenir dans la largeur **et**
 *   laisser au moins une ligne de texte sous lui.
 *
 * Quand les deux bornes se croisent, aucune valeur ne convient : l'URL est trop
 * longue pour ce format, et c'est `reason` qui le dit.
 *
 * @param {{
 *   labelWidthMm: number,
 *   labelHeightMm: number,
 *   qrModules: number,
 *   textLines?: number,
 *   marginMm?: number,
 *   gapMm?: number,
 *   fontSizePt?: number,
 *   minModuleMm?: number,
 *   minRatio?: number,
 *   maxRatio?: number,
 * }} options
 * @returns {{
 *   min: number, max: number,
 *   minSideMm: number, maxSideMm: number,
 *   minModuleMm: number,
 *   moduleMmAtMax: number,
 *   textLinesAtMin: number,
 *   fits: boolean,
 *   reason: string,
 * }}
 */
function qrRatioBounds(options) {
  const labelWidthMm = positive(options.labelWidthMm, 'labelWidthMm');
  const labelHeightMm = positive(options.labelHeightMm, 'labelHeightMm');
  const qrModules = Math.max(1, Math.trunc(options.qrModules ?? 21));
  const textLines = Math.max(0, Math.trunc(options.textLines ?? 1));
  const marginMm = nonNegative(options.marginMm ?? 0);
  const gapMm = Number.isFinite(options.gapMm) ? options.gapMm : SHEET_QR_GAP_MM;
  const floorRatio = Number.isFinite(options.minRatio) ? options.minRatio : MIN_QR_RATIO;
  const ceilingRatio = Number.isFinite(options.maxRatio) ? options.maxRatio : MAX_QR_RATIO;
  const minModuleMm = Number.isFinite(options.minModuleMm) && options.minModuleMm > 0
    ? options.minModuleMm
    : MIN_MODULE_MM_PAPER;
  const { lineHeightMm } = sheetTextMetrics({ fontSizePt: options.fontSizePt });

  const short = Math.min(labelWidthMm, labelHeightMm);
  const innerWidth = labelWidthMm - marginMm * 2;
  const innerHeight = labelHeightMm - marginMm * 2;

  const textHeight = textLines > 0 ? gapMm + textLines * lineHeightMm : 0;
  // Le QR Code est carré : la hauteur disponible est la contrainte la plus serrée
  // sur une étiquette large et basse, la largeur sur une étiquette étroite.
  const rawMaxSide = Math.min(innerWidth, innerHeight - textHeight);
  const minSideMm = qrModules * minModuleMm;

  const clampRatio = (value) => Math.round(
    Math.min(ceilingRatio, Math.max(floorRatio, value / short)) * 1000,
  ) / 1000;

  const min = clampRatio(minSideMm);
  const max = clampRatio(Math.max(0, rawMaxSide));
  const fits = rawMaxSide > 0 && minSideMm <= rawMaxSide + 1e-9;

  // **Le minimum réellement atteignable**, et non le minimum lisible : le
  // curseur ne descend pas sous `MIN_QR_RATIO`, si bien qu'une étiquette large
  // et basse peut voir son QR Code plus grand que ses modules ne l'exigent. Le
  // nombre de lignes annoncé se calcule donc sur le côté que le curseur laisse
  // vraiment atteindre.
  //
  // Ce n'est pas un détail d'arrondi : mesuré sur une A4 3 × 8 et 21 modules,
  // le calcul d'origine promettait **huit** lignes et le rendu n'en laissait que
  // **sept** — un titre était coupé alors que l'application venait d'annoncer
  // qu'il tenait.
  const minSideEffective = Math.max(minSideMm, min * short);

  // Combien de lignes de texte tiennent encore si le QR Code est au minimum ?
  const textLinesAtMin = lineHeightMm > 0
    ? Math.max(0, Math.floor((innerHeight - minSideEffective - gapMm) / lineHeightMm))
    : 0;

  let reason = '';
  if (rawMaxSide <= 0) {
    reason =
      `Une étiquette de ${round1(labelWidthMm)} × ${round1(labelHeightMm)} mm ne ` +
      'laisse aucune place à un QR Code et à une ligne de texte.';
  } else if (!fits) {
    reason =
      `URL trop longue pour cette étiquette : ${qrModules} modules à ` +
      `${round2(minModuleMm)} mm minimum demandent ${round1(minSideMm)} mm, alors que ` +
      `${round1(rawMaxSide)} mm restent disponibles. Raccourcissez l'URL, ou prenez ` +
      'une étiquette plus grande.';
  }

  return {
    min,
    max,
    minSideMm: round2(minSideMm),
    maxSideMm: round2(Math.max(0, rawMaxSide)),
    minModuleMm: round2(minModuleMm),
    moduleMmAtMax: round2(Math.max(0, rawMaxSide) / qrModules),
    textLinesAtMin,
    fits,
    reason,
  };
}

/**
 * Découpe le texte d'une étiquette et le limite aux lignes disponibles.
 *
 * Les lignes sont renvoyées explicitement plutôt que laissées au retour à la
 * ligne du navigateur : c'est ce qui garantit que le texte occupe exactement la
 * hauteur réservée par le calcul. Un texte trop long est coupé, avec des points
 * de suspension — une troncature visible vaut mieux qu'un débordement masqué.
 *
 * @param {string} text
 * @param {{
 *   measure: (text: string) => number,
 *   innerWidthPx: number,
 *   maxLines: number,
 * }} options
 * @returns {string[]}
 */
function sheetCellLines(text, options) {
  const { measure, innerWidthPx } = options;
  const maxLines = Math.max(0, Math.trunc(options.maxLines ?? 1));
  if (maxLines === 0 || !text) return [];
  if (typeof measure !== 'function') throw new TypeError('measure est requis');

  const all = wrapText(measure, text, innerWidthPx);
  if (all.length <= maxLines) return all;

  const kept = all.slice(0, maxLines);
  const last = kept[kept.length - 1];
  let trimmed = last;
  // On retire des caractères jusqu'à ce que les points de suspension tiennent.
  while (trimmed.length > 1 && measure(`${trimmed}…`) > innerWidthPx) {
    trimmed = trimmed.slice(0, -1);
  }
  kept[kept.length - 1] = `${trimmed.trimEnd()}…`;
  return kept;
}

/**
 * Côté du QR Code d'une étiquette de planche, en millimètres.
 *
 * Le QR Code est carré : il se règle donc sur le **petit** côté de l'étiquette. Sans
 * cette borne, une étiquette basse (33,9 mm de haut pour 63,5 mm de large)
 * produirait un QR Code plus haut que son support. La proportion est bornée pour
 * qu'aucune valeur d'interface ne puisse dépasser l'étiquette.
 *
 * @param {number} labelWidthMm
 * @param {number} labelHeightMm
 * @param {number} ratio  Proportion du petit côté, entre 0,3 et 1.
 * @returns {number}
 * @throws {TypeError} si une dimension n'est pas un nombre positif.
 */
/**
 * Ce qu'une étiquette de planche offre **réellement** à son texte.
 *
 * C'est la formule du budget, et elle n'existait qu'en deux exemplaires : l'un
 * dans le rendu, l'autre dans la mise en page automatique. Les deux ne disaient
 * pas la même chose — le rendu dessine le QR Code à la proportion du curseur, la
 * mise en page le supposait à son minimum lisible — et l'écart se payait en
 * texte coupé : mesuré sur 49 liens en A4 3 × 4, la mise en page promettait 8
 * lignes là où le rendu n'en laissait que 7, et **45 étiquettes** sortaient
 * tronquées, sous une grille annoncée comme « calculée pour ce contenu ».
 *
 * Une seule formule, donc, et deux appelants : le rendu y lit le nombre de
 * lignes qu'il peut écrire, la mise en page y lit celles qu'une étiquette
 * candidate offrirait.
 *
 * @param {{
 *   labelWidthMm: number,
 *   labelHeightMm: number,
 *   qrRatio?: number,
 *   fontSizePt?: number,
 *   linesHorsTexte?: number,
 *   marginMm?: number,
 *   gapMm?: number,
 * }} options
 * @returns {{
 *   sideMm: number, lineHeightMm: number, textSpaceMm: number,
 *   maxLines: number, textLines: number,
 * }}
 */
function sheetTextBudget(options) {
  const labelWidthMm = positive(options.labelWidthMm, 'labelWidthMm');
  const labelHeightMm = positive(options.labelHeightMm, 'labelHeightMm');
  const marginMm = nonNegative(options.marginMm ?? SHEET_CELL_MARGIN_MM);
  const gapMm = Number.isFinite(options.gapMm) ? options.gapMm : SHEET_QR_GAP_MM;
  const linesHorsTexte = Math.max(0, Math.trunc(options.linesHorsTexte ?? 0));

  const sideMm = qrSideMm(labelWidthMm, labelHeightMm, options.qrRatio);
  const { lineHeightMm } = sheetTextMetrics({ fontSizePt: options.fontSizePt });
  const textSpaceMm = labelHeightMm - marginMm * 2 - sideMm - gapMm;
  // La tolérance n'est pas cosmétique : la borne du QR Code est arrondie au
  // millième par `qrRatioBounds`, et cet arrondi se propage jusqu'ici. Sans elle,
  // une place calculée pour deux lignes n'en donnait qu'une — 12,978 mm pour
  // 6,493 mm d'interligne vaut 1,9989, que `floor` ramenait à 1.
  const maxLines = textSpaceMm <= 0 || !Number.isFinite(lineHeightMm)
    ? 0
    : Math.floor(textSpaceMm / lineHeightMm + 1e-3);

  return {
    sideMm,
    lineHeightMm,
    textSpaceMm,
    maxLines,
    // Le rendu écrit **toujours** une ligne, même quand le QR Code a tout pris :
    // c'est ce qui fait qu'une étiquette trop petite se voit à sa coupe, et non
    // à son silence. Le budget dit la même chose que lui.
    textLines: Math.max(1, maxLines - linesHorsTexte),
  };
}

function qrSideMm(labelWidthMm, labelHeightMm, ratio) {
  const base = Math.min(
    positive(labelWidthMm, 'labelWidthMm'),
    positive(labelHeightMm, 'labelHeightMm'),
  );
  const wanted = Number.isFinite(ratio) ? ratio : MAX_QR_RATIO;
  const clamped = Math.min(MAX_QR_RATIO, Math.max(MIN_QR_RATIO, wanted));
  return round2(base * clamped);
}

// ---------------------------------------------------------------------------
// Remplir la feuille : colonnes, rangées et marge globale
// ---------------------------------------------------------------------------

/**
 * Calcule la taille d'étiquette qui remplit une feuille pour une grille donnée.
 *
 * C'est l'inverse de `computeSheet` : au lieu de partir des cotes d'une
 * étiquette, on part du nombre de colonnes et de rangées voulu, et l'étiquette
 * prend la place restante.
 *
 * Les marges sont **par axe** (`marginXMm`, `marginYMm`) et non globales : une
 * planche du commerce a presque toujours une marge haute différente de sa marge
 * gauche, et c'est la seule façon de reproduire exactement ses cotes. Une marge
 * globale s'obtient en passant la même valeur aux deux.
 *
 * Les marges rendues peuvent différer de quelques centièmes de millimètre de
 * celles demandées : la taille d'étiquette est arrondie au centième, et l'écart
 * restant est réparti également de chaque côté. Sans cela, une étiquette
 * arrondie vers le bas ferait perdre une colonne entière à `computeSheet` —
 * c'est exactement le piège que ce calcul évite.
 *
 * @param {{
 *   pageWidthMm: number,
 *   pageHeightMm: number,
 *   columns: number,
 *   rows: number,
 *   marginMm?: number,
 *   marginXMm?: number,
 *   marginYMm?: number,
 *   gapXMm?: number,
 *   gapYMm?: number,
 *   minLabelMm?: number,
 * }} options
 * @returns {{
 *   ok: boolean,
 *   reason: string,
 *   labelWidthMm: number,
 *   labelHeightMm: number,
 *   marginXMm: number,
 *   marginYMm: number,
 *   columns: number,
 *   rows: number,
 * }}
 */
/**
 * La disposition qui remplit une page, pour un contenu donné.
 *
 * C'est la réponse au tâtonnement : au lieu de choisir une grille puis de
 * constater qu'elle ne convient pas — étiquettes trop petites pour le texte, ou
 * place perdue en bas de page —, on part de ce que le contenu **exige** et l'on
 * en déduit la page entière.
 *
 * Le raisonnement tient en trois temps :
 *
 * 1. **La grille qui porte le contenu sur une page** : le moins de cases vides
 *    possible — une case vide est une étiquette qui n'existe pas —, la forme du
 *    contenu à égalité, puis la plus grande étiquette.
 * 2. **À défaut, la plus dense qui porte son texte**, et la planche pagine. Le
 *    défaut mesuré le 29 septembre 2026 : sur une A4 3 × 4, 49 liens donnaient
 *    `10 × 5 = 50` étiquettes de **18,2 × 55 mm**, dont **45 sortaient coupées**.
 *    Aucune grille ne portait 49 étiquettes à une largeur qui porte leur texte ;
 *    le calcul, lui, tassait quand même, et annonçait une grille « calculée pour
 *    ce contenu » qui ne l'était pas.
 * 3. **Des étiquettes qui occupent la place restante.** Une fois la grille
 *    fixée, le reste de la page est réparti entre les étiquettes plutôt que
 *    laissé en bande perdue à droite et en bas : elles grandissent, et le code
 *    avec elles.
 *
 * La contrainte de contenu s'exprime par `tient`, **évaluée sur les cotes de
 * chaque grille candidate** : c'est la seule façon de ne pas promettre une
 * largeur dont on n'a pas mesuré le texte. `minLabelWidthMm` et
 * `minLabelHeightMm` restent le plancher dur — un QR Code dont les modules
 * descendent sous la taille lisible ne se lit plus, quelle que soit la place du
 * texte.
 *
 * Les marges demandées sont respectées — mais si une seule étiquette n'y tient
 * pas, elles sont ramenées à zéro avant de renoncer : rogner une marge est
 * toujours préférable à ne rien pouvoir imprimer.
 *
 * @param {{
 *   pageWidthMm: number, pageHeightMm: number,
 *   minLabelWidthMm: number, minLabelHeightMm: number,
 *   marginXMm?: number, marginYMm?: number,
 *   gapXMm?: number, gapYMm?: number,
 *   count?: number,
 *   tient?: (labelWidthMm: number, labelHeightMm: number) => boolean,
 * }} options
 * @returns {{
 *   columns: number, rows: number,
 *   labelWidthMm: number, labelHeightMm: number,
 *   marginXMm: number, marginYMm: number, gapXMm: number, gapYMm: number,
 *   perPage: number, coversCount: boolean, pages: number,
 * }}
 */
/**
 * Compare deux scores, critère par critère, dans l'ordre.
 *
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
function compareScores(a, b) {
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

function autoSheetLayout(options) {
  const pageWidthMm = positive(options.pageWidthMm, 'pageWidthMm');
  const pageHeightMm = positive(options.pageHeightMm, 'pageHeightMm');
  const minWidth = positive(options.minLabelWidthMm, 'minLabelWidthMm');
  const minHeight = positive(options.minLabelHeightMm, 'minLabelHeightMm');
  let marginXMm = nonNegative(options.marginXMm ?? 0);
  let marginYMm = nonNegative(options.marginYMm ?? 0);
  const gapXMm = nonNegative(options.gapXMm ?? 0);
  const gapYMm = nonNegative(options.gapYMm ?? 0);

  // Combien d'étiquettes la planche doit porter. C'est ce qui décide de la
  // **taille** de la grille : sans ce nombre, la mise en page automatique
  // cherchait la grille la plus dense possible et proposait 11 × 7 = 77
  // étiquettes pour cinq liens — des timbres, et une page à moitié vide.
  const count = Number.isFinite(options.count) && options.count > 0
    ? Math.floor(options.count)
    : 0;

  const grille = (margeX, margeY) => {
    const utileX = pageWidthMm - margeX * 2;
    const utileY = pageHeightMm - margeY * 2;
    return {
      columns: Math.max(1, Math.floor((utileX + gapXMm) / (minWidth + gapXMm))),
      rows: Math.max(1, Math.floor((utileY + gapYMm) / (minHeight + gapYMm))),
      utileX,
      utileY,
    };
  };

  let { columns, rows, utileX, utileY } = grille(marginXMm, marginYMm);

  // Une étiquette ne tient pas dans la zone utile telle qu'elle est demandée :
  // on rend les marges avant de renoncer.
  if (columns < 1 || rows < 1
    || utileX < minWidth - 1e-9 || utileY < minHeight - 1e-9) {
    marginXMm = 0;
    marginYMm = 0;
    ({ columns, rows, utileX, utileY } = grille(0, 0));
  }

  /**
   * Les grilles candidates, jugées **sur leurs propres cotes**.
   *
   * C'est là que se joue le défaut du 29 septembre 2026 : le besoin de texte était
   * mesuré à une largeur — celle de la disposition, puis celle de la première
   * grille trouvée — et la grille retenue en avait une autre, plus étroite, où le
   * texte réclamait plus de lignes. La contrainte est donc évaluée ici, pour
   * chaque candidate, sur la largeur et la hauteur qu'elle aurait réellement.
   *
   * Trois idées, dans cet ordre :
   *
   * 1. **La grille doit contenir les étiquettes, et pas davantage.** C'est le
   *    critère premier : une case vide est une étiquette qui n'existe pas, et
   *    une grille trop dense fait des timbres. « 11 colonnes pour cinq liens »
   *    était précisément le défaut.
   * 2. **Une lame n'est pas une étiquette.** À remplissage égal, on écarte les
   *    grilles dont l'étiquette s'éloigne trop de la forme du **contenu** — le
   *    rapport de la plus petite étiquette qui porte le QR Code et son texte.
   *    Cinq liens sur une A4 donnent ainsi 2 × 3 (96 × 92 mm, presque carré)
   *    plutôt que 5 × 1 (38 × 280 mm) : les deux tiennent le contenu, un seul se
   *    regarde. Le facteur 2 est un choix : à 3, cinq liens donnaient 1 × 5 —
   *    une bande de 193 × 55 mm, exacte mais étirée — plutôt que 2 × 3
   *    (96 × 92 mm), qui laisse une case vide et se regarde mieux. Une case
   *    vide est du papier, pas une étiquette ratée.
   * 3. À remplissage et forme acceptables, la plus grande étiquette gagne.
   *
   * Sans nombre d'étiquettes — un appelant qui ne le connaît pas —, on garde le
   * comportement d'origine : remplir la page.
   */
  const FORME_TOLEREE = 2;
  const cible = minWidth / minHeight;
  const tient = typeof options.tient === 'function' ? options.tient : null;

  /** Les cotes d'une étiquette pour une grille donnée : la place restante est
   *  partagée, donc les étiquettes occupent la page jusqu'à ses bords. */
  const cotesDe = (colonnes, lignes) => ({
    labelWidthMm: (utileX - (colonnes - 1) * gapXMm) / colonnes,
    labelHeightMm: (utileY - (lignes - 1) * gapYMm) / lignes,
  });

  /**
   * Une grille candidate, ou `null` si elle ne peut pas porter le contenu.
   *
   * @param {number} colonnes
   * @param {number} lignes
   */
  const candidat = (colonnes, lignes) => {
    const { labelWidthMm: largeur, labelHeightMm: hauteur } = cotesDe(colonnes, lignes);
    // Le plancher dur : un module plus petit que `minLabel*Mm` ne se lit plus.
    if (largeur < minWidth - 1e-9 || hauteur < minHeight - 1e-9) return null;
    // Puis la contrainte du contenu, sur **ces** cotes-là.
    if (tient && !tient(largeur, hauteur)) return null;
    const forme = (largeur / hauteur) / cible;
    const cases = colonnes * lignes;
    return {
      colonnes,
      lignes,
      labelWidthMm: largeur,
      labelHeightMm: hauteur,
      cases,
      vide: cases - count,
      aire: largeur * hauteur,
      // 0 quand l'étiquette garde la forme du contenu.
      lame: forme < 1 / FORME_TOLEREE || forme > FORME_TOLEREE ? 1 : 0,
    };
  };

  let coversCount = true;

  if (count > 0) {
    const candidates = [];
    for (let colonnes = 1; colonnes <= columns; colonnes += 1) {
      for (let lignes = 1; lignes <= rows; lignes += 1) {
        const grilleCandidate = candidat(colonnes, lignes);
        if (grilleCandidate) candidates.push(grilleCandidate);
      }
    }

    // 1. Celles qui portent le contenu **sur une page**. La forme du contenu
    //    passe avant la case perdue : c'est le sens de « on tolère la case qui
    //    rend la grille équilibrée, jamais deux » — cinq liens font 2 × 3
    //    (96 × 92 mm, une case vide) plutôt que 1 × 5 (193 × 55 mm, exacte mais
    //    étirée). Faute de grille bien formée, la plus économe en cases gagne :
    //    mieux vaut une lame qu'un refus.
    const tiennentLeCompte = candidates.filter((c) => c.cases >= count);
    const parEconomie = (a, b) => a.vide - b.vide || b.aire - a.aire;
    const surUnePage = tiennentLeCompte.filter((c) => c.lame === 0).sort(parEconomie)[0]
      ?? tiennentLeCompte.sort(parEconomie)[0];

    // 2. Aucune ne le porte. On ne tasse pas pour autant : la plus dense des
    //    grilles qui portent **leur texte** est retenue, et la planche pagine.
    //    Une grille annoncée « calculée pour ce contenu » doit l'être ; mieux
    //    vaut deux pages lisibles qu'une page de 45 étiquettes tronquées.
    const dense = candidates
      .sort((a, b) => b.cases - a.cases || b.aire - a.aire)[0];

    const choisie = surUnePage ?? dense;
    if (choisie) {
      columns = choisie.colonnes;
      rows = choisie.lignes;
      coversCount = choisie.cases >= count;
    } else if (tient) {
      // Aucune grille ne porte son texte : la disposition demandée est trop
      // serrée pour ce contenu. On garde la grille du plancher — l'appelant a de
      // quoi le dire —, et le compte n'est pas tenu.
      coversCount = columns * rows >= count;
    }
  }

  // Ce qui reste après la grille se répartit entre les étiquettes : la page est
  // occupée jusqu'à ses bords.
  const labelWidthMm = Math.max(minWidth, (utileX - (columns - 1) * gapXMm) / columns);
  const labelHeightMm = Math.max(minHeight, (utileY - (rows - 1) * gapYMm) / rows);

  // Les cotes sont **arrondies vers le bas** : arrondir au plus proche suffisait
  // à faire dépasser la grille de quelques millièmes de millimètre, et la page
  // ne contenait plus tout à fait ses étiquettes.
  const plancher2 = (valeur) => Math.floor(valeur * 100) / 100;

  return {
    columns,
    rows,
    labelWidthMm: plancher2(labelWidthMm),
    labelHeightMm: plancher2(labelHeightMm),
    marginXMm: round2(marginXMm),
    marginYMm: round2(marginYMm),
    gapXMm: round2(gapXMm),
    gapYMm: round2(gapYMm),
    perPage: columns * rows,
    // Ce que la grille retenue signifie pour le contenu : tient-il sur une page,
    // ou la planche en demandera-t-elle plusieurs ? Le calcul le sait, et
    // l'appelant n'a pas à le refaire — le refaire autrement serait le défaut
    // d'origine, une seconde formule pour la même chose.
    coversCount,
    pages: count === 0 ? 0 : Math.ceil(count / (columns * rows)),
  };
}

function fitGrid(options) {
  const pageWidthMm = positive(options.pageWidthMm, 'pageWidthMm');
  const pageHeightMm = positive(options.pageHeightMm, 'pageHeightMm');
  const columns = Math.max(1, Math.trunc(options.columns ?? 1));
  const rows = Math.max(1, Math.trunc(options.rows ?? 1));
  // `marginMm` reste accepté : c'est la marge globale, appliquée aux deux axes.
  const marginXMm = nonNegative(options.marginXMm ?? options.marginMm ?? 0);
  const marginYMm = nonNegative(options.marginYMm ?? options.marginMm ?? 0);
  const gapXMm = nonNegative(options.gapXMm ?? 0);
  const gapYMm = nonNegative(options.gapYMm ?? 0);
  const minLabelMm = Number.isFinite(options.minLabelMm) ? options.minLabelMm : 5;

  const usableWidth = pageWidthMm - marginXMm * 2;
  const usableHeight = pageHeightMm - marginYMm * 2;

  const rawWidth = (usableWidth - (columns - 1) * gapXMm) / columns;
  const rawHeight = (usableHeight - (rows - 1) * gapYMm) / rows;

  const refuse = (reason) => ({
    ok: false,
    reason,
    labelWidthMm: 0,
    labelHeightMm: 0,
    marginXMm,
    marginYMm,
    columns,
    rows,
  });

  if (rawWidth < minLabelMm || rawHeight < minLabelMm) {
    const tooMany = rawWidth < minLabelMm ? `${columns} colonnes` : `${rows} rangées`;
    const tightest = rawWidth < minLabelMm ? round1(rawWidth) : round1(rawHeight);
    return refuse(
      `${tooMany} sur cette feuille ne laisse que ${tightest} mm par étiquette ` +
      `(minimum ${minLabelMm} mm). Réduisez le nombre, l'écart, ou la marge.`,
    );
  }

  // Arrondi vers le bas : l'étiquette ne peut pas être plus grande que la place
  // disponible. Le reste est réparti en marge, ce qui recentre la grille.
  const labelWidthMm = Math.floor(rawWidth * 100) / 100;
  const labelHeightMm = Math.floor(rawHeight * 100) / 100;

  const slackX = usableWidth - (columns * labelWidthMm + (columns - 1) * gapXMm);
  const slackY = usableHeight - (rows * labelHeightMm + (rows - 1) * gapYMm);

  // Arrondi vers le bas, là aussi : arrondir la marge au centième supérieur
  // suffirait à faire dépasser la grille du bord de la feuille de quelques
  // microns — de quoi invalider la garantie « rien ne sort de la page ».
  const floor2 = (value) => Math.floor(value * 100) / 100;

  return {
    ok: true,
    reason: '',
    labelWidthMm,
    labelHeightMm,
    marginXMm: floor2(marginXMm + slackX / 2),
    marginYMm: floor2(marginYMm + slackY / 2),
    columns,
    rows,
  };
}

/**
 * Ramène une grille demandée à la plus grande qui tienne réellement.
 *
 * Le défaut qu'elle corrige : `fitGrid` **refuse** une grille impossible, et
 * l'interface se contentait alors de garder la disposition précédente. Les
 * champs affichaient donc une valeur, l'aperçu en montrait une autre, et
 * l'impression une troisième — sans que rien ne dise laquelle. L'utilisateur
 * concluait, à juste titre, qu'il était bloqué dans une configuration dont il ne
 * voyait pas le résultat.
 *
 * Ici, la demande est ramenée à ce qui tient, et la raison est rendue avec.
 * L'appelant peut alors écrire la valeur retenue dans son champ : l'écran,
 * l'aperçu et le papier ne montrent plus qu'une seule grille.
 *
 * Le calcul est celui de `computeSheet` — la même formule, avec la taille
 * minimale d'étiquette à la place de la taille réelle. C'est ce qui garantit que
 * la grille rendue est acceptée par `fitGrid` : une seconde formule, écrite
 * ailleurs, finirait par diverger d'un centième et rendrait une grille refusée.
 *
 * @param {{
 *   pageWidthMm: number,
 *   pageHeightMm: number,
 *   columns: number,
 *   rows: number,
 *   marginXMm?: number,
 *   marginYMm?: number,
 *   gapXMm?: number,
 *   gapYMm?: number,
 *   minLabelMm?: number,
 * }} options
 * @returns {{ columns: number, rows: number, clamped: boolean, reason: string }}
 *   `clamped` dit si la valeur rendue diffère de la demande ; `reason` est vide
 *   dans ce cas, et l'explique sinon.
 */
/**
 * L'écart et la marge qui font tenir une grille demandée sur une page.
 *
 * C'est le calcul **inverse** de celui des dispositions : au lieu de déduire la
 * taille des étiquettes de la grille et des espacements, on garde la taille
 * d'étiquette et la grille, et l'on cherche les espacements qui les font tenir.
 *
 * La réponse préférée est **symétrique** — le même écart dans les deux sens et
 * la même marge partout. `n` colonnes de largeur `w`, `r` rangées de hauteur
 * `h`, un écart `g` et une marge `m` donnent deux équations :
 *
 *     n·w + (n-1)·g + 2m = W        r·h + (r-1)·g + 2m = H
 *
 * Deux équations, deux inconnues : une seule solution, qui n'existe que si
 * `g ≥ 0` et `m ≥ 0`. Quand la marge tomberait sous zéro — les étiquettes sont
 * plus hautes que larges, et la grille carrée —, on garde l'écart égal et
 * l'on partage ce qui reste : c'est le seul moyen de ne pas trancher dans la
 * grille demandée.
 *
 * Si même sans écart ni marge les étiquettes ne tiennent pas, aucun
 * arrangement ne peut les faire tenir : la réponse le dit.
 *
 * @param {{
 *   pageWidthMm: number, pageHeightMm: number,
 *   columns: number, rows: number,
 *   labelWidthMm: number, labelHeightMm: number,
 *   gapXMm?: number,
 * }} options
 * @returns {{
 *   ok: boolean,
 *   reason?: 'etiquettes',
 *   gapXMm?: number, gapYMm?: number, marginXMm?: number, marginYMm?: number,
 *   symetrique?: boolean,
 * }}
 */
function spacingForGrid(options) {
  const pageWidthMm = positive(options.pageWidthMm, 'pageWidthMm');
  const pageHeightMm = positive(options.pageHeightMm, 'pageHeightMm');
  const columns = Math.max(1, Math.trunc(options.columns ?? 1));
  const rows = Math.max(1, Math.trunc(options.rows ?? 1));
  const labelWidthMm = positive(options.labelWidthMm, 'labelWidthMm');
  const labelHeightMm = positive(options.labelHeightMm, 'labelHeightMm');

  const arrondi = (valeur) => Math.round(valeur * 100) / 100;
  const libreLargeur = pageWidthMm - columns * labelWidthMm;
  const libreHauteur = pageHeightMm - rows * labelHeightMm;

  // Les étiquettes elles-mêmes ne tiennent pas : aucun espacement n'y changera
  // rien, et le dire vaut mieux que de rendre des valeurs négatives.
  if (libreLargeur < -0.01 || libreHauteur < -0.01) return { ok: false, reason: 'etiquettes' };

  const ecartsLargeur = columns - 1;
  const ecartsHauteur = rows - 1;

  // Cas particulier : une seule étiquette dans les deux sens — il n'y a pas
  // d'écart à trouver, seulement une marge.
  if (ecartsLargeur === 0 && ecartsHauteur === 0) {
    const marge = Math.max(0, Math.min(libreLargeur, libreHauteur) / 2);
    return {
      ok: true, gapXMm: 0, gapYMm: 0, marginXMm: arrondi(marge), marginYMm: arrondi(marge),
      symetrique: true,
    };
  }

  if (ecartsLargeur === ecartsHauteur) {
    // Même nombre d'écarts des deux côtés : la solution symétrique n'existe que
    // si la place libre est la même dans les deux sens.
    if (Math.abs(libreLargeur - libreHauteur) <= 0.01) {
      const marge = Math.max(0, Math.min(libreLargeur, libreHauteur)
        / Math.max(1, 2 * (ecartsLargeur + 1)));
      return {
        ok: true,
        gapXMm: arrondi(Math.max(0, Number(options.gapXMm) || 0)),
        gapYMm: arrondi(Math.max(0, Number(options.gapXMm) || 0)),
        marginXMm: arrondi(marge), marginYMm: arrondi(marge), symetrique: true,
      };
    }
    return partager(libreLargeur, libreHauteur, ecartsLargeur, ecartsHauteur, arrondi);
  }

  const ecart = (libreHauteur - libreLargeur) / (ecartsHauteur - ecartsLargeur);
  const marge = (libreLargeur - ecartsLargeur * ecart) / 2;
  if (ecart >= -0.01 && marge >= -0.01) {
    return {
      ok: true,
      gapXMm: arrondi(Math.max(0, ecart)), gapYMm: arrondi(Math.max(0, ecart)),
      marginXMm: arrondi(Math.max(0, marge)), marginYMm: arrondi(Math.max(0, marge)),
      symetrique: true,
    };
  }
  return partager(libreLargeur, libreHauteur, ecartsLargeur, ecartsHauteur, arrondi);
}

/**
 * L'écart égal le plus grand qui laisse une marge positive, et les marges qui
 * restent. Utilisé quand la solution symétrique n'existe pas.
 * @returns {{ ok: boolean, gapXMm: number, gapYMm: number, marginXMm: number, marginYMm: number, symetrique: boolean }}
 */
function partager(libreLargeur, libreHauteur, ecartsLargeur, ecartsHauteur, arrondi) {
  const parLargeur = ecartsLargeur > 0 ? libreLargeur / ecartsLargeur : Infinity;
  const parHauteur = ecartsHauteur > 0 ? libreHauteur / ecartsHauteur : Infinity;
  const ecart = Math.max(0, Math.min(parLargeur, parHauteur));
  const margeX = ecartsLargeur > 0 ? (libreLargeur - ecartsLargeur * ecart) / 2 : libreLargeur / 2;
  const margeY = ecartsHauteur > 0 ? (libreHauteur - ecartsHauteur * ecart) / 2 : libreHauteur / 2;
  return {
    ok: true,
    gapXMm: arrondi(ecart), gapYMm: arrondi(ecart),
    marginXMm: arrondi(Math.max(0, margeX)), marginYMm: arrondi(Math.max(0, margeY)),
    symetrique: Math.abs(margeX - margeY) <= 0.01,
  };
}

/**
 * La plus grande grille qui tient sur la page, à la taille minimale d'étiquette.
 *
 * Le calcul est celui de `computeSheet` — la même formule, avec la taille
 * minimale d'étiquette à la place de la taille réelle. C'est ce qui garantit que
 * la grille rendue est acceptée par `fitGrid` : une seconde formule, écrite
 * ailleurs, finirait par diverger d'un centième et rendrait une grille refusée.
 *
 * @param {{
 *   pageWidthMm: number,
 *   pageHeightMm: number,
 *   columns: number,
 *   rows: number,
 *   marginXMm?: number,
 *   marginYMm?: number,
 *   gapXMm?: number,
 *   gapYMm?: number,
 *   minLabelMm?: number,
 * }} options
 * @returns {{ columns: number, rows: number, clamped: boolean, reason: string }}
 *   `clamped` dit si la valeur rendue diffère de la demande ; `reason` est vide
 *   dans ce cas, et l'explique sinon.
 */
function clampGrid(options) {
  const pageWidthMm = positive(options.pageWidthMm, 'pageWidthMm');
  const pageHeightMm = positive(options.pageHeightMm, 'pageHeightMm');
  const columns = Math.max(1, Math.trunc(options.columns ?? 1));
  const rows = Math.max(1, Math.trunc(options.rows ?? 1));
  const marginXMm = nonNegative(options.marginXMm ?? 0);
  const marginYMm = nonNegative(options.marginYMm ?? 0);
  const gapXMm = nonNegative(options.gapXMm ?? 0);
  const gapYMm = nonNegative(options.gapYMm ?? 0);
  const minLabelMm = Number.isFinite(options.minLabelMm) ? options.minLabelMm : 5;

  const usableWidth = pageWidthMm - marginXMm * 2;
  const usableHeight = pageHeightMm - marginYMm * 2;

  // Même tolérance que `computeSheet` : les cotes décimales tombent parfois
  // juste sous l'entier attendu, et l'epsilon reste très inférieur à toute
  // imprécision d'impression.
  const EPSILON = 1e-9;
  const pas = (usable, gap) => (gap === 0
    ? Math.floor(usable / minLabelMm + EPSILON)
    : Math.floor((usable + gap) / (minLabelMm + gap) + EPSILON));

  const maxColumns = Math.max(0, pas(usableWidth, gapXMm));
  const maxRows = Math.max(0, pas(usableHeight, gapYMm));

  const keptColumns = Math.min(columns, maxColumns);
  const keptRows = Math.min(rows, maxRows);
  const reduit = keptColumns !== columns || keptRows !== rows;

  if (!reduit) {
    return { columns: keptColumns, rows: keptRows, clamped: false, reason: '' };
  }

  // Aucune place du tout : ce n'est plus une question de nombre, et proposer
  // « 1 colonne » serait faux — elle ne tiendrait pas davantage. On le dit
  // franchement, et l'appelant n'a rien à dessiner.
  if (keptColumns === 0 || keptRows === 0) {
    return {
      columns: 0,
      rows: 0,
      clamped: true,
      reason: t('Les marges ne laissent aucune place à une étiquette sur cette feuille.'),
    };
  }

  // Deux phrases indépendantes plutôt qu'une seule à trous : chacune se traduit
  // pour elle-même, et l'ordre des mots reste celui de la langue cible.
  const raisons = [];
  if (columns > maxColumns) {
    raisons.push(t('{asked} colonnes ne tiennent pas : {kept} au maximum sur cette feuille.', {
      asked: columns, kept: keptColumns,
    }));
  }
  if (rows > maxRows) {
    raisons.push(t('{asked} rangées ne tiennent pas : {kept} au maximum sur cette feuille.', {
      asked: rows, kept: keptRows,
    }));
  }

  return {
    columns: keptColumns,
    rows: keptRows,
    clamped: true,
    reason: `${raisons.join(' ')} ${t("Réduisez l'écart ou la marge pour en placer davantage.")}`,
  };
}

/**
 * Traduit les cotes publiées d'une planche en réglages de grille.
 *
 * Une planche du commerce a une marge gauche et une marge haute différentes, et
 * sa marge de droite n'est pas toujours égale à celle de gauche. La grille, elle,
 * se règle par une marge symétrique sur chaque axe : on prend donc, pour chaque
 * axe, ce qui reste une fois les étiquettes et leurs écarts retirés, réparti
 * également des deux côtés.
 *
 * Conséquence, et elle compte : la taille d'étiquette et le **pas** sont exacts,
 * donc les colonnes tombent bien en face de leurs cases ; seule la position
 * d'ensemble peut être décalée de quelques dixièmes de millimètre par rapport à
 * la planche du fabricant. C'est un décalage constant, que les champs de
 * décalage rattrapent — contrairement à une erreur de pas, qui s'accumulerait.
 *
 * @param {{ declaredColumns: number, declaredRows: number, labelWidthMm: number,
 *   labelHeightMm: number, gapXMm: number, gapYMm: number }} preset
 * @param {{ widthMm: number, heightMm: number }} page
 * @returns {{ columns: number, rows: number, marginXMm: number, marginYMm: number,
 *   gapXMm: number, gapYMm: number }}
 */
function presetToGrid(preset, page) {
  const middle = (total, count, size, gap) => (total - count * size - (count - 1) * gap) / 2;
  return {
    columns: preset.declaredColumns,
    rows: preset.declaredRows,
    marginXMm: Math.round(middle(
      page.widthMm, preset.declaredColumns, preset.labelWidthMm, preset.gapXMm,
    ) * 100) / 100,
    marginYMm: Math.round(middle(
      page.heightMm, preset.declaredRows, preset.labelHeightMm, preset.gapYMm,
    ) * 100) / 100,
    gapXMm: preset.gapXMm,
    gapYMm: preset.gapYMm,
  };
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/printer/profiles.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Profils d'imprimantes Niimbot.
 *
 * Deux chiffres sont critiques et contre-intuitifs :
 *
 * 1. `printheadPixels` est la largeur de la **tête**, pas celle de l'étiquette.
 *    Un D110 accepte des rouleaux de 15 mm mais sa tête ne fait que 96 px
 *    (12 mm à 203 dpi). Envoyer 120 colonnes ne provoque aucune erreur :
 *    l'imprimante rogne silencieusement à 96.
 * 2. `printTask` détermine la grammaire du dialogue d'impression. Router un
 *    D110 vers le task « v4 » (SetPageSize 13 octets) le fait refuser la page
 *    avec une erreur DataError (0xDB 06) au lieu d'imprimer.
 */

/**
 * @typedef {Object} PrinterProfile
 * @property {string} id                Identifiant lisible.
 * @property {number[]} modelIds        modelId rapportés par PrinterInfo (0x40 08).
 * @property {number} dpi               Résolution en points par pouce.
 * @property {number} printheadPixels   Largeur de la tête en pixels = largeur utile max.
 * @property {number} maxLabelWidthMm   Largeur d'étiquette maximale acceptée par le fabricant.
 * @property {number} maxPrintHeightMm  Hauteur d'impression maximale.
 * @property {{min: number, max: number, default: number}} density
 * @property {'D110'|'B1'|'V4'} printTask  Grammaire du dialogue d'impression.
 * @property {string[]} namePrefixes    Préfixes du nom BLE annoncé, pour le filtrage.
 * @property {boolean} transposed       true si la source doit être transposée avant encodage.
 */

/** Profil D110 — famille 203 dpi, tête 96 px. */
const D110 = Object.freeze({
  id: 'D110',
  // 2304 = D110, 2305 = Hi-D110, 2320 = D110_M.
  // « D110A » n'apparaît dans aucune source : le modelId réel sera lu à la
  // connexion et journalisé, ce qui lèvera le doute sur ce modèle.
  modelIds: [2304, 2305, 2320],
  dpi: 203,
  printheadPixels: 96,
  maxLabelWidthMm: 15,
  // Le fabricant vend des rouleaux de 109 mm pour ce modèle : borner la fenêtre
  // à 100 rendait ce format inutilisable, alors qu'il existe.
  maxPrintHeightMm: 120,
  density: { min: 1, max: 3, default: 2 },
  printTask: 'D110',
  namePrefixes: ['D110', 'D11', 'D101'],
  transposed: true,
});

/** Profil M2 (M2_H) — 300 dpi, tête 576 px. Conservé pour la suite. */
const M2 = Object.freeze({
  id: 'M2',
  modelIds: [4608],
  dpi: 300,
  printheadPixels: 576,
  maxLabelWidthMm: 50,
  maxPrintHeightMm: 240,
  density: { min: 1, max: 5, default: 3 },
  printTask: 'B1',
  namePrefixes: ['M2'],
  transposed: false,
});

/**
 * Profil M3 — 72 mm utiles, 300 dpi, tête 851 px.
 *
 * Le M3 appartient à la même famille que le M2 : 300 dpi, sens d'impression
 * `top`, transfert thermique au ruban. `niimbluelib` lui associe 851 px et le
 * modelId 6400, mais ne lui donne pas encore de task dédiée : on lui applique
 * donc la séquence `B1` du M2_H, la seule de la famille validée sur matériel.
 * À confirmer sur un M3 physique, comme l'a été le M2.
 *
 * 851 px à 300 dpi font 72 mm : c'est le « 3 pouces » du fabricant. Les
 * étiquettes existent jusqu'à 78 mm de large, la tête n'imprimant qu'une bande
 * de 72 mm et le reste restant blanc — même situation que le D110 avec ses
 * rouleaux de 15 mm.
 */
const M3 = Object.freeze({
  id: 'M3',
  modelIds: [6400],
  dpi: 300,
  printheadPixels: 851,
  maxLabelWidthMm: 78,
  // Fenêtre d'impression alignée sur le M2 : les étiquettes M3 courantes vont
  // jusqu'à 100 mm de long, et le rouleau continu n'est pas borné ici.
  maxPrintHeightMm: 240,
  density: { min: 1, max: 5, default: 3 },
  printTask: 'B1',
  namePrefixes: ['M3'],
  transposed: false,
});

/** Tous les profils connus, du plus spécifique au plus générique. */
const PROFILES = Object.freeze([D110, M2, M3]);

/** Profil utilisé quand le modèle n'est pas identifié. */
const DEFAULT_PROFILE = D110;

/** Préfixes de nom BLE à proposer au sélecteur d'appareils. */
const ALL_NAME_PREFIXES = Object.freeze([
  ...new Set(PROFILES.flatMap((profile) => profile.namePrefixes)),
]);

/**
 * Retrouve un profil par son identifiant lisible (« D110 », « M2 »).
 *
 * Sert à l'aperçu : on veut pouvoir composer une étiquette au format d'une
 * imprimante qu'on ne possède pas, ou qui n'est pas connectée.
 *
 * @param {string} id
 * @returns {PrinterProfile|undefined}
 */
function findProfile(id) {
  return PROFILES.find((profile) => profile.id === id);
}

/**
 * Retrouve un profil à partir du modelId rapporté par l'imprimante.
 *
 * @param {number} modelId
 * @returns {PrinterProfile|undefined}
 */
function findByModelId(modelId) {
  return PROFILES.find((profile) => profile.modelIds.includes(modelId));
}

/**
 * Devine un profil à partir du nom BLE annoncé (ex. « D110-FC06023035 »).
 * Ne sert que de repli : le modelId lu à la connexion fait foi.
 *
 * @param {string} deviceName
 * @returns {PrinterProfile|undefined}
 */
function findByName(deviceName) {
  if (typeof deviceName !== 'string') return undefined;
  const upper = deviceName.toUpperCase();
  // On teste les préfixes du plus long au plus court pour que « B21 » ne soit
  // pas capté par « B1 ».
  const candidates = PROFILES.flatMap((profile) =>
    profile.namePrefixes.map((prefix) => ({ profile, prefix })),
  ).sort((a, b) => b.prefix.length - a.prefix.length);

  for (const { profile, prefix } of candidates) {
    if (upper.startsWith(prefix)) return profile;
  }
  return undefined;
}

/**
 * Ajuste un profil avec la largeur de tête réellement rapportée par
 * l'imprimante (Heartbeat 0xDC [03] → 0xDE, octets 4-5).
 *
 * C'est la valeur la plus fiable : elle vient du matériel. On ne l'accepte que
 * si elle est plausible, pour ne pas écraser un profil correct avec une
 * lecture erronée.
 *
 * @param {PrinterProfile} profile
 * @param {number} reportedPixels
 * @returns {PrinterProfile}
 */
function withReportedHead(profile, reportedPixels) {
  if (!Number.isFinite(reportedPixels) || reportedPixels < 8 || reportedPixels > 4096) {
    return profile;
  }
  // Tolérance : on n'écarte pas une valeur proche de celle du profil, car
  // certains firmwares rapportent une marge (M2_H : 567 rapportés pour 576).
  return { ...profile, printheadPixels: Math.trunc(reportedPixels) };
}

/**
 * Consommables courants, par modèle.
 *
 * `widthMm` est la largeur de l'étiquette ; `lengthMm` est la longueur du
 * rouleau, celle que le profil ne connaissait pas. Sans elle, l'application
 * composait une étiquette de la hauteur de son contenu — 18 mm sur une photo
 * d'étiquette réellement imprimée — et l'imprimante avançait ensuite jusqu'à la
 * découpe suivante : le reste du rouleau sortait blanc.
 *
 * Une longueur `null` décrit un rouleau continu sans pas connu : la hauteur
 * reste alors déduite du contenu, seul comportement possible.
 *
 * Aucune de ces cotes n'est vérifiable sans le matériel : elles viennent des
 * catalogues du fabricant. `compatibleSupplies` écarte celles que la tête
 * connectée ne peut pas imprimer, ce qui est la seule garantie dont on dispose.
 */
const SUPPLIES = Object.freeze({
  // Catalogue relevé chez le fabricant, collection « label for D11/D110 » :
  // c'est la source qui fait foi, pas une supposition. Les rouleaux de 25 mm de
  // large y figurent mais sont écartés par `compatibleSupplies` — la tête de
  // 12 mm ne peut pas les atteindre.
  D110: Object.freeze([
    { id: 'd110-12x22', label: '12 × 22 mm', widthMm: 12, lengthMm: 22 },
    { id: 'd110-12x30', label: '12 × 30 mm', widthMm: 12, lengthMm: 30 },
    { id: 'd110-12x40', label: '12 × 40 mm', widthMm: 12, lengthMm: 40 },
    { id: 'd110-12x75', label: '12 × 75 mm', widthMm: 12, lengthMm: 75 },
    { id: 'd110-12x109', label: '12 × 109 mm', widthMm: 12, lengthMm: 109 },
    { id: 'd110-14x25', label: '14 × 25 mm', widthMm: 14, lengthMm: 25 },
    { id: 'd110-14x28', label: '14 × 28 mm', widthMm: 14, lengthMm: 28 },
    { id: 'd110-14x30', label: '14 × 30 mm', widthMm: 14, lengthMm: 30 },
    { id: 'd110-14x40', label: '14 × 40 mm', widthMm: 14, lengthMm: 40 },
    { id: 'd110-14x50', label: '14 × 50 mm', widthMm: 14, lengthMm: 50 },
    { id: 'd110-15x30', label: '15 × 30 mm', widthMm: 15, lengthMm: 30 },
    { id: 'd110-15x50', label: '15 × 50 mm', widthMm: 15, lengthMm: 50 },
    { id: 'd110-25x60', label: '25 × 60 mm', widthMm: 25, lengthMm: 60 },
    { id: 'd110-25x76', label: '25 × 76 mm', widthMm: 25, lengthMm: 76 },
    { id: 'd110-continue', label: 'Rouleau continu 12 mm (longueur libre)', widthMm: 12, lengthMm: null },
  ]),
  // Collection « label tape for M2/M3 ». Le 40 × 30 que je supposais n'existe
  // pas : c'est un 40 × 20. Les ronds sont notés comme tels, leur cote étant
  // celle du disque.
  M2: Object.freeze([
    { id: 'm2-25x9.5', label: '25 × 9,5 mm', widthMm: 25, lengthMm: 9.5 },
    { id: 'm2-36.5x9.5', label: '36,5 × 9,5 mm', widthMm: 36.5, lengthMm: 9.5 },
    { id: 'm2-40x20', label: '40 × 20 mm', widthMm: 40, lengthMm: 20 },
    { id: 'm2-40x40', label: '40 × 40 mm', widthMm: 40, lengthMm: 40 },
    { id: 'm2-50x30', label: '50 × 30 mm', widthMm: 50, lengthMm: 30 },
    { id: 'm2-50x50', label: '50 × 50 mm', widthMm: 50, lengthMm: 50 },
    { id: 'm2-50x70', label: '50 × 70 mm', widthMm: 50, lengthMm: 70 },
    { id: 'm2-50x80', label: '50 × 80 mm', widthMm: 50, lengthMm: 80 },
    { id: 'm2-30x70', label: '30 × 70 mm (bijouterie)', widthMm: 30, lengthMm: 70 },
    { id: 'm2-25x78', label: '25 × 78 mm (câble)', widthMm: 25, lengthMm: 78 },
    { id: 'm2-35.25x50', label: '35,25 × 50 mm (auto-pelliculé)', widthMm: 35.25, lengthMm: 50 },
    { id: 'm2-20x20-rond', label: '20 × 20 mm (rond)', widthMm: 20, lengthMm: 20 },
    { id: 'm2-24x13-rond', label: '24 × 13 mm (rond)', widthMm: 24, lengthMm: 13 },
    { id: 'm2-28x14-rond', label: '28 × 14 mm (rond)', widthMm: 28, lengthMm: 14 },
    { id: 'm2-28x15-rond', label: '28 × 15 mm (rond)', widthMm: 28, lengthMm: 15 },
    { id: 'm2-31x31-rond', label: '31 × 31 mm (rond)', widthMm: 31, lengthMm: 31 },
    { id: 'm2-34x17-rond', label: '34 × 17 mm (rond)', widthMm: 34, lengthMm: 17 },
    { id: 'm2-50x50-rond', label: '50 × 50 mm (rond)', widthMm: 50, lengthMm: 50 },
    { id: 'm2-continue', label: 'Rouleau continu 48 mm (longueur libre)', widthMm: 48, lengthMm: null },
  ]),
  // Collection du M3, telle que listée par le fabricant : les quatre cotes
  // viennent de la fiche produit, le rouleau continu reprend la largeur de tête
  // (72 mm). La tête imprime 72 mm ; les étiquettes plus larges gardent une
  // bande blanche, comme sur le D110.
  M3: Object.freeze([
    { id: 'm3-40x20', label: '40 × 20 mm', widthMm: 40, lengthMm: 20 },
    { id: 'm3-50x30', label: '50 × 30 mm', widthMm: 50, lengthMm: 30 },
    { id: 'm3-60x100', label: '60 × 100 mm', widthMm: 60, lengthMm: 100 },
    { id: 'm3-70x50', label: '70 × 50 mm', widthMm: 70, lengthMm: 50 },
    { id: 'm3-continue', label: 'Rouleau continu 72 mm (longueur libre)', widthMm: 72, lengthMm: null },
  ]),
});

/** Longueurs de rouleau les plus courantes, proposées comme suggestions. */
const COMMON_LENGTHS_MM = Object.freeze([22, 30, 40, 50, 70]);

/**
 * Les consommables d'un profil, chacun accompagné de sa compatibilité.
 *
 * Deux contraintes, toutes deux matérielles :
 * 1. une étiquette plus large que la tête y perdrait une bande, silencieusement ;
 * 2. une étiquette plus longue que `maxPrintHeightMm` dépasse la fenêtre
 *    d'impression du modèle.
 *
 * Le catalogue reste **visible** quand il est incompatible : on signale plutôt
 * que de faire disparaître, sans quoi l'utilisateur croirait à une option
 * manquante alors qu'il a choisi le mauvais rouleau.
 *
 * @param {PrinterProfile} profile
 * @returns {Array<{ id: string, label: string, widthMm: number, lengthMm: number|null, compatible: boolean, reason: string }>}
 */
function compatibleSupplies(profile) {
  const list = SUPPLIES[profile.id] ?? [];
  const headMm = (profile.printheadPixels / profile.dpi) * 25.4;
  // Une étiquette plus large que la tête reste **imprimable** : le contenu fait
  // la largeur de la tête, et le reste de l'étiquette demeure blanc. L'interdire
  // rendait inutilisables les rouleaux 14 et 15 mm d'un D110, qui sont courants.
  // On les signale donc sans les écarter. Au-delà de cette marge, en revanche,
  // la tête ne peut pas atteindre le bord : le consommable est écarté.
  const atteignableMm = headMm + 4;

  return list.map((supply) => {
    if (supply.widthMm > atteignableMm) {
      return { ...supply, compatible: false, reason: 'trop large pour cette tête' };
    }
    if (supply.lengthMm !== null && supply.lengthMm > profile.maxPrintHeightMm) {
      return { ...supply, compatible: false, reason: 'plus longue que la fenêtre d\'impression' };
    }
    if (supply.widthMm > headMm + 0.5) {
      return { ...supply, compatible: true, reason: 'marge non imprimée sur les côtés' };
    }
    return { ...supply, compatible: true, reason: '' };
  });
}

/**
 * Convertit une largeur d'étiquette en millimètres vers la largeur de tête à
 * utiliser, en signalant l'écart éventuel.
 *
 * @param {PrinterProfile} profile
 * @param {number} labelWidthMm
 * @returns {{ cols: number, clippedMm: number, labelWidthMm: number }}
 */
function planPageWidth(profile, labelWidthMm) {
  const printableMm = (profile.printheadPixels / profile.dpi) * 25.4;
  return {
    cols: profile.printheadPixels,
    labelWidthMm,
    clippedMm: Math.max(0, labelWidthMm - printableMm),
  };
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/download.js
// ────────────────────────────────────────────────────────────────────────

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
function downloadText(filename, text, options = {}) {
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
function downloadBytes(filename, bytes, options = {}) {
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
function downloadBlob(filename, blob, options = {}) {
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
async function copyText(text, options = {}) {
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

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/zip.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Écriture de fichiers ZIP, sans dépendance.
 *
 * Un `.xlsx` n'est rien d'autre qu'une archive ZIP de fichiers XML. Plutôt que
 * d'embarquer une bibliothèque pour cela, on écrit l'archive nous-mêmes.
 *
 * Les entrées sont stockées **sans compression** (`method: 0`). C'est un choix
 * délibéré : les images PNG qu'on y place sont déjà compressées, et les parties
 * XML sont minuscules. Cela évite d'avoir à implémenter un compresseur, et
 * reste parfaitement conforme — Excel, Numbers et LibreOffice ouvrent sans
 * difficulté une archive non compressée.
 */



/**
 * Convertit une date en couple (heure, date) au format MS-DOS, tel qu'attendu
 * par l'en-tête ZIP.
 *
 * @param {Date} date
 * @returns {{ time: number, date: number }}
 */
function dosStamp(date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

/**
 * Encode une chaîne en octets ASCII.
 * @param {string} text
 * @returns {Uint8Array}
 */
function ascii(text) {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code > 0x7f) {
      throw new RangeError(`nom de fichier non ASCII : ${text}`);
    }
    out[i] = code;
  }
  return out;
}

/**
 * Assemble une archive ZIP.
 *
 * @param {Array<{ name: string, data: Uint8Array|string }>} entries
 * @param {{ date?: Date }} [options]
 * @returns {Uint8Array}
 */
function createZip(entries, options = {}) {
  const date = options.date ?? new Date();
  const stamp = dosStamp(date);

  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const entry of entries) {
    const name = ascii(entry.name);
    const data = typeof entry.data === 'string'
      ? new TextEncoder().encode(entry.data)
      : entry.data;
    const checksum = crc32(data);

    const local = new Uint8Array(30 + name.length + data.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true); // signature d'en-tête local
    localView.setUint16(4, 20, true); // version nécessaire
    localView.setUint16(6, 0, true); // drapeaux
    localView.setUint16(8, 0, true); // méthode : stockage
    localView.setUint16(10, stamp.time, true);
    localView.setUint16(12, stamp.date, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, data.length, true); // taille compressée
    localView.setUint32(22, data.length, true); // taille réelle
    localView.setUint16(26, name.length, true);
    localView.setUint16(28, 0, true); // champ supplémentaire
    local.set(name, 30);
    local.set(data, 30 + name.length);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true); // signature du répertoire central
    centralView.setUint16(4, 20, true); // version de création
    centralView.setUint16(6, 20, true); // version nécessaire
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, stamp.time, true);
    centralView.setUint16(14, stamp.date, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint16(30, 0, true); // extra
    centralView.setUint16(32, 0, true); // commentaire
    centralView.setUint16(34, 0, true); // disque de départ
    centralView.setUint16(36, 0, true); // attributs internes
    centralView.setUint32(38, 0, true); // attributs externes
    centralView.setUint32(42, offset, true); // position de l'en-tête local
    central.set(name, 46);

    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }

  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);

  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true); // signature de fin de répertoire
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);

  const total = offset + centralSize + end.length;
  const zip = new Uint8Array(total);
  let cursor = 0;
  for (const part of [...locals, ...centrals, end]) {
    zip.set(part, cursor);
    cursor += part.length;
  }
  return zip;
}

/**
 * Relit une archive ZIP dont les entrées sont stockées sans compression.
 *
 * On lit ce qu'on écrit : nos archives — dossiers d'étiquettes et classeurs —
 * sont toutes en `method: 0`. Un lecteur complet demanderait un décompresseur,
 * dont on n'a pas besoin ici ; une entrée compressée est donc signalée comme
 * telle plutôt que rendue de travers.
 *
 * La lecture se fait sur les en-têtes locaux, en parcourant l'archive : c'est
 * suffisant pour un fichier qu'on vient de produire, et cela évite de gérer le
 * répertoire central.
 *
 * @param {Uint8Array} bytes
 * @returns {Map<string, Uint8Array>} contenu indexé par nom d'entrée.
 * @throws {TypeError} si l'archive est illisible, ou contient une entrée compressée.
 */
function readStoredZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entries = new Map();
  let offset = 0;

  while (offset + 30 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    const method = view.getUint16(offset + 8, true);
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const name = new TextDecoder().decode(bytes.subarray(offset + 30, offset + 30 + nameLength));
    const start = offset + 30 + nameLength + extraLength;

    if (method !== 0) {
      throw new TypeError(
        `Entrée compressée dans l'archive (${name}) : seules les archives ` +
        'produites par cette application sont relisables.',
      );
    }
    if (start + size > bytes.length) {
      throw new TypeError(`Archive tronquée : l'entrée « ${name} » dépasse la fin du fichier.`);
    }

    entries.set(name, bytes.subarray(start, start + size));
    offset = start + size;
  }

  if (entries.size === 0) {
    throw new TypeError(
      "Cette archive ne contient aucune entrée lisible. Attendu : un ZIP produit " +
      "par l'application (dossier d'étiquettes).",
    );
  }
  return entries;
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/xlsx.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Écriture de classeurs `.xlsx`, sans dépendance.
 *
 * Un `.xlsx` est une archive ZIP de fichiers XML. On l'écrit directement plutôt
 * que d'embarquer une bibliothèque : le besoin est modeste — un tableau, des
 * images ancrées dans une colonne — et cela évite d'alourdir l'extension, qui
 * embarque déjà ce code.
 *
 * Un CSV ne peut pas contenir d'image : c'est la raison d'être de ce module.
 * Les QR Codes sont intégrés comme parties `xl/media/*.png`, référencées par le
 * dessin de la feuille.
 */



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
function columnLetter(index) {
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

  // `fitToWidth` : à l'impression, le tableau est ramené à une largeur de page.
  // Sans cela, les colonnes se répartissent sur plusieurs feuilles et un QR Code
  // peut sortir sur une autre page que son URL — donc plus « un QR Code par ligne ».
  // `pageSetup` doit précéder `drawing` : l'ordre des éléments d'une feuille est
  // imposé par le schéma OOXML, et un ordre fautif fait ignorer la mise en page.
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
${cols}<sheetData>${body}</sheetData>
<pageMargins left="0.3" right="0.3" top="0.4" bottom="0.4" header="0.3" footer="0.3"/>
<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
${drawing}</worksheet>`;
}

/**
 * Construit le dessin : une image ancrée par QR Code.
 *
 * L'ancrage est un **`twoCellAnchor` avec `editAs="oneCell"`**, marqueurs `from`
 * **et** `to` : c'est exactement ce qu'Excel écrit quand on insère une image
 * dans une cellule, et donc la forme que tous les lecteurs savent replacer.
 * La version précédente émettait un `oneCellAnchor` — licite, lu correctement
 * par les analyseurs, mais qu'Excel n'écrit jamais : les visionneuses d'Apple
 * empilaient les images au coin de la feuille au lieu de les placer dans leurs
 * lignes.
 *
 * `editAs="oneCell"` signifie « l'image suit sa cellule sans se redimensionner
 * avec elle » : le QR Code garde sa taille exacte, et ne peut pas être étiré.
 *
 * @param {Array<{ row: number, column: number, widthPx: number, heightPx: number }>} images
 * @returns {string}
 */
function buildDrawing(images) {
  const anchors = images
    .map((image, index) => {
      const cx = image.widthPx * EMU_PER_PIXEL;
      const cy = image.heightPx * EMU_PER_PIXEL;
      // Le marqueur `to` désigne la cellule suivante : l'image est liée à une
      // seule cellule, celle de son QR Code.
      const to = `<xdr:to><xdr:col>${image.column + 1}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${image.row + 1}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>`;
      return `<xdr:twoCellAnchor editAs="oneCell">
<xdr:from><xdr:col>${image.column}</xdr:col><xdr:colOff>${EMU_PER_PIXEL}</xdr:colOff><xdr:row>${image.row}</xdr:row><xdr:rowOff>${EMU_PER_PIXEL}</xdr:rowOff></xdr:from>
${to}
<xdr:pic>
<xdr:nvPicPr><xdr:cNvPr id="${index + 2}" name="QR Code ${index + 1}" descr="QR Code du lien"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>
<xdr:blipFill><a:blip r:embed="rId${index + 1}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>
<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr>
</xdr:pic>
<xdr:clientData/>
</xdr:twoCellAnchor>`;
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
async function buildXlsx(options) {
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

  // Une ligne portant un QR Code doit être assez haute pour l'afficher.
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

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/spreadsheet.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Export tableur, avec les QR Codes intégrés.
 *
 * Un CSV ne peut pas transporter d'image : c'est la raison d'être de cet
 * export, qui produit un vrai classeur `.xlsx` où chaque ligne porte son QR Code.
 *
 * La construction du classeur vit dans `core/xlsx.js` ; ce module ne fait que
 * décider de sa mise en forme — quelles colonnes, quelle taille d'image, quels
 * en-têtes.
 */







/**
 * Taille d'image visée, en pixels, avant réduction au besoin.
 *
 * 96 px : à 96 dpi cela fait exactement un pouce (25,4 mm), soit un QR Code d'environ
 * 21 mm de côté une fois posé — imprimable, scannable, et assez petit pour que
 * dix lignes tiennent sur une page. Une image plus grande obligeait à des lignes
 * de 100 points, et le tableau ne tenait plus sur une page en largeur.
 */
const QR_TARGET_PX = 96;

/** En-têtes du classeur, dans l'ordre des colonnes, sans la note. */
const SPREADSHEET_HEADERS = ['N°', 'URL', 'Titre', 'Domaine', 'Tags', 'Ajouté le', 'QR Code'];

/**
 * Largeur de la colonne des QR Codes, en unités Excel (caractères).
 *
 * 19 unités ≈ 138 px, pour une image de 96 px : elle tient dans sa cellule avec
 * de la marge, sans déborder sur la colonne suivante.
 */
const QR_WIDTH_UNITS = 19;

/** Index de la colonne qui reçoit les images, dans la forme de référence. */
const QR_COLUMN_INDEX = SPREADSHEET_HEADERS.indexOf('QR Code');

/**
 * Colonnes réellement écrites, et index de celle qui porte les images.
 *
 * La colonne « Note » n'est ajoutée que si au moins un lien en a une : un
 * classeur ne doit pas transporter une colonne vide sur toute sa hauteur. Elle
 * se place **avant** la colonne des QR Codes, dont l'index est donc recalculé —
 * une image ancrée sur la mauvaise colonne serait invisible.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @returns {{ headers: string[], qrColumn: number, noteColumn: number }}
 */
function spreadsheetLayout(links) {
  const withNote = hasAnyNote(links);
  const headers = [
    'N°', 'URL', 'Titre', 'Domaine', 'Tags',
    ...(withNote ? ['Note'] : []),
    'Ajouté le', 'QR Code',
  ];
  return {
    headers,
    qrColumn: headers.indexOf('QR Code'),
    noteColumn: withNote ? headers.indexOf('Note') : -1,
  };
}

/**
 * Construit le classeur des liens, avec leurs QR Codes.
 *
 * Le classeur reçoit les liens **déjà résolus** par `resolveTargets` : l'URL de
 * la colonne « URL » est donc exactement celle qu'encode l'image QR Code de la même
 * ligne, ce qui est tout l'intérêt d'un tableur imprimé. L'URL d'origine, quand
 * elle diffère, apparaît dans une colonne ajoutée en fin de tableau.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @param {{ now?: number, onProgress?: (done: number, total: number) => void }} [options]
 * @returns {Promise<Uint8Array>}
 */
async function buildLinkSpreadsheet(links, options = {}) {
  const now = options.now ?? Date.now();

  const withOriginal = links.some((link) => sourceUrl(link) !== link.url);
  const layout = spreadsheetLayout(links);
  const headers = withOriginal
    ? [...layout.headers, 'URL d\'origine']
    : layout.headers;

  const rows = links.map((link, index) => [
    index + 1,
    link.url,
    link.title,
    sourceHost(link),
    // Tags sans « # » : dans un tableur, le dièse n'apporte rien et gêne le
    // filtrage. C'est la même forme que la colonne « Tags » du CSV.
    link.tags.join(' '),
    ...(layout.noteColumn >= 0 ? [link.note] : []),
    formatDateTime(link.createdAt),
    // La cellule sous l'image reste vide : le QR Code est ancré par-dessus.
    '',
    ...(withOriginal ? [sourceUrl(link) === link.url ? '' : sourceUrl(link)] : []),
  ]);

  const images = [];
  for (const [index, link] of links.entries()) {
    const png = await qrPng(link.url, { scale: 8, maxSize: QR_TARGET_PX, border: 2 });
    // `row` compte la ligne d'en-tête : les données commencent à la ligne 1.
    images.push({
      row: index + 1,
      column: layout.qrColumn,
      data: png,
      widthPx: QR_TARGET_PX,
      heightPx: QR_TARGET_PX,
    });
    options.onProgress?.(index + 1, links.length);
  }

  // Largeurs alignées sur les colonnes réellement écrites. La colonne du QR Code
  // fait au moins la largeur de l'image (19 unités ≈ 138 px) : une image plus
  // large que sa cellule déborde sur la voisine, et un lecteur qui rogne à la
  // cellule en couperait un morceau.
  const baseWidths = [5, 55, 32, 20, 18, ...(layout.noteColumn >= 0 ? [40] : []), 17, QR_WIDTH_UNITS];
  const widths = withOriginal ? [...baseWidths, 55] : baseWidths;

  return buildXlsx({
    sheetName: 'Liens',
    headers,
    rows,
    images,
    widths,
    date: new Date(now),
  });
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/import.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Relecture des archives exportées.
 *
 * L'import existait, mais il n'acceptait qu'une seule des trois formes que
 * l'application sait produire : l'archive JSON du bouton « Archive ». Ni le CSV,
 * ni le `export.json` du dossier d'étiquettes — ni, donc, le ZIP lui-même —
 * n'étaient relisibles. C'était le principal malentendu autour de l'import :
 * exporter puis réimporter ce qu'on venait d'exporter ne marchait pas.
 *
 * Ce module accepte les trois, en s'appuyant sur ce qu'on écrit :
 *
 * | Fichier | Ce qu'on en tire |
 * |---|---|
 * | archive JSON (« Archive ») | tout le modèle : titre, tags, note, raccourci |
 * | dossier d'étiquettes `.zip` | les liens de son `export.json` |
 * | `export.json` seul | les mêmes |
 * | CSV exporté | URL, titre, tags, note, date — la colonne « Domaine » est ignorée |
 *
 * Le **nom et la note de la collection** sont relevés quand le fichier les
 * porte : l'archive JSON les met dans `collection`, le manifeste du dossier
 * d'étiquettes dans `title`. Un CSV n'en porte aucun — ses colonnes décrivent
 * des liens, pas l'ensemble — et rend donc une collection sans nom. C'est à
 * l'appelant de décider ce qu'il en fait : les reprendre pour remplacer la
 * collection affichée, nommer une collection nouvelle, ou les ignorer.
 *
 * Toutes les fonctions sont pures : aucune lecture disque, aucun DOM. C'est ce
 * qui les rend testables, et c'est aussi ce qui impose à l'appelant de fournir
 * le contenu du fichier.
 */






/** Formes d'archive reconnues. */
const IMPORT_KINDS = Object.freeze(['links', 'labels', 'csv']);

/** Aucune collection décrite par le fichier : ni nom, ni note. */
const SANS_COLLECTION = Object.freeze({ name: '', note: '' });

/**
 * Nom et note de collection portés par un fichier relu.
 *
 * Deux emplacements, parce que l'application écrit les deux : l'archive de liens
 * range les métadonnées dans `collection`, le manifeste des étiquettes les met à
 * plat dans `title`. Un fichier écrit à la main qui porterait les deux est lu
 * dans l'ordre ci-dessous — la forme la plus explicite d'abord.
 *
 * Les valeurs sont nettoyées et bornées ici, comme elles le seraient à la
 * saisie : ce qui entre par un fichier ne doit pas pouvoir dépasser ce qu'un
 * champ accepte.
 *
 * @param {any} parsed
 * @returns {{ name: string, note: string }}
 */
function collectionFrom(parsed) {
  const source = parsed?.collection && typeof parsed.collection === 'object'
    ? parsed.collection
    : {};
  const nom = typeof source.name === 'string'
    ? source.name
    : (typeof parsed?.title === 'string' ? parsed.title : '');
  const note = typeof source.note === 'string' ? source.note : '';
  return {
    name: nom.trim().slice(0, COLLECTION_NAME_MAX),
    note: note.trim().slice(0, COLLECTION_NOTE_MAX),
  };
}

/**
 * Erreur d'import, avec un message qui dit ce qui était attendu.
 * @param {string} detail
 * @returns {TypeError}
 */
function unrecognised(detail) {
  return new TypeError(t(
    "{detail} Formats acceptés : l'archive JSON du bouton « Archive », le dossier d'étiquettes (.zip) ou son export.json, ou un CSV exporté d'ici.",
    { detail },
  ));
}

/**
 * Lit l'archive JSON complète, produite par `toJson`.
 *
 * @param {string} text
 * @returns {{ kind: string, records: object[], collection: { name: string, note: string } }}
 */
function fromJson(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw unrecognised(t('Fichier illisible : {message}.', { message: error.message }));
  }

  if (Array.isArray(parsed)) return { kind: 'links', records: parsed, collection: SANS_COLLECTION };

  // Archive de liens : le cas nominal.
  if (Array.isArray(parsed?.links)) {
    return { kind: 'links', records: parsed.links, collection: collectionFrom(parsed) };
  }

  // Manifeste du dossier d'étiquettes : `labels[].url` porte la destination
  // imprimée, et `originalUrl` l'adresse d'origine quand elle a été raccourcie.
  if (Array.isArray(parsed?.labels)) {
    return {
      kind: 'labels',
      records: parsed.labels
        .filter((label) => label && typeof label.url === 'string')
        .map((label) => {
          const shortened = typeof label.originalUrl === 'string' && label.originalUrl !== '';
          return {
            url: shortened ? label.originalUrl : label.url,
            title: typeof label.title === 'string' ? label.title : '',
            shortUrl: shortened ? label.url : '',
            shortProvider: shortened ? 'import' : '',
          };
        }),
      // Le manifeste ne décrit pas une collection, mais les liens qu'il porte
      // en viennent : son `title` est celui de la collection au moment de
      // l'export, et c'est ce qui permet de la retrouver par son nom.
      collection: collectionFrom(parsed),
    };
  }

  const detail = parsed?.format
    ? t('Archive JSON sans liste de liens (format « {format} »)', { format: parsed.format })
    : t('Archive JSON sans liste de liens');
  throw unrecognised(detail + '.');
}

/**
 * Découpe un CSV en lignes de champs, en respectant les guillemets.
 *
 * Reprend les conventions de l'export : guillemets doublés à l'intérieur d'un
 * champ, séparateur `;` ou `,`, fin de ligne `CRLF` ou `LF`.
 *
 * @param {string} text
 * @returns {string[][]}
 */
function parseCsvRows(text) {
  const body = text.replace(/^\uFEFF/, '');
  const firstLine = body.slice(0, body.indexOf('\n') === -1 ? body.length : body.indexOf('\n'));
  // Le séparateur se déduit de l'en-tête : les deux sont produits par l'export.
  const delimiter = (firstLine.match(/;/g) ?? []).length >= (firstLine.match(/,/g) ?? []).length
    ? ';'
    : ',';

  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < body.length; index++) {
    const char = body[index];

    if (quoted) {
      if (char === '"') {
        if (body[index + 1] === '"') {
          field += '"';
          index++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * Relit une date d'export (`JJ/MM/AAAA` ou `JJ/MM/AAAA HH:MM`).
 *
 * La date est locale, comme à l'export : la relire en UTC la décalerait d'un
 * jour selon le fuseau.
 *
 * @param {string} value
 * @returns {number} epoch ms, ou 0 si la date n'est pas reconnue.
 */
function parseExportedDate(value) {
  const match = String(value ?? '').trim()
    .match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2}))?$/);
  if (!match) return 0;
  const [, day, month, year, hour, minute] = match;
  const date = new Date(
    Number(year), Number(month) - 1, Number(day),
    Number(hour ?? 0), Number(minute ?? 0),
  );
  if (!Number.isFinite(date.getTime())) return 0;

  // `new Date(2026, 12, 32)` ne refuse rien : il reporte au 1er février 2027.
  // On vérifie donc que la date construite est bien celle qui était écrite,
  // sans quoi une date impossible entrerait dans la collection sous une autre.
  if (date.getFullYear() !== Number(year)
    || date.getMonth() !== Number(month) - 1
    || date.getDate() !== Number(day)
    || date.getHours() !== Number(hour ?? 0)
    || date.getMinutes() !== Number(minute ?? 0)) {
    return 0;
  }
  return date.getTime();
}

/**
 * Relit un CSV produit par l'export.
 *
 * Les colonnes sont repérées par leur en-tête, pas par leur position : un
 * tableur qui réordonne les colonnes reste importable, et les colonnes
 * facultatives (« Note », « URL courte ») sont prises quand elles sont là.
 *
 * @param {string} text
 * @returns {{ kind: string, records: object[], collection: { name: string, note: string } }}
 */
function fromCsv(text) {
  const rows = parseCsvRows(text).filter((row) => row.some((cell) => cell.trim() !== ''));
  if (rows.length < 2) {
    throw unrecognised(t('CSV sans ligne de données.'));
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const column = (...names) => {
    for (const name of names) {
      const index = headers.indexOf(name);
      if (index !== -1) return index;
    }
    return -1;
  };

  const urlColumn = column('url', 'adresse', 'lien');
  if (urlColumn === -1) {
    throw unrecognised(t('CSV sans colonne « URL » (colonnes trouvées : {columns}).', {
      columns: rows[0].join(', '),
    }));
  }

  const titleColumn = column('titre', 'title');
  const tagColumn = column('tags', 'étiquettes', 'etiquettes');
  const noteColumn = column('note', 'notes');
  const dateColumn = column('ajouté le', 'ajoute le', 'date');
  const shortColumn = column('url courte');

  const records = [];
  for (const row of rows.slice(1)) {
    const url = (row[urlColumn] ?? '').trim();
    if (url === '') continue;

    const record = { url };
    if (titleColumn !== -1) record.title = (row[titleColumn] ?? '').trim();
    if (noteColumn !== -1) record.note = (row[noteColumn] ?? '').trim();
    if (tagColumn !== -1) {
      // L'export sépare les tags par des espaces ; on accepte aussi les
      // virgules et les « # », par symétrie avec la saisie.
      record.tags = (row[tagColumn] ?? '')
        .split(/[\s,]+/)
        .map((tag) => tag.replace(/^#+/, ''))
        .filter((tag) => tag !== '');
    }
    if (shortColumn !== -1) record.shortUrl = (row[shortColumn] ?? '').trim();

    const createdAt = dateColumn === -1 ? 0 : parseExportedDate(row[dateColumn]);
    if (createdAt > 0) record.createdAt = createdAt;

    records.push(record);
  }

  if (records.length === 0) throw unrecognised('CSV sans URL exploitable.');
  // Un CSV ne décrit que des liens : ses colonnes ne portent ni nom ni note de
  // collection, et en inventer un serait pire que de n'en proposer aucun.
  return { kind: 'csv', records, collection: SANS_COLLECTION };
}

/**
 * Prépare les enregistrements à partir d'un fichier importé.
 *
 * `collection` dit ce que le fichier raconte de la collection dont il vient —
 * son nom, sa note. Vide quand il n'en dit rien, ce qui est le cas de tout CSV :
 * c'est à l'appelant d'en tenir compte, et non à cette fonction de décider ce
 * qu'on fait de la collection affichée.
 *
 * @param {{ text?: string, bytes?: Uint8Array, name?: string }} file
 * @returns {{ kind: string, records: object[], notes: string[],
 *   collection: { name: string, note: string } }}
 * @throws {TypeError} si le fichier n'est pas une archive reconnue.
 */
function parseImportFile(file) {
  const name = String(file?.name ?? '').toLowerCase();
  const notes = [];

  if (file?.bytes) {
    // Un ZIP : on cherche le manifeste, qui porte le titre et l'URL d'origine.
    let entries;
    try {
      entries = readStoredZip(file.bytes);
    } catch (error) {
      throw unrecognised(error.message);
    }

    const manifest = entries.get('export.json');
    if (!manifest) {
      throw unrecognised(
        `Archive ZIP sans « export.json » (entrées : ${[...entries.keys()].join(', ')}).`,
      );
    }
    const parsed = fromJson(new TextDecoder().decode(manifest));
    notes.push(`${entries.size} fichier(s) dans l'archive, manifeste « export.json » lu.`);
    return { ...parsed, notes };
  }

  const text = String(file?.text ?? '');
  const trimmed = text.replace(/^\uFEFF/, '').trimStart();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return { ...fromJson(text), notes };
  }
  if (name.endsWith('.csv') || trimmed.includes(';') || trimmed.includes(',')) {
    return { ...fromCsv(text), notes };
  }

  throw unrecognised(
    name ? `« ${name} » n'est pas un format reconnu.` : "Ce fichier n'est pas un format reconnu.",
  );
}

/**
 * Convertit des enregistrements bruts en liens valides, en écartant les autres.
 *
 * Un enregistrement refusé ne doit pas faire échouer tout l'import : il est
 * compté et signalé, comme les doublons.
 *
 * @param {object[]} records
 * @param {{ now?: number }} [options]
 * @returns {{ links: object[], rejected: number }}
 */
function toImportableLinks(records, options = {}) {
  const links = [];
  let rejected = 0;

  for (const record of records) {
    try {
      links.push(createLink({ ...record, source: 'import' }, options));
    } catch {
      rejected += 1;
    }
  }
  return { links, rejected };
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/label-export.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Export d'étiquettes en images.
 *
 * Le principe : plutôt que de parler à chaque modèle d'étiqueteuse — ce qui
 * suppose du matériel, un protocole et des pilotes — on produit un dossier
 * d'images **prêtes à imprimer**. Libre à l'utilisateur de les passer à
 * l'imprimante qu'il veut : l'application du fabricant, un traitement de texte,
 * un navigateur, ou une Niimbot via le module dédié.
 *
 * Chaque image contient le QR Code et le texte choisi. Le dossier emporte aussi
 * une planche HTML imprimable, un CSV reliant chaque URL à son image, et le
 * détail des réglages — de quoi reproduire l'export à l'identique.
 *
 * Ce module ne fait que **planifier** : il calcule des dimensions en pixels et
 * prépare l'archive. Le rendu des images lui-même appartient à l'appelant, qui
 * dispose d'un canvas — c'est la seule partie qui ne peut pas vivre ici.
 */







/**
 * Formats d'étiquettes courants.
 *
 * `heightMm: null` signifie que la hauteur découle du contenu — c'est le cas
 * des rouleaux continus, où l'on coupe après impression.
 */
const LABEL_FORMATS = Object.freeze([
  {
    id: 'niimbot-d110',
    name: 'Niimbot D110 — 12 mm utile (203 dpi)',
    widthMm: 12,
    heightMm: null,
    dpi: 203,
  },
  {
    id: 'niimbot-m2',
    name: 'Niimbot M2 — 48 mm (300 dpi)',
    widthMm: 48,
    heightMm: null,
    dpi: 300,
  },
  {
    id: 'niimbot-m3',
    name: 'Niimbot M3 — 72 mm (300 dpi)',
    widthMm: 72,
    heightMm: null,
    dpi: 300,
  },
  {
    id: 'brother-62',
    name: 'Brother QL — 62 mm (300 dpi)',
    widthMm: 62,
    heightMm: 40,
    dpi: 300,
  },
  {
    id: 'dymo-54',
    name: 'Dymo LabelWriter — 54 mm (300 dpi)',
    widthMm: 54,
    heightMm: 32,
    dpi: 300,
  },
  {
    id: 'zebra-2in',
    name: 'Zebra 2 pouces — 54 mm (203 dpi)',
    widthMm: 54,
    heightMm: 25,
    dpi: 203,
  },
  {
    id: 'generic-50x30',
    name: 'Générique — 50 × 30 mm (300 dpi)',
    widthMm: 50,
    heightMm: 30,
    dpi: 300,
  },
  {
    id: 'generic-70x40',
    name: 'Générique — 70 × 40 mm (300 dpi)',
    widthMm: 70,
    heightMm: 40,
    dpi: 300,
  },
  {
    id: 'avery-3x8',
    name: 'Planche A4 — 3 × 8 (63,5 × 33,9 mm)',
    widthMm: 63.5,
    heightMm: 33.9,
    dpi: 300,
  },
  // Formats Brother QL (rouleaux DK, 300 dpi). Les cotes proviennent du
  // catalogue du fabricant ; ce sont des cibles d'image, pas des profils
  // d'imprimante — l'export ne parle à aucune étiqueteuse.
  {
    id: 'brother-dk11201',
    name: 'Brother DK-11201 — 29 × 90 mm (300 dpi)',
    widthMm: 29,
    heightMm: 90,
    dpi: 300,
  },
  {
    id: 'brother-dk11202',
    name: 'Brother DK-11202 — 62 × 100 mm (300 dpi)',
    widthMm: 62,
    heightMm: 100,
    dpi: 300,
  },
  {
    id: 'brother-dk11208',
    name: 'Brother DK-11208 — 38 × 90 mm (300 dpi)',
    widthMm: 38,
    heightMm: 90,
    dpi: 300,
  },
  {
    id: 'brother-dk11209',
    name: 'Brother DK-11209 — 29 × 62 mm (300 dpi)',
    widthMm: 29,
    heightMm: 62,
    dpi: 300,
  },
  {
    id: 'brother-dk11218',
    name: 'Brother DK-11218 — 24 mm rond (300 dpi)',
    widthMm: 24,
    heightMm: 24,
    dpi: 300,
  },
  {
    id: 'brother-dk11219',
    name: 'Brother DK-11219 — 12 mm rond (300 dpi)',
    widthMm: 12,
    heightMm: 12,
    dpi: 300,
  },
  {
    id: 'brother-dk22205',
    name: 'Brother DK-22205 — 62 mm continu (300 dpi)',
    widthMm: 62,
    heightMm: null,
    dpi: 300,
  },
  {
    id: 'brother-dk22210',
    name: 'Brother DK-22210 — 29 mm continu (300 dpi)',
    widthMm: 29,
    heightMm: null,
    dpi: 300,
  },
  {
    id: 'dymo-54x101',
    name: 'Dymo LabelWriter — 54 × 101 mm (300 dpi)',
    widthMm: 54,
    heightMm: 101,
    dpi: 300,
  },
  {
    id: 'zebra-4x6',
    name: 'Zebra 4 × 6 po — 104 × 152 mm (203 dpi)',
    widthMm: 104,
    heightMm: 152,
    dpi: 203,
  },
]);

/**
 * Nombre de lignes qu'une date peut occuper sous le QR Code.
 *
 * Au-delà, elle est abandonnée plutôt qu'imprimée partiellement : sur une
 * étiquette de 12 mm, « 15/09/2026 18:01 » demande trois lignes et viderait le
 * texte de son sens. Réduire la taille de police est la façon de la faire tenir.
 */
const DATE_MAX_LINES = 3;

/**
 * Réglages par défaut de l'export.
 *
 * Le contenu de l'étiquette se **coche**, case par case, et les cases se
 * cumulent : le numéro, le titre, l'URL et le domaine ne s'excluent pas. Une
 * liste déroulante à cinq modes répondait à la même question que trois cases
 * posées plus bas, et trois sources décrivaient la même intention — `textMode`,
 * `showTitle`, et les cases elles-mêmes. Un seul jeu de cases reste.
 *
 * L'URL seule par défaut : c'est ce que cet onglet imprimait déjà, et changer
 * le défaut aurait réécrit le contenu de toute image exportée sans qu'on ait
 * rien demandé.
 */
const DEFAULT_EXPORT_OPTIONS = Object.freeze({
  formatId: 'niimbot-d110',
  showIndex: false,
  showTitle: false,
  showUrl: true,
  showHost: false,
  // Aucune date par défaut : chaque ligne de texte prend la place du QR Code, et une
  // étiquette de 12 mm n'en a pas de reste.
  dateMode: 'none',
  marginMm: 1.5,
  qrRatio: 0.9,
  fontSizePt: 7,
  cutMarks: true,
  maxLines: 4,
});

// `mmToPx` vient de `label.js` : le redéclarer ici provoquerait une collision
// de noms au moment de l'assemblage, l'un des deux masquant l'autre.

/**
 * Convertit des points typographiques en pixels.
 * @param {number} pt
 * @param {number} dpi
 * @returns {number}
 */
/**
 * Échelle de l'aperçu d'une étiquette, et multiple de la taille réelle.
 *
 * L'agrandissement est **nécessaire** : une étiquette de 12 mm mesure 45 px à
 * l'écran, et un QR Code y est injugeable. Ce qui manquait n'était donc pas la
 * réduction, mais l'aveu : l'aperçu agrandissait huit fois et demi sans le dire,
 * et rien à l'écran ne permettait de s'en apercevoir.
 *
 * La borne porte désormais sur le **multiple de la taille réelle**, et non sur
 * un facteur de rendu : plafonner à « 4 » donnait 8,5 × sur une tête de 203 ppp
 * et 2,2 × sur une tête de 300 ppp, sans que rien ne relie le chiffre au
 * résultat. On calcule donc ce que vaut un pixel de rendu en pixel CSS, et l'on
 * plafonne le rapport des deux.
 *
 * `realSize` rend l'étiquette à sa taille physique sur l'écran — 45 px pour
 * 12 mm, à la correspondance admise de 96 px CSS par pouce.
 *
 * @param {{ widthPx: number, dpi: number, availablePx: number,
 *   realSize?: boolean, maxMultiple?: number }} options
 * @returns {{ zoom: number, multiple: number }}
 */
function labelPreviewZoom(options) {
  const widthPx = Math.max(1, options.widthPx);
  const dpi = options.dpi > 0 ? options.dpi : 203;
  const availablePx = Math.max(1, options.availablePx);
  // Correspondance admise entre le CSS et le monde physique, faute de connaître
  // le matériel d'affichage.
  const CSS_PX_PER_INCH = 96;
  const reel = CSS_PX_PER_INCH / dpi;
  const maxMultiple = options.maxMultiple ?? 4;

  if (options.realSize) return { zoom: reel, multiple: 1 };

  const zoom = Math.min((maxMultiple * CSS_PX_PER_INCH) / dpi, availablePx / widthPx);
  return { zoom, multiple: (zoom * dpi) / CSS_PX_PER_INCH };
}

function ptToPx(pt, dpi) {
  return Math.round((pt / 72) * dpi);
}

/**
 * Retrouve un format par son identifiant.
 * @param {string} id
 * @returns {typeof LABEL_FORMATS[number]}
 */
function findFormat(id) {
  return LABEL_FORMATS.find((format) => format.id === id) ?? LABEL_FORMATS[0];
}

/**
 * Segments de texte d'une étiquette, selon les cases cochées.
 *
 * Chaque case ajoute son segment, dans l'ordre où on les lit sur l'étiquette :
 * le numéro d'abord — c'est ce qu'on cherche des yeux —, puis le titre, l'URL et
 * le domaine. Aucune case n'en éteint une autre : cocher « Domaine » et « URL »
 * imprime les deux, comme dans l'onglet Niimbot, qui laisse déjà ces deux cases
 * se cumuler. Un domaine qui décocherait l'URL ferait deux règles pour une même
 * question, selon l'onglet.
 *
 * Le numéro n'est imprimé que s'il est **connu** : un lien sans rang, ou une
 * case cochée sans rang, laisse l'étiquette sans numéro plutôt que d'en inventer
 * un. Le titre vide ne réserve pas de ligne, et le domaine imprimé est celui du
 * site visé — jamais celui du raccourcisseur, qui n'apprendrait rien à qui lit
 * l'étiquette.
 *
 * @param {{ url: string, title?: string }} link
 * @param {{
 *   index?: number|null,
 *   showIndex?: boolean,
 *   showTitle?: boolean,
 *   showUrl?: boolean,
 *   showHost?: boolean,
 * }} [options]
 * @returns {string[]}
 */
function labelSegments(link, options = {}) {
  const index = Number.isFinite(options.index) ? options.index : null;
  const title = typeof link.title === 'string' ? link.title.trim() : '';

  const segments = [];
  if (options.showIndex === true && index !== null) segments.push(`N° ${index}`);
  if (options.showTitle === true && title !== '') segments.push(title);
  if (options.showUrl === true) segments.push(link.url);
  if (options.showHost === true) segments.push(sourceHost(link));
  return segments;
}

/**
 * Produit un nom de fichier court, unique et lisible.
 *
 * @param {import('./link.js').LinkRecord} link
 * @param {number} index
 * @param {number} total
 * @returns {string}
 */
function labelFileName(link, index, total) {
  const padding = String(total).length;
  const number = String(index + 1).padStart(padding, '0');

  const slug = (link.title || sourceHost(link) || 'lien')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  return `${number}-${slug || 'lien'}.png`;
}

/**
 * Planifie une étiquette : dimensions en pixels et lignes de texte.
 *
 * @param {object} options
 * @param {import('./link.js').LinkRecord} options.link
 * @param {typeof LABEL_FORMATS[number]} options.format
 * @param {(text: string) => number} options.measure Mesure de texte, fournie
 *   par l'appelant — lui seul connaît la police réellement utilisée.
 * @param {number|null} [options.index] Rang du lien, imprimé quand la case
 *   « N° du lien » est cochée.
 * @param {boolean} [options.showIndex] Imprime le numéro du lien, en tête.
 * @param {boolean} [options.showTitle] Imprime le titre.
 * @param {boolean} [options.showUrl] Imprime l'URL.
 * @param {boolean} [options.showHost] Imprime le domaine du site visé.
 * @param {number} [options.marginMm]
 * @param {number} [options.qrRatio]
 * @param {number} [options.fontSizePt]
 * @param {number} [options.maxLines]
 * @returns {{
 *   widthPx: number, heightPx: number, marginPx: number, qrSizePx: number,
 *   qrScale: number, qrModules: number, fontSizePx: number, lineHeightPx: number,
 *   lines: string[], textTopPx: number, fits: boolean, url: string,
 * }}
 */
function planLabel(options) {
  const { link, format, measure } = options;
  const showIndex = options.showIndex ?? DEFAULT_EXPORT_OPTIONS.showIndex;
  const showTitle = options.showTitle ?? DEFAULT_EXPORT_OPTIONS.showTitle;
  const showUrl = options.showUrl ?? DEFAULT_EXPORT_OPTIONS.showUrl;
  const showHost = options.showHost ?? DEFAULT_EXPORT_OPTIONS.showHost;
  const dateMode = options.dateMode ?? DEFAULT_EXPORT_OPTIONS.dateMode;
  const marginMm = options.marginMm ?? DEFAULT_EXPORT_OPTIONS.marginMm;
  const qrRatio = options.qrRatio ?? DEFAULT_EXPORT_OPTIONS.qrRatio;
  const fontSizePt = options.fontSizePt ?? DEFAULT_EXPORT_OPTIONS.fontSizePt;
  const maxLines = options.maxLines ?? DEFAULT_EXPORT_OPTIONS.maxLines;

  const widthPx = mmToPx(format.widthMm, format.dpi);
  const marginPx = Math.max(0, mmToPx(marginMm, format.dpi));
  const fontSizePx = Math.max(6, ptToPx(fontSizePt, format.dpi));
  const lineHeightPx = Math.ceil(fontSizePx * 1.2);
  const innerWidth = Math.max(1, widthPx - marginPx * 2);

  const matrix = encodeQr(link.url, { ecc: 'M', border: 2 });

  // La date est un segment à part : elle ne se mélange pas à l'URL, sinon elle
  // se retrouverait collée au bout d'une ligne coupée.
  const dateText = formatCaptureDate(link.createdAt, dateMode);

  // **Une date ne se coupe pas.** Sur une étiquette de 12 mm, « 15/09/2026
  // 18:01 » occupe plusieurs lignes ; laisser le plafond de lignes l'amputer
  // donnerait « 15/09/ » — une date fausse, ce qui est pire que pas de date.
  // On réserve donc ses lignes avant celles du texte principal, et on
  // l'abandonne entièrement si elle ne tient pas.
  // `wrapDate` découpe la date **entière** ou la refuse : « 15/09/ » puis
  // « 2026 » se lit mal. Il coupe au seul endroit acceptable, l'espace entre la
  // date et l'heure, ce qui permet à « 16/09/2026 00:28 » de tenir en deux ou
  // trois lignes au lieu d'être abandonné en bloc.
  // Ici la taille de police est imposée par l'utilisateur : on ne peut pas la
  // réduire pour faire tenir la date, comme le fait l'étiquette Niimbot. On
  // accepte donc un découpage plus franc, du moment que la date reste entière.
  const dateLines = dateText
    ? wrapDate(measure, dateText, innerWidth, DATE_MAX_LINES, { strict: false })
    : [];
  const dateOmitted = dateText !== '' && dateLines.length === 0;

  const bodySource = labelSegments(link, {
    index: options.index,
    showIndex,
    showTitle,
    showUrl,
    showHost,
  });
  const body = bodySource.join(' ');
  // Le texte principal garde son propre plafond : la date s'ajoute à lui au
  // lieu de lui prendre ses lignes. Elle les lui prenait, et l'URL se trouvait
  // tronquée à deux lignes dès qu'on demandait la date.
  //
  // Les segments sont découpés **ensemble**, et non chacun de son côté : c'est
  // ce que faisait déjà « Titre puis URL », et deux découpages séparés
  // laisseraient chacun la moitié d'une ligne vide.
  const bodyLines = body
    ? wrapText(measure, body, innerWidth, { maxLines })
    : [];

  const lines = [...bodyLines, ...dateLines];
  const textHeight = lines.length * lineHeightPx;

  // Hauteur fixe (planche) ou déduite du contenu (rouleau continu).
  const fixedHeight = format.heightMm ? mmToPx(format.heightMm, format.dpi) : 0;
  const gap = lines.length > 0 ? marginPx : 0;

  let qrSizePx;
  if (fixedHeight > 0) {
    const available = fixedHeight - marginPx * 2 - gap - textHeight;
    const side = Math.max(16, Math.min(innerWidth, available));
    // Un QR Code fait un nombre entier de modules : on arrondit vers le bas.
    qrSizePx = Math.max(matrix.size * 2, Math.floor(side / matrix.size) * matrix.size);
  } else {
    qrSizePx = Math.max(matrix.size * 2, Math.floor((innerWidth * qrRatio) / matrix.size) * matrix.size);
  }

  const qrScale = qrSizePx / matrix.size;
  const heightPx = fixedHeight > 0
    ? fixedHeight
    : marginPx * 2 + qrSizePx + gap + textHeight;

  return {
    widthPx,
    heightPx,
    marginPx,
    qrSizePx,
    qrScale,
    qrModules: matrix.size,
    fontSizePx,
    lineHeightPx,
    lines,
    textTopPx: marginPx + qrSizePx + gap,
    // `false` signale que le QR Code ne tient pas dans la largeur utile : l'appelant
    // peut alors prévenir plutôt que de rogner en silence.
    fits: qrSizePx <= innerWidth,
    url: link.url,
    dateOmitted,
  };
}

/**
 * Planifie toutes les étiquettes d'une collection.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @param {Omit<Parameters<typeof planLabel>[0], 'link'|'index'> & {
 *   rankOf?: (link: import('./link.js').LinkRecord, position: number) => number|null,
 * }} options `rankOf` fournit le numéro imprimé — celui de la collection, et non
 *   la position dans la sélection imprimée : sans lui, deux numérotations
 *   désigneraient le même lien, et la ligne « N° » de la planche ne
 *   correspondrait plus à l'étiquette. À défaut, la position dans la sélection,
 *   à partir de 1.
 * @returns {Array<{ link: import('./link.js').LinkRecord, fileName: string, plan: ReturnType<typeof planLabel> }>}
 */
function planLabels(links, options) {
  const { rankOf, ...reste } = options;
  return links.map((link, index) => ({
    link,
    fileName: labelFileName(link, index, links.length),
    plan: planLabel({
      ...reste,
      link,
      index: rankOf ? rankOf(link, index) : index + 1,
    }),
  }));
}

/**
 * Construit la planche HTML imprimable.
 *
 * C'est le chemin le plus court vers le papier : on ouvre le fichier dans un
 * navigateur, on imprime. Les images sont référencées en relatif, à côté du
 * fichier — l'archive entière est donc autonome.
 *
 * @param {Array<{ link: import('./link.js').LinkRecord, fileName: string, plan: object }>} planned
 * @param {{ title?: string, cutMarks?: boolean, format?: object }} [options]
 * @returns {string}
 */
function buildPrintSheet(planned, options = {}) {
  const title = options.title ?? 'Mes liens';
  const cutMarks = options.cutMarks ?? DEFAULT_EXPORT_OPTIONS.cutMarks;
  const format = options.format ?? findFormat(DEFAULT_EXPORT_OPTIONS.formatId);

  const cells = planned
    .map(({ link, fileName, plan }) => {
      const text = plan.lines
        .map((line) => `<span>${escapeHtml(line)}</span>`)
        .join('');
      return `      <figure class="label${cutMarks ? ' label--cut' : ''}" style="--w:${format.widthMm}mm">
        <img src="etiquettes/${encodeURIComponent(fileName)}" alt="${escapeHtml(link.url)}" width="${plan.qrSizePx}" height="${plan.qrSizePx}">
        <figcaption>${text}</figcaption>
      </figure>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)} — étiquettes</title>
<style>
  body { margin: 0; padding: 8mm; font-family: -apple-system, system-ui, sans-serif; background: #f4f4f2; }
  h1 { font-size: 12pt; margin: 0 0 6mm; }
  .sheet { display: flex; flex-wrap: wrap; gap: 3mm; }
  .label { width: var(--w); margin: 0; background: #fff; padding: 1.5mm; box-sizing: border-box;
           display: flex; flex-direction: column; align-items: center; gap: 1mm; break-inside: avoid; }
  .label--cut { outline: 0.2mm dashed #999; }
  .label img { display: block; max-width: 100%; height: auto; image-rendering: pixelated; }
  figcaption { font-size: 6pt; line-height: 1.2; text-align: center; word-break: break-all; }
  figcaption span { display: block; }
  @media print {
    body { background: #fff; padding: 0; }
    h1 { display: none; }
    .sheet { gap: 0; }
    .label--cut { outline-color: #ddd; }
  }
</style>
</head>
<body>
<h1>${escapeHtml(title)} — ${planned.length} étiquette${planned.length > 1 ? 's' : ''}</h1>
<div class="sheet">
${cells}
</div>
</body>
</html>
`;
}

/**
 * Échappe un texte pour le HTML.
 * @param {unknown} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Assemble l'archive de l'export.
 *
 * @param {object} options
 * @param {Array<{ link: import('./link.js').LinkRecord, fileName: string, plan: object }>} options.planned
 * @param {Map<string, Uint8Array>} options.images PNG indexés par nom de fichier.
 * @param {object} [options.settings] Réglages retenus, consignés dans l'archive.
 * @param {number} [options.now]
 * @returns {Uint8Array}
 */
function buildLabelArchive(options) {
  const { planned, images } = options;
  const now = options.now ?? Date.now();
  const format = options.settings?.format ?? findFormat(DEFAULT_EXPORT_OPTIONS.formatId);

  const entries = [];

  for (const { fileName } of planned) {
    const png = images.get(fileName);
    if (png) entries.push({ name: `etiquettes/${fileName}`, data: png });
  }

  // Un CSV qui relie chaque URL à son image : c'est ce qui permet de retrouver
  // l'étiquette d'un lien sans ouvrir les images une à une.
  //
  // Quand au moins un lien est raccourci, une colonne « URL d'origine » apparaît
  // en fin de tableau : l'archive doit toujours permettre de retrouver la vraie
  // adresse, même si le service de raccourcissement disparaît.
  const withShort = planned.some(
    ({ link }) => hasShortUrl(link) && sourceUrl(link) !== link.url,
  );
  const csvRows = planned.map(({ link, fileName }, index) => [
    index + 1,
    link.url,
    ...(withShort ? [sourceUrl(link) === link.url ? '' : sourceUrl(link)] : []),
    link.title,
    `etiquettes/${fileName}`,
  ]);
  const header = withShort
    ? ['N°', 'URL', 'URL d\'origine', 'Titre', 'Image']
    : ['N°', 'URL', 'Titre', 'Image'];
  const csv = '\uFEFF' + [header, ...csvRows]
    .map((row) => row.map((cell) => escapeCsv(cell)).join(';'))
    .join('\r\n') + '\r\n';
  entries.push({ name: 'liens.csv', data: csv });

  entries.push({
    name: 'planche.html',
    data: buildPrintSheet(planned, {
      title: options.settings?.title ?? 'Mes liens',
      cutMarks: options.settings?.cutMarks,
      format,
    }),
  });

  entries.push({
    name: 'export.json',
    data: JSON.stringify(
      {
        format: 'url-qr-code-printer/labels',
        version: 1,
        exportedAt: new Date(now).toISOString(),
        settings: {
          labelFormat: format.id,
          labelName: format.name,
          widthMm: format.widthMm,
          heightMm: format.heightMm,
          dpi: format.dpi,
          // Le contenu coché, case par case. Il remplace `textMode` et le
          // `showTitle` qui le complétait : deux réglages pour une question, et
          // un troisième endroit — les cases — pour la même intention. Rien ne
          // relit ces clés à l'import : aucune archive existante n'est à migrer.
          showIndex: options.settings?.showIndex ?? DEFAULT_EXPORT_OPTIONS.showIndex,
          showTitle: options.settings?.showTitle ?? DEFAULT_EXPORT_OPTIONS.showTitle,
          showUrl: options.settings?.showUrl ?? DEFAULT_EXPORT_OPTIONS.showUrl,
          showHost: options.settings?.showHost ?? DEFAULT_EXPORT_OPTIONS.showHost,
          dateMode: options.settings?.dateMode ?? DEFAULT_EXPORT_OPTIONS.dateMode,
          marginMm: options.settings?.marginMm ?? DEFAULT_EXPORT_OPTIONS.marginMm,
          fontSizePt: options.settings?.fontSizePt ?? DEFAULT_EXPORT_OPTIONS.fontSizePt,
          cutMarks: options.settings?.cutMarks ?? DEFAULT_EXPORT_OPTIONS.cutMarks,
        },
        count: planned.length,
        // Signale tout de suite les dates abandonnées : un réglage demandé et
        // non appliqué doit se voir, pas se deviner sur l'image.
        datesOmitted: planned.filter(({ plan }) => plan.dateOmitted).length,
        labels: planned.map(({ link, fileName, plan }) => ({
          file: `etiquettes/${fileName}`,
          url: link.url,
          // Consignée seulement quand elle diffère : le manifeste reste compact,
          // et une étiquette raccourcie reste réversible.
          ...(sourceUrl(link) !== link.url ? { originalUrl: sourceUrl(link) } : {}),
          title: link.title,
          widthPx: plan.widthPx,
          heightPx: plan.heightPx,
        })),
      },
      null,
      2,
    ),
  });

  return createZip(entries, { date: new Date(now) });
}

/**
 * Échappe un champ CSV — même règle que l'export texte.
 * @param {unknown} value
 * @returns {string}
 */
function escapeCsv(value) {
  const text = value == null ? '' : String(value);
  return /[;"\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

/**
 * Nom de fichier de l'archive d'étiquettes.
 *
 * @param {number} [now]
 * @param {string} [base] Nom de la collection, pour retrouver l'archive dans un
 *   dossier de téléchargements. Le défaut reste `etiquettes-qr`.
 * @returns {string}
 */
function labelArchiveName(now = Date.now(), base = 'etiquettes-qr') {
  return exportFilename(base, 'zip', now || Date.now());
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/table-export.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Export du tableau en dossier autonome : un modèle JSON, ses QR Codes PNG et
 * une page HTML prête à l'emploi.
 *
 * Le tableau de l'onglet « Tableau » n'avait aucune sortie réutilisable : ses
 * colonnes et ses QR Codes ne quittaient le navigateur que par l'impression.
 * Ici, on produit un dossier qu'on ouvre, qu'on sert ou qu'on donne à lire à
 * une application. Chaque ligne porte son image PNG — utilisable telle quelle
 * dans une page, un traitement de texte ou un CMS, sans exiger du consommateur
 * qu'il sache rendre un SVG.
 *
 * Le PNG est rendu à une échelle **entière** : les modules tombent sur des
 * pixels nets, si bien qu'une vectorisation ultérieure retrouve le motif sans
 * lisser les bords. Le modèle conserve l'URL encodée, la correction d'erreur et
 * la bordure, de sorte qu'une régénération produise exactement le même code.
 *
 * Ce module est pur : il reçoit des LinkRecord et assemble l'archive. Le rendu
 * passe par l'encodeur PNG maison, qui n'utilise que des API présentes dans
 * Node comme dans le navigateur.
 */






/** Identifiant du format, tel qu'il part dans le JSON. */
const TABLE_EXPORT_FORMAT = 'url-qr-code-printer/table';

/** Version du format, à incrémenter en cas de rupture. */
const TABLE_EXPORT_VERSION = 1;

/** Dossier des images dans l'archive. */
const QR_DIRECTORY = 'qr';

/**
 * Colonnes du tableau, dans l'ordre d'impression de `buildTable`.
 *
 * La clé sert d'identifiant dans le JSON ; le libellé n'est employé que par le
 * rendu HTML, en français, comme les autres exports texte de l'application.
 */
const TABLE_COLUMNS = Object.freeze([
  { key: 'index', label: 'N°' },
  { key: 'qr', label: 'QR Code' },
  { key: 'url', label: 'URL' },
  { key: 'title', label: 'Titre' },
  { key: 'date', label: 'Date' },
  { key: 'tags', label: 'Tags' },
  { key: 'note', label: 'Note' },
]);

/**
 * Réglages d'encodage et de taille des images QR Code.
 *
 * `maxSize` borne la largeur : une URL longue ne doit pas produire une image
 * démesurée. L'échelle demandée est un plafond ; elle est réduite, jamais
 * multipliée, pour rester un entier sous la borne.
 */
const DEFAULT_TABLE_EXPORT_OPTIONS = Object.freeze({
  ecc: 'M',
  border: 2,
  scale: 10,
  maxSize: 720,
});

/**
 * Clés des colonnes retenues, dans l'ordre du tableau imprimé.
 *
 * @param {{ index?: boolean, qr?: boolean, url?: boolean, title?: boolean, date?: boolean, tags?: boolean, note?: boolean }} [columns]
 * @returns {string[]}
 */
function tableColumnKeys(columns = {}) {
  return TABLE_COLUMNS.filter((column) => columns[column.key]).map((column) => column.key);
}

/**
 * Échelle entière qui tient dans la largeur maximale.
 *
 * @param {number} moduleCount
 * @param {number} requested
 * @param {number} maxSize
 * @returns {number}
 */
function fitScale(moduleCount, requested, maxSize) {
  const wanted = Math.max(1, Math.floor(Number(requested) || 1));
  const room = Math.max(1, Math.floor(maxSize / moduleCount));
  return Math.min(wanted, room);
}

/**
 * Nom d'entrée du PNG, garanti ASCII : l'écriture ZIP refuse le reste.
 *
 * @param {import('./link.js').LinkRecord} link
 * @param {number} index
 * @returns {string}
 */
function qrFileName(link, index) {
  const stem = String(link.id ?? '').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return `${QR_DIRECTORY}/${stem || `lien-${index + 1}`}.png`;
}

/**
 * Construit le modèle du tableau et les matrices QR Code prêtes à rendre.
 *
 * Le modèle est sérialisable tel quel ; les matrices restent en mémoire, car
 * un tableau de booléens n'a pas sa place dans un JSON destiné à un lecteur
 * humain. `buildTableArchive` les transforme en PNG et les référence.
 *
 * @param {import('./link.js').LinkRecord[]} links Liens déjà résolus par `resolveTargets`.
 * @param {{
 *   title?: string,
 *   columns?: object,
 *   dateMode?: 'none'|'date'|'datetime',
 *   rankOf?: (link: import('./link.js').LinkRecord, index: number) => number,
 *   ecc?: 'L'|'M'|'Q'|'H',
 *   border?: number,
 *   scale?: number,
 *   maxSize?: number,
 *   now?: number,
 * }} [options]
 * @returns {{ model: object, images: Map<string, { matrix: import('./qr.js').QrMatrix, scale: number }> }}
 */
function buildTableModel(links, options = {}) {
  const columns = options.columns ?? {};
  const ecc = options.ecc ?? DEFAULT_TABLE_EXPORT_OPTIONS.ecc;
  const border = Number.isInteger(options.border) ? options.border : DEFAULT_TABLE_EXPORT_OPTIONS.border;
  const requestedScale = options.scale ?? DEFAULT_TABLE_EXPORT_OPTIONS.scale;
  const maxSize = options.maxSize ?? DEFAULT_TABLE_EXPORT_OPTIONS.maxSize;
  const dateMode = options.dateMode ?? 'date';
  const now = options.now ?? Date.now();
  const rankOf = options.rankOf ?? ((_link, index) => index + 1);

  /** @type {Map<string, { matrix: import('./qr.js').QrMatrix, scale: number }>} */
  const images = new Map();
  const selected = tableColumnKeys(columns);

  const rows = links.map((link, index) => {
    /** @type {Record<string, unknown>} */
    const row = {};

    if (columns.index) row.index = rankOf(link, index);
    if (columns.url) row.url = link.url;
    if (columns.title) row.title = link.title ?? '';
    if (columns.date) row.date = formatCaptureDate(link.createdAt, dateMode);
    if (columns.tags) row.tags = Array.isArray(link.tags) ? [...link.tags] : [];
    if (columns.note) row.note = link.note ?? '';

    // Quand le QR Code encode un raccourci, l'adresse collectée reste consignée :
    // aucune sortie ne doit perdre une URL. Elle n'est pas une colonne — le
    // tableau ne l'affiche pas — mais le modèle la conserve.
    const original = typeof link.originalUrl === 'string' ? link.originalUrl : '';
    if (original && original !== link.url) row.sourceUrl = original;

    if (columns.qr) {
      const file = qrFileName(link, index);
      const matrix = encodeQr(link.url, { ecc, border });
      const scale = fitScale(matrix.size, requestedScale, maxSize);
      row.qr = {
        file,
        content: link.url,
        ecc,
        border,
        version: matrix.version,
        scale,
        sizePx: matrix.size * scale,
      };
      images.set(file, { matrix, scale });
    }

    return row;
  });

  return {
    model: {
      format: TABLE_EXPORT_FORMAT,
      version: TABLE_EXPORT_VERSION,
      exportedAt: new Date(now).toISOString(),
      title: options.title ?? 'Mes liens',
      count: links.length,
      columns: selected,
      dateMode,
      qr: { ecc, border, scale: requestedScale, maxSize },
      rows,
    },
    images,
  };
}

/**
 * Échappe un texte pour le HTML.
 * @param {unknown} value
 * @returns {string}
 */
function escapeTableHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Construit la page HTML du tableau, images en chemins relatifs.
 *
 * C'est le chemin le plus court vers un résultat visible : on ouvre le fichier
 * dans un navigateur, et le tableau est là, sans écrire une ligne de code. Le
 * fichier reste lisible à côté de ses images, comme la planche d'étiquettes.
 *
 * @param {object} model Modèle produit par `buildTableModel`.
 * @returns {string}
 */
function buildTableHtml(model) {
  const columns = TABLE_COLUMNS.filter((column) => model.columns.includes(column.key));

  const head = columns.map((column) => `<th>${escapeTableHtml(column.label)}</th>`).join('');

  const rows = model.rows.map((row) => {
    const cells = columns.map((column) => {
      if (column.key === 'qr') {
        const qr = row.qr ?? {};
        return `<td class="qr"><img src="${escapeTableHtml(qr.file)}" alt="${escapeTableHtml(qr.content)}" width="${qr.sizePx}" height="${qr.sizePx}"></td>`;
      }
      if (column.key === 'tags') {
        return `<td>${escapeTableHtml((row.tags ?? []).join(' '))}</td>`;
      }
      return `<td>${escapeTableHtml(String(row[column.key] ?? ''))}</td>`;
    }).join('');
    return `      <tr>${cells}</tr>`;
  }).join('\n');

  const exported = formatDateTime(Date.parse(model.exportedAt));

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeTableHtml(model.title)} — tableau</title>
<style>
  body { margin: 0; padding: 8mm; font-family: -apple-system, system-ui, sans-serif; background: #f4f4f2; color: #111; }
  h1 { font-size: 14pt; margin: 0 0 2mm; }
  p.meta { margin: 0 0 6mm; color: #555; font-size: 9pt; }
  table { border-collapse: collapse; background: #fff; width: 100%; }
  th, td { border: 0.2mm solid #bbb; padding: 1.5mm 2mm; text-align: left; vertical-align: middle; font-size: 9pt; }
  th { background: #eee; }
  td.qr { width: 0; }
  td.qr img { display: block; image-rendering: pixelated; }
  @media print {
    body { background: #fff; padding: 0; }
    p.meta { display: none; }
  }
</style>
</head>
<body>
<h1>${escapeTableHtml(model.title)}</h1>
<p class="meta">${model.count} lien${model.count > 1 ? 's' : ''} — exporté le ${escapeTableHtml(exported)}</p>
<table>
  <thead>
    <tr>${head}</tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>
</body>
</html>
`;
}

/**
 * Rend une matrice QR Code en image RVBA agrandie d'un facteur entier.
 *
 * @param {import('./qr.js').QrMatrix} matrix
 * @param {number} scale
 * @returns {{ width: number, height: number, data: Uint8Array }}
 */
function rgbaFromQr(matrix, scale) {
  const size = matrix.size * scale;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    const source = matrix.data[Math.floor(y / scale)];
    for (let x = 0; x < size; x++) {
      const dark = source[Math.floor(x / scale)];
      const offset = (y * size + x) * 4;
      const value = dark ? 0 : 255;
      data[offset] = value;
      data[offset + 1] = value;
      data[offset + 2] = value;
      data[offset + 3] = 0xff;
    }
  }

  return { width: size, height: size, data };
}

/**
 * Assemble le dossier du tableau : `table.json`, `table.html` et `qr/*.png`.
 *
 * Le JSON est le contrat — il décrit les colonnes, les lignes et, pour chaque
 * QR Code, de quoi le régénérer à l'identique. Les images sont là pour l'usage
 * direct, et le HTML pour n'avoir rien à coder.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @param {Parameters<typeof buildTableModel>[1] & { onProgress?: (done: number, total: number) => void }} [options]
 * @returns {Promise<{ bytes: Uint8Array, model: object }>}
 */
async function buildTableArchive(links, options = {}) {
  const { model, images } = buildTableModel(links, options);
  const entries = [];

  let done = 0;
  for (const row of model.rows) {
    if (!row.qr) continue;
    const image = images.get(row.qr.file);
    const png = await encodePng(rgbaFromQr(image.matrix, image.scale));
    entries.push({ name: row.qr.file, data: png });
    options.onProgress?.(++done, images.size);
  }

  entries.push({ name: 'table.json', data: JSON.stringify(model, null, 2) + '\n' });
  entries.push({ name: 'table.html', data: buildTableHtml(model) });

  const bytes = createZip(entries, { date: new Date(model.exportedAt) });
  return { bytes, model };
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/pagination.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Découpage d'une suite de hauteurs en pages qui tiennent.
 *
 * Le tableau imprimé tenait sur **une** page, quelle que soit sa longueur : sa
 * boîte avait la hauteur du papier et `overflow: hidden`, si bien que le contenu
 * qui dépassait était tranché au bord de la feuille — la dernière ligne coupée en
 * deux, et les suivantes absentes. Mesuré sur 45 liens : 46 lignes, 2 466 px de
 * tableau pour 1 123 px de page utile, **27 lignes hors de la page**.
 *
 * Le calcul vit ici, et non dans le rendu, pour deux raisons : il se teste sans
 * navigateur, et il ne décide **rien** de l'apparence. L'appelant mesure les
 * hauteurs, ce module dit où couper.
 */

/**
 * Répartit des hauteurs de lignes en pages.
 *
 * Trois règles, et chacune corrige un défaut possible :
 *
 * 1. **L'ordre est conservé.** Un tableau se lit de haut en bas ; réordonner
 *    pour remplir les pages rendrait la lecture fausse.
 * 2. **Une ligne plus haute qu'une page occupe sa page**, seule. Elle n'est ni
 *    coupée ni retirée : une ligne perdue est une donnée perdue, alors qu'une
 *    page débordante se voit.
 * 3. **Une mesure absente ne fabrique pas de pages.** Si toutes les hauteurs
 *    sont nulles — un rendu qui n'a pas eu lieu, un DOM sans mise en page —, on
 *    rend **une** page plutôt qu'une par ligne : le mieux est de laisser le
 *    navigateur se débrouiller, pas de produire trente feuilles vides.
 *
 * @param {number[]} heights Hauteurs des lignes, dans l'ordre d'impression.
 * @param {number} usable Hauteur utile d'une page, dans la même unité.
 * @returns {Array<{ start: number, end: number }>} Tranches `[start, end[`.
 */
function paginateByHeight(heights, usable) {
  const limite = Number.isFinite(usable) && usable > 0 ? usable : 0;
  const hauteurs = Array.isArray(heights) ? heights : [];

  // Sans hauteur utile, il n'y a rien à répartir : une page, et le navigateur
  // se débrouille. Découper sur un zéro donnerait une ligne par page — le
  // contraire de ce qu'on veut, et une suite de feuilles presque vides.
  if (limite === 0) return [{ start: 0, end: hauteurs.length }];

  const pages = [];
  let debut = 0;
  let consomme = 0;

  for (let i = 0; i < hauteurs.length; i += 1) {
    const brut = Number(hauteurs[i]);
    const hauteur = Number.isFinite(brut) && brut > 0 ? brut : 0;

    // `i > debut` : une ligne seule sur sa page y reste, même trop haute.
    if (i > debut && consomme + hauteur > limite) {
      pages.push({ start: debut, end: i });
      debut = i;
      consomme = 0;
    }
    consomme += hauteur;
  }

  // Une suite vide rend une page vide : c'est ce que l'appelant imprime, et il
  // vaut mieux une page blanche qu'un tableau qui disparaît.
  pages.push({ start: debut, end: hauteurs.length });
  return pages;
}

/**
 * Nombre de pages qu'occuperait une suite de hauteurs.
 *
 * Raccourci de lecture pour les messages : « 45 lignes, 3 pages ».
 *
 * @param {number[]} heights
 * @param {number} usable
 * @returns {number}
 */
function countPages(heights, usable) {
  return paginateByHeight(heights, usable).length;
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/sheet-archive.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Archive d'une planche d'étiquettes.
 *
 * Le mode tableau savait produire un dossier — `table.html`, `table.json` et
 * ses QR Codes en images. La planche, non : elle ne s'imprimait que par la
 * fenêtre. Ce module comble ce manque, et il le fait d'une manière qui mérite
 * d'être dite.
 *
 * **Le HTML de la planche n'est pas reconstruit ici.** Il est repris tel quel de
 * ce que l'application a rendu pour l'aperçu et pour l'impression — le même
 * document, les mêmes règles, la même feuille de style. Reconstruire une
 * géométrie en millimètres dans un second endroit aurait produit une seconde
 * formule, et le fichier exporté aurait fini par ne plus ressembler à ce qui
 * sort de l'imprimante. C'est le reproche qu'on ne veut pas lire : « l'aperçu
 * était juste, l'export non ».
 *
 * Ce que ce module ajoute, et qui n'existe nulle part ailleurs : la page
 * autonome. La feuille de style de l'application masque la racine d'impression à
 * l'écran — elle n'est faite que pour le papier. Dans le fichier exporté, cette
 * racine **est** la page : on veut pouvoir la regarder avant d'imprimer, et
 * l'imprimer telle quelle ensuite.
 */




/** Identifiant du format, écrit dans le manifeste. Stable : il est persisté. */
const SHEET_ARCHIVE_FORMAT = 'url-qr-code-printer/sheet';

/**
 * Nom de fichier de l'archive d'une planche.
 *
 * Le nom de la collection est conservé : c'est ce qui permet de retrouver
 * l'archive dans un dossier de téléchargements. « planche » le distingue du
 * dossier du tableau, qui porte, lui, le nom seul.
 *
 * @param {number} [now]
 * @param {string} [base] Nom de la collection.
 * @returns {string}
 */
function sheetArchiveName(now = Date.now(), base = 'etiquettes') {
  return exportFilename(`${base} planche`, 'zip', now || Date.now());
}

/**
 * Échappe un texte destiné à du balisage.
 * @param {unknown} value
 * @returns {string}
 */
function escapeSheetHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Assemble la page autonome.
 *
 * @param {{
 *   pagesHtml: string,
 *   css: string,
 *   title?: string,
 *   note?: string,
 *   pageWidthMm: number,
 *   pageHeightMm: number,
 * }} options
 * @returns {string}
 */
function buildSheetHtml(options) {
  const titre = escapeSheetHtml(options.title || 'Ma collection');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre} — planche d'étiquettes</title>
<style>
  /* La taille du papier, comme à l'impression : une planche Letter ne doit pas
     partir sur du A4. */
  @page { size: ${options.pageWidthMm}mm ${options.pageHeightMm}mm; margin: 0; }
</style>
<style>
${options.css ?? ''}
</style>
<style>
  /* La feuille de style de l'application masque la racine d'impression à
     l'écran. Ici elle **est** la page : on veut la voir avant d'imprimer. */
  body { margin: 0; }
  .print-root { display: block !important; padding: 6mm; background: #f4f4f2; }
  .print-page { margin: 0 auto 6mm; box-shadow: 0 1px 6px rgba(0, 0, 0, 0.15); }
  .print-root > .print-page:last-child { margin-bottom: 0; }
  @media print {
    .print-root { padding: 0; background: #fff; }
    .print-page { margin: 0; box-shadow: none; }
  }
</style>
</head>
<body>
<div class="print-root">
${options.pagesHtml}
</div>
</body>
</html>
`;
}

/**
 * Construit l'archive d'une planche.
 *
 * Trois fichiers, comme le dossier du tableau : la page à imprimer, le
 * manifeste qui dit comment elle a été obtenue, et la correspondance entre les
 * liens et les étiquettes.
 *
 * @param {{
 *   pagesHtml: string,
 *   css: string,
 *   title?: string,
 *   note?: string,
 *   pageWidthMm: number,
 *   pageHeightMm: number,
 *   layout: { columns: number, rows: number, perPage: number, pages: number,
 *     labelWidthMm: number, labelHeightMm: number, marginXMm: number,
 *     marginYMm: number },
 *   qrRatio: number,
 *   qrSideMm: number,
 *   fontPt: number,
 *   options?: object,
 *   cells: Array<{ index: number, page: number, column: number, row: number,
 *     url: string, title?: string }>,
 *   now?: number,
 * }} options
 * @returns {{ bytes: Uint8Array, manifest: object }}
 */
function buildSheetArchive(options) {
  const now = options.now ?? Date.now();
  const cells = options.cells ?? [];
  const layout = options.layout;

  const html = buildSheetHtml({
    pagesHtml: options.pagesHtml,
    css: options.css,
    title: options.title,
    pageWidthMm: options.pageWidthMm,
    pageHeightMm: options.pageHeightMm,
  });

  const csv = toCsvTable(
    ['N°', 'Page', 'Colonne', 'Rangée', 'URL', 'Titre'],
    cells.map((cell) => [
      cell.index + 1,
      cell.page + 1,
      cell.column + 1,
      cell.row + 1,
      cell.url,
      cell.title ?? '',
    ]),
  );

  const manifest = {
    format: SHEET_ARCHIVE_FORMAT,
    version: 1,
    exportedAt: new Date(now).toISOString(),
    title: options.title ?? '',
    // La note décrit la collection : elle appartient au manifeste, sans quoi le
    // dossier ne dirait pas de quoi il parle.
    ...(options.note ? { note: options.note } : {}),
    page: { widthMm: options.pageWidthMm, heightMm: options.pageHeightMm },
    grid: {
      columns: layout.columns,
      rows: layout.rows,
      perPage: layout.perPage,
      pages: layout.pages,
    },
    label: { widthMm: layout.labelWidthMm, heightMm: layout.labelHeightMm },
    margins: { xMm: layout.marginXMm, yMm: layout.marginYMm },
    qr: { ratio: options.qrRatio, sideMm: options.qrSideMm },
    fontPt: options.fontPt,
    // Les cases cochées au moment de l'export : sans elles, le manifeste
    // décrirait une planche qu'on ne saurait pas reproduire.
    options: options.options ?? {},
    count: cells.length,
    cells,
  };

  const bytes = createZip([
    { name: 'planche.html', data: html },
    { name: 'liens.csv', data: csv },
    { name: 'planche.json', data: `${JSON.stringify(manifest, null, 2)}\n` },
  ], { date: new Date(now) });

  return { bytes, manifest };
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/label-archive.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Archive des étiquettes composées pour une imprimante Niimbot.
 *
 * Elle existe parce que l'onglet Niimbot ne savait produire **que** par
 * l'imprimante : sans matériel connecté, ses réglages — profil, consommable,
 * densité, orientation, taille du texte, contenu — ne servaient à rien. L'onglet
 * « Étiquette (divers) » exportait bien un dossier d'images, mais avec **ses**
 * réglages : format d'étiquette en millimètres et mode de texte, qui ne sont pas
 * ceux de la composition Niimbot. On ne pouvait donc pas obtenir l'image de ce
 * qu'on venait de composer.
 *
 * Ce module reçoit les images **déjà rendues**, par le même chemin que
 * l'impression et l'aperçu : `composeLabel` puis `drawLabel`, à la résolution de
 * la tête. Ce que le dossier contient est donc ce qui serait sorti — et non une
 * seconde composition qui lui ressemble.
 *
 * Les images sont accompagnées du manifeste qui les décrit et du CSV qui les
 * relie aux liens, comme les autres dossiers du projet.
 */




/** Identifiant du format, écrit dans le manifeste. Stable : il est persisté. */
const LABEL_ARCHIVE_FORMAT = 'url-qr-code-printer/printer-labels';

/**
 * Nom de fichier de l'archive.
 *
 * Le nom de la collection est conservé — c'est ce qui permet de retrouver
 * l'archive dans un dossier de téléchargements — et « niimbot » la distingue du
 * dossier d'images de l'autre onglet, qui porte le nom seul.
 *
 * @param {number} [now]
 * @param {string} [base]
 * @returns {string}
 */
function printerLabelArchiveName(now = Date.now(), base = 'etiquettes') {
  return exportFilename(`${base} niimbot`, 'zip', now || Date.now());
}

/**
 * Assemble l'archive.
 *
 * @param {{
 *   labels: Array<{ fileName: string, png: Uint8Array, widthMm: number,
 *     heightMm: number, widthPx: number, heightPx: number, pxPerModule?: number,
 *     url: string, title?: string }>,
 *   settings: object,
 *   title?: string,
 *   now?: number,
 * }} options
 * @returns {{ bytes: Uint8Array, manifest: object }}
 */
function buildPrinterLabelArchive(options) {
  const now = options.now ?? Date.now();
  const labels = options.labels ?? [];

  const entrees = labels.map((label) => ({
    name: `etiquettes/${label.fileName}`,
    data: label.png,
  }));

  const csv = toCsvTable(
    ['N°', 'URL', 'Titre', 'Largeur (mm)', 'Hauteur (mm)', 'Image'],
    labels.map((label, index) => [
      index + 1,
      label.url,
      label.title ?? '',
      label.widthMm,
      label.heightMm,
      `etiquettes/${label.fileName}`,
    ]),
  );

  const manifest = {
    format: LABEL_ARCHIVE_FORMAT,
    version: 1,
    exportedAt: new Date(now).toISOString(),
    title: options.title ?? '',
    // Tous les réglages de l'onglet Niimbot : sans eux, le dossier décrirait des
    // étiquettes qu'on ne saurait pas recomposer.
    settings: options.settings ?? {},
    count: labels.length,
    labels: labels.map((label) => ({
      file: `etiquettes/${label.fileName}`,
      url: label.url,
      title: label.title ?? '',
      widthMm: label.widthMm,
      heightMm: label.heightMm,
      widthPx: label.widthPx,
      heightPx: label.heightPx,
      ...(label.pxPerModule === undefined ? {} : { pxPerModule: label.pxPerModule }),
    })),
  };

  entrees.push({ name: 'liens.csv', data: csv });
  entrees.push({ name: 'etiquettes.json', data: `${JSON.stringify(manifest, null, 2)}\n` });

  return { bytes: createZip(entrees, { date: new Date(now) }), manifest };
}

/**
 * Nom de fichier d'une étiquette dans l'archive.
 *
 * Le rang vient en tête pour que le dossier se lise dans l'ordre de la
 * collection, et le titre est réduit à ce qui passe dans un nom de fichier.
 *
 * @param {number} index Rang, à partir de 1.
 * @param {string} label Titre du lien, ou son URL.
 * @param {number} [largeur] Largeur du numéro, pour l'alignement.
 * @returns {string}
 */
function printerLabelFileName(index, label, largeur = 2) {
  const rang = String(index).padStart(largeur, '0');
  const base = String(label ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .toLowerCase();
  return base === '' ? `${rang}-etiquette.png` : `${rang}-${base}.png`;
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/printer/packet.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Protocole Niimbot — encodage et décodage des trames.
 *
 * Trame standard :
 *
 *   0x55 0x55 │ CMD │ LEN │ DATA[0..LEN-1] │ XOR │ 0xAA 0xAA
 *
 * Le checksum est le XOR de CMD, LEN et de **tous** les octets de DATA.
 * L'en-tête et le pied de trame n'y participent pas.
 *
 * Le flux reçu n'est pas aligné sur les trames : plusieurs trames peuvent
 * arriver collées dans une notification, et une trame peut être coupée entre
 * deux notifications. `PacketStreamDecoder` tamponne et resynchronise sur
 * l'en-tête — c'est le point que ratent la plupart des implémentations maison.
 *
 * Références : MultiMote/niimbluelib (`src/packets/packet.ts`),
 * iscarelli/niimbot-web-bluetooth (driver validé sur D110 et M2-H),
 * printers.niim.blue/interfacing/proto/.
 */

const HEAD = Object.freeze([0x55, 0x55]);
const TAIL = Object.freeze([0xaa, 0xaa]);

/** Préfixe ajouté uniquement à la commande Connect. */
const CONNECT_PREFIX = 0x03;

/** Codes de commande (client → imprimante). */
const CMD = Object.freeze({
  Connect: 0xc1,
  PrintStart: 0x01,
  PageStart: 0x03,
  PageEnd: 0xe3,
  PrintEnd: 0xf3,
  PrintClear: 0x20,
  SetDensity: 0x21,
  SetLabelType: 0x23,
  SetPageSize: 0x13,
  PrintQuantity: 0x15,
  PrintBitmapRow: 0x85,
  PrintEmptyRow: 0x84,
  PrinterCheckLine: 0x86,
  PrintStatus: 0xa3,
  PrinterStatusData: 0xa5,
  PrinterInfo: 0x40,
  Heartbeat: 0xdc,
  // Lecture du consommable (0x1A) : la commande existe, mais le lecteur RFID
  // n'équipe pas tous les modèles et sa réponse n'a jamais pu être confrontée à
  // du matériel. Une lecture approximative affichait « rouleau continu » sur un
  // rouleau qui ne l'était pas : on ne l'utilise donc pas, et le consommable se
  // choisit dans la liste.
  RfidInfo: 0x1a,
});

/** Codes de notification (imprimante → client). */
const CMD_IN = Object.freeze({
  Connect: 0xc2,
  PrintStart: 0x02,
  PageStart: 0x04,
  PageEnd: 0xe4,
  PrintEnd: 0xf4,
  PrintClear: 0x30,
  SetDensity: 0x31,
  SetLabelType: 0x33,
  SetPageSize: 0x14,
  PrintQuantity: 0x16,
  PrinterCheckLine: 0xd3,
  PrintStatus: 0xb3,
  PrinterStatusData: 0xb5,
  PrinterInfo: 0x48,
  Heartbeat: 0xd9,
  PrintError: 0xdb,
  NotSupported: 0x00,
});

/** Codes d'erreur transportés par la notification 0xDB. */
const PRINT_ERRORS = Object.freeze({
  0x01: 'Capot ouvert',
  0x02: 'Plus de papier',
  0x03: 'Batterie faible',
  0x05: 'Annulé par l\'utilisateur',
  0x06: 'Erreur de données (format de page refusé)',
  0x07: 'Surchauffe',
  0x09: 'Imprimante occupée',
  0x0d: 'Ruban absent',
  0x0f: 'Ruban usagé',
  0x10: 'Papier incorrect',
  0x16: 'Exception de communication',
  0x17: 'Déconnexion',
  0x34: 'Délai de réception dépassé',
});

/** Types d'étiquette acceptés par SetLabelType (0x23). */
const LABEL_TYPES = Object.freeze({
  WithGaps: 1,
  BlackMark: 2,
  Continuous: 3,
  Perforated: 4,
  Transparent: 5,
  PvcTag: 6,
  BlackMarkGap: 10,
  HeatShrinkTube: 11,
});

/**
 * Calcule le checksum d'une trame.
 *
 * @param {number} cmd
 * @param {ArrayLike<number>} data
 * @returns {number}
 */
function checksum(cmd, data) {
  let cks = cmd ^ (data.length & 0xff);
  for (let i = 0; i < data.length; i++) cks ^= data[i];
  return cks & 0xff;
}

/**
 * Construit une trame complète.
 *
 * @param {number} cmd
 * @param {ArrayLike<number>} [data]
 * @param {{ prefix?: boolean }} [options] `prefix: true` ajoute l'octet 0x03
 *   réservé à la commande Connect.
 * @returns {Uint8Array}
 */
function buildPacket(cmd, data = [], options = {}) {
  const payload = Uint8Array.from(data);
  const length = payload.length;
  if (length > 0xff) {
    throw new RangeError(`Charge utile trop longue : ${length} octets (maximum 255)`);
  }

  const prefixLength = options.prefix ? 1 : 0;
  const packet = new Uint8Array(prefixLength + 2 + 1 + 1 + length + 1 + 2);
  let i = 0;

  if (options.prefix) packet[i++] = CONNECT_PREFIX;
  packet[i++] = HEAD[0];
  packet[i++] = HEAD[1];
  packet[i++] = cmd & 0xff;
  packet[i++] = length;
  packet.set(payload, i);
  i += length;
  packet[i++] = checksum(cmd, payload);
  packet[i++] = TAIL[0];
  packet[i] = TAIL[1];

  return packet;
}

/**
 * Construit la trame de connexion (seule trame préfixée).
 * @returns {Uint8Array} `03 55 55 c1 01 01 c1 aa aa`
 */
function buildConnect() {
  return buildPacket(CMD.Connect, [0x01], { prefix: true });
}

/**
 * Encode un entier non signé sur 16 bits, gros-boutiste.
 * @param {number} value
 * @returns {[number, number]}
 */
function u16be(value) {
  const v = Math.max(0, Math.min(0xffff, Math.trunc(value)));
  return [(v >> 8) & 0xff, v & 0xff];
}

/**
 * @typedef {Object} Packet
 * @property {number} cmd
 * @property {Uint8Array} data
 * @property {number} checksum
 * @property {boolean} checksumValid
 */

/**
 * Décodeur incrémental : absorbe des fragments d'octets et restitue les trames
 * complètes qu'il reconnaît.
 *
 * Les octets parasites sont ignorés jusqu'à retrouver un en-tête `55 55` suivi
 * d'une trame cohérente (longueur et pied valides). Un checksum invalide ne
 * fait pas perdre le flux : on repart de l'octet suivant.
 */
class PacketStreamDecoder {
  constructor() {
    /** @type {number[]} */
    this.buffer = [];
    /** Nombre de trames rejetées, exposé pour le diagnostic. */
    this.rejected = 0;
  }

  /** Vide le tampon (à appeler à la reconnexion). */
  reset() {
    this.buffer.length = 0;
  }

  /**
   * Absorbe des octets.
   * @param {ArrayLike<number>} chunk
   * @returns {Packet[]} trames complètes reconnues
   */
  push(chunk) {
    for (let i = 0; i < chunk.length; i++) this.buffer.push(chunk[i]);

    const packets = [];

    for (;;) {
      const start = this.#findHead(0);
      if (start === -1) {
        // Aucun en-tête : on ne conserve que le dernier octet, susceptible
        // d'être le premier 0x55 d'un en-tête coupé entre deux notifications.
        if (this.buffer.length > 1) {
          this.rejected += this.buffer.length - 1;
          this.buffer.splice(0, this.buffer.length - 1);
        }
        break;
      }
      if (start > 0) {
        this.rejected += start;
        this.buffer.splice(0, start);
      }

      const attempt = this.#parseAt(0);

      if (attempt.status === 'ok') {
        packets.push(attempt.packet);
        this.buffer.splice(0, attempt.total);
        continue;
      }

      if (attempt.status === 'invalid') {
        // Trame incohérente : on saute l'en-tête et on cherche le suivant.
        this.rejected++;
        this.buffer.splice(0, 2);
        continue;
      }

      // La trame est incomplète. Avant d'attendre la suite, il faut écarter le
      // cas d'un 0x55 parasite : si une trame complète et valide commence plus
      // loin, c'est que l'en-tête repéré n'en était pas un. Sans ce contrôle,
      // un seul octet 0x55 isolé bloquerait le décodeur indéfiniment.
      const alternative = this.#findNextCompleteFrame(1);
      if (alternative !== -1) {
        this.rejected += alternative;
        this.buffer.splice(0, alternative);
        continue;
      }
      break;
    }

    return packets;
  }

  /**
   * Tente d'analyser la trame qui commence à `index`.
   *
   * @param {number} index
   * @returns {{status: 'ok', packet: Packet, total: number}
   *   | {status: 'incomplete'}
   *   | {status: 'invalid'}}
   */
  #parseAt(index) {
    // En-tête (2) + cmd (1) + len (1)
    if (this.buffer.length < index + 4) return { status: 'incomplete' };

    const len = this.buffer[index + 3];
    const total = 4 + len + 1 + 2;
    if (this.buffer.length < index + total) return { status: 'incomplete' };

    const cmd = this.buffer[index + 2];
    const data = Uint8Array.from(this.buffer.slice(index + 4, index + 4 + len));
    const cks = this.buffer[index + 4 + len];
    const tailOk =
      this.buffer[index + 5 + len] === TAIL[0] && this.buffer[index + 6 + len] === TAIL[1];

    if (cks !== checksum(cmd, data) || !tailOk) return { status: 'invalid' };
    return { status: 'ok', packet: { cmd, data, checksum: cks, checksumValid: true }, total };
  }

  /**
   * Cherche, à partir de `from`, l'index d'une trame complète ET valide.
   * Une trame incomplète ne compte pas : on ne peut pas encore la confirmer.
   *
   * @param {number} from
   * @returns {number} index, ou -1
   */
  #findNextCompleteFrame(from) {
    for (let i = from; i + 1 < this.buffer.length; i++) {
      if (this.buffer[i] !== HEAD[0] || this.buffer[i + 1] !== HEAD[1]) continue;
      if (this.#parseAt(i).status === 'ok') return i;
    }
    return -1;
  }

  /**
   * Cherche la prochaine occurrence de `55 55`.
   * @param {number} from
   * @returns {number} index, ou -1
   */
  #findHead(from) {
    for (let i = from; i + 1 < this.buffer.length; i++) {
      if (this.buffer[i] === HEAD[0] && this.buffer[i + 1] === HEAD[1]) return i;
    }
    return -1;
  }
}

// ---------------------------------------------------------------------------
// Constructeurs de trames de haut niveau
// ---------------------------------------------------------------------------

/** @param {number} density @returns {Uint8Array} */
const setDensity = (density) => buildPacket(CMD.SetDensity, [density & 0xff]);

/** @param {number} type @returns {Uint8Array} */
const setLabelType = (type) => buildPacket(CMD.SetLabelType, [type & 0xff]);

/**
 * PrintStart. Le D110 attend **un seul octet** ; les modèles B1/M2 en attendent
 * sept, et les firmwares v4 neuf. Ne pas confondre : le D110 refuse un format
 * trop long avec une erreur DataError (0xDB 06).
 *
 * @param {'D110'|'B1'|'V4'} variant
 * @param {{ pages?: number, pageColor?: number, speed?: number }} [options]
 * @returns {Uint8Array}
 */
function printStart(variant, options = {}) {
  const pages = options.pages ?? 1;
  const pageColor = options.pageColor ?? 0;

  if (variant === 'B1') {
    const [hi, lo] = u16be(pages);
    return buildPacket(CMD.PrintStart, [hi, lo, 0, 0, 0, 0, pageColor]);
  }
  if (variant === 'V4') {
    const [hi, lo] = u16be(pages);
    const speed = options.speed ?? 1;
    return buildPacket(CMD.PrintStart, [hi, lo, 0, 0, 0, 0, pageColor, speed, 0]);
  }
  return buildPacket(CMD.PrintStart, [0x01]);
}

/** @returns {Uint8Array} */
const printClear = () => buildPacket(CMD.PrintClear, [0x01]);

/** @returns {Uint8Array} */
const pageStart = () => buildPacket(CMD.PageStart, [0x01]);

/** @returns {Uint8Array} */
const pageEnd = () => buildPacket(CMD.PageEnd, [0x01]);

/** @returns {Uint8Array} */
const printEnd = () => buildPacket(CMD.PrintEnd, [0x01]);

/** @returns {Uint8Array} */
const printStatus = () => buildPacket(CMD.PrintStatus, [0x01]);

/** @returns {Uint8Array} */
const printerStatusData = () => buildPacket(CMD.PrinterStatusData, [0x01]);

/** @returns {Uint8Array} */
const printerInfo = (sub = 0x08) => buildPacket(CMD.PrinterInfo, [sub]);

/** @returns {Uint8Array} */
const heartbeat = () => buildPacket(CMD.Heartbeat, [0x04]);

/**
 * SetPageSize.
 *
 * `cols` est la largeur de la **tête**, pas celle de l'étiquette : 96 pour un
 * D110 (12 mm), même avec une étiquette de 15 mm. L'imprimante rogne au-delà
 * sans renvoyer d'erreur.
 *
 * @param {'D110'|'B1'|'V4'} variant
 * @param {{ rows: number, cols: number, copies?: number }} options
 * @returns {Uint8Array}
 */
function setPageSize(variant, options) {
  const [rowsHi, rowsLo] = u16be(options.rows);
  const [colsHi, colsLo] = u16be(options.cols);

  if (variant === 'B1') {
    const [copiesHi, copiesLo] = u16be(options.copies ?? 1);
    return buildPacket(CMD.SetPageSize, [rowsHi, rowsLo, colsHi, colsLo, copiesHi, copiesLo]);
  }
  if (variant === 'V4') {
    const [copiesHi, copiesLo] = u16be(options.copies ?? 1);
    return buildPacket(CMD.SetPageSize, [
      rowsHi, rowsLo, colsHi, colsLo, copiesHi, copiesLo,
      0, 0, 0, 0, 0, 0, 0,
    ]);
  }
  return buildPacket(CMD.SetPageSize, [rowsHi, rowsLo, colsHi, colsLo]);
}

/** @param {number} quantity @returns {Uint8Array} */
const printQuantity = (quantity) => {
  const [hi, lo] = u16be(quantity);
  return buildPacket(CMD.PrintQuantity, [hi, lo]);
};

/**
 * Trame de ligne bitmap.
 *
 * @param {number} row Numéro de ligne (u16 BE).
 * @param {Uint8Array} bitmap `stride = ceil(cols/8)` octets, MSB d'abord, 1 = noir.
 * @param {{ run?: number, counts?: [number,number,number] }} [options]
 *   `run` est le nombre de répétitions de cette ligne (1 = une seule ligne).
 *   `counts` est le triplet de comptage de pixels noirs ; la valeur `00 00 00`
 *   est acceptée par tous les modèles connus et c'est ce qu'on envoie par défaut.
 * @returns {Uint8Array}
 */
function printBitmapRow(row, bitmap, options = {}) {
  const [rowHi, rowLo] = u16be(row);
  const counts = options.counts ?? [0, 0, 0];
  const run = Math.max(1, Math.min(255, options.run ?? 1));

  const data = new Uint8Array(2 + 3 + 1 + bitmap.length);
  data[0] = rowHi;
  data[1] = rowLo;
  data[2] = counts[0] & 0xff;
  data[3] = counts[1] & 0xff;
  data[4] = counts[2] & 0xff;
  data[5] = run;
  data.set(bitmap, 6);

  return buildPacket(CMD.PrintBitmapRow, data);
}

/**
 * Trame de ligne vide — n'embarque aucun octet de pixels, ce qui allège
 * fortement les marges blanches d'une étiquette.
 *
 * @param {number} row
 * @param {number} [run]
 * @returns {Uint8Array}
 */
function printEmptyRow(row, run = 1) {
  const [rowHi, rowLo] = u16be(row);
  return buildPacket(CMD.PrintEmptyRow, [rowHi, rowLo, Math.max(1, Math.min(255, run))]);
}

/**
 * Interprète une notification de statut d'impression (0xB3).
 *
 * On parse par longueur et non par offset fixe : la taille du payload varie
 * selon les modèles (10 octets sur M2-H, 11 sur B1 Pro).
 *
 * @param {Uint8Array} data
 * @returns {{ page: number, printProgress: number, feedProgress: number, error: number }}
 */
function parsePrintStatus(data) {
  const page = data.length >= 2 ? (data[0] << 8) | data[1] : 0;
  return {
    page,
    printProgress: data.length >= 3 ? data[2] : 0,
    feedProgress: data.length >= 4 ? data[3] : 0,
    // Le champ d'erreur n'est présent que sur les payloads de 10 octets.
    error: data.length >= 10 ? data[9] : 0,
  };
}

/**
 * Interprète la réponse d'identité (0x48), qui porte le modelId.
 *
 * Certains firmwares renvoient un octet unique, d'autres deux. Un octet seul
 * vaut `octet << 8` (convention niimbluelib).
 *
 * @param {Uint8Array} data
 * @returns {{ modelId: number }}
 */
function parsePrinterInfo(data) {
  if (data.length >= 2) return { modelId: (data[0] << 8) | data[1] };
  if (data.length === 1) return { modelId: data[0] << 8 };
  return { modelId: 0 };
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/printer/transport.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Transport Bluetooth LE vers une imprimante Niimbot.
 *
 * Ce module ne connaît pas le protocole : il achemine des octets. Trois points
 * sont critiques et résultent de mesures de la communauté sur matériel réel.
 *
 * 1. **Le filtrage par `services` ne trouve rien.** Les imprimantes Niimbot
 *    n'annoncent pas leur UUID de service dans leur paquet d'advertising ; il
 *    n'est visible qu'après connexion GATT. Un `filters: [{ services: [...] }]`
 *    ouvre donc un sélecteur vide. On filtre par préfixe de nom et on déclare
 *    le service en `optionalServices`.
 *
 * 2. **L'écriture en rafale produit des étiquettes blanches ou tronquées.**
 *    La caractéristique n'expose que l'écriture sans réponse, qui n'est ni
 *    ordonnée ni fiable : le tampon de la pile Bluetooth déborde en silence.
 *    Le bon levier n'est pas de ralentir, mais d'écrire moins souvent — le
 *    protocole est un flux de trames, plusieurs trames peuvent tenir dans une
 *    seule écriture. D'où le groupage, avec un intervalle minimal de sécurité.
 *
 * 3. **Les notifications arrivent en flux d'octets**, pas en trames : plusieurs
 *    trames peuvent être collées, et une trame peut être coupée en deux. Le
 *    `PacketStreamDecoder` s'en charge, mais il faut le brancher correctement.
 */





/** Service exposé par la quasi-totalité des imprimantes Niimbot. */
const SERVICE_UUID = 'e7810a71-73ae-499d-8c15-faa9aef0c3f2';

/**
 * Caractéristique principale. Elle porte à la fois les notifications et les
 * écritures sans réponse. Le code ne s'y fie pas aveuglément : si elle est
 * absente, on découvre la bonne par ses propriétés.
 */
const CHARACTERISTIC_UUID = 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f';

/**
 * Taille maximale d'un groupe d'écriture.
 *
 * La spec Web Bluetooth n'expose aucune API de MTU (la proposition `getMTU()`
 * n'est pas livrée). Des groupes de 240 octets ont été validés sur B1 et M2-H,
 * ce qui suppose un MTU ≥ 247. On reste en dessous et on rend la valeur
 * réglable, car rien ne garantit le même MTU sur un D110.
 */
const DEFAULT_MAX_BUNDLE_BYTES = 240;

/**
 * Intervalle minimal entre deux écritures. Sur macOS et iOS, le Bluetooth
 * passe par CoreBluetooth, dont le tampon sature plus vite : la rafale y est
 * systématiquement perdante.
 */
const DEFAULT_PACE_MS = 10;

/**
 * @typedef {Object} BluetoothLike
 * @property {(options: object) => Promise<any>} requestDevice
 * @property {() => Promise<boolean>} [getAvailability]
 */

/**
 * Marche à suivre quand Brave bloque Web Bluetooth.
 *
 * Le nom du drapeau est celui des sources de Brave
 * (`browser/about_flags.cc`), et il faut **relancer** le navigateur : le
 * drapeau n'est lu qu'au démarrage. C'est la cause la plus fréquente, et de
 * loin — l'API existe, donc rien ne signale le problème avant le clic.
 */
const BRAVE_BLUETOOTH_HINT =
  'Brave désactive Web Bluetooth par défaut. Ouvrez brave://flags/#brave-web-bluetooth-api, '
  + 'mettez « Web Bluetooth API » sur Enabled, puis relancez Brave. '
  + 'Chrome et Edge fonctionnent sans réglage.';

/**
 * Vérifie que Web Bluetooth est utilisable et explique pourquoi sinon.
 *
 * `navigator.bluetooth` peut exister **et** être inutilisable : Brave expose
 * l'objet mais refuse toute utilisation quand son drapeau est éteint, et
 * `requestDevice` échoue alors sur « Web Bluetooth API globally disabled » —
 * en anglais, après le clic. `getAvailability()` répond `false` dans ce cas sans
 * rien demander à l'utilisateur : c'est ce qui permet de prévenir avant.
 *
 * @param {{
 *   bluetooth?: BluetoothLike,
 *   isSecureContext?: boolean,
 *   available?: boolean,
 * }} [env]
 * @returns {{ ok: boolean, reason?: string, hint?: string }}
 */
function checkWebBluetoothSupport(env = {}) {
  const bluetooth = env.bluetooth ?? globalThis.navigator?.bluetooth;
  const secure = env.isSecureContext ?? globalThis.isSecureContext;

  if (!bluetooth) {
    return {
      ok: false,
      reason: t('Web Bluetooth n\'est pas disponible dans ce navigateur.'),
      hint: t("Safari (macOS et iOS) ne l'implémente pas. {brave}", { brave: t(BRAVE_BLUETOOTH_HINT) }),
    };
  }
  if (secure === false) {
    return {
      ok: false,
      reason: t('Web Bluetooth exige un contexte sécurisé (HTTPS ou localhost).'),
      hint: t('Ouvrez l\'application via https:// ou http://localhost.'),
    };
  }
  // `available === false` : le navigateur a répondu que non.
  if (env.available === false) {
    return {
      ok: false,
      reason: t(
        'Web Bluetooth est désactivé dans ce navigateur — ou le Bluetooth de cet ordinateur est éteint.',
      ),
      hint: t(BRAVE_BLUETOOTH_HINT),
    };
  }
  return { ok: true };
}

/**
 * Interroge le navigateur sur la disponibilité réelle de Web Bluetooth.
 *
 * Ne lève jamais : un navigateur qui refuse de répondre est traité comme un
 * navigateur qui dit non.
 *
 * @param {{ bluetooth?: BluetoothLike }} [env]
 * @returns {Promise<{ ok: boolean, reason?: string, hint?: string }>}
 */
async function probeWebBluetooth(env = {}) {
  const bluetooth = env.bluetooth ?? globalThis.navigator?.bluetooth;
  const basic = checkWebBluetoothSupport(env);
  if (!basic.ok) return basic;

  if (typeof bluetooth.getAvailability !== 'function') return basic;

  try {
    const available = await bluetooth.getAvailability();
    return checkWebBluetoothSupport({ ...env, available: Boolean(available) });
  } catch {
    return checkWebBluetoothSupport({ ...env, available: false });
  }
}

/**
 * Traduit l'échec d'une demande d'appareil en message exploitable.
 *
 * Le navigateur répond en anglais, et « NotFoundError : Web Bluetooth API
 * globally disabled » ne dit pas quoi faire. On reconnaît les cas connus pour
 * renvoyer la marche à suivre.
 *
 * @param {unknown} error
 * @returns {string}
 */
function explainBluetoothFailure(error) {
  const message = String(error?.message ?? error ?? '');
  if (/globally disabled/i.test(message)) {
    return t('Web Bluetooth est désactivé dans ce navigateur. {brave}', { brave: t(BRAVE_BLUETOOTH_HINT) });
  }
  if (/user denied|user cancel|chooser/i.test(message) || error?.name === 'NotFoundError') {
    return t('Aucun appareil choisi. Réveillez l\'imprimante, puis relancez la connexion.');
  }
  if (/permission|not allowed|SecurityError/i.test(message)) {
    return t('Le navigateur a refusé l\'accès au Bluetooth : autorisez-le pour cette page, puis réessayez.');
  }
  return t('Connexion impossible : {message}', { message });
}

/**
 * Ouvre le sélecteur d'appareils et renvoie l'imprimante choisie.
 *
 * @param {{
 *   bluetooth?: BluetoothLike,
 *   namePrefixes?: string[],
 *   serviceUuid?: string,
 * }} [options]
 * @returns {Promise<any>} le BluetoothDevice retenu
 */
async function requestPrinter(options = {}) {
  const bluetooth = options.bluetooth ?? globalThis.navigator?.bluetooth;
  if (!bluetooth) {
    throw new Error(checkWebBluetoothSupport({ bluetooth }).reason);
  }

  const namePrefixes = options.namePrefixes ?? ALL_NAME_PREFIXES;
  const serviceUuid = options.serviceUuid ?? SERVICE_UUID;

  return bluetooth.requestDevice({
    // Filtrage par nom : le service n'est pas annoncé, un filtre par service
    // ne remonterait aucun appareil.
    filters: namePrefixes.map((namePrefix) => ({ namePrefix })),
    optionalServices: [serviceUuid],
    // Repli : si le firmware annonce un nom inattendu, l'utilisateur peut
    // toujours choisir l'appareil dans la liste complète.
    acceptAllDevices: false,
  });
}

/**
 * Sélectionne la caractéristique d'échange.
 *
 * On tente l'UUID documenté, puis on retombe sur une découverte par
 * propriétés : c'est ce que font niimbluelib, NiimPrintX et LibreNiim, et cela
 * couvre les variantes de firmware.
 *
 * @param {any} server
 * @param {string} serviceUuid
 * @returns {Promise<{ service: any, characteristic: any, discovered: boolean }>}
 */
async function resolveCharacteristic(server, serviceUuid) {
  const service = await server.getPrimaryService(serviceUuid);

  try {
    const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
    return { service, characteristic, discovered: false };
  } catch {
    // L'UUID connu n'existe pas sur ce firmware : on cherche par propriétés.
  }

  const characteristics = await service.getCharacteristics();
  const match = characteristics.find(
    (c) => c.properties?.notify && c.properties?.writeWithoutResponse,
  );
  if (match) return { service, characteristic: match, discovered: true };

  // Dernier recours : une caractéristique qui écrit, même avec réponse.
  const writable = characteristics.find(
    (c) => c.properties?.writeWithoutResponse || c.properties?.write,
  );
  if (writable) return { service, characteristic: writable, discovered: true };

  throw new Error(
    'Aucune caractéristique utilisable trouvée sur le service Niimbot. ' +
    'L\'appareil choisi n\'est probablement pas une imprimante compatible.',
  );
}

/**
 * Transport vers une imprimante connectée.
 *
 * Émet des trames complètes, les groupe en écritures, et redistribue les
 * notifications décodées. Ne gère ni le protocole ni la séquence d'impression.
 */
class NiimbotTransport {
  /**
   * @param {any} device BluetoothDevice déjà autorisé
   * @param {{
   *   serviceUuid?: string,
   *   characteristicUuid?: string,
   *   maxBundleBytes?: number,
   *   paceMs?: number,
   *   heartbeatMs?: number,
   * }} [options]
   */
  constructor(device, options = {}) {
    this.device = device;
    this.serviceUuid = options.serviceUuid ?? SERVICE_UUID;
    this.maxBundleBytes = options.maxBundleBytes ?? DEFAULT_MAX_BUNDLE_BYTES;
    this.paceMs = options.paceMs ?? DEFAULT_PACE_MS;
    this.heartbeatMs = options.heartbeatMs ?? 0;

    this.characteristic = null;
    this.decoder = new PacketStreamDecoder();
    /** @type {Array<(packet: any) => void>} */
    this.listeners = [];
    /** @type {Array<{ cmd: number, resolve: Function, reject: Function, timer: any }>} */
    this.waiters = [];
    this.connected = false;

    /** Tampon d'écriture en cours de constitution. */
    this.pending = [];
    this.pendingBytes = 0;
    this.lastWriteAt = 0;

    this.notificationHandler = (event) => this.#onNotification(event);
    this.disconnectHandler = () => this.#onDisconnected();
    this.heartbeatTimer = null;
  }

  /**
   * Se connecte au serveur GATT et prépare les notifications.
   * @returns {Promise<{ discoveredCharacteristic: boolean }>}
   */
  async connect() {
    if (this.connected) return { discoveredCharacteristic: false };

    const server = await this.device.gatt.connect();
    const { characteristic, discovered } = await resolveCharacteristic(server, this.serviceUuid);
    this.characteristic = characteristic;

    this.device.addEventListener('gattserverdisconnected', this.disconnectHandler);

    // Les notifications doivent être actives avant tout envoi, sinon aucune
    // réponse n'arrive et les attentes expirent.
    if (characteristic.properties?.notify) {
      characteristic.addEventListener('characteristicvaluechanged', this.notificationHandler);
      await characteristic.startNotifications();
    }

    this.connected = true;

    if (this.heartbeatMs > 0) {
      this.heartbeatTimer = setInterval(() => {
        this.write(this.heartbeatBuilder?.() ?? new Uint8Array(0)).catch(() => {});
      }, this.heartbeatMs);
    }

    return { discoveredCharacteristic: discovered };
  }

  /** Indique si le lien est actif. */
  get isConnected() {
    return this.connected && Boolean(this.device?.gatt?.connected);
  }

  /**
   * Enregistre un observateur de trames reçues.
   * @param {(packet: any) => void} listener
   * @returns {() => void} fonction de désinscription
   */
  onPacket(listener) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) this.listeners.splice(index, 1);
    };
  }

  /**
   * Écrit une trame, en la groupant avec les suivantes tant que la limite
   * d'octets n'est pas atteinte.
   *
   * @param {Uint8Array} frame
   */
  async write(frame) {
    if (!this.characteristic) throw new Error(t('Transport non connecté'));
    if (frame.length === 0) return;

    // Une trame plus grosse que la limite partirait en une écriture refusée :
    // on la fractionne, au prix d'une trame potentiellement coupée.
    if (frame.length > this.maxBundleBytes) {
      await this.flush();
      for (let i = 0; i < frame.length; i += this.maxBundleBytes) {
        await this.#writeChunk(frame.slice(i, i + this.maxBundleBytes));
      }
      return;
    }

    if (this.pendingBytes + frame.length > this.maxBundleBytes) await this.flush();

    this.pending.push(frame);
    this.pendingBytes += frame.length;
  }

  /** Vide le groupe courant vers la caractéristique. */
  async flush() {
    if (this.pending.length === 0) return;

    const total = this.pendingBytes;
    const bundle = new Uint8Array(total);
    let offset = 0;
    for (const frame of this.pending) {
      bundle.set(frame, offset);
      offset += frame.length;
    }
    this.pending = [];
    this.pendingBytes = 0;

    await this.#writeChunk(bundle);
  }

  /**
   * Écriture effective, avec l'intervalle minimal entre deux envois.
   * @param {Uint8Array} bytes
   */
  async #writeChunk(bytes) {
    const silence = this.paceMs - (Date.now() - this.lastWriteAt);
    if (silence > 0) await new Promise((resolve) => setTimeout(resolve, silence));

    // L'écriture sans réponse est la seule disponible pour la performance ;
    // elle n'est ni ordonnée ni fiable, d'où le rythme imposé ci-dessus.
    if (this.characteristic.properties?.writeWithoutResponse) {
      await this.characteristic.writeValueWithoutResponse(bytes);
    } else {
      await this.characteristic.writeValue(bytes);
    }
    this.lastWriteAt = Date.now();
  }

  /**
   * Attend une trame de réponse précise.
   *
   * @param {number} cmd Code attendu (réponse, pas commande).
   * @param {{ timeoutMs?: number, match?: (packet: any) => boolean }} [options]
   * @returns {Promise<any>}
   */
  expect(cmd, options = {}) {
    const timeoutMs = options.timeoutMs ?? 1000;
    return new Promise((resolve, reject) => {
      const waiter = {
        cmd,
        match: options.match,
        resolve: (packet) => {
          clearTimeout(waiter.timer);
          resolve(packet);
        },
        reject: (error) => {
          clearTimeout(waiter.timer);
          reject(error);
        },
        timer: setTimeout(() => {
          const index = this.waiters.indexOf(waiter);
          if (index !== -1) this.waiters.splice(index, 1);
          reject(
            new Error(
              `Aucune réponse 0x${cmd.toString(16)} de l'imprimante après ${timeoutMs} ms. ` +
              'Vérifiez que l\'appareil est allumé et à portée.',
            ),
          );
        }, timeoutMs),
      };
      this.waiters.push(waiter);
    });
  }

  /** Coupe la liaison et libère les ressources. */
  async disconnect() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    for (const waiter of this.waiters.splice(0)) {
      waiter.reject(new Error('Connexion fermée'));
    }
    this.decoder.reset();
    this.pending = [];
    this.pendingBytes = 0;

    try {
      this.device?.removeEventListener?.('gattserverdisconnected', this.disconnectHandler);
      if (this.device?.gatt?.connected) this.device.gatt.disconnect();
    } finally {
      this.connected = false;
      this.characteristic = null;
    }
  }

  /**
   * Répartit les octets reçus vers le décodeur puis vers les observateurs.
   * @param {any} event
   */
  #onNotification(event) {
    const value = event.target.value;
    const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);

    let packets;
    try {
      packets = this.decoder.push(bytes);
    } catch {
      return;
    }

    for (const packet of packets) {
      for (const listener of [...this.listeners]) {
        try {
          listener(packet);
        } catch {
          // Un observateur fautif ne doit pas interrompre la lecture du flux.
        }
      }
      this.#settleWaiters(packet);
    }
  }

  /**
   * Réveille les attentes satisfaites par une trame.
   * @param {any} packet
   */
  #settleWaiters(packet) {
    for (const waiter of [...this.waiters]) {
      if (packet.cmd !== waiter.cmd) continue;
      if (waiter.match && !waiter.match(packet)) continue;
      const index = this.waiters.indexOf(waiter);
      if (index !== -1) this.waiters.splice(index, 1);
      waiter.resolve(packet);
    }
  }

  /** L'imprimante s'éteint en veille : la coupure doit être signalée, pas subie. */
  #onDisconnected() {
    this.connected = false;
    this.characteristic = null;
    for (const waiter of this.waiters.splice(0)) {
      waiter.reject(new Error('Imprimante déconnectée'));
    }
  }
}

/**
 * Ouvre le sélecteur puis établit la connexion en une seule étape.
 *
 * @param {{ namePrefixes?: string[], transportOptions?: object, bluetooth?: BluetoothLike }} [options]
 * @returns {Promise<NiimbotTransport>}
 */
async function connectToPrinter(options = {}) {
  const device = await requestPrinter(options);
  const transport = new NiimbotTransport(device, options.transportOptions);
  await transport.connect();
  return transport;
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/printer/printer.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Session d'impression Niimbot (D110 en priorité).
 *
 * Enchaîne le dialogue documenté, en vérifiant chaque acquittement. Le principe
 * directeur : ne jamais supposer qu'une commande a été acceptée. L'imprimante
 * rogne ou ignore en silence ; seule la lecture des réponses révèle l'échec.
 *
 * Deux pièges structurels sont explicitement gérés :
 *
 * - Le D110 refuse un `SetPageSize` au format des firmwares v4 (13 octets) en
 *   répondant une erreur DataError (0xDB 06) **au lieu d'imprimer**. On ne
 *   route donc jamais un D110 vers le task « V4 ».
 * - L'imprimante rogne les colonnes au-delà de la largeur de tête (96 px pour
 *   un D110) sans renvoyer d'erreur. C'est à l'appelant de fournir une image à
 *   la bonne largeur ; `prepareRows` le vérifie et le signale.
 */





/** Délai de réponse par défaut pour une commande de réglage. */
const DEFAULT_ACK_TIMEOUT_MS = 3000;

/** Délai d'attente de la fin d'impression : la tête chauffe, c'est lent. */
const DEFAULT_PRINT_TIMEOUT_MS = 60000;

/** Intervalle entre deux interrogations de statut. */
const POLL_INTERVAL_MS = 300;

/** Répétition maximale d'une ligne dans une trame, valeur pratique constatée. */
const MAX_ROW_RUN = 200;

/**
 * @typedef {Object} MonoBitmap
 * @property {number} width   Largeur en pixels, multiple de 8.
 * @property {number} height  Hauteur en pixels.
 * @property {Uint8Array[]} rows Une entrée par ligne de pixels.
 */

/**
 * Compacte les lignes identiques consécutives en trames à répétition.
 *
 * Une ligne entièrement blanche devient une trame « ligne vide » (0x84), qui
 * ne transporte aucun octet de pixels : c'est ce qui allège les marges et
 * divise le trafic Bluetooth par trois à cinq sur une étiquette réelle.
 *
 * @param {MonoBitmap} bitmap
 * @param {{ maxRun?: number }} [options]
 * @returns {Array<{ row: number, run: number, bytes: Uint8Array|null }>}
 */
function prepareRows(bitmap, options = {}) {
  const maxRun = Math.max(1, Math.min(255, options.maxRun ?? MAX_ROW_RUN));
  const { rows } = bitmap;
  const frames = [];

  const isBlank = (bytes) => {
    for (let i = 0; i < bytes.length; i++) if (bytes[i] !== 0) return false;
    return true;
  };
  const same = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  };

  let index = 0;
  while (index < rows.length) {
    let run = 1;
    while (
      run < maxRun &&
      index + run < rows.length &&
      same(rows[index], rows[index + run])
    ) {
      run++;
    }
    frames.push({
      row: index,
      run,
      bytes: isBlank(rows[index]) ? null : rows[index],
    });
    index += run;
  }

  return frames;
}

/**
 * Construit les trames binaires correspondant à une image.
 *
 * @param {MonoBitmap} bitmap
 * @param {{ maxRun?: number }} [options]
 * @returns {Uint8Array[]}
 */
function bitmapFrames(bitmap, options = {}) {
  return prepareRows(bitmap, options).map((entry) =>
    entry.bytes ? printBitmapRow(entry.row, entry.bytes, { run: entry.run })
      : printEmptyRow(entry.row, entry.run),
  );
}

/**
 * Session d'impression pilotant un transport déjà connecté.
 */
class NiimbotPrinter {
  /**
   * @param {import('./transport.js').NiimbotTransport} transport
   * @param {{ profile?: object, ackTimeoutMs?: number, printTimeoutMs?: number }} [options]
   */
  constructor(transport, options = {}) {
    this.transport = transport;
    this.ackTimeoutMs = options.ackTimeoutMs ?? DEFAULT_ACK_TIMEOUT_MS;
    this.printTimeoutMs = options.printTimeoutMs ?? DEFAULT_PRINT_TIMEOUT_MS;

    /** Profil deviné depuis le nom BLE, remplacé après lecture du modelId. */
    this.profile = options.profile ?? null;
    this.deviceName = transport.device?.name ?? '';

    /** @type {{ modelId: number|null, protocolVersion: number|null, error: number|null }} */
    this.info = { modelId: null, protocolVersion: null, error: null };

    this.offPacket = null;
  }

  /**
   * Établit la session : connexion, lecture de l'identité, choix du profil.
   *
   * @returns {Promise<{ profile: object, modelId: number|null, reportedHeadPixels: number|null }>}
   */
  async start() {
    // Horodatage des erreurs : l'imprimante peut signaler un refus à tout moment.
    this.offPacket = this.transport.onPacket((packet) => {
      if (packet.cmd === CMD_IN.PrintError) {
        this.info.error = packet.data[0] ?? null;
      }
    });

    await this.ack(buildConnect(), CMD_IN.Connect);

    // PrinterStatusData porte la version de protocole ; PrinterInfo, le modèle.
    const status = await this.ack(printerStatusData(), CMD_IN.PrinterStatusData);
    this.info.protocolVersion = status.data[0] ?? null;

    let modelId = null;
    try {
      const info = await this.ack(printerInfo(0x08), CMD_IN.PrinterInfo);
      modelId = parsePrinterInfo(info.data).modelId;
      this.info.modelId = modelId;
    } catch {
      // Certains firmwares ne répondent pas à cette interrogation : ce n'est
      // pas bloquant, on retombe sur le nom annoncé.
    }

    let profile =
      (modelId !== null ? findByModelId(modelId) : undefined) ??
      this.profile ??
      findByName(this.deviceName) ??
      DEFAULT_PROFILE;

    const head = await this.#readHeadWidth();
    if (head !== null) profile = withReportedHead(profile, head);

    this.profile = profile;
    return { profile, modelId, reportedHeadPixels: head };
  }

  /**
   * Imprime une image.
   *
   * @param {MonoBitmap} bitmap Largeur = largeur de tête, multiple de 8.
   * @param {{
   *   density?: number,
   *   copies?: number,
   *   labelType?: number,
   *   onProgress?: (progress: { page: number, copies: number }) => void,
   * }} [options]
   * @returns {Promise<{ pages: number, rows: number, frames: number }>}
   */
  async print(bitmap, options = {}) {
    const profile = this.profile ?? DEFAULT_PROFILE;
    const copies = Math.max(1, Math.trunc(options.copies ?? 1));
    const density = Math.max(
      profile.density.min,
      Math.min(profile.density.max, Math.trunc(options.density ?? profile.density.default)),
    );
    const labelType = options.labelType ?? LABEL_TYPES.WithGaps;

    if (bitmap.width > profile.printheadPixels) {
      throw new RangeError(
        `Image de ${bitmap.width} px alors que la tête du ${profile.id} fait ` +
        `${profile.printheadPixels} px : l'imprimante rognerait ${bitmap.width - profile.printheadPixels} px ` +
        'sans le signaler.',
      );
    }
    if (bitmap.height > profile.maxPrintHeightMm * (profile.dpi / 25.4)) {
      throw new RangeError(
        `Image de ${bitmap.height} px, au-delà de la hauteur maximale du ${profile.id}.`,
      );
    }

    const task = profile.printTask;

    await this.ack(setDensity(density), CMD_IN.SetDensity);
    await this.ack(setLabelType(labelType), CMD_IN.SetLabelType);

    // Le D110 n'accepte qu'un seul octet ici et ne peut donc pas déclarer de
    // job multi-pages ; les autres modèles reçoivent la variante adaptée.
    await this.ack(printStart(task, { pages: copies }), CMD_IN.PrintStart);

    if (task === 'D110') {
      await this.ack(printClear(), CMD_IN.PrintClear);
    }

    await this.ack(pageStart(), CMD_IN.PageStart);
    await this.ack(
      setPageSize(task, {
        rows: bitmap.height,
        cols: profile.printheadPixels,
        copies,
      }),
      CMD_IN.SetPageSize,
    );
    await this.ack(printQuantity(copies), CMD_IN.PrintQuantity);

    const frames = bitmapFrames(bitmap);
    for (const frame of frames) {
      await this.transport.write(frame);
    }
    await this.transport.flush();

    await this.ack(pageEnd(), CMD_IN.PageEnd, { timeoutMs: this.printTimeoutMs });
    await this.#waitForCompletion(copies, options.onProgress);
    await this.ack(printEnd(), CMD_IN.PrintEnd, { timeoutMs: this.printTimeoutMs });

    if (this.info.error !== null) {
      const label = PRINT_ERRORS[this.info.error] ?? `code 0x${this.info.error.toString(16)}`;
      throw new Error(t("L'imprimante a signalé une erreur : {label}", { label }));
    }

    return { pages: copies, rows: bitmap.height, frames: frames.length };
  }

  /** Libère les observateurs. */
  dispose() {
    this.offPacket?.();
    this.offPacket = null;
  }

  /**
   * Envoie une trame et attend son acquittement.
   *
   * @param {Uint8Array} frame
   * @param {number} expectedCmd
   * @param {{ timeoutMs?: number }} [options]
   * @returns {Promise<any>}
   */
  async ack(frame, expectedCmd, options = {}) {
    const waiting = this.transport.expect(expectedCmd, {
      timeoutMs: options.timeoutMs ?? this.ackTimeoutMs,
    });
    // L'attente est armée avant l'envoi : une réponse très rapide ne doit pas
    // être manquée.
    await this.transport.write(frame);
    await this.transport.flush();
    return waiting;
  }

  /**
   * Interroge le statut jusqu'à ce que le nombre de pages imprimées soit atteint.
   * @param {number} copies
   * @param {(progress: { page: number, copies: number }) => void} [onProgress]
   */
  async #waitForCompletion(copies, onProgress) {
    const deadline = Date.now() + this.printTimeoutMs;

    while (Date.now() < deadline) {
      const response = await this.ack(printStatus(), CMD_IN.PrintStatus, {
        timeoutMs: this.ackTimeoutMs,
      });
      const status = parsePrintStatus(response.data);
      onProgress?.({ page: status.page, copies });

      if (status.page >= copies) return;
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    throw new Error(t(
      "L'impression n'a pas confirmé son achèvement après {ms} ms. L'étiquette est peut-être incomplète.",
      { ms: this.printTimeoutMs },
    ));
  }

  /**
   * Tente de lire la largeur de tête réellement rapportée par l'imprimante.
   *
   * La sonde est `Heartbeat 0xDC [03]`, à laquelle l'imprimante répond `0xDE`
   * avec la largeur sur les octets 4-5. C'est la mesure la plus fiable — elle
   * vient du matériel — mais elle n'a été observée que sur M2_H, et beaucoup de
   * firmwares ne répondent simplement pas. Le délai est donc court et l'échec
   * silencieux, pour ne pas ralentir la connexion d'un D110 qui l'ignore.
   *
   * La largeur rapportée est celle de la **tête**, pas de l'étiquette.
   *
   * @returns {Promise<number|null>}
   */
  async #readHeadWidth() {
    /** Réponse à la sonde de largeur de tête. Absent de CMD_IN car propre à ce dialogue. */
    const CMD_IN_HEARTBEAT_INFO = 0xde;
    try {
      const frame = buildPacket(CMD.Heartbeat, [0x03]);
      const response = await this.ack(frame, CMD_IN_HEARTBEAT_INFO, { timeoutMs: 600 });
      if (response.data.length >= 6) {
        const width = (response.data[4] << 8) | response.data[5];
        if (width > 0) return width;
      }
    } catch {
      // Firmware qui ignore la sonde : ce n'est pas une erreur.
    }
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/core/site.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Le lien vers la page d'information, dans la fenêtre comme dans l'application.
 *
 * Les deux faces du produit renvoient au même endroit : la page publique qui
 * explique ce que fait l'outil, ce qu'il enregistre et comment il le fait. Ce
 * lien existait dans la fenêtre de l'extension, pas dans l'application — or
 * c'est l'application qui sert de documentation à qui l'ouvre en grand. Les
 * adresses vivent donc ici, une seule fois, plutôt que recopiées de chaque
 * côté : deux copies d'une adresse finissent par diverger, et une adresse
 * fausse ne casse rien visiblement — elle envoie simplement au mauvais endroit.
 *
 * L'adresse dépend de **deux** choses, et c'est ce qui interdit un `href` écrit
 * en dur dans le HTML :
 *
 * - **La langue de l'interface.** La page française vit à la racine du site,
 *   l'anglaise sous `/en/`. Un utilisateur qui a réglé l'outil en français n'a
 *   rien à faire sur la page anglaise.
 * - **Le contexte d'exécution.** Servie par une extension, ou seule à la racine
 *   d'un serveur, l'application n'a aucune page voisine : seule l'adresse
 *   publiée existe. Servie par le site lui-même sous `app/`, la page
 *   d'information est sa **voisine** — et c'est alors l'adresse relative qu'il
 *   faut, sans quoi une copie du site hébergée ailleurs (un fork, un serveur
 *   local) enverrait ses visiteurs sur le site d'origine, ou nulle part si la
 *   machine est hors ligne.
 *
 * Le module ne connaît ni DOM ni stockage : il décide d'une adresse à partir de
 * la langue et de deux champs de `location`, ce qui le rend vérifiable sans
 * navigateur. Les appelants lui passent la page courante ; par défaut, la page
 * réelle.
 */

/**
 * Adresses publiques de la page d'information, par langue.
 *
 * La page française est à la racine du site, l'anglaise sous `/en/`. Ces deux
 * adresses sont aussi le repli de tout contexte qui n'a pas de page voisine.
 */
const SITE_URLS = Object.freeze({
  fr: 'https://lupin.github.io/URLQRCodePrinter/',
  en: 'https://lupin.github.io/URLQRCodePrinter/en/',
});

/**
 * Le dossier sous lequel le site publie l'application.
 *
 * C'est la disposition de `scripts/build-site.mjs` : l'application est copiée
 * dans `app/`, à côté de la page d'information française (`index.html`) et de
 * l'anglaise (`en/index.html`). Quand la page courante est celle-là, et
 * seulement celle-là, la page d'information est sa **voisine** : `../` la
 * désigne.
 *
 * Les autres dispositions n'ont pas de voisine, et reçoivent donc l'adresse
 * publiée : `dist/web` servi à la racine par `npm run serve` (`/`, `/index.html`),
 * la page de l'extension (`/app.html`, à la racine du paquet), et une application
 * déployée seule dans un dossier sans site autour d'elle (`/un-dossier/`). Une
 * adresse relative y désignerait un dossier qui ne contient pas de page
 * d'information — c'est pourquoi la règle est aussi étroite.
 */
const SITE_APP_DIRECTORY = /\/app\/(?:index\.html?)?$/i;

/**
 * La langue demandée, ramenée à celles que le site publie.
 *
 * Une langue inconnue vaut le français : c'est la langue d'écriture du projet,
 * et celle de la racine du site.
 *
 * @param {string} [locale]
 * @returns {'fr'|'en'}
 */
function siteLocale(locale) {
  return locale === 'en' ? 'en' : 'fr';
}

/**
 * L'adresse de la page d'information, pour une langue et une page données.
 *
 * @param {string} [locale] Langue de l'interface.
 * @param {{protocol?: string, pathname?: string}} [page] Page courante.
 * @returns {string} Adresse absolue, ou relative à la page courante.
 */
function informationPageHref(locale, page = globalThis.location ?? {}) {
  const lang = siteLocale(locale);
  const protocol = page?.protocol ?? '';
  const pathname = page?.pathname ?? '';

  // Hors http(s), il n'y a pas de site du tout : une extension
  // (`chrome-extension:`, `safari-web-extension:`, `moz-extension:`) est le cas
  // courant, un fichier ouvert localement l'autre.
  const servedBySite = protocol === 'http:' || protocol === 'https:';
  if (!servedBySite || !SITE_APP_DIRECTORY.test(pathname)) return SITE_URLS[lang];

  // Servie par le site : `../` remonte de `/app/` à la racine française,
  // `../en/` à l'anglaise. Une page ouverte sous `/app/index.html` remonte aussi
  // à la racine — `../` y désigne le dossier parent, pas la page.
  return lang === 'en' ? '../en/' : '../';
}

// ────────────────────────────────────────────────────────────────────────
// dist/extension-safari/app.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Application autonome.
 *
 * Trois responsabilités, tenues séparées :
 *   1. la collection (ajout, import, export, suppression) ;
 *   2. la mise en forme papier (planche d'étiquettes ou tableau) ;
 *   3. l'impression sur étiquette Niimbot.
 *
 * Tout ce qui peut être décidé sans navigateur vit dans `core/` et y est testé.
 * Ce fichier ne fait que du DOM et des appels système.
 */




























const PX_PER_MM = 96 / 25.4;

/** Identifiant de la feuille de style qui porte la taille de papier. */
const PRINT_PAGE_STYLE_ID = 'print-page-size';

// ---------------------------------------------------------------------------
// État
// ---------------------------------------------------------------------------

const { store: baseStore, kind: storeKind } = resolveDefaultStore();

/**
 * L'API d'extension, ou `null` sur la page web autonome.
 *
 * `chrome.runtime.id` n'existe que dans une page d'extension : une page web
 * ordinaire expose `window.chrome` sur les navigateurs Chromium, mais sans
 * `runtime`. C'est ce test — le même que celui du service proposé d'emblée —
 * qui décide si l'application a des collections et une zone de session.
 */
const extensionApi = (() => {
  try {
    const api = globalThis.browser ?? globalThis.chrome;
    return typeof api?.runtime?.id === 'string' && api.runtime.id !== '' ? api : null;
  } catch {
    return null;
  }
})();

/**
 * Les liens de la collection de navigation privée, en mémoire de session.
 *
 * `null` hors extension, et `null` aussi sur un navigateur antérieur à
 * `storage.session` (Chrome 102, Safari 16.4) : dans les deux cas la collection
 * privée n'est pas proposée, plutôt que d'écrire des URL privées sur le disque.
 */
const privateStore = (() => {
  const area = extensionApi?.storage?.session;
  if (!area || typeof area.get !== 'function' || typeof area.set !== 'function') return null;
  try {
    return createChromeStorageStore({ area, key: PRIVATE_LINKS_KEY });
  } catch {
    return null;
  }
})();

/** Les deux zones réunies : les liens ordinaires, et ceux de la session. */
const allStores = privateStore
  ? createCompositeStore([
    { store: baseStore, match: (collectionId) => collectionId !== PRIVATE_COLLECTION_ID },
    { store: privateStore, match: (collectionId) => collectionId === PRIVATE_COLLECTION_ID },
  ])
  : baseStore;

/**
 * Le magasin de la collection affichée.
 *
 * Réaffecté à chaque bascule, et **c'est lui que tout le reste du fichier
 * utilise** : la liste, les exports, la planche et l'impression suivent donc la
 * collection choisie sans qu'aucun appel n'ait eu à changer. Un magasin borné
 * plutôt qu'un filtre appliqué à chaque lecture : c'est ce qui garantit qu'une
 * liste ne mélange jamais deux collections par oubli.
 */
let store = withCollection(allStores, DEFAULT_COLLECTION_ID);

/** @type {import('./core/link.js').LinkRecord[]} */
let links = [];
/** Identifiants cochés pour l'impression. @type {Set<string>} */
let selected = new Set();
let mode = 'sheet';
/**
 * Largeur utile du rendu en cours de l'aperçu.
 *
 * Mesurée **une fois**, au début de `renderPreview`, et avant que l'aperçu ne
 * soit vidé.
 *
 * C'est ce qui corrige une boucle de rétroaction mesurée dans Chrome : vider
 * l'aperçu fait disparaître sa barre de défilement verticale, donc la largeur
 * utile augmente de quinze pixels ; l'échelle était alors calculée sur cette
 * largeur-là, le nouveau contenu rappelait la barre, et le cadre se retrouvait
 * plus large que la place réelle — 685 px dessinés pour 670 offerts, de façon
 * stable, un redimensionnement explicite n'y changeant rien. Mesurer avant de
 * vider donne la largeur que le contenu occupera réellement.
 *
 * Déclarée avec l'état du module, et non près de l'observateur qui s'en sert :
 * `renderPreview` l'écrit, et un appel plus tôt tomberait dans la zone morte de
 * la déclaration.
 */
let largeurApercuRendue = 0;

/**
 * Les services de raccourcissement qui n'ont pas répondu, pour la **session**.
 *
 * Rien n'est écrit : une panne d'aujourd'hui ne dit rien de demain, et un
 * marquage persistant finirait par écarter un service durablement bon. Le
 * marquage est levé dès qu'un raccourcissement réussit.
 */
const servicesEnEchec = new Map();

/** Minuteur qui désarme la confirmation de suppression d'une collection. */
let deleteConfirmTimer = null;

/** La largeur utile retenue pour ce rendu, ou une mesure de secours. */
function largeurUtileApercu() {
  return largeurApercuRendue > 0 ? largeurApercuRendue : previewViewportWidth();
}
let transport = null;
/** @type {NiimbotPrinter|null} */
let printer = null;
let toastTimer = null;
/** Objet-URL de l'aperçu d'étiquette, à révoquer avant chaque nouveau rendu. */
let labelPreviewUrl = null;
/** Préférences retenues d'une session à l'autre (service, cible du QR Code). */
const settings = createSettingsStore({ defaultShortener: defaultShortenerId() });
/** `AbortController` du lot de raccourcissement en cours, s'il y en a un. */
let shortenJob = null;
/** Options du choix de cible, gardées pour pouvoir les désactiver. */
const targetOptions = new Map();

/**
 * Rang de chaque lien dans la collection, à partir de 1.
 *
 * C'est ce numéro que porte la liste **et** le tableau imprimé : sans lui, le
 * « N° » d'une ligne de tableau ne renvoyait à rien, et on ne pouvait pas
 * retrouver de quel lien il parlait. Il suit l'ordre de la collection, donc il
 * reste le même quand la liste est filtrée ou quand on n'imprime qu'une
 * sélection.
 *
 * @type {Map<string, number>}
 */
let linkRanks = new Map();

/**
 * Le mode réorganisation est-il ouvert ?
 *
 * Il ne survit pas au rechargement, et c'est voulu : c'est un geste de
 * rangement, pas un réglage. Le laisser ouvert au retour donnerait une liste
 * couverte de poignées sans qu'on sache pourquoi.
 *
 * @type {boolean}
 */
let reorderMode = false;

/**
 * La dernière grille **demandée** dans le panneau de la planche, avant d'être
 * ramenée à ce qui tient. L'ajustement d'espacement part de là : sans elle, il
 * ne saurait plus ce que l'utilisateur voulait.
 *
 * @type {{columns: number, rows: number}|null}
 */
let derniereGrilleDemandee = null;

/**
 * La grille demandée a-t-elle été ramenée à ce qui tient ?
 *
 * C'est l'autre moitié du signal : le bouton d'ajustement se montre quand
 * quelque chose ne tient pas — la grille, ou le contenu dans les étiquettes.
 *
 * @type {boolean}
 */
let derniereGrilleEcourtee = false;

/**
 * La densité de la planche au dernier rendu : la cote de la matrice la plus
 * large, et le nombre de lignes de texte réservées. L'ajustement part de là —
 * c'est ce qui lui dit de quelle place les étiquettes ont besoin.
 *
 * @type {number|null}
 */
let derniersModules = null;

/** @type {number} */
let dernieresLignes = 0;

/**
 * Nombre de pages que le tableau imprimé vient d'occuper.
 *
 * Consigné au rendu, et non recalculé par l'appelant : la répartition dépend des
 * hauteurs **mesurées**, que seul le rendu connaît. La légende de l'aperçu le lit
 * pour dire « 45 lignes sur 3 pages ».
 *
 * @type {number}
 */
let dernieresPagesTableau = 1;

/**
 * La grille demandée **avant** que l'ajustement ne la change, pour pouvoir dire
 * ce qui ne tenait pas.
 *
 * @type {{columns: number, rows: number}|null}
 */
let derniereGrilleDemandeeInitiale = null;

/**
 * Les six cotes de la planche **avant** que la mise en page automatique ne les
 * écrase.
 *
 * La case « Mise en page automatique » calcule la grille et remplit les champs à
 * la place de l'utilisateur. Sans cette mémoire, décocher la case laissait les
 * valeurs calculées en place : la planche ne bougeait pas d'un millimètre, et
 * l'on croyait à un défaut d'affichage — « rien ne change » — alors que le calcul
 * était simplement resté. Décocher rend donc ce qui a été mis de côté ; à défaut
 * — parce que la case était déjà cochée au chargement —, la grille de la
 * disposition choisie, qui est au moins une grille nommée.
 *
 * @type {{columns: string, rows: string, marginXMm: string, marginYMm: string,
 *   gapXMm: string, gapYMm: string}|null}
 */
let grilleManuelle = null;

/**
 * Orientations proposées à l'impression.
 *
 * Les têtes thermiques impriment ligne par ligne dans le sens du défilement :
 * selon le rouleau et le modèle, la même image sort à l'endroit, pivotée, ou à
 * l'envers. Le profil D110 porte un drapeau `transposed` — documenté mais jamais
 * lu jusqu'ici — et je n'ai pas de matériel pour trancher. On laisse donc le
 * choix, sans rien changer au comportement actuel par défaut.
 */
const LABEL_LAYOUTS = Object.freeze([
  {
    id: 'dessous',
    label: 'Texte droit, sous le QR Code',
    mode: 'stacked',
  },
  {
    id: 'dessus',
    label: 'Texte droit, au-dessus du QR Code',
    mode: 'stacked',
    textFirst: true,
  },
  {
    id: 'tourne',
    label: 'Texte tourné, se lit de bas en haut',
    // Sur un rouleau étroit, un texte droit ne dispose que de la largeur de la
    // tête moins le QR Code — quelques caractères. Tourné, il profite de la longueur.
    mode: 'rotated',
    sens: 'horaire',
  },
  {
    id: 'tourne-inverse',
    label: 'Texte tourné, se lit de haut en bas',
    // Même disposition, sens inverse : selon le rouleau et le sens de sortie,
    // l'un des deux se lit tête en bas. On donne le choix plutôt que de le
    // deviner, faute de matériel pour trancher.
    mode: 'rotated',
    sens: 'antihoraire',
  },
  {
    id: 'cote',
    label: 'Texte à droite du QR Code',
    mode: 'lateral',
    // Cette disposition n'a de sens que si le QR Code laisse une vraie colonne :
    // sur une tête de 12 mm, il en reste quelques pixels. On ne la propose donc
    // que sur une tête large, plutôt que de laisser choisir une option vide.
    minHeadPx: 200,
  },
]);

/**
 * Les dispositions qui ont un sens pour un profil donné.
 *
 * Proposer « texte à droite » sur une tête de 12 mm n'avait aucun sens : le QR Code
 * y occupe presque toute la largeur et la colonne de texte fait quelques
 * pixels. On écarte donc les dispositions inapplicables au lieu de les laisser
 * échouer à l'usage.
 *
 * @param {import('./core/printer/profiles.js').PrinterProfile} profile
 * @returns {typeof LABEL_LAYOUTS[number][]}
 */
function layoutsFor(profile) {
  const large = (profile?.printheadPixels ?? 0) >= 200;
  return LABEL_LAYOUTS.filter((entry) => large || entry.minHeadPx === undefined);
}


/**
 * Portée de l'impression en série.
 *
 * « Toute la collection » était la seule option offerte, alors que la sélection
 * cochée existait déjà pour l'impression papier : on ne pouvait pas imprimer
 * les trois étiquettes qu'on venait de cocher sans sortir les trente autres.
 */
/**
 * Les deux portées **multiples**, valeurs du sélecteur unique.
 *
 * Elles cohabitent avec un lien à la fois dans le même sélecteur : « ce qu'on
 * imprime » est une seule question, et deux listes déroulantes y répondaient.
 * Le préfixe à double souligné les distingue des identifiants de liens, qui
 * commencent tous par `id-`.
 */
const PORTEE_TOUT = '__all';
const PORTEE_COCHEE = '__selected';


/** Libellés des modes de date, dans l'ordre d'affichage. */
const DATE_MODE_LABELS = Object.freeze({
  none: 'Aucune',
  date: 'Date de collecte',
  datetime: 'Date et heure de collecte',
});

// ---------------------------------------------------------------------------
// Références DOM
// ---------------------------------------------------------------------------

// Les identifiants HTML sont en tirets, les accès en camelCase : sans cette
// conversion, `el.addForm` serait indéfini alors que `add-form` existe, et
// l'application n'échouerait qu'au premier clic.
/**
 * Convertit un identifiant HTML en clé d'accès : « add-form » → « addForm ».
 * @param {string} id
 * @returns {string}
 */
const toKey = (id) => id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

// La liste est déclarée dans un module à part pour qu'un test puisse vérifier
// que chaque identifiant existe réellement dans index.html.
const el = Object.fromEntries(
  ELEMENT_IDS.map((id) => [toKey(id), document.getElementById(id)]),
);

// Un identifiant absent ne casse pas le chargement : il produit un `null` qui
// n'échoue qu'au premier usage. On le signale donc au plus tôt.
const missing = ELEMENT_IDS.filter((id) => el[toKey(id)] == null);
if (missing.length > 0) {
  throw new Error(
    `Éléments absents de index.html : ${missing.join(', ')}. ` +
    'Le HTML et app.js ne sont pas de la même version.',
  );
}

/**
 * Vérifie que la feuille de style réellement appliquée est celle du build.
 *
 * Un navigateur peut servir un `style.css` gardé en cache alors que le HTML et
 * les scripts, eux, sont à jour. Le résultat est déroutant : les nouveaux
 * réglages apparaissent, mais la mise en page reste celle d'avant — étiquettes
 * empilées en une colonne, curseur de largeur sans effet. Plutôt que de laisser
 * chercher, l'application le détecte et le dit.
 *
 * Le contrôle lit une propriété que seule la feuille de style définit sur un
 * élément sonde : `position: absolute` sur `.print-cell`. Aucun style en ligne
 * n'intervient, donc la réponse vient bien du fichier chargé.
 *
 * @returns {boolean} `true` si la feuille attendue est appliquée.
 */
function stylesheetIsCurrent() {
  // Ces API n'existent pas dans tous les environnements d'exécution (les tests
  // de démarrage tournent sous Node, sans DOM réel) : dans ce cas on ne peut
  // rien affirmer, et on ne bloque pas.
  if (typeof getComputedStyle !== 'function' || typeof document.body?.appendChild !== 'function') {
    return true;
  }
  try {
    const probe = document.createElement('div');
    probe.className = 'print-cell';
    probe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(probe);
    const { position } = getComputedStyle(probe);
    if (typeof probe.remove === 'function') probe.remove();
    else probe.parentNode?.removeChild?.(probe);
    return position === 'absolute';
  } catch {
    return true;
  }
}

// ---------------------------------------------------------------------------
// Utilitaires d'interface
// ---------------------------------------------------------------------------

/**
 * Affiche un message transitoire.
 * @param {string} message
 * @param {'info'|'error'} [kind]
 */
function toast(message, kind = 'info') {
  el.toast.textContent = message;
  el.toast.classList.toggle('toast--error', kind === 'error');
  el.toast.classList.add('toast--visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('toast--visible'), 2800);
}

/**
 * Construit un bouton.
 * @param {string} label
 * @param {string} className
 * @param {() => void} onClick
 * @returns {HTMLButtonElement}
 */
function button(label, className, onClick) {
  const node = document.createElement('button');
  node.type = 'button';
  node.className = className;
  node.textContent = label;
  node.addEventListener('click', onClick);
  return node;
}

/**
 * Construit l'aperçu SVG d'un QR Code.
 *
 * L'`innerHTML` est sûr ici : la chaîne ne contient que des nombres et des
 * couleurs choisies par le code, jamais de donnée utilisateur. L'URL est
 * encodée dans la matrice, pas recopiée dans le balisage.
 *
 * @param {string} url
 * @returns {SVGElement}
 */
function qrElement(url, { ecc = 'M', border = 1, scale = 4 } = {}) {
  return qrSvg(encodeQr(url, { ecc, border }), { scale });
}

/**
 * Rend une matrice déjà encodée.
 *
 * La planche encode chaque URL une fois : la taille de la matrice lui sert à
 * calculer les bornes du curseur, puis la même matrice est rendue. Encoder deux
 * fois le même lien doublerait le travail à chaque déplacement du curseur.
 *
 * @param {import('./core/qr.js').QrMatrix} matrix
 * @param {{ scale?: number }} [options]
 * @returns {SVGElement}
 */
function qrSvg(matrix, { scale = 4 } = {}) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = toSvg(matrix, { scale });
  return wrapper.firstElementChild;
}

// ---------------------------------------------------------------------------
// Collection
// ---------------------------------------------------------------------------

/**
 * Met à jour le bouton d'impression en série : son libellé dit la portée, et il
 * reste inerte tant qu'il n'y a rien à imprimer.
 *
 * Le libellé est ce qui évite la mauvaise surprise : « Imprimer toute la
 * collection » alors que trois liens sont cochés ferait sortir trente
 * étiquettes.
 */
function updatePrintScope() {
  const { kind, items } = impressionChoisie();
  const copies = copiesCount();
  const ready = links.length > 0 && Boolean(printer);

  // Le libellé dit toujours le nombre d'étiquettes **et** le nombre
  // d'exemplaires : « Imprimer la collection » alors que la quantité est à 2
  // ferait sortir deux fois plus d'étiquettes que ce que la phrase laisse croire.
  const total = items.length * copies;
  el.printLabel.disabled = !ready || total === 0;
  // L'export ne demande **pas** d'imprimante : c'est précisément son objet.
  el.exportNiimbot.disabled = items.length === 0;
  el.printLabel.textContent = total === 0
    ? t('Aucun lien à imprimer')
    : tpl(total, 'Imprimer {count} étiquette', 'Imprimer {count} étiquettes')
      + (copies > 1 ? ` (${tpl(items.length, '{count} lien', '{count} liens')} × ${copies})` : '');

  // La phrase dit ce qui est retenu, et pourquoi le bouton est inerte le cas
  // échéant : « Ce qu'on imprime » seul ne disait pas ce qui allait sortir.
  if (links.length === 0) {
    el.printScopeHint.textContent = t('Aucun lien dans la collection.');
    return;
  }
  if (items.length === 0) {
    el.printScopeHint.textContent = t(
      'Aucun lien coché : cochez les liens à imprimer dans la liste, ou choisissez « Toute la collection ».',
    );
    return;
  }
  const source = kind === 'one'
    ? t('le lien affiché')
    : (kind === 'selected'
      ? tpl(items.length, '{count} lien coché', '{count} liens cochés', { count: items.length })
      : t('les {count} liens de la collection', { count: items.length }));
  el.printScopeHint.textContent = copies > 1
    ? tpl(copies, '{source}, {count} exemplaire de chacun.', '{source}, {count} exemplaires de chacun.', { source })
    : `${source}.`;
}

/**
 * Nombre d'exemplaires de chaque lien pour l'impression en série.
 *
 * Une valeur absente ou aberrante retombe sur 1 : mieux vaut sortir une
 * étiquette que d'en sortir zéro à cause d'un champ vidé.
 *
 * @returns {number}
 */
function copiesCount() {
  const typed = Math.trunc(Number(el.copies.value));
  if (!Number.isFinite(typed) || typed < 1) return 1;
  return Math.min(typed, 20);
}

/** Recharge la collection depuis le stockage et redessine. */
async function refresh() {
  // **Le tri est une vue**, et la vue commande tout : la liste, le rang imprimé,
  // les exports et l'impression. Un seul tableau plutôt que deux, parce que deux
  // ordres coexistant finiraient par se contredire — le CSV dans un ordre et le
  // « N° » du tableau dans l'autre. Le magasin, lui, garde l'ordre manuel : revenir
  // à « Ordre manuel » retrouve la collection telle qu'on l'avait laissée.
  links = sortLinks(await store.list(), preferences.sortMode);
  linkRanks = new Map(links.map((link, index) => [link.id, index + premierNumero()]));
  fillLabelLinks();
  updatePrintScope();
  // Les colonnes « Tags » et « Note » ne sont proposées que si la collection en
  // contient : une colonne vide sur toute une page n'apprend rien.
  updateTableOptions();
  updateHeaderNoteOptions();
  const ids = new Set(links.map((link) => link.id));
  // On conserve les cases cochées qui existent encore.
  selected = new Set([...selected].filter((id) => ids.has(id)));
  renderList();
  updateSortHint();
  renderPreview();
}

/**
 * Déplace un lien d'un cran dans l'ordre **manuel**, et l'enregistre.
 *
 * Le premier déplacement attribue un rang à tout le monde : sans cela, il n'y
 * aurait rien à échanger, puisque aucun lien n'en porte encore. Les rangs
 * partent de l'ordre actuellement affiché — qui est l'ordre manuel, puisque les
 * flèches n'existent qu'en mode manuel.
 *
 * @param {string} id
 * @param {number} delta -1 vers le haut, +1 vers le bas.
 * @returns {Promise<void>}
 */
async function moveLink(id, delta) {
  const ordre = sortByManualOrder(links);
  const index = ordre.findIndex((link) => link.id === id);
  const cible = index + delta;
  if (index === -1 || cible < 0 || cible >= ordre.length) return;

  const suite = [...ordre];
  [suite[index], suite[cible]] = [suite[cible], suite[index]];

  await store.putMany(suite.map((link, rang) => ({ ...link, order: rang })));
  await refresh();
}

/** Affiche la liste, filtrée par la recherche. */
function renderList() {
  const query = el.search.value.trim().toLowerCase();
  const visible = query
    ? links.filter((link) =>
        `${link.title} ${link.url} ${link.tags.join(' ')}`.toLowerCase().includes(query))
    : links;

  el.list.textContent = '';
  el.empty.hidden = visible.length > 0;

  // Ranger n'a de sens qu'en ordre manuel : sous un tri, un déplacement serait
  // annulé au rendu suivant. Le bouton le dit en étant inactif, et l'explication
  // est dans l'indice juste au-dessus — plutôt que deux flèches inertes sur
  // chaque ligne, qui laisseraient croire à une panne.
  const peutRanger = preferences.sortMode === 'manual' && links.length > 1;
  if (!peutRanger) reorderMode = false;
  el.reorder.disabled = !peutRanger;
  el.reorder.setAttribute('aria-pressed', reorderMode ? 'true' : 'false');
  el.reorder.textContent = reorderMode ? t('Terminer le rangement') : t('Réorganiser');
  el.list.classList.toggle('links--reorder', reorderMode);
  el.empty.textContent = links.length === 0
    ? t('Aucun lien. Ajoutez-en un ci-dessus, importez une archive, ou utilisez l\'extension navigateur.')
    : t('Aucun lien ne correspond à la recherche.');

  el.count.textContent = tpl(links.length, '{count} lien', '{count} liens');

  const hasLinks = links.length > 0;
  el.exportXlsx.disabled = !hasLinks;
  el.exportCsv.disabled = !hasLinks;
  el.exportMd.disabled = !hasLinks;
  el.exportJson.disabled = !hasLinks;
  el.clear.disabled = !hasLinks;
  el.shorten.disabled = !hasLinks;
  updateShortenStatus();
  updateTargetAvailability();
  updateSelectionHint();
  // La sélection cochée peut changer sans que la liste soit rechargée : la
  // portée de la série se recalcule donc ici, où tout passe.
  updatePrintScope();

  for (const link of visible) el.list.appendChild(renderLink(link));
}

/**
 * Rend une URL cliquable, avec un repli en texte simple.
 *
 * Le repli n'est pas décoratif : une URL illisible ne doit pas produire un lien
 * mort, et un `href` ne doit jamais recevoir autre chose qu'une URL http(s) —
 * le contenu de la liste peut venir d'un import ou d'une page web.
 *
 * @param {string} url
 * @param {string} className
 * @param {string} [label] Texte affiché, l'URL par défaut.
 * @returns {HTMLElement}
 */
function linkAnchor(url, className, label = url) {
  const href = safeHref(url);
  const node = document.createElement(href === '' ? 'span' : 'a');
  node.className = className;
  node.textContent = label;
  node.title = url;
  if (href !== '') {
    node.href = href;
    node.target = '_blank';
    // `noopener` : la page ouverte ne doit pas pouvoir manipuler cet onglet.
    node.rel = 'noopener noreferrer';
    node.classList.add('link--clickable');
  }
  return node;
}

/**
 * Éditeur des champs de saisie d'un lien : titre, tags, note.
 *
 * Ces trois champs partent dans les exports — colonnes « Titre », « Tags » et
 * « Note » du CSV, du Markdown et du classeur. Tant qu'ils n'étaient pas
 * saisissables, les exports transportaient des colonnes qu'aucune interface ne
 * pouvait remplir : le titre restait vide sur un lien ajouté à la main, et les
 * tags ne pouvaient venir que d'un import. Un export n'a de sens que s'il est
 * raccord avec ce qu'on peut saisir.
 *
 * L'édition reste repliée derrière un bouton : la ligne doit rester lisible
 * quand on ne modifie rien.
 *
 * @param {import('./core/link.js').LinkRecord} link
 * @returns {HTMLElement}
 */
function linkEditor(link) {
  const wrap = document.createElement('div');
  wrap.className = 'link__editor';

  const open = button('✎', 'link__edit', () => {
    let settled = false;

    const form = document.createElement('div');
    form.className = 'link__editor-form';

    const fields = [
      { key: 'title', label: t('Titre'), value: link.title, placeholder: t('Titre de la page') },
      { key: 'tags', label: t('Tags'), value: link.tags.join(', '), placeholder: t('veille, travail') },
      { key: 'note', label: t('Note'), value: link.note, placeholder: t('Note libre') },
    ];

    const inputs = new Map();
    for (const field of fields) {
      const line = document.createElement('label');
      line.className = 'link__editor-field';

      const caption = document.createElement('span');
      caption.className = 'link__editor-label';
      caption.textContent = field.label;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'input input--compact';
      input.value = field.value ?? '';
      input.placeholder = field.placeholder;
      input.setAttribute('aria-label', t('{label} pour {url}', { label: field.label, url: link.url }));

      line.append(caption, input);
      form.appendChild(line);
      inputs.set(field.key, input);
    }

    const hint = document.createElement('p');
    hint.className = 'hint hint--tight';
    hint.textContent = t('Entrée pour enregistrer, Échap pour annuler. Tags séparés par des virgules.');
    form.appendChild(hint);

    // **Le lien court reste vérifiable ici.** Il ne l'est plus dans la ligne,
    // où il est devenu le libellé de la case qui choisit ce que le QR Code
    // encode : deux intentions dans le même bloc se confondaient. Le vérifier
    // avant d'imprimer reste possible — c'est même le seul endroit où l'on peut
    // le faire sans quitter l'application.
    if (hasShortUrl(link)) {
      const court = document.createElement('p');
      court.className = 'hint hint--tight link__editor-short';
      const service = findShortener(link.shortProvider)?.name ?? link.shortProvider ?? '';
      court.append(
        document.createTextNode(t('Lien court :')),
        document.createTextNode(' '),
        linkAnchor(link.shortUrl, 'link__editor-short-url'),
        document.createTextNode(service === '' ? '' : ` (${service})`),
      );
      form.appendChild(court);
    }

    // Les deux commandes du formulaire, visibles.
    //
    // Elles ne l'étaient pas : le formulaire ne se fermait qu'avec Entrée ou
    // Échap, et seule une phrase d'aide le disait. Un utilisateur qui ne lit pas
    // la phrase — c'est-à-dire presque tous — n'avait aucun moyen de voir
    // comment terminer. Les raccourcis restent : ils sont plus rapides, et
    // maintenant annoncés à côté de boutons qui font la même chose.
    const actions = document.createElement('div');
    actions.className = 'link__editor-actions';
    actions.append(
      button(t('Annuler'), 'btn btn--ghost', () => finish(false)),
      button(t('Enregistrer'), 'btn btn--primary', () => finish(true)),
    );
    form.appendChild(actions);

    const finish = async (save) => {
      if (settled) return;
      settled = true;

      if (save) {
        // `createLink` normalise : les tags sont dédoublonnés et mis en forme,
        // le titre comme la note sont bornés.
        const updated = createLink({
          ...link,
          title: inputs.get('title').value,
          note: inputs.get('note').value,
          tags: inputs.get('tags').value.split(','),
        });
        const changed = updated.title !== link.title
          || updated.note !== link.note
          || updated.tags.join(',') !== link.tags.join(',');
        if (changed) {
          await store.put({ ...link, title: updated.title, note: updated.note, tags: updated.tags });
          await refresh();
          toast(t('Lien mis à jour'));
          // La liste vient d'être reconstruite : l'éditeur est fermé, et une
          // remise à jour qui attendait son tour peut passer.
          resumeDeferredSync();
          return;
        }
      }
      await refresh();
      resumeDeferredSync();
    };

    for (const input of inputs.values()) {
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          finish(true);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          finish(false);
        }
      });
    }

    wrap.textContent = '';
    wrap.appendChild(form);
    inputs.get('title')?.focus();
  });
  open.setAttribute('aria-label', t('Modifier titre, tags et note de {title}', { title: link.title || link.url }));
  open.title = t('Modifier le titre, les tags et la note');

  wrap.appendChild(open);
  return wrap;
}

/**
 * Construit une ligne de la collection.
 * @param {import('./core/link.js').LinkRecord} link
 * @returns {HTMLLIElement}
 */
function renderLink(link) {
  const item = document.createElement('li');
  item.className = 'link';
  // L'identifiant sur la ligne, et non seulement dans la fermeture : c'est ce
  // qui permet de relire l'ordre obtenu par un geste, à la fin du glissement.
  item.dataset.id = link.id;

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'link__check';
  check.checked = selected.has(link.id);
  check.setAttribute('aria-label', t('Sélectionner {title}', { title: link.title || link.url }));
  check.addEventListener('change', () => {
    if (check.checked) selected.add(link.id);
    else selected.delete(link.id);
    // La phrase et le libellé du bouton disent ce qui sera imprimé : ils
    // doivent suivre chaque case cochée, sans quoi ils mentent. `updatePrintScope`
    // manquait ici : cocher trois liens laissait le bouton annoncer « 1 étiquette ».
    updateSelectionHint();
    updatePrintScope();
    renderPreview();
  });

  const body = document.createElement('div');
  body.className = 'link__body';

  // Le titre et l'URL ouvrent la page dans un nouvel onglet : on doit pouvoir
  // vérifier un lien collecté sans quitter la collection.
  const title = linkAnchor(link.url, 'link__title', link.title || hostOf(link.url) || link.url);
  const url = linkAnchor(link.url, 'link__url');

  body.append(title, url);

  // **Le lien court *est* le contrôle.** Il y avait deux intentions dans le même
  // bloc : l'adresse courte était un lien — pour aller la vérifier — et, juste
  // en dessous, une case « Encoder le lien raccourci » qui ne disait pas lequel.
  // Cliquer sur l'un ou cocher l'autre demandait de savoir lequel des deux on
  // visait. La case porte maintenant l'adresse comme libellé : on coche ce qu'on
  // lit, et la ligne n'a plus qu'une action. Vérifier le lien court se fait dans
  // l'éditeur de la ligne, où il reste cliquable.
  let cible = null;
  if (hasShortUrl(link)) {
    cible = document.createElement('label');
    cible.className = 'link__short';
    cible.title = t("Encoder ce lien dans le QR Code, à la place de l'adresse d'origine.");

    const case_ = document.createElement('input');
    case_.type = 'checkbox';
    case_.className = 'link__short-check';
    // `undefined` suit le réglage global, et la case doit le montrer tel quel.
    case_.checked = typeof link.useShort === 'boolean'
      ? link.useShort
      : preferences.targetMode === 'short';
    case_.setAttribute('aria-label', t('Encoder {url} pour « {title} »', {
      url: link.shortUrl, title: link.title || link.url,
    }));
    case_.addEventListener('change', async () => {
      await store.put({ ...link, useShort: case_.checked });
      await refresh();
    });

    const mark = document.createElement('span');
    mark.className = 'link__short-mark';
    mark.textContent = '↳';
    mark.setAttribute('aria-hidden', 'true');

    const url = document.createElement('span');
    url.className = 'link__short-url';
    url.textContent = link.shortUrl;

    const provider = document.createElement('span');
    provider.className = 'link__short-provider';
    provider.textContent = findShortener(link.shortProvider)?.name ?? link.shortProvider ?? '';

    cible.append(case_, mark, url, provider);
    // Un clic sur le libellé ne doit pas ouvrir l'éditeur de la ligne : le
    // contrôle est autonome.
    cible.addEventListener('click', (event) => event.stopPropagation());
    body.appendChild(cible);
  }

  // La note est visible sans ouvrir l'éditeur : c'est souvent la seule chose
  // qu'on veut relire.
  if (link.note) {
    const note = document.createElement('div');
    note.className = 'link__note';
    note.textContent = link.note;
    note.title = link.note;
    body.appendChild(note);
  }

  if (link.tags.length) {
    const tags = document.createElement('div');
    tags.className = 'link__tags';
    for (const tag of link.tags) {
      // Cliquer une puce filtre la collection sur ce tag : c'est le seul
      // intérêt de classer, et cela évite d'avoir à le retaper.
      //
      // Le « # » est une syntaxe de saisie, pas une identité : `normalizeTags`
      // l'accepte puis le retire, si bien que le tag est déjà stocké sans lui.
      // La puce n'a donc pas à le réafficher — son fond dit assez qu'il s'agit
      // d'un tag. Le nom accessible, lui, explicite l'action : un bouton nommé
      // « musique » n'apprend rien à un lecteur d'écran.
      const chip = button(tag, 'tag', () => {
        el.search.value = tag;
        renderList();
      });
      const action = t('Filtrer sur le tag « {tag} »', { tag });
      chip.title = action;
      chip.setAttribute('aria-label', action);
      tags.appendChild(chip);
    }
    body.appendChild(tags);
  }

  const remove = button('×', 'link__remove', async () => {
    await store.remove(link.id);
    selected.delete(link.id);
    await refresh();
    toast(t('Lien supprimé'));
  });
  remove.setAttribute('aria-label', t('Supprimer {title}', { title: link.title || link.url }));

  const rank = document.createElement('span');
  rank.className = 'link__index';
  rank.textContent = String(linkRanks.get(link.id) ?? '');
  rank.title = t('Rang dans la collection, celui du tableau imprimé');

  // Les flèches n'existent qu'en **ordre manuel**. On ne réordonne pas une liste
  // triée : le déplacement serait annulé au rendu suivant, et l'utilisateur
  // croirait à une panne. Le libellé du tri le dit, plutôt que de laisser des
  // boutons inertes.

  // Le rangement n'existe qu'en **mode** réorganisation, et il se pose à gauche
  // de la ligne. Deux flèches permanentes sur chaque ligne encombraient la liste
  // pour une action qu'on fait une fois, puis qu'on quitte.
  if (reorderMode) {
    item.append(moveControls(link), check, rank, body, remove, linkEditor(link));
    return item;
  }

  // L'éditeur vient **après** la croix : il se replie sur sa propre ligne, et
  // la croix reste ainsi sur celle du titre, où on la cherche.
  item.append(check, rank, body, remove, linkEditor(link));
  return item;
}

/**
 * Le bloc de rangement d'une ligne : une poignée, et les deux flèches.
 *
 * Les flèches ne sont pas un doublon du geste, elles en sont **l'alternative** :
 * le critère 2.5.7 (AA) exige qu'une action faisable par glissement le soit
 * aussi sans glisser. La poignée, elle, ne dit rien à l'assistance vocale — on
 * ne peut pas glisser à la voix — et elle reste donc décorative, sans être
 * focalisable : un bouton caché aux lecteurs d'écran mais atteignable au clavier
 * serait un piège.
 *
 * @param {import('./core/link.js').LinkRecord} link
 * @returns {HTMLDivElement}
 */
function moveControls(link) {
  const bloc = document.createElement('div');
  bloc.className = 'link__rank';

  const grip = document.createElement('span');
  grip.className = 'link__grip';
  grip.setAttribute('aria-hidden', 'true');
  grip.textContent = '⠿';

  // La **position** dans la liste, et non le numéro affiché : depuis que la
  // numérotation peut commencer à 101, comparer le numéro à l'effectif
  // désactiverait les flèches au mauvais moment.
  const position = links.findIndex((candidat) => candidat.id === link.id) + 1;
  const nom = link.title || link.url;
  const up = button('▲', 'link__move', () => moveLink(link.id, -1));
  up.setAttribute('aria-label', t('Déplacer {title} vers le haut', { title: nom }));
  up.title = t('Monter');
  up.disabled = position <= 1;

  const down = button('▼', 'link__move', () => moveLink(link.id, 1));
  down.setAttribute('aria-label', t('Déplacer {title} vers le bas', { title: nom }));
  down.title = t('Descendre');
  down.disabled = position <= 0 || position >= links.length;

  bloc.append(grip, up, down);
  wireDrag(grip);
  return bloc;
}

/**
 * Fait suivre la ligne au doigt qui tient la poignée.
 *
 * Les événements de pointeur plutôt que l'API de glisser-déposer du navigateur :
 * celle-ci impose une image fantôme, ignore le tactile sur beaucoup de
 * systèmes, et ne dit rien de la position réelle. Ici, la ligne **se déplace
 * dans le document** pendant le geste, et l'ordre du document à la fin est
 * l'ordre obtenu — sans état intermédiaire à tenir à jour.
 *
 * @param {HTMLElement} grip
 */
function wireDrag(grip) {
  grip.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const ligne = grip.closest('.link');
    if (!ligne || !el.list.contains(ligne)) return;
    // Sans cela, le navigateur commence une sélection de texte et le geste
    // n'atteint jamais la ligne suivante.
    event.preventDefault();

    // **La capture se prend sur la liste, jamais sur la poignée.**
    //
    // Ranger une ligne, c'est la retirer du document pour la réinsérer plus
    // loin : ses descendants sont donc détachés, et le navigateur relâche
    // aussitôt la capture que porterait l'un d'eux. Le relâchement du doigt
    // n'arrivait alors nulle part, la ligne restait marquée comme saisie, et
    // rien n'était écrit — constaté au compteur d'événements du relevé Chrome
    // (relache à 0, perdu à 1), puis corrigé ici.
    el.list.setPointerCapture(event.pointerId);
    ligne.classList.add('link--dragging');

    let saisi = false;

    const suivre = (suite) => {
      saisi = true;
      const autres = [...el.list.querySelectorAll('.link')].filter((n) => n !== ligne);
      for (const autre of autres) {
        const boite = autre.getBoundingClientRect();
        if (suite.clientY < boite.top + boite.height / 2) {
          if (autre.previousElementSibling !== ligne) el.list.insertBefore(ligne, autre);
          return;
        }
      }
      if (el.list.lastElementChild !== ligne) el.list.appendChild(ligne);
    };

    const lacher = async () => {
      el.list.removeEventListener('pointermove', suivre);
      el.list.removeEventListener('pointerup', lacher);
      el.list.removeEventListener('pointercancel', lacher);
      ligne.classList.remove('link--dragging');
      // Un appui sans mouvement n'est pas un rangement : on ne réécrit pas la
      // collection pour rien.
      if (saisi) await applyOrder([...el.list.querySelectorAll('.link')].map((n) => n.dataset.id));
    };

    el.list.addEventListener('pointermove', suivre);
    el.list.addEventListener('pointerup', lacher);
    el.list.addEventListener('pointercancel', lacher);
  });
}

/**
 * Enregistre l'ordre des identifiants affichés, tel qu'il vient du document.
 * @param {string[]} ids
 * @returns {Promise<void>}
 */
async function applyOrder(ids) {
  const suite = applyVisibleOrder(links, ids);
  await store.putMany(suite.map((link, rang) => ({ ...link, order: rang })));
  await refresh();
}

/**
 * Explique la sélection courante, et surtout ce qu'elle implique.
 *
 * La règle « aucune case cochée = toute la collection » est la moins devinable
 * de l'application : sans elle, « Tout décocher » ressemble à « n'imprimer
 * rien » alors que c'est « tout imprimer ». On l'écrit donc en toutes lettres,
 * et le bouton d'impression rappelle la portée.
 */
/**
 * Explique ce que le tri fait, et ce qu'il empêche.
 *
 * Deux choses ne se devinent pas : le tri **renumérote** le tableau imprimé — le
 * « N° » sert à retrouver la ligne dans la liste qu'on a sous les yeux — et il
 * fait disparaître les flèches de déplacement, parce qu'on ne réordonne pas une
 * liste triée.
 */
function updateSortHint() {
  if (!el.sortHint) return;
  if (preferences.sortMode !== 'manual') {
    el.sortHint.textContent = t(
      "Le tri range la liste et renumérote le tableau imprimé. Le rangement n'existe qu'en ordre manuel : on ne réordonne pas une liste triée.",
    );
    return;
  }
  if (links.length < 2) {
    el.sortHint.textContent = '';
    return;
  }
  el.sortHint.textContent = reorderMode
    ? t('Faites glisser une ligne par sa poignée, ou servez-vous des flèches. Échap referme le rangement.')
    : t("Le rangement déplace un lien dans la collection, et le tableau imprimé suit cet ordre. Un tri le renumérote.");
}

/** Ouvre ou referme le mode réorganisation, et dit ce qu'il en est. */
function setReorderMode(ouvert) {
  const possible = preferences.sortMode === 'manual' && links.length > 1;
  reorderMode = Boolean(ouvert) && possible;
  renderList();
  updateSortHint();
}

/**
 * Propose les tris, en un seul groupe : ils répondent tous à la même question.
 */
function fillSortModes() {
  for (const mode of SORT_MODES) {
    const option = document.createElement('option');
    option.value = mode.id;
    option.textContent = t(mode.label);
    el.sortMode.appendChild(option);
  }
  el.sortMode.value = preferences.sortMode;
}

function updateSelectionHint() {
  // La case maîtresse reflète l'état de la liste : cochée si tout l'est,
  // indéterminée si une partie seulement. C'est ce qui remplace avantageusement
  // deux boutons : l'état se lit au lieu de se deviner.
  const all = links.length > 0 && selected.size >= links.length;
  el.selectAllBox.checked = all;
  el.selectAllBox.indeterminate = !all && selected.size > 0;
  el.selectAllBox.disabled = links.length === 0;

  // Réglé **avant** les sorties anticipées ci-dessous : « tout cocher » est le
  // geste le plus courant, et il sortait par la branche `all` sans jamais
  // atteindre le réglage — la commande de déplacement ne venait donc pas.
  updateMoveControl();

  if (links.length === 0) {
    el.selectionHint.textContent = '';
    return;
  }
  if (all) {
    el.selectionHint.textContent = t('Les {count} liens sont cochés.', { count: links.length });
    return;
  }
  el.selectionHint.textContent = selected.size === 0
    ? t("Aucun lien coché : l'impression portera sur toute la collection ({count}).", { count: links.length })
    : `${tpl(selected.size, '{count} lien coché', '{count} liens cochés')} `
      + t('sur {count}.', { count: links.length });
}

/**
 * Les collections vers lesquelles la sélection peut partir.
 *
 * La collection affichée est exclue : « déplacer » vers l'endroit où l'on est
 * ne déplacerait rien. La collection privée n'y figure pas non plus hors de son
 * contexte, puisqu'elle n'est déjà pas dans la liste des collections visibles.
 *
 * @returns {Array<object>}
 */
function moveTargets() {
  return visibleCollectionsList.filter((collection) => collection.id !== activeCollectionId);
}

/**
 * Affiche, ou retire, la commande de déplacement.
 *
 * Elle n'apparaît qu'avec une sélection **et** une destination possible : on ne
 * déplace que ce qu'on a coché, et une commande qui n'ouvrirait qu'un panneau
 * vide serait un piège. Elle disparaît dès que la dernière case se décoche —
 * c'est le même état qui la fait vivre et mourir, donc rien à synchroniser.
 */
function updateMoveControl() {
  const possible = selected.size > 0 && moveTargets().length > 0 && links.length > 0;
  el.moveGroup.hidden = !possible;
  if (!possible) closeMoveMenu();
}

/**
 * Ouvre la liste des collections d'arrivée, sous son bouton.
 *
 * Le panneau est reconstruit à chaque ouverture : la liste des collections peut
 * avoir changé — on vient peut-être d'en créer une — et un panneau gardé en
 * mémoire finirait par proposer une collection supprimée.
 */
function openMoveMenu() {
  const cibles = moveTargets();
  if (cibles.length === 0) return;

  el.moveMenu.textContent = '';
  for (const collection of cibles) {
    const choix = document.createElement('button');
    choix.type = 'button';
    choix.className = 'btn btn--ghost btn--small move__choice';
    choix.textContent = collectionDisplayName(collection);
    choix.addEventListener('click', () => moveSelection(collection.id));
    el.moveMenu.appendChild(choix);
  }

  el.moveMenu.hidden = false;
  el.moveTo.setAttribute('aria-expanded', 'true');
  // Le focus entre dans le panneau : au clavier, le choix suit immédiatement le
  // bouton qui l'a ouvert, sans traverser le reste de la page.
  el.moveMenu.firstElementChild?.focus();
}

/** Referme le panneau, et rend le focus au bouton qui l'a ouvert. */
function closeMoveMenu() {
  if (el.moveMenu.hidden) return;
  el.moveMenu.hidden = true;
  el.moveTo.setAttribute('aria-expanded', 'false');
  el.moveTo.focus();
}

/**
 * Déplace les liens cochés vers une autre collection.
 *
 * Un déplacement n'est **pas** une copie : l'enregistrement garde son
 * identifiant, sa date de collecte, ses tags, sa note et son raccourci, et
 * change seulement de collection. Une seule écriture par lien, donc, et rien à
 * recréer — l'identifiant le retrouve là où il était, avec une autre adresse de
 * rangement.
 *
 * Deux cas méritent d'être dits :
 *
 * - **Le rang ne suit pas.** Un rang appartient au rangement de la collection
 *   qu'on quitte ; l'emporter ferait s'intercaler un lien à une place que
 *   personne n'a choisie dans la collection d'arrivée. Le lien y arrive sans
 *   rang, et suit donc la date, comme tout lien jamais rangé.
 * - **Une adresse déjà présente fusionne.** Dans une collection, un doublon
 *   reste un doublon : le titre en place est corrigé si celui qu'on apporte est
 *   différent, et la copie disparaît. Sans cela, la même adresse vivrait deux
 *   fois dans la collection d'arrivée, ce que l'enregistrement interdit
 *   partout ailleurs.
 *
 * @param {string} targetId
 * @returns {Promise<void>}
 */
async function moveSelection(targetId) {
  const destination = visibleCollectionsList.find((collection) => collection.id === targetId);
  const aDeplacer = links.filter((link) => selected.has(link.id));
  if (!destination || aDeplacer.length === 0) return;

  const cible = withCollection(allStores, targetId);
  const surPlace = await cible.list();
  let deplaces = 0;
  let fusionnes = 0;

  for (const link of aDeplacer) {
    const existant = findDuplicate(surPlace, link.url);
    if (existant) {
      const { link: fusionne, updated } = mergeDuplicate(existant, link);
      if (updated) await cible.put(fusionne);
      await store.remove(link.id);
      fusionnes += 1;
      continue;
    }

    const { order, ...sansRang } = link;
    await cible.put(sansRang);
    surPlace.push({ ...sansRang, collectionId: targetId });
    deplaces += 1;
  }

  // Les liens ont quitté la collection : `refresh` les retire de la sélection,
  // ce qui fait disparaître la commande d'elle-même — et avec elle le bouton et
  // le panneau qui avaient le focus. On le repose sur le sélecteur de
  // collection : c'est la commande voisine, toujours visible, et celle qui dit
  // où l'on se trouve après un déplacement.
  await refresh();
  applyCollectionName();
  el.collectionSelect.focus();

  const morceaux = [];
  if (deplaces > 0) {
    morceaux.push(tpl(
      deplaces,
      '{count} lien déplacé vers « {name} »',
      '{count} liens déplacés vers « {name} »',
      { name: collectionDisplayName(destination) },
    ));
  }
  if (fusionnes > 0) {
    morceaux.push(tpl(
      fusionnes,
      '{count} adresse déjà présente : fusionnée',
      '{count} adresses déjà présentes : fusionnées',
    ));
  }
  toast(morceaux.join(', '));
}

/**
 * Libellé du bouton d'impression, portée comprise.
 *
 * @param {number} count
 * @returns {string}
 */
function printLabel(count) {
  if (count === 0) return t('Imprimer');

  // Cocher tous les liens revient à imprimer la collection : le dire ainsi est
  // plus clair que « la sélection (33) ».
  const whole = selected.size === 0 || selected.size >= links.length;
  if (whole) return count === 1 ? t('Imprimer le lien') : t('Imprimer les {count} liens', { count });

  return t('Imprimer la sélection ({count})', { count });
}

/**
 * Libellé du bouton d'export d'images, portée comprise.
 *
 * Même règle que le bouton d'impression : cocher tous les liens vaut la
 * collection entière, et le nombre annonce exactement ce qui sortira de
 * l'archive. « Exporter les images » sans nombre laissait deviner la portée
 * alors que la sélection, elle, pouvait n'être que partielle.
 *
 * @param {number} count
 * @returns {string}
 */
function exportImagesLabel(count) {
  if (count === 0) return t('Exporter les images (ZIP)');

  const whole = selected.size === 0 || selected.size >= links.length;
  if (whole) {
    return count === 1
      ? t("Exporter l'image (ZIP)")
      : t('Exporter les {count} images (ZIP)', { count });
  }

  return t('Exporter la sélection ({count})', { count });
}

/** L'ensemble des liens actuellement sélectionnés, dans l'ordre d'affichage. */
/**
 * Le numéro du premier lien de la **collection affichée**.
 *
 * Il est **réglé**, et non déduit : on numérote une série d'objets, et une
 * série continue après qu'on a vidé la collection du lot précédent. Le déduire
 * des liens présents remettrait la numérotation à 1 au moment précis où l'on
 * veut la continuer.
 *
 * Il appartient à la collection, et non à l'application : reprendre une série
 * ici n'a rien à voir avec ce qui se numérote ailleurs. C'est le repli sur les
 * réglages qui vaut pour la page web autonome, dont l'unique collection est
 * celle des réglages, et pour une collection écrite avant que ce champ existe.
 *
 * @returns {number}
 */
function premierNumero() {
  const collection = activeCollection();
  if (collection && Number.isFinite(collection.startIndex)) return collection.startIndex;
  return preferences.startIndex;
}

function selectedLinks() {
  const picked = links.filter((link) => selected.has(link.id));
  // Sans sélection explicite, tout est imprimé : c'est l'intention la plus
  // probable quand on clique « Imprimer ».
  return picked.length > 0 ? picked : links;
}

/**
 * Nom de la collection, tel qu'il part dans les exports.
 *
 * Un champ vidé retombe sur la valeur par défaut : un export sans titre n'aurait
 * pas de sens, et personne n'a à ressaisir « Mes liens » pour l'obtenir.
 *
 * @returns {string}
 */
function collectionName() {
  const typed = el.collectionName.value.trim();
  return typed === '' ? t(DEFAULT_SETTINGS.collectionName) : typed.slice(0, COLLECTION_NAME_MAX);
}

/**
 * La note de collection, telle qu'elle sera exportée et imprimée.
 *
 * Vide est un état normal : contrairement au nom, il n'y a pas de texte par
 * défaut à lui substituer.
 */
function collectionNote() {
  return (el.collectionNote?.value ?? '').trim().slice(0, COLLECTION_NOTE_MAX);
}

/** Reporte le nom de collection sur le titre de la page. */
function applyCollectionName() {
  document.title = `${collectionName()} — URLQRCodePrinter`;
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

/** La collection affichée, telle que la connaît la source courante. */
let activeCollectionId = DEFAULT_COLLECTION_ID;
/** @type {Array<{id: string, name: string, note: string, private?: boolean}>} */
let visibleCollectionsList = [];

/**
 * La source des collections : le stockage de l'extension, ou un adaptateur.
 *
 * Dans l'extension, les collections vivent dans `chrome.storage.local` — le
 * même stockage que les liens, donc le même que celui de la fenêtre et du
 * service worker. Sur la page web autonome, il n'y a **qu'une** collection :
 * celle du produit d'avant, dont le nom et la note vivent dans les réglages.
 * L'adaptateur expose la même interface, si bien que rien d'autre dans ce
 * fichier n'a besoin de savoir dans quel contexte il tourne — la page autonome
 * se contente de masquer le sélecteur.
 *
 * @returns {object}
 */
function createCollectionSource() {
  if (extensionApi?.storage?.local) {
    return createCollectionStore({ area: extensionApi.storage.local });
  }

  /** La collection unique de la page autonome, relue des réglages. */
  const unique = () => {
    const reglages = settings.load();
    return {
      id: DEFAULT_COLLECTION_ID,
      name: reglages.collectionName === DEFAULT_SETTINGS.collectionName
        ? ''
        : reglages.collectionName,
      note: reglages.collectionNote ?? '',
      startIndex: reglages.startIndex,
      createdAt: 0,
    };
  };

  return {
    available: false,
    async list() { return [unique()]; },
    async visible() { return [unique()]; },
    async ensureDefault() { return false; },
    async getActive() { return DEFAULT_COLLECTION_ID; },
    async setActive() { return DEFAULT_COLLECTION_ID; },
    async needsMigration() { return false; },
    async markMigrated() { return false; },
    async create() {
      throw new TypeError(t('Les collections ne sont disponibles que dans l\'extension'));
    },
    async remove() {
      throw new TypeError(t('Les collections ne sont disponibles que dans l\'extension'));
    },
    async rename(id, name) {
      // Sur la page autonome, renommer écrit le réglage d'avant : c'est lui qui
      // nomme les exports, et rien d'autre ne l'utilise.
      settings.save({ collectionName: typeof name === 'string' ? name.trim() : '' });
      return unique();
    },
    async setNote(id, note) {
      settings.save({ collectionNote: typeof note === 'string' ? note.trim() : '' });
      return unique();
    },
    async setStartIndex(id, value) {
      // Sur la page autonome, la numérotation est celle des réglages : c'est
      // elle qui est relue au chargement suivant.
      const enregistre = settings.save({ startIndex: value });
      preferences = enregistre;
      return unique();
    },
  };
}

const collections = createCollectionSource();

/**
 * Le contexte est-il privé ?
 *
 * Dans l'application, seule l'API d'extension répond : il n'y a pas d'onglet à
 * interroger comme dans la fenêtre. Elle n'existe que depuis Safari 18, si bien
 * que sur les versions antérieures l'application ne propose pas la collection
 * privée — une limite, pas un contournement.
 */
function appPrivateContext() {
  return isPrivateContext({
    inIncognitoContext: extensionApi?.extension?.inIncognitoContext,
  });
}

/** Le magasin de la collection affichée, recalculé à chaque bascule. */
function bindStore() {
  store = withCollection(allStores, activeCollectionId);
}

/** La collection affichée, ou `undefined` tant que rien n'est chargé. */
function activeCollection() {
  return visibleCollectionsList.find((collection) => collection.id === activeCollectionId);
}

/**
 * Le nombre de collections ordinaires.
 *
 * La collection de navigation privée n'en fait pas partie : elle est
 * synthétisée, jamais écrite, et ne compte donc pas parmi celles qui peuvent
 * disparaître. C'est ce nombre qui décide si l'on peut supprimer — pas
 * l'identité de la collection affichée.
 *
 * @returns {number}
 */
function ordinaryCollectionCount() {
  return visibleCollectionsList.filter((collection) => !isPrivateCollection(collection)).length;
}

/**
 * Le nom de la collection affichée, tel qu'il s'affiche dans la liste.
 * @returns {string}
 */
function activeCollectionLabel() {
  const collection = activeCollection();
  return collection ? collectionDisplayName(collection) : t(DEFAULT_COLLECTION_NAME);
}

/**
 * Peint le sélecteur de collection, et l'aide qui l'accompagne.
 *
 * La ligne entière est masquée quand l'environnement n'a pas de collections :
 * un sélecteur à une seule option, sur une page web autonome, serait un réglage
 * qui ne règle rien.
 */
function fillCollections() {
  const disponible = Boolean(collections.available);
  el.collectionPicker.hidden = !disponible;
  el.collectionHint.hidden = !disponible;
  el.collectionSelect.textContent = '';

  for (const collection of visibleCollectionsList) {
    const option = document.createElement('option');
    option.value = collection.id;
    option.textContent = collectionDisplayName(collection);
    el.collectionSelect.appendChild(option);
  }
  el.collectionSelect.value = activeCollectionId;

  // Les deux commandes restent visibles même quand elles sont refusées : leur
  // `disabled` dit pourquoi, là où les masquer laisserait croire à une fonction
  // absente.
  //
  // **Toutes les collections se suppriment, sauf la dernière** — y compris
  // celle par défaut, qui n'a rien de particulier : elle est celle de qui n'en
  // crée jamais, et la garder quand une autre existe obligeait à créer une
  // collection pour pouvoir se débarrasser de la première. Ce qui ne peut pas
  // arriver, c'est qu'il n'en reste aucune.
  const courante = activeCollection();
  const supprimable = disponible && !isPrivateCollection(courante)
    && ordinaryCollectionCount() > 1;
  el.collectionDelete.disabled = !supprimable;
  el.collectionDelete.textContent = t('Supprimer');
  el.collectionDelete.dataset.confirm = '';

  updateCollectionHint();
}

/**
 * L'aide sous le sélecteur : ce que la collection affichée implique.
 *
 * Deux choses seulement méritent d'être dites ici — ce que devient une
 * collection de navigation privée, et ce que signifie un nom vide. Le reste se
 * voit à l'écran : ce qu'une suppression emporte, la confirmation le dit déjà.
 *
 * Le nom vide est le cas le moins devinable : le champ est vide, la collection
 * s'appelle pourtant « Mes liens » dans la liste, et c'est ce nom-là qui titre
 * les exports. Le dire évite de croire à une perte.
 */
function updateCollectionHint() {
  const collection = activeCollection();
  let texte = '';
  if (isPrivateCollection(collection)) {
    texte = t("Navigation privée : ces liens ne sont conservés que jusqu'à la fermeture du navigateur.");
  } else if (collection && collection.name.trim() === '') {
    texte = t('Nom vide : cette collection s\'affiche et s\'exporte sous le nom « {name} ».', {
      name: t(DEFAULT_COLLECTION_NAME),
    });
  }

  el.collectionHint.textContent = texte;
  el.collectionHint.hidden = texte === '';
}

/**
 * Bascule d'une collection à l'autre, et redessine tout ce qui en dépend.
 *
 * La collection courante est mémorisée : rouvrir l'application retrouve celle
 * qu'on regardait, et le nom des exports suit.
 *
 * @param {string} id
 * @returns {Promise<void>}
 */
async function switchCollection(id) {
  if (!id || id === activeCollectionId) return;
  // Le choix d'import portait sur la collection affichée — ses libellés la
  // nomment. Changer de collection pendant qu'il est ouvert rendrait ces
  // libellés faux, et « Fusionner » écrirait ailleurs que ce qui est annoncé :
  // la question est donc retirée, et l'import reste à refaire.
  closeImportMenu();
  activeCollectionId = id;
  await collections.setActive(id, appPrivateContext());
  bindStore();
  await loadActiveCollectionFields();
  await refresh();
  applyCollectionName();
  fillCollections();
}

/**
 * Reporte sur les champs le nom et la note de la collection affichée.
 *
 * Le nom est écrit **tel qu'il est enregistré**, vide compris : un champ vidé
 * est ce qui vient d'être fait, et le réafficher plein ferait croire que rien
 * n'a été écrit. Le libellé intégré — « Mes liens » — reste en filigrane du
 * champ, et c'est lui qui s'affiche dans la liste et titre les exports.
 */
async function loadActiveCollectionFields() {
  const collection = activeCollection();
  el.collectionName.value = collection ? collection.name : '';
  el.collectionNote.value = collection ? collection.note : '';
  // Le premier numéro suit la même règle que le nom : c'est celui de la
  // collection affichée, et changer de collection change la numérotation.
  el.collectionStart.value = String(premierNumero());
}

/**
 * Crée une collection, et l'affiche.
 *
 * Le nom est proposé plutôt que demandé : « Nouvelle collection », puis
 * « Nouvelle collection 2 », etc. Le champ du nom est juste en dessous, et
 * prend le focus juste après — on nomme ce qu'on vient de créer, sans passer
 * par une boîte de dialogue.
 *
 * @returns {Promise<void>}
 */
async function createAppCollection() {
  if (!collections.available) return;

  const nom = freeCollectionName(t('Nouvelle collection'), visibleCollectionsList);

  try {
    const collection = await collections.create(nom);
    // Même règle que la bascule : un choix d'import ouvert nommait la collection
    // précédente, et la créer en change.
    closeImportMenu();
    visibleCollectionsList = await collections.visible({ isPrivate: appPrivateContext() });
    activeCollectionId = collection.id;
    await collections.setActive(collection.id, appPrivateContext());
    bindStore();
    await loadActiveCollectionFields();
    await refresh();
    fillCollections();
    el.collectionName.focus();
    el.collectionName.select();
  } catch (error) {
    toast(error?.message ?? t('Création impossible'), 'error');
  }
}

/**
 * Supprime la collection affichée, en deux temps.
 *
 * Un clic demande confirmation et **dit ce qui sera perdu** ; le second
 * supprime. Une suppression de collection emporte ses liens : c'est la seule
 * action de l'application qui détruit en masse, et elle ne doit pas tenir à un
 * clic mal placé.
 *
 * @returns {Promise<void>}
 */
async function deleteAppCollection() {
  const collection = activeCollection();
  if (!collections.available || !collection) return;
  // La même règle que le bouton : la collection privée ne se supprime pas, et
  // la dernière collection non plus. Le cœur la refuse de toute façon — ce
  // garde-fou évite d'armer une confirmation pour rien.
  if (isPrivateCollection(collection) || ordinaryCollectionCount() <= 1) return;

  if (el.collectionDelete.dataset.confirm !== '1') {
    el.collectionDelete.dataset.confirm = '1';
    el.collectionDelete.textContent = tpl(
      links.length,
      'Confirmer : {count} lien sera perdu',
      'Confirmer : {count} liens seront perdus',
    );
    return;
  }

  // Les liens d'abord, la collection ensuite : si l'écriture du document
  // échoue, il reste une collection vide plutôt que des liens orphelins que
  // plus rien n'affiche.
  await store.clear();
  try {
    await collections.remove(collection.id);
  } catch (error) {
    toast(error?.message ?? t('Suppression impossible'), 'error');
    return;
  }

  // Le choix d'import nommait la collection qui vient de disparaître : il n'a
  // plus de destinataire possible.
  closeImportMenu();
  // Le stockage désigne désormais une autre collection — celle qui vient d'être
  // supprimée ne peut pas rester courante — et on l'y réinscrit avant de la
  // relire, pour que la fenêtre et l'application s'accordent sur la même.
  activeCollectionId = await collections.getActive(appPrivateContext());
  await collections.setActive(activeCollectionId, appPrivateContext());
  await reloadCollections();
  toast(t('Collection supprimée'));
}

/**
 * Reprend, une seule fois, le nom et la note des réglages d'avant.
 *
 * Avant les collections, le nom et la note vivaient dans les préférences. Les
 * laisser derrière ferait perdre un titre d'export que l'utilisateur avait
 * choisi ; les recopier à chaque démarrage écraserait, à l'inverse, ce qu'il
 * aurait saisi depuis. D'où une reprise unique, marquée dans le document.
 *
 * @returns {Promise<void>}
 */
async function migrateLegacyCollection() {
  if (!collections.available) return;
  if (!(await collections.needsMigration())) return;

  const anciens = settings.load();
  const nom = anciens.collectionName === DEFAULT_SETTINGS.collectionName
    ? ''
    : anciens.collectionName;

  try {
    if (nom !== '') await collections.rename(DEFAULT_COLLECTION_ID, nom);
    if ((anciens.collectionNote ?? '') !== '') {
      await collections.setNote(DEFAULT_COLLECTION_ID, anciens.collectionNote);
    }
    // Le premier numéro était global avant d'appartenir à une collection : le
    // laisser derrière remettrait la numérotation d'une série en cours à 1.
    if (anciens.startIndex !== DEFAULT_START_INDEX) {
      await collections.setStartIndex(DEFAULT_COLLECTION_ID, anciens.startIndex);
    }
  } catch {
    // Un nom déjà pris, un stockage qui refuse : la reprise est un confort, pas
    // une étape dont dépend le démarrage.
  }
  await collections.markMigrated();
}

/**
 * Prépare les collections au démarrage : source, reprise, sélecteur.
 * @returns {Promise<void>}
 */
async function setupCollections() {
  await collections.ensureDefault();
  await migrateLegacyCollection();

  const prive = appPrivateContext() && privateStore !== null;
  visibleCollectionsList = await collections.visible({ isPrivate: prive });
  activeCollectionId = await collections.getActive(prive);
  bindStore();

  await loadActiveCollectionFields();
  fillCollections();
}

/**
 * Relit les collections, la collection courante, et ce qui s'affiche.
 *
 * Trois chemins en ont besoin, pour la même raison : quelque chose a changé
 * **hors** de la vue — un import qui vient de créer une collection, une
 * collection supprimée, ou une écriture venue d'une autre page. Le nom, le
 * sélecteur et la liste viennent tous des mêmes documents ; les relire
 * séparément finirait par en laisser un en arrière.
 *
 * La collection courante est relue du stockage plutôt que gardée de la mémoire :
 * c'est elle qui décide de ce qui est affiché, et entre deux pages qui partagent
 * le même stockage, c'est lui qui fait foi.
 *
 * @returns {Promise<void>}
 */
async function reloadCollections() {
  const prive = appPrivateContext();
  visibleCollectionsList = await collections.visible({ isPrivate: prive });
  activeCollectionId = await collections.getActive(prive);
  bindStore();
  await loadActiveCollectionFields();
  await refresh();
  fillCollections();
  applyCollectionName();
}

/**
 * Un éditeur de lien est-il ouvert dans la liste ?
 *
 * `renderList` reconstruit la liste entière : remettre la page d'aplomb pendant
 * une saisie emporterait le titre en cours de frappe, sans un mot.
 *
 * @returns {boolean}
 */
function linkEditorOpen() {
  return Boolean(el.list.querySelector?.('.link__editor-form'));
}

/** Une remise à jour a été reportée par un éditeur ouvert. */
let syncPending = false;
/** Le report d'une remise à jour, le temps qu'un geste finisse d'écrire. */
let syncTimer = null;

/**
 * Délai avant de relire le stockage, en millisecondes.
 *
 * Un import écrit plusieurs documents d'affilée, et chaque écriture produit son
 * événement : sans ce délai, la page se relirait autant de fois. Il reste court,
 * puisque ce qui est en jeu est la fraîcheur de ce qui est affiché.
 */
const SYNC_DELAY_MS = 150;

/**
 * Relit le stockage, et ne redessine que s'il a réellement changé.
 *
 * La comparaison n'est pas une optimisation : c'est ce qui rend l'écoute du
 * stockage inoffensive. Les écritures de cette page déclenchent le même
 * événement que celles des autres, et une remise à jour qui ne changerait rien
 * reconstruirait la liste pour rien.
 *
 * @returns {Promise<void>}
 */
async function syncFromStorage() {
  if (linkEditorOpen()) {
    syncPending = true;
    return;
  }

  const prive = appPrivateContext();
  const liste = await collections.visible({ isPrivate: prive });
  const id = await collections.getActive(prive);
  const liens = sortLinks(await withCollection(allStores, id).list(), preferences.sortMode);

  const identique = id === activeCollectionId
    && JSON.stringify(liste) === JSON.stringify(visibleCollectionsList)
    && JSON.stringify(liens) === JSON.stringify(links);
  if (identique) return;

  await reloadCollections();
}

/** Programme une relecture, en regroupant les écritures d'un même geste. */
function scheduleSync() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    syncFromStorage().catch(() => {});
  }, SYNC_DELAY_MS);
}

/**
 * Solde la remise à jour qu'un éditeur ouvert avait fait attendre.
 *
 * Appelée à la fermeture de l'éditeur, une fois la liste reconstruite : c'est le
 * seul moment où redessiner ne coûte rien à personne.
 */
function resumeDeferredSync() {
  if (!syncPending) return;
  syncPending = false;
  scheduleSync();
}

/**
 * Les liens à imprimer, préparés pour la cible choisie.
 *
 * C'est le seul endroit où l'on décide si le QR Code encode l'URL collectée ou
 * son raccourci. Tout ce qui produit une image, une planche ou une étiquette
 * passe par ici, et rien d'autre : la liste affichée à l'écran, elle, garde
 * toujours l'URL d'origine.
 *
 * @returns {import('./core/link.js').LinkRecord[]}
 */
function printableLinks() {
  return resolveTargets(selectedLinks(), el.qrTarget.value);
}

/** Ajoute un lien saisi à la main. */
async function addFromInput() {
  const raw = el.urlInput.value.trim();
  el.addError.hidden = true;

  if (raw === '') {
    el.addError.textContent = t('Saisissez une URL.');
    el.addError.hidden = false;
    return;
  }

  try {
    createLink({ url: raw });
  } catch (error) {
    el.addError.textContent = error.message;
    el.addError.hidden = false;
    return;
  }

  const { link, duplicate } = await store.add({ url: raw, source: 'manual' });
  el.urlInput.value = '';
  selected.add(link.id);
  await refresh();
  toast(duplicate ? t('Ce lien est déjà dans la collection') : t('Lien ajouté'));
}

/**
 * Exporte la collection.
 * @param {'csv'|'md'|'json'} format
 */
function exportAs(format) {
  if (links.length === 0) return;

  const name = collectionName();
  const note = collectionNote();
  const specs = {
    // Le CSV n'a que des lignes de liens : la note décrit la collection, elle
    // n'a pas de ligne où se mettre. Elle va dans les sorties qui portent un
    // en-tête — Markdown et archive.
    csv: { text: toCsv(links), ext: 'csv', mime: 'text/csv;charset=utf-8' },
    // Le titre du Markdown est le nom de la collection : ce que l'utilisateur a
    // nommé, et non un libellé choisi par le programme.
    md: {
      text: toMarkdown(links, { title: name, note }),
      ext: 'md',
      mime: 'text/markdown;charset=utf-8',
    },
    json: { text: toJson(links, { title: name, note }), ext: 'json', mime: 'application/json' },
  };
  const spec = specs[format];
  const filename = exportFilename(name, spec.ext);

  const ok = downloadText(filename, spec.text, { mime: spec.mime });
  toast(ok ? t('{filename} enregistré', { filename }) : t('Téléchargement impossible'), ok ? 'info' : 'error');
}

/**
 * L'import qui attend un choix de rangement.
 *
 * Le fichier est lu **tout de suite** — c'est ce qui permet d'annoncer ce qu'il
 * contient — mais rien n'est écrit avant que l'utilisateur ait dit où le mettre.
 * Un import qui écrirait d'abord demanderait ensuite de défaire ce qu'il vient
 * de faire : c'est exactement ce qu'on cherche à éviter avec un remplacement.
 *
 * @type {{ file: string, candidates: object[], rejected: number,
 *   collection: { name: string, note: string }, newName: string }|null}
 */
let importEnAttente = null;

/**
 * Lit un fichier importé, puis demande où le ranger.
 *
 * L'import ne devine plus : il **propose**. Trois issues, et aucune n'est
 * raisonnable par défaut — ajouter à la collection affichée quand on voulait
 * repartir de l'archive remplit la mauvaise, et remplacer quand on voulait
 * ajouter détruit ce qu'on avait. Le fichier est donc lu d'abord, parce que le
 * choix se fait en connaissance de cause : le panneau dit combien de liens il
 * porte, et sous quel nom de collection.
 *
 * @param {File} file
 */
async function importArchive(file) {
  const label = el.import.textContent;
  el.import.disabled = true;
  el.import.textContent = t('Lecture…');

  try {
    // Un ZIP se lit en octets, un texte en texte : le manifeste du dossier
    // d'étiquettes est à l'intérieur de l'archive, pas à côté.
    const isZip = /\.zip$/i.test(file.name) || file.type === 'application/zip';
    const parsed = parseImportFile(isZip
      ? { bytes: new Uint8Array(await file.arrayBuffer()), name: file.name }
      : { text: await file.text(), name: file.name });

    // Un enregistrement illisible n'arrête pas l'import : il est compté.
    const { links: candidates, rejected } = toImportableLinks(parsed.records);
    if (candidates.length === 0) {
      toast(t('Aucun lien exploitable dans {file}', { file: file.name }), 'error');
      return;
    }

    openImportMenu({
      file: file.name,
      candidates,
      rejected,
      collection: parsed.collection ?? { name: '', note: '' },
    });
  } catch (error) {
    toast(t('Import impossible : {message}', { message: error.message }), 'error');
  } finally {
    el.import.textContent = label;
    el.import.disabled = false;
  }
}

/**
 * Ouvre le choix du rangement, et nomme les collections concernées.
 *
 * Les libellés portent les noms : « Fusionner avec “Veille” » dit exactement ce
 * qui va se passer, là où « Ajouter » laisse chercher à quoi. La collection
 * nouvelle reçoit le nom du fichier quand il en porte un — c'est le cas de toute
 * archive exportée d'ici — et un nom libre est cherché pour ne pas se heurter à
 * une collection qui le porte déjà.
 *
 * @param {{ file: string, candidates: object[], rejected: number,
 *   collection: { name: string, note: string } }} pending
 */
function openImportMenu(pending) {
  const cible = activeCollectionLabel();
  const privee = isPrivateCollection(activeCollection());

  importEnAttente = {
    ...pending,
    // La nouvelle collection est nommée **maintenant** : le panneau peut donc
    // l'annoncer, et le nom ne dépend pas de l'instant du clic.
    newName: collections.available
      ? freeCollectionName(pending.collection.name || t('Nouvelle collection'), visibleCollectionsList)
      : '',
  };

  el.importMenuTitle.textContent = tpl(
    pending.candidates.length,
    '{count} lien lu dans {file}',
    '{count} liens lus dans {file}',
    { file: pending.file },
  );

  // Ce que le fichier dit de sa collection, et ce que « Remplacer » en ferait.
  // En navigation privée, le nom et la note ne sont pas modifiables : le dire
  // évite de croire que « Remplacer » les emportera.
  el.importMenuHint.textContent = privee
    ? t('Navigation privée : seuls les liens changent ; son nom et sa note ne sont pas modifiables.')
    : importCollectionHint(pending.collection);

  el.importMerge.textContent = t('Fusionner avec « {name} »', { name: cible });
  el.importMerge.title = t('Ajoute les liens lus à la collection affichée ; son nom et sa note ne changent pas.');

  el.importReplace.textContent = t('Remplacer « {name} »', { name: cible });
  el.importReplace.title = t('Vide la collection affichée, puis y met les liens du fichier : son nom et sa note deviennent ceux du fichier.');

  // Une collection de plus n'a de sens que là où il y en a plusieurs : sur la
  // page web autonome, la commande reste masquée plutôt que d'échouer au clic.
  el.importAdd.hidden = !collections.available;
  if (collections.available) {
    el.importAdd.textContent = t('Nouvelle collection « {name} »', { name: importEnAttente.newName });
    el.importAdd.title = t("Crée une collection à part et y range les liens lus ; la collection affichée n'est pas touchée.");
  }

  el.importMenu.hidden = false;
  el.importMerge.focus();
}

/**
 * Ce que le fichier porte comme nom et comme note de collection.
 *
 * Le cas sans nom mérite d'être dit : « Remplacer » écrase le nom et la note par
 * ceux du fichier, et un fichier qui n'en porte pas les **vide**. Le taire
 * laisserait découvrir la chose une fois la collection renommée.
 *
 * @param {{ name: string, note: string }} collection
 * @returns {string}
 */
function importCollectionHint(collection) {
  if (collection.name === '') {
    return t("Le fichier ne porte ni nom ni note de collection : « Remplacer » viderait aussi le nom et la note de la collection affichée.");
  }
  if (collection.note !== '') {
    return t('Le fichier porte le nom de collection « {name} » et sa note.', { name: collection.name });
  }
  return t('Le fichier porte le nom de collection « {name} ».', { name: collection.name });
}

/** Referme le choix du rangement, sans rien importer. */
function closeImportMenu() {
  el.importMenu.hidden = true;
  importEnAttente = null;
}

/**
 * Range l'import en attente selon l'issue choisie.
 *
 * Trois issues, trois effets, et un seul point commun : les liens du fichier
 * entrent dans **une** collection, sans doublon.
 *
 * - `merge` — ils rejoignent la collection affichée, qui garde son nom et sa
 *   note. C'est l'import d'avant, et le seul que connaissait le produit.
 * - `replace` — la collection affichée est vidée d'abord, puis renommée et
 *   notée d'après le fichier. C'est le geste « je reprends cette archive comme
 *   point de départ », et il **détruit** : c'est pour cela qu'il est nommé, et
 *   non coché d'avance.
 * - `add` — une collection est créée pour l'occasion, avec le nom et la note du
 *   fichier. La collection affichée n'est pas touchée.
 *
 * @param {'merge'|'replace'|'add'} mode
 * @returns {Promise<void>}
 */
async function applyImport(mode) {
  const pending = importEnAttente;
  closeImportMenu();
  if (!pending) return;

  // Le magasin de la collection qui reçoit : celui de la collection affichée,
  // ou celui de la collection qui vient d'être créée.
  let destination = store;

  if (mode === 'add') {
    try {
      const creee = await collections.create(pending.newName);
      if (pending.collection.note !== '') {
        await collections.setNote(creee.id, pending.collection.note);
      }
      activeCollectionId = creee.id;
      await collections.setActive(creee.id, appPrivateContext());
      bindStore();
      destination = store;
    } catch (error) {
      toast(error?.message ?? t('Création impossible'), 'error');
      return;
    }
  } else if (mode === 'replace') {
    // Les liens d'abord : si l'écriture suivante échoue, la collection est vide
    // plutôt que mélangée à ce qu'elle portait.
    await destination.clear();

    // Le nom et la note suivent le fichier — ceux qu'il porte, et le vide quand
    // il n'en porte pas. La collection de navigation privée est la seule
    // exception : elle est synthétisée, jamais écrite, et n'a donc rien à
    // renommer. Le panneau l'a dit avant le clic.
    if (!isPrivateCollection(activeCollection())) {
      try {
        await collections.rename(activeCollectionId, pending.collection.name);
        await collections.setNote(activeCollectionId, pending.collection.note);
      } catch (error) {
        toast(error?.message ?? t('Renommage impossible'), 'error');
      }
    }
  }

  let added = 0;
  let duplicates = 0;
  for (const candidate of pending.candidates) {
    const { duplicate } = await destination.add(candidate, { allowDuplicate: false });
    if (duplicate) duplicates += 1;
    else added += 1;
  }

  // La liste des collections a pu changer — une collection créée, un nom
  // remplacé — et le nom affiché vient d'elle : on la relit avant de redessiner.
  await reloadCollections();
  toast(importReport({ added, duplicates, rejected: pending.rejected }));
}

/**
 * Résume un import en une phrase.
 *
 * Distinguer « déjà présent » de « illisible » évite de croire à un échec là où
 * l'import a simplement reconnu ce qu'il avait déjà.
 *
 * @param {{ added: number, duplicates: number, rejected: number }} report
 * @returns {string}
 */
function importReport({ added, duplicates, rejected }) {
  const parts = [tpl(added, '{count} lien importé', '{count} liens importés')];
  if (duplicates > 0) parts.push(tpl(duplicates, '{count} déjà présent', '{count} déjà présents'));
  if (rejected > 0) parts.push(tpl(rejected, '{count} illisible', '{count} illisibles'));
  return parts.join(', ');
}

// ---------------------------------------------------------------------------
// Raccourcissement d'URL
// ---------------------------------------------------------------------------

/**
 * Remplit la liste des services de raccourcissement.
 *
 * Le libellé de chaque option dit ce que le service change pour un usage
 * ordinaire — quelqu'un qui veut seulement un lien plus court n'a pas à
 * arbitrer entre cinq marques. T.LY est présenté d'emblée et marqué
 * « (défaut) » ; la note technique reste en infobulle.
 *
 * L'URL complète est transmise au service choisi : c'est une décision qui
 * appartient à l'utilisateur, donc rien n'est coché ni déclenché d'avance.
 */
/**
 * L'aide affichée sous le sélecteur de service.
 *
 * Elle dit deux choses que le libellé ne peut pas porter : que **rien n'est
 * raccourci** tant qu'on ne le demande pas, et ce que le service retenu change.
 * Le lien de parrainage, lui, n'apparaît que si une adresse d'affiliation est
 * enregistrée dans le cœur — sinon il n'y a rien à proposer, et un lien mort
 * serait pire qu'une absence.
 */
function updateShortenerHint() {
  const shortener = currentShortener();

  // **Une phrase, puis une autre** — et non un empilement de mentions. L'aide
  // annonçait le service retenu, sa note et la liste des autres, séparés par des
  // deux-points : à lire, cela ressemblait à une fiche technique. Elle se lit
  // maintenant comme une phrase suivie d'une phrase : ce qu'il faut faire, ce
  // qui ne se fait pas tout seul, ce que le service proposé apporte, et le droit
  // d'en choisir un autre.
  //
  // Chaque phrase reste **un seul littéral**, traduit d'un bloc : découpée en
  // morceaux, l'anglais ne l'ordonnerait pas de la même façon.
  // **Un seul littéral, sur une seule ligne.** Le relevé des clés lit le source
  // sans l'exécuter : deux morceaux concaténés, et il ne voit que le premier —
  // la traduction manque alors pour une phrase qui s'affiche en entier.
  // eslint-disable-next-line max-len
  const ouverture = t('Si vous voulez un lien plus court, choisissez un service puis cliquez sur Raccourcir. Rien ne change tant que vous ne le faites pas.');
  // La troisième phrase parle du service **retenu** : dire « T.LY est proposé
  // par défaut » devant un autre service serait exact, et à côté de la question.
  const service = shortener.id === 'tly'
    ? t('T.LY est proposé par défaut : le lien est plus court et reste anonyme.')
    : t('{name} est le service que vous avez choisi : {note}', {
      name: shortener.name,
      note: t(shortener.note),
    });
  const alternative = t('Vous pouvez aussi choisir un autre service de raccourcissement.');

  el.shortenerHint.textContent = `${ouverture} ${service} ${alternative}`;

  // Le lien de parrainage n'apparaît que si une adresse d'affiliation est
  // enregistrée dans le cœur : tant qu'elle est vide, il n'y a rien à proposer,
  // et un lien mort serait pire qu'une absence.
  //
  // Le libellé dit « parrainage » : suivre ce lien crédite le projet, et le
  // taire serait une petite tromperie au moment précis où l'utilisateur croit
  // ouvrir une page ordinaire. Le `title` reprend la même information pour la
  // souris, et l'annonce du nouvel onglet pour le lecteur d'écran.
  if (shortener.id === 'tly' && TLY_AFFILIATE_URL !== '') {
    const lien = document.createElement('a');
    lien.href = TLY_AFFILIATE_URL;
    lien.target = '_blank';
    lien.rel = 'noopener noreferrer';
    lien.textContent = t('Créer un compte T.LY (parrainage)');
    lien.title = t('Ouvre la page d\'inscription T.LY : le projet est crédité du parrainage.');
    const annonce = document.createElement('span');
    annonce.className = 'sr-only';
    annonce.textContent = t(' (ouvre un nouvel onglet)');
    lien.appendChild(annonce);
    el.shortenerHint.append(' ', lien);
  }
}

function fillShorteners() {
  el.shortener.textContent = '';
  for (const shortener of SHORTENERS) {
    const option = document.createElement('option');
    option.value = shortener.id;
    const echec = servicesEnEchec.get(shortener.id);
    // Un service qui vient de ne pas répondre le dit, là où on le choisit.
    // L'option reste **sélectionnable** : une panne passagère ne doit pas
    // interdire de réessayer, et c'est le seul moyen de savoir si elle dure.
    option.textContent = echec
      ? t('{label} — n\'a pas répondu', { label: t(shortener.label) })
      : t(shortener.label);
    option.title = echec ? `${shortener.note} — ${echec.message}` : shortener.note;
    el.shortener.appendChild(option);
  }
}

/** Le service actuellement retenu. */
function currentShortener() {
  return findShortener(el.shortener.value) ?? SHORTENERS[0];
}

/** Rappelle ce que fait le bouton, et sur quels liens il portera. */
function updateShortenStatus(message = '') {
  const shortened = links.filter(hasShortUrl);
  el.shortenClear.hidden = shortened.length === 0;

  /**
   * La phrase de base : le message fourni, ou ce que le bouton fera.
   *
   * @returns {string}
   */
  const base = () => {
    if (message !== '') return message;
    if (links.length === 0) return '';
    const scope = selected.size > 0
      ? tpl(selected.size, '{count} lien coché', '{count} liens cochés')
      : t('toute la collection');
    const done = shortened.length > 0
      ? tpl(shortened.length, ' — {count} raccourci en place', ' — {count} raccourcis en place')
      : '';
    return t(
      "{label} · {scope}{done}. L'URL complète est transmise au service.",
      { label: t(currentShortener().label), scope, done },
    );
  };

  // Le service choisi a déjà échoué dans cette session : on le dit, et on
  // propose un autre — sans changer à sa place. Changer de service en silence
  // enverrait l'adresse à un tiers que l'utilisateur n'a pas choisi.
  //
  // Cette phrase s'ajoute **au message éventuel**, et ne le remplace pas : le
  // bilan du lot vient d'être écrit, et l'effacer priverait l'utilisateur de ce
  // qui vient de se passer.
  const echec = servicesEnEchec.get(currentShortener().id);
  if (echec) {
    const autre = suggestShortener(currentShortener().id, servicesEnEchec.keys());
    const phrase = autre
      ? t('{label} n\'a pas répondu à l\'instant : {message} Essayez {autre}.', {
        label: t(currentShortener().label), message: echec.message, autre: t(autre.label),
      })
      : t('{label} n\'a pas répondu à l\'instant : {message} Aucun autre service n\'est proposé.', {
        label: t(currentShortener().label), message: echec.message,
      });
    const avant = base();
    el.shortenStatus.textContent = avant === '' ? phrase : `${avant} ${phrase}`;
    return;
  }

  el.shortenStatus.textContent = base();
}

/**
 * Raccourcit les liens cochés — ou toute la collection si rien n'est coché.
 *
 * Rien n'est automatique : chaque clic est une action explicite, et le lot est
 * annulable. Les échecs sont consignés lien par lien plutôt que de faire
 * échouer l'ensemble.
 */
async function shortenSelection() {
  if (shortenJob) {
    // Un second clic annule le lot en cours.
    shortenJob.abort();
    return;
  }
  if (links.length === 0) return;

  const targets = selectedLinks().filter((link) => !hasShortUrl(link));
  if (targets.length === 0) {
    updateShortenStatus(t('Tous les liens visés sont déjà raccourcis.'));
    return;
  }

  const shortener = createShortener({ provider: el.shortener.value });
  const controller = new AbortController();
  shortenJob = controller;
  const serviceId = shortener.provider.id;

  el.shorten.disabled = false;
  el.shorten.textContent = t('Annuler');
  toast(t('Raccourcissement via {name}…', { name: shortener.provider.name }));

  try {
    const report = await shortener.shortenMany(targets, {
      signal: controller.signal,
      onProgress: (done, total) => {
        updateShortenStatus(t('{name} · {done}/{total}…', { name: shortener.provider.name, done, total }));
      },
    });

    // Chaque succès est écrit séparément : un lien raccourci ne doit jamais
    // pouvoir en écraser un autre, ni faire perdre l'URL d'origine.
    const now = Date.now();
    for (const item of report.ok) {
      const link = links.find((candidate) => candidate.id === item.id);
      if (!link) continue;
      await store.put({
        ...link,
        shortUrl: item.shortUrl,
        shortProvider: shortener.provider.id,
        shortenedAt: now,
      });
    }

    await refresh();

    // Ce qui accuse le **service** est retenu ; ce qui accuse le lien ne l'est
    // pas. « Ce lien est déjà court » n'apprend rien sur la santé du service, et
    // le marquer ferait écarter un service qui fonctionne.
    const fautes = report.failed.filter((item) => isServiceFailure(item.code));
    if (fautes.length > 0) {
      servicesEnEchec.set(serviceId, { message: fautes[0].message, at: Date.now() });
    } else if (report.ok.length > 0) {
      // Il a répondu : le marquage d'une panne précédente est levé.
      servicesEnEchec.delete(serviceId);
    }

    const summary = describeShortenReport(report);
    toast(summary, report.failed.length > 0 ? 'error' : 'info');
    fillShorteners();
    el.shortener.value = serviceId;
    updateShortenStatus(summary);
  } catch (error) {
    // Le lot entier a échoué : c'est le service, par construction.
    servicesEnEchec.set(serviceId, { message: error.message ?? t('raison inconnue'), at: Date.now() });
    fillShorteners();
    el.shortener.value = serviceId;
    toast(t('Raccourcissement impossible : {message}', { message: error.message }), 'error');
    updateShortenStatus();
  } finally {
    shortenJob = null;
    el.shorten.textContent = t('Raccourcir');
    el.shorten.disabled = links.length === 0;
    updateTargetAvailability();
  }
}

/**
 * Remplit le choix de la cible du QR Code.
 *
 * Deux possibilités seulement, et l'URL d'origine reste la valeur par défaut :
 * un lien raccourci dépend d'un tiers, ce n'est pas un choix à faire par
 * inadvertance.
 */
/** Remplit le choix de la date imprimée sous le QR Code. */
/** Rien à remplir : la date se coche, elle ne se choisit plus dans une liste. */
function fillDateModes() {}

/** Le mode de date retenu, et le texte à imprimer pour un lien. */
function dateMode() {
  // La date se coche dans chaque onglet : un réglage global pour quatre mises
  // en forme obligeait à le changer en passant de l'une à l'autre.
  //
  // Cocher « Avec l'heure » suffit : elle implique la date. Sans cela, cocher
  // la seule heure ne produisait rien du tout, sans que rien ne l'explique.
  if (el.sheetDateTime.checked) return 'datetime';
  if (el.sheetDate.checked) return 'date';
  return 'none';
}

/**
 * Le mode de date de l'export d'images, d'après ses propres cases.
 *
 * Avant, cet onglet retombait sur le réglage de la planche : une date cochée
 * pour la planche s'imprimait aussi dans les images, sans qu'on l'ait demandée.
 */
function exportDateMode() {
  if (el.exportDateTime.checked) return 'datetime';
  if (el.exportDate.checked) return 'date';
  return 'none';
}

/** Le mode de date du tableau imprimé, d'après ses propres cases. */
function tableDateMode() {
  // Même règle que la planche : « Avec l'heure » implique la date.
  if (el.tableColDateTime.checked) return 'datetime';
  if (el.tableColDate.checked) return 'date';
  return 'none';
}

/**
 * Explique ce que coûte la date demandée.
 *
 * Chaque ligne sous le QR Code se paie en place disponible : le dire évite de
 * croire que la date est gratuite.
 */
function updateDateHint() {
  const mode = dateMode();
  const parties = [];
  if (mode === 'none') {
    parties.push(t('Aucune date imprimée.'));
  } else {
    const date = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const echantillon = mode === 'date'
      ? `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
      : `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} `
        + `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    parties.push(t('Date de collecte sur sa propre ligne — {sample}.', { sample: echantillon }));
  }
  if (el.sheetDateIndex.checked) parties.push(t('Le numéro du lien s\'imprime au-dessus du titre.'));
  parties.push(t('Chaque ligne de plus réduit la place du QR Code.'));
  el.sheetDateHint.textContent = parties.join(' ');
}

function fillTargets() {
  const choices = [
    { value: 'original', label: t("L'URL collectée") },
    { value: 'short', label: t('Le lien raccourci') },
  ];
  el.qrTarget.textContent = '';
  targetOptions.clear();
  for (const choice of choices) {
    const option = document.createElement('option');
    option.value = choice.value;
    option.textContent = choice.label;
    targetOptions.set(choice.value, option);
    el.qrTarget.appendChild(option);
  }
}

/**
 * Active ou non le choix « lien raccourci », et explique la conséquence.
 *
 * Raccourcir envoie l'URL complète à un tiers, et l'étiquette imprimée dépend
 * ensuite de la survie de ce tiers : le dire à l'endroit où l'on fait le choix
 * vaut mieux qu'une note de bas de page.
 */
function updateTargetAvailability() {
  const shortened = links.filter(hasShortUrl).length;
  const shortOption = targetOptions.get('short');
  if (shortOption) shortOption.disabled = shortened === 0;

  if (shortened === 0 && el.qrTarget.value === 'short') {
    el.qrTarget.value = 'original';
    settings.save({ targetMode: 'original' });
  }

  el.targetHint.textContent = shortened === 0
    ? t("Le QR Code encode l'URL collectée.")
    : tpl(
      shortened,
      '{count} lien raccourci : un QR Code plus court se scanne plus vite et tient sur une plus petite étiquette.',
      '{count} liens raccourcis : un QR Code plus court se scanne plus vite et tient sur une plus petite étiquette.',
    ) + ' ' + t("Ce choix vaut pour toute la collection ; chaque lien peut dire le contraire dans la liste.");
}

/** Retire les raccourcis : les URL d'origine n'ont jamais bougé. */
async function clearShortUrls() {
  const shortened = links.filter(hasShortUrl);
  if (shortened.length === 0) return;

  for (const link of shortened) {
    await store.put({ ...link, shortUrl: '', shortProvider: '', shortenedAt: 0 });
  }
  await refresh();
  toast(tpl(shortened.length, '{count} raccourci retiré', '{count} raccourcis retirés'));
}

// ---------------------------------------------------------------------------
// Aperçu papier
// ---------------------------------------------------------------------------

/** Configuration de la planche à partir du formulaire. */
/**
 * Écrit un nombre décimal à la française.
 *
 * Les cotes écrites à la main dans les libellés utilisent la virgule
 * (« 63,5 × 33,9 mm ») ; les valeurs calculées sortaient en anglais
 * (« 63.5 × 33.9 »). Deux écritures pour la même grandeur dans la même phrase,
 * c'est le genre de détail qui fait douter du reste.
 *
 * @param {number} value
 * @param {number} [digits]
 * @returns {string}
 */
function decimal(value, digits = 1) {
  if (!Number.isFinite(value)) return '—';
  const fixed = value.toFixed(digits).replace('.', ',');
  // « 29,0 mm » et « 0,40 mm » se lisent mal : on retire les zéros de fin,
  // sans jamais toucher aux entiers (« 260 » reste « 260 »).
  return fixed.includes(',') ? fixed.replace(/,?0+$/, '') : fixed;
}

/** Contraint un entier de formulaire entre deux bornes. */
/**
 * Borne de saisie des deux champs de grille.
 *
 * Elle n'existe que pour écarter un nombre non numérique ou délirant avant le
 * calcul : ce qui **tient** réellement est décidé par `clampGrid`, et c'est sa
 * réponse qui est réécrite dans le champ. Un plafond figé dans le balisage — 12
 * colonnes, 30 rangées — écrêtait la valeur avant que le calcul ne la voie, ce
 * qui produisait exactement le défaut signalé : le champ disait 40, l'aperçu en
 * dessinait 12, et rien ne le disait.
 */
const GRILLE_MAX_SAISIE = 999;

function clampInt(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(number)));
}

/**
 * Configuration de la planche.
 *
 * **Une seule présentation** : on choisit la grille (colonnes, rangées), les
 * marges et les écarts ; la taille des étiquettes en découle. Le choix de
 * planche ne fait que préremplir ces six valeurs.
 *
 * L'écran précédent proposait deux modes — « Cotes de la référence » et
 * « Colonnes et rangées » — et le premier **masquait les champs** : rien
 * n'indiquait alors comment la planche était remplie, ce qui le rendait
 * incompréhensible.
 *
 * Le décalage, lui, ne change jamais la grille : il ne fait que la déplacer,
 * pour rattraper l'entraînement d'une imprimante ou la marge asymétrique d'une
 * planche du commerce.
 *
 * @returns {object & { problem?: string }}
 */
function sheetConfig() {
  const preset = SHEET_PRESETS[el.preset.value] ?? SHEET_PRESETS[DEFAULT_SHEET_PRESET];
  const page = PAGE_SIZES[preset.page];

  const config = {
    ...preset,
    qrSizeRatio: Number(el.sheetQr.value) / 100,
    offsetXMm: Number(el.sheetOffsetX.value) || 0,
    offsetYMm: Number(el.sheetOffsetY.value) || 0,
  };

  const demande = {
    pageWidthMm: page.widthMm,
    pageHeightMm: page.heightMm,
    columns: clampInt(el.sheetColumns.value, 1, GRILLE_MAX_SAISIE, preset.declaredColumns),
    rows: clampInt(el.sheetRows.value, 1, GRILLE_MAX_SAISIE, preset.declaredRows),
    marginXMm: Math.max(0, Number(el.sheetMarginX.value) || 0),
    marginYMm: Math.max(0, Number(el.sheetMarginY.value) || 0),
    gapXMm: Math.max(0, Number(el.sheetGapX.value) || 0),
    gapYMm: Math.max(0, Number(el.sheetGapY.value) || 0),
  };

  // **La grille demandée est ramenée à ce qui tient**, au lieu d'être refusée en
  // gardant la disposition précédente. C'était le défaut : les champs disaient
  // une chose, l'aperçu une autre, le papier une troisième, et rien ne disait
  // laquelle. Le champ est réécrit à la sortie du champ de saisie, si bien que
  // les trois finissent par montrer la même grille.
  const garde = clampGrid(demande);
  if (garde.columns === 0 || garde.rows === 0) {
    return { ...config, problem: garde.reason, gridFix: garde };
  }

  const grid = fitGrid({
    ...demande,
    columns: garde.columns,
    rows: garde.rows,
  });

  if (!grid.ok) {
    // Filet, et non chemin courant : `clampGrid` rend une grille que `fitGrid`
    // accepte, et un test le vérifie sur un balayage de marges et d'écarts. On
    // préfère ce filet à une planche sans cotes, si la garantie venait à céder.
    return { ...config, problem: grid.reason, gridFix: garde };
  }

  return {
    ...config,
    columns: grid.columns,
    rows: grid.rows,
    labelWidthMm: grid.labelWidthMm,
    labelHeightMm: grid.labelHeightMm,
    marginXMm: grid.marginXMm,
    marginYMm: grid.marginYMm,
    gapXMm: demande.gapXMm,
    gapYMm: demande.gapYMm,
    gridFix: garde,
  };
}

/**
 * Ramène les deux champs de grille à ce qui tient, et l'explique sur place.
 *
 * Appelée à la **sortie** du champ, jamais à la frappe : réécrire un nombre
 * pendant qu'on le tape empêcherait d'entrer « 12 » sans passer par « 1 ». Une
 * fois la saisie finie, la valeur retenue remplace celle qui ne tenait pas, et
 * l'écran, l'aperçu et le papier ne montrent plus qu'une seule grille — c'est
 * exactement le défaut à corriger.
 *
 * Quand il ne reste aucune place, les champs ne sont pas touchés : mettre « 0 »
 * dans un champ qui accepte 1 au minimum serait une valeur impossible à
 * corriger à la main.
 */
function recadrerGrille() {
  if (!el.sheetGridHint) return;

  const preset = SHEET_PRESETS[el.preset.value] ?? SHEET_PRESETS[DEFAULT_SHEET_PRESET];
  const page = PAGE_SIZES[preset.page];
  const commun = demandeSansGrille(preset, page);

  // La grille **demandée**, retenue avant d'être ramenée à ce qui tient : c'est
  // elle que l'ajustement d'espacement doit faire tenir.
  const demande = {
    columns: clampInt(el.sheetColumns.value, 1, GRILLE_MAX_SAISIE, preset.declaredColumns),
    rows: clampInt(el.sheetRows.value, 1, GRILLE_MAX_SAISIE, preset.declaredRows),
  };
  derniereGrilleDemandee = demande;
  derniereGrilleDemandeeInitiale = demande;

  const garde = clampGrid({ ...commun, ...demande });

  // La borne haute des champs suit la feuille : le poussoir du champ et la
  // validation native du navigateur disent alors la même chose que le calcul,
  // au lieu de plafonner à 12 et 30 sur une A4 qui en accepte 26 et 56.
  const plafond = clampGrid({
    ...commun, columns: GRILLE_MAX_SAISIE, rows: GRILLE_MAX_SAISIE,
  });
  if (plafond.columns > 0) el.sheetColumns.max = String(plafond.columns);
  if (plafond.rows > 0) el.sheetRows.max = String(plafond.rows);

  derniereGrilleEcourtee = garde.clamped;

  if (!garde.clamped) {
    el.sheetGridHint.textContent = '';
    return;
  }

  if (garde.columns > 0 && garde.rows > 0) {
    el.sheetColumns.value = String(garde.columns);
    el.sheetRows.value = String(garde.rows);
  }
  el.sheetGridHint.textContent = garde.reason;
  // **Ranger plutôt que trancher.** Le bouton se montre au rendu, qui seul sait
  // si le contenu tient dans les étiquettes ; ici, on se contente de dire que la
  // grille a été ramenée.
}

/**
 * Range la planche pour que ce qu'on imprime tienne dans les étiquettes.
 *
 * Le plan vient de `planAjustement`, exactement comme le bouton qui l'annonce :
 * une seule décision, deux usages. Ce qui est fait est ensuite **dit**, chiffres
 * en main — un ajustement silencieux se confondrait avec une correction de
 * l'utilisateur, et personne ne saurait pourquoi les champs ont bougé.
 */
function ajusterEspacement() {
  const modules = derniersModules;
  const lignes = dernieresLignes;
  if (modules === null) return;

  const demandeInitiale = derniereGrilleDemandeeInitiale
    ?? derniereGrilleDemandee
    ?? { columns: 0, rows: 0 };
  const plan = planAjustement(modules, lignes);
  if (!plan) return;

  const poser = (champ, valeur) => {
    champ.value = String(valeur);
    champ.dispatchEvent(new Event('input', { bubbles: true }));
    champ.dispatchEvent(new Event('change', { bubbles: true }));
  };
  if (plan.kind === 'espacement') {
    poser(el.sheetGapX, plan.gapXMm);
    poser(el.sheetGapY, plan.gapYMm);
    poser(el.sheetMarginX, plan.marginXMm);
    poser(el.sheetMarginY, plan.marginYMm);
  }
  // La grille demandée revient : elle avait été ramenée à ce qui tenait, et
  // c'est justement ce qu'on veut défaire. Le plan qui descend la grille donne
  // ses propres colonnes et rangées.
  poser(el.sheetColumns, plan.columns);
  poser(el.sheetRows, plan.rows);

  derniereGrilleDemandee = { columns: plan.columns, rows: plan.rows };
  recadrerGrille();
  renderPreview();
  el.sheetGridHint.textContent = plan.kind === 'espacement'
    ? t('Écart {gap} mm et marge {margin} mm : les {columns} × {rows} tiennent sur la feuille.', {
      gap: decimal(plan.gapXMm),
      margin: decimal(plan.marginXMm),
      columns: plan.columns,
      rows: plan.rows,
    })
    : t('Les {asked} ne peuvent pas tenir sur une page : {columns} × {rows} à la place.', {
      asked: tpl(Math.max(demandeInitiale.columns, plan.columns),
        '{count} colonne', '{count} colonnes'),
      columns: plan.columns,
      rows: plan.rows,
    });
  el.sheetFit.hidden = true;
}

/**
 * Les réglages de la grille, hors colonnes et rangées.
 *
 * Extrait pour que la borne haute et le recadrage partent des mêmes chiffres :
 * deux lectures séparées finiraient par diverger, et la borne haute ne
 * correspondrait plus à ce que le recadrage autorise.
 *
 * @param {object} preset
 * @param {{ widthMm: number, heightMm: number }} page
 */
function demandeSansGrille(preset, page) {
  return {
    pageWidthMm: page.widthMm,
    pageHeightMm: page.heightMm,
    marginXMm: Math.max(0, Number(el.sheetMarginX.value) || 0),
    marginYMm: Math.max(0, Number(el.sheetMarginY.value) || 0),
    gapXMm: Math.max(0, Number(el.sheetGapX.value) || 0),
    gapYMm: Math.max(0, Number(el.sheetGapY.value) || 0),
  };
}

/**
 * Recopie une disposition dans les six champs.
 *
 * La conversion vit dans `core/sheet.js` : c'est elle que les tests confrontent
 * aux cotes publiées, et une seconde formule ici finirait par en diverger.
 */
function prefillGridFields() {
  const preset = SHEET_PRESETS[el.preset.value] ?? SHEET_PRESETS[DEFAULT_SHEET_PRESET];
  const grid = presetToGrid(preset, PAGE_SIZES[preset.page]);

  el.sheetColumns.value = String(grid.columns);
  el.sheetRows.value = String(grid.rows);
  el.sheetMarginX.value = String(grid.marginXMm);
  el.sheetMarginY.value = String(grid.marginYMm);
  el.sheetGapX.value = String(grid.gapXMm);
  el.sheetGapY.value = String(grid.gapYMm);

  // La taille du texte suit la hauteur de l'étiquette : 7 pt convenait à une
  // petite étiquette, pas à une A4 où la place restait inutilisée — le texte
  // sortait minuscule sous un QR Code qui occupait tout. Le champ reste modifiable.
  el.sheetFont.value = String(defaultSheetFontPt(preset, grid));
}

/**
 * Taille de texte par défaut pour une disposition, en points.
 *
 * Proportionnelle à la hauteur de l'étiquette : une étiquette deux fois plus
 * haute porte un texte deux fois plus grand. Bornée pour rester lisible et
 * laisser de la place au QR Code.
 *
 * @param {object} preset
 * @param {{ rows: number, marginYMm: number, gapYMm: number }} grid
 * @returns {number}
 */
function defaultSheetFontPt(preset, grid) {
  const page = PAGE_SIZES[preset.page];
  const rows = Math.max(1, grid.rows);
  const usable = page.heightMm - grid.marginYMm * 2 - grid.gapYMm * (rows - 1);
  const hauteur = usable / rows;
  const brut = hauteur * 0.28;
  const borne = Math.min(14, Math.max(7, brut));
  // Arrondi au demi-point : le pas du champ.
  return Math.round(borne * 2) / 2;
}

/**
 * Explique ce que les réglages produisent, chiffres en main.
 *
 * La phrase porte les dimensions obtenues, la grille, et le décalage s'il est
 * actif : un petit décalage ne se voit pas dans l'aperçu, et c'est exactement le
 * genre d'écart qu'on ne s'explique pas.
 *
 * @param {{ layout: object, offsetXMm: number, offsetYMm: number }} state
 */
function updateFitHint(state) {
  const { layout, offsetXMm, offsetYMm } = state;
  const size = `${decimal(layout.labelWidthMm)} × ${decimal(layout.labelHeightMm)} mm`;

  const parts = [
    t('Taille des étiquettes déduite de ces six valeurs : {size}, {columns} × {rows} par feuille.', {
      size,
      columns: layout.columns,
      rows: layout.rows,
    }),
  ];

  if (offsetXMm !== 0 || offsetYMm !== 0) {
    const moves = [];
    if (offsetXMm !== 0) {
      moves.push(t('{mm} mm vers la {direction}', {
        mm: decimal(Math.abs(offsetXMm)),
        direction: offsetXMm > 0 ? t('droite') : t('gauche'),
      }));
    }
    if (offsetYMm !== 0) {
      moves.push(t('{mm} mm vers le {direction}', {
        mm: decimal(Math.abs(offsetYMm)),
        direction: offsetYMm > 0 ? t('bas') : t('haut'),
      }));
    }
    parts.push(t('Décalage appliqué : {moves}.', { moves: moves.join(t(' et ')) }));
  }

  el.sheetFitHint.textContent = parts.join(' ');
}

/**
 * Taille du texte d'une étiquette de planche, en points.
 *
 * Elle était figée à 7 pt : sur une A4, la place disponible restait inutilisée
 * et le texte sortait minuscule. Une valeur hors bornes retombe sur le défaut
 * plutôt que de casser la mise en page.
 *
 * @returns {number}
 */
function sheetFontPt() {
  const typed = Number(el.sheetFont.value);
  if (!Number.isFinite(typed) || typed <= 0) return SHEET_FONT_PT;
  return Math.min(20, Math.max(4, typed));
}

/**
 * Construit les pages imprimables d'une planche.
 *
 * Les positions viennent de `computeSheet` en millimètres : la même structure
 * sert à l'écran (mise à l'échelle) et au papier (taille réelle).
 *
 * @param {import('./core/link.js').LinkRecord[]} items
 * @returns {HTMLElement[]}
 */
/**
 * Les réglages et le placement d'une planche, sans construire le DOM.
 *
 * Extrait pour que l'export retrouve **exactement** la disposition de l'aperçu.
 * Le CSV et le manifeste ont besoin du rang de chaque étiquette, et un élément
 * rendu ne le porte plus : le recalculer ailleurs aurait produit une seconde
 * formule, qui aurait fini par diverger de la première.
 *
 * @param {import('./core/link.js').LinkRecord[]} items
 */
function planchePlacement(items) {
  const config = sheetConfig();
  // Une grille issue de « remplir la feuille » occupe exactement la place
  // demandée : lui suggérer de resserrer les marges pour gagner une colonne
  // serait contredire le réglage de l'utilisateur.
  // La grille est toujours une consigne : on ne suggère pas de la densifier.
  const layout = computeSheet({ count: items.length, ...config, adviseDenser: false });
  return { config, layout, pages: paginate(items, layout) };
}

/**
 * Les feuilles de style réellement appliquées, mises bout à bout.
 *
 * C'est la feuille du document, et non une copie écrite pour l'export : la
 * géométrie d'une planche vit entièrement en CSS — positions absolues en
 * millimètres, centrage en boîte flexible — et la recopier aurait garanti qu'un
 * jour les deux divergent. Le fichier exporté ne peut pas être plus juste que
 * l'aperçu s'il ne partage pas ses règles.
 *
 * @returns {string}
 */
function feuillesAppliquees() {
  const morceaux = [];
  for (const feuille of document.styleSheets) {
    try {
      for (const regle of feuille.cssRules) morceaux.push(regle.cssText);
    } catch {
      // Feuille d'une autre origine, ou protégée : illisible. Les nôtres ne le
      // sont pas, et ce sont les seules qui portent sur ces pages.
    }
  }
  return morceaux.join('\n');
}

/**
 * Applique la mise en page automatique, si elle est demandée.
 *
 * Le contenu impose ce qu'une étiquette doit offrir : le QR Code le plus dense de
 * la sélection, et le nombre de lignes que son texte réclame à cette largeur.
 * `autoSheetLayout` en déduit la grille, et des étiquettes qui occupent le reste
 * de la page.
 *
 * **La contrainte est une fonction, pas une taille.** Elle était exprimée en deux
 * passes : la première mesurait le besoin à la largeur de la disposition, la
 * seconde à la largeur que la première avait retenue — et la grille finalement
 * choisie en avait une troisième, plus étroite, où le texte réclamait plus de
 * lignes. Mesuré le 29 septembre 2026, sur l'A4 3 × 4 mise par défaut : 49 liens
 * → `10 × 5 = 50` étiquettes de 18,2 × 55 mm, **45 coupées**, sous une grille
 * annoncée « calculée pour ce contenu ». `tient` reçoit donc les cotes de chaque
 * grille candidate, et lit le budget avec **la formule du rendu** — le QR Code à
 * la proportion du curseur, pas à son minimum lisible.
 *
 * Quand aucune grille ne porte tout le contenu à une largeur qui porte son texte,
 * le calcul ne tasse plus : il retient la plus dense qui reste lisible, et la
 * planche pagine. Les 49 liens du relevé sortent alors sur deux pages, entiers.
 *
 * @param {{
 *   modules: number,
 *   mesure: Function,
 *   blocsParLien: Array<Array<{text: string}>>,
 *   lignesHorsTexte?: number,
 * }} state
 * @returns {object|null} Le plan appliqué, ou `null` si le mode est inactif.
 */
function appliquerMiseEnPageAutomatique(state) {
  if (!el.sheetAuto?.checked) return null;
  const preset = SHEET_PRESETS[el.preset.value] ?? SHEET_PRESETS[DEFAULT_SHEET_PRESET];
  // Une planche du commerce a les cotes de son fabricant : les recalculer
  // donnerait une grille qui ne tombe plus sur les découpes.
  if (preset.group !== 'generic') return null;

  const page = PAGE_SIZES[preset.page];
  const paysage = el.tableOrientation.value === 'landscape';
  const base = {
    pageWidthMm: paysage ? page.heightMm : page.widthMm,
    pageHeightMm: paysage ? page.widthMm : page.heightMm,
    marginXMm: Number(el.sheetMarginX.value) || 0,
    // **La marge du haut porte l'en-tête.** Le plan automatique recalcule les
    // marges ; s'il ignorait l'en-tête, il replacerait une marge de 8,5 mm et le
    // refus reviendrait à chaque rendu — la case cochée, et rien à l'écran.
    marginYMm: Math.max(
      Number(el.sheetMarginY.value) || 0,
      el.sheetHeader?.checked ? SHEET_HEADER_MM : 0,
    ),
    gapXMm: Number(el.sheetGapX.value) || 0,
    gapYMm: Number(el.sheetGapY.value) || 0,
  };

  const metrics = sheetTextMetrics({ fontSizePt: sheetFontPt() });
  const lignesHorsTexte = Math.max(0, Math.trunc(state.lignesHorsTexte ?? 0));
  // Le plancher du curseur : sous cette proportion, un module imprimé n'est plus
  // résolu. Le rendu y ramène la valeur du curseur, et le calcul doit lire la
  // même chose que lui.
  const ratioCurseur = Number(el.sheetQr?.value) / 100;

  // Le besoin d'une étiquette : **la somme de ses blocs**, titre et URL
  // compris — ils ne partagent plus de ligne —, et le maximum sur la sélection.
  const lignesPour = (largeurMm) => {
    const dedans = Math.max(1, largeurMm - SHEET_CELL_MARGIN_MM * 2);
    const largeurPx = (dedans * 96) / 25.4;
    return state.blocsParLien.reduce((plus, blocs) => {
      const total = blocs.reduce((somme, bloc) => somme + sheetCellLines(bloc.text, {
        measure: state.mesure,
        innerWidthPx: largeurPx,
        maxLines: 99,
      }).length, 0);
      return Math.max(plus, total);
    }, 1);
  };

  // Le plancher dur, celui du QR Code seul : un module sous `MIN_MODULE_MM_PAPER`
  // ne se lit plus, quelle que soit la place du texte. Une ligne de texte y est
  // ajoutée, parce que le rendu en écrit toujours une.
  const cote = state.modules * MIN_MODULE_MM_PAPER;
  const plancher = {
    widthMm: cote + SHEET_CELL_MARGIN_MM * 2,
    heightMm: cote + SHEET_CELL_MARGIN_MM * 2 + SHEET_QR_GAP_MM + metrics.lineHeightMm,
  };

  /**
   * Une étiquette de ces cotes-là porte-t-elle son texte ?
   *
   * C'est **la** question, et elle ne se répond qu'ici : le nombre de lignes que
   * le texte réclame dépend de la largeur, et la place que le QR Code laisse
   * dépend de la hauteur. Les deux se lisent avec la formule du rendu
   * (`sheetTextBudget`) — sans quoi la grille annoncée ne serait pas celle qui
   * s'imprime.
   */
  const tient = (largeurMm, hauteurMm) => {
    const plancherQr = qrRatioBounds({
      labelWidthMm: largeurMm,
      labelHeightMm: hauteurMm,
      qrModules: state.modules,
      textLines: 0,
      marginMm: SHEET_CELL_MARGIN_MM,
      gapMm: SHEET_QR_GAP_MM,
      minModuleMm: MIN_MODULE_MM_PAPER,
      fontSizePt: sheetFontPt(),
    }).min;
    const budget = sheetTextBudget({
      labelWidthMm: largeurMm,
      labelHeightMm: hauteurMm,
      // Le rendu ramène la valeur du curseur à ce que la lisibilité exige : le
      // calcul ne peut pas compter sur un QR Code plus petit que cela.
      qrRatio: Number.isFinite(ratioCurseur) ? Math.max(ratioCurseur, plancherQr) : plancherQr,
      fontSizePt: sheetFontPt(),
      lignesHorsTexte,
      marginMm: SHEET_CELL_MARGIN_MM,
      gapMm: SHEET_QR_GAP_MM,
    });
    return budget.textLines >= lignesPour(largeurMm);
  };

  const plan = autoSheetLayout({
    // **Le nombre d'étiquettes à placer.** Sans lui, la mise en page automatique
    // cherchait la grille la plus dense et proposait 11 × 7 = 77 étiquettes pour
    // cinq liens : des timbres, et une page à moitié vide. C'est le contenu qui
    // décide de la taille de la grille.
    count: state.blocsParLien.length,
    ...base,
    minLabelWidthMm: plancher.widthMm,
    minLabelHeightMm: plancher.heightMm,
    tient,
  });

  // Les champs sont **calculés** : on les écrit sans émettre d'événement, pour
  // ne pas relancer un rendu depuis le rendu.
  const poser = (champ, valeur) => {
    if (champ && champ.value !== String(valeur)) champ.value = String(valeur);
  };
  poser(el.sheetColumns, plan.columns);
  poser(el.sheetRows, plan.rows);
  poser(el.sheetMarginX, plan.marginXMm);
  poser(el.sheetMarginY, plan.marginYMm);
  poser(el.sheetGapX, plan.gapXMm);
  poser(el.sheetGapY, plan.gapYMm);
  derniereGrilleDemandee = { columns: plan.columns, rows: plan.rows };

  return plan;
}

function buildSheetPages(items) {
  const metrics = sheetTextMetrics({ fontSizePt: sheetFontPt() });

  // **Les matrices d'abord.** La mise en page automatique a besoin de la plus
  // dense — c'est elle qui impose la taille d'étiquette minimale — et elle
  // commande la disposition. Chaque URL est encodée une seule fois, et les pages
  // se partagent ces matrices.
  const matrices = new Map();
  for (const item of items) {
    matrices.set(item.id, encodeQr(item.url, { ecc: 'M', border: 1 }));
  }

  // Le curseur doit être valable pour toute la planche : on prend donc la
  // matrice la plus grande, c'est-à-dire l'URL la plus dense à imprimer. On
  // retient aussi laquelle, pour pouvoir la nommer si rien ne convient.
  const densest = items
    .reduce(
      (worst, item) => {
        const matrix = matrices.get(item.id);
        return matrix.size > worst.matrix.size ? { matrix, item } : worst;
      },
      { matrix: { size: 21 }, item: null },
    );
  const modules = densest.matrix.size;

  // Bornes calculées avant le rendu : en dessous, un module imprimé n'est plus
  // lisible ; au-dessus, le QR Code chasse le texte hors de l'étiquette.
  // La date occupe une ligne à part entière : elle doit être comptée dans la
  // place que le QR Code doit laisser, sinon le curseur autoriserait un réglage qui
  // la rogne. **Lues avant la mise en page automatique**, qui a besoin de ce
  // compte pour savoir ce qu'une étiquette peut porter.
  const wantsDate = dateMode() !== 'none';
  // Lues **avant** d'être utilisées : `const` lue plus haut lève une
  // `ReferenceError`, et `buildSheetPages` s'arrêtait là — la planche restait
  // vierge, sans message.
  const veutIndex = el.sheetDateIndex.checked;
  // Le numéro et la date occupent chacun une ligne à part entière, en plus du
  // texte principal. Ils doivent être comptés dans la place que le QR Code laisse,
  // sinon le curseur autoriserait un réglage qui les rogne.
  const indexLignes = veutIndex ? 1 : 0;
  const dateLignes = wantsDate ? 1 : 0;
  const lignesHorsTexte = indexLignes + dateLignes;

  // La mise en page automatique, si elle est demandée : elle réécrit les six
  // champs **avant** que la disposition ne soit calculée. Elle a besoin du nombre
  // de lignes hors texte : la place qu'une étiquette laisse à son titre en dépend.
  const choixAuto = { title: el.sheetTitle.checked, url: el.sheetUrl.checked };
  syncAutoFields();
  const planAuto = appliquerMiseEnPageAutomatique({
    modules,
    mesure: cachedTextMeasure(metrics.fontSizePx),
    blocsParLien: items.map((item) => sheetCellBlocks(item, choixAuto)),
    lignesHorsTexte,
  });

  // **Après** la mise en page automatique, et non avant : c'est elle qui écrit les
  // six cotes, et la disposition se lit ensuite dans les champs.
  const { config, layout, pages } = planchePlacement(items);

  const encoded = pages.map((page) => page.items.map(({ item, cell }) => ({
    item,
    cell,
    matrix: matrices.get(item.id),
  })));

  /**
   * Bornes du QR Code pour un nombre de lignes de texte donné.
   *
   * Les bornes dépendent de la place que le texte réclame : c'est ce qui permet
   * de **réserver deux lignes** plutôt que de tronquer le titre. Une seule
   * ligne réservée donnait, dès 8 pt, « https://www.youtube.com/watch?v=jYI8-… ».
   */
  const bornesPourLignes = (lignesTexte) => qrRatioBounds({
    labelWidthMm: layout.labelWidthMm,
    labelHeightMm: layout.labelHeightMm,
    qrModules: modules,
    textLines: lignesTexte + lignesHorsTexte,
    marginMm: SHEET_CELL_MARGIN_MM,
    gapMm: SHEET_QR_GAP_MM,
    minModuleMm: MIN_MODULE_MM_PAPER,
    // La hauteur de ligne dépend de la taille du texte : une police plus grande
    // laisse moins de place au QR Code, et la borne haute doit en tenir compte.
    fontSizePt: sheetFontPt(),
  });

  /**
   * Ce qui s'imprime sous le QR Code.
   *
   * La décision vit dans `core/sheet.js`, où elle est testable sans navigateur.
   * Elle est appelée **deux fois** — pour compter les lignes réservées et pour
   * écrire le texte — et c'est la même fonction aux deux endroits : deux
   * expressions séparées auraient réservé un nombre de lignes qui ne
   * correspondait pas au texte réellement écrit.
   */
  const choixTexte = { title: el.sheetTitle.checked, url: el.sheetUrl.checked };
  const blocsSousLeQr = (item) => sheetCellBlocks(item, choixTexte);

  // Combien de lignes le texte le plus long réclame-t-il à cette taille ?
  const mesurePlanche = cachedTextMeasure(metrics.fontSizePx);
  const largeurInterieurePx =
    ((layout.labelWidthMm - SHEET_CELL_MARGIN_MM * 2) * 96) / 25.4;
  // Le compte part de **zéro**, et non de un : quand aucune ligne de texte n'est
  // demandée — ni titre, ni URL — réserver une ligne rétrécissait le QR Code
  // pour du vide. C'est précisément ce que l'utilisateur vient chercher en
  // décochant les deux cases.
  const lignesNecessaires = encoded.flat().reduce((plus, entree) => {
    // **Une somme, et non le repli d'une chaîne unique** : le titre et l'URL
    // sont deux blocs, chacun replié pour lui-même. Les compter ensemble était
    // juste tant qu'ils partageaient des lignes ; depuis qu'ils n'en partagent
    // plus, l'addition est le seul compte qui corresponde au dessin.
    const besoin = blocsSousLeQr(entree.item).reduce((total, bloc) => total
      + sheetCellLines(bloc.text, {
        measure: mesurePlanche,
        innerWidthPx: largeurInterieurePx,
        maxLines: 99,
      }).length, 0);
    return Math.max(plus, besoin);
  }, 0);

  // Ce que le format peut réellement offrir : c'est `textLinesAtMin` qui le dit,
  // puisque le QR Code ne descend pas sous la taille où ses modules restent lisibles.
  // Au-delà, on tronque — mais seulement au-delà.
  const sondeLignes = bornesPourLignes(1);
  const lignesOffertes = Math.max(1, sondeLignes.textLinesAtMin - lignesHorsTexte);

  const bounds = bornesPourLignes(Math.min(lignesNecessaires, lignesOffertes));

  // Le curseur est borné par ce que l'impression permet réellement.
  applyQrSliderBounds(bounds);

  const ratio = Number(el.sheetQr.value) / 100;
  const side = qrSideMm(layout.labelWidthMm, layout.labelHeightMm, ratio);

  // Marge intérieure, écart et hauteur de ligne sont posés en ligne pour que le
  // rendu obéisse exactement au calcul — ici comme à l'impression.
  const innerWidthMm = layout.labelWidthMm - SHEET_CELL_MARGIN_MM * 2;
  // **La même formule que la mise en page automatique**, et non une seconde qui
  // lui ressemble : c'est elle qui décide que la grille annoncée est celle qui
  // s'imprime. Les deux ont divergé une fois, et 45 étiquettes du relevé sont
  // sorties coupées sous une grille pourtant dite « calculée pour ce contenu ».
  const budget = sheetTextBudget({
    labelWidthMm: layout.labelWidthMm,
    labelHeightMm: layout.labelHeightMm,
    qrRatio: ratio,
    fontSizePt: sheetFontPt(),
    lignesHorsTexte,
    marginMm: SHEET_CELL_MARGIN_MM,
    gapMm: SHEET_QR_GAP_MM,
  });
  const maxLines = Math.max(1, budget.maxLines);
  const measure = cachedTextMeasure(metrics.fontSizePx);
  const innerWidthPx = (innerWidthMm * 96) / 25.4;
  /** Liens dont la date n'a pas pu être imprimée, faute de largeur. */
  const omittedDates = new Set();
  /** Liens dont le texte a été coupé : il ne tenait pas entier. */
  const cutTexts = new Set();

  // Une planche Letter ne doit pas partir sur du A4 : la taille du papier est
  // posée ici, une fois pour toutes les sorties (aperçu, impression, Ctrl+P).
  applyPrintPageSize(layout.pageWidthMm, layout.pageHeightMm);

  updateFitHint({
    layout,
    offsetXMm: Number(el.sheetOffsetX.value) || 0,
    offsetYMm: Number(el.sheetOffsetY.value) || 0,
  });

  // L'en-tête de page vit dans la marge du haut : on vérifie qu'il y tient
  // avant de le dessiner. Le message est posé sous la case qui le demande, et
  // **à l'alerte** : il annonçait un refus à l'encre des aides, si bien qu'on
  // cochait la case sans rien voir changer — le temps de croire à un défaut
  // d'affichage. La marge à atteindre est nommée, et non laissée à deviner.
  const veutEnTete = el.sheetHeader.checked;
  const placeEnTete = sheetHeaderFits({ marginYMm: layout.marginYMm });
  if (el.sheetHeaderHint) {
    const refuse = veutEnTete && !placeEnTete.fits;
    el.sheetHeaderHint.textContent = refuse
      ? t('{reason} Portez la marge haute à {mm} mm, ou décochez l\'en-tête.', {
        reason: placeEnTete.reason,
        mm: SHEET_HEADER_MM,
      })
      : '';
    // La couleur passe par le style, comme pour les autres refus de la planche
    // (`#sheet-info`, `#sheet-qr-info`) : une classe de plus pour une seule
    // teinte ferait une seconde façon de dire la même chose.
    el.sheetHeaderHint.style.color = refuse ? 'var(--danger)' : '';
    el.sheetHeaderHint.hidden = !refuse;
  }

  const warnings = [...layout.warnings];
  if (!bounds.fits) {
    // Nommer le lien fautif évite de chercher lequel, sur une planche de trente
    // étiquettes, demande trop de place.
    const culprit = densest.item
      ? t(' Le lien le plus dense est « {title} ».', { title: densest.item.title || densest.item.url })
      : '';
    warnings.push(bounds.reason + culprit);
  }
  if (config.problem) warnings.unshift(config.problem);

  updateQrInfo({ bounds, side, modules, ratio, maxLines, metrics, densest });

  // Ce que la mise en page automatique a décidé, dit en clair : c'est une
  // proposition, pas une surprise — l'utilisateur doit pouvoir lire la grille
  // qu'elle a choisie, et savoir que les six champs viennent d'elle.
  if (el.sheetAutoHint) {
    const preset = SHEET_PRESETS[el.preset.value] ?? SHEET_PRESETS[DEFAULT_SHEET_PRESET];
    if (!el.sheetAuto.checked) {
      el.sheetAutoHint.textContent = preset.group === 'generic'
        ? ''
        : t('Une planche du commerce garde les cotes de son fabricant : la mise en page automatique ne s\'y applique pas.');
    } else if (planAuto) {
      const phrase = t(
        'Mise en page automatique : {columns} × {rows} = {perPage} étiquettes de {width} × {height} mm par page, calculées pour ce contenu.',
        {
          columns: planAuto.columns,
          rows: planAuto.rows,
          perPage: planAuto.perPage,
          width: decimal(planAuto.labelWidthMm),
          height: decimal(planAuto.labelHeightMm),
        },
      );
      // Quand le contenu ne tient pas sur une page, le calcul ne tasse plus les
      // étiquettes : il retient la plus dense qui porte **son texte**, et la
      // planche pagine. Le dire évite que l'utilisateur cherche pourquoi sa
      // planche sort sur plusieurs feuilles.
      //
      // Le nombre d'étiquettes est celui de **la sélection imprimée**, passée en
      // argument : `state` n'existe pas ici, et l'écrire a bel et bien fait lever
      // le rendu — relevé du 30 septembre 2026, racine d'impression vide, deux
      // constats en échec. Une phrase ne doit pas pouvoir emporter la planche.
      el.sheetAutoHint.textContent = planAuto.coversCount
        ? phrase
        : `${phrase} ${t('Les {count} étiquettes ne tiennent pas sur une page : la planche en demande {pages}.', {
          count: items.length,
          pages: planAuto.pages,
        })}`;
    } else {
      el.sheetAutoHint.textContent = t(
        'Mise en page automatique : non appliquée — les cotes du fabricant sont conservées.',
      );
    }
  }

  // « Ranger plutôt que trancher » : le bouton n'apparaît que si quelque chose
  // ne tient pas — QR Code compris — et qu'un arrangement existe. Proposer
  // l'impossible, ou proposer quand tout va bien, serait du bruit.
  const lignesRetenues = Math.min(lignesNecessaires, lignesOffertes) + lignesHorsTexte;
  derniersModules = modules;
  dernieresLignes = lignesRetenues;
  const plan = bounds.fits && !derniereGrilleEcourtee
    ? null
    : planAjustement(modules, lignesRetenues);
  el.sheetFit.hidden = plan === null;

  // Les pages sont construites **avant** de composer le message : c'est la
  // construction qui découvre les dates écartées faute de largeur. Composer le
  // message plus tôt — ce qui était le cas — rendait cet avertissement
  // impossible à afficher.
  const built = pages.map((page) => {
    const pageEl = document.createElement('div');
    pageEl.className = 'print-page';
    pageEl.style.width = `${layout.pageWidthMm}mm`;
    pageEl.style.height = `${layout.pageHeightMm}mm`;

    if (veutEnTete && placeEnTete.fits) {
      const entete = document.createElement('div');
      entete.className = 'print-page__header';
      entete.style.left = `${layout.marginXMm}mm`;
      entete.style.right = `${layout.marginXMm}mm`;
      entete.style.height = `${SHEET_HEADER_MM}mm`;

      const titre = document.createElement('h1');
      titre.className = 'print-page__title';
      titre.textContent = collectionName();
      if (el.sheetHeaderDate.checked) {
        const quand = document.createElement('span');
        quand.className = 'print-page__date';
        quand.textContent = formatCaptureDate(Date.now(), 'datetime');
        titre.appendChild(quand);
      }
      entete.appendChild(titre);
      // La note vient sous le nom : elle décrit la collection, c'est donc sa
      // place. Elle ne s'imprime que si elle existe **et** qu'on la demande :
      // elle était imposée dès qu'elle existait, ce qui mettait un texte écrit
      // pour soi sur chaque page d'une planche affichée.
      const note = collectionNote();
      if (note !== '' && el.sheetHeaderNote.checked) {
        const sous = document.createElement('p');
        sous.className = 'print-page__note';
        sous.textContent = note;
        entete.appendChild(sous);
      }
      pageEl.appendChild(entete);
    }

    // **Ce que chaque étiquette de la page portera, avant d'en dessiner une.**
    // Le dessin a besoin de connaître la plus longue : c'est ce qui permet de
    // réserver à chaque bloc la même hauteur, donc d'aligner la grille.
    const contenus = encoded[page.page].map(({ item, cell, matrix }) => {
      // Les lignes sont découpées et bornées ici : le texte occupe donc
      // exactement la hauteur réservée, au lieu de déborder en silence.
      // Une date se coupe mal : sur une ligne trop étroite, on ne l'imprime pas
      // plutôt que d'en perdre le millésime.
      const wanted = formatCaptureDate(item.createdAt, dateMode());
      const dateText = wanted !== '' && measure(wanted) <= innerWidthPx ? wanted : '';
      const dropped = wanted !== '' && dateText === '';

      // Le numéro et la date prennent leur ligne : le texte principal se
      // contente de ce qui reste.
      const lignesTexteMax = Math.max(1, maxLines - lignesHorsTexte);
      const lines = [];
      let reste = lignesTexteMax;
      let coupe = false;

      // **Le titre d'abord, l'URL ensuite**, chacun replié pour lui-même et
      // chacun son tour dans le budget : le titre ne peut plus être coupé par une
      // adresse qui commencerait sur sa dernière ligne.
      for (const bloc of blocsSousLeQr(item)) {
        if (reste <= 0) {
          // Plus une ligne pour ce bloc : il ne sera pas écrit du tout.
          coupe = true;
          break;
        }
        const dessinees = sheetCellLines(bloc.text, { measure, innerWidthPx, maxLines: reste });
        // **Le texte a-t-il été coupé ?** On ne le devine pas aux points de
        // suspension — un titre peut légitimement finir par « … » — mais au
        // nombre de lignes que le bloc réclame : au-delà du budget, la coupe est
        // certaine. Le calcul complet n'a lieu que dans ce cas.
        if (dessinees.length >= reste
          && sheetCellLines(bloc.text, { measure, innerWidthPx, maxLines: 99 }).length
            > dessinees.length) {
          coupe = true;
        }
        for (const ligne of dessinees) lines.push({ texte: ligne, kind: bloc.kind });
        reste -= dessinees.length;
      }
      if (coupe) cutTexts.add(item.id);
      // Le numéro occupe sa ligne, comme la date : il sert à retrouver le lien
      // dans la collection, donc à l'écran comme sur le papier.
      const rang = veutIndex ? linkRanks.get(item.id) : null;
      // `rang != null`, et non `rang` : une collection peut commencer à zéro
      // (`START_INDEX_MIN`), et l'étiquette aurait alors perdu son numéro — une
      // ligne de moins que ses voisines, donc un titre décalé d'un cran.
      if (rang != null) lines.unshift({ texte: String(rang), kind: 'index' });
      if (dateText) lines.push({ texte: dateText, kind: 'date' });
      if (dropped) omittedDates.add(item.id);

      return { item, cell, matrix, lines };
    });

    // **Les hauteurs communes de la page.** La plus longue étiquette donne sa
    // mesure aux autres : un titre d'une ligne et un titre de trois lignes côte à
    // côte décalaient l'URL de deux interlignes, et le QR Code — centré
    // verticalement dans sa case — ne se posait pas à la même hauteur d'une
    // étiquette à l'autre. C'est ce désordre qui se voyait sur la planche.
    const lignesDuBloc = (kind) => contenus.reduce(
      (plus, contenu) => Math.max(plus, contenu.lines.filter((l) => l.kind === kind).length),
      0,
    );
    const reserve = { title: lignesDuBloc('title'), url: lignesDuBloc('url') };

    for (const { item, cell, matrix, lines } of contenus) {
      const cellEl = document.createElement('div');
      cellEl.className = el.sheetBorder.checked
        ? 'print-cell print-cell--bordered'
        : 'print-cell';
      cellEl.style.left = `${cell.xMm}mm`;
      cellEl.style.top = `${cell.yMm}mm`;
      cellEl.style.width = `${layout.labelWidthMm}mm`;
      cellEl.style.height = `${layout.labelHeightMm}mm`;
      cellEl.style.padding = `${SHEET_CELL_MARGIN_MM}mm`;
      cellEl.style.gap = `${SHEET_QR_GAP_MM}mm`;

      const qrBox = document.createElement('div');
      qrBox.className = 'print-cell__qr';
      qrBox.style.width = `${side}mm`;
      qrBox.appendChild(qrSvg(matrix));

      cellEl.appendChild(qrBox);

      if (lines.length > 0) {
        const text = document.createElement('div');
        text.className = 'print-cell__text';
        // Taille et interligne viennent du même calcul que la découpe : c'est ce
        // qui garantit que la hauteur réelle est celle qui a été réservée.
        text.style.fontSize = `${metrics.fontSizePt}pt`;
        text.style.lineHeight = `${metrics.lineHeightMm}mm`;

        const compte = (kind) => lines.filter((l) => l.kind === kind).length;
        // La place qui manque à ce bloc pour tenir la hauteur commune. Un bloc
        // absent — coupé faute de budget — réserve la sienne en entier : son
        // voisin du dessous reste ainsi à sa place, même décalé d'une page à
        // l'autre.
        const ajouterReserve = (kind) => {
          const hauteur = Math.max(0, (reserve[kind] ?? 0) - compte(kind)) * metrics.lineHeightMm;
          if (hauteur <= 0 || hauteur < 0.01) return;
          const vide = document.createElement('span');
          vide.className = 'print-cell__spacer';
          vide.style.height = `${round1(hauteur)}mm`;
          // Un blanc de mise en page n'est pas du contenu : rien à annoncer.
          vide.setAttribute('aria-hidden', 'true');
          text.appendChild(vide);
        };

        let blocPrecedent = null;
        for (const line of lines) {
          // La réserve se pose **à la fin** du bloc qu'elle complète, et non
          // au début du suivant : c'est ce qui met les blocs suivants à la même
          // hauteur d'une étiquette à l'autre.
          if (blocPrecedent !== null && line.kind !== blocPrecedent) ajouterReserve(blocPrecedent);
          blocPrecedent = line.kind;

          const span = document.createElement('span');
          span.textContent = line.texte;
          // Chaque bloc a sa classe : l'URL se détache du titre par un léger
          // écart, comme la date. Sans cela, deux blocs se suivraient sans qu'on
          // voie où l'un finit et où l'autre commence.
          if (line.kind === 'url') span.className = 'print-cell__url';
          else if (line.kind === 'date') span.className = 'print-cell__date';
          text.appendChild(span);
        }
        ajouterReserve(blocPrecedent);

        cellEl.appendChild(text);
      }

      pageEl.appendChild(cellEl);
    }

    return pageEl;
  });

  if (omittedDates.size > 0) {
    warnings.push(tpl(
      omittedDates.size,
      'Date non imprimée sur {count} étiquette : elle ne tient pas sur une ligne à cette largeur.',
      'Date non imprimée sur {count} étiquettes : elle ne tient pas sur une ligne à cette largeur.',
    ));
  }

  // **Un texte coupé se dit, il ne se tait pas.** La planche le tronquait avec
  // des points de suspension sans un mot, comme l'onglet Niimbot avant que ce
  // message y existe : une adresse ou un titre amputé sortait de l'imprimante
  // comme s'il tenait entier. Le remède est nommé, comme pour la largeur du code
  // — et c'est le même que là-bas.
  if (cutTexts.size > 0) {
    // **Un seul littéral par message**, sans concaténation : le relevé des clés
    // de traduction lit les littéraux passés à `t()` et à `tpl()`, et une phrase
    // assemblée en morceaux lui échapperait — la traduction anglaise manquerait
    // sans que rien ne le signale.
    warnings.push(tpl(
      cutTexts.size,
      'Texte coupé sur {count} étiquette : il ne tient pas entier à cette taille. Raccourcissez l\'adresse, réduisez le QR Code, décochez le titre ou l\'URL, ou prenez une étiquette plus grande.',
      'Texte coupé sur {count} étiquettes : ils ne tiennent pas entiers à cette taille. Raccourcissez les adresses, réduisez le QR Code, décochez le titre ou l\'URL, ou prenez une étiquette plus grande.',
    ));
  }

  el.sheetInfo.textContent = layout.perPage > 0
    ? t('{columns} × {rows} = {perPage} de {size} mm, {pages}', {
      columns: layout.columns,
      rows: layout.rows,
      perPage: tpl(layout.perPage, '{count} étiquette par page', '{count} étiquettes par page'),
      size: `${decimal(layout.labelWidthMm)} × ${decimal(layout.labelHeightMm)}`,
      pages: tpl(layout.pages, '{count} page', '{count} pages'),
    }) + (warnings.length ? ` — ${warnings.join(' ')}` : '')
    : layout.warnings.join(' ');
  // Un texte coupé n'est pas un détail de mise en page : la ligne passe à
  // l'alerte, comme le refus de la largeur du QR Code. Sans cette marque, le
  // message se lit au même rang qu'un espacement perdu à droite de la grille.
  el.sheetInfo.style.color = cutTexts.size > 0 ? 'var(--danger)' : '';

  return built;
}

/**
 * Applique au curseur les bornes calculées pour la planche courante.
 *
 * C'est le détrompeur demandé : le curseur ne peut plus demander un QR Code qui ne
 * serait pas imprimable. La valeur courante est ramenée dans l'intervalle si
 * elle en sortait — par exemple après un changement de disposition.
 *
 * @param {{ min: number, max: number }} bounds
 */
/**
 * Les six champs de géométrie suivent-ils la mise en page automatique ?
 *
 * Ils sont alors **calculés**, donc inactifs : les laisser modifiables ferait
 * croire qu'un réglage manuel survit, alors que le rendu suivant le réécrirait.
 * Les désactiver dit la vérité, et décocher rend la main.
 */
function syncAutoFields() {
  const preset = SHEET_PRESETS[el.preset.value] ?? SHEET_PRESETS[DEFAULT_SHEET_PRESET];
  const actif = Boolean(el.sheetAuto?.checked) && preset.group === 'generic';
  if (el.sheetAuto) el.sheetAuto.disabled = preset.group !== 'generic';
  for (const champ of [
    el.sheetColumns, el.sheetRows,
    el.sheetMarginX, el.sheetMarginY,
    el.sheetGapX, el.sheetGapY,
  ]) {
    if (champ) champ.disabled = actif;
  }
  return actif;
}

function applyQrSliderBounds(bounds) {
  const min = Math.round(bounds.min * 100);
  const max = Math.max(min, Math.round(bounds.max * 100));

  if (el.sheetQr.min !== String(min)) el.sheetQr.min = String(min);
  if (el.sheetQr.max !== String(max)) el.sheetQr.max = String(max);

  const current = Number(el.sheetQr.value);
  if (current < min) el.sheetQr.value = String(min);
  else if (current > max) el.sheetQr.value = String(max);
}

/**
 * Décrit la taille du QR Code retenue et ce qu'elle implique.
 *
 * @param {{ bounds: object, side: number, modules: number, ratio: number, maxLines: number, metrics: object }} state
 */
/**
 * La plus petite étiquette qui contienne ce qu'on imprime dessus.
 *
 * Le QR Code impose sa taille — ses modules fois le minimum lisible — et le
 * texte qu'on a demandé sous lui impose la sienne. C'est ce que l'ajustement
 * cherche à retrouver quand un espacement a trop rétréci les étiquettes.
 *
 * @param {number} modules - Cote de la matrice la plus dense de la planche.
 * @param {number} lignes - Lignes de texte sous le QR Code.
 * @returns {{ widthMm: number, heightMm: number, qrMm: number }}
 */
function tailleNecessaire(modules, lignes) {
  const { lineHeightMm } = sheetTextMetrics({ fontSizePt: sheetFontPt() });
  const qrMm = modules * MIN_MODULE_MM_PAPER;
  const texteMm = lignes > 0 ? SHEET_QR_GAP_MM + lignes * lineHeightMm : 0;
  return {
    widthMm: qrMm + SHEET_CELL_MARGIN_MM * 2,
    heightMm: qrMm + SHEET_CELL_MARGIN_MM * 2 + texteMm,
    qrMm,
  };
}

/**
 * Ce que l'ajustement ferait, ou `null` s'il n'y a rien à faire.
 *
 * Deux réponses, dans cet ordre :
 *
 * 1. **Garder la grille demandée** en resserrant l'écart et la marge — le même
 *    des deux côtés. C'est la réponse préférée : on ne change pas le nombre
 *    d'étiquettes par page.
 * 2. Si même sans espacement les étiquettes sont trop petites pour le contenu,
 *    **descendre la grille** jusqu'à ce que les étiquettes suffisent, et
 *    répartir l'espace restant également.
 *
 * @param {number} modules
 * @param {number} lignes
 * @returns {{
 *   kind: 'espacement'|'grille', columns: number, rows: number,
 *   gapXMm: number, gapYMm: number, marginXMm: number, marginYMm: number,
 * }|null}
 */
function planAjustement(modules, lignes) {
  const preset = SHEET_PRESETS[el.preset.value] ?? SHEET_PRESETS[DEFAULT_SHEET_PRESET];
  const page = PAGE_SIZES[preset.page];
  const demande = derniereGrilleDemandee
    ?? { columns: preset.declaredColumns, rows: preset.declaredRows };
  const besoin = tailleNecessaire(modules, lignes);

  // 1. **L'espacement ramené à celui de la disposition**, en gardant la grille
  //    demandée : c'est la réponse préférée, parce qu'elle ne change pas le
  //    nombre d'étiquettes par page. Elle n'existe que si l'étiquette de la
  //    disposition — celle que l'utilisateur a sur son bureau — tient dans la
  //    grille demandée ; au-delà, aucune marge ne la fera tenir.
  const espace = spacingForGrid({
    pageWidthMm: page.widthMm,
    pageHeightMm: page.heightMm,
    columns: demande.columns,
    rows: demande.rows,
    labelWidthMm: preset.labelWidthMm,
    labelHeightMm: preset.labelHeightMm,
  });
  if (espace.ok && espace.gapXMm <= (Number(el.sheetGapX.value) || 0) + 1e-9) {
    return {
      kind: 'espacement',
      columns: demande.columns,
      rows: demande.rows,
      gapXMm: espace.gapXMm, gapYMm: espace.gapYMm,
      marginXMm: espace.marginXMm, marginYMm: espace.marginYMm,
    };
  }

  // La grille demandée ne peut pas tenir, même sans espacement : on cherche la
  // plus grande qui contienne des étiquettes assez grandes. **L'espacement, lui,
  // ne bouge pas** : ce sont les étiquettes qui doivent grandir, et c'est en
  // retirant des colonnes ou des rangées qu'elles grandissent. Répartir en plus
  // l'espace libéré dans l'écart aurait redonné de petites étiquettes avec de
  // grandes marges — le contraire de ce qu'on cherche.
  const garde = clampGrid({
    pageWidthMm: page.widthMm,
    pageHeightMm: page.heightMm,
    columns: demande.columns,
    rows: demande.rows,
    marginXMm: Number(el.sheetMarginX.value) || 0,
    marginYMm: Number(el.sheetMarginY.value) || 0,
    gapXMm: Number(el.sheetGapX.value) || 0,
    gapYMm: Number(el.sheetGapY.value) || 0,
    minLabelMm: Math.max(besoin.widthMm, besoin.heightMm),
  });
  if (garde.columns < 1 || garde.rows < 1) return null;
  if (garde.columns === demande.columns && garde.rows === demande.rows) return null;

  // L'espacement reste celui de l'utilisateur : le plan ne porte que la grille.
  return {
    kind: 'grille',
    columns: garde.columns,
    rows: garde.rows,
    gapXMm: null, gapYMm: null, marginXMm: null, marginYMm: null,
  };
}

function updateQrInfo(state) {
  const { bounds, side, modules, maxLines } = state;
  const moduleMm = side / modules;
  const marker = bounds.fits ? 'info' : 'error';

  if (marker === 'error') {
    el.sheetQrInfo.textContent = bounds.reason;
    el.sheetQrInfo.style.color = 'var(--danger)';
    return;
  }

  const range = t('{min} à {max} %', {
    min: Math.round(bounds.min * 100),
    max: Math.round(bounds.max * 100),
  });
  el.sheetQrInfo.textContent = t(
    'QR Code de {side} mm ({module} mm par module, minimum {minimum} mm) — réglable de {range} — {lines} de texte.',
    {
      side: decimal(side),
      module: decimal(moduleMm, 2),
      minimum: decimal(bounds.minModuleMm, 2),
      range,
      lines: tpl(maxLines, '{count} ligne', '{count} lignes'),
    },
  );
  el.sheetQrInfo.style.color = moduleMm < bounds.minModuleMm ? 'var(--danger)' : '';
}

/**
 * Les réglages de page du tableau imprimé.
 *
 * Le sens de la feuille et ses marges étaient fixes : un tableau large se
 * faisait rogner, et rien ne permettait de le rattraper.
 *
 * @returns {{ widthMm: number, heightMm: number, marginXMm: number, marginYMm: number, orientation: string }}
 */
function tablePageConfig() {
  const base = PAGE_SIZES.a4;
  const paysage = el.tableOrientation.value === 'landscape';
  const marginXMm = Math.max(0, Math.min(40, Number(el.tableMarginX.value) || 0));
  const marginYMm = Math.max(0, Math.min(40, Number(el.tableMarginY.value) || 0));

  return {
    orientation: paysage ? 'landscape' : 'portrait',
    // En paysage, la feuille est tournée : les deux cotes s'échangent.
    widthMm: paysage ? base.heightMm : base.widthMm,
    heightMm: paysage ? base.widthMm : base.heightMm,
    marginXMm,
    marginYMm,
  };
}

/**
 * Enveloppe le tableau dans sa page : marges, et titre de collection.
 *
 * @param {HTMLElement} table
 * @param {{ preview?: boolean }} [options]
 * @returns {HTMLElement}
 */
function buildTablePage(table, options = {}) {
  const config = tablePageConfig();
  const page = document.createElement('div');
  page.className = options.preview ? 'print-page print-page--screen' : 'print-page';
  page.style.width = `${config.widthMm}mm`;
  page.style.height = `${config.heightMm}mm`;
  page.style.padding = `${config.marginYMm}mm ${config.marginXMm}mm`;
  page.style.boxSizing = 'border-box';

  // Le nom de la collection en tête : sur une liasse imprimée, c'est ce qui
  // permet de retrouver de quoi il s'agit.
  if (el.tableTitle.checked) {
    const title = document.createElement('h1');
    title.className = 'print-page__title';
    title.textContent = collectionName();
    if (el.tableTitleDate.checked) {
      const quand = document.createElement('span');
      quand.className = 'print-page__date';
      quand.textContent = formatCaptureDate(Date.now(), 'datetime');
      title.appendChild(quand);
    }
    page.appendChild(title);
    // La note suit le nom, comme sur la planche : deux sorties qui décrivent la
    // même collection ne doivent pas en dire des choses différentes — y compris
    // pour la case qui l'autorise.
    const note = collectionNote();
    if (note !== '' && el.tableTitleNote.checked) {
      const sous = document.createElement('p');
      sous.className = 'print-page__note';
      sous.textContent = note;
      page.appendChild(sous);
    }
    // Le titre occupe une bande : le tableau se place dessous, sans le recouvrir.
    const spacer = document.createElement('div');
    spacer.className = 'print-page__spacer';
    page.appendChild(spacer);
  }

  page.appendChild(table);
  return page;
}

/**
 * Le tableau, découpé en autant de pages que le papier en demande.
 *
 * La boîte de page avait la hauteur du papier et `overflow: hidden` : au-delà,
 * le contenu était tranché au bord de la feuille. **Mesuré** sur 45 liens : un
 * tableau de 2 466 px pour 1 123 px de page utile, **27 lignes sur 46 hors de la
 * page**, la dernière coupée en deux et les autres absentes — sans un mot dans
 * l'interface.
 *
 * La répartition se **mesure** au lieu de s'estimer : les lignes sont montées une
 * fois dans une page aux vraies cotes, posée hors de l'écran mais **mise en
 * page** — `visibility: hidden` conserve la mise en page, contrairement à
 * `display: none`, qui aurait rendu des hauteurs nulles. `paginateByHeight` dit
 * ensuite où couper, et il est pur : c'est lui qui est testé.
 *
 * L'encodage des QR Codes n'a lieu qu'une fois, quel que soit le nombre de
 * pages : les lignes sont **déplacées** d'un tableau à l'autre, jamais refaites.
 *
 * @param {import('./core/link.js').LinkRecord[]} items
 * @param {{ preview?: boolean }} [options]
 * @returns {HTMLElement[]}
 */
function buildTablePages(items, options = {}) {
  const config = tablePageConfig();
  const columns = tableColumns();
  const size = Number(el.tableQr.value);
  // Calculée **une fois**, puis donnée à toutes les pages : c'est ce qui fait
  // qu'elles s'alignent. La mesure des hauteurs se fait sur la même grille, sans
  // quoi la répartition serait calculée sur des lignes d'une autre largeur.
  const largeurs = tableColumnWidths(columns, size);
  const rows = items.map((link) => buildTableRow(link, columns, size));

  const mesure = measureTableRows(rows, columns, config, largeurs);
  const tranches = paginateByHeight(mesure.hauteurs, mesure.hauteurUtile);
  dernieresPagesTableau = tranches.length;

  return tranches.map(({ start, end }) => buildTablePage(
    buildTable(columns, rows.slice(start, end), largeurs),
    options,
  ));
}

/**
 * Hauteurs réelles des lignes, et hauteur utile de la page.
 *
 * @param {HTMLElement[]} rows
 * @param {object} columns
 * @param {{ marginYMm: number }} config
 * @returns {{ hauteurs: number[], hauteurUtile: number }}
 */
function measureTableRows(rows, columns, config, largeurs = null) {
  const hote = document.createElement('div');
  hote.setAttribute('aria-hidden', 'true');
  hote.style.cssText = 'position:absolute;left:-10000px;top:0;visibility:hidden;';

  const page = buildTablePage(buildTable(columns, rows, largeurs));
  hote.appendChild(page);
  document.body.appendChild(hote);

  try {
    const cadre = page.getBoundingClientRect();
    const table = page.querySelector('.print-table');
    const boiteTable = table.getBoundingClientRect();
    const hauteurs = [...table.querySelectorAll('tbody tr')]
      .map((ligne) => ligne.getBoundingClientRect().height);
    // La bande de titre et le rembourrage du bas se déduisent de la mesure, et
    // non d'une constante recopiée : ils changent avec la case cochée et avec
    // les marges du tableau.
    const hauteurUtile = cadre.height
      - (boiteTable.top - cadre.top)
      - config.marginYMm * PX_PER_MM;
    return { hauteurs, hauteurUtile };
  } finally {
    document.body.removeChild(hote);
  }
}

/**
 * Construit le tableau imprimable.
 *
 * @param {object} columns Colonnes retenues, lues une fois pour toutes.
 * @param {HTMLElement[]} rows Lignes déjà construites.
 * @returns {HTMLElement}
 */
function buildTable(columns, rows, largeurs = null) {
  const table = document.createElement('table');
  table.className = 'print-table';
  if (!el.tableGrid.checked) table.classList.add('print-table--bare');

  // **Une grille unique pour tout le document.** Le tableau est découpé en
  // plusieurs `<table>` — un par page — et sans largeurs imposées, `table-layout`
  // laisse chacun se dimensionner sur son propre contenu : les colonnes ne
  // s'alignent plus d'une page à l'autre, et sur une page aux titres courts la
  // colonne « Titre » se réduit à presque rien — au point de disparaître à l'œil.
  // Mesuré dans Chrome : la colonne des titres commençait à 465 px sur la
  // première page, 430 px sur la deuxième, 436 px sur la troisième.
  if (largeurs) {
    const groupe = document.createElement('colgroup');
    for (const largeur of largeurs) {
      const col = document.createElement('col');
      if (largeur !== '') col.style.width = largeur;
      groupe.appendChild(col);
    }
    table.appendChild(groupe);
  }

  table.appendChild(buildTableHead(columns));

  const body = document.createElement('tbody');
  for (const row of rows) body.appendChild(row);
  table.appendChild(body);

  return table;
}

/**
 * Les largeurs des colonnes, dans l'ordre où elles sont construites.
 *
 * Elles sont exprimées en millimètres et calculées depuis la largeur utile de
 * la page : la grille est ainsi la même sur le papier et dans l'aperçu, en
 * portrait comme en paysage, et une colonne ne peut plus sortir de la feuille.
 *
 * Le QR Code garde sa largeur propre — il ne se comprime pas — et un peu de
 * marge pour le rembourrage des cellules. Les colonnes de texte se partagent le
 * reste **au prorata de ce qu'elles portent** : une adresse est plus longue
 * qu'un titre, un titre plus long qu'une date.
 *
 * @param {object} columns
 * @param {number} size Côté du QR Code, en pixels.
 * @returns {string[]} Une largeur CSS par colonne, dans l'ordre de `columns`.
 */
function tableColumnWidths(columns, size) {
  const config = tablePageConfig();
  const utile = Math.max(40, config.widthMm - 2 * config.marginXMm);

  // Le QR Code : sa taille, plus le rembourrage des deux cellules voisines.
  const qrMm = Math.min(
    utile * 0.3,
    (size / (96 / 25.4)) + 2 * TABLE_CELL_PADDING_MM,
  );

  const parts = [];
  if (columns.index) parts.push({ key: 'index', poids: 0.7, mini: 8 });
  if (columns.qr) parts.push({ key: 'qr', fixe: qrMm });
  if (columns.url) parts.push({ key: 'url', poids: 2.6, mini: 20 });
  if (columns.title) parts.push({ key: 'title', poids: 2.4, mini: 20 });
  if (columns.date) parts.push({ key: 'date', poids: 1.1, mini: 14 });
  if (columns.tags) parts.push({ key: 'tags', poids: 1.2, mini: 14 });
  if (columns.note) parts.push({ key: 'note', poids: 1.6, mini: 14 });

  const fixes = parts.reduce((total, colonne) => total + (colonne.fixe ?? 0), 0);
  const textes = parts.filter((colonne) => colonne.fixe === undefined);
  const reste = Math.max(0, utile - fixes);
  const poids = textes.reduce((total, colonne) => total + colonne.poids, 0);

  // Le minimum l'emporte sur le prorata : une colonne trop étroite pour son
  // contenu ferait des lignes plus hautes que nécessaire, et le rembourrage
  // d'une cellule ne se comprime pas.
  const vouluesTextes = textes.map((colonne) => {
    const prorata = poids > 0 ? (reste * colonne.poids) / poids : reste / textes.length;
    return Math.max(colonne.mini, prorata);
  });

  // Si les minima dépassent la place restante, ce sont **les colonnes de texte**
  // qui se rétrécissent, et jamais celle du QR Code : une matrice plus large que
  // sa colonne déborderait sur la voisine, alors qu'une adresse ou un titre se
  // replient. C'est le cas d'un QR Code réglé très large sur une page étroite.
  const sommeTextes = vouluesTextes.reduce((somme, valeur) => somme + valeur, 0);
  const echelle = sommeTextes > reste && sommeTextes > 0 ? reste / sommeTextes : 1;

  // Les largeurs sont rendues **dans l'ordre des colonnes**, fixes comprises.
  return parts.map((colonne) => {
    if (colonne.fixe !== undefined) return `${colonne.fixe.toFixed(2)}mm`;
    return `${(vouluesTextes.shift() * echelle).toFixed(2)}mm`;
  });
}

/**
 * L'en-tête du tableau imprimé.
 *
 * Il est **refait pour chaque page** plutôt que déplacé : un `<tr>` n'appartient
 * qu'à un seul tableau. Sur une liasse, une page sans en-tête ne dit plus ce
 * qu'elle contient.
 *
 * @param {object} columns
 * @returns {HTMLElement}
 */
function buildTableHead(columns) {
  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  const headers = [
    ...(columns.index ? ['N°'] : []),
    ...(columns.qr ? ['QR Code'] : []),
    ...(columns.url ? ['URL'] : []),
    ...(columns.title ? ['Titre'] : []),
    ...(columns.date ? ['Date'] : []),
    ...(columns.tags ? ['Tags'] : []),
    ...(columns.note ? ['Note'] : []),
  ];
  for (const label of headers) {
    const th = document.createElement('th');
    th.textContent = label;
    headRow.appendChild(th);
  }
  head.appendChild(headRow);
  return head;
}

/**
 * Une ligne du tableau imprimé.
 *
 * @param {import('./core/link.js').LinkRecord} link
 * @param {object} columns
 * @param {number} size Côté du QR Code, en pixels.
 * @returns {HTMLElement}
 */
function buildTableRow(link, columns, size) {
  const row = document.createElement('tr');

  if (columns.index) {
    const num = document.createElement('td');
    // Le rang dans la collection, pas le rang dans le tableau : c'est ce qui
    // permet de retrouver le lien dans la liste.
    num.textContent = String(linkRanks.get(link.id) ?? '');
    row.appendChild(num);
  }

  if (columns.qr) {
    const qrCell = document.createElement('td');
    qrCell.className = 'print-table__qr';
    const svg = qrElement(link.url, { border: 1 });
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    qrCell.appendChild(svg);
    row.appendChild(qrCell);
  }

  if (columns.url) {
    const urlCell = document.createElement('td');
    urlCell.textContent = link.url;
    row.appendChild(urlCell);
  }

  if (columns.title) {
    const titleCell = document.createElement('td');
    titleCell.textContent = link.title;
    row.appendChild(titleCell);
  }

  if (columns.date) {
    const dateCell = document.createElement('td');
    dateCell.textContent = formatCaptureDate(link.createdAt, tableDateMode());
    row.appendChild(dateCell);
  }

  if (columns.tags) {
    const tagsCell = document.createElement('td');
    tagsCell.textContent = link.tags.join(' ');
    row.appendChild(tagsCell);
  }

  if (columns.note) {
    const noteCell = document.createElement('td');
    noteCell.textContent = link.note;
    row.appendChild(noteCell);
  }

  return row;
}

/**
 * Rembourrage d'une cellule du tableau imprimé, en millimètres.
 *
 * Il vit ici **et** dans la feuille de style : la largeur de la colonne qui
 * porte le QR Code se calcule depuis lui, et deux valeurs qui divergeraient
 * feraient une colonne trop étroite d'un demi-millimètre par côté — invisible à
 * l'œil, visible sur la largeur du code.
 */
const TABLE_CELL_PADDING_MM = 1.5;

/** Les colonnes retenues pour le tableau imprimé. */
function tableColumns() {
  return {
    index: el.tableColIndex.checked,
    qr: el.tableColQr.checked,
    url: el.tableColUrl.checked,
    title: el.tableColTitle.checked,
    tags: el.tableColTags.checked,
    note: el.tableColNote.checked,
    // La date est une colonne comme les autres : elle se coche ici, et non dans
    // un réglage global qui valait pour les quatre mises en forme à la fois.
    // L'heure implique la date : la colonne apparaît dès que l'une des deux
    // cases est cochée, sinon cocher « Avec l'heure » seule ne montrerait rien.
    date: el.tableColDate.checked || el.tableColDateTime.checked,
  };
}

/** Vrai si au moins une colonne est demandée, date comprise. */
function hasAnyTableColumn() {
  return Object.values(tableColumns()).some(Boolean);
}

/**
 * Autorise ou non les colonnes « Tags » et « Note ».
 *
 * Une colonne qu'aucun lien ne peut remplir est proposée mais **inerte** : la
 * masquer laisserait croire que la fonction n'existe pas, et l'activer
 * produirait une colonne vide sur toute la page.
 */
function updateTableOptions() {
  const options = [
    { box: el.tableColTags, available: hasAnyTag(links), what: t('tag') },
    { box: el.tableColNote, available: hasAnyNote(links), what: t('note') },
  ];

  for (const { box, available, what } of options) {
    box.disabled = !available;
    if (!available) box.checked = false;
    const label = box.parentNode;
    if (label) {
      label.title = available
        ? t('Imprimer la colonne « {what} »', { what })
        : t("Aucun lien n'a de {what} : ajoutez-en un avec le bouton ✎ de la liste.", { what });
    }
  }

  el.tableHint.textContent = hasAnyNote(links) || hasAnyTag(links)
    ? t('Les tags et la note saisis dans la liste (bouton ✎) peuvent être imprimés ici.')
    : t('Ajoutez un tag ou une note depuis la liste (bouton ✎) pour pouvoir les imprimer.');
}

/**
 * La case « Avec la note de collection » n'a de sens que s'il y a une note.
 *
 * Même traitement que les colonnes « tag » et « note » du tableau : la case
 * reste visible — elle apprend que la note peut s'imprimer — mais elle est
 * inerte, et l'infobulle dit pourquoi. Son état, lui, n'est pas touché : le
 * décocher d'office effacerait un choix que l'utilisateur veut retrouver dès
 * qu'il aura écrit sa note.
 */
function updateHeaderNoteOptions() {
  const disponible = collectionNote() !== '';
  for (const box of [el.sheetHeaderNote, el.tableTitleNote]) {
    box.disabled = !disponible;
    const label = box.parentNode;
    if (label) {
      label.title = disponible
        ? t('Imprimer la note de collection sous le nom')
        : t("Écrivez d'abord la note de collection, dans le panneau de gauche.");
    }
  }
}

/** Redessine l'aperçu selon le mode actif. */
function renderPreview() {
  // La largeur utile de ce rendu, retenue pour que l'observateur de taille plus
  // bas sache si elle a changé.
  largeurApercuRendue = previewViewportWidth();

  const items = printableLinks().slice(0, 400);
  el.preview.textContent = '';
  el.print.disabled = items.length === 0;
  el.print.textContent = printLabel(items.length);
  // L'export du tableau suit la même portée que l'impression : la sélection et
  // les colonnes cochées. Sans colonne, il n'y a rien à exporter. Il ne se
  // montre que dans l'onglet Tableau, à côté d'« Imprimer ».
  el.exportTable.hidden = mode !== 'table';
  el.exportTable.disabled = items.length === 0 || !hasAnyTableColumn();
  // La planche a sa propre sortie, pour la même raison que le tableau : elle a
  // ses propres réglages, et c'est là qu'ils vivent.
  el.exportSheet.hidden = mode !== 'sheet';
  el.exportSheet.disabled = items.length === 0;
  // Niimbot et Étiquette (divers) ont leur propre bouton dans le panneau : la
  // rangée commune disparaît, sans laisser un blanc entre le mode et l'aperçu.
  el.panelActions.hidden = mode === 'single' || mode === 'images';

  if (mode === 'single') {
    el.print.hidden = true;
    // Le lien choisi dans l'onglet, pas le premier de la collection.
    renderSingleLabel(chosenLabelLink());
    return;
  }

  if (mode === 'images') {
    // L'export d'images ne passe pas par la boîte d'impression : il produit des
    // fichiers, utilisables avec n'importe quelle étiqueteuse.
    el.print.hidden = true;
    el.exportLabels.disabled = items.length === 0;
    // Le libellé dit la portée et le nombre, comme le bouton d'impression :
    // « Exporter les images » laissait croire à toute la collection.
    el.exportLabels.textContent = exportImagesLabel(items.length);
    renderImagePreview(items[0]);
    return;
  }

  el.print.hidden = false;

  if (items.length === 0) {
    // La phrase doit être là **avant** le premier lien : c'est au moment où l'on
    // règle la planche qu'on a besoin de la comprendre. La taille ne dépend pas
    // du nombre de liens, elle est donc exacte.
    updateFitHint({
      layout: computeSheet({ count: 1, ...sheetConfig(), adviseDenser: false }),
      offsetXMm: Number(el.sheetOffsetX.value) || 0,
      offsetYMm: Number(el.sheetOffsetY.value) || 0,
    });

    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = t('Ajoutez des liens pour voir un aperçu.');
    el.preview.appendChild(note);
    return;
  }

  if (mode === 'table') {
    if (!hasAnyTableColumn()) {
      // Un tableau sans aucune colonne n'a pas de sens : on le dit plutôt que
      // d'afficher un cadre vide.
      const note = document.createElement('p');
      note.className = 'hint';
      note.textContent = t('Aucune colonne sélectionnée : cochez au moins une colonne.');
      el.preview.appendChild(note);
      return;
    }
    // Le tableau aussi se découpe en pages : on en montre les deux premières,
    // comme pour la planche. Une seule page affichée laisserait croire que le
    // reste n'existe pas — c'était le cas, et c'est ce qui trompait.
    const pagesTableau = buildTablePages(items, { preview: true });
    for (const page of pagesTableau.slice(0, 2)) {
      el.preview.appendChild(scaleForScreen(page));
    }
    // La légende obéit à la convention des aperçus : **hors** du cadre de page,
    // une information par ligne. Sur une liasse, savoir combien de feuilles
    // sortiront est l'information qui manquait.
    const legende = document.createElement('div');
    legende.className = 'hint preview__caption';
    legende.appendChild(ligneDeLegende(tableauPagesFact(items.length, pagesTableau.length)));
    el.preview.appendChild(legende);
    return;
  }

  // Planche : on affiche les deux premières pages, à l'échelle.
  for (const page of buildSheetPages(items).slice(0, 2)) {
    el.preview.appendChild(scaleForScreen(page));
  }
}

/**
 * Largeur utile de l'aperçu, en pixels.
 *
 * `clientWidth` inclut le rembourrage de `.preview` : on le retire pour obtenir
 * la place réellement offerte à une page. Un minimum fixe de 280 px faisait
 * déborder la page dès que le panneau était plus étroit que lui — fenêtre
 * rétrécie ou téléphone. Si la mesure est indisponible (DOM de substitution),
 * on retombe sur une valeur raisonnable.
 *
 * @returns {number}
 */
function previewViewportWidth() {
  const node = el.preview;
  const raw = Number(node?.clientWidth);
  if (!Number.isFinite(raw) || raw <= 0) return 320;

  let padX = 28;
  if (typeof getComputedStyle === 'function') {
    try {
      const styles = getComputedStyle(node);
      padX = (Number.parseFloat(styles.paddingLeft) || 0)
        + (Number.parseFloat(styles.paddingRight) || 0);
    } catch {
      // On garde le rembourrage par défaut.
    }
  }
  return Math.max(120, raw - padX);
}

/**
 * Met une page en millimètres à l'échelle de l'aperçu.
 * @param {HTMLElement} page
 * @returns {HTMLElement}
 */
function scaleForScreen(page) {
  const widthMm = Number.parseFloat(page.style.width);
  const heightMm = Number.parseFloat(page.style.height);
  const available = largeurUtileApercu();
  const tailleReelle = widthMm * PX_PER_MM;
  // **La place disponible fait l'échelle**, et le plafond est la taille réelle.
  //
  // Un plafond de 0,6 était appliqué ici : une A4 n'occupait donc jamais plus de
  // 476 px, quel que soit l'espace offert — 74 % du panneau sur un écran de
  // 1280 px, et moins encore au-delà. Sur un aperçu de tableau, dont le texte
  // fait 8 pt, cela donnait une page qu'on ne pouvait pas lire : c'était le
  // grief.
  //
  // La borne haute reste 1 : l'aperçu ne grossit pas la page au-delà de sa
  // taille physique. Au-delà, il n'apprend plus rien et fait croire à un
  // document plus grand qu'il n'est.
  const scale = Math.min(1, available / tailleReelle);

  const frame = document.createElement('div');
  frame.className = 'preview__frame';
  frame.style.width = `${widthMm * PX_PER_MM * scale}px`;
  frame.style.height = `${heightMm * PX_PER_MM * scale}px`;
  frame.style.overflow = 'hidden';

  // La page est mise à l'échelle **telle quelle**, sans être déballée : c'est
  // le même élément et les mêmes règles qu'à l'impression. La déballer, comme
  // on le faisait, perdait le positionnement des cellules et l'aperçu ne
  // montrait plus du tout la planche qui allait sortir.
  page.classList.add('print-page--screen');
  page.style.transform = `scale(${scale})`;
  page.style.transformOrigin = 'top left';

  frame.appendChild(page);
  return frame;
}

/**
 * Pose la taille de papier utilisée à l'impression.
 *
 * `@page` n'accepte pas de style en ligne : il faut une feuille de style. Sans
 * cela, une planche Letter serait posée sur du A4, donc réduite et décalée —
 * et aucune cote d'étiquette ne pourrait la rattraper.
 *
 * @param {number} widthMm
 * @param {number} heightMm
 */
function applyPrintPageSize(widthMm, heightMm) {
  let style = document.getElementById(PRINT_PAGE_STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = PRINT_PAGE_STYLE_ID;
    (document.head ?? document.body).appendChild(style);
  }
  style.textContent = `@page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }`;
}

/**
 * Une ligne de légende sous un aperçu.
 *
 * Chaque fait occupe **sa** ligne : côte à côte, ils se noient les uns dans les
 * autres, et c'est celui qu'on cherche qui disparaît. Le bloc est distinct de
 * l'aperçu — il vient après lui, dans le même cadre — pour qu'on ne le confonde
 * pas avec ce qui sera imprimé.
 *
 * @param {string} texte
 * @returns {HTMLSpanElement}
 */
function ligneDeLegende(texte) {
  const ligne = document.createElement('span');
  ligne.className = 'preview__fact';
  ligne.textContent = texte;
  return ligne;
}

/**
 * Combien de pages le tableau imprimé occupe, dit en une ligne.
 *
 * Le tableau sortait sur une page quelle que soit sa longueur, sans que rien ne
 * le dise : le nombre de feuilles est exactement ce qu'un utilisateur ne peut pas
 * deviner avant de cliquer sur « Imprimer ».
 *
 * @param {number} lignes
 * @param {number} pages
 * @returns {string}
 */
function tableauPagesFact(lignes, pages) {
  return tpl(
    lignes,
    '{count} ligne imprimée sur {pages} page.',
    '{count} lignes imprimées sur {pages} pages.',
    { pages },
  );
}

/**
 * Ce qui ferait disparaître un refus de longueur, dit à l'endroit du refus.
 *
 * Le refus est mesuré, pas deviné : le QR Code encode l'URL, et sa largeur est
 * celle de l'étiquette, moins les marges. Décocher les options de texte ne
 * change donc **rien** à sa largeur — ce que rien ne disait, et qu'on cherchait
 * pourtant de ce côté. Ce qui marche, en revanche :
 *
 * - un **raccourci** : c'est le remède direct, et l'application le propose déjà
 *   pour ce lien. On le vérifie en composant l'étiquette avec, au lieu de
 *   l'affirmer ;
 * - une **étiquette plus large** — seul recours quand l'URL n'a pas de raccourci
 *   et que la largeur est la contrainte ;
 * - **moins de texte**, mais uniquement quand c'est la hauteur qui manque. Le
 *   dire dans l'autre cas enverrait décocher des cases pour rien.
 *
 * @param {import('./core/link.js').LinkRecord} link
 * @param {object} profile
 * @param {object} geometry
 * @returns {string}
 */
function conseilPourPanneau(link, profile, geometry) {
  if (hasShortUrl(link)) {
    const essai = composeLabel({ ...link, useShort: true }, profile);
    if (essai.verdict.ok) {
      return t("Ce lien a un raccourci : cochez son adresse courte dans la liste, et le QR Code l'encodera à la place.");
    }
  }
  // Le QR Code est plus large que l'étiquette : le texte n'y est pour rien.
  if (geometry.qrSize > geometry.width) {
    return t(
      "Le texte imprimé n'y change rien : c'est la largeur du QR Code qui dépasse celle de l'étiquette.",
    );
  }
  return t(
    'La place manque en hauteur : décochez du texte sous le QR Code, ou prenez une étiquette plus longue.',
  );
}

/** Aperçu de l'étiquette destinée à l'imprimante Niimbot. */
function renderSingleLabel(link) {
  if (labelPreviewUrl) {
    URL.revokeObjectURL(labelPreviewUrl);
    labelPreviewUrl = null;
  }

  if (!link) {
    // Rien à imprimer : on le dit, sans verdict rouge. Un verdict de longueur
    // n'a de sens que pour une étiquette qui va sortir.
    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = t(
      'Rien à imprimer : cochez au moins un lien dans la liste, ou choisissez « Toute la collection ».',
    );
    el.preview.appendChild(note);
    return;
  }

  // Le profil vient de l'imprimante quand il y en a une, sinon du format
  // choisi : on doit pouvoir juger un rendu avant d'acheter le matériel.
  const profile = previewProfile();
  const { geometry, content, verdict, dateOmitted, dateTropPetite, lateralRefused } =
    composeLabel(link, profile);
  // L'URL réellement encodée : le raccourci quand c'est lui qui est choisi.
  const cible = resolveTarget(link, el.qrTarget.value);

  const frame = document.createElement('div');
  frame.className = 'preview__page';
  frame.style.padding = '10px';

  // On compose à la taille réelle, puis on met à l'échelle pour l'écran : un
  // rendu agrandi par le navigateur interpolerait le QR Code et le rendrait flou.
  const source = document.createElement('canvas');
  source.width = geometry.width;
  source.height = geometry.height;

  const sourceCtx = source.getContext('2d');
  sourceCtx.imageSmoothingEnabled = false;
  drawLabel(sourceCtx, geometry, {
    titleLines: content.titleLines,
    showTitle: content.showTitle,
    url: cible.url,
    extraText: content.extraText,
  });

  // L'orientation est un réglage d'impression, mais rien ne la montrerait sans
  // imprimante connectée : on l'applique aussi à l'aperçu, avec exactement la
  // même fonction que l'envoi. L'aperçu montre donc ce qui sortira.
  const { turns } = labelRotation();
  const rotated = turns === 0 ? null : rotateCanvas(source, turns);
  const shown = rotated ?? source;

  const canvas = document.createElement('canvas');
  // L'échelle de l'aperçu est calculée dans le cœur, où elle est testable : elle
  // dépend de la tête, de la résolution et de la place disponible, et elle est
  // désormais bornée par un **multiple de la taille réelle** plutôt que par un
  // facteur de rendu. Plafonner à « 4 » donnait 8,5 × sur une tête de 203 ppp et
  // 2,2 × sur une tête de 300 ppp, sans que rien ne relie le chiffre au résultat.
  const available = Math.max(1, largeurUtileApercu() - 20);
  const echelle = labelPreviewZoom({
    widthPx: shown.width,
    dpi: profile.dpi,
    availablePx: available,
    realSize: el.labelRealSize.checked,
  });
  const zoom = echelle.zoom;
  const displayWidth = Math.max(1, Math.round(shown.width * zoom));
  const displayHeight = Math.max(1, Math.round(shown.height * zoom));
  canvas.width = displayWidth;
  canvas.height = displayHeight;
  canvas.style.width = `${displayWidth}px`;
  canvas.style.imageRendering = zoom < 1 ? 'auto' : 'pixelated';

  const ctx = canvas.getContext('2d');
  // À la réduction, un lissage garde le QR Code lisible ; à l'agrandissement, le plus
  // proche voisin conserve les modules nets.
  ctx.imageSmoothingEnabled = zoom < 1;
  ctx.drawImage(shown, 0, 0, displayWidth, displayHeight);

  frame.appendChild(canvas);

  const caption = document.createElement('div');
  caption.className = 'hint preview__caption';
  // `composeLabel` sait si la date a été écartée : on le dit, plutôt que de
  // laisser croire que l'option n'a pas d'effet.
  const dateNote = dateTropPetite
    ? t('Date non imprimée : elle exigerait un texte trop petit pour être lu.')
    : (dateOmitted ? composeDateNote() : '');
  // La taille réellement retenue peut différer de celle demandée : la géométrie
  // réduit plutôt que de tronquer. On le dit, sinon le réglage semble sans effet.
  const tailleObtenue = pxToMm(geometry.fontSize, profile.dpi).toFixed(1);
  el.labelFontHint.textContent = t('Texte de {size} mm de haut, {lines} de texte.', {
    size: tailleObtenue,
    // Le compte suit ce que la bande a **retenu** : en disposition tournée,
    // elle redécoupe le titre elle-même, et celui de la composition empilée
    // n'est plus celui qui est écrit.
    lines: tpl(
      geometry.lines.length + (geometry.titleLines?.length ?? content.titleLines?.length ?? 0),
      '{count} ligne',
      '{count} lignes',
    ),
  });
  // **Ce que le réglage du QR Code a donné.** Un champ borné qui ne dit pas ce
  // qu'il a obtenu laisse croire qu'il n'a pas agi : on annonce la taille, les
  // pixels par module, et l'intervalle permis — même règle que sous le curseur de
  // la planche.
  if (el.labelQrHint) {
    const modules = geometry.qrMatrix?.size ?? 0;
    const mm = (px) => (px / profile.dpi) * 25.4;
    const largeurUtile = geometry.width - geometry.padding * 2;
    const minPx = modules * 2;
    const maxPx = Math.floor(largeurUtile / modules) * modules;
    const demandeeMm = Number(el.labelQrSize?.value);
    const bornee = qrReglable(profile) && Number.isFinite(demandeeMm) && demandeeMm > 0
      && Math.abs(geometry.qrSize - (demandeeMm / 25.4) * profile.dpi) > modules;
    el.labelQrHint.textContent = qrReglable(profile) && modules > 0
      ? t('QR Code : {mm} mm de côté, {px} px par module. Réglable de {min} à {max} mm sur cette tête.', {
        mm: mm(geometry.qrSize).toFixed(1),
        px: decimal(geometry.qrSize / modules),
        min: mm(minPx).toFixed(1),
        max: mm(maxPx).toFixed(1),
      }) + (bornee ? ' ' + t('La taille demandée a été ramenée à ce qui tient.') : '')
      : '';
  }

  const orientationNote = lateralRefused
    ? t('Texte empilé : le QR Code laisse trop peu de largeur pour une colonne de texte.')
    : (turns === 0 ? '' : t('Orientation : {label}', { label: t(labelRotation().label) }));
  // L'échelle est **dite**. C'est le défaut d'origine : l'aperçu agrandissait
  // huit fois et demi sans l'annoncer, et rien ne permettait de s'en apercevoir.
  const largeurMm = pxToMm(geometry.width, profile.dpi).toFixed(1);
  const hauteurMm = pxToMm(geometry.height, profile.dpi).toFixed(1);
  const echelleNote = echelle.multiple > 1.05
    ? t('Aperçu à {multiple} × la taille réelle ({width} × {height} mm).', {
      multiple: echelle.multiple.toFixed(1),
      width: largeurMm,
      height: hauteurMm,
    })
    : t('Aperçu à la taille réelle ({width} × {height} mm).', {
      width: largeurMm,
      height: hauteurMm,
    });

  // Un verdict porte toujours sur **une** étiquette : quand la portée en couvre
  // plusieurs, on nomme celle qui est en cause. Sans le nom, le message
  // ressemblerait à un jugement sur toute l'impression.
  //
  // Et il dit **ce qui le ferait disparaître**. Le refus est juste — le QR Code
  // encode l'URL, et c'est sa largeur qui décide — mais rien ne l'expliquait, si
  // bien qu'on cherchait le coupable du côté des options de texte, qui n'y
  // peuvent rien : les décocher ne change pas la taille du QR Code.
  const conseil = verdict.ok ? '' : conseilPourPanneau(link, profile, geometry);
  const nommer = impressionChoisie().kind !== 'one';

  // **Une information par ligne.**
  //
  // Elles étaient bout à bout, séparées par des tirets cadratins : sur une ligne
  // longue, « D110 — 96 × 176 px, 2 px par module — aperçu à la taille réelle
  // (12,0 × 22,0 mm) » se lit mal et noie ce qu'on cherche. Trois faits
  // distincts — la machine, le dessin, l'échelle — méritent trois lignes, même
  // quand la place permettrait de les mettre côte à côte.
  const faits = [verdict.ok
    ? t('{profile} — {width} × {height} px, {px} px par module', {
      profile: profile.id,
      width: geometry.width,
      height: geometry.height,
      px: decimal(verdict.pxPerModule),
    })
    : (nommer
      ? t('{profile} — « {title} » : {reason}', {
        profile: profile.id,
        title: link.title || hostOf(link.url) || link.url,
        reason: t(verdict.reason),
      })
      : t('{profile} — {reason}', { profile: profile.id, reason: t(verdict.reason) }))];
  if (conseil !== '') faits.push(conseil);
  if (orientationNote !== '') faits.push(orientationNote);
  if (dateNote !== '') faits.push(dateNote);
  // **Ce que la composition a laissé de côté.** Le calcul le savait et le
  // taisait : une adresse tronquée sortait sans un mot, comme si elle tenait
  // entière. Le refus nomme le remède, comme celui de la largeur du QR Code.
  if (geometry.textCut === true) {
    faits.push(t('Texte coupé : il ne tient pas entier sur cette étiquette. Raccourcissez l\'adresse, décochez du contenu, ou prenez une étiquette plus longue.'));
  }
  faits.push(echelleNote);

  caption.replaceChildren(...faits.map((fait) => ligneDeLegende(fait)));
  if (!verdict.ok) caption.style.color = 'var(--danger)';

  // **Hors du cadre.** La légende était posée dans `.preview__page`, le bloc
  // blanc bordé qui figure l'étiquette : elle semblait faire partie de ce qui
  // sera imprimé, et le cadre semblait la contenir. C'est une information
  // **sur** l'aperçu, alors elle vit à côté de lui.
  el.preview.appendChild(frame);
  el.preview.appendChild(caption);
  updateProfileHint();
}

// ---------------------------------------------------------------------------
// Composition d'étiquette
// ---------------------------------------------------------------------------

/**
 * Compose l'étiquette d'un lien pour un profil d'imprimante.
 *
 * @param {import('./core/link.js').LinkRecord} link
 * @param {import('./core/printer/profiles.js').PrinterProfile} profile
 * @returns {{ geometry: object, verdict: object }}
 */
function composeLabel(link, profile) {
  // Le QR Code encode la cible choisie — l'URL collectée ou son raccourci. Sans
  // cette résolution, l'étiquette ignorait le réglage : la liste affichait un
  // tinyurl que le QR Code n'encodait pas et que le texte n'imprimait pas non plus.
  const target = resolveTarget(link, el.qrTarget.value);

  // Avec l'heure quand la place le permet : sur une étiquette étroite, la date
  // seule tient là où « date et heure » devrait céder une ligne.
  // La date seule par défaut : c'est ce qui tient sur une tête de 12 mm.
  const wanted = formatCaptureDate(link.createdAt, el.labelDateTime.checked ? 'datetime' : 'date');
  const lengthPx = labelLengthPx(profile);
  const alignment = el.labelAlignment.value || DEFAULT_LABEL_ALIGNMENT;
  // La taille de police demandée, en pixels pour ce profil. Zéro laisse la
  // géométrie choisir : c'est le repli quand le champ est vidé.
  const tailleMm = Number(el.labelFontSize.value);
  const fontSize = Number.isFinite(tailleMm) && tailleMm > 0
    ? Math.max(6, Math.round((tailleMm / 25.4) * profile.dpi))
    : undefined;
  // La taille du titre, dans la même unité et avec le même repli : champ vidé,
  // le titre reprend la taille du texte — le comportement d'avant le réglage.
  const tailleTitreMm = Number(el.labelTitleSize?.value);
  const titleFontSize = Number.isFinite(tailleTitreMm) && tailleTitreMm > 0
    ? Math.max(6, Math.round((tailleTitreMm / 25.4) * profile.dpi))
    : fontSize;
  // La taille du QR Code demandée, en millimètres. `null` laisse la géométrie
  // choisir — c'est le cas des têtes de 12 mm, où la question ne se pose pas.
  const tailleQrMm = Number(el.labelQrSize?.value);
  const qrTargetPx = qrDemande(profile)
    ? Math.round((tailleQrMm / 25.4) * profile.dpi)
    : null;

  // `drawLabel` écrit la date sur une seule ligne, sans la découper : on vérifie
  // d'abord qu'elle tient, à la taille de police que la géométrie va retenir.
  // Un premier calcul sans ligne réservée donne cette taille.
  // Le QR Code encode toujours l'URL du lien ; le texte imprimé, lui, suit le mode
  // choisi. Le mode « QR Code seul » n'a donc aucun texte à mesurer, d'où la sonde
  // sur l'URL : c'est la matrice la plus large qui décide de l'échelle.
  const probe = computeLabelGeometry({
    text: target.url,
    qrText: target.url,
    widthPx: profile.printheadPixels,
    dpi: profile.dpi,
    ecc: 'M',
    maxHeightPx: lengthPx,
    alignment,
    fontSize,
    // La géométrie découpe le texte à la taille qu'elle retient : la fabrique de
    // mesure reçoit donc cette taille. Une mesure figée servait à découper pour
    // toutes les tailles essayées, et le texte débordait de l'étiquette.
    measureFactory: cachedTextMeasure,
  });

  // La date est découpée à la largeur utile, à la taille de police de la sonde.
  // Une date complète sur deux lignes vaut mieux qu'aucune date : c'est ce qui
  // rendait le réglage inopérant sur une tête de 12 mm.
  // La date est une option de l'étiquette, pas un réglage global : elle se
  // coche ici, avec sa précision. La faire dépendre du réglage « Date sous le
  // QR Code » des planches rendait la case sans effet tant qu'on n'y touchait
  // pas, ce qui se lisait comme un défaut.
  // « Avec l'heure » implique la date, comme dans les autres onglets.
  const wantsDate = el.labelShowDate.checked || el.labelDateTime.checked;
  const largeurDate = probe.width - probe.padding * 2;

  // La date est écrite d'un bloc ou pas du tout : à la taille de police par
  // défaut, elle ne tenait pas sur une tête de 12 mm et disparaissait sans
  // explication. On réduit donc la police du texte juste assez pour qu'elle
  // entre — la date est une information courte, mieux vaut un texte un peu
  // plus petit que pas de date du tout.
  const plancherDate = Math.max(
    MIN_FONT_PX,
    Math.round((MIN_TEXT_MM / 25.4) * profile.dpi),
  );
  const tailleDate = wantsDate && wanted !== ''
    ? fontSizeForDate(cachedTextMeasure, wanted, largeurDate, plancherDate, DATE_LINES_MAX)
    : 0;
  const dateLines = tailleDate > 0
    ? wrapDate(cachedTextMeasure(tailleDate), wanted, largeurDate, DATE_LINES_MAX)
    : [];
  // Une date qui exige une police sous le plancher de lisibilité n'est pas
  // imprimée : « 15/09/2026 21:07 » demandait 1,1 mm sur une tête de 12 mm.
  // Mieux vaut pas de date qu'une date illisible, et on le dit.
  const dateTropPetite = wantsDate && wanted !== '' && tailleDate === 0;

  // Le titre se découpe à la largeur utile, comme l'URL : réservé sur une seule
  // ligne puis écrit sans découpe, un titre long débordait de l'étiquette.
  const largeurUtile = probe.width - probe.padding * 2;
  const titreVoulu = el.labelShowTitle.checked
    && typeof link.title === 'string' && link.title.trim() !== ''
    ? link.title.trim()
    : '';
  const titleLines = titreVoulu === ''
    ? []
    : wrapText(cachedTextMeasure(probe.fontSize), titreVoulu, largeurUtile, { maxLines: 2 });

  // Le contenu se compose de choix indépendants, qui se cumulent.
  const content = labelContentFromChoices(target, {
    index: linkRanks.get(link.id) ?? null,
    indexVisible: el.labelShowIndex.checked,
    title: el.labelShowTitle.checked,
    titleLines,
    url: el.labelShowUrl.checked,
    host: el.labelShowHost.checked,
    dateLines,
  });

  let geometry = computeLabelGeometry({
    text: content.text,
    qrText: target.url,
    widthPx: profile.printheadPixels,
    dpi: profile.dpi,
    ecc: 'M',
    extraLines: content.extraLines,
    // Ce que la géométrie doit savoir du titre : **combien** de ses rangées
    // supplémentaires en viennent, et à quelle hauteur elles s'interlignent.
    // Sans quoi le titre gardait l'interligne du corps et le réglage décalait
    // tout ce qui suit.
    titleRows: content.titleLines?.length ?? 0,
    titleFontSize,
    maxHeightPx: lengthPx,
    alignment,
    qrTargetPx,
    // La date impose sa taille : elle est écrite d'un bloc, sans découpage.
    fontSize: tailleDate > 0 && fontSize !== undefined
      ? Math.min(fontSize, tailleDate)
      : (tailleDate > 0 ? tailleDate : fontSize),
    measureFactory: cachedTextMeasure,
    // « Texte au-dessus » se décide à la composition : le texte précède le QR Code.
    textFirst: labelLayout().textFirst === true,
  });

  // La disposition suit l'orientation choisie. Le texte n'est jamais tourné
  // avec l'image : il est soit droit, soit tourné sur lui-même — deux façons
  // d'obtenir un texte lisible selon la forme du support.
  let lateralRefused = false;
  const disposition = labelLayout();

  if (disposition.mode === 'lateral') {
    const lateral = layoutLabelLateral(geometry, {
      measure: cachedTextMeasure(geometry.fontSize),
      text: content.text,
      maxLines: 4,
      gap: geometry.padding,
    });
    // Une URL dense occupe tant de modules qu'il ne reste pas de colonne pour
    // le texte : l'empilement reprend alors la main, et on le dit.
    lateralRefused = lateral.lateral !== true;
    geometry = lateralRefused ? geometry : lateral;
  } else if (disposition.mode === 'rotated') {
    geometry = layoutLabelRotated(geometry, {
      measure: cachedTextMeasure(geometry.fontSize),
      measureFactory: cachedTextMeasure,
      // Le plancher de lisibilité se convertit en pixels avec la résolution.
      dpi: profile.dpi,
      // Le sens de rotation est une donnée de la disposition, pas du rendu :
      // la géométrie le transporte jusqu'au dessin.
      sens: disposition.sens,
      text: content.text,
      // Le titre fait partie de la bande : sans lui, il n'était pas réservé et
      // ne s'imprimait pas du tout dans cette disposition.
      titleLines: content.titleLines,
      // **Le titre, en clair, en plus de ses lignes.** Celles-ci sont découpées à
      // la **largeur** de l'étiquette, parce que c'est la contrainte de la
      // disposition empilée. Dans la bande tournée, chaque rangée court sur la
      // **longueur** : réutiliser ces lignes tronquait le titre à deux rangées
      // étroites alors que la bande avait de quoi l'écrire entier. Mesuré sur un
      // 12 × 75 mm : deux rangées de 72 px occupées sur 490 px disponibles, et la
      // moitié du titre perdue. La bande redécoupe donc le titre elle-même, comme
      // elle redécoupe déjà le corps du texte.
      title: titreVoulu,
      // Les lignes de la date, telles quelles : le titre peut occuper plusieurs
      // rangées, et les déduire de `extraLines` se trompait dès qu'il en prenait
      // deux.
      dateLines: content.extraText,
      gap: geometry.padding,
    });
  }

  return {
    geometry,
    content,
    verdict: checkQrLegibility(geometry),
    dateLines,
    dateOmitted: wantsDate && wanted !== '' && dateLines.length === 0,
    dateTropPetite,
    lateralRefused,
  };
}

/**
 * Longueur d'étiquette en pixels, telle que saisie dans le panneau Niimbot.
 *
 * Zéro signifie « longueur libre » : le rouleau continu n'a pas de pas, et une
 * longueur inventée ferait pire que bien. La valeur est bornée par la fenêtre
 * d'impression du profil, faute de quoi l'imprimante s'arrêterait avant la fin.
 *
 * @param {import('./core/printer/profiles.js').PrinterProfile} profile
 * @returns {number}
 */
function labelLengthPx(profile) {
  // C'est le consommable qui porte la longueur : c'est le rouleau qui est
  // chargé, pas une valeur saisie à côté — et un rouleau 12 × 30 impose 30 mm.
  // Le rouleau continu, lui, n'a pas de pas connu : zéro laisse la composition
  // s'ajuster au contenu, seule chose possible sans deviner.
  const supply = chosenSupply();
  const mm = supply?.lengthMm ?? null;

  if (!Number.isFinite(mm) || mm <= 0) return 0;
  return Math.round((Math.min(mm, profile.maxPrintHeightMm) / 25.4) * profile.dpi);
}

/**
 * Rend l'étiquette d'un lien en bitmap monochrome.
 * @param {import('./core/link.js').LinkRecord} link
 * @param {import('./core/printer/profiles.js').PrinterProfile} profile
 * @returns {{ bitmap: object, verdict: object }}
 */
function labelToBitmap(link, profile) {
  const { geometry, content, verdict } = composeLabel(link, profile);

  const canvas = document.createElement('canvas');
  canvas.width = geometry.width;
  canvas.height = geometry.height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  drawLabel(ctx, geometry, {
    titleLines: content.titleLines,
    showTitle: content.showTitle,
    url: link.url,
    extraText: content.extraText,
  });

  const imageData = ctx.getImageData(0, 0, geometry.width, geometry.height);
  const bitmap = imageDataToMono(imageData, { threshold: 128 });

  // L'orientation choisie s'applique au moment de l'envoi, pas à la
  // composition : l'aperçu montre l'étiquette telle qu'elle est dessinée.
  const { turns } = labelRotation();
  return { bitmap: turns === 0 ? bitmap : rotateBitmap(bitmap, turns), verdict, geometry };
}

// ---------------------------------------------------------------------------
// Export d'images d'étiquettes
// ---------------------------------------------------------------------------

/**
 * Construit une fonction de mesure du texte, adossée à un canvas.
 *
 * On ne peut pas planifier sans connaître la largeur réelle des caractères :
 * une approximation ferait déborder les URL longues. Le canvas hors écran est
 * créé une fois, puis réutilisé pour toutes les étiquettes.
 *
 * @param {number} fontSizePx
 * @returns {(text: string) => number}
 */
function createTextMeasure(fontSizePx) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const fontFamily = '-apple-system, system-ui, "Helvetica Neue", Arial, sans-serif';
  ctx.font = `${fontSizePx}px ${fontFamily}`;
  return (text) => ctx.measureText(text).width;
}

/** Mesures de texte réutilisées d'un rendu à l'autre, par taille de police. */
const textMeasureCache = new Map();

/**
 * Mesure de texte pour une taille de police donnée, mémoïsée.
 *
 * `buildSheetPages` est rappelé à chaque déplacement du curseur : recréer un
 * canvas à chaque fois serait du gaspillage pur.
 *
 * @param {number} fontSizePx
 * @returns {(text: string) => number}
 */
function cachedTextMeasure(fontSizePx) {
  const key = String(fontSizePx);
  if (!textMeasureCache.has(key)) textMeasureCache.set(key, createTextMeasure(fontSizePx));
  return textMeasureCache.get(key);
}

/**
 * Lit les préférences de mise en page du formulaire.
 *
 * Le contenu de l'étiquette vient des **cases**, et d'elles seules : le numéro,
 * le titre, l'URL et le domaine se cumulent, comme dans l'onglet Niimbot. La
 * liste « Texte imprimé » et la case « Titre » qui la complétait répondaient à la
 * même question qu'elles, en deux autres endroits.
 *
 * @returns {{ format: object, showIndex: boolean, showTitle: boolean, showUrl: boolean, showHost: boolean, dateMode: string, marginMm: number, fontSizePt: number, cutMarks: boolean }}
 */
function readLabelOptions() {
  return {
    format: findFormat(el.labelFormat.value),
    showIndex: el.exportIndex.checked,
    showTitle: el.exportTitle.checked,
    showUrl: el.exportUrl.checked,
    showHost: el.exportHost.checked,
    dateMode: exportDateMode(),
    marginMm: Math.max(0, Number(el.labelMargin.value) || 0),
    fontSizePt: Math.max(4, Number(el.labelFont.value) || 7),
    cutMarks: el.labelCut.checked,
  };
}

/**
 * Dessine une étiquette dans un contexte 2D.
 *
 * Le rendu se fait par plus proche voisin : un QR Code lissé devient illisible.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} plan
 * @param {string} url
 * @param {{ cutMarks?: boolean }} [options]
 */
function drawLabelCanvas(ctx, plan, url, options = {}) {
  const fontFamily = '-apple-system, system-ui, "Helvetica Neue", Arial, sans-serif';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, plan.widthPx, plan.heightPx);

  // QR Code, centré horizontalement.
  const matrix = encodeQr(url, { ecc: 'M', border: 2 });
  const x0 = Math.floor((plan.widthPx - plan.qrSizePx) / 2);
  ctx.fillStyle = '#000000';
  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (!matrix.data[y][x]) continue;
      ctx.fillRect(
        x0 + x * plan.qrScale,
        plan.marginPx + y * plan.qrScale,
        plan.qrScale,
        plan.qrScale,
      );
    }
  }

  // Textes, centrés.
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `${plan.fontSizePx}px ${fontFamily}`;
  plan.lines.forEach((line, index) => {
    ctx.fillText(
      line,
      plan.widthPx / 2,
      plan.textTopPx + index * plan.lineHeightPx,
      plan.widthPx - plan.marginPx * 2,
    );
  });

  if (options.cutMarks) {
    ctx.strokeStyle = '#c8c8c8';
    ctx.lineWidth = Math.max(1, Math.round(plan.widthPx / 200));
    ctx.strokeRect(0.5, 0.5, plan.widthPx - 1, plan.heightPx - 1);
  }
}

/**
 * Rend une étiquette en PNG.
 *
 * @param {import('./core/link.js').LinkRecord} link
 * @param {object} options
 * @returns {Promise<{ png: Uint8Array, plan: object }>}
 */
async function renderLabelPng(link, options) {
  const fontSizePx = Math.max(6, ptToPx(options.fontSizePt, options.format.dpi));
  const plan = planLabel({
    link,
    format: options.format,
    measure: createTextMeasure(fontSizePx),
    showIndex: options.showIndex,
    showTitle: options.showTitle,
    showUrl: options.showUrl,
    showHost: options.showHost,
    // Le numéro imprimé est celui de la **collection**, et non la place du lien
    // dans la sélection : c'est le même chiffre partout — liste, planche,
    // tableau, étiquette, dossier d'images.
    index: linkRanks.get(link.id) ?? null,
    // Sans cette ligne, la date choisie dans l'interface était silencieusement
    // ignorée : les réglages consignés la mentionnaient, mais ni l'aperçu ni
    // les images ne la portaient.
    dateMode: options.dateMode,
    marginMm: options.marginMm,
    fontSizePt: options.fontSizePt,
  });

  const canvas = document.createElement('canvas');
  canvas.width = plan.widthPx;
  canvas.height = plan.heightPx;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  drawLabelCanvas(ctx, plan, link.url, { cutMarks: options.cutMarks });

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error(t('Le navigateur n\'a pas pu encoder l\'image.'));
  return { png: new Uint8Array(await blob.arrayBuffer()), plan };
}

/** Aperçu de la première étiquette sélectionnée. */
function renderImagePreview(link) {
  if (!link) {
    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = t('Ajoutez des liens pour voir un aperçu.');
    el.preview.appendChild(note);
    return;
  }

  const options = readLabelOptions();
  const fontSizePx = Math.max(6, ptToPx(options.fontSizePt, options.format.dpi));
  const plan = planLabel({
    link,
    format: options.format,
    measure: createTextMeasure(fontSizePx),
    showIndex: options.showIndex,
    showTitle: options.showTitle,
    showUrl: options.showUrl,
    showHost: options.showHost,
    // Le numéro imprimé est celui de la **collection**, et non la place du lien
    // dans la sélection : c'est le même chiffre partout — liste, planche,
    // tableau, étiquette, dossier d'images.
    index: linkRanks.get(link.id) ?? null,
    // Sans cette ligne, la date choisie dans l'interface était silencieusement
    // ignorée : les réglages consignés la mentionnaient, mais ni l'aperçu ni
    // les images ne la portaient.
    dateMode: options.dateMode,
    marginMm: options.marginMm,
    fontSizePt: options.fontSizePt,
  });

  const canvas = document.createElement('canvas');
  canvas.width = plan.widthPx;
  canvas.height = plan.heightPx;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  drawLabelCanvas(ctx, plan, link.url, { cutMarks: options.cutMarks });

  // La même échelle que l'onglet Niimbot, calculée au même endroit : bornée par
  // un **multiple de la taille réelle** et annoncée. Un plafond de « 6 » donnait
  // six fois la taille réelle sans le dire — le défaut même qu'on avait corrigé
  // d'un côté et laissé de l'autre.
  const available = Math.max(1, largeurUtileApercu() - 20);
  const echelle = labelPreviewZoom({
    widthPx: plan.widthPx,
    dpi: options.format.dpi,
    availablePx: available,
    realSize: el.exportRealSize.checked,
  });
  const scale = echelle.zoom;

  const frame = document.createElement('div');
  frame.className = 'preview__page';
  frame.style.padding = '10px';

  const shown = canvas;
  shown.style.width = `${Math.round(plan.widthPx * scale)}px`;
  shown.style.height = `${Math.round(plan.heightPx * scale)}px`;
  shown.style.imageRendering = scale < 1 ? 'auto' : 'pixelated';
  frame.appendChild(shown);

  const largeurMm = options.format.widthMm.toFixed(1);
  const hauteurMm = pxToMm(plan.heightPx, options.format.dpi).toFixed(1);
  const echelleNote = echelle.multiple > 1.05
    ? t('Aperçu à {multiple} × la taille réelle ({width} × {height} mm).', {
      multiple: echelle.multiple.toFixed(1),
      width: largeurMm,
      height: hauteurMm,
    })
    : t('Aperçu à la taille réelle ({width} × {height} mm).', {
      width: largeurMm,
      height: hauteurMm,
    });

  // Même légende que l'onglet Niimbot : **une information par ligne**, sous
  // l'aperçu. Une seule ligne les noyait les unes dans les autres.
  const caption = document.createElement('div');
  caption.className = 'hint preview__caption';
  const faits = [plan.fits
    ? t('{width} mm × {height} px — {widthPx} × {heightPx} px à {dpi} dpi', {
      width: options.format.widthMm,
      height: plan.heightPx,
      widthPx: plan.widthPx,
      heightPx: plan.heightPx,
      dpi: options.format.dpi,
    })
    : t('URL trop longue pour ce format : le QR Code fait {size} px pour {width} px de large.', {
      size: plan.qrSizePx,
      width: plan.widthPx,
    }), echelleNote];
  if (plan.dateOmitted) {
    faits.push(t('Date non imprimée : elle ne tient pas sur ce format, réduisez la taille du texte.'));
  }
  caption.replaceChildren(...faits.map((fait) => ligneDeLegende(fait)));
  if (!plan.fits) caption.style.color = 'var(--danger)';
  // Même règle que pour l'étiquette Niimbot : l'information est **hors** du
  // cadre qui figure ce qui sera imprimé.
  el.preview.appendChild(frame);
  el.preview.appendChild(caption);

  el.preview.appendChild(frame);
}

/** Exporte le dossier d'images prêt à imprimer. */
async function exportLabelImages() {
  const items = printableLinks();
  if (items.length === 0) return;

  const options = readLabelOptions();
  el.exportLabels.disabled = true;

  try {
    const planned = planLabels(items, {
      format: options.format,
      showIndex: options.showIndex,
      showTitle: options.showTitle,
      showUrl: options.showUrl,
      showHost: options.showHost,
      dateMode: options.dateMode,
      marginMm: options.marginMm,
      fontSizePt: options.fontSizePt,
      measure: createTextMeasure(
        Math.max(6, ptToPx(options.fontSizePt, options.format.dpi)),
      ),
      // Le rang de la collection, celui que porte le reste de l'application —
      // sans lui, la case « N° du lien » imprimerait la place du lien dans la
      // sélection, et deux numérotations se contrediraient sur le même objet.
      rankOf: (link, index) => linkRanks.get(link.id) ?? index + premierNumero(),
    });

    const images = new Map();
    for (const [index, entry] of planned.entries()) {
      el.exportLabels.textContent = t('Étiquette {index}/{total}…', {
        index: index + 1,
        total: planned.length,
      });
      const { png } = await renderLabelPng(entry.link, options);
      images.set(entry.fileName, png);
    }

    el.exportLabels.textContent = t('Assemblage…');
    const name = collectionName();
    const archive = buildLabelArchive({
      planned,
      images,
      settings: { ...options, title: name },
    });

    const filename = labelArchiveName(Date.now(), name);
    const ok = downloadBytes(filename, archive, { mime: 'application/zip' });
    toast(
      ok
        ? tpl(
          planned.length,
          '{count} étiquette — {filename} enregistré',
          '{count} étiquettes — {filename} enregistré',
          { filename },
        )
        : t('Téléchargement impossible'),
      ok ? 'info' : 'error',
    );
  } catch (error) {
    toast(t('Export impossible : {message}', { message: error.message }), 'error');
  } finally {
    // Le libellé de repos est recalculé, et non restauré : la portée et le
    // nombre restent ceux de la collection au moment où l'on regarde.
    el.exportLabels.textContent = exportImagesLabel(items.length);
    el.exportLabels.disabled = items.length === 0;
  }
}

// ---------------------------------------------------------------------------
// Impression papier
// ---------------------------------------------------------------------------

/**
 * Le mode qui a rempli la racine d'impression, ou `null`.
 *
 * La racine n'est remplie qu'à la demande — au clic sur « Imprimer », ou par
 * `beforeprint`. Sans cette mémoire, un Ctrl+P après un changement d'onglet
 * imprimait les pages de **l'autre** mode : constaté dans le relevé du
 * 29 septembre 2026, où le PDF du tableau a été mesuré à cinq pages — celles de
 * la planche, restées dans la racine — au lieu des trois annoncées.
 *
 * @type {string|null}
 */
let modeRacineImpression = null;

/** Prépare la racine d'impression puis ouvre la boîte de dialogue système. */
function printSelection() {
  const items = printableLinks();
  if (items.length === 0) {
    toast(t('Aucun lien à imprimer'), 'error');
    return;
  }

  el.printRoot.textContent = '';

  if (mode === 'table') {
    // Le tableau s'imprime sur A4 : il n'a pas de cotes d'étiquette à honorer,
    // seulement un sens de feuille et des marges à fixer. Il se découpe en
    // autant de pages qu'il en faut — une seule boîte à la hauteur du papier
    // tranchait le contenu au bord de la feuille.
    const config = tablePageConfig();
    applyPrintPageSize(config.widthMm, config.heightMm);
    for (const page of buildTablePages(items)) el.printRoot.appendChild(page);
  } else {
    for (const page of buildSheetPages(items)) el.printRoot.appendChild(page);
  }
  modeRacineImpression = mode;

  // La boîte de dialogue est bloquante : on nettoie au retour pour ne pas
  // laisser une arborescence lourde dans le document.
  const cleanup = () => {
    el.printRoot.textContent = '';
    modeRacineImpression = null;
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);

  window.print();
}

// ---------------------------------------------------------------------------
// Impression Niimbot
// ---------------------------------------------------------------------------

/** Vérifie le support Bluetooth et affiche l'explication si absent. */
async function reportBluetoothSupport() {
  // `checkWebBluetoothSupport` seul ne suffisait pas : Brave expose
  // `navigator.bluetooth` tout en refusant de s'en servir quand son drapeau est
  // éteint. Le bouton semblait donc prêt, et l'échec n'arrivait qu'après le
  // clic, en anglais. `probeWebBluetooth` interroge le navigateur pour de bon.
  const support = await probeWebBluetooth();
  el.connect.disabled = !support.ok;

  el.bleSupport.hidden = support.ok;
  if (!support.ok) {
    el.bleSupport.textContent = `${support.reason} ${support.hint}`;
    // Une note manuscrite vaut mieux qu'un texte gris : c'est la cause
    // n° 1 des échecs de connexion, et elle se règle en deux minutes.
    el.printStatus.textContent = t('Impression directe indisponible — voir le message ci-dessus.');
  }
}

/** Ouvre le sélecteur puis établit la session d'impression. */
async function connectPrinter() {
  el.connect.disabled = true;
  el.printStatus.textContent = t('Recherche de l\'imprimante…');

  try {
    const device = await requestPrinter();
    transport = new NiimbotTransport(device);
    await transport.connect();

    printer = new NiimbotPrinter(transport);
    const { profile, modelId, reportedHeadPixels } = await printer.start();

    el.printerDot.className = 'dot dot--on';
    el.printerName.textContent = `${profile.id}${device.name ? ` — ${device.name}` : ''}`;
    el.connect.hidden = true;
    el.disconnect.hidden = false;
    el.printLabel.disabled = false;

    const details = [
      modelId !== null ? t('modèle {id}', { id: modelId }) : t('modèle non rapporté'),
      t('{count} px de tête', { count: profile.printheadPixels }),
    ];
    if (reportedHeadPixels !== null) details.push(t('largeur mesurée {count} px', { count: reportedHeadPixels }));
    el.printStatus.textContent = t('Connecté : {details}.', { details: details.join(', ') });

    // L'aperçu se cale sur le matériel présent : ce qu'on voit est ce qu'on
    // imprimera. Le sélecteur reste modifiable pour explorer un autre format.
    if (findProfile(profile.id)) el.labelProfile.value = profile.id;

    // Le catalogue suit le matériel réellement connecté : la tête rapportée par
    // la heartbeat fait foi, et proposer un rouleau qu'elle ne peut pas
    // imprimer n'aurait aucun sens.
    fillSupplies();

    device.addEventListener('gattserverdisconnected', handlePrinterLost);
    renderPreview();
  } catch (error) {
    el.printStatus.textContent = '';
    toast(explainBluetoothFailure(error), 'error');
    resetPrinter();
  } finally {
    el.connect.disabled = false;
  }
}

/** L'imprimante s'éteint en veille : on remet l'interface en cohérence. */
function handlePrinterLost() {
  toast(t('Imprimante déconnectée'), 'error');
  resetPrinter();
  renderPreview();
}

/** Réinitialise l'état d'impression. */
function resetPrinter() {
  transport = null;
  printer = null;
  el.printerDot.className = 'dot dot--off';
  el.printerName.textContent = t('Aucune imprimante connectée');
  el.connect.hidden = false;
  el.disconnect.hidden = true;
  el.printLabel.disabled = true;
  // Sans matériel, le catalogue revient à celui du format choisi : les
  // longueurs proposées ne doivent pas rester celles de l'imprimante partie.
  fillSupplies();
}

/** Coupe la liaison. */
async function disconnectPrinter() {
  try {
    await transport?.disconnect();
  } catch {
    // Une coupure déjà effective n'est pas une erreur.
  }
  resetPrinter();
  el.printStatus.textContent = '';
  renderPreview();
}

/** Imprime l'étiquette du premier lien sélectionné. */
/**
 * Compose et envoie une étiquette à l'imprimante connectée.
 *
 * Extrait pour que l'impression d'une étiquette et celle d'une série suivent le
 * même chemin :
 * une seule séquence d'envoi, donc une seule à corriger si le dialogue avec
 * l'imprimante change.
 *
 * @param {import('./core/link.js').LinkRecord} link
 * @param {{ copies?: number }} [options]
 * @returns {Promise<{ rows: number, frames: number, width: number, height: number }>}
 */
async function sendLabel(link, options = {}) {
  const { bitmap, verdict, geometry } = labelToBitmap(link, printer.profile);
  const validation = validateBitmap(bitmap, printer.profile);
  if (!validation.ok) {
    throw new Error(validation.reasons.join(' ; '));
  }
  if (!verdict.ok) {
    // On avertit sans bloquer : l'utilisateur reste maître de son impression.
    toast(verdict.reason, 'error');
  }

  const copies = options.copies ?? (Number(el.copies.value) || 1);
  const density = Number(el.density.value) || printer.profile.density.default;

  const result = await printer.print(bitmap, {
    density,
    copies,
    onProgress: ({ page }) => {
      el.printStatus.textContent = t('Impression {page}/{copies}…', { page, copies });
    },
  });

  return { ...result, width: geometry.width, height: geometry.height };
}

/** Imprime l'étiquette du lien choisi. */
/**
 * Imprime toute la collection, une étiquette après l'autre.
 *
 * Une étiquette qui échoue n'interrompt pas la série : elle est comptée, et le
 * bilan final dit combien sont sorties. Sur trente étiquettes, s'arrêter à la
 * troisième parce que la quatrième a raté serait pénible.
 */
/** Hauteur de texte minimale, en millimètres : c'est la lisibilité. */
const MIN_TEXT_MM = 1.6;

/** Plancher de lisibilité du texte, en pixels : 1,6 mm à 203 dpi. */
const MIN_FONT_PX = 6;

/** Nombre de lignes qu'une date peut occuper sous le QR Code, une fois découpée. */
const DATE_LINES_MAX = 2;

/** Vrai pendant une série : le bouton sert alors à l'interrompre. */
let seriesRunning = false;

async function printLabels() {
  if (!printer) {
    toast(t('Aucune imprimante connectée'), 'error');
    return;
  }

  const { kind, items } = impressionChoisie();
  if (items.length === 0) {
    toast(kind === 'one'
      ? t('Aucun lien dans la collection')
      : t('Aucun lien coché : cochez les étiquettes à imprimer, ou choisissez « toute la collection »'), 'error');
    return;
  }

  const copies = copiesCount();
  el.printLabel.disabled = true;

  // Une seule étiquette ne mérite pas la mécanique d'une série : pas de
  // compteur de progression, pas de bouton d'arrêt, et un bilan qui parle
  // d'étiquettes plutôt que de liens parcourus.
  if (kind === 'one' && copies === 1) {
    el.printStatus.textContent = t('Envoi en cours…');
    try {
      const result = await sendLabel(items[0]);
      el.printStatus.textContent = t('Étiquette imprimée : {rows} lignes, {frames} trames.', {
        rows: result.rows,
        frames: result.frames,
      });
    } catch (error) {
      el.printStatus.textContent = '';
      toast(error.message ?? t('Impression impossible'), 'error');
    } finally {
      updatePrintScope();
    }
    return;
  }

  // Le bouton devient l'arrêt de la série : trente étiquettes lancées par erreur
  // ne doivent pas obliger à couper l'imprimante.
  el.printLabel.textContent = t('Arrêter');
  seriesRunning = true;

  let printed = 0;
  const failures = [];

  try {
    for (const [index, link] of items.entries()) {
      if (!seriesRunning) break;
      el.printStatus.textContent = t('Étiquette {index}/{total} — {title}', {
        index: index + 1,
        total: items.length,
        title: link.title || link.url,
      });
      try {
        await sendLabel(link, { copies });
        printed += copies;
      } catch (error) {
        failures.push(error.message ?? t('impression impossible'));
      }
    }

    // Le compte porte sur les étiquettes réellement sorties, pas sur les liens
    // parcourus : avec deux exemplaires, dix liens font vingt étiquettes.
    const parts = [tpl(printed, '{count} étiquette imprimée', '{count} étiquettes imprimées')];
    if (!seriesRunning) parts.push(t('série arrêtée'));
    if (failures.length > 0) parts.push(t('{count} en échec — {message}', { count: failures.length, message: failures[0] }));
    el.printStatus.textContent = parts.join(', ') + '.';
    toast(parts.join(', '), failures.length > 0 ? 'error' : 'info');
  } finally {
    seriesRunning = false;
    // Le libellé revient à la portée courante : le remettre à la main pourrait
    // annoncer autre chose que ce que le clic suivant fera.
    updatePrintScope();
  }
}

// ---------------------------------------------------------------------------
// Câblage
// ---------------------------------------------------------------------------

function fillPresets() {
  // Regroupés par famille : une planche générique se règle, une planche Avery
  // se choisit par la référence imprimée sur l'emballage.
  for (const group of SHEET_GROUPS) {
    const entries = Object.entries(SHEET_PRESETS).filter(([, p]) => p.group === group.id);
    if (entries.length === 0) continue;

    const optgroup = document.createElement('optgroup');
    optgroup.label = t(group.label);
    for (const [key, preset] of entries) {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = t(preset.label);
      optgroup.appendChild(option);
    }
    el.preset.appendChild(optgroup);
  }
  el.preset.value = DEFAULT_SHEET_PRESET;

  // Les six champs partent des cotes de la première disposition ; en changer
  // les réécrit.
  prefillGridFields();
}

/**
 * Remplit le choix du format d'étiquette Niimbot.
 *
 * Ce choix pilote l'aperçu, pas l'impression : celle-ci utilise toujours le
 * profil du matériel réellement connecté, pour qu'un aperçu ne puisse jamais
 * faire imprimer à la mauvaise largeur.
 */
function fillProfiles() {
  for (const profile of PROFILES) {
    const option = document.createElement('option');
    option.value = profile.id;
    const printableMm = Math.round((profile.printheadPixels / profile.dpi) * 25.4);
    option.textContent = t('Niimbot {id} — {mm} mm utiles, {dpi} dpi', {
      id: profile.id,
      mm: printableMm,
      dpi: profile.dpi,
    });
    el.labelProfile.appendChild(option);
  }
  el.labelProfile.value = DEFAULT_PROFILE.id;
  fillSupplyChoices();
}

/**
 * Le profil dont on remplit les consommables : celui du matériel réellement
 * connecté quand il y en a un, sinon celui choisi pour l'aperçu.
 *
 * Avant connexion, tout le catalogue reste proposé, et c'est le profil choisi
 * qui juge la compatibilité : on veut pouvoir préparer un format avant d'avoir
 * l'imprimante sous la main.
 */
function supplyProfile() {
  return printer?.profile ?? findProfile(el.labelProfile.value) ?? DEFAULT_PROFILE;
}

/**
 * Propose les consommables du profil retenu.
 *
 * Chaque consommable porte ses deux cotes. La longueur n'est donc plus une
 * question posée à côté du format : elle vient du rouleau choisi. Le rouleau
 * continu, lui, n'a pas de pas connu — c'est le seul cas où la longueur reste
 * à saisir.
 */
function fillSupplies() {
  const supplies = compatibleSupplies(supplyProfile());
  const previous = el.labelSupply.value;

  el.labelSupply.textContent = '';
  for (const supply of supplies) {
    const option = document.createElement('option');
    option.value = supply.id;
    const length = supply.lengthMm === null
      ? t('longueur libre')
      : `${supply.lengthMm} mm`;
    // La raison est affichée dès qu'il y en a une, compatible ou non : un
    // rouleau plus large que la tête imprime avec une marge, et l'utilisateur
    // doit le savoir sans que l'option soit écartée.
    option.textContent = `${t(supply.label)} — ${length}`
      + (supply.reason === '' ? '' : ` (${t(supply.reason)})`);
    // Un consommable que la tête ne peut pas atteindre reste visible, mais ne
    // peut pas être choisi : le faire disparaître ferait croire à une option
    // manquante.
    option.disabled = !supply.compatible;
    el.labelSupply.appendChild(option);
  }

  // Le choix précédent est conservé s'il existe encore et reste compatible.
  const keep = supplies.find((supply) => supply.id === previous && supply.compatible)
    ?? supplies.find((supply) => supply.compatible)
    ?? supplies[0];
  if (keep) el.labelSupply.value = keep.id;

  updateSupplyLength();
}

/** Le consommable retenu, ou `undefined` si le catalogue est vide. */
function chosenSupply() {
  return compatibleSupplies(supplyProfile())
    .find((supply) => supply.id === el.labelSupply.value);
}

/**
 * Affiche ou masque la longueur libre, selon le consommable choisi.
 *
 * Un rouleau à longueur fixe impose la sienne : le champ disparaît, et la
 * longueur vient du catalogue. Un rouleau continu laisse la place libre.
 */
/** Rappelle ce que le consommable impose, sans rien demander à l'utilisateur. */
function updateSupplyLength() {
  const supply = chosenSupply();
  const longueur = supply?.lengthMm ?? null;
  el.supplyHint.textContent = longueur === null
    ? t('Rouleau continu : la longueur suit le contenu.')
    : t('Longueur imposée par le rouleau : {mm} mm.', { mm: longueur });
}

/** Propose les dispositions applicables au format retenu. */
function fillLayouts() {
  const profil = previewProfile();
  const disponibles = layoutsFor(profil);
  const precedent = el.labelRotation.value;

  el.labelRotation.textContent = '';
  for (const disposition of disponibles) {
    const option = document.createElement('option');
    option.value = disposition.id;
    option.textContent = t(disposition.label);
    el.labelRotation.appendChild(option);
  }

  // On garde le choix précédent s'il reste applicable.
  el.labelRotation.value = disponibles.some((entry) => entry.id === precedent)
    ? precedent
    : 'dessous';
}

/** Remplit la disposition verticale, puis les longueurs suggérées. */
function fillSupplyChoices() {
  el.labelAlignment.textContent = '';
  for (const alignment of LABEL_ALIGNMENTS) {
    const option = document.createElement('option');
    option.value = alignment.id;
    option.textContent = t(alignment.label);
    el.labelAlignment.appendChild(option);
  }
  el.labelAlignment.value = DEFAULT_LABEL_ALIGNMENT;
  fillSupplies();
}

/**
 * Rappelle qu'une date a été écartée faute de place.
 *
 * Sans ce message, l'option semblerait sans effet : l'utilisateur croirait à un
 * défaut plutôt qu'à une contrainte de largeur, alors que réduire la taille du
 * texte suffit à la faire tenir.
 *
 * @returns {string} phrase à ajouter à la légende, ou chaîne vide.
 */
function composeDateNote() {
  if (dateMode() === 'none') return '';
  return t(' — aucune date : elle ne tient pas sur une ligne à cette taille de texte.');
}

/**
 * Remplit les choix propres à l'étiquette Niimbot.
 *
 * Le contenu réutilise le vocabulaire de l'export d'images : une seule chose à
 * apprendre pour les deux onglets.
 */
function fillLabelChoices() {
  fillLayouts();

  // Le contenu se coche, il ne se choisit plus dans une liste : titre, URL et
  // numéro se cumulent, une liste déroulante n'en acceptait qu'un.

  // Sens de la feuille pour le tableau imprimé.
  for (const [id, label] of [['portrait', 'Portrait'], ['landscape', 'Paysage']]) {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = t(label);
    el.tableOrientation.appendChild(option);
  }
  el.tableOrientation.value = 'portrait';

}

/** Vocabulaire de l'étiquette, plus explicite que celui de l'export. */
const LABEL_CONTENT_LABELS = Object.freeze({
  none: 'QR Code seul',
  title: 'QR Code + titre',
  url: 'QR Code + URL',
  'title-url': 'QR Code + titre + URL',
  host: 'QR Code + domaine',
});

/**
 * Remplit la liste des liens imprimables.
 *
 * Sans elle, l'onglet imprimait toujours le premier lien de la collection : on
 * ne pouvait pas choisir ce qu'on imprimait.
 */
function fillLabelLinks() {
  const previous = el.labelLink.value;
  el.labelLink.textContent = '';

  // Deux groupes dans **une** liste : un lien à la fois, ou plusieurs. Le
  // séparateur visuel suffit à faire comprendre qu'une seule réponse est
  // attendue, là où deux listes déroulantes laissaient croire à deux réglages.
  const un = document.createElement('optgroup');
  un.label = t('Un seul lien');
  for (const link of links) {
    const option = document.createElement('option');
    option.value = link.id;
    // Le rang est celui affiché dans la liste et le tableau : on s'y retrouve.
    option.textContent = `${linkRanks.get(link.id) ?? '?'}. `
      + (link.title || hostOf(link.url) || link.url);
    option.title = link.url;
    un.appendChild(option);
  }
  el.labelLink.appendChild(un);

  const plusieurs = document.createElement('optgroup');
  plusieurs.label = t('Plusieurs');
  const coches = links.filter((link) => selected.has(link.id)).length;
  for (const [valeur, libelle] of [
    [PORTEE_TOUT, tpl(links.length, 'Toute la collection ({count} lien)',
      'Toute la collection ({count} liens)', { count: links.length })],
    [PORTEE_COCHEE, tpl(coches, 'Seulement ceux que je coche ({count} lien coché)',
      'Seulement ceux que je coche ({count} liens cochés)', { count: coches })],
  ]) {
    const option = document.createElement('option');
    option.value = valeur;
    option.textContent = libelle;
    plusieurs.appendChild(option);
  }
  el.labelLink.appendChild(plusieurs);

  // La portée « seulement ceux que je coche » **reste choisie même sans rien de
  // coché**. Elle était désactivée dans ce cas, et le sélecteur retombait
  // silencieusement sur le premier lien : l'aperçu se mettait alors à juger un
  // lien que personne n'avait choisi, message rouge compris, alors que
  // l'intention — « rien de coché » — était de n'imprimer rien. Le panneau dit
  // maintenant ce qui se passe : rien ne sortira, et pourquoi.
  const encoreValable = links.some((link) => link.id === previous)
    || previous === PORTEE_TOUT
    || previous === PORTEE_COCHEE;
  if (encoreValable) el.labelLink.value = previous;
  el.labelLink.disabled = links.length === 0;
  updateLabelContentHint();
}

/** Explique ce qui sera imprimé sous le QR Code, d'après les cases cochées. */
function updateLabelContentHint() {
  const choisis = [];
  if (el.labelShowIndex.checked) choisis.push(t('le numéro du lien'));
  if (el.labelShowTitle.checked) choisis.push(t('le titre'));
  if (el.labelShowUrl.checked) choisis.push(t('l\'URL'));
  if (el.labelShowHost.checked) choisis.push(t('le domaine'));
  if (el.labelShowDate.checked) {
    choisis.push(el.labelDateTime.checked ? t('la date et l\'heure') : t('la date de collecte'));
  }

  if (choisis.length === 0) {
    el.labelContentHint.textContent = t('Le QR Code seul, sans texte sous lui.');
    return;
  }
  el.labelContentHint.textContent = t(
    'Sous le QR Code : {list}. Le texte est découpé à la largeur de la tête.',
    { list: choisis.join(', ') },
  );
}

/**
 * Tourne un canevas d'un nombre de quarts de tour.
 *
 * L'aperçu et l'impression doivent tourner de la même façon : deux implémentations
 * divergeraient, et l'aperçu ne montrerait plus ce qui sort.
 *
 * @param {HTMLCanvasElement} source
 * @param {number} turns Quarts de tour dans le sens horaire.
 * @returns {HTMLCanvasElement}
 */
function rotateCanvas(source, turns) {
  const quarters = ((turns % 4) + 4) % 4;
  const swap = quarters % 2 === 1;
  const canvas = document.createElement('canvas');
  canvas.width = swap ? source.height : source.width;
  canvas.height = swap ? source.width : source.height;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((quarters * Math.PI) / 2);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  return canvas;
}

/**
 * La disposition retenue : comment le QR Code et son texte s'organisent.
 *
 * Ce n'est **pas** une orientation du support : l'étiquette garde sa taille et
 * son sens. Seule la composition change, pour que le texte reste lisible selon
 * la forme du rouleau.
 *
 * @returns {typeof LABEL_LAYOUTS[number]}
 */
function labelLayout() {
  return LABEL_LAYOUTS.find((entry) => entry.id === el.labelRotation.value)
    ?? LABEL_LAYOUTS[0];
}

/** Aucune rotation d'image : le support garde son sens, seule la mise en page
 * change. On ne tourne donc jamais le bitmap avant envoi. */
function labelTurns() {
  return 0;
}

/** L'orientation retenue à l'impression, pour la rotation du bitmap. */
function labelRotation() {
  return { turns: labelTurns(), label: labelLayout().label };
}

/**
 * Ce que le sélecteur unique désigne, et les liens que cela représente.
 *
 * Une seule question — « ce qu'on imprime » — pour trois réponses possibles :
 * un lien, toute la collection, ou la sélection cochée. La série et
 * l'impression d'une étiquette passent donc par le même chemin, ce qui était
 * l'objet du regroupement : un couple de champs et un bouton.
 *
 * @returns {{ kind: 'one'|'all'|'selected', items: import('./core/link.js').LinkRecord[] }}
 */
function impressionChoisie() {
  if (links.length === 0) return { kind: 'one', items: [] };
  const choix = el.labelLink.value;
  if (choix === PORTEE_TOUT) return { kind: 'all', items: [...links] };
  if (choix === PORTEE_COCHEE) {
    return { kind: 'selected', items: links.filter((link) => selected.has(link.id)) };
  }
  const link = links.find((entree) => entree.id === choix) ?? links[0];
  return { kind: 'one', items: link ? [link] : [] };
}

/** Le lien montré dans l'aperçu : le premier de ce qui sera imprimé. */
function chosenLabelLink() {
  return impressionChoisie().items[0];
}

/** Le profil retenu pour l'aperçu : celui du matériel, ou celui choisi. */
function previewProfile() {
  // Le format choisi fait foi, même quand une imprimante est connectée :
  // vouloir regarder un autre format est légitime, et ignorer le choix donnait
  // l'impression que la liste ne servait à rien. Sans choix, on prend le
  // matériel présent, puis le format par défaut.
  return findProfile(el.labelProfile.value) ?? printer?.profile ?? DEFAULT_PROFILE;
}

/**
 * La taille du QR Code est-elle réglable sur cette tête ?
 *
 * Sur une tête de 12 mm, le QR Code occupe déjà toute la largeur utile : un champ
 * qui ne peut rien changer est une commande sans effet, et le projet les retire
 * plutôt que de les laisser mentir. Le seuil est celui qui sert déjà à écarter
 * « Texte à droite du QR Code » — une tête assez large pour avoir le choix.
 *
 * @param {{ printheadPixels?: number }} profile
 * @returns {boolean}
 */
function qrReglable(profile) {
  return (profile?.printheadPixels ?? 0) >= 200;
}

/** La demande de taille de QR Code, en pixels pour le profil courant. */
function qrDemande(profile) {
  const veut = qrReglable(profile);
  if (el.labelQrField) el.labelQrField.hidden = !veut;
  if (!veut) return null;
  const mm = Number(el.labelQrSize?.value);
  if (!Number.isFinite(mm) || mm <= 0) return null;
  return Math.max(6, Math.round((mm / 25.4) * profile.dpi));
}

/** Explique avec quel profil l'aperçu est composé, et ce qui sera imprimé. */
function updateProfileHint() {
  const profile = previewProfile();
  const selected = findProfile(el.labelProfile.value) ?? DEFAULT_PROFILE;
  const printableMm = ((profile.printheadPixels / profile.dpi) * 25.4).toFixed(1);

  if (!printer) {
    el.profileHint.textContent = t(
      'Aperçu composé avec le {profile} ({mm} mm utiles, {dpi} dpi), sans imprimante connectée : les dimensions et le nombre de modules sont exacts.',
      { profile: profile.id, mm: printableMm, dpi: profile.dpi },
    );
    return;
  }
  const connected = printer.profile;
  el.profileHint.textContent = connected.id === profile.id
    ? t('Imprimante connectée : {id}. Aperçu et impression identiques.', { id: connected.id })
    : t(
      "Imprimante connectée : {id}. L'aperçu montre le {profile} choisi ; « Imprimer » se fera au format du {connected}.",
      { id: connected.id, profile: profile.id, connected: connected.id },
    );
}

/** Remplit la liste des formats d'étiquette. */
function fillLabelForm() {
  for (const format of LABEL_FORMATS) {
    const option = document.createElement('option');
    option.value = format.id;
    option.textContent = t(format.name);
    el.labelFormat.appendChild(option);
  }
  el.labelFormat.value = 'niimbot-d110';
}

function switchMode(next) {
  mode = next;
  for (const tab of document.querySelectorAll('.tab')) {
    const active = tab.dataset.mode === next;
    tab.classList.toggle('tab--active', active);
    tab.setAttribute('aria-selected', String(active));
  }
  for (const panel of document.querySelectorAll('[data-mode-panel]')) {
    panel.hidden = panel.dataset.modePanel !== next;
  }
  renderPreview();
}

el.addForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addFromInput();
});

el.search.addEventListener('input', renderList);

el.sortMode.addEventListener('change', async () => {
  preferences = settings.save({ sortMode: el.sortMode.value });
  await refresh();
  updateSortHint();
});

// Le rangement s'ouvre, se referme, et se quitte au clavier. Échap est le
// pendant de ce qui se fait à la souris : sans lui, on ne sortirait du mode
// qu'en visant le bouton.
el.moveTo.addEventListener('click', () => {
  if (el.moveMenu.hidden) openMoveMenu();
  else closeMoveMenu();
});

// `Échap` referme le panneau et rend le focus à son bouton : le geste attendu
// d'un panneau qu'on a ouvert, et le seul moyen d'en sortir sans choisir.
el.moveGroup.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeMoveMenu();
  }
});

el.reorder.addEventListener('click', () => {
  setReorderMode(!reorderMode);
  el.reorder.focus();
});

el.list.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !reorderMode) return;
  setReorderMode(false);
  el.reorder.focus();
});

// Le premier numéro : appliqué à la frappe quand il est exploitable, et remis
// en forme au changement. Un champ vidé ou hors bornes n'est pas une valeur —
// la collection garde alors le dernier numéro valide, plutôt que de sauter à 1
// au milieu d'une saisie. Le bornage lui-même est celui du cœur : le refaire
// ici ferait deux règles à tenir d'accord.
function appliquerPremierNumero(redessiner) {
  const saisi = el.collectionStart.value.trim();
  // Un champ vidé n'est pas une valeur : la collection garde la dernière
  // valide pendant qu'on retape, au lieu de passer par zéro.
  if (saisi === '') return false;
  const brut = Number(saisi);
  if (!Number.isFinite(brut)) return false;

  const voulu = cleanStartIndex(brut);
  if (voulu === premierNumero()) return false;

  // Le numéro est une **vue**, comme le tri : il ne touche ni la collection ni
  // l'ordre enregistré. On redessine donc la liste et l'aperçu sans relire le
  // magasin — mais il faut bien écrire le réglage, pour qu'il survive à la
  // bascule et au rechargement.
  const collection = activeCollection();
  if (collection) collection.startIndex = voulu;
  sauverNumeroDiffere();
  if (redessiner) {
    linkRanks = new Map(links.map((link, index) => [link.id, index + premierNumero()]));
    renderList();
    renderPreview();
  }
  return true;
}

/** Écrit le premier numéro de la collection affichée. */
async function saveStartIndex() {
  const collection = activeCollection();
  if (!collection) return;
  const ecrit = await collections.setStartIndex(activeCollectionId, collection.startIndex);
  if (ecrit) Object.assign(collection, ecrit);
}

el.collectionStart.addEventListener('input', () => {
  appliquerPremierNumero(Boolean(el.collectionStart.value.trim()));
});

// Au changement — sortie du champ, flèches du compteur — on écrit sans attendre
// et on remet le champ en forme : il ne doit pas afficher un nombre que la
// collection n'utilise pas.
el.collectionStart.addEventListener('change', () => {
  appliquerPremierNumero(true);
  saveStartIndex().catch(() => {});
  el.collectionStart.value = String(premierNumero());
});

/**
 * Diffère une écriture, puis n'en garde qu'une.
 *
 * Le nom et la note s'enregistrent à la frappe — perdre une correction serait
 * agaçant — mais chaque frappe réécrit le document des collections **entier**.
 * Sans ce délai, deux écritures lancées coup sur coup pourraient se terminer
 * dans le désordre, et la première gagnerait : c'est la dernière frappe qu'on
 * veut voir enregistrée, pas la plus lente.
 *
 * @param {() => Promise<void>} action
 * @param {number} [ms]
 * @returns {() => void}
 */
function debounced(action, ms = 400) {
  let timer = null;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      action().catch(() => {});
    }, ms);
  };
}

/**
 * Écrit le nom de la collection affichée, et suit l'affichage.
 *
 * **Un champ vidé est un nom vide**, et non une écriture à ignorer : c'était le
 * défaut — vider le champ laissait le nom précédent en place, et rien ne le
 * disait. Le nom vide est enregistré comme tel ; la liste et les exports
 * retombent alors sur le libellé intégré, et l'aide sous le sélecteur l'annonce.
 */
async function saveCollectionName() {
  const saisi = el.collectionName.value.trim();
  if (!collections.available) return;
  if (saisi === (activeCollection()?.name ?? '')) return;
  try {
    await collections.rename(activeCollectionId, saisi);
    visibleCollectionsList = await collections.visible({ isPrivate: appPrivateContext() });
    fillCollections();
    applyCollectionName();
  } catch (error) {
    // Un nom déjà pris est refusé : on le dit, et le champ revient au nom
    // réellement enregistré — sinon l'écran afficherait un nom qui n'existe pas.
    toast(error?.message ?? t('Renommage impossible'), 'error');
    el.collectionName.value = activeCollection()?.name ?? '';
  }
}

/** Écrit la note de la collection affichée. */
async function saveCollectionNote() {
  const note = collectionNote();
  if (note === (activeCollection()?.note ?? '')) return;
  await collections.setNote(activeCollectionId, note);
  visibleCollectionsList = await collections.visible({ isPrivate: appPrivateContext() });
}

const sauverNomDiffere = debounced(saveCollectionName);
const sauverNoteDifferee = debounced(saveCollectionNote);
const sauverNumeroDiffere = debounced(saveStartIndex);

el.collectionName.addEventListener('input', () => {
  applyCollectionName();
  // Sur la page autonome, le nom est un réglage : `rename` l'y écrit. Dans
  // l'extension, il appartient à la collection affichée.
  if (collections.available) sauverNomDiffere();
  else settings.save({ collectionName: collectionName() });
});

// À la sortie du champ, on écrit sans attendre : le délai est un confort de
// frappe, pas une raison de perdre la dernière correction.
el.collectionName.addEventListener('change', () => {
  if (collections.available) saveCollectionName().catch(() => {});
});

// La note suit la même règle, à la frappe : c'est un paragraphe, pas une
// commande, et rien n'oblige à valider. Elle est réenregistrée telle quelle —
// bornée à la longueur admise — et redessine l'aperçu, puisque les en-têtes
// imprimés la portent.
el.collectionNote.addEventListener('input', () => {
  if (collections.available) sauverNoteDifferee();
  else settings.save({ collectionNote: collectionNote() });
  // La note décide de l'état de la case qui l'imprime : elle doit suivre à la
  // frappe, et pas seulement au prochain rendu de la liste.
  updateHeaderNoteOptions();
  renderPreview();
});

el.collectionNote.addEventListener('change', () => {
  if (collections.available) saveCollectionNote().catch(() => {});
});

el.collectionSelect.addEventListener('change', () => {
  switchCollection(el.collectionSelect.value);
});

el.collectionAdd.addEventListener('click', createAppCollection);

el.collectionDelete.addEventListener('click', () => {
  // La confirmation se referme toute seule : un bouton resté armé détruirait la
  // collection au moindre clic ultérieur, et rien ne le signalerait.
  deleteAppCollection().then(() => {
    clearTimeout(deleteConfirmTimer);
    if (el.collectionDelete.dataset.confirm === '1') {
      deleteConfirmTimer = setTimeout(() => {
        el.collectionDelete.dataset.confirm = '';
        el.collectionDelete.textContent = t('Supprimer');
      }, 5000);
    }
  });
});

el.selectAllBox.addEventListener('change', () => {
  // Une case indéterminée devient cochée au clic : la cocher sélectionne tout,
  // la décocher vide la sélection. Dans les deux cas l'état de la case dit
  // exactement ce qui vient de se passer.
  selected = el.selectAllBox.checked
    ? new Set(links.map((link) => link.id))
    : new Set();

  renderList();
  renderPreview();

  if (selected.size === 0) {
    // Une sélection vide signifie « tout » à l'impression : c'est la règle la
    // moins devinable, on la rappelle au moment où elle s'applique.
    toast(t('Aucun lien coché : l\'impression portera sur toute la collection'));
  }
});

/**
 * Exporte un classeur `.xlsx` avec les QR Codes intégrés.
 *
 * Un CSV ne peut pas transporter d'image : c'est tout l'intérêt de cet export.
 * La génération des QR Codes prend un instant par lien, d'où le retour sur le bouton.
 */
async function exportSpreadsheet() {
  if (links.length === 0) return;

  const label = el.exportXlsx.textContent;
  el.exportXlsx.disabled = true;
  el.exportXlsx.textContent = t('Génération…');

  try {
    const bytes = await buildLinkSpreadsheet(resolveTargets(links, el.qrTarget.value), {
      onProgress: (done, total) => {
        el.exportXlsx.textContent = t('QR Code {done}/{total}…', { done, total });
      },
    });
    const filename = exportFilename(collectionName(), 'xlsx');
    const ok = downloadBytes(filename, bytes, {
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    toast(ok ? t('{filename} enregistré', { filename }) : t('Téléchargement impossible'), ok ? 'info' : 'error');
  } catch (error) {
    toast(t('Export impossible : {message}', { message: error.message }), 'error');
  } finally {
    el.exportXlsx.textContent = label;
    el.exportXlsx.disabled = links.length === 0;
  }
}

/**
 * Exporte le tableau configuré : un dossier autonome JSON + PNG + HTML.
 *
 * Contrairement aux exports de la collection, celui-ci suit la sélection et
 * les colonnes cochées dans l'onglet, comme l'impression : c'est le même
 * tableau, avec ses QR Codes prêts à l'emploi.
 */
async function exportTableArchive() {
  const items = printableLinks();
  if (items.length === 0) return;

  const label = el.exportTable.textContent;
  el.exportTable.disabled = true;
  el.exportTable.textContent = t('Génération…');

  try {
    const { bytes } = await buildTableArchive(items, {
      title: collectionName(),
      columns: tableColumns(),
      dateMode: tableDateMode(),
      // Le rang de la collection, celui que porte le tableau imprimé.
      rankOf: (link, index) => linkRanks.get(link.id) ?? index + premierNumero(),
      onProgress: (done, total) => {
        el.exportTable.textContent = t('QR Code {done}/{total}…', { done, total });
      },
    });
    const filename = exportFilename(collectionName(), 'zip');
    const ok = downloadBytes(filename, bytes, { mime: 'application/zip' });
    toast(ok ? t('{filename} enregistré', { filename }) : t('Téléchargement impossible'), ok ? 'info' : 'error');
  } catch (error) {
    toast(t('Export impossible : {message}', { message: error.message }), 'error');
  } finally {
    el.exportTable.textContent = label;
    el.exportTable.disabled = items.length === 0 || !hasAnyTableColumn();
  }
}

/**
 * Exporte les étiquettes composées pour l'imprimante, sans imprimante.
 *
 * L'onglet Niimbot ne savait produire que par le matériel : sans lui, ses
 * réglages ne servaient à rien. La composition est **la même** que pour
 * l'impression et pour l'aperçu — `composeLabel` puis `drawLabel`, à la
 * résolution de la tête, avec l'orientation appliquée — si bien que le dossier
 * contient ce qui serait sorti, et non une seconde composition qui lui ressemble.
 */
async function exportPrinterLabels() {
  const { items } = impressionChoisie();
  if (items.length === 0) {
    toast(t('Aucun lien à imprimer'), 'error');
    return;
  }

  const libelle = el.exportNiimbot.textContent;
  el.exportNiimbot.disabled = true;

  try {
    const profile = previewProfile();
    const { turns } = labelRotation();
    const largeur = String(items.length).length;
    const labels = [];

    for (const [index, link] of items.entries()) {
      el.exportNiimbot.textContent = t('Étiquette {index}/{total}…', {
        index: index + 1,
        total: items.length,
      });

      const { geometry, content, verdict } = composeLabel(link, profile);

      const source = document.createElement('canvas');
      source.width = geometry.width;
      source.height = geometry.height;
      const ctx = source.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      drawLabel(ctx, geometry, {
        titleLines: content.titleLines,
        showTitle: content.showTitle,
        url: resolveTarget(link, el.qrTarget.value).url,
        extraText: content.extraText,
      });

      // L'orientation est appliquée à l'envoi, comme à l'impression : l'image
      // exportée doit montrer la même chose que ce qui sort.
      const tourne = turns === 0 ? source : rotateCanvas(source, turns);
      const blob = await new Promise((resolve) => tourne.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error(t("Le navigateur n'a pas pu encoder l'image."));

      labels.push({
        fileName: printerLabelFileName(index + 1, link.title || hostOf(link.url) || link.url, largeur),
        png: new Uint8Array(await blob.arrayBuffer()),
        widthMm: Number(pxToMm(geometry.width, profile.dpi).toFixed(1)),
        heightMm: Number(pxToMm(geometry.height, profile.dpi).toFixed(1)),
        widthPx: geometry.width,
        heightPx: geometry.height,
        pxPerModule: verdict.pxPerModule,
        url: link.url,
        title: link.title ?? '',
      });
    }

    el.exportNiimbot.textContent = t('Assemblage…');
    const { bytes } = buildPrinterLabelArchive({
      labels,
      title: collectionName(),
      // Tous les réglages de l'onglet : sans eux, le dossier décrirait des
      // étiquettes qu'on ne saurait pas recomposer.
      settings: {
        profile: profile.id,
        supply: el.labelSupply.value,
        supplyName: el.labelSupply.selectedOptions?.[0]?.textContent ?? '',
        density: Number(el.density.value) || profile.density.default,
        rotation: el.labelRotation.value,
        alignment: el.labelAlignment.value,
        fontSizeMm: Number(el.labelFontSize.value),
        position: el.labelLink.value,
        content: {
          index: el.labelShowIndex.checked,
          title: el.labelShowTitle.checked,
          url: el.labelShowUrl.checked,
          host: el.labelShowHost.checked,
          date: el.labelShowDate.checked,
          time: el.labelDateTime.checked,
        },
      },
    });

    const filename = printerLabelArchiveName(Date.now(), collectionName());
    const ok = downloadBytes(filename, bytes, { mime: 'application/zip' });
    toast(ok
      ? tpl(labels.length, '{count} étiquette — {filename} enregistré',
        '{count} étiquettes — {filename} enregistré', { filename })
      : t('Téléchargement impossible'), ok ? 'info' : 'error');
  } catch (error) {
    toast(t('Export impossible : {message}', { message: error.message }), 'error');
  } finally {
    el.exportNiimbot.textContent = libelle;
    updatePrintScope();
  }
}

/**
 * Exporte la planche en dossier autonome.
 *
 * Le HTML n'est pas reconstruit : il est repris tel quel des pages rendues pour
 * l'aperçu et pour l'impression. Ce que le fichier contient est donc, au pixel
 * près, ce qui serait sorti de l'imprimante — et non une seconde mise en page
 * qui lui ressemble.
 */
async function exportSheetArchive() {
  const items = printableLinks();
  if (items.length === 0) return;

  const libelle = el.exportSheet.textContent;
  el.exportSheet.disabled = true;
  el.exportSheet.textContent = t('Génération…');

  try {
    // Deux objets distincts, et les confondre a coûté une erreur : les pages
    // **rendues** portent le HTML, le **placement** porte le rang de chaque
    // étiquette. Un élément du DOM n'a pas de `items`.
    const pages = buildSheetPages(items);
    const { layout, pages: placement } = planchePlacement(items);

    const cells = placement.flatMap((page) => page.items.map(({ item, cell }) => ({
      index: cell.index,
      page: cell.page,
      column: cell.column,
      row: cell.row,
      url: item.url,
      title: item.title ?? '',
    })));

    const ratio = Number(el.sheetQr.value) / 100;
    const { bytes } = buildSheetArchive({
      pagesHtml: pages.map((page) => page.outerHTML).join('\n'),
      css: feuillesAppliquees(),
      title: collectionName(),
      note: collectionNote(),
      pageWidthMm: layout.pageWidthMm,
      pageHeightMm: layout.pageHeightMm,
      layout,
      qrRatio: ratio,
      qrSideMm: qrSideMm(layout.labelWidthMm, layout.labelHeightMm, ratio),
      fontPt: sheetFontPt(),
      options: {
        title: el.sheetTitle.checked,
        url: el.sheetUrl.checked,
        date: dateMode(),
        index: el.sheetDateIndex.checked,
        header: el.sheetHeader.checked,
        headerDate: el.sheetHeaderDate.checked,
        headerNote: el.sheetHeaderNote.checked,
        border: el.sheetBorder.checked,
      },
      cells,
    });

    const filename = sheetArchiveName(Date.now(), collectionName());
    const ok = downloadBytes(filename, bytes, { mime: 'application/zip' });
    toast(ok
      ? t('Planche exportée : {filename}', { filename })
      : t('Téléchargement impossible'), ok ? 'info' : 'error');
  } catch (error) {
    toast(t('Export impossible : {message}', { message: error.message }), 'error');
  } finally {
    el.exportSheet.textContent = libelle;
    el.exportSheet.disabled = printableLinks().length === 0;
  }
}

el.exportXlsx.addEventListener('click', exportSpreadsheet);
el.exportCsv.addEventListener('click', () => exportAs('csv'));
el.exportMd.addEventListener('click', () => exportAs('md'));
el.exportJson.addEventListener('click', () => exportAs('json'));
el.exportTable.addEventListener('click', exportTableArchive);
el.exportSheet.addEventListener('click', exportSheetArchive);

el.import.addEventListener('click', () => el.importFile.click());
el.importFile.addEventListener('change', async () => {
  const [file] = el.importFile.files ?? [];
  if (file) await importArchive(file);
  el.importFile.value = '';
});

// Le rangement se choisit après la lecture, et rien n'est écrit avant : annuler
// le panneau ne laisse donc aucune trace, pas même un lien ajouté.
el.importMerge.addEventListener('click', () => applyImport('merge').catch(() => {}));
el.importReplace.addEventListener('click', () => applyImport('replace').catch(() => {}));
el.importAdd.addEventListener('click', () => applyImport('add').catch(() => {}));
el.importCancel.addEventListener('click', closeImportMenu);

el.clear.addEventListener('click', async () => {
  await store.clear();
  selected = new Set();
  await refresh();
  toast(t('Collection vidée'));
});

for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => switchMode(tab.dataset.mode));
}

el.shortener.addEventListener('change', () => {
  updateShortenerHint();
  settings.save({ shortener: el.shortener.value });
  updateShortenStatus();
});
el.shorten.addEventListener('click', shortenSelection);
el.shortenClear.addEventListener('click', clearShortUrls);
for (const box of [el.sheetDate, el.sheetDateTime, el.sheetDateIndex]) {
  box.addEventListener('change', () => {
    updateDateHint();
    renderPreview();
  });
}
// Toutes les cases du contenu de l'étiquette, y compris celles de la date :
// cocher le titre, l'URL ou le domaine change ce qui est annoncé sous l'aperçu.
for (const box of [
  el.exportIndex, el.exportTitle, el.exportUrl, el.exportHost,
  el.exportDate, el.exportDateTime,
]) {
  box.addEventListener('change', renderPreview);
}
for (const box of [el.tableColDate, el.tableColDateTime]) {
  box.addEventListener('change', renderPreview);
}
el.qrTarget.addEventListener('change', () => {
  settings.save({ targetMode: el.qrTarget.value });
  updateTargetAvailability();
  renderPreview();
});

/**
 * Parcourt les dispositions de la **famille** courante.
 *
 * On essaie les références d'un même fabricant l'une après l'autre — c'est le
 * geste réel quand on hésite entre deux pochettes — sans traverser les autres
 * familles ni ouvrir la liste. Le sélecteur reste, pour qui sait ce qu'il
 * cherche.
 *
 * @param {number} pas +1 pour la suivante, −1 pour la précédente.
 */
function parcourirDispositions(pas) {
  const courante = el.preset.value;
  const groupe = SHEET_PRESETS[courante]?.group;
  const famille = Object.keys(SHEET_PRESETS).filter((cle) => SHEET_PRESETS[cle].group === groupe);
  if (famille.length < 2) return;

  const index = famille.indexOf(courante);
  const suivant = famille[(index + pas + famille.length) % famille.length];
  el.preset.value = suivant;
  el.preset.dispatchEvent(new Event('change', { bubbles: true }));
}

el.presetPrev.addEventListener('click', () => parcourirDispositions(-1));
el.presetNext.addEventListener('click', () => parcourirDispositions(1));
el.sheetFit.addEventListener('click', ajusterEspacement);

/**
 * Les six cotes de la planche telles que les champs les portent.
 *
 * @returns {{columns: string, rows: string, marginXMm: string, marginYMm: string,
 *   gapXMm: string, gapYMm: string}}
 */
function lireGrille() {
  return {
    columns: el.sheetColumns.value,
    rows: el.sheetRows.value,
    marginXMm: el.sheetMarginX.value,
    marginYMm: el.sheetMarginY.value,
    gapXMm: el.sheetGapX.value,
    gapYMm: el.sheetGapY.value,
  };
}

/**
 * Réécrit les six cotes dans les champs, sans émettre d'événement.
 *
 * Le rendu suit l'appel — `renderPreview` est appelé une fois, par l'appelant :
 * émettre un `input` par champ relancerait six rendus pour un seul geste.
 *
 * @param {{columns: string, rows: string, marginXMm: string, marginYMm: string,
 *   gapXMm: string, gapYMm: string}} grille
 * @returns {void}
 */
function ecrireGrille(grille) {
  el.sheetColumns.value = grille.columns;
  el.sheetRows.value = grille.rows;
  el.sheetMarginX.value = grille.marginXMm;
  el.sheetMarginY.value = grille.marginYMm;
  el.sheetGapX.value = grille.gapXMm;
  el.sheetGapY.value = grille.gapYMm;
}

// La mise en page automatique : un choix, et le rendu suit — c'est
// `buildSheetPages` qui l'applique à chaque passage.
//
// **Décocher doit se voir.** Le calcul réécrit les six champs ; sans remise en
// état, les décocher laissait la planche identique au millimètre près, et l'on
// croyait à un défaut d'affichage. On met donc de côté ce que l'utilisateur
// avait réglé **avant** le premier calcul, et on le lui rend au décochage ; s'il
// n'y a rien à rendre — la case était déjà cochée au chargement —, on repart de
// la grille de la disposition choisie, qui est au moins une grille nommée.
el.sheetAuto?.addEventListener('change', () => {
  if (el.sheetAuto.checked) {
    if (grilleManuelle === null) grilleManuelle = lireGrille();
    // Le repère de grille n'a plus de sens : la grille n'est plus demandée, elle
    // est calculée.
    if (el.sheetGridHint) el.sheetGridHint.textContent = '';
  } else {
    if (grilleManuelle !== null) {
      ecrireGrille(grilleManuelle);
      grilleManuelle = null;
    } else {
      prefillGridFields();
    }
  }
  renderPreview();
});

el.preset.addEventListener('change', () => {
  prefillGridFields();
  // Un changement de planche efface le message : la grille vient d'être
  // remplacée par celle du fabricant, il n'y a plus rien à recadrer.
  if (el.sheetGridHint) el.sheetGridHint.textContent = '';
  renderPreview();
});
// Les six réglages dont dépend la **taille** des étiquettes. Aux `input`, on
// redessine seulement ; au `change` — c'est-à-dire à la sortie du champ — on
// recadre. Réécrire un nombre pendant la frappe empêcherait d'entrer « 12 »
// sans passer par « 1 ».
for (const field of [
  el.sheetColumns, el.sheetRows,
  el.sheetMarginX, el.sheetMarginY,
  el.sheetGapX, el.sheetGapY,
]) {
  field.addEventListener('input', renderPreview);
  field.addEventListener('change', () => {
    recadrerGrille();
    renderPreview();
  });
}
for (const box of [
  el.sheetTitle, el.sheetUrl, el.sheetBorder,
  el.sheetHeaderDate, el.sheetHeaderNote,
]) {
  box.addEventListener('change', renderPreview);
}

// L'en-tête de page : cocher la case **fait la place**, au lieu d'annoncer un
// refus. Il vit dans la marge du haut, qui doit mesurer 9 mm pour le porter ; la
// disposition par défaut lui en donne 8,53 — donc, en l'état, cocher la case ne
// montrait jamais rien, et passait pour un défaut d'affichage. On porte donc la
// marge à ce qu'il faut, et c'est le rendu qui suit : la grille se replace, et
// si elle ne tient plus, l'avertissement de la planche le dit.
el.sheetHeader?.addEventListener('change', () => {
  if (el.sheetHeader.checked) {
    const marge = Number(el.sheetMarginY.value);
    if (!Number.isFinite(marge) || marge < SHEET_HEADER_MM) {
      el.sheetMarginY.value = String(SHEET_HEADER_MM);
      // Le champ est recadré comme s'il venait d'être saisi : c'est la même
      // écriture, donc le même chemin — et l'aperçu en tient compte.
      recadrerGrille();
    }
  }
  renderPreview();
});
el.sheetQr.addEventListener('input', renderPreview);
el.sheetFont.addEventListener('input', renderPreview);
el.sheetOffsetX.addEventListener('input', renderPreview);
el.sheetOffsetY.addEventListener('input', renderPreview);
el.labelProfile.addEventListener('change', () => {
  // Changer de format change le catalogue : chaque modèle a ses rouleaux, et
  // un consommable qui n'existe plus doit disparaître. Les dispositions
  // applicables en dépendent aussi.
  fillSupplies();
  fillLayouts();
  updateProfileHint();
  renderPreview();
});

el.labelSupply.addEventListener('change', () => {
  // Le consommable décide de la longueur : on réaffiche le champ libre si, et
  // seulement si, le rouleau choisi n'impose pas la sienne.
  updateSupplyLength();
  renderPreview();
});
el.tableQr.addEventListener('input', renderPreview);
for (const box of [
  el.tableColIndex, el.tableColQr, el.tableColUrl,
  el.tableColTitle, el.tableColTags, el.tableColNote,
  el.tableGrid,
]) {
  box.addEventListener('change', renderPreview);
}
el.labelRotation.addEventListener('change', renderPreview);
for (const box of [
  el.labelShowIndex, el.labelShowTitle, el.labelShowUrl,
  el.labelShowHost, el.labelShowDate, el.labelDateTime,
]) {
  box.addEventListener('change', () => {
    updateLabelContentHint();
    renderPreview();
  });
}
el.labelAlignment.addEventListener('change', renderPreview);
// Réglage d'aperçu : il ne change rien à l'impression, mais il change ce qu'on
// regarde.
/**
 * Les deux cases « Aperçu à la taille réelle » — celle de l'onglet Niimbot et
 * celle des images — portent le **même** état : c'est le même aperçu, vu depuis
 * deux onglets, et deux états séparés finiraient par se contredire.
 *
 * @param {boolean} valeur
 */
function setRealSizePreview(valeur) {
  el.labelRealSize.checked = valeur;
  el.exportRealSize.checked = valeur;
  renderPreview();
}

el.labelRealSize.addEventListener('change', () => setRealSizePreview(el.labelRealSize.checked));
el.exportRealSize.addEventListener('change', () => setRealSizePreview(el.exportRealSize.checked));
el.labelFontSize.addEventListener('input', renderPreview);
// Le titre et le QR Code se règlent comme le texte : chaque frappe
// recompose l'aperçu, sans quoi le réglage semble sans effet.
el.labelTitleSize.addEventListener('input', renderPreview);
el.labelQrSize.addEventListener('input', renderPreview);
// Les réglages de page du tableau se répercutent sur l'aperçu.
for (const node of [
  el.tableOrientation, el.tableMarginX, el.tableMarginY,
]) {
  node.addEventListener('input', renderPreview);
  node.addEventListener('change', renderPreview);
}
for (const box of [el.tableTitle, el.tableTitleDate, el.tableTitleNote]) {
  box.addEventListener('change', renderPreview);
}

el.labelLink.addEventListener('change', () => {
  // Le sélecteur unique décide à la fois de ce que montre l'aperçu et de ce qui
  // sortira : les deux se rafraîchissent ensemble.
  updatePrintScope();
  renderPreview();
});
el.copies.addEventListener('input', updatePrintScope);
el.labelFormat.addEventListener('change', renderPreview);
el.labelMargin.addEventListener('input', renderPreview);
el.labelFont.addEventListener('input', renderPreview);
el.labelCut.addEventListener('change', renderPreview);
el.exportLabels.addEventListener('click', exportLabelImages);
el.print.addEventListener('click', printSelection);
el.connect.addEventListener('click', connectPrinter);
el.disconnect.addEventListener('click', disconnectPrinter);
el.exportNiimbot.addEventListener('click', () => {
  exportPrinterLabels().catch((error) => {
    toast(error.message ?? t('Export impossible'), 'error');
  });
});
el.printLabel.addEventListener('click', () => {
  // Pendant une série, le même bouton arrête : on ne peut pas en lancer une
  // seconde par-dessus la première. C'était l'objet du regroupement — il n'y a
  // plus deux boutons dont l'un devient l'autre.
  if (seriesRunning) {
    seriesRunning = false;
    el.printStatus.textContent = t('Arrêt demandé : la série s\'arrête après l\'étiquette en cours.');
    return;
  }
  // `printLabels` attrape ses propres erreurs ; on protège malgré tout l'appel,
  // sans quoi un rejet deviendrait une promesse non traitée.
  printLabels().catch((error) => {
    toast(error.message ?? t('Impression impossible'), 'error');
  });
});

// L'échelle des pages est calculée en pixels au moment du rendu : sans ce
// rappel, une planche composée pour une grande fenêtre débordait après
// réduction, et gardait une petite échelle après agrandissement. Le délai
// regroupe les événements d'un redimensionnement continu.
/**
 * Observe la taille de l'aperçu, et non seulement celle de la fenêtre.
 *
 * Une barre de défilement qui apparaît retire une quinzaine de pixels à la
 * largeur utile **sans** provoquer d'événement `resize` sur la fenêtre : le
 * cadre gardait alors l'échelle du rendu précédent et dépassait la place
 * offerte de la largeur du défilement. Mesuré : 685 px dessinés pour 670 px
 * offerts.
 *
 * On ne redessine que si la largeur a réellement changé : `renderPreview`
 * remplace le contenu de l'aperçu, et un observateur naïf se rappellerait
 * lui-même.
 */
if (typeof ResizeObserver === 'function' && el.preview) {
  const observateur = new ResizeObserver(() => {
    if (Math.abs(previewViewportWidth() - largeurApercuRendue) < 1) return;
    clearTimeout(previewResizeTimer);
    previewResizeTimer = setTimeout(() => renderPreview(), 150);
  });
  observateur.observe(el.preview);
}

let previewResizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(previewResizeTimer);
  previewResizeTimer = setTimeout(() => renderPreview(), 150);
});

window.addEventListener('beforeprint', () => {
  // Le rendu papier est préparé au clic ; un Ctrl+P direct n'aurait rien à
  // imprimer. On reconstruit donc à la volée si la racine est vide — **ou si
  // elle porte les pages d'un autre mode** : imprimer la planche après être passé
  // au tableau sortait les pages du tableau, sans un mot. C'est ce que le relevé
  // a mesuré : trois pages de tableau annoncées, cinq pages sorties, parce que la
  // racine portait encore la planche.
  if (mode === 'single') return;
  if (el.printRoot.childElementCount > 0 && modeRacineImpression === mode) return;

  const items = printableLinks();
  el.printRoot.textContent = '';
  if (mode === 'table') {
    const config = tablePageConfig();
    applyPrintPageSize(config.widthMm, config.heightMm);
    for (const page of buildTablePages(items)) el.printRoot.appendChild(page);
  } else {
    for (const page of buildSheetPages(items)) el.printRoot.appendChild(page);
  }
  modeRacineImpression = mode;
});

/**
 * Pose l'adresse de la page d'information, sous l'application.
 *
 * C'est le même lien que celui de la fenêtre de l'extension, et il tient au
 * même calcul, partagé dans `core/site.js` : la page française est à la racine
 * du site, l'anglaise sous `/en/`, et l'application servie par le site renvoie à
 * sa voisine plutôt qu'à l'adresse publiée. Un `href` écrit en dur dans le HTML
 * enverrait donc la moitié des visiteurs au mauvais endroit — d'où ce câblage.
 *
 * Le changement de langue recharge la page : l'adresse n'a pas à être recalculée
 * à chaud.
 */
function wireSiteLink() {
  const link = el.siteLink;
  if (!link) return;

  // L'année de la signature est **celle du jour**, et non celle de la
  // construction : le pied de page d'une application de 2026 ne doit pas
  // annoncer 2024 parce qu'un fichier n'a pas été retouché depuis.
  if (el.footerYear) el.footerYear.textContent = String(new Date().getFullYear());

  // `window.location` et non `location` : la page de l'extension et la page du
  // site n'ont pas le même voisinage, et c'est la page courante qui décide.
  link.href = informationPageHref(getLocale(), window.location);

  // Le changement de contexte est annoncé : sans cela, un utilisateur de lecteur
  // d'écran ne sait pas qu'un onglet va s'ouvrir.
  if (!link.querySelector('.sr-only')) {
    const hint = document.createElement('span');
    hint.className = 'sr-only';
    hint.textContent = t(' (ouvre un nouvel onglet)');
    link.appendChild(hint);
  }
}

/**
 * Branche le sélecteur de langue de la barre supérieure.
 *
 * Le changement mémorise la langue puis recharge la page : tout est ainsi
 * rendu dans la bonne langue, y compris les libellés construits par le code.
 */
function wireLocaleSwitcher() {
  const select = document.getElementById('locale');
  if (!select) return;
  select.value = getLocale();
  select.addEventListener('change', async () => {
    if (select.value === getLocale()) return;
    await setLocale(select.value);
    location.reload();
  });
}

// --- Démarrage ---

// La langue doit être connue avant de construire les listes : leurs libellés
// passent par `t()`.
await initI18n();
applyTranslations(document);
wireLocaleSwitcher();
wireSiteLink();

fillPresets();
fillLabelForm();
fillProfiles();
fillShorteners();
fillTargets();
fillDateModes();
fillLabelChoices();

// Préférences retenues : avant le premier rendu, pour éviter un aller-retour
// visuel entre la valeur par défaut et celle de l'utilisateur.
/**
 * Les préférences courantes, relues après chaque écriture.
 *
 * `let` et non `const` : le tri change **en cours de session**, et tout ce qui
 * dépend de lui — l'ordre de la liste, la présence des flèches, la phrase sous le
 * sélecteur — doit le voir changer. Les autres réglages ne sont lus qu'au
 * chargement ou au moment de leur usage, d'où un seul objet réaffecté plutôt
 * qu'une relecture du stockage à chaque ligne.
 */
let preferences = settings.load();
el.shortener.value = preferences.shortener;
el.qrTarget.value = preferences.targetMode;
// Les collections viennent avant le premier rendu : la liste, les exports et
// l'impression portent sur la collection affichée, et le nom qui les titre vient
// d'elle. Sur la page web autonome, la source n'offre qu'une collection — celle
// des réglages — et la ligne du sélecteur reste masquée.
await setupCollections();
updateShortenerHint();
applyCollectionName();
fillSortModes();
updateDateHint();

reportBluetoothSupport();
switchMode('sheet');
updateProfileHint();

// Un bandeau plutôt qu'un message transitoire : celui-ci serait recouvert par
// le message suivant, et un diagnostic qu'on ne lit pas ne sert à rien.
if (!stylesheetIsCurrent()) el.staleStyle.hidden = false;

if (storeKind === 'memory') {
  toast(t('Stockage temporaire : IndexedDB indisponible, les liens seront perdus'), 'error');
}

await refresh();

// La page suit le stockage, et non seulement ses propres gestes.
//
// Trois écrivains partagent ces documents : la fenêtre de la barre d'outils, le
// menu contextuel, et cette page — ouverte deux fois, dans deux onglets. Aucun
// ne prévient les autres. Vider la collection depuis la fenêtre laissait donc
// l'application afficher ses trois liens, et son bouton « Vider » actif, alors
// que la collection était vide : il fallait recharger l'onglet pour le voir.
//
// Les documents écoutés sont ceux qui décident de ce qui est affiché : les
// réglages et la langue n'en font pas partie — ils se relisent au démarrage, et
// y réagir ici redessinerait pour rien.
extensionApi?.storage?.onChanged?.addListener((changes, area) => {
  if (!displayedDocuments(area).some((cle) => cle in changes)) return;
  scheduleSync();
});
