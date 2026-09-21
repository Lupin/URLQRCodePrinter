# Privacy Policy — URLQRCodePrinter

**Product:** the URLQRCodePrinter browser extension (Chrome, Brave, Edge) and the
URLQRCodePrinter application for Safari (macOS, iOS, iPadOS).
**Publisher:** Gaël Abegg-Gauthey.
**Contact:** abegg.gauthey@gmail.com
**Last updated:** 21 September 2026.

---

## English

### The short version

URLQRCodePrinter collects links **you choose**. Those links are stored on your own
device. There is no account, no server, and no analytics. Nothing is sent
anywhere unless you explicitly ask for a link to be shortened — and in that case
only the link itself is sent, to the shortening service you picked.

### What is stored, and where

When you add a page, a link, or a selected address, the extension saves it —
along with its title and the date it was added — in the browser's own local
storage for extensions (`chrome.storage.local`, or Safari's equivalent). Your
preferences (chosen shortening service, layout options) are stored in the same
place.

This data stays on your device. It is not synchronised to any account, and it is
not transmitted to the publisher. Removing the extension removes it.

### When data leaves your device

Only one feature sends anything over the network: **shortening a link**. When
you click the shorten button, the link you selected is sent to one of four
third-party services, whichever you chose:

| Service | Address | Operator |
|---|---|---|
| TinyURL | `https://tinyurl.com` | TinyURL, LLC — commercial service |
| is.gd | `https://is.gd` | volunteer-run service |
| v.gd | `https://v.gd` | volunteer-run service |
| spoo.me | `https://spoo.me` | independent service, provides click statistics |

The service returns a short link, which is then stored locally like any other.
Only the address being shortened is sent. No identifier, no account, no
information about you or your browser accompanies it. Each service applies its
own privacy policy to what it receives; the publisher of URLQRCodePrinter has no
access to that data and no relationship with those services.

If you never use the shorten feature, URLQRCodePrinter makes **no network
requests at all**.

### What is not done

- No analytics, telemetry, or crash reporting.
- No advertising, and no data sold or transferred to data brokers.
- No user accounts, and no server operated by the publisher.
- No remotely hosted code: every line the extension executes ships inside it.
- No reading of your browsing activity beyond the single link you act on.

### Why each permission is requested

| Permission | Why it is needed |
|---|---|
| `contextMenus` | To offer "Add this page / this link / this selection" in the right-click menu. |
| `storage` | To keep your links and preferences on your device. |
| `activeTab` | To read the address of the **current** tab when you click the toolbar button — and only then. |
| `scripting` | To read the page's title when you add it, so labels stay recognisable. |

The extension requests no host permissions. It cannot read the pages you visit
in the background, and it has no access to your history.

### Children

URLQRCodePrinter is a general-purpose utility. It is not directed at children and
does not knowingly collect data from them.

### Changes

Any change to this policy will be published in this file, with the date above
updated. Because the code is open source, every version corresponding to a
published release remains auditable.

### Chrome Web Store Limited Use

The use of information received from Google APIs will adhere to the
[Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq),
including the [Limited Use](https://developer.chrome.com/docs/webstore/program-policies/limited-use)
requirements.

---

## Français

### En bref

URLQRCodePrinter collecte les liens **que vous choisissez**. Ces liens sont
stockés sur votre propre appareil. Il n'y a ni compte, ni serveur, ni mesure
d'audience. Rien n'est envoyé nulle part, sauf si vous demandez explicitement le
raccourcissement d'un lien — et dans ce cas, seul le lien lui-même est transmis,
au service que vous avez choisi.

### Ce qui est stocké, et où

Quand vous ajoutez une page, un lien ou une adresse sélectionnée, l'extension
l'enregistre — avec son titre et la date d'ajout — dans le stockage local que le
navigateur réserve aux extensions (`chrome.storage.local`, ou l'équivalent
Safari). Vos préférences (service de raccourcissement, options de mise en page)
sont conservées au même endroit.

Ces données restent sur votre appareil. Elles ne sont synchronisées vers aucun
compte et ne sont pas transmises à l'éditeur. Désinstaller l'extension les
supprime.

### Quand des données quittent votre appareil

Une seule fonction envoie quoi que ce soit sur le réseau : **le raccourcissement
d'un lien**. Quand vous cliquez sur le bouton de raccourcissement, le lien
sélectionné est transmis à l'un des quatre services tiers, selon votre choix :

| Service | Adresse | Exploitant |
|---|---|---|
| TinyURL | `https://tinyurl.com` | TinyURL, LLC — service commercial |
| is.gd | `https://is.gd` | service bénévole |
| v.gd | `https://v.gd` | service bénévole |
| spoo.me | `https://spoo.me` | service indépendant, fournit des statistiques de clics |

Le service renvoie un lien court, qui est ensuite stocké localement comme
n'importe quel autre. Seule l'adresse à raccourcir est transmise. Aucun
identifiant, aucun compte, aucune information sur vous ou votre navigateur ne
l'accompagne. Chaque service applique sa propre politique de confidentialité à ce
qu'il reçoit ; l'éditeur d'URLQRCodePrinter n'a accès à aucune de ces données et
n'entretient aucune relation avec ces services.

Si vous n'utilisez jamais le raccourcissement, URLQRCodePrinter n'émet
**absolument aucune requête réseau**.

### Ce qui n'est pas fait

- Aucune mesure d'audience, télémétrie ou remontée de plantage.
- Aucune publicité, et aucune donnée vendue ou cédée à des courtiers en données.
- Aucun compte utilisateur, et aucun serveur exploité par l'éditeur.
- Aucun code hébergé à distance : chaque ligne exécutée par l'extension est
  embarquée dans l'extension.
- Aucune lecture de votre navigation au-delà du lien unique sur lequel vous
  agissez.

### Pourquoi chaque permission est demandée

| Permission | Raison |
|---|---|
| `contextMenus` | Proposer « Ajouter cette page / ce lien / cette sélection » au clic droit. |
| `storage` | Conserver vos liens et vos préférences sur votre appareil. |
| `activeTab` | Lire l'adresse de l'onglet **courant** quand vous cliquez sur le bouton — et seulement à ce moment. |
| `scripting` | Lire le titre de la page que vous ajoutez, pour que les étiquettes restent reconnaissables. |

L'extension ne demande aucune autorisation d'hôte. Elle ne peut pas lire en
arrière-plan les pages que vous consultez et n'a aucun accès à votre historique.

### Enfants

URLQRCodePrinter est un utilitaire généraliste. Il ne s'adresse pas aux enfants
et ne collecte pas sciemment de données les concernant.

### Modifications

Toute modification de cette politique sera publiée dans ce fichier, avec la date
ci-dessus mise à jour. Le code étant open source, chaque version correspondant à
une publication reste auditable.
