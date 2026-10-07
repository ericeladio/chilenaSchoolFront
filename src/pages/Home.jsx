import { useEffect, useState } from 'react'
import Hero from '../components/Hero'
import { useAuth } from '../auth/AuthProvider'
import { insforge } from '../lib/insforge'
import { formatDate, timeLabel, todayISO } from '../lib/format'

export default function Home() {
  const { user, role } = useAuth()
  const [event, setEvent] = useState(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function load() {
      const today = todayISO()
      let teamIds = null
      if (role === 'coach') {
        const { data } = await insforge.database.from('teams').select('id').eq('coach_id', user.id)
        teamIds = new Set((data ?? []).map((t) => t.id))
      } else if (role === 'student') {
        const { data } = await insforge.database.from('team_members').select('team_id').eq('student_id', user.id)
        teamIds = new Set((data ?? []).map((m) => m.team_id))
      }

      const [r, m] = await Promise.all([
        insforge.database
          .from('reservations')
          .select(
            'id, date, slot_id, purpose, team_id, title, team:team_id(name), slot:slot_id(start_time, end_time)',
          )
          .gte('date', today)
          .order('date')
          .limit(40),
        insforge.database
          .from('matches')
          .select(
            'id, date, slot_id, home_team_id, away_team_id, home:home_team_id(name), away:away_team_id(name), home_guest, away_guest, tournament:tournament_id(name), slot:slot_id(start_time)',
          )
          .gte('date', today)
          .order('date')
          .limit(40),
      ])
      if (cancelled) return

      const candidates = []
      for (const res of r.data ?? []) {
        if (teamIds && !(res.team_id && teamIds.has(res.team_id))) continue
        candidates.push({
          key: `${res.date}|${res.slot_id}|r${res.id}`,
          kind: res.purpose === 'tournament' ? 'tournament' : 'training',
          title: res.team?.name ?? res.title,
          sub: res.purpose === 'tournament' ? 'Torneo' : 'Entrenamiento',
          when: `${formatDate(res.date)} · ${timeLabel(res.slot)}`,
        })
      }
      for (const mt of m.data ?? []) {
        const homeName = mt.home?.name ?? mt.home_guest
        const awayName = mt.away?.name ?? mt.away_guest
        if (teamIds) {
          const involves =
            (mt.home_team_id && teamIds.has(mt.home_team_id)) ||
            (mt.away_team_id && teamIds.has(mt.away_team_id))
          if (!involves) continue
        }
        candidates.push({
          key: `${mt.date}|${mt.slot_id}|m${mt.id}`,
          kind: 'match',
          title: `${homeName ?? 'Por definir'} vs ${awayName ?? 'Por definir'}`,
          sub: mt.tournament?.name ?? 'Partido',
          when: `${formatDate(mt.date)} · ${mt.slot?.start_time?.slice(0, 5) ?? ''}`,
        })
      }
      candidates.sort((a, b) => a.key.localeCompare(b.key))
      setEvent(candidates[0] ?? null)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [user, role])

  return <Hero event={event} />
}
