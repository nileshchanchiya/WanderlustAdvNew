import React, { useState, useMemo } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const CATEGORIES = [
  { k: "transport", label: "Transport" },
  { k: "stay", label: "Stay" },
  { k: "food", label: "Food" },
  { k: "activity", label: "Activity" },
  { k: "shopping", label: "Shopping" },
  { k: "other", label: "Other" },
];

const COLORS = ["#DE6242", "#A85A32", "#C4A484", "#6B8E6B", "#4A6FA5", "#737373"];

function newId() {
  return "x_" + Math.random().toString(36).slice(2, 10);
}

export default function BudgetTab({ itinerary, onUpdate }) {
  const [expenses, setExpenses] = useState(itinerary.expenses || []);
  const [draft, setDraft] = useState({
    description: "",
    amount: "",
    category: "transport",
    date: "",
  });

  const currency = itinerary.currency || "USD";
  const total = useMemo(() => expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0), [expenses]);
  const limit = Number(itinerary.budget_limit) || 0;
  const remaining = limit > 0 ? limit - total : null;

  const byCat = useMemo(() => {
    const map = {};
    for (const e of expenses) {
      map[e.category] = (map[e.category] || 0) + (Number(e.amount) || 0);
    }
    return CATEGORIES.map((c, i) => ({
      name: c.label,
      key: c.k,
      value: map[c.k] || 0,
      color: COLORS[i % COLORS.length],
    })).filter((x) => x.value > 0);
  }, [expenses]);

  const add = async (e) => {
    e.preventDefault();
    if (!draft.description.trim() || !draft.amount) return;
    const next = [
      ...expenses,
      {
        id: newId(),
        description: draft.description.trim(),
        amount: Number(draft.amount),
        category: draft.category,
        currency,
        date: draft.date || null,
      },
    ];
    setExpenses(next);
    setDraft({ description: "", amount: "", category: draft.category, date: "" });
    await onUpdate({ expenses: next });
  };

  const remove = async (id) => {
    const next = expenses.filter((e) => e.id !== id);
    setExpenses(next);
    await onUpdate({ expenses: next });
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5 space-y-5">
        <div className="bg-white border border-ink-200 rounded-xl p-6">
          <div className="label-caps">Total spent</div>
          <div className="font-mono text-4xl font-semibold mt-2">
            {currency} {total.toFixed(2)}
          </div>
          {limit > 0 && (
            <div className="mt-4">
              <div className="h-1.5 w-full bg-ink-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    total > limit ? "bg-red-500" : "bg-terracotta"
                  }`}
                  style={{ width: `${Math.min(100, (total / limit) * 100)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs font-mono text-ink-500">
                <span>
                  Budget: {currency} {limit.toFixed(2)}
                </span>
                <span className={remaining < 0 ? "text-red-600" : ""}>
                  {remaining >= 0 ? "Remaining" : "Over"}: {currency} {Math.abs(remaining).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-ink-200 rounded-xl p-6">
          <div className="label-caps mb-4">By category</div>
          {byCat.length === 0 ? (
            <div className="py-6 text-sm text-ink-500 text-center">
              Add expenses to see the breakdown.
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCat}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    strokeWidth={1}
                    stroke="#ffffff"
                  >
                    {byCat.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => `${currency} ${Number(v).toFixed(2)}`}
                    contentStyle={{ borderRadius: 8, border: "1px solid #E5E5E5", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <ul className="mt-4 space-y-1.5">
            {byCat.map((c) => (
              <li key={c.key} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: c.color }} />
                  {c.name}
                </span>
                <span className="font-mono text-ink-700">
                  {currency} {c.value.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lg:col-span-7">
        <div className="bg-white border border-ink-200 rounded-xl">
          <form onSubmit={add} className="p-5 border-b border-ink-200 grid grid-cols-12 gap-2" data-testid="add-expense-form">
            <input
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Expense description"
              className="col-span-12 sm:col-span-5 bg-white border border-ink-200 rounded-md px-3 py-2 text-sm"
              data-testid="expense-description-input"
              required
            />
            <input
              type="number"
              step="0.01"
              min="0"
              value={draft.amount}
              onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
              placeholder="Amount"
              className="col-span-5 sm:col-span-2 bg-white border border-ink-200 rounded-md px-3 py-2 font-mono text-sm"
              data-testid="expense-amount-input"
              required
            />
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              className="col-span-7 sm:col-span-3 bg-white border border-ink-200 rounded-md px-3 py-2 text-sm"
              data-testid="expense-category-input"
            >
              {CATEGORIES.map((c) => (
                <option key={c.k} value={c.k}>
                  {c.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="col-span-12 sm:col-span-2 inline-flex items-center justify-center gap-1 rounded-md bg-terracotta hover:bg-terracotta-hover text-white px-3 py-2 text-sm font-medium"
              data-testid="add-expense-button"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </form>

          {expenses.length === 0 ? (
            <div className="p-10 text-center text-ink-500">
              <Wallet className="h-6 w-6 mx-auto text-terracotta mb-3" strokeWidth={1.5} />
              No expenses yet. Add your first entry above.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left label-caps py-3 px-5 border-b border-ink-200">Description</th>
                  <th className="text-left label-caps py-3 px-5 border-b border-ink-200 hidden sm:table-cell">Category</th>
                  <th className="text-right label-caps py-3 px-5 border-b border-ink-200">Amount</th>
                  <th className="py-3 px-5 border-b border-ink-200 w-10" />
                </tr>
              </thead>
              <tbody data-testid="expenses-table">
                {expenses.map((e) => (
                  <tr key={e.id} className="group border-b border-ink-100 last:border-0 hover:bg-ink-50 transition-colors">
                    <td className="py-3 px-5 text-sm text-ink-900">{e.description}</td>
                    <td className="py-3 px-5 text-sm capitalize text-ink-600 hidden sm:table-cell">{e.category}</td>
                    <td className="py-3 px-5 text-sm font-mono text-right">
                      {e.currency || currency} {Number(e.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-5">
                      <button
                        onClick={() => remove(e.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-ink-500 hover:text-red-600 hover:bg-ink-100"
                        data-testid={`delete-expense-${e.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
