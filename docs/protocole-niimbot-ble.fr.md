# Note technique — protocole BLE des imprimantes d'étiquettes NIIMBOT

Cible : implémentation Web Bluetooth (navigateur) et CoreBluetooth (macOS / iOS).
Modèles traités : **D110**, « D110A », **M2 (M2_H)**, **B1**, **B21**.
Date de relevé des sources : état des dépôts au **14 septembre 2026**.

## 0. Corpus de sources (hiérarchie de confiance)

| Source | Nature | Poids |
|---|---|---|
| [printers.niim.blue](https://printers.niim.blue/interfacing/proto/) — [dépôt wiki](https://github.com/MultiMote/niimbot-wiki) | Wikis communautaire, tables de commandes générées depuis l'API cloud NIIMBOT | Référence de format |
| [MultiMote/niimbluelib](https://github.com/MultiMote/niimbluelib) (`src/`) | Implémentation TS/JS la plus complète, Web Bluetooth + Node + série | Référence d'implémentation |
| [iscarelli/niimbot-web-bluetooth](https://github.com/iscarelli/niimbot-web-bluetooth) — [`docs/protocol-v4.md`](https://github.com/iscarelli/niimbot-web-bluetooth/blob/main/docs/protocol-v4.md), `docs/NOTES.md`, `registry.json` | Driver Web Bluetooth **validé sur matériel réel** (D110, M2-H, B1, B1 Pro, D11_H), journal de mesures | Meilleure source pour les contraintes réelles |
| [API cloud NIIMBOT](https://print.niimbot.com/api/hardware/list) | Données constructeur officielles (codes modèle, dpi, largeurs, densités) | Autorité pour la géométrie |
| [AndBondStyle/niimprint](https://github.com/AndBondStyle/niimprint), [labbots/NiimPrintX](https://github.com/labbots/NiimPrintX), [talaviram/libreniim](https://github.com/talaviram/libreniim) (Swift/CoreBluetooth) | Implémentations indépendantes (Python, Python, Swift) | Contre-vérification |

---

## 1. UUID et caractéristiques

### 1.1 UUID BLE

| Modèle | Service UUID | Caractéristique UUID | Propriétés | Confiance |
|---|---|---|---|---|
| **D110** (ID 2304/2305) | `e7810a71-73ae-499d-8c15-faa9aef0c3f2` | `bef8d6c9-9c21-4c9e-b632-bd58c1009f9f` | `NOTIFY` + `WRITE_NO_RESPONSE` | **Élevée** |
| **D110_M** (2320), **Hi-D110** (2305) | idem | idem | idem | **Élevée** (famille D110) |
| **M2_H** (4608) | idem | idem | idem | **Élevée** |
| **B1** (4096), **B1_PRO** (4097) | idem | idem | idem | **Élevée** |
| **B21** (768) et dérivés | idem | idem | idem | **Élevée** |
| **D110A** | *aucune source ne documente ce modèle* — voir §6 | — | — | **Nulle** |

**Croisement (3 auteurs indépendants, même couple d'UUID) :**

1. [printers.niim.blue/interfacing/connecting](https://printers.niim.blue/interfacing/connecting/) : « most of NIIMBOT printers have characteristic `bef8d6c9-…` of service `e7810a71-…` ».
2. [MultiMote/niimbot-web-ble-terminal](https://github.com/MultiMote/niimbot-web-ble-terminal/blob/main/static/niimbot-web-terminal.js#L2-L3) (`static/niimbot-web-terminal.js`, l. 2-3) — constantes `SERVICE_UUID` / `CHARACTERISTIC_UUID`.
3. [iscarelli/niimbot-web-bluetooth](https://github.com/iscarelli/niimbot-web-bluetooth/blob/main/src/niimbot.js#L53-L54) (`src/niimbot.js`, l. 53-54, `SVC_UUID` / `CHAR_UUID`) — driver validé matériellement sur D110 et M2-H.

`niimbluelib` confirme indirectement en filtrant sur `SERVICES = ["e7810a71-73ae-499d-8c15-faa9aef0c3f2"]` ([`src/client/bluetooth_impl.ts`](https://github.com/MultiMote/niimbluelib/blob/main/src/client/bluetooth_impl.ts), classe `BleDefaultConfiguration`), mais **ne code pas en dur la caractéristique** : il la découvre en cherchant `properties.notify && properties.writeWithoutResponse` dans le premier service dont l'UUID fait plus de 4 caractères. `NiimPrintX` fait de même (découverte par propriétés, `find_characteristics()` dans `NiimPrintX/nimmy/printer.py`), de même que `LibreNiim` en CoreBluetooth.

> **Conséquence de conception :** le couple d'UUID ci-dessus est le seul documenté et suffit pour un `getCharacteristic()` en dur, mais **le code robuste doit d'abord tenter l'UUID connu, puis retomber sur une découverte par propriétés** (`notify` + `writeWithoutResponse`) pour couvrir les variantes de firmware.

### 1.2 Piège de filtrage Web Bluetooth (critique)

Les imprimantes **n'annoncent pas** le service UUID dans leur paquet d'advertising. Le service n'est visible qu'**après connexion GATT**.

- ❌ `navigator.bluetooth.requestDevice({ filters: [{ services: [SVC_UUID] }] })` → **sélecteur vide**. Mesuré le 2026-08-13 sur un D11 *et* un B1 Pro : « A filter that cannot find hardware we own is not a filter, it is a dead end » ([`src/niimbot.js`, § device filtering](https://github.com/iscarelli/niimbot-web-bluetooth/blob/main/src/niimbot.js)).
- ✅ Filtrage **par préfixe de nom annoncé**, avec le service en `optionalServices` :
  ```js
  navigator.bluetooth.requestDevice({
    filters: [{ namePrefix: 'D110' }],       // ou 'M2', 'B1', 'B21'
    optionalServices: ['e7810a71-73ae-499d-8c15-faa9aef0c3f2']
  })
  ```
- Le nom annoncé est du type `D110-FC06023035`, `M2_H-H107060027`, `D11_H-…`, `B1-…`, `N1-H324110115`. **Le nom ne suffit pas à distinguer B1 de B1 Pro** (même préfixe `B1`) : il faut interroger le modèle (§1.3).
- `niimbluelib` élargit le filtre à *toutes* les premières lettres de ses modèles (`NAME_FILTERS`, `BleDefaultConfiguration`), ce qui est une stratégie de repli acceptable.

### 1.3 Identification du modèle et du niveau de protocole (indispensable avant impression)

```
PrinterStatusData  0xA5 [01]  → 0xB5     // protocolVersion
PrinterInfo        0x40 [08]  → 0x48     // modelId (u16 BE ; si 1 octet, valeur = octet << 8)
```

Version de protocole, à partir de la réponse au `Connect` puis de `0xB5` ([wiki, § Connect](https://printers.niim.blue/interfacing/proto/) ; [`src/packets/protocol.ts`](https://github.com/MultiMote/niimbluelib/blob/main/src/packets/protocol.ts), `connectNegotiate`) :

| `Connect` (0xC2) data | Signification |
|---|---|
| `0x00` | déconnecté |
| `0x01` | connecté, **protocolVersion = 0** |
| `0x02` | `ConnectedNew`, **protocolVersion = 1** |
| `0x03` | `ConnectedV3` → envoyer `0xA5`, puis lire `data[11]`,`data[12]` : `n = data[11]*100 + data[12]` |
| `0x5a` | erreur firmware |

Puis : `204 ≤ n < 300` → **v3** ; `300 ≤ n < 302` → **v4** ; `n ≥ 302` → **v5**. `data[10] > 0` indique le support couleur.

> **Terminologie.** Il n'existe pas de « protocole V3 » unique. `ConnectedV3` est une **réponse de handshake** signalant « protocole ≥ 3 », et la version réelle (3, 4 ou 5) se lit ensuite dans `0xB5`. Le « new protocol » des articles correspond à `ConnectedNew` (version 1) **ou** `ConnectedV3` (≥ 3) selon l'auteur : à ne pas confondre.

Codes modèle utiles (API cloud + `printer_models.ts`) :

| Modèle | modelId | dpi | Tête (px) | task d'impression |
|---|---|---|---|---|
| D110 | 2304, 2305 | 203 | **96** | `D110` (niimbluelib) / `b1` (iscarelli) |
| D110_M | 2320 | 203 | 96 | `B1`, ou `D110M_V4` si protocolVersion = 4 |
| D11 / D11S | 512 / 514 | 203 | 96 | `D11_V1` (firmware ancien) ou `D110` (v1/v2) |
| D11_H | 528 | 300 | 144 | `D110M_V4` |
| **M2_H** (« M2 ») | 4608 | 300 | **576** (rapporté) | `B1` |
| B1 | 4096 | 203 | 384 | `B1` |
| B1_PRO | 4097 | 300 | 567–576 | `D110M_V4` |
| B21 | 768 | 203 | 384 | `B21_V1` |
| B21_PRO | 785 | 300 | 576 | `D110M_V4` |

### 1.4 Géométrie de la tête — D110 et M2

| | **D110** | **M2_H (« M2 »)** |
|---|---|---|
| Résolution | **203 dpi** (`paccuracy: 8`) | **300 dpi** (`paccuracy: 9`) |
| Largeur de tête utile | **96 px** = **12 mm** (8 px/mm) | **576 px** rapportés par l'imprimante (48,8 mm) |
| Largeur d'étiquette max (constructeur) | `maxPrintWidth: 15` mm | `maxPrintWidth: 50` mm |
| Largeur étiquette paramétrable | `widthSetStart: 12`, `widthSetEnd: 12` mm | `widthSetStart: 20`, `widthSetEnd: 48` mm |
| Hauteur max (constructeur) | `maxPrintHeight: 100` mm | `maxPrintHeight: 240` mm |
| Sens d'impression | `left` (rotation 90° CW) | `top` (pas de rotation) |
| Type | thermique direct | **transfert thermique** (ruban) |
| Densité | 1–[2]–3 | 1–[3]–5 |

**Le cas « étiquettes 15 mm » du D110 — point contre-intuitif majeur.** Le D110 est vendu pour des étiquettes jusqu'à **15 mm** de large, mais sa tête ne fait que **96 px = 12 mm**. Une étiquette de 15 mm conserve donc **≈ 1,5 mm non imprimé de chaque côté**, et c'est matériel, pas un réglage. Mesuré sur matériel le 2026-08-14 : envoi d'une page de 120 px (15 mm à 203 dpi) → impression **rognée à 12 mm** ; tête bornée par deux encadrements opposés (un « 50 » à 2 chiffres survit, un « 100 » à 3 chiffres est tronqué → tête ≥ 96 ; cinq bandes de largeurs croissantes 80/96/104/112/120 px donnent des bandes identiques à partir de 96 → tête ≤ 96). Sources : [`registry.json`](https://github.com/iscarelli/niimbot-web-bluetooth/blob/main/registry.json) entrée `T15*50`, [`printer_models.ts`](https://github.com/MultiMote/niimbluelib/blob/main/src/printer_models.ts) (`D110.printheadPixels: 96`), [wiki D110](https://printers.niim.blue/hardware/niimbot-d110/) (« 12 mm / 96 px (verified) »).

> **Règle d'implémentation :** `SetPageSize.cols` (largeur, axe de la tête) doit valoir **96** pour un D110, **jamais** la largeur de l'étiquette. `niimbluelib` applique `printheadPixels` du modèle ; l'imprimante **rogne silencieusement** les colonnes au-delà de 96 et ne renvoie aucune erreur.

**M2_H :** l'imprimante **rapporte elle-même 576 px** via `probe(0xDC, [0x03])` → réponse `0xDE`, octets 4-5 = `02 40` = 576. Le `registry.json` d'iscarelli utilise **567** délibérément : ≈ 1,4 mm de marge à droite parce que ce modèle **à ruban** (transfert thermique) dérive légèrement. `niimbluelib` est **incohérent avec lui-même** sur ce point : `docs/.../niimbot_models.md` annonce 576 px, mais `src/printer_models.ts` porte `printheadPixels: 567` pour `M2_H`. **576 est la valeur la mieux étayée** (rapportée par le matériel + wiki « 48 mm / 576 px (verified) ») ; 567 est une marge d'exploitation, pas la largeur de tête.

**Limite de hauteur.** Il n'existe pas de « nombre de lignes par paquet » : le protocole est un flux de trames, une trame par ligne (ou par groupe de lignes identiques via `repeat`). La hauteur est portée par `SetPageSize.rows` (u16 BE) et bornée par le papier (`maxPrintHeight` : 100 mm pour D110, 240 mm pour M2_H). Le compteur de lignes est un **u16** → plafond structurel 65 535 lignes, jamais atteint en pratique.

---

## 2. Format de paquet

### 2.1 Trame standard

```
 0x55 0x55 │ CMD │ LEN │ DATA[0..LEN-1] │ XOR │ 0xAA 0xAA
   head    │     │     │                 │ cks │   tail
```

**Checksum = XOR de `CMD`, `LEN` et de **tous** les octets de `DATA`** (bornes incluses, aucun octet d'en-tête ni de pied de trame).

Formulation équivalente et plus simple à coder :

```js
let cks = cmd ^ data.length;
for (const b of data) cks ^= b;
```

**Contre-vérifié sur 4 implémentations indépendantes** : [`src/packets/packet.ts`](https://github.com/MultiMote/niimbluelib/blob/main/src/packets/packet.ts) (getter `checksum`), [wiki § Simple request packet](https://printers.niim.blue/interfacing/proto/), [`niimprint/packet.py`](https://github.com/AndBondStyle/niimprint/blob/master/niimprint/packet.py), [`NiimPrintX/nimmy/packet.py`](https://github.com/labbots/NiimPrintX/blob/main/NiimPrintX/nimmy/packet.py), [`NimbotPacket.swift`](https://github.com/talaviram/libreniim/blob/main/apple/LibreNiim.swiftpm/Niim/NimbotPacket.swift). **Aucune divergence.**

**Exception unique : la commande `Connect` (0xC1)** est préfixée par un octet `0x03` **avant** l'en-tête.
**Variante CRC32** (mise à jour de firmware uniquement, commandes `0x91/0x92/0x9b/0x9c`) : `55 55 CMD IDX_H IDX_L LEN DATA… CRC32[4] AA AA`, CRC32 sur `[cmd, idxH, idxL, len, …data]`, chunks de 200 octets. **Hors périmètre d'une impression d'étiquette.**

Les valeurs multi-octets sont **big-endian** (u16), sauf mention contraire.

### 2.2 Exemples d'octets annotés (tous recalculés et vérifiés)

**Connexion — le seul paquet avec préfixe :**

```
03 55 55 c1 01 01 c1 aa aa
│  │  │  │  │  │  │  └──┴─ tail
│  │  │  │  │  │  └─ checksum : c1 ^ 01 ^ 01 = c1
│  │  │  │  │  └─ DATA = 01 (payload)
│  │  │  │  └─ LEN = 01
│  │  │  └─ CMD = c1 (Connect)
│  │  └─ head (0x55 0x55)
│  └─ (head)
└─ préfixe 0x03, exclusif à Connect
```

**Réglage de densité à 3 :**

```
55 55 21 01 03 23 aa aa
       │  │  │  └─ checksum : 21 ^ 01 ^ 03 = 23
       │  │  └─ DATA = 03 (densité 3)
       │  └─ LEN = 01
       └─ CMD = 21 (SetDensity)
```

**Ligne bitmap, tête 96 px → stride = 96/8 = 12 octets.** Motif : 48 px noirs puis 48 px blancs.

```
55 55 85 12 00 00 00 30 00 01 ff ff ff ff ff ff 00 00 00 00 00 00 a6 aa aa
       │  │  └──┤  └──┴──┤  │  └────────────────────┤  │
       │  │     │        │  │                       │  └─ checksum = a6
       │  │     │        │  │                       └─ DATA bitmap, 12 octets (96 px, MSB first, 1 = noir)
       │  │     │        │  └─ repeat = 01 (cette ligne est identique à la suivante ×1 ⇒ 1 seule ligne ici)
       │  │     │        └─ compteur de pixels noirs « total » : C1=00, C2=30 (=48), C3=00
       │  │     └─ numéro de ligne = 0x0000
       │  └─ LEN = 0x12 = 18
       └─ CMD = 85 (PrintBitmapRow)
```

> Annoter `30` comme « 48 » est le point qui piège : c'est bien le **nombre de bits à 1** dans les 12 octets de données, pas une longueur.

**Autres trames utiles (vérifiées) :**

```
SetLabelType(1)                    55 55 23 01 01 23 aa aa
PrintStart 1 octet (D110)          55 55 01 01 01 01 aa aa
PrintStart 7 octets (B1/M2_H)      55 55 01 07 00 01 00 00 00 00 00 07 aa aa
PrintStart 9 octets (M2 v4/D110M)  55 55 01 09 00 01 00 00 00 00 00 01 00 08 aa aa
PrintClear                         55 55 20 01 01 20 aa aa
PageStart                          55 55 03 01 01 03 aa aa
SetPageSize 4o (D110, 400×96)      55 55 13 04 01 90 00 60 e6 aa aa
SetPageSize 6o (B1/M2, 354×576×1)  55 55 13 06 01 62 02 40 00 01 35 aa aa
SetPageSize 13o (v4)               55 55 13 0d 01 62 02 40 00 01 00 00 00 00 00 00 00 3e aa aa
PrintQuantity(1)                   55 55 15 02 00 01 16 aa aa
PrintEmptyRow (ligne 0, ×4)        55 55 84 03 00 00 04 83 aa aa
PageEnd                            55 55 e3 01 01 e3 aa aa
PrintEnd                           55 55 f3 01 01 f3 aa aa
PrintStatus                        55 55 a3 01 01 a3 aa aa
PrinterStatusData                  55 55 a5 01 01 a5 aa aa
PrinterInfo [08] (modelId)         55 55 40 01 08 49 aa aa
Heartbeat Advanced2 [04]           55 55 dc 01 04 d9 aa aa
```
(`PrintStart 9o` ci-dessus est avec `speed=1` ; `pages=1`.)

### 2.3 Encodage du bitmap

- **1 bit par pixel, monochrome, MSB-first** (`0x80` = pixel le plus à gauche), **1 = noir**. `stride = ceil(cols/8)` octets par ligne.
- **Padding** : la largeur est arrondie au multiple de 8 supérieur ; les pixels de bourrage sont laissés à 0 (blanc). Voir [`image_encoder.ts`](https://github.com/MultiMote/niimbluelib/blob/main/src/image_encoder.ts) (`const cols = Math.ceil(originalCols / 8) * 8`).
- **Run-length** : deux lignes identiques consécutives ne sont pas renvoyées deux fois — on incrémente le champ `repeat` (1 octet, max pratique 200). Les lignes entièrement blanches utilisent `PrintEmptyRow` (`0x84`) qui ne transporte aucun octet de pixels. C'est ce qui divise le trafic BLE par 3 à 5 sur des étiquettes réelles (texte, codes-barres).
- **Choix de la commande de ligne** :
  - ligne vide → **`0x84` PrintEmptyRow** `[row u16, run u8]`
  - pixels noirs **> 6** → **`0x85` PrintBitmapRow** `[row u16, C1 C2 C3, run u8, bitmap]`
  - pixels noirs **≤ 6** → **`0x83` PrintBitmapRowIndexed** `[row u16, C1 C2 C3, run u8, index u16 BE ×n]` (positions des pixels noirs ; l'imprimante s'éteint si > 6 selon `niimbluelib`).
- **Segment de compte `C1 C2 C3`** : deux modes. *Split* (défaut) découpe les données en 3 tranches de `printheadPixels/8/3` octets et donne le compte de bits à 1 de chacune (plafonné à 255). *Total* met `C1=0`, `C2`=octet faible, `C3`=octet fort du total. Le mode `auto` de `niimbluelib` choisit selon la taille. **En pratique, envoyer `00 00 00` fonctionne sur la plupart des modèles** — `NiimPrintX` écrit `counts = (0,0,0)` en dur avec le commentaire « It seems like you can always send zeros », et le wiki confirme « the printer works correctly when all three bytes are 0x00 ».
- **Sens d'impression** : `printDirection = "left"` (D110, D11) → **rotation 90° horaire** de l'image source avant encodage. `"top"` (M2, B1, B21) → pas de rotation.
- **Couleur double (rouge/noir)** : commande `0x8A` `PrintBitmapRowDoubleColor`, avec masque de présence puis octets de couleur ; hors périmètre D110 (mono).

---

## 3. Séquence d'impression pas à pas

### 3.1 D110 — task `D110` (source principale : `niimbluelib` + `NiimPrintX`)

Reprise de [`D110PrintTask.ts`](https://github.com/MultiMote/niimbluelib/blob/main/src/print_tasks/D110PrintTask.ts) et de `NiimPrintX/nimmy/printer.py::print_image`.

| # | Commande | Code | Données | Réponse attendue |
|---|---|---|---|---|
| 0 | *(préalable)* Connect | `0xC1` | `01`, préfixe `0x03` | `0xC2` |
| 0b | *(préalable)* PrinterStatusData | `0xA5` | `01` | `0xB5` (version protocole) |
| 0c | *(préalable)* PrinterInfo | `0x40` | `08` | `0x48` (modelId) |
| 1 | SetDensity | `0x21` | `[densité]` (D110 : 1–3, défaut 2) | `0x31` simple |
| 2 | SetLabelType | `0x23` | `[type]` (`1` = avec gaps ; table ci-dessous) | `0x33` simple |
| 3 | **PrintStart** | `0x01` | `[01]` (1 octet) | `0x02` simple |
| 4 | PrintClear | `0x20` | `[01]` | `0x30` simple |
| 5 | PageStart | `0x03` | `[01]` | `0x04` simple |
| 6 | SetPageSize | `0x13` | `[rows u16 BE, cols u16 BE]` (4 octets ; cols = **96**) | `0x14` simple |
| 7 | PrintQuantity | `0x15` | `[qté u16 BE]` | `0x16` simple |
| 8 | **Lignes bitmap** (boucle) | `0x84` / `0x85` / `0x83` | voir §2.3 | **aucune** (one-way) |
| 9 | PageEnd | `0xE3` | `[01]` | `0xE4` simple |
| 10 | **Poll PrintStatus** | `0xA3` | `[01]`, répété | `0xB3` jusqu'à `page == totalPages` |
| 11 | PrintEnd | `0xF3` | `[01]` | `0xF4` simple |

`NiimPrintX` intercale en plus `allow_print_clear()` (`0x20`) et ré-essaie `endPagePrint()` en boucle (`while not await self.end_page_print(): sleep(0.05)`), puis boucle sur `get_print_status()` jusqu'à `status['page'] == quantity`. `niimbluelib` fait l'inverse : `PageEnd` avec attente de `0xE4` (mise à jour du compteur de lignes), puis poll `0xA3`.

**Valeurs de `SetLabelType`** ([wiki, label types](https://printers.niim.blue/other/label-types/)) : `1` = avec gaps (défaut, étiquettes thermiques synthétiques), `2` = noir/black mark, `3` = continu, `4` = perforé, `5` = transparent, `6` = PVC tag, `10` = black mark gap, `11` = gaine thermorétractable.
**Valeurs de `PrintStart.pageColor`** ([`enumerations.ts`](https://github.com/MultiMote/niimbluelib/blob/main/src/packets/enumerations.ts)) : `0` = monochrome, `1` = double couleur, `2` = SingleColorAlt, `3` = MultiorderColor.

### 3.2 M2_H (« M2 ») & B1 — task `b1` / `B1`

`niimbluelib` route **`M2_H`, `D110_M`, `B1`, `B21_C2B`, `N1`, `D101`** vers `B1PrintTask` ([`print_tasks/index.ts`](https://github.com/MultiMote/niimbluelib/blob/main/src/print_tasks/index.ts), `modelPrintTasks`).

**Handshake obligatoire** (iscarelli, validé sur B1 firmware protocol 3) : sans lui, l'imprimante **accepte toutes les commandes de réglage mais n'imprime jamais** — `PageEnd` ne répond pas, le statut reste figé sur l'octet d'état `0x02`, le papier ne bouge pas.

```
PrinterStatusData 0xA5 [01]                              → 0xB5
PrinterInfo       0x40 [sub] pour sub ∈ {08,0b,0d,0a,07,03,0c,09} → 0x48/0x4B/…
Heartbeat         0xDC [04]                              → 0xD9
```

Puis :

| # | Commande | Code | Données |
|---|---|---|---|
| 1 | SetDensity | `0x21` | `[densité]` |
| 2 | SetLabelType | `0x23` | `[1]` |
| 3 | **PrintStart** | `0x01` | **7 octets** : `[pages u16 BE, 00 00 00 00, pageColor]` |
| 4 | PageStart | `0x03` | `[01]` |
| 5 | SetPageSize | `0x13` | **6 octets** : `[rows u16, cols u16, copies u16]` |
| 6 | Lignes bitmap | `0x84`/`0x85`/`0x83` | §2.3, **mode `total`** + `PrinterCheckLine` toutes les 200 lignes si activé |
| 7 | PageEnd | `0xE3` | `[01]` → `0xE4` |
| 8 | Poll PrintStatus | `0xA3` | `[01]` jusqu'à `page == totalPages` |
| 9 | PrintEnd | `0xF3` | `[01]` |

**Copies identiques :** uploader l'image **une seule fois**, déclarer `pages = N` dans `PrintStart` et `copies = N` dans `SetPageSize`. Le compteur `0xB3` monte 1…N, un seul `PrintEnd` en fin de job. C'est le chemin le plus rapide et celui qu'utilise l'appli officielle.

### 3.3 B21 — task `B21_V1`

[`B21V1PrintTask.ts`](https://github.com/MultiMote/niimbluelib/blob/main/src/print_tasks/B21V1PrintTask.ts) :

```
SetDensity [d]  →  SetLabelType [1]  →  PrintStart [01] (1 octet)
boucle par copie :
  PageStart [01]  →  SetPageSize [rows u16, cols u16] (4 octets, mode "total")
  →  lignes bitmap
  →  PrinterCheckLine 0x86 [line u16, 01]  après chaque tranche de 200 lignes
  →  PageEnd [01]
fin : poll en renvoyant PrintEnd jusqu'à ce que DATA == 1  (pas de PrintEnd final)
```

**Différence structurelle majeure :** le B21_V1 ne se termine **pas** par un `PrintEnd` ; la progression se lit en **renvoyant `PrintEnd` en boucle** jusqu'à obtenir `Data == 1` (`waitUntilPrintFinishedByPrintEndPoll`). C'est aussi le mode du B21_L2B.

### 3.4 D110M_V4 / B1_PRO / B21_PRO / D11_H (pour comparaison)

`PrintStart` **9 octets** `[pages u16, 00 00 00 00, pageColor, speed, flag]`, **pas de `PageStart`**, `PrintStatus 0xA3` **one-way sans attente** juste après `PrintStart` (contournement : le B21_PRO perd le premier paquet après `PrintStart` en BLE), `SetPageSize` **13 octets**, puis `PrintEnd`, puis un `Heartbeat` **one-way** (le B21_PRO perd le premier paquet après `PrintEnd`).

### 3.5 Statuts et notifications à attendre

| Notification | Code | Contenu |
|---|---|---|
| **In_PrintStatus** | `0xB3` | `page u16 BE`, `pagePrintProgress u8`, `pageFeedProgress u8` [, 2 octets ignorés, `error u8` si payload = 10]. Parser : [`packet_parser.ts::parsePrintStatusResponse`](https://github.com/MultiMote/niimbluelib/blob/main/src/packets/packet_parser.ts) |
| **In_PrintError** | `0xDB` | `[code]` — voir table ci-dessous. **Certains modèles renvoient `0xDB 06` (« DataError ») quand le task/format de page est refusé** : signature de refus du D110 face à `SetPageSize` 13 octets |
| **In_PrinterCheckLine** | `0xD3` | `[row_hi, row_lo, 01]`. **C'est un compteur de lignes reçues**, pas un « check line » — utile pour détecter une troncature : si la dernière valeur `0xD3` < dernière ligne envoyée, la queue du flux s'est perdue |
| **In_PrinterPageIndex** | `0xE0` | `[page u16 BE]` — progression sur les **anciens D11** (`waitUntilPrintFinishedByPageIndex`) |
| **In_Connect** | `0xC2` | `[connectResult]` (§1.3) |
| **In_PrinterStatusData** | `0xB5` | version de protocole, support couleur, tailles de paquet |
| **Heartbeat Advanced1** | `0xDD` | payload 10/13/19/20 octets : `lidClosed`, `chargeLevel`, `paperInserted`, `paperRfidSuccess`. **`lidClosed` est inversé (1 = fermé) pour les modelId 512, 513, 514, 272, 273, 274, 1792, 2304, 2560, 3584, 3840, 4352, 5120** — dont le D110 (2304) |
| **Heartbeat Advanced2** | `0xD9` | ≥ 9 octets : `chargeLevel`, `temp`, `lidClosed` (**0 = fermé ici**), `paperInserted`, `paperRfidSuccess`, … — **l'inversion est propre au modèle** |
| **Heartbeat PrinterInfo** | `0xDE` | `VH VL VH VL WH WL AC HA SR SW` : versions, **largeur de tête (u16)**, classe de résolution (`0x02` = 203 dpi, `0x03` = 300 dpi) |
| **In_NotSupported** | `0x00` | fonction non supportée |

**Codes d'erreur `0xDB`** (extraits utiles) : `0x01` CoverOpen, `0x02` LackPaper, `0x03` LowBattery, `0x05` UserCancel, `0x06` DataError, `0x07` Overheat, `0x09` PrinterBusy, `0x0d` NoRibbon, `0x0f` UsedRibbon, `0x10` WrongPaper, `0x16` CommunicationException, `0x17` Disconnect, `0x34` ReceiveDataTimeout.

**À attendre concrètement pendant une impression D110/M2 :** `0x31`, `0x33`, `0x02` (init) ; `0x14`, `0x16` (page) ; puis **`0xD3` sporadiques** pendant le flux de lignes ; puis **`0xE4`** (PageEnd) ; puis **`0xB3`** avec `pagePrintProgress` / `pageFeedProgress` croissants ; `0xF4` en fin. Les `0x84`/`0x85`/`0x83` ne reçoivent **jamais** de réponse.

---

## 4. Bibliothèques réutilisables

| Nom | URL | Langage | Modèles supportés | Transport | Maturité (sept. 2026) |
|---|---|---|---|---|---|
| **`@mmote/niimbluelib`** | [MultiMote/niimbluelib](https://github.com/MultiMote/niimbluelib) · npm v**0.46.0** (13/09/2026) · MIT | TypeScript / JS | **80+ modèles** via table `printer_models.ts` ; **D110 : task dédié ; M2_H : task `B1`** ; B1, B21, B21_PRO, D11_H, M3… | **Web Bluetooth** (navigateur), Node via `noble`, **série USB**, Capacitor BLE | ⭐142, **très actif**, référence du domaine. Doc : [libdocs.niim.blue](https://libdocs.niim.blue). Le plus sûr pour un POC navigateur |
| **`niimbot-web-bluetooth`** | [iscarelli/niimbot-web-bluetooth](https://github.com/iscarelli/niimbot-web-bluetooth) · npm v**2.6.0** · MIT | JavaScript (zéro dépendance) | **D110 ✅, M2-H ✅, B1 ✅, B1 Pro ✅, D11_H ✅, B2 Pro ✅, N1 ✅** — *validés sur matériel réel* | **Web Bluetooth** uniquement | ⭐24 mais **la documentation de protocole la plus fiable** (`docs/protocol-v4.md`, `docs/NOTES.md`, `registry.json`). Driver autonome, code lisible, excellent point de départ |
| **`@mmote/niimblue-node`** | [MultiMote/niimblue-node](https://github.com/MultiMote/niimblue-node) · npm v1.3.0 | TypeScript / Node | idem `niimbluelib` (testé **D110 sur macOS**, B1, B21_C2B, B21_PRO) | BLE natif (noble) + série USB, CLI + serveur REST | ⭐48, actif. `niimbluelib-headless` **a été renommé en `niimblue-node`** — le nom « niimbot-headless » n'existe pas |
| **`NiimPrintX`** | [labbots/NiimPrintX](https://github.com/labbots/NiimPrintX) · GPL-3.0 | Python (Poetry) | **D110 (défaut), D11, D11_H, B1, B18, B21** — CLI + GUI | BLE (`bleak`) + USB/série | ⭐**512**, dernier commit 17/05/2026. Fork maintenu de `niimprint`. **Pas de M2** |
| **`niimprint`** | [AndBondStyle/niimprint](https://github.com/AndBondStyle/niimprint) | Python | **D110, D11, B1, B18, B21** (testé) | BLE (`bleak`) + USB/série | ⭐462, dernier commit 15/03/2026. C'est **la base historique** dont dérivent `NiimPrintX` et `LibreNiim` |
| **`niimprint` (original)** | [kjy00302/niimprint](https://github.com/kjy00302/niimprint) | Python | D11 | BLE | ⭐104, **non maintenu** (2023). Ne pas démarrer ici |
| **`LibreNiim`** | [talaviram/libreniim](https://github.com/talaviram/libreniim) · MIT | **Swift / SwiftUI** | **D110 testé** ; D11, D101, B1, B18, B21 dans l'énumération | **CoreBluetooth** via [`AsyncBluetooth`](https://github.com/manolofdez/AsyncBluetooth) | ⭐22, dernier commit 10/2024. **App iOS/iPadOS/macOS sur TestFlight.** Le meilleur exemple CoreBluetooth, mais peu actif |
| `niimbotjs` | [dtgreene/niimbotjs](https://github.com/dtgreene/niimbotjs) | TypeScript / Node | D11 | BLE | ⭐17, peu actif |
| `niimbot-macos-printer-driver` | [olefrerichs/niimbot-macos-printer-driver](https://github.com/olefrerichs/niimbot-macos-printer-driver) | JS (Node) | D110_M testé, D110, D11 | BLE via `niimblue-node` | ⭐13. **File d'attente AirPrint/IPP sur macOS** — utile si l'objectif macOS est « imprimante système » plutôt qu'app native |
| `niim_blue_flutter` | [pub.dev](https://pub.dev/documentation/niim_blue_flutter/1.0.0/niim_blue_flutter/NiimbotBluetoothClient-class.html) | Dart / Flutter | non spécifié | BLE | Faible traçabilité (portage de `niimbluelib`) |

**Absents / inexistants — à signaler explicitement :**

- **`python-niimbot` : n'existe pas.** Aucun résultat sur GitHub (recherche `python-niimbot` → 4 résultats sans rapport), **HTTP 404 sur PyPI** (`https://pypi.org/pypi/python-niimbot/json`). Le paquet PyPI `niimbot-printer` (v0.2.0, 18/04/2026) est un outil **B1 USB uniquement**, sans rapport.
- **`niimbot-headless` : n'existe pas** sous ce nom. GitHub `/search/repositories?q=niimbot-headless` → `total_count: 0` ; PyPI → 404. Le dépôt [`MultiMote/niimbluelib-headless`](https://github.com/MultiMote/niimbluelib-headless) existe mais son README dit **« Renamed to niimblue-node »**.
- **`/niimbot/niimprintx`** est un **fork mort** (dernier push 26/07/2024, 4 ⭐) de `AndBondStyle/niimprint`, sans README. Le projet vivant est `labbots/NiimPrintX`.

**Support Web Bluetooth réel** : `@mmote/niimbluelib` (navigateur, `NiimbotBluetoothClient`) et `iscarelli/niimbot-web-bluetooth`. **Aucune bibliothèque Python ne fait du Web Bluetooth** (impossible : pas de Web Bluetooth hors navigateur). `LibreNiim` est la seule option CoreBluetooth prête à lire.

---

## 5. Contraintes Web Bluetooth et CoreBluetooth

### 5.1 Web Bluetooth

**Disponibilité plateforme.** Chromium uniquement — Chrome, Edge, Opera, Chrome Android, Samsung Internet. **Safari (macOS et iOS) et Firefox ne l'implémentent pas nativement** ([caniuse.com/web-bluetooth](https://caniuse.com/web-bluetooth) ; une extension Safari tierce `iOSWebBLE` polyfille via CoreBluetooth, ce n'est pas du support WebKit). Brave embarque Web Bluetooth **désactivé derrière un flag**. Prérequis : **HTTPS** (ou `localhost`) **et un geste utilisateur** (clic) pour `requestDevice()`.

**Il n'existe AUCUNE API d'MTU.** Pas de `getMTU()`, pas de `maxWriteWithoutResponseSize` — le PR W3C [web-bluetooth#672](https://lists.w3.org/Archives/Public/public-web-bluetooth-log/2026Jun/0012.html) est **ouvert, non livré** (juin 2026). Conséquence, citée dans la proposition elle-même :

> « if you hand it more than `ATT_MTU - 3` bytes, the write either **fails or gets silently chopped** depending on the platform, and the page has no way to tell ahead of time. People end up hard-coding 20 (the old default payload) to be safe. »

Ordres de grandeur mesurés sur ce protocole :

| Grandeur | Valeur | Source |
|---|---|---|
| MTU par défaut (aucun échange) | 23 → **payload 20 octets** | [PR #672](https://lists.w3.org/Archives/Public/public-web-bluetooth-log/2026Jun/0012.html) |
| MTU effectif observé | **≥ 64** (des trames de **61 octets** passent seules) | [`src/niimbot.js`](https://github.com/iscarelli/niimbot-web-bluetooth/blob/main/src/niimbot.js), `BUNDLE_MAX` |
| MTU exploitable en bundle | **≥ 247** (bundles de **240 octets** validés) | idem |
| `niimbluelib` | **ne découpe pas** : un `writeValueWithoutResponse()` par paquet complet, sans bundling | [`bluetooth_impl.ts`](https://github.com/MultiMote/niimbluelib/blob/main/src/client/bluetooth_impl.ts) |
| `LibreNiim` (CoreBluetooth) | **chunk de 150 octets** | `libper.swift` |

**Recommandation de chunking :** ciblez **≤ 20 octets** si vous voulez être universel, mais **mesurez** : sur desktop Chrome, un D110 envoie des trames `0x85` de 25 à 30 octets qui passent. Le comportement sûr et économe est de **grouper plusieurs trames complètes** dans un seul write (voir ci-dessous) tant que la taille reste ≤ 240 octets.

**Écriture sans réponse obligatoire.** La caractéristique n'expose **que** `WRITE_NO_RESPONSE` (pas de `write with response`). `writeValueWithoutResponse()` est la seule voie rapide. Elle est **non ordonnée et non fiable** : le buffer BLE déborde silencieusement.

**Le mode d'écriture et le « pacing » — le piège n°1.** Trois modes, décrits dans [`src/niimbot.js`](https://github.com/iscarelli/niimbot-web-bluetooth/blob/main/src/niimbot.js) :

| Mode | Implémentation | Effet mesuré |
|---|---|---|
| `acked` | `writeValueWithResponse()` | Ordonné, fiable, **~2 s par page** |
| `paced` | `writeValueWithoutResponse()` + **gap de 10 ms** | Fiable ; ~12 ms par write mesuré pour `PACE_MS = 10` — **le temps d'envoi EST le pacing, pas les données** |
| `fast` | `writeValueWithoutResponse()` en rafale | **3 échecs confirmés, 0 succès confirmé** : page blanche rapportée à 100 %, ou étiquette tronquée |

**Ce qui se passe réellement en `fast`** (modèle retenu après mesures) : « an unbundled dense page leaves ~200 writes queued in the OS BLE stack, `writeValueWithoutResponse` resolves long before the packets are on air, and `PageEnd` queues up behind them — so it reaches the printer seconds late, and the same overflowing queue is what drops the rows. » → **lignes perdues → étiquette tronquée ou blanche, sans erreur**.

**Le levier correct n'est pas de baisser le pacing, c'est de réduire le nombre d'écritures.** Le protocole est un **flux de trames** et l'imprimante réassemble : plusieurs trames `[55 55 … aa aa]` peuvent être **concaténées dans un même write** (≤ 240 octets). Résultat mesuré sur une page dense de 208 trames :

| | sans bundling | avec bundling |
|---|---|---|
| writes BLE | 208 | **~21** |
| upload d'une page | ~2080 ms | **334 ms** |
| lot réel de 10 pages | **0 étiquette** | **10 étiquettes entières, 2×, 10,5 s** |

Sur M2-H : 50 trames en 287 ms (5,7 ms/trame) contre 11,5 ms/trame sans bundling — **~1,8 trame par write, temps d'envoi divisé par deux.**

**Spécificité Apple (macOS ET iOS).** `IS_MAC` dégrade automatiquement `fast` → `paced`, et `IS_MAC` matche aussi iOS (tout UA iOS contient « like Mac OS X »). Historique : **page blanche sur macOS en v1.3.3/1.3.4**, et l'unique échec confirmé sur iPhone l'était en mode `fast`. **Sur macOS et iOS, pacez ou bundlez ; ne rafalez pas.** Apple fait passer le BLE par CoreBluetooth, dont le buffer est plus sensible.

**Latence / débit — ordres de grandeur mesurés (B1 Pro, 300 dpi, page 50×30 dense) :**

- ~12 ms par write en `paced` → 2,3 à 3,4 s pour 177 à 273 writes.
- Avec bundling, le coût restant est **~3,5 ms par trame** au moment du `PageEnd` (ack mesuré : 99 trames → 360 ms ; 208 → 750 ms ; 255 → 894 ms).
- **Seuil de continuité ≈ 176 trames par page** : en dessous, l'étiquette suivante est prête avant que la tête ne refroidisse et le lot s'enchaîne sans pause ; au-dessus, le papier s'arrête entre les étiquettes.

**Pause entre étiquettes et encre.** Sur D11_H, la pause après une étiquette est **linéaire en nombre de points noirs chauffés** : ~0,169 ms par point noir, indépendamment de la densité (densité 3 vs 1 → 60 ms d'écart sur une pause de 5 à 7 s) et de la position des points. Coût, pas défaut : aucun réglage ne le supprime.

**Notifications et fragmentation — à implémenter soi-même.** Les notifications arrivent en **flux d'octets**, pas en paquets : plusieurs trames peuvent être collées dans une notification, et une trame peut être **fragmentée sur deux notifications**. Il faut donc **tamponner et resynchroniser sur `0x55 0x55`**. `niimbluelib` le fait dans `processRawPacket()` (`Utils.u8ArrayAppend`, puis `PacketParser.parsePacketBundle`, et jette le buffer s'il ne commence plus par `0x55 0x55`). `niimbluelib` note aussi : « Response may contain multiple packets — if the notification contains an incomplete packet, the parser throws and the buffer is kept for the next chunk. » C'est le bug le plus courant des implémentations maison.

**Autres pièges Web Bluetooth :**

- Filtrage : voir §1.2 — **utiliser `namePrefix`**, pas `services`.
- `gattserverdisconnected` **doit** être écouté : l'imprimante s'éteint seule en veille et coupe la liaison BLE. Sans handler, l'appel suivant échoue avec un « Not connected » sans rapport avec la cause.
- `startNotifications()` **avant** tout envoi, sinon aucune réponse n'arrive.
- Heartbeat : `niimbluelib` envoie `0xDC` toutes les **2000 ms** par défaut, avec abandon de la connexion après **5 échecs consécutifs**. Un D110 sans heartbeat se déconnecte.
- Timeouts par défaut `niimbluelib` : **1000 ms** par paquet (relevé à **5000 ms** pendant l'attente de fin d'impression), poll de statut toutes les **300 ms**.
- Le `PrintStatus` (`0xA3`) est aussi le **heartbeat de progression** : sans lui, `PrintEnd` part au milieu de l'impression et l'étiquette sort **coupée**.

### 5.2 CoreBluetooth (macOS / iOS)

- **`maximumWriteValueLength(for:)` existe** — contrairement au Web Bluetooth. À lire **après connexion** et après découverte de la caractéristique.
  - ⚠️ Piège relevé dans `LibreNiim` : il utilise `maximumWriteValueLength(for: .withResponse)` comme plafond pour des écritures `.withoutResponse`, avec un `assert(chunkSize <= maxSupportPacketSize)`. C'est **conservateur et sûr** (`.withResponse` renvoie MTU−3, donc ≤ la limite `.withoutResponse`), mais ça sous-utilise la bande passante. `maximumWriteValueLength(for: .withoutResponse)` donne la vraie limite.
- **`writeValue(_:for:type:.withoutResponse)` ne fragmente pas** : au-delà de la limite, l'écriture est rejetée ou perdue silencieusement. Découper soi-même (150 octets chez `LibreNiim`).
- **Pacer ou bundler, sans exception, sur Apple.** C'est la conclusion convergente des mesures d'iscarelli (§5.1). CoreBluetooth ne signale pas la saturation du buffer.
- `setNotifyValue(true, for:)` puis `didUpdateValueFor` ; là aussi, **tamponner et resynchroniser sur `0x55 0x55`**.
- Découverte : `CBCentralManager.scanForPeripherals(withServices: nil)` puis filtrage par `peripheral.name` (les services ne sont pas annoncés, §1.2). `NiimPrintX`/`niimbluelib`/`LibreNiim` retiennent tous la caractéristique par **propriétés** (`notify` + `writeWithoutResponse`).
- Info.plist : **`NSBluetoothAlwaysUsageDescription`** obligatoire. macOS demande en plus l'autorisation Bluetooth pour l'app, et pour un processus Node depuis un terminal c'est **le terminal** qu'il faut autoriser (System Settings → Privacy & Security → Bluetooth).
- `maximumWriteValueLength` est disponible **avant** `writeValue` : c'est le seul avantage net de CoreBluetooth sur Web Bluetooth pour ce protocole.
- `AsyncBluetooth` (wrapper Swift concurrency) est utilisé par `LibreNiim` et simplifie beaucoup le callback hell de CoreBluetooth.

---

## 6. Incertitudes et points à vérifier expérimentalement

**Statut de vérification matérielle.** Une étiquette complète est sortie d'une **Niimbot D110 réelle**, imprimée par la session d'impression de l'application. Deux points relevés : l'imprimante **s'identifie correctement à la connexion** (le `modelId` lu est celui d'une D110), et le contenu est correct pour la densité et la taille de texte choisies. Un défaut avait été observé, sans rapport avec le protocole : le texte tourné était rogné dans un sens et pas dans l'autre. C'était un défaut de composition — le titre compté deux fois dans l'épaisseur réservée, et un ancrage différent par sens — corrigé dans `src/core/label.js`. Les points ci-dessous restent ouverts dans la mesure où cet essai ne les tranche pas.

**Contradictions / incertitudes ouvertes — à ne pas trancher sans mesure :**

1. **« D110A » n'existe dans aucune source.** Ni le wiki NIIMBOT, ni `printer_models.ts` de `niimbluelib`, ni l'API cloud officielle (`/api/hardware/list`, 80 modèles) ne listent de `D110A`. La série D110 ne contient que **D110 (2304, 2305)**, **D110_M (2320)** et **Hi-D110 (2305)**. **Si vous avez un « D110A » physique, il faut lire son `modelId` via `PrinterInfo 0x40 [08]` et nous le communiquer** — les UUID sont très probablement les mêmes, mais les paramètres de tête (96 px ? 120 px ?) et le task d'impression ne sont pas garantis. Le nom `HI_D110` (2305) est en revanche documenté avec une tête **15 mm / 120 px**, différente du D110.

2. **Divergence franche sur la séquence D110 : 4 octets ou 6 octets pour `SetPageSize`, avec ou sans `PrintClear`/`PrintQuantity`.**

   | Source | `PrintStart` | `SetPageSize` | `PrintClear` | `PrintQuantity` | Validé matériellement ? |
   |---|---|---|---|---|---|
   | `niimbluelib` (`D110PrintTask`) | **1 o** | **4 o** `[rows, cols]` | **oui** (`0x20`) | **oui** (`0x15`) | Oui, usage quotidien (niimblue) |
   | `NiimPrintX` (`print_image`) | **1 o** | **4 o** | non | **oui** | Oui, D110 = modèle par défaut |
   | `iscarelli` (task `b1`) | **7 o** | **6 o** `[rows, cols, copies]` | non | non | **Oui, journalisé 2026-08-14** : « driven as b1 every command acked and the page printed » |

   Les deux formes de `SetPageSize` (4 o et 6 o) sont donc **acceptées** par le D110, mais **aucune source n'a testé l'autre forme sur le même exemplaire**. iscarelli documente en revanche que le **`SetPageSize` 13 octets et `PageEnd` échouent sur le D110** (réponse `0xDB 06`, « the D110's refusal signature ») — donc **ne jamais router un D110 vers le task `D110M_V4`**. **À vérifier : laquelle des deux séquences produit le moins de lignes perdues, et si `PrintClear`+`PrintQuantity` sont réellement nécessaires sur un D110 récent.**

3. **Largeur de tête du M2_H : 576 ou 567 ?** L'imprimante **rapporte 576** (`probe(0xDC,[0x03])` → `0xDE` octets 4-5 = `02 40`), le wiki dit « 48 mm / 576 px (verified) », mais `niimbluelib` utilise **567** dans `printer_models.ts` (tout en annonçant 576 dans sa propre doc `models.md`) et `iscarelli` utilise **567** comme marge anti-dérive du ruban. **Aucune mesure n'a comparé un aplat noir à 576 et à 584 px** pour trancher sur le bord droit réel. **À vérifier** si vous devez imprimer bord à bord.

4. **`printheadPixels` incohérent dans `niimbluelib` lui-même** (576 dans `docs/documents/niimbot_models.md`, 567 dans `src/printer_models.ts`) — donc **ne pas se fier au tableau `models.md`** pour la valeur opérationnelle.

5. **Longueurs de réponse variables selon le modèle.** Mesuré : heartbeat `0xD9` = **13 octets sur B1 Pro, 11 sur M2-H** ; status `0xB3` = **11 octets sur B1 Pro, 10 sur M2-H**. Les offsets absolus de `0xD9` **ne sont pas transposables d'un modèle à l'autre**. Le wiki confirme que « packet length may vary depending on the printer model ». **Parser par longueur, jamais par offset fixe.**

6. **`lidClosed` est inversé sur certains modelId** (liste : 512, 513, 514, 272, 273, 274, 1792, **2304 (D110)**, 2560, 3584, 3840, 4352, 5120) et **non inversé** sur d'autres (B1 Pro : capturé `1 = OPEN`, alors que d'autres sources annoncent `1 = closed`). **Ne jamais déduire l'état du capot sans table par modèle** — et vérifier empiriquement sur votre exemplaire.

7. **Un seul point de non-retour en écriture : le D110 ne répond pas au 13-octet `SetPageSize`.** Erreur silencieuse, pas de crash. **Toujours vérifier l'ack `0x14` avant d'envoyer les lignes** : sans lui, vous imprimez dans le vide.

8. **Le D110 accepte-t-il réellement plusieurs pages par job ?** `iscarelli` a mesuré que le **N1** accepte un job de 3 copies (toutes les lignes arrivent, `0xD3` rapporte la ligne 399/400) mais **n'imprime qu'une étiquette** et laisse le compteur bloqué sur page 1 → il découpe N copies en N jobs séparés, **par modèle**. Le comportement du D110 sur ce point n'est pas explicitement journalisé. **À tester avant de vous appuyer sur `pages=N` + `copies=N`.**

9. **`PrintBitmapRowIndexed` (`0x83`) : « l'imprimante s'éteint si points noirs > 6 »** (`niimbluelib`, `printBitmapRowIndexed`). Affirmation non corroborée ailleurs et potentiellement dangereuse. `NiimPrintX` et `iscarelli` **ne l'utilisent pas du tout** (toujours `0x85`). **Recommandation : n'implémentez que `0x85` + `0x84`.**

10. **Les trois octets de compte de pixels (`C1 C2 C3`) sont ignorables en pratique.** `NiimPrintX` envoie `(0,0,0)` avec le commentaire « It seems like you can always send zeros », le wiki confirme « usually the printer works correctly when all three bytes are 0x00 ». `niimbluelib` implémente pourtant toute une logique `split`/`total`/`auto`. **Non résolu : existe-t-il un firmware où les zéros échouent ?** En cas de doute, `total` (`C1=0`, `C2`=octet faible du total, `C3`=octet fort) est le mode le plus simple et c'est ce qu'utilise `iscarelli` en production.

11. **`PrintStart` à 1 octet vs 7/9 octets sur le D110** n'est pas seulement une question de taille : sur le B1, le `PrintStart` 7 octets porte le **nombre total de pages** et le **mode couleur**. Un D110 en `PrintStart [01]` **ne peut pas déclarer** de job multi-pages — ce qui recoupe le point 8.

12. **`0xD3` : nom trompeur.** `niimbluelib` l'appelle `PrinterCheckLine` / `In_PrinterCheckLine` et le documente comme une trame *envoyée par le client* tous les 200 lignes (`0x86`). `iscarelli` a mesuré que le `0xD3` **reçu** est un **compteur de lignes reçues** — donc un indicateur de troncature, pas un accusé de contrôle. Deux lectures incompatibles du même code : **à instrumenter si vous devez diagnostiquer des étiquettes courtes.**

13. **Aucune mesure du D110 en bundle Web Bluetooth.** Le bundling n'est validé que sur **B1 (4096)** et **M2-H (4608)** (`MODEL_IDS[...].bundle` dans `iscarelli`), il est **désactivé sur B1 Pro** « for want of testing ». **Le gain attendu est le même sur D110 (jusqu'à ~10×), mais il n'est pas mesuré** — à valider vous-même, avec un contrôle visuel du papier (compter les étiquettes, vérifier qu'aucune n'est courte). **Depuis : une étiquette complète est sortie sur une D110 réelle par la session d'impression de l'application**, ce qui exerce ce chemin ; la taille de groupe qui ferait perdre des lignes n'a pas été cherchée pour autant.

14. **Le `Heartbeat (0xDC [04])` one-way après `PrintStart` / `PrintEnd`** est présenté dans `niimbluelib` comme un contournement du **B21_PRO** qui perd le premier paquet après ces commandes en BLE. **Non observé sur D110 ni M2_H** — à ne pas généraliser, mais à garder comme parade si un premier paquet est perdu.

15. **`niimbot-web-ble-terminal`, wiki et `iscarelli` partagent la même paire d'UUID mais deux d'entre eux viennent du même auteur (MultiMote).** Le troisième (`iscarelli`) est **indépendant et validé matériellement sur D110 et M2-H** — le croisement est donc réel, mais ce n'est pas trois auteurs distincts. Un dump `nRF Connect` sur votre propre D110 lèverait le doute définitivement ; **faites-le avant de coder**.

---

### Récapitulatif des URLs

**Protocole / documentation**
- https://printers.niim.blue/interfacing/connecting/
- https://printers.niim.blue/interfacing/proto/
- https://printers.niim.blue/interfacing/print-tasks/
- https://printers.niim.blue/hardware/models/
- https://printers.niim.blue/hardware/niimbot-d110/
- https://printers.niim.blue/hardware/niimbot-m2h/
- https://printers.niim.blue/other/label-types/
- https://github.com/MultiMote/niimbot-wiki
- https://github.com/iscarelli/niimbot-web-bluetooth/blob/main/docs/protocol-v4.md
- https://github.com/iscarelli/niimbot-web-bluetooth/blob/main/docs/NOTES.md
- https://github.com/iscarelli/niimbot-web-bluetooth/blob/main/registry.json
- https://print.niimbot.com/api/hardware/list

**Code**
- https://github.com/MultiMote/niimbluelib (`src/client/bluetooth_impl.ts`, `src/packets/packet.ts`, `src/packets/packet_generator.ts`, `src/packets/protocol.ts`, `src/packets/packet_parser.ts`, `src/packets/commands.ts`, `src/packets/enumerations.ts`, `src/image_encoder.ts`, `src/printer_models.ts`, `src/print_tasks/`)
- https://github.com/MultiMote/niimbluelib/issues/1 (modèles testés)
- https://github.com/MultiMote/niimbluelib/issues/28 (échelle du niveau de batterie)
- https://github.com/iscarelli/niimbot-web-bluetooth/blob/main/src/niimbot.js
- https://github.com/MultiMote/niimbot-web-ble-terminal
- https://github.com/MultiMote/niimblue-node
- https://github.com/MultiMote/niimbluelib-headless
- https://github.com/labbots/NiimPrintX
- https://github.com/AndBondStyle/niimprint
- https://github.com/kjy00302/niimprint
- https://github.com/talaviram/libreniim
- https://github.com/olefrerichs/niimbot-macos-printer-driver

**Contraintes navigateur / Apple**
- https://lists.w3.org/Archives/Public/public-web-bluetooth-log/2026Jun/0012.html (PR `getMTU()`)
- https://github.com/WebBluetoothCG/web-bluetooth/pull/672
- https://caniuse.com/web-bluetooth
- https://github.com/manolofdez/AsyncBluetooth
