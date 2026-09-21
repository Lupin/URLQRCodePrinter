# Captures d'écran

Déposez ici les captures destinées à la fiche du Chrome Web Store.

> Le dossier est vide à dessein : ce fichier existe pour qu'il soit versionné,
> Git ne suivant pas les dossiers vides.

## Ce que le magasin exige

| | |
|---|---|
| Nombre | **au moins 1**, jusqu'à **5** — la documentation recommande le maximum |
| Dimensions | **1280 × 800** (préféré) ou **640 × 400** |
| Format | PNG ou JPEG |
| Cadrage | **coins carrés, aucun remplissage** (*full bleed*) |

Deux précisions qui évitent de refaire le travail :

- **1280 × 800 est préférable**, mais toutes les captures sont ensuite réduites à
  640 × 400 par le magasin. Une image chargée en texte devient illisible à cette
  réduction : mieux vaut des captures larges et peu denses.
- **Aucun cadre, aucune marge, aucune ombre ajoutée.** Le magasin présente les
  images telles quelles ; une capture déjà encadrée s'afficherait avec une double
  bordure.

## Ce qu'elles doivent montrer

La documentation demande des captures qui **démontrent l'expérience réelle** —
les fonctions principales, telles qu'un utilisateur les rencontre. Pas de
maquette, pas d'écran inventé.

Pour ce projet, cinq captures qui se répondent :

1. La fenêtre de l'extension, avec quelques liens déjà collectés.
2. Le menu contextuel, sur « Ajouter cette page à URLQRCodePrinter ».
3. La planche d'étiquettes et son aperçu de QR code.
4. L'onglet d'impression Niimbot, avec l'imprimante connectée ou l'aperçu.
5. La page de mention de confidentialité — elle fait partie de l'expérience, et
   la montrer appuie la déclaration faite dans les champs de confidentialité.

## Comment elles sont nommées

Le préfixe donne l'ordre d'affichage, le suffixe la langue :

```
01-fenetre-popup-fr.jpg              la fenêtre, ouverte sur une page
02-application-fr.png                l'application : collection, mise en forme, aperçu
03-impression-niimbot-fr.png         l'onglet d'impression sur l'imprimante
04-mention-confidentialite-fr.png    la mention, en attente d'accord
```

Les quatre sont en **1280 × 800**, le maximum autorisé étant cinq captures.

`02`, `03` et `04` sont produites par `scripts/capture-store-shots.mjs`, qui les
prend depuis l'extension réelle dans Brave : elles sont donc reproductibles.
`01` vient d'une capture d'écran manuelle — c'est la seule que ce script ne sait
pas produire, la fenêtre de l'extension ne s'ouvrant pas depuis le contenu web.

Le magasin permet des captures **par langue**. Le manifeste déclare `fr` par
défaut, avec `en` : si vous visez les deux, suffixez `-en` pour la seconde
série. Sans elle, la fiche anglaise affichera les captures françaises.

## Un piège à connaître

Le magasin **réduit à 640 × 400**. Une capture prise sur un écran Retina fera
2560 × 1600 : ce n'est pas la bonne taille. Il faut la ramener à 1280 × 800
avant de la déposer, sinon le recadrage du magasin ne correspondra pas à ce que
vous avez cadré.

```bash
sips -z 800 1280 capture-brute.png --out 01-fenetre-fr.png
```

`-z` prend la **hauteur puis la largeur**, dans cet ordre — l'inverse de ce qu'on
écrit naturellement.
