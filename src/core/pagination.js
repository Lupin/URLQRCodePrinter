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
export function paginateByHeight(heights, usable) {
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
export function countPages(heights, usable) {
  return paginateByHeight(heights, usable).length;
}
