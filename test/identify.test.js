import { test } from 'node:test';
import assert from 'node:assert/strict';
import { identify, cleanResult, parseDataUrl, IdentifyError } from '../src/identify.js';

const catalogue = [
  { id: 'chocolate-dark', names: { en: ['dark chocolate'] } },
  { id: 'lily', names: { en: ['lily'] } },
];
const tinyJpeg = 'data:image/jpeg;base64,' + Buffer.from('fake-jpeg').toString('base64');

function fakeGemini(answer, status = 200) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init: JSON.parse(init.body), headers: init.headers });
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(answer) }] } }] }), { status });
  };
  return { fetchImpl, calls };
}

test('a photo is sent with the catalogue and the answer is cleaned', async () => {
  const { fetchImpl, calls } = fakeGemini({
    matchId: 'chocolate-dark', alternatives: ['lily', 'unknown-id'], label: '70% dark chocolate bar', confidence: 0.93, kind: 'packaging',
    quantities: { netWeightG: 100, cocoaPercent: 70, tabletMg: null },
  });
  const r = await identify({ image: tinyJpeg }, catalogue, { apiKey: 'test', fetchImpl });
  assert.equal(r.matchId, 'chocolate-dark');
  assert.deepEqual(r.alternatives, ['lily']);
  assert.equal(r.quantities.netWeightG, 100);
  assert.equal(calls[0].headers['x-goog-api-key'], 'test');
  assert.match(calls[0].url, /gemini-3\.8-flash:generateContent$/);
  const parts = calls[0].init.contents[0].parts;
  assert.ok(parts.some((p) => p.inline_data?.mime_type === 'image/jpeg'));
  assert.match(parts[0].text, /Do not judge toxicity/);
});

test('ids not in our list are dropped, never invented', () => {
  const r = cleanResult({ matchId: 'made-up', label: 'x', confidence: 3, kind: 'food', quantities: { netWeightG: -5 } }, catalogue);
  assert.equal(r.matchId, null);
  assert.equal(r.confidence, 1);
  assert.equal(r.quantities.netWeightG, null);
});

test('no key → a clear demo-mode error', async () => {
  await assert.rejects(identify({ text: 'grapes' }, catalogue, { apiKey: '' }), (e) => e instanceof IdentifyError && e.code === 'no-key');
});

test('bad or oversized images are rejected before any call', () => {
  assert.throws(() => parseDataUrl('data:text/plain;base64,AAAA'), { code: 'bad-image' });
  const big = 'data:image/jpeg;base64,' + 'A'.repeat(6 * 1024 * 1024);
  assert.throws(() => parseDataUrl(big), { code: 'too-large' });
});

test('quota errors are reported as such', async () => {
  const { fetchImpl } = fakeGemini({}, 429);
  await assert.rejects(identify({ text: 'grapes' }, catalogue, { apiKey: 'k', fetchImpl }), { code: 'quota' });
});

test('one retry when Gemini is briefly overloaded', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    if (calls === 1) return new Response('overloaded', { status: 503 });
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ matchId: 'lily', label: 'lily', confidence: 0.9, kind: 'plant' }) }] } }] }), { status: 200 });
  };
  const r = await identify({ text: 'lily' }, catalogue, { apiKey: 'k', fetchImpl });
  assert.equal(calls, 2);
  assert.equal(r.matchId, 'lily');
});
