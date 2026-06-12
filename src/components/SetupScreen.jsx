import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PLAYER_COLORS, ALL_AVATARS } from '../gameData'

export default function SetupScreen({ onStart }) {
  const [count, setCount] = useState(2)
  const [names, setNames] = useState(['Joueur 1', 'Joueur 2', 'Joueur 3', 'Joueur 4', 'Joueur 5'])
  const [avatars, setAvatars] = useState(ALL_AVATARS.slice(0, 5))

  const shiftAvatar = (playerIdx, dir) => {
    const taken = avatars.filter((a, i) => i !== playerIdx && i < count)
    const available = ALL_AVATARS.filter(e => !taken.includes(e))
    const cur = avatars[playerIdx]
    const idx = available.indexOf(cur)
    const next = available[(idx + dir + available.length) % available.length]
    setAvatars(prev => prev.map((a, i) => i === playerIdx ? next : a))
  }

  const handleStart = () => {
    const players = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: names[i].trim() || `Joueur ${i + 1}`,
      money: 50,
      items: [],
      lastPurchaseCost: 0,
      colorIndex: i,
      avatar: avatars[i],
    }))
    onStart(players)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        gap: '24px', padding: '48px 40px 40px',
        zIndex: 50,
        overflowY: 'auto',
      }}
    >
      <motion.h1
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{
          fontFamily: '"Fredoka One", sans-serif',
          fontSize: '3.5rem', margin: 0,
          background: 'linear-gradient(135deg, #f0c040, #ff6b6b, #a855f7)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '4px',
        }}
      >REGAME AWAKE</motion.h1>

      <motion.div
        initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
        style={{
          background: 'rgba(26,26,46,0.85)', border: '2px solid rgba(240,192,64,0.3)',
          borderRadius: '20px', padding: '24px 32px', backdropFilter: 'blur(12px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
        }}
      >
        <div style={{ color: '#f0c040', fontSize: '1rem', letterSpacing: '2px', fontWeight: 700 }}>
          NOMBRE DE JOUEURS
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[2, 3, 4, 5].map(n => (
            <motion.button
              key={n}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCount(n)}
              style={{
                width: '52px', height: '52px',
                background: count === n
                  ? 'linear-gradient(135deg, #c8860a, #f0c040)'
                  : 'rgba(255,255,255,0.07)',
                border: `2px solid ${count === n ? '#f0c040' : 'rgba(255,255,255,0.15)'}`,
                borderRadius: '14px', color: count === n ? '#1a1a2e' : '#aaa',
                fontWeight: 900, fontSize: '1.4rem', cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: count === n ? '0 0 16px rgba(240,192,64,0.5)' : 'none',
              }}
            >{n}</motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
        style={{
          display: 'flex', flexDirection: 'column', gap: '12px',
          background: 'rgba(26,26,46,0.85)', border: '2px solid rgba(240,192,64,0.3)',
          borderRadius: '20px', padding: '24px 32px', backdropFilter: 'blur(12px)',
          minWidth: '360px',
        }}
      >
        <div style={{ color: '#f0c040', fontSize: '1rem', letterSpacing: '2px', fontWeight: 700, textAlign: 'center' }}>
          NOMS DES JOUEURS
        </div>
        {Array.from({ length: count }, (_, i) => {
          const color = PLAYER_COLORS[i]
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => shiftAvatar(i, -1)}
                style={{
                  width: '28px', height: '28px', flexShrink: 0,
                  background: 'rgba(255,255,255,0.07)',
                  border: `2px solid ${color}55`,
                  borderRadius: '8px', color: color,
                  cursor: 'pointer', padding: 0,
                  position: 'relative',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"
                  style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                  <polyline points="7,1 3,5 7,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>

              <AnimatePresence mode="wait">
                <motion.span
                  key={avatars[i]}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.14 }}
                  style={{
                    fontSize: '1.8rem', width: '38px', textAlign: 'center', flexShrink: 0,
                    filter: `drop-shadow(0 0 6px ${color})`,
                  }}
                >{avatars[i]}</motion.span>
              </AnimatePresence>

              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => shiftAvatar(i, +1)}
                style={{
                  width: '28px', height: '28px', flexShrink: 0,
                  background: 'rgba(255,255,255,0.07)',
                  border: `2px solid ${color}55`,
                  borderRadius: '8px', color: color,
                  cursor: 'pointer', padding: 0,
                  position: 'relative',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"
                  style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                  <polyline points="3,1 7,5 3,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>

              <div style={{
                width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                background: color, boxShadow: `0 0 8px ${color}`,
              }} />

              <input
                value={names[i]}
                onChange={e => setNames(ns => ns.map((n, j) => j === i ? e.target.value : n))}
                placeholder={`Joueur ${i + 1}`}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.07)',
                  border: `2px solid ${color}55`,
                  borderRadius: '12px', padding: '10px 16px',
                  color: '#fff', fontSize: '1.1rem', fontWeight: 700,
                  outline: 'none', fontFamily: '"Nunito", sans-serif',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = color}
                onBlur={e => e.target.style.borderColor = `${color}55`}
              />
            </div>
          )
        })}
      </motion.div>

      <motion.button
        initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
        onClick={handleStart}
        style={{
          background: 'linear-gradient(135deg, #e63946, #c1121f)',
          border: '3px solid #ff6b6b', borderRadius: '40px',
          padding: '16px 60px', color: '#fff',
          fontFamily: '"Fredoka One", sans-serif',
          fontSize: '1.6rem', fontWeight: 900, letterSpacing: '3px',
          cursor: 'pointer',
          boxShadow: '0 4px 30px rgba(230,57,70,0.6)',
        }}
      >🎲 JOUER</motion.button>
    </motion.div>
  )
}
