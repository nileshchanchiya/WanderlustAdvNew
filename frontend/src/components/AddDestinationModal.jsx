import React, { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { X, Loader2 } from "lucide-react";


export default function AddDestinationModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    region: "international",
    tag: "Culture",
    theme: "family",
    budget: "mid",
    image_url: "",
    notes: "",
    description: "",
    highlights: "",
    best_time: "",
    duration: "",
    price_from: "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.post("/destinations", form);
      onCreated(data);
    } catch (ex) {
      setErr(formatApiError(ex));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ocean-deep/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-up"
      onClick={onClose}
    >
      <div
        className="bg-white border border-fog/60 rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-modal"
        onClick={(e) => e.stopPropagation()}
        data-testid="add-destination-modal"
      >
        <div className="flex items-center justify-between p-6 border-b border-fog/60">
          <div>
            <div className="label-caps">New</div>
            <h2 className="font-serif text-2xl font-bold text-ocean mt-1">Add a custom destination</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-sand text-driftwood"
            aria-label="close"
            data-testid="dest-modal-close"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="label-caps mb-2 block">Destination name</label>
            <input
              value={form.name}
              onChange={set("name")}
              required
              autoFocus
              placeholder="e.g. Santorini, Andaman, Bir Billing"
              className="w-full bg-white border border-fog rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-gold/25 focus:border-gold outline-none"
              data-testid="dest-name-input"
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="label-caps mb-2 block">Region</label>
              <select
                value={form.region}
                onChange={set("region")}
                className="w-full bg-white border border-fog rounded-lg px-3 py-2.5"
                data-testid="dest-region-input"
              >
                <option value="international">International</option>
                <option value="domestic">Domestic</option>
              </select>
            </div>
            <div>
              <label className="label-caps mb-2 block">Theme</label>
              <select
                value={form.theme}
                onChange={set("theme")}
                className="w-full bg-white border border-fog rounded-lg px-3 py-2.5"
                data-testid="dest-theme-input"
              >
                <option value="family">Family</option>
                <option value="honeymoon">Honeymoon</option>
                <option value="friends">Friends</option>
                <option value="solo">Solo</option>
                <option value="adventure">Adventure</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
            <div>
              <label className="label-caps mb-2 block">Budget</label>
              <select
                value={form.budget}
                onChange={set("budget")}
                className="w-full bg-white border border-fog rounded-lg px-3 py-2.5"
                data-testid="dest-budget-input"
              >
                <option value="budget">Budget</option>
                <option value="mid">Mid-range</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label-caps mb-2 block">Short tag</label>
            <input
              value={form.tag}
              onChange={set("tag")}
              placeholder="Beaches · Culture"
              className="w-full bg-white border border-fog rounded-lg px-3 py-2.5"
              data-testid="dest-tag-input"
            />
          </div>
          <div>
            <label className="label-caps mb-2 block">Image URL (optional)</label>
            <input
              value={form.image_url}
              onChange={set("image_url")}
              placeholder="https://…"
              className="w-full bg-white border border-fog rounded-lg px-3 py-2.5 font-mono text-sm"
              data-testid="dest-image-input"
            />
            <p className="text-xs text-driftwood mt-1">
              Paste any public image URL. Leave blank to use a default ocean image.
            </p>
            {form.image_url && (
              <div className="mt-2 rounded-lg overflow-hidden border border-fog/60 h-32 w-48">
                <img
                  src={form.image_url}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}
          </div>
          <div>
            <label className="label-caps mb-2 block">Notes (private)</label>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              rows={3}
              placeholder="Why you want to go, who's coming, ideas…"
              className="w-full bg-white border border-fog rounded-lg px-3 py-2.5 resize-none"
              data-testid="dest-notes-input"
            />
          </div>
          {/* Additional Details */}
          <div className="pt-3 border-t border-fog/40">
            <div className="label-caps mb-3 text-ocean">Additional Details</div>
            <div className="space-y-4">
              <div>
                <label className="label-caps mb-2 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={set("description")}
                  rows={3}
                  placeholder="Describe this destination for visitors…"
                  className="w-full bg-white border border-fog rounded-lg px-3 py-2.5 resize-none"
                  data-testid="dest-description-input"
                />
              </div>
              <div>
                <label className="label-caps mb-2 block">Highlights (comma separated)</label>
                <input
                  value={form.highlights}
                  onChange={set("highlights")}
                  placeholder="e.g. Beach, Temple, Market, Waterfall"
                  className="w-full bg-white border border-fog rounded-lg px-3 py-2.5"
                  data-testid="dest-highlights-input"
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="label-caps mb-2 block">Best Time</label>
                  <input
                    value={form.best_time}
                    onChange={set("best_time")}
                    placeholder="e.g. Nov – Mar"
                    className="w-full bg-white border border-fog rounded-lg px-3 py-2.5"
                    data-testid="dest-besttime-input"
                  />
                </div>
                <div>
                  <label className="label-caps mb-2 block">Duration</label>
                  <input
                    value={form.duration}
                    onChange={set("duration")}
                    placeholder="e.g. 4–6 nights"
                    className="w-full bg-white border border-fog rounded-lg px-3 py-2.5"
                    data-testid="dest-duration-input"
                  />
                </div>
                <div>
                  <label className="label-caps mb-2 block">Price From</label>
                  <input
                    value={form.price_from}
                    onChange={set("price_from")}
                    placeholder="e.g. ₹25,000"
                    className="w-full bg-white border border-fog rounded-lg px-3 py-2.5 font-mono"
                    data-testid="dest-price-input"
                  />
                </div>
              </div>
            </div>
          </div>
          {err && (
            <div className="text-sm text-danger bg-danger-soft border border-danger/30 rounded-md px-3 py-2">
              {err}
            </div>
          )}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-fog/60">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-fog px-5 py-2.5 text-sm font-label font-semibold text-charcoal hover:bg-sand"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-sunset text-charcoal px-5 py-2.5 text-sm font-label font-semibold uppercase tracking-wider shadow-lift hover:shadow-float transition-all disabled:opacity-60"
              data-testid="dest-submit-btn"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save destination
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
