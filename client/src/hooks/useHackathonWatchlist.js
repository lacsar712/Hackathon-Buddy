import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const WATCH_STORAGE_KEY = "hb_hackathon_watch_v1";
export const MAX_WATCH = 6;
export const COMPARE_MIN = 2;
export const COMPARE_MAX = 4;

const MSG = {
  INCOMPLETE: "活动数据不完整，无法加入意向清单",
  FULL: "意向清单最多保存 6 个黑客松",
  ADDED: "已加入意向清单",
  REMOVED: "已移出意向清单",
  STORAGE_UNAVAILABLE: "本地存储不可用，刷新后意向清单将丢失",
  NOT_IN_LIST: "部分黑客松不在意向清单中",
};

function testStorageAvailable() {
  try {
    const probe = "__hb_probe__";
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function parsePrizeToCents(input) {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) return null;
    return Math.round(input * 100);
  }
  if (typeof input !== "string") return null;

  let s = input.trim();
  if (!s) return null;

  // S2 strip tags + decode common entities
  s = s.replace(/<[^>]*>/g, " ");
  s = s
    .replace(/&#36;/gi, "$")
    .replace(/&#8377;/gi, "₹")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ");
  s = s.replace(/\s+/g, " ").trim();
  if (!s) return null;

  // S3/S4/S5: prefer amount preceded by currency marker, with optional k/m
  const moneyRe =
    /(?:\$|₹|USD|INR)\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*([kKmM])?/i;
  let m = s.match(moneyRe);
  if (!m) {
    const numRe = /([0-9][0-9,]*(?:\.[0-9]+)?)\s*([kKmM])?/;
    m = s.match(numRe);
  }
  if (!m) return null;

  // S5 remove commas (Indian grouping included)
  const numStr = m[1].replace(/,/g, "");
  const suffix = (m[2] || "").toLowerCase();

  // S6 Number
  const main = Number(numStr);
  if (!Number.isFinite(main)) return null;

  // S7 multiplier
  let multiplier = 1;
  if (suffix === "k") multiplier = 1000;
  else if (suffix === "m") multiplier = 1000000;

  // S8 integer cents
  return Math.round(main * multiplier * 100);
}

function normalizeItem(input) {
  if (!input || typeof input !== "object") return null;
  const id = input.id == null ? "" : String(input.id).trim();
  const title = input.title == null ? "" : String(input.title).trim();
  if (!id || !title) return null;

  const prizeRaw = input.prize ?? input.prizeRaw ?? null;
  const addedAtRaw = input.addedAt;
  const addedAt =
    typeof addedAtRaw === "number" && Number.isFinite(addedAtRaw)
      ? addedAtRaw
      : Date.now();

  return {
    id,
    title,
    platform: input.platform ?? null,
    url: input.url ?? null,
    mode: input.mode ?? null,
    status: input.status ?? null,
    deadline: input.deadline ?? null,
    prizeRaw,
    prizeCents: parsePrizeToCents(prizeRaw),
    participants:
      input.participants == null || input.participants === ""
        ? null
        : Number(input.participants),
    tags: Array.isArray(input.tags) ? input.tags : [],
    organizer: input.organizer ?? null,
    featured: !!input.featured,
    addedAt,
  };
}

function sortByAddedAtDesc(list) {
  return [...list].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
}

function readFromStorage() {
  try {
    const raw = window.localStorage.getItem(WATCH_STORAGE_KEY);
    if (raw == null) return [];
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // bad JSON → reset []
      window.localStorage.setItem(WATCH_STORAGE_KEY, "[]");
      return [];
    }
    if (!Array.isArray(parsed)) {
      window.localStorage.setItem(WATCH_STORAGE_KEY, "[]");
      return [];
    }
    const items = parsed.map(normalizeItem).filter(Boolean);
    return sortByAddedAtDesc(items);
  } catch {
    return [];
  }
}

function writeToStorage(list) {
  try {
    window.localStorage.setItem(
      WATCH_STORAGE_KEY,
      JSON.stringify(sortByAddedAtDesc(list)),
    );
    return true;
  } catch {
    return false;
  }
}

export function sortWatchlistByPrizeCentsDesc(items) {
  return [...items].sort((a, b) => {
    const ac = a.prizeCents;
    const bc = b.prizeCents;
    if (ac == null && bc == null) {
      return (b.addedAt || 0) - (a.addedAt || 0);
    }
    if (ac == null) return 1;
    if (bc == null) return -1;
    if (bc !== ac) return bc - ac;
    return (b.addedAt || 0) - (a.addedAt || 0);
  });
}

export function sortWatchlistByDeadlineSoon(items) {
  const parseTime = (d) => {
    if (!d) return null;
    const t = new Date(d).getTime();
    return Number.isFinite(t) ? t : null;
  };
  return [...items].sort((a, b) => {
    const at = parseTime(a.deadline);
    const bt = parseTime(b.deadline);
    if (at == null && bt == null) return (b.addedAt || 0) - (a.addedAt || 0);
    if (at == null) return 1;
    if (bt == null) return -1;
    if (at !== bt) return at - bt;
    return (b.addedAt || 0) - (a.addedAt || 0);
  });
}

export function sortWatchlistByParticipantsDesc(items) {
  const toNum = (v) => {
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  return [...items].sort((a, b) => {
    const an = toNum(a.participants);
    const bn = toNum(b.participants);
    if (an == null && bn == null) return (b.addedAt || 0) - (a.addedAt || 0);
    if (an == null) return 1;
    if (bn == null) return -1;
    if (bn !== an) return bn - an;
    return (b.addedAt || 0) - (a.addedAt || 0);
  });
}

export const COMPARE_SORTS = {
  prize: {
    id: "prize",
    label: "奖池分值 ↓",
    exportLabel: "按奖池分值",
    apply: sortWatchlistByPrizeCentsDesc,
  },
  deadline: {
    id: "deadline",
    label: "截止日期 ↑",
    exportLabel: "按截止日期",
    apply: sortWatchlistByDeadlineSoon,
  },
  participants: {
    id: "participants",
    label: "参与人数 ↓",
    exportLabel: "按参与人数",
    apply: sortWatchlistByParticipantsDesc,
  },
};

export function computeDeltaCentsMap(items) {
  const valid = items
    .map((it) => it.prizeCents)
    .filter((c) => c != null && Number.isFinite(c));
  if (valid.length === 0) {
    const empty = {};
    items.forEach((it) => {
      empty[it.id] = null;
    });
    return empty;
  }
  const maxPrizeCents = Math.max(...valid);
  const map = {};
  items.forEach((it) => {
    if (it.prizeCents == null || !Number.isFinite(it.prizeCents)) {
      map[it.id] = null;
    } else {
      map[it.id] = it.prizeCents - maxPrizeCents;
    }
  });
  return map;
}

function formatDeltaForExport(cents) {
  if (cents == null || !Number.isFinite(cents)) return "—";
  if (cents === 0) return "0";
  const main = cents / 100;
  const str = Number.isInteger(main)
    ? main.toLocaleString("en-US")
    : main.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  return cents > 0 ? `+${str}` : str;
}

function formatCentsForExport(cents) {
  if (cents == null || !Number.isFinite(cents)) return "—";
  const main = cents / 100;
  return Number.isInteger(main)
    ? main.toLocaleString("en-US")
    : main.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

export function buildCompareSummary({ orderedItems, sortId }) {
  const items = Array.isArray(orderedItems) ? orderedItems : [];
  const sorter = COMPARE_SORTS[sortId] || COMPARE_SORTS.prize;
  const sorted = sorter.apply(items);
  const deltaMap = computeDeltaCentsMap(sorted);
  const lines = [];
  lines.push("【黑客松对比摘要】");
  lines.push(`生成时间: ${new Date().toISOString()}`);
  lines.push(`条目数: ${sorted.length}`);
  lines.push(`排序: ${sorter.exportLabel}`);
  lines.push("----");
  sorted.forEach((it, idx) => {
    const parts = [
      `${idx + 1}. ${it.title || ""}`,
      it.platform || "—",
      it.mode || "—",
      it.status || "—",
      `奖池:${it.prizeRaw || "—"}`,
      `分值:${formatCentsForExport(it.prizeCents)}`,
      `差值:${formatDeltaForExport(deltaMap[it.id])}`,
    ];
    lines.push(parts.join(" | "));
  });
  return lines.join("\n");
}

export async function copyTextToClipboard(text) {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true, method: "clipboard" };
    } catch {
      // fall through to legacy fallback
    }
  }
  return { ok: false, method: "fallback" };
}

export default function useHackathonWatchlist() {
  const storageAvailable = useMemo(() => testStorageAvailable(), []);
  const [items, setItems] = useState(() => readFromStorage());
  const storageWarnedRef = useRef(false);

  useEffect(() => {
    const ok = writeToStorage(items);
    if (!ok && !storageWarnedRef.current) {
      storageWarnedRef.current = true;
    }
  }, [items]);

  const has = useCallback(
    (id) => items.some((it) => it.id === id),
    [items],
  );

  const toggle = useCallback(
    (hackathon) => {
      if (!hackathon || typeof hackathon !== "object") {
        return { added: false, removed: false, message: MSG.INCOMPLETE };
      }
      const id = hackathon.id == null ? "" : String(hackathon.id).trim();
      const title =
        hackathon.title == null ? "" : String(hackathon.title).trim();

      if (!id || !title) {
        return { added: false, removed: false, message: MSG.INCOMPLETE };
      }

      let resultMessage = null;
      let addedFlag = false;
      let removedFlag = false;

      setItems((prev) => {
        const existing = prev.find((it) => it.id === id);
        if (existing) {
          removedFlag = true;
          resultMessage = MSG.REMOVED;
          return prev.filter((it) => it.id !== id);
        }
        if (prev.length >= MAX_WATCH) {
          resultMessage = MSG.FULL;
          return prev;
        }
        const normalized = normalizeItem({ ...hackathon, addedAt: Date.now() });
        if (!normalized) {
          resultMessage = MSG.INCOMPLETE;
          return prev;
        }
        addedFlag = true;
        resultMessage = MSG.ADDED;
        return sortByAddedAtDesc([normalized, ...prev]);
      });

      return {
        added: addedFlag,
        removed: removedFlag,
        message: resultMessage,
        storageAvailable,
      };
    },
    [storageAvailable],
  );

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const count = items.length;
  const isFull = count >= MAX_WATCH;

  return {
    items,
    count,
    isFull,
    has,
    toggle,
    remove,
    clear,
    storageAvailable,
    messages: MSG,
  };
}
