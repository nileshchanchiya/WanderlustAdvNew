import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Seo from "@/components/Seo";
import { Compass, Loader2 } from "lucide-react";

export default function Signup() {
  const { register, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (user && user !== false && user !== null) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await register(email.trim(), password, name.trim());
    setLoading(false);
    if (!res.ok) setErr(res.error);
    else navigate("/dashboard");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-ink-0">
      <Seo
        title="Create Account — Wanderlust Adventure Itinerary Maker"
        description="Sign up for Wanderlust Adventure to use our free itinerary maker, save custom destinations, and plan your perfect trip from Rajkot."
        path="/signup"
      />
      <div className="flex items-center justify-center p-6 sm:p-10 order-2 lg:order-1">
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
            Create your account.
          </h1>
          <p className="text-ink-500 mt-2">Start planning in under a minute.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" data-testid="signup-form">
            <div>
              <label className="label-caps mb-2 block">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="w-full bg-white border border-ink-200 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta outline-none transition-all"
                data-testid="signup-name-input"
              />
            </div>
            <div>
              <label className="label-caps mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-ink-200 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta outline-none transition-all"
                data-testid="signup-email-input"
              />
            </div>
            <div>
              <label className="label-caps mb-2 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className="w-full bg-white border border-ink-200 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta outline-none transition-all"
                data-testid="signup-password-input"
              />
              <p className="text-xs text-ink-500 mt-1">Min 6 characters.</p>
            </div>
            {err && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2" data-testid="signup-error">
                {err}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-terracotta hover:bg-terracotta-hover text-white rounded-lg px-6 py-2.5 font-medium transition-colors disabled:opacity-60"
              data-testid="signup-submit-button"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </button>
          </form>
          <p className="mt-8 text-sm text-ink-500">
            Already have one?{" "}
            <Link to="/login" className="text-terracotta font-medium hover:underline" data-testid="signup-to-login">
              Log in
            </Link>
          </p>
        </div>
      </div>
      <div className="hidden lg:block relative border-l border-ink-200 bg-ink-50 grain overflow-hidden order-1 lg:order-2">
        <img
          src="https://images.unsplash.com/photo-1770387208261-4dbb347ed760?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwzfHxtaW5pbWFsaXN0JTIwdHJhdmVsJTIwYXJjaGl0ZWN0dXJlfGVufDB8fHx8MTc3Nzg4MjM3OXww&ixlib=rb-4.1.0&q=85"
          alt="minimalist architecture"
          className="absolute inset-0 w-full h-full object-cover opacity-95"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute bottom-10 left-10 right-10 text-white drop-shadow">
          <div className="label-caps text-white/80">◆ One plan, many trips</div>
          <p className="font-display text-3xl mt-3 leading-tight">
            Your journeys deserve a <em>calm</em> home.
          </p>
        </div>
      </div>
    </div>
  );
}
