import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-8 text-slate-950">
      <div className="pointer-events-none absolute inset-0 soft-grid opacity-70" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="hidden lg:block">
          <p className="eyebrow">AI clinical workspace</p>
          <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-[1.02] tracking-normal text-slate-950">
            Fast scan review with a calmer, clearer clinical workflow.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            Upload neurological scans, review model confidence, and keep every result in a polished audit-friendly workspace.
          </p>
          <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
            {[
              ["<10s", "analysis target"],
              ["RLS", "secured records"],
              ["Live", "history updates"],
            ].map(([value, label]) => (
              <div key={label} className="card p-4">
                <p className="text-2xl font-semibold text-slate-950">{value}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel mx-auto w-full max-w-md p-6 sm:p-8" aria-labelledby="login-title">
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-700 text-white shadow-glow">
              <PulseIcon className="h-6 w-6" />
            </div>
            <p className="eyebrow">Welcome back</p>
            <h2 id="login-title" className="mt-2 text-3xl font-semibold text-slate-950">Sign in to NeuroScan</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Access your clinical decision support dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@hospital.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="input pr-12"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            No account?{" "}
            <Link to="/register" className="font-semibold text-brand-700 transition-colors hover:text-brand-900">
              Create one
            </Link>
          </p>

          <p className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
            AI predictions do not constitute medical advice. For clinical use only under qualified supervision.
          </p>
        </section>
      </div>
    </main>
  );
}

function PulseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 13h3l2-6 4 12 2-6h5" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-4.8M7.5 7.7C4.2 9.5 2.25 12 2.25 12s3.75 6.75 9.75 6.75c1.5 0 2.9-.42 4.13-1.06M12 5.25c6 0 9.75 6.75 9.75 6.75a18.2 18.2 0 01-3.08 3.68" />
    </svg>
  );
}
