interface Props {
  confidence: number;
}

export default function LowConfidenceBanner({ confidence }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-warning-500/30 bg-warning-50 px-4 py-3">
      <svg className="mt-0.5 h-5 w-5 shrink-0 text-warning-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
      </svg>
      <div>
        <p className="text-sm font-medium text-warning-700">Low confidence result</p>
        <p className="mt-0.5 text-xs text-warning-700/80">
          This prediction has a confidence score of{" "}
          <strong>{(confidence * 100).toFixed(1)}%</strong>, which is below the
          recommended threshold. Exercise additional clinical judgement and consider
          repeat imaging.
        </p>
      </div>
    </div>
  );
}
