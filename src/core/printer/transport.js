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

import { PacketStreamDecoder } from './packet.js';
import { ALL_NAME_PREFIXES } from './profiles.js';

/** Service exposé par la quasi-totalité des imprimantes Niimbot. */
export const SERVICE_UUID = 'e7810a71-73ae-499d-8c15-faa9aef0c3f2';

/**
 * Caractéristique principale. Elle porte à la fois les notifications et les
 * écritures sans réponse. Le code ne s'y fie pas aveuglément : si elle est
 * absente, on découvre la bonne par ses propriétés.
 */
export const CHARACTERISTIC_UUID = 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f';

/**
 * Taille maximale d'un groupe d'écriture.
 *
 * La spec Web Bluetooth n'expose aucune API de MTU (la proposition `getMTU()`
 * n'est pas livrée). Des groupes de 240 octets ont été validés sur B1 et M2-H,
 * ce qui suppose un MTU ≥ 247. On reste en dessous et on rend la valeur
 * réglable, car rien ne garantit le même MTU sur un D110.
 */
export const DEFAULT_MAX_BUNDLE_BYTES = 240;

/**
 * Intervalle minimal entre deux écritures. Sur macOS et iOS, le Bluetooth
 * passe par CoreBluetooth, dont le tampon sature plus vite : la rafale y est
 * systématiquement perdante.
 */
export const DEFAULT_PACE_MS = 10;

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
export const BRAVE_BLUETOOTH_HINT =
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
export function checkWebBluetoothSupport(env = {}) {
  const bluetooth = env.bluetooth ?? globalThis.navigator?.bluetooth;
  const secure = env.isSecureContext ?? globalThis.isSecureContext;

  if (!bluetooth) {
    return {
      ok: false,
      reason: 'Web Bluetooth n\'est pas disponible dans ce navigateur.',
      hint: `Safari (macOS et iOS) ne l'implémente pas. ${BRAVE_BLUETOOTH_HINT}`,
    };
  }
  if (secure === false) {
    return {
      ok: false,
      reason: 'Web Bluetooth exige un contexte sécurisé (HTTPS ou localhost).',
      hint: 'Ouvrez l\'application via https:// ou http://localhost.',
    };
  }
  // `available === false` : le navigateur a répondu que non.
  if (env.available === false) {
    return {
      ok: false,
      reason:
        'Web Bluetooth est désactivé dans ce navigateur — ou le Bluetooth de ' +
        'cet ordinateur est éteint.',
      hint: BRAVE_BLUETOOTH_HINT,
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
export async function probeWebBluetooth(env = {}) {
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
export function explainBluetoothFailure(error) {
  const message = String(error?.message ?? error ?? '');
  if (/globally disabled/i.test(message)) {
    return `Web Bluetooth est désactivé dans ce navigateur. ${BRAVE_BLUETOOTH_HINT}`;
  }
  if (/user denied|user cancel|chooser/i.test(message) || error?.name === 'NotFoundError') {
    return 'Aucun appareil choisi. Réveillez l\'imprimante, puis relancez la connexion.';
  }
  if (/permission|not allowed|SecurityError/i.test(message)) {
    return 'Le navigateur a refusé l\'accès au Bluetooth : autorisez-le pour cette page, puis réessayez.';
  }
  return `Connexion impossible : ${message}`;
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
export async function requestPrinter(options = {}) {
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
export class NiimbotTransport {
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
    if (!this.characteristic) throw new Error('Transport non connecté');
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
export async function connectToPrinter(options = {}) {
  const device = await requestPrinter(options);
  const transport = new NiimbotTransport(device, options.transportOptions);
  await transport.connect();
  return transport;
}
