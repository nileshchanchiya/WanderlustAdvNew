import React, { useState, useRef, useCallback } from "react";
import {
  Plus, Clock, MapPin, Trash2, Edit2, Check, X, Utensils, Plane, Bed,
  Briefcase, Compass, Search, Loader2, ExternalLink, Copy, ChevronDown,
  ChevronRight, Timer, IndianRupee, CheckCircle2, Circle, PlayCircle,
  ArrowUp, ArrowDown,
} from "lucide-react";
import api from "@/lib/api";

const CAT_META = {
  activity: { icon: Compass, color: "bg-blue-50 text-blue-600 border-blue-200", dot: "bg-blue-500" },
  food: { icon: Utensils, color: "bg-orange-50 text-orange-600 border-orange-200", dot: "bg-orange-500" },
  transport: { icon: Plane, color: "bg-purple-50 text-purple-600 border-purple-200", dot: "bg-purple-500" },
  stay: { icon: Bed, color: "bg-emerald-50 text-emerald-600 border-emerald-200", dot: "bg-emerald-500" },
  meeting: { icon: Briefcase, color: "bg-amber-50 text-amber-600 border-amber-200", dot: "bg-amber-500" },
};
const CATEGORIES = Object.keys(CAT_META);
const STATUS_CYCLE = ["upcoming", "in-progress", "done"];
const STATUS_UI = {
  upcoming: { icon: Circle, label: "Upcoming", cls: "text-ink-400" },
  "in-progress": { icon: PlayCircle, label: "In Progress", cls: "text-blue-500" },
  done: { icon: CheckCircle2, label: "Done", cls: "text-emerald-500" },
};
const DURATIONS = ["15 min","30 min","45 min","1 hr","1.5 hr","2 hr","3 hr","4 hr","Half day","Full day"];

function newId() { return "e_" + Math.random().toString(36).slice(2, 10); }

function groupByDay(events) {
  const map = {};
  for (const ev of events) { const d = ev.day_index || 0; (map[d] = map[d] || []).push(ev); }
  for (const k of Object.keys(map)) map[k].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  return map;
}

function daySpan(s, e) {
  if (!s || !e) return 1;
  const diff = Math.round((new Date(e) - new Date(s)) / 864e5) + 1;
  return diff > 0 ? diff : 1;
}

function formatDayDate(startDate, i) {
  if (!startDate) return `Day ${i + 1}`;
  const d = new Date(startDate); d.setDate(d.getDate() + i);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function parseCost(v) { return Number(v) || 0; }

export default function TimelineTab({ itinerary, onUpdate }) {
  const [events, setEvents] = useState(itinerary.events || []);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(null);
  const [draft, setDraft] = useState(null);
  const [collapsed, setCollapsed] = useState({});

  const numDays = Math.max(daySpan(itinerary.start_date, itinerary.end_date), 1);
  const grouped = groupByDay(events);
  const currency = itinerary.currency || "INR";

  const persist = async (next) => { setEvents(next); await onUpdate({ events: next }); };

  const startAdd = (dayIdx) => {
    setAdding(dayIdx); setEditing(null);
    setDraft({ id: newId(), day_index: dayIdx, time: "", title: "", location: "", lat: null, lng: null, place_id: "", notes: "", category: "activity", duration: "", cost: "", status: "upcoming" });
  };

  const startEdit = (ev) => { setEditing(ev.id); setAdding(null); setDraft({ ...ev }); };
  const cancel = () => { setEditing(null); setAdding(null); setDraft(null); };

  const saveDraft = async () => {
    if (!draft?.title?.trim()) return;
    const next = editing ? events.map((e) => (e.id === editing ? draft : e)) : [...events, draft];
    await persist(next); cancel();
  };

  const removeEvent = async (id) => await persist(events.filter((e) => e.id !== id));

  const duplicateEvent = async (ev) => {
    const dup = { ...ev, id: newId(), title: ev.title + " (copy)", status: "upcoming" };
    await persist([...events, dup]);
  };

  const cycleStatus = async (ev) => {
    const idx = STATUS_CYCLE.indexOf(ev.status || "upcoming");
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    const updated = events.map((e) => (e.id === ev.id ? { ...e, status: next } : e));
    await persist(updated);
  };

  const moveEvent = async (ev, dir) => {
    const newDay = (ev.day_index || 0) + dir;
    if (newDay < 0 || newDay >= numDays) return;
    const updated = events.map((e) => (e.id === ev.id ? { ...e, day_index: newDay } : e));
    await persist(updated);
  };

  const toggle = (i) => setCollapsed((c) => ({ ...c, [i]: !c[i] }));

  // Grand totals
  const totalCost = events.reduce((s, e) => s + parseCost(e.cost), 0);
  const doneCount = events.filter((e) => e.status === "done").length;

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="bg-white border border-ink-200 rounded-xl p-4 flex flex-wrap items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-terracotta/10 grid place-items-center"><Clock className="h-4 w-4 text-terracotta" /></div>
          <div><div className="text-ink-500 text-xs">Events</div><div className="font-semibold">{events.length}</div></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 grid place-items-center"><CheckCircle2 className="h-4 w-4 text-emerald-500" /></div>
          <div><div className="text-ink-500 text-xs">Completed</div><div className="font-semibold">{doneCount}/{events.length}</div></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-50 grid place-items-center"><IndianRupee className="h-4 w-4 text-amber-600" /></div>
          <div><div className="text-ink-500 text-xs">Est. Cost</div><div className="font-semibold font-mono">{currency} {totalCost.toLocaleString()}</div></div>
        </div>
        {events.length > 0 && (
          <div className="ml-auto">
            <div className="h-2 w-32 bg-ink-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${events.length ? (doneCount / events.length) * 100 : 0}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Days */}
      {Array.from({ length: numDays }).map((_, i) => {
        const dayEvents = grouped[i] || [];
        const isCollapsed = collapsed[i];
        const dayCost = dayEvents.reduce((s, e) => s + parseCost(e.cost), 0);
        const dayDone = dayEvents.filter((e) => e.status === "done").length;

        return (
          <section key={i} className="bg-white border border-ink-200 rounded-xl overflow-hidden" data-testid={`day-section-${i}`}>
            {/* Day header */}
            <button onClick={() => toggle(i)} className="w-full flex items-center justify-between p-4 hover:bg-ink-50 transition-colors">
              <div className="flex items-center gap-3">
                {isCollapsed ? <ChevronRight className="h-4 w-4 text-ink-400" /> : <ChevronDown className="h-4 w-4 text-ink-400" />}
                <div className="text-left">
                  <div className="label-caps">Day {String(i + 1).padStart(2, "0")}</div>
                  <div className="font-display text-lg font-semibold">{formatDayDate(itinerary.start_date, i)}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-ink-500">
                <span>{dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}</span>
                {dayCost > 0 && <span className="font-mono">{currency} {dayCost.toLocaleString()}</span>}
                <span className="text-emerald-600">{dayDone}/{dayEvents.length} done</span>
              </div>
            </button>

            {!isCollapsed && (
              <div className="px-4 pb-4">
                <ol className="relative border-l-2 border-ink-200 ml-4 md:ml-6">
                  {dayEvents.length === 0 && adding !== i && (
                    <li className="pl-8 py-4 text-sm text-ink-500">Nothing scheduled. Add your first event.</li>
                  )}

                  {dayEvents.map((ev) => {
                    const cat = CAT_META[ev.category] || CAT_META.activity;
                    const Icon = cat.icon;
                    const isEditing = editing === ev.id;
                    const hasCoords = typeof ev.lat === "number" && typeof ev.lng === "number";
                    const st = STATUS_UI[ev.status || "upcoming"];

                    return (
                      <li key={ev.id} className="mb-4 pl-8 relative" data-testid={`timeline-event-${ev.id}`}>
                        <span className={`absolute w-3 h-3 rounded-full -left-[7px] top-3 ring-4 ring-white ${cat.dot}`} />
                        {isEditing ? (
                          <EventEditor draft={draft} setDraft={setDraft} onCancel={cancel} onSave={saveDraft} />
                        ) : (
                          <div className={`border rounded-xl p-4 group transition-all ${ev.status === "done" ? "bg-ink-50 border-ink-100 opacity-75" : "bg-white border-ink-200"}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cat.color}`}>
                                    <Icon className="h-3 w-3" />{ev.category}
                                  </span>
                                  <span className="text-xs text-ink-400 font-mono flex items-center gap-1">
                                    <Clock className="h-3 w-3" />{ev.time || "—"}
                                  </span>
                                  {ev.duration && (
                                    <span className="text-xs text-ink-400 flex items-center gap-1">
                                      <Timer className="h-3 w-3" />{ev.duration}
                                    </span>
                                  )}
                                  {ev.cost > 0 && (
                                    <span className="text-xs text-amber-600 font-mono flex items-center gap-1">
                                      <IndianRupee className="h-3 w-3" />{Number(ev.cost).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                <div className={`text-base font-semibold mt-1.5 ${ev.status === "done" ? "line-through text-ink-400" : "text-ink-900"}`}>{ev.title}</div>
                                {ev.location && (
                                  <div className="flex items-center gap-1 mt-1 text-sm text-ink-500">
                                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate">{ev.location}</span>
                                    {hasCoords && (
                                      <a href={`https://www.google.com/maps/search/?api=1&query=${ev.lat},${ev.lng}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-terracotta hover:underline">
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                  </div>
                                )}
                                {ev.notes && <p className="text-sm text-ink-600 mt-2 whitespace-pre-wrap bg-ink-50 rounded-lg px-3 py-2">{ev.notes}</p>}
                              </div>
                              {/* Actions */}
                              <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button onClick={() => cycleStatus(ev)} title={st.label} className={`p-1.5 rounded-md hover:bg-ink-100 ${st.cls}`}>
                                  <st.icon className="h-4 w-4" />
                                </button>
                                <button onClick={() => startEdit(ev)} className="p-1.5 rounded-md hover:bg-ink-100 text-ink-500" title="Edit">
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => duplicateEvent(ev)} className="p-1.5 rounded-md hover:bg-ink-100 text-ink-500" title="Duplicate">
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                                {i > 0 && <button onClick={() => moveEvent(ev, -1)} className="p-1.5 rounded-md hover:bg-ink-100 text-ink-500" title="Move to previous day">
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </button>}
                                {i < numDays - 1 && <button onClick={() => moveEvent(ev, 1)} className="p-1.5 rounded-md hover:bg-ink-100 text-ink-500" title="Move to next day">
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </button>}
                                <button onClick={() => removeEvent(ev.id)} className="p-1.5 rounded-md hover:bg-ink-100 text-ink-500 hover:text-red-600" title="Delete">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            {hasCoords && (
                              <div className="mt-3 rounded-lg overflow-hidden border border-ink-100">
                                <iframe title={`Map: ${ev.title}`} width="100%" height="140" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyDzESV2Qc0Ik_pJMvgvrXCGaLL-UNOZFyw&q=${ev.lat},${ev.lng}&zoom=15`} />
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}

                  {adding === i && (
                    <li className="mb-4 pl-8 relative">
                      <span className="absolute w-3 h-3 bg-terracotta rounded-full -left-[7px] top-3 ring-4 ring-white" />
                      <EventEditor draft={draft} setDraft={setDraft} onCancel={cancel} onSave={saveDraft} />
                    </li>
                  )}
                </ol>
                <button onClick={() => startAdd(i)} className="inline-flex items-center gap-2 text-sm rounded-lg border border-dashed border-ink-300 px-4 py-2 hover:bg-ink-50 text-ink-500 hover:text-ink-900 ml-12 transition-colors" data-testid={`add-event-day-${i}`}>
                  <Plus className="h-3.5 w-3.5" /> Add event
                </button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

/* ── Location Search ── */
function LocationSearch({ onSelect, initialValue }) {
  const [query, setQuery] = useState(initialValue || "");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback(async (q) => {
    if (!q || q.length < 3) { setResults([]); return; }
    setSearching(true);
    try { const { data } = await api.get("/maps/places", { params: { query: q } }); setResults(data || []); setShowResults(true); }
    catch { setResults([]); }
    finally { setSearching(false); }
  }, []);

  const onInput = (val) => { setQuery(val); clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => search(val), 400); };
  const pick = (place) => { setQuery(place.name); setShowResults(false); onSelect(place); };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400" />
        <input value={query} onChange={(e) => onInput(e.target.value)} onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Search a place..." className="w-full bg-white border border-ink-200 rounded-md pl-8 pr-3 py-1.5 text-sm" data-testid="location-search-input" />
        {searching && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-ink-400" />}
      </div>
      {showResults && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-ink-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {results.map((r, i) => (
            <button key={r.place_id || i} onClick={() => pick(r)} className="w-full text-left px-3 py-2.5 hover:bg-ink-50 border-b border-ink-100 last:border-0">
              <div className="text-sm font-medium text-ink-900">{r.name}</div>
              <div className="text-xs text-ink-500 truncate">{r.address}</div>
              {r.rating && <div className="text-xs text-amber-600 mt-0.5">★ {r.rating}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Event Editor ── */
function EventEditor({ draft, setDraft, onCancel, onSave }) {
  const handlePlaceSelect = (place) => {
    setDraft({ ...draft, location: place.name + (place.address ? `, ${place.address}` : ""), lat: place.lat, lng: place.lng, place_id: place.place_id || "" });
  };

  return (
    <div className="bg-white border-2 border-terracotta rounded-xl p-4 space-y-3" data-testid="event-editor">
      <div className="grid grid-cols-12 gap-2">
        <input type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })}
          className="col-span-3 bg-white border border-ink-200 rounded-md px-2 py-1.5 font-mono text-sm" data-testid="event-time-input" />
        <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          className="col-span-4 bg-white border border-ink-200 rounded-md px-2 py-1.5 text-sm capitalize" data-testid="event-category-input">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Event title" autoFocus
          className="col-span-5 bg-white border border-ink-200 rounded-md px-2 py-1.5 text-sm" data-testid="event-title-input" />
      </div>

      {/* Duration + Cost row */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="label-caps text-[10px] text-ink-500 mb-1">⏱ Duration</div>
          <select value={draft.duration || ""} onChange={(e) => setDraft({ ...draft, duration: e.target.value })}
            className="w-full bg-white border border-ink-200 rounded-md px-2 py-1.5 text-sm">
            <option value="">Select duration</option>
            {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <div className="label-caps text-[10px] text-ink-500 mb-1">💰 Est. Cost</div>
          <input type="number" min="0" step="1" value={draft.cost ?? ""} onChange={(e) => setDraft({ ...draft, cost: e.target.value })}
            placeholder="0" className="w-full bg-white border border-ink-200 rounded-md px-2 py-1.5 font-mono text-sm" />
        </div>
      </div>

      {/* Location */}
      <div>
        <div className="label-caps text-[10px] text-ink-500 mb-1">📍 Location</div>
        <LocationSearch initialValue={draft.location} onSelect={handlePlaceSelect} />
      </div>
      {draft.lat && draft.lng && (
        <div className="flex items-center gap-3 text-xs text-ink-500 bg-ink-50 rounded-md px-3 py-2">
          <MapPin className="h-3.5 w-3.5 text-terracotta flex-shrink-0" />
          <span className="font-mono">{Number(draft.lat).toFixed(5)}, {Number(draft.lng).toFixed(5)}</span>
          <span className="truncate">{draft.location}</span>
          <button onClick={() => setDraft({ ...draft, lat: null, lng: null, location: "", place_id: "" })} className="ml-auto text-ink-400 hover:text-red-500"><X className="h-3 w-3" /></button>
        </div>
      )}
      {!draft.lat && !draft.lng && (
        <details className="text-xs text-ink-500">
          <summary className="cursor-pointer hover:text-ink-700">Or enter coordinates manually</summary>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <input type="number" step="any" value={draft.lat ?? ""} onChange={(e) => setDraft({ ...draft, lat: e.target.value ? Number(e.target.value) : null })}
              placeholder="Latitude" className="bg-white border border-ink-200 rounded-md px-2 py-1.5 font-mono text-sm" />
            <input type="number" step="any" value={draft.lng ?? ""} onChange={(e) => setDraft({ ...draft, lng: e.target.value ? Number(e.target.value) : null })}
              placeholder="Longitude" className="bg-white border border-ink-200 rounded-md px-2 py-1.5 font-mono text-sm" />
          </div>
        </details>
      )}

      <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Notes (optional)" rows={2}
        className="w-full bg-white border border-ink-200 rounded-md px-2 py-1.5 text-sm resize-none" data-testid="event-notes-input" />

      <div className="flex items-center justify-end gap-2">
        <button onClick={onCancel} className="text-sm px-3 py-1.5 rounded-md hover:bg-ink-100 text-ink-600 inline-flex items-center gap-1"><X className="h-3.5 w-3.5" /> Cancel</button>
        <button onClick={onSave} disabled={!draft.title?.trim()} className="text-sm px-3 py-1.5 rounded-md bg-terracotta hover:bg-terracotta-hover text-white inline-flex items-center gap-1 disabled:opacity-50" data-testid="event-save-btn">
          <Check className="h-3.5 w-3.5" /> Save
        </button>
      </div>
    </div>
  );
}
