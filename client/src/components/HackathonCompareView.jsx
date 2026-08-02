import { useEffect, useMemo, useRef, useState } from "react";
import {
  COMPARE_SORTS,
  buildCompareSummary,
  computeDeltaCentsMap,
  copyTextToClipboard,
} from "../hooks/useHackathonWatchlist";

function formatDeadline(deadline) {
  if (!deadline) return "TBA";
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return "TBA";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCents(cents) {
  if (cents == null || !Number.isFinite(cents)) return "—";
  const main = cents / 100;
  if (Number.isInteger(main)) return main.toLocaleString("en-US");
  return main.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDelta(cents) {
  if (cents == null || !Number.isFinite(cents)) return "—";
  if (cents === 0) return "0";
  const main = cents / 100;
  const str = Number.isInteger(main)
    ? main.toLocaleString("en-US")
    : main.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  return cents < 0 ? str : `+${str}`;
}

function summarizeTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return "—";
  const shown = tags.slice(0, 3).map((t) => `#${t}`).join(" ");
  if (tags.length > 3) return `${shown} +${tags.length - 3}`;
  return shown;
}

export default function HackathonCompareView({
  open,
  items,
  onClose,
  onRemoveFromWatchlist,
  onExportToast,
}) {
  const [sortId, setSortId] = useState("prize");
  const [showFallback, setShowFallback] = useState(false);
  const fallbackRef = useRef(null);

  const sorted = useMemo(() => {
    const sorter = COMPARE_SORTS[sortId] || COMPARE_SORTS.prize;
    return sorter.apply(items || []);
  }, [items, sortId]);

  const deltaMap = useMemo(
    () => computeDeltaCentsMap(items || []),
    [items],
  );

  const maxPrizeCents = useMemo(() => {
    const valid = (items || [])
      .map((it) => it.prizeCents)
      .filter((c) => c != null && Number.isFinite(c));
    return valid.length ? Math.max(...valid) : null;
  }, [items]);

  useEffect(() => {
    if (!open) setShowFallback(false);
  }, [open]);

  const handleExport = async () => {
    const text = buildCompareSummary({
      orderedItems: items || [],
      sortId,
    });
    const result = await copyTextToClipboard(text);
    if (result.ok) {
      if (onExportToast) onExportToast("对比摘要已复制", "success");
      setShowFallback(false);
      return;
    }
    setShowFallback(true);
    setTimeout(() => {
      if (fallbackRef.current) {
        fallbackRef.current.focus();
        fallbackRef.current.select();
      }
    }, 30);
  };

  const handleFallbackCopy = () => {
    if (fallbackRef.current) {
      fallbackRef.current.select();
      try {
        document.execCommand("copy");
        if (onExportToast) onExportToast("对比摘要已复制", "success");
      } catch {
        if (onExportToast) onExportToast("请手动复制", "info");
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 sm:p-8">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-6xl max-h-[88vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(180deg,#0b1226 0%,#080d1c 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div>
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>🏆</span> 奖池横向对比
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              按奖池分值（分）降序排列，无分值项沉底；相对最高差值仅展示，不写入存储；跨币种仅作相对参考。
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="flex items-center gap-1 p-1 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {Object.values(COMPARE_SORTS).map((s) => {
                const active = sortId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSortId(s.id)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition"
                    style={{
                      background: active
                        ? "linear-gradient(135deg,#3770FF,#7c3aed)"
                        : "transparent",
                      color: active ? "#fff" : "#94a3b8",
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black text-white transition hover:scale-[1.03]"
              style={{
                background: "linear-gradient(135deg,#059669,#10b981)",
                boxShadow: "0 6px 18px rgba(16,185,129,0.3)",
              }}
              title="复制对比摘要"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              导出摘要
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition"
              style={{ background: "rgba(255,255,255,0.04)" }}
              aria-label="Close"
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

        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <div
            className="overflow-x-auto rounded-xl"
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <table className="w-full text-sm min-w-[960px]">
              <thead>
                <tr
                  className="text-left"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
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
                    "操作",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400 ${
                        i === 0 ? "sticky left-0 z-10" : ""
                      }`}
                      style={{
                        background:
                          i === 0 ? "rgba(11,18,38,0.98)" : undefined,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((it) => {
                  const isTop =
                    maxPrizeCents != null && it.prizeCents === maxPrizeCents;
                  const delta = deltaMap[it.id];
                  return (
                    <tr
                      key={it.id}
                      className="transition hover:bg-white/[0.03]"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <td
                        className="px-4 py-3 align-top sticky left-0"
                        style={{ background: "rgba(11,18,38,0.98)" }}
                      >
                        <div className="flex items-start gap-2 min-w-[200px]">
                          {isTop && (
                            <span className="text-amber-400 text-sm mt-0.5">
                              👑
                            </span>
                          )}
                          <a
                            href={it.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white font-bold text-sm leading-snug hover:text-blue-400 line-clamp-2"
                            onClick={(e) => {
                              if (!it.url) e.preventDefault();
                            }}
                          >
                            {it.title}
                          </a>
                        </div>
                        {it.organizer && (
                          <p className="text-[11px] text-slate-500 mt-1 ml-6">
                            by {it.organizer}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-slate-300 text-xs font-semibold">
                        {it.platform || "—"}
                      </td>
                      <td className="px-4 py-3 align-top text-slate-300 text-xs">
                        {it.mode || "—"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{
                            background:
                              it.status === "Open"
                                ? "rgba(52,211,153,0.12)"
                                : "rgba(96,165,250,0.12)",
                            color:
                              it.status === "Open" ? "#34d399" : "#60a5fa",
                            border: `1px solid ${
                              it.status === "Open"
                                ? "rgba(52,211,153,0.3)"
                                : "rgba(96,165,250,0.3)"
                            }`,
                          }}
                        >
                          {it.status || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-slate-400 text-xs whitespace-nowrap">
                        {formatDeadline(it.deadline)}
                      </td>
                      <td className="px-4 py-3 align-top text-slate-300 text-xs font-semibold">
                        {it.participants != null &&
                        Number.isFinite(Number(it.participants))
                          ? Number(it.participants).toLocaleString("en-US")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="text-emerald-400 text-xs font-bold whitespace-nowrap">
                          {it.prizeRaw || "TBA"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {it.prizeCents == null ? (
                          <span className="text-slate-500 text-xs italic">
                            无法解析
                          </span>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span
                              className={`font-black ${
                                isTop ? "text-amber-400" : "text-blue-300"
                              }`}
                            >
                              {formatCents(it.prizeCents)}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold">
                              分
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {delta == null ? (
                          <span className="text-slate-500 text-xs italic">
                            —
                          </span>
                        ) : delta === 0 ? (
                          <span className="text-amber-400 text-xs font-black">
                            0
                          </span>
                        ) : delta < 0 ? (
                          <span
                            className="text-xs font-black"
                            style={{ color: "#f87171" }}
                          >
                            {formatDelta(delta)}
                          </span>
                        ) : (
                          <span
                            className="text-xs font-black"
                            style={{ color: "#34d399" }}
                          >
                            {formatDelta(delta)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-[11px] text-slate-400 max-w-[220px] leading-relaxed">
                        {summarizeTags(it.tags)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <button
                          onClick={() => onRemoveFromWatchlist && onRemoveFromWatchlist(it.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-red-300 hover:text-white transition"
                          style={{
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.25)",
                          }}
                          title="从意向清单移出"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                          </svg>
                          移出
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {showFallback && (
            <div
              className="mt-4 p-3 rounded-xl"
              style={{
                background: "rgba(251,191,36,0.08)",
                border: "1px solid rgba(251,191,36,0.25)",
              }}
            >
              <p className="text-[11px] text-amber-300 font-bold mb-2">
                剪贴板不可用，请手动复制以下摘要：
              </p>
              <textarea
                ref={fallbackRef}
                readOnly
                value={buildCompareSummary({
                  orderedItems: items || [],
                  sortId,
                })}
                className="w-full h-40 p-2 rounded-lg text-[11px] text-slate-200 outline-none font-mono"
                style={{
                  background: "rgba(2,8,23,0.7)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onClick={(e) => e.currentTarget.select()}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleFallbackCopy}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#3770FF,#7c3aed)" }}
                >
                  复制选中文本
                </button>
              </div>
            </div>
          )}

          <p className="text-[10px] text-slate-600 mt-3">
            * 奖池分值统一以「分」为整数存储（主单位 × 100）；相对最高差值 = 当前奖池分值 − 本组最高奖池分值（DELTA-CENTS-0，最高行恒为 0，不可解析为 —，无百分号/货币符号）；排序仅作用于本表展示，不改 URL、不写 localStorage、不动 addedAt。
          </p>
        </div>
      </div>
    </div>
  );
}
