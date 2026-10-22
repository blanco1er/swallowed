// Verdict calculator — spec.md > Verdict calculator, spec.md > Signs triage
// Pure functions over the curated data in data/*.json. The AI never decides
// anything here: every verdict comes from a sourced entry.

export const LEVELS = ['watch', 'vet-today', 'vet-now'];
const rank = (level) => LEVELS.indexOf(level);
const max = (a, b) => (rank(a) >= rank(b) ? a : b);

export const SPECIES = ['dog', 'cat', 'rabbit', 'rodent', 'bird'];

const round = (n, d = 0) => Math.round(n * 10 ** d) / 10 ** d;
// Whole numbers from 100 up, otherwise keep one decimal (15.5 mg/g must not read as 16).
const fmt = (n) => (n >= 100 ? round(n) : n >= 1 ? round(n, 1) : round(n, 2));
// Below a threshold, the shown number must stay below it (19.96 must not read as 20).
const fmtBelow = (n, limit) => {
  let d = n >= 100 ? 0 : n >= 1 ? 1 : 2;
  while (limit != null && round(n, d) >= limit && d < 6) d += 1;
  return round(n, d);
};

// What a content form is measured per: grams, millilitres or a countable thing.
export function formMeasure(form) {
  const unit = String(form?.unit || '');
  if (/\/g$/.test(unit)) return { kind: 'grams', noun: 'g' };
  if (/\/ml$/.test(unit)) return { kind: 'ml', noun: 'ml' };
  const m = /\/(tablet|piece|cigarette|item|pod|capsule)$/.exec(unit);
  if (m) return { kind: 'count', noun: m[1] === 'item' ? 'item' : m[1] };
  return { kind: 'unsupported', noun: '' };
}

// The forms a dose can be calculated for (units we can multiply).
export function doseForms(item) {
  return (item?.content || []).filter((f) => formMeasure(f).kind !== 'unsupported');
}

// Very dark chocolate (70 %+) is not covered by Merck's dark-chocolate range;
// the curated data recommends the baking-chocolate value for it.
export function adjustForm(item, form, quantities, catalogue) {
  if (item?.id === 'chocolate-dark' && Number(quantities?.cocoaPercent) >= 70 && catalogue) {
    const baking = catalogue.find((t) => t.id === 'chocolate-baking-cocoa')?.content?.[0];
    if (baking) return { ...baking, form: `very dark chocolate (${quantities.cocoaPercent}% cocoa) — baking-chocolate value`, adjusted: true };
  }
  if (formMeasure(form).kind === 'count' && Number(quantities?.tabletMg) > 0 && /mg\//.test(form.unit)) {
    return { ...form, value: Number(quantities.tabletMg), form: `${form.form} (${quantities.tabletMg} mg, as printed)`, adjusted: true };
  }
  return form;
}

// amount: { grams?, ml?, count?, form?, noDoseForm? }
export function doseFor(item, s, weightKg, amount) {
  if (!weightKg || weightKg <= 0 || !amount) return null;
  const unitPerKg = s.thresholds?.[0]?.unit || 'mg/kg';
  const thresholdMass = unitPerKg.split('/')[0];
  const basis = s.basis || (item.content?.length ? 'compound' : 'product');

  if (basis === 'product') {
    if (!(amount.grams > 0)) return null;
    const perKg = (amount.grams / weightKg) * (thresholdMass === 'mg' ? 1000 : 1);
    return { perKg, unitPerKg, text: `${fmt(amount.grams)} g of ${item.names?.en?.[0] || 'it'} ÷ ${fmt(weightKg)} kg ≈ ${fmt(perKg)} ${unitPerKg}` };
  }

  const form = amount.form || doseForms(item)[0];
  if (!form) return null;
  const measure = formMeasure(form);
  const qty = measure.kind === 'grams' ? amount.grams : measure.kind === 'ml' ? amount.ml : amount.count;
  if (!(qty > 0)) return null;
  const [massUnit] = form.unit.split('/'); // "mg" or "g"
  const total = qty * form.value;
  let perKg = total / weightKg;
  if (massUnit === 'mg' && thresholdMass === 'g') perKg /= 1000;
  if (massUnit === 'g' && thresholdMass === 'mg') perKg *= 1000;
  const qtyText = measure.kind === 'count' ? `${qty} ${measure.noun}${qty > 1 ? 's' : ''}` : `${fmt(qty)} ${measure.noun}`;
  const totalText = massUnit === 'g' && total < 1 ? `${fmt(total * 1000)} mg` : `${fmt(total)} ${massUnit}`;
  return {
    perKg, unitPerKg, form,
    text: `${qtyText} × ${fmt(form.value)} ${form.unit} = ${totalText} of ${item.compound || 'the toxic substance'} ÷ ${fmt(weightKg)} kg ≈ ${fmt(perKg)} ${unitPerKg}`,
  };
}

// verdict(item, species, weightKg, amount) → { level, kind, reason, math?, signs, onset, source, quote }
export function verdict(item, species, weightKg, amount) {
  const s = item?.species?.[species];
  const base = { onset: item?.onset || null, itemId: item?.id };
  if (!s) {
    return { ...base, level: 'vet-now', kind: 'no-data', reason: 'We have no reliable data for this, so a vet should decide — call now.', signs: null, source: null };
  }
  const common = { ...base, signs: s.signs || null, source: s.source || null, quote: s.quote || null, note: s.note || null };

  if (s.risk === 'any') {
    return { ...common, level: s.verdict || 'vet-now', kind: 'any', reason: 'Dangerous at any amount for this animal.' };
  }
  if (s.risk === 'no-data') {
    return { ...common, level: s.verdict && s.verdict !== 'watch' ? s.verdict : 'vet-now', kind: 'no-data', reason: 'There is no reliable veterinary data for this animal, so a vet should decide.' };
  }
  if (s.risk === 'low') {
    return { ...common, level: s.verdict || 'watch', kind: 'low', reason: 'Usually low risk for this animal — watch for the signs below.' };
  }
  if (s.risk === 'dose') {
    const sorted = [...(s.thresholds || [])].sort((a, b) => a.from - b.from);
    const worst = sorted.reduce((acc, t) => max(acc, t.verdict), s.below || 'vet-today');
    if (amount?.noDoseForm) {
      const nd = s.noDoseMath || {};
      return { ...common, level: nd.verdict || worst, kind: 'no-dose-form', reason: nd.why || 'There is no published way to work out the dose for this form, so a vet should decide.' };
    }
    const dose = doseFor(item, s, weightKg, amount);
    if (!dose) {
      const why = weightKg > 0 && amount
        ? "The dose can't be worked out for this product, so we assume the worst case."
        : 'Without the amount and the weight the dose cannot be worked out, so we assume the worst case.';
      return { ...common, level: max(worst, 'vet-today'), kind: 'dose-unknown', reason: why };
    }
    let band = null;
    for (const t of sorted) if (dose.perKg >= t.from) band = t;
    const level = band ? band.verdict : s.below || 'vet-today';
    const first = sorted[0];
    const shown = band ? fmt(dose.perKg) : fmtBelow(dose.perKg, first?.from);
    return {
      ...common,
      level,
      kind: 'dose',
      dosePerKg: dose.perKg,
      unit: dose.unitPerKg,
      band,
      signs: band?.signs || common.signs || first?.signs || null,
      source: band?.source || common.source,
      quote: band?.quote || common.quote,
      reason: band
        ? `about ${shown} ${dose.unitPerKg}, at or above the ${band.from} ${dose.unitPerKg} level where veterinary sources report ${band.signs || 'signs'}.`
        : `about ${shown} ${dose.unitPerKg}, below the first level where signs are reported (${first?.from} ${dose.unitPerKg}).`,
      math: { text: dose.text.replace(/≈ [\d.]+ (\S+)$/, `≈ ${shown} $1`), perKg: `${shown} ${dose.unitPerKg}`, shown, firstLevel: first ? `${first.from} ${dose.unitPerKg}` : null, form: dose.form?.form || null },
    };
  }
  return { ...common, level: 'vet-now', kind: 'no-data', reason: 'We could not assess this one — call your vet.' };
}

// Signs relevant to a species (the data lists which species each sign applies to).
export function signsFor(signsData, species) {
  return signsData.signs.filter((s) => s.id !== 'no-signs' && (!s.species || s.species.includes(species)));
}

// Signs triage — the "I don't know what it ate" path (rules in data/signs.json).
export function signsVerdict(signsData, species, signIds) {
  const chosen = signsData.signs.filter((s) => signIds.includes(s.id) && s.id !== 'no-signs');
  const rule = (id) => signsData.rules?.find((r) => r.id === id);
  // Highest urgency wins.
  let level = chosen.reduce((acc, s) => max(acc, s.urgency), 'watch');
  let raisedBySpecies = false;
  const small = rule('small-prey-species-minimum');
  if (chosen.length && small?.appliesTo?.includes(species) && rank(level) < rank('vet-today')) {
    level = 'vet-today';
    raisedBySpecies = true;
  }
  // Suspected but unknown ingestion with no signs: call now, don't wait for signs.
  const noSigns = !chosen.length;
  if (noSigns) level = 'vet-today';
  const culprits = signsData.culprits?.[species]?.items || [];
  return { level, chosen, raisedBySpecies, noSigns, culprits, kind: 'signs', culpritsSource: signsData.culprits?.[species]?.source || null };
}
