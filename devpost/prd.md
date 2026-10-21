---
doc: prd
status: approved
---

# Swallowed — Product Requirements

Swallowed tells a pet owner, in under a minute, how serious it is that their dog, cat, rabbit, small rodent or bird just ate something — and what to do now — even when they don't know what it ate.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

## The Core Journey
Source: `scope.md > The Core Loop`.

1. The owner opens Swallowed on their phone. The first screen asks **"What did your pet eat?"** with three ways in — **Take a photo**, **Type it**, **Say it** — and a fourth, **I don't know what it ate**. Emergency numbers are one tap away from every screen.
2. **Show it.** They photograph the packaging or the thing itself (a plant, a pill, a food), type a few words, or say the name out loud.
3. **Confirm.** Swallowed shows what it recognised — e.g. "Dark chocolate, 70% cocoa · 100 g bar" with the photo — and the owner taps **That's right** or picks the correct item from a short list.
4. **The animal.** They pick the species (dog, cat, rabbit, guinea pig or hamster, bird), enter the weight, and say when it happened.
5. **How much.** When the amount matters, they choose a bite, a quarter, half or all of it (or enter grams or tablets).
6. **The verdict.** One of three answers, large and first: **Call a vet now**, **Call your vet today**, or **Watch at home** — with the reason, the calculation when a dose applies, the signs to watch, and the veterinary source. Changing the amount updates the verdict instantly.
7. **Get help.** A ready-to-read **Vet summary** (what, how much, when, species and weight, signs) they can copy or share, and the emergency numbers for their country.

The "I don't know what it ate" path replaces steps 2–5 with: the animal, the signs they see and when they started. The verdict comes from the signs, plus a checklist of the usual culprits for that species to look for around the home, and the same vet summary.

## Screens and Layout
One page that moves forward step by step, phone first, with a Back control at each step.

- **Start** — the question, the three ways in as large buttons, "I don't know what it ate" below them, a one-line privacy note, and a "Need help now?" link to the emergency numbers.
- **Confirm** — the photo or the words, what was recognised, the quantities read from the package, **That's right** / **Change it**.
- **Your pet** — species, weight (kg or lb), when it happened; and, when a dose applies, how much was eaten.
- **Verdict** — the verdict first, then why, the calculation, the signs to watch, the source, the vet summary and the call buttons; the amount control stays on this screen.
- **Signs** (unknown path only) — a checklist of visible signs and when they started.
- **Emergency numbers** — a sheet reachable from every screen.

## Look and Feel
Source: `scope.md > Inspiration & Identity`.
- Calm in a panic: one clear verdict, large and first; details after. Short sentences, no jargon, no blame.
- The shared design system the learner approved on 18 Oct 2026 for all his challenge apps (`Challenges-automne-2026/design-system/DESIGN.md`): iOS-style, light and dark following the phone, system font, generous touch targets.
- One accent colour for actions, a calm teal (care, not alarm). Red, orange and green are reserved for the three verdicts, always with an icon and words, never colour alone.
- Simple line drawings for the five kinds of animal; no emoji, no stock illustrations, no gradients.
- Avoid: generic AI-app styling, chat bubbles, "AI magic" wording.

## Features and Behavior

### Showing what was eaten
Source: `scope.md > The Core Loop` (step 1, the learner's three ways in).
- As a panicking owner, I want to show what my pet ate in whatever way is fastest, so I don't lose time.
  - [ ] **Take a photo** opens the camera on a phone (photo library on a computer).
  - [ ] **Type it** accepts free words in English ("raisins", "ibuprofen 400", "lily") and suggests matches as they type.
  - [ ] **Say it** listens and turns the sentence into text ("my rabbit ate some avocado"); the words appear on screen before going further.
  - [ ] A photo of a packaging, a plant, a pill or a food is identified within about 10 seconds, with the printed quantities when visible (net weight, cocoa %, tablet strength).

### Confirming the item
- As an owner, I want to check what the app understood, because a wrong identification would give a wrong answer.
  - [ ] The recognised item is shown with its quantities and **That's right** / **Change it**; nothing is judged before the owner confirms.
  - [ ] **Change it** offers the closest items from the list and a search.
  - [ ] If nothing reliable is recognised, the app says so plainly and offers to retake the photo or type it.
  - [ ] An item that isn't in Swallowed's list leads to "We have no reliable data for this one — call your vet", with the vet summary.

### The animal and the amount
- [ ] Five kinds of animal: dog, cat, rabbit, guinea pig or hamster, bird. Weight in kg or lb, with a typical weight shown as a hint for each species.
- [ ] When it happened: just now, about 30 minutes, about 1 hour, 2 hours or more, not sure.
- [ ] The amount question appears only when the dose changes the answer; choices are expressed from the package (e.g. a bite ≈ 5 g, half the bar = 50 g), with an exact field.

### The verdict
Source: `scope.md > The Unique Kernel`, `scope.md > What "Working" Looks Like`.
- As an owner, I want one clear answer and the reason, so I know whether to drive to a vet now.
  - [ ] Exactly one of **Call a vet now** / **Call your vet today** / **Watch at home**, large, with icon and colour.
  - [ ] For dose-based items, the calculation in plain words, e.g. "100 g × 5.5 mg = 550 mg of theobromine ÷ 8 kg ≈ 69 mg/kg — seizures are reported from 60 mg/kg."
  - [ ] Items dangerous at any amount say so ("Any amount of lily is dangerous for cats") with no calculation.
  - [ ] Species without reliable data say so and never show "Watch at home".
  - [ ] Every verdict shows its veterinary source as a link.
  - [ ] The signs to watch for and how soon they can appear.
  - [ ] Changing the amount or the weight updates the verdict and the numbers immediately.
  - [ ] "Watch at home" always lists the signs that should make the owner call anyway.

### I don't know what it ate
Source: `scope.md > Why This Matters to the Learner` (the learner's cat), `scope.md > The Core Loop`.
- As an owner whose pet is unwell for no visible reason, I want to know how urgent it is and what to look for.
  - [ ] A checklist of visible signs in plain words (vomiting, tremors, drooling, wobbling, not peeing, trouble breathing…) with when they started.
  - [ ] Serious signs lead to **Call a vet now**; milder signs to **Call your vet today**; any sign in a rabbit, rodent or bird is at least **Call your vet today** where the sources support it.
  - [ ] A checklist of the most common dangers for that species to look for around the home, each tappable to see why.
  - [ ] The vet summary lists the signs and when they started.

### Vet summary and emergency numbers
- [ ] A short summary in plain sentences: animal, weight, what and how much (or "unknown"), when, signs, and the verdict shown — with **Copy** and **Share**.
- [ ] Emergency numbers for the US and France, with any fee stated by the service, chosen from the phone's language and switchable; a tap starts the call on a phone.

## States and Boundaries
- **First use** — the Start screen; nothing to set up, no account.
- **Identifying** — a short progress line ("Reading the label…") and a shape of the next screen; the owner can cancel and type instead.
- **Blurry or unknown photo** — plain message, retake or type.
- **Not in the list / no data for this species** — honest message, verdict "call your vet", vet summary.
- **Camera or microphone not available or refused** — the other ways in remain; a short note explains how to allow access.
- **No connection or identification service down** — typing still works and the verdict still works for listed items; photos and voice say they need a connection.
- **Call a vet now** — the call buttons move to the top of the verdict.
- **What persists** — nothing: no account, photos are not kept; the weight may be remembered on the device for next time.
- **Boundary** — Swallowed never tells the owner to treat the animal at home and always says it does not replace a vet.

## Product Decisions
- Every companion animal, not only dogs — the learner: "sa doit pas être centré sur un seul animal de compagnie".
- Photo of the thing itself, typed text or the name said out loud, not only the packaging — the learner, so it works however the owner can describe it in a panic.
- An "I don't know what it ate" path — from the learner's own story: his cat died two years ago after eating something he never identified.
- The learner asked the agent on 22 Oct to complete the plan, the build and the submission preparation without further questions, and delegated the approval of this PRD, the spec and the build checklist ("il faut faire tout ça jusqu'à la soumission, je veux plus que tu me poses des questions"). The following are therefore **agent recommendations made on his behalf**, recorded as such:
  - Start screen asks "What did your pet eat?" before the species, because in a panic the item is what the owner has in hand.
  - Name "Swallowed" (the working name from the approved scope).
  - Teal accent; verdict colours reserved for the three verdicts.
  - English interface for the judges; US and French emergency numbers.

## What We're Building
- The four-step flow (show → confirm → your pet → verdict) and the unknown path.
- Photo, typed and spoken input, with confirmation.
- A curated list of the most common pet poisonings for the five kinds of animal, every verdict tied to a cited veterinary source.
- Live verdict and calculation, vet summary with copy/share, emergency numbers.
- The states above, phone and computer layouts, light and dark.

## Deferred From the POC
- Barcode lookup of any product's ingredients — needs a product database and ingredient-level rules.
- French interface — the judges read English; numbers already cover France.
- Remembering pets by name (more than the last weight) — would need profiles.

## Possible Later Enhancements
- More species (reptiles, ferrets) as reliable sources are added.
- A symptom timeline to send to the vet.
- Sending the summary straight to the vet clinic.

## Non-Goals
- Diagnosis or treatment, including home remedies or making the animal vomit — only a vet can do that safely.
- Doses or verdicts produced by AI — every number comes from the cited sources.
- Accounts, history, photo storage — not needed, and keeps private data out.

## Open Questions
- Which items and species thresholds the sources support with confidence — answered by the curated data (`data/SOURCES.md`), can be finalised during the build.
- Voice input relies on the browser's speech recognition; if unavailable on a device, the keyboard's dictation is the fallback — confirmed in the spec.
