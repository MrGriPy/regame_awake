import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_SHOP_ITEMS, PLAYER_COLORS, PLAYER_AVATARS } from "../gameData";

function pickItems(pool, count) {
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(count, arr.length));
}

export default function Shop({ activePlayer, shopDiscountRounds, onBuy, onSpendMoney, onDone }) {
  const [visitItems, setVisitItems] = useState([]);
  const [rerollCount, setRerollCount] = useState(0);
  const [boughtId, setBoughtId] = useState(null);
  const [flash, setFlash] = useState(null);
  const seenSpecialsRef = useRef({});

  const hasVIP = activePlayer?.items?.some((i) => i.id === "vip");
  const cardCount = hasVIP ? 4 : 3;
  const isFinished = (activePlayer?.diceTotal ?? 0) >= 63;

  const rollItems = useCallback(() => {
    const pid = activePlayer?.id;
    if (!pid) return;
    if (!seenSpecialsRef.current[pid]) seenSpecialsRef.current[pid] = new Set();
    const seen = seenSpecialsRef.current[pid];
    const count = hasVIP ? 4 : 3;
    const regulars = ALL_SHOP_ITEMS.filter((i) => !i.special);
    const availSpecials = ALL_SHOP_ITEMS.filter(
      (i) => i.special && !seen.has(i.id),
    );
    const specialArr =
      availSpecials.length > 0 && Math.random() < 0.3
        ? pickItems(availSpecials, 1)
        : [];
    specialArr.forEach((s) => seen.add(s.id));
    const regularArr = pickItems(regulars, count - specialArr.length);
    setVisitItems(pickItems([...specialArr, ...regularArr], count));
  }, [hasVIP, activePlayer?.id]);

  useEffect(() => {
    rollItems();
    setRerollCount(0);
    setBoughtId(null);
    setFlash(null);
  }, [activePlayer?.id]);

  const rerollCost = 5 * Math.pow(2, rerollCount);
  const canReroll =
    activePlayer && !boughtId && activePlayer.money >= rerollCost && !isFinished;

  const handleReroll = () => {
    if (!canReroll) return;
    onSpendMoney(activePlayer.id, rerollCost);
    setRerollCount((r) => r + 1);
    rollItems();
  };

  const handleBuy = (item) => {
    const effectiveCost = shopDiscountRounds > 0 ? Math.ceil(item.cost / 2) : item.cost;
    if (!activePlayer || activePlayer.money < effectiveCost || boughtId || isFinished) return;
    onBuy(activePlayer.id, item.id, effectiveCost);
    setBoughtId(item.id);
    setFlash(item.id);
    setTimeout(() => setFlash(null), 1600);
  };

  const color = PLAYER_COLORS[activePlayer?.colorIndex ?? 0];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: activePlayer ? "center" : "flex-start", // Garde le centrage vertical
        padding: "24px 20px", // Réduit pour gagner de l'espace vertical
        gap: "18px", // Écartement plus compact et propre
        overflowY: "auto",
      }}
    >
      <motion.h2
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          fontFamily: '"Fredoka One", "Nunito", sans-serif',
          fontSize: "3.4rem", // Réduit de 4.2rem à 3.4rem
          fontWeight: 900,
          margin: 0,
          background: "linear-gradient(135deg, #f0c040, #ff6b6b, #a855f7)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "4px",
        }}
      >
        🛍️ BOUTIQUE
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: "rgba(26,26,46,0.85)",
          border: `2px solid ${activePlayer ? color + "66" : "rgba(255,255,255,0.1)"}`,
          borderRadius: "18px",
          padding: "12px 28px", // Plus compact
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        {activePlayer ? (
          <>
            <span
              style={{
                fontSize: "2.3rem", // Réduit
                filter: `drop-shadow(0 0 7px ${color})`,
              }}
            >
              {activePlayer.avatar ?? PLAYER_AVATARS[activePlayer.colorIndex ?? 0]}
            </span>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
              <span
                style={{
                  color: "#aaa",
                  fontSize: "0.85rem",
                  letterSpacing: "1.5px",
                  fontWeight: "bold",
                }}
              >
                JOUEUR ACTIF
              </span>
              <span style={{ color, fontWeight: 900, fontSize: "1.35rem" }}>
                {activePlayer.name}
              </span>
            </div>
            <span
              style={{
                color: "#FFD700",
                fontWeight: 900,
                fontSize: "1.3rem",
                marginLeft: "10px",
              }}
            >
              💰 {activePlayer.money}€
            </span>
            {shopDiscountRounds > 0 && (
              <span
                style={{
                  marginLeft: "10px",
                  background: "rgba(59,130,246,0.18)",
                  border: "1px solid rgba(59,130,246,0.35)",
                  borderRadius: "12px",
                  padding: "4px 12px",
                  color: "#bfdbfe",
                  fontSize: "0.9rem",
                  fontWeight: 800,
                }}
              >
                SOLDES {shopDiscountRounds} tour{shopDiscountRounds > 1 ? 's' : ''}
              </span>
            )}
            {boughtId && (
              <span
                style={{
                  marginLeft: "10px",
                  background: "rgba(34,197,94,0.2)",
                  border: "1px solid #22c55e",
                  borderRadius: "12px",
                  padding: "4px 12px",
                  color: "#4ade80",
                  fontSize: "0.9rem",
                  fontWeight: 800,
                }}
              >
                ✓ Acheté
              </span>
            )}
          </>
        ) : (
          <span
            style={{ color: "#555", fontStyle: "italic", fontSize: "1.1rem" }}
          >
            🔒 Accessible uniquement sur une case Boutique
          </span>
        )}
      </motion.div>

      {!activePlayer ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
          }}
        >
          <div style={{ fontSize: "5rem" }}>🔒</div>
          <div
            style={{
              color: "#555",
              fontSize: "1.2rem",
              textAlign: "center",
              maxWidth: "400px",
            }}
          >
            Seul le joueur actif peut acheter lorsqu'il tombe sur une case Boutique.
          </div>
        </motion.div>
      ) : isFinished ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
          <div style={{ fontSize: '3.5rem' }}>🏁</div>
          <div style={{ color: '#aaa', fontSize: '1.2rem', textAlign: 'center', maxWidth: '400px' }}>Joueur arrivé — la Boutique est désactivée.</div>
        </motion.div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cardCount <= 3 ? 3 : 4}, 1fr)`,
              gap: "18px", // Réduit pour un meilleur ajustement global
              width: "100%",
              maxWidth: cardCount <= 3 ? "1050px" : "1320px",
            }}
          >
            <AnimatePresence mode="popLayout">
              {visitItems.map((item, i) => {
                const itemCost = shopDiscountRounds > 0 ? Math.ceil(item.cost / 2) : item.cost;
                const canAfford = activePlayer.money >= itemCost;
                const isBought = boughtId === item.id;
                const isDisabled = !!boughtId && !isBought;
                return (
                  <motion.div
                    key={item.id + "-" + rerollCount}
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: isDisabled ? 0.38 : 1 }}
                    exit={{
                      rotateY: -90,
                      opacity: 0,
                      transition: { duration: 0.18, ease: "easeIn" },
                    }}
                    transition={{
                      delay: 0.22 + 0.09 * i,
                      duration: 0.32,
                      ease: "easeOut",
                    }}
                    whileHover={
                      canAfford && !boughtId ? { scale: 1.04, y: -3 } : {}
                    }
                    style={{
                      background: isBought
                        ? "linear-gradient(135deg, rgba(34,197,94,0.22), rgba(22,163,74,0.12))"
                        : item.special
                          ? "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(26,26,46,0.95))"
                          : "linear-gradient(135deg, rgba(26,26,46,0.95), rgba(22,33,62,0.95))",
                      border: isBought
                        ? "2px solid #22c55e"
                        : item.special
                          ? "2px solid rgba(168,85,247,0.55)"
                          : canAfford
                            ? "2px solid rgba(240,192,64,0.4)"
                            : "2px solid rgba(255,255,255,0.07)",
                      borderRadius: "22px",
                      padding: "22px 16px", // Plus équilibré
                      textAlign: "center",
                      backdropFilter: "blur(8px)",
                      transition: "all 0.25s",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      transformPerspective: 800,
                      boxShadow: isBought
                        ? "0 0 20px rgba(34,197,94,0.3)"
                        : item.special
                          ? "0 0 16px rgba(168,85,247,0.2)"
                          : "none",
                    }}
                  >
                    {item.special && (
                      <div
                        style={{
                          fontSize: "0.8rem",
                          letterSpacing: "1.5px",
                          color: "#c084fc",
                          fontWeight: 800,
                          marginBottom: "6px",
                          textTransform: "uppercase",
                        }}
                      >
                        Objet Spécial
                      </div>
                    )}
                    <motion.div
                      animate={
                        isBought
                          ? { scale: [1, 1.35, 1], rotate: [0, 12, -12, 0] }
                          : {}
                      }
                      style={{
                        fontSize: "3.8rem", // Réduit un peu
                        marginBottom: "10px",
                        lineHeight: 1,
                      }}
                    >
                      {item.icon}
                    </motion.div>
                    <div
                      style={{
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: "1.35rem", // Idéal pour la lisibilité
                        marginBottom: "6px",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        color: "#bbb",
                        fontSize: "1rem", // Légèrement plus condensé
                        marginBottom: "14px",
                        lineHeight: 1.4,
                      }}
                    >
                      {item.desc}
                    </div>
                    <div
                      style={{
                        marginTop: "auto",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "12px",
                        width: "100%",
                      }}
                    >
                      <span
                        style={{
                          background: "rgba(240,192,64,0.14)",
                          border: "1px solid rgba(240,192,64,0.38)",
                          borderRadius: "20px",
                          padding: '5px 16px',
                          color: "#f0c040",
                          fontSize: "1.2rem",
                          fontWeight: 900,
                        }}
                      >
                        💰 {itemCost}€
                      </span>
                      {shopDiscountRounds > 0 && (
                        <span
                          style={{
                            color: '#a5b4fc',
                            fontSize: '0.85rem',
                            marginTop: '4px',
                            fontWeight: 700
                          }}
                        >
                          50% OFF – {shopDiscountRounds} tour{shopDiscountRounds > 1 ? 's' : ''}
                        </span>
                      )}
                      <motion.button
                        whileTap={canAfford && !boughtId ? { scale: 0.88 } : {}}
                        onClick={() => handleBuy(item)}
                        disabled={!canAfford || !!boughtId}
                        style={{
                          background: isBought
                            ? "linear-gradient(135deg, #22c55e, #16a34a)"
                            : canAfford && !boughtId
                              ? "linear-gradient(135deg, #e63946, #c1121f)"
                              : "rgba(255,255,255,0.07)",
                          color: canAfford && !boughtId ? "#fff" : "#555",
                          border: "none",
                          borderRadius: "18px",
                          padding: "10px 24px",
                          fontWeight: 800,
                          cursor:
                            canAfford && !boughtId ? "pointer" : "not-allowed",
                          fontSize: "1.15rem",
                          boxShadow:
                            canAfford && !boughtId && !isBought
                              ? "0 4px 12px rgba(230,57,70,0.45)"
                              : "none",
                          transition: "all 0.2s",
                        }}
                      >
                        {isBought
                          ? "✓ Acheté !"
                          : boughtId
                            ? "Indisponible"
                            : "Acheter"}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              marginTop: "10px",
            }}
          >
            <motion.button
              whileHover={canReroll ? { scale: 1.05 } : {}}
              whileTap={canReroll ? { scale: 0.95 } : {}}
              onClick={handleReroll}
              disabled={!canReroll}
              style={{
                background: canReroll
                  ? "linear-gradient(135deg, #0ea5e9, #0369a1)"
                  : "rgba(255,255,255,0.06)",
                border: canReroll
                  ? "2px solid #38bdf8"
                  : "transparent",
                borderRadius: "35px",
                padding: "12px 36px",
                color: canReroll ? "#fff" : "#555",
                fontWeight: 800,
                fontSize: "1.15rem",
                letterSpacing: "1px",
                cursor: canReroll ? "pointer" : "not-allowed",
                boxShadow: canReroll
                  ? "0 4px 18px rgba(14,165,233,0.45)"
                  : "none",
                transition: "all 0.2s",
              }}
            >
              🔄 Reroll
            </motion.button>
            <span
              style={{
                color: canReroll ? "#38bdf8" : "#555",
                fontSize: "1.1rem",
                fontWeight: 700,
              }}
            >
              Coût : {rerollCost}€
              {rerollCount > 0 && (
                <span style={{ color: "#777", marginLeft: "6px" }}>
                  ({rerollCount}x)
                </span>
              )}
            </span>
            {boughtId && (
              <span
                style={{
                  color: "#666",
                  fontSize: "1rem",
                  fontStyle: "italic",
                }}
              >
                Reroll indisponible après achat
              </span>
            )}
          </div>

          <AnimatePresence>
            {flash && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{
                  background: "linear-gradient(135deg, #22c55e22, #16a34a14)",
                  border: "1px solid #22c55e",
                  borderRadius: "14px",
                  padding: "10px 22px",
                  color: "#4ade80",
                  fontWeight: 700,
                  fontSize: "1.2rem",
                }}
              >
                {ALL_SHOP_ITEMS.find((i) => i.id === flash)?.icon} Acheté par{" "}
                {activePlayer.name} !
              </motion.div>
            )}
          </AnimatePresence>
          {onDone && (
            <motion.button
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              onClick={onDone}
              style={{
                background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
                border: "2px solid #a78bfa", borderRadius: "28px",
                padding: "12px 36px", color: "#fff", fontWeight: 900,
                fontSize: "1.15rem",
                cursor: "pointer", letterSpacing: "1.5px",
                boxShadow: "0 4px 14px rgba(124,58,237,0.5)", marginTop: "12px",
              }}
            >▶ Fermer la boutique</motion.button>
          )}
        </>
      )}
    </div>
  );
}