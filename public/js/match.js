// Item catalogue and matcher — spec.md > Item catalogue and matcher
// Matches typed or spoken words to curated items by their names and aliases
// (English and French), without any AI.

export function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9%.,\s]/g, ' ') // "sugar-free" and "sugar free" are the same words
    .replace(/(?<!\d)[.,]|[.,](?!\d)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// "raisins" → "raisin", "lilies" → "lily", "leaves" → "leaf"
function singular(word) {
  if (word.length <= 3) return word;
  if (/ies$/.test(word)) return word.slice(0, -3) + 'y';
  if (/ves$/.test(word)) return word.slice(0, -3) + 'f';
  if (/(ch|sh|x|ss)es$/.test(word)) return word.slice(0, -2);
  if (/s$/.test(word) && !/ss$/.test(word)) return word.slice(0, -1);
  return word;
}

const SPECIES_WORDS = {
  dog: ['dog', 'puppy', 'chien', 'chiot'],
  cat: ['cat', 'kitten', 'kitty', 'chat', 'chaton'],
  rabbit: ['rabbit', 'bunny', 'lapin'],
  rodent: ['guinea pig', 'hamster', 'rat', 'mouse', 'gerbil', 'cochon d inde', 'souris'],
  bird: ['bird', 'parrot', 'budgie', 'parakeet', 'cockatiel', 'canary', 'oiseau', 'perruche', 'perroquet'],
};

// Words that say who ate it, how, or how much — never what was eaten.
const STOP = new Set([
  'my', 'our', 'your', 'his', 'her', 'their', 'the', 'a', 'an', 'some', 'of', 'ate', 'eat', 'eaten', 'eating', 'chewed', 'swallowed',
  'has', 'have', 'had', 'just', 'he', 'she', 'it', 'they', 'i', 'we', 'think', 'maybe', 'probably', 'about', 'around', 'and', 'or',
  'from', 'on', 'in', 'into', 'with', 'got', 'get', 'into', 'food', 'whole', 'half', 'bit', 'bite', 'piece', 'lot', 'few', 'little',
  'mg', 'g', 'gram', 'ml', 'kg', 'x', 'tablet', 'pill', 'caplet', 'capsule',
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'mon', 'ma', 'mes', 'le', 'la', 'les', 'du', 'de', 'des', 'un', 'une', 'mange', 'avale', 'il', 'elle', 'je', 'pense',
  ...Object.values(SPECIES_WORDS).flat().flatMap((w) => w.split(' ')).map(singular),
]);

const words = (text) => normalize(text).split(' ').filter(Boolean).map(singular);
const isNumber = (w) => /^\d/.test(w) || /^\d+(mg|g|ml|kg)$/.test(w);

function scoreName(queryWords, name) {
  const nameWords = words(name);
  if (!nameWords.length) return 0;
  const q = queryWords.join(' ');
  const n = nameWords.join(' ');
  if (q === n) return 1;
  if (` ${q} `.includes(` ${n} `)) return 0.92; // the full name appears in the sentence
  const hits = nameWords.filter((w) => queryWords.includes(w)).length;
  if (!hits) {
    // prefix match while typing ("choco" → chocolate)
    const last = queryWords[queryWords.length - 1];
    if (last && last.length >= 3 && nameWords.some((w) => w.startsWith(last))) return 0.2;
    return 0;
  }
  return 0.5 * (hits / nameWords.length) + 0.3 * (hits / Math.max(queryWords.length, 1));
}

// Returns up to `limit` candidates: [{ item, score, matchedName }]
export function matchItems(catalogue, text, limit = 5) {
  const queryWords = words(text).filter((w) => !STOP.has(w) && !isNumber(w));
  if (!queryWords.length) return [];
  const results = [];
  for (const item of catalogue) {
    const names = [...(item.names?.en || []), ...(item.names?.fr || [])];
    let best = 0;
    let matchedName = names[0];
    for (const name of names) {
      const s = scoreName(queryWords, name);
      if (s > best) { best = s; matchedName = name; }
    }
    if (best > 0) results.push({ item, score: best, matchedName });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

// "my rabbit ate some avocado" → "rabbit"; "my cat ate dog food" → "cat" (the animal named first).
export function detectSpecies(text) {
  const t = ` ${normalize(text)} `;
  let found = null;
  for (const [species, list] of Object.entries(SPECIES_WORDS)) {
    for (const w of list) {
      const hits = [...t.matchAll(new RegExp(` ${w}s? (?!(?:poison|bait|food|treats?|toys?|killer|traps?|chews?|medicine|flea|wormer)\\b)`, 'g'))];
      const at = hits.length ? hits[0].index : Infinity;
      if (at < (found?.at ?? Infinity)) found = { species, at };
    }
  }
  return found?.species || null;
}

const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, a: 1, an: 1, half: 0.5 };

// Amounts said or typed in the sentence: "3 ibuprofen 200mg", "ibuprofen 400", "two tablets", "50 g of chocolate".
// A bare number of 50 or more next to a medicine is its strength in mg; a small one is a count.
export function parseAmounts(text) {
  const t = normalize(text).replace(/(\d),(\d)/g, '$1.$2');
  const out = {};
  const num = (v) => NUMBER_WORDS[v] ?? Number(v);
  const N = '(\\d+(?:\\.\\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|an?|half)';
  let m;
  if ((m = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*mg\\b`).exec(t))) out.tabletMg = Number(m[1]);
  if ((m = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*ml\\b`).exec(t))) out.ml = Number(m[1]);
  if ((m = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:g|grams?)\\b`).exec(t))) out.grams = Number(m[1]);
  if ((m = new RegExp(`\\b${N}\\s*(?:x\\s*)?(?:tablets?|pills?|caplets?|capsules?|pieces?|cigarettes?|pods?|grapes?|raisins?|sticks?)\\b`).exec(t))) out.count = num(m[1]);
  // bare numbers not followed by a unit
  for (const b of t.matchAll(/\b(\d+(?:\.\d+)?)\b(?!\s*(?:mg|ml|g|grams?|kg|lbs?|pounds?|tablets?|pills?|caplets?|capsules?|pieces?|cigarettes?|pods?|minutes?|min|hours?|h)\b)/g)) {
    const n = Number(b[1]);
    if (n >= 50 && !out.tabletMg) out.tabletMg = n;
    else if (n > 0 && n < 50 && out.count == null) out.count = n;
  }
  return out;
}
