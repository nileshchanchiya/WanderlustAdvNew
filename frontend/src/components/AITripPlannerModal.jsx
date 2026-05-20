import React, { useState, useRef, useCallback, useEffect } from "react";
import api, { formatApiError } from "@/lib/api";
import {
  X, Loader2, Sparkles, Upload, FileText, MapPin, Calendar,
  Users, Wallet, Compass, ChevronRight, ChevronLeft, Check,
  Utensils, Camera, Mountain, ShoppingBag, Moon, Landmark,
  Palmtree, Heart, Dumbbell, Plane, ArrowRight, RefreshCw,
  Clock, Tag, Package, Coffee
} from "lucide-react";
import { toast } from "sonner";

/* ── Interest chips ── */
const INTERESTS = [
  { id: "culture", label: "Culture", icon: Landmark },
  { id: "food", label: "Food & Cuisine", icon: Utensils },
  { id: "adventure", label: "Adventure", icon: Mountain },
  { id: "nature", label: "Nature", icon: Palmtree },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "nightlife", label: "Nightlife", icon: Moon },
  { id: "history", label: "History", icon: Compass },
  { id: "beach", label: "Beach", icon: Palmtree },
  { id: "photography", label: "Photography", icon: Camera },
  { id: "wellness", label: "Wellness & Spa", icon: Dumbbell },
  { id: "romantic", label: "Romantic", icon: Heart },
  { id: "family", label: "Family-friendly", icon: Users },
];

const TRAVEL_STYLES = [
  {
    id: "budget",
    label: "Budget",
    desc: "Hostels, street food, public transport",
    emoji: "🎒",
    color: "border-emerald-400 bg-emerald-50 text-emerald-800",
    activeColor: "border-emerald-500 bg-emerald-100 ring-2 ring-emerald-400",
  },
  {
    id: "mid-range",
    label: "Mid-Range",
    desc: "Hotels, restaurants, mix of transport",
    emoji: "🏨",
    color: "border-blue-400 bg-blue-50 text-blue-800",
    activeColor: "border-blue-500 bg-blue-100 ring-2 ring-blue-400",
  },
  {
    id: "luxury",
    label: "Luxury",
    desc: "5-star resorts, fine dining, private transfers",
    emoji: "✨",
    color: "border-amber-400 bg-amber-50 text-amber-800",
    activeColor: "border-amber-500 bg-amber-100 ring-2 ring-amber-400",
  },
];

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "SGD", "THB", "AED"];

/* ── Main Modal Component ── */
export default function AITripPlannerModal({ onClose, onCreated }) {
  const [mode, setMode] = useState(null); // null = mode select, "wizard" | "file" | "describe"
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [preview, setPreview] = useState(null); // AI-generated itinerary data
  const [saving, setSaving] = useState(false);

  // Wizard state
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelers, setTravelers] = useState(2);
  const [travelStyle, setTravelStyle] = useState("mid-range");
  const [interests, setInterests] = useState([]);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [specialRequests, setSpecialRequests] = useState("");

  // File import state
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  // Describe state
  const [describePrompt, setDescribePrompt] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleInterest = (id) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  /* ── API calls ── */
  const generateFromWizard = async () => {
    setErr("");
    setLoading(true);
    try {
      const { data } = await api.post("/itineraries/ai-generate", {
        destination,
        start_date: startDate || null,
        end_date: endDate || null,
        travelers,
        travel_style: travelStyle,
        interests,
        budget_amount: budgetAmount ? Number(budgetAmount) : null,
        currency,
        special_requests: specialRequests,
      }, { timeout: 60000 });
      setPreview(data);
      setStep(4); // preview step
    } catch (ex) {
      setErr(formatApiError(ex));
    } finally {
      setLoading(false);
    }
  };

  const generateFromFile = async () => {
    if (!file) return;
    setErr("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/itineraries/ai-import-file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });
      setPreview(data);
      setMode("preview");
    } catch (ex) {
      setErr(formatApiError(ex));
    } finally {
      setLoading(false);
    }
  };

  const generateFromDescribe = async () => {
    if (!describePrompt.trim()) return;
    setErr("");
    setLoading(true);
    try {
      const { data } = await api.post("/itineraries/ai-describe", {
        prompt: describePrompt,
      }, { timeout: 60000 });
      setPreview(data);
      setMode("preview");
    } catch (ex) {
      setErr(formatApiError(ex));
    } finally {
      setLoading(false);
    }
  };

  const saveItinerary = async () => {
    if (!preview) return;
    setSaving(true);
    setErr("");
    try {
      const payload = {
        title: preview.title || "AI Generated Trip",
        type: preview.type || "travel",
        destination: preview.destination || destination || "",
        start_date: preview.start_date || startDate || null,
        end_date: preview.end_date || endDate || null,
        description: preview.description || "",
        cover_emoji: preview.cover_emoji || "✈️",
        budget_limit: Number(preview.budget_limit) || 0,
        currency: preview.currency || currency || "INR",
      };
      // Create the itinerary
      const { data: created } = await api.post("/itineraries", payload);
      // Now update with events, expenses, packing
      const updatePayload = {};
      if (preview.events?.length) updatePayload.events = preview.events;
      if (preview.expenses?.length) updatePayload.expenses = preview.expenses;
      if (preview.packing?.length) updatePayload.packing = preview.packing;
      if (Object.keys(updatePayload).length > 0) {
        const { data: updated } = await api.put(
          `/itineraries/${created.id}`,
          updatePayload
        );
        onCreated(updated);
      } else {
        onCreated(created);
      }
      toast.success("AI itinerary saved! 🎉");
    } catch (ex) {
      setErr(formatApiError(ex));
    } finally {
      setSaving(false);
    }
  };

  const regenerate = () => {
    setPreview(null);
    setErr("");
    if (mode === "wizard") {
      generateFromWizard();
    } else if (mode === "file") {
      generateFromFile();
    } else if (mode === "describe") {
      generateFromDescribe();
    }
  };

  /* ── Render ── */
  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-up"
      onClick={onClose}
    >
      <div
        className="bg-white border border-ink-200 rounded-2xl w-full max-w-3xl max-h-[94vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-ink-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center shadow-lg">
              <Sparkles className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ocean">
                AI Trip Planner
              </h2>
              <p className="text-xs text-driftwood">
                Powered by Gemini AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-ink-100 text-ink-500 transition-colors"
            aria-label="close"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6">
          {/* Error display */}
          {err && (
            <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2">
              <span className="text-red-400 mt-0.5">⚠️</span>
              <span>{err}</span>
            </div>
          )}

          {/* Mode selector */}
          {mode === null && !preview && <ModeSelector onSelect={setMode} />}

          {/* Wizard flow */}
          {mode === "wizard" && !preview && !loading && (
            <WizardSteps
              step={step}
              setStep={setStep}
              destination={destination}
              setDestination={setDestination}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              travelers={travelers}
              setTravelers={setTravelers}
              travelStyle={travelStyle}
              setTravelStyle={setTravelStyle}
              interests={interests}
              toggleInterest={toggleInterest}
              budgetAmount={budgetAmount}
              setBudgetAmount={setBudgetAmount}
              currency={currency}
              setCurrency={setCurrency}
              specialRequests={specialRequests}
              setSpecialRequests={setSpecialRequests}
              onGenerate={generateFromWizard}
              onBack={() => { setMode(null); setStep(0); }}
            />
          )}

          {/* File import flow */}
          {mode === "file" && !preview && !loading && (
            <FileImport
              file={file}
              setFile={setFile}
              fileRef={fileRef}
              onGenerate={generateFromFile}
              onBack={() => { setMode(null); setFile(null); }}
            />
          )}

          {/* Describe flow */}
          {mode === "describe" && !preview && !loading && (
            <DescribeTrip
              prompt={describePrompt}
              setPrompt={setDescribePrompt}
              onGenerate={generateFromDescribe}
              onBack={() => { setMode(null); setDescribePrompt(""); }}
            />
          )}

          {/* Loading state */}
          {loading && <LoadingState />}

          {/* Preview (from any mode) */}
          {(preview || mode === "preview") && preview && !loading && (
            <PreviewResult
              preview={preview}
              saving={saving}
              onSave={saveItinerary}
              onRegenerate={regenerate}
              onBack={() => {
                setPreview(null);
                if (mode === "preview" || mode === "file" || mode === "describe") setMode(null);
                else setStep(3);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Mode Selector
──────────────────────────────────────────── */
function ModeSelector({ onSelect }) {
  const modes = [
    {
      id: "wizard",
      icon: Sparkles,
      title: "AI Trip Planner",
      desc: "Guided wizard — pick your destination, style & interests. AI does the rest.",
      gradient: "from-violet-500 to-fuchsia-500",
      iconBg: "bg-violet-100 text-violet-600",
    },
    {
      id: "file",
      icon: Upload,
      title: "Import from File",
      desc: "Upload a booking PDF, flight ticket, or hotel screenshot. AI reads it.",
      gradient: "from-sky-500 to-cyan-500",
      iconBg: "bg-sky-100 text-sky-600",
    },
    {
      id: "describe",
      icon: FileText,
      title: "Describe Your Trip",
      desc: 'Type freely — "5-day honeymoon in Bali, luxury, ₹3L budget"',
      gradient: "from-amber-500 to-orange-500",
      iconBg: "bg-amber-100 text-amber-600",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="font-display text-2xl font-bold text-charcoal">
          How would you like to plan?
        </h3>
        <p className="text-driftwood mt-1">Choose a method to get started</p>
      </div>
      <div className="grid gap-4">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className="group w-full flex items-center gap-5 p-5 rounded-xl border-2 border-ink-100 hover:border-ink-300 bg-white hover:bg-ink-50/50 transition-all text-left shadow-sm hover:shadow-md"
          >
            <div className={`h-14 w-14 rounded-xl ${m.iconBg} grid place-items-center flex-shrink-0 transition-transform group-hover:scale-110`}>
              <m.icon className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-lg font-semibold text-charcoal">{m.title}</div>
              <div className="text-sm text-driftwood mt-0.5">{m.desc}</div>
            </div>
            <ChevronRight className="h-5 w-5 text-ink-300 group-hover:text-ink-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Wizard Steps
──────────────────────────────────────────── */
function WizardSteps({
  step, setStep,
  destination, setDestination,
  startDate, setStartDate, endDate, setEndDate,
  travelers, setTravelers,
  travelStyle, setTravelStyle,
  interests, toggleInterest,
  budgetAmount, setBudgetAmount,
  currency, setCurrency,
  specialRequests, setSpecialRequests,
  onGenerate, onBack,
}) {
  const steps = [
    { label: "Destination", icon: MapPin },
    { label: "Style", icon: Compass },
    { label: "Interests", icon: Heart },
    { label: "Details", icon: Wallet },
  ];

  const canNext = () => {
    if (step === 0) return destination.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onGenerate();
  };

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8 px-2">
        {steps.map((s, i) => (
          <React.Fragment key={s.label}>
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                i <= step ? "text-ocean" : "text-ink-300"
              } ${i < step ? "cursor-pointer hover:text-ocean-deep" : ""}`}
            >
              <div
                className={`h-8 w-8 rounded-full grid place-items-center text-xs font-bold transition-all ${
                  i < step
                    ? "bg-ocean text-white"
                    : i === step
                    ? "bg-ocean/10 text-ocean border-2 border-ocean"
                    : "bg-ink-100 text-ink-400"
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 rounded ${i < step ? "bg-ocean" : "bg-ink-200"}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 0: Destination & Dates */}
      {step === 0 && (
        <div className="space-y-5 animate-fade-up">
          <div>
            <label className="label-caps mb-2 block">Where are you going? *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-driftwood" />
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Manali, Bali, Paris, Tokyo..."
                className="w-full pl-11 pr-4 py-3 border-2 border-ink-200 rounded-xl text-lg focus:ring-2 focus:ring-ocean/20 focus:border-ocean outline-none transition-all"
                autoFocus
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-caps mb-2 block">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-driftwood" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border-2 border-ink-200 rounded-xl focus:ring-2 focus:ring-ocean/20 focus:border-ocean outline-none"
                />
              </div>
            </div>
            <div>
              <label className="label-caps mb-2 block">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-driftwood" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border-2 border-ink-200 rounded-xl focus:ring-2 focus:ring-ocean/20 focus:border-ocean outline-none"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="label-caps mb-2 block">Number of Travelers</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setTravelers(Math.max(1, travelers - 1))}
                className="h-11 w-11 rounded-xl border-2 border-ink-200 grid place-items-center text-lg font-bold hover:bg-ink-50 transition-colors"
              >
                −
              </button>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-ocean" />
                <span className="font-display text-2xl font-bold text-ocean">{travelers}</span>
              </div>
              <button
                type="button"
                onClick={() => setTravelers(Math.min(20, travelers + 1))}
                className="h-11 w-11 rounded-xl border-2 border-ink-200 grid place-items-center text-lg font-bold hover:bg-ink-50 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Travel Style */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-up">
          <h3 className="font-display text-xl font-bold text-charcoal">What's your travel style?</h3>
          <div className="grid gap-3">
            {TRAVEL_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setTravelStyle(s.id)}
                className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
                  travelStyle === s.id ? s.activeColor : s.color + " hover:shadow-md"
                }`}
              >
                <span className="text-3xl">{s.emoji}</span>
                <div>
                  <div className="font-semibold text-lg">{s.label}</div>
                  <div className="text-sm opacity-75">{s.desc}</div>
                </div>
                {travelStyle === s.id && (
                  <Check className="ml-auto h-6 w-6 text-current" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Interests */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-up">
          <div>
            <h3 className="font-display text-xl font-bold text-charcoal">What interests you?</h3>
            <p className="text-sm text-driftwood mt-1">Pick as many as you like — AI will tailor your plan</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {INTERESTS.map((int) => {
              const active = interests.includes(int.id);
              return (
                <button
                  key={int.id}
                  type="button"
                  onClick={() => toggleInterest(int.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                    active
                      ? "border-ocean bg-ocean/5 text-ocean ring-1 ring-ocean/30"
                      : "border-ink-200 text-ink-600 hover:border-ink-300 hover:bg-ink-50"
                  }`}
                >
                  <int.icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
                  <span className="text-sm font-semibold">{int.label}</span>
                  {active && <Check className="h-4 w-4 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Budget & Special Requests */}
      {step === 3 && (
        <div className="space-y-5 animate-fade-up">
          <h3 className="font-display text-xl font-bold text-charcoal">Any final details?</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="label-caps mb-2 block">Total Budget (optional)</label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-driftwood" />
                <input
                  type="number"
                  min="0"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full pl-10 pr-3 py-3 border-2 border-ink-200 rounded-xl font-mono focus:ring-2 focus:ring-ocean/20 focus:border-ocean outline-none"
                />
              </div>
            </div>
            <div>
              <label className="label-caps mb-2 block">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full py-3 px-3 border-2 border-ink-200 rounded-xl focus:ring-2 focus:ring-ocean/20 focus:border-ocean outline-none"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label-caps mb-2 block">Special Requests</label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={3}
              placeholder="E.g. vegetarian food only, wheelchair accessible, must visit Taj Mahal, avoid crowded places..."
              className="w-full px-4 py-3 border-2 border-ink-200 rounded-xl focus:ring-2 focus:ring-ocean/20 focus:border-ocean outline-none resize-none"
            />
          </div>

          {/* Summary card */}
          <div className="bg-ink-50 rounded-xl p-5 space-y-2">
            <div className="label-caps text-[10px] text-driftwood mb-3">Trip Summary</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-ocean" /> <span className="text-charcoal font-medium">{destination}</span></div>
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-ocean" /> <span>{travelers} traveler{travelers > 1 ? "s" : ""}</span></div>
              <div className="flex items-center gap-2"><Compass className="h-4 w-4 text-ocean" /> <span className="capitalize">{travelStyle}</span></div>
              {startDate && <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-ocean" /> <span>{startDate}{endDate ? ` → ${endDate}` : ""}</span></div>}
              {interests.length > 0 && (
                <div className="col-span-2 flex items-center gap-2 flex-wrap">
                  <Heart className="h-4 w-4 text-ocean flex-shrink-0" />
                  {interests.map(i => <span key={i} className="text-xs bg-ocean/10 text-ocean px-2 py-0.5 rounded-full">{i}</span>)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-5 border-t border-ink-200">
        <button
          type="button"
          onClick={() => (step === 0 ? onBack() : setStep(step - 1))}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-ink-600 hover:text-charcoal hover:bg-ink-50 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canNext()}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-lg hover:shadow-xl"
        >
          {step < 3 ? (
            <>Next <ChevronRight className="h-4 w-4" /></>
          ) : (
            <>Generate with AI <Sparkles className="h-4 w-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   File Import
──────────────────────────────────────────── */
function FileImport({ file, setFile, fileRef, onGenerate, onBack }) {
  const onDrop = useCallback((e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) setFile(f);
  }, [setFile]);

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h3 className="font-display text-xl font-bold text-charcoal">Import from a file</h3>
        <p className="text-sm text-driftwood mt-1">Upload a booking confirmation, flight ticket, or travel plan</p>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all hover:border-ocean hover:bg-ocean/5 ${
          file ? "border-ocean bg-ocean/5" : "border-ink-300"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.txt,.csv"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        {file ? (
          <div className="space-y-3">
            <div className="h-14 w-14 rounded-xl bg-ocean/10 grid place-items-center mx-auto">
              <FileText className="h-7 w-7 text-ocean" />
            </div>
            <div>
              <p className="font-semibold text-charcoal">{file.name}</p>
              <p className="text-xs text-driftwood mt-1">
                {(file.size / 1024).toFixed(1)} KB · {file.type || "unknown type"}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="text-xs text-red-500 hover:text-red-700 underline"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="h-14 w-14 rounded-xl bg-ink-100 grid place-items-center mx-auto">
              <Upload className="h-7 w-7 text-ink-400" />
            </div>
            <div>
              <p className="font-semibold text-charcoal">Drop a file here or click to browse</p>
              <p className="text-xs text-driftwood mt-1">Supports PDF, JPG, PNG, TXT, CSV (max 10MB)</p>
            </div>
          </div>
        )}
      </div>

      {/* Supported formats */}
      <div className="flex flex-wrap gap-2 justify-center">
        {["PDF", "JPG", "PNG", "TXT", "CSV"].map((fmt) => (
          <span key={fmt} className="text-xs bg-ink-100 text-ink-500 px-3 py-1 rounded-full font-mono">.{fmt.toLowerCase()}</span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-5 border-t border-ink-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-ink-600 hover:text-charcoal hover:bg-ink-50 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <button
          type="button"
          onClick={onGenerate}
          disabled={!file}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-lg hover:shadow-xl"
        >
          Analyze with AI <Sparkles className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Describe Trip
──────────────────────────────────────────── */
function DescribeTrip({ prompt, setPrompt, onGenerate, onBack }) {
  const examples = [
    "5-day family trip to Rajasthan with kids, budget ₹80,000",
    "3-day honeymoon in Maldives, luxury resorts, ₹2.5L",
    "Weekend trek to Manali, adventure & nature, budget ₹15K",
    "7-day Europe backpacking — Paris, Amsterdam, Berlin",
  ];

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h3 className="font-display text-xl font-bold text-charcoal">Describe your dream trip</h3>
        <p className="text-sm text-driftwood mt-1">Tell us everything — AI will create a complete plan</p>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={5}
        placeholder="E.g. Plan a 4-day trip to Goa for 3 friends, mid-range budget around ₹25,000 per person. We love beaches, seafood, nightlife, and water sports. First time visiting."
        className="w-full px-4 py-4 border-2 border-ink-200 rounded-xl text-base focus:ring-2 focus:ring-ocean/20 focus:border-ocean outline-none resize-none"
        autoFocus
      />

      {/* Examples */}
      <div>
        <p className="text-xs text-driftwood mb-2 uppercase tracking-wider font-semibold">Try these examples:</p>
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setPrompt(ex)}
              className="text-xs bg-ink-50 hover:bg-ink-100 text-ink-600 px-3 py-1.5 rounded-full transition-colors border border-ink-200 hover:border-ink-300"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-5 border-t border-ink-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-ink-600 hover:text-charcoal hover:bg-ink-50 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <button
          type="button"
          onClick={onGenerate}
          disabled={!prompt.trim()}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl"
        >
          Generate Plan <Sparkles className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Loading State
──────────────────────────────────────────── */
function LoadingState() {
  const tips = [
    "Researching the best local spots...",
    "Estimating realistic costs...",
    "Building your day-by-day schedule...",
    "Adding hidden gems only locals know...",
    "Packing the perfect suitcase...",
  ];
  const [tipIdx, setTipIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTipIdx((i) => (i + 1) % tips.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="py-16 text-center animate-fade-up">
      <div className="relative mx-auto h-20 w-20 mb-8">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 animate-ping opacity-20" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center">
          <Sparkles className="h-9 w-9 text-white animate-pulse" />
        </div>
      </div>
      <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
        AI is planning your trip...
      </h3>
      <p className="text-driftwood text-sm transition-all duration-500 h-5">
        {tips[tipIdx]}
      </p>
      <div className="mt-6 mx-auto w-64 h-1.5 bg-ink-100 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full animate-progress" />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Preview Result
──────────────────────────────────────────── */
function PreviewResult({ preview, saving, onSave, onRegenerate, onBack }) {
  const events = preview.events || [];
  const expenses = preview.expenses || [];
  const packing = preview.packing || [];

  // Group events by day
  const dayMap = {};
  events.forEach((evt) => {
    const d = evt.day_index ?? 0;
    if (!dayMap[d]) dayMap[d] = [];
    dayMap[d].push(evt);
  });
  const days = Object.keys(dayMap).sort((a, b) => a - b);

  const totalBudget = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const categoryIcon = (cat) => {
    const map = {
      food: Utensils, transport: Plane, activity: Camera, stay: Coffee, meeting: Users,
      accommodation: Coffee, activities: Camera, shopping: ShoppingBag,
    };
    return map[cat] || Tag;
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-xl p-6 border border-violet-200">
        <div className="flex items-start gap-4">
          <span className="text-4xl">{preview.cover_emoji || "✈️"}</span>
          <div className="flex-1">
            <h3 className="font-display text-2xl font-bold text-charcoal">{preview.title}</h3>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-driftwood">
              {preview.destination && (
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {preview.destination}</span>
              )}
              {preview.start_date && (
                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {preview.start_date}{preview.end_date ? ` → ${preview.end_date}` : ""}</span>
              )}
              {totalBudget > 0 && (
                <span className="inline-flex items-center gap-1"><Wallet className="h-3.5 w-3.5" /> {preview.currency || "INR"} {totalBudget.toLocaleString()}</span>
              )}
            </div>
            {preview.description && (
              <p className="text-sm text-ink-600 mt-3 leading-relaxed">{preview.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Day-by-day Timeline */}
      {days.length > 0 && (
        <div>
          <h4 className="font-display text-lg font-bold text-ocean flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5" /> Day-by-Day Plan
          </h4>
          <div className="space-y-4">
            {days.map((dayIdx) => (
              <details key={dayIdx} className="group border border-ink-200 rounded-xl overflow-hidden" open={Number(dayIdx) === 0}>
                <summary className="flex items-center justify-between p-4 bg-ink-50 cursor-pointer hover:bg-ink-100 transition-colors">
                  <span className="font-semibold text-charcoal">Day {Number(dayIdx) + 1}</span>
                  <span className="text-xs text-driftwood">{dayMap[dayIdx].length} activities</span>
                </summary>
                <div className="p-4 space-y-3">
                  {dayMap[dayIdx].sort((a, b) => (a.time || "").localeCompare(b.time || "")).map((evt) => {
                    const Icon = categoryIcon(evt.category);
                    return (
                      <div key={evt.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-ink-100 hover:border-ink-200 transition-colors">
                        <div className="h-9 w-9 rounded-lg bg-ocean/10 grid place-items-center flex-shrink-0 mt-0.5">
                          <Icon className="h-4 w-4 text-ocean" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {evt.time && <span className="text-xs font-mono text-ocean bg-ocean/5 px-1.5 py-0.5 rounded">{evt.time}</span>}
                            <span className="font-semibold text-sm text-charcoal">{evt.title}</span>
                          </div>
                          {evt.location && <p className="text-xs text-driftwood mt-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" /> {evt.location}</p>}
                          {evt.notes && <p className="text-xs text-ink-500 mt-1">{evt.notes}</p>}
                        </div>
                        <span className="text-[10px] bg-ink-100 text-ink-500 px-2 py-0.5 rounded-full capitalize flex-shrink-0">{evt.category}</span>
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Budget Breakdown */}
      {expenses.length > 0 && (
        <div>
          <h4 className="font-display text-lg font-bold text-ocean flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5" /> Estimated Budget
          </h4>
          <div className="bg-ink-50 rounded-xl p-4">
            <div className="space-y-2">
              {expenses.map((exp) => {
                const Icon = categoryIcon(exp.category);
                return (
                  <div key={exp.id} className="flex items-center justify-between py-2 border-b border-ink-200 last:border-0">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-driftwood" strokeWidth={1.5} />
                      <span className="text-sm text-charcoal">{exp.description}</span>
                    </div>
                    <span className="font-mono text-sm font-semibold text-ocean">
                      {exp.currency || preview.currency || "INR"} {Number(exp.amount || 0).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t-2 border-ocean/20">
              <span className="font-semibold text-charcoal">Total Estimated</span>
              <span className="font-mono text-lg font-bold text-ocean">
                {preview.currency || "INR"} {totalBudget.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Packing List */}
      {packing.length > 0 && (
        <div>
          <h4 className="font-display text-lg font-bold text-ocean flex items-center gap-2 mb-4">
            <Package className="h-5 w-5" /> Suggested Packing
          </h4>
          <div className="flex flex-wrap gap-2">
            {packing.map((p) => (
              <span key={p.id} className="text-xs bg-white border border-ink-200 text-ink-600 px-3 py-1.5 rounded-full">
                {p.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-5 border-t border-ink-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-ink-600 hover:text-charcoal hover:bg-ink-50 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Regenerate
          </button>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-ocean to-ocean-deep hover:shadow-xl transition-all disabled:opacity-60 shadow-lg"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save Itinerary
        </button>
      </div>
    </div>
  );
}
