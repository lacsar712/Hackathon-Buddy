import { useEffect, useMemo, useState } from "react";
import {
  MAX_WATCH,
  COMPARE_MIN,
  COMPARE_MAX,
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

export default function WatchlistPanel({
  open,
  onClose,
  items,
  count,
  isFull,
  onRemove,
  onClear,
  onCompare,
  storageAvailable,
  messages,
}) {
  const [selected, setSelected] = useState(() => new Set());
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirmClear(false);
    }
  }, [open]);

  useEffect(() => {
    const validIds = new Set(items.map((it) => it.id));
    setSelected((prev) => {
      let changed = false;
      const next = new Set();
      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [items]);

  const selectedCount = selected.size;

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= COMPARE_MAX) return prev;
        next.add(id);
      }
      return next;
    });
  };

  const startCompare = () => {
    if (selectedCount < COMPARE_MIN) return;
    const orderedIds = [];
    selected.forEach((id) => {
      if (items.some((it) => it.id === id)) orderedIds.push(id);
    });
    if (orderedIds.length < COMPARE_MIN) return;
    onCompare(orderedIds);
  };

  const canCompare = selectedCount >= COMPARE_MIN;

  const compareHint = useMemo(() => {
    if (selectedCount < COMPARE_MIN) return "请至少选择 2 个黑客松进行对比";
    if (selectedCount > COMPARE_MAX) return "最多只能选择 4 个黑客松进行对比";
    return null;
  }, [selectedCount]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        className="absolute right-0 top-0 h-full w-full sm:w-[440px] flex flex-col shadow-2xl"
        style={{
          background: "linear-gradient(180deg, #0b1226 0%, #0a0f1f 100%)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⭐</span>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                意向清单
              </h2>
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(55,112,255,0.15)",
                  color: "#60a5fa",
                  border: "1px solid rgba(55,112,255,0.3)",
                }}
              >
                {count}/{MAX_WATCH}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              勾选 2–4 个进行奖池横向对比
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition"
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

        {isFull && (
          <div
            className="mx-5 mt-4 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2"
            style={{
              background: "rgba(251,191,36,0.1)",
              color: "#fbbf24",
              border: "1px solid rgba(251,191,36,0.25)",
            }}
          >
            <span>⚠️</span>
            意向清单已满（6/6）
          </div>
        )}

        {!storageAvailable && (
          <div
            className="mx-5 mt-3 px-3 py-2 rounded-lg text-xs font-medium"
            style={{
              background: "rgba(239,68,68,0.1)",
              color: "#fca5a5",
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            本地存储不可用，刷新后意向清单将丢失
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="text-5xl mb-4 opacity-70">📭</div>
              <p className="text-sm text-slate-300 font-semibold mb-1">
                还没有意向黑客松，去列表里添加一些吧
              </p>
              <p className="text-xs text-slate-500 max-w-[260px]">
                在卡片上点击「加入意向」即可把感兴趣的黑客松收藏到本地。
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((it) => {
                const checked = selected.has(it.id);
                const disabled = !checked && selected.size >= COMPARE_MAX;
                return (
                  <li
                    key={it.id}
                    className="rounded-xl p-3 transition"
                    style={{
                      background: checked
                        ? "rgba(55,112,255,0.08)"
                        : "rgba(255,255,255,0.03)",
                      border: `1px solid ${
                        checked
                          ? "rgba(55,112,255,0.35)"
                          : "rgba(255,255,255,0.06)"
                      }`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <label
                        className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded-md cursor-pointer flex-shrink-0 transition ${
                          disabled ? "opacity-40 cursor-not-allowed" : ""
                        }`}
                        style={{
                          border: `1.5px solid ${
                            checked ? "#3b82f6" : "rgba(148,163,184,0.4)"
                          }`,
                          background: checked ? "#2563eb" : "transparent",
                        }}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleSelect(it.id)}
                        />
                        {checked && (
                          <svg
                            className="w-3.5 h-3.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </label>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white leading-snug line-clamp-2">
                          {it.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              color: "#94a3b8",
                            }}
                          >
                            {it.platform || "—"}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            style={{
                              background: "rgba(52,211,153,0.1)",
                              color: "#34d399",
                            }}
                          >
                            {it.prizeRaw || "TBA"}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {formatDeadline(it.deadline)}
                          </span>
                        </div>
                        {it.tags && it.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {it.tags.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.5 rounded text-[10px]"
                                style={{
                                  background: "rgba(255,255,255,0.04)",
                                  color: "#94a3b8",
                                }}
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onRemove(it.id)}
                        className="text-slate-500 hover:text-red-400 transition p-1"
                        title="移出意向清单"
                        aria-label="Remove"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
                          />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div
            className="px-5 py-4 space-y-3"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(0,0,0,0.25)",
            }}
          >
            {compareHint && (
              <p className="text-[11px] text-amber-400 font-medium">
                {compareHint}
              </p>
            )}
            <div className="flex items-center gap-2">
              {confirmClear ? (
                <>
                  <span className="text-[11px] text-slate-400 flex-1">
                    确定清空全部意向？
                  </span>
                  <button
                    onClick={() => {
                      onClear();
                      setSelected(new Set());
                      setConfirmClear(false);
                    }}
                    className="px-3 py-2 rounded-lg text-[11px] font-bold text-white"
                    style={{ background: "#dc2626" }}
                  >
                    确认清空
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-3 py-2 rounded-lg text-[11px] font-bold text-slate-300"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    取消
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="px-3 py-2 rounded-lg text-[11px] font-bold text-slate-400 hover:text-red-400 transition"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  清空
                </button>
              )}
              <button
                onClick={startCompare}
                disabled={!canCompare}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-black text-white transition disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02]"
                style={{
                  background: canCompare
                    ? "linear-gradient(135deg,#3770FF,#7c3aed)"
                    : "rgba(255,255,255,0.06)",
                  boxShadow: canCompare
                    ? "0 6px 20px rgba(55,112,255,0.35)"
                    : "none",
                }}
              >
                对比所选 ({selectedCount}/{COMPARE_MAX})
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
