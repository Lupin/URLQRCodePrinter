/**
 * Page de mention de confidentialité.
 *
 * Elle n'a qu'un rôle : présenter la mention **dans l'interface du produit** et
 * recueillir une décision explicite avant toute collecte. La FAQ du Chrome Web
 * Store (question 10) exclut la fiche du magasin comme support de cette
 * mention, et exige une action claire de l'utilisateur.
 *
 * Le refus est un état de plein droit. Refuser n'installe rien de cassé :
 * l'extension reste en place, n'enregistre aucun lien, et cette page reste
 * joignable depuis la fenêtre pour revenir sur la décision.
 */

import { initI18n, applyTranslations, t } from './core/i18n.js';
import { readConsent, writeConsent, isAccepted } from './core/privacy.js';
import { resolveApi } from './api.js';

const api = resolveApi();
const area = api?.storage?.local;

const el = {
  accept: document.getElementById('accept'),
  decline: document.getElementById('decline'),
  state: document.getElementById('state'),
};

/**
 * Met à jour l'affichage de l'état courant.
 *
 * Les deux boutons restent actifs après une décision : la FAQ prévoit qu'un
 * consentement puisse être retiré, et une page qui se figerait obligerait à
 * désinstaller l'extension pour changer d'avis.
 *
 * @param {{ decision: string } | null} record
 */
function renderState(record) {
  if (!el.state) return;

  if (isAccepted(record)) {
    el.state.textContent = t('Accord enregistré. Vous pouvez ajouter des liens.');
    el.state.className = 'consent__state consent__state--ok';
    return;
  }

  if (record?.decision === 'declined') {
    el.state.textContent = t('Refus enregistré. Aucun lien ne sera collecté.');
    el.state.className = 'consent__state consent__state--off';
    return;
  }

  el.state.textContent = '';
  el.state.className = 'consent__state';
}

/**
 * Enregistre une décision et rafraîchit l'affichage.
 *
 * @param {'accepted'|'declined'} decision
 */
async function decide(decision) {
  if (!area) {
    // Sans stockage, la décision ne peut pas être conservée : la dire plutôt que
    // de laisser croire qu'elle a été prise.
    if (el.state) {
      el.state.textContent = t('Enregistrement impossible : stockage indisponible.');
      el.state.className = 'consent__state consent__state--off';
    }
    return;
  }

  const record = await writeConsent(area, decision);
  renderState(record);
}

el.accept?.addEventListener('click', () => decide('accepted'));
el.decline?.addEventListener('click', () => decide('declined'));

/**
 * Point d'entrée.
 *
 * L'`await` de premier niveau est évité, comme dans la fenêtre : une exception
 * y laisserait une page à moitié initialisée, sans message. Ici, elle est
 * rattrapée et affichée dans la région d'état.
 *
 * @returns {Promise<void>}
 */
async function main() {
  try {
    // La langue vient d'abord : les messages d'état sont traduits, et un état
    // affiché avant l'initialisation resterait dans la mauvaise langue.
    await initI18n({ area: area ?? undefined });
    applyTranslations();

    renderState(area ? await readConsent(area) : null);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (el.state) {
      el.state.textContent = t('Enregistrement impossible : stockage indisponible.');
      el.state.className = 'consent__state consent__state--off';
      el.state.title = message;
    }
  }
}

main();
