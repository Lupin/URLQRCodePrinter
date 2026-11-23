# Versions précédentes de la fiche Chrome Web Store

Les captures et les visuels promotionnels sont **écrasés à chaque version** : ce
dossier garde la trace de ce qui a été publié avant.

| Version | Source | Contenu |
|---|---|---|
| `0.3.1` | commit `1d3309c` | 10 captures (04 = mention de confidentialité), promo 440 × 280 et marquee |
| `0.4.0` | commit `68b7e62` | 10 captures (04 = mention de confidentialité), promo 440 × 280 et marquee |

`npm run store` archive automatiquement la série courante dans ce dossier quand
la version du paquet change : il lit `store/screenshots/VERSION` avant de refaire
les captures, copie la série si elle appartient à une autre version, puis écrit
la nouvelle version dans ce marqueur. Aucune archive n'est utilisée par le build
ni par le dépôt au Store.

Les captures 0.5.0 et suivantes remplacent le créneau `04` par le **mode
Tableau** ; les versions antérieures conservent la mention de confidentialité.
