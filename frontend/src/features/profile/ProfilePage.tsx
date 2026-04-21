import { useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePredictions } from "@/hooks/usePredictions";

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const { data: predictions } = usePredictions();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", profile.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Profile updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setIsSaving(false);
    }
  }

  const scanCount = predictions?.length ?? 0;
  const lastScan = predictions?.[0]
    ? new Date(predictions[0].created_at).toLocaleDateString()
    : "—";

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
      <p className="mt-1 text-sm text-slate-500">Manage your clinical account details.</p>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-semibold text-slate-900">{scanCount}</p>
          <p className="mt-1 text-xs text-slate-400">Total scans</p>
        </div>
        <div className="card text-center">
          <p className="text-base font-semibold text-slate-900">{lastScan}</p>
          <p className="mt-1 text-xs text-slate-400">Last scan</p>
        </div>
      </div>

      {/* Edit form */}
      <div className="card mt-6">
        <h2 className="mb-5 text-sm font-semibold text-slate-900">Account details</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label" htmlFor="full_name">Full name</label>
            <input
              id="full_name"
              type="text"
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Role</label>
            <input
              type="text"
              className="input"
              value={profile?.role ?? "user"}
              disabled
            />
            <p className="mt-1 text-xs text-slate-400">
              Role changes require admin action.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary"
            >
              {isSaving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
