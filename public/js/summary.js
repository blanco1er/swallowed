// Vet summary — spec.md > Vet summary and contacts
// Plain sentences the owner can read to a vet on the phone, in the app's language.

import { LANG } from './i18n.js';

const FR = LANG === 'fr';

export const SPECIES_LABEL = FR
  ? { dog: 'chien', cat: 'chat', rabbit: 'lapin', rodent: 'cobaye ou hamster', bird: 'oiseau' }
  : { dog: 'dog', cat: 'cat', rabbit: 'rabbit', rodent: 'guinea pig or hamster', bird: 'bird' };

export const LEVEL_LABEL = FR
  ? { 'vet-now': 'Appelez un vétérinaire maintenant', 'vet-today': 'Appelez votre vétérinaire aujourd’hui', watch: 'Surveillez à la maison' }
  : { 'vet-now': 'Call a vet now', 'vet-today': 'Call your vet today', watch: 'Watch at home' };

function weightText(kg) {
  if (!kg) return FR ? 'poids inconnu' : 'weight unknown';
  const t = kg < 1 ? `${Math.round(kg * 1000)} g` : `${Math.round(kg * 10) / 10} kg`;
  return FR ? t.replace('.', ',') : t;
}

// answers: { species, weightKg, when, itemName?, amountText?, signs?: [labels], level }
export function buildSummary(a) {
  const lines = [];
  const sp = SPECIES_LABEL[a.species] || (FR ? 'animal' : 'pet');
  if (FR) {
    lines.push(a.weightKg ? `Mon ${sp}, ${weightText(a.weightKg)}.` : `Mon ${sp}.`);
    lines.push(a.itemName ? `A mangé : ${a.itemName}${a.amountText ? ` — environ ${a.amountText}` : ''}.` : 'A mangé : inconnu — je n’ai pas trouvé quoi.');
    if (a.when) lines.push(`Quand : ${a.when}.`);
    if (a.signs?.length) lines.push(`Signes : ${a.signs.join(', ')}.`);
    else if (!a.itemName) lines.push('Signes : aucun pour l’instant.');
    if (a.doseText) lines.push(`Dose estimée : ${a.doseText}.`);
    lines.push(`Conseil de Swallowed : ${LEVEL_LABEL[a.level] || a.level}.`);
    return lines.join('\n');
  }
  lines.push(a.weightKg ? `My ${sp}, ${weightText(a.weightKg)}.` : `My ${sp}.`);
  if (a.itemName) {
    lines.push(`Ate: ${a.itemName}${a.amountText ? ` — about ${a.amountText}` : ''}.`);
  } else {
    lines.push('Ate: unknown — I could not find what it was.');
  }
  if (a.when) lines.push(`When: ${a.when}.`);
  if (a.signs?.length) lines.push(`Signs: ${a.signs.join(', ')}.`);
  else if (!a.itemName) lines.push('Signs: none noticed yet.');
  if (a.doseText) lines.push(`Estimated dose: ${a.doseText}.`);
  lines.push(`Swallowed suggested: ${LEVEL_LABEL[a.level] || a.level}.`);
  return lines.join('\n');
}
