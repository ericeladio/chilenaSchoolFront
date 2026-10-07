import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { sendChat } from '../lib/chatApi'

const GREETING = {
  from: 'bot',
  text: '¡Hola! Soy el asistente del club. Pregúntame por equipos, horarios, torneos o partidos.',
}

export default function WebChat() {
  const { user, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, busy, open])

  if (!user) return null

  async function submit(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setMessages((m) => [...m, { from: 'me', text }])
    setBusy(true)
    try {
      const reply = await sendChat(text, profile?.id ?? user.id)
      setMessages((m) => [...m, { from: 'bot', text: reply }])
    } catch {
      setMessages((m) => [
        ...m,
        { from: 'bot', text: 'El asistente no está disponible en este momento. Intenta de nuevo en unos segundos.' },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-[128px] right-[56px] z-30 flex h-[480px] w-[360px] flex-col overflow-hidden rounded-[32px] border border-black/8 bg-white shadow-[0_20px_60px_rgba(2,99,232,0.25)] max-[640px]:bottom-[96px] max-[640px]:left-4 max-[640px]:right-4 max-[640px]:w-auto">
          <div className="flex items-center justify-between bg-[#0263E8] px-5 py-4">
            <div>
              <p className="text-[15px] font-bold text-white">Asistente del club</p>
              <p className="text-[12px] text-white/70">Respuestas instantáneas</p>
            </div>
            <button
              type="button"
              aria-label="Cerrar chat"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div
            ref={listRef}
            className="flex flex-1 flex-col gap-2 overflow-y-auto bg-[#EDF7FF] px-4 py-4"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.from === 'me'
                    ? 'max-w-[85%] self-end whitespace-pre-wrap rounded-[20px] rounded-br-md bg-[#0263E8] px-4 py-2.5 text-[13.5px] leading-[19px] text-white'
                    : 'max-w-[85%] self-start whitespace-pre-wrap rounded-[20px] rounded-bl-md border border-black/5 bg-white px-4 py-2.5 text-[13.5px] leading-[19px] text-black/80'
                }
              >
                {m.text}
              </div>
            ))}
            {busy && (
              <span className="self-start rounded-[20px] rounded-bl-md border border-black/5 bg-white px-4 py-2.5 text-[13px] italic text-black/45">
                Escribiendo…
              </span>
            )}
          </div>

          <form onSubmit={submit} className="flex gap-2 border-t border-black/8 bg-white p-3">
            <input
              className="min-w-0 flex-1 rounded-2xl border border-black/15 px-4 py-2.5 text-[14px] text-black outline-none transition-colors focus:border-[#0263E8]"
              placeholder="Escribe un mensaje…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={2000}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="shrink-0 rounded-2xl bg-[#0263E8] px-4 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Enviar
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-[56px] right-[56px] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#0263E8] text-white shadow-[0_12px_30px_rgba(2,99,232,0.4)] transition-transform hover:scale-105 max-[640px]:bottom-6 max-[640px]:right-6"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V15C20 16.1046 19.1046 17 18 17H9L5 20.5V17H6C4.89543 17 4 16.1046 4 15V6Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="10.5" r="1" fill="currentColor" />
            <circle cx="12.5" cy="10.5" r="1" fill="currentColor" />
            <circle cx="16" cy="10.5" r="1" fill="currentColor" />
          </svg>
        )}
      </button>
    </>
  )
}
