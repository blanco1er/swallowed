// Language — English by default (the learner's choice); the FR / EN button switches and is remembered.
// ?lang=en or ?lang=fr forces it. Interface strings are keyed by their English text; veterinary data
// strings come from data/fr.json.

const stored = (() => { try { return localStorage.getItem('lang'); } catch { return null; } })();
const forced = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('lang');
export const LANG = [forced, stored].find((l) => l === 'fr' || l === 'en') || 'en';

const FR = {
  // page
  'What did your pet eat?': 'Qu’a mangé votre animal ?',
  'A husky and a tabby cat resting together on a white sofa': 'Un husky et un chat tigré allongés sur un canapé blanc',
  Dog: 'Chien', Cat: 'Chat', Rabbit: 'Lapin', 'Guinea pig': 'Cobaye', Bird: 'Oiseau',
  'Your pet': 'Votre animal', 'Which pet': 'Quel animal', 'Which pet?': 'Quel animal ?',
  "We'll remember it for next time.": 'On s’en souviendra la prochaine fois.',
  'Take a photo of it': 'Prenez-le en photo',
  'Or type what it ate': 'Ou écrivez ce qu’il a mangé',
  'What did it eat?': 'Qu’a-t-il mangé ?',
  'Say it instead': 'Le dire à voix haute',
  'Matching items': 'Résultats',
  'Start speaking': 'Commencer à parler',
  'Tap and say what it ate': 'Touchez et dites ce qu’il a mangé',
  '“My dog ate some grapes”': '« Mon chien a mangé du raisin »',
  Stop: 'Arrêter',
  'Or tap one': 'Ou touchez-en un',
  'See all': 'Tout voir',
  'Most common': 'Les plus fréquents',
  Chocolate: 'Chocolat', Grapes: 'Raisin', Lily: 'Lys', Ibuprofen: 'Ibuprofène', Gum: 'Chewing-gum', Onion: 'Oignon',
  "I don't know what it ate": 'Je ne sais pas ce qu’il a mangé',
  '— my pet seems unwell': '— mon animal a l’air malade',
  'Keep Swallowed one tap away': 'Gardez Swallowed à portée de main',
  'Tap Share, then “Add to Home Screen”.': 'Touchez Partager, puis « Sur l’écran d’accueil ».',
  Dismiss: 'Fermer',
  "Not a substitute for a vet. Photos are sent to Google Gemini only to recognise the item; Swallowed keeps nothing, and on Gemini's free tier Google may use them to improve its products.":
    'Ne remplace pas un vétérinaire. Les photos sont envoyées à Google Gemini uniquement pour reconnaître l’objet ; Swallowed ne garde rien, et avec l’offre gratuite de Gemini, Google peut les utiliser pour améliorer ses produits.',
  Back: 'Retour', Emergency: 'Urgence', Close: 'Fermer', Search: 'Rechercher',
  'Is this it?': 'C’est bien ça ?',
  'Closest matches': 'Les plus proches',
  'Or search': 'Ou cherchez',
  'Type a name': 'Tapez un nom',
  'Search another item': 'Chercher un autre produit',
  Change: 'Changer',
  "That's it": 'C’est ça',
  'How much did it eat?': 'Combien en a-t-il mangé ?',
  'How much?': 'Combien ?',
  "The answer depends on the amount and on your pet's weight.": 'La réponse dépend de la quantité et du poids de votre animal.',
  "Your pet's weight": 'Poids de votre animal',
  Weight: 'Poids', Unit: 'Unité',
  'Which form': 'Quelle forme',
  'Which one was it? The dose depends on it.': 'Lequel était-ce ? La dose en dépend.',
  Amount: 'Quantité',
  'Exact amount': 'Quantité exacte',
  'See what to do': 'Voir quoi faire',
  'Tick everything you notice': 'Cochez tout ce que vous remarquez',
  'What do you see?': 'Que voyez-vous ?',
  "Nothing yet? Leave it empty — we'll tell you what to do and what to watch for.": 'Rien pour l’instant ? Laissez vide : on vous dira quoi faire et quoi surveiller.',
  'What to do now': 'Que faire maintenant',
  'How Swallowed decided': 'Comment Swallowed a décidé',
  'Signs to watch for': 'Signes à surveiller',
  'Look around for these': 'Cherchez autour de vous',
  'The most common dangers for this animal at home. Found one? Tap it.': 'Les dangers les plus fréquents à la maison pour cet animal. Vous en trouvez un ? Touchez-le.',
  'How we worked it out': 'Le calcul en détail',
  'The dose, step by step': 'La dose, étape par étape',
  'Note for the vet': 'Note pour le vétérinaire',
  'Read it out, copy or share it': 'À lire, copier ou partager',
  "Swallowed shows published veterinary references and never replaces a vet. Never treat your pet at home without a vet's advice.":
    'Swallowed s’appuie sur des références vétérinaires publiées et ne remplace jamais un vétérinaire. Ne soignez jamais votre animal à la maison sans l’avis d’un vétérinaire.',
  'New check': 'Nouvelle recherche',
  'Looking at your photo…': 'Analyse de votre photo…',
  'Looking it up…': 'Recherche en cours…',
  'Type it instead': 'L’écrire plutôt',
  'Emergency help': 'Aide d’urgence',
  'Collapsed, having a seizure or struggling to breathe? Go to the nearest emergency vet now.': 'Effondré, en convulsions ou du mal à respirer ? Allez tout de suite chez le vétérinaire d’urgence le plus proche.',
  Country: 'Pays', 'United States': 'États-Unis', France: 'France',
  'Amount eaten': 'Quantité mangée',
  Copy: 'Copier', Share: 'Partager',
  'Everything we cover': 'Tout ce que nous couvrons',
  'Search everything we cover': 'Chercher dans tout ce que nous couvrons',
  // verdicts
  'Call a vet now': 'Appelez un vétérinaire maintenant',
  'Call your vet today': 'Appelez votre vétérinaire aujourd’hui',
  'Watch at home': 'Surveillez à la maison',
  Low: 'Faible', 'Vet today': 'Aujourd’hui', 'Vet now': 'Urgent',
  // steps
  'Call a vet or a pet poison line now — tap a number below.': 'Appelez maintenant un vétérinaire ou un centre antipoison vétérinaire : touchez un numéro ci-dessous.',
  "Don't try to make your pet vomit unless a vet tells you to.": 'N’essayez pas de faire vomir votre animal, sauf si un vétérinaire vous le demande.',
  'Keep the packaging, and note what time it happened.': 'Gardez l’emballage et notez l’heure.',
  'Call your vet today and tell them what and how much it ate.': 'Appelez votre vétérinaire aujourd’hui et dites-lui quoi et combien il a mangé.',
  'Keep an eye on your pet for the signs below.': 'Surveillez votre animal pour les signes ci-dessous.',
  'If a sign appears, call a vet or a poison line straight away.': 'Si un signe apparaît, appelez tout de suite un vétérinaire ou un centre antipoison.',
  'No need to rush to the vet for this amount.': 'Pas besoin de foncer chez le vétérinaire pour cette quantité.',
  'Watch your pet closely for the next 24 hours.': 'Surveillez bien votre animal pendant les 24 prochaines heures.',
  'If any sign below appears, call your vet.': 'Si un signe ci-dessous apparaît, appelez votre vétérinaire.',
  "Call your vet or a pet poison line today — don't wait for signs.": 'Appelez votre vétérinaire ou un centre antipoison aujourd’hui : n’attendez pas les signes.',
  'Look around for what it could have eaten (list below).': 'Cherchez autour de vous ce qu’il a pu manger (liste ci-dessous).',
  'Keep any packaging or leftovers you find.': 'Gardez tout emballage ou reste que vous trouvez.',
  // messages
  'Go to a vet at once if you see any of these.': 'Allez tout de suite chez un vétérinaire si vous voyez l’un de ces signes.',
  'Any change in behaviour, eating, breathing or balance': 'Tout changement de comportement, d’appétit, de respiration ou d’équilibre',
  'Dangerous for every pet': 'Dangereux pour tous les animaux',
  'Best guess — or pick one below': 'Notre meilleure hypothèse — ou choisissez ci-dessous',
  'Not in our list of known pet poisonings — we will not guess.': 'Absent de notre liste d’intoxications connues : nous ne devinons pas.',
  'Not in our list. Type it on the main screen and we will look it up.': 'Absent de notre liste. Écrivez-le sur l’écran principal et nous le chercherons.',
  'Not in our list yet — press Search on the keyboard and we will recognise it.': 'Pas encore dans notre liste : touchez Rechercher sur le clavier et nous le reconnaîtrons.',
  "We couldn't open that photo. Try another one, or type it.": 'Impossible d’ouvrir cette photo. Essayez-en une autre, ou écrivez-le.',
  'Waking up the recognition server — this can take up to a minute.': 'Réveil du serveur de reconnaissance : cela peut prendre jusqu’à une minute.',
  'Recognition is waking up or unavailable — try again in a moment, or type it.': 'La reconnaissance se réveille ou est indisponible : réessayez dans un instant, ou écrivez-le.',
  'Recognition is taking too long — type it instead.': 'La reconnaissance prend trop de temps : écrivez-le plutôt.',
  'No connection — you can still type a known item.': 'Pas de connexion : vous pouvez quand même écrire un produit connu.',
  "We couldn't recognise it. Retake the photo closer, or type it.": 'Nous ne l’avons pas reconnu. Reprenez la photo de plus près, ou écrivez-le.',
  "We couldn't find that. Check the spelling, or describe it differently.": 'Introuvable. Vérifiez l’orthographe, ou décrivez-le autrement.',
  'Listening… say what your pet ate': 'Je vous écoute… dites ce qu’a mangé votre animal',
  'Tap and say what happened': 'Touchez et dites ce qui s’est passé',
  "We didn't catch that. Try again, or type it.": 'Nous n’avons pas compris. Réessayez, ou écrivez-le.',
  'The microphone is blocked for this site. In Safari: aA › Website Settings › Microphone › Allow. Or type it.': 'Le micro est bloqué pour ce site. Dans Safari : aA › Réglages du site › Micro › Autoriser. Ou écrivez-le.',
  "Voice isn't available here. Tap the box and use the microphone key on your keyboard.": 'La voix n’est pas disponible ici. Touchez le champ et utilisez la touche micro du clavier.',
  "Voice didn't start in this browser. Tap the box and use the microphone key on your keyboard.": 'La voix n’a pas démarré dans ce navigateur. Touchez le champ et utilisez la touche micro du clavier.',
  'The microphone is busy (a call?). Type it instead.': 'Le micro est occupé (un appel ?). Écrivez-le plutôt.',
  "We didn't hear anything. Tap the microphone and speak, or type it.": 'Nous n’avons rien entendu. Touchez le micro et parlez, ou écrivez-le.',
  'Voice needs a connection. Type it instead.': 'La voix a besoin d’une connexion. Écrivez-le plutôt.',
  'Enter the weight — a rough guess is fine.': 'Indiquez le poids : une estimation suffit.',
  'Check the weight and the kg / lb switch.': 'Vérifiez le poids et l’unité kg / lb.',
  'Choose which one it was.': 'Choisissez lequel c’était.',
  'Choose roughly how much it ate.': 'Choisissez à peu près combien il en a mangé.',
  'Swallowed could not load its veterinary data. Check your connection and reload — or press Emergency.': 'Swallowed n’a pas pu charger ses données vétérinaires. Vérifiez la connexion et rechargez, ou touchez Urgence.',
  'Swallowed could not load its veterinary data. Check your connection and reload.': 'Swallowed n’a pas pu charger ses données vétérinaires. Vérifiez la connexion et rechargez.',
  'Copied — paste it in a message or read it on the phone': 'Copié : collez-le dans un message ou lisez-le au téléphone',
  'Select the text and copy it': 'Sélectionnez le texte et copiez-le',
  'Signs from veterinary references listed in the app.': 'Signes issus des références vétérinaires citées dans l’app.',
  'No veterinary data for this item and animal — that is why we say to call your vet.': 'Aucune donnée vétérinaire pour ce produit et cet animal : c’est pourquoi nous conseillons d’appeler votre vétérinaire.',
  'Unknown item': 'Produit inconnu',
  'No reliable data for this animal — a vet should decide.': 'Pas de données fiables pour cet animal : un vétérinaire doit décider.',
  'Daily limit reached for recognition — you can still pick from the list.': 'Limite quotidienne de reconnaissance atteinte : vous pouvez encore choisir dans la liste.',
  'Photo recognition is not set up on this server yet — type or say it instead.': 'La reconnaissance photo n’est pas encore configurée : écrivez-le ou dites-le.',
  'Too many photos right now — type it instead, or try again in a minute.': 'Trop de photos en ce moment : écrivez-le, ou réessayez dans une minute.',
  'Recognition is unavailable right now — type it instead.': 'La reconnaissance est indisponible pour le moment : écrivez-le plutôt.',
  'Recognition is not answering right now — type it instead.': 'La reconnaissance ne répond pas pour le moment : écrivez-le plutôt.',
  'That photo is too large. Try again.': 'Cette photo est trop lourde. Réessayez.',
  'That photo could not be read. Try another one.': 'Cette photo est illisible. Essayez-en une autre.',
  // categories
  Food: 'Aliment', Plant: 'Plante', 'Human medicine': 'Médicament humain', 'Household product': 'Produit ménager',
  'Garden product': 'Produit de jardin', 'Pest control': 'Antiparasitaire / raticide', 'Pet medicine': 'Médicament vétérinaire', Other: 'Autre',
  // weight hints
  'Dogs range from about 2 kg to over 60 kg.': 'Un chien pèse d’environ 2 kg à plus de 60 kg.',
  'Most adult cats weigh 3–6 kg.': 'La plupart des chats adultes pèsent 3 à 6 kg.',
  'Pet rabbits usually weigh 1–5 kg.': 'Un lapin de compagnie pèse en général 1 à 5 kg.',
  'A guinea pig is about 1 kg; a hamster about 0.1 kg (100 g).': 'Un cobaye pèse environ 1 kg ; un hamster environ 0,1 kg (100 g).',
  'A budgie is about 0.035 kg (35 g), a cockatiel 0.09 kg, a grey parrot 0.45 kg.': 'Une perruche pèse environ 0,035 kg (35 g), une calopsitte 0,09 kg, un gris du Gabon 0,45 kg.',
  // templates
  'Matches “{name}”': 'Correspond à « {name} »',
  'We read “{label}”': 'Lu : « {label} »',
  'You said: "{said}"': 'Vous avez dit : « {said} »',
  'Show all {n}': 'Tout afficher ({n})',
  'Call {name}': 'Appeler {name}',
  'When: {onset}': 'Quand : {onset}',
  '{perKg} — step by step, try other amounts': '{perKg} — étape par étape, essayez d’autres quantités',
  'A bite (≈ {n} g)': 'Une bouchée (≈ {n} g)',
  'A quarter (≈ {n} g)': 'Un quart (≈ {n} g)',
  'Half (≈ {n} g)': 'La moitié (≈ {n} g)',
  'All of it ({n} g)': 'Tout ({n} g)',
};

let DATA_FR = {};
export function setDataFr(map) { DATA_FR = map || {}; }

// tr('Call {name}', { name }) → the French or English text with the values filled in.
export function tr(text, vars) {
  let out = LANG === 'fr' ? FR[text] ?? text : text;
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return out;
}
// Veterinary data strings (signs, timings, quotes) from data/fr.json.
export const trData = (text) => (LANG === 'fr' && text ? DATA_FR[text] ?? text : text);

// Translates the fixed text of the page once at start.
export function translatePage(root = document.body) {
  if (LANG !== 'fr') return;
  document.documentElement.lang = 'fr';
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const key = n.nodeValue.replace(/\s+/g, ' ').trim();
    if (key && FR[key]) n.nodeValue = n.nodeValue.replace(n.nodeValue.trim(), FR[key]);
  }
  for (const el of root.querySelectorAll('[placeholder], [aria-label], [alt], [data-title]')) {
    for (const a of ['placeholder', 'aria-label', 'alt', 'data-title']) {
      const v = el.getAttribute(a);
      if (v && FR[v]) el.setAttribute(a, FR[v]);
    }
  }
}
