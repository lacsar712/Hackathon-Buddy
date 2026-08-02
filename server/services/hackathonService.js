const axios = require("axios");

// Strips HTML tags and decodes common entities from Devpost prize strings
// e.g. "$$<span data-currency-value>2,500</span>" → "$2,500"
const stripHtml = (str) => {
  if (!str) return null;
  const clean = str
    .replace(/<[^>]*>/g, '')   // remove all HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Return null if nothing meaningful left (e.g. "$$0" or "$0")
  if (!clean || /^\$+0$/.test(clean.replace(/,/g, ''))) return null;
  return clean;
};

// ─── DEVPOST ──────────────────────────────────────────────────────────────────
const fetchDevpost = async () => {
  try {
    const { data } = await axios.get(
      "https://devpost.com/api/hackathons?status[]=upcoming&status[]=open&order_by=deadline&per_page=30",
      {
        headers: { "User-Agent": "Mozilla/5.0 HackathonBuddy/1.0" },
        timeout: 8000,
      },
    );
    return (data.hackathons || []).map((h) => ({
      id: `devpost-${h.id}`,
      title: h.title,
      platform: "Devpost",
      logo: h.thumbnail_url || null,
      url: h.url,
      deadline: h.submission_period_dates || null,
       // FIX: displayed_prize_amount contains raw HTML — strip it
      prize: stripHtml(h.displayed_prize_amount) || (h.prize_amount > 0 ? `$${h.prize_amount}` : null),
      participants: h.registrations_count || null,
      mode: h.online_only ? "Online" : "In-Person / Hybrid",
      tags: h.themes ? h.themes.map((t) => t.name) : [],
      status: h.open_state === "open" ? "Open" : "Upcoming",
      featured: h.featured || false,
      organizer: h.organizations
        ? h.organizations.map((o) => o.name).join(", ")
        : null,
    }));
  } catch (err) {
    console.error("[HackathonService] Devpost error:", err.message);
    return [];
  }
};

// ─── DEVFOLIO ─────────────────────────────────────────────────────────────────
// FIX: Old endpoint returned 404. Using correct public API endpoint.
const fetchDevfolio = async () => {
  try {
    const { data } = await axios.post(
      "https://api.devfolio.co/api/search/hackathons",
      {
        query: "",
        page: 1,
        per_page: 24,
        filters: { status: ["open", "upcoming"] },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 HackathonBuddy/1.0",
          Accept: "application/json",
        },
        timeout: 8000,
      },
    );
    const results = data.hackathons || data.results || data.data || [];
    return results.map((h) => ({
      id: `devfolio-${h.id || h.slug || Math.random().toString(36).slice(2)}`,
      title: h.name || h.title || "Unnamed Hackathon",
      platform: "Devfolio",
      logo: h.logo_url || h.cover_image_url || h.banner || null,
      url: h.slug
        ? `https://${h.slug}.devfolio.co`
        : "https://devfolio.co/hackathons",
      deadline: h.ends_at || h.submission_deadline || h.end_date || null,
      prize: h.prize_pool ? `₹${h.prize_pool}` : null,
      participants: h.num_applications || h.participants_count || null,
      mode: h.is_online !== false ? "Online" : "In-Person",
      tags: Array.isArray(h.themes)
        ? h.themes
        : Array.isArray(h.tracks)
          ? h.tracks
          : [],
      status: h.status === "open" ? "Open" : "Upcoming",
      featured: h.is_featured || false,
      organizer: h.organization?.name || h.team?.name || null,
    }));
  } catch (err) {
    // Fallback to GET variant
    try {
      const { data } = await axios.get("https://devfolio.co/hackathons", {
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "Mozilla/5.0 HackathonBuddy/1.0",
        },
        timeout: 8000,
      });
      const results = data.hackathons || data.results || data.data || [];
      return results.map((h) => ({
        id: `devfolio-${h.id || h.slug}`,
        title: h.name || h.title || "Unnamed",
        platform: "Devfolio",
        logo: h.logo_url || null,
        url: h.slug
          ? `https://${h.slug}.devfolio.co`
          : "https://devfolio.co/hackathons",
        deadline: h.ends_at || null,
        prize: null,
        participants: h.num_applications || null,
        mode: "Online",
        tags: [],
        status: "Open",
        featured: false,
        organizer: null,
      }));
    } catch (fallbackErr) {
      console.error(
        "[HackathonService] Devfolio error (both endpoints failed):",
        fallbackErr.message,
      );
      return [];
    }
  }
};

// ─── HACKEREARTH ──────────────────────────────────────────────────────────────
// FIX: The API has NO 'type' or 'event_type' field — old filter dropped ALL results.
// Actual fields from API: title, url, status ("ONGOING"/"UPCOMING"), thumbnail,
// end_utc_tz, end_date, challenge_type, is_hackerearth
// Solution: include ALL events (they're all hackathons/challenges), just map fields correctly.
const fetchHackerEarth = async () => {
  try {
    const { data } = await axios.get(
      "https://www.hackerearth.com/chrome-extension/events/",
      {
        headers: { "User-Agent": "Mozilla/5.0 HackathonBuddy/1.0" },
        timeout: 8000,
      },
    );

    const events = data.response || [];

    return events.slice(0, 24).map((h, i) => ({
      // FIX: build id from url slug since there's no numeric id field
      id: `hackerearth-${i}-${(h.url || "").split("/").filter(Boolean).pop() || i}`,
      title: h.title,
      platform: "HackerEarth",
      // FIX: actual image field is 'thumbnail', not 'cover_image'
      logo: h.thumbnail || null,
      url: h.url,
      // FIX: use end_utc_tz (ISO format with offset) for deadline
      deadline: h.end_utc_tz || h.end_date || null,
      prize: null,
      participants: h.num_registrations || null,
      mode: "Online",
      // FIX: use challenge_type as tag (e.g. "Monthly Challenges")
      tags: h.challenge_type ? [h.challenge_type] : [],
      // FIX: status is "ONGOING" or "UPCOMING" — no filtering needed
      status: h.status === "ONGOING" ? "Open" : "Upcoming",
      featured: false,
      organizer: h.is_hackerearth ? "HackerEarth" : null,
    }));
  } catch (err) {
    console.error("[HackathonService] HackerEarth error:", err.message);
    return [];
  }
};

// ─── UNSTOP ───────────────────────────────────────────────────────────────────
const fetchUnstop = async () => {
  try {
    const { data } = await axios.get(
      "https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&page=1&size=20&oppstatus=open",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 HackathonBuddy/1.0",
          Accept: "application/json",
          Referer: "https://unstop.com/hackathons",
        },
        timeout: 8000,
      },
    );
    const items = data?.data?.data || data?.data || [];
    return items.map((h) => ({
      id: `unstop-${h.id}`,
      title: h.title,
      platform: "Unstop",
      logo: h.logo || h.image || null,
      url: h.public_url
        ? `https://unstop.com/${h.public_url}`
        : "https://unstop.com/hackathons",
      deadline: h.end_date || h.reg_end_date || null,
      prize: h.prizes_text || (h.prize ? `₹${h.prize}` : null),
      participants: h.total_registered || null,
      mode: h.hackathon_setting || "Online",
      tags: h.tags?.map((t) => t.name) || [],
      status: "Open",
      featured: h.is_featured || false,
      organizer: h.organisation?.name || null,
    }));
  } catch (err) {
    console.error("[HackathonService] Unstop error:", err.message);
    return [];
  }
};

// ─── AGGREGATOR ───────────────────────────────────────────────────────────────
const fetchAllHackathons = async (
  platforms = ["devpost", "devfolio", "hackerearth", "unstop"],
) => {
  const fetchers = {
    devpost: fetchDevpost,
    devfolio: fetchDevfolio,
    hackerearth: fetchHackerEarth,
    unstop: fetchUnstop,
  };

  const results = await Promise.allSettled(
    platforms.filter((p) => fetchers[p]).map((p) => fetchers[p]()),
  );

  return results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);
};

module.exports = {
  fetchAllHackathons,
  fetchDevpost,
  fetchDevfolio,
  fetchHackerEarth,
  fetchUnstop,
};
