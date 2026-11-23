import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const WEB = readFileSync(new URL('src/web/style.css', ROOT), 'utf8');
const SITE = readFileSync(new URL('src/site/style.css', ROOT), 'utf8');

test('un dépliant du volet se lit comme une commande', () => {
  // Le défaut signalé : « l'icône qui déploie les menus est bien trop discrète ».
  // La ligne entière est désormais un contrôle de 40 px, avec un chevron encadré.
  assert.match(WEB, /\.advanced > summary,[\s\S]*?min-height: 40px/);
  assert.match(WEB, /summary::after[\s\S]*?width: 24px/);
  assert.match(WEB, /summary::after[\s\S]*?border: 1px solid var\(--border-strong\)/);
  assert.match(WEB, /\[open\] > summary::after[\s\S]*?transform: rotate\(180deg\)/);
  // Les anciens triangles de texte ont disparu.
  assert.doesNotMatch(WEB, /content: "▸"/);
  assert.doesNotMatch(WEB, /content: "▾"/);
});

test('la FAQ du site emploie la même affordance', () => {
  assert.match(SITE, /\.faq summary \{[\s\S]*?min-height: 48px/);
  assert.match(SITE, /\.faq summary::after[\s\S]*?width: 24px/);
  assert.match(SITE, /\.faq details\[open\] summary::after/);
});
