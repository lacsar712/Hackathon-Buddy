import { useMemo, useState } from "react";
import {
  sortForDisplay,
  computeDeltaToMax,
  DISPLAY_SORTS,
  buildCompareSummary,
  copyText,
  MESSAGES,
} from "../hooks/useHackathonWatchlist";

// ─────────────────────────────────────────────────────────────────────────────
// HackathonCompareView — UI LAYER (pure render, no localStorage, no URL logic)
// 手写轻量表格；奖池横向对比。
// 表头: 活动名称|平台|模式|状态|截止日期|参与人数|奖池文案|奖池分值|相对最高差值|标签摘要
// 展示排序仅影响行序（sortForDisplay，来自逻辑层）；不写 URL/localStorage。
// 相对最高差值来自逻辑层 computeDeltaToMax（DELTA-CENTS-0）。
// ─────────────────────────────────────────────────────────────────────────────

function formatDeadline(deadline) {
  if (!deadline) return "TBA";
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return "TBA"; // deadline 非法不崩
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// prizeCents（整数分）→ 展示用主单位文案，仅相对参考
function formatCents(cents) {
  if (cents == null) return "—";
  const main = cents / 100;
  return main.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

// 差值展示：整数「分」；最高行 0；null → —。禁百分比与美元符号。
function formatDelta(delta) {
  if (delta == null) return "—";
  if (delta === 0) return "0";
  return `${delta} 分`; // delta 为负值，保留符号
}

function tagSummary(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return "—";
  const head = tags.slice(0, 3).join(", ");
  return tags.length > 3 ? `${head} +${tags.length - 3}` : head;
}

const COLS = [
  "活动名称",
  "平台",
  "模式",
  "状态",
  "截止日期",
  "参与人数",
  "奖池文案",
  "奖池分值",
  "相对最高差值",
  "标签摘要",
  "操作",
];

export default function HackathonCompareView({ items = [], onClose, onRemoveRow, notify }) {
  const [sortMode, setSortMode] = useState("prize"); // 默认奖池分值降序
  const [manualText, setManualText] = useState(null); // 回退：手动复制文本

  // 差值基于整个对比集合（与展示行序无关）
  const { deltas } = useMemo(() => computeDeltaToMax(items), [items]);

  // 展示排序：仅影响行序
  const rows = useMemo(() => sortForDisplay(items, sortMode), [items, sortMode]);

  // 导出：文本由逻辑层生成（行序 = 当前表格展示序），UI 只触发复制
  const handleExport = async () => {
    const text = buildCompareSummary(rows, sortMode);
    const res = await copyText(text);
    if (res.ok && res.method === "clipboard") {
      notify?.(MESSAGES.exportOk, "success");
      setManualText(null);
    } else if (res.ok) {
      // execCommand 成功也算已复制
      notify?.(MESSAGES.exportOk, "success");
      setManualText(null);
    } else {
      // 无权限 / 非安全上下文：展示只读 textarea 供手动复制
      notify?.(MESSAGES.exportManual, "error");
      setManualText(text);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" style={{ background: "rgba(2,8,23,0.85)", backdropFilter: "blur(8px)" }}>
      <div
        className="w-full max-w-6xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 gap-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <h2 className="text-lg font-extrabold text-white">奖池对比</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {rows.length} 个黑客松 · 差值 = 各行奖池分值 − 最高奖池分值（最高为 0）
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* 展示排序（仅影响行序，不写 URL/localStorage） */}
            <select
              value={sortMode}
              onChange={(e) => {
                setSortMode(e.target.value);
                setManualText(null); // 排序改变 → 清理过期的手动复制快照，避免顺序/排序名不一致
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold outline-none"
              style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}
              title="展示排序"
            >
              {DISPLAY_SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  排序：{s.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-[1.03]"
              style={{ background: "linear-gradient(135deg, #3770FF, #7c3aed)" }}
              title="导出对比摘要"
            >
              📋 导出摘要
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              title="关闭"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0" style={{ background: "#0b1424" }}>
              <tr>
                {COLS.map((c) => (
                  <th
                    key={c}
                    className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400 whitespace-nowrap ${c === "奖池分值" ? "text-emerald-400" : ""}`}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((h, i) => {
                const delta = deltas[h.id];
                return (
                  <tr
                    key={h.id}
                    className="transition-colors hover:bg-white/[0.03]"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}
                  >
                    <td className="px-4 py-3 font-semibold text-white max-w-[220px]">
                      <span className="line-clamp-2">{h.title}</span>
                      {h.organizer && <span className="block text-xs text-slate-500 font-normal mt-0.5">by {h.organizer}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{h.platform || "—"}</td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{h.mode || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-slate-300">{h.status || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{formatDeadline(h.deadline)}</td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      {typeof h.participants === "number" ? h.participants.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{h.prizeRaw || "—"}</td>
                    <td className="px-4 py-3 font-bold text-emerald-400 whitespace-nowrap">
                      {formatCents(h.prizeCents)}
                      {h.prizeCents != null && <span className="text-[10px] text-slate-500 font-normal ml-1">·{h.prizeCents} 分</span>}
                    </td>
                    <td
                      className="px-4 py-3 font-semibold whitespace-nowrap"
                      style={{ color: delta === 0 ? "#34d399" : delta == null ? "#64748b" : "#f59e0b" }}
                    >
                      {formatDelta(delta)}
                    </td>
                    <td className="px-4 py-3 text-slate-400 max-w-[200px]">
                      <span className="line-clamp-2">{tagSummary(h.tags)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => onRemoveRow?.(h.id)}
                        className="text-xs px-2 py-1 rounded-md font-semibold transition-colors"
                        style={{ color: "#f87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}
                        title="移出意向"
                      >
                        移出意向
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 回退：无权限/非安全上下文，展示只读 textarea 供手动复制 */}
        {manualText != null && (
          <div className="px-6 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] text-amber-400 mb-1.5">无法自动复制，请手动复制以下内容：</p>
            <textarea
              readOnly
              value={manualText}
              onFocus={(e) => e.target.select()}
              className="w-full h-32 rounded-lg text-xs text-slate-200 p-3 font-mono outline-none"
              style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
        )}

        <div className="px-6 py-3 text-[11px] text-slate-600" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          奖池分值与差值均为整数「分」，跨币种（$ / ₹）仅作相对参考。
        </div>
      </div>
    </div>
  );
}
