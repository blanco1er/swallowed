---
doc: spec
status: approved
---

# Swallowed — Technical Spec

## How This Works, In Plain Language
Swallowed is one web page and a small server.

- **The page** (what you see on the phone) asks what the pet ate, which animal, and how much, then shows the verdict. It holds the **verdict rules**: a list of known poisonings, each with its veterinary source, and a small calculator that turns "100 g of dark chocolate, 8 kg dog" into a dose and picks the matching verdict. Because the rules live in the page, typing a known item still works without any AI and even with a poor connection.
- **The server** does one thing the page can't do safely: it sends a photo to Google's Gemini model, which only answers "what is this, and what quantities are printed on it?" — never "is it dangerous?". The key that pays for Gemini stays on the server, never in the page.
- **The data** is plain files written from veterinary sources (Merck Veterinary Manual, ASPCA, Pet Poison Helpline, VCA…), with the source link next to every number.

Why this shape: the dangerous part (the verdict) is simple, checkable code reading cited data; the AI is limited to recognising things, where it is good and where the owner confirms its answer.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. The owner opens the page → it loads the item list and the rules from `/data/*.json`.
2. **Take a photo** → the page shrinks the photo (max 1280 px, JPEG) → `POST /api/identify` → the server asks Gemini, giving it the list of known items → Gemini returns the best match from that list (or "none"), its confidence and the quantities it can read → the page shows **Confirm**.
   **Type it** → the page matches the words against item names and aliases locally; if nothing matches, it asks `POST /api/identify` with the text only → **Confirm**.
   **Say it** → the browser's speech recognition turns speech into text → the words are shown → same as Type it (an animal word like "rabbit" pre-selects the species).
3. **That's right** → **Your pet** (species, weight, when; amount only if the item's rule is dose-based).
4. The verdict calculator runs in the page → **Verdict**. Moving the amount or weight re-runs it instantly.
5. **Vet summary** is built from the same answers → Copy (clipboard) / Share (the phone's share sheet). Emergency numbers come from `/data/contacts.json`.
6. **I don't know what it ate** → species and weight → **Signs** → the signs rules pick the urgency → **Verdict** with the species' culprit checklist.

## Stack
- **Node.js 22+** (local: v24) with **Express 5** — the same small server setup as the learner's earlier project this week; serves the page and one API route. https://expressjs.com/
- **Plain HTML, CSS and JavaScript modules** in the browser — no framework, no build step; easy to read for a beginner and fast to load in an emergency.
- **Gemini API, model `gemini-3.8-flash`** for photo and free-text identification, called with plain `fetch` (no SDK) and a JSON schema for the answer. Free tier, image input included (checked on the official pricing page, 22 Oct 2026: https://ai.google.dev/gemini-api/docs/pricing). Docs: https://ai.google.dev/gemini-api/docs/structured-output, https://ai.google.dev/gemini-api/docs/image-understanding
- **Web Speech API** (`SpeechRecognition` / `webkitSpeechRecognition`) for Say it — built into Safari and Chrome; where missing, the keyboard's own dictation microphone is the fallback. https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
- **Shared design system tokens** (`design-system/tokens.css`, approved by the learner on 18 Oct 2026).
- **node:test** for tests (built into Node).
Agent recommendations accepted by delegation (see `prd.md > Product Decisions`).

## Where It Runs and How Someone Tries It
- Needs Node 22+ and, for photos, a Gemini API key in `.env` (`GEMINI_API_KEY=`; get one at https://aistudio.google.com/apikey). Without a key the app starts in **demo mode**: typing and speaking known items work; photos return a clearly labelled "photo recognition needs a key" message.
- Start: `npm install` then `npm start` → open http://localhost:3000. On a phone on the same Wi-Fi: `http://<computer-ip>:3000` (camera and microphone need HTTPS on phones, so phone tests use the hosted version).
- Hosted demo: the app is published on **GitHub Pages** (https://blanco1er.github.io/swallowed/, from `.github/workflows/pages.yml`) so it opens instantly at any hour; recognition runs on a **Render** free web service deployed from `render.yaml`, with the key pasted by the learner in Render's environment settings. Render's free service sleeps when idle: the app wakes it as soon as it opens, a keep-warm ping runs at judging hours, and while it wakes the app says so and offers "Type it instead". No billing set up.
- Demo video: recorded on the hosted version in a phone-sized browser window, with real packaging photos taken by us.

## Look and Feel
PRD ref: `prd.md > Look and Feel`.
- Revised twice during the build at the learner's request. Final look: mock-up **A**, chosen by the learner from three directions (A photo-led, B strong brand colour, C studio objects) after he said the previous version still looked AI-made. White canvas, **real photos** (Unsplash License, credited in data/SOURCES.md — never generated images), **General Sans** titles (chosen by the learner from a five-font board, loaded from Fontshare), black rounded-rectangle main buttons, light grey tiles, the red Emergency button always at the top right.
- Start: the "Swallowed" wordmark, a full-width photo of a dog and a cat, "What did your pet eat?", a black "Take a photo" button (the phone offers camera or library), "Type it" and "Say it" tiles that open their panel underneath ("Say it" starts listening at once), a sideways row of photo thumbnails for the most common poisonings, and "I don't know what it ate".
- Your pet: round photos of the five animals (selected = black ring), the weight as a giant number with a kg/lb switch.
- Verdict: a thumbnail (the owner's own photo, else the item's photo, else the animal's) with "Item · Animal, weight", then one card tinted in the verdict colour holding the verdict in words, the dose as a giant number and a meter against the sourced thresholds; call buttons right under it when urgent, then the source, how it was worked out (moving live with the sliders), what to watch for and the note for the vet.
- Behaves like an installed iPhone app, not a web page (after the learner's review: "ressemble et se comporte comme un site web"): a fixed floating bar (glass back button, the screen title in a glass pill once scrolled, Emergency folding into a red phone button), screens that slide in and out with iOS timing and follow the phone's back gesture, each screen scrolling on its own with its main button pinned at the bottom, bottom sheets with a grabber (Emergency, How we worked it out, Note for the vet, See all), a calm full-screen state while a photo is recognised (with "Type it instead"), no zoom, no text selection, no page bounce, installable to the Home Screen (manifest, icon, "Add to Home Screen" tip on iPhone) and usable offline for typed items (service worker).
- Light theme only: one luminous, consistent look.

## Components

### Item catalogue and matcher
Loads `data/toxins.json`; matches typed or spoken words to items by names and aliases (case- and accent-insensitive, plural-tolerant, word overlap), returning up to 5 candidates. Also detects an animal word in a sentence.
PRD ref: `prd.md > Showing what was eaten`, `prd.md > Confirming the item`.

### Photo and text identification (server)
`POST /api/identify` with `{ image?: dataURL, text?: string }`. Sends Gemini the image or text plus the catalogue (id + English names), asks for JSON: `{ matchId | null, label, confidence 0–1, kind (packaging|plant|pill|food|other), quantities: { netWeightG?, cocoaPercent?, tabletMg?, count? } }`. Rejects images over 4 MB; per-IP limit of 40 identifications a day; 20-second timeout. Never asks Gemini for toxicity.
PRD ref: `prd.md > Showing what was eaten`.

### Speech input
Wraps the browser speech recognition (English); shows interim words; stops after a pause; falls back to a note pointing to keyboard dictation.
PRD ref: `prd.md > Showing what was eaten` (Say it).

### Verdict calculator
Pure function `verdict(item, species, weightKg, amount)` → `{ level: 'vet-now'|'vet-today'|'watch', reason, math?, signs, onset, source }`. Rules: `dose` items compute compound mg = amount × content, dose = mg ÷ kg, then the highest threshold reached; `any` items return their fixed verdict; `low` items return watch + signs; `no-data` never returns watch. Missing weight or content → the cautious band.
PRD ref: `prd.md > The verdict`.

### Signs triage
`signsVerdict(species, signIds)` → highest urgency among chosen signs, raised to at least `vet-today` for rabbit, rodent and bird when the data says so; returns the species' culprit checklist.
PRD ref: `prd.md > I don't know what it ate`.

### Vet summary and contacts
Builds the plain-text summary; Copy via `navigator.clipboard`, Share via `navigator.share` when available. Contacts from `data/contacts.json`, country picked from the browser language (FR → France, else US), switchable.
PRD ref: `prd.md > Vet summary and emergency numbers`.

### Screens and flow (page)
One page, five views (Start, Confirm, Your pet, Signs, Verdict) plus the emergency sheet; a small state object drives them; Back returns one step; views animate in only on change. The last weight per species is remembered in `localStorage`.
PRD ref: `prd.md > Screens and Layout`, `prd.md > States and Boundaries`.

## Data Model
- `data/toxins.json` — items: `id`, `names {en[], fr[]}`, `category`, `compound`, optional `content {unit, value, range, source}`, and `species.{dog,cat,rabbit,rodent,bird}` = `{ risk: dose|any|low|no-data, thresholds[{from, unit, verdict, signs}], below, verdict, signs, source, quote }`, `onset`, `notes`.
- `data/signs.json` — `signs[{id, label, urgency, source}]`, `culprits.{species}[ids]`, small-species rule.
- `data/contacts.json` — emergency services per country with phone, fee, URL, `checked` date.
- In the browser only: the current answers (item, quantities, species, weight, when, amount, signs). Nothing is sent anywhere except the photo or words to `/api/identify`. The server keeps nothing (only an in-memory per-IP counter).

## File Structure
```
pet-ate-what/
├── server.js               # Express: static files, /data, POST /api/identify, rate limit
├── src/
│   └── identify.js         # Gemini call: prompt, JSON schema, timeout, demo mode
├── data/                   # Curated veterinary data (sources in SOURCES.md)
│   ├── toxins.json
│   ├── signs.json
│   ├── contacts.json
│   └── SOURCES.md
├── public/
│   ├── index.html          # the page and its five views
│   ├── styles.css          # layout and components on the design tokens
│   ├── design-system/tokens.css
│   ├── icon.svg
│   └── js/
│       ├── app.js          # flow, views, rendering
│       ├── match.js        # catalogue matcher (shared with tests)
│       ├── verdict.js      # verdict calculator + signs triage (shared with tests)
│       ├── summary.js      # vet summary text
│       └── speech.js       # Say it
├── test/                   # node:test — matcher, verdicts, signs, identify (mocked)
├── render.yaml             # Render free web service
├── .env.example            # GEMINI_API_KEY=, PORT=
├── README.md
├── LICENSE                 # MIT
└── devpost/                # Devpost learning workspace
```

## External Services and Dependencies
- **Gemini API** — `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent`, header `x-goog-api-key`, body with `contents[].parts` (`text`, `inline_data {mime_type, data}`) and `generationConfig { responseMimeType: "application/json", responseJsonSchema }`. Free tier; limits are per project and shown in AI Studio; free-tier content may be used by Google to improve its products — the page says so next to the photo button. Key: `GEMINI_API_KEY`, pasted by the learner.
- **Render** — free web service from GitHub (https://render.com/docs/free). No billing.
- **npm**: `express` ^5 only.

## Important Failure Modes
- **Gemini wrong or unsure** → the owner always confirms; low confidence shows the 3 closest items to pick from instead of a single answer.
- **Gemini unavailable, quota reached or no key** → "Photo recognition is unavailable right now — type or say it instead"; typed and spoken known items keep working.
- **Item or species not covered** → "We have no reliable data — call your vet", vet summary still built; never "Watch at home".
- **No speech recognition in the browser** → note to use the keyboard's microphone.

## What Was Simplified and Why
- **Curated list of ~40 common poisonings** instead of any product in the world — every verdict must be sourced; the fuller version would need a product/ingredient database (deferred: barcode lookup).
- **Fixed amount choices from the package** instead of estimating the amount from the photo — more honest; the owner knows better than a photo.
- **US and France numbers only** — the judges and the learner's country.
- **English interface only** — the judges read English.

## Decisions and Open Issues
- Verdict rules in the page, AI only on the server for recognition — so the AI never decides a dose, the key stays private, and typing works offline. (Agent recommendation, accepted by delegation.)
- Gemini 3.8 Flash on the free tier — free with image input; tradeoff: Google may use free-tier inputs, disclosed in the app. (Agent recommendation, accepted by delegation.)
- Plain JavaScript, no framework — fits a beginner reading the code later, and the learner's earlier project. (Agent recommendation, accepted by delegation.)
- Learner uncertainty discussed: none raised during this spec — the learner delegated the technical choices on 22 Oct.
- Open: exact coverage per species depends on what the veterinary sources support (`data/SOURCES.md`); checked during the build. Speech recognition on iPhone Safari to be verified on the hosted version.
