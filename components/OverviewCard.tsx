type Props = {
  label: string
  value: string
  valueClassName?: string
  hint?: string
}

export default function OverviewCard({ label, value, valueClassName, hint }: Props) {
  return (
    <div className="bg-trading-slate rounded p-5">
      <div className="text-sm text-slate-400 uppercase tracking-wide">{label}</div>
      <div className={`mt-2 text-2xl font-bold ${valueClassName ?? 'text-white'}`}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  )
}
