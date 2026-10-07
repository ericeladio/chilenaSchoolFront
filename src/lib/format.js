export function todayISO() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function addDaysISO(iso, days) {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function formatDate(iso, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('es-MX', opts)
}

export function formatLongDate(iso) {
  return formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long' })
}

export function ageFrom(birthDate) {
  if (!birthDate) return null
  const b = new Date(`${birthDate}T12:00:00`)
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return age
}

export function timeLabel(slot) {
  if (!slot) return ''
  return `${slot.start_time.slice(0, 5)}–${slot.end_time.slice(0, 5)}`
}
