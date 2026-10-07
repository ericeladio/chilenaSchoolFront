const BASE = import.meta.env.VITE_BOT_URL || 'http://localhost:8787'

export async function sendChat(text, profileId) {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, profileId }),
  })
  if (!res.ok) throw new Error(`chat_${res.status}`)
  const data = await res.json().catch(() => null)
  if (!data || typeof data.reply !== 'string') throw new Error('chat_format')
  return data.reply
}
