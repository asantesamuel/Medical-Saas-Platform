import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { usePredictions, useDeletePrediction } from "@/hooks/usePredictions";
import { usePredictionsRealtime } from "@/hooks/usePredictionsRealtime";
import { useAuth } from "@/context/AuthContext";
import type { Prediction } from "@/types";

export default function HistoryPage() {
  const { user } = useAuth();
  const { data: predictions, isLoading } = usePredictions();
  const deletePrediction = useDeletePrediction();

  usePredictionsRealtime(user?.id);

  async function handleDelete(id: string) {
    if (!confirm("Delete this scan record?")) return;
    try {
      await deletePrediction.mutateAsync(id);
      toast.success("Scan record deleted");
    } catch {
      toast.error("Failed to delete record");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow">Live clinical record</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">Scan history</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Previous AI-analyzed scans update automatically as new results are created.
          </p>
        </div>
        <Link to="/dashboard" className="btn-primary w-full sm:w-auto">New scan</Link>
      </header>

      <div className="mt-5 flex items-center gap-2 rounded-2xl border border-success-500/15 bg-success-50/70 px-4 py-3 text-sm font-medium text-success-700">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success-500" />
        </span>
        Live sync is active
      </div>

      <section className="mt-6">
        {isLoading ? (
          <TableSkeleton />
        ) : !predictions?.length ? (
          <EmptyState />
        ) : (
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200/70 bg-slate-50/80 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Model</th>
                    <th className="px-5 py-4">Result</th>
                    <th className="px-5 py-4">Confidence</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {predictions.map((prediction) => (
                    <PredictionRow key={prediction.id} prediction={prediction} onDelete={handleDelete} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function PredictionRow({ prediction: p, onDelete }: { prediction: Prediction; onDelete: (id: string) => void }) {
  const confidence = p.confidence_score;
  const isLow = confidence < 0.4;
  const badgeClass = confidence >= 0.75 ? "badge-success" : isLow ? "badge-danger" : "badge-warning";

  return (
    <tr className="transition-colors hover:bg-brand-50/40">
      <td className="px-5 py-4 text-slate-600">{new Date(p.created_at).toLocaleDateString()}</td>
      <td className="px-5 py-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-xs font-semibold capitalize text-slate-700 ring-1 ring-slate-200">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          {p.model_type}
        </span>
      </td>
      <td className="px-5 py-4 font-semibold text-slate-950">
        {p.result}
        {isLow && <span className="ml-2 text-warning-500" title="Low confidence result">!</span>}
      </td>
      <td className="px-5 py-4">
        <span className={badgeClass}>{Math.round(confidence * 100)}%</span>
      </td>
      <td className="px-5 py-4 text-right">
        <Link to={`/history/${p.id}`} className="mr-4 text-xs font-bold text-brand-700 transition-colors hover:text-brand-900">
          View
        </Link>
        <button
          onClick={() => onDelete(p.id)}
          className="text-xs font-semibold text-slate-400 transition-colors hover:text-danger-600"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="panel flex min-h-80 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-200">
        <FolderIcon className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-semibold text-slate-950">No scans yet</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Upload your first scan to build a review history here.</p>
      <Link to="/dashboard" className="btn-primary mt-5">Upload first scan</Link>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="panel space-y-3 p-5">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-2xl bg-slate-100/80" />
      ))}
    </div>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8.5a2 2 0 01-2 2h-14a2 2 0 01-2-2V7z" />
    </svg>
  );
}
