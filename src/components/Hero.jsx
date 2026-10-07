import { useNavigate } from 'react-router-dom'
import heroImg from '../assets/futback.png'
import MatchCard from './MatchCard'

const toolbarIcons = [
  {
    name: 'messages',
    path: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  },
  {
    name: 'send',
    path: 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z',
  },
  {
    name: 'notifications',
    path: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  },
]

const socials = [
  {
    name: 'instagram',
    path: 'M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 1.8.25 2.2.42.6.22 1 .48 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.2A6.6 6.6 0 1 0 12 18.6 6.6 6.6 0 0 0 12 5.4zm0 10.9a4.3 4.3 0 1 1 0-8.6 4.3 4.3 0 0 1 0 8.6zm6.9-11.2a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z',
  },
  {
    name: 'facebook',
    path: 'M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H16.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.7v8h3.5z',
  },
  {
    name: 'twitter',
    path: 'M21 5.9c-.7.3-1.4.5-2.2.6a3.8 3.8 0 0 0 1.7-2.1c-.7.4-1.6.8-2.4 1a3.8 3.8 0 0 0-6.6 3.5A10.9 10.9 0 0 1 3.6 4.8a3.8 3.8 0 0 0 1.2 5.1c-.6 0-1.2-.2-1.7-.5a3.8 3.8 0 0 0 3 3.8c-.5.1-1.1.2-1.7.1a3.8 3.8 0 0 0 3.6 2.6A7.7 7.7 0 0 1 2 17.5a10.9 10.9 0 0 0 16.8-9.7c.8-.5 1.4-1.2 1.9-2z',
  },
]

export default function Hero({ event }) {
  const navigate = useNavigate()
  return (
    <section className="relative h-full overflow-hidden rounded-[48px]">
      <img
        src={heroImg}
        alt="Soccer player striking the ball"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right-top"
      />

      <div className="absolute left-[50px] top-[50px] h-[75px] w-[186px] rounded-[14px] border border-white p-[11px]">
        <div className="flex h-full w-full items-center justify-around rounded-[12px] bg-white text-[#595959]">
          {toolbarIcons.map(({ name, path }) => (
            <span key={name} className="flex h-8 w-8 items-center justify-center">
              <span className="sr-only">{name}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d={path} />
              </svg>
            </span>
          ))}
        </div>
      </div>

      <div className="absolute right-[65px] top-[175px] flex w-[60px] flex-col gap-1.5 rounded-[22px] bg-white/15 px-2 py-1 backdrop-blur-sm">
        {socials.map(({ name, path }) => (
          <a
            key={name}
            href="#"
            className="flex h-11 w-11 items-center justify-center rounded-[14px] text-white transition-colors hover:bg-white/25"
          >
            <span className="sr-only">{name}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d={path} />
            </svg>
          </a>
        ))}
      </div>

      <h1 className="absolute bottom-[224px] left-[51px] w-[560px] text-[61px] font-black italic leading-[55px] tracking-[-4.5px] text-white [text-shadow:0_6px_40px_rgba(0,0,0,0.35)]">
        ¡Tu club, tu equipo, tu cancha!
      </h1>

      <div className="absolute bottom-[58px] left-[50px] h-[149px] w-[274px] rounded-[40px] border border-white p-[11px]">
        <MatchCard event={event} />
      </div>

      <button
        type="button"
        onClick={() => navigate('/reservas')}
        className="absolute bottom-[120px] left-[451px] rounded-lg border border-white bg-black/25 px-[13px] py-2 text-[12px] font-bold leading-[10px] text-white backdrop-blur-sm transition-colors hover:bg-black/40"
      >
        Reservar
      </button>
    </section>
  )
}
