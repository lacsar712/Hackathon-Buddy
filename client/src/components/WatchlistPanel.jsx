import { useState, useEffect } from "react";

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

export default function WatchlistPanel({
  open,
  onClose,
  watchlist,
  isFull,
  compareIds,
  onToggleCompare,
  onStartCompare,
  onRemove,
  onClear,
  constants,
  storageError,
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  const { MAX_WATCH, COMPARE_MAX } = constants;

  useEffect(() => {
    if (!open) setConfirmClear(false);
  }, [open]);

  if (!open) return null;

  const selectedCount = compareIds.length;
  const count = watchlist.length;

  const handleClearClick = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    onClear();
    setConfirmClear(false);
  };

  return (
    <div className="fixed inset-0 z-[150] flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <aside
        className="relative w-full max-w-md h-full flex flex-col animate-fade-in"
        style={{
          background: "linear-gradient(180deg,#0b1226 0%,#070b18 100%)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
              style={{
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)",
              }}
            >
              🔖
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-tight">
                意向清单
              </h2>
              <p className="text-[11px] text-slate-500">
                {count}/{MAX_WATCH} 已保存
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.04)" }}
            aria-label="关闭"
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

        {/* Full bar */}
        {isFull && (
          <div
            className="px-5 py-2 text-xs font-semibold text-center"
            style={{
              background: "rgba(251,191,36,0.1)",
              color: "#fbbf24",
              borderBottom: "1px solid rgba(251,191,36,0.2)",
            }}
          >
            意向清单已满（{MAX_WATCH}/{MAX_WATCH}）
          </div>
        )}

        {/* Storage degraded (in-memory only) temporary tip */}
        {storageError && (
          <div
            className="px-5 py-2 text-xs font-medium text-center"
            style={{
              background: "rgba(239,68,68,0.1)",
              color: "#fca5a5",
              borderBottom: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            本地存储不可用，刷新后意向清单将丢失
          </div>
        )}

        {/* Compare selection hint */}
        {count > 0 && (
          <div
            className="px-5 py-2 text-[11px] text-slate-500"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
          >
            勾选 {constants.COMPARE_MIN}～{COMPARE_MAX} 个活动进行横向对比 ·
            已选 {selectedCount}/{COMPARE_MAX}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3">
          {count === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="text-5xl mb-4 opacity-40">📭</div>
              <p className="text-sm text-slate-400 font-medium">
                还没有意向黑客松，去列表里添加一些吧
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {watchlist.map((item) => {
                const meta = PLATFORM_META[item.platform] || {
                  color: "#a78bfa",
                  icon: "🎯",
                };
                const checked = compareIds.includes(item.id);
                return (
                  <li
                    key={item.id}
                    className="rounded-xl p-3 transition-colors"
                    style={{
                      background: checked
                        ? "rgba(99,102,241,0.10)"
                        : "rgba(255,255,255,0.03)",
                      border: `1px solid ${
                        checked
                          ? "rgba(99,102,241,0.35)"
                          : "rgba(255,255,255,0.05)"
                      }`,
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <label className="mt-0.5 flex-shrink-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleCompare(item.id)}
                          className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                        />
                      </label>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <span
                            className="text-base leading-none mt-0.5"
                            style={{ color: meta.color }}
                          >
                            {meta.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white leading-snug line-clamp-2">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {item.platform}
                              {item.organizer ? ` · ${item.organizer}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px]">
                          {item.prizeRaw && (
                            <span className="text-emerald-400 font-semibold">
                              {item.prizeRaw}
                            </span>
                          )}
                          <span className="text-slate-500">
                            {formatDeadline(item.deadline)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onRemove(item.id)}
                        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="移意向"
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
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {count > 0 && (
          <div
            className="px-4 py-3 space-y-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            {confirmClear && (
              <div
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <span className="text-red-300 font-medium">
                  确认清空意向清单？
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-2.5 py-1 rounded-md text-slate-300 hover:bg-white/5 text-[11px] font-semibold"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleClearClick}
                    className="px-2.5 py-1 rounded-md bg-red-500/20 text-red-300 hover:bg-red-500/30 text-[11px] font-semibold"
                  >
                    确认清空
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleClearClick}
                disabled={confirmClear}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                清空
              </button>
              <button
                onClick={onStartCompare}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background:
                    "linear-gradient(135deg,#6366f1 0%,#a855f7 100%)",
                  opacity: selectedCount === 0 ? 0.6 : 1,
                }}
              >
                开始对比（{selectedCount}/{COMPARE_MAX}）
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
