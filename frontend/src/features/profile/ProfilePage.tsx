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
      const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", profile.id);
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
  const lastScan = predictions?.[0] ? new Date(predictions[0].created_at).toLocaleDateString() : "None yet";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header>
        <p className="eyebrow">Account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">Profile</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Manage your clinical account details and workspace summary.</p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="panel p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-2xl font-bold text-brand-800 ring-1 ring-brand-200">
              {profile?.full_name?.[0]?.toUpperCase() ?? "C"}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-slate-950">{profile?.full_name ?? "Clinician"}</h2>
              <p className="mt-1 truncate text-sm text-slate-500">{profile?.email ?? "Clinical user"}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
              <p className="text-3xl font-semibold text-slate-950">{scanCount}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Total scans</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
              <p className="text-base font-semibold text-slate-950">{lastScan}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Last scan</p>
            </div>
          </div>
        </section>

        <section className="panel p-6" aria-labelledby="account-details-title">
          <h2 id="account-details-title" className="text-sm font-semibold text-slate-950">Account details</h2>
          <form onSubmit={handleSave} className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="full_name">Full name</label>
              <input id="full_name" type="text" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
            </div>
            <div>
              <label className="label" htmlFor="role">Role</label>
              <input id="role" type="text" className="input capitalize" value={profile?.role ?? "user"} disabled />
              <p className="mt-1.5 text-xs text-slate-500">Role changes require admin action.</p>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={isSaving} className="btn-primary">
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
