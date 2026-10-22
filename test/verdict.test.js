import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verdict, signsVerdict, signsFor, adjustForm, doseForms, SPECIES, LEVELS } from '../public/js/verdict.js';

const load = (name) => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));
const toxins = load('toxins');
const signs = load('signs');
const byId = (id) => toxins.find((t) => t.id === id);

test('every species entry has a known risk, a verdict path and a source', () => {
  for (const t of toxins) {
    for (const sp of SPECIES) {
      const s = t.species?.[sp];
      assert.ok(s, `${t.id} is missing ${sp}`);
      assert.ok(['dose', 'any', 'low', 'no-data'].includes(s.risk), `${t.id}/${sp} risk ${s.risk}`);
      if (s.risk !== 'no-data') assert.match(String(s.source), /^https?:\/\//, `${t.id}/${sp} has no source`);
      if (s.risk === 'dose') {
        const basis = s.basis || (t.content?.length ? 'compound' : 'product');
        if (basis === 'compound' && !doseForms(t).length) {
          // A unit we can't multiply (e.g. IU): no math, and never "watch".
          assert.notEqual(verdict(t, sp, 10, { grams: 1, count: 1 }).level, 'watch', `${t.id}/${sp}`);
        }
        assert.ok(s.thresholds?.length, `${t.id}/${sp} without thresholds`);
        for (const th of s.thresholds) assert.ok(LEVELS.includes(th.verdict), `${t.id}/${sp} bad verdict`);
      }
    }
  }
});

test('dark chocolate, whole 100 g bar, 8 kg dog → call a vet now (≈ 69 mg/kg)', () => {
  const v = verdict(byId('chocolate-dark'), 'dog', 8, { grams: 100 });
  assert.equal(v.level, 'vet-now');
  assert.equal(v.kind, 'dose');
  assert.ok(v.dosePerKg > 60 && v.dosePerKg < 75, `dose ${v.dosePerKg}`);
  assert.match(v.math.text, /100 g/);
});

test('one 5 g bite of dark chocolate for an 8 kg dog gives a lower verdict', () => {
  const big = verdict(byId('chocolate-dark'), 'dog', 8, { grams: 100 });
  const bite = verdict(byId('chocolate-dark'), 'dog', 8, { grams: 5 });
  assert.ok(LEVELS.indexOf(bite.level) < LEVELS.indexOf(big.level), `${bite.level} vs ${big.level}`);
});

test('lily for a cat → call a vet now, no calculation', () => {
  const lily = toxins.find((t) => /lil/.test(t.id) && t.species.cat.risk === 'any');
  assert.ok(lily, 'a lily entry dangerous at any amount for cats');
  const v = verdict(lily, 'cat', 4, null);
  assert.equal(v.level, 'vet-now');
  assert.equal(v.math, undefined);
});

test('no data for a species never returns watch at home', () => {
  for (const t of toxins) {
    for (const sp of SPECIES) {
      if (t.species[sp].risk !== 'no-data') continue;
      assert.notEqual(verdict(t, sp, 1, { grams: 1, count: 1 }).level, 'watch', `${t.id}/${sp}`);
    }
  }
  assert.equal(verdict({ id: 'x', species: {} }, 'cat', 4, null).level, 'vet-now');
});

test('dose items with unknown amount fall back to a cautious verdict', () => {
  const v = verdict(byId('chocolate-dark'), 'dog', 8, null);
  assert.notEqual(v.level, 'watch');
});

test('signs: a drooling, wobbly cat → call a vet now, with the cat culprits', () => {
  const urgent = signs.signs.filter((s) => s.urgency === 'vet-now').map((s) => s.id);
  const v = signsVerdict(signs, 'cat', urgent.slice(0, 2));
  assert.equal(v.level, 'vet-now');
  assert.ok(v.culprits.length >= 5);
});

test('signs: any sign in a rabbit is at least call your vet today', () => {
  const mild = signs.signs.find((s) => s.urgency !== 'vet-now' && s.id !== 'no-signs' && (!s.species || s.species.includes('rabbit')));
  const v = signsVerdict(signs, 'rabbit', [mild.id]);
  assert.ok(['vet-today', 'vet-now'].includes(v.level));
});

test('very dark chocolate (70%+) uses the more cautious baking-chocolate value', () => {
  const dark = byId('chocolate-dark');
  const form = adjustForm(dark, dark.content[0], { cocoaPercent: 70 }, toxins);
  assert.ok(form.value > dark.content[0].value);
  const v = verdict(dark, 'dog', 8, { grams: 5, form });
  assert.ok(v.dosePerKg > 5.5 * 5 / 8);
});

test('the strength printed on the pack overrides the default tablet strength', () => {
  const ibu = byId('ibuprofen');
  const tablet = ibu.content.find((f) => /tablet/.test(f.unit));
  const form = adjustForm(ibu, tablet, { tabletMg: 400 }, toxins);
  const v = verdict(ibu, 'dog', 10, { count: 1, form });
  assert.equal(Math.round(v.dosePerKg), 40);
  assert.equal(v.level, 'vet-now');
});

test('a concentrated form without a published conversion gets a direct verdict, no math', () => {
  const onion = byId('onion-allium');
  const v = verdict(onion, 'dog', 10, { noDoseForm: 'onion powder' });
  assert.equal(v.level, 'vet-now');
  assert.equal(v.math, undefined);
});

test('signs: unknown ingestion with no signs → call your vet today, never watch', () => {
  assert.equal(signsVerdict(signs, 'dog', []).level, 'vet-today');
});

test('signs shown are only the ones relevant to the species', () => {
  assert.ok(signsFor(signs, 'cat').some((s) => s.id === 'cat-urine-straining'));
  assert.ok(!signsFor(signs, 'dog').some((s) => s.id === 'cat-urine-straining'));
});

test('the calculation shows the content value as published (15.5 mg/g, not 16)', () => {
  const dark = byId('chocolate-dark');
  const form = adjustForm(dark, dark.content[0], { cocoaPercent: 70 }, toxins);
  const v = verdict(dark, 'dog', 8, { grams: 100, form });
  assert.match(v.math.text, /15\.5 mg\/g/);
});

test('a dose just below a threshold never reads as the threshold (19.8, not 20)', () => {
  const choc = byId('chocolate-dark');
  const v = verdict(choc, 'dog', 10, { grams: 36 }); // 36 g × 5.5 mg/g ÷ 10 kg = 19.8 mg/kg
  assert.equal(v.level, 'watch');
  assert.ok(Number(v.math.shown) < 20, `shown ${v.math.shown}`);
  assert.match(v.reason, /below the first level/);
});

test('ibuprofen forms carry clear labels (200 mg and 400 mg tablets are told apart)', () => {
  const labels = byId('ibuprofen').content.map((f) => f.label);
  assert.equal(new Set(labels).size, labels.length);
  const v = verdict(byId('ibuprofen'), 'dog', 10, { count: 1, form: byId('ibuprofen').content[1] });
  assert.equal(v.level, 'vet-now'); // 400 mg ÷ 10 kg = 40 mg/kg
});
