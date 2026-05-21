export const SHOP_ITEMS = [
  { id: 'boost',       name: 'Boost',       icon: '🚀', cost: 8,  desc: '+4 au lancer de dés (comme un champignon Mario Party)' },
  { id: 'turbo',       name: 'Turbo',       icon: '⚡', cost: 5,  desc: 'Skip le tour et ne pas appliquer les effets de la case' },
  { id: 'freeze',      name: 'Freeze',      icon: '❄️', cost: 10, desc: 'Saute le tour d\'un joueur de votre choix' },
  { id: 'swap',        name: 'Swap',        icon: '🔀', cost: 12, desc: 'Choisir un joueur et échanger vos positions' },
  { id: 'tornade',     name: 'Tornade',     icon: '🌪️', cost: 8,  desc: 'Faire reculer un joueur de 6 cases et appliquer l\'effet de la case' },
]

export const SPECIAL_SHOP_ITEMS = [
  { id: 'teleporteur', name: 'Téléporteur Instable', icon: '🌀', cost: 20, desc: 'Lance 1 dé : 1-2 reculer 3 cases, 3-4-5 avancer 5 cases, 6 avancer 8 cases.', special: true },
  { id: 'de_permanent',name: 'Dé Supplémentaire',   icon: '🎲', cost: 25, desc: 'Dé supplémentaire permanent pour tous vos lancers.', special: true },
  { id: 'contrat',     name: 'Contrat',              icon: '📜', cost: 25, desc: '+2€ à chaque fois qu\'un autre joueur dépense de l\'argent.', special: true },
  { id: 'vip',         name: 'Grade VIP',            icon: '👑', cost: 16, desc: 'Révéler 4 cartes à la boutique au lieu de 3.', special: true },
  { id: 'abonnement',  name: 'Abonnement',            icon: '📡', cost: 8,  desc: '+2 au résultat des dés automatiquement. 2€ prélevé à chaque tour.', special: true },
]

export const ALL_SHOP_ITEMS = [...SHOP_ITEMS, ...SPECIAL_SHOP_ITEMS]

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
      { label: '50% de la valeur de votre dernier achat', sub: null },
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
