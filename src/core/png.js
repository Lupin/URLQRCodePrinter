/**
 * Encodage PNG minimal, sans dépendance.
 *
 * Un PNG est une suite de blocs : signature, `IHDR` (dimensions et format),
 * `IDAT` (les pixels, compressés en zlib), `IEND`. Chaque bloc porte son CRC32.
 *
 * On n'encode qu'un seul format — RVBA 8 bits, non entrelacé — ce qui suffit
 * pour des QR codes et des icônes, et évite d'embarquer une bibliothèque
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
export function crc32(bytes) {
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
export async function deflate(bytes) {
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
export async function encodePng(image) {
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
export function rgbaFromMatrix(pixels, options = {}) {
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
