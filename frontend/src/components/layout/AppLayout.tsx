import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: GridIcon },
  { to: "/history", label: "Scan History", icon: ClockIcon },
  { to: "/profile", label: "Profile", icon: UserIcon },
];

export default function AppLayout() {
  const { signOut, isAdmin, profile } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    navigate("/login");
  }

  return (
    <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-950">
      <div className="pointer-events-none fixed inset-0 soft-grid opacity-60" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-56 bg-gradient-to-b from-brand-100/70 via-white/40 to-transparent" aria-hidden="true" />

      <div className="relative flex min-h-screen flex-col lg:flex-row">
        <aside className="z-20 border-b border-white/70 bg-white/[0.82] px-4 py-3 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.4)] backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:flex-col lg:border-b-0 lg:border-r lg:px-4 lg:py-5">
          <div className="flex items-center justify-between gap-3 lg:block">
            <div className="flex items-center gap-3 rounded-2xl lg:px-2">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-700 text-white shadow-glow">
                <PulseIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">NeuroScan AI</p>
                <p className="truncate text-xs font-medium text-slate-500">Clinical decision support</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="icon-button lg:hidden"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOutIcon className="h-4 w-4" />
            </button>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:mt-8 lg:flex-1 lg:flex-col lg:gap-1.5 lg:overflow-y-auto lg:pb-0">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={navLinkClass}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">{label}</span>
              </NavLink>
            ))}

            {isAdmin && (
              <NavLink to="/admin" className={navLinkClass}>
                <ShieldIcon className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">Admin</span>
              </NavLink>
            )}
          </nav>

          <div className="mt-4 hidden lg:block">
            <div className="rounded-2xl border border-slate-200/70 bg-white/[0.72] p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-sm font-bold text-brand-800 ring-1 ring-brand-200">
                  {profile?.full_name?.[0]?.toUpperCase() ?? "C"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {profile?.full_name ?? "Clinician"}
                  </p>
                  <p className="truncate text-xs font-medium capitalize text-slate-500">
                    {profile?.role ?? "user"} workspace
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="icon-button h-9 w-9"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOutIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="relative z-10 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    "group inline-flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200",
    isActive
      ? "bg-brand-700 text-white shadow-glow"
      : "text-slate-600 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950 hover:shadow-sm",
  ].join(" ");
}

function PulseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 13h3l2-6 4 12 2-6h5" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 7v5l3 3" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
