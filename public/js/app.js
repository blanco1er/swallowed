// Swallowed — the page. spec.md > Screens and flow (page)
// Start → Confirm → Your pet → Verdict, and Start → Your pet → Signs → Verdict
// for "I don't know what it ate". Verdicts come only from data/*.json.

import { matchItems, detectSpecies } from './match.js';
import { verdict, signsVerdict, signsFor, doseForms, formMeasure, adjustForm } from './verdict.js';
import { buildSummary, LEVEL_LABEL, SPECIES_LABEL } from './summary.js';
import { speechSupported, listen } from './speech.js';

const $ = (id) => document.getElementById(id);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const WEIGHT_HINT = {
  dog: { kg: 10, text: 'Dogs range from about 2 kg to over 60 kg.' },
  cat: { kg: 4, text: 'Most adult cats weigh 3–6 kg.' },
  rabbit: { kg: 2, text: 'Pet rabbits usually weigh 1–5 kg.' },
  rodent: { kg: 1, text: 'A guinea pig is about 1 kg; a hamster about 0.1 kg (100 g).' },
  bird: { kg: 0.1, text: 'A budgie is about 0.035 kg (35 g), a cockatiel 0.09 kg, a grey parrot 0.45 kg.' },
};
const LB = 0.45359237;

const data = { toxins: [], signs: null, contacts: null };
const state = freshState();
const history = [];
let stopListening = null;

function freshState() {
  return {
    path: 'item', item: null, candidates: [], quantities: {}, photoUrl: null, said: null, recognisedLabel: null,
    species: null, weightKg: null, when: 'just now', amount: null, option: null, signs: [], country: guessCountry(),
  };
}

function guessCountry() {
  const lang = (navigator.languages?.[0] || navigator.language || 'en-US').toLowerCase();
  return lang.startsWith('fr') ? 'FR' : 'US';
}

/* ---------- small helpers ---------- */

function el(tag, props = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'text') n.textContent = v;
    else if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) if (c != null && c !== false) n.append(c);
  return n;
}
function icon(id, cls = 'icon') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#${id}`);
  svg.append(use);
  return svg;
}
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const lowerFirst = (s) => (s && !/^[A-Z]{2}/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const itemName = (item) => cap(item?.names?.en?.[0] || item?.id || '');
// Real photos (Unsplash License, see data/SOURCES.md) for the most common items and each animal.
const ITEM_PHOTO = { 'chocolate-milk': 'chocolate', 'chocolate-dark': 'chocolate', 'chocolate-baking-cocoa': 'chocolate', xylitol: 'gum', 'grapes-raisins': 'grapes', 'onion-allium': 'onion', 'lilies-true': 'lily' };
const SPECIES_PHOTO = { dog: 'dog', cat: 'cat', rabbit: 'rabbit', rodent: 'guineapig', bird: 'bird' };
function itemPhoto(item) {
  const name = ITEM_PHOTO[item?.id] || (item?.category === 'human-medicine' ? 'pills' : null);
  return name ? `/img/${name}.jpg` : null;
}
const CATEGORY = { food: 'Food', plant: 'Plant', 'human-medicine': 'Human medicine', household: 'Household product', garden: 'Garden product', 'pest-control': 'Pest control', 'vet-medicine': 'Pet medicine', other: 'Other' };

function toast(text) {
  const t = $('toast');
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 2600);
}

function storeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function storeSet(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } }

/* ---------- views ---------- */

function show(name, { push = true } = {}) {
  const current = document.querySelector('.view:not([hidden])')?.dataset.view;
  if (push && current && current !== name) history.push(current);
  for (const v of document.querySelectorAll('.view')) v.hidden = v.dataset.view !== name;
  $('back').hidden = history.length === 0;
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'instant' });
  $('main').focus({ preventScroll: true });
}

$('back').addEventListener('click', () => {
  const prev = history.pop();
  if (prev) show(prev, { push: false });
});

/* ---------- Start: type it ---------- */

function renderSuggestions(listEl, text, onPick) {
  const results = matchItems(data.toxins, text, 6);
  listEl.replaceChildren(
    ...results.map(({ item, matchedName }) =>
      el('li', {}, el('button', { class: 'row', type: 'button', onclick: () => onPick(item, results) }, [
        el('span', { class: 'row-body' }, [
          el('span', { class: 'row-title', text: cap(matchedName) }),
          matchedName.toLowerCase() !== (item.names.en[0] || '').toLowerCase()
            ? el('span', { class: 'row-sub', text: itemName(item) }) : null,
        ]),
        el('span', { class: 'suggestion-cat', text: CATEGORY[item.category] || '' }),
      ])))
  );
  return results;
}

// "Type it" and "Say it" open their panel under the buttons; tapping again closes it.
function selectTab(which) {
  const map = { type: 'type-panel', say: 'voice-panel' };
  for (const [k, panel] of Object.entries(map)) {
    $(`tab-${k}`).setAttribute('aria-expanded', String(k === which));
    $(panel).hidden = k !== which;
  }
  if (which !== 'say') stopListening?.();
  if (which === 'type') $('type-input').focus();
}
$('tab-type').addEventListener('click', () => selectTab($('tab-type').getAttribute('aria-expanded') === 'true' ? null : 'type'));
$('tab-say').addEventListener('click', () => {
  if ($('tab-say').getAttribute('aria-expanded') === 'true') { selectTab(null); return; }
  selectTab('say');
  $('way-voice').click(); // start listening straight away
});

// One-tap shortcuts for the most common poisonings.
document.querySelectorAll('#quick [data-q]').forEach((b) => b.addEventListener('click', () => {
  const results = matchItems(data.toxins, b.dataset.q, 6);
  if (results.length) pickItem(results[0].item, { candidates: results.map((r) => r.item) });
}));

$('type-input').addEventListener('input', (e) => {
  const text = e.target.value;
  const results = renderSuggestions($('suggestions'), text, (item, res) => pickItem(item, { candidates: res.map((r) => r.item) }));
  $('type-empty').hidden = !(text.trim().length >= 3 && results.length === 0);
  $('type-empty').textContent = 'Not in our list. Press Search to look it up, or check the spelling.';
});

$('type-input').addEventListener('keydown', async (e) => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const text = e.target.value.trim();
  if (!text) return;
  const results = matchItems(data.toxins, text, 6);
  if (results.length && results[0].score >= 0.5) {
    pickItem(results[0].item, { candidates: results.map((r) => r.item) });
  } else {
    await identify({ text });
  }
});

/* ---------- Start: photo ---------- */

// No capture attribute: the phone offers both the camera and the photo library.
$('way-photo').addEventListener('click', () => $('photo-input').click());

async function onPhotoChosen(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  try {
    const dataUrl = await shrink(file, 1280);
    state.photoUrl = dataUrl;
    await identify({ image: dataUrl });
  } catch {
    startStatus("We couldn't open that photo. Try another one, or type it.", true);
  }
}
$('photo-input').addEventListener('change', onPhotoChosen);

function shrink(file, maxSide) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
    img.src = url;
  });
}

function startStatus(text, isError = false) {
  const s = $('start-status');
  s.textContent = text || '';
  s.hidden = !text;
  s.classList.toggle('is-error', isError);
}

async function identify(payload) {
  startStatus(payload.image ? 'Looking at your photo…' : 'Looking it up…');
  setWaysDisabled(true);
  try {
    const res = await fetch('/api/identify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      startStatus(body?.error?.message || 'Recognition is unavailable right now — type it instead.', true);
      return;
    }
    handleIdentified(body, payload);
  } catch {
    startStatus('No connection — you can still type a known item.', true);
  } finally {
    setWaysDisabled(false);
  }
}

function setWaysDisabled(on) {
  for (const id of ['way-photo', 'tab-type', 'tab-say', 'way-voice', 'way-unknown']) $(id).disabled = on;
}

function handleIdentified(result, payload) {
  const byId = (id) => data.toxins.find((t) => t.id === id);
  const main = result.matchId ? byId(result.matchId) : null;
  const others = (result.alternatives || []).map(byId).filter(Boolean);
  state.quantities = result.quantities || {};
  state.recognisedLabel = result.label || null;
  if (!main && !others.length) {
    if (!result.label) {
      startStatus("We couldn't recognise it. Retake the photo closer, or type it.", true);
      return;
    }
    // Recognised but not in the curated list → honest "call your vet" verdict, never a guess.
    startStatus('');
    pickItem({ id: 'not-listed', names: { en: [result.label] }, category: 'other', species: {} }, { notListed: true });
    return;
  }
  startStatus('');
  pickItem(main || others[0], { candidates: [main, ...others].filter(Boolean), lowConfidence: (result.confidence ?? 1) < 0.6 });
}

/* ---------- Start: say it ---------- */

$('way-voice').addEventListener('click', () => {
  if (stopListening) { stopListening(); return; }
  if (!speechSupported) {
    selectTab('type');
    startStatus("Voice isn't available in this browser — tap the microphone on your keyboard to dictate.");
    return;
  }
  startStatus('');
  $('voice-words').textContent = '';
  $('voice-status-text').textContent = 'Listening… say what your pet ate';
  $('way-voice').classList.add('is-live');
  $('voice-stop').hidden = false;
  const done = () => { stopListening = null; $('way-voice').classList.remove('is-live'); $('voice-stop').hidden = true; $('voice-status-text').textContent = 'Tap and say what happened'; };
  stopListening = listen({
    onWords: (text) => { $('voice-words').textContent = text; },
    onError: (code) => {
      done();
      startStatus(code === 'not-allowed' || code === 'service-not-allowed'
        ? 'Microphone access is off. Allow it in your browser settings, or type it.'
        : "We didn't catch that. Try again, or type it.", true);
    },
    onEnd: (finalText) => {
      done();
      if (finalText) handleSaid(finalText);
    },
  });
});

$('voice-stop').addEventListener('click', () => stopListening?.());

async function handleSaid(text) {
  state.said = text;
  const species = detectSpecies(text);
  if (species) state.species = species;
  const results = matchItems(data.toxins, text, 6);
  if (results.length && results[0].score >= 0.5) {
    pickItem(results[0].item, { candidates: results.map((r) => r.item) });
  } else {
    await identify({ text });
  }
}

/* ---------- Confirm ---------- */

function quantitiesText(q) {
  const parts = [];
  if (q?.netWeightG) parts.push(`${q.netWeightG} g`);
  if (q?.cocoaPercent) parts.push(`${q.cocoaPercent}% cocoa`);
  if (q?.tabletMg) parts.push(`${q.tabletMg} mg per tablet`);
  if (q?.count) parts.push(`${q.count} in the pack`);
  return parts.join(' · ');
}

function pickItem(item, { candidates = [], lowConfidence = false, notListed = false } = {}) {
  state.path = 'item';
  state.item = item;
  state.candidates = candidates.filter((c) => c && c.id !== item.id).slice(0, 4);
  $('confirm-name').textContent = itemName(item);
  const q = quantitiesText(state.quantities);
  $('confirm-detail').textContent = notListed
    ? 'Not in our list of known pet poisonings — we will not guess.'
    : [CATEGORY[item.category], q].filter(Boolean).join(' · ');
  const photo = $('confirm-photo');
  const src = state.photoUrl || (notListed ? null : itemPhoto(item));
  photo.hidden = !src;
  photo.classList.toggle('is-stock', !state.photoUrl);
  if (src) photo.src = src;
  $('confirm-said').hidden = !state.said;
  $('confirm-said').textContent = state.said ? `You said: "${state.said}"` : '';
  $('confirm-title').textContent = lowConfidence ? 'Is it one of these?' : 'Is this it?';
  renderCandidates();
  $('change-panel').hidden = !lowConfidence;
  show('confirm');
}

function renderCandidates() {
  $('candidates').replaceChildren(
    ...state.candidates.map((c) =>
      el('li', {}, el('button', { class: 'row', type: 'button', onclick: () => pickItem(c, { candidates: [state.item, ...state.candidates] }) }, [
        el('span', { class: 'row-body' }, el('span', { class: 'row-title', text: itemName(c) })),
        el('span', { class: 'suggestion-cat', text: CATEGORY[c.category] || '' }),
      ])))
  );
  $('candidates-label').hidden = state.candidates.length === 0;
}

$('confirm-yes').addEventListener('click', () => openPet());
$('confirm-change').addEventListener('click', () => {
  $('change-panel').hidden = false;
  $('change-input').focus();
});
$('change-input').addEventListener('input', (e) => {
  renderSuggestions($('change-suggestions'), e.target.value, (item) => {
    state.quantities = {};
    state.photoUrl = state.photoUrl; // keep the photo
    pickItem(item);
  });
});

/* ---------- Your pet ---------- */

function openPet() {
  $('pet-item').textContent = state.path === 'unknown'
    ? 'Tell us about your pet, then what you see.'
    : `${itemName(state.item)}${quantitiesText(state.quantities) ? ` · ${quantitiesText(state.quantities)}` : ''}`;
  $('pet-go').textContent = state.path === 'unknown' ? 'Next' : 'Show the answer';
  $('pet-error').hidden = true;
  for (const r of document.querySelectorAll('input[name="species"]')) r.checked = r.value === state.species;
  if (state.species) applySpecies(state.species);
  else { $('weight-hint').textContent = ''; $('amount-group').hidden = true; }
  show('pet');
}

function currentUnit() {
  return document.querySelector('input[name="unit"]:checked')?.value || 'kg';
}

function applySpecies(species) {
  state.species = species;
  const hint = WEIGHT_HINT[species];
  $('weight-hint').textContent = hint.text;
  const saved = Number(storeGet(`weight:${species}`));
  const kg = saved > 0 ? saved : null;
  const unit = currentUnit();
  $('weight').value = kg ? String(unit === 'lb' ? +(kg / LB).toFixed(2) : kg) : '';
  $('weight').placeholder = unit === 'lb' ? `e.g. ${+(hint.kg / LB).toFixed(1)}` : `e.g. ${hint.kg}`;
  renderAmount();
}

document.querySelectorAll('input[name="species"]').forEach((r) => r.addEventListener('change', () => applySpecies(r.value)));
document.querySelectorAll('input[name="unit"]').forEach((r) => r.addEventListener('change', () => {
  const v = Number($('weight').value);
  if (v > 0) $('weight').value = String(r.value === 'lb' ? +(v / LB).toFixed(2) : +(v * LB).toFixed(2));
  if (state.species) $('weight').placeholder = r.value === 'lb' ? `e.g. ${+(WEIGHT_HINT[state.species].kg / LB).toFixed(1)}` : `e.g. ${WEIGHT_HINT[state.species].kg}`;
}));

function speciesEntry() {
  return state.item?.species?.[state.species];
}
function doseBasis() {
  const e = speciesEntry();
  return e?.basis || (state.item?.content?.length ? 'compound' : 'product');
}
function doseApplies() {
  const e = speciesEntry();
  if (state.path !== 'item' || e?.risk !== 'dose') return false;
  return doseBasis() === 'product' || doseForms(state.item).length > 0 || Boolean(e.noDoseMath);
}

// What exactly was eaten: the product forms we can calculate, plus concentrated
// forms the data says to judge without a calculation.
function formOptions() {
  const e = speciesEntry();
  const opts = [];
  if (doseBasis() === 'product') {
    opts.push({ label: cap(state.item.names.en[0]), form: null, measure: { kind: 'grams', noun: 'g' } });
  } else {
    for (const f of doseForms(state.item)) {
      const form = adjustForm(state.item, f, state.quantities, data.toxins);
      opts.push({ label: cap(form.form || f.form), form, measure: formMeasure(f) });
    }
  }
  for (const nd of e?.noDoseMath?.forms || []) opts.push({ label: cap(nd), noDose: nd, measure: { kind: 'none' } });
  return opts;
}

function defaultOption(opts) {
  const q = state.quantities || {};
  if (q.tabletMg) return opts.find((o) => o.measure.kind === 'count') || opts[0];
  if (q.netWeightG) return opts.find((o) => o.measure.kind === 'grams') || opts[0];
  return opts[0];
}

function measure() {
  return state.option?.measure || { kind: 'grams', noun: 'g' };
}

function amountChoices() {
  const m = measure();
  if (m.kind === 'count') return [1, 2, 3, 5].map((n) => ({ label: `${n} ${m.noun}${n > 1 ? 's' : ''}`, amount: { count: n } }));
  if (m.kind === 'ml') return [5, 15, 50, 100].map((n) => ({ label: `${n} ml`, amount: { ml: n } }));
  if (m.kind === 'none') return [];
  const net = Number(state.quantities?.netWeightG);
  if (net > 0) {
    const r = (g) => Math.max(1, Math.round(g));
    const bite = r(Math.min(5, net * 0.05));
    return [
      { label: `A bite (≈ ${bite} g)`, amount: { grams: bite } },
      { label: `A quarter (≈ ${r(net / 4)} g)`, amount: { grams: r(net / 4) } },
      { label: `Half (≈ ${r(net / 2)} g)`, amount: { grams: r(net / 2) } },
      { label: `All of it (${r(net)} g)`, amount: { grams: r(net) } },
    ];
  }
  return [5, 20, 50, 100].map((g) => ({ label: `${g} g`, amount: { grams: g } }));
}

function renderAmount() {
  const showIt = doseApplies();
  $('amount-group').hidden = !showIt;
  state.amount = null;
  if (!showIt) { state.option = null; return; }
  const opts = formOptions();
  state.option = defaultOption(opts);
  $('form-chips').hidden = opts.length < 2;
  $('form-chips').replaceChildren(
    ...opts.map((o, i) =>
      el('label', { class: 'chip' }, [
        el('input', { type: 'radio', name: 'form', value: String(i), checked: o === state.option || null, onchange: () => { state.option = o; renderAmountChips(); } }),
        el('span', { text: o.label }),
      ]))
  );
  renderAmountChips();
}

function renderAmountChips() {
  const m = measure();
  state.amount = null;
  $('amount-exact').value = '';
  $('amount-how').hidden = m.kind === 'none';
  $('amount-unit').textContent = m.kind === 'count' ? `${m.noun}s` : m.noun;
  $('amount-chips').replaceChildren(
    ...amountChoices().map((c, i) =>
      el('label', { class: 'chip' }, [
        el('input', { type: 'radio', name: 'amount', value: String(i), onchange: () => { state.amount = c.amount; $('amount-exact').value = ''; } }),
        el('span', { text: c.label }),
      ]))
  );
}

$('amount-exact').addEventListener('input', (e) => {
  const v = Number(e.target.value);
  for (const r of document.querySelectorAll('input[name="amount"]')) r.checked = false;
  const k = measure().kind;
  state.amount = v > 0 ? (k === 'count' ? { count: v } : k === 'ml' ? { ml: v } : { grams: v }) : null;
});

function readWeightKg() {
  const v = Number($('weight').value);
  if (!(v > 0)) return null;
  return currentUnit() === 'lb' ? v * LB : v;
}

$('pet-go').addEventListener('click', () => {
  const err = $('pet-error');
  if (!state.species) { err.textContent = 'Choose the animal.'; err.hidden = false; return; }
  const kg = readWeightKg();
  if (!kg) { err.textContent = 'Enter the weight — a rough guess is fine.'; err.hidden = false; $('weight').focus(); return; }
  if (doseApplies() && !state.option?.noDose && !state.amount) { err.textContent = 'Choose roughly how much it ate.'; err.hidden = false; return; }
  err.hidden = true;
  state.weightKg = kg;
  storeSet(`weight:${state.species}`, String(+kg.toFixed(3)));
  state.when = document.querySelector('input[name="when"]:checked')?.value || 'just now';
  if (state.path === 'unknown') { renderSigns(); show('signs'); } else { renderVerdict(); show('verdict'); }
});

/* ---------- Unknown path ---------- */

$('way-unknown').addEventListener('click', () => {
  const species = state.species;
  Object.assign(state, freshState(), { path: 'unknown', species });
  openPet();
});

function renderSigns() {
  $('signs-list').replaceChildren(
    ...signsFor(data.signs, state.species).map((s) =>
      el('li', {}, el('label', { class: 'row' }, [
        el('input', { type: 'checkbox', value: s.id, checked: state.signs.includes(s.id) || null, onchange: (e) => {
          state.signs = e.target.checked ? [...state.signs, s.id] : state.signs.filter((x) => x !== s.id);
        } }),
        el('span', { class: 'check-box' }, icon('i-check')),
        el('span', { class: 'row-body' }, el('span', { class: 'row-title', text: s.label })),
      ])))
  );
}

$('signs-go').addEventListener('click', () => { renderVerdict(); show('verdict'); });

/* ---------- Verdict ---------- */

function sourceLabel(url) {
  if (!url) return 'Source';
  const host = url.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
  const names = {
    'merckvetmanual.com': 'Merck Veterinary Manual', 'aspca.org': 'ASPCA Animal Poison Control', 'petpoisonhelpline.com': 'Pet Poison Helpline',
    'vcahospitals.com': 'VCA Animal Hospitals', 'fda.gov': 'U.S. Food & Drug Administration',
  };
  return names[host] || host;
}

function computeVerdict() {
  if (state.path === 'unknown') return signsVerdict(data.signs, state.species, state.signs);
  return verdict(state.item, state.species, state.weightKg, { ...(state.amount || {}), form: state.option?.form || undefined, noDoseForm: state.option?.noDose });
}

function amountText() {
  if (state.option?.noDose) return state.option.noDose;
  const a = state.amount;
  if (!a) return null;
  const m = measure();
  const qty = a.count ?? a.ml ?? a.grams;
  const what = state.option && formOptions().length > 1 ? ` (${state.option.label.toLowerCase()})` : '';
  return m.kind === 'count' ? `${qty} ${m.noun}${qty > 1 ? 's' : ''}${what}` : `${Math.round(qty * 10) / 10} ${m.noun}${what}`;
}

const LEVEL_CLASS = { 'vet-now': 'seg-now', 'vet-today': 'seg-today', watch: 'seg-watch' };

function fmtNum(n) {
  return n >= 100 ? String(Math.round(n)) : n >= 10 ? String(Math.round(n)) : n >= 1 ? String(Math.round(n * 10) / 10) : String(Math.round(n * 100) / 100);
}

// Giant dose number + a meter showing where it sits against the sourced thresholds.
function renderDose(v) {
  if (v.kind !== 'dose') return;
  const [mass] = String(v.unit).split('/');
  $('dose-value').textContent = fmtNum(v.dosePerKg);
  $('dose-unit').textContent = v.unit;
  const compound = String(state.item.compound || 'the toxic substance').split(' (')[0];
  $('dose-of').textContent = `${mass === 'g' ? 'grams' : 'milligrams'} of ${compound} per kg of body weight`;
  const e = speciesEntry();
  const th = [...(e?.thresholds || [])].sort((a, b) => a.from - b.from);
  const top = Math.max((th[th.length - 1]?.from || 1) * 1.5, v.dosePerKg * 1.15);
  const bands = [{ from: 0, verdict: e?.below || 'vet-today' }, ...th];
  $('meter-track').replaceChildren(...bands.map((b, i) => {
    const to = bands[i + 1]?.from ?? top;
    const span = document.createElement('span');
    span.className = LEVEL_CLASS[b.verdict] || 'seg-today';
    span.style.width = `${Math.max(0, ((to - b.from) / top) * 100)}%`;
    return span;
  }));
  $('meter-ticks').replaceChildren(...th.map((t) => {
    const tick = document.createElement('span');
    tick.style.left = `${(t.from / top) * 100}%`;
    tick.textContent = String(t.from);
    return tick;
  }));
  const at = `${Math.min(1, v.dosePerKg / top) * 100}%`;
  $('meter-dot').style.left = at;
  $('meter-value').style.left = at;
  $('meter-value').textContent = fmtNum(v.dosePerKg);
}

function verdictContext() {
  const sp = cap(SPECIES_LABEL[state.species] || '');
  const kg = state.weightKg ? (state.weightKg < 1 ? `${Math.round(state.weightKg * 1000)} g` : `${Math.round(state.weightKg * 10) / 10} kg`) : '';
  const what = state.path === 'unknown' ? 'Unknown item' : itemName(state.item);
  return `${what} · ${sp}${kg ? `, ${kg}` : ''}`;
}

function renderVerdict() {
  const v = computeVerdict();
  $('verdict-band').dataset.level = v.level;
  $('verdict-context').textContent = verdictContext();
  $('verdict-title').textContent = LEVEL_LABEL[v.level];
  const thumb = $('verdict-thumb');
  const thumbSrc = state.path === 'unknown' ? `/img/${SPECIES_PHOTO[state.species]}.jpg` : state.photoUrl || itemPhoto(state.item);
  thumb.hidden = !thumbSrc;
  if (thumbSrc) thumb.src = thumbSrc;

  // Why
  let reason;
  if (state.path === 'unknown') {
    if (!v.chosen.length) reason = "No signs yet, but you think it ate something: call your vet or a poison line now rather than waiting for signs. Look around for the items below.";
    else reason = `${v.chosen.map((s) => s.label.toLowerCase()).join(', ')}${v.raisedBySpecies ? ` — small animals hide illness, so any sign in a ${SPECIES_LABEL[state.species]} needs a vet` : ''}.`;
    reason = cap(reason);
  } else if (state.item?.id === 'not-listed') {
    reason = `We have no reliable data on ${state.item.names.en[0]} for pets. A vet should decide.`;
  } else {
    reason = `${itemName(state.item)} for a ${SPECIES_LABEL[state.species]}: ${lowerFirst(v.reason)}`;
  }
  $('verdict-reason').textContent = reason;

  // Call buttons first when urgent
  const call = $('call-now');
  call.hidden = v.level !== 'vet-now';
  if (v.level === 'vet-now') call.replaceChildren(...callable(contactsFor(state.country)).slice(0, 2).map((c) => callButton(c)));

  // Numbers (dose only)
  const numbers = $('numbers-block');
  numbers.hidden = v.kind !== 'dose';
  $('more-block').hidden = v.kind !== 'dose';
  if (v.kind !== 'dose') $('live-amount-wrap').hidden = true;
  if (v.kind === 'dose') {
    $('verdict-math').textContent = v.math.text;
    $('verdict-band-text').textContent = bandText(v);
    renderDose(v);
    setupLive();
  }

  // Culprits (unknown path)
  const culprits = $('culprits-block');
  culprits.hidden = state.path !== 'unknown';
  if (state.path === 'unknown') {
    $('culprits').replaceChildren(
      ...v.culprits.map((c) => {
        const item = data.toxins.find((t) => t.id === c.ids?.[0]);
        const e = item?.species?.[state.species];
        const why = e?.signs || (e?.risk === 'no-data' ? 'No reliable data for this animal — a vet should decide.' : '');
        const body = el('span', { class: 'row-body' }, [
          el('span', { class: 'row-title', text: c.label }),
          why ? el('span', { class: 'culprit-why', text: cap(why) }) : null,
        ]);
        return el('li', {}, item
          ? el('button', { class: 'row', type: 'button', onclick: () => { state.quantities = {}; state.photoUrl = null; state.said = null; pickItem(item); } }, [body, icon('i-chev-r', 'icon chev')])
          : el('div', { class: 'row' }, body));
      })
    );
  }

  // Watch for
  const watch = $('watch-block');
  if (state.path === 'unknown') {
    const urgent = signsFor(data.signs, state.species).filter((s) => s.urgency === 'vet-now').map((s) => s.label.split(':')[0].split(' (')[0].toLowerCase());
    $('verdict-signs').textContent = `Go to a vet at once if you see: ${urgent.slice(0, 6).join('; ')}.`;
    $('verdict-onset').textContent = '';
    watch.hidden = false;
  } else {
    $('verdict-signs').textContent = v.signs ? cap(v.signs) : 'Any change in behaviour, eating, breathing or balance.';
    $('verdict-onset').textContent = v.onset ? `Timing: ${lowerFirst(v.onset)}` : '';
    watch.hidden = false;
  }

  // Source
  const src = $('verdict-source');
  if (state.path === 'unknown') {
    const urls = [...new Set([...v.chosen.map((s) => s.source), v.culpritsSource].filter(Boolean))];
    const seen = new Set();
    const links = urls.filter((u) => !seen.has(sourceLabel(u)) && seen.add(sourceLabel(u)));
    src.replaceChildren(...links.map((u, i) => [i ? ' · ' : '', el('a', { href: u, target: '_blank', rel: 'noopener noreferrer', text: sourceLabel(u) })]).flat());
    if (!src.childNodes.length) src.textContent = 'Signs from veterinary references listed in the app.';
  } else if (v.source) {
    src.replaceChildren(
      el('a', { href: v.source, target: '_blank', rel: 'noopener noreferrer', text: sourceLabel(v.source) }),
      v.quote ? el('span', { class: 'quote', text: `“${v.quote}”` }) : ''
    );
  } else {
    src.textContent = 'No veterinary data for this item and animal — that is why we say to call your vet.';
  }

  renderSummary(v);
}

function bandText(v) {
  if (!v.math) return '';
  const parts = [];
  if (v.math.form) parts.push(`Calculated for: ${v.math.form}.`);
  if (v.math.firstLevel) parts.push(`Veterinary sources report the first signs from ${v.math.firstLevel}.`);
  return parts.join(' ');
}

function renderSummary(v) {
  const signLabels = state.path === 'unknown' ? v.chosen.map((s) => s.label.toLowerCase()) : [];
  const text = buildSummary({
    species: state.species,
    weightKg: state.weightKg,
    when: state.when,
    itemName: state.path === 'unknown' ? null : itemName(state.item) + (quantitiesText(state.quantities) ? ` (${quantitiesText(state.quantities)})` : ''),
    amountText: state.path === 'unknown' ? null : amountText(),
    signs: signLabels,
    doseText: v.kind === 'dose' ? v.math.perKg : null,
    level: v.level,
  });
  $('summary').textContent = text;
  $('summary-share').hidden = !navigator.share;
}

/* Live controls: moving amount or weight re-runs the verdict instantly. */
function setupLive() {
  const m = measure();
  const amt = $('live-amount');
  $('live-amount-wrap').hidden = m.kind === 'none' || !state.amount;
  if (state.amount) {
    const current = state.amount.count ?? state.amount.ml ?? state.amount.grams;
    const net = Number(state.quantities?.netWeightG);
    const ceiling = m.kind === 'count' ? 10 : m.kind === 'ml' ? 200 : Math.max(net || 0, 200);
    amt.min = '1';
    amt.max = String(Math.max(ceiling, Math.ceil(current * 2)));
    amt.step = '1';
    amt.value = String(current);
  }
  const wt = $('live-weight');
  const w = state.weightKg;
  wt.min = String(Math.max(0.02, w / 4));
  wt.max = String(Math.max(w * 2.5, 0.1));
  wt.step = String(w < 1 ? 0.005 : 0.1);
  wt.value = String(w);
  updateLiveOutputs();
}

function updateLiveOutputs() {
  const m = measure();
  const a = Number($('live-amount').value);
  $('live-amount-out').textContent = m.kind === 'count' ? `${a} ${m.noun}${a > 1 ? 's' : ''}` : `${a} ${m.noun}`;
  const w = Number($('live-weight').value);
  $('live-weight-out').textContent = w < 1 ? `${Math.round(w * 1000)} g` : `${Math.round(w * 10) / 10} kg`;
}

function onLive() {
  const k = measure().kind;
  const a = Number($('live-amount').value);
  if (state.amount) state.amount = k === 'count' ? { count: a } : k === 'ml' ? { ml: a } : { grams: a };
  state.weightKg = Number($('live-weight').value);
  updateLiveOutputs();
  const v = computeVerdict();
  $('verdict-band').dataset.level = v.level;
  $('verdict-context').textContent = verdictContext();
  renderDose(v);
  $('verdict-title').textContent = LEVEL_LABEL[v.level];
  $('verdict-reason').textContent = `${itemName(state.item)} for a ${SPECIES_LABEL[state.species]}: ${lowerFirst(v.reason)}`;
  $('verdict-math').textContent = v.math?.text || '';
  $('verdict-band-text').textContent = bandText(v);
  const call = $('call-now');
  call.hidden = v.level !== 'vet-now';
  if (v.level === 'vet-now' && !call.childElementCount) call.replaceChildren(...callable(contactsFor(state.country)).slice(0, 2).map((c) => callButton(c)));
  renderSummary(v);
}
$('live-amount').addEventListener('input', onLive);
$('live-weight').addEventListener('input', onLive);

/* ---------- Summary actions ---------- */

$('summary-copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('summary').textContent); toast('Copied — paste it in a message or read it on the phone'); }
  catch { toast('Select the text and copy it'); }
});
$('summary-share').addEventListener('click', async () => {
  try { await navigator.share({ title: 'For the vet', text: $('summary').textContent }); } catch { /* cancelled */ }
});

$('restart').addEventListener('click', () => {
  const species = state.species;
  Object.assign(state, freshState(), { species });
  history.length = 0;
  $('type-input').value = '';
  $('suggestions').replaceChildren();
  selectTab(null);
  startStatus('');
  show('start', { push: false });
});

/* ---------- Emergency help ---------- */

function contactsFor(country) {
  const c = data.contacts || {};
  return [...(c.poisonCentres || []), ...(c.onDutyVetFrance || [])]
    .filter((x) => [].concat(x.country || []).includes(country))
    .filter((x) => x.id !== '3115'); // not officially confirmed (data/SOURCES.md) — never show an unverified number
}
const callable = (list) => list.filter((x) => x.tel);
const shortName = (c) => c.short || String(c.name).split(' – ')[0].split(' (')[0];

function telHref(c) {
  return `tel:${String(c.tel || c.phone).replace(/[^+\d]/g, '')}`;
}

function callButton(c) {
  return el('a', { class: 'call-btn', href: telHref(c) }, [
    icon('i-phone'),
    el('span', { class: 'call-text' }, [
      el('span', { class: 'call-name', text: `Call ${shortName(c)}` }),
      el('span', { class: 'call-num', text: c.phone }),
    ]),
  ]);
}

function renderContacts() {
  for (const r of document.querySelectorAll('input[name="country"]')) r.checked = r.value === state.country;
  $('contacts').replaceChildren(
    ...contactsFor(state.country).map((c) => {
      const body = el('span', { class: 'row-body' }, [
        el('span', { class: 'row-title', text: shortName(c) }),
        el('span', { class: 'row-sub', text: c.display || [c.hoursShort || c.hours, c.feeShort || c.fee].filter(Boolean).join(' · ') }),
      ]);
      return el('li', {}, c.tel
        ? el('a', { class: 'row', href: telHref(c) }, [body, el('span', { class: 'contact-num', text: c.phone })])
        : el('div', { class: 'row' }, body));
    })
  );
}

$('help-open').addEventListener('click', () => { renderContacts(); $('help').showModal(); });
$('help-close').addEventListener('click', () => $('help').close());
$('help').addEventListener('click', (e) => { if (e.target === $('help')) $('help').close(); });
document.querySelectorAll('input[name="country"]').forEach((r) => r.addEventListener('change', () => {
  state.country = r.value;
  renderContacts();
  if (!$('call-now').hidden) $('call-now').replaceChildren(...callable(contactsFor(state.country)).slice(0, 2).map((c) => callButton(c)));
}));

/* ---------- boot ---------- */

async function boot() {
  try {
    const [toxins, signs, contacts] = await Promise.all(
      ['toxins', 'signs', 'contacts'].map((n) => fetch(`/data/${n}.json`).then((r) => { if (!r.ok) throw new Error(n); return r.json(); }))
    );
    data.toxins = Array.isArray(toxins) ? toxins : toxins.items || [];
    data.signs = signs;
    data.contacts = contacts;
  } catch {
    startStatus('Swallowed could not load its veterinary data. Check your connection and reload.', true);
  }
}

boot();
