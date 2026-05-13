import { useState } from "react";
import { useAdminStats, useAdminUsers, useAuditLog, useUpdateUserRole } from "@/hooks/useAdmin";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import type { UserSummary } from "@/types";

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header>
        <p className="eyebrow">Operations</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">Admin dashboard</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Platform statistics, user management, and HIPAA audit visibility.</p>
      </header>
      <StatsSection />
      <UsersSection />
      <AuditSection />
    </div>
  );
}

function StatsSection() {
  const { data: stats, isLoading } = useAdminStats();
  const items = stats
    ? [
        { label: "Total users", value: stats.total_users, tone: "bg-brand-500", pct: 78 },
        { label: "Total predictions", value: stats.total_predictions, tone: "bg-success-500", pct: 86 },
        { label: "Tumor scans", value: stats.tumor_predictions, tone: "bg-cyan-500", pct: 64 },
        { label: "Stroke scans", value: stats.stroke_predictions, tone: "bg-teal-500", pct: 52 },
        { label: "Avg confidence", value: `${(stats.avg_confidence * 100).toFixed(1)}%`, tone: "bg-warning-500", pct: Math.round(stats.avg_confidence * 100) },
        { label: "Predictions today", value: stats.predictions_today, tone: "bg-slate-700", pct: 42 },
      ]
    : [];

  return (
    <section aria-labelledby="platform-stats-title">
      <h2 id="platform-stats-title" className="mb-4 text-base font-semibold text-slate-950">Platform statistics</h2>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, index) => <div key={index} className="h-32 animate-pulse rounded-3xl bg-slate-100/80" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(({ label, value, tone, pct }) => (
            <div key={label} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
                </div>
                <span className={`h-3 w-3 rounded-full ${tone}`} />
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(8, Math.min(100, pct))}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function UsersSection() {
  const { data: users, isLoading } = useAdminUsers();
  const { user: currentUser } = useAuth();

  return (
    <section aria-labelledby="users-title">
      <div className="mb-4">
        <h2 id="users-title" className="text-base font-semibold text-slate-950">Users</h2>
        <p className="mt-1 text-sm text-slate-500">Promote or demote users between clinician and admin roles.</p>
      </div>
      {isLoading ? (
        <SkeletonRows count={4} />
      ) : (
        <ResponsiveTable>
          <thead>
            <tr className="border-b border-slate-200/70 bg-slate-50/80 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4">Role</th>
              <th className="px-5 py-4">Scans</th>
              <th className="px-5 py-4">Joined</th>
              <th className="px-5 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(users ?? []).map((user) => <UserRow key={user.id} user={user} isSelf={user.id === currentUser?.id} />)}
          </tbody>
        </ResponsiveTable>
      )}
    </section>
  );
}

function UserRow({ user, isSelf }: { user: UserSummary; isSelf: boolean }) {
  const updateRole = useUpdateUserRole();
  const [confirming, setConfirming] = useState(false);
  const isAdmin = user.role === "admin";
  const targetRole = isAdmin ? "user" : "admin";

  async function handleRoleChange() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    try {
      await updateRole.mutateAsync({ userId: user.id, role: targetRole });
      toast.success(`${user.full_name ?? "User"} is now ${targetRole === "admin" ? "an admin" : "a clinician"}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Role update failed");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <tr className="transition-colors hover:bg-brand-50/40">
      <td className="px-5 py-4 font-semibold text-slate-950">{user.full_name ?? "Unnamed user"} {isSelf && <span className="ml-2 text-xs font-medium text-slate-400">(you)</span>}</td>
      <td className="px-5 py-4 text-slate-500">{user.email ?? "No email"}</td>
      <td className="px-5 py-4"><span className={isAdmin ? "badge-warning" : "badge-success"}>{isAdmin ? "Admin" : "Clinician"}</span></td>
      <td className="px-5 py-4 text-slate-600">{user.scan_count}</td>
      <td className="px-5 py-4 text-slate-500">{new Date(user.created_at).toLocaleDateString()}</td>
      <td className="px-5 py-4">
        {isSelf ? (
          <span className="text-xs text-slate-400">Locked</span>
        ) : confirming ? (
          <div className="flex items-center gap-2">
            <button onClick={handleRoleChange} disabled={updateRole.isPending} className="text-xs font-bold text-brand-700 hover:text-brand-900">
              {updateRole.isPending ? "Saving..." : "Confirm"}
            </button>
            <button onClick={() => setConfirming(false)} className="text-xs font-semibold text-slate-400 hover:text-slate-700">Cancel</button>
          </div>
        ) : (
          <button onClick={handleRoleChange} className="text-xs font-bold text-brand-700 transition-colors hover:text-brand-900">
            {isAdmin ? "Demote" : "Promote"}
          </button>
        )}
      </td>
    </tr>
  );
}

function AuditSection() {
  const { data: events, isLoading } = useAuditLog();

  return (
    <section aria-labelledby="audit-title">
      <div className="mb-4">
        <h2 id="audit-title" className="text-base font-semibold text-slate-950">HIPAA audit log</h2>
        <p className="mt-1 text-sm text-slate-500">Records who triggered which events. No PHI is stored in this log.</p>
      </div>
      {isLoading ? (
        <SkeletonRows count={5} />
      ) : (
        <ResponsiveTable minWidth="780px">
          <thead>
            <tr className="border-b border-slate-200/70 bg-slate-50/80 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              <th className="px-5 py-4">Time</th>
              <th className="px-5 py-4">Event</th>
              <th className="px-5 py-4">User ID</th>
              <th className="px-5 py-4">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(events ?? []).map((event) => (
              <tr key={event.id} className="transition-colors hover:bg-brand-50/40">
                <td className="px-5 py-4 font-mono text-xs text-slate-500">{new Date(event.created_at).toLocaleString()}</td>
                <td className="px-5 py-4"><span className="badge-success">{event.event_type}</span></td>
                <td className="px-5 py-4 font-mono text-xs text-slate-500">{event.user_id.slice(0, 8)}...</td>
                <td className="px-5 py-4 font-mono text-xs text-slate-400">{JSON.stringify(event.metadata)}</td>
              </tr>
            ))}
          </tbody>
        </ResponsiveTable>
      )}
    </section>
  );
}

function ResponsiveTable({ children, minWidth = "720px" }: { children: React.ReactNode; minWidth?: string }) {
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth }}>{children}</table>
      </div>
    </div>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <div className="panel space-y-3 p-5">
      {[...Array(count)].map((_, index) => <div key={index} className="h-14 animate-pulse rounded-2xl bg-slate-100/80" />)}
    </div>
  );
}
