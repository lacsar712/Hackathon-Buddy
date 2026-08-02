// ─── HB-WATCHLIST-R1 · UI 层：奖池横向对比视图 ───────────────────────────────
// items 由逻辑层（useHackathonWatchlist）完成 [2,4] 区间校验、排序与差值计算后传入；
// 本文件只做渲染，不复制排序/上限/差值算法。
// R2-B 排序切换仅改变展示；DELTA-CENTS-0 相对最高差值列：最高行 0，null → —。

import { useEffect } from "react";
import { COMPARE_SORTS, formatDeadlineSafe } from "../hooks/useHackathonWatchlist";

const STATUS_STYLES = {
  Open: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Closed: "bg-slate-600/20 text-slate-500 border-slate-600/30",
};

const COLUMNS = [
  "活动名称", "平台", "模式", "状态", "截止日期", "参与人数", "奖池文案", "奖池分值", "相对最高差值", "标签摘要", "操作",
];

function TagsSummary({ tags }) {
  if (!tags || tags.length === 0) return <span className="text-slate-600">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, 3).map((tag) => (
        <span
          key={tag}
          className="px-1.5 py-0.5 rounded text-xs"
          style={{ background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {tag}
        </span>
      ))}
      {tags.length > 3 && <span className="text-xs text-slate-600">+{tags.length - 3}</span>}
    </div>
  );
}

export default function HackathonCompareView({ items, sortMode, onSortChange, onExport, onRemoveRow, onClose }) {
  // ESC 关闭
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!items || items.length === 0) return null;

  const activeSort = COMPARE_SORTS.find((s) => s.id === sortMode) || COMPARE_SORTS[0];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" style={{ backdropFilter: "blur(3px)" }} onClick={onClose} />

      <div
        className="relative w-full max-w-6xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#0b1220", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* 头部 */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">⚖️</span>
            <h2 className="text-base font-extrabold text-white tracking-tight">黑客松对比</h2>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}
            >
              {items.length} 项 · {activeSort.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* R3 导出摘要（逻辑层 exportCompareSummary，本组件只触发） */}
            <button
              type="button"
              onClick={onExport}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
              style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.35)" }}
            >
              📋 导出摘要
            </button>
            {/* R2-B 排序切换（仅展示，不写 URL/localStorage） */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-600 mr-1">排序</span>
              {COMPARE_SORTS.map((s) => {
                const active = s.id === activeSort.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSortChange(s.id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                    style={
                      active
                        ? { background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.4)" }
                        : { background: "rgba(255,255,255,0.04)", color: "#64748b", border: "1px solid rgba(255,255,255,0.06)" }
                    }
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              aria-label="关闭对比视图"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 对比表 */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm min-w-[960px] border-collapse">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                {COLUMNS.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr
                  key={it.id}
                  className="align-top transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  {/* 活动名称 */}
                  <td className="px-4 py-3 max-w-[220px]">
                    {it.url ? (
                      <a
                        href={it.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-white hover:text-indigo-300 transition-colors leading-snug"
                      >
                        {it.title}
                      </a>
                    ) : (
                      <span className="font-bold text-white leading-snug">{it.title}</span>
                    )}
                    {it.organizer && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">by {it.organizer}</p>
                    )}
                  </td>
                  {/* 平台 */}
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{it.platform || "—"}</td>
                  {/* 模式 */}
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{it.mode || "—"}</td>
                  {/* 状态 */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        STATUS_STYLES[it.status] || STATUS_STYLES.Closed
                      }`}
                    >
                      {it.status || "—"}
                    </span>
                  </td>
                  {/* 截止日期 */}
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{formatDeadlineSafe(it.deadline)}</td>
                  {/* 参与人数 */}
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                    {it.participants != null ? Number(it.participants).toLocaleString("en-IN") : "—"}
                  </td>
                  {/* 奖池文案 */}
                  <td className="px-4 py-3 max-w-[180px]">
                    {it.prizeRaw ? (
                      <span className="text-emerald-400 font-semibold">{it.prizeRaw}</span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  {/* 奖池分值（整数分；null 沉底） */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {it.prizeCents != null ? (
                      <span className="font-bold text-amber-300">
                        {it.prizeCents.toLocaleString("en-IN")}
                        <span className="ml-1 text-xs font-normal text-slate-500">分</span>
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  {/* 相对最高差值（DELTA-CENTS-0：最高行 0；null → —；禁百分比与美元符号） */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {it.deltaCents != null ? (
                      <span className={`font-bold ${it.deltaCents === 0 ? "text-emerald-400" : "text-slate-400"}`}>
                        {it.deltaCents.toLocaleString("en-IN")}
                        <span className="ml-1 text-xs font-normal text-slate-500">分</span>
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  {/* 标签摘要 */}
                  <td className="px-4 py-3 max-w-[200px]">
                    <TagsSummary tags={it.tags} />
                  </td>
                  {/* R3 操作：行移出意向（逻辑层 removeFromCompare，<2 自动回面板） */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onRemoveRow(it.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-400 transition-colors"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      移出意向
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 脚注 */}
        <div
          className="px-5 py-3 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-xs text-slate-600">
            奖池分值与相对最高差值单位均为「分」（cents 整数）；相对最高差值 = 本项分值 − 最高分值（最高为 0，无法解析为 —）；
            排序仅影响展示顺序，跨币种金额仅作相对参考。
          </p>
        </div>
      </div>
    </div>
  );
}
