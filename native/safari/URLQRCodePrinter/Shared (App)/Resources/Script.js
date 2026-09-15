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

// Appelée quand Safari refuse d'ouvrir ses réglages — ce qui arrive sur une
// compilation non signée. Sans cela, le bouton paraîtrait simplement mort.
function showFallback(reason) {
    const instructions = document.getElementById('instructions');
    instructions.hidden = false;
    instructions.textContent =
        "Safari n'a pas pu ouvrir ses réglages automatiquement"
        + (reason ? ' (' + reason + ')' : '')
        + ". Ouvrez-les à la main : Safari → Réglages → Extensions.";
}

document.querySelector('button.open-preferences')
    .addEventListener('click', () => post('open-preferences'));
document.querySelector('button.quit')
    .addEventListener('click', () => post('quit'));
