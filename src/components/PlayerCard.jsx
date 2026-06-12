import { motion, AnimatePresence } from 'framer-motion'
import { PLAYER_COLORS, PLAYER_AVATARS } from '../gameData'


export default function PlayerCard({ player, index, isActive, itemsOnSide = false }) {
  const color = PLAYER_COLORS[index]

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
      style={{
        background: `linear-gradient(135deg, ${color}dd, ${color}66)`,
        border: `3px solid ${isActive ? '#ffffff' : color}`,
        borderRadius: '20px',
        padding: '20px 28px',
        minWidth: '240px',
        boxShadow: isActive
          ? `0 0 0 3px #ffffff44, 0 0 24px ${color}, 0 4px 16px rgba(0,0,0,0.5)`
          : `0 0 16px ${color}55, 0 4px 12px rgba(0,0,0,0.4)`,
        backdropFilter: 'blur(8px)',
        textAlign: 'center',
        position: 'relative',
        cursor: 'default',
        transition: 'box-shadow 0.25s, border-color 0.25s',
        userSelect: 'none',
      }}
    >
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            style={{
              position: 'absolute', top: -36, left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '1.8rem', color: '#fff',
              filter: 'drop-shadow(0 0 6px #fff)',
            }}
          >▼</motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '4.2rem', lineHeight: 1, position: 'relative' }}>
            {player.avatar ?? PLAYER_AVATARS[index]}
          </div>

          <div
            style={{
              fontWeight: 900, fontSize: '1.55rem', color: '#fff', marginTop: '8px',
              textShadow: '0 2px 4px rgba(0,0,0,0.6)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '210px',
            }}
          >{player.name}</div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
            <span style={{
              fontSize: '1.55rem', color: '#FFD700', fontWeight: 900,
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            }}>💰 {player.money} €</span>
          </div>
        </div>

        {itemsOnSide && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              borderLeft: `1px solid ${color}66`,
              paddingLeft: '12px',
              minHeight: '40px',
            }}
          >
            <AnimatePresence>
              {player.items.map(item => (
                <motion.span
                  key={item.uid}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  title={item.name}
                  style={{
                    fontSize: '2.2rem',
                    background: 'rgba(0,0,0,0.35)',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    lineHeight: 1,
                    display: 'inline-flex',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                  }}
                >{item.icon}</motion.span>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {!itemsOnSide && player.items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginTop: '10px',
              borderTop: `1px solid ${color}66`,
              paddingTop: '8px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {player.items.map(item => (
              <motion.span
                key={item.uid}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                title={item.name}
                style={{
                  fontSize: '2.2rem',
                  background: 'rgba(0,0,0,0.35)',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  lineHeight: 1,
                  display: 'inline-flex',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                }}
              >{item.icon}</motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
