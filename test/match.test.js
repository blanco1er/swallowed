import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { matchItems, detectSpecies, normalize } from '../public/js/match.js';

const toxins = JSON.parse(readFileSync(new URL('../data/toxins.json', import.meta.url), 'utf8'));
const top = (text) => matchItems(toxins, text)[0]?.item.id;

test('typed English and French names find the right item', () => {
  assert.equal(top('dark chocolate'), 'chocolate-dark');
  assert.equal(top('chocolat noir'), 'chocolate-dark');
  assert.match(top('raisins'), /grape|raisin/);
  assert.match(top('ibuprofen 400'), /ibuprofen/);
});

test('a spoken sentence finds the item and the animal', () => {
  assert.match(top('my rabbit ate some avocado'), /avocado/);
  assert.equal(detectSpecies('my rabbit ate some avocado'), 'rabbit');
  assert.equal(detectSpecies('Mon chat a mangé un lys'), 'cat');
  assert.equal(detectSpecies('our guinea pig chewed a leaf'), 'rodent');
});

test('nonsense finds nothing', () => {
  assert.equal(matchItems(toxins, 'qwzx').length, 0);
  assert.equal(normalize('  Chocolat  NOIR! '), 'chocolat noir');
});
