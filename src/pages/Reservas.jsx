import { useCallback, useEffect, useMemo, useState } from 'react'
import Page from '../components/Page'
import { useAuth } from '../auth/AuthProvider'
import { insforge } from '../lib/insforge'
import { addDaysISO, formatDate, timeLabel, todayISO } from '../lib/format'
import {
  btnDanger,
  btnGhost,
  btnPrimary,
  errorCls,
  inputCls,
  modalBackdrop,
  modalCard,
  noticeCls,
} from '../lib/ui'

function mondayOf(iso) {
  const d = new Date(`${iso}T12:00:00`)
  const offset = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - offset)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export default function Reservas() {
  const { user, role } = useAuth()
  const isAdmin = role === 'admin'
  const isCoach = role === 'coach'
  const canWrite = isAdmin || isCoach

  const [weekStart, setWeekStart] = useState(() => mondayOf(todayISO()))
  const [slots, setSlots] = useState([])
  const [reservations, setReservations] = useState([])
  const [teams, setTeams] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState(null)

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i)), [weekStart])

  const load = useCallback(async () => {
    const weekEnd = addDaysISO(weekStart, 6)
    const [s, r, t, to] = await Promise.all([
      insforge.database.from('slots').select('*').order('id'),
      insforge.database.from('reservations').select('*').gte('date', weekStart).lte('date', weekEnd),
      insforge.database.from('teams').select('id, name, coach_id').order('name'),
      insforge.database.from('tournaments').select('id, name').order('created_at'),
    ])
    if (s.error) setError(s.error.message)
    else setSlots(s.data ?? [])
    if (r.error) setError(r.error.message)
    else setReservations(r.data ?? [])
    setTeams(t.data ?? [])
    setTournaments(to.data ?? [])
  }, [weekStart])

  useEffect(() => {
    void load()
  }, [load])

  const byCell = useMemo(() => {
    const map = {}
    for (const r of reservations) map[`${r.date}|${r.slot_id}`] = r
    return map
  }, [reservations])

  const myTeams = useMemo(() => teams.filter((t) => t.coach_id === user?.id), [teams, user])
  const teamsForSelect = isAdmin ? teams : myTeams

  function canManageRes(r) {
    return isAdmin || (r.purpose === 'training' && r.team_id != null && myTeams.some((t) => t.id === r.team_id))
  }

  function openCreate(date, slotId) {
    setError('')
    const team = teamsForSelect[0]
    setForm({
      mode: 'create',
      date,
      slot_id: slotId,
      title: team?.name ?? '',
      purpose: 'training',
      team_id: team?.id ?? '',
      tournament_id: '',
      attendees: 10,
    })
  }

  function openEdit(r) {
    setError('')
    setForm({
      mode: 'edit',
      id: r.id,
      date: r.date,
      slot_id: r.slot_id,
      title: r.title,
      purpose: r.purpose,
      team_id: r.team_id ?? '',
      tournament_id: r.tournament_id ?? '',
      attendees: r.attendees,
    })
  }

  async function save(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    const payload = {
      date: form.date,
      slot_id: Number(form.slot_id),
      title: form.title.trim() || 'Reserva',
      purpose: form.purpose,
      team_id: form.purpose === 'training' && form.team_id ? form.team_id : null,
      tournament_id: form.purpose === 'tournament' && form.tournament_id ? form.tournament_id : null,
      attendees: Math.max(0, Math.min(100, Number(form.attendees) || 0)),
    }
    if (payload.attendees > 100) return setError('El aforo máximo es de 100 personas')
    const { error: err } = form.mode === 'edit'
      ? await insforge.database.from('reservations').update(payload).eq('id', form.id)
      : await insforge.database.from('reservations').insert([payload])
    if (err) {
      if (String(err.code) === '23505' || /duplicate|unique/i.test(err.message ?? '')) {
        setError('Ese horario ya está reservado para esa fecha. Elige otro slot.')
      } else {
        setError(err.message)
      }
      return
    }
    setForm(null)
    setNotice(form.mode === 'edit' ? 'Reserva actualizada' : 'Reserva creada')
    await load()
  }

  async function remove() {
    if (!form?.id) return
    if (!window.confirm('¿Eliminar esta reserva?')) return
    const { error: err } = await insforge.database.from('reservations').delete().eq('id', form.id)
    if (err) setError(err.message)
    else {
      setForm(null)
      setNotice('Reserva eliminada')
      await load()
    }
  }

  const teamName = (id) => teams.find((t) => t.id === id)?.name ?? ''

  return (
    <Page
      title="Reservas"
      subtitle="Estadio · aforo máximo 100 personas · slots fijos de 2 horas"
      actions={
        <div className="flex items-center gap-2">
          <button type="button" className={btnGhost} onClick={() => setWeekStart((w) => addDaysISO(w, -7))}>
            ← Semana
          </button>
          <span className="min-w-[150px] text-center text-[14px] font-semibold text-black/70">
            {formatDate(weekStart)} – {formatDate(addDaysISO(weekStart, 6))}
          </span>
          <button type="button" className={btnGhost} onClick={() => setWeekStart((w) => addDaysISO(w, 7))}>
            Semana →
          </button>
          <button type="button" className={btnGhost} onClick={() => setWeekStart(mondayOf(todayISO()))}>
            Hoy
          </button>
        </div>
      }
    >
      {error && <p className={errorCls}>{error}</p>}
      {notice && <p className={`${noticeCls} mt-3`}>{notice}</p>}

      <div className="mt-5 overflow-x-auto rounded-[24px] border border-black/8">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="bg-[#EDF7FF]">
              <th className="px-4 py-3 text-[13px] font-semibold text-black/60">Horario</th>
              {days.map((d) => (
                <th
                  key={d}
                  className={`px-3 py-3 text-[13px] font-semibold ${
                    d === todayISO() ? 'text-[#0263E8]' : 'text-black/60'
                  }`}
                >
                  {formatDate(d, { weekday: 'short', day: 'numeric' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot.id} className="border-t border-black/8">
                <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-black/70">
                  {timeLabel(slot)}
                </td>
                {days.map((d) => {
                  const res = byCell[`${d}|${slot.id}`]
                  return (
                    <td key={d} className="border-l border-black/8 p-2 align-top">
                      {res ? (
                        <button
                          type="button"
                          onClick={() => canWrite && canManageRes(res) && openEdit(res)}
                          className={`w-full rounded-2xl px-2.5 py-2 text-left transition-colors ${
                            res.purpose === 'tournament'
                              ? 'bg-amber-100 hover:bg-amber-200'
                              : 'bg-[#DCEEFF] hover:bg-[#CDE5FF]'
                          } ${canWrite && canManageRes(res) ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          <span className="block truncate text-[12.5px] font-semibold text-black">{res.title}</span>
                          <span className="block text-[11px] text-black/55">
                            {res.purpose === 'tournament' ? 'Torneo' : (teamName(res.team_id) || 'Entrenamiento') +
                              ` · ${res.attendees} pers.`}
                          </span>
                        </button>
                      ) : canWrite ? (
                        <button
                          type="button"
                          onClick={() => openCreate(d, slot.id)}
                          className="w-full rounded-2xl border border-dashed border-black/15 px-2.5 py-2 text-[12px] text-black/40 transition-colors hover:border-[#0263E8] hover:text-[#0263E8]"
                        >
                          + Reservar
                        </button>
                      ) : (
                        <span className="block px-2.5 py-2 text-[12px] text-black/25">Libre</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-[12px] text-black/55">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-[#DCEEFF]" /> Entrenamiento
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-amber-100" /> Torneo
        </span>
        {!canWrite && <span>Solo administradores y entrenadores pueden reservar.</span>}
      </div>

      {form && (
        <div className={modalBackdrop} onClick={() => setForm(null)}>
          <form className={modalCard} onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <h2 className="text-[22px] font-black italic text-black">
              {form.mode === 'edit' ? 'Editar reserva' : 'Nueva reserva'}
            </h2>
            <p className="mt-1 text-[13px] text-black/55">
              {formatDate(form.date, { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
              {timeLabel(slots.find((s) => s.id === Number(form.slot_id)))}
            </p>
            <div className="mt-5 flex flex-col gap-3">
              {isAdmin && (
                <label className="flex flex-col gap-1 text-[12px] font-medium text-black/60">
                  Tipo
                  <select
                    className={inputCls}
                    value={form.purpose}
                    onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value, team_id: '', tournament_id: '' }))}
                  >
                    <option value="training">Entrenamiento</option>
                    <option value="tournament">Torneo</option>
                  </select>
                </label>
              )}
              {form.purpose === 'training' ? (
                <label className="flex flex-col gap-1 text-[12px] font-medium text-black/60">
                  Equipo
                  <select
                    className={inputCls}
                    value={form.team_id}
                    onChange={(e) => {
                      const t = teams.find((x) => x.id === e.target.value)
                      setForm((f) => ({ ...f, team_id: e.target.value, title: t?.name ?? f.title }))
                    }}
                  >
                    <option value="">Selecciona…</option>
                    {teamsForSelect.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="flex flex-col gap-1 text-[12px] font-medium text-black/60">
                  Torneo (opcional)
                  <select
                    className={inputCls}
                    value={form.tournament_id}
                    onChange={(e) => setForm((f) => ({ ...f, tournament_id: e.target.value }))}
                  >
                    <option value="">Sin vínculo</option>
                    {tournaments.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="flex flex-col gap-1 text-[12px] font-medium text-black/60">
                Título
                <input
                  className={inputCls}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1 text-[12px] font-medium text-black/60">
                Asistentes (máx. 100)
                <input
                  type="number"
                  min="0"
                  max="100"
                  className={inputCls}
                  value={form.attendees}
                  onChange={(e) => setForm((f) => ({ ...f, attendees: e.target.value }))}
                />
              </label>
            </div>
            {error && <p className={`${errorCls} mt-4`}>{error}</p>}
            <div className="mt-6 flex items-center justify-between">
              {form.mode === 'edit' ? (
                <button type="button" className={btnDanger} onClick={remove}>
                  Eliminar
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-3">
                <button type="button" className={btnGhost} onClick={() => setForm(null)}>
                  Cancelar
                </button>
                <button type="submit" className={btnPrimary}>
                  Guardar
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </Page>
  )
}
