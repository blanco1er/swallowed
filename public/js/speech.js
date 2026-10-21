// Speech input — spec.md > Speech input
// Wraps the browser's speech recognition (Safari and Chrome). Where it doesn't
// exist, the caller falls back to the keyboard's own dictation.

const Recognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;

export const speechSupported = Boolean(Recognition);

// listen({ onWords(text, final), onEnd(finalText), onError(code) }) → stop()
export function listen({ onWords, onEnd, onError }) {
  const rec = new Recognition();
  rec.lang = 'en-US';
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  let finalText = '';
  rec.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i];
      if (r.isFinal) finalText += r[0].transcript;
      else interim += r[0].transcript;
    }
    onWords?.((finalText + ' ' + interim).trim(), !interim);
  };
  rec.onerror = (event) => onError?.(event.error || 'error');
  rec.onend = () => onEnd?.(finalText.trim());
  rec.start();
  return () => {
    try { rec.stop(); } catch { /* already stopped */ }
  };
}
