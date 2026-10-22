// Swallowed — the page. spec.md > Screens and flow (page)
// Start → Confirm → Your pet → Verdict, and Start → Your pet → Signs → Verdict
// for "I don't know what it ate". Verdicts come only from data/*.json.

import { matchItems, detectSpecies, parseAmounts, normalize } from './match.js';
import { verdict, signsVerdict, signsFor, doseForms, formMeasure, adjustForm, SPECIES as SPECIES_ALL } from './verdict.js';
import { buildSummary, LEVEL_LABEL, SPECIES_LABEL } from './summary.js';
import { speechSupported, listen } from './speech.js';

const $ = (id) => document.getElementById(id);
// The page is served by GitHub Pages (never sleeps, opens instantly); recognition runs on the
// Render server, which may sleep on its free plan. On Render itself the API is same-origin.
const API = /(^|\.)github\.io$/.test(location.hostname) ? 'https://swallowed.onrender.com' : '';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const WEIGHT_HINT = {
  dog: { kg: 10, text: 'Dogs range from about 2 kg to over 60 kg.', lb: 'Dogs range from about 4 lb to over 130 lb.' },
  cat: { kg: 4, text: 'Most adult cats weigh 3–6 kg.', lb: 'Most adult cats weigh 7–13 lb.' },
  rabbit: { kg: 2, text: 'Pet rabbits usually weigh 1–5 kg.', lb: 'Pet rabbits usually weigh 2–11 lb.' },
  rodent: { kg: 1, text: 'A guinea pig is about 1 kg; a hamster about 0.1 kg (100 g).', lb: 'A guinea pig is about 2 lb; a hamster about 0.2 lb.' },
  bird: { kg: 0.1, text: 'A budgie is about 0.035 kg (35 g), a cockatiel 0.09 kg, a grey parrot 0.45 kg.', lb: 'A budgie is about 0.08 lb, a cockatiel 0.2 lb, a grey parrot 1 lb.' },
};
const LB = 0.45359237;

const data = { toxins: [], signs: null, contacts: null };
const state = freshState();
const navStack = []; // views behind the current one (not window.history)
let stopListening = null;

function freshState() {
  return {
    path: 'item', item: null, candidates: [], quantities: {}, photoUrl: null, said: null, recognisedLabel: null, typed: '', spoken: {},
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
  return name ? `img/${name}.jpg` : null;
}
const CATEGORY = { food: 'Food', plant: 'Plant', 'human-medicine': 'Human medicine', household: 'Household product', garden: 'Garden product', 'pest-control': 'Pest control', 'vet-medicine': 'Pet medicine', other: 'Other' };

// Each new way of showing the item starts clean (no photo, quantities or words from before).
function freshInput() {
  identifying?.abort('cancel');
  state.photoUrl = null;
  state.quantities = {};
  state.said = null;
  state.recognisedLabel = null;
  state.typed = '';
  state.spoken = {};
}

// Remember the words used to name the item: they choose the right form ("cocoa powder",
// "400 mg tablet") and pre-fill amounts ("3 tablets", "50 g").
function noteWords(text) {
  state.typed = `${state.typed} ${text || ''}`.trim();
  state.spoken = { ...state.spoken, ...parseAmounts(text || '') };
}

// Decimal numbers typed on a French keyboard use a comma.
const num = (v) => Number(String(v ?? '').replace(',', '.').trim());

// If the data can't load, these lines still show (data/contacts.json has the full list).
const FALLBACK_CONTACTS = {
  poisonCentres: [
    { id: 'aspca', name: 'ASPCA Animal Poison Control', short: 'ASPCA Poison Control', phone: '(888) 426-4435', tel: '+18884264435', country: 'US', hoursShort: '24/7' },
    { id: 'pph', name: 'Pet Poison Helpline', short: 'Pet Poison Helpline', phone: '(855) 764-7661', tel: '+18557647661', country: 'US', hoursShort: '24/7' },
    { id: 'cnitv', name: 'CNITV (Lyon)', short: 'CNITV (Lyon)', phone: '04 78 87 10 40', tel: '+33478871040', country: 'FR', hoursShort: 'Daily, 8:30 am – midnight' },
    { id: 'capae', name: 'CAPAE-Ouest (Nantes)', short: 'CAPAE-Ouest (Nantes)', phone: '02 40 68 77 40', tel: '+33240687740', country: 'FR', hoursShort: 'Daily, 8:30 am – midnight' },
  ],
};

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

/* Screens slide like a native app: forward pushes from the right, back pops to the right.
   Each screen scrolls on its own under a fixed bar; the browser history follows along so the
   phone's own back gesture and button work too. */
const EASE_IOS = 'cubic-bezier(0.32, 0.72, 0, 1)';
let running = [];
let ignoreNextPop = false;
const isStandalone = () => navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
const currentView = () => document.querySelector('.view:not([hidden])');

function show(name, { push = true, direction } = {}) {
  const from = currentView();
  const to = document.querySelector(`.view[data-view="${name}"]`);
  if (!to || from === to) return;
  for (const a of running) a.finish();
  running = [];
  if (push && from) {
    navStack.push(from.dataset.view);
    try { window.history.pushState({ swallowed: navStack.length }, ''); } catch { /* sandboxed */ }
  }
  const forward = (direction || (push ? 'forward' : 'back')) === 'forward';
  if (forward) to.scrollTop = 0;
  if (name === 'pet' && !forward) syncAmountUI();
  to.hidden = false;
  $('back').hidden = navStack.length === 0;
  updateBar();
  if (from) {
    if (reduceMotion) from.hidden = true;
    else slide(from, to, forward);
  }
  $('main').focus({ preventScroll: true });
}

function slide(from, to, forward) {
  const top = forward ? to : from;
  const under = forward ? from : to;
  top.classList.add('is-top');
  const opts = { duration: 420, easing: EASE_IOS };
  const a1 = top.animate(forward
    ? [{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }]
    : [{ transform: 'translateX(0)' }, { transform: 'translateX(100%)' }], opts);
  const a2 = under.animate(forward
    ? [{ transform: 'translateX(0)', filter: 'brightness(1)' }, { transform: 'translateX(-28%)', filter: 'brightness(0.94)' }]
    : [{ transform: 'translateX(-28%)', filter: 'brightness(0.94)' }, { transform: 'translateX(0)', filter: 'brightness(1)' }], opts);
  running = [a1, a2];
  a1.onfinish = () => { from.hidden = true; top.classList.remove('is-top'); };
}

function popView() {
  const prev = navStack.pop();
  closeAllSheets();
  if (prev) show(prev, { push: false });
}

$('back').addEventListener('click', () => {
  if (!navStack.length) return;
  if (window.history.state?.swallowed) window.history.back(); // popstate does the rest
  else popView();
});
window.addEventListener('popstate', () => {
  if (ignoreNextPop) { ignoreNextPop = false; return; }
  if (navStack.length) popView();
});

// Fixed bar: hairline + the screen's title once its big title has scrolled away.
function updateBar() {
  const view = currentView();
  if (!view) return;
  const h1 = view.querySelector('h1');
  const scrolled = view.scrollTop > 4;
  const titleGone = h1 ? view.scrollTop > h1.offsetTop + h1.offsetHeight - 56 : scrolled;
  const titled = Boolean(view.dataset.title) && titleGone;
  $('bar').classList.toggle('is-scrolled', scrolled || view.dataset.view === 'start');
  $('bar').classList.toggle('is-titled', titled);
  $('bar-title').textContent = view.dataset.title || '';
  $('bar-title').classList.toggle('is-on', titled);
}
for (const v of document.querySelectorAll('.view')) v.addEventListener('scroll', () => { if (!v.hidden) updateBar(); }, { passive: true });

// Swipe from the left edge to go back (in the installed app; Safari has its own gesture).
(function edgeSwipe() {
  const main = $('main');
  let g = null;
  main.addEventListener('touchstart', (e) => {
    if (!isStandalone() || !navStack.length || e.touches.length !== 1) return;
    const t = e.touches[0];
    if (t.clientX - main.getBoundingClientRect().left > 24) return;
    g = { x: t.clientX, y: t.clientY, t: performance.now(), dx: 0, on: false, cur: currentView(), prev: document.querySelector(`.view[data-view="${navStack.at(-1)}"]`) };
  }, { passive: true });
  main.addEventListener('touchmove', (e) => {
    if (!g) return;
    const t = e.touches[0];
    const dx = t.clientX - g.x;
    if (!g.on) {
      if (Math.abs(t.clientY - g.y) > Math.abs(dx)) { g = null; return; }
      if (dx < 8) return;
      g.on = true;
      g.prev.hidden = false;
      g.cur.classList.add('is-top');
    }
    e.preventDefault();
    const w = main.clientWidth;
    g.dx = Math.max(0, dx);
    g.cur.style.transform = `translateX(${g.dx}px)`;
    g.prev.style.transform = `translateX(${-28 + (28 * g.dx) / w}%)`;
  }, { passive: false });
  main.addEventListener('touchend', () => {
    if (!g?.on) { g = null; return; }
    const { cur, prev, dx } = g;
    const w = main.clientWidth;
    const fast = dx / (performance.now() - g.t) > 0.5;
    const done = dx > w / 3 || fast;
    g = null;
    const opts = { duration: 260, easing: EASE_IOS };
    const a = cur.animate([{ transform: `translateX(${dx}px)` }, { transform: done ? 'translateX(100%)' : 'translateX(0)' }], opts);
    prev.animate([{ transform: `translateX(${-28 + (28 * dx) / w}%)` }, { transform: done ? 'translateX(0)' : 'translateX(-28%)' }], opts);
    cur.style.transform = '';
    prev.style.transform = '';
    a.onfinish = () => {
      cur.classList.remove('is-top');
      if (!done) { prev.hidden = true; return; }
      cur.hidden = true;
      navStack.pop();
      if (window.history.state?.swallowed) { ignoreNextPop = true; window.history.back(); }
      $('back').hidden = navStack.length === 0;
      updateBar();
    };
  });
})();

// Keyboard: the app follows the visible area (visualViewport), so pinned buttons sit right above
// the keyboard, and the focused field is scrolled into view.
(function followKeyboard() {
  const vv = window.visualViewport;
  if (!vv) return;
  const app = $('app');
  const fit = () => {
    const open = vv.height < window.innerHeight - 80;
    app.style.height = open ? `${vv.height}px` : '';
    app.style.transform = open ? `translateY(${vv.offsetTop}px)` : '';
    app.classList.toggle('kb-open', open);
  };
  vv.addEventListener('resize', fit);
  vv.addEventListener('scroll', fit);
  document.addEventListener('focusin', (e) => {
    if (!e.target.matches('input:not([type="radio"]):not([type="checkbox"]):not([type="range"]), textarea')) return;
    setTimeout(() => e.target.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' }), 320);
  });
})();

// An app does not zoom: block pinch-zoom (iOS ignores user-scalable=no) and double-tap zoom is off in CSS.
document.addEventListener('gesturestart', (e) => e.preventDefault());

/* ---------- bottom sheets ---------- */

function openSheet(dialog) {
  if (dialog.open) return;
  dialog.showModal();
  if (!reduceMotion) dialog.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 380, easing: EASE_IOS });
}
function closeSheet(dialog) {
  if (!dialog.open || dialog.dataset.closing) return;
  if (reduceMotion) { dialog.close(); return; }
  dialog.dataset.closing = '1';
  const from = dialog.style.transform || 'translateY(0)';
  dialog.animate([{ transform: from }, { transform: 'translateY(100%)' }], { duration: 260, easing: EASE_IOS }).onfinish = () => {
    dialog.close();
    dialog.style.transform = '';
    delete dialog.dataset.closing;
  };
}
function closeAllSheets() {
  for (const d of document.querySelectorAll('dialog.sheet[open]')) { d.close(); d.style.transform = ''; }
}
for (const dialog of document.querySelectorAll('dialog.sheet')) {
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); closeSheet(dialog); });
  dialog.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) { closeSheet(dialog); return; }
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right) closeSheet(dialog);
  });
  // Drag the sheet down by its top to dismiss it.
  let drag = null;
  dialog.addEventListener('touchstart', (e) => {
    const top = e.target.closest('.grabber, .sheet-bar');
    if (!top || e.target.closest('button')) return;
    drag = { y: e.touches[0].clientY, t: performance.now(), dy: 0 };
  }, { passive: true });
  dialog.addEventListener('touchmove', (e) => {
    if (!drag) return;
    drag.dy = Math.max(0, e.touches[0].clientY - drag.y);
    dialog.style.transform = `translateY(${drag.dy}px)`;
    e.preventDefault();
  }, { passive: false });
  dialog.addEventListener('touchend', () => {
    if (!drag) return;
    const { dy, t } = drag;
    drag = null;
    if (dy > 120 || dy / (performance.now() - t) > 0.6) closeSheet(dialog);
    else {
      dialog.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], { duration: 220, easing: EASE_IOS });
      dialog.style.transform = '';
    }
  });
}

/* ---------- "Add to Home Screen" tip (iPhone Safari, not yet installed) ---------- */

(function installTip() {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!ios || isStandalone() || storeGet('install-tip') === 'off') return;
  $('install-tip').hidden = false;
  $('install-close').addEventListener('click', () => { $('install-tip').hidden = true; storeSet('install-tip', 'off'); });
})();

/* ---------- Start: type it ---------- */

function renderSuggestions(listEl, text, onPick) {
  const results = matchItems(data.toxins, text, 6);
  listEl.replaceChildren(
    ...results.map(({ item, matchedName }) =>
      el('li', {}, el('button', { class: 'row', type: 'button', onclick: () => onPick(item, results, matchedName) }, [
        el('span', { class: 'row-body' }, [
          el('span', { class: 'row-title', text: itemName(item) }),
          matchedName.toLowerCase() !== (item.names.en[0] || '').toLowerCase()
            ? el('span', { class: 'row-sub', text: `Matches “${matchedName}”` }) : null,
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
  freshInput();
  noteWords(b.dataset.q);
  const results = matchItems(data.toxins, b.dataset.q, 6);
  if (results.length) pickItem(results[0].item, { candidates: results.map((r) => r.item) });
}));

// "See all": every item we cover, grouped by kind, searchable.
const CATEGORY_ORDER = ['food', 'plant', 'human-medicine', 'vet-medicine', 'household', 'garden', 'pest-control', 'other'];
function renderAll(text = '') {
  const q = text.trim();
  const items = q ? matchItems(data.toxins, q, 48).map((r) => r.item) : data.toxins;
  const groups = CATEGORY_ORDER.map((cat) => [cat, items.filter((t) => (t.category || 'other') === cat)]).filter(([, list]) => list.length);
  $('all-list').replaceChildren(...groups.map(([cat, list]) => el('section', { class: 'all-group' }, [
    el('h3', { class: 'all-cat', text: CATEGORY[cat] || 'Other' }),
    el('ul', { class: 'rows' }, list.map((item) => el('li', {}, el('button', { class: 'row', type: 'button', onclick: () => {
      closeAllSheets();
      state.quantities = {}; state.photoUrl = null; state.said = null;
      pickItem(item);
    } }, [
      itemPhoto(item) ? el('img', { class: 'row-thumb', src: itemPhoto(item), alt: '', width: 44, height: 44, loading: 'lazy' }) : el('span', { class: 'row-thumb row-thumb--letter', 'aria-hidden': 'true', text: itemName(item).charAt(0) }),
      el('span', { class: 'row-body' }, el('span', { class: 'row-title', text: itemName(item) })),
      icon('i-chev-r', 'icon chev'),
    ])))),
  ])));
  if (!groups.length) $('all-list').replaceChildren(el('p', { class: 'hint', text: 'Not in our list. Type it on the main screen and we will look it up.' }));
}
$('see-all').addEventListener('click', () => { $('all-input').value = ''; renderAll(); openSheet($('sheet-all')); });
$('all-input').addEventListener('input', (e) => renderAll(e.target.value));

$('type-input').addEventListener('input', (e) => {
  const text = e.target.value;
  const results = renderSuggestions($('suggestions'), text, (item, res, matchedName) => {
    freshInput();
    noteWords(`${text} ${matchedName}`);
    pickItem(item, { candidates: res.map((r) => r.item) });
  });
  $('type-empty').hidden = !(text.trim().length >= 3 && results.length === 0);
  $('type-empty').textContent = 'Not in our list yet — press Search on the keyboard and we will recognise it.';
});

$('type-input').addEventListener('keydown', async (e) => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const text = e.target.value.trim();
  if (!text) return;
  freshInput();
  noteWords(text);
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
  freshInput();
  let dataUrl;
  try {
    dataUrl = await shrink(file, 1280);
  } catch {
    // Browsers that can't draw HEIC (Chrome on a computer): send the file as it is when small enough.
    if (/hei[cf]/i.test(file.type) && file.size < 3.5e6) dataUrl = await readAsDataUrl(file).catch(() => null);
  }
  if (!dataUrl) { startStatus("We couldn't open that photo. Try another one, or type it.", true); return; }
  state.photoUrl = dataUrl.startsWith('data:image/jpeg') ? dataUrl : null;
  await identify({ image: dataUrl });
}
$('photo-input').addEventListener('change', onPhotoChosen);

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
}

function shrink(file, maxSide) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      try {
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const out = canvas.toDataURL('image/jpeg', 0.82);
        canvas.width = 0; // release the canvas memory at once (iPhone keeps it otherwise)
        canvas.height = 0;
        if (out.length < 100) throw new Error('canvas'); // "data:," when the canvas failed
        resolve(out);
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(url);
      }
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

function busy(on, payload = {}) {
  $('busy').hidden = !on;
  if (!on) return;
  $('busy-text').textContent = payload.image ? 'Looking at your photo…' : 'Looking it up…';
  $('busy-sub').textContent = '';
  $('busy-photo').hidden = !payload.image;
  if (payload.image) $('busy-photo').src = payload.image;
}

let identifying = null; // AbortController of the recognition in progress

// Recognition never blocks the app: after 6 s we say why it's slow (a sleeping free server
// takes up to a minute to wake), "Type it instead" is always there, and 75 s is the hard stop.
async function identify(payload) {
  startStatus('');
  busy(true, payload);
  setWaysDisabled(true);
  const ctrl = new AbortController();
  identifying = ctrl;
  const slow = setTimeout(() => { $('busy-sub').textContent = 'Waking up the recognition server — this can take up to a minute.'; }, 6000);
  const hard = setTimeout(() => ctrl.abort('timeout'), 75000);
  try {
    const res = await fetch(`${API}/api/identify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const body = isJson ? await res.json().catch(() => ({})) : {};
    if (!res.ok || !isJson) {
      startStatus(body?.error?.message || 'Recognition is waking up or unavailable — try again in a moment, or type it.', true);
      return;
    }
    if (identifying !== ctrl) return; // something else was chosen meanwhile
    handleIdentified(body, payload);
  } catch {
    if (ctrl.signal.reason === 'cancel') return;
    startStatus(ctrl.signal.aborted ? 'Recognition is taking too long — type it instead.' : 'No connection — you can still type a known item.', true);
  } finally {
    clearTimeout(slow);
    clearTimeout(hard);
    if (identifying === ctrl) identifying = null;
    busy(false);
    setWaysDisabled(false);
  }
}

$('busy-cancel').addEventListener('click', () => {
  identifying?.abort('cancel');
  selectTab('type');
});

// Wake a sleeping server early: when the app opens and whenever it comes back to the screen.
function wakeServer() { fetch(`${API}/healthz`, { cache: 'no-store' }).then((r) => r.text()).catch(() => {}); }
document.addEventListener('visibilitychange', () => { if (!document.hidden) wakeServer(); });

function setWaysDisabled(on) {
  for (const id of ['way-photo', 'tab-type', 'tab-say', 'way-voice', 'way-unknown']) $(id).disabled = on;
}

function handleIdentified(result, payload) {
  const byId = (id) => data.toxins.find((t) => t.id === id);
  const main = result.matchId ? byId(result.matchId) : null;
  const others = (result.alternatives || []).map(byId).filter(Boolean);
  state.quantities = result.quantities || {};
  state.recognisedLabel = result.label || null;
  if (result.label) noteWords(result.label);
  if (!main) {
    if (!result.label || (!others.length && (result.confidence ?? 0) < 0.3)) {
      startStatus(payload.image ? "We couldn't recognise it. Retake the photo closer, or type it." : "We couldn't find that. Check the spelling, or describe it differently.", true);
      return;
    }
    // Recognised but not in the curated list → honest "call your vet" verdict, never a guess;
    // close items from our list are offered, not imposed.
    startStatus('');
    pickItem({ id: 'not-listed', names: { en: [result.label] }, category: 'other', species: {} }, { notListed: true, candidates: others, lowConfidence: others.length > 0 });
    return;
  }
  startStatus('');
  pickItem(main, { candidates: [main, ...others], lowConfidence: (result.confidence ?? 1) < 0.6 });
}

/* ---------- Start: say it ---------- */

const SPEECH_MSG = {
  'not-allowed': 'The microphone is blocked for this site. In Safari: aA › Website Settings › Microphone › Allow. Or type it.',
  'service-not-allowed': "Voice isn't available here. Tap the box and use the microphone key on your keyboard.",
  'no-start': "Voice didn't start in this browser. Tap the box and use the microphone key on your keyboard.",
  'audio-capture': 'The microphone is busy (a call?). Type it instead.',
  'no-speech': "We didn't hear anything. Tap the microphone and speak, or type it.",
  network: 'Voice needs a connection. Type it instead.',
};

$('way-voice').addEventListener('click', () => {
  if (stopListening) { stopListening(); return; }
  if (!speechSupported) {
    selectTab('type');
    startStatus(SPEECH_MSG['no-start']);
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
      if (code === 'aborted') return;
      if (code !== 'no-speech') selectTab('type');
      startStatus(SPEECH_MSG[code] || "We didn't catch that. Try again, or type it.", true);
    },
    onEnd: (text) => {
      done();
      if (text) handleSaid(text);
      else startStatus(SPEECH_MSG['no-speech']);
    },
  });
});

$('voice-stop').addEventListener('click', () => stopListening?.());

async function handleSaid(text) {
  freshInput();
  noteWords(text);
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
  const read = state.recognisedLabel && normalize(state.recognisedLabel) !== normalize(itemName(item)) ? `We read “${state.recognisedLabel}”` : '';
  $('confirm-detail').textContent = notListed
    ? 'Not in our list of known pet poisonings — we will not guess.'
    : [read, CATEGORY[item.category], q].filter(Boolean).join(' · ');
  // Only when the data says so for all five animals — a partial list could read as "safe for the others".
  const everyPet = !notListed && SPECIES_ALL.every((sp) => ['dose', 'any'].includes(item.species?.[sp]?.risk));
  $('confirm-danger').textContent = everyPet ? 'Dangerous for every pet' : '';
  const photo = $('confirm-photo');
  const src = state.photoUrl || (notListed ? null : itemPhoto(item));
  photo.hidden = !src;
  photo.classList.toggle('is-stock', !state.photoUrl);
  if (src) photo.src = src;
  $('confirm-said').hidden = !state.said;
  $('confirm-said').textContent = state.said ? `You said: "${state.said}"` : '';
  $('confirm-title').textContent = lowConfidence ? 'Best guess — or pick one below' : 'Is this it?';
  renderCandidates();
  $('change-panel').hidden = !lowConfidence;
  $('confirm-change').hidden = lowConfidence;
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
  $('confirm-change').hidden = true;
  $('change-input').focus();
});
function pickChanged(item, matchedName) {
  state.quantities = {}; // the photo's printed amounts belonged to the other item; the photo itself stays
  state.typed = '';
  state.spoken = {};
  noteWords(matchedName || '');
  pickItem(item);
}
$('change-input').addEventListener('input', (e) => {
  renderSuggestions($('change-suggestions'), e.target.value, (item, res, matchedName) => pickChanged(item, matchedName));
});
$('change-input').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const first = matchItems(data.toxins, e.target.value, 1)[0];
  if (first) pickChanged(first.item, first.matchedName);
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

function weightHints() {
  const hint = WEIGHT_HINT[state.species];
  if (!hint) return;
  const lb = currentUnit() === 'lb';
  $('weight').placeholder = lb ? String(+(hint.kg / LB).toFixed(1)) : String(hint.kg);
  $('weight-hint').textContent = lb ? hint.lb : hint.text;
}

function applySpecies(species) {
  state.species = species;
  const hint = WEIGHT_HINT[species];
  const saved = Number(storeGet(`weight:${species}`));
  const kg = saved > 0 ? saved : null;
  const unit = currentUnit();
  if (!$('weight').value.trim()) $('weight').value = kg ? String(unit === 'lb' ? +(kg / LB).toFixed(1) : kg) : '';
  weightHints();
  renderAmount();
}

document.querySelectorAll('input[name="species"]').forEach((r) => r.addEventListener('change', () => applySpecies(r.value)));
document.querySelector('[data-view="pet"]').addEventListener('input', () => { $('pet-error').hidden = true; });
document.querySelector('[data-view="pet"]').addEventListener('change', () => { $('pet-error').hidden = true; });
document.querySelectorAll('input[name="unit"]').forEach((r) => r.addEventListener('change', () => {
  const v = num($('weight').value);
  if (v > 0) $('weight').value = String(r.value === 'lb' ? +(v / LB).toFixed(1) : +(v * LB).toFixed(2));
  weightHints();
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
    const forms = doseForms(state.item);
    const strength = num(state.quantities?.tabletMg || state.spoken?.tabletMg);
    const mgCount = forms.filter((f) => formMeasure(f).kind === 'count' && /^mg\//.test(f.unit));
    const known = mgCount.some((f) => num(f.value) === strength);
    // A strength we know (400 mg ibuprofen) selects that form; an unknown printed one adjusts one tablet form only.
    const q = known || !state.quantities?.tabletMg ? { ...state.quantities, tabletMg: undefined } : state.quantities;
    let adjusted = false;
    for (const f of forms) {
      if (mgCount.includes(f) && q.tabletMg) { if (adjusted) continue; adjusted = true; }
      const form = adjustForm(state.item, f, q, data.toxins);
      opts.push({ label: cap(form.adjusted ? form.form : f.label || f.form), form, measure: formMeasure(f) });
    }
  }
  for (const nd of e?.noDoseMath?.forms || []) opts.push({ label: cap(nd), noDose: nd, measure: { kind: 'none' } });
  return opts;
}

const FORM_GENERIC = new Set(['tablet', 'mg', 'ml', 'g', 'or', 'and', 'the', 'of', 'e', 'per', 'product', 'value', 'chocolate']);
const wordSet = (text) => new Set(normalize(text).split(' ').filter((w) => w && !FORM_GENERIC.has(w) && !/^\d/.test(w)).map((w) => w.replace(/s$/, '')));

// Which form was it? One form: that one. A strength we were told: that tablet. Words used
// ("cocoa powder", "coffee", "children's"): the best-matching form. Otherwise nobody guesses —
// the owner chooses (a default could understate the dose).
function defaultOption(opts) {
  if (opts.length <= 1) return opts[0] || null;
  const q = state.quantities || {};
  const said = state.spoken || {};
  const strength = num(said.tabletMg || q.tabletMg);
  if (strength) {
    const exact = opts.find((o) => o.measure.kind === 'count' && num(o.form?.value) === strength);
    if (exact) return exact;
    const adjusted = opts.find((o) => o.form?.adjusted);
    if (adjusted) return adjusted;
  }
  const typed = wordSet(state.typed);
  let best = null;
  let bestHits = 0;
  for (const o of opts) {
    const hits = [...wordSet(`${o.label} ${o.form?.form || ''} ${o.noDose || ''}`)].filter((w) => typed.has(w)).length;
    if (hits > bestHits) { best = o; bestHits = hits; }
  }
  if (best) return best;
  if (q.netWeightG) return opts.find((o) => o.measure.kind === 'grams') || null;
  const kinds = [said.ml && 'ml', said.grams && 'grams'].filter(Boolean);
  for (const k of kinds) {
    const only = opts.filter((o) => o.measure.kind === k);
    if (only.length === 1) return only[0];
  }
  return null;
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
  $('form-ask').hidden = Boolean(state.option) || opts.length < 2;
  $('form-chips').replaceChildren(
    ...opts.map((o, i) =>
      el('label', { class: 'chip' }, [
        el('input', { type: 'radio', name: 'form', value: String(i), checked: o === state.option || null, onchange: () => { state.option = o; $('form-ask').hidden = true; renderAmountChips(); } }),
        el('span', { text: o.label }),
      ]))
  );
  renderAmountChips();
}

function renderAmountChips() {
  const m = measure();
  state.amount = null;
  $('amount-exact').value = '';
  $('amount-how').hidden = !state.option || m.kind === 'none';
  if (!state.option) return;
  $('amount-unit').textContent = m.kind === 'count' ? `${m.noun}s` : m.noun;
  $('amount-chips').replaceChildren(
    ...amountChoices().map((c, i) =>
      el('label', { class: 'chip' }, [
        el('input', { type: 'radio', name: 'amount', value: String(i), onchange: () => { state.amount = c.amount; $('amount-exact').value = ''; } }),
        el('span', { text: c.label }),
      ]))
  );
  // An amount said or typed ("3 tablets", "50 g") is filled in, and can still be changed.
  const said = state.spoken || {};
  const v = m.kind === 'count' ? said.count : m.kind === 'ml' ? said.ml : m.kind === 'grams' ? said.grams : null;
  if (v > 0) {
    state.amount = m.kind === 'count' ? { count: v } : m.kind === 'ml' ? { ml: v } : { grams: v };
    $('amount-exact').value = String(v);
  }
}

// Coming back to "Your pet" from the verdict: show the amount the verdict really used.
function syncAmountUI() {
  if (!state.amount) return;
  const v = state.amount.count ?? state.amount.ml ?? state.amount.grams;
  for (const r of document.querySelectorAll('input[name="amount"]')) r.checked = false;
  $('amount-exact').value = String(Math.round(v * 100) / 100);
}

$('amount-exact').addEventListener('input', (e) => {
  const v = num(e.target.value);
  for (const r of document.querySelectorAll('input[name="amount"]')) r.checked = false;
  const k = measure().kind;
  state.amount = v > 0 ? (k === 'count' ? { count: v } : k === 'ml' ? { ml: v } : { grams: v }) : null;
});

function readWeightKg() {
  const v = num($('weight').value);
  if (!(v > 0)) return null;
  return currentUnit() === 'lb' ? v * LB : v;
}

$('pet-go').addEventListener('click', () => {
  const err = $('pet-error');
  if (!state.species) { err.textContent = 'Choose the animal.'; err.hidden = false; return; }
  const kg = readWeightKg();
  if (!kg) { err.textContent = 'Enter the weight — a rough guess is fine.'; err.hidden = false; $('weight').focus(); return; }
  if (kg < 0.01 || kg > 150) { err.textContent = 'Check the weight and the kg / lb switch.'; err.hidden = false; $('weight').focus(); return; }
  if (doseApplies() && !state.option) { err.textContent = 'Choose which one it was.'; err.hidden = false; return; }
  if (doseApplies() && !state.option?.noDose && !state.amount) { err.textContent = 'Choose roughly how much it ate.'; err.hidden = false; return; }
  err.hidden = true;
  state.weightKg = kg;
  storeSet(`weight:${state.species}`, String(+kg.toFixed(3)));
  state.when = document.querySelector('input[name="when"]:checked')?.value || 'just now';
  if (state.path === 'unknown') { renderSigns(); show('signs'); } else { renderVerdict(); show('verdict'); }
});

/* ---------- Unknown path ---------- */

$('way-unknown').addEventListener('click', () => {
  if (!data.signs) { startStatus('Swallowed could not load its veterinary data. Check your connection and reload — or press Emergency.', true); return; }
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

$('signs-go').addEventListener('click', () => { state.path = 'unknown'; renderVerdict(); show('verdict'); });

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
  if (state.option?.noDose) return null;
  const a = state.amount;
  if (!a) return null;
  const m = measure();
  const qty = a.count ?? a.ml ?? a.grams;
  const what = state.option && formOptions().length > 1 ? ` (${state.option.label.toLowerCase()})` : '';
  return m.kind === 'count' ? `${qty} ${m.noun}${qty > 1 ? 's' : ''}${what}` : `${Math.round(qty * 10) / 10} ${m.noun}${what}`;
}

const LEVEL_CLASS = { 'vet-now': 'seg-now', 'vet-today': 'seg-today', watch: 'seg-watch' };


// Giant dose number + a meter showing where it sits against the sourced thresholds.
function renderDose(v) {
  if (v.kind !== 'dose') return;
  const [mass] = String(v.unit).split('/');
  $('dose-value').textContent = String(v.math.shown);
  $('dose-unit').textContent = v.unit;
  const compound = String(state.item.compound || 'the toxic substance').split(' (')[0];
  $('dose-of').textContent = `${mass === 'g' ? 'grams' : 'milligrams'} of ${compound} per kg of body weight`;
  const e = speciesEntry();
  const th = [...(e?.thresholds || [])].sort((a, b) => a.from - b.from);
  const top = Math.max((th[th.length - 1]?.from || 1) * 1.5, v.dosePerKg * 1.15);
  const bands = [{ from: 0, verdict: e?.below || 'vet-today' }, ...th].filter((b, i, all) => i === 0 || b.verdict !== all[i - 1].verdict);
  $('meter-track').replaceChildren(...bands.map((b, i) => {
    const to = bands[i + 1]?.from ?? top;
    const span = document.createElement('span');
    span.className = LEVEL_CLASS[b.verdict] || 'seg-today';
    span.style.width = `${Math.max(0, ((to - b.from) / top) * 100)}%`;
    return span;
  }));
  $('meter-ticks').replaceChildren(...th.filter((t) => Math.abs(t.from - v.dosePerKg) / top > 0.06).map((t) => {
    const tick = document.createElement('span');
    tick.style.left = `${(t.from / top) * 100}%`;
    tick.textContent = String(t.from);
    return tick;
  }));
  $('sheet-live').textContent = `≈ ${v.math.shown} ${v.unit} · ${LEVEL_LABEL[v.level]}`;
  $('sheet-live').dataset.level = v.level;
  const at = `${Math.min(1, v.dosePerKg / top) * 100}%`;
  $('meter-dot').style.left = at;
  $('meter-value').style.left = `clamp(14px, ${at}, calc(100% - 14px))`;
  $('meter-value').textContent = String(v.math.shown);
}

function verdictContext() {
  const sp = cap(SPECIES_LABEL[state.species] || '');
  const kg = state.weightKg ? (state.weightKg < 1 ? `${Math.round(state.weightKg * 1000)} g` : `${Math.round(state.weightKg * 10) / 10} kg`) : '';
  const what = state.path === 'unknown' ? 'Unknown item' : itemName(state.item);
  return `${what} · ${sp}${kg ? `, ${kg}` : ''}`;
}

function renderVerdict({ live = false } = {}) {
  const v = computeVerdict();
  $('verdict-band').dataset.level = v.level;
  $('verdict-context').textContent = verdictContext();
  $('verdict-title').textContent = LEVEL_LABEL[v.level];
  document.querySelector('[data-view="verdict"]').dataset.title = LEVEL_LABEL[v.level];
  const thumb = $('verdict-thumb');
  const thumbSrc = state.path === 'unknown' ? `img/${SPECIES_PHOTO[state.species]}.jpg` : state.photoUrl || itemPhoto(state.item);
  thumb.hidden = !thumbSrc;
  if (thumbSrc) thumb.src = thumbSrc;

  // Why
  let reason;
  if (state.path === 'unknown') {
    const short = (sign) => sign.label.split(':')[0].split(' (')[0].toLowerCase();
    if (!v.chosen.length) reason = "No signs yet, but you think it ate something: call your vet or a poison line today rather than waiting for signs, and look around for the items below.";
    else reason = `${v.chosen.length} sign${v.chosen.length > 1 ? 's' : ''}: ${v.chosen.map(short).join(', ')}${v.raisedBySpecies ? `. Small animals hide illness, so any sign in a ${SPECIES_LABEL[state.species]} needs a vet` : ''}.`;
    reason = cap(reason);
  } else if (state.item?.id === 'not-listed') {
    reason = `We have no reliable data on ${state.item.names.en[0]} for pets. A vet should decide.`;
  } else {
    reason = cap(v.reason);
  }
  $('verdict-reason').textContent = reason;

  // Call buttons first when urgent
  renderCalls(v.level);

  // Numbers (dose only)
  const numbers = $('numbers-block');
  numbers.hidden = v.kind !== 'dose';
  $('open-math').hidden = v.kind !== 'dose';
  if (v.kind !== 'dose') $('live-amount-wrap').hidden = true;
  if (v.kind === 'dose') {
    $('verdict-math').textContent = v.math.text;
    $('verdict-band-text').textContent = bandText(v);
    renderDose(v);
    if (!live) setupLive();
  }

  // Culprits (unknown path)
  const culprits = $('culprits-block');
  culprits.hidden = state.path !== 'unknown';
  if (state.path === 'unknown') {
    const rows = v.culprits.map((c) => {
        const item = data.toxins.find((t) => t.id === c.ids?.[0]);
        const e = item?.species?.[state.species];
        const why = e?.signs || (e?.risk === 'no-data' ? 'No reliable data for this animal — a vet should decide.' : '');
        const body = el('span', { class: 'row-body' }, [
          el('span', { class: 'row-title', text: c.label }),
          why ? el('span', { class: 'culprit-why', text: cap(why) }) : null,
        ]);
        const photo = itemPhoto(item);
        const thumb = photo ? el('img', { class: 'row-thumb', src: photo, alt: '', width: 40, height: 40 }) : null;
        return el('li', {}, item
          ? el('button', { class: 'row', type: 'button', onclick: () => { freshInput(); pickItem(item); } }, [thumb, body, icon('i-chev-r', 'icon chev')])
          : el('div', { class: 'row' }, [thumb, body]));
      });
    const more = rows.length > 5
      ? el('li', {}, el('button', { class: 'row row--more', type: 'button', onclick: (e) => { $('culprits').replaceChildren(...rows); } }, el('span', { class: 'row-body' }, el('span', { class: 'row-title', text: `Show all ${rows.length}` }))))
      : null;
    $('culprits').replaceChildren(...rows.slice(0, 5), more);
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
    $('verdict-onset').textContent = v.onset && v.kind !== 'no-data' ? `Timing: ${lowerFirst(v.onset)}` : '';
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
    itemName: state.path === 'unknown' ? null : itemName(state.item) + (state.option?.noDose ? ` (${state.option.noDose})` : quantitiesText(state.quantities) ? ` (${quantitiesText(state.quantities)})` : ''),
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
    const whole = Number.isInteger(current);
    amt.min = String(whole ? Math.min(1, current) : Math.min(0.1, current));
    amt.max = String(Math.max(ceiling, Math.ceil(current * 2)));
    amt.step = whole && current >= 1 ? '1' : 'any';
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
  const a = Math.round(num($('live-amount').value) * 100) / 100;
  $('live-amount-out').textContent = m.kind === 'count' ? `${a} ${m.noun}${a > 1 ? 's' : ''}` : `${a} ${m.noun}`;
  const w = Number($('live-weight').value);
  $('live-weight-out').textContent = w < 1 ? `${Math.round(w * 1000)} g` : `${Math.round(w * 10) / 10} kg`;
}

$('live-amount').addEventListener('input', () => {
  const k = measure().kind;
  const a = Math.round(num($('live-amount').value) * 100) / 100;
  if (state.amount) state.amount = k === 'count' ? { count: a } : k === 'ml' ? { ml: a } : { grams: a };
  updateLiveOutputs();
  renderVerdict({ live: true });
});
$('live-weight').addEventListener('input', () => {
  state.weightKg = num($('live-weight').value);
  updateLiveOutputs();
  renderVerdict({ live: true });
});

/* ---------- Summary actions ---------- */

$('summary-copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('summary').textContent); toast('Copied — paste it in a message or read it on the phone'); }
  catch { toast('Select the text and copy it'); }
});
$('summary-share').addEventListener('click', async () => {
  try { await navigator.share({ title: 'For the vet', text: $('summary').textContent }); } catch { /* cancelled */ }
});

$('open-math').addEventListener('click', () => openSheet($('sheet-math')));
$('open-note').addEventListener('click', () => openSheet($('sheet-note')));

$('restart').addEventListener('click', () => {
  const species = state.species;
  Object.assign(state, freshState(), { species });
  closeAllSheets();
  navStack.length = 0;
  for (const r of document.querySelectorAll('input[name="when"]')) r.checked = r.value === 'just now';
  $('change-input').value = '';
  $('change-suggestions').replaceChildren();
  try { window.history.replaceState(null, ''); } catch { /* sandboxed */ }
  $('type-input').value = '';
  $('suggestions').replaceChildren();
  selectTab(null);
  startStatus('');
  show('start', { push: false });
});

/* ---------- Emergency help ---------- */

function contactsFor(country) {
  const c = data.contacts || FALLBACK_CONTACTS;
  return [...(c.poisonCentres || []), ...(c.onDutyVetFrance || [])]
    .filter((x) => [].concat(x.country || []).includes(country))
    .filter((x) => x.id !== '3115'); // not officially confirmed (data/SOURCES.md) — never show an unverified number
}
const callable = (list) => list.filter((x) => x.tel);
const shortName = (c) => c.short || String(c.name).split(' – ')[0].split(' (')[0];

function telHref(c) {
  return `tel:${String(c.tel || c.phone).replace(/[^+\d]/g, '')}`;
}

// Urgent: black call buttons. Today: the same lines in a lighter style. Watch: none.
function renderCalls(level) {
  const call = $('call-now');
  call.hidden = level === 'watch';
  call.classList.toggle('calls--light', level === 'vet-today');
  if (level !== 'watch') call.replaceChildren(...callable(contactsFor(state.country)).slice(0, 2).map((c) => callButton(c)));
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
      if (c.tel) body.append(el('span', { class: 'contact-num', text: c.phone }));
      return el('li', {}, c.tel
        ? el('a', { class: 'row', href: telHref(c), 'aria-label': `Call ${shortName(c)}, ${c.phone}` }, [body, el('span', { class: 'call-round' }, icon('i-phone'))])
        : el('div', { class: 'row row--note' }, body));
    })
  );
}

$('help-open').addEventListener('click', () => { renderContacts(); openSheet($('help')); });
document.querySelectorAll('input[name="country"]').forEach((r) => r.addEventListener('change', () => {
  state.country = r.value;
  renderContacts();
  if (!$('call-now').hidden) renderCalls($('verdict-band').dataset.level);
}));

/* ---------- boot ---------- */

async function boot() {
  try {
    const [toxins, signs, contacts] = await Promise.all(
      ['toxins', 'signs', 'contacts'].map((n) => fetch(`data/${n}.json`).then((r) => { if (!r.ok) throw new Error(n); return r.json(); }))
    );
    data.toxins = Array.isArray(toxins) ? toxins : toxins.items || [];
    data.signs = signs;
    data.contacts = contacts;
  } catch {
    startStatus('Swallowed could not load its veterinary data. Check your connection and reload.', true);
  }
}

boot();
wakeServer();
if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {}));
}
