# Swallowed — data sources

Checked: 2026-10-22. Files: `toxins.json` (48 entries), `signs.json`, `contacts.json`.

## How to read the data (deviations from the original schema)

- `content` is an **array** of product forms (`form`, `unit`, `value`, optional `range`, `note`, `source`). Where a range exists, `value` is already the upper (cautious) figure. `verified: false` = figure seen only in search results or a retailer listing.
- Dose blocks have `basis`: `compound` (dose = amount × content ÷ kg) or `product` (grams of the food itself ÷ kg).
- `noDoseMath` (on a species block): forms for which no sourced conversion exists (onion powder, coffee grounds, play dough…) → use its verdict, no calculation.
- `derived` on a threshold: computed from two sourced numbers, not published as such (only garlic in dogs).
- `no-data` rule: `vet-now` when dogs/cats suffer organ damage or death; `vet-today` when effects are digestive only. Rabbits and rodents cannot vomit; prey species hide illness.
- Owner estimates are rough: use the upper end of the estimate.
- Quotes are verbatim excerpts (<15 words) captured through an automated page reader; spot-check before release.

## Sources

### Merck Veterinary Manual
- Chocolate toxicosis in animals — https://www.merckvetmanual.com/toxicology/food-hazards/chocolate-toxicosis-in-animals
- Xylitol toxicosis in dogs — https://www.merckvetmanual.com/toxicology/food-hazards/xylitol-toxicosis-in-dogs
- Grape, raisin and tamarind toxicosis in dogs — https://www.merckvetmanual.com/toxicology/food-hazards/grape-raisin-and-tamarind-vitis-spp-tamarindus-spp-toxicosis-in-dogs *(consulted; cited in notes only)*
- Garlic and onion (Allium) toxicosis — https://www.merckvetmanual.com/toxicology/food-hazards/garlic-and-onion-allium-spp-toxicosis-in-animals
- Macadamia nut toxicosis in dogs — https://www.merckvetmanual.com/toxicology/food-hazards/macadamia-nut-toxicosis-in-dogs
- Avocado toxicosis in animals — https://www.merckvetmanual.com/toxicology/food-hazards/avocado-persea-spp-toxicosis-in-animals
- Bread dough toxicosis — https://www.merckvetmanual.com/toxicology/food-hazards/bread-dough-toxicosis-in-animals
- Salt toxicosis — https://www.merckvetmanual.com/toxicology/salt-toxicosis/salt-toxicosis-in-animals
- Toxicoses from alcohols — https://www.merckvetmanual.com/toxicology/toxicoses-from-household-hazards/toxicoses-from-alcohols-in-animals
- Analgesics toxicity (human drugs) — https://www.merckvetmanual.com/toxicology/toxicities-from-human-drugs/analgesics-toxicity
- Human antidepressants, anxiolytics, sleep aids — https://www.merckvetmanual.com/toxicology/toxicoses-from-human-antidepressants-anxiolytics-and-sleep-aids *(consulted; cited in notes only)*
- Amphetamines and ADHD drugs — https://www.merckvetmanual.com/toxicology/toxicoses-from-human-recreational-drugs/toxicoses-in-animals-from-amphetamines-and-adhd-drugs-in-animals
- Cardiovascular medications — https://www.merckvetmanual.com/toxicology/toxicoses-from-cardiovascular-medications/toxicoses-in-animals-from-cardiovascular-medications
- Human multivitamins and supplements — https://www.merckvetmanual.com/toxicology/toxicoses-from-human-vitamins-minerals-and-dietary-supplements/toxicoses-in-animals-from-human-multivitamins-and-supplements
- Cholecalciferol (vitamin D3) poisoning — https://www.merckvetmanual.com/toxicology/rodenticide-poisoning/cholecalciferol-vitamin-d3-poisoning-in-animals
- Human topical agents — https://www.merckvetmanual.com/toxicology/toxicosis-from-human-topical-agents/toxicosis-in-animals-from-human-topical-agents
- THC toxicosis in dogs and cats — https://www.merckvetmanual.com/toxicology/toxicoses-from-human-recreational-drugs/toxicosis-in-dogs-and-cats-from-tetrahydrocannabinol-thc *(consulted; cited in notes only)*
- Houseplants and ornamentals toxic to animals — https://www.merckvetmanual.com/toxicology/poisonous-plants/houseplants-and-ornamentals-toxic-to-animals
- Plants poisonous to animals — https://www.merckvetmanual.com/special-pet-topics/poisoning/plants-poisonous-to-animals
- Table: plants and foods harmful to rabbits — https://www.merckvetmanual.com/multimedia/table/plants-and-foods-that-are-harmful-to-rabbits *(consulted; cited in notes only)*
- Ethylene glycol toxicosis — https://www.merckvetmanual.com/toxicology/ethylene-glycol-toxicosis/ethylene-glycol-toxicosis-in-animals
- Anticoagulant rodenticide poisoning — https://www.merckvetmanual.com/toxicology/rodenticide-poisoning/anticoagulant-rodenticide-poisoning-in-animals
- Bromethalin poisoning — https://www.merckvetmanual.com/toxicology/rodenticide-poisoning/bromethalin-poisoning-in-animals
- Phosphide rodenticide poisoning — https://www.merckvetmanual.com/toxicology/rodenticide-poisoning/phosphide-zinc-magnesium-aluminum-poisoning-in-animals
- Ectoparasiticides used in small animals — https://www.merckvetmanual.com/pharmacology/ectoparasiticides/ectoparasiticides-used-in-small-animals
- Fipronil toxicosis — https://www.merckvetmanual.com/toxicology/insecticide-and-acaricide-organic-toxicity/phenylpyrazole-fipronil-toxicosis-in-animals *(consulted; cited in notes only)*
- Metaldehyde poisoning — https://www.merckvetmanual.com/toxicology/metaldehyde-poisoning/metaldehyde-poisoning-in-animals
- Organophosphate toxicosis — https://www.merckvetmanual.com/toxicology/insecticide-and-acaricide-organic-toxicity/organophosphate-toxicosis-in-animals *(consulted; cited in notes only)*
- Essential oils — https://www.merckvetmanual.com/toxicology/toxicoses-from-household-hazards/toxicoses-from-essential-oils-in-animals
- Household cleaners and personal care products — https://www.merckvetmanual.com/toxicology/toxicoses-from-household-hazards/toxicoses-from-household-cleaners-and-personal-care-products-in-animals
- Household hazards — https://www.merckvetmanual.com/special-pet-topics/poisoning/household-hazards
- Toxicoses of pet birds — https://www.merckvetmanual.com/exotic-and-laboratory-animals/pet-birds/toxicoses-of-pet-birds
- Zinc toxicosis — https://www.merckvetmanual.com/toxicology/zinc-toxicosis/zinc-toxicosis-in-animals *(consulted; cited in notes only)*
- Lead poisoning — https://www.merckvetmanual.com/toxicology/lead-poisoning/lead-poisoning-in-animals
- Food hazards — https://www.merckvetmanual.com/special-pet-topics/poisoning/food-hazards *(consulted; cited in notes only)*
- Nutritional diseases of pet birds — https://www.merckvetmanual.com/exotic-and-laboratory-animals/pet-birds/nutritional-diseases-of-pet-birds *(consulted; cited in notes only)*
- Illness of rabbits — https://www.merckvetmanual.com/all-other-pets/rabbits/illness-of-rabbits
- Overview of rodents — https://www.merckvetmanual.com/exotic-and-laboratory-animals/rodents/overview-of-rodents
- Chinchillas — https://www.merckvetmanual.com/exotic-and-laboratory-animals/rodents/chinchillas
- Illness in pet birds — https://www.merckvetmanual.com/bird-owners/routine-care-and-safety-of-birds/illness-in-pet-birds
- Disorders of guinea pigs — https://www.merckvetmanual.com/all-other-pets/guinea-pigs/disorders-and-diseases-of-guinea-pigs
- Disorders of hamsters — https://www.merckvetmanual.com/all-other-pets/hamsters/disorders-and-diseases-of-hamsters
- Disorders of rats — https://www.merckvetmanual.com/all-other-pets/rats/disorders-and-diseases-of-rats *(consulted; cited in notes only)*
- What to do in a dog or cat emergency — https://www.merckvetmanual.com/special-pet-topics/emergencies/what-to-do-in-a-dog-or-cat-emergency
- Table: when to see a veterinarian — https://www.merckvetmanual.com/multimedia/table/when-to-see-a-veterinarian
- Stomach and intestine disorders in dogs — https://www.merckvetmanual.com/dog-owners/digestive-disorders-of-dogs/disorders-of-the-stomach-and-intestines-in-dogs
- Vomiting in dogs — https://www.merckvetmanual.com/dog-owners/digestive-disorders-of-dogs/vomiting-in-dogs *(consulted; cited in notes only)*

### ASPCA
- The Top 10 Toxins of 2025 — https://www.aspca.org/news/top-10-toxins-2025
- ASPCA Animal Poison Control Center — https://www.aspca.org/pet-care/animal-poison-control
- People foods to avoid feeding your pets — https://www.aspca.org/pet-care/aspca-poison-control/people-foods-avoid-feeding-your-pets
- Rabbit pet parents, beware these common toxins — https://www.aspca.org/news/rabbit-pet-parents-beware-these-common-pet-toxins
- Leah's close call (grapes) — https://www.aspca.org/news/leahs-close-call-handful-grapes-nearly-cost-one-dog-her-life
- Four fall toxins (apple seeds) — https://www.aspca.org/news/pet-parents-beware-these-four-fall-toxins
- Which lilies are toxic to pets — https://www.aspca.org/news/which-lilies-are-toxic-pets *(consulted; cited in notes only)*
- Lily — https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/lily
- Day lily — https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/day-lilies-many-varieties *(consulted; cited in notes only)*
- Sago palm — https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/sago-palm *(consulted; cited in notes only)*
- Oleander — https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/oleander *(consulted; cited in notes only)*
- Daffodil — https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/daffodil
- Tulip — https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/tulip *(consulted; cited in notes only)*
- Pothos — https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/pothos
- Aloe — https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/aloe
- Azalea — https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/azalea
- Yew — https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/yew *(consulted; cited in notes only)*
- Foxglove — https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/foxglove
- Lily of the valley — https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/lily-valley
- Emergency care for your pet — https://www.aspca.org/pet-care/general-pet-care/emergency-care-your-pet
- When to bring your pet to a veterinary hospital — https://www.aspca.org/news/how-do-i-know-if-i-should-bring-my-pet-veterinary-hospital-experts-explain

### Pet Poison Helpline
- home — https://www.petpoisonhelpline.com/
- about — https://www.petpoisonhelpline.com/about/
- Top 10 toxins 2025 (dogs, cats) — https://www.petpoisonhelpline.com/media-releases/top102025/
- Triaging a potentially poisoned pet — https://www.petpoisonhelpline.com/pet-owner-blog/triaging-a-potentially-poisoned-pet-at-home/
- Xylitol gum — https://www.petpoisonhelpline.com/pet-safety-tips/my-dog-just-ate-xylitol-gum-is-xylitol-poisonous-to-dogs/ *(consulted; cited in notes only)*
- Xylitol — https://www.petpoisonhelpline.com/poison/xylitol/ *(consulted; cited in notes only)*
- Onions and garlic — https://www.petpoisonhelpline.com/pet-safety-tips/are-onions-poisons-to-dogs/
- Caffeine poisoning in dogs — https://www.petpoisonhelpline.com/pet-tips/caffeine-poisoning-in-dogs/
- Diet pills / caffeine tablets — https://www.petpoisonhelpline.com/uncategorized/resolutions-to-get-healthier-in-the-new-year-can-lead-to-dangerous-exposures-for-our-pets/
- Coffee beans — https://www.petpoisonhelpline.com/uncategorized/my-dog-ate-a-coffee-bean-will-they-be-okay/ *(consulted; cited in notes only)*
- Bread dough — https://www.petpoisonhelpline.com/poison/bread-dough/
- Salt — https://www.petpoisonhelpline.com/poison/salt/
- Salt and dogs — https://www.petpoisonhelpline.com/pet-tips/should-you-give-salt-to-your-dog/ *(consulted; cited in notes only)*
- Marijuana — https://www.petpoisonhelpline.com/poison/marijuana/
- Antidepressants — https://www.petpoisonhelpline.com/poison/antidepressants/
- Tea tree oil — https://www.petpoisonhelpline.com/poison/tea-tree-oil/
- Antifreeze poisoning — https://www.petpoisonhelpline.com/pet-owner-blog/antifreeze-poisoning
- Batteries — https://petpoisonhelpline.com/pet-safety-tips/are-batteries-poisonous-to-dogs/
- What if my dog ate a battery — https://www.petpoisonhelpline.com/uncategorized/what-if-my-dog-ate-a-battery/
- Mushrooms — https://www.petpoisonhelpline.com/poison/mushrooms/
- Lilies — https://www.petpoisonhelpline.com/poison/lilies/
- Top 11 poisonous plants — https://www.petpoisonhelpline.com/uncategorized/top-11-poisonous-plants/
- Top 10 plants poisonous to pets — https://www.petpoisonhelpline.com/pet-owners/basics/top-10-plants-poisonous-to-pets/
- Toxic plants slides (Brutlag, 2014) — https://www.petpoisonhelpline.com/wp-content/uploads/2014/01/PPH-VPI-Toxic-Plants-April-2014.pdf
- Dangers in the home for rabbits — https://www.petpoisonhelpline.com/uncategorized/dangers-home-rabbit/
- What's poisonous to birds and pocket pets — https://petpoisonhelpline.com/pet-safety-tips/whats-poisonous-to-birds-and-pocket-pets
- Top 5 toxins for companion birds — https://www.petpoisonhelpline.com/pet-safety-tips/top-5-toxins-companion-birds/

### VCA Animal Hospitals
- Caffeine toxicity in pets — https://vcahospitals.com/know-your-pet/caffeine-toxicity-in-pets
- Sago palm poisoning — https://vcahospitals.com/know-your-pet/sago-palm-poisoning
- Plants toxic for birds — https://vcahospitals.com/know-your-pet/plants-toxic-for-birds
- Teflon (PTFE) poisoning in birds — https://vcahospitals.com/arbor/know-your-pet/teflon-polytetrafluoroethylene-poisoning-in-birds
- Conures: feeding — https://vcahospitals.com/know-your-pet/conures-feeding
- Common emergencies in dogs — https://vcahospitals.com/know-your-pet/common-emergencies-in-dogs
- Vomiting in dogs — https://vcahospitals.com/know-your-pet/vomiting-in-dogs
- What to do if your pet eats something toxic — https://vcahospitals.com/shop/articles/what-to-do-if-your-pet-eats-something-toxic *(consulted; cited in notes only)*
- Cyanosis in cats — https://vcahospitals.com/know-your-pet/cyanosis-in-cats *(consulted; cited in notes only)*
- Recognizing signs of illness in cats — https://vcahospitals.com/know-your-pet/recognizing-signs-of-illness-in-cats
- Respiratory disease in birds — https://vcahospitals.com/know-your-pet/respiratory-disease-in-birds
- Recognizing signs of illness in pet birds — https://vcahospitals.com/delaware-valley/know-your-pet/recognizing-the-signs-of-illness-in-pet-birds
- Mushroom toxicity — https://vcahospitals.com/know-your-pet/mushroom-toxicity *(consulted; cited in notes only)*

### Other veterinary, academic and official sources
- US FDA – Lovely lilies and curious cats — https://www.fda.gov/animal-veterinary/animal-health-literacy/lovely-lilies-and-curious-cats-dangerous-combination
- US FDA – Spilling the beans: how much caffeine — https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much
- US FDA – Paws off xylitol — https://www.fda.gov/consumers/consumer-updates/paws-xylitol-its-dangerous-dogs *(consulted; cited in notes only)*
- Kovalkovičová et al., Interdiscip Toxicol 2009 – Some food toxic for pets — https://pmc.ncbi.nlm.nih.gov/articles/PMC2984110/
- Cortinovis & Caloni, Front Vet Sci 2016 – Household food items toxic to dogs and cats — https://pmc.ncbi.nlm.nih.gov/articles/PMC4801869/
- AKC – Dog ate gum — https://www.akc.org/expert-advice/health/dog-accidentally-eats-gum-can-gum-make-my-dog-sick/
- Dunayer (ASPCA APCC), dvm360 2006 – Xylitol in dogs — https://www.dvm360.com/view/new-findings-effects-xylitol-ingestion-dogs
- dvm360 (ASPCA APCC) – Ibuprofen toxicosis — https://dvm360.com/view/toxciology-brief-ibuprofen-toxicosis-dogs-cats-and-ferrets
- dvm360 – Naproxen toxicosis in dogs — https://dvm360.com/view/toxicology-brief-naproxen-toxicosis-dogs
- Gwaltney-Brant, dvm360 2010 – Toxicity of pain medications — https://dvm360.com/view/toxicity-pain-medications-proceedings-0
- Mensching & Volmer, dvm360 2009 – Carprofen toxicosis — https://www.dvm360.com/view/toxicology-brief-managing-acute-carprofen-toxicosis-dogs-and-cats
- dvm360 2004 (ASPCA data) – Medications and pesticides poison birds — https://www.dvm360.com/view/medications-pesticides-continue-poison-birds
- dvm360 / Pet Poison Helpline – Spring toxins: fertilizers — https://dvm360.com/view/spring-toxin-6-fertilizers
- dvm360 2022 – SSRI/SNRI toxicity — https://dvm360.com/view/ssri-snri-toxicity-what-you-need-to-know *(consulted; cited in notes only)*
- PetSmart pharmacy listing – Rimadyl chewables 25/75/100 mg (retailer, search result only) — https://www.petsmart.com/pharmacy/dog/joint-care/rimadyl-carprofen-chewable-tablet-for-dogs---25mg-75mg-100mg---1-30-60-or-180-tablets-5316658.html
- Wismer, Today's Veterinary Practice – Ethanol toxicosis — https://todaysveterinarypractice.com/practical-toxicologyethanol-toxicosis-review/
- Cornell University Hospital for Animals – Small animal toxins — https://www.vet.cornell.edu/hospitals/pharmacy/consumer-clinical-care-guidelines-animals/small-animal-toxins
- Cornell Feline Health Center – Lower urinary tract disease — https://vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/feline-lower-urinary-tract-disease
- Novotny et al., Tobacco Control 2011 – Tobacco and pets — https://pmc.ncbi.nlm.nih.gov/articles/PMC3088460
- American College of Veterinary Pharmacists (vetmeds.org) – Nicotine/tobacco — https://vetmeds.org/pet-poison-control-list/Nicotine-Tobacco
- MSPCA-Angell – Nicotine toxicity — https://www.mspca.org/angell_services/nicotine-toxicity/
- Vet Times 2015 – E-cigs toxic threat to dogs — https://www.vettimes.com/news/vets/small-animal-vets/e-cigs-toxic-threat-to-dogs
- Tobacco Control 2019 – JUUL nicotine content — https://pmc.ncbi.nlm.nih.gov/articles/PMC7341718
- DeGroot, Can Vet J 2014 – Permethrin in cats — https://pmc.ncbi.nlm.nih.gov/articles/PMC3866860
- ANSES 2023 – Fipronil antiparasitics toxic to rabbits — https://www.anses.fr/en/content/antiparasitics-containing-fipronil-are-toxic-rabbits
- Khan et al., JAVMA 2014 – Tea tree oil in dogs and cats — https://pubmed.ncbi.nlm.nih.gov/24344857/
- BMC Vet Res 2020 – Tea tree oil toxicosis in a cockatiel — https://pmc.ncbi.nlm.nih.gov/articles/PMC6995176/ *(consulted; cited in notes only)*
- Hall – Easter lily nephrotoxicity (rats, rabbits) — https://digitalcommons.usu.edu/advs_facpub/151
- Rabbit Welfare Association & Fund – Poisonous plants — https://rabbitwelfare.co.uk/poisonous-plants/
- House Rabbit Society – GI stasis — https://rabbit.org/care/gi-stasis/
- House Rabbit Society – Is your rabbit sick? — https://rabbit.org/health/is-your-rabbit-sick/
- Horn et al., PLoS ONE 2013 – Why can't rodents vomit? — https://pmc.ncbi.nlm.nih.gov/articles/PMC3622671
- RSPCA Australia – Guinea pig household hazards — https://kb.rspca.org.au/knowledge-base/how-will-i-keep-my-guinea-pigs-safe-against-household-hazards/ *(consulted; cited in notes only)*
- CNITV – Centre anti-poison vétérinaire (Lyon) — https://www.cnitv.fr/centre-anti-poison
- CNITV – Contact — https://www.cnitv.fr/Contact *(consulted; cited in notes only)*
- Oniris CHUV – CAPAE-Ouest (Nantes) — https://chuv.oniris-nantes.fr/accueil/centre-anti-poison
- Ordre des vétérinaires – Continuité et permanence des soins — https://www.veterinaire.fr/je-suis-veterinaire/mon-exercice-professionnel/les-fiches-professionnelles/declarer-ses-modalites-de-continuite-et-de-permanence-des-soins
- 3115.fr – service de régulation vétérinaire — https://www.3115.fr/

## Disagreements between sources (more cautious value used)

| Item | Source A | Source B | Used |
|---|---|---|---|
| Onion, dog | Merck: signs at 15–30 g/kg | Kovalkovičová 2009: >0.5 % body weight (5 g/kg) | 5 g/kg |
| Macadamia, dog | Merck: 2.4 g/kg | Cortinovis & Caloni 2016: 0.7 g/kg | 0.7 g/kg |
| Ibuprofen, dog GI | Merck: 100–125 mg/kg | ASPCA APCC (dvm360): 25 mg/kg | 25 mg/kg |
| Naproxen, dog | dvm360: single dose ≥7 mg/kg | Merck: 5.6 mg/kg/day × 7 days | 5.6 mg/kg |
| Vitamin D3, dog | Merck supplements page: 0.5 mg/kg | Merck rodenticide page: 0.1 mg/kg | 0.1 mg/kg |
| Salt, dog | PPH: ≈3.3 g/kg | Merck: signs from 2–3 g/kg | 2 g/kg |
| Tulip/daffodil bulbs | Merck: most exposures mild | ASPCA/PPH: heart effects with bulbs | vet-now for bulbs |
| Lilies, dog | ASPCA plant database: non-toxic | ASPCA news + FDA: GI upset only | watch (GI) |
| Grapes, cat | Merck pro: no published cases | Merck owner: 1 case; ASPCA: cats may be affected | vet-now |
| Xylitol, cat | Merck/PPH: not at risk | FDA/Dunayer: less dangerous / unknown | watch, noted |
| Ethylene glycol window | PPH: dogs 8 h (another PPH page 8–12 h) | Merck: no hour limit | 3 h cats / 8 h dogs, vet-now regardless |
| Anticoagulant delay | Brief said 3–5 days | Merck: 3–7 days | 3–7 days |
| Azalea | Merck: toxic dose 1 g/kg | PPH: "a few leaves" | any amount |

## Not verified / uncertain

- **Quotes**: captured via an automated reader (WebFetch). Very likely verbatim, but not checked by eye on the live pages.
- **Garlic, dog (1 g/kg)**: derived (5 g/kg onion ÷ 5), not published. No acute garlic dose for dogs was found in a reference source.
- **Tablet strengths**: paracetamol 325/500/1000 mg, aspirin 80/81/325/500 mg, carprofen 25/75/100 mg seen only in search results or a retailer listing; the French medicines database (BDPM) was down (503). 400 mg OTC ibuprofen in France not checked. The app should always use the strength printed on the pack.
- **Merck tables**: the column (immediate vs within 24 h) in "When to see a veterinarian", and the "toxic vs limit" column in the rabbit plants/foods table, were inferred from extracted text.
- **Small species data gaps**: no reliable data for chocolate in pet rodents; grapes, macadamia, ethanol, caffeine, salt and Allium in birds/rodents/rabbits; xylitol in cage birds (only a wild-sunbird report, abstract only) and in rabbits (IV insulin data only). These are all `no-data` → vet call.
- **Bird chocolate death (kea, ~20 g dark chocolate)** and **xylitol sunbird deaths**: abstracts only.
- **Bromethalin**: Merck gives two different dog LD50 ranges on the same page.
- **Yellow gums = vet-now**: our classification (likely liver injury after a poison); no source ranks it as an emergency.
- **Not individually verified**: hyacinth bulbs, essential oils other than tea tree, toxicity of lily-of-the-valley vase water, euro-coin metal content, the EU 20 mg/ml nicotine cap.
- **PTFE**: no source quantifies minutes to death in birds; mammals only "presumably" affected (VCA).
- **Contacts**: ASPCA fee amount not on the official page ("may apply"). Pet Poison Helpline's older number (800) 213-6680 still appears on some pages. CNITV and CAPAE-Ouest are **closed 00:00–08:30**. **3115**: the site exists (vet triage service) but operator, cost, hours and coverage are not stated officially; third-party claims (free, 24/7, private Emergence network, ~45 départements) are unconfirmed. No other French veterinary poison centre found.
- **Blocked pages**: AAHA (403), some Cornell pages (403/certificate), PubMed (blocked), a VIN page (CAPTCHA, not bypassed), two ASPCA PDFs unreadable.
- **Myths deliberately left out**: iceberg lettuce as a rabbit poison (no reference source classifies it as toxic); "a few apple seeds kill" (ASPCA/Merck: unlikely; whole seeds do not release cyanide).
- **Not covered as entries (gaps)**: stone-fruit pits, hops, mothballs, detergent pods, organophosphate/carbamate insecticides (mentioned in the fertilizer note), kratom, psilocybin (only via wild mushrooms), alstroemeria, rhubarb leaves, ferric-phosphate slug bait, ferrets.

## Photos in the app (public/img)

Real photographs from Unsplash, used under the Unsplash License (free to use, no permission needed; https://unsplash.com/license). No generated images.

| File | Unsplash image |
|---|---|
| hero.jpg (husky and tabby cat) | https://images.unsplash.com/photo-1573435567032-ff5982925350 |
| chocolate.jpg | https://images.unsplash.com/photo-1643094264639-955fdb53cfc7 |
| grapes.jpg | https://images.unsplash.com/photo-1641210444019-f61749d2951f |
| lily.jpg | https://images.unsplash.com/photo-1501973931234-5ac2964cd94a |
| pills.jpg | https://images.unsplash.com/photo-1550572017-26b5655c1e8c |
| gum.jpg | https://images.unsplash.com/photo-1656622051638-23652075c483 |
| onion.jpg | https://images.unsplash.com/photo-1664975367131-4c7ac2efa704 |
| dog.jpg | https://images.unsplash.com/photo-1558788353-f76d92427f16 |
| cat.jpg | https://images.unsplash.com/photo-1583795128727-6ec3642408f8 |
| rabbit.jpg | https://images.unsplash.com/photo-1452857297128-d9c29adba80b |
| guineapig.jpg | https://images.unsplash.com/photo-1512483652399-7a1f99aa0dd3 |
| bird.jpg | https://images.unsplash.com/photo-1594911588637-c9e891bd7858 |
