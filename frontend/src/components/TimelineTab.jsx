import React, { useState } from "react";
import { Plus, Clock, MapPin, Trash2, Edit2, Check, X, Utensils, Plane, Bed, Briefcase, Compass } from "lucide-react";

const CAT_ICONS = {
  activity: Compass,
  food: Utensils,
  transport: Plane,
  stay: Bed,
  meeting: Briefcase,
};
const CATEGORIES = ["activity", "food", "transport", "stay", "meeting"];

function newId() {
  return "e_" + Math.random().toString(36).slice(2, 10);
}

function groupByDay(events) {
  const map = {};
  for (const ev of events) {
    const d = ev.day_index || 0;
    if (!map[d]) map[d] = [];
    map[d].push(ev);
  }
  for (const k of Object.keys(map)) {
    map[k].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }
  return map;
}

function daySpan(startDate, endDate) {
  if (!startDate || !endDate) return 1;
  const s = new Date(startDate);
  const e = new Date(endDate);
  const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 1;
}

function formatDayDate(startDate, i) {
  if (!startDate) return `Day ${i + 1}`;
  const d = new Date(startDate);
  d.setDate(d.getDate() + i);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function TimelineTab({ itinerary, onUpdate }) {
  const [events, setEvents] = useState(itinerary.events || []);
  const [editing, setEditing] = useState(null); // event id
  const [adding, setAdding] = useState(null); // day index
  const [draft, setDraft] = useState(null);

  const numDays = Math.max(daySpan(itinerary.start_date, itinerary.end_date), 1);
  const grouped = groupByDay(events);

  const persist = async (next) => {
    setEvents(next);
    await onUpdate({ events: next });
  };

  const startAdd = (dayIdx) => {
    setAdding(dayIdx);
    setEditing(null);
    setDraft({
      id: newId(),
      day_index: dayIdx,
      time: "",
      title: "",
      location: "",
      lat: null,
      lng: null,
      notes: "",
      category: "activity",
    });
  };

  const startEdit = (ev) => {
    setEditing(ev.id);
    setAdding(null);
    setDraft({ ...ev });
  };

  const cancel = () => {
    setEditing(null);
    setAdding(null);
    setDraft(null);
  };

  const saveDraft = async () => {
    if (!draft?.title?.trim()) return;
    let next;
    if (editing) {
      next = events.map((e) => (e.id === editing ? draft : e));
    } else {
      next = [...events, draft];
    }
    await persist(next);
    cancel();
  };

  const removeEvent = async (id) => {
    const next = events.filter((e) => e.id !== id);
    await persist(next);
  };

  return (
    <div className="space-y-10">
      {Array.from({ length: numDays }).map((_, i) => {
        const dayEvents = grouped[i] || [];
        return (
          <section key={i} data-testid={`day-section-${i}`}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="label-caps">Day {String(i + 1).padStart(2, "0")}</div>
                <div className="font-display text-xl font-semibold mt-1">
                  {formatDayDate(itinerary.start_date, i)}
                </div>
              </div>
              <button
                onClick={() => startAdd(i)}
                className="inline-flex items-center gap-2 text-sm rounded-lg border border-ink-200 px-3 py-1.5 hover:bg-ink-50"
                data-testid={`add-event-day-${i}`}
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={1.8} /> Add event
              </button>
            </div>

            <ol className="relative border-l border-ink-200 ml-4 md:ml-6">
              {dayEvents.length === 0 && adding !== i && (
                <li className="pl-8 py-4 text-sm text-ink-500">
                  Nothing scheduled. Add your first event for this day.
                </li>
              )}

              {dayEvents.map((ev) => {
                const Icon = CAT_ICONS[ev.category] || Compass;
                const isEditing = editing === ev.id;
                return (
                  <li key={ev.id} className="mb-6 pl-8 relative" data-testid={`timeline-event-${ev.id}`}>
                    <span className="absolute w-3 h-3 bg-terracotta rounded-full -left-[6.5px] top-2 ring-4 ring-ink-0" />
                    {isEditing ? (
                      <EventEditor draft={draft} setDraft={setDraft} onCancel={cancel} onSave={saveDraft} />
                    ) : (
                      <div className="bg-white border border-ink-200 rounded-xl p-4 group">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 text-xs text-ink-500 font-mono">
                              <Clock className="h-3 w-3" strokeWidth={1.8} />
                              {ev.time || "—"}
                              <span className="mx-1 text-ink-300">·</span>
                              <Icon className="h-3.5 w-3.5 text-terracotta" strokeWidth={1.5} />
                              <span className="capitalize">{ev.category}</span>
                            </div>
                            <div className="text-base font-semibold text-ink-900 mt-1">{ev.title}</div>
                            {ev.location && (
                              <div className="flex items-center gap-1 mt-1 text-sm text-ink-500">
                                <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                                {ev.location}
                              </div>
                            )}
                            {ev.notes && <p className="text-sm text-ink-600 mt-2 whitespace-pre-wrap">{ev.notes}</p>}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(ev)}
                              className="p-1.5 rounded-md hover:bg-ink-100 text-ink-500"
                              data-testid={`edit-event-${ev.id}`}
                            >
                              <Edit2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                            </button>
                            <button
                              onClick={() => removeEvent(ev.id)}
                              className="p-1.5 rounded-md hover:bg-ink-100 text-ink-500 hover:text-red-600"
                              data-testid={`delete-event-${ev.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}

              {adding === i && (
                <li className="mb-6 pl-8 relative">
                  <span className="absolute w-3 h-3 bg-terracotta rounded-full -left-[6.5px] top-2 ring-4 ring-ink-0" />
                  <EventEditor draft={draft} setDraft={setDraft} onCancel={cancel} onSave={saveDraft} />
                </li>
              )}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function EventEditor({ draft, setDraft, onCancel, onSave }) {
  return (
    <div className="bg-white border border-terracotta rounded-xl p-4 space-y-3" data-testid="event-editor">
      <div className="grid grid-cols-12 gap-2">
        <input
          type="time"
          value={draft.time}
          onChange={(e) => setDraft({ ...draft, time: e.target.value })}
          className="col-span-3 bg-white border border-ink-200 rounded-md px-2 py-1.5 font-mono text-sm"
          data-testid="event-time-input"
        />
        <select
          value={draft.category}
          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          className="col-span-4 bg-white border border-ink-200 rounded-md px-2 py-1.5 text-sm capitalize"
          data-testid="event-category-input"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Title"
          autoFocus
          className="col-span-5 bg-white border border-ink-200 rounded-md px-2 py-1.5 text-sm"
          data-testid="event-title-input"
        />
      </div>
      <input
        value={draft.location}
        onChange={(e) => setDraft({ ...draft, location: e.target.value })}
        placeholder="Location (optional)"
        className="w-full bg-white border border-ink-200 rounded-md px-2 py-1.5 text-sm"
        data-testid="event-location-input"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          step="any"
          value={draft.lat ?? ""}
          onChange={(e) => setDraft({ ...draft, lat: e.target.value ? Number(e.target.value) : null })}
          placeholder="Latitude"
          className="bg-white border border-ink-200 rounded-md px-2 py-1.5 font-mono text-sm"
          data-testid="event-lat-input"
        />
        <input
          type="number"
          step="any"
          value={draft.lng ?? ""}
          onChange={(e) => setDraft({ ...draft, lng: e.target.value ? Number(e.target.value) : null })}
          placeholder="Longitude"
          className="bg-white border border-ink-200 rounded-md px-2 py-1.5 font-mono text-sm"
          data-testid="event-lng-input"
        />
      </div>
      <textarea
        value={draft.notes}
        onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        placeholder="Notes"
        rows={2}
        className="w-full bg-white border border-ink-200 rounded-md px-2 py-1.5 text-sm resize-none"
        data-testid="event-notes-input"
      />
      <div className="flex items-center justify-end gap-2">
        <button onClick={onCancel} className="text-sm px-3 py-1.5 rounded-md hover:bg-ink-100 text-ink-600 inline-flex items-center gap-1">
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!draft.title?.trim()}
          className="text-sm px-3 py-1.5 rounded-md bg-terracotta hover:bg-terracotta-hover text-white inline-flex items-center gap-1 disabled:opacity-50"
          data-testid="event-save-btn"
        >
          <Check className="h-3.5 w-3.5" /> Save
        </button>
      </div>
    </div>
  );
}
