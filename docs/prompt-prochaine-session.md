# Prompt pour la session du 30 septembre 2026

À copier tel quel au début d'une nouvelle session. Il est écrit pour un agent qui
n'a **aucun** souvenir de la veille : tout ce qui est nécessaire y est, et le
reste est dans le dépôt.

---

Reprends le travail sur **URLQRCodePrinter** (`~/Documents/GitHub/URLQRCodePrinter`) :
une extension de navigateur et une application web qui transforment des liens en
étiquettes QR Code imprimables.

## À lire avant de toucher à quoi que ce soit

1. `docs/note-a-verifier-a-l-oeil.md` — **la liste des points ouverts**, ce qui a
   déjà été mesuré, et ce qui reste à trancher. C'est le point d'entrée.
2. `README.md` (ou `README.fr.md`) — ce que fait le produit, comment le lancer.
3. `docs/verification-chrome.md` — comment on mesure, et les pièges payés.

## État à l'ouverture

- `npm test` : **992 tests, tous verts**.
- `npm run verify:chrome` : **157/159**. Les deux échecs sont connus et décrits
  dans la note (§6) — ce ne sont pas des tests fragiles à ajuster, c'est du
  travail inachevé.
- Le service de vision était épuisé hier ; il devrait répondre aujourd'hui.

## Ce qu'il y a à faire, dans cet ordre

1. **Les deux régressions du format 3 × 4** (note §6) — le seul travail vraiment
   inachevé : la mise en page automatique choisit `10 × 5 = 50` étiquettes de
   18,2 × 55 mm pour 49 liens en coupant **45 lignes**, et le tableau imprimé
   passe de 3 à 5 pages. Pistes dans la note.
2. **L'ajout au clic droit** (note §7) — le chemin est réputé capricieux : trois
   entrées de menu, trois chemins distincts, plus les cas limites (page déjà
   collectée, titre vide, page interdite aux extensions).
3. **La passe de rédaction** (note §8) — chaque affirmation du manuel, du README
   et de la page d'information doit être **testée**, puis gardée, corrigée ou
   retirée. Ce qui n'a pas été vérifié s'écrit comme tel.
4. **Les points visuels** (note §2 à §5) — maintenant que la vision répond :
   l'équilibre de la planche, le pied de page, la longueur de l'aide du
   raccourcissement, l'allure de l'en-tête. Et les captures de la veille n'ont
   jamais été vues.

## Ce qu'il ne faut pas refaire

Déjà fait, mesuré, et tenu par des tests : les champs de saisie et leur focus
teinté (§1, clos) ; l'alignement des QR Codes et des URL sur la planche ; le
décalage d'un cran quand une collection commence à 0 ; le pied de l'application
centré et signé ; l'en-tête de page qui fait la place au lieu de refuser en
silence ; le format A4 3 × 4 et son passage par défaut ; la page d'information
(refonte, FAQ, signature, bouton GitHub retiré).

## Règles de travail du dépôt

- **Français** partout : commentaires, libellés, noms de fonctions, messages de
  commit.
- **Un littéral par clé de traduction.** Une phrase concaténée n'est pas vue par
  le relevé des clés, et la traduction manque pour un texte qui s'affiche en
  entier. Les clés vont dans `src/core/locales/en.js`.
- **Mesurer, pas supposer.** `npm run verify:chrome` ouvre le vrai Chrome et lit
  le document rendu. **Une seule exécution à la fois** : deux runs partagent le
  même profil et se corrompent mutuellement. Après une exécution interrompue :
  `rm -rf .verify-chrome/profile`.
- **Sous médiation d'impression** pour mesurer `#print-root` : hors impression,
  elle est en `display: none` et toute sa géométrie vaut zéro.
- **Après tout changement** : `npm run build`, `npm run sync:safari`, et
  `npm run build:site` si la page publique change. Puis `npm test` (qui
  reconstruit `dist/`).
- **Les comptes de tests** des deux README doivent suivre.
- **iCloud fabrique des copies de conflit** (« app 2.js », « _locales 2 ») dans ce
  dépôt, et Chrome refuse alors de charger l'extension. `npm run build` les retire
  de sa sortie ; `npm run sync:safari` retire celles du paquet Safari.
- **Ne jamais supprimer un fichier au motif qu'il n'est pas suivi par git.**
  C'est ainsi que quatre fichiers de test et deux modules ont été perdus, et
  réécrits ensuite. Vérifier avec `git ls-files` avant tout `rm`.
- L'accent orange est réservé aux actions ; les mentions restent à l'encre
  secondaire. Les contrastes sont vérifiés par les tests, ne pas les affaiblir
  sans mesure.
