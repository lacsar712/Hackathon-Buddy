import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// Hackathon Watchlist — LOGIC LAYER (no JSX here)
//
// Freeze-v1 contract (代号 HB-WATCHLIST-R1, MID-6391):
//   { key: hb_hackathon_watch_v1, unit: cents, maxWatch: 6, compareMin: 2,
//     compareMax: 4, logicFile: useHackathonWatchlist.js }
//
// R2 增量 (URL-SYNC-A / DELTA-CENTS-0)：
//   - URL 状态机 useWatchlistUrl（react-router searchParams，不用 hash）
//   - 展示排序 sortForDisplay（仅展示，不写 URL/localStorage，不改 addedAt）
//   - 相对最高差值 computeDeltaToMax（deltaCents = prizeCents - maxPrizeCents）
//   业务规则一律留在本文件；UI 层只渲染，禁止复制规则。
// ─────────────────────────────────────────────────────────────────────────────

export const WATCHLIST_KEY = "hb_hackathon_watch_v1"; // 键名必须精确，禁止变体
export const MAX_WATCH = 6;
export const COMPARE_MIN = 2;
export const COMPARE_MAX = 4;

// 文案（禁止同义改写）
export const MESSAGES = {
  addOk: "已加入意向清单",
  removeOk: "已移出意向清单",
  full: "意向清单最多保存 6 个黑客松",
  incomplete: "活动数据不完整，无法加入意向清单",
  storageFail: "本地存储不可用，刷新后意向清单将丢失",
  notInList: "部分黑客松不在意向清单中",
  compareTooFew: "请至少选择 2 个黑客松进行对比",
  compareTooMany: "最多只能选择 4 个黑客松进行对比",
  exportOk: "对比摘要已复制",
  exportManual: "无法自动复制，请手动复制",
};

// ─── parsePrizeToCents ────────────────────────────────────────────────────────
// 输出整数「分」(cents)。附录状态机 S0–S8。禁止 parseFloat 直接当分。
//   S0 非 string 且非 number → null；number = 主单位 × 100
//   S1 trim
//   S2 去标签与实体（先剥 HTML）
//   S3 币种（$/USD 或 ₹/INR，仅相对参考，不作为过滤门槛）
//   S4 k/m 乘数
//   S5 去逗号（含印度计数全部逗号）
//   S6 Number
//   S7 乘数
//   S8 Math.round(main * 100)
export function parsePrizeToCents(input) {
  // S0
  if (typeof input === "number") {
    if (!Number.isFinite(input)) return null;
    return Math.round(input * 100);
  }
  if (typeof input !== "string") return null;

  // S1
  let s = input.trim();
  if (!s) return null;

  // S2 — strip HTML tags + decode common entities
  s = s
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return null; // 全空白 → null

  // S3 (currency is only a relative-reference hint; no hard filtering here)
  // Locate the FIRST parseable amount (e.g. "Prize: $8,000 + swag" → 8,000).
  const match = s.match(/(\d[\d,]*(?:\.\d+)?)\s*([kKmM])?/);
  if (!match) return null; // "TBA" 等无数字 → null

  // S5 — drop all commas ($ + ₹ Indian grouping)
  const numStr = match[1].replace(/,/g, "");
  // S6
  const main = Number(numStr);
  if (!Number.isFinite(main)) return null;

  // S4 / S7 — k / m multiplier
  let mult = 1;
  const suffix = (match[2] || "").toLowerCase();
  if (suffix === "k") mult = 1000;
  else if (suffix === "m") mult = 1000000;

  // S8
  return Math.round(main * mult * 100);
}

// ─── schema ─────────────────────────────────────────────────────────────────
// 字段: id,title,platform,url,mode,status,deadline,prizeRaw,prizeCents,
//        participants,tags,organizer,featured,addedAt
// prizeRaw ← prize；prizeCents ← parsePrizeToCents(prize)
function buildEntry(h) {
  return {
    id: h.id,
    title: h.title,
    platform: h.platform ?? null,
    url: h.url ?? null,
    mode: h.mode ?? null,
    status: h.status ?? null,
    deadline: h.deadline ?? null,
    prizeRaw: h.prize ?? null,
    prizeCents: parsePrizeToCents(h.prize),
    participants: typeof h.participants === "number" ? h.participants : null,
    tags: Array.isArray(h.tags) ? h.tags : [],
    organizer: h.organizer ?? null,
    featured: !!h.featured,
    addedAt: typeof h.addedAt === "number" ? h.addedAt : Date.now(),
  };
}

// 读回存储时净化：id/title 缺失即丢弃，其余字段补默认值。
function sanitizeStored(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (!raw.id || !raw.title) return null; // 缺字段丢弃
  return {
    id: raw.id,
    title: raw.title,
    platform: raw.platform ?? null,
    url: raw.url ?? null,
    mode: raw.mode ?? null,
    status: raw.status ?? null,
    deadline: raw.deadline ?? null,
    prizeRaw: raw.prizeRaw ?? null,
    prizeCents:
      typeof raw.prizeCents === "number"
        ? raw.prizeCents
        : parsePrizeToCents(raw.prizeRaw),
    participants: typeof raw.participants === "number" ? raw.participants : null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    organizer: raw.organizer ?? null,
    featured: !!raw.featured,
    addedAt: typeof raw.addedAt === "number" ? raw.addedAt : Date.now(),
  };
}

// addedAt 降序（新加入置顶）
function sortByAddedDesc(list) {
  return [...list].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
}

// 对比排序：prizeCents 降序，null 沉底。排序只用 prizeCents。
export function sortByPrizeCentsDesc(list) {
  return [...list].sort((a, b) => {
    const av = a.prizeCents;
    const bv = b.prizeCents;
    if (av == null && bv == null) return 0;
    if (av == null) return 1; // null 沉底
    if (bv == null) return -1;
    return bv - av;
  });
}

// ─── R2 展示排序 (仅展示；不写 URL/localStorage，不改 addedAt) ──────────────────
// 三种模式：
//   "prize"        奖池分值降序，null 沉底，同组按 addedAt 降序
//   "deadline"     可解析越近越前，非法/缺失沉底
//   "participants" 参与人数降序，null 沉底
export const DISPLAY_SORTS = [
  { id: "prize", label: "奖池分值降序" },
  { id: "deadline", label: "截止日期更近优先" },
  { id: "participants", label: "参与人数降序" },
];

function deadlineMs(d) {
  if (!d) return null;
  const t = new Date(d).getTime();
  return Number.isFinite(t) ? t : null; // 非法沉底
}

export function sortForDisplay(list, mode) {
  const arr = [...list];
  if (mode === "deadline") {
    return arr.sort((a, b) => {
      const at = deadlineMs(a.deadline);
      const bt = deadlineMs(b.deadline);
      if (at == null && bt == null) return (b.addedAt || 0) - (a.addedAt || 0);
      if (at == null) return 1; // 非法/缺失沉底
      if (bt == null) return -1;
      return at - bt; // 越近越前
    });
  }
  if (mode === "participants") {
    return arr.sort((a, b) => {
      const av = typeof a.participants === "number" ? a.participants : null;
      const bv = typeof b.participants === "number" ? b.participants : null;
      if (av == null && bv == null) return (b.addedAt || 0) - (a.addedAt || 0);
      if (av == null) return 1; // null 沉底
      if (bv == null) return -1;
      return bv - av; // 降序
    });
  }
  // 默认 "prize"：分降序，null 沉底，同组 addedAt 降序
  return arr.sort((a, b) => {
    const av = a.prizeCents;
    const bv = b.prizeCents;
    if (av == null && bv == null) return (b.addedAt || 0) - (a.addedAt || 0);
    if (av == null) return 1;
    if (bv == null) return -1;
    if (bv !== av) return bv - av;
    return (b.addedAt || 0) - (a.addedAt || 0);
  });
}

// ─── R2 相对最高差值 (DELTA-CENTS-0) ─────────────────────────────────────────
// deltaCents = prizeCents - maxPrizeCents；最高行 = 0；prizeCents 为 null → null(展示 —)
// 全 null 则 max 为 null，所有行 delta 均为 null（展示全 —）。禁百分比与美元符号。
// 复用同一 prizeCents，禁止第二套 parse。
export function computeDeltaToMax(items) {
  const cents = items
    .map((h) => h.prizeCents)
    .filter((v) => typeof v === "number");
  const maxCents = cents.length ? Math.max(...cents) : null;
  const deltas = {};
  for (const h of items) {
    deltas[h.id] =
      typeof h.prizeCents === "number" && maxCents != null
        ? h.prizeCents - maxCents
        : null;
  }
  return { maxCents, deltas };
}

// ─── R3 导出对比摘要 (逻辑层；UI 只触发) ──────────────────────────────────────
// 排序中文名三选一，不可自由发挥。
export const SORT_EXPORT_LABEL = {
  prize: "按奖池分值",
  deadline: "按截止日期",
  participants: "按参与人数",
};

// null 用「—」；分隔符固定「 | 」；行序 = 传入 rows 的当前展示序。
// 差值口径复用 DELTA-CENTS-0（computeDeltaToMax），禁止第二套 parse / 百分比。
export function buildCompareSummary(rows, sortMode) {
  const { deltas } = computeDeltaToMax(rows);
  const dash = "—";
  const sortLabel = SORT_EXPORT_LABEL[sortMode] || SORT_EXPORT_LABEL.prize;
  const header = [
    "【黑客松对比摘要】",
    `生成时间: ${new Date().toISOString()}`,
    `条目数: ${rows.length}`,
    `排序: ${sortLabel}`,
    "----",
  ];
  const lines = rows.map((h, i) => {
    const delta = deltas[h.id];
    const parts = [
      h.title ?? dash,
      h.platform ?? dash,
      h.mode ?? dash,
      h.status ?? dash,
      `奖池:${h.prizeRaw ?? dash}`,
      `分值:${typeof h.prizeCents === "number" ? h.prizeCents : dash}`,
      `差值:${typeof delta === "number" ? delta : dash}`,
    ];
    return `${i + 1}. ${parts.join(" | ")}`;
  });
  return [...header, ...lines].join("\n");
}

// 复制到剪贴板：优先 Clipboard API；无权限 / 非安全上下文则回退 textarea + select()。
// 禁 clipboard.js。返回 { ok, method }。
export async function copyText(text) {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function" &&
    (typeof window === "undefined" || window.isSecureContext)
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true, method: "clipboard" };
    } catch {
      /* 落到 textarea 回退 */
    }
  }
  // 回退：只读 textarea + select()
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    document.body.removeChild(ta);
    return { ok, method: "textarea" };
  } catch {
    return { ok: false, method: "textarea" };
  }
}

function loadFromStorage() {
  let raw;
  try {
    raw = localStorage.getItem(WATCHLIST_KEY);
  } catch {
    return [];
  }
  if (!raw) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // 坏 JSON 重置 []
    try {
      localStorage.setItem(WATCHLIST_KEY, "[]");
    } catch {
      /* ignore */
    }
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const clean = parsed.map(sanitizeStored).filter(Boolean);
  return sortByAddedDesc(clean);
}

// 对比数量校验（区间 2~4）
export function checkCompareCount(count) {
  if (count < COMPARE_MIN) return { ok: false, message: MESSAGES.compareTooFew };
  if (count > COMPARE_MAX) return { ok: false, message: MESSAGES.compareTooMany };
  return { ok: true, message: "" };
}

// ─── hook ──────────────────────────────────────────────────────────────────
export function useHackathonWatchlist() {
  const [watchlist, setWatchlist] = useState(loadFromStorage);
  const [toast, setToast] = useState(null); // { id, message, type }
  const toastSeq = useRef(0);
  const toastTimer = useRef(null);

  const notify = useCallback((message, type = "info") => {
    toastSeq.current += 1;
    setToast({ id: toastSeq.current, message, type });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  // toast 自动消失
  useEffect(() => {
    if (!toast) return;
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(toastTimer.current);
  }, [toast]);

  // 唯一的写入点（禁止在 Explorer 内 setItem）
  const persist = useCallback(
    (next) => {
      setWatchlist(next);
      try {
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
      } catch {
        notify(MESSAGES.storageFail, "error");
      }
    },
    [notify]
  );

  const isWatched = useCallback(
    (id) => watchlist.some((x) => x.id === id),
    [watchlist]
  );

  // 同 id → 移出；否则加入（受上限约束）
  const toggle = useCallback(
    (h) => {
      if (!h || !h.id || !h.title) {
        notify(MESSAGES.incomplete, "error");
        return;
      }
      if (watchlist.some((x) => x.id === h.id)) {
        persist(watchlist.filter((x) => x.id !== h.id));
        notify(MESSAGES.removeOk, "info");
        return;
      }
      if (watchlist.length >= MAX_WATCH) {
        notify(MESSAGES.full, "error");
        return;
      }
      persist(sortByAddedDesc([buildEntry(h), ...watchlist]));
      notify(MESSAGES.addOk, "success");
    },
    [watchlist, persist, notify]
  );

  const remove = useCallback(
    (id) => {
      if (!watchlist.some((x) => x.id === id)) {
        notify(MESSAGES.notInList, "error");
        return;
      }
      persist(watchlist.filter((x) => x.id !== id));
      notify(MESSAGES.removeOk, "info");
    },
    [watchlist, persist, notify]
  );

  const clear = useCallback(() => {
    persist([]);
  }, [persist]);

  return {
    watchlist,
    count: watchlist.length,
    isFull: watchlist.length >= MAX_WATCH,
    isWatched,
    toggle,
    remove,
    clear,
    toast,
    notify,
    dismissToast,
    MAX_WATCH,
    COMPARE_MIN,
    COMPARE_MAX,
    MESSAGES,
    checkCompareCount,
    sortByPrizeCentsDesc,
  };
}

// ─── R2 URL 状态机 (URL-SYNC-A) ──────────────────────────────────────────────
// searchParams（react-router，不用 hash）：
//   S_idle    : 无 query
//   S_panel   : 仅 watch=1
//   S_compare : watch=1 & compare=id1,id2,...（2~4，逗号分隔，勾选序）
// watch 只认 =1；关对比删 compare 留 watch=1；关面板全清。
// 深链恢复：compare 顺序 = 勾选序；无效 id 统一提示一次并清理 URL；
// 有效 <2 回退面板（留 watch=1）；非法 compare 不得进对比。
export function useWatchlistUrl({ watchlist, notify, checkCompareCount }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawWatch = searchParams.get("watch");
  const rawCompare = searchParams.get("compare");

  // watch 只认 "1"
  const panelOpen = rawWatch === "1";

  // 解析 compare（保序 + 去重），并按 watchlist 校验有效性
  const parsed = useMemo(() => {
    if (!panelOpen || !rawCompare) {
      return { requested: [], valid: [], hadInvalid: false };
    }
    const seen = new Set();
    const requested = [];
    for (const part of rawCompare.split(",")) {
      const id = part.trim();
      if (id && !seen.has(id)) {
        seen.add(id);
        requested.push(id);
      }
    }
    const known = new Set(watchlist.map((h) => h.id));
    const valid = requested.filter((id) => known.has(id)); // 保留勾选序
    const hadInvalid = requested.some((id) => !known.has(id));
    return { requested, valid, hadInvalid };
  }, [panelOpen, rawCompare, watchlist]);

  // compare 是否成立（2~4 且全有效）。非法 compare 不得进对比。
  const compareActive =
    panelOpen &&
    !parsed.hadInvalid &&
    checkCompareCount(parsed.valid.length).ok;

  // 按勾选序取出对比项
  const compareItems = useMemo(() => {
    if (!compareActive) return [];
    const byId = new Map(watchlist.map((h) => [h.id, h]));
    return parsed.valid.map((id) => byId.get(id)).filter(Boolean);
  }, [compareActive, parsed.valid, watchlist]);

  // URL → 状态 归一化：无效 id 提示一次并清理；有效不足 2 回退面板
  const notifiedRef = useRef(false);
  useEffect(() => {
    if (!panelOpen || !rawCompare) {
      notifiedRef.current = false;
      return;
    }
    if (parsed.hadInvalid) {
      if (!notifiedRef.current) {
        notify(MESSAGES.notInList, "error"); // 只 toast 一次
        notifiedRef.current = true;
      }
      // 清理 compare，留 watch=1
      setSearchParams({ watch: "1" }, { replace: true });
      return;
    }
    notifiedRef.current = false;
    // 全有效但数量不足 2 → 回面板（删 compare 留 watch=1）
    if (!checkCompareCount(parsed.valid.length).ok) {
      setSearchParams({ watch: "1" }, { replace: true });
    }
  }, [panelOpen, rawCompare, parsed.hadInvalid, parsed.valid.length, notify, checkCompareCount, setSearchParams]);

  // 命令式动作（供 UI 调用，UI 不直接拼 query）
  const openPanel = useCallback(() => {
    setSearchParams({ watch: "1" });
  }, [setSearchParams]);

  const closePanel = useCallback(() => {
    setSearchParams({}); // 关面板全清
  }, [setSearchParams]);

  const openCompare = useCallback(
    (ids) => {
      const list = Array.isArray(ids) ? ids : [];
      const check = checkCompareCount(list.length);
      if (!check.ok) {
        notify(check.message, "error");
        return;
      }
      setSearchParams({ watch: "1", compare: list.join(",") });
    },
    [setSearchParams, checkCompareCount, notify]
  );

  const closeCompare = useCallback(() => {
    setSearchParams({ watch: "1" }); // 关对比留面板删 compare
  }, [setSearchParams]);

  // R3 对比行移出意向：单一数据源删除 + 同批更新 compare。
  // 剩余 >=2 → 保留剩余(勾选序)；剩余 <2 → 删 compare 留 watch=1（回面板）。
  // 与 removeFromWatchlist 同批 setState，避免触发 hadInvalid 的 notInList 提示。
  const removeFromCompare = useCallback(
    (id, removeFromWatchlist) => {
      const remaining = parsed.valid.filter((x) => x !== id);
      removeFromWatchlist(id); // 单一数据源：从意向清单删除
      if (checkCompareCount(remaining.length).ok) {
        setSearchParams({ watch: "1", compare: remaining.join(",") });
      } else {
        setSearchParams({ watch: "1" }); // <2 回面板
      }
    },
    [parsed.valid, setSearchParams, checkCompareCount]
  );

  return {
    panelOpen,
    compareActive,
    compareItems,
    compareIds: parsed.valid,
    openPanel,
    closePanel,
    openCompare,
    closeCompare,
    removeFromCompare,
  };
}

export default useHackathonWatchlist;
