import { useState } from "react";
import { useAdminStats, useAdminUsers, useAuditLog, useUpdateUserRole } from "@/hooks/useAdmin";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import type { UserSummary } from "@/types";

export default function AdminPage() {
    return (
        <div className="mx-auto max-w-5xl px-6 py-10 space-y-10">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Platform statistics, user management, and HIPAA audit log.
                </p>
            </div>
            <StatsSection />
            <UsersSection />
            <AuditSection />
        </div>
    );
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function StatsSection() {
    const { data: stats, isLoading } = useAdminStats();

    const items = stats
        ? [
            { label: "Total users",       value: stats.total_users },
            { label: "Total predictions", value: stats.total_predictions },
            { label: "Tumor scans",       value: stats.tumor_predictions },
            { label: "Stroke scans",      value: stats.stroke_predictions },
            { label: "Avg confidence",    value: `${(stats.avg_confidence * 100).toFixed(1)}%` },
            { label: "Predictions today", value: stats.predictions_today },
        ]
        : [];

    return (
        <section>
            <h2 className="mb-4 text-base font-semibold text-slate-900">Platform statistics</h2>
            {isLoading ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {items.map(({ label, value }) => (
                        <div key={label} className="card">
                            <p className="text-xs font-medium text-slate-400">{label}</p>
                            <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

// ── Users ─────────────────────────────────────────────────────────────────────

function UsersSection() {
    const { data: users, isLoading } = useAdminUsers();
    const { user: currentUser } = useAuth();

    return (
        <section>
            <h2 className="mb-1 text-base font-semibold text-slate-900">Users</h2>
            <p className="mb-4 text-xs text-slate-400">
                Promote or demote users between clinician and admin roles.
                You cannot change your own role.
            </p>

            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                            <th className="px-5 py-3">Name</th>
                            <th className="px-5 py-3">Email</th>
                            <th className="px-5 py-3">Role</th>
                            <th className="px-5 py-3">Scans</th>
                            <th className="px-5 py-3">Joined</th>
                            <th className="px-5 py-3">Action</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {(users ?? []).map((u) => (
                            <UserRow
                                key={u.id}
                                user={u}
                                isSelf={u.id === currentUser?.id}
                            />
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

function UserRow({ user, isSelf }: { user: UserSummary; isSelf: boolean }) {
    const updateRole = useUpdateUserRole();
    const [confirming, setConfirming] = useState(false);

    const isAdmin = user.role === "admin";
    const targetRole = isAdmin ? "user" : "admin";
    const actionLabel = isAdmin ? "Demote" : "Promote";

    async function handleRoleChange() {
        if (!confirming) {
            // First click — ask for confirmation
            setConfirming(true);
            return;
        }

        // Second click — confirmed, apply the change
        try {
            await updateRole.mutateAsync({ userId: user.id, role: targetRole });
            toast.success(
                `${user.full_name ?? "User"} is now ${targetRole === "admin" ? "an admin" : "a clinician"}`
            );
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Role update failed");
        } finally {
            setConfirming(false);
        }
    }

    return (
        <tr className="hover:bg-slate-50 transition-colors">
            <td className="px-5 py-3 font-medium text-slate-900">
                {user.full_name ?? "—"}
                {isSelf && (
                    <span className="ml-2 text-xs text-slate-400">(you)</span>
                )}
            </td>
            <td className="px-5 py-3 text-slate-500">{user.email ?? "—"}</td>
            <td className="px-5 py-3">
        <span className={isAdmin ? "badge-warning" : "badge-success"}>
          {isAdmin ? "Admin" : "Clinician"}
        </span>
            </td>
            <td className="px-5 py-3 text-slate-600">{user.scan_count}</td>
            <td className="px-5 py-3 text-slate-500">
                {new Date(user.created_at).toLocaleDateString()}
            </td>
            <td className="px-5 py-3">
                {isSelf ? (
                    <span className="text-xs text-slate-300">—</span>
                ) : confirming ? (
                    // Confirmation state — two buttons appear
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Sure?</span>
                        <button
                            onClick={handleRoleChange}
                            disabled={updateRole.isPending}
                            className={
                                isAdmin
                                    ? "text-xs font-medium text-danger-500 hover:text-danger-700"
                                    : "text-xs font-medium text-brand-600 hover:text-brand-700"
                            }
                        >
                            {updateRole.isPending ? "Saving…" : "Yes, confirm"}
                        </button>
                        <button
                            onClick={() => setConfirming(false)}
                            className="text-xs text-slate-400 hover:text-slate-600"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleRoleChange}
                        className={
                            isAdmin
                                ? "text-xs font-medium text-danger-500 hover:text-danger-700 transition-colors"
                                : "text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                        }
                    >
                        {actionLabel} to {targetRole}
                    </button>
                )}
            </td>
        </tr>
    );
}

// ── Audit log ─────────────────────────────────────────────────────────────────

function AuditSection() {
    const { data: events, isLoading } = useAuditLog();

    return (
        <section>
            <h2 className="mb-1 text-base font-semibold text-slate-900">HIPAA Audit log</h2>
            <p className="mb-4 text-xs text-slate-400">
                Records who triggered which events. No PHI is stored in this log.
            </p>
            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                            <th className="px-5 py-3">Time</th>
                            <th className="px-5 py-3">Event</th>
                            <th className="px-5 py-3">User ID</th>
                            <th className="px-5 py-3">Metadata</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {(events ?? []).map((e) => (
                            <tr key={e.id} className="hover:bg-slate-50">
                                <td className="px-5 py-3 font-mono text-xs text-slate-500">
                                    {new Date(e.created_at).toLocaleString()}
                                </td>
                                <td className="px-5 py-3">
                                    <span className="badge-success">{e.event_type}</span>
                                </td>
                                <td className="px-5 py-3 font-mono text-xs text-slate-500">
                                    {e.user_id.slice(0, 8)}…
                                </td>
                                <td className="px-5 py-3 font-mono text-xs text-slate-400">
                                    {JSON.stringify(e.metadata)}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}