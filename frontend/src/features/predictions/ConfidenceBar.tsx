interface Props {
  value: number;   // 0.0 – 1.0
  label?: string;
  size?: "sm" | "md";
}

export default function ConfidenceBar({ value, label, size = "md" }: Props) {
  const pct = Math.round(value * 100);
  const color =
    value >= 0.75 ? "bg-success-500" :
    value >= 0.40 ? "bg-warning-500" :
                    "bg-danger-500";

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex justify-between">
          <span className={`text-${size === "sm" ? "xs" : "sm"} text-slate-600`}>{label}</span>
          <span className={`text-${size === "sm" ? "xs" : "sm"} font-medium text-slate-900`}>
            {pct}%
          </span>
        </div>
      )}
      <div className={`w-full rounded-full bg-slate-100 ${size === "sm" ? "h-1.5" : "h-2.5"}`}>
        <div
          className={`${color} rounded-full transition-all duration-500 ${size === "sm" ? "h-1.5" : "h-2.5"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
