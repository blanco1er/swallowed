import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { matchItems, detectSpecies, normalize, parseAmounts } from '../public/js/match.js';

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

test('amounts in a sentence: strength in mg, a count, grams', () => {
  assert.deepEqual(parseAmounts('ibuprofen 400'), { tabletMg: 400 });
  assert.deepEqual(parseAmounts('my dog ate 3 ibuprofen 200mg'), { tabletMg: 200, count: 3 });
  assert.deepEqual(parseAmounts('two tablets of advil'), { count: 2 });
  assert.deepEqual(parseAmounts('50 g of dark chocolate'), { grams: 50 });
});

test('"rat poison" is a product, not the animal; the animal named first wins', () => {
  assert.equal(detectSpecies('I think he ate rat poison'), null);
  assert.equal(detectSpecies('my cat ate dog food'), 'cat');
  assert.equal(top('I think he ate rat poison'), 'rodenticide-anticoagulant');
});

test('"sugar free gum" and "sugar-free gum" are the same thing', () => {
  assert.equal(top('sugar free gum'), 'xylitol');
  assert.equal(top('sugar-free gum'), 'xylitol');
  assert.equal(top('my kitten ate a lily'), 'lilies-true');
});
