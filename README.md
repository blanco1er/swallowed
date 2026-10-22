# Swallowed

**Try it:** https://blanco1er.github.io/swallowed/ (on an iPhone: Share › Add to Home Screen)

Your dog, cat, rabbit, guinea pig or hamster, or bird just ate something. Show it (a photo of the packaging, the plant, the pill or the food), type it, or say it — Swallowed tells you how serious it is **for this animal, at this weight and this amount**, and what to do now:

- **Call a vet now**, **Call your vet today** or **Watch at home**, with the reason;
- the calculation when a dose applies (e.g. `100 g × 5.5 mg/g = 550 mg of theobromine ÷ 8 kg ≈ 68.8 mg/kg`), updated live when you change the amount or the weight;
- the signs to watch for and the veterinary source for every verdict;
- a short summary to read to the vet, and the emergency numbers (US and France).

When nobody knows what the animal ate, **"I don't know what it ate"** turns the visible signs into an urgency and lists the most common dangers for that species to look for around the home.

> Swallowed is a triage aid built on published veterinary references. It never replaces a vet and never gives home-treatment advice.

## How it works

- **Verdicts come only from curated data** in [`data/`](data/): 48 common pet poisonings × 5 kinds of animal, each verdict with its source and a short quote (Merck Veterinary Manual, ASPCA, Pet Poison Helpline, VCA, peer-reviewed papers). Where the sources have no reliable data for a species, Swallowed says so and tells you to call a vet — it never shows "Watch at home" without data. See [`data/SOURCES.md`](data/SOURCES.md).
- **The AI only recognises things.** A photo or free text is sent to Google Gemini (`gemini-3.8-flash`), which picks the matching item from our list and reads printed quantities (net weight, cocoa %, mg per tablet). The owner confirms before any verdict. Gemini is never asked whether something is dangerous.
- **Typing and speaking work without the AI** for known items: names and aliases (English and French) are matched in the browser, and the verdict is computed in the browser.

| File | Role |
|---|---|
| `server.js` | Express server: the page, `/data`, `POST /api/identify` (size and per-IP limits) |
| `src/identify.js` | Gemini call: prompt, JSON schema, timeout, demo mode |
| `public/js/verdict.js` | Verdict calculator and signs triage (pure functions, tested) |
| `public/js/match.js` | Matching typed or spoken words to items and species |
| `public/js/app.js` | The screens and the flow |
| `data/*.json` | Curated veterinary data |

## Run it

Requires Node.js 22 or newer.

```bash
npm install
cp .env.example .env   # then paste your Gemini key after GEMINI_API_KEY=
npm start
```

Open http://localhost:3000. Without a key the app runs in demo mode (typing and speaking known items work; photos explain that recognition is not set up).

```bash
npm test
```

## Deploy

`render.yaml` describes a free Render web service. Create it from this repository (Blueprint), then paste `GEMINI_API_KEY` in the service's Environment settings.

## Privacy

No account, nothing stored on the server. Photos and words are sent to Google Gemini only to recognise the item; on Gemini's free tier Google may use them to improve its products. The last weight per species is remembered in your browser only.

## Planning documents

Built with the Devpost Learn skill pack: scope, product requirements, technical spec and build checklist are in [`devpost/`](devpost/).

## License

[MIT](LICENSE)
