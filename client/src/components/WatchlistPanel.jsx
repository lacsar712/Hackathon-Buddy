import { useEffect, useMemo, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// WatchlistPanel — UI LAYER (pure render + local view-state only)
// 手写轻量抽屉：入口徽章 n/6、空态、满员条、清空确认、勾选最多 4、发起对比。
// 不做 localStorage 写入；不复制排序/上限算法；对比开关走 URL 状态机(props)。
// ─────────────────────────────────────────────────────────────────────────────

export default function WatchlistPanel({
  open,
  onClose,
  watchlist,
  count,
  isFull,
  remove,
  clear,
  notify,
  usingMock,
  MAX_WATCH,
  COMPARE_MIN,
  COMPARE_MAX,
  checkCompareCount,
  onCompare, // (ids[]) => void  — 交给 URL 状态机
  initialSelected = [], // 深链恢复时用勾选序回填
}) {
  const [selected, setSelected] = useState(initialSelected); // 勾选序
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  // 深链/URL 变化时回填勾选序；并剔除已不在清单中的 id
  useEffect(() => {
    const known = new Set(watchlist.map((h) => h.id));
    setSelected((prev) => {
      const base = initialSelected.length ? initialSelected : prev;
      const next = base.filter((id) => known.has(id));
      return next.join(",") === prev.join(",") ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSelected.join(","), watchlist]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= COMPARE_MAX) {
        notify(`最多只能选择 ${COMPARE_MAX} 个黑客松进行对比`, "error");
        return prev;
      }
      return [...prev, id]; // 追加，保勾选序
    });
  };

  const startCompare = () => {
    const check = checkCompareCount(selected.length);
    if (!check.ok) {
      notify(check.message, "error");
      return;
    }
    onCompare(selected); // 勾选序交给 URL 状态机
  };

  const confirmClear = () => {
    clear();
    setSelected([]);
    setShowClearConfirm(false);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[80] flex justify-end" style={{ background: "rgba(2,8,23,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
        <div
          className="w-full max-w-md h-full flex flex-col"
          style={{ background: "linear-gradient(180deg, #0b1424 0%, #0f172a 100%)", borderLeft: "1px solid rgba(255,255,255,0.08)", boxShadow: "-20px 0 60px rgba(0,0,0,0.5)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white">意向清单</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(55,112,255,0.15)", color: "#3770FF", border: "1px solid rgba(55,112,255,0.3)" }}>
                {count}/{MAX_WATCH}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              title="关闭"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 临时模式提示（内存降级：刷新可丢） */}
          {usingMock && (
            <div className="mx-5 mt-4 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.25)" }}>
              临时模式：当前为演示数据，意向清单已本地保存，但演示活动刷新后可能变化
            </div>
          )}

          {/* 满员条 */}
          {isFull && (
            <div className="mx-5 mt-4 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>
              意向清单已满（{MAX_WATCH}/{MAX_WATCH}）
            </div>
          )}

          {/* 列表 / 空态 */}
          <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
            {count === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-5xl mb-4 opacity-40">📌</div>
                <p className="text-sm text-slate-500">还没有意向黑客松，去列表里添加一些吧</p>
              </div>
            ) : (
              watchlist.map((h) => {
                const checked = selectedSet.has(h.id);
                return (
                  <div
                    key={h.id}
                    className="rounded-xl p-3 transition-colors"
                    style={{ background: checked ? "rgba(55,112,255,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${checked ? "rgba(55,112,255,0.4)" : "rgba(255,255,255,0.06)"}` }}
                  >
                    <div className="flex items-start gap-3">
                      <label className="flex items-center pt-0.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(h.id)}
                          className="w-4 h-4 accent-blue-500 cursor-pointer"
                        />
                      </label>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-white leading-tight line-clamp-2">{h.title}</h3>
                          <button
                            onClick={() => remove(h.id)}
                            className="flex-shrink-0 text-xs px-2 py-0.5 rounded-md font-semibold transition-colors"
                            style={{ color: "#f87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}
                            title="移出意向"
                          >
                            移出意向
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5 text-[11px] text-slate-500">
                          {h.platform && <span>{h.platform}</span>}
                          {h.mode && <span>· {h.mode}</span>}
                          {h.status && <span>· {h.status}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs font-bold text-emerald-400">{h.prizeRaw || "无奖池文案"}</span>
                          <span className="text-[10px] text-slate-600">{h.prizeCents == null ? "分值 —" : `${h.prizeCents} 分`}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 底部操作区 */}
          {count > 0 && (
            <div className="px-5 py-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[11px] text-slate-500">
                已勾选 <span className="text-slate-300 font-semibold">{selected.length}</span> 个（对比需 {COMPARE_MIN}~{COMPARE_MAX} 个）
              </p>
              <div className="flex gap-2">
                <button
                  onClick={startCompare}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg, #3770FF, #7c3aed)" }}
                >
                  奖池对比
                </button>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{ color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}
                >
                  清空
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 清空确认 */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" style={{ background: "rgba(2,8,23,0.8)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-base font-extrabold text-white mb-2">清空意向清单？</h3>
            <p className="text-sm text-slate-400 mb-6">此操作将移出全部 {count} 个黑客松，无法撤销。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                取消
              </button>
              <button
                onClick={confirmClear}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
                style={{ background: "rgba(248,113,113,0.9)" }}
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
