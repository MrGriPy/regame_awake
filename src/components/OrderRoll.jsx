import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PLAYER_COLORS, PLAYER_AVATARS } from '../gameData'

function generateUniqueRolls(count) {
  const pool = [1, 2, 3, 4, 5, 6]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count).map((value, i) => ({ playerIndex: i, value }))
}

export default function OrderRoll({ players, onOrderDecided }) {
  const [phase, setPhase] = useState('intro')
  const [results, setResults] = useState([])
  const [order, setOrder] = useState([])
  const timerRef = useRef(null)

  const doRoll = () => {
    setPhase('rolling')
    timerRef.current = setTimeout(() => {
      const rolled = generateUniqueRolls(players.length)
      const sorted = [...rolled].sort((a, b) => b.value - a.value)
      setResults(rolled)
      setOrder(sorted.map(r => r.playerIndex))
      setPhase('done')
    }, 1800)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const handleConfirm = () => onOrderDecided(order.map(i => players[i]))

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '20px', padding: '40px', zIndex: 50,
      }}
    >
      <motion.h2
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{
          fontFamily: '"Fredoka One", sans-serif',
          fontSize: '2.2rem', margin: 0, color: '#f0c040',
          letterSpacing: '3px', textShadow: '0 0 20px #f0c04088',
        }}
      >🎲 ORDRE DE JEU</motion.h2>

      <div style={{
        display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center',
        background: 'rgba(26,26,46,0.85)', border: '2px solid rgba(240,192,64,0.3)',
        borderRadius: '24px', padding: '28px 36px', backdropFilter: 'blur(12px)',
      }}>
        {players.map((p, i) => {
          const roll = results.find(r => r.playerIndex === i)
          return (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.08 }}
              style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
            >
              <span style={{ fontSize: '2.2rem', filter: `drop-shadow(0 0 8px ${PLAYER_COLORS[i]})` }}>
                {p.avatar ?? PLAYER_AVATARS[i]}
              </span>
              <span style={{
                color: '#fff', fontWeight: 800, fontSize: '1rem',
                maxWidth: '80px', textAlign: 'center',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{p.name}</span>

              <motion.div
                animate={phase === 'rolling'
                  ? { rotate: [0, 15, -15, 10, -10, 0], scale: [1, 1.12, 0.94, 1.06, 1] }
                  : {}}
                transition={{ duration: 1.4, repeat: phase === 'rolling' ? Infinity : 0 }}
                style={{
                  width: '64px', height: '64px',
                  background: `linear-gradient(135deg, ${PLAYER_COLORS[i]}cc, ${PLAYER_COLORS[i]}66)`,
                  border: `3px solid ${PLAYER_COLORS[i]}`,
                  borderRadius: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 20px ${PLAYER_COLORS[i]}66`,
                  fontSize: '2.2rem', fontWeight: 900, color: '#fff',
                  textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                }}
              >
                {phase === 'rolling' ? '?' : roll ? roll.value : '—'}
              </motion.div>

              <AnimatePresence>
                {phase === 'done' && order[0] === i && (
                  <motion.div
                    initial={{ scale: 0, y: 4 }} animate={{ scale: 1, y: 0 }}
                    style={{
                      position: 'absolute', top: '-28px', left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '1.4rem', pointerEvents: 'none',
                    }}
                  >👑</motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence>
          {phase === 'done' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(26,26,46,0.85)', border: '2px solid rgba(240,192,64,0.3)',
                borderRadius: '20px', padding: '16px 28px', backdropFilter: 'blur(12px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
              }}
            >
              <div style={{ color: '#f0c040', fontSize: '0.9rem', letterSpacing: '2px', fontWeight: 700 }}>
                ORDRE DE JEU
              </div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                {order.map((pi, rank) => (
                  <div key={pi} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{
                      fontSize: '0.75rem', color: rank === 0 ? '#f0c040' : '#aaa',
                      fontWeight: 700, letterSpacing: '1px',
                    }}>#{rank + 1}</span>
                    <span style={{
                      fontSize: '1.6rem', filter: `drop-shadow(0 0 6px ${PLAYER_COLORS[pi]})`,
                    }}>{players[pi].avatar ?? PLAYER_AVATARS[pi]}</span>
                    <span style={{
                      color: PLAYER_COLORS[pi], fontSize: '0.85rem', fontWeight: 800,
                      maxWidth: '70px', textAlign: 'center',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{players[pi].name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.button
              key="roll-btn"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              onClick={doRoll}
            style={{
              background: 'linear-gradient(135deg, #e63946, #c1121f)',
              border: '3px solid #ff6b6b', borderRadius: '40px',
              padding: '14px 52px', color: '#fff',
              fontFamily: '"Fredoka One", sans-serif',
              fontSize: '1.4rem', fontWeight: 900, letterSpacing: '2px',
              cursor: 'pointer', boxShadow: '0 4px 24px rgba(230,57,70,0.6)',
            }}
          >🎲 LANCER LES DÉS</motion.button>
        )}
        {phase === 'done' && (
          <motion.button
            key="confirm-btn"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            onClick={handleConfirm}
            style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: '3px solid #4ade80', borderRadius: '40px',
              padding: '14px 52px', color: '#fff',
              fontFamily: '"Fredoka One", sans-serif',
              fontSize: '1.4rem', fontWeight: 900, letterSpacing: '2px',
              cursor: 'pointer', boxShadow: '0 4px 24px rgba(34,197,94,0.6)',
            }}
          >▶ COMMENCER</motion.button>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  )
}
