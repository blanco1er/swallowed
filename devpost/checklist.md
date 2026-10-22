---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast — the learner asked the agent on 22 Oct to build through to submission without further questions and delegated approval of this order; hands-on checkpoints are kept: one early look after slice 2 and the final kick-the-tires review.

## Slices

- [x] **1. Type what your pet ate and get a sourced verdict for any of the five animals**
  Becomes usable: A running app where typing an item ("dark chocolate", "lily", "ibuprofen"), confirming it, choosing dog, cat, rabbit, guinea pig/hamster or bird with a weight and an amount shows one of the three verdicts with its reason, calculation and veterinary source; moving the amount or weight updates the verdict instantly.
  Why now: The verdict on cited data is the unique kernel; it must be right before anything is built around it, and typing needs no AI so it proves the whole path end to end.
  PRD ref: `prd.md > The Core Journey` (steps 1, 3–6), `prd.md > Confirming the item`, `prd.md > The animal and the amount`, `prd.md > The verdict`
  Spec ref: `spec.md > Item catalogue and matcher`, `spec.md > Verdict calculator`, `spec.md > Screens and flow (page)`, `spec.md > Data Model`, `spec.md > File Structure`, `spec.md > Look and Feel`
  Build: Scaffold package.json (Node ≥22, Express 5), server.js serving public/ and data/; public/js/match.js, public/js/verdict.js, public/js/app.js with the Start (Type it), Confirm, Your pet and Verdict views on the design tokens; load data/toxins.json; unit tests for the matcher and the calculator.
  Verify (mechanical): `npm test` passes, including: dark chocolate 100 g for a dog of 8 kg → vet-now with ≈ 69 mg/kg; one 5 g bite → a lower verdict; lily for a cat → vet-now with no calculation; an item with no data for a species never returns watch; "raisins" and "chocolat noir" both match. `npm start`, then headless browser at 393 px and 1280 px completes the typed chocolate journey with no console errors and no horizontal overflow.
  Learner check: Open the app, type "dark chocolate", pick a dog of 8 kg and "the whole bar", then slide to "a bite" and watch the verdict change.
  Commit: `Type an item and get a sourced verdict`

- [x] **2. Show it with a photo or say it out loud**
  Becomes usable: Taking a photo of a packaging, a plant, a pill or a food — or saying "my rabbit ate some avocado" — leads to the confirmation screen with what was recognised and the printed quantities, then the same verdict.
  Why now: Photo recognition by Gemini is the biggest technical risk (key, model, accuracy); proving it right after the kernel leaves time to adapt.
  PRD ref: `prd.md > Showing what was eaten`, `prd.md > Confirming the item`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Photo and text identification (server)`, `spec.md > Speech input`, `spec.md > External Services and Dependencies`, `spec.md > Important Failure Modes`
  Build: src/identify.js (Gemini generateContent with JSON schema, timeout, demo mode without a key), POST /api/identify with size and per-IP limits, client-side photo resize, Take a photo and Say it on the Start view, low-confidence candidate list, text fallback to /api/identify; tests with a mocked Gemini response.
  Verify (mechanical): `npm test` passes (identify parses a mocked response, rejects oversize images, demo mode answers clearly). With the key: real photos of a chocolate wrapper and of a lily return the right item ids, and the chocolate's net weight and cocoa % are read; headless run of the photo journey has no console errors.
  Learner check: On your phone, photograph a chocolate bar (or a plant) and say "my rabbit ate some avocado" — check what the app recognised before it judges.
  Commit: `Recognise items from a photo or the voice`

- [x] **3. "I don't know what it ate", the vet summary and the emergency numbers**
  Becomes usable: Choosing "I don't know what it ate", the animal and the visible signs gives the urgency and the species' checklist of usual culprits; every verdict offers a vet summary to copy or share and the US or French emergency numbers.
  Why now: The learner's own story; it completes the core journey and the "get help" end of every verdict.
  PRD ref: `prd.md > I don't know what it ate`, `prd.md > Vet summary and emergency numbers`
  Spec ref: `spec.md > Signs triage`, `spec.md > Vet summary and contacts`, `spec.md > Data Model`
  Build: signs view and signsVerdict in public/js/verdict.js; culprit checklist; public/js/summary.js; Copy/Share; emergency sheet from data/contacts.json reachable from every view; tests.
  Verify (mechanical): `npm test` passes: a cat with drooling and wobbling → vet-now with the cat culprit list; any sign in a rabbit → at least vet-today; the summary contains species, weight, item or "unknown", time and signs. Headless run of the unknown path at 393 px with no console errors.
  Learner check: Choose "I don't know what it ate", a cat, tick drooling and wobbling, and read the summary you would read to a vet.
  Commit: `Unknown item path, vet summary and emergency numbers`

- [ ] **4. A calm, finished experience on any screen, online for the judges**
  Becomes usable: Every state from the PRD (identifying, blurry photo, not in the list, no data for a species, camera or microphone refused, offline) has a clear message; phone and computer layouts in light and dark pass the design checklist; the app runs on a public URL.
  Why now: With the whole journey working, the finish and the hosted version decide Design and Presentation.
  PRD ref: `prd.md > States and Boundaries`, `prd.md > Look and Feel`, `prd.md > Screens and Layout`
  Spec ref: `spec.md > Look and Feel`, `spec.md > Important Failure Modes`, `spec.md > Where It Runs and How Someone Tries It`
  Build: state messages, motion with reduced-motion support, final visual pass on the design system, privacy note, README, MIT LICENSE, .env.example, render.yaml.
  Verify (mechanical): `npm test` passes; headless screenshots at 375, 393 and 1280 px, light and dark, for Start, Confirm, Verdict (each level), Signs and the emergency sheet show no overflow and no console errors; the universal UX audit reports no high or medium issue; the hosted URL answers 200 and completes the typed journey.
  Learner check: On your phone, open the public link, try the chocolate, the lily and "I don't know what it ate", and say whether it feels calm, clear and finished.
  Commit: `Polish states, design and hosting`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after slice 2 (typed, photo and voice journeys), on the learner's phone
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence:
Route and stops:
Edit outcome:
Reflection:
Activity mode:

## Revisions
- Dose calculation exists for dogs only — the veterinary sources publish numeric thresholds for dogs; for cats, rabbits, rodents and birds the curated data gives "any amount" or "no data → call a vet" (data/SOURCES.md). The demo's dose moment therefore uses a dog; the lily stays the cat case.
- Product forms instead of one content value per item (e.g. ibuprofen 200/400 mg, dark vs baking chocolate, onion powder judged without math) — the curated data needed it; very dark chocolate (70 %+) uses the baking-chocolate value as the data recommends.
- The French "3115" on-call number is not shown — the data could not confirm it on an official page.
- Slice 3 was built before slice 2 — the Gemini key needed to verify real photos was not yet available; slice 2 resumes as soon as it is.
- Culprit and contact labels cleaned for display (internal research notes moved to `note` fields; short names, hours and fees added to data/contacts.json).
- Repository published at https://github.com/blanco1er/swallowed and hosted at https://swallowed.onrender.com (Render free web service from render.yaml) before slice 2, so the phone checks can use HTTPS for the camera and microphone; the Gemini key is added in Render's Environment settings by the learner.
- Visual redesign after the learner's review on his phone ("ton app fait trop IA"): moved from iOS grouped lists and the system font to the premium language he approved for his earlier app Pont — white canvas, soft halo, giant General Sans titles (chosen by the learner from a five-font board), black capsule buttons, Photo/Type/Say tabs, one-tap shortcuts, giant weight input, and a dose meter on the verdict. Verdict logic and data unchanged; spec.md > Look and Feel updated.
- Slice 2 verified with the learner's Gemini key: a photo of a 70% dark-chocolate wrapper → chocolate-dark, 100 g and 70% read, confidence 0.99, end to end to "Call a vet now"; text "my rabbit ate some avocado" → avocado; "lily" on the hosted version → lilies-true. A real lily photo and speech on an iPhone are left to the learner's hands-on check (a browser test cannot speak or take a real plant photo). Added one automatic retry when Gemini's free tier is briefly overloaded (a page test once hung on a slow answer).
- Second redesign after the learner's phone review ("Ça fait tjr app générer par IA"): three full mock-ups (photo-led, brand colour, studio objects) were made and the learner picked **A**. Rebuilt to it with real Unsplash photos (dog and cat, the six most common items, the five animals; credited in data/SOURCES.md), no gradient halo and no emoji-style logo, a tinted verdict card with the giant dose and meter, black call buttons with the number on a second line. The tabs became "Take a photo" + "Type it" / "Say it". Contrast raised to 4.5:1 for the Emergency button and small text after the bug audit. Verdict logic and data unchanged.
- App-grade pass after the learner's review ("encore plein de choses à améliorer et stabiliser", "se comporte comme un site web", reference: a native app's fine finish). Three review agents (design, bugs, iPhone/network) reported; fixed: app shell with slide transitions, history-aware back, pinned actions and bottom sheets; glass bar; grouped lists; "See all" sheet; install manifest, icon and offline cache; voice that can no longer hang (in-app browsers, Home Screen apps) with clear messages; recognition with a time limit, a wake-up message and "Type it instead"; a keep-warm ping and /healthz for Render's free plan; per-visitor limit using Cloudflare's address plus a daily cap; JSON errors only. Critical dose fixes: "ibuprofen 400" now uses the 400 mg tablet, "cocoa powder" the cocoa value, several forms with no clue ask the owner instead of defaulting; amounts in the sentence ("3 tablets", "50 g") are filled in; a dose just below a threshold never reads as the threshold; a decimal comma is accepted for the weight; an old photo or amount never carries over to the next item; sliders change only their own value and the whole verdict follows. 28 unit tests, 13 browser scenarios, audit clean.
- Hosting split after the learner saw Render's "waking up" page on his iPhone: the app (page, photos, data) is now published on GitHub Pages at https://blanco1er.github.io/swallowed/ — instant, never asleep, works offline once opened; only recognition (/api/identify) stays on the Render free service, which the app wakes as soon as it opens and which shows "Waking up…" with "Type it instead" if still asleep. All paths made relative; CORS limited to the Pages origin.
- Simplified after the learner's phone review ("trop de parcours trop complexe… le résultat je comprends rien… pas facile à utiliser ni à comprendre"): the pet is chosen once on the start screen and remembered; one search bar with a microphone replaces the Type/Say tiles; no separate "Is this it?" step unless a photo is uncertain; the weight and amount are asked only when they change the answer (dose items) and "When" is gone — grapes for a dog is now two taps. The result reads as an instruction: a verdict, one plain sentence ("Even a small amount of grapes can poison a dog."), "What to do now" in three numbered steps with the call buttons, a short list of signs, and the numbers moved into "How we worked it out". Sources show real names.
- After the learner's review ("on dirait c'est pas réel… à quel moment l'app sait qu'il y a un problème ?", "pourquoi on ne peut pas changer de langue", "l'analyse prend énormément de temps"): the result now shows "How Swallowed decided" — what was recognised and how (photo, typed, said, chosen), where it was checked (the named veterinary source) and the rule that applied (no safe amount known, or the estimated dose against the levels where problems start). A FR / EN switch (English by default, at the learner's request; remembered) translates the whole app, including the 396 veterinary texts (data/fr.json), the vet note and the voice input. Recognition moved to Render's always-on Starter instance (~$7/month, approved by the learner on 22 Oct) — no more one-minute wake-up; the keep-warm ping was removed.
