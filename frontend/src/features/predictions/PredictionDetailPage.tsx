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

  const isLowConfidence = prediction.confidence_score < 0.40;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Back link */}
      <Link to="/history" className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
        </svg>
        Back to history
      </Link>

      {/* Low confidence banner */}
      {isLowConfidence && (
        <div className="mb-5">
          <LowConfidenceBanner confidence={prediction.confidence_score} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Image panel */}
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Scan image</h2>
            {gradcamUrl && (
              <button
                onClick={() => setShowGradcam((v) => !v)}
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                {showGradcam ? "Show original" : "Show Grad-CAM"}
              </button>
            )}
          </div>
          {(showGradcam ? gradcamUrl : scanUrl) ? (
            <img
              src={(showGradcam ? gradcamUrl : scanUrl)!}
              alt={showGradcam ? "Grad-CAM heatmap" : "Original scan"}
              className="w-full rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-400">
              Loading image…
            </div>
          )}
          {showGradcam && (
            <p className="mt-2 text-xs text-slate-400">
              Grad-CAM highlights the regions that most influenced the prediction.
            </p>
          )}
        </div>

        {/* Results panel */}
        <div className="card space-y-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {prediction.model_type === "tumor" ? "Brain Tumor" : "Ischemic Stroke"} Detection
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">{prediction.result}</h2>
            <p className="text-xs text-slate-400 mt-1">
              Model: {prediction.model_version} ·{" "}
              {new Date(prediction.created_at).toLocaleString()}
            </p>
          </div>

          {/* Primary confidence */}
          <ConfidenceBar value={prediction.confidence_score} label="Primary confidence" />

          {/* Top 3 */}
          <div>
            <p className="mb-2 text-xs font-medium text-slate-500">Top 3 predictions</p>
            <div className="space-y-2.5">
              {prediction.top_3_results.map((r) => (
                <ConfidenceBar key={r.label} value={r.confidence} label={r.label} size="sm" />
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
            AI output is not a substitute for clinical diagnosis. For clinical
            use only under qualified supervision.
          </p>
        </div>
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex h-96 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex h-96 flex-col items-center justify-center gap-3">
      <p className="text-slate-500">Prediction not found.</p>
      <Link to="/history" className="btn-secondary">← Back to history</Link>
    </div>
  );
}
