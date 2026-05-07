import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Seo from "@/components/Seo";
import { Compass, Loader2, Phone, Mail, ChevronDown } from "lucide-react";

const COUNTRY_CODES = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+1", flag: "🇺🇸", name: "USA" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+82", flag: "🇰🇷", name: "South Korea" },
  { code: "+66", flag: "🇹🇭", name: "Thailand" },
  { code: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "+977", flag: "🇳🇵", name: "Nepal" },
  { code: "+94", flag: "🇱🇰", name: "Sri Lanka" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+92", flag: "🇵🇰", name: "Pakistan" },
  { code: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "+55", flag: "🇧🇷", name: "Brazil" },
];

export default function Signup() {
  const { loginWithGoogle, loginWithPhone, signupWithEmail, verifyOtp, resendVerification, checkEmailVerified, user } = useAuth();
  const [authMode, setAuthMode] = useState("phone"); // "phone" | "email"
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 = input, 2 = otp
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const navigate = useNavigate();

  if (user && user !== false && user !== null && !user._pendingVerification) return <Navigate to="/account" replace />;

  const handleGoogleSignup = async () => {
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
    const fullPhone = `${countryCode}${phoneNumber}`;
    const res = await loginWithPhone(fullPhone, "recaptcha-container");
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

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await signupWithEmail(email, password, name);
    setLoading(false);
    if (!res.ok) {
      setErr(res.error);
    } else {
      setVerificationSent(true);
    }
  };

  const handleResendVerification = async () => {
    setResendMsg("");
    setErr("");
    const res = await resendVerification();
    if (res.ok) {
      setResendMsg("Verification email sent again! Check your inbox.");
    } else {
      setErr(res.error);
    }
  };

  const handleCheckVerified = async () => {
    setErr("");
    setLoading(true);
    const res = await checkEmailVerified();
    setLoading(false);
    if (res.ok) {
      navigate("/account");
    } else {
      setErr("Email not verified yet. Please check your inbox and click the link.");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-ink-0">
      <Seo
        title="Create Account — Wanderlust Adventure"
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

          <div className="mt-8 space-y-4">
            <button
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-3 bg-white border border-ink-200 hover:bg-ink-50 text-ink-900 rounded-lg px-6 py-2.5 font-medium transition-colors disabled:opacity-60"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>

            {/* Mode Toggle */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ink-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-ink-0 text-ink-500">Or continue with</span>
              </div>
            </div>

            <div className="flex bg-ink-100 rounded-lg p-1 gap-1">
              <button
                type="button"
                onClick={() => { setAuthMode("phone"); setErr(""); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all ${authMode === "phone" ? "bg-white shadow-sm text-ink-900" : "text-ink-500 hover:text-ink-700"}`}
              >
                <Phone className="h-3.5 w-3.5" /> Phone
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode("email"); setErr(""); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all ${authMode === "email" ? "bg-white shadow-sm text-ink-900" : "text-ink-500 hover:text-ink-700"}`}
              >
                <Mail className="h-3.5 w-3.5" /> Email
              </button>
            </div>

            {authMode === "phone" ? (
              <>
                {step === 1 ? (
                  <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <div>
                      <label className="label-caps mb-2 block">Phone Number</label>
                      <div className="flex gap-2">
                        <div className="relative">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="appearance-none bg-white border border-ink-200 rounded-md pl-3 pr-8 py-2.5 focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta outline-none transition-all text-sm font-medium w-[110px]"
                          >
                            {COUNTRY_CODES.map(c => (
                              <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
                        </div>
                        <input
                          type="tel"
                          value={phoneNumber}
                          placeholder="9876543210"
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          required
                          className="flex-1 bg-white border border-ink-200 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta outline-none transition-all"
                        />
                      </div>
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
              </>
            ) : verificationSent ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-display text-xl font-bold text-ink-900">Check your email</h3>
                <p className="text-ink-500 text-sm">
                  We've sent a verification link to <strong className="text-ink-700">{email}</strong>. Click the link in the email to verify your account.
                </p>
                {err && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {err}
                  </div>
                )}
                {resendMsg && (
                  <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                    {resendMsg}
                  </div>
                )}
                <button
                  onClick={handleCheckVerified}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-terracotta hover:bg-terracotta-hover text-white rounded-lg px-6 py-2.5 font-medium transition-colors disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  I've verified my email
                </button>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="w-full text-sm text-ink-500 hover:text-ink-900"
                >
                  Didn't receive it? Resend verification email
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div>
                  <label className="label-caps mb-2 block">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    placeholder="John Doe"
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-white border border-ink-200 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="label-caps mb-2 block">Email</label>
                  <input
                    type="email"
                    value={email}
                    placeholder="you@example.com"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white border border-ink-200 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="label-caps mb-2 block">Password</label>
                  <input
                    type="password"
                    value={password}
                    placeholder="Min. 6 characters"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-white border border-ink-200 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta outline-none transition-all"
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
                  <Mail className="h-4 w-4" />
                  Create Account
                </button>
              </form>
            )}
          </div>
          <p className="mt-8 text-sm text-ink-500">
            Already have an account?{" "}
            <Link to="/login" className="text-terracotta font-medium hover:underline">
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
