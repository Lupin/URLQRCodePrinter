# Prompt pour la session suivante — version Safari

À copier tel quel dans une nouvelle session.

---

## Reprise du projet URLQRCodePrinter — volet Safari

Dépôt : `/Users/gael/Documents/GitHub/URLQRCodePrinter` (macOS, Node 22, pas de
pnpm ni Rust). Application de collecte d'URL → QR codes imprimés : extension
Brave/Chrome (MV3) + application web autonome partageant le même cœur, et
impression directe sur étiqueteuse Niimbot (D110 réelle chez l'utilisateur) via
Web Bluetooth.

**Objectif de cette session : la version particulière pour l'extension Safari.**
C'est le seul volet jamais éprouvé du projet.

### Conventions non négociables du dépôt

- Zéro dépendance. Modules ES natifs, pas de bundler pour l'app web ; l'extension
  est assemblée en fichiers uniques par `scripts/bundle.mjs` (Safari ne résout
  pas les imports en sous-dossier d'une extension — vérifié, message
  `Unable to find "core/store.js" in the extension's resources`).
- **Tout est en français** : interface, commentaires, messages d'erreur, noms de
  fonctions métier.
- Le cœur (`src/core/`) est pur : aucun DOM, aucun réseau non injecté. Ce qui
  touche au DOM vit dans `src/web/app.js` et `src/extension-src/`.
- Les commentaires expliquent **pourquoi**, pas quoi. Quand un défaut a été
  corrigé, le commentaire dit lequel, sinon il sera réintroduit.
- Les commits sont en français, au présent, **sans accent dans la première
  ligne**.

### État vérifié au moment de la reprise

- Dernier commit : `31309d2` — « Corrige la date dans les trois onglets et
  reprend le catalogue du fabricant ». Arbre de travail propre.
- **516 tests JavaScript verts** (`npm test`), **104 tests Swift verts**
  (`npm run test:swift`, pour `native/niimbot-kit`).
- **131/131 vérifications dans Brave** (`npm run verify:brave`, sur profil isolé).
- Safari **26.5** installé, `safaridriver` disponible
  (`/System/Cryptexes/App/usr/bin/safaridriver`).
- Xcode 26.6 installé ; `xcode-select` pointe sur les Command Line Tools, donc
  `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` est nécessaire.
- L'app conteneur Safari a déjà été compilée une fois
  (`native/safari/build/dd/Build/Products/Debug/URLQRCodePrinter.app`).

**Première chose à faire :**

```bash
npm test                    # attendu : 516 verts
npm run build && npm run verify:brave   # attendu : 131/131
```

Si un chiffre diffère, chercher pourquoi avant de coder quoi que ce soit.

### Ce que le dépôt dit déjà de Safari

`README.md` annonce noir sur blanc : « Ce qui reste à éprouver : l'extension
chargée dans Safari ». Deux documents à lire **avant** de toucher au code :

- `docs/note-capacites-capture-url-safari-brave.md` — matrice de capacités
  (API d'extension, communication avec une app native, quotas, et une section
  « Ce qui est impossible — et pourquoi »). C'est la référence : elle distingue
  ce qui est documenté de ce qui a été constaté.
- `README.md`, section « Safari » et « L'extension est assemblée en fichiers
  uniques ».

Points déjà établis :

- Une extension Safari **est** une application macOS : il faut l'exécuter une
  fois pour que Safari la découvre. `npm run install:safari` enchaîne génération,
  compilation et lancement.
- Le convertisseur d'Apple génère des cibles iOS 15.0 / macOS 10.14 alors que le
  manifeste exige `strict_min_version: "16.4"` (`background.type: "module"` n'est
  supporté qu'à partir de Safari 16.4) ; `scripts/package-safari.mjs` relève et
  corrige ces cibles.
- Le modèle d'Apple a deux impasses silencieuses : quand Safari refuse d'ouvrir
  ses réglages, le bouton « Quit and Open Safari Extensions Preferences… » sort
  de sa closure sans rien faire. `scripts/safari-container-app.mjs` les remplace
  par des versions qui expliquent la marche à suivre.
- **Web Bluetooth n'existe pas sur Safari.** L'onglet Niimbot ne peut donc pas
  fonctionner : il doit le dire clairement, et l'export d'images reste la voie
  utile.
- La cible iOS du projet Xcode **ne se compile pas dans un environnement
  restreint** (Xcode écrit dans `~/Library/Developer/CoreSimulator`, clang dans
  un cache système). Ne pas s'y engager sans accès complet.

### La tâche

1. **Éprouver réellement l'extension dans Safari**, sur cette machine. Le
   README ne l'a jamais fait. Il faut savoir, preuves à l'appui : l'extension
   s'enregistre-t-elle, se charge-t-elle, la page `app.html` fonctionne-t-elle,
   la collecte d'URL depuis le menu contextuel ou le bouton d'extension
   marche-t-elle, et qu'est-ce qui ne marche pas.
2. **Écrire un `npm run verify:safari`**, sur le modèle de
   `scripts/verify-brave.mjs` : un scénario reproductible qui constate les
   capacités réelles plutôt que de les supposer. `safaridriver` est disponible
   (WebDriver) — c'est la piste à instruire en premier. Voir la réserve ci-dessous
   sur l'isolation.
3. **Adapter l'interface à ce que Safari permet**, en distinguant à l'écran ce
   qui est indisponible et pourquoi (Web Bluetooth, `contextMenus` sur iOS…), au
   lieu de laisser un bouton mort.

**Réserve importante, à trancher avec l'utilisateur :** contrairement à Brave,
**Safari ne s'automate pas sur un profil isolé**. `safaridriver` pilote le vrai
Safari.app, et l'activation d'une extension se fait dans les réglages de Safari.
Il est donc possible qu'une étape manuelle **unique** soit inévitable — cocher
l'extension une fois dans Safari. Si c'est le cas : le dire explicitement, la
réduire à un geste, et automatiser tout le reste. Ne jamais modifier les
réglages Safari de l'utilisateur sans le lui dire.

### Règles de travail — leçons apprises, à respecter

1. **Ne jamais lancer de vérification sur le profil Brave réel de l'utilisateur.**
   `verify:brave` utilise un profil isolé (`.verify-brave/`), redirige les
   téléchargements, tourne hors écran et termine par un SIGKILL (SIGTERM
   déclenche la confirmation de fermeture de Brave). Ne jamais toucher à
   `~/Downloads`.
2. **Ne jamais lancer `npm test` pendant `npm run verify:brave`.** `npm test`
   déclenche `pretest`, donc un `npm run build` complet : le `dist/` est réécrit
   sous les pieds du navigateur déjà lancé, et la vérification échoue sur des
   défauts qui n'existent pas. Constaté deux fois. De même, deux `npm run build`
   concurrents laissent des dossiers orphelins (`icons 2`) dans `dist/`.
3. **L'utilisateur refuse d'être le testeur.** Il l'a dit explicitement. Toute
   fonctionnalité livrée doit être vérifiée par toi, dans un vrai navigateur.
   Une question ne se justifie que si l'information est *inobservable* depuis cet
   environnement — ou si elle exige son accord (comme l'étape manuelle Safari
   ci-dessus).
4. **Ne jamais laisser le dépôt cassé.** Écrire les fichiers par blocs atomiques,
   vérifier avec `node --check` puis `npm test`, commiter dès que c'est vert.
   Un script d'édition qui échoue sur une assertion **n'écrit rien** : ne jamais
   supposer qu'une modification partielle a été appliquée, vérifier avec `grep`.
5. **Avant de remplacer un bloc, relire son texte exact** : les fichiers
   changent entre les tours, une ancre périmée fait échouer l'édition en
   silence.
6. **Dans `scripts/verify-brave.mjs`, jamais de barre oblique inversée dans un
   `evaluate(\`…\`)** : le littéral de gabarit la consomme, `/^\d{2}/` devient
   `/^d{2}/` et la page lève une erreur de syntaxe. Écrire les tests de forme
   sans expression régulière. Cette règle vaut pour tout script de vérification
   à écrire.
7. Le bundler **refuse deux déclarations de même nom** entre modules : un helper
   partagé s'exporte depuis le cœur, il ne se recopie pas.
8. Le DOM de substitution des tests (`test/helpers/dom-shim.mjs`) n'implémente ni
   `closest`, ni les attributs `checked`/`value` du HTML, ni `getComputedStyle`.
   Les valeurs par défaut se vérifient dans `test/web.test.js` (sur le fichier
   HTML réel), le câblage dans `test/web-boot.test.js`.
9. **Mesurer dans le navigateur relativement à la page, pas au viewport** :
   l'aperçu défile et fausse les comparaisons.
10. **Un test qui passe ne prouve rien s'il mesure la mauvaise chose.** Plusieurs
    défauts visuels ont survécu à des vérifications vertes parce que l'observable
    était trop grossier : la hauteur d'un canevas ne distingue pas une URL courte
    d'une longue, et l'encre totale ne dit pas si la date s'imprime (réduire la
    police en fait baisser le total). Choisir un observable qui **change** quand
    et seulement quand le comportement change — comparer deux rendus au pixel
    près, ou compter les lignes, plutôt qu'une grandeur qui bouge pour plusieurs
    raisons à la fois.

### Attentes de l'utilisateur sur la forme

Français, direct, sans flatterie. Dire ce qui est **vérifié** et ce qui est
**supposé** — il l'a demandé et il le vérifie. Signaler les défauts trouvés en
chemin, y compris les siens propres (laisser le dépôt cassé a été relevé et
reconnu). Ne pas lui demander de tester à sa place.

### Commandes utiles

```bash
npm test                      # 516 tests JS (reconstruit dist/ via pretest)
npm run test:swift            # 104 tests du socle natif NiimbotKit
npm run build                 # assemble dist/web, dist/extension, dist/extension-safari
npm run verify:brave          # 131 vérifications, profil Brave isolé
npm run package:safari        # génère le projet Xcode Safari
npm run install:safari        # génère, compile l'app macOS et la lance
npm run open:safari           # ouvre le projet dans Xcode
```

### Livrable attendu

Une réponse qui dit, preuves à l'appui : ce qui fonctionne dans Safari, ce qui ne
fonctionne pas et pourquoi, et ce qui reste à faire une fois à la main. Plus le
script de vérification qui rend ce constat reproductible.
