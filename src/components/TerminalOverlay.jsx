import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const RESPONSES = {
  help: [
    { t: 'info', s: 'Commandes disponibles :' },
    { t: 'cmd',  s: '  status    — État du système' },
    { t: 'cmd',  s: '  clear     — Effacer la console' },
    { t: 'cmd',  s: '  help      — Afficher cette aide' },
  ],
  status: [
    { t: 'info', s: `Système REGAME AWAKE — opérationnel` },
    { t: 'info', s: `Secteur spatial : stable` },
    { t: 'info', s: `Astres détectés : aucun objet non-identifié...` },
  ],
}

const COLOR = {
  system:  '#6ab0ff',
  info:    '#a0e0a0',
  cmd:     '#d4a8ff',
  input:   '#f0c040',
  error:   '#ff7070',
  success: '#7fffb0',
}

export default function TerminalOverlay() {
  const [isOpen, setIsOpen]   = useState(false)
  const [input, setInput]     = useState('')
  const [history, setHistory] = useState([
    { t: 'system', s: 'Console REGAME AWAKE v1.0 — Tapez « help » pour l\'aide.' },
  ])
  const inputRef  = useRef(null)
  const bodyRef   = useRef(null)

  useEffect(() => {
    const down = (e) => {
      if (e.key === '`' || e.key === '²' || e.key === 'F1') {
        e.preventDefault()
        setIsOpen(p => !p)
      }
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 60)
  }, [isOpen])

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [history])

  const push = (lines) => setHistory(p => [...p, ...lines])

  const submit = (e) => {
    e.preventDefault()
    const raw = input.trim()
    const cmd = raw.toLowerCase()
    if (!raw) return
    push([{ t: 'input', s: `> ${raw}` }])
    setInput('')

    if (cmd === 'clear') {
      setHistory([{ t: 'system', s: 'Console effacée.' }])
    } else if (RESPONSES[cmd]) {
      push(RESPONSES[cmd])
    } else {
      push([{ t: 'error', s: `Commande inconnue : "${raw}". Tapez "help".` }])
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="terminal"
          initial={{ opacity: 0, y: 16, scaleY: 0.85 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: 16, scaleY: 0.85 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          style={{
            position: 'fixed',
            bottom: '74px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(600px, 96vw)',
            background: 'rgba(4, 2, 22, 0.96)',
            border: '1px solid rgba(106, 176, 255, 0.35)',
            borderRadius: '14px',
            padding: '14px 18px 10px',
            fontFamily: '"Courier New", "Consolas", monospace',
            fontSize: '0.82rem',
            zIndex: 500,
            backdropFilter: 'blur(24px)',
            boxShadow: '0 0 40px rgba(106,176,255,0.12), inset 0 0 60px rgba(0,0,40,0.6)',
            userSelect: 'none',
          }}
          onClick={() => inputRef.current?.focus()}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            borderBottom: '1px solid rgba(106,176,255,0.2)',
            paddingBottom: '8px', marginBottom: '10px',
          }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              {['#ff5f57','#febc2e','#28c840'].map(c => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />
              ))}
            </div>
            <span style={{ color: '#6ab0ff', fontSize: '0.75rem', letterSpacing: '2px', flex: 1, textAlign: 'center' }}>
              CONSOLE — REGAME AWAKE
            </span>
            <span style={{ color: '#444', fontSize: '0.68rem' }}>[`] fermer</span>
          </div>

          <div
            ref={bodyRef}
            style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}
          >
            {history.map((line, i) => (
              <div key={i} style={{ color: COLOR[line.t] ?? '#ccc', lineHeight: 1.5 }}>
                {line.s}
              </div>
            ))}
          </div>

          <form onSubmit={submit} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#6ab0ff', fontWeight: 700 }}>{'>'}</span>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#f0c040', fontFamily: 'inherit', fontSize: '0.82rem',
                caretColor: '#f0c040',
              }}
            />
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
