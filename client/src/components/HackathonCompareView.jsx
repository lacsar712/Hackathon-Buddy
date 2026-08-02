import { useEffect, useRef } from "react";

const PLATFORM_META = {
  Devpost: { color: "#00b4d8", icon: "🏆" },
  Devfolio: { color: "#3770FF", icon: "🚀" },
  HackerEarth: { color: "#44c4a1", icon: "💻" },
  Unstop: { color: "#F4C84A", icon: "⚡" },
};

function formatDeadline(deadline) {
  if (!deadline) return "TBA";
  try {
    const d = new Date(deadline);
    if (Number.isNaN(d.getTime())) return "TBA";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "TBA";
  }
}

function formatCents(cents) {
  if (cents === null || cents === undefined) return null;
  return cents.toLocaleString("en-US");
}

function formatDelta(delta) {
  if (delta === null || delta === undefined) return null;
  if (delta === 0) return "0";
  const sign = delta > 0 ? "+" : "-";
  return `${sign}${Math.abs(delta).toLocaleString("en-US")}`;
}

function tagsSummary(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return "—";
  const head = tags.slice(0, 3).join(", ");
  return tags.length > 3 ? `${head} +${tags.length - 3}` : head;
}

const SORT_LABELS = {
  prize: "奖池分值",
  deadline: "截止日期",
  participants: "参与人数",
};

export default function HackathonCompareView({
  open,
  items,
  maxPrizeCents,
  onClose,
  compareSort,
  onSortChange,
  sorts,
  onRemove,
  onExport,
  exportFallback,
  onDismissExport,
}) {
  const fallbackRef = useRef(null);

  useEffect(() => {
    if (exportFallback && fallbackRef.current) {
      try {
        fallbackRef.current.focus();
        fallbackRef.current.select();
      } catch {
        /* ignore */
      }
    }
  }, [exportFallback]);

  if (!open) return null;

  const SORTS = sorts || {
    PRIZE: "prize",
    DEADLINE: "deadline",
    PARTICIPANTS: "participants",
  };
  const currentSort = compareSort || SORTS.PRIZE;

  const sortOptions = [
    { value: SORTS.PRIZE, label: "奖池降序" },
    { value: SORTS.DEADLINE, label: "截止更近" },
    { value: SORTS.PARTICIPANTS, label: "人数降序" },
  ];

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-6xl max-h-[88vh] flex flex-col rounded-2xl overflow-hidden animate-fade-in"
        style={{
          background: "linear-gradient(180deg,#0b1226 0%,#070b18 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)",
              }}
            >
              ⚖️
            </div>
            <div className="min-w-0">
              <h2 className="text-white font-bold text-lg leading-tight">
                奖池横向对比
              </h2>
              <p className="text-[11px] text-slate-500 truncate">
                当前排序：{SORT_LABELS[currentSort] || "奖池分值"} · 单位：分（跨币种仅作相对参考）
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={currentSort}
              onChange={(e) => onSortChange && onSortChange(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold outline-none cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.04)",
                color: "#94a3b8",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.04)" }}
              aria-label="关闭对比"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto custom-scrollbar p-4">
          <div
            className="overflow-x-auto rounded-xl"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  {[
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
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const meta = PLATFORM_META[item.platform] || {
                    color: "#a78bfa",
                    icon: "🎯",
                  };
                  const isMax =
                    maxPrizeCents !== null &&
                    item.prizeCents !== null &&
                    item.prizeCents !== undefined &&
                    item.prizeCents === maxPrizeCents;
                  const deltaText = formatDelta(item.deltaCents);
                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-white/[0.02]"
                      style={{
                        borderBottom:
                          idx < items.length - 1
                            ? "1px solid rgba(255,255,255,0.04)"
                            : "none",
                      }}
                    >
                      {/* 活动名称 */}
                      <td className="px-4 py-3 align-top min-w-[200px]">
                        <div className="flex items-start gap-2">
                          <span style={{ color: meta.color }}>
                            {meta.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white font-semibold hover:underline leading-snug line-clamp-2"
                            >
                              {item.title}
                            </a>
                            {item.organizer && (
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {item.organizer}
                              </p>
                            )}
                          </div>
                          {onRemove && (
                            <button
                              type="button"
                              onClick={() => onRemove(item.id)}
                              className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="移出意向清单"
                              aria-label="移出意向清单"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                      {/* 平台 */}
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            color: meta.color,
                            background: `${meta.color}1a`,
                            border: `1px solid ${meta.color}33`,
                          }}
                        >
                          {item.platform || "—"}
                        </span>
                      </td>
                      {/* 模式 */}
                      <td className="px-4 py-3 align-top text-slate-300 whitespace-nowrap">
                        {item.mode || "—"}
                      </td>
                      {/* 状态 */}
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            item.status === "Open"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : item.status === "Upcoming"
                                ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                                : "bg-slate-600/15 text-slate-500 border-slate-600/30"
                          }`}
                        >
                          {item.status || "—"}
                        </span>
                      </td>
                      {/* 截止日期 */}
                      <td className="px-4 py-3 align-top text-slate-300 whitespace-nowrap">
                        {formatDeadline(item.deadline)}
                      </td>
                      {/* 参与人数 */}
                      <td className="px-4 py-3 align-top text-slate-300 whitespace-nowrap">
                        {item.participants
                          ? Number(item.participants).toLocaleString()
                          : "—"}
                      </td>
                      {/* 奖池文案 */}
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        {item.prizeRaw ? (
                          <span className="text-emerald-400 font-semibold">
                            {item.prizeRaw}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      {/* 奖池分值 */}
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        {item.prizeCents === null ||
                        item.prizeCents === undefined ? (
                          <span className="text-slate-600">—</span>
                        ) : (
                          <span
                            className={`font-bold tabular-nums ${
                              isMax ? "text-amber-400" : "text-slate-200"
                            }`}
                          >
                            {isMax && (
                              <span className="mr-1" title="最高奖池">
                                👑
                              </span>
                            )}
                            {formatCents(item.prizeCents)}
                          </span>
                        )}
                      </td>
                      {/* 相对最高差值 (DELTA-CENTS-0) */}
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        {deltaText === null ? (
                          <span className="text-slate-600">—</span>
                        ) : (
                          <span
                            className={`font-semibold tabular-nums ${
                              item.deltaCents === 0
                                ? "text-amber-400"
                                : "text-slate-400"
                            }`}
                          >
                            {deltaText}
                          </span>
                        )}
                      </td>
                      {/* 标签摘要 */}
                      <td className="px-4 py-3 align-top min-w-[160px]">
                        <span className="text-xs text-slate-400">
                          {tagsSummary(item.tags)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clipboard fallback: manual copy textarea */}
        {exportFallback && (
          <div
            className="px-6 py-3 flex-shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-xs font-semibold text-amber-400 mb-2">
              剪贴板不可用，请手动复制（Ctrl/Cmd+C）：
            </p>
            <textarea
              ref={fallbackRef}
              readOnly
              value={exportFallback.text}
              className="w-full h-36 rounded-lg p-3 text-xs text-slate-300 outline-none resize-none custom-scrollbar"
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.1)",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
              }}
              onFocus={(e) => e.target.select()}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={onDismissExport}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                关闭
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="px-6 py-3 flex items-center justify-between flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-[11px] text-slate-600">
            共 {items.length} 个黑客松 · 分值为本地解析的整数分 · 差值 = 本行分值 -
            最高分值
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onExport}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "rgba(99,102,241,0.18)",
                border: "1px solid rgba(99,102,241,0.4)",
              }}
            >
              导出摘要
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background:
                  "linear-gradient(135deg,#6366f1 0%,#a855f7 100%)",
              }}
            >
              关闭对比
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
