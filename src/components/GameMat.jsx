import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DiceScene from './DiceScene';
import { PLAYER_COLORS, PLAYER_AVATARS } from '../gameData';

export default function GameMat({
  gameName = 'REGAME AWAKE',
  activePlayer = null,
  activePlayers = [],
  onConsumeItem,
  onCursePlayer,
  onClearCurse,
  onEndTurn,
  onSkipTurn,
  onSwapPlayers,
  onModifyPosition,
}) {
  const [rollCount, setRollCount] = useState(0);
  const [result, setResult] = useState(null);
  const [usedItemThisTurn, setUsedItemThisTurn] = useState(false);
  const [activeItemUid, setActiveItemUid] = useState(null);
  const [isRollingState, setIsRollingState] = useState(false);
  const [curseTargetId, setCurseTargetId] = useState(null);
  const [rollExtraDie, setRollExtraDie] = useState(false);
  const [itemTargetId, setItemTargetId] = useState(null);
  const [switchCount, setSwitchCount] = useState(0);
  const [teleporteurLabel, setTeleporteurLabel] = useState(null);
  const [boostActive, setBoostActive] = useState(false);
  const isRollingRef = useRef(false);
  const pendingItemRef = useRef(null);
  const prevPlayerIdRef = useRef(null);

  useEffect(() => {
    const id = activePlayer?.id ?? null;
    if (id !== prevPlayerIdRef.current) {
      prevPlayerIdRef.current = id;
      setResult(null);
      setUsedItemThisTurn(false);
      setSwitchCount(c => c + 1);
      setItemTargetId(null);
      setTeleporteurLabel(null);
      setBoostActive(false);
    }
  }, [activePlayer]);

  const activePlayerRef = useRef(activePlayer);
  activePlayerRef.current = activePlayer;
  const cbsRef = useRef({ onConsumeItem, onClearCurse, onSkipTurn, onSwapPlayers, onModifyPosition });
  cbsRef.current = { onConsumeItem, onClearCurse, onSkipTurn, onSwapPlayers, onModifyPosition };

  const selectedItem = activePlayer?.items.find(i => i.uid === activeItemUid) ?? null;
  const isCursedSelected = selectedItem?.id === 'cursed_die';
  const isExtraDie = selectedItem?.id === 'extra_die';
  const isCursed = activePlayer?.cursed ?? false;
  const otherPlayers = activePlayers.filter(p => p.id !== activePlayer?.id);
  const finishedIds = activePlayers.filter(p => (p.diceTotal ?? 0) >= 63).map(p => p.id);
  const finishedPlayerIds = new Set(finishedIds);
  const targetableOtherPlayers = otherPlayers.filter(p => !finishedPlayerIds.has(p.id));
  const isFinishedActive = (activePlayer?.diceTotal ?? 0) >= 63;
  const INSTANT_IDS = ['freeze', 'swap', 'tornade', 'turbo'];
  const BOOST_IDS = ['boost'];
  const TARGET_IDS = ['freeze', 'swap', 'tornade'];
  const PASSIVE_IDS = ['de_permanent', 'vip', 'contrat', 'abonnement'];
  const isInstantItem = INSTANT_IDS.includes(selectedItem?.id);
  const isBoostItem = BOOST_IDS.includes(selectedItem?.id);
  const needsTarget = TARGET_IDS.includes(selectedItem?.id);
  const hasPermExtraDie = activePlayer?.items.some(i => i.id === 'de_permanent') ?? false;
  const isTeleporteur = selectedItem?.id === 'teleporteur';
  const activeItems = activePlayer?.items.filter(i => !PASSIVE_IDS.includes(i.id)) ?? [];
  const passiveItems = activePlayer?.items.filter(i => PASSIVE_IDS.includes(i.id)) ?? [];

  const handleBoost = () => {
    if (!activePlayer || !selectedItem || isFinishedActive || usedItemThisTurn || !isBoostItem) return;
    const { onConsumeItem: consume } = cbsRef.current;
    const id = activePlayer.id;
    setBoostActive(true);
    consume(id, selectedItem.uid);
    setActiveItemUid(null);
    setUsedItemThisTurn(true);
  };

  const handleRoll = () => {
    // Allow rolling even if an item was used this turn — using an item should not block the roll.
    if (isRollingRef.current || !activePlayer || isCursedSelected || isInstantItem || isFinishedActive) return;
    isRollingRef.current = true;
    setIsRollingState(true);
    // Deselect any active item when starting a roll so items cannot be re-selected during the roll
    setActiveItemUid(null);
    const chosenItem = activeItemUid
      ? activePlayer.items.find(i => i.uid === activeItemUid) ?? null
      : null;
    pendingItemRef.current = chosenItem
      ? { item: chosenItem, playerId: activePlayer.id }
      : null;
    // Mark that an item/roll action has occurred this turn so active items are hidden until end of turn
    setUsedItemThisTurn(true);
    setRollExtraDie(isExtraDie);
    setResult(null);
    setRollCount(c => c + 1);
    setTimeout(() => { isRollingRef.current = false; setIsRollingState(false); }, 4500);
  };

  const handleInflict = () => {
    if (!curseTargetId || !activePlayer || !selectedItem || finishedPlayerIds.has(curseTargetId) || isFinishedActive || usedItemThisTurn) return;
    onCursePlayer(curseTargetId);
    cbsRef.current.onConsumeItem(activePlayer.id, selectedItem.uid);
    setActiveItemUid(null);
    setCurseTargetId(null);
    setUsedItemThisTurn(true);
  };

  const handleUseInstant = () => {
    if (!activePlayer || !selectedItem || isFinishedActive || usedItemThisTurn) return;
    if (TARGET_IDS.includes(selectedItem.id) && (!itemTargetId || finishedPlayerIds.has(itemTargetId))) return;
    const { onConsumeItem: consume, onSkipTurn: skipT, onSwapPlayers: swap, onModifyPosition: modPos } = cbsRef.current;
    const id = activePlayer.id;
    switch (selectedItem.id) {
      case 'freeze':  skipT?.(itemTargetId); break;
      case 'swap':    swap?.(id, itemTargetId); break;
      case 'tornade': modPos?.(itemTargetId, -6); break;
      case 'turbo':   skipT?.(id); break;
      default: break;
    }
    consume(id, selectedItem.uid);
    setActiveItemUid(null);
    setItemTargetId(null);
    setUsedItemThisTurn(true);
  };

  const handleResult = useCallback((res) => {
    isRollingRef.current = false;
    setIsRollingState(false);
    const pending = pendingItemRef.current;
    pendingItemRef.current = null;
    const item = pending?.item ?? null;
    const rollPlayerId = pending?.playerId ?? null;
    const ap = activePlayerRef.current;
    const { onConsumeItem, onClearCurse } = cbsRef.current;

    if (ap?.cursed) onClearCurse?.(ap.id);

    const hasAbonnement = ap?.items?.some(i => i.id === 'abonnement') ?? false;
    const applyAbon = (base) => hasAbonnement ? { ...base, bonus: 2, bonusLabel: '+2 📡', total: base.total + 2 } : base;
    const applyBoost = (base) => boostActive ? { ...base, bonus: (base.bonus || 0) + 4, bonusLabel: '+4 🚀', total: base.total + 4 } : base;

    if (item && rollPlayerId) {
      if (item.id === 'teleporteur') {
        const die = res.die1;
        const delta = die <= 2 ? -3 : die <= 5 ? 5 : 8;
        const label = die <= 2 ? `🌀 Dé: ${die} → ↙ -3 cases` : die <= 5 ? `🌀 Dé: ${die} → ↗ +5 cases` : `🌀 Dé: ${die} → 🚀 +8 cases`;
        cbsRef.current.onModifyPosition?.(rollPlayerId, delta);
        setTeleporteurLabel(label);
      } else if (item.id === 'mushroom') {
        const base = { ...res, bonus: 3, bonusLabel: '+3 🍄', total: Math.max(0, res.total + 3) };
        setResult(applyBoost(applyAbon(base)));
      } else {
        setResult(applyBoost(applyAbon(res)));
      }
      if (!PASSIVE_IDS.includes(item.id)) onConsumeItem(rollPlayerId, item.uid);
    } else {
      setResult(applyBoost(applyAbon(res)));
    }
    setActiveItemUid(null);
    setBoostActive(false);
  }, [boostActive]);

  const rollBtnActive = activePlayer && !isCursedSelected && !isInstantItem && !isFinishedActive;

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '490px' }}>

      <div style={{
        width: '460px', height: '76px', flexShrink: 0, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '6px',
      }}>
        <AnimatePresence mode="wait">
          {activePlayer ? (
            <motion.div
              key={activePlayer.id}
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%' }}
            >
              <div style={{
                color: isCursed ? '#ff6b6b' : '#f0c040',
                fontSize: '0.82rem', fontWeight: 800,
                letterSpacing: '1.5px', textTransform: 'uppercase',
                textShadow: `0 0 10px ${isCursed ? '#ff6b6b88' : '#f0c04088'}`,
              }}>
                {isCursed ? '☠️ Dés Maudits —' : '🎯'} Tour de {activePlayer.name}
              </div>

              {( (activeItems.length > 0 && !usedItemThisTurn && !isRollingState) || passiveItems.length > 0) && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {(!usedItemThisTurn && !isRollingState ? activeItems : []).map(item => {
                    const on = activeItemUid === item.uid;
                    return (
                      <motion.button
                        key={item.uid}
                        whileTap={{ scale: 0.88 }}
                        onClick={() => {
                          if (isFinishedActive) return;
                          // Prevent selecting during a roll
                          if (isRollingState) return;
                          // If an item has already been used this turn, prevent selecting another one
                          if (usedItemThisTurn && activeItemUid !== item.uid) return;
                          setActiveItemUid(prev => prev === item.uid ? null : item.uid);
                          setCurseTargetId(null);
                          setItemTargetId(null);
                        }}
                        title={`${item.name} — ${item.desc}`}
                        style={{
                          background: on
                            ? 'linear-gradient(135deg, #f0c040, #d97706)'
                            : 'rgba(255,255,255,0.12)',
                          border: on ? '2px solid #f0c040' : '2px solid rgba(255,255,255,0.2)',
                          borderRadius: '10px', padding: '4px 10px',
                          cursor: isRollingState ? 'not-allowed' : (usedItemThisTurn && !on ? 'not-allowed' : 'pointer'), fontSize: '1.2rem', lineHeight: 1,
                          boxShadow: on ? '0 0 14px #f0c04099' : 'none',
                          transition: 'all 0.18s',
                          display: 'flex', alignItems: 'center', gap: '4px',
                        }}
                      >
                        {item.icon}
                        {on && <span style={{ fontSize: '0.65rem', color: '#1a1a2e', fontWeight: 900 }}>ACTIF</span>}
                      </motion.button>
                    );
                  })}
                  {passiveItems.map(item => (
                    <div key={item.uid} title={`${item.name} — ${item.desc}`} style={{
                      background: 'rgba(34,197,94,0.12)',
                      border: '2px solid rgba(34,197,94,0.45)',
                      borderRadius: '10px', padding: '4px 10px',
                      fontSize: '1.2rem', lineHeight: 1,
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      {item.icon}
                      <span style={{ fontSize: '0.58rem', color: '#4ade80', fontWeight: 900, letterSpacing: '0.5px' }}>PASSIF</span>
                    </div>
                  ))}
                </div>
              )}

            </motion.div>
          ) : (
            <motion.div
              key="no-player"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ color: '#555', fontSize: '0.78rem', fontStyle: 'italic', paddingTop: '4px' }}
            >
              Cliquez sur une carte joueur pour commencer son tour
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{
        position: 'relative',
        width: '460px', height: '410px', flexShrink: 0,
        background: 'radial-gradient(ellipse at center, #1a6b3a 0%, #0d4a28 60%, #072e18 100%)',
        borderRadius: '24px',
        border: '6px solid #c8860a',
        boxShadow: '0 0 40px rgba(200,134,10,0.5), inset 0 0 60px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'flex-start', padding: '14px 10px 0',
      }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '18px',
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 12px)',
          pointerEvents: 'none',
        }} />

        <div style={{
          background: 'linear-gradient(135deg, #c8860a, #f0c040, #c8860a)',
          borderRadius: '12px', padding: '4px 20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)', zIndex: 1,
        }}>
          <span style={{
            fontFamily: '"Fredoka One", "Nunito", sans-serif',
            fontSize: '1.1rem', fontWeight: 900, color: '#1a1a2e',
            letterSpacing: '3px', textTransform: 'uppercase',
          }}>{gameName}</span>
        </div>

        <div style={{ flex: 1, width: '100%', position: 'relative', zIndex: 1 }}>
          <DiceScene
            rollCount={rollCount}
            onResult={handleResult}
            extraDie={isExtraDie || rollExtraDie || hasPermExtraDie}
            cursed={isCursed}
            switchCount={switchCount}
            singleDie={isTeleporteur}
          />
        </div>

        <div style={{ position: 'relative', width: '100%', height: '76px', flexShrink: 0,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '10px' }}>

          <AnimatePresence>
            {isCursedSelected && targetableOtherPlayers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                style={{
                  position: 'absolute', bottom: '54px', left: 0, right: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '4px', zIndex: 2,
                }}
              >
                <div style={{ color: '#ff6b6b', fontSize: '0.7rem', letterSpacing: '1px', fontWeight: 800 }}>
                  ☠️ CHOISIR UNE CIBLE
                </div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {targetableOtherPlayers.map(p => {
                    const idx = p.id - 1;
                    const isTarget = curseTargetId === p.id;
                    return (
                      <motion.button
                        key={p.id}
                        whileTap={{ scale: 0.88 }}
                        onClick={() => setCurseTargetId(prev => prev === p.id ? null : p.id)}
                        style={{
                          background: isTarget ? 'linear-gradient(135deg, #dc2626, #991b1b)' : 'rgba(255,255,255,0.1)',
                          border: isTarget ? `2px solid ${PLAYER_COLORS[idx]}` : '2px solid rgba(255,255,255,0.15)',
                          borderRadius: '10px', padding: '3px 8px',
                          cursor: 'pointer', fontSize: '0.85rem',
                          color: '#fff', fontWeight: 700,
                          display: 'flex', alignItems: 'center', gap: '4px',
                          boxShadow: isTarget ? '0 0 10px #dc262699' : 'none',
                          transition: 'all 0.18s',
                        }}
                      >
                        <span>{PLAYER_AVATARS[idx]}</span>
                        <span style={{ fontSize: '0.72rem' }}>{p.name}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isInstantItem && needsTarget && targetableOtherPlayers.length > 0 && !result && (
              <motion.div
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                style={{
                  position: 'absolute', bottom: '54px', left: 0, right: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '4px', zIndex: 2,
                }}
              >
                <div style={{ color: '#f0c040', fontSize: '0.7rem', letterSpacing: '1px', fontWeight: 800 }}>🎯 CHOISIR UNE CIBLE</div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {targetableOtherPlayers.map(p => {
                    const pc = PLAYER_COLORS[p.colorIndex ?? 0];
                    const av = PLAYER_AVATARS[p.colorIndex ?? 0];
                    const isTgt = itemTargetId === p.id;
                    return (
                      <motion.button key={p.id} whileTap={{ scale: 0.88 }}
                        onClick={() => setItemTargetId(prev => prev === p.id ? null : p.id)}
                        style={{
                          background: isTgt ? `${pc}28` : 'rgba(255,255,255,0.1)',
                          border: `2px solid ${isTgt ? pc : 'rgba(255,255,255,0.15)'}`,
                          borderRadius: '10px', padding: '3px 8px', cursor: 'pointer',
                          color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                          display: 'flex', alignItems: 'center', gap: '4px',
                          boxShadow: isTgt ? `0 0 10px ${pc}99` : 'none', transition: 'all 0.18s',
                        }}
                      ><span>{av}</span><span style={{ fontSize: '0.72rem' }}>{p.name}</span></motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        {teleporteurLabel && !result && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(124,58,237,0.2)', border: '1px solid #a78bfa55',
              borderRadius: '10px', padding: '4px 14px',
              color: '#a78bfa', fontSize: '0.72rem', fontWeight: 800,
              letterSpacing: '1px', textAlign: 'center', zIndex: 2,
            }}
          >{teleporteurLabel}</motion.div>
        )}

        {result && onEndTurn ? (
          <motion.button
            key="end-turn"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => onEndTurn(result?.total ?? 0)}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              border: '3px solid #a78bfa',
              borderRadius: '30px', padding: '8px 32px',
              color: '#fff', fontWeight: 900, fontSize: '1rem',
              letterSpacing: '2px', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(124,58,237,0.5)',
              fontFamily: '"Fredoka One", "Nunito", sans-serif',
              zIndex: 1,
            }}
          >✅ FIN DE TOUR</motion.button>
        ) : isBoostItem ? (
          <motion.button
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
            onClick={handleBoost}
            style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff', fontWeight: 900, fontSize: '1rem', letterSpacing: '1.5px',
              padding: '8px 28px', borderRadius: '30px',
              border: '3px solid #4ade80', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(34,197,94,0.7)',
              fontFamily: '"Fredoka One", "Nunito", sans-serif', zIndex: 1,
            }}
          >
            🚀 ACTIVER BOOST {selectedItem?.icon}
          </motion.button>
        ) : isInstantItem ? (
          !needsTarget || itemTargetId ? (
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
              onClick={handleUseInstant}
              style={{
                background: 'linear-gradient(135deg, #d97706, #b45309)',
                color: '#fff', fontWeight: 900, fontSize: '1rem', letterSpacing: '1.5px',
                padding: '8px 28px', borderRadius: '30px',
                border: '3px solid #f0c040', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(217,119,6,0.7)',
                fontFamily: '"Fredoka One", "Nunito", sans-serif', zIndex: 1,
              }}
            >
              ✨ UTILISER {selectedItem?.icon}
              {itemTargetId && ` → ${activePlayers.find(p => p.id === itemTargetId)?.name}`}
            </motion.button>
          ) : (
            <div style={{ color: '#f0c04088', fontSize: '0.78rem', fontStyle: 'italic', paddingBottom: '4px', zIndex: 1 }}>
              ☝️ Choisissez une cible
            </div>
          )
        ) : isCursedSelected ? (
          curseTargetId ? (
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
              onClick={handleInflict}
              style={{
                background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                color: '#fff', fontWeight: 900, fontSize: '1rem', letterSpacing: '1.5px',
                padding: '8px 28px', borderRadius: '30px',
                border: '3px solid #ff6b6b', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(220,38,38,0.7)',
                fontFamily: '"Fredoka One", "Nunito", sans-serif',
                zIndex: 1,
              }}
            >
              ⚡ INFLIGER À {activePlayers.find(p => p.id === curseTargetId)?.name}
            </motion.button>
          ) : (
            <div style={{
              color: '#ff6b6b88', fontSize: '0.78rem', fontStyle: 'italic',
              paddingBottom: '4px', zIndex: 1,
            }}>
              ☝️ Choisissez une cible
            </div>
          )
        ) : (
          <motion.button
            whileHover={rollBtnActive ? { scale: 1.08 } : {}}
            whileTap={rollBtnActive ? { scale: 0.94 } : {}}
            onClick={handleRoll}
            disabled={!rollBtnActive}
            style={{
              background: rollBtnActive
                ? selectedItem
                  ? 'linear-gradient(135deg, #d97706, #b45309)'
                  : 'linear-gradient(135deg, #e63946, #c1121f)'
                : 'rgba(255,255,255,0.08)',
              color: rollBtnActive ? '#fff' : '#444',
              fontWeight: 900, fontSize: '1rem', letterSpacing: '2px',
              padding: '8px 32px', borderRadius: '30px',
              border: rollBtnActive
                ? selectedItem ? '3px solid #f0c040' : '3px solid #ff6b6b'
                : '3px solid transparent',
              cursor: rollBtnActive ? 'pointer' : 'not-allowed',
              boxShadow: rollBtnActive
                ? selectedItem ? '0 4px 20px rgba(217,119,6,0.7)' : '0 4px 20px rgba(230,57,70,0.6)'
                : 'none',
              fontFamily: '"Fredoka One", "Nunito", sans-serif',
              zIndex: 1, transition: 'all 0.2s',
            }}
          >
            {selectedItem ? `🎲 LANCER ${selectedItem.icon}` : '🎲 LANCER'}
          </motion.button>
        )}
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
              initial={{ scale: 0, opacity: 0, y: -6, x: '-50%' }}
              animate={{ scale: 1, opacity: 1, y: 0, x: '-50%' }}
              exit={{ scale: 0, opacity: 0, x: '-50%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{
                position: 'absolute', top: '498px', left: '50%',
                background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                border: '3px solid #f0c040', borderRadius: '20px',
                padding: '14px 36px', textAlign: 'center',
                boxShadow: '0 0 30px rgba(240,192,64,0.4)',
                whiteSpace: 'nowrap', zIndex: 20,
              }}
            >
              {teleporteurLabel && (
                <div style={{ color: '#a78bfa', fontSize: '0.7rem', letterSpacing: '1px', marginBottom: '6px', fontWeight: 800 }}>{teleporteurLabel}</div>
              )}
              <div style={{ color: '#aaa', fontSize: '1rem', letterSpacing: '3px', marginBottom: '6px' }}>RÉSULTAT</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: '2.2rem', fontWeight: 700 }}>{result.die1}</span>
                {result.die2 !== undefined && (
                  <>
                    <span style={{ color: '#f0c040', fontSize: '1.8rem' }}>+</span>
                    <span style={{ color: '#fff', fontSize: '2.2rem', fontWeight: 700 }}>{result.die2}</span>
                  </>
                )}
                {result.die3 !== undefined && (
                  <>
                    <span style={{ color: '#f0c040', fontSize: '1.8rem' }}>+</span>
                    <span style={{ color: '#fbbf24', fontSize: '2.2rem', fontWeight: 700 }}>{result.die3}🎲</span>
                  </>
                )}
                {result.bonusLabel && (
                  <span style={{ color: '#4ade80', fontSize: '1.8rem', fontWeight: 800 }}>
                    {result.bonusLabel}
                  </span>
                )}
                <span style={{ color: '#f0c040', fontSize: '1.8rem' }}>=</span>
                <motion.span
                  initial={{ scale: 0.5 }}
                  animate={{ scale: [1.4, 1] }}
                  transition={{ type: 'spring' }}
                  style={{ color: '#f0c040', fontSize: '3.6rem', fontWeight: 900, textShadow: '0 0 20px #f0c040' }}
                >{result.total}</motion.span>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}