// Effets sonores synthétisés (Web Audio API), totalement indépendants de la
// musique de fond : le bouton mute ne coupe QUE la musique, pas ces feedbacks.

import achatSound from './assets/sound-effect-achat.mp3'

// Son d'achat (fichier mp3) : joué quand un joueur dépense de l'argent.
// Indépendant du mute musique. Une nouvelle instance permet le chevauchement.
export function playPurchaseSfx() {
  if (typeof window === 'undefined') return
  try {
    const a = new Audio(achatSound)
    a.volume = 0.6
    a.play().catch(() => {})
  } catch { /* ignore */ }
}

let _ctx = null
function getCtx() {
  if (typeof window === 'undefined') return null
  if (!_ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    _ctx = new AC()
  }
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

function tone(ctx, t, freq, dur, vol, type = 'sine', endFreq = null) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g); g.connect(ctx.destination)
  osc.start(t); osc.stop(t + dur + 0.02)
}

// "Clac" sec et bref d'un dé qui rebondit (volontairement clair pour ressortir
// par-dessus la musique). Intensité décroissante au fil des rebonds.
export function playDiceBounce(intensity = 1) {
  const ctx = getCtx()
  if (!ctx) return
  const t = ctx.currentTime
  const f = 360 + (1 - intensity) * 240
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(f, t)
  osc.frequency.exponentialRampToValueAtTime(f * 0.4, t + 0.06)
  const vol = 0.1 + 0.18 * intensity
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.003)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.085)
  osc.connect(g); g.connect(ctx.destination)
  osc.start(t); osc.stop(t + 0.1)
}

// Bon résultat / succès : arpège ascendant épique (do-mi-sol-do)
export function playGoodSfx() {
  const ctx = getCtx()
  if (!ctx) return
  const t = ctx.currentTime + 0.02
  ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ctx, t + i * 0.085, f, 0.22, 0.16, 'square'))
}

// Mauvais résultat / échec : descente triste "wah-wah"
export function playBadSfx() {
  const ctx = getCtx()
  if (!ctx) return
  const t = ctx.currentTime + 0.02
  ;[392.0, 349.23, 311.13].forEach((f, i) => tone(ctx, t + i * 0.13, f, 0.28, 0.15, 'sawtooth', f * 0.94))
}

// Résultat moyen : deux notes neutres et douces
export function playNeutralSfx() {
  const ctx = getCtx()
  if (!ctx) return
  const t = ctx.currentTime + 0.02
  tone(ctx, t, 523.25, 0.16, 0.12, 'triangle')
  tone(ctx, t + 0.1, 587.33, 0.18, 0.11, 'triangle')
}

// Feedback selon le score d'un lancer (normalisé selon le nombre de dés)
export function playScoreFeedback(total, diceCount) {
  const min = diceCount, max = diceCount * 6
  const frac = max > min ? (total - min) / (max - min) : 0.5
  if (frac >= 0.66) playGoodSfx()
  else if (frac <= 0.34) playBadSfx()
  else playNeutralSfx()
}
