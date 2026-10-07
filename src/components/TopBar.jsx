function AppsIcon() {
  return (
    <svg width="27" height="27" viewBox="0 0 24 24" fill="currentColor">
      {[4, 11, 18].map((y) =>
        [4, 11, 18].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" />),
      )}
    </svg>
  )
}

export default function TopBar() {
  return (
    <div className="absolute left-[calc(80%_+_19px)] top-0 z-20 -translate-x-1/2">
      <div className="flex h-[86px] w-[286px] items-center rounded-[26px] bg-[#0263E8] px-[37px] text-white shadow-[0_10px_30px_rgba(2,99,232,0.25)]">
        <svg className="ml-px shrink-0" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.6-3.6" />
        </svg>
        <span className="relative top-px ml-[12px] shrink-0 text-[27px] font-bold tracking-tight">Search</span>
        <span className="ml-[24px] h-[18px] w-[2px] shrink-0 bg-white/50" />
        <span className="ml-[17px] shrink-0">
          <AppsIcon />
        </span>
      </div>
    </div>
  )
}
