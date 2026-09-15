// Fenêtre de l'application conteneur.
//
// Deux impasses du modèle d'Apple sont évitées ici : un bouton dont l'action
// échoue sans rien dire, et un état d'extension qui reste indéterminé. Dans les
// deux cas, l'utilisateur reçoit une explication plutôt qu'un silence.

function post(name) {
    webkit.messageHandlers.controller.postMessage(name);
}

function show(platform, enabled) {
    document.body.classList.add('platform-' + platform);

    if (typeof enabled === 'boolean') {
        document.body.classList.toggle('state-on', enabled);
        document.body.classList.toggle('state-off', !enabled);
        document.getElementById('instructions').hidden = enabled;
    } else {
        document.body.classList.remove('state-on');
        document.body.classList.remove('state-off');
    }
}

// Appelée quand on tente d'ouvrir les réglages de Safari.
//
// Sur une compilation non signée, Safari refuse — et peut même ne jamais
// rappeler son gestionnaire, ni en succès ni en erreur. On se contente donc de
// rendre la marche à suivre visible, sans écraser le texte détaillé de la page :
// c'est lui qui porte l'information utile.
function showFallback(reason) {
    const instructions = document.getElementById('instructions');
    if (instructions) instructions.hidden = false;
    if (reason) console.warn('Ouverture des réglages refusée :', reason);
}

document.querySelector('button.open-preferences')
    .addEventListener('click', () => post('open-preferences'));
document.querySelector('button.quit')
    .addEventListener('click', () => post('quit'));
