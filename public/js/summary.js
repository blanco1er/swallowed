// Vet summary — spec.md > Vet summary and contacts
// Plain sentences the owner can read to a vet on the phone.

export const SPECIES_LABEL = {
  dog: 'dog',
  cat: 'cat',
  rabbit: 'rabbit',
  rodent: 'guinea pig or hamster',
  bird: 'bird',
};

export const LEVEL_LABEL = {
  'vet-now': 'Call a vet now',
  'vet-today': 'Call your vet today',
  watch: 'Watch at home',
};

function weightText(kg) {
  if (!kg) return 'weight unknown';
  return kg < 1 ? `${Math.round(kg * 1000)} g` : `${Math.round(kg * 10) / 10} kg`;
}

// answers: { species, weightKg, when, itemName?, amountText?, signs?: [labels], level }
export function buildSummary(a) {
  const lines = [];
  lines.push(a.weightKg ? `My ${SPECIES_LABEL[a.species] || 'pet'}, ${weightText(a.weightKg)}.` : `My ${SPECIES_LABEL[a.species] || 'pet'}.`);
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
