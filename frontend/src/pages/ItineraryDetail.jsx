import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import OverviewTab from "@/components/OverviewTab";
import TimelineTab from "@/components/TimelineTab";
import MapTab from "@/components/MapTab";
import BudgetTab from "@/components/BudgetTab";
import PackingTab from "@/components/PackingTab";
import CreateItineraryModal from "@/components/CreateItineraryModal";
import api, { formatApiError } from "@/lib/api";
import { ArrowLeft, Loader2, Pencil, FileDown, Calendar, MapPin, Wallet, Package, ListChecks } from "lucide-react";
import { toast } from "sonner";

const TABS = [
  { k: "overview", label: "Overview", icon: Calendar },
  { k: "timeline", label: "Timeline", icon: ListChecks },
  { k: "map", label: "Map", icon: MapPin },
  { k: "budget", label: "Budget", icon: Wallet },
  { k: "packing", label: "Packing", icon: Package },
];

export default function ItineraryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/itineraries/${id}`);
        setItinerary(data);
      } catch (e) {
        setErr(formatApiError(e));
      }
    };
    load();
  }, [id]);

  const onUpdate = useCallback(async (patch) => {
    try {
      const { data } = await api.put(`/itineraries/${id}`, patch);
      setItinerary(data);
      return data;
    } catch (e) {
      toast.error(formatApiError(e));
      throw e;
    }
  }, [id]);

  const onMetaSaved = (updated) => {
    setItinerary(updated);
    setEditOpen(false);
    toast.success("Saved");
  };

  const onExportPdf = async () => {
    if (!itinerary) return;
    setExporting(true);
    try {
      const [{ default: jsPDF }, html2canvasMod] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      const html2canvas = html2canvasMod.default || html2canvasMod;

      const node = buildPdfNode(itinerary);
      document.body.appendChild(node);

      const canvas = await html2canvas(node, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
      document.body.removeChild(node);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = canvas.height / canvas.width;
      const imgWidth = pageWidth - 20;
      const imgHeight = imgWidth * ratio;

      let heightLeft = imgHeight;
      let position = 10;
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
      while (heightLeft > 0) {
        pdf.addPage();
        position = 10 - (imgHeight - heightLeft);
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }
      pdf.save(`${(itinerary.title || "itinerary").replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF exported");
    } catch (e) {
      toast.error("Export failed: " + (e?.message || "unknown"));
    } finally {
      setExporting(false);
    }
  };

  if (err) {
    return (
      <div className="min-h-screen bg-ink-0">
        <Navbar />
        <div className="max-w-3xl mx-auto py-24 px-4 text-center">
          <div className="label-caps">404</div>
          <h1 className="font-display text-3xl font-bold mt-2">Itinerary not found</h1>
          <p className="text-ink-500 mt-2">{err}</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 mt-6 text-terracotta hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-ink-0">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-ink-400" strokeWidth={1.5} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-0" ref={exportRef}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 text-sm text-ink-500 mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 hover:text-ink-900 transition-colors"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Dashboard
          </button>
          <span className="text-ink-300">/</span>
          <span className="text-ink-700 truncate">{itinerary.title}</span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="label-caps capitalize">{itinerary.type}</div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mt-2">
              {itinerary.cover_emoji && <span className="mr-2">{itinerary.cover_emoji}</span>}
              {itinerary.title}
            </h1>
            {itinerary.destination && (
              <div className="flex items-center gap-1.5 mt-2 text-ink-500">
                <MapPin className="h-4 w-4" strokeWidth={1.5} /> {itinerary.destination}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-4 py-2 text-sm hover:bg-ink-50"
              data-testid="edit-itinerary-button"
            >
              <Pencil className="h-4 w-4" strokeWidth={1.5} />
              Edit details
            </button>
            <button
              onClick={onExportPdf}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-lg bg-terracotta hover:bg-terracotta-hover text-white px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60"
              data-testid="export-pdf-button"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Export PDF
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-ink-200 mb-8 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {TABS.map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === t.k
                    ? "border-terracotta text-ink-900"
                    : "border-transparent text-ink-500 hover:text-ink-900"
                }`}
                data-testid={`tab-${t.k}`}
              >
                <t.icon className="h-4 w-4" strokeWidth={1.5} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="animate-fade-up">
          {tab === "overview" && <OverviewTab itinerary={itinerary} />}
          {tab === "timeline" && <TimelineTab itinerary={itinerary} onUpdate={onUpdate} />}
          {tab === "map" && <MapTab itinerary={itinerary} />}
          {tab === "budget" && <BudgetTab itinerary={itinerary} onUpdate={onUpdate} />}
          {tab === "packing" && <PackingTab itinerary={itinerary} onUpdate={onUpdate} />}
        </div>
      </main>

      {editOpen && (
        <CreateItineraryModal
          onClose={() => setEditOpen(false)}
          onCreated={onMetaSaved}
          initial={itinerary}
        />
      )}
    </div>
  );
}

/* ---------- PDF export helper ---------- */
function buildPdfNode(it) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "780px";
  container.style.padding = "40px";
  container.style.background = "#ffffff";
  container.style.color = "#171717";
  container.style.fontFamily = "Satoshi, system-ui, sans-serif";

  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

  const events = (it.events || []).slice().sort((a, b) => (a.day_index - b.day_index) || (a.time || "").localeCompare(b.time || ""));
  const totalSpent = (it.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const eventsByDay = {};
  for (const ev of events) {
    const k = ev.day_index || 0;
    (eventsByDay[k] = eventsByDay[k] || []).push(ev);
  }

  container.innerHTML = `
    <div style="border-bottom:1px solid #E5E5E5; padding-bottom:20px; margin-bottom:24px;">
      <div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#737373;font-weight:600;">${it.type} · Itinerary</div>
      <h1 style="font-size:36px;margin:8px 0 4px;font-weight:700;">${(it.cover_emoji || "")} ${escapeHtml(it.title || "")}</h1>
      <div style="color:#525252;font-size:14px;">${escapeHtml(it.destination || "")}</div>
      <div style="color:#737373;font-size:12px;font-family:'JetBrains Mono',monospace;margin-top:4px;">${fmt(it.start_date)}  →  ${fmt(it.end_date)}</div>
      ${it.description ? `<p style="color:#525252;margin-top:14px;font-size:13px;line-height:1.5;">${escapeHtml(it.description)}</p>` : ""}
    </div>

    <h2 style="font-size:18px;margin:0 0 12px;">Timeline</h2>
    ${
      Object.keys(eventsByDay).length === 0
        ? `<div style="color:#737373;font-size:13px;">No events added.</div>`
        : Object.keys(eventsByDay)
            .sort((a, b) => Number(a) - Number(b))
            .map(
              (d) => `
        <div style="margin-bottom:16px;">
          <div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#737373;font-weight:600;">Day ${Number(d) + 1}</div>
          <div style="margin-top:6px;border-left:2px solid #E5E5E5;padding-left:14px;">
            ${eventsByDay[d]
              .map(
                (ev) => `
              <div style="margin-bottom:10px;">
                <div style="font-size:11px;color:#737373;font-family:'JetBrains Mono',monospace;">${ev.time || "—"} · ${ev.category || ""}</div>
                <div style="font-weight:600;font-size:14px;">${escapeHtml(ev.title || "")}</div>
                ${ev.location ? `<div style="color:#737373;font-size:12px;">${escapeHtml(ev.location)}</div>` : ""}
                ${ev.notes ? `<div style="color:#525252;font-size:12px;margin-top:3px;white-space:pre-wrap;">${escapeHtml(ev.notes)}</div>` : ""}
              </div>`
              )
              .join("")}
          </div>
        </div>`
            )
            .join("")
    }

    <h2 style="font-size:18px;margin:24px 0 12px;">Budget</h2>
    <div style="font-family:'JetBrains Mono',monospace;font-size:14px;margin-bottom:8px;">Total: ${it.currency || "USD"} ${totalSpent.toFixed(2)}${it.budget_limit ? `  /  ${it.currency || "USD"} ${Number(it.budget_limit).toFixed(2)}` : ""}</div>
    ${
      (it.expenses || []).length === 0
        ? `<div style="color:#737373;font-size:13px;">No expenses.</div>`
        : `<table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead><tr>
              <th style="text-align:left;padding:6px 0;border-bottom:1px solid #E5E5E5;color:#737373;font-weight:600;">Description</th>
              <th style="text-align:left;padding:6px 0;border-bottom:1px solid #E5E5E5;color:#737373;font-weight:600;">Category</th>
              <th style="text-align:right;padding:6px 0;border-bottom:1px solid #E5E5E5;color:#737373;font-weight:600;">Amount</th>
            </tr></thead>
            <tbody>
              ${(it.expenses || [])
                .map(
                  (e) => `<tr>
                  <td style="padding:6px 0;border-bottom:1px solid #F5F5F4;">${escapeHtml(e.description || "")}</td>
                  <td style="padding:6px 0;border-bottom:1px solid #F5F5F4;text-transform:capitalize;">${escapeHtml(e.category || "")}</td>
                  <td style="padding:6px 0;border-bottom:1px solid #F5F5F4;text-align:right;font-family:'JetBrains Mono',monospace;">${e.currency || it.currency || ""} ${Number(e.amount).toFixed(2)}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>`
    }

    <h2 style="font-size:18px;margin:24px 0 12px;">Packing</h2>
    ${
      (it.packing || []).length === 0
        ? `<div style="color:#737373;font-size:13px;">No items.</div>`
        : `<ul style="list-style:none;padding:0;margin:0;font-size:13px;">
            ${(it.packing || [])
              .map(
                (p) =>
                  `<li style="padding:4px 0;border-bottom:1px dashed #E5E5E5;">
                    <span style="display:inline-block;width:14px;height:14px;border:1px solid #D4D4D4;background:${p.packed ? "#DE6242" : "#fff"};margin-right:8px;vertical-align:middle;border-radius:3px;"></span>
                    <span style="vertical-align:middle;${p.packed ? "text-decoration:line-through;color:#A3A3A3;" : ""}">${escapeHtml(p.text || "")}</span>
                    <span style="color:#737373;margin-left:6px;">· ${escapeHtml(p.category || "")}</span>
                  </li>`
              )
              .join("")}
          </ul>`
    }

    <div style="margin-top:40px;border-top:1px solid #E5E5E5;padding-top:12px;color:#737373;font-size:11px;display:flex;justify-content:space-between;">
      <span>Itinera · calm planning</span>
      <span style="font-family:'JetBrains Mono',monospace;">${new Date().toLocaleDateString()}</span>
    </div>
  `;
  return container;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
