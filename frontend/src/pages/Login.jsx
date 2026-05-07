import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Seo from "@/components/Seo";
import { Compass, Loader2, Phone, Mail } from "lucide-react";

export default function Login() {
  const { loginWithGoogle, loginWithPhone, verifyOtp, user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 = phone input, 2 = otp input
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (user && user !== false && user !== null) return <Navigate to="/account" replace />;

  const handleGoogleLogin = async () => {
    setErr("");
    setLoading(true);
    const res = await loginWithGoogle();
    setLoading(false);
    if (!res.ok) setErr(res.error);
    else navigate("/account");
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    // Add + prefix if missing (basic validation, assume +1 or user inputs full code)
    const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
    const res = await loginWithPhone(formattedPhone, "recaptcha-container");
    setLoading(false);
    if (!res.ok) {
      setErr(res.error);
    } else {
      setStep(2);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await verifyOtp(otp);
    setLoading(false);
    if (!res.ok) {
      setErr(res.error);
    } else {
      navigate("/account");
    }
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
          loading="lazy"
          decoding="async"
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

          <div className="mt-8 space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-3 bg-white border border-ink-200 hover:bg-ink-50 text-ink-900 rounded-lg px-6 py-2.5 font-medium transition-colors disabled:opacity-60"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ink-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-ink-0 text-ink-500">Or continue with Phone</span>
              </div>
            </div>

            {step === 1 ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div>
                  <label className="label-caps mb-2 block">Phone Number (with Country Code)</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    placeholder="+1234567890"
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="w-full bg-white border border-ink-200 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta outline-none transition-all"
                  />
                </div>
                {err && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {err}
                  </div>
                )}
                <div id="recaptcha-container"></div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-terracotta hover:bg-terracotta-hover text-white rounded-lg px-6 py-2.5 font-medium transition-colors disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Phone className="h-4 w-4" />
                  Send Verification Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <label className="label-caps mb-2 block">Verification Code</label>
                  <input
                    type="text"
                    value={otp}
                    placeholder="123456"
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="w-full bg-white border border-ink-200 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta outline-none transition-all tracking-widest text-center text-xl"
                  />
                </div>
                {err && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {err}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-terracotta hover:bg-terracotta-hover text-white rounded-lg px-6 py-2.5 font-medium transition-colors disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Verify Code
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-sm text-ink-500 hover:text-ink-900 mt-2"
                >
                  Change phone number
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
