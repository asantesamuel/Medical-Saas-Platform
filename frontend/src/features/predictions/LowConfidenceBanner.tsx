interface Props {
  confidence: number;
}

export default function LowConfidenceBanner({ confidence }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-warning-500/25 bg-warning-50/90 px-4 py-3 shadow-sm">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-warning-700 ring-1 ring-warning-500/20">
        <AlertIcon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-warning-700">Low confidence result</p>
        <p className="mt-1 text-xs leading-5 text-warning-700/85">
          This prediction has a confidence score of <strong>{(confidence * 100).toFixed(1)}%</strong>, which is below the recommended threshold. Exercise additional clinical judgement and consider repeat imaging.
        </p>
      </div>
    </div>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 4.2L2.8 17.3A2 2 0 004.5 20h15a2 2 0 001.7-2.7L13.7 4.2a2 2 0 00-3.4 0z" />
    </svg>
  );
}
