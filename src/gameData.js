export const SHOP_ITEMS = [
  { id: 'boost',          name: 'Boost',          icon: '🚀', cost: 5,  desc: 'Ajoute +4 à ton prochain lancer de dés.' },
  { id: 'turbo',          name: 'Turbo',          icon: '⚡', cost: 8,  desc: 'Avance direct de 8 cases. En échange, tu sautes ton lancer et tu ignores la case d\'arrivée.' },
  { id: 'freeze',         name: 'Freeze',         icon: '❄️', cost: 10, desc: 'Choisis un joueur : il passe son prochain tour.' },
  { id: 'swap',           name: 'Swap',           icon: '🔀', cost: 16, desc: 'Choisis un joueur et échangez vos places sur le plateau.' },
  { id: 'tornade',        name: 'Tornade',        icon: '🌪️', cost: 8,  desc: 'Choisis un joueur : il recule de 6 cases.' },
  { id: 'encore',         name: 'Encore',         icon: '🔁', cost: 6,  desc: 'Refais l\'effet du dernier objet classique que tu as utilisé. (Impossible si tu n\'en as encore utilisé aucun.)' },
  { id: 'de_maudit',      name: 'Dé Maudit',      icon: '😈', cost: 9,  desc: 'Choisis un adversaire et lance un dé : il recule d\'autant de cases que le résultat.' },
  { id: 'investissement', name: 'Investissement', icon: '💸', cost: 3,  desc: 'Lance un dé : tu gagnes ce montant en euros, mais tu recules d\'autant de cases. (Ex : 4 → +4€ et −4 cases.)' },
]

export const SPECIAL_SHOP_ITEMS = [
  { id: 'teleporteur', name: 'Téléporteur Instable', icon: '🌀', cost: 20, desc: 'Lance 1 dé : 1-2 tu recules de 3 cases, 3-4-5 tu avances de 5, 6 tu avances de 8.', special: true },
  { id: 'de_permanent',name: 'Dé Supplémentaire',   icon: '🎲', cost: 25, desc: 'Tu lances un dé en plus à chaque tour, pour toute la partie.', special: true },
  { id: 'contrat',     name: 'Contrat',              icon: '📜', cost: 25, desc: 'Tu gagnes +2€ chaque fois qu\'un autre joueur dépense de l\'argent.', special: true },
  { id: 'vip',         name: 'Grade VIP',            icon: '👑', cost: 16, desc: 'La boutique te montre 4 objets au lieu de 3.', special: true },
  { id: 'abonnement',  name: 'Abonnement',           icon: '📡', cost: 8,  desc: 'Tu ajoutes +2 à chacun de tes lancers, mais tu paies 2€ à chaque tour.', special: true },
  { id: 'couronne_fou',name: 'Couronne du Fou',      icon: '🃏', cost: 16, desc: 'À chaque tour : +2 cases si tu n\'es pas premier, mais −2 cases si tu es premier.', special: true },
  { id: 'privilegie',  name: 'Privilégié',           icon: '🎩', cost: 35, desc: 'Tous les objets qui coûtent moins de 15€ deviennent gratuits pour toi.', special: true },
  { id: 'jackpot',     name: 'Jackpot',              icon: '🎰', cost: 18, desc: 'À chaque tour : si tu fais un double (tes deux dés identiques), tu gagnes +6 sur ton résultat.', special: true },
]

export const ALL_SHOP_ITEMS = [...SHOP_ITEMS, ...SPECIAL_SHOP_ITEMS]

// Tirage pondéré : les ids "penalizedIds" (apparus récemment) ont un poids réduit
export function weightedPick(pool, count, penalizedIds = [], penalty = 0.15) {
  const chosen = []
  const remaining = pool.map(it => ({ it, w: penalizedIds.includes(it.id) ? penalty : 1 }))
  for (let k = 0; k < count && remaining.length; k++) {
    const total = remaining.reduce((s, r) => s + r.w, 0)
    let r = Math.random() * total
    let idx = 0
    while (idx < remaining.length - 1 && r >= remaining[idx].w) { r -= remaining[idx].w; idx++ }
    chosen.push(remaining[idx].it)
    remaining.splice(idx, 1)
  }
  return chosen
}

export const BOARD = [
  'depart',
  'evenement',
  'objet',
  'evenement',
  'offre',
  'evenement',
  'neutre',
  'boutique',
  'evenement',
  'neutre',
  'offre',
  'objet',
  'boutique',
  'neutre',
  'offre',
  'neutre',
  'boutique',
  'objet',
  'offre',
  'neutre',
  'boutique',
  'neutre',
  'offre',
  'objet',
  'boutique',
  'neutre',
  'offre',
  'objet',
  'boutique',
  'neutre',
  'offre',
  'objet',
  'boutique',
  'neutre',
  'offre',
  'neutre',
  'boutique',
  'objet',
  'offre',
  'neutre',
  'boutique',
  'objet',
  'offre',
  'neutre',
  'boutique',
  'objet',
  'offre',
  'neutre',
  'boutique',
  'neutre',
  'evenement',
  'offre',
  'evenement',
  'boutique',
  'evenement',
  'offre',
  'evenement',
  'objet',
  'evenement',
  'neutre',
  'evenement',
  'offre',
  'evenement',
  'arrivee',
]

export const SPECIAL_EVENT_CARDS = [
  {
    id: 'loot_box',
    name: 'Loot Box',
    icon: '📦',
    color: '#f0c040',
    lines: [
      { label: '🎲 Lancer un dé', sub: null },
      { label: '1-2', sub: 'Perdre 4€' },
      { label: '3-4', sub: 'Avancer de 4 cases' },
      { label: '5',   sub: 'Avancer de 6 cases' },
      { label: '6',   sub: 'Avancer de 8 cases' },
    ],
  },
  {
    id: 'eject',
    name: 'Bouton d\'Éjection',
    icon: '💥',
    color: '#ef4444',
    lines: [
      { label: 'Choisir un joueur', sub: 'Il recule de 6 cases' },
    ],
  },
  {
    id: 'ddos',
    name: 'DDOS',
    icon: '☠️',
    color: '#a855f7',
    lines: [
      { label: '🎲 Lancer un dé', sub: null },
      { label: '1-2-3', sub: 'Passer son prochain tour' },
      { label: '4-5-6', sub: 'Choisir un joueur qui passe son prochain tour' },
    ],
  },
]

export const EVENT_CARDS = [
  {
    id: 'weekend_double_xp',
    name: 'Week-end double XP',
    icon: '✨',
    color: '#22c55e',
    lines: [
      { label: 'Tous les joueurs avancent de 3 cases', sub: null },
    ],
  },
  {
    id: 'report',
    name: 'Report',
    icon: '🧨',
    color: '#ef4444',
    lines: [
      { label: 'Tous les joueurs reculent de 3 cases', sub: null },
    ],
  },
  {
    id: 'soldes',
    name: 'Soldes',
    icon: '🏷️',
    color: '#f97316',
    lines: [
      { label: '50% sur la boutique pendant 2 tours', sub: null },
    ],
  },
  {
    id: 'acces_payant',
    name: 'Accès payant',
    icon: '💳',
    color: '#0ea5e9',
    lines: [
      { label: 'Tous les joueurs perdent 5€', sub: null },
    ],
  },
  {
    id: 'remboursement',
    name: 'Remboursement',
    icon: '💰',
    color: '#14b8a6',
    lines: [
      { label: 'Tous les joueurs : 50% de leur dernier achat', sub: null },
    ],
  },
  {
    id: 'pari',
    name: 'Pari',
    icon: '🍀',
    color: '#f59e0b',
    interactive: true,
    lines: [
      { label: 'Choisis un chiffre et une mise', sub: 'Si tes dés affichent ton chiffre, tu gagnes le double de ta mise. Sinon, tu perds ta mise.' },
    ],
  },
  {
    id: 'dilemme',
    name: 'Dilemme Cornélien',
    icon: '🤔',
    color: '#8b5cf6',
    interactive: true,
    lines: [
      { label: 'À toi de choisir !', sub: '+5 cases OU +5€ ?' },
    ],
  },
  {
    id: 'inversement',
    name: 'Inversement',
    icon: '🔄',
    color: '#06b6d4',
    interactive: true,
    lines: [
      { label: 'Lance un dé inversé', sub: 'Le résultat est retourné : 1 te fait avancer de 6, 6 te fait avancer de 1 (toujours 7 − ton dé).' },
    ],
  },
]

export const PLAYER_COLORS = ['#3b82f6', '#ef4444', '#f0c040', '#22c55e', '#a855f7']
export const PLAYER_AVATARS = ['🦊', '🐸', '🐼', '🦄', '🐙']

export const ALL_AVATARS = [
  '🦊', '🐸', '🐼', '🦄', '🐙',
  '🐯', '🦁', '🐻', '🐺', '🦝',
  '🐨', '🐮', '🐷', '🦋', '🐉',
  '🦀', '🐢', '🦔', '🦜', '🐬',
]
