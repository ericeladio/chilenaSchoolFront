export default function Page({ title, subtitle, actions, children }) {
  return (
    <div className="h-full overflow-y-auto rounded-[48px] bg-white px-8 pb-8 pt-[110px] min-[1666px]:px-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-black italic leading-none tracking-[-1px] text-black min-[1666px]:text-[40px]">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-[14px] text-black/55">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="mt-7">{children}</div>
    </div>
  )
}
