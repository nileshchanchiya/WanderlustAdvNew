import React, { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { X, Loader2 } from "lucide-react";

const EMOJIS = ["✈️", "🗾", "🏝️", "🎫", "🏕️", "🏔️", "🛶", "🎤", "📅", "🧭"];

export default function CreateItineraryModal({ onClose, onCreated, initial }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [type, setType] = useState(initial?.type || "travel");
  const [destination, setDestination] = useState(initial?.destination || "");
  const [startDate, setStartDate] = useState(initial?.start_date || "");
  const [endDate, setEndDate] = useState(initial?.end_date || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [emoji, setEmoji] = useState(initial?.cover_emoji || "✈️");
  const [budget, setBudget] = useState(initial?.budget_limit ?? 0);
  const [currency, setCurrency] = useState(initial?.currency || "USD");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        type,
        destination: destination.trim(),
        start_date: startDate || null,
        end_date: endDate || null,
        description: description.trim(),
        cover_emoji: emoji,
        budget_limit: Number(budget) || 0,
        currency,
      };
      let data;
      if (initial?.id) {
        ({ data } = await api.put(`/itineraries/${initial.id}`, payload));
      } else {
        ({ data } = await api.post("/itineraries", payload));
      }
      onCreated(data);
    } catch (ex) {
      setErr(formatApiError(ex));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-up"
      onClick={onClose}
    >
      <div
        className="bg-white border border-ink-200 rounded-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        data-testid="create-itinerary-modal"
      >
        <div className="flex items-center justify-between p-6 border-b border-ink-200">
          <div>
            <div className="label-caps">{initial ? "Edit" : "New"}</div>
            <h2 className="font-display text-2xl font-semibold mt-1">
              {initial ? "Edit itinerary" : "Start a new itinerary"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-ink-100 text-ink-500"
            data-testid="modal-close-btn"
            aria-label="close"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          <div>
            <label className="label-caps mb-2 block">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { k: "travel", t: "Travel" },
                { k: "event", t: "Event" },
                { k: "generic", t: "Plan" },
              ].map((o) => (
                <button
                  type="button"
                  key={o.k}
                  onClick={() => setType(o.k)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    type === o.k
                      ? "border-terracotta bg-terracotta text-white"
                      : "border-ink-200 text-ink-700 hover:bg-ink-50"
                  }`}
                  data-testid={`type-${o.k}`}
                >
                  {o.t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-caps mb-2 block">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Tokyo spring break"
              className="w-full bg-white border border-ink-200 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta outline-none transition-all"
              data-testid="itinerary-title-input"
            />
          </div>

          <div>
            <label className="label-caps mb-2 block">Cover emoji</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={`h-10 w-10 rounded-md border text-xl transition-colors ${
                    emoji === em ? "border-terracotta bg-terracotta-soft" : "border-ink-200"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-caps mb-2 block">Destination / Location</label>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Kyoto, Japan"
                className="w-full bg-white border border-ink-200 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta outline-none transition-all"
                data-testid="itinerary-destination-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label-caps mb-2 block">Start</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-ink-200 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta outline-none"
                  data-testid="itinerary-start-input"
                />
              </div>
              <div>
                <label className="label-caps mb-2 block">End</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white border border-ink-200 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta outline-none"
                  data-testid="itinerary-end-input"
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="label-caps mb-2 block">Budget (optional)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-white border border-ink-200 rounded-md px-3 py-2.5 font-mono focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta outline-none"
                data-testid="itinerary-budget-input"
              />
            </div>
            <div>
              <label className="label-caps mb-2 block">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-white border border-ink-200 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta outline-none"
                data-testid="itinerary-currency-input"
              >
                {["USD", "EUR", "GBP", "JPY", "INR", "CAD", "AUD", "SGD"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label-caps mb-2 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="A short summary of the plan…"
              className="w-full bg-white border border-ink-200 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta outline-none resize-none"
              data-testid="itinerary-description-input"
            />
          </div>

          {err && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {err}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
              data-testid="modal-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-terracotta hover:bg-terracotta-hover text-white px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
              data-testid="modal-submit-btn"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {initial ? "Save changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
