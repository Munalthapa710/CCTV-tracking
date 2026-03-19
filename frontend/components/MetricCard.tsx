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
    <div className="rounded-3xl border border-white/10 bg-slate-panel p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-white/45">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-white/55">{hint}</p>
    </div>
  )
}
