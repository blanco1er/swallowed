// Item catalogue and matcher — spec.md > Item catalogue and matcher
// Matches typed or spoken words to curated items by their names and aliases
// (English and French), without any AI.

export function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9%\s-]/g, ' ')
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

const STOP = new Set(['my', 'the', 'a', 'an', 'some', 'of', 'ate', 'eaten', 'has', 'have', 'just', 'he', 'she', 'it',
  'dog', 'cat', 'rabbit', 'bird', 'hamster', 'guinea', 'pig', 'rat', 'mouse', 'parrot', 'budgie', 'mon', 'ma', 'le', 'la',
  'les', 'du', 'de', 'des', 'un', 'une', 'a', 'mange', 'chien', 'chat', 'lapin', 'oiseau', 'piece', 'bit', 'bite', 'whole', 'half']);

const words = (text) => normalize(text).split(' ').filter(Boolean).map(singular);

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
    if (last && last.length >= 3 && nameWords.some((w) => w.startsWith(last))) return 0.4;
    return 0;
  }
  return 0.5 * (hits / nameWords.length) + 0.3 * (hits / Math.max(queryWords.length, 1));
}

// Returns up to `limit` candidates: [{ item, score, matchedName }]
export function matchItems(catalogue, text, limit = 5) {
  const queryWords = words(text).filter((w) => !STOP.has(w));
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

const SPECIES_WORDS = {
  dog: ['dog', 'puppy', 'chien', 'chiot'],
  cat: ['cat', 'kitten', 'chat', 'chaton'],
  rabbit: ['rabbit', 'bunny', 'lapin'],
  rodent: ['guinea pig', 'hamster', 'rat', 'mouse', 'gerbil', 'cochon d inde', 'souris'],
  bird: ['bird', 'parrot', 'budgie', 'parakeet', 'cockatiel', 'canary', 'oiseau', 'perruche', 'perroquet'],
};

// "my rabbit ate some avocado" → "rabbit"
export function detectSpecies(text) {
  const t = ` ${normalize(text)} `;
  for (const [species, list] of Object.entries(SPECIES_WORDS)) {
    if (list.some((w) => t.includes(` ${w} `) || t.includes(` ${w}s `))) return species;
  }
  return null;
}
