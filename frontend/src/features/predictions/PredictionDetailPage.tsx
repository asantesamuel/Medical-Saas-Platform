import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePrediction, getSignedUrl } from "@/hooks/usePredictions";
import LowConfidenceBanner from "./LowConfidenceBanner";
import ConfidenceBar from "./ConfidenceBar";

export default function PredictionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: prediction, isLoading, error } = usePrediction(id ?? "");

  const [scanUrl, setScanUrl] = useState<string | null>(null);
  const [gradcamUrl, setGradcamUrl] = useState<string | null>(null);
  const [showGradcam, setShowGradcam] = useState(false);

  useEffect(() => {
    if (!prediction) return;
    getSignedUrl("scan-images", prediction.image_path).then(setScanUrl).catch(() => {});
    if (prediction.gradcam_path) {
      getSignedUrl("gradcam-maps", prediction.gradcam_path).then(setGradcamUrl).catch(() => {});
    }
  }, [prediction]);

  if (isLoading) return <PageLoader />;
  if (error || !prediction) return <NotFound />;

  const isLowConfidence = prediction.confidence_score < 0.4;
  const confidenceBadge =
    prediction.confidence_score >= 0.75 ? "badge-success" : isLowConfidence ? "badge-danger" : "badge-warning";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <Link to="/history" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-950">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to history
      </Link>

      {isLowConfidence && <div className="mb-5"><LowConfidenceBanner confidence={prediction.confidence_score} /></div>}

      <header className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow">{prediction.model_type === "tumor" ? "Brain tumor" : "Ischemic stroke"} detection</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">{prediction.result}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Model {prediction.model_version} analyzed on {new Date(prediction.created_at).toLocaleString()}.
          </p>
        </div>
        <span className={confidenceBadge}>{Math.round(prediction.confidence_score * 100)}% confidence</span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200/70 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">Scan image</h2>
              <p className="mt-1 text-xs text-slate-500">{showGradcam ? "Grad-CAM overlay" : "Original uploaded scan"}</p>
            </div>
            {gradcamUrl && (
              <button onClick={() => setShowGradcam((value) => !value)} className="btn-secondary px-3 py-2 text-xs">
                {showGradcam ? "Show original" : "Show Grad-CAM"}
              </button>
            )}
          </div>
          <div className="p-5">
            {(showGradcam ? gradcamUrl : scanUrl) ? (
              <img
                src={(showGradcam ? gradcamUrl : scanUrl)!}
                alt={showGradcam ? "Grad-CAM heatmap" : "Original scan"}
                className="max-h-[34rem] w-full rounded-2xl bg-slate-950 object-contain shadow-[0_24px_60px_-38px_rgba(15,23,42,0.85)]"
              />
            ) : (
              <div className="flex h-80 items-center justify-center rounded-2xl bg-slate-100 text-sm font-medium text-slate-500">
                Loading image...
              </div>
            )}
            {showGradcam && (
              <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                Grad-CAM highlights regions that most influenced the prediction.
              </p>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="panel p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-slate-950">Prediction confidence</h2>
            <div className="mt-5">
              <ConfidenceBar value={prediction.confidence_score} label="Primary confidence" />
            </div>
            <div className="mt-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Top predictions</p>
              <div className="space-y-3">
                {prediction.top_3_results.map((result) => (
                  <ConfidenceBar key={result.label} value={result.confidence} label={result.label} size="sm" />
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-slate-950">Clinical note</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              AI output is not a substitute for clinical diagnosis. For clinical use only under qualified supervision.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex h-96 items-center justify-center">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-glow">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-700" />
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto flex h-96 max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <SearchIcon className="h-7 w-7" />
      </div>
      <p className="text-lg font-semibold text-slate-950">Prediction not found</p>
      <Link to="/history" className="btn-secondary">Back to history</Link>
    </div>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m6-6l-6 6 6 6" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
    </svg>
  );
}
