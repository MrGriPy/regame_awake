import { motion } from 'framer-motion'
import { PLAYER_COLORS, PLAYER_AVATARS } from '../gameData'

const INITIAL_MONEY = 40
const RANK_EMOJI = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']

export default function GameOver({ players, finishOrder, roundCount, onRestart }) {
  const n = players.length

  const arrivalSorted = [...finishOrder].sort((a, b) => a.round - b.round)
  const rankPoints = [10, 7, 5, 3, 1]
  const arrivalPoints = {}
  for (let i = 0; i < arrivalSorted.length; i++) {
    arrivalPoints[arrivalSorted[i].id] = rankPoints[i] ?? 0
  }

  const spentValues = players.map(p => INITIAL_MONEY - p.money)
  const maxSpent = spentValues.length ? Math.max(...spentValues) : 0
  const minSpent = spentValues.length ? Math.min(...spentValues) : 0

  const results = players.map(p => {
    const entry = finishOrder.find(f => f.id === p.id)
    const finishRound = entry ? entry.round : null
    const finishRank = entry ? arrivalSorted.findIndex(f => f.id === p.id) + 1 : 0
    const spent = INITIAL_MONEY - p.money
    const mostSpender = spent === maxSpent
    const leastSpender = spent === minSpent
    const spendPoints = mostSpender ? -2 : 0
    const savePoints = leastSpender ? 2 : 0
    const moneyBonusPts = Math.floor(p.money / 5)
    const economyPts = spendPoints + savePoints + moneyBonusPts
    return {
      ...p,
      spent,
      arrivalPts: arrivalPoints[p.id] ?? 0,
      spendPoints,
      savePoints,
      moneyBonusPts,
      economyPts,
      total: (arrivalPoints[p.id] ?? 0) + economyPts,
      finishRank,
      finishRound: finishRound === Infinity ? null : finishRound,
    }
  }).sort((a, b) => b.total - a.total)

  const winner = results[0]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '20px', padding: '24px', overflowY: 'auto',
        zIndex: 50,
      }}
    >
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{ textAlign: 'center' }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '4px' }}>🏁</div>
        <h1 style={{
          fontFamily: '"Fredoka One", sans-serif',
          fontSize: '3.5rem', margin: 0,
          background: 'linear-gradient(135deg, #f0c040, #ff6b6b, #a855f7)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '4px',
        }}>FIN DE PARTIE</h1>
        <div style={{ color: '#555', fontSize: '0.88rem', marginTop: '4px', letterSpacing: '1px' }}>
          {roundCount} tour{roundCount > 1 ? 's' : ''} joués
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.25, type: 'spring', stiffness: 200 }}
        style={{
          background: `linear-gradient(135deg, ${PLAYER_COLORS[winner.colorIndex]}33, ${PLAYER_COLORS[winner.colorIndex]}11)`,
          border: `3px solid ${PLAYER_COLORS[winner.colorIndex]}99`,
          borderRadius: '20px', padding: '14px 44px',
          textAlign: 'center',
          boxShadow: `0 0 40px ${PLAYER_COLORS[winner.colorIndex]}44`,
        }}
      >
        <div style={{ color: '#aaa', fontSize: '0.72rem', letterSpacing: '2.5px', marginBottom: '6px' }}>VAINQUEUR</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'center' }}>
          <span style={{ fontSize: '2.4rem' }}>{winner.avatar ?? PLAYER_AVATARS[winner.colorIndex]}</span>
          <span style={{ color: PLAYER_COLORS[winner.colorIndex], fontWeight: 900, fontSize: '1.7rem' }}>
            {winner.name}
          </span>
          <span style={{ color: '#f0c040', fontWeight: 900, fontSize: '1.7rem' }}>
            {winner.total} pts
          </span>
        </div>
      </motion.div>

      <div style={{ width: '100%', maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '36px 1fr 110px 120px 70px',
          gap: '8px', padding: '0 16px',
          color: '#444', fontSize: '0.68rem', letterSpacing: '1.5px', textTransform: 'uppercase',
        }}>
          <div />
          <div>Joueur</div>
          <div style={{ textAlign: 'center' }}>Arrivée</div>
          <div style={{ textAlign: 'center' }}>Économie</div>
          <div style={{ textAlign: 'center' }}>Total</div>
        </div>

        {results.map((p, i) => {
          const color = PLAYER_COLORS[p.colorIndex]
          const isFirst = i === 0
          const arrivalLabel = p.finishRound == null ? 'N/A' : `Tour ${p.finishRound}`
          return (
            <motion.div
              key={p.id}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.35 + i * 0.08 }}
              style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr 110px 120px 70px',
                gap: '8px', padding: '12px 16px', borderRadius: '16px',
                background: isFirst
                  ? `linear-gradient(135deg, ${color}22, ${color}0d)`
                  : 'rgba(255,255,255,0.04)',
                border: isFirst
                  ? `2px solid ${color}55`
                  : '2px solid rgba(255,255,255,0.07)',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: '1.4rem', textAlign: 'center' }}>{RANK_EMOJI[i]}</div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>{p.avatar ?? PLAYER_AVATARS[p.colorIndex]}</span>
                <span style={{ color, fontWeight: 900, fontSize: '0.95rem' }}>{p.name}</span>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>{arrivalLabel}</div>
                <div style={{ color: '#555', fontSize: '0.7rem' }}>+{p.arrivalPts} pts</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ color: p.spent === 0 ? '#4ade80' : '#ff6b6b', fontWeight: 800, fontSize: '0.9rem' }}>
                  -{p.spent} €
                </div>
                <div style={{ color: '#555', fontSize: '0.7rem', whiteSpace: 'pre-line' }}>
                  {p.spendPoints !== 0 || p.savePoints !== 0
                    ? `${p.spendPoints > 0 ? '+' : ''}${p.spendPoints} pts${p.savePoints !== 0 ? ` ${p.savePoints > 0 ? '+' : ''}${p.savePoints} pts` : ''}`
                    : '0 pts'}
                  {'\n'}+{p.moneyBonusPts} pts
                </div>
              </div>

              <div style={{ textAlign: 'center', color: '#f0c040', fontWeight: 900, fontSize: '1.25rem' }}>
                {p.total}
              </div>
            </motion.div>
          )
        })}
      </div>

      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRestart}
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
          border: '3px solid #a78bfa', borderRadius: '30px',
          padding: '14px 52px', color: '#fff',
          fontFamily: '"Fredoka One", sans-serif',
          fontSize: '1.3rem', fontWeight: 900, letterSpacing: '2px',
          cursor: 'pointer', boxShadow: '0 4px 28px rgba(124,58,237,0.5)',
        }}
      >🔄 NOUVELLE PARTIE</motion.button>
    </motion.div>
  )
}
