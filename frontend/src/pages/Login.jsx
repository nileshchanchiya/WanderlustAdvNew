import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Seo from "@/components/Seo";
import { Compass, Loader2 } from "lucide-react";

export default function Login() {
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (user && user !== false && user !== null) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (!res.ok) setErr(res.error);
    else navigate("/dashboard");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-ink-0">
      <Seo
        title="Log in — Wanderlust Adventure"
        description="Log in to your Wanderlust Adventure account to access your saved itineraries and custom destinations."
        path="/login"
        noIndex
      />
      <div className="hidden lg:block relative border-r border-ink-200 bg-ink-50 grain overflow-hidden">
        <img
          src="https://images.pexels.com/photos/8092410/pexels-photo-8092410.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
          alt="minimal planning desk"
          className="absolute inset-0 w-full h-full object-cover opacity-95"
        />
        <div className="absolute inset-0 bg-ink-900/10" />
        <div className="absolute bottom-10 left-10 right-10 text-white drop-shadow">
          <div className="label-caps text-white/80">◆ Wanderlust Adventure</div>
          <p className="font-display text-3xl mt-3 leading-tight">
            Plans live well when they live <em>together</em>.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="h-9 w-9 rounded-full bg-ocean text-gold grid place-items-center">
              <Compass className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-[20px] font-bold text-ocean">Wanderlust</span>
              <span className="font-label text-[10px] tracking-[0.22em] uppercase text-driftwood font-semibold -mt-0.5">
                Adventure
              </span>
            </span>
          </Link>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-10">
            Welcome back.
          </h1>
          <p className="text-ink-500 mt-2">Log in to pick up where you left off.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" data-testid="login-form">
            <div>
              <label className="label-caps mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full bg-white border border-ink-200 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta outline-none transition-all"
                data-testid="login-email-input"
              />
            </div>
            <div>
              <label className="label-caps mb-2 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white border border-ink-200 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta outline-none transition-all"
                data-testid="login-password-input"
              />
            </div>
            {err && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2" data-testid="login-error">
                {err}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-terracotta hover:bg-terracotta-hover text-white rounded-lg px-6 py-2.5 font-medium transition-colors disabled:opacity-60"
              data-testid="login-submit-button"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Log in
            </button>
          </form>
          <p className="mt-8 text-sm text-ink-500">
            No account yet?{" "}
            <Link to="/signup" className="text-terracotta font-medium hover:underline" data-testid="login-to-signup">
              Create one
            </Link>
          </p>
          <p className="mt-6 text-xs text-ink-500 font-mono">
            Demo admin · admin@itinera.app · admin123
          </p>
        </div>
      </div>
    </div>
  );
}
