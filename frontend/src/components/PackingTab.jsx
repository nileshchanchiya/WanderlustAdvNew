import React, { useState, useMemo } from "react";
import { Plus, Trash2, CheckCircle2, Circle, PackageCheck } from "lucide-react";

const DEFAULT_CATEGORIES = [
  "Essentials",
  "Clothing",
  "Documents",
  "Electronics",
  "Toiletries",
  "Other",
];

function newId() {
  return "p_" + Math.random().toString(36).slice(2, 10);
}

export default function PackingTab({ itinerary, onUpdate }) {
  const [items, setItems] = useState(itinerary.packing || []);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("Essentials");

  const grouped = useMemo(() => {
    const g = {};
    for (const it of items) {
      const k = it.category || "Other";
      if (!g[k]) g[k] = [];
      g[k].push(it);
    }
    return g;
  }, [items]);

  const total = items.length;
  const packed = items.filter((i) => i.packed).length;
  const pct = total ? Math.round((packed / total) * 100) : 0;

  const add = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const next = [...items, { id: newId(), text: text.trim(), category, packed: false }];
    setItems(next);
    setText("");
    await onUpdate({ packing: next });
  };

  const toggle = async (id) => {
    const next = items.map((i) => (i.id === id ? { ...i, packed: !i.packed } : i));
    setItems(next);
    await onUpdate({ packing: next });
  };

  const remove = async (id) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    await onUpdate({ packing: next });
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8">
      <aside className="lg:col-span-4 space-y-5">
        <div className="bg-white border border-ink-200 rounded-xl p-6">
          <div className="label-caps">Progress</div>
          <div className="flex items-baseline gap-2 mt-2">
            <div className="font-mono text-4xl font-semibold">{pct}%</div>
            <div className="text-sm text-ink-500">
              {packed}/{total} packed
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full bg-ink-100 rounded-full overflow-hidden">
            <div className="h-full bg-terracotta rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <form onSubmit={add} className="bg-white border border-ink-200 rounded-xl p-5 space-y-3" data-testid="add-packing-form">
          <div className="label-caps">Add item</div>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Passport"
            className="w-full bg-white border border-ink-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta outline-none"
            data-testid="packing-text-input"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-white border border-ink-200 rounded-md px-3 py-2 text-sm"
            data-testid="packing-category-input"
          >
            {DEFAULT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1 rounded-md bg-terracotta hover:bg-terracotta-hover text-white px-3 py-2 text-sm font-medium"
            data-testid="add-packing-item-button"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </form>
      </aside>

      <section className="lg:col-span-8">
        {items.length === 0 ? (
          <div className="bg-white border border-dashed border-ink-200 rounded-xl py-16 text-center">
            <PackageCheck className="h-6 w-6 mx-auto text-terracotta mb-3" strokeWidth={1.5} />
            <p className="font-display text-xl font-semibold">Nothing to pack yet.</p>
            <p className="text-ink-500 mt-1">Start with essentials — passport, chargers, toothbrush.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(grouped).map((cat) => (
              <div key={cat} className="bg-white border border-ink-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-ink-200 label-caps flex items-center justify-between">
                  <span>{cat}</span>
                  <span className="font-mono normal-case tracking-normal text-ink-500">
                    {grouped[cat].filter((i) => i.packed).length}/{grouped[cat].length}
                  </span>
                </div>
                <ul>
                  {grouped[cat].map((it) => (
                    <li
                      key={it.id}
                      className="group flex items-center gap-3 px-5 py-3 border-b border-ink-100 last:border-0 hover:bg-ink-50 transition-colors"
                    >
                      <button
                        onClick={() => toggle(it.id)}
                        className="text-terracotta"
                        data-testid={`packing-item-checkbox-${it.id}`}
                        aria-label={it.packed ? "mark unpacked" : "mark packed"}
                      >
                        {it.packed ? (
                          <CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />
                        ) : (
                          <Circle className="h-5 w-5 text-ink-300" strokeWidth={1.5} />
                        )}
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          it.packed ? "line-through text-ink-400" : "text-ink-900"
                        }`}
                      >
                        {it.text}
                      </span>
                      <button
                        onClick={() => remove(it.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-ink-500 hover:text-red-600"
                        data-testid={`delete-packing-${it.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
