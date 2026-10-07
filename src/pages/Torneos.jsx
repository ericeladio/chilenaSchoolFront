import { useCallback, useEffect, useMemo, useState } from 'react'
import Page from '../components/Page'
import { useAuth } from '../auth/AuthProvider'
import { insforge } from '../lib/insforge'
import { addDaysISO, formatDate, timeLabel, todayISO } from '../lib/format'
import {
  btnDanger,
  btnGhost,
  btnPrimary,
  cardCls,
  errorCls,
  inputCls,
  modalBackdrop,
  modalCard,
  noticeCls,
} from '../lib/ui'

function roundRobin(participants) {
  const arr = [...participants]
  if (arr.length % 2) arr.push(null)
  const n = arr.length
  const rounds = []
  const fixed = arr[0]
  let rot = arr.slice(1)
  for (let r = 0; r < n - 1; r++) {
    const lineup = [fixed, ...rot]
    const pairs = []
    for (let i = 0; i < n / 2; i++) {
      const a = lineup[i]
      const b = lineup[n - 1 - i]
      if (a && b) pairs.push([a, b])
    }
    rounds.push(pairs)
    rot = [rot[rot.length - 1], ...rot.slice(0, rot.length - 1)]
  }
  return rounds
}

const statusLabel = { open: 'Inscripción abierta', ongoing: 'En curso', done: 'Finalizado' }
const kindLabel = { schools: 'Contra otras escuelas', groups: 'Contra otros grupos' }

export default function Torneos() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'

  const [tournaments, setTournaments] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null) // { tournament, participants, matches }
  const [teams, setTeams] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState(null) // new tournament modal
  const [guest, setGuest] = useState({ type: 'team', team_id: '', name: '' })
  const [fixture, setFixture] = useState({ start_date: todayISO(), venue: 'Nuestro estadio', attendees: 50 })

  const loadList = useCallback(async () => {
    const { data, error: err } = await insforge.database
      .from('tournaments')
      .select('id, name, kind, start_date, end_date, status, description, participants:tournament_teams(id), matches(id)')
      .order('start_date')
    if (err) setError(err.message)
    else setTournaments(data ?? [])
  }, [])

  const loadDetail = useCallback(async (id) => {
    const [t, p, m] = await Promise.all([
      insforge.database.from('tournaments').select('*').eq('id', id).maybeSingle(),
      insforge.database
        .from('tournament_teams')
        .select('id, team_id, guest_name, team:team_id(name)')
        .eq('tournament_id', id),
      insforge.database
        .from('matches')
        .select(
          'id, date, slot_id, venue, home_team_id, away_team_id, home_guest, away_guest, home:home_team_id(name), away:away_team_id(name), slot:slot_id(start_time)',
        )
        .eq('tournament_id', id)
        .order('date')
        .limit(200),
    ])
    if (t.error) return setError(t.error.message)
    setDetail({ tournament: t.data, participants: p.data ?? [], matches: m.data ?? [] })
  }, [])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    if (selected) void loadDetail(selected)
    else setDetail(null)
  }, [selected, loadDetail])

  useEffect(() => {
    void (async () => {
      const { data } = await insforge.database.from('teams').select('id, name').order('name')
      setTeams(data ?? [])
    })()
  }, [])

  const enrolledTeamIds = useMemo(
    () => new Set((detail?.participants ?? []).filter((p) => p.team_id).map((p) => p.team_id)),
    [detail],
  )
  const availableTeams = teams.filter((t) => !enrolledTeamIds.has(t.id))

  async function saveTournament(e) {
    e.preventDefault()
    setError('')
    const payload = {
      name: form.name.trim(),
      kind: form.kind,
      start_date: form.start_date,
      end_date: form.end_date || form.start_date,
      description: form.description.trim() || null,
    }
    if (!payload.name) return setError('Ponle un nombre al torneo')
    const { error: err } = form.id
      ? await insforge.database.from('tournaments').update(payload).eq('id', form.id)
      : await insforge.database.from('tournaments').insert([payload])
    if (err) return setError(err.message)
    setForm(null)
    setNotice(form.id ? 'Torneo actualizado' : 'Torneo creado')
    await loadList()
    if (form.id === selected) await loadDetail(form.id)
  }

  async function removeTournament() {
    if (!detail?.tournament) return
    if (!window.confirm(`¿Eliminar el torneo "${detail.tournament.name}"?`)) return
    const { error: err } = await insforge.database.from('tournaments').delete().eq('id', detail.tournament.id)
    if (err) return setError(err.message)
    setSelected(null)
    setNotice('Torneo eliminado')
    await loadList()
  }

  async function setStatus(status) {
    const { error: err } = await insforge.database.from('tournaments').update({ status }).eq('id', selected)
    if (err) return setError(err.message)
    await loadDetail(selected)
    await loadList()
  }

  async function addParticipant(e) {
    e.preventDefault()
    setError('')
    if (guest.type === 'team') {
      if (!guest.team_id) return setError('Selecciona un equipo')
      const { error: err } = await insforge.database
        .from('tournament_teams')
        .insert([{ tournament_id: selected, team_id: guest.team_id }])
      if (err) return setError(err.message)
    } else {
      if (!guest.name.trim()) return setError('Escribe el nombre del equipo invitado')
      const { error: err } = await insforge.database
        .from('tournament_teams')
        .insert([{ tournament_id: selected, guest_name: guest.name.trim() }])
      if (err) return setError(err.message)
    }
    setGuest({ type: 'team', team_id: '', name: '' })
    await loadDetail(selected)
    await loadList()
  }

  async function removeParticipant(p) {
    setError('')
    const teamId = p.team_id
    const guestName = p.guest_name
    const matches = detail?.matches ?? []
    const related = matches.filter((m) =>
      teamId
        ? m.home_team_id === teamId || m.away_team_id === teamId
        : m.home_guest === guestName || m.away_guest === guestName,
    )
    for (const m of related) {
      const { error: err } = await insforge.database.from('matches').delete().eq('id', m.id)
      if (err) return setError(err.message)
    }
    const { error: err } = await insforge.database.from('tournament_teams').delete().eq('id', p.id)
    if (err) return setError(err.message)
    await loadDetail(selected)
    await loadList()
  }

  async function generateFixture(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    const parts = detail.participants
    if (parts.length < 2) return setError('Se necesitan al menos 2 participantes')
    const labelOf = (p) => p.team?.name ?? p.guest_name
    const entityOf = (p, side) =>
      p.team_id ? { [`${side}_team_id`]: p.team_id } : { [`${side}_guest`]: p.guest_name }

    const rounds = roundRobin(parts.map(labelOf))
    const flat = []
    rounds.forEach((pairs) => pairs.forEach(([h, a]) => flat.push([h, a])))
    // los "partidos" son [etiquetaHome, etiquetaAway]; mapear de vuelta a participantes
    const byLabel = new Map(parts.map((p) => [labelOf(p), p]))

    const scheduled = flat.map((pair, i) => {
      const day = Math.floor(i / 3)
      const slotId = (i % 3) + 1
      const home = byLabel.get(pair[0])
      const away = byLabel.get(pair[1])
      return {
        date: addDaysISO(fixture.start_date, day),
        slot_id: slotId,
        venue: fixture.venue,
        tournament_id: selected,
        ...entityOf(home, 'home'),
        ...entityOf(away, 'away'),
      }
    })

    const local = scheduled.filter((m) => m.venue === 'Nuestro estadio')
    if (local.length > 0) {
      const lastDate = local.reduce((mx, m) => (m.date > mx ? m.date : mx), local[0].date)
      const { data: existing, error: e1 } = await insforge.database
        .from('reservations')
        .select('date, slot_id')
        .gte('date', fixture.start_date)
        .lte('date', lastDate)
      if (e1) return setError(e1.message)
      const taken = new Set((existing ?? []).map((r) => `${r.date}|${r.slot_id}`))
      const conflict = local.find((m) => taken.has(`${m.date}|${m.slot_id}`))
      if (conflict) {
        return setError(
          `El slot del ${formatDate(conflict.date)} ${timeLabel({ start_time: `${String(conflict.slot_id === 1 ? '14' : conflict.slot_id === 2 ? '16' : '18')}:00:00` })} ya está reservado. Libéralo en Reservas o cambia la fecha de inicio.`,
        )
      }
      const { data: created, error: e2 } = await insforge.database
        .from('reservations')
        .insert(
          local.map((m) => ({
            date: m.date,
            slot_id: m.slot_id,
            purpose: 'tournament',
            tournament_id: selected,
            title: detail.tournament.name,
            attendees: Math.min(100, Math.max(0, Number(fixture.attendees) || 0)),
          })),
        )
        .select('id, date, slot_id')
      if (e2) return setError(e2.message)
      const resMap = new Map((created ?? []).map((r) => [`${r.date}|${r.slot_id}`, r.id]))
      for (const m of local) m.reservation_id = resMap.get(`${m.date}|${m.slot_id}`) ?? null
    }

    const { error: e3 } = await insforge.database.from('matches').insert(scheduled)
    if (e3) {
      if (local.length > 0) {
        await insforge.database
          .from('reservations')
          .delete()
          .eq('purpose', 'tournament')
          .eq('tournament_id', selected)
          .gte('date', fixture.start_date)
      }
      return setError(e3.message)
    }
    setNotice(`Fixture generado: ${scheduled.length} partidos`)
    await loadDetail(selected)
    await loadList()
  }

  async function removeMatch(id) {
    const { error: err } = await insforge.database.from('matches').delete().eq('id', id)
    if (err) return setError(err.message)
    await loadDetail(selected)
  }

  const matchesByDate = useMemo(() => {
    const map = new Map()
    for (const m of detail?.matches ?? []) {
      if (!map.has(m.date)) map.set(m.date, [])
      map.get(m.date).push(m)
    }
    return [...map.entries()]
  }, [detail])

  return (
    <Page
      title="Torneos"
      subtitle="Inscripción contra otras escuelas o grupos · calendario de partidos"
      actions={
        isAdmin ? (
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setError('')
              setForm({
                name: '',
                kind: 'schools',
                start_date: todayISO(),
                end_date: '',
                description: '',
              })
            }}
          >
            + Nuevo torneo
          </button>
        ) : null
      }
    >
      {error && <p className={errorCls}>{error}</p>}
      {notice && <p className={`${noticeCls} mt-3`}>{notice}</p>}

      <div className="mt-5 grid grid-cols-1 gap-4 min-[1666px]:grid-cols-2">
        {tournaments.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelected(selected === t.id ? null : t.id)}
            className={`${cardCls} text-left transition-colors ${
              selected === t.id ? 'ring-2 ring-[#0263E8]' : 'hover:bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-bold text-black">{t.name}</h2>
                <p className="mt-1 text-[13px] text-black/55">
                  {formatDate(t.start_date)} – {formatDate(t.end_date)}
                </p>
                <p className="mt-0.5 text-[13px] text-black/55">{kindLabel[t.kind]}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  t.status === 'done'
                    ? 'bg-black/10 text-black/60'
                    : t.status === 'ongoing'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-[#DCEEFF] text-[#0263E8]'
                }`}
              >
                {statusLabel[t.status]}
              </span>
            </div>
            <p className="mt-3 text-[12.5px] text-black/50">
              {(t.participants?.length ?? 0)} participantes · {(t.matches?.length ?? 0)} partidos
            </p>
          </button>
        ))}
        {tournaments.length === 0 && (
          <p className="text-[15px] text-black/50">
            {isAdmin ? 'Aún no hay torneos. Crea el primero.' : 'Aún no hay torneos publicados.'}
          </p>
        )}
      </div>

      {detail?.tournament && (
        <div className="mt-7 rounded-[28px] border border-black/8 bg-[#F7FBFF] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-[24px] font-black italic text-black">{detail.tournament.name}</h2>
              <p className="mt-1 text-[13px] text-black/55">
                {kindLabel[detail.tournament.kind]} · {formatDate(detail.tournament.start_date)} –{' '}
                {formatDate(detail.tournament.end_date)}
                {detail.tournament.description ? ` · ${detail.tournament.description}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && (
                <>
                  <select
                    className={`${inputCls} w-auto`}
                    value={detail.tournament.status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {Object.entries(statusLabel).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={() => {
                      setError('')
                      setForm({
                        id: detail.tournament.id,
                        name: detail.tournament.name,
                        kind: detail.tournament.kind,
                        start_date: detail.tournament.start_date,
                        end_date: detail.tournament.end_date,
                        description: detail.tournament.description ?? '',
                      })
                    }}
                  >
                    Editar
                  </button>
                  <button type="button" className={btnDanger} onClick={removeTournament}>
                    Eliminar
                  </button>
                </>
              )}
              <button type="button" className={btnGhost} onClick={() => setSelected(null)}>
                Cerrar
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 min-[1666px]:grid-cols-2">
            <section>
              <h3 className="text-[15px] font-bold text-black/80">Participantes ({detail.participants.length})</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {detail.participants.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-2xl bg-white px-4 py-2.5 text-[14px]"
                  >
                    <span className="font-medium text-black">
                      {p.team?.name ?? p.guest_name}
                      {!p.team && <span className="ml-2 text-[11px] text-black/45">invitado</span>}
                    </span>
                    {isAdmin && (
                      <button
                        type="button"
                        className="text-red-500 hover:underline"
                        onClick={() => removeParticipant(p)}
                      >
                        Quitar
                      </button>
                    )}
                  </li>
                ))}
                {detail.participants.length === 0 && (
                  <li className="text-[13px] text-black/45">Sin participantes aún.</li>
                )}
              </ul>

              {isAdmin && (
                <form onSubmit={addParticipant} className="mt-3 flex flex-wrap items-end gap-2">
                  <select
                    className={`${inputCls} w-auto`}
                    value={guest.type}
                    onChange={(e) => setGuest((g) => ({ ...g, type: e.target.value }))}
                  >
                    <option value="team">Equipo del club</option>
                    <option value="guest">Invitado (otra escuela)</option>
                  </select>
                  {guest.type === 'team' ? (
                    <select
                      className={`${inputCls} min-w-[180px] flex-1`}
                      value={guest.team_id}
                      onChange={(e) => setGuest((g) => ({ ...g, team_id: e.target.value }))}
                    >
                      <option value="">Selecciona…</option>
                      {availableTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={`${inputCls} min-w-[180px] flex-1`}
                      placeholder="Nombre de la escuela o grupo"
                      value={guest.name}
                      onChange={(e) => setGuest((g) => ({ ...g, name: e.target.value }))}
                    />
                  )}
                  <button type="submit" className={btnPrimary}>
                    Inscribir
                  </button>
                </form>
              )}
            </section>

            <section>
              <h3 className="text-[15px] font-bold text-black/80">Calendario de partidos</h3>
              {isAdmin && detail.participants.length >= 2 && (
                <form onSubmit={generateFixture} className="mt-3 flex flex-wrap items-end gap-2">
                  <label className="flex flex-col gap-1 text-[12px] font-medium text-black/60">
                    Inicio
                    <input
                      type="date"
                      className={inputCls}
                      value={fixture.start_date}
                      onChange={(e) => setFixture((f) => ({ ...f, start_date: e.target.value }))}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-[12px] font-medium text-black/60">
                    Sede
                    <select
                      className={inputCls}
                      value={fixture.venue}
                      onChange={(e) => setFixture((f) => ({ ...f, venue: e.target.value }))}
                    >
                      <option>Nuestro estadio</option>
                      <option>Visita / otro lugar</option>
                    </select>
                  </label>
                  {fixture.venue === 'Nuestro estadio' && (
                    <label className="flex flex-col gap-1 text-[12px] font-medium text-black/60">
                      Asistentes
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className={`${inputCls} w-[90px]`}
                        value={fixture.attendees}
                        onChange={(e) => setFixture((f) => ({ ...f, attendees: e.target.value }))}
                      />
                    </label>
                  )}
                  <button type="submit" className={btnPrimary}>
                    Generar fixture
                  </button>
                </form>
              )}
              <p className="mt-2 text-[12px] text-black/45">
                Todos contra todos · 3 partidos por día (14h, 16h, 18h). En nuestro estadio se reserva el slot
                automáticamente.
              </p>

              <div className="mt-4 flex max-h-[340px] flex-col gap-4 overflow-y-auto pr-1">
                {matchesByDate.length === 0 && (
                  <p className="text-[13px] text-black/45">Sin partidos programados.</p>
                )}
                {matchesByDate.map(([date, list]) => (
                  <div key={date}>
                    <p className="text-[13px] font-semibold text-black/70">{formatDate(date)}</p>
                    <ul className="mt-1 flex flex-col gap-1.5">
                      {list.map((m) => (
                        <li
                          key={m.id}
                          className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-[13px]"
                        >
                          <span className="w-[46px] shrink-0 font-semibold text-black/60">
                            {m.slot?.start_time?.slice(0, 5)}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-medium text-black">
                            {m.home?.name ?? m.home_guest} vs {m.away?.name ?? m.away_guest}
                          </span>
                          <span className="shrink-0 text-[11.5px] text-black/45">
                            {m.venue === 'Nuestro estadio' ? 'Local' : 'Visita'}
                          </span>
                          {isAdmin && (
                            <button
                              type="button"
                              className="shrink-0 text-red-500 hover:underline"
                              onClick={() => removeMatch(m.id)}
                            >
                              ×
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {form && (
        <div className={modalBackdrop} onClick={() => setForm(null)}>
          <form className={modalCard} onClick={(e) => e.stopPropagation()} onSubmit={saveTournament}>
            <h2 className="text-[22px] font-black italic text-black">
              {form.id ? 'Editar torneo' : 'Nuevo torneo'}
            </h2>
            <div className="mt-5 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-[12px] font-medium text-black/60">
                Nombre
                <input
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej. Copa Interescolar"
                  autoFocus
                />
              </label>
              <label className="flex flex-col gap-1 text-[12px] font-medium text-black/60">
                Tipo
                <select
                  className={inputCls}
                  value={form.kind}
                  onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
                >
                  <option value="schools">Contra otras escuelas</option>
                  <option value="groups">Contra otros grupos</option>
                </select>
              </label>
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1 text-[12px] font-medium text-black/60">
                  Inicio
                  <input
                    type="date"
                    className={inputCls}
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-[12px] font-medium text-black/60">
                  Fin
                  <input
                    type="date"
                    className={inputCls}
                    value={form.end_date}
                    onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-[12px] font-medium text-black/60">
                Descripción (opcional)
                <input
                  className={inputCls}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
            </div>
            {error && <p className={`${errorCls} mt-4`}>{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className={btnGhost} onClick={() => setForm(null)}>
                Cancelar
              </button>
              <button type="submit" className={btnPrimary}>
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </Page>
  )
}
