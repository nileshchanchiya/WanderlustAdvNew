import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import api, { formatApiError } from "@/lib/api";
import {
  Users, BarChart3, MapPin, MessageSquare, Loader2, Trash2,
  ShieldCheck, ShieldOff, ChevronDown, ChevronUp, Mail, Phone,
  Building2, Calendar, ClipboardList, Eye, X, CheckCircle2,
  Clock, Archive, AlertCircle, Rss, Plus, FileText, Edit2
} from "lucide-react";
import { toast } from "sonner";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const STATUS_STYLES = {
  new: { bg: "bg-blue-50 text-blue-700 border-blue-200", icon: AlertCircle, label: "New" },
  contacted: { bg: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock, label: "Contacted" },
  resolved: { bg: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2, label: "Resolved" },
  archived: { bg: "bg-gray-50 text-gray-500 border-gray-200", icon: Archive, label: "Archived" },
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-ink-0 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="label-caps text-gold">Admin Dashboard</div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mt-2 text-ocean">
            Manage Everything
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-fog/60 mb-8 overflow-x-auto">
          {[
            { key: "overview", label: "Overview", icon: BarChart3 },
            { key: "users", label: "Users", icon: Users },
            { key: "inquiries", label: "Inquiries", icon: MessageSquare },
            { key: "feed", label: "Feed", icon: Rss },
            { key: "blogs", label: "Blogs", icon: FileText },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-label font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t.key
                  ? "border-ocean text-ocean"
                  : "border-transparent text-driftwood hover:text-charcoal hover:border-fog"
              }`}
            >
              <t.icon className="h-4 w-4" strokeWidth={1.5} />
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "inquiries" && <InquiriesTab />}
        {activeTab === "feed" && <FeedTab />}
        {activeTab === "blogs" && <BlogsTab />}
      </main>
      <Footer />
    </div>
  );
}

/* ─── Overview Tab ─── */
function OverviewTab() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/admin/stats").then(({ data }) => setStats(data)).catch(() => setStats({}));
  }, []);

  if (!stats) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-driftwood" />
      </div>
    );
  }

  const cards = [
    { label: "Total Users", value: stats.total_users || 0, icon: Users, color: "text-ocean" },
    { label: "Total Itineraries", value: stats.total_itineraries || 0, icon: ClipboardList, color: "text-terracotta" },
    { label: "Destinations", value: stats.total_destinations || 0, icon: MapPin, color: "text-gold" },
    { label: "Total Inquiries", value: stats.total_inquiries || 0, icon: MessageSquare, color: "text-emerald-600" },
    { label: "New Inquiries", value: stats.new_inquiries || 0, icon: AlertCircle, color: "text-blue-600" },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-white border border-fog/60 rounded-2xl p-6 shadow-lift hover:shadow-float transition-all"
        >
          <c.icon className={`h-6 w-6 ${c.color}`} strokeWidth={1.5} />
          <div className="font-mono text-4xl font-bold text-charcoal mt-4">{c.value}</div>
          <div className="label-caps text-[10px] mt-2">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Users Tab ─── */
function UsersTab() {
  const [users, setUsers] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data);
    } catch (e) {
      toast.error(formatApiError(e));
      setUsers([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = async (userId) => {
    if (expandedId === userId) {
      setExpandedId(null);
      setExpandedUser(null);
      return;
    }
    setExpandedId(userId);
    setLoadingDetail(true);
    try {
      const { data } = await api.get(`/admin/users/${userId}`);
      setExpandedUser(data);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoadingDetail(false);
    }
  };

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(`Change this user's role to "${newRole}"?`)) return;
    try {
      const { data } = await api.put(`/admin/users/${userId}`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...data } : u)));
      toast.success(`Role changed to ${newRole}`);
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const toggleDisable = async (userId, disabled) => {
    const action = disabled ? "enable" : "disable";
    if (!window.confirm(`${disabled ? "Enable" : "Disable"} this user?`)) return;
    try {
      const { data } = await api.put(`/admin/users/${userId}`, { disabled: !disabled });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...data } : u)));
      toast.success(`User ${action}d`);
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user and all their itineraries? This cannot be undone.")) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      if (expandedId === userId) {
        setExpandedId(null);
        setExpandedUser(null);
      }
      toast.success("User deleted");
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  if (!users) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-driftwood" />
      </div>
    );
  }

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h3 className="font-serif text-2xl font-bold text-ocean">
          All Users <span className="text-driftwood font-mono text-lg">({users.length})</span>
        </h3>
        <input
          type="search"
          placeholder="Search by name, email, city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 px-4 py-2.5 border border-fog rounded-lg text-sm focus:ring-2 focus:ring-ocean/20 focus:border-ocean outline-none transition-all"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((u) => (
          <div key={u.id} className="bg-white border border-fog/60 rounded-xl shadow-lift overflow-hidden">
            {/* Row */}
            <div className="flex items-center gap-4 p-5 cursor-pointer hover:bg-sand/30 transition-colors" onClick={() => toggleExpand(u.id)}>
              {/* Avatar */}
              {u.profile_image ? (
                <img src={u.profile_image} alt={u.name} className="h-10 w-10 rounded-full object-cover border-2 border-gold-soft shrink-0" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-ocean-gradient grid place-items-center text-white font-bold text-sm shrink-0">
                  {(u.name || "U").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-ocean truncate">{u.name || "—"}</span>
                  {u.role === "admin" && (
                    <span className="bg-gold-soft text-ocean px-2 py-0.5 rounded-full text-[10px] font-label font-semibold uppercase tracking-wider">Admin</span>
                  )}
                  {u.disabled && (
                    <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-label font-semibold uppercase tracking-wider">Disabled</span>
                  )}
                </div>
                <div className="text-sm text-driftwood truncate">{u.email}</div>
              </div>

              <div className="hidden md:flex items-center gap-6 text-xs text-driftwood shrink-0">
                {u.city && (
                  <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />{u.city}</span>
                )}
                <span className="flex items-center gap-1"><ClipboardList className="h-3.5 w-3.5" strokeWidth={1.5} />{u.itinerary_count} trips</span>
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</span>
              </div>

              {expandedId === u.id ? (
                <ChevronUp className="h-4 w-4 text-driftwood shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-driftwood shrink-0" />
              )}
            </div>

            {/* Expanded Detail */}
            {expandedId === u.id && (
              <div className="border-t border-fog/60 p-5 bg-sand/20">
                {loadingDetail ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-driftwood" />
                  </div>
                ) : expandedUser ? (
                  <div className="space-y-6">
                    {/* Info Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-ocean" strokeWidth={1.5} /><span className="text-charcoal">{expandedUser.email}</span></div>
                      <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-ocean" strokeWidth={1.5} /><span className="text-charcoal">{expandedUser.phone || "—"}</span></div>
                      <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-ocean" strokeWidth={1.5} /><span className="text-charcoal">{expandedUser.city || "—"}</span></div>
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-ocean" strokeWidth={1.5} /><span className="text-charcoal">{expandedUser.created_at ? new Date(expandedUser.created_at).toLocaleDateString() : "—"}</span></div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleRole(u.id, u.role)}
                        className="inline-flex items-center gap-1.5 text-xs font-label font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-fog hover:bg-ocean hover:text-white hover:border-ocean transition-colors"
                      >
                        {u.role === "admin" ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        {u.role === "admin" ? "Remove Admin" : "Make Admin"}
                      </button>
                      <button
                        onClick={() => toggleDisable(u.id, u.disabled)}
                        className={`inline-flex items-center gap-1.5 text-xs font-label font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-colors ${
                          u.disabled
                            ? "border-green-300 text-green-700 hover:bg-green-600 hover:text-white hover:border-green-600"
                            : "border-yellow-300 text-yellow-700 hover:bg-yellow-600 hover:text-white hover:border-yellow-600"
                        }`}
                      >
                        {u.disabled ? "Enable User" : "Disable User"}
                      </button>
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-label font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete User
                      </button>
                    </div>

                    {/* Itineraries */}
                    {expandedUser.itineraries && expandedUser.itineraries.length > 0 && (
                      <div>
                        <h4 className="label-caps text-[11px] mb-3">User's Itineraries ({expandedUser.itineraries.length})</h4>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {expandedUser.itineraries.map((it) => (
                            <div key={it.id} className="bg-white border border-fog/60 rounded-lg p-4 text-sm">
                              <div className="font-serif font-bold text-ocean">{it.cover_emoji ? `${it.cover_emoji} ` : ""}{it.title}</div>
                              {it.destination && (
                                <div className="flex items-center gap-1 text-driftwood text-xs mt-1">
                                  <MapPin className="h-3 w-3" strokeWidth={1.5} />
                                  {it.destination}
                                </div>
                              )}
                              <div className="text-xs text-driftwood mt-1">{it.type} · {(it.events || []).length} events</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-driftwood">
            No users match your search.
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Inquiries Tab ─── */
function InquiriesTab() {
  const [items, setItems] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/inquiries");
      setItems(data);
    } catch (e) {
      toast.error(formatApiError(e));
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.put(`/admin/inquiries/${id}`, { status });
      setItems((prev) => prev.map((i) => (i.id === id ? data : i)));
      toast.success(`Status changed to ${status}`);
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  if (!items) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-driftwood" />
      </div>
    );
  }

  return (
    <>
      <h3 className="font-serif text-2xl font-bold text-ocean mb-6">
        Contact Inquiries <span className="text-driftwood font-mono text-lg">({items.length})</span>
      </h3>

      {items.length === 0 ? (
        <div className="text-center py-16 text-driftwood">No inquiries yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((inq) => {
            const st = STATUS_STYLES[inq.status] || STATUS_STYLES.new;
            return (
              <div key={inq.id} className="bg-white border border-fog/60 rounded-xl p-5 shadow-lift">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-serif font-bold text-ocean text-lg">{inq.name}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-label font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${st.bg}`}>
                        <st.icon className="h-3 w-3" strokeWidth={2} />
                        {st.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-driftwood mt-2">
                      <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" strokeWidth={1.5} />{inq.email}</span>
                      {inq.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" strokeWidth={1.5} />{inq.phone}</span>}
                      {inq.destination && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />{inq.destination}</span>}
                    </div>
                    {inq.message && (
                      <p className="mt-3 text-sm text-charcoal bg-sand/40 rounded-lg p-3 leading-relaxed">{inq.message}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-driftwood">
                      {inq.travel_dates && <span>Dates: {inq.travel_dates}</span>}
                      {inq.budget && <span>Budget: {inq.budget}</span>}
                      <span>Received: {inq.created_at ? new Date(inq.created_at).toLocaleDateString() : "—"}</span>
                    </div>
                  </div>

                  {/* Status actions */}
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    {["new", "contacted", "resolved", "archived"].map((s) => {
                      if (s === inq.status) return null;
                      const sty = STATUS_STYLES[s];
                      return (
                        <button
                          key={s}
                          onClick={() => updateStatus(inq.id, s)}
                          className={`text-[10px] font-label font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg border transition-colors hover:opacity-80 ${sty.bg}`}
                        >
                          {sty.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ─── Feed Tab ─── */
function FeedTab() {
  const [posts, setPosts] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ platform: "instagram", content: "", image_url: "", link_url: "" });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/feed");
      setPosts(data);
    } catch (e) {
      toast.error(formatApiError(e));
      setPosts([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/admin/feed", formData);
      setPosts((prev) => [data, ...prev]);
      setIsCreating(false);
      setFormData({ platform: "instagram", content: "", image_url: "", link_url: "" });
      toast.success("Post created successfully");
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const deletePost = async (id) => {
    if (!window.confirm("Delete this feed post?")) return;
    try {
      await api.delete(`/admin/feed/${id}`);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Post deleted");
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  if (!posts) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-driftwood" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h3 className="font-serif text-2xl font-bold text-ocean">
          Social Feed <span className="text-driftwood font-mono text-lg">({posts.length})</span>
        </h3>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-ocean text-white text-sm font-label font-semibold uppercase tracking-wider rounded-lg hover:bg-ocean/90 transition-colors"
        >
          {isCreating ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isCreating ? "Cancel" : "Add Post"}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="bg-white border border-fog/60 rounded-xl p-6 shadow-lift mb-6">
          <h4 className="font-serif font-bold text-lg text-ocean mb-4">Create New Post</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-label font-semibold uppercase tracking-wider text-charcoal mb-1">Platform</label>
              <select
                required
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-4 py-2 border border-fog rounded-lg text-sm focus:ring-2 focus:ring-ocean/20 focus:border-ocean outline-none"
              >
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-label font-semibold uppercase tracking-wider text-charcoal mb-1">Link URL (Optional)</label>
              <input
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                placeholder="https://instagram.com/p/..."
                className="w-full px-4 py-2 border border-fog rounded-lg text-sm focus:ring-2 focus:ring-ocean/20 focus:border-ocean outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-label font-semibold uppercase tracking-wider text-charcoal mb-1">Content</label>
              <textarea
                required
                rows={3}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your update here..."
                className="w-full px-4 py-2 border border-fog rounded-lg text-sm focus:ring-2 focus:ring-ocean/20 focus:border-ocean outline-none resize-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-label font-semibold uppercase tracking-wider text-charcoal mb-1">Image URL (Optional)</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 border border-fog rounded-lg text-sm focus:ring-2 focus:ring-ocean/20 focus:border-ocean outline-none"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gold hover:bg-gold-soft text-ocean text-sm font-label font-semibold uppercase tracking-wider rounded-lg transition-colors"
            >
              Publish Post
            </button>
          </div>
        </form>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-16 text-driftwood">No posts in feed yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post) => (
            <div key={post.id} className="bg-white border border-fog/60 rounded-xl overflow-hidden shadow-lift flex flex-col">
              {post.image_url && (
                <div className="aspect-video w-full bg-sand/30">
                  <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-label font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border border-fog bg-sand/20">
                    {post.platform}
                  </span>
                  <span className="text-xs text-driftwood">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-charcoal mb-4 flex-1 whitespace-pre-wrap line-clamp-4">{post.content}</p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-fog/60">
                  {post.link_url ? (
                    <a href={post.link_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-ocean hover:text-gold transition-colors">
                      View Original
                    </a>
                  ) : <div />}
                  <button
                    onClick={() => deletePost(post.id)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors"
                    title="Delete post"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ─── Blogs Tab ─── */
function BlogsTab() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBlog, setCurrentBlog] = useState({
    title: "", slug: "", content: "", excerpt: "", cover_image_url: "", tags: "", published: false
  });
  
  const quillRef = useRef(null);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      try {
        const { data } = await api.post('/admin/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', data.url);
      } catch (e) {
        toast.error('Image upload failed');
      }
    };
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{'list': 'ordered'}, {'list': 'bullet'}],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), [imageHandler]);

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCurrentBlog(prev => ({ ...prev, cover_image_url: data.url }));
      toast.success('Cover image uploaded');
    } catch (err) {
      toast.error('Failed to upload cover image');
    }
  };

  const loadBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/blogs");
      setBlogs(data);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBlogs(); }, [loadBlogs]);

  const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...currentBlog,
      tags: typeof currentBlog.tags === 'string' 
        ? currentBlog.tags.split(",").map(t => t.trim()).filter(Boolean) 
        : (currentBlog.tags || []),
    };
    if (!payload.slug) {
      payload.slug = generateSlug(payload.title);
    }
    try {
      if (currentBlog.id) {
        await api.put(`/admin/blogs/${currentBlog.id}`, payload);
        toast.success("Blog updated");
      } else {
        await api.post("/admin/blogs", payload);
        toast.success("Blog created");
      }
      setIsEditing(false);
      loadBlogs();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog post?")) return;
    try {
      await api.delete(`/admin/blogs/${id}`);
      toast.success("Blog deleted");
      loadBlogs();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white border border-fog/60 rounded-xl p-6 shadow-lift">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-display font-bold text-ocean">
            {currentBlog.id ? "Edit Blog Post" : "New Blog Post"}
          </h2>
          <button onClick={() => setIsEditing(false)} className="text-driftwood hover:text-charcoal p-2">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-label font-semibold uppercase tracking-wider text-charcoal mb-2">Title</label>
              <input required type="text" className="w-full bg-sand/30 border border-fog rounded-lg px-4 py-2.5 focus:outline-none focus:border-ocean transition-colors" value={currentBlog.title} onChange={e => setCurrentBlog({ ...currentBlog, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-label font-semibold uppercase tracking-wider text-charcoal mb-2">Slug (SEO URL)</label>
              <input type="text" className="w-full bg-sand/30 border border-fog rounded-lg px-4 py-2.5 focus:outline-none focus:border-ocean transition-colors" value={currentBlog.slug} onChange={e => setCurrentBlog({ ...currentBlog, slug: e.target.value })} placeholder="Leave blank to auto-generate" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-label font-semibold uppercase tracking-wider text-charcoal mb-2">Cover Image</label>
              <div className="flex gap-2">
                <input type="url" className="w-full bg-sand/30 border border-fog rounded-lg px-4 py-2.5 focus:outline-none focus:border-ocean transition-colors" value={currentBlog.cover_image_url || ""} onChange={e => setCurrentBlog({ ...currentBlog, cover_image_url: e.target.value })} placeholder="Image URL or upload" />
                <label className="flex-shrink-0 cursor-pointer px-4 py-2.5 bg-ocean text-white font-label text-sm uppercase tracking-wider rounded-lg hover:bg-ocean/90 transition-colors flex items-center">
                  Upload
                  <input type="file" className="hidden" accept="image/*" onChange={handleCoverImageUpload} />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-label font-semibold uppercase tracking-wider text-charcoal mb-2">Tags (Comma separated)</label>
              <input type="text" className="w-full bg-sand/30 border border-fog rounded-lg px-4 py-2.5 focus:outline-none focus:border-ocean transition-colors" value={Array.isArray(currentBlog.tags) ? currentBlog.tags.join(', ') : currentBlog.tags} onChange={e => setCurrentBlog({ ...currentBlog, tags: e.target.value })} placeholder="travel, tips, guide" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-label font-semibold uppercase tracking-wider text-charcoal mb-2">Excerpt (SEO Meta Description)</label>
            <textarea rows={2} className="w-full bg-sand/30 border border-fog rounded-lg px-4 py-2.5 focus:outline-none focus:border-ocean transition-colors" value={currentBlog.excerpt || ""} onChange={e => setCurrentBlog({ ...currentBlog, excerpt: e.target.value })} maxLength={160}></textarea>
          </div>

          <div className="bg-white">
            <label className="block text-sm font-label font-semibold uppercase tracking-wider text-charcoal mb-2">Content (WYSIWYG)</label>
            <ReactQuill ref={quillRef} modules={modules} theme="snow" value={currentBlog.content} onChange={(val) => setCurrentBlog({ ...currentBlog, content: val })} className="h-64 mb-12" />
          </div>

          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-fog/60">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={currentBlog.published} onChange={e => setCurrentBlog({ ...currentBlog, published: e.target.checked })} className="w-5 h-5 text-ocean rounded focus:ring-ocean" />
              <span className="text-sm font-semibold text-charcoal">Publish Immediately</span>
            </label>
            <div className="ml-auto flex gap-3">
              <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2.5 border border-fog text-charcoal text-sm font-label font-semibold uppercase tracking-wider rounded-lg hover:bg-sand/30 transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-2.5 bg-ocean text-white text-sm font-label font-semibold uppercase tracking-wider rounded-lg hover:bg-ocean/90 transition-colors">Save Blog</button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-5 w-5 animate-spin text-driftwood" /></div>;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-display font-bold text-ocean">Blog Posts</h2>
        <button
          onClick={() => {
            setCurrentBlog({ title: "", slug: "", content: "", excerpt: "", cover_image_url: "", tags: "", published: false });
            setIsEditing(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-gold-soft text-ocean text-sm font-label font-semibold uppercase tracking-wider rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" /> Create Post
        </button>
      </div>

      <div className="bg-white border border-fog/60 rounded-xl overflow-hidden shadow-lift">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-fog/60 bg-sand/30">
                <th className="px-6 py-4 text-xs font-label font-semibold uppercase tracking-wider text-charcoal">Title</th>
                <th className="px-6 py-4 text-xs font-label font-semibold uppercase tracking-wider text-charcoal">Status</th>
                <th className="px-6 py-4 text-xs font-label font-semibold uppercase tracking-wider text-charcoal">Date</th>
                <th className="px-6 py-4 text-right text-xs font-label font-semibold uppercase tracking-wider text-charcoal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fog/60">
              {blogs.map((b) => (
                <tr key={b.id} className="hover:bg-sand/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-charcoal">{b.title}</div>
                    <div className="text-xs text-driftwood mt-1">/{b.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    {b.published ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-label uppercase tracking-wider font-bold bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle2 className="h-3 w-3" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-label uppercase tracking-wider font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
                        <Clock className="h-3 w-3" /> Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-driftwood">
                    {new Date(b.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => {
                        setCurrentBlog({ ...b, tags: b.tags ? b.tags.join(", ") : "" });
                        setIsEditing(true);
                      }} className="text-ocean hover:text-ocean/70 p-2 rounded-md hover:bg-ocean/5 transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(b.id)} className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {blogs.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-driftwood">
                    No blog posts found. Create your first post!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
