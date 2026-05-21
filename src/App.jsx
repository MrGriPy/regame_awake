import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PlayerCard from './components/PlayerCard'
import GameMat from './components/GameMat'
import Shop from './components/Shop'
import SetupScreen from './components/SetupScreen'
import OrderRoll from './components/OrderRoll'
import GameOver from './components/GameOver'
import TerminalOverlay from './components/TerminalOverlay'
import DiceScene from './components/DiceScene'
import { SHOP_ITEMS, ALL_SHOP_ITEMS, SPECIAL_EVENT_CARDS, EVENT_CARDS, BOARD, PLAYER_COLORS, PLAYER_AVATARS } from './gameData'
import './App.css'

const STARS = [
  { x: '7%',  y: '10%', delay: 0    },
  { x: '28%', y: '6%',  delay: 1.2  },
  { x: '52%', y: '13%', delay: 2.4  },
  { x: '76%', y: '8%',  delay: 0.6  },
  { x: '93%', y: '18%', delay: 1.8  },
  { x: '12%', y: '52%', delay: 3.0  },
  { x: '88%', y: '46%', delay: 0.3  },
  { x: '38%', y: '78%', delay: 2.1  },
  { x: '64%', y: '70%', delay: 1.5  },
  { x: '22%', y: '85%', delay: 2.7  },
]

function StarParticle({ x, y, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: [0, -40] }}
      transition={{ duration: 2, delay, repeat: Infinity, repeatDelay: Math.random() * 4 }}
      style={{
        position: 'absolute', left: x, top: y,
        color: '#f0c040', fontSize: '0.7rem', pointerEvents: 'none',
      }}
    >✦</motion.div>
  )
}

function ItemOverflowModal({ player, newItem, onKeepNew, onDiscard, onDecline }) {
  const color = PLAYER_COLORS[player.colorIndex ?? 0]
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, backdropFilter: 'blur(4px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          border: `3px solid ${color}`, borderRadius: '24px',
          padding: '28px 32px', maxWidth: '420px', width: '90%',
          textAlign: 'center',
          boxShadow: `0 0 40px ${color}44`,
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>{newItem.icon}</div>
        <div style={{ color: '#f0c040', fontSize: '1.1rem', fontWeight: 900, marginBottom: '6px' }}>
          Inventaire plein !
        </div>
        <div style={{ color: '#aaa', fontSize: '0.95rem', marginBottom: '20px' }}>
          {player.name} a déjà 3 objets. Choisissez quoi jeter, ou refusez le nouvel objet.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {player.items.map(item => (
            <motion.button
              key={item.uid}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDiscard(item.uid)}
              style={{
                background: 'rgba(220,38,38,0.15)', border: '2px solid rgba(220,38,38,0.4)',
                borderRadius: '14px', padding: '10px 16px',
                color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '12px',
                fontSize: '1rem', fontWeight: 700,
              }}
            >
              <span style={{ fontSize: '1.6rem' }}>{item.icon}</span>
              <span style={{ flex: 1, textAlign: 'left' }}>{item.name}</span>
              <span style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>🗑 Jeter</span>
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onDecline}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.15)',
              borderRadius: '14px', padding: '10px 16px',
              color: '#888', cursor: 'pointer',
              fontSize: '0.95rem', fontWeight: 700, marginTop: '4px',
            }}
          >
            ✕ Refuser {newItem.name}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function MinimapOverlay({ players, onClose }) {
  const N = 8, GAP = 0
  const SQ = Math.min(90, Math.max(44, Math.floor(((typeof window !== 'undefined' ? window.innerHeight : 700) - 260 - (N-1)*GAP) / N)))

  const SQ_COLORS = {
    depart:    'checkered',
    arrivee:   'checkered',
    objet:     '#15803d',
    evenement: '#b45309',
    boutique:  '#1d4ed8',
    offre:     '#6d28d9',
    neutre:    '#374151',
  }
  const SQ_LABELS = [
    { key: 'depart',    label: 'Départ / Arrivée', checkered: true  },
    { key: 'objet',     label: 'Objet',             checkered: false },
    { key: 'evenement', label: 'Événement',          checkered: false },
    { key: 'boutique',  label: 'Boutique',           checkered: false },
    { key: 'offre',     label: 'Offre Spéciale',     checkered: false },
    { key: 'neutre',    label: 'Neutre',             checkered: false },
  ]

  const spiralGrid = Array.from({ length: N }, () => Array(N).fill(null))
  let top = 0, bottom = N - 1, left = 0, right = N - 1, si = 0
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) spiralGrid[top][c] = si++
    top++
    for (let r = top; r <= bottom; r++) spiralGrid[r][right] = si++
    right--
    if (top <= bottom) { for (let c = right; c >= left; c--) spiralGrid[bottom][c] = si++; bottom-- }
    if (left <= right) { for (let r = bottom; r >= top; r--) spiralGrid[r][left] = si++; left++ }
  }

  const posMap = Array(64)
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      if (spiralGrid[r][c] !== null) posMap[spiralGrid[r][c]] = [r, c]

  const WALL = '4px solid #000'
  const OPEN = '0px solid transparent'

  const getBorders = (idx) => {
    const [r, c] = posMap[idx]
    const check = (dr, dc) => {
      const nr = r + dr, nc = c + dc
      if (nr < 0 || nr >= N || nc < 0 || nc >= N) return false
      const ni = spiralGrid[nr][nc]
      return ni === idx - 1 || ni === idx + 1
    }
    return {
      borderTop:    check(-1, 0) ? OPEN : WALL,
      borderRight:  check(0,  1) ? OPEN : WALL,
      borderBottom: check(1,  0) ? OPEN : WALL,
      borderLeft:   check(0, -1) ? OPEN : WALL,
    }
  }

  const playersBySquare = {}
  players.forEach(p => {
    const pos = Math.min(p.diceTotal ?? 0, 63)
    if (!playersBySquare[pos]) playersBySquare[pos] = []
    playersBySquare[pos].push(p)
  })

  const totalW = N * SQ + (N - 1) * GAP

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 800,
        background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(7px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ scale: 0.82, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.82, opacity: 0, y: 24 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, rgba(6,4,20,0.99), rgba(14,8,38,0.99))',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '22px', padding: '12px 14px 10px',
          boxShadow: '0 24px 72px rgba(0,0,0,0.8)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
        }}
      >
        <div style={{
          color: '#f0c040', fontFamily: '"Fredoka One", sans-serif',
          fontSize: '1.1rem', letterSpacing: '3px',
        }}>🗺 MINIMAP</div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${N}, ${SQ}px)`, gridTemplateRows: `repeat(${N}, ${SQ}px)`, gap: `${GAP}px` }}>
          {Array.from({ length: N }, (_, row) =>
            Array.from({ length: N }, (_, col) => {
              const idx = spiralGrid[row][col]
              const sq = BOARD[idx]
              const pieces = playersBySquare[idx] || []
              const isCheckered = sq === 'depart' || sq === 'arrivee'
              const bg = SQ_COLORS[sq] || '#374151'
              const hasPieces = pieces.length > 0
              const borders = getBorders(idx)
              return (
                <div key={`${row}-${col}`} style={{
                  width: SQ, height: SQ,
                  background: isCheckered ? undefined : bg,
                  backgroundImage: isCheckered ? 'repeating-conic-gradient(#111 0% 25%, #ddd 0% 50%)' : undefined,
                  backgroundSize: isCheckered ? '50% 50%' : undefined,
                  borderRadius: 0, position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'visible', boxSizing: 'border-box',
                  ...borders,
                  boxShadow: hasPieces ? 'inset 0 0 0 2px #fff, 0 0 8px rgba(255,255,255,0.4)' : 'none',
                }}>
                  {!hasPieces && (
                    <span style={{ fontSize: `${Math.max(8, Math.floor(SQ * 0.19))}px`, color: isCheckered ? '#888' : 'rgba(255,255,255,0.45)', lineHeight: 1, userSelect: 'none', fontWeight: 700 }}>
                      {idx}
                    </span>
                  )}
                  {hasPieces && (
                    <span style={{ fontSize: `${Math.floor(SQ * (pieces.length > 1 ? 0.38 : 0.48))}px`, lineHeight: 1, zIndex: 1 }}>
                      {PLAYER_AVATARS[pieces[0].colorIndex ?? 0]}
                    </span>
                  )}
                  {pieces.length > 1 && (
                    <span style={{ position: 'absolute', top: -4, right: -4, fontSize: '9px', color: '#f0c040', fontWeight: 900, lineHeight: 1, background: 'rgba(0,0,0,0.8)', borderRadius: '50%', padding: '1px 3px', zIndex: 2 }}>
                      +{pieces.length - 1}
                    </span>
                  )}
                </div>
              )
            })
          ).flat()}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', justifyContent: 'center', maxWidth: `${totalW}px` }}>
          {SQ_LABELS.map(({ key, label, checkered }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{
                width: 14, height: 14, borderRadius: '3px', flexShrink: 0,
                background: checkered ? undefined : SQ_COLORS[key],
                backgroundImage: checkered ? 'repeating-conic-gradient(#111 0% 25%, #ddd 0% 50%)' : undefined,
                backgroundSize: checkered ? '50% 50%' : undefined,
                border: '1px solid rgba(255,255,255,0.18)',
              }} />
              <span style={{ color: '#ccc', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
          ))}
        </div>

        <motion.button whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }} onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)',
            borderRadius: '20px', padding: '5px 22px', color: '#777',
            fontSize: '0.76rem', cursor: 'pointer', letterSpacing: '1px',
          }}
        >✕ Fermer</motion.button>
      </motion.div>
    </motion.div>
  )
}

function App() {
  const [gamePhase, setGamePhase] = useState('setup')
  const [squareMode, setSquareMode] = useState(null)
  const [players, setPlayers] = useState([])
  const [orderedIds, setOrderedIds] = useState([])
  const [turnIndex, setTurnIndex] = useState(0)
  const [overflowData, setOverflowData] = useState(null)
  const [finishOrder, setFinishOrder] = useState([])
  const [roundCount, setRoundCount] = useState(1)
  const [finishEvent, setFinishEvent] = useState(null)
  const [shopDiscountRounds, setShopDiscountRounds] = useState(0)
  const pendingFinishRef = useRef(null)
  const pendingSquareRef = useRef(null)

  const activePlayerId = orderedIds[turnIndex] ?? null
  const activePlayer = players.find(p => p.id === activePlayerId) ?? null

  const handleSetupComplete = useCallback((setupPlayers) => {
    setPlayers(setupPlayers.map(p => ({ ...p, diceTotal: 0 })))
    setGamePhase('order-roll')
  }, [])

  const handleOrderDecided = useCallback((ordered) => {
    setOrderedIds(ordered.map(p => p.id))
    setTurnIndex(0)
    setGamePhase('game')
  }, [])

  const handleEndTurn = useCallback((rollTotal = 0) => {
    if (!activePlayerId) return
    const currentTotal = Math.min((activePlayer?.diceTotal ?? 0) + rollTotal, 63)

    // Find the next index of a player who hasn't finished the race.
    const n = orderedIds.length
    const startCandidate = (turnIndex + 1) % n

    const isFinishedId = (id) => finishOrder.find(f => f.id === id)

    const findNextAvailableIndex = (fromIdx) => {
      let i = fromIdx
      for (let t = 0; t < n; t++) {
        const id = orderedIds[i]
        if (!isFinishedId(id)) return i
        i = (i + 1) % n
      }
      return fromIdx
    }

    const nextIdx = startCandidate
    const nextPlayer = players.find(p => p.id === orderedIds[nextIdx])
    const nextSkips = nextPlayer?.skipNextTurn ?? false
    // If next player is skipped, begin search after them
    const actualNextIdx = nextSkips ? findNextAvailableIndex((nextIdx + 1) % n) : findNextAvailableIndex(nextIdx)

    setPlayers(ps => ps.map(p => {
      if (p.id === activePlayerId) {
        const abonCost = p.items?.some(i => i.id === 'abonnement') ? 2 : 0
        return { ...p, diceTotal: currentTotal, skipNextTurn: false, money: p.money - abonCost }
      }
      if (nextSkips && p.id === orderedIds[nextIdx]) return { ...p, skipNextTurn: false }
      return p
    }))

    const justFinished = currentTotal >= 63 && !finishOrder.find(f => f.id === activePlayerId)
    let newFinishOrder = finishOrder
    if (justFinished) newFinishOrder = [...finishOrder, { id: activePlayerId, round: roundCount }]

    const isLastFinisher = newFinishOrder.length >= orderedIds.length - 1

    const doAdvance = () => {
      // If we looped back to player 0, start a new round
      if (actualNextIdx === 0) {
        setRoundCount(r => r + 1)
        setShopDiscountRounds(r => Math.max(0, r - 1))
      }
      setTurnIndex(actualNextIdx)
      setSquareMode(null)
    }

    if (isLastFinisher) {
      const remainingId = orderedIds.find(id => !newFinishOrder.find(f => f.id === id)) ?? null
      const finalOrder = remainingId
        ? [...newFinishOrder, { id: remainingId, round: Infinity }]
        : newFinishOrder
      setFinishOrder(finalOrder)
      if (justFinished) {
        setFinishEvent({ player: activePlayer, position: newFinishOrder.length, isGameOver: true })
        pendingFinishRef.current = () => setGamePhase('gameover')
      } else {
        setGamePhase('gameover')
      }
      return
    }

    setFinishOrder(newFinishOrder)

    if (justFinished) {
      setFinishEvent({ player: activePlayer, position: newFinishOrder.length, isGameOver: false })
      pendingFinishRef.current = doAdvance
      return
    }

    const sq = BOARD[Math.min(currentTotal, 63)]
    if (!sq || sq === 'neutre' || sq === 'depart' || sq === 'arrivee') {
      doAdvance()
    } else {
      pendingSquareRef.current = doAdvance
      setSquareMode(sq)
    }
  }, [activePlayerId, activePlayer, finishOrder, orderedIds, turnIndex, players, roundCount])

  const handleContinueFinish = useCallback(() => {
    setFinishEvent(null)
    const fn = pendingFinishRef.current
    pendingFinishRef.current = null
    fn?.()
  }, [])

  const handleSquareDone = useCallback(() => {
    const fn = pendingSquareRef.current
    pendingSquareRef.current = null
    fn?.()
  }, [])

  const addItemToPlayer = useCallback((playerId, newItem) => {
    const player = players.find(p => p.id === playerId)
    if (!player) return
    const item = { ...newItem, uid: `${newItem.id}-${Date.now()}-${Math.random()}` }
    if (player.items.length >= 3) {
      setOverflowData({ playerId, newItem: item })
      return
    }
    setPlayers(ps => ps.map(p => p.id !== playerId ? p : { ...p, items: [...p.items, item] }))
  }, [players])

  const spendMoney = useCallback((playerId, amount) => {
    setPlayers(ps => {
      const updatedPlayers = ps.map(p => p.id === playerId ? { ...p, money: p.money - amount } : p)
      
      // Give +2€ to each player with a contract when another player spends money
      if (amount > 0) {
        return updatedPlayers.map(p => {
          if (p.id !== playerId) {
            const contractCount = p.items.filter(item => item.id === 'contrat').length
            if (contractCount > 0) {
              return { ...p, money: p.money + (2 * contractCount) }
            }
          }
          return p
        })
      }
      
      return updatedPlayers
    })
  }, [])

  const modifyPosition = useCallback((playerId, delta) => {
    setPlayers(ps => ps.map(p => p.id === playerId
      ? { ...p, diceTotal: Math.max(0, (p.diceTotal ?? 0) + delta) } : p))
  }, [])

  const skipTurnForPlayer = useCallback((playerId) => {
    setPlayers(ps => ps.map(p => p.id === playerId ? { ...p, skipNextTurn: true } : p))
  }, [])

  const swapPlayers = useCallback((id1, id2) => {
    setPlayers(ps => {
      const p1 = ps.find(p => p.id === id1)
      const p2 = ps.find(p => p.id === id2)
      if (!p1 || !p2) return ps
      return ps.map(p => {
        if (p.id === id1) return { ...p, diceTotal: p2.diceTotal }
        if (p.id === id2) return { ...p, diceTotal: p1.diceTotal }
        return p
      })
    })
  }, [])

  const buyItem = useCallback((playerId, itemId, overrideCost) => {
    const item = ALL_SHOP_ITEMS.find(i => i.id === itemId)
    if (!item) return
    const player = players.find(p => p.id === playerId)
    const cost = overrideCost ?? item.cost
    if (!player || player.money < cost) return
    const newItem = { ...item, uid: `${itemId}-${Date.now()}-${Math.random()}` }
    if (player.items.length >= 3) {
      setPlayers(ps => ps.map(p => p.id !== playerId ? p : ({
        ...p,
        money: p.money - cost,
        lastPurchaseCost: cost,
        lastPurchaseItemId: itemId,
      })))
      setOverflowData({ playerId, newItem })
      return
    }
    setPlayers(ps => ps.map(p => p.id !== playerId ? p : ({
      ...p,
      money: p.money - cost,
      items: [...p.items, newItem],
      lastPurchaseCost: cost,
      lastPurchaseItemId: itemId,
    })))
  }, [players])

  const consumeItem = useCallback((playerId, uid) => {
    setPlayers(ps => ps.map(p =>
      p.id !== playerId ? p : { ...p, items: p.items.filter(i => i.uid !== uid) }
    ))
  }, [])

  const cursePlayer = useCallback((playerId) => {
    setPlayers(ps => ps.map(p => p.id === playerId ? { ...p, cursed: true } : p))
  }, [])

  const clearCurse = useCallback((playerId) => {
    setPlayers(ps => ps.map(p => p.id === playerId ? { ...p, cursed: false } : p))
  }, [])

  const [debugOpen, setDebugOpen] = useState(false)
  const [minimapOpen, setMinimapOpen] = useState(false)

  // Apply a shop-wide discount for `turns` rounds.
  // If a discount is already active, do not re-apply or extend it.
  const applyShopDiscount = useCallback((turns) => {
    setShopDiscountRounds(prev => prev > 0 ? prev : turns)
  }, [])

  const handleRestart = useCallback(() => {
    setPlayers([])
    setOrderedIds([])
    setTurnIndex(0)
    setFinishOrder([])
    setRoundCount(1)
    setShopDiscountRounds(0)
    setSquareMode(null)
    setGamePhase('setup')
  }, [])

  const handleOverflowDiscard = useCallback((discardUid) => {
    if (!overflowData) return
    const { playerId, newItem } = overflowData
    setPlayers(ps => ps.map(p => {
      if (p.id !== playerId) return p
      return { ...p, items: [...p.items.filter(i => i.uid !== discardUid), newItem] }
    }))
    setOverflowData(null)
  }, [overflowData])

  const handleOverflowDecline = useCallback(() => setOverflowData(null), [])

  const is5 = orderedIds.length === 5
  const si = { tl: 0, top: is5 ? 1 : null, tr: is5 ? 2 : 1, br: is5 ? 3 : 2, bl: is5 ? 4 : 3 }
  const slotPlayer = (idx) => (idx == null ? null : players.find(p => p.id === orderedIds[idx]) ?? null)

  const allTotals = players.map(p => p.diceTotal ?? 0)
  const maxTotal = allTotals.length ? Math.max(...allTotals) : 0
  const minTotal = allTotals.length ? Math.min(...allTotals) : 0
  const totalRange = maxTotal - minTotal
  const cardScale = (p) => {
    if (!p || totalRange === 0) return 1
    const norm = ((p.diceTotal ?? 0) - minTotal) / totalRange
    return 0.78 + norm * 0.40
  }

  return (
    <div className="app-root">
      {STARS.map((s, i) => <StarParticle key={i} x={s.x} y={s.y} delay={s.delay} />)}

      <TerminalOverlay />

      <AnimatePresence mode="wait">
        {gamePhase === 'setup' && (
          <SetupScreen key="setup" onStart={handleSetupComplete} />
        )}
        {gamePhase === 'order-roll' && (
          <OrderRoll key="order-roll" players={players} onOrderDecided={handleOrderDecided} />
        )}
      </AnimatePresence>

      <div style={{
        position: 'absolute', inset: 0,
        opacity: gamePhase === 'game' ? 1 : 0,
        pointerEvents: gamePhase === 'game' ? 'auto' : 'none',
        transition: 'opacity 0.4s',
      }}>
        <div style={{
          position: 'absolute', bottom: '72px', left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(10,8,30,0.7)', border: '1px solid rgba(240,192,64,0.25)',
          borderRadius: '20px', padding: '4px 16px',
          color: '#888', fontSize: '0.72rem', letterSpacing: '1.5px',
          backdropFilter: 'blur(8px)', zIndex: 5, pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}>TOUR {roundCount}</div>


        <div
          className="shop-layout tab-panel"
          style={{
            opacity: squareMode === 'boutique' ? 1 : 0,
            transform: `translateX(${squareMode === 'boutique' ? 0 : 40}px)`,
            pointerEvents: squareMode === 'boutique' ? 'auto' : 'none',
          }}
        >
          <Shop
            activePlayer={activePlayer}
            shopDiscountRounds={shopDiscountRounds}
            onBuy={buyItem}
            onSpendMoney={spendMoney}
            onDone={handleSquareDone}
          />
        </div>

        <div
          className="shop-layout tab-panel"
          style={{
            opacity: ['objet','offre','evenement'].includes(squareMode) ? 1 : 0,
            transform: `translateX(${['objet','offre','evenement'].includes(squareMode) ? 0 : 40}px)`,
            pointerEvents: ['objet','offre','evenement'].includes(squareMode) ? 'auto' : 'none',
          }}
        >
          <EventScreen
            activePlayer={activePlayer}
            players={players}
            onModifyPosition={modifyPosition}
            onSkipTurn={skipTurnForPlayer}
            onSpendMoney={spendMoney}
            onGainItem={addItemToPlayer}
            onSetShopDiscount={applyShopDiscount}
            startMode={squareMode}
            onDone={handleSquareDone}
          />
        </div>

        <div
          className="game-layout tab-panel"
          style={{
            opacity: squareMode === null ? 1 : 0,
            transform: `translateX(${squareMode === null ? 0 : -40}px)`,
            pointerEvents: squareMode === null ? 'auto' : 'none',
          }}
        >
          {slotPlayer(si.top) && (
            <div className="player-top" style={{ pointerEvents: 'auto' }}>
              <div style={{ transform: `scale(${cardScale(slotPlayer(si.top))})`, transformOrigin: 'top center', transition: 'transform 0.6s ease' }}>
                <PlayerCard
                  player={slotPlayer(si.top)}
                  index={slotPlayer(si.top).colorIndex}
                  isActive={activePlayerId === orderedIds[si.top]}
                  itemsOnSide
                />
              </div>
            </div>
          )}

          {slotPlayer(si.tl) && (
            <div className="player-corner corner-tl" style={{ pointerEvents: 'auto' }}>
              <div style={{ transform: `scale(${cardScale(slotPlayer(si.tl))})`, transformOrigin: 'top left', transition: 'transform 0.6s ease' }}>
                <PlayerCard
                  player={slotPlayer(si.tl)}
                  index={slotPlayer(si.tl).colorIndex}
                  isActive={activePlayerId === orderedIds[si.tl]}
                  itemsOnSide
                />
              </div>
            </div>
          )}
          {slotPlayer(si.tr) && (
            <div className="player-corner corner-tr" style={{ pointerEvents: 'auto' }}>
              <div style={{ transform: `scale(${cardScale(slotPlayer(si.tr))})`, transformOrigin: 'top right', transition: 'transform 0.6s ease' }}>
                <PlayerCard
                  player={slotPlayer(si.tr)}
                  index={slotPlayer(si.tr).colorIndex}
                  isActive={activePlayerId === orderedIds[si.tr]}
                  itemsOnSide
                />
              </div>
            </div>
          )}

          <div className="center-area">
            <GameMat
              gameName="REGAME AWAKE"
              activePlayer={activePlayer}
              activePlayers={players}
              onConsumeItem={consumeItem}
              onCursePlayer={cursePlayer}
              onClearCurse={clearCurse}
              onEndTurn={handleEndTurn}
              onSkipTurn={skipTurnForPlayer}
              onSwapPlayers={swapPlayers}
              onModifyPosition={modifyPosition}
            />
          </div>

          {slotPlayer(si.bl) && (
            <div className="player-corner corner-bl" style={{ pointerEvents: 'auto' }}>
              <div style={{ transform: `scale(${cardScale(slotPlayer(si.bl))})`, transformOrigin: 'bottom left', transition: 'transform 0.6s ease' }}>
                <PlayerCard
                  player={slotPlayer(si.bl)}
                  index={slotPlayer(si.bl).colorIndex}
                  isActive={activePlayerId === orderedIds[si.bl]}
                  itemsOnSide
                />
              </div>
            </div>
          )}
          {slotPlayer(si.br) && (
            <div className="player-corner corner-br" style={{ pointerEvents: 'auto' }}>
              <div style={{ transform: `scale(${cardScale(slotPlayer(si.br))})`, transformOrigin: 'bottom right', transition: 'transform 0.6s ease' }}>
                <PlayerCard
                  player={slotPlayer(si.br)}
                  index={slotPlayer(si.br).colorIndex}
                  isActive={activePlayerId === orderedIds[si.br]}
                  itemsOnSide
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {gamePhase === 'game' && debugOpen && (
          <motion.div
            key="debug"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', bottom: '56px', right: '12px',
              background: 'rgba(8,6,24,0.97)', border: '1px solid rgba(240,192,64,0.35)',
              borderRadius: '16px', padding: '12px 14px', zIndex: 9999,
              backdropFilter: 'blur(16px)', minWidth: '260px', maxWidth: '320px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{ color: '#f0c040', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '2px', marginBottom: '10px' }}>🐛 DEBUG — TOUR {roundCount}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {orderedIds.map((id, idx) => {
                const p = players.find(pl => pl.id === id)
                if (!p) return null
                const pc = PLAYER_COLORS[p.colorIndex ?? 0]
                const av = PLAYER_AVATARS[p.colorIndex ?? 0]
                const isActive = p.id === activePlayerId
                return (
                  <div key={p.id} style={{
                    background: isActive ? `${pc}18` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isActive ? pc + '55' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '10px', padding: '6px 10px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{av}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: pc, fontWeight: 800, fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                        {isActive && <span style={{ background: pc + '33', color: pc, fontSize: '0.58rem', fontWeight: 800, padding: '1px 5px', borderRadius: '6px', flexShrink: 0 }}>ACTIF</span>}
                        {p.skipNextTurn && <span style={{ background: '#ef444422', color: '#ef4444', fontSize: '0.58rem', fontWeight: 800, padding: '1px 5px', borderRadius: '6px', flexShrink: 0 }}>SKIP</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>📍 Case <span style={{ color: '#fff', fontWeight: 700 }}>{p.diceTotal ?? 0}</span>/63</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>💰 <span style={{ color: '#f0c040', fontWeight: 700 }}>{p.money ?? 0}€</span></span>
                      </div>
                      {p.items?.length > 0 && (
                        <div style={{ display: 'flex', gap: '3px', marginTop: '3px', flexWrap: 'wrap' }}>
                          {p.items.map(it => (
                            <span key={it.uid} title={it.name} style={{
                              fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)',
                              borderRadius: '5px', padding: '1px 4px',
                            }}>{it.icon}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span style={{ color: '#444', fontSize: '0.65rem', flexShrink: 0 }}>#{idx + 1}</span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {gamePhase === 'game' && (
        <div style={{
          position: 'fixed', bottom: '14px', left: 0, right: 0,
          display: 'flex', justifyContent: 'center',
          pointerEvents: 'none', zIndex: 9999,
        }}>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setMinimapOpen(o => !o)}
            style={{
              pointerEvents: 'auto',
              height: '36px', borderRadius: '18px', padding: '0 16px',
              background: minimapOpen ? 'rgba(240,192,64,0.2)' : 'rgba(255,255,255,0.07)',
              border: `1px solid ${minimapOpen ? 'rgba(240,192,64,0.55)' : 'rgba(255,255,255,0.14)'}`,
              color: minimapOpen ? '#f0c040' : '#666',
              fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1.5px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              backdropFilter: 'blur(8px)', whiteSpace: 'nowrap',
            }}
          >🗺 MINIMAP</motion.button>
        </div>
      )}

      {gamePhase === 'game' && (
        <motion.button
          whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }}
          onClick={() => setDebugOpen(o => !o)}
          style={{
            position: 'fixed', bottom: '14px', right: '14px',
            width: '36px', height: '36px', borderRadius: '50%',
            background: debugOpen ? 'rgba(240,192,64,0.22)' : 'rgba(255,255,255,0.07)',
            border: `1px solid ${debugOpen ? 'rgba(240,192,64,0.6)' : 'rgba(255,255,255,0.15)'}`,
            color: debugOpen ? '#f0c040' : '#555',
            fontSize: '1rem', cursor: 'pointer', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}
          title="Debug"
        >🐛</motion.button>
      )}

      <AnimatePresence>
        {minimapOpen && gamePhase === 'game' && (
          <MinimapOverlay key="minimap" players={players} onClose={() => setMinimapOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {finishEvent && (
          <FinishOverlay key="finish" event={finishEvent} onContinue={handleContinueFinish} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gamePhase === 'gameover' && (
          <GameOver
            key="gameover"
            players={players}
            finishOrder={finishOrder}
            roundCount={roundCount}
            onRestart={handleRestart}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {overflowData && (() => {
          const player = players.find(p => p.id === overflowData.playerId)
          return player ? (
            <ItemOverflowModal
              key="overflow"
              player={player}
              newItem={overflowData.newItem}
              onDiscard={handleOverflowDiscard}
              onDecline={handleOverflowDecline}
            />
          ) : null
        })()}
      </AnimatePresence>
    </div>
  )
}

function FinishOverlay({ event, onContinue }) {
  const { player, position, isGameOver } = event
  const color = PLAYER_COLORS[player.colorIndex ?? 0]
  const avatar = PLAYER_AVATARS[player.colorIndex ?? 0]
  const medals = ['🥇', '🥈', '🥉', '🏅', '🏅']
  const medal = medals[Math.min(position - 1, 4)]
  const ordinal = position === 1 ? '1ère' : `${position}ème`
  const sparks = [
    [-150,-90],[150,-90],[-180,10],[180,10],
    [-120,100],[120,100],[0,-140],[-70,-115],[70,-115],
    [-55,140],[55,140],[-190,55],[190,55],
  ]
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(4,4,16,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(10px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.08 }}
        style={{
          position: 'relative', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '18px',
          background: 'linear-gradient(135deg, rgba(8,6,24,0.98), rgba(16,10,42,0.98))',
          border: `3px solid ${color}`, borderRadius: '28px', padding: '40px 52px',
          boxShadow: `0 0 70px ${color}44, 0 0 140px ${color}18`, zIndex: 1,
        }}
      >
        {sparks.map(([x, y], i) => (
          <motion.div key={i}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.4, 0], x, y }}
            transition={{ duration: 1.8, delay: 0.15 + i * 0.09, repeat: Infinity, repeatDelay: 0.8 }}
            style={{ position: 'absolute', fontSize: '1.1rem', color: i % 2 === 0 ? '#f0c040' : color, pointerEvents: 'none' }}
          >✦</motion.div>
        ))}
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
          style={{ fontSize: '3.5rem' }}>{medal}</motion.div>
        <motion.div
          animate={{ filter: [`drop-shadow(0 0 8px ${color})`, `drop-shadow(0 0 22px ${color})`, `drop-shadow(0 0 8px ${color})`] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          style={{ fontSize: '4rem' }}>{avatar}</motion.div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color, fontFamily: '"Fredoka One", sans-serif', fontSize: '2rem', letterSpacing: '2px' }}>{player.name}</div>
          <div style={{ color: '#f0c040', fontWeight: 800, fontSize: '1.1rem', marginTop: '4px', letterSpacing: '1px' }}>
            {ordinal} place 🏁
          </div>
        </div>
        <div style={{ color: '#888', fontSize: '0.82rem', textAlign: 'center' }}>
          {isGameOver ? '🏆 Dernière arrivée — la partie est terminée !' : 'A rejoint la ligne d\'arrivée !'}
        </div>
        <motion.button whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }} onClick={onContinue}
          style={{
            background: isGameOver ? 'linear-gradient(135deg,#f0c040,#d97706)' : `linear-gradient(135deg,${color},${color}bb)`,
            border: `2px solid ${isGameOver ? '#f0c040' : color}`,
            borderRadius: '26px', padding: '11px 40px',
            color: isGameOver ? '#1a1a2e' : '#fff', fontWeight: 900, fontSize: '1rem',
            fontFamily: '"Fredoka One", sans-serif', letterSpacing: '2px', cursor: 'pointer',
            boxShadow: isGameOver ? '0 4px 22px rgba(240,192,64,0.55)' : `0 4px 18px ${color}55`,
          }}
        >{isGameOver ? '🏆 VOIR LES RÉSULTATS' : '▶ CONTINUER'}</motion.button>
      </motion.div>
    </motion.div>
  )
}

function EventScreen({ activePlayer, players, onModifyPosition, onSkipTurn, onSpendMoney, onGainItem, onSetShopDiscount, startMode, onDone }) {
  const [mode, setMode] = useState(null)
  const [drawn, setDrawn] = useState(null)
  const [flipping, setFlipping] = useState(false)
  const [rollCount, setRollCount] = useState(0)
  const [dieFinal, setDieFinal] = useState(null)
  const [dieRolling, setDieRolling] = useState(false)
  const [targetId, setTargetId] = useState(null)
  const [applied, setApplied] = useState(false)
  const [spinPhase, setSpinPhase] = useState('idle')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [winner, setWinner] = useState(null)
  const [offerLocked, setOfferLocked] = useState(false)
  const [, setEventReveal] = useState(false)
  const stripRef = useRef(null)
  const eventRevealTimerRef = useRef(null)
  const SLOT_REPS = 12, ITEM_W = 86, SLOT_GAP = 10, SLOT_STEP = 96
  const SLOT_VISIBLE = 5, SLOT_W = SLOT_VISIBLE * SLOT_STEP - SLOT_GAP
  const INITIAL_IDX = 2

  const mkStrip = () => {
    const shuffle = (arr) => { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]} return a }
    return [...Array(SLOT_REPS)].flatMap(() => shuffle(SHOP_ITEMS))
  }
  const randomEvent = () => EVENT_CARDS[Math.floor(Math.random() * EVENT_CARDS.length)]
  const [stripItems, setStripItems] = useState(mkStrip)

  useEffect(() => {
    setMode(null)
    setDrawn(null); setFlipping(false); setRollCount(0)
    setDieFinal(null); setDieRolling(false); setTargetId(null); setApplied(false)
    setSpinPhase('idle'); setCurrentIdx(0); setWinner(null)
    setStripItems(mkStrip())
  }, [activePlayer?.id])

  useEffect(() => {
    if (!startMode) return
    const m = startMode === 'objet' ? 'roulette' : startMode
    setMode(m)
    setDrawn(null); setFlipping(false); setRollCount(0)
    setDieFinal(null); setDieRolling(false); setTargetId(null); setApplied(false)
    setOfferLocked(false)
    setSpinPhase('idle'); setWinner(null)
    setStripItems(mkStrip())
    if (m === 'evenement') {
      setEventReveal(false)
      if (eventRevealTimerRef.current) clearTimeout(eventRevealTimerRef.current)
      eventRevealTimerRef.current = setTimeout(() => {
        setDrawn(randomEvent())
        setEventReveal(true)
      }, 900)
    }
    return () => {
      if (eventRevealTimerRef.current) clearTimeout(eventRevealTimerRef.current)
    }
  }, [startMode])

  const SLOT_CENTER = Math.floor(SLOT_W / 2 - ITEM_W / 2)
  const slotOffset = (i) => -i * SLOT_STEP + SLOT_CENTER

  const startSpin = () => {
    if (spinPhase !== 'idle' || !stripRef.current) return
    const n = SHOP_ITEMS.length
    const spinTarget = INITIAL_IDX + 8 * n + Math.floor(Math.random() * n)
    const winItem = stripItems[spinTarget]
    setSpinPhase('spinning')
    setWinner(null)
    const el = stripRef.current
    el.style.transition = 'none'
    el.style.transform = `translateX(${slotOffset(INITIAL_IDX)}px)`
    void el.offsetHeight
    el.style.transition = 'transform 3.3s cubic-bezier(0.25, 0.8, 0.35, 1)'
    el.style.transform = `translateX(${slotOffset(spinTarget)}px)`
    setTimeout(() => {
      setWinner(winItem)
      setSpinPhase('won')
    }, 3300)
  }

  const claimRoulette = () => {
    if (!winner || !activePlayer) return
    onGainItem?.(activePlayer.id, winner)
    setSpinPhase('claimed')
  }

  const contBtn = onDone ? (
    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
      whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }} onClick={onDone}
      style={{
        background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', border: '2px solid #a78bfa',
        borderRadius: '22px', padding: '9px 28px', color: '#fff', fontWeight: 900,
        fontSize: '0.9rem', cursor: 'pointer', letterSpacing: '1.5px',
        boxShadow: '0 4px 14px rgba(124,58,237,0.5)', flexShrink: 0,
      }}
    >▶ CONTINUER</motion.button>
  ) : null

  const drawCard = () => {
    if (flipping || !activePlayer || activePlayer.money < 4) return
    onSpendMoney?.(activePlayer.id, 4)
    setOfferLocked(true)
    setFlipping(true)
    setDrawn(null); setDieFinal(null); setTargetId(null); setApplied(false); setRollCount(0); setDieRolling(false)
    setTimeout(() => {
      setDrawn(SPECIAL_EVENT_CARDS[Math.floor(Math.random() * SPECIAL_EVENT_CARDS.length)])
      setFlipping(false)
    }, 380)
  }

  const handleDieResult = ({ die1 }) => { setDieFinal(die1); setDieRolling(false) }

  const rollDie = () => {
    if (dieRolling || dieFinal) return
    setDieRolling(true)
    setRollCount(c => c + 1)
  }

  const otherPlayers = (players ?? []).filter(p => p.id !== activePlayer?.id)
  const color = PLAYER_COLORS[activePlayer?.colorIndex ?? 0]
  const isFinishedActive = (activePlayer?.diceTotal ?? 0) >= 63
  const targetableOtherPlayers = otherPlayers.filter(p => (p.diceTotal ?? 0) < 63)

  const lootEffect = drawn?.id === 'loot_box' && dieFinal ? (
    dieFinal <= 2 ? { text: 'Perdre 4€', col: '#ef4444', fn: () => onSpendMoney?.(activePlayer.id, 4) } :
    dieFinal <= 4 ? { text: 'Avancer de 4 cases', col: '#22c55e', fn: () => onModifyPosition?.(activePlayer.id, 4) } :
    dieFinal === 5 ? { text: 'Avancer de 6 cases', col: '#22c55e', fn: () => onModifyPosition?.(activePlayer.id, 6) } :
    { text: 'Avancer de 8 cases', col: '#22c55e', fn: () => onModifyPosition?.(activePlayer.id, 8) }
  ) : null

  const ddosOutcome = drawn?.id === 'ddos' && dieFinal ? (dieFinal <= 3 ? 'self' : 'other') : null

  const canApply = !applied && !isFinishedActive && (
    mode === 'evenement' ? !!drawn :
    (drawn?.id === 'loot_box' && !!lootEffect) ||
    (drawn?.id === 'eject' && !!targetId) ||
    (drawn?.id === 'ddos' && (ddosOutcome === 'self' || (ddosOutcome === 'other' && !!targetId)))
  )

  const handleApply = () => {
    if (!canApply) return
    if (mode === 'evenement') {
      if (!drawn) return
      const alivePlayers = players.filter(p => (p.diceTotal ?? 0) < 63)
      if (drawn.id === 'weekend_double_xp') {
        alivePlayers.forEach(p => onModifyPosition?.(p.id, 3))
      } else if (drawn.id === 'report') {
        alivePlayers.forEach(p => onModifyPosition?.(p.id, -3))
      } else if (drawn.id === 'soldes') {
        onSetShopDiscount?.(2)
      } else if (drawn.id === 'acces_payant') {
        alivePlayers.forEach(p => onSpendMoney?.(p.id, 5))
      } else if (drawn.id === 'remboursement') {
        alivePlayers.forEach(p => {
          const refund = Math.floor((p.lastPurchaseCost ?? 0) / 2)
          if (refund > 0) onSpendMoney?.(p.id, -refund)
        })
      }
    } else {
      if (drawn.id === 'loot_box') lootEffect.fn()
      else if (drawn.id === 'eject') onModifyPosition?.(targetId, -6)
      else if (drawn.id === 'ddos') onSkipTurn?.(ddosOutcome === 'self' ? activePlayer.id : targetId)
    }
    setApplied(true)
  }

  const rollBtn = !dieFinal && (
    <motion.button
      whileHover={!dieRolling ? { scale: 1.07 } : {}}
      whileTap={!dieRolling ? { scale: 0.93 } : {}}
      onClick={rollDie} disabled={dieRolling}
      style={{
        background: dieRolling ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${drawn?.color ?? '#888'}, ${drawn?.color ?? '#888'}cc)`,
        border: `2px solid ${drawn?.color ?? '#888'}`,
        borderRadius: '24px', padding: '8px 22px',
        color: dieRolling ? '#555' : '#fff',
        fontWeight: 900, fontSize: '0.88rem', cursor: dieRolling ? 'not-allowed' : 'pointer', flexShrink: 0,
      }}
    >🎲 Lancer le dé</motion.button>
  )

  const targetPicker = (label) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%' }}>
      <div style={{ color: '#aaa', fontSize: '0.72rem', letterSpacing: '1.5px', fontWeight: 700 }}>{label}</div>
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {targetableOtherPlayers.length > 0 ? targetableOtherPlayers.map(p => {
          const pc = PLAYER_COLORS[p.colorIndex ?? 0]; const sel = targetId === p.id
          return (
            <motion.button key={p.id} whileTap={{ scale: 0.88 }}
              onClick={() => setTargetId(prev => prev === p.id ? null : p.id)}
              style={{
                background: sel ? `${pc}28` : 'rgba(255,255,255,0.07)',
                border: `2px solid ${sel ? pc : 'rgba(255,255,255,0.15)'}`,
                borderRadius: '9px', padding: '4px 10px', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px',
                boxShadow: sel ? `0 0 8px ${pc}55` : 'none',
                transition: 'all 0.15s', fontSize: '0.82rem', fontWeight: 700,
              }}
            >
              <span>{PLAYER_AVATARS[p.colorIndex ?? 0]}</span>
              <span style={{ color: sel ? pc : '#fff' }}>{p.name}</span>
            </motion.button>
          )
        }) : (
          <div style={{ color: '#aaa', fontSize: '0.75rem', textAlign: 'center', padding: '6px 10px' }}>Aucune cible disponible — tous sont arrivés.</div>
        )}
      </div>
    </div>
  )

  const PW = 248, PH = 350

  const playerBadge = (subtitle) => (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      style={{
        background: 'rgba(26,26,46,0.85)',
        border: `2px solid ${activePlayer ? color + '66' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px', padding: '7px 18px', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0,
      }}
    >
      {activePlayer ? (
        <>
          <span style={{ fontSize: '1.6rem', filter: `drop-shadow(0 0 6px ${color})` }}>
            {PLAYER_AVATARS[activePlayer.colorIndex ?? 0]}
          </span>
          <span style={{ color, fontWeight: 900, fontSize: '1.05rem' }}>{activePlayer.name}</span>
          <span style={{ color: '#aaa', fontSize: '0.82rem' }}>{subtitle}</span>
        </>
      ) : (
        <span style={{ color: '#555', fontStyle: 'italic', fontSize: '0.88rem' }}>
          🔒 Réservé au joueur actif sur une case Offre Spéciale
        </span>
      )}
    </motion.div>
  )

  if (mode === 'evenement') return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '20px',
    }}>
      <motion.h2 initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{
          fontFamily: '"Fredoka One", sans-serif', fontSize: '2.2rem', margin: 0,
          color: '#f0c040', letterSpacing: '3px',
        }}
      >🎴 ÉVÉNEMENT</motion.h2>
      {playerBadge('tombe sur un événement')}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
        style={{
          background: 'rgba(26,26,46,0.95)', border: '2px solid rgba(240,192,64,0.2)',
          borderRadius: '22px', padding: '20px 26px', width: '100%', maxWidth: '420px',
          textAlign: 'center', boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
        }}
      >
        {!drawn ? (
          <motion.div
            initial={{ y: -10, opacity: 0.75 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
          >
            <div style={{ fontSize: '3rem' }}>🔮</div>
            <div style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.05rem' }}>Tirage en cours...</div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>L'événement va se révéler sous peu</div>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.32 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>{drawn.icon}</div>
              <div style={{ color: drawn.color, fontWeight: 900, fontSize: '1.1rem', marginBottom: '10px' }}>{drawn.name}</div>
            </motion.div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {drawn.lines.map((line, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px 12px',
                  color: '#e5e7eb', fontSize: '0.88rem', lineHeight: 1.4,
                }}>
                  <div style={{ fontWeight: 800 }}>{line.label}</div>
                  {line.sub && <div style={{ color: '#9ca3af', fontSize: '0.78rem', marginTop: '4px' }}>{line.sub}</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {applied ? (
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '3rem' }}>✅</div>
          <div style={{ color: '#4ade80', fontWeight: 800, fontSize: '0.92rem', textAlign: 'center' }}>Effet appliqué !</div>
          {contBtn}
        </motion.div>
      ) : (
        <motion.button whileHover={drawn ? { scale: 1.06 } : {}}
          whileTap={drawn ? { scale: 0.94 } : {}}
          onClick={handleApply}
          disabled={!canApply}
          style={{
            background: drawn ? 'linear-gradient(135deg, #f0c040, #d97706)' : 'rgba(255,255,255,0.07)',
            border: '2px solid rgba(240,192,64,0.35)', borderRadius: '26px', padding: '12px 36px',
            color: drawn ? '#1a1a2e' : '#777', fontWeight: 900, fontSize: '0.95rem', cursor: drawn ? 'pointer' : 'not-allowed',
            letterSpacing: '1.5px', boxShadow: drawn ? '0 8px 26px rgba(240,192,64,0.35)' : 'none',
            opacity: drawn ? 1 : 0.6,
          }}
        >⚡ APPLIQUER L'ÉVÉNEMENT</motion.button>
      )}
    </div>
  )

  if (mode === null) return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '18px', padding: '16px 24px',
    }}>
      <motion.h2 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{
          fontFamily: '"Fredoka One", sans-serif', fontSize: '2rem', margin: 0,
          color: '#c084fc', letterSpacing: '3px',
        }}>🎴 ÉVÉNEMENT</motion.h2>
      {playerBadge('choisit son événement')}
      <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { key: 'roulette', icon: '🎰', label: 'CASE OBJET', desc: 'Obtient un objet aléatoire de la boutique', grad: 'linear-gradient(135deg,#d97706,#b45309)', border: '#f0c040' },
          { key: 'offre',    icon: '🎴', label: 'OFFRE SPÉCIALE', desc: 'Tire une carte d\'événement spécial', grad: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: '#a855f7' },
        ].map(opt => (
          <motion.button key={opt.key}
            initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: activePlayer ? 1 : 0.35, scale: 1 }}
            whileHover={activePlayer ? { scale: 1.04, y: -4 } : {}}
            whileTap={activePlayer ? { scale: 0.96 } : {}}
            onClick={() => activePlayer && setMode(opt.key)}
            style={{
              background: opt.grad, border: `3px solid ${opt.border}`,
              borderRadius: '22px', padding: '22px 28px', width: '200px',
              cursor: activePlayer ? 'pointer' : 'not-allowed',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
              boxShadow: `0 6px 28px ${opt.border}44`,
            }}
          >
            <span style={{ fontSize: '3rem' }}>{opt.icon}</span>
            <span style={{ color: '#fff', fontFamily: '"Fredoka One", sans-serif', fontSize: '1rem', letterSpacing: '1.5px' }}>{opt.label}</span>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', textAlign: 'center', lineHeight: 1.4 }}>{opt.desc}</span>
          </motion.button>
        ))}
      </div>
      {onDone && (
        <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={onDone}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '30px', padding: '8px 24px', color: '#666',
            fontSize: '0.82rem', cursor: 'pointer', letterSpacing: '1.5px',
          }}
        >⏭ Passer</motion.button>
      )}
    </div>
  )

  if (mode === 'roulette') return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '12px 20px',
    }}>
      <motion.h2
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            fontFamily: '"Fredoka One", sans-serif', fontSize: '1.7rem', margin: 0,
            color: '#f0c040', letterSpacing: '2px',
          }}>🎰 CASE OBJET</motion.h2>
      {playerBadge('lance la roulette')}

      {spinPhase === 'claimed' ? (
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '5rem' }}>{winner?.icon}</div>
          <div style={{ color: '#4ade80', fontFamily: '"Fredoka One", sans-serif', fontSize: '1.4rem', letterSpacing: '2px' }}>✅ {winner?.name} obtenu !</div>
          {winner?.desc && (
            <div style={{ color: '#d1fae5', fontSize: '0.9rem', fontWeight: 700, textAlign: 'center', maxWidth: '280px' }}>
              {winner.desc}
            </div>
          )}
          {contBtn}
        </motion.div>
      ) : (
        <>
          <div style={{ position: 'relative', width: `${SLOT_W}px`, height: '120px', flexShrink: 0 }}>
            <div style={{
              position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', borderRadius: '16px',
              background: 'linear-gradient(to right, rgba(8,6,24,1) 0%, transparent 22%, transparent 78%, rgba(8,6,24,1) 100%)',
            }} />
            <div style={{
              position: 'absolute', top: '4px', bottom: '4px', left: '50%', zIndex: 3,
              width: `${ITEM_W + 14}px`, transform: 'translateX(-50%)',
              border: `2px solid ${spinPhase === 'won' ? '#f0c040' : 'rgba(240,192,64,0.45)'}`,
              borderRadius: '14px', pointerEvents: 'none',
              boxShadow: spinPhase === 'won' ? '0 0 22px #f0c04077' : 'none',
              transition: 'border-color 0.5s, box-shadow 0.5s',
            }} />
            <div style={{ overflow: 'hidden', width: '100%', height: '100%' }}>
              <div ref={stripRef} style={{
                display: 'flex', gap: `${SLOT_GAP}px`, alignItems: 'center',
                height: '100%', willChange: 'transform',
                transform: `translateX(${slotOffset(INITIAL_IDX)}px)`,
              }}>
                {stripItems.map((item, r) => (
                  <div key={r} style={{
                    width: `${ITEM_W}px`, flexShrink: 0, height: '108px',
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', padding: '8px 6px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  }}>
                    <div style={{ fontSize: '2.2rem', lineHeight: 1 }}>{item.icon}</div>
                    <div style={{ color: '#bbb', fontSize: '0.57rem', textAlign: 'center', lineHeight: 1.2 }}>{item.name}</div>
                    {item.special && <div style={{ color: '#a855f7', fontSize: '0.48rem', fontWeight: 800, letterSpacing: '0.5px' }}>SPÉCIAL</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {spinPhase === 'won' && winner && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              style={{ color: '#f0c040', fontWeight: 800, fontSize: '0.95rem', textAlign: 'center' }}>
              🎉 <span style={{ color: '#fff' }}>{winner.name}</span> {winner.icon}
              {winner.desc && (
                <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.78rem', marginTop: '6px' }}>
                  {winner.desc}
                </div>
              )}
            </motion.div>
          )}

          <motion.button
            whileHover={spinPhase === 'idle' && activePlayer ? { scale: 1.07 } : {}}
            whileTap={spinPhase === 'idle' && activePlayer ? { scale: 0.93 } : {}}
            onClick={spinPhase === 'idle' ? startSpin : spinPhase === 'won' ? claimRoulette : undefined}
            style={{
              background: spinPhase === 'spinning' ? 'rgba(255,255,255,0.06)'
                : spinPhase === 'won' ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                : 'linear-gradient(135deg,#d97706,#b45309)',
              border: `3px solid ${spinPhase === 'won' ? '#22c55e' : spinPhase === 'spinning' ? 'rgba(255,255,255,0.1)' : '#f0c040'}`,
              borderRadius: '32px', padding: '10px 40px',
              color: spinPhase === 'spinning' ? '#555' : '#fff',
              fontFamily: '"Fredoka One", sans-serif', fontSize: '1rem', letterSpacing: '2px',
              cursor: spinPhase === 'spinning' ? 'not-allowed' : 'pointer',
              boxShadow: spinPhase === 'won' ? '0 4px 20px rgba(34,197,94,0.5)' : spinPhase === 'idle' ? '0 4px 22px rgba(240,192,64,0.45)' : 'none',
            }}
          >
            {spinPhase === 'idle' ? '🎰 LANCER' : spinPhase === 'spinning' ? '⏳ EN COURS...' : '✅ RÉCLAMER'}
          </motion.button>
        </>
      )}
    </div>
  )

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '10px', padding: '10px 20px',
    }}>
      <motion.h2
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          style={{
            fontFamily: '"Fredoka One", sans-serif', fontSize: '2.1rem', margin: 0,
            color: '#c084fc', letterSpacing: '3px', flexShrink: 0,
          }}
        >{mode === 'evenement' ? '🎴 ÉVÉNEMENT' : '🎴 OFFRE SPÉCIALE'}</motion.h2>
      {playerBadge(mode === 'evenement' ? 'tombe sur un événement' : 'tire une carte')}

      <div style={{ display: 'flex', gap: '18px', alignItems: 'stretch', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ width: `${PW}px`, height: `${PH}px`, position: 'relative', flexShrink: 0 }}>
          <AnimatePresence mode="wait">
            {!drawn && !flipping && (
              <motion.div key="back"
                initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }} transition={{ duration: 0.32 }}
                style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(135deg, #1a0533, #2d0a5e)',
                  border: '3px solid rgba(168,85,247,0.5)', borderRadius: '20px',
                  backdropFilter: 'blur(14px)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '10px',
                  boxShadow: '0 0 26px rgba(168,85,247,0.2)',
                }}
              >
                <div style={{ fontSize: '3.5rem', opacity: 0.55 }}>🎴</div>
                <div style={{ color: 'rgba(168,85,247,0.55)', fontSize: '0.76rem', letterSpacing: '2px' }}>CARTE CACHÉE</div>
              </motion.div>
            )}
            {flipping && (
              <motion.div key="flip"
                style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,46,0.5)', borderRadius: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              ><div style={{ color: '#a855f7', letterSpacing: '2px' }}>...</div></motion.div>
            )}
            {drawn && !flipping && (
              <motion.div key={drawn.id}
                initial={{ rotateY: 90, scale: 0.9, opacity: 0 }}
                animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                transition={{ duration: 0.38, type: 'spring', stiffness: 210 }}
                style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(135deg, rgba(26,26,46,0.97), rgba(22,33,62,0.97))',
                  border: `3px solid ${drawn.color}`, borderRadius: '20px', padding: '18px 16px',
                  backdropFilter: 'blur(14px)', textAlign: 'center',
                  boxShadow: `0 0 32px ${drawn.color}44`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden',
                }}
              >
                <div style={{ fontSize: '2.8rem', marginBottom: '6px', flexShrink: 0 }}>{drawn.icon}</div>
                <div style={{ color: drawn.color, fontWeight: 900, fontSize: '1.08rem', marginBottom: '10px', flexShrink: 0 }}>{drawn.name}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
                  {drawn.lines.map((line, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '5px 8px',
                      display: 'flex', justifyContent: line.sub ? 'space-between' : 'center',
                      alignItems: 'center', gap: '5px',
                    }}>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem' }}>{line.label}</span>
                      {line.sub && <span style={{ color: '#aaa', fontSize: '0.7rem' }}>{line.sub}</span>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div
          style={{
            width: `${PW}px`, height: `${PH}px`,
            background: 'rgba(22,22,44,0.92)',
            border: `2px solid ${drawn && !flipping ? (applied ? '#22c55e' : drawn.color + '50') : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '20px', padding: '12px',
            backdropFilter: 'blur(10px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: applied ? '0 0 18px rgba(34,197,94,0.25)' : 'none',
            transition: 'border-color 0.3s, box-shadow 0.3s',
            overflow: 'hidden', flexShrink: 0,
          }}
        >
          {!drawn || flipping ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', opacity: 0.28 }}>
              <div style={{ fontSize: '2.5rem' }}>🎴</div>
              <div style={{ color: '#aaa', fontSize: '0.76rem', letterSpacing: '1px', textAlign: 'center' }}>
                Tirez une carte<br/>pour voir l'effet
              </div>
            </div>
          ) : applied ? (
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
            >
              <div style={{ fontSize: '3rem' }}>✅</div>
              <div style={{ color: '#4ade80', fontWeight: 800, fontSize: '0.92rem', textAlign: 'center' }}>Effet appliqué !</div>
              {contBtn}
            </motion.div>
          ) : (
            <>
              {(drawn.id === 'loot_box' || drawn.id === 'ddos') && (
                <>
                  <div style={{ width: '100%', height: '160px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden' }}>
                    <DiceScene rollCount={rollCount} onResult={handleDieResult} singleDie={true} />
                  </div>
                  {rollBtn}
                  {drawn.id === 'loot_box' && lootEffect && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      style={{
                        background: `${lootEffect.col}22`, border: `1px solid ${lootEffect.col}`,
                        borderRadius: '9px', padding: '6px 12px',
                        color: lootEffect.col, fontWeight: 800, fontSize: '0.86rem', textAlign: 'center', flexShrink: 0,
                      }}
                    >{lootEffect.text}</motion.div>
                  )}
                  {drawn.id === 'ddos' && ddosOutcome === 'self' && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      style={{
                        background: 'rgba(168,85,247,0.15)', border: '1px solid #a855f7',
                        borderRadius: '9px', padding: '6px 12px',
                        color: '#c084fc', fontWeight: 800, fontSize: '0.82rem', textAlign: 'center', flexShrink: 0,
                      }}
                    >😵 Votre prochain tour est sauté</motion.div>
                  )}
                  {drawn.id === 'ddos' && ddosOutcome === 'other' && targetPicker('⚡ CHOISIR UNE CIBLE')}
                </>
              )}
              {drawn.id === 'eject' && targetPicker('🎯 CHOISIR UNE CIBLE')}
              {canApply && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                  onClick={handleApply}
                  style={{
                    background: `linear-gradient(135deg, ${drawn.color}, ${drawn.color}cc)`,
                    border: `2px solid ${drawn.color}`,
                    borderRadius: '22px', padding: '9px 26px',
                    color: '#fff', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer',
                    boxShadow: `0 4px 14px ${drawn.color}55`,
                    marginTop: 'auto', flexShrink: 0,
                  }}
                >⚡ APPLIQUER</motion.button>
              )}
            </>
          )}
        </div>
      </div>

      {mode === 'evenement' && !applied && (
        <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={onDone}
          style={{
            background: 'rgba(255,255,255,0.07)', border: '2px solid rgba(255,255,255,0.18)',
            borderRadius: '40px', padding: '10px 36px', color: '#888',
            fontFamily: '"Fredoka One", sans-serif', fontSize: '1rem', fontWeight: 900,
            letterSpacing: '2px', cursor: 'pointer', flexShrink: 0,
          }}
        >⏭ PASSER</motion.button>
      )}
      {mode === 'offre' && !applied && (
        <motion.button whileHover={!offerLocked ? { scale: 1.06 } : {}} whileTap={!offerLocked ? { scale: 0.94 } : {}}
          onClick={!offerLocked ? onDone : undefined}
          disabled={offerLocked}
          style={{
            background: offerLocked ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.07)',
            border: offerLocked ? '2px solid rgba(255,255,255,0.08)' : '2px solid rgba(255,255,255,0.18)',
            borderRadius: '40px', padding: '10px 36px', color: offerLocked ? '#666' : '#888',
            fontFamily: '"Fredoka One", sans-serif', fontSize: '1rem', fontWeight: 900,
            letterSpacing: '2px', cursor: offerLocked ? 'not-allowed' : 'pointer', flexShrink: 0,
          }}
        >{offerLocked ? '🔒 OFFRE ENGAGÉE' : '⏭ IGNORER L’OFFRE'}</motion.button>
      )}
      {mode !== 'evenement' && (() => {
        const canDraw = activePlayer && !flipping && !offerLocked && !isFinishedActive && (activePlayer.money ?? 0) >= 4
        return (
          <motion.button
            whileHover={canDraw ? { scale: 1.06 } : {}}
            whileTap={canDraw ? { scale: 0.94 } : {}}
            onClick={canDraw ? drawCard : undefined}
            style={{
              background: canDraw ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : 'rgba(255,255,255,0.06)',
              border: canDraw ? '3px solid #a855f7' : '3px solid transparent',
              borderRadius: '40px', padding: '11px 36px',
              color: canDraw ? '#fff' : '#555',
              fontFamily: '"Fredoka One", sans-serif',
              fontSize: '1.1rem', fontWeight: 900, letterSpacing: '2px',
              cursor: canDraw ? 'pointer' : 'not-allowed',
              boxShadow: canDraw ? '0 4px 22px rgba(168,85,247,0.45)' : 'none', flexShrink: 0,
            }}
          >🎴 TIRER UNE CARTE — <span style={{ color: canDraw ? '#f0c040' : '#666', fontSize: '0.9em' }}>4€</span></motion.button>
        )
      })()}
    </div>
  )
}

export default App
