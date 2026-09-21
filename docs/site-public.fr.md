# Le site public

[← Documentation](README.md)

Le site sert deux choses sous une même adresse, et les sépare volontairement :

| Chemin | Contenu |
|---|---|
| `/` | Page de présentation, en français |
| `/en/` | La même, en anglais |
| `/app/` | L'application elle-même |

## Pourquoi cette séparation

Une page de présentation et un outil n'ont pas les mêmes contraintes. La
première s'adresse à quelqu'un qui découvre, le second à quelqu'un qui travaille.
Les fusionner obligerait à choisir, pour chaque élément, lequel des deux publics
il sert.

L'application reste sous `/app/` **sans être modifiée** : `dist/web` est lu par
`test/web.test.js`, `web-boot.test.js` et `scripts/serve.mjs`, et le déplacer
pour les besoins du site casserait trois choses qui n'ont rien à voir avec lui.
Le site est un assemblage, pas un déplacement.

C'est possible parce que tous les imports de l'application sont **relatifs**
(`./core/...`) : elle fonctionne sous n'importe quel sous-chemin, sans
réécriture d'URL.

## Construire

```bash
npm run build:site      # dist/site
npm run build:site -- --no-build   # réutilise dist/web déjà construit
```

`--no-build` n'est pas qu'une commodité : `build.mjs` supprime son dossier de
sortie avant de le repeupler, donc reconstruire `dist/web` pendant la suite de
tests entrerait en course avec les tests qui le lisent.

## Déployer sur Vercel

`vercel.json` déclare déjà la commande et le dossier de sortie :

```json
{
  "buildCommand": "npm run build:site",
  "outputDirectory": "dist/site"
}
```

**Par le tableau de bord** — la voie recommandée, parce qu'elle rend le
déploiement automatique :

1. Sur vercel.com, « Add New… → Project », puis importer le dépôt GitHub
   `Lupin/URLQRCodePrinter`.
2. Ne rien changer aux réglages : `vercel.json` est lu.
3. Déployer.

Chaque `git push` sur `main` redéploie ensuite tout seul. Aucune CLI, aucun
jeton à stocker sur une machine.

**Par la CLI**, si vous préférez :

```bash
npx vercel --prod
```

Elle demande une connexion interactive la première fois.

## L'argument technique, au-delà du confort

**Web Bluetooth exige un contexte sécurisé.** L'application ne fonctionne donc
qu'en `localhost` ou en HTTPS. Sans hébergement public, l'impression Niimbot
reste inutilisable pour quiconque n'est pas devant la machine de développement —
ce n'est pas un agrément, c'est la condition pour que la fonction existe.

## Ce que le site ne résout pas

**Les deux applications ne partagent pas leurs données.** L'application web
stocke dans IndexedDB, l'extension dans `chrome.storage.local`. Quelqu'un qui
essaie l'application puis installe l'extension repart d'une liste vide. La page
d'accueil le dit explicitement dans « Ce qu'il ne fait pas » : mieux vaut
l'annoncer que le laisser découvrir.

## Vérification

`test/site-build.test.js` contrôle la structure et surtout la **résolution des
chemins relatifs**, qui est ce qui casse en silence quand un fichier est
déplacé. La page anglaise est la plus exposée : elle vit dans un sous-dossier,
donc tous ses chemins remontent d'un cran.

Ce qui **n'est pas** vérifié : le rendu visuel. Aucun test ne regarde la page, et
aucun aperçu n'a pu être produit dans l'environnement de développement — le
navigateur sans interface n'y obtient pas de quoi créer son profil. À regarder
une fois le premier déploiement fait.
