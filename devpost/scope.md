---
doc: scope
status: draft
---

# Swallowed (working name)

When a pet has just eaten something it shouldn't, snap the packaging and know in seconds how serious it is for *this* animal, and what to do right now.

## The Unique Kernel
It answers the moment **after** it happened, for any companion animal: "my pet already ate this — is it dangerous at this amount, for this species and this weight, and what do I do now?" A photo of the packaging gives the product and the amount; a hand-written table of veterinary thresholds gives the verdict, with the calculation and its source shown. The AI only reads the label; it never invents a dose or a diagnosis.

Existing tools answer a different question — "can my dog eat this?" (ToxiPets, https://toxipets.com/, a prevention lookup with safe/toxic/caution labels) — or cover one substance for dogs only (online chocolate calculators that ask for grams and chocolate type a panicking owner doesn't know).

## Who It's For
A pet owner — dog, cat, rabbit, guinea pig or hamster, bird — who has just found a chewed wrapper, a missing pill or a nibbled plant, often in the evening when their vet is closed. Today they search online and get contradictory answers, call an emergency vet or a paid poison hotline, or wait and hope. The learner's requirement: it must work for all companion animals, not just dogs.

## The Core Loop
1. Snap (or type) what was eaten.
2. Say which animal: species and weight.
3. Say roughly how much: all of it, half, a bite.
4. Get one of three verdicts — **call a vet now**, **call your vet today**, or **watch at home** — with the reason, the calculation when a dose applies, and the veterinary source.
5. Get a short summary to read to the vet on the phone (what, how much, when, the animal's weight) and the emergency numbers.

People come back the next time something disappears from the coffee table; it lives on the home screen like a first-aid kit.

## Inspiration & Identity
Calm in a panic: one clear verdict first, details after. It must look designed and trustworthy, not like a generic AI app. Follows the shared design system (Challenges-automne-2026/design-system/DESIGN.md): iOS-style, light and dark, colour used only for meaning.

## Why This Matters to the Learner
He wants an app that "va vraiment dépanner, faciliter la vie" and chose this direction from the research on 21 Oct 2026, insisting it serve every companion animal. Real scale behind it: the ASPCA Animal Poison Control Center handled more than 451,000 cases in 2024 (https://www.aspca.org/about-us/press-releases/aspca-sees-increase-number-calls-poison-control-center-2024-including-rise).

## What "Working" Looks Like
On a phone, the owner photographs a real dark-chocolate wrapper, picks "Dog, 8 kg", slides to "the whole bar" (100 g), and within seconds sees **Call a vet now**, with the line "≈ 69 mg of theobromine per kg — seizures are reported from 60 mg/kg (Merck Veterinary Manual)" and a ready-to-read vet summary. Sliding back to "a bite" changes the verdict live, with the new number. Then the same flow for a cat and a lily shows **Call a vet now — any amount of lily is dangerous for cats**, with no calculation, because none is safe.

The "oh, that's cool" beat: the same photo gives different verdicts for different animals and weights, and every number shows where it comes from.

## The POC Boundary
- Photo or typed entry; the AI reads the product name and the quantities printed on the package (net weight, cocoa %, strength of a tablet).
- A curated table of the most common pet poisonings (foods, plants, human medicines, household items) for dogs, cats, rabbits, small rodents and birds, each entry with its source.
- Dose calculation only where veterinary sources give thresholds; otherwise "dangerous at any amount" or "no data for this species → call a vet".
- Three verdicts, the vet summary, emergency numbers for the US and France.
- Nothing stored: no account, photos not kept.

## Later
- Barcode lookup of ingredients (Open Food Facts) for products not in the table.
- More species (reptiles, ferrets), more languages.
- A symptom timeline to share with the vet, sending the summary by message.

## Explicitly Cut
- Home treatment instructions (e.g. making the animal vomit) — risky without a vet; the app always routes to a professional.
- AI-generated doses or diagnoses — safety: every threshold comes from a cited veterinary source.
- Accounts and photo history — not needed to prove the kernel, and keeps private data out.
