import { Link } from "react-router-dom";
import { usePredictions, useDeletePrediction } from "@/hooks/usePredictions";
import toast from "react-hot-toast";
import type { Prediction } from "@/types";

export default function HistoryPage() {
  const { data: predictions, isLoading } = usePredictions();
  const deletePrediction = useDeletePrediction();

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
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Scan History</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your previous AI-analysed neurological scans.
          </p>
        </div>
        <Link to="/dashboard" className="btn-primary">New Scan</Link>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <TableSkeleton />
        ) : !predictions?.length ? (
          <EmptyState />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Model</th>
                  <th className="px-5 py-3">Result</th>
                  <th className="px-5 py-3">Confidence</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {predictions.map((p) => (
                  <PredictionRow key={p.id} prediction={p} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PredictionRow({
  prediction: p,
  onDelete,
}: {
  prediction: Prediction;
  onDelete: (id: string) => void;
}) {
  const confidence = p.confidence_score;
  const isLow = confidence < 0.40;
  const badgeClass = confidence >= 0.75 ? "badge-success" : isLow ? "badge-danger" : "badge-warning";

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-5 py-4 text-slate-600">
        {new Date(p.created_at).toLocaleDateString()}
      </td>
      <td className="px-5 py-4">
        <span className="capitalize text-slate-700">{p.model_type}</span>
      </td>
      <td className="px-5 py-4 font-medium text-slate-900">
        {p.result}
        {isLow && (
          <span className="ml-2 inline-block text-warning-500" title="Low confidence">⚠</span>
        )}
      </td>
      <td className="px-5 py-4">
        <span className={badgeClass}>{Math.round(confidence * 100)}%</span>
      </td>
      <td className="px-5 py-4 text-right">
        <Link
          to={`/history/${p.id}`}
          className="text-xs font-medium text-brand-600 hover:text-brand-700 mr-4"
        >
          View
        </Link>
        <button
          onClick={() => onDelete(p.id)}
          className="text-xs text-slate-400 hover:text-danger-500 transition-colors"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16">
      <p className="text-slate-400">No scans yet.</p>
      <Link to="/dashboard" className="btn-primary mt-4">Upload your first scan</Link>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}
