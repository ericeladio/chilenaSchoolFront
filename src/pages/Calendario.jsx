import { useCallback, useEffect, useMemo, useState } from 'react'
import Page from '../components/Page'
import { useAuth } from '../auth/AuthProvider'
import { insforge } from '../lib/insforge'
import { addDaysISO, formatLongDate, todayISO } from '../lib/format'
import { noticeCls } from '../lib/ui'

const chipCls = {
  training: 'bg-[#DCEEFF] text-[#0263E8]',
  tournament: 'bg-amber-100 text-amber-700',
  match: 'bg-[#E3E1FF] text-[#5B4FD6]',
}

const chipLabel = { training: 'Entrenamiento', tournament: 'Torneo', match: 'Partido' }

export default function Calendario() {
  const { user, role } = useAuth()
  const [reservations, setReservations] = useState([])
  const [matches, setMatches] = useState([])
  const [teams, setTeams] = useState([])
  const [members, setMembers] = useState([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const from = todayISO()
    const to = addDaysISO(from, 30)
    const [r, m, t, mem] = await Promise.all([
      insforge.database
        .from('reservations')
        .select('id, date, slot_id, purpose, team_id, title, attendees, slot:slot_id(start_time, end_time)')
        .gte('date', from)
        .lte('date', to)
        .order('date')
        .limit(80),
      insforge.database
        .from('matches')
        .select(
          'id, date, slot_id, venue, tournament_id, home_team_id, away_team_id, home_guest, away_guest, tournament:tournament_id(name), home:home_team_id(name), away:away_team_id(name), slot:slot_id(start_time)',
        )
        .gte('date', from)
        .lte('date', to)
        .order('date')
        .limit(80),
      insforge.database.from('teams').select('id, name, coach_id').order('name'),
      insforge.database.from('team_members').select('team_id, student_id').eq('student_id', user?.id ?? ''),
    ])
    if (r.error) setError(r.error.message)
    else setReservations(r.data ?? [])
    if (m.error) setError(m.error.message)
    else setMatches(m.data ?? [])
    setTeams(t.data ?? [])
    setMembers(mem.data ?? [])
  }, [user])

  useEffect(() => {
    if (!user) return
    void load()
  }, [load, user])

  const myTeamIds = useMemo(() => {
    if (role === 'admin') return null
    if (role === 'coach') return new Set(teams.filter((t) => t.coach_id === user?.id).map((t) => t.id))
    return new Set(members.map((m) => m.team_id))
  }, [role, teams, members, user])

  const visibleReservations = useMemo(() => {
    if (!myTeamIds) return reservations
    return reservations.filter((r) => r.team_id != null && myTeamIds.has(r.team_id))
  }, [reservations, myTeamIds])

  const visibleMatches = useMemo(() => {
    if (!myTeamIds) return matches
    return matches.filter(
      (m) =>
        (m.home_team_id && myTeamIds.has(m.home_team_id)) ||
        (m.away_team_id && myTeamIds.has(m.away_team_id)),
    )
  }, [matches, myTeamIds])

  const sections = useMemo(() => {
    const map = new Map()
    const push = (date, entry) => {
      if (!map.has(date)) map.set(date, [])
      map.get(date).push(entry)
    }
    for (const r of visibleReservations) {
      push(r.date, {
        key: `r-${r.id}`,
        time: r.slot?.start_time?.slice(0, 5) ?? '',
        type: r.purpose,
        title: r.title,
        detail:
          r.purpose === 'tournament'
            ? `${r.attendees} personas`
            : `${teams.find((t) => t.id === r.team_id)?.name ?? 'Equipo'} · ${r.attendees} personas`,
      })
    }
    for (const m of visibleMatches) {
      const home = m.home?.name ?? m.home_guest ?? 'Por definir'
      const away = m.away?.name ?? m.away_guest ?? 'Por definir'
      push(m.date, {
        key: `m-${m.id}`,
        time: m.slot?.start_time?.slice(0, 5) ?? '',
        type: 'match',
        title: `${home} vs ${away}`,
        detail: `${m.tournament?.name ?? 'Torneo'} · ${m.venue}`,
      })
    }
    for (const list of map.values()) list.sort((a, b) => a.time.localeCompare(b.time))
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [visibleReservations, visibleMatches, teams])

  return (
    <Page
      title="Calendario"
      subtitle="Próximos 30 días · entrenamientos, torneos y partidos"
    >
      {error && <p className="rounded-2xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">{error}</p>}
      {sections.length === 0 && !error && (
        <p className={`${noticeCls} mt-4`}>
          No hay eventos programados en los próximos 30 días para tu perfil.
        </p>
      )}
      <div className="mt-5 flex flex-col gap-6">
        {sections.map(([date, entries]) => (
          <section key={date}>
            <h2 className="text-[16px] font-bold capitalize text-black/80">{formatLongDate(date)}</h2>
            <ul className="mt-2 flex flex-col gap-2">
              {entries.map((e) => (
                <li
                  key={e.key}
                  className="flex items-center gap-4 rounded-2xl border border-black/8 bg-[#F7FBFF] px-4 py-3"
                >
                  <span className="w-[52px] shrink-0 text-[13px] font-semibold text-black/70">{e.time}</span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${chipCls[e.type]}`}
                  >
                    {chipLabel[e.type]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-black">{e.title}</span>
                    <span className="block truncate text-[12.5px] text-black/55">{e.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Page>
  )
}
