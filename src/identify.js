// Photo and text identification — spec.md > Photo and text identification (server)
// Gemini only answers "what is this, and what quantities are printed on it?",
// choosing from our curated list. It is never asked whether anything is dangerous.

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const ENDPOINT = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
const TIMEOUT_MS = 15_000;
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export class IdentifyError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const SCHEMA = {
  type: 'object',
  properties: {
    matchId: { type: ['string', 'null'], description: 'id from the list, or null if none fits' },
    alternatives: { type: 'array', items: { type: 'string' }, description: 'up to 3 other plausible ids from the list' },
    label: { type: 'string', description: 'short plain name of what is shown or described, e.g. "Lindt 70% dark chocolate bar"' },
    confidence: { type: 'number', description: '0 to 1' },
    kind: { type: 'string', enum: ['packaging', 'plant', 'pill', 'food', 'other', 'text'] },
    quantities: {
      type: 'object',
      properties: {
        netWeightG: { type: ['number', 'null'], description: 'net weight in grams printed on the pack' },
        cocoaPercent: { type: ['number', 'null'] },
        tabletMg: { type: ['number', 'null'], description: 'strength per tablet in mg printed on the pack' },
        count: { type: ['number', 'null'], description: 'number of tablets/pieces in the pack if printed' },
      },
    },
  },
  required: ['matchId', 'label', 'confidence', 'kind'],
};

function instructions(catalogue) {
  const list = catalogue.map((t) => `${t.id}: ${(t.names?.en || []).slice(0, 4).join(', ')}`).join('\n');
  return [
    'You identify what a pet may have eaten, for a pet-safety app. Answer only with JSON.',
    'Pick the single best matching id from this list, or null if nothing in the list fits. Do not judge toxicity or give advice.',
    'Read quantities only if they are printed or clearly stated (net weight in grams, cocoa %, mg per tablet, number of tablets). Never estimate them.',
    'If the image is blurry or not something a pet could eat, use matchId null and a low confidence.',
    '',
    'List (id: names):',
    list,
  ].join('\n');
}

export function parseDataUrl(dataUrl) {
  const m = /^data:(image\/(?:jpeg|png|webp|heic|heif));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!m) throw new IdentifyError('bad-image', 'That photo could not be read. Try another one.');
  const bytes = Math.floor((m[2].length * 3) / 4);
  if (bytes > MAX_IMAGE_BYTES) throw new IdentifyError('too-large', 'That photo is too large. Try again.', 413);
  return { mimeType: m[1], data: m[2] };
}

// Keep only ids that exist in our list; clamp numbers.
export function cleanResult(raw, catalogue) {
  const ids = new Set(catalogue.map((t) => t.id));
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
  const q = raw?.quantities || {};
  return {
    matchId: ids.has(raw?.matchId) ? raw.matchId : null,
    alternatives: (raw?.alternatives || []).filter((id) => ids.has(id) && id !== raw?.matchId).slice(0, 3),
    label: typeof raw?.label === 'string' ? raw.label.slice(0, 120) : '',
    confidence: Math.max(0, Math.min(1, Number(raw?.confidence) || 0)),
    kind: raw?.kind || 'other',
    quantities: {
      netWeightG: num(q.netWeightG),
      cocoaPercent: num(q.cocoaPercent) && q.cocoaPercent <= 100 ? q.cocoaPercent : null,
      tabletMg: num(q.tabletMg),
      count: num(q.count),
    },
  };
}

export async function identify({ image, text }, catalogue, { apiKey = process.env.GEMINI_API_KEY, fetchImpl = fetch } = {}) {
  if (!image && !text) throw new IdentifyError('empty', 'Show, type or say what your pet ate.');
  if (!apiKey) {
    throw new IdentifyError('no-key', 'Photo recognition is not set up on this server yet — type or say it instead.', 503);
  }
  const parts = [{ text: instructions(catalogue) }];
  if (image) {
    const { mimeType, data } = parseDataUrl(image);
    parts.push({ inline_data: { mime_type: mimeType, data } });
    parts.push({ text: 'What is in this photo?' });
  } else {
    parts.push({ text: `The owner wrote or said: "${String(text).slice(0, 300)}"` });
  }
  const body = JSON.stringify({
    contents: [{ role: 'user', parts }],
    generationConfig: { responseMimeType: 'application/json', responseJsonSchema: SCHEMA, temperature: 0 },
  });
  // The free tier is sometimes briefly overloaded: one quick retry on a timeout or a 5xx.
  let res;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      res = await fetchImpl(ENDPOINT(MODEL), {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.status < 500 || attempt === 2) break;
    } catch (err) {
      if (attempt === 2) {
        const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError';
        throw new IdentifyError(timedOut ? 'timeout' : 'network', 'Recognition is not answering right now — type it instead.', 502);
      }
    }
    await new Promise((r) => setTimeout(r, 700));
  }
  if (res.status === 429) throw new IdentifyError('quota', 'Too many photos right now — type it instead, or try again in a minute.', 429);
  if (!res.ok) throw new IdentifyError('upstream', 'Recognition is unavailable right now — type it instead.', 502);
  const answer = await res.json().catch(() => null);
  const textOut = answer?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  let raw;
  try { raw = JSON.parse(textOut); } catch { throw new IdentifyError('bad-answer', "We couldn't recognise it. Try again or type it.", 502); }
  return cleanResult(raw, catalogue);
}
