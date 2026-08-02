// ─── HB-WATCHLIST-R1 · MID-6391(上限6 / 对比上限4 / 对比下限2) ─────────────────
// Freeze-v1={key:hb_hackathon_watch_v1,unit:cents,maxWatch:6,compareMin:2,compareMax:4,logicFile:useHackathonWatchlist.js}
// URL-SYNC-A: ?watch=1 面板；?watch=1&compare=id1,id2,...(2~4,逗号分隔,勾选序) 对比。
// DELTA-CENTS-0: 相对最高差值 = prizeCents - maxPrizeCents（最高行 0，null → —）。
// 逻辑层：localStorage 持久化、schema 校验、上限控制、toggle、排序、parsePrizeToCents、
//         URL 状态机、对比排序、差值计算。UI 层只消费本文件 API，不得复制其中算法。

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

// ─── 冻结常量（Freeze-v1，禁止变更） ──────────────────────────────────────────
export const WATCHLIST_KEY = "hb_hackathon_watch_v1";
export const MAX_WATCH = 6;    // MID-6391: 意向上限
export const COMPARE_MIN = 2;  // MID-6391: 对比下限
export const COMPARE_MAX = 4;  // MID-6391: 对比上限

// ─── 文案（附录-文案，禁止同义改写） ─────────────────────────────────────────
export const MESSAGES = {
  added: "已加入意向清单",
  removed: "已移出意向清单",
  full: "意向清单最多保存 6 个黑客松",
  incomplete: "活动数据不完整，无法加入意向清单",
  storageFail: "本地存储不可用，刷新后意向清单将丢失",
  compareMin: "请至少选择 2 个黑客松进行对比",
  compareMax: "最多只能选择 4 个黑客松进行对比",
  staleIds: "部分黑客松不在意向清单中",
  copied: "对比摘要已复制",
  manualCopy: "请手动复制",
};

// ─── 奖池解析状态机（附录 S0–S8） ────────────────────────────────────────────
// 单位：整数「分」(cents)。禁止 parseFloat 直接当分。
// "$50,000"→5000000 · "$12.34"→1234 · "USD 10k"→1000000 · "₹5,00,000"→50000000
// "<span>$1,000</span>"→100000 · "TBA"→null · "5000"→500000 · "$0"→0
export function parsePrizeToCents(prize) {
  // S0: 非 string 且非 number → null；number → 主单位×100
  if (typeof prize === "number") {
    return Number.isFinite(prize) ? Math.round(prize * 100) : null;
  }
  if (typeof prize !== "string") return null;

  // S1: trim（全空白 → null）
  let s = prize.trim();
  if (!s) return null;

  // S2: 剥 HTML 标签与实体
  s = s
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return null;

  // S3: 币种识别（$/USD 或 ₹/INR；跨币种仅相对参考，不影响分值换算）
  // 不强制要求币种符号：裸数字同样按主单位处理（"5000"→500000）。

  // S4–S6: 取首个可解析金额（"Prize: $8,000 + swag" → 8,000），识别 k/m 后缀，去全部逗号
  const withSuffix = s.match(/(\d[\d,]*(?:\.\d+)?)\s*([kKmM])(?![a-zA-Z])/);
  const plain = withSuffix || s.match(/(\d[\d,]*(?:\.\d+)?)/);
  if (!plain) return null;

  const main = Number(plain[1].replace(/,/g, "")); // S5 去逗号（含印度计数）+ S6 Number
  if (!Number.isFinite(main)) return null;

  // S7: 乘数（k=千，m=百万）
  const suffix = withSuffix ? withSuffix[2].toLowerCase() : null;
  const multiplier = suffix === "k" ? 1_000 : suffix === "m" ? 1_000_000 : 1;

  // S8: 主单位×100 → 整数分
  return Math.round(main * multiplier * 100);
}

// ─── Schema（附录-字段映射；logo 可不入库） ──────────────────────────────────
const ENTRY_KEYS = [
  "id", "title", "platform", "url", "mode", "status", "deadline",
  "prizeRaw", "prizeCents", "participants", "tags", "organizer", "featured", "addedAt",
];

function isValidEntry(e) {
  if (!e || typeof e !== "object") return false;
  if (!e.id || !e.title) return false;                    // id/title 空 → 丢弃
  if (typeof e.addedAt !== "number") return false;
  return ENTRY_KEYS.every((k) => k in e);                 // 缺字段丢弃
}

function buildEntry(h) {
  return {
    id: String(h.id),
    title: h.title,
    platform: h.platform ?? null,
    url: h.url ?? null,
    mode: h.mode ?? null,
    status: h.status ?? null,
    deadline: h.deadline ?? null,
    prizeRaw: h.prize ?? null,                            // prizeRaw ← prize
    prizeCents: parsePrizeToCents(h.prize),               // prizeCents ← parsePrizeToCents(prize)
    participants: h.participants ?? null,
    tags: Array.isArray(h.tags) ? h.tags : [],            // tags 默认 []
    organizer: h.organizer ?? null,
    featured: h.featured ?? false,                        // featured 默认 false
    addedAt: Date.now(),
  };
}

// ─── 对比排序（R2-B，仅展示：不写 URL/localStorage，不改 addedAt） ─────────────
// prize：分降序，null 沉底，同组 addedAt 降序
// deadline：可解析越近越前，非法沉底，同组 addedAt 降序
// participants：降序，null 沉底，同组 addedAt 降序
export const COMPARE_SORTS = [
  { id: "prize", label: "奖池分值", exportLabel: "按奖池分值" },
  { id: "deadline", label: "截止日期", exportLabel: "按截止日期" },
  { id: "participants", label: "参与人数", exportLabel: "按参与人数" },
];

function deadlineTime(d) {
  if (!d) return null;
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? null : t;
}

const byAddedAtDesc = (a, b) => b.addedAt - a.addedAt;

export function sortCompareItems(items, mode = "prize") {
  const arr = [...items];
  if (mode === "deadline") {
    return arr.sort((a, b) => {
      const ta = deadlineTime(a.deadline);
      const tb = deadlineTime(b.deadline);
      if (ta == null && tb == null) return byAddedAtDesc(a, b);
      if (ta == null) return 1;                       // 非法沉底
      if (tb == null) return -1;
      return ta - tb || byAddedAtDesc(a, b);          // 越近越前
    });
  }
  if (mode === "participants") {
    return arr.sort((a, b) => {
      const pa = a.participants;
      const pb = b.participants;
      if (pa == null && pb == null) return byAddedAtDesc(a, b);
      if (pa == null) return 1;                       // null 沉底
      if (pb == null) return -1;
      return pb - pa || byAddedAtDesc(a, b);          // 降序
    });
  }
  // 默认 prize：排序只用 prizeCents
  return arr.sort((a, b) => {
    if (a.prizeCents == null && b.prizeCents == null) return byAddedAtDesc(a, b);
    if (a.prizeCents == null) return 1;               // null 沉底
    if (b.prizeCents == null) return -1;
    return b.prizeCents - a.prizeCents || byAddedAtDesc(a, b);
  });
}

// R1 兼容导出：等价于 sortCompareItems(items, "prize")，单一排序实现
export function sortByPrizeCentsDesc(items) {
  return sortCompareItems(items, "prize");
}

// ─── 相对最高差值（DELTA-CENTS-0；禁止第二套 parse，只用已存 prizeCents） ──────
export function withDeltaCents(items) {
  const cents = items.map((i) => i.prizeCents).filter((v) => v != null);
  const max = cents.length > 0 ? Math.max(...cents) : null;
  return items.map((it) => ({
    ...it,
    deltaCents: it.prizeCents == null || max == null ? null : it.prizeCents - max, // 最高行恒为 0；null → —
  }));
}

// ─── URL-SYNC-A：compare 参数解析与校验（逗号分隔，去重保勾选序） ──────────────
export function parseCompareParam(raw) {
  if (raw == null) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i); // 去重，保持首次出现顺序（勾选序）
}

export function resolveCompareIds(ids, watchlist) {
  const known = new Set(watchlist.map((w) => w.id));
  const validIds = [];
  const invalidIds = [];
  for (const id of ids) {
    (known.has(id) ? validIds : invalidIds).push(id);
  }
  return { validIds, invalidIds };
}

// ─── R3 导出：对比摘要文本（口径与 Freeze-v1 / DELTA-CENTS-0 一致） ────────────
// 首行恰好【黑客松对比摘要】；行序 = 当前表格展示序；分隔符「 | 」；null → —；
// 排序中文名三选一（按奖池分值/按截止日期/按参与人数）。
export function buildCompareSummaryText(items, sortMode = "prize") {
  const sort = COMPARE_SORTS.find((s) => s.id === sortMode) || COMPARE_SORTS[0];
  const rows = items.map((it, i) =>
    [
      `${i + 1}. ${it.title ?? "—"}`,
      it.platform ?? "—",
      it.mode ?? "—",
      it.status ?? "—",
      `奖池:${it.prizeRaw ?? "—"}`,
      `分值:${it.prizeCents ?? "—"}`,
      `差值:${it.deltaCents ?? "—"}`,
    ].join(" | "),
  );
  return [
    "【黑客松对比摘要】",
    `生成时间: ${new Date().toISOString()}`,
    `条目数: ${items.length}`,
    `排序: ${sort.exportLabel}`,
    "----",
    ...rows,
  ].join("\n");
}

// Clipboard API 写入；无权限/非安全上下文 → false（禁 clipboard.js）
async function writeClipboard(text) {
  try {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// 降级：只读 textarea + select()，提示「请手动复制」
function openManualCopyFallback(text) {
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:95;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;padding:16px;";
  const box = document.createElement("div");
  box.style.cssText =
    "width:100%;max-width:560px;background:#0b1220;border:1px solid rgba(255,255,255,0.12);border-radius:16px;padding:16px;";
  const hint = document.createElement("p");
  hint.textContent = "请手动复制";
  hint.style.cssText = "color:#fbbf24;font-size:13px;font-weight:700;margin:0 0 8px;";
  const ta = document.createElement("textarea");
  ta.readOnly = true;
  ta.value = text;
  ta.rows = 12;
  ta.style.cssText =
    "width:100%;box-sizing:border-box;background:rgba(255,255,255,0.04);color:#e2e8f0;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px;font-size:12px;font-family:monospace;resize:vertical;";
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = "关闭";
  closeBtn.style.cssText =
    "margin-top:10px;padding:6px 14px;border-radius:10px;background:rgba(255,255,255,0.06);color:#94a3b8;border:1px solid rgba(255,255,255,0.1);font-size:12px;font-weight:600;cursor:pointer;";
  const cleanup = () => overlay.remove();
  closeBtn.addEventListener("click", cleanup);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) cleanup();
  });
  box.append(hint, ta, closeBtn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  ta.focus();
  ta.select();
}

// ─── 安全日期格式化（deadline 非法不崩） ─────────────────────────────────────
export function formatDeadlineSafe(deadline) {
  if (!deadline) return "TBA";
  const t = new Date(deadline);
  if (Number.isNaN(t.getTime())) return "TBA";
  return t.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ─── 存储读取：坏 JSON 重置 []；缺字段丢弃；按 addedAt 降序 ────────────────────
function loadWatchlist() {
  try {
    const raw = window.localStorage.getItem(WATCHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry).sort((a, b) => b.addedAt - a.addedAt);
  } catch {
    return []; // 坏 JSON → []
  }
}

// localStorage 可用性探测（临时模式 = 内存降级，刷新可丢）
function detectPersistence() {
  try {
    const probe = "__hb_watch_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export default function useHackathonWatchlist() {
  const [watchlist, setWatchlist] = useState(loadWatchlist);
  const [selectedIds, setSelectedIds] = useState([]);
  const [notice, setNotice] = useState(null); // { text, kind } | null
  const [isPersistent, setIsPersistent] = useState(detectPersistence);
  // R2-B 排序：仅内存展示状态，不写 URL / localStorage
  const [compareSort, setCompareSort] = useState("prize");
  const noticeTimer = useRef(null);

  // ── URL-SYNC-A：S_idle 无 query / S_panel 仅 watch=1 / S_compare 含 compare ──
  // watch 只认 =1；使用 react-router searchParams，不用 hash
  const [searchParams, setSearchParams] = useSearchParams();
  const watchParam = searchParams.get("watch");
  const compareRaw = searchParams.get("compare");
  const panelOpen = watchParam === "1" || compareRaw != null;

  const notify = useCallback((text, kind = "info") => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice({ text, kind, id: Date.now() });
    noticeTimer.current = setTimeout(() => setNotice(null), 2600);
  }, []);

  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);

  // 唯一写库入口：Explorer / 卡片 / 面板均不得直接 setItem
  const commit = useCallback(
    (next) => {
      const sorted = [...next].sort((a, b) => b.addedAt - a.addedAt); // addedAt 降序
      setWatchlist(sorted);
      try {
        window.localStorage.setItem(WATCHLIST_KEY, JSON.stringify(sorted));
      } catch {
        setIsPersistent(false); // 内存降级：面板显示临时提示
        notify(MESSAGES.storageFail, "error");
      }
    },
    [notify],
  );

  const isWatched = useCallback(
    (id) => id != null && watchlist.some((w) => w.id === String(id)),
    [watchlist],
  );

  // 同 id toggle：在 → 移出；不在 → 校验后加入（满 6 拒绝）
  const toggleWatch = useCallback(
    (hackathon) => {
      const id = hackathon?.id != null ? String(hackathon.id) : null;
      const existing = id ? watchlist.find((w) => w.id === id) : undefined;

      if (existing) {
        commit(watchlist.filter((w) => w.id !== existing.id));
        setSelectedIds((prev) => prev.filter((x) => x !== existing.id));
        notify(MESSAGES.removed, "info");
        return;
      }
      if (!id || !hackathon?.title) {
        notify(MESSAGES.incomplete, "warn"); // 活动数据不完整，无法加入意向清单
        return;
      }
      if (watchlist.length >= MAX_WATCH) {
        notify(MESSAGES.full, "warn"); // 第 7 条：意向清单最多保存 6 个黑客松
        return;
      }
      commit([buildEntry(hackathon), ...watchlist]);
      notify(MESSAGES.added, "info");
    },
    [watchlist, commit, notify],
  );

  const clearWatchlist = useCallback(() => {
    commit([]);
    setSelectedIds([]);
  }, [commit]);

  // 对比勾选：最多 4（第 5 个勾选拒绝并提示）
  const toggleCompare = useCallback(
    (id) => {
      const sid = String(id);
      if (selectedIds.includes(sid)) {
        setSelectedIds(selectedIds.filter((x) => x !== sid));
        return;
      }
      if (selectedIds.length >= COMPARE_MAX) {
        notify(MESSAGES.compareMax, "warn"); // 最多只能选择 4 个黑客松进行对比
        return;
      }
      setSelectedIds([...selectedIds, sid]);
    },
    [selectedIds, notify],
  );

  // ── URL 动作（URL 为面板/对比开关的唯一事实源） ────────────────────────────
  const openPanel = useCallback(() => {
    setSearchParams({ watch: "1" });
  }, [setSearchParams]);

  const closeAll = useCallback(() => {
    setSearchParams({}); // 关面板全清
  }, [setSearchParams]);

  const closeCompare = useCallback(() => {
    setSearchParams({ watch: "1" }); // 关对比留面板删 compare
  }, [setSearchParams]);

  // 面板「开始对比」：先在本地校验勾选（保证 R1 文案），合法才写 URL
  const openCompareFromSelection = useCallback(() => {
    const known = new Set(watchlist.map((w) => w.id));
    const valid = selectedIds.filter((id) => known.has(id));
    if (valid.length !== selectedIds.length) {
      setSelectedIds(valid);
      notify(MESSAGES.staleIds, "warn"); // 部分黑客松不在意向清单中
    }
    if (valid.length < COMPARE_MIN) {
      notify(MESSAGES.compareMin, "warn"); // 请至少选择 2 个黑客松进行对比
      return;
    }
    if (valid.length > COMPARE_MAX) {
      notify(MESSAGES.compareMax, "warn");
      return;
    }
    setSearchParams({ watch: "1", compare: valid.join(",") }); // compare 顺序 = 勾选序
  }, [watchlist, selectedIds, notify, setSearchParams]);

  // ── URL → 派生：解析 compare 参数并对照当前意向清单（内存降级时同样生效） ────
  const compareIdsFromUrl = useMemo(() => parseCompareParam(compareRaw), [compareRaw]);
  const { validIds: compareValidIds, invalidIds: compareInvalidIds } = useMemo(
    () => resolveCompareIds(compareIdsFromUrl, watchlist),
    [compareIdsFromUrl, watchlist],
  );
  // 非法 compare（有效 <2 或 >4）不得进对比
  const compareActive =
    compareRaw != null &&
    compareValidIds.length >= COMPARE_MIN &&
    compareValidIds.length <= COMPARE_MAX;
  const activeCompareIds = compareActive ? compareValidIds : [];

  // 对比条目：表格序由排序模式决定（可与 URL 勾选序不同），并附差值
  const compareItems = useMemo(() => {
    if (!compareActive) return null;
    const items = watchlist.filter((w) => compareValidIds.includes(w.id));
    return withDeltaCents(sortCompareItems(items, compareSort));
  }, [compareActive, compareValidIds, watchlist, compareSort]);

  // ── R3 导出对比摘要：逻辑层持有，UI 只触发 ─────────────────────────────────
  // 行序 = 当前表格展示序（compareItems 已按 compareSort 排序并附差值）
  const exportCompareSummary = useCallback(async () => {
    if (!compareItems || compareItems.length === 0) return;
    const text = buildCompareSummaryText(compareItems, compareSort);
    const ok = await writeClipboard(text);
    if (ok) {
      notify(MESSAGES.copied, "info"); // 对比摘要已复制
    } else {
      openManualCopyFallback(text);    // 只读 textarea + 请手动复制 + select()
      notify(MESSAGES.manualCopy, "warn");
    }
  }, [compareItems, compareSort, notify]);

  // ── R3 对比行移出：从意向清单删 id（单一数据源），同步重算 compare URL ──────
  // 剩余 <2 → 删 compare 留 watch=1 自动回面板；不残留失效 compare
  const removeFromCompare = useCallback(
    (id) => {
      const sid = String(id);
      if (!watchlist.some((w) => w.id === sid)) return;
      commit(watchlist.filter((w) => w.id !== sid));
      setSelectedIds((prev) => prev.filter((x) => x !== sid));
      notify(MESSAGES.removed, "info"); // 已移出意向清单
      if (compareRaw != null) {
        const nextIds = compareValidIds.filter((x) => x !== sid);
        if (nextIds.length >= COMPARE_MIN && nextIds.length <= COMPARE_MAX) {
          setSearchParams({ watch: "1", compare: nextIds.join(",") }, { replace: true });
        } else {
          setSearchParams({ watch: "1" }, { replace: true });
        }
      }
    },
    [watchlist, commit, notify, compareRaw, compareValidIds, setSearchParams],
  );

  // ── URL 清理：无效 id 只 toast 一次（按签名去重），并清理 URL ───────────────
  const compareGuardRef = useRef(null);
  useEffect(() => {
    if (compareRaw == null) {
      compareGuardRef.current = null;
      return;
    }
    const sig = `${compareRaw}|${compareInvalidIds.join(",")}|${compareValidIds.length}`;
    if (compareGuardRef.current === sig) return;
    compareGuardRef.current = sig;

    if (compareInvalidIds.length > 0) {
      notify(MESSAGES.staleIds, "warn"); // 部分黑客松不在意向清单中
    }
    if (compareValidIds.length > COMPARE_MAX) {
      notify(MESSAGES.compareMax, "warn");
      setSearchParams({ watch: "1" }, { replace: true });
      return;
    }
    if (compareValidIds.length < COMPARE_MIN) {
      setSearchParams({ watch: "1" }, { replace: true }); // 有效<2 回面板留 watch=1
      return;
    }
    if (compareInvalidIds.length > 0) {
      // 清理 URL 中的无效 id，保留有效部分继续对比
      setSearchParams(
        { watch: "1", compare: compareValidIds.join(",") },
        { replace: true },
      );
    }
  }, [compareRaw, compareValidIds, compareInvalidIds, notify, setSearchParams]);

  // ── 深链/刷新恢复：URL compare → 同步面板勾选（勾选序） ─────────────────────
  const compareSyncRef = useRef(null);
  useEffect(() => {
    if (compareRaw == null) {
      compareSyncRef.current = null;
      return;
    }
    if (compareSyncRef.current === compareRaw) return;
    compareSyncRef.current = compareRaw;
    if (compareValidIds.length >= COMPARE_MIN) {
      setSelectedIds(compareValidIds);
    }
  }, [compareRaw, compareValidIds]);

  return {
    watchlist,
    count: watchlist.length,
    isFull: watchlist.length >= MAX_WATCH,
    isPersistent,
    isWatched,
    toggleWatch,
    clearWatchlist,
    selectedIds,
    toggleCompare,
    notice,
    // URL-SYNC-A
    panelOpen,
    openPanel,
    closeAll,
    closeCompare,
    openCompareFromSelection,
    compareActive,
    activeCompareIds,
    compareItems,
    // R2-B 排序（仅展示）
    compareSort,
    setCompareSort,
    // R3 导出 + 行移出
    exportCompareSummary,
    removeFromCompare,
  };
}
