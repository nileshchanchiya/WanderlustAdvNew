import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Seo from "@/components/Seo";
import { Compass, Loader2, ArrowLeft, Mail, RefreshCw } from "lucide-react";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function Signup() {
  const { sendOtp, verifyOtp, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = form, 2 = OTP
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  if (user && user !== false && user !== null) return <Navigate to="/account" replace />;

  // ---------- Step 1: Send OTP ----------
  const onSendOtp = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await sendOtp(email.trim(), password, name.trim());
    setLoading(false);
    if (!res.ok) {
      setErr(res.error);
    } else {
      setStep(2);
      setResendTimer(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(""));
    }
  };

  // ---------- Step 2: Verify OTP ----------
  const onVerifyOtp = async (otpValue) => {
    const code = otpValue || otp.join("");
    if (code.length !== OTP_LENGTH) return;
    setErr("");
    setLoading(true);
    const res = await verifyOtp(email.trim(), code);
    setLoading(false);
    if (!res.ok) {
      setErr(res.error);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } else {
      navigate("/account");
    }
  };

  // ---------- OTP Input Handlers ----------
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all digits entered
    if (newOtp.every((d) => d !== "") && newOtp.join("").length === OTP_LENGTH) {
      onVerifyOtp(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (pasted.length === OTP_LENGTH) {
      const digits = pasted.split("");
      setOtp(digits);
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      onVerifyOtp(pasted);
    }
  };

  // ---------- Resend Cooldown ----------
  const onResend = async () => {
    if (resendTimer > 0) return;
    setErr("");
    setLoading(true);
    const res = await sendOtp(email.trim(), password, name.trim());
    setLoading(false);
    if (!res.ok) {
      setErr(res.error);
    } else {
      setResendTimer(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }
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

          {step === 1 ? (
            /* ── Step 1: Registration Form ── */
            <>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-10">
                Create your account.
              </h1>
              <p className="text-ink-500 mt-2">Start planning in under a minute.</p>

              <form onSubmit={onSendOtp} className="mt-8 space-y-4" data-testid="signup-form">
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
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Send verification code
                </button>
              </form>
              <p className="mt-8 text-sm text-ink-500">
                Already have one?{" "}
                <Link to="/login" className="text-terracotta font-medium hover:underline" data-testid="signup-to-login">
                  Log in
                </Link>
              </p>
            </>
          ) : (
            /* ── Step 2: OTP Verification ── */
            <>
              <button
                onClick={() => { setStep(1); setErr(""); }}
                className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ocean mt-8 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-4">
                Check your email.
              </h1>
              <p className="text-ink-500 mt-2">
                We sent a 6-digit code to <strong className="text-ocean">{email}</strong>
              </p>

              <div className="mt-8">
                <label className="label-caps mb-3 block">Verification Code</label>
                <div className="flex gap-2 sm:gap-3 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      autoFocus={i === 0}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-mono font-bold bg-white border-2 border-ink-200 rounded-lg focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta outline-none transition-all"
                      data-testid={`otp-input-${i}`}
                    />
                  ))}
                </div>

                {err && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-4" data-testid="otp-error">
                    {err}
                  </div>
                )}

                {loading && (
                  <div className="flex items-center justify-center gap-2 mt-4 text-ocean">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Verifying...</span>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-center gap-1 text-sm">
                  <span className="text-ink-500">Didn't get the code?</span>
                  <ResendButton timer={resendTimer} setTimer={setResendTimer} onResend={onResend} loading={loading} />
                </div>
              </div>
            </>
          )}
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

/* ── Resend Button with countdown ── */
function ResendButton({ timer, setTimer, onResend, loading }) {
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [timer, setTimer]);

  if (timer > 0) {
    return <span className="text-ink-300 tabular-nums">Resend in {timer}s</span>;
  }

  return (
    <button
      onClick={onResend}
      disabled={loading}
      className="inline-flex items-center gap-1 text-terracotta font-medium hover:underline disabled:opacity-50"
    >
      <RefreshCw className="h-3.5 w-3.5" />
      Resend
    </button>
  );
}
