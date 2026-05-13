import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      toast.success("Account created. You are now logged in.");
      navigate("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-8 text-slate-950">
      <div className="pointer-events-none absolute inset-0 soft-grid opacity-70" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[0.94fr_1.06fr]">
        <section className="panel mx-auto w-full max-w-md p-6 sm:p-8" aria-labelledby="register-title">
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-700 text-white shadow-glow">
              <PulseIcon className="h-6 w-6" />
            </div>
            <p className="eyebrow">Clinical onboarding</p>
            <h1 id="register-title" className="mt-2 text-3xl font-semibold text-slate-950">Create your account</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Set up secure access for scan analysis and result review.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="full_name">Full name</label>
              <input
                id="full_name"
                type="text"
                className="input"
                placeholder="Dr. Jane Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
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
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  aria-describedby="password-help"
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
              <p id="password-help" className="mt-1.5 text-xs text-slate-500">Use at least 8 characters.</p>
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-brand-700 transition-colors hover:text-brand-900">
              Sign in
            </Link>
          </p>
        </section>

        <section className="hidden lg:block">
          <p className="eyebrow">Designed for review teams</p>
          <h2 className="mt-4 text-5xl font-semibold leading-[1.02] tracking-normal text-slate-950">
            A secure workspace that keeps every scan moving.
          </h2>
          <div className="mt-8 space-y-3">
            {[
              ["Upload", "Submit JPEG or PNG scan images with guided validation."],
              ["Analyze", "Run tumor or stroke inference with clear processing states."],
              ["Review", "Compare confidence scores, Grad-CAM views, and result history."],
            ].map(([title, copy], index) => (
              <div key={title} className="card flex items-start gap-4 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-800 ring-1 ring-brand-200">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold text-slate-950">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{copy}</p>
                </div>
              </div>
            ))}
          </div>
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
