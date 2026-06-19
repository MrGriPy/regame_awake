import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DiceScene from './DiceScene';
import { PLAYER_COLORS, PLAYER_AVATARS, SHOP_ITEMS } from '../gameData';

export default function GameMat({
  gameName = 'REGAME AWAKE',
  activePlayer = null,
  activePlayers = [],
  onConsumeItem,
  onEndTurn,
  onSkipTurn,
  onSwapPlayers,
  onModifyPosition,
  onSpendMoney,
  onRecordItemUse,
  musicMuted = false,
}) {
  const [rollCount, setRollCount] = useState(0);
  const [result, setResult] = useState(null);
  const [usedItemThisTurn, setUsedItemThisTurn] = useState(false);
  const [activeItemUid, setActiveItemUid] = useState(null);
  const [isRollingState, setIsRollingState] = useState(false);
  const [itemTargetId, setItemTargetId] = useState(null);
  const [switchCount, setSwitchCount] = useState(0);
  const [teleporteurLabel, setTeleporteurLabel] = useState(null);
  const [specialIcon, setSpecialIcon] = useState('🌀');
  const [skipSquareOnEnd, setSkipSquareOnEnd] = useState(false);
  const [boostActive, setBoostActive] = useState(false);
  const [rollingSingleDie, setRollingSingleDie] = useState(false);
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
      setSpecialIcon('🌀');
      setSkipSquareOnEnd(false);
      setBoostActive(false);
      setRollingSingleDie(false);
    }
  }, [activePlayer]);

  const activePlayerRef = useRef(activePlayer);
  activePlayerRef.current = activePlayer;
  const cbsRef = useRef({ onConsumeItem, onSkipTurn, onSwapPlayers, onModifyPosition, onSpendMoney, onRecordItemUse });
  cbsRef.current = { onConsumeItem, onSkipTurn, onSwapPlayers, onModifyPosition, onSpendMoney, onRecordItemUse };

  const selectedItem = activePlayer?.items.find(i => i.uid === activeItemUid) ?? null;
  const lastClassic = activePlayer?.lastClassicItem ?? null;
  const effItem = selectedItem
    ? (selectedItem.id === 'encore'
        ? (lastClassic ? { ...SHOP_ITEMS.find(i => i.id === lastClassic), uid: selectedItem.uid } : null)
        : selectedItem)
    : null;
  const effId = effItem?.id ?? null;
  const otherPlayers = activePlayers.filter(p => p.id !== activePlayer?.id);
  const finishedIds = activePlayers.filter(p => (p.diceTotal ?? 0) >= 63).map(p => p.id);
  const finishedPlayerIds = new Set(finishedIds);
  const targetableOtherPlayers = otherPlayers.filter(p => !finishedPlayerIds.has(p.id));
  const isFinishedActive = (activePlayer?.diceTotal ?? 0) >= 63;
  const INSTANT_IDS = ['freeze', 'swap', 'tornade', 'turbo'];
  const BOOST_IDS = ['boost'];
  const TARGET_IDS = ['freeze', 'swap', 'tornade'];
  const PASSIVE_IDS = ['de_permanent', 'vip', 'contrat', 'abonnement', 'couronne_fou', 'privilegie', 'jackpot'];
  const isInstantItem = INSTANT_IDS.includes(effId);
  const isBoostItem = BOOST_IDS.includes(effId);
  const isDeMaudit = effId === 'de_maudit';
  const isInvest = effId === 'investissement';
  const isTeleporteur = effId === 'teleporteur';
  const needsTarget = TARGET_IDS.includes(effId) || isDeMaudit;
  const isEncoreEmpty = selectedItem?.id === 'encore' && !effItem;
  const hasPermExtraDie = activePlayer?.items.some(i => i.id === 'de_permanent') ?? false;
  const activeItems = activePlayer?.items.filter(i => !PASSIVE_IDS.includes(i.id)) ?? [];
  const passiveItems = activePlayer?.items.filter(i => PASSIVE_IDS.includes(i.id)) ?? [];

  const handleBoost = () => {
    if (!activePlayer || !selectedItem || isFinishedActive || usedItemThisTurn || !isBoostItem) return;
    const { onConsumeItem: consume, onRecordItemUse: record } = cbsRef.current;
    const id = activePlayer.id;
    setBoostActive(true);
    consume(id, selectedItem.uid);
    record?.(id, 'boost');
    setActiveItemUid(null);
    setUsedItemThisTurn(true);
  };

  const handleRoll = () => {
    if (isRollingRef.current || !activePlayer || isInstantItem || isBoostItem || isFinishedActive) return;
    if (isEncoreEmpty) return;
    if (isDeMaudit && !itemTargetId) return;
    isRollingRef.current = true;
    setIsRollingState(true);
    setRollingSingleDie(isTeleporteur || isDeMaudit || isInvest);
    setActiveItemUid(null);
    pendingItemRef.current = effItem
      ? { item: effItem, playerId: activePlayer.id, targetId: itemTargetId, consumeUid: selectedItem.uid }
      : null;
    setUsedItemThisTurn(true);
    setResult(null);
    setRollCount(c => c + 1);
    setTimeout(() => { isRollingRef.current = false; setIsRollingState(false); }, 4500);
  };

  const handleUseInstant = () => {
    if (!activePlayer || !effItem || isFinishedActive || usedItemThisTurn) return;
    if (TARGET_IDS.includes(effItem.id) && (!itemTargetId || finishedPlayerIds.has(itemTargetId))) return;
    const { onConsumeItem: consume, onSkipTurn: skipT, onSwapPlayers: swap, onModifyPosition: modPos, onRecordItemUse: record } = cbsRef.current;
    const id = activePlayer.id;
    const eid = effItem.id;
    if (eid === 'turbo') {
      consume(id, selectedItem.uid);
      record?.(id, 'turbo');
      setActiveItemUid(null);
      setItemTargetId(null);
      setUsedItemThisTurn(true);
      onEndTurn?.(8, { skipSquare: true });
      return;
    }
    switch (eid) {
      case 'freeze':  skipT?.(itemTargetId); break;
      case 'swap':    swap?.(id, itemTargetId); break;
      case 'tornade': modPos?.(itemTargetId, -6); break;
      default: break;
    }
    consume(id, selectedItem.uid);
    record?.(id, eid);
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
    const targetId = pending?.targetId ?? null;
    const consumeUid = pending?.consumeUid ?? null;
    const ap = activePlayerRef.current;
    const { onConsumeItem, onModifyPosition, onSpendMoney, onRecordItemUse } = cbsRef.current;

    const hasAbonnement = ap?.items?.some(i => i.id === 'abonnement') ?? false;
    const hasJackpot = ap?.items?.some(i => i.id === 'jackpot') ?? false;
    const isDouble = res.die2 !== undefined && res.die1 === res.die2;
    const addLabel = (base, s) => base.bonusLabel ? `${base.bonusLabel} ${s}` : s;
    const applyAbon = (base) => hasAbonnement ? { ...base, bonus: (base.bonus || 0) + 2, bonusLabel: addLabel(base, '+2 📡'), total: base.total + 2 } : base;
    const applyBoost = (base) => boostActive ? { ...base, bonus: (base.bonus || 0) + 4, bonusLabel: addLabel(base, '+4 🚀'), total: base.total + 4 } : base;
    const applyJackpot = (base) => (hasJackpot && isDouble) ? { ...base, bonus: (base.bonus || 0) + 6, bonusLabel: addLabel(base, '+6 🎰'), total: base.total + 6 } : base;
    const finalize = (base) => applyJackpot(applyBoost(applyAbon(base)));

    if (item && rollPlayerId) {
      if (item.id === 'teleporteur') {
        const die = res.die1;
        const delta = die <= 2 ? -3 : die <= 5 ? 5 : 8;
        const label = die <= 2 ? `🌀 Dé: ${die} → ↙ Reculer de 3 cases` : die <= 5 ? `🌀 Dé: ${die} → ↗ Avancer de 5 cases` : `🌀 Dé: ${die} → 🚀 Avancer de 8 cases`;
        onModifyPosition?.(rollPlayerId, delta);
        setSpecialIcon('🌀');
        setTeleporteurLabel(label);
        setResult({ ...res, total: 0 });
      } else if (item.id === 'de_maudit') {
        const die = res.die1;
        if (targetId) onModifyPosition?.(targetId, -die);
        const tName = activePlayers.find(p => p.id === targetId)?.name ?? 'La cible';
        setSpecialIcon('😈');
        setTeleporteurLabel(`😈 ${tName} recule de ${die} case${die > 1 ? 's' : ''}`);
        setSkipSquareOnEnd(true);
        setResult({ ...res, total: 0 });
      } else if (item.id === 'investissement') {
        const die = res.die1;
        onSpendMoney?.(rollPlayerId, -die);
        onModifyPosition?.(rollPlayerId, -die);
        setSpecialIcon('💸');
        setTeleporteurLabel(`💸 +${die}€ et −${die} case${die > 1 ? 's' : ''}`);
        setResult({ ...res, total: 0 });
      } else {
        setResult(finalize(res));
      }
      if (consumeUid && !PASSIVE_IDS.includes(item.id)) onConsumeItem(rollPlayerId, consumeUid);
      onRecordItemUse?.(rollPlayerId, item.id);
    } else {
      setResult(finalize(res));
    }
    setActiveItemUid(null);
    setBoostActive(false);
  }, [boostActive, activePlayers]);

  const rollBtnActive = activePlayer && !isInstantItem && !isFinishedActive;

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '460px', marginTop: '60px', userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
      
      {/* 1. BANDEAU DE JOUER ACTIF EN HAUT */}
      <div style={{
        width: '460px', height: '36px', flexShrink: 0, overflow: 'hidden',
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
                color: '#f0c040',
                fontSize: '0.82rem', fontWeight: 800,
                letterSpacing: '1.5px', textTransform: 'uppercase',
                textShadow: '0 0 10px #f0c04088',
              }}>
                🎯 Tour de {activePlayer.name}
              </div>
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

      {/* 2. LE TAPIS DE JEU CENTRAL */}
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

        {/* RESTRUCTURATION DES SÉLECTEURS DE CIBLES EN COLONNE CENTRÉE SANS SE SUPERPOSER */}
        <div style={{ 
          position: 'absolute', 
          top: '60px', 
          bottom: '80px', 
          left: '10px', 
          right: '10px', 
          zIndex: 10, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <AnimatePresence>
            {needsTarget && targetableOtherPlayers.length > 0 && !result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%', pointerEvents: 'auto' }}
              >
                <div style={{ color: '#f0c040', fontSize: '0.85rem', letterSpacing: '1.5px', fontWeight: 900, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                  🎯 CHOISIR UNE CIBLE
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '240px' }}>
                  {targetableOtherPlayers.map(p => {
                    const pc = PLAYER_COLORS[p.colorIndex ?? 0];
                    const av = p.avatar ?? PLAYER_AVATARS[p.colorIndex ?? 0];
                    const isTgt = itemTargetId === p.id;
                    return (
                      <motion.button 
                        key={p.id} 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setItemTargetId(prev => prev === p.id ? null : p.id)}
                        style={{
                          width: '100%',
                          background: isTgt ? `${pc}d0` : 'rgba(15,15,30,0.9)',
                          border: `2px solid ${isTgt ? '#fff' : 'rgba(255,255,255,0.2)'}`,
                          borderRadius: '12px', padding: '8px 12px', cursor: 'pointer',
                          color: '#fff', fontWeight: 800, fontSize: '1rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                          boxShadow: isTgt ? `0 0 12px ${pc}cc` : '0 4px 8px rgba(0,0,0,0.4)',
                        }}
                      >
                        <span style={{ fontSize: '1.4rem' }}>{av}</span>
                        <span>{p.name}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* LE CANVAS DE DÉS (Masqué pendant la sélection des cibles pour libérer le champ visuel) */}
        <div style={{ 
          flex: 1, 
          width: '100%', 
          position: 'relative', 
          zIndex: 1,
          opacity: (needsTarget && targetableOtherPlayers.length > 0 && !result) ? 0 : 1,
          transition: 'opacity 0.2s ease'
        }}>
          <DiceScene
            rollCount={rollCount}
            onResult={handleResult}
            extraDie={hasPermExtraDie}
            switchCount={switchCount}
            singleDie={isTeleporteur || isDeMaudit || isInvest || rollingSingleDie}
            muted={musicMuted}
          />
        </div>

        <div style={{ position: 'relative', width: '100%', height: '60px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '16px', zIndex: 15 }}>

          {teleporteurLabel && !result && (
            <div style={{
              position: 'absolute', bottom: '54px', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 2
            }}>
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'rgba(124,58,237,0.2)', border: '1px solid #a78bfa55',
                  borderRadius: '10px', padding: '4px 14px',
                  color: '#a78bfa', fontSize: '0.72rem', fontWeight: 800,
                  letterSpacing: '1px', textAlign: 'center',
                }}
              >{teleporteurLabel}</motion.div>
            </div>
          )}

          {result && onEndTurn ? (
            <motion.button
              key="end-turn"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
              onClick={() => onEndTurn(result?.total ?? 0, { skipSquare: skipSquareOnEnd })}
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
          ) : isEncoreEmpty ? (
            <div style={{ color: '#f0c04088', fontSize: '0.78rem', fontStyle: 'italic', paddingBottom: '4px', zIndex: 1 }}>
              ↩️ Aucun objet à rejouer
            </div>
          ) : (isDeMaudit && !itemTargetId) ? (
            <div style={{ color: '#f0c04088', fontSize: '0.78rem', fontStyle: 'italic', paddingBottom: '4px', zIndex: 1 }}>
              ☝️ Choisissez une cible
            </div>
          ) : (
            <motion.button
              whileHover={rollBtnActive ? { scale: 1.08 } : {}}
              whileTap={rollBtnActive ? { scale: 0.94 } : {}}
              onClick={handleRoll}
              disabled={!rollBtnActive}
              style={{
                background: rollBtnActive
                  ? effItem
                    ? 'linear-gradient(135deg, #d97706, #b45309)'
                    : 'linear-gradient(135deg, #e63946, #c1121f)'
                  : 'rgba(255,255,255,0.08)',
                color: rollBtnActive ? '#fff' : '#444',
                fontWeight: 900, fontSize: '1rem', letterSpacing: '2px',
                padding: '8px 32px', borderRadius: '30px',
                border: rollBtnActive
                  ? effItem ? '3px solid #f0c040' : '3px solid #ff6b6b'
                  : '3px solid transparent',
                cursor: rollBtnActive ? 'pointer' : 'not-allowed',
                boxShadow: rollBtnActive
                  ? effItem ? '0 4px 20px rgba(217,119,6,0.7)' : '0 4px 20px rgba(230,57,70,0.6)'
                  : 'none',
                fontFamily: '"Fredoka One", "Nunito", sans-serif',
                zIndex: 1, transition: 'all 0.2s',
              }}
            >
              {effItem ? `🎲 LANCER ${effItem.icon}` : '🎲 LANCER'}
            </motion.button>
          )}
        </div>
      </div>

      {/* 3. BARRE D'INVENTAIRE EN DESSOUS */}
      <div style={{ position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)', width: '460px', display: 'flex', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          {activePlayer && (((activeItems.length > 0 && !usedItemThisTurn && !isRollingState) || passiveItems.length > 0)) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}
            >
              {(!usedItemThisTurn && !isRollingState ? activeItems : []).map(item => {
                const on = activeItemUid === item.uid;
                return (
                  <motion.button
                    key={item.uid}
                    whileTap={{ scale: 0.88 }}
                    onClick={() => {
                      if (isFinishedActive || isRollingState) return;
                      if (usedItemThisTurn && activeItemUid !== item.uid) return;
                      setActiveItemUid(prev => prev === item.uid ? null : item.uid);
                      setItemTargetId(null);
                    }}
                    title={`${item.name} — ${item.desc}`}
                    style={{
                      background: on ? 'linear-gradient(135deg, #f0c040, #d97706)' : 'rgba(255,255,255,0.12)',
                      border: on ? '2px solid #f0c040' : '2px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px', padding: '6px 14px',
                      cursor: isRollingState ? 'not-allowed' : (usedItemThisTurn && !on ? 'not-allowed' : 'pointer'), 
                      fontSize: '1.3rem', lineHeight: 1,
                      boxShadow: on ? '0 0 14px #f0c04099' : 'none',
                      transition: 'all 0.18s',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                  >
                    {item.icon}
                    {on && <span style={{ fontSize: '0.65rem', color: '#1a1a2e', fontWeight: 900 }}>ACTIF</span>}
                  </motion.button>
                );
              })}
              {passiveItems.map(item => (
                <div key={item.uid} title={`${item.name} — ${item.desc}`} style={{
                  background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.45)',
                  borderRadius: '12px', padding: '6px 14px', fontSize: '1.3rem', lineHeight: 1,
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  {item.icon}
                  <span style={{ fontSize: '0.58rem', color: '#4ade80', fontWeight: 900, letterSpacing: '0.5px' }}>PASSIF</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. BULLE DE RÉSULTAT */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 10, x: '-50%' }}
            animate={{ scale: 1, opacity: 1, y: 0, x: '-50%' }}
            exit={{ scale: 0, opacity: 0, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              position: 'absolute', top: '460px', left: '50%',
              background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
              border: '3px solid #f0c040', borderRadius: '20px',
              padding: '12px 36px', textAlign: 'center',
              boxShadow: '0 10px 30px rgba(240,192,64,0.4)',
              whiteSpace: 'nowrap', zIndex: 20,
            }}
          >
            {teleporteurLabel ? (
              <div style={{ color: '#a78bfa', fontSize: '0.85rem', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 800 }}>
                {teleporteurLabel}
              </div>
            ) : (
              <div style={{ color: '#aaa', fontSize: '0.85rem', letterSpacing: '3px', marginBottom: '4px' }}>RÉSULTAT</div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'center' }}>
              {!teleporteurLabel && (
                <>
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
                </>
              )}
              
              <motion.span
                initial={{ scale: 0.5 }} animate={{ scale: [1.4, 1] }} transition={{ type: 'spring' }}
                style={{ color: '#f0c040', fontSize: '3.6rem', fontWeight: 900, textShadow: '0 0 20px #f0c040' }}
              >
                {teleporteurLabel ? specialIcon : result.total}
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}