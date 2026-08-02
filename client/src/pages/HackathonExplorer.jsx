import { useState, useEffect, useCallback, useRef } from "react";
import useHackathonWatchlist, { useWatchlistUrl } from "../hooks/useHackathonWatchlist";
import WatchlistPanel from "../components/WatchlistPanel";
import HackathonCompareView from "../components/HackathonCompareView";

// console.log("import.meta.env.VITE_API_URL :",import.meta.env.VITE_API_URL)

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = `${import.meta.env.VITE_API_URL}/api`;  // your port, not 3001

const PLATFORMS = [
  { id: "all", label: "All Platforms", color: "#a78bfa", bg: "#1e1b4b" },
  { id: "devpost", label: "Devpost", color: "#00b4d8", bg: "#003E54" },
  { id: "devfolio", label: "Devfolio", color: "#3770FF", bg: "#0f1b4c" },
  { id: "hackerearth", label: "HackerEarth", color: "#44c4a1", bg: "#1e2537" },
  { id: "unstop", label: "Unstop", color: "#F4C84A", bg: "#2d2400" },
];

const PLATFORM_META = {
  Devpost: { color: "#00b4d8", bg: "rgba(0,180,216,0.12)", icon: "🏆" },
  Devfolio: { color: "#3770FF", bg: "rgba(55,112,255,0.12)", icon: "🚀" },
  HackerEarth: { color: "#44c4a1", bg: "rgba(68,196,161,0.12)", icon: "💻" },
  Unstop: { color: "#F4C84A", bg: "rgba(244,200,74,0.12)", icon: "⚡" },
};

const MODES = ["All", "Online", "In-Person", "Hybrid"];
const STATUSES = ["All", "Open", "Upcoming"];

// ─── MOCK DATA (fallback when backend is unavailable) ─────────────────────────
const MOCK_HACKATHONS = [
  { id: "devpost-1", title: "Hack the Future 2025", platform: "Devpost", logo: null, url: "https://devpost.com/hackathons", deadline: new Date(Date.now() + 12 * 864e5).toISOString(), prize: "$50,000", participants: 3200, mode: "Online", tags: ["AI", "Web3", "HealthTech"], status: "Open", featured: true, organizer: "TechCorp" },
  { id: "devpost-2", title: "Climate Change Hackathon", platform: "Devpost", logo: null, url: "https://devpost.com/hackathons", deadline: new Date(Date.now() + 5 * 864e5).toISOString(), prize: "$25,000", participants: 1800, mode: "Online", tags: ["Climate", "Sustainability"], status: "Open", featured: false, organizer: "GreenTech" },
  { id: "devfolio-1", title: "InOut 11.0", platform: "Devfolio", logo: null, url: "https://inout.devfolio.co", deadline: new Date(Date.now() + 20 * 864e5).toISOString(), prize: "₹5,00,000", participants: 4500, mode: "In-Person", tags: ["Open Innovation", "Social Impact"], status: "Open", featured: true, organizer: "BITS Goa" },
  { id: "devfolio-2", title: "HackIIITD 2025", platform: "Devfolio", logo: null, url: "https://hackiiitd.devfolio.co", deadline: new Date(Date.now() + 8 * 864e5).toISOString(), prize: "₹2,00,000", participants: 1200, mode: "In-Person", tags: ["AI/ML", "Blockchain"], status: "Upcoming", featured: false, organizer: "IIIT Delhi" },
  { id: "hackerearth-1", title: "AI Innovation Challenge", platform: "HackerEarth", logo: null, url: "https://www.hackerearth.com/challenges/hackathon/", deadline: new Date(Date.now() + 15 * 864e5).toISOString(), prize: null, participants: 9800, mode: "Online", tags: ["AI", "Machine Learning"], status: "Open", featured: false, organizer: null },
  { id: "hackerearth-2", title: "FinTech Disrupt 2025", platform: "HackerEarth", logo: null, url: "https://www.hackerearth.com/challenges/hackathon/", deadline: new Date(Date.now() + 3 * 864e5).toISOString(), prize: "$10,000", participants: 2100, mode: "Online", tags: ["FinTech", "Payments"], status: "Open", featured: true, organizer: "Razorpay" },
  { id: "unstop-1", title: "Smart India Hackathon 2025", platform: "Unstop", logo: null, url: "https://unstop.com/hackathons", deadline: new Date(Date.now() + 30 * 864e5).toISOString(), prize: "₹10,00,000", participants: 15000, mode: "In-Person", tags: ["Government", "Innovation", "Tech for Good"], status: "Upcoming", featured: true, organizer: "Govt of India" },
  { id: "unstop-2", title: "HackRush 2025", platform: "Unstop", logo: null, url: "https://unstop.com/hackathons", deadline: new Date(Date.now() + 7 * 864e5).toISOString(), prize: "₹1,00,000", participants: 3400, mode: "Online", tags: ["Open", "Web Dev"], status: "Open", featured: false, organizer: "Coding Ninjas" },
  { id: "devpost-3", title: "Meta Llama Hackathon", platform: "Devpost", logo: null, url: "https://devpost.com/hackathons", deadline: new Date(Date.now() + 25 * 864e5).toISOString(), prize: "$150,000", participants: 7200, mode: "Online", tags: ["AI", "LLM", "Open Source"], status: "Open", featured: true, organizer: "Meta" },
  { id: "devfolio-3", title: "ETHIndia 2025", platform: "Devfolio", logo: null, url: "https://ethindia.co", deadline: new Date(Date.now() + 45 * 864e5).toISOString(), prize: "$500,000", participants: 5000, mode: "In-Person", tags: ["Web3", "Ethereum", "DeFi", "NFT"], status: "Upcoming", featured: true, organizer: "Ethereum Foundation" },
  { id: "hackerearth-3", title: "Data Science Hackathon", platform: "HackerEarth", logo: null, url: "https://www.hackerearth.com/challenges/hackathon/", deadline: new Date(Date.now() + 10 * 864e5).toISOString(), prize: "$5,000", participants: 4300, mode: "Online", tags: ["Data Science", "Analytics"], status: "Open", featured: false, organizer: null },
  { id: "unstop-3", title: "ICPC Regionals 2025", platform: "Unstop", logo: null, url: "https://unstop.com/hackathons", deadline: new Date(Date.now() + 18 * 864e5).toISOString(), prize: "₹3,00,000", participants: 8900, mode: "In-Person", tags: ["Competitive Programming", "Algorithms"], status: "Upcoming", featured: false, organizer: "ICPC Foundation" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getDaysLeft(deadline) {
  if (!deadline) return null;
  const diff = new Date(deadline) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDeadline(deadline) {
  if (!deadline) return "TBA";
  return new Date(deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getDeadlineUrgency(days) {
  if (days === null) return "none";
  if (days <= 3) return "critical";
  if (days <= 7) return "urgent";
  if (days <= 14) return "soon";
  return "normal";
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function PlatformBadge({ platform }) {
  const meta = PLATFORM_META[platform] || { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", icon: "🎯" };
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.color}30` }}
    >
      <span>{meta.icon}</span>
      {platform}
    </span>
  );
}

function DeadlineBadge({ deadline }) {
  const days = getDaysLeft(deadline);
  const urgency = getDeadlineUrgency(days);
  const config = {
    critical: { text: `${days}d left`, cls: "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse" },
    urgent: { text: `${days}d left`, cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    soon: { text: `${days}d left`, cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    normal: { text: formatDeadline(deadline), cls: "bg-slate-700/50 text-slate-400 border-slate-600/30" },
    none: { text: "TBA", cls: "bg-slate-700/50 text-slate-500 border-slate-600/30" },
  };
  const { text, cls } = config[urgency] || config.none;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {text}
    </span>
  );
}

function StatusBadge({ status }) {
  const config = {
    Open: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Closed: "bg-slate-600/20 text-slate-500 border-slate-600/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${config[status] || config.Closed}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "Open" ? "bg-emerald-400" : status === "Upcoming" ? "bg-blue-400" : "bg-slate-500"}`} />
      {status}
    </span>
  );
}

function HackathonCard({ hackathon, index, watched, onToggleWatch }) {
  const meta = PLATFORM_META[hackathon.platform] || { color: "#a78bfa" };
  const days = getDaysLeft(hackathon.deadline);

  // 阻止外链跳转：加入/移出意向不触发 <a> 导航
  const handleWatchClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleWatch(hackathon);
  };

  return (
    <a
      href={hackathon.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        className="relative h-full rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          border: `1px solid rgba(255,255,255,0.06)`,
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        }}
      >
        {/* Glow on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
          style={{ boxShadow: `inset 0 0 0 1px ${meta.color}40, 0 0 40px ${meta.color}15` }}
        />

        {/* Featured ribbon */}
        {hackathon.featured && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-400 border border-amber-400/30">
              ⭐ Featured
            </span>
          </div>
        )}

        {/* Top color stripe */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${meta.color}, ${meta.color}60)` }} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
              style={{ background: meta.bg, border: `1px solid ${meta.color}30` }}
            >
              {hackathon.logo ? (
                <img src={hackathon.logo} alt={hackathon.platform} className="w-8 h-8 object-contain rounded-lg" />
              ) : (
                PLATFORM_META[hackathon.platform]?.icon || "🎯"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-sm leading-tight group-hover:text-opacity-90 line-clamp-2 mb-1">
                {hackathon.title}
              </h3>
              {hackathon.organizer && (
                <p className="text-xs text-slate-500 truncate">by {hackathon.organizer}</p>
              )}
            </div>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <PlatformBadge platform={hackathon.platform} />
            <StatusBadge status={hackathon.status} />
            <DeadlineBadge deadline={hackathon.deadline} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {hackathon.prize && (
              <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-xs text-slate-500 mb-0.5">Prize Pool</p>
                <p className="text-sm font-bold text-emerald-400">{hackathon.prize}</p>
              </div>
            )}
            {hackathon.participants && (
              <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-xs text-slate-500 mb-0.5">Participants</p>
                <p className="text-sm font-bold text-slate-300">{hackathon.participants.toLocaleString()}</p>
              </div>
            )}
            <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-xs text-slate-500 mb-0.5">Mode</p>
              <p className="text-sm font-bold text-slate-300">{hackathon.mode}</p>
            </div>
          </div>

          {/* Tags */}
          {hackathon.tags && hackathon.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {hackathon.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-xs"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {tag}
                </span>
              ))}
              {hackathon.tags.length > 3 && (
                <span className="px-2 py-0.5 rounded-md text-xs" style={{ color: "#64748b" }}>
                  +{hackathon.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* CTA */}
          <div
            className="flex items-center justify-between pt-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <button
              type="button"
              onClick={handleWatchClick}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-200"
              style={
                watched
                  ? { color: "#f87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)" }
                  : { color: "#34d399", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)" }
              }
            >
              {watched ? "移出意向" : "加入意向"}
            </button>
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all duration-200"
              style={{ color: meta.color }}
            >
              View Details
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", border: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="h-1 bg-slate-700" />
      <div className="p-5 space-y-3">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-700/60" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-slate-700/60 rounded w-3/4" />
            <div className="h-2.5 bg-slate-700/40 rounded w-1/2" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-5 bg-slate-700/40 rounded-full w-20" />
          <div className="h-5 bg-slate-700/40 rounded-full w-16" />
          <div className="h-5 bg-slate-700/40 rounded-full w-24" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-12 bg-slate-700/30 rounded-lg" />
          <div className="h-12 bg-slate-700/30 rounded-lg" />
        </div>
        <div className="flex gap-1">
          <div className="h-5 bg-slate-700/30 rounded w-12" />
          <div className="h-5 bg-slate-700/30 rounded w-16" />
          <div className="h-5 bg-slate-700/30 rounded w-10" />
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function HackathonExplorer() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedMode, setSelectedMode] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortBy, setSortBy] = useState("deadline");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  // 意向清单（逻辑全在 hook；Explorer 仅组装，禁止内联状态机 / setItem）
  const wl = useHackathonWatchlist();
  // URL 状态机 (URL-SYNC-A) 同样在逻辑层文件，Explorer 只消费，不拼 query
  const url = useWatchlistUrl({
    watchlist: wl.watchlist,
    notify: wl.notify,
    checkCompareCount: wl.checkCompareCount,
  });

  const fetchHackathons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/hackathons`, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setHackathons(json.data || []);
      setUsingMock(false);
    } catch (err) {
      console.warn("Backend unavailable, using mock data:", err.message);
      setHackathons(MOCK_HACKATHONS);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHackathons(); }, [fetchHackathons]);

  // Filter + sort
  const filtered = hackathons
    .filter((h) => {
      if (selectedPlatform !== "all" && h.platform.toLowerCase() !== selectedPlatform) return false;
      if (selectedMode !== "All" && !h.mode?.toLowerCase().includes(selectedMode.toLowerCase())) return false;
      if (selectedStatus !== "All" && h.status !== selectedStatus) return false;
      if (showFeaturedOnly && !h.featured) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          h.title?.toLowerCase().includes(q) ||
          h.platform?.toLowerCase().includes(q) ||
          h.organizer?.toLowerCase().includes(q) ||
          h.tags?.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "deadline") {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      }
      if (sortBy === "participants") return (b.participants || 0) - (a.participants || 0);
      if (sortBy === "prize") return (b.prize ? 1 : 0) - (a.prize ? 1 : 0);
      if (sortBy === "featured") return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      return 0;
    });

  const stats = {
    total: hackathons.length,
    open: hackathons.filter((h) => h.status === "Open").length,
    upcoming: hackathons.filter((h) => h.status === "Upcoming").length,
    withPrize: hackathons.filter((h) => h.prize).length,
  };

  return (
    <div className="min-h-screen" style={{ background: "#020817", fontFamily: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif" }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .card-enter { animation: cardEnter 0.4s ease both; }
        @keyframes cardEnter { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        .filter-pill { transition: all 0.2s; }
        .filter-pill:hover { transform: translateY(-1px); }
      `}</style>

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Background gradient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #3770FF, transparent)", filter: "blur(80px)" }} />
          <div className="absolute top-0 right-1/3 w-80 h-80 rounded-full opacity-8" style={{ background: "radial-gradient(circle, #44c4a1, transparent)", filter: "blur(80px)" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-semibold" style={{ background: "rgba(55,112,255,0.15)", color: "#3770FF", border: "1px solid rgba(55,112,255,0.3)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Live Hackathon Feed
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 leading-tight">
                Discover Hackathons
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-xl">
                Aggregated from Devpost, Devfolio, HackerEarth & Unstop — all in one place.
              </p>
            </div>
            <button
              onClick={fetchHackathons}
              disabled={loading}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105"
              style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>

          {/* Stats row */}
          {!loading && (
            <div className="flex flex-wrap gap-4 mt-6">
              {[
                { label: "Total", value: stats.total, color: "#94a3b8" },
                { label: "Open Now", value: stats.open, color: "#34d399" },
                { label: "Upcoming", value: stats.upcoming, color: "#60a5fa" },
                { label: "With Prize", value: stats.withPrize, color: "#fbbf24" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-xs text-slate-500">{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Mock data warning */}
          {usingMock && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Showing demo data — start the backend server at port 3001 for live listings
            </div>
          )}
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="sticky top-0 z-20" style={{ background: "rgba(2,8,23,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">

          {/* Search */}
          <div className="relative max-w-lg">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search hackathons, tags, organizers…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Platform filter */}
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlatform(p.id)}
                  className="filter-pill px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: selectedPlatform === p.id ? `${p.color}20` : "rgba(255,255,255,0.04)",
                    color: selectedPlatform === p.id ? p.color : "#64748b",
                    border: `1px solid ${selectedPlatform === p.id ? `${p.color}40` : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-slate-700/50 mx-1" />

            {/* Mode filter */}
            {MODES.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMode(m)}
                className="filter-pill px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: selectedMode === m ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.04)",
                  color: selectedMode === m ? "#c084fc" : "#64748b",
                  border: `1px solid ${selectedMode === m ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                {m}
              </button>
            ))}

            <div className="w-px h-5 bg-slate-700/50 mx-1" />

            {/* Status filter */}
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className="filter-pill px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: selectedStatus === s ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.04)",
                  color: selectedStatus === s ? "#34d399" : "#64748b",
                  border: `1px solid ${selectedStatus === s ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                {s}
              </button>
            ))}

            <div className="w-px h-5 bg-slate-700/50 mx-1 hidden sm:block" />

            {/* Featured toggle */}
            <button
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              className="filter-pill px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: showFeaturedOnly ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.04)",
                color: showFeaturedOnly ? "#fbbf24" : "#64748b",
                border: `1px solid ${showFeaturedOnly ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              ⭐ Featured
            </button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="ml-auto px-3 py-1 rounded-lg text-xs font-semibold outline-none"
              style={{ background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <option value="deadline">Sort: Deadline</option>
              <option value="participants">Sort: Participants</option>
              <option value="prize">Sort: Prize</option>
              <option value="featured">Sort: Featured</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Results count */}
        {!loading && (
          <p className="text-xs text-slate-500 mb-5">
            Showing <span className="text-slate-300 font-semibold">{filtered.length}</span> of <span className="text-slate-300 font-semibold">{hackathons.length}</span> hackathons
            {searchQuery && <span> matching "<span className="text-violet-400">{searchQuery}</span>"</span>}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">No hackathons found</h3>
            <p className="text-slate-500 text-sm mb-6">Try adjusting your filters or search query</p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedPlatform("all"); setSelectedMode("All"); setSelectedStatus("All"); setShowFeaturedOnly(false); }}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #3770FF, #7c3aed)" }}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((h, i) => (
              <div key={h.id} className="card-enter">
                <HackathonCard hackathon={h} index={i} watched={wl.isWatched(h.id)} onToggleWatch={wl.toggle} />
              </div>
            ))}
          </div>
        )}

        {/* Platform quick links */}
        {!loading && (
          <div className="mt-16 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-xs text-slate-600 text-center mb-4">Browse directly on each platform</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: "Devpost", url: "https://devpost.com/hackathons", color: "#00b4d8" },
                { label: "Devfolio", url: "https://devfolio.co/hackathons", color: "#3770FF" },
                { label: "HackerEarth", url: "https://www.hackerearth.com/challenges/hackathon/", color: "#44c4a1" },
                { label: "Unstop", url: "https://unstop.com/hackathons", color: "#F4C84A" },
              ].map((p) => (
                <a
                  key={p.label}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                  style={{ background: `${p.color}10`, color: p.color, border: `1px solid ${p.color}25` }}
                >
                  {p.label} →
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 意向清单入口徽章 (n/6) ── */}
      <button
        onClick={url.openPanel}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:scale-105"
        style={{ background: "linear-gradient(135deg, #3770FF, #7c3aed)", boxShadow: "0 8px 24px rgba(55,112,255,0.4)" }}
        title="意向清单"
      >
        <span>📌 意向清单</span>
        <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(255,255,255,0.2)" }}>
          {wl.count}/{wl.MAX_WATCH}
        </span>
      </button>

      {/* ── 意向面板（开关走 URL 状态机 URL-SYNC-A）── */}
      <WatchlistPanel
        open={url.panelOpen}
        onClose={url.closePanel}
        watchlist={wl.watchlist}
        count={wl.count}
        isFull={wl.isFull}
        remove={wl.remove}
        clear={wl.clear}
        notify={wl.notify}
        usingMock={usingMock}
        MAX_WATCH={wl.MAX_WATCH}
        COMPARE_MIN={wl.COMPARE_MIN}
        COMPARE_MAX={wl.COMPARE_MAX}
        checkCompareCount={wl.checkCompareCount}
        onCompare={url.openCompare}
        initialSelected={url.compareIds}
      />

      {/* ── 对比表（仅当 URL compare 合法时）── */}
      {url.compareActive && (
        <HackathonCompareView
          items={url.compareItems}
          onClose={url.closeCompare}
          onRemoveRow={(id) => url.removeFromCompare(id, wl.remove)}
          notify={wl.notify}
        />
      )}

      {/* ── 手写轻量 toast ── */}
      {wl.toast && (
        <div
          key={wl.toast.id}
          onClick={wl.dismissToast}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
          style={{
            background:
              wl.toast.type === "error"
                ? "rgba(248,113,113,0.95)"
                : wl.toast.type === "success"
                ? "rgba(52,211,153,0.95)"
                : "rgba(30,41,59,0.97)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {wl.toast.message}
        </div>
      )}
    </div>
  );
}
