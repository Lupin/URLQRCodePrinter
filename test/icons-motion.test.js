import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const APP = readFileSync(new URL('src/web/app.js', ROOT), 'utf8');
const HTML = readFileSync(new URL('src/web/index.html', ROOT), 'utf8');
const WEB = readFileSync(new URL('src/web/style.css', ROOT), 'utf8');
const POPUP = readFileSync(new URL('src/extension-src/popup.css', ROOT), 'utf8');
const SITE = readFileSync(new URL('src/site/style.css', ROOT), 'utf8');

test('plus aucun glyphe Unicode d’action dans l’interface', () => {
  // Les commandes étaient dessinées avec ✎ × ▲ ▼ ⠿ ◀ ▶, dont le rendu dépend
  // de la police du système.
  for (const glyphe of ['✎', '⠿', '▲', '▼', '◀', '▶', '←']) {
    assert.ok(!APP.includes(`'${glyphe}'`), `glyphe encore dans app.js : ${glyphe}`);
    assert.ok(!APP.includes(`>${glyphe}<`), `glyphe encore dans un bouton : ${glyphe}`);
  }
  assert.doesNotMatch(HTML, />[✎⠿▲▼◀▶←−+]<\/button>/);
});

test('le jeu d’icônes est un masque SVG, coloré par currentColor', () => {
  const icones = [...WEB.matchAll(/\.icon-([a-z-]+) \{ --icon: url\("data:image\/svg\+xml,/g)].map((m) => m[1]);
  assert.ok(icones.length >= 11, `jeu incomplet : ${icones.length} icônes`);
  for (const nom of ['edit', 'trash', 'close', 'drag', 'arrow-up', 'arrow-down',
    'chevron-left', 'chevron-right', 'chevron-down', 'zoom-in', 'zoom-out']) {
    assert.ok(icones.includes(nom), `icône absente : ${nom}`);
  }
  assert.match(WEB, /\.icon \{[\s\S]*?background-color: currentColor/);
  assert.match(APP, /function icone\(nom\)/);
  assert.match(APP, /boutonIcone\('edit'/);
  assert.match(APP, /boutonIcone\('trash'/);
  assert.match(APP, /icone\('drag'\)/);
});

test('les sélecteurs portent le même chevron que les icônes', () => {
  assert.match(WEB, /select\.input, \.locale__select \{[\s\S]*?appearance: none/);
  assert.match(WEB, /select\.input, \.locale__select \{[\s\S]*?background-image: url\("data:image\/svg\+xml/);
  assert.match(WEB, /select\.input, \.locale__select \{[\s\S]*?padding-right: 30px/);
});

test('le mouvement est tokenisé sur les trois surfaces', () => {
  for (const [nom, css] of [['web', WEB], ['fenêtre', POPUP], ['site', SITE]]) {
    for (const jeton of ['--motion-fast:', '--motion:', '--motion-slow:', '--easing:']) {
      assert.match(css, new RegExp(jeton.replace('-', '\\-')), `${nom} : ${jeton} absent`);
    }
    assert.match(css, /var\(--easing\)/, `${nom} : la courbe n'est pas employée`);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, `${nom} : pas de réduction`);
  }
});
