export default function MetricCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint: string
}) {
  return (
    <div className="glass-panel rounded-[1.8rem] p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[11px] uppercase tracking-[0.34em] text-white/42">{label}</p>
        <div className="h-2 w-2 rounded-full bg-cyan-accent shadow-[0_0_18px_rgba(255,154,92,0.9)]" />
      </div>
      <p className="mt-5 text-4xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-white/56">{hint}</p>
    </div>
  )
}
