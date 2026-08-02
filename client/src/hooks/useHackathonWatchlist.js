import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useSearchParams } from "react-router-dom";

// ─── FROZEN CONSTANTS (HB-WATCHLIST-R1 / MID-6391 / Freeze-v1) ───────────────
export const WATCHLIST_STORAGE_KEY = "hb_hackathon_watch_v1";
export const MAX_WATCH = 6;
export const COMPARE_MIN = 2;
export const COMPARE_MAX = 4;

// R2: display-only sorts (never persisted to URL / localStorage)
export const COMPARE_SORTS = {
  PRIZE: "prize",
  DEADLINE: "deadline",
  PARTICIPANTS: "participants",
};

// R3: Chinese labels used in the exported summary (frozen, no paraphrase)
export const COMPARE_SORT_LABELS = {
  [COMPARE_SORTS.PRIZE]: "按奖池分值",
  [COMPARE_SORTS.DEADLINE]: "按截止日期",
  [COMPARE_SORTS.PARTICIPANTS]: "按参与人数",
};

const REQUIRED_FIELDS = [
  "id",
  "title",
  "platform",
  "url",
  "mode",
  "status",
  "deadline",
  "prizeRaw",
  "prizeCents",
  "participants",
  "tags",
  "organizer",
  "featured",
  "addedAt",
];

// ─── PRIZE PARSER (state machine S0 → S8) ────────────────────────────────────
// Returns integer cents, or null when unparseable.
export function parsePrizeToCents(prize) {
  // S0: non-string & non-number → null; number = main unit * 100
  if (prize === null || prize === undefined) return null;
  if (typeof prize === "number") {
    return Number.isFinite(prize) ? Math.round(prize * 100) : null;
  }
  if (typeof prize !== "string") return null;

  // S1: trim
  let s = prize.trim();
  if (!s) return null;

  // S2: strip HTML tags + common entities
  s = s
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return null;

  // S3: currency — prefer an amount immediately preceded by a currency marker
  const currencyRe =
    /(?:\$|USD|₹|INR|Rs\.?)\s*([\d,]+(?:\.\d+)?)\s*([kKmM])?/i;
  let m = s.match(currencyRe);
  if (!m) {
    // fallback: first bare numeric token (e.g. "5000")
    m = s.match(/([\d,]+(?:\.\d+)?)\s*([kKmM])?/);
  }
  if (!m) return null;

  // S5: remove all commas (handles Indian grouping too)
  const numStr = m[1].replace(/,/g, "");
  // S6: Number
  const num = Number(numStr);
  if (!Number.isFinite(num)) return null;

  // S4 + S7: k/m multiplier
  let main = num;
  if (m[2]) {
    const suffix = m[2].toLowerCase();
    if (suffix === "k") main = num * 1000;
    else if (suffix === "m") main = num * 1000000;
  }

  // S8: main unit → integer cents
  return Math.round(main * 100);
}

// ─── SCHEMA / PERSISTENCE HELPERS ────────────────────────────────────────────
function isValidItem(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return false;
  return REQUIRED_FIELDS.every((f) =>
    Object.prototype.hasOwnProperty.call(item, f),
  );
}

function sortByAddedAtDesc(list) {
  return [...list].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
}

export function sortWatchlistByPrizeCentsDesc(list) {
  return [...list].sort((a, b) => {
    const av = a && a.prizeCents;
    const bv = b && b.prizeCents;
    if (av === null && bv === null) return 0;
    if (av === null) return 1; // null sinks to bottom
    if (bv === null) return -1;
    return bv - av;
  });
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // bad JSON → reset to []
      try {
        localStorage.setItem(WATCHLIST_STORAGE_KEY, "[]");
      } catch {
        /* ignore */
      }
      return [];
    }
    if (!Array.isArray(parsed)) return [];
    // 缺字段丢弃
    const valid = parsed.filter(isValidItem);
    return sortByAddedAtDesc(valid);
  } catch {
    return [];
  }
}

function buildItem(hackathon) {
  const prizeRaw =
    hackathon.prize !== undefined ? hackathon.prize ?? null : null;
  return {
    id: hackathon.id,
    title: hackathon.title,
    platform: hackathon.platform ?? "",
    url: hackathon.url ?? "",
    mode: hackathon.mode ?? "",
    status: hackathon.status ?? "",
    deadline: hackathon.deadline ?? null,
    prizeRaw,
    prizeCents: parsePrizeToCents(prizeRaw),
    participants: hackathon.participants ?? null,
    tags: Array.isArray(hackathon.tags) ? hackathon.tags : [],
    organizer: hackathon.organizer ?? null,
    featured: !!hackathon.featured,
    addedAt: Date.now(),
  };
}

// ─── URL STATE MACHINE (URL-SYNC-A) ──────────────────────────────────────────
// S_idle   : no watch param (or watch != "1")
// S_panel  : watch=1 only
// S_compare: watch=1 + compare=id1,id2,...  (2~4, selection order)
//
// Pure parser: returns ordered unique ids, or null when absent/empty.
export function parseCompareParam(value) {
  if (typeof value !== "string") return null;
  const seen = new Set();
  const out = [];
  for (const part of value.split(",")) {
    const id = part.trim();
    if (id && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out.length > 0 ? out : null;
}

function deadlineTimestamp(deadline) {
  if (!deadline) return null;
  const t = new Date(deadline).getTime();
  return Number.isFinite(t) ? t : null;
}

// R2 display-only sort. prize: cents desc, null sink, ties addedAt desc.
// deadline: nearer first, invalid sink, ties addedAt desc.
// participants: desc, null sink, ties addedAt desc.
export function sortCompareItems(list, sortKey) {
  const arr = [...list];
  arr.sort((a, b) => {
    if (sortKey === COMPARE_SORTS.DEADLINE) {
      const at = deadlineTimestamp(a.deadline);
      const bt = deadlineTimestamp(b.deadline);
      if (at === null && bt === null) return (b.addedAt || 0) - (a.addedAt || 0);
      if (at === null) return 1;
      if (bt === null) return -1;
      if (at !== bt) return at - bt; // nearer first
      return (b.addedAt || 0) - (a.addedAt || 0);
    }
    if (sortKey === COMPARE_SORTS.PARTICIPANTS) {
      const av = a.participants;
      const bv = b.participants;
      const an = typeof av === "number" && Number.isFinite(av) ? av : null;
      const bn = typeof bv === "number" && Number.isFinite(bv) ? bv : null;
      if (an === null && bn === null) return (b.addedAt || 0) - (a.addedAt || 0);
      if (an === null) return 1;
      if (bn === null) return -1;
      if (bn !== an) return bn - an;
      return (b.addedAt || 0) - (a.addedAt || 0);
    }
    // default: prize
    const av = a.prizeCents;
    const bv = b.prizeCents;
    if (av === null && bv === null) return (b.addedAt || 0) - (a.addedAt || 0);
    if (av === null) return 1;
    if (bv === null) return -1;
    if (bv !== av) return bv - av;
    return (b.addedAt || 0) - (a.addedAt || 0);
  });
  return arr;
}

// ─── EXPORT SUMMARY (R3 / DELTA-CENTS-0) ─────────────────────────────────────
// Pure text builder. Row order = current table display order (already sorted).
// Field separator is " | "; null/undefined → "—"; prizeCents/delta as raw
// integer cents (no locale grouping) so notepad paste is machine-checkable.
export function buildCompareSummaryText(items, sortKey) {
  const sortLabel =
    COMPARE_SORT_LABELS[sortKey] || COMPARE_SORT_LABELS[COMPARE_SORTS.PRIZE];
  const lines = [];
  lines.push("【黑客松对比摘要】");
  lines.push(`生成时间: ${new Date().toISOString()}`);
  lines.push(`条目数: ${items.length}`);
  lines.push(`排序: ${sortLabel}`);
  lines.push("----");
  items.forEach((item, idx) => {
    const prizeRaw =
      item.prizeRaw !== null &&
      item.prizeRaw !== undefined &&
      String(item.prizeRaw).trim() !== ""
        ? String(item.prizeRaw)
        : "—";
    const prizeCents =
      item.prizeCents === null || item.prizeCents === undefined
        ? "—"
        : String(item.prizeCents);
    const delta =
      item.deltaCents === null || item.deltaCents === undefined
        ? "—"
        : String(item.deltaCents);
    lines.push(
      `${idx + 1}. ${item.title || "—"} | ${item.platform || "—"} | ${
        item.mode || "—"
      } | ${item.status || "—"} | 奖池:${prizeRaw} | 分值:${prizeCents} | 差值:${delta}`,
    );
  });
  return lines.join("\n");
}

// ─── HOOK ────────────────────────────────────────────────────────────────────
export function useHackathonWatchlist() {
  const [watchlist, setWatchlist] = useState(() => loadFromStorage());
  const [compareIds, setCompareIds] = useState([]);
  const [storageError, setStorageError] = useState(false);
  const [toast, setToast] = useState(null);
  const [compareSort, setCompareSort] = useState(COMPARE_SORTS.PRIZE);
  const [exportFallback, setExportFallback] = useState(null);
  const toastTimer = useRef(null);
  const toastedRawRef = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type, id: Date.now() });
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return undefined;
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(toastTimer.current);
  }, [toast]);

  const persist = useCallback(
    (list) => {
      try {
        localStorage.setItem(
          WATCHLIST_STORAGE_KEY,
          JSON.stringify(list),
        );
        setStorageError(false);
      } catch {
        setStorageError(true);
        showToast("本地存储不可用，刷新后意向清单将丢失", "error");
      }
    },
    [showToast],
  );

  // ── URL-derived state ────────────────────────────────────────────────────
  const urlWatch = searchParams.get("watch") === "1";
  const rawCompare = searchParams.get("compare");
  const panelOpen = urlWatch;

  const watchlistIdSet = useMemo(
    () => new Set(watchlist.map((w) => w.id)),
    [watchlist],
  );

  const parsedCompare = useMemo(
    () => parseCompareParam(rawCompare),
    [rawCompare],
  );

  const compareValidation = useMemo(() => {
    if (!parsedCompare) {
      return { valid: null, invalidCount: 0, illegal: false };
    }
    const valid = parsedCompare.filter((id) => watchlistIdSet.has(id));
    const invalidCount = parsedCompare.length - valid.length;
    const illegal = valid.length > COMPARE_MAX;
    return { valid, invalidCount, illegal };
  }, [parsedCompare, watchlistIdSet]);

  const isCompareOpen =
    urlWatch &&
    !!compareValidation.valid &&
    !compareValidation.illegal &&
    compareValidation.valid.length >= COMPARE_MIN &&
    compareValidation.invalidCount === 0;

  // ── URL sync effect (S_idle / S_panel / S_compare) ───────────────────────
  useEffect(() => {
    // S_idle: panel fully closed → clear in-memory selection
    if (!urlWatch) {
      setCompareIds((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    // S_panel (no compare param): keep user's checkbox selection untouched
    if (!parsedCompare) return;

    const { valid, invalidCount, illegal } = compareValidation;

    // Toast invalid ids from URL exactly once per raw string
    if (
      invalidCount > 0 &&
      toastedRawRef.current !== rawCompare
    ) {
      toastedRawRef.current = rawCompare;
      showToast("部分黑客松不在意向清单中", "info");
    } else if (
      invalidCount === 0 &&
      illegal &&
      toastedRawRef.current !== rawCompare
    ) {
      toastedRawRef.current = rawCompare;
      showToast("最多只能选择 4 个黑客松进行对比", "error");
    }
    if (invalidCount === 0 && !illegal && toastedRawRef.current !== null) {
      toastedRawRef.current = null;
    }

    // Sync in-memory selection to the URL order
    setCompareIds(valid);

    // Determine the desired (cleaned) compare param
    let desired = null;
    if (!illegal && valid.length >= COMPARE_MIN) {
      desired = valid.join(",");
    }
    const currentDesired =
      desired !== null && rawCompare === desired;

    if (!currentDesired) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("watch", "1");
          if (desired) next.set("compare", desired);
          else next.delete("compare");
          return next;
        },
        { replace: true },
      );
    }
  }, [
    urlWatch,
    parsedCompare,
    rawCompare,
    compareValidation,
    setSearchParams,
    showToast,
  ]);

  const isWatched = useCallback(
    (id) => watchlist.some((w) => w.id === id),
    [watchlist],
  );

  // R4: shared URL re-sync after a removal. If a compare view is open,
  // rewrite ?compare to the remaining ids (>= COMPARE_MIN) or drop it
  // (< COMPARE_MIN → back to panel with watch=1). Single source of truth.
  const syncCompareAfterRemoval = useCallback(
    (remainingCompare) => {
      if (urlWatch && rawCompare) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set("watch", "1");
            if (remainingCompare.length >= COMPARE_MIN) {
              next.set("compare", remainingCompare.join(","));
            } else {
              next.delete("compare");
            }
            return next;
          },<[PLHD73_never_used_51bce0c785ca2f68081bfa7d91973934]>, { replace: true },
        );
      }
    },
    [urlWatch, rawCompare, setSearchParams],
  );

  const toggleWatch = useCallback(
    (hackathon) => {
      if (
        !hackathon ||
        !hackathon.id ||
        !hackathon.title ||
        typeof hackathon.id !== "string" ||
        typeof hackathon.title !== "string" ||
        !hackathon.id.trim() ||
        !hackathon.title.trim()
      ) {
        showToast("活动数据不完整，无法加入意向清单", "error");
        return { added: false, reason: "incomplete" };
      }

      const exists = watchlist.some((w) => w.id === hackathon.id);
      if (exists) {
        // same id → toggle out
        const next = sortByAddedAtDesc(
          watchlist.filter((w) => w.id !== hackathon.id),
        );
        setWatchlist(next);
        persist(next);
        const remainingCompare = compareIds.filter(
          (id) => id !== hackathon.id,
        );
        setCompareIds(remainingCompare);
        syncCompareAfterRemoval(remainingCompare);
        showToast("已移出意向清单", "success");
        return { added: false };
      }

      if (watchlist.length >= MAX_WATCH) {
        showToast("意向清单最多保存 6 个黑客松", "error");
        return { added: false, reason: "full" };
      }

      const item = buildItem(hackathon);
      const next = sortByAddedAtDesc([item, ...watchlist]);
      setWatchlist(next);
      persist(next);
      showToast("已加入意向清单", "success");
      return { added: true };
    },
    [watchlist, persist, showToast, compareIds, syncCompareAfterRemoval],
  );

  const removeFromWatchlist = useCallback(
    (id) => {
      const next = sortByAddedAtDesc(
        watchlist.filter((w) => w.id !== id),
      );
      setWatchlist(next);
      persist(next);
      const remainingCompare = compareIds.filter((cid) => cid !== id);
      setCompareIds(remainingCompare);
      // R3/R4: single source of truth for URL re-sync after removal.
      syncCompareAfterRemoval(remainingCompare);
    },
    [watchlist, persist, compareIds, syncCompareAfterRemoval],
  );

  const clearWatchlist = useCallback(() => {
    setWatchlist([]);
    persist([]);
    setCompareIds([]);
    // R4: clean compare URL directly to avoid a misleading invalid-id toast.
    syncCompareAfterRemoval([]);
  }, [persist, syncCompareAfterRemoval]);

  const toggleCompare = useCallback(
    (id) => {
      if (compareIds.includes(id)) {
        setCompareIds(compareIds.filter((x) => x !== id));
        return;
      }
      if (compareIds.length >= COMPARE_MAX) {
        showToast("最多只能选择 4 个黑客松进行对比", "error");
        return;
      }
      setCompareIds([...compareIds, id]);
    },
    [compareIds, showToast],
  );

  const clearCompare = useCallback(() => setCompareIds([]), []);

  // ── URL-driven open/close actions ────────────────────────────────────────
  const openPanel = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("watch", "1");
      next.delete("compare");
      return next;
    });
  }, [setSearchParams]);

  const closePanel = useCallback(() => {
    toastedRawRef.current = null;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("watch");
      next.delete("compare");
      return next;
    });
  }, [setSearchParams]);

  const startCompare = useCallback(() => {
    if (compareIds.length < COMPARE_MIN) {
      showToast("请至少选择 2 个黑客松进行对比", "error");
      return false;
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("watch", "1");
      next.set("compare", compareIds.join(","));
      return next;
    });
    return true;
  }, [compareIds, setSearchParams, showToast]);

  const closeCompare = useCallback(() => {
    toastedRawRef.current = null;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("watch", "1");
      next.delete("compare");
      return next;
    });
  }, [setSearchParams]);

  // ── Export summary (R3 / Clipboard API + textarea fallback) ─────────────
  const copyCompareSummary = useCallback(async () => {
    const text = buildCompareSummaryText(compareItems, compareSort);
    // Fast path: secure context with async Clipboard API
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      window.isSecureContext
    ) {
      try {
        await navigator.clipboard.writeText(text);
        setExportFallback(null);
        showToast("对比摘要已复制", "success");
        return { ok: true, text };
      } catch {
        // fall through to manual textarea fallback
      }
    }
    // Non-secure context / permission denied → surface textarea for manual copy
    setExportFallback({ text });
    return { ok: false, text };
  }, [compareItems, compareSort, showToast]);

  const dismissExportFallback = useCallback(
    () => setExportFallback(null),
    [],
  );

  // ── Sorted compare items + DELTA-CENTS-0 ─────────────────────────────────
  const { compareItems, maxPrizeCents } = useMemo(() => {
    const matched = compareIds
      .map((id) => watchlist.find((w) => w.id === id))
      .filter(Boolean);
    const sorted = sortCompareItems(matched, compareSort);
    const validCents = sorted
      .map((i) => i.prizeCents)
      .filter((v) => v !== null && v !== undefined);
    const max = validCents.length > 0 ? Math.max(...validCents) : null;
    const withDelta = sorted.map((i) => ({
      ...i,
      deltaCents:
        i.prizeCents === null || i.prizeCents === undefined || max === null
          ? null
          : i.prizeCents - max,
    }));
    return { compareItems: withDelta, maxPrizeCents: max };
  }, [compareIds, watchlist, compareSort]);

  const isFull = watchlist.length >= MAX_WATCH;

  return {
    watchlist,
    isWatched,
    toggleWatch,
    removeFromWatchlist,
    clearWatchlist,
    compareIds,
    toggleCompare,
    clearCompare,
    startCompare,
    closeCompare,
    openPanel,
    closePanel,
    panelOpen,
    isCompareOpen,
    compareItems,
    maxPrizeCents,
    compareSort,
    setCompareSort,
    COMPARE_SORTS,
    isFull,
    storageError,
    toast,
    exportFallback,
    copyCompareSummary,
    dismissExportFallback,
    constants: {
      WATCHLIST_STORAGE_KEY,
      MAX_WATCH,
      COMPARE_MIN,
      COMPARE_MAX,
    },
  };
}
