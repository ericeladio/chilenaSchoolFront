import badgeGreen from '../assets/badge-green.png'
import badgeOrange from '../assets/badge-orange.png'

const kindStyles = {
  match: { chip: 'bg-[#E9F8EE] text-[#1B8A4B]', label: 'Partido' },
  training: { chip: 'bg-[#DCEEFF] text-[#0263E8]', label: 'Entrenamiento' },
  tournament: { chip: 'bg-amber-100 text-amber-700', label: 'Torneo' },
}

export default function MatchCard({ event }) {
  const kind = event?.kind ?? 'training'
  const style = kindStyles[kind] ?? kindStyles.training
  const isMatch = kind === 'match'

  return (
    <div className="flex h-[125px] w-[250px] flex-col justify-center gap-[20px] rounded-[28px] bg-white px-5 shadow-[0_0_8px_0_rgba(0,0,0,0.12)]">
      <div className="flex items-center justify-between gap-2">
        {isMatch ? (
          <>
            <span className="flex min-w-0 items-center gap-1.5">
              <img src={badgeGreen} width="25" height="25" alt="" className="shrink-0" />
              <span className="truncate text-xs font-medium text-black">{event?.title?.split(' vs ')[0] ?? '—'}</span>
            </span>
            <span className="shrink-0 text-xs font-medium italic text-black">Vs</span>
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-xs font-medium text-black">{event?.title?.split(' vs ')[1] ?? '—'}</span>
              <img src={badgeOrange} width="25" height="25" alt="" className="shrink-0" />
            </span>
          </>
        ) : (
          <>
            <span className="flex min-w-0 items-center gap-1.5">
              <img src={badgeGreen} width="25" height="25" alt="" className="shrink-0" />
              <span className="truncate text-xs font-medium text-black">{event?.title ?? 'Sin eventos'}</span>
            </span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${style.chip}`}>
              {style.label}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-medium leading-[17px] text-black/64">
          {event?.when ?? '—'}
        </span>
        <span className="shrink-0 rounded-md bg-[#FF7F4F] px-1.5 py-1 text-[8px] font-bold leading-[9px] text-white">
          {event?.sub ?? ''}
        </span>
      </div>
    </div>
  )
}
