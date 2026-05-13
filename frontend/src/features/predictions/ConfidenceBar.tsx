interface Props {
  value: number;
  label?: string;
  size?: "sm" | "md";
}

export default function ConfidenceBar({ value, label, size = "md" }: Props) {
  const pct = Math.round(value * 100);
  const color =
    value >= 0.75
      ? "from-success-400 to-success-500"
      : value >= 0.4
        ? "from-warning-500 to-amber-400"
        : "from-danger-500 to-rose-400";

  return (
    <div className="w-full">
      {label && (
        <div className="mb-2 flex justify-between gap-4">
          <span className={`${size === "sm" ? "text-xs" : "text-sm"} font-medium text-slate-600`}>{label}</span>
          <span className={`${size === "sm" ? "text-xs" : "text-sm"} font-semibold text-slate-950`}>{pct}%</span>
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/80 ${size === "sm" ? "h-1.5" : "h-2.5"}`}>
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
