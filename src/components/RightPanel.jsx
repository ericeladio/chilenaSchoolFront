import { useEffect, useState } from 'react'
import liveTournament from '../assets/live-tournament.png'
import liveTrophy from '../assets/live-trophy.png'
import { useAuth } from '../auth/AuthProvider'
import { insforge } from '../lib/insforge'
import { formatDate, todayISO } from '../lib/format'
import { roleLabel } from '../lib/ui'

const columns = [92, 132, 172, 212, 252, 292]
const points = [
  [92, 97],
  [137, 69],
  [173, 76],
  [211, 68],
  [250, 41],
  [293, 48],
]

const dayLabels = [
  { n: 2, pos: 'left-[29%]' },
  { n: 3, pos: 'left-[41.6%]' },
  { n: 4, pos: 'left-[54.3%]' },
  { n: 5, pos: 'left-[66.9%]' },
  { n: 6, pos: 'left-[79.5%]' },
  { n: 7, pos: 'left-[92.1%]' },
]

function ViewsChart() {
  return (
    <div className="relative mt-[14px] min-h-[96px] flex-1 overflow-hidden rounded-[24px] bg-white [@media(min-height:900px)_and_(max-height:1079px)]:min-h-[90px] [@media(max-height:899px)]:min-h-[70px]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 317 174" fill="none" preserveAspectRatio="none">
        {columns.map((x) => (
          <line
            key={x}
            x1={x}
            y1="19"
            x2={x}
            y2="125"
            stroke="#C7D0DD"
            strokeWidth="1.4"
            strokeDasharray="5 6"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <polyline
          points={points.map((p) => p.join(',')).join(' ')}
          stroke="#0263E8"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <line x1="252" y1="35" x2="251" y2="41" stroke="#0263E8" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>

      <span className="absolute left-[7.9%] top-[9.2%] text-[11px] font-medium text-[#656668]">Sesiones</span>
      <span className="absolute bottom-[9%] left-[7.6%] text-[11px] font-medium text-[#656668]">Día</span>
      <span className="absolute left-[73.2%] top-[12%] rounded-full bg-[#0263E8] px-[6px] py-[2px] text-[8px] font-bold leading-[9px] text-white">
        Club
      </span>
      {dayLabels.map((d) => (
        <span
          key={d.n}
          className={`absolute bottom-[9%] ${d.pos} -translate-x-1/2 text-[11px] font-medium text-[#656668]`}
        >
          {d.n}
        </span>
      ))}
    </div>
  )
}

function ProfileBox() {
  const { profile } = useAuth()
  const initial = (profile?.full_name ?? 'U').trim().charAt(0).toUpperCase() || 'U'
  return (
    <div className="flex shrink-0 justify-end">
      <div className="flex h-[141px] w-full max-w-[232px] items-center rounded-[50px] bg-[#E3E1FF] px-[16px] py-[30px] min-[1666px]:px-[24px] [@media(min-height:900px)_and_(max-height:1079px)]:h-[116px] [@media(max-height:899px)]:h-[104px] [@media(max-height:899px)]:py-[26px]">
        <div className="flex h-full w-full items-center gap-2 rounded-[18px] border-2 border-white bg-[#F0EFFF] px-[12px] min-[1666px]:gap-3 min-[1666px]:px-[17px]">
          <span className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[12px] bg-[#0263E8] text-[18px] font-bold text-white min-[1666px]:h-[46px] min-[1666px]:w-[46px]">
            {initial}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[15px] font-semibold text-black/75 min-[1666px]:text-[17px]">
              {profile?.full_name ?? '…'}
            </span>
            <span className="truncate text-[12px] text-black/50 min-[1666px]:text-[13px]">
              {roleLabel[profile?.role] ?? ''}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

const statusLabel = { open: 'Abierto', ongoing: 'En curso', done: 'Finalizado' }

function PromoCard({ tournament, teamCount }) {
  const chips = tournament
    ? [
        tournament.name,
        `Desde ${formatDate(tournament.start_date, { day: 'numeric', month: 'short' })}`,
        ...[...Array(Math.min(teamCount, 4))].map((_, i) => `Equipo ${i + 1}`),
      ].slice(0, 6)
    : [...Array(Math.min(teamCount, 6))].map((_, i) => `Equipo ${i + 1}`)

  const rows = []
  for (let i = 0; i < chips.length; i += 2) rows.push(chips.slice(i, i + 2))

  return (
    <div className="relative h-[174px] shrink-0 rounded-[24px] bg-[#ECF6FE] px-4 pt-[13px] max-[1439px]:px-3 [@media(min-height:900px)_and_(max-height:1079px)]:h-[166px] [@media(max-height:899px)]:h-[146px]">
      <div className="flex items-center justify-between">
        <span className="ml-px shrink-0 rounded-[6px] bg-black px-2 py-[5px] text-[11px] font-semibold leading-[17px] text-white">
          {tournament ? (statusLabel[tournament.status] ?? 'Torneo') : 'Club'}
        </span>
        <p className="flex items-baseline whitespace-nowrap text-[clamp(13px,calc(2.95vw_-_29px),22px)] italic text-[#535659]">
          <span className="font-[200] tracking-[-0.2px]">{tournament ? 'TORNEO:' : 'EQUIPOS:'}</span>
          <span className="font-bold underline decoration-[1.4px] underline-offset-[2px]">
            {tournament
              ? formatDate(tournament.start_date, { day: 'numeric', month: 'short' })
              : teamCount}
          </span>
        </p>
      </div>

      <div className="mt-[31px] flex flex-col gap-[4px] [@media(max-height:899px)]:mt-[20px]">
        {rows.map((row) => (
          <div key={row[0]} className="flex gap-1">
            {row.map((chip) => (
              <span
                key={chip}
                className="max-w-[130px] truncate rounded-full border border-[#535659] px-2 py-[2px] text-[10px] leading-[17px] text-[#535659] min-[1666px]:px-3 min-[1666px]:text-[11px]"
              >
                {chip}
              </span>
            ))}
          </div>
        ))}
        {rows.length === 0 && (
          <span className="text-[11px] text-[#535659]">Crea tu primer equipo desde Equipos.</span>
        )}
      </div>
    </div>
  )
}

export default function RightPanel() {
  const [tournament, setTournament] = useState(null)
  const [teamCount, setTeamCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [t, tm] = await Promise.all([
        insforge.database
          .from('tournaments')
          .select('id, name, start_date, status')
          .gte('start_date', todayISO())
          .order('start_date')
          .limit(1)
          .maybeSingle(),
        insforge.database.from('teams').select('id, name').order('created_at').limit(30),
      ])
      if (cancelled) return
      setTournament(t.data ?? null)
      setTeamCount((tm.data ?? []).length)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="relative flex h-full flex-col rounded-[44px] bg-[#E3E1FF] px-[26px] pb-[28px] pt-[120px] max-[1439px]:px-[16px] [@media(min-height:900px)_and_(max-height:1079px)]:pb-[24px] [@media(min-height:900px)_and_(max-height:1079px)]:pt-[114px] [@media(max-height:899px)]:pb-[20px] [@media(max-height:899px)]:pt-[114px]">
      <svg
        className="pointer-events-none absolute left-0 top-0"
        width="205"
        height="166"
        viewBox="0 0 205 166"
        aria-hidden="true"
      >
        <path
          fill="#EDF7FF"
          d="M 204.1 0 L 192.4 1.8 L 187 3.6 L 183.4 5.4 L 180.7 7.2 L 178 9 L 176.2 10.8 L 174.4 12.6 L 172.6 14.4 L 170.8 16.2 L 169 18 L 168.1 19.8 L 167.2 21.6 L 165.4 23.4 L 164.5 25.2 L 164.5 27 L 163.6 28.8 L 162.7 30.6 L 161.8 32.4 L 161.8 34.2 L 160.9 36 L 160.9 37.8 L 160.9 39.6 L 160.9 41.4 L 160.9 43.1 L 160 44.9 L 160 46.7 L 160 48.5 L 160 50.3 L 160 52.1 L 160 53.9 L 160 55.7 L 160 57.5 L 160 59.3 L 160 61.1 L 160 62.9 L 160 64.7 L 159.1 66.5 L 159.1 68.3 L 159.1 70.1 L 158.2 71.9 L 157.3 73.7 L 156.4 75.5 L 155.5 77.3 L 154.6 79.1 L 153.7 80.9 L 152.8 82.7 L 151.9 84.5 L 150.1 86.3 L 148.3 88.1 L 146.5 89.9 L 144.7 91.7 L 142.9 93.5 L 140.2 95.3 L 137.5 97.1 L 133.9 98.9 L 129.4 100.7 L 121.4 102.5 L 39.6 104.3 L 30.6 106.1 L 26.1 107.9 L 22.5 109.7 L 19.8 111.5 L 17.1 113.3 L 15.3 115.1 L 13.5 116.9 L 11.7 118.7 L 10.8 120.5 L 9 122.3 L 8.1 124.1 L 7.2 125.9 L 6.3 127.6 L 5.4 129.4 L 4.5 131.2 L 4.5 133 L 3.6 134.8 L 3.6 136.6 L 2.7 138.4 L 2.7 140.2 L 2.7 142 L 2.7 143.8 L 1.8 145.6 L 1.8 147.4 L 1.8 149.2 L 1.8 151 L 1.8 152.8 L 1.8 154.6 L 1.8 156.4 L 1.8 158.2 L 1.8 160 L 1.8 161.8 L 1.8 163.6 L 0.9 165.4 L 0 165.4 L 0 44 A 44 44 0 0 1 44 0 L 204.1 0 Z"
        />
      </svg>
      <ProfileBox />
      <ViewsChart />
      <div className="mt-[14px]">
        <PromoCard tournament={tournament} teamCount={teamCount} />
      </div>
      <div className="mt-[82px] flex shrink-0 flex-col gap-[15px] [@media(min-height:900px)_and_(max-height:1079px)]:mt-[44px] [@media(max-height:899px)]:mt-[20px]">
        <img
          src={liveTrophy}
          alt="Trofeo del club"
          className="w-full shrink-0 rounded-[24px] object-cover [@media(min-height:1080px)_and_(max-height:1116px)]:max-h-[160px] [@media(min-height:900px)_and_(max-height:1079px)]:max-h-[114px] [@media(max-height:899px)]:max-h-[80px]"
        />
        <img
          src={liveTournament}
          alt="Torneo juvenil"
          className="w-full shrink-0 rounded-[24px] object-cover [@media(min-height:1080px)_and_(max-height:1116px)]:max-h-[160px] [@media(min-height:900px)_and_(max-height:1079px)]:max-h-[114px] [@media(max-height:899px)]:max-h-[80px]"
        />
      </div>
    </div>
  )
}
