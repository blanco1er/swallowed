// Speech input — spec.md > Speech input
// Wraps the browser's speech recognition (Safari and Chrome). Where it doesn't
// work, the caller falls back to the keyboard's own dictation.
// On iPhone the API is exposed but silently never starts inside other apps' browsers
// (Instagram, TikTok, Discord…), Chrome/Firefox for iOS and Home Screen apps
// (WebKit bugs 225298 and 239816), so those are treated as unsupported, and a
// start that never happens is caught by a timer instead of hanging on "Listening…".

import { LANG } from './i18n.js';

const Recognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
const ua = navigator.userAgent;
const isIOS = /iP(hone|ad|od)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const inApp = /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Bytedance|Snapchat|LinkedInApp|Discord|Line\//i.test(ua);
const otherIOSBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
const standalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;

function failedBefore() {
  try { return sessionStorage.getItem('speech-broken') === '1'; } catch { return false; }
}
function markBroken() {
  try { sessionStorage.setItem('speech-broken', '1'); } catch { /* private mode */ }
}

export const speechSupported = Boolean(Recognition) && !failedBefore() && !(isIOS && (inApp || otherIOSBrowser || standalone));

// listen({ onWords(text, final), onEnd(text), onError(code) }) → stop()
export function listen({ onWords, onEnd, onError }) {
  const rec = new Recognition();
  rec.lang = LANG === 'fr' ? 'fr-FR' : 'en-US';
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  let finalText = '';
  let lastInterim = '';
  let started = false;
  let ended = false;
  const finish = (fn) => {
    if (ended) return;
    ended = true;
    clearTimeout(startTimer);
    clearTimeout(maxTimer);
    fn();
  };
  // 8 s leaves time for the two permission prompts on first use.
  const startTimer = setTimeout(() => {
    if (started) return;
    try { rec.abort(); } catch { /* not started */ }
    markBroken();
    finish(() => onError?.('no-start'));
  }, 8000);
  const maxTimer = setTimeout(() => { try { rec.stop(); } catch { /* already stopped */ } }, 15000);
  rec.onstart = () => { started = true; };
  rec.onaudiostart = () => { started = true; };
  rec.onresult = (event) => {
    started = true;
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i];
      if (r.isFinal) finalText += r[0].transcript;
      else interim += r[0].transcript;
    }
    lastInterim = interim;
    onWords?.((finalText + ' ' + interim).trim(), !interim);
  };
  rec.onerror = (event) => {
    if (event.error === 'service-not-allowed') markBroken();
    finish(() => onError?.(event.error || 'error'));
  };
  // Keep the last words heard if Safari never marks a result as final.
  rec.onend = () => finish(() => onEnd?.((finalText || lastInterim).trim()));
  try { rec.start(); } catch { finish(() => onError?.('start-failed')); }
  return () => {
    try { rec.stop(); } catch { /* already stopped */ }
  };
}
