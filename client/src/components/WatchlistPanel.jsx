// ─── HB-WATCHLIST-R1 · UI 层：意向清单抽屉面板 ───────────────────────────────
// 纯展示组件：所有状态与规则（上限 6 / 勾选上限 4 / 排序 / 持久化）均在
// hooks/useHackathonWatchlist.js，本文件不复制任何逻辑算法。

import { useEffect, useState } from "react";
import { MAX_WATCH, COMPARE_MAX, formatDeadlineSafe } from "../hooks/useHackathonWatchlist";

const TOAST_STYLES = {
  info: { color: "#a5b4fc", bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.4)" },
  warn: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.35)" },
  error: { color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.35)" },
};

// 手写轻量 toast（无第三方依赖）
function Toast({ notice }) {
  if (!notice) return null;
  const s = TOAST_STYLES[notice.kind] || TOAST_STYLES.info;
  return (
    <div
      key={notice.id}
      className="fixed bottom-6 right-6 z-[100] px-4 py-2.5 rounded-xl text-sm font-semibold shadow-2xl animate-fade-in"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}`, backdropFilter: "blur(8px)" }}
      role="status"
    >
      {notice.text}
    </div>
  );
}

export default function WatchlistPanel({
  open,
  onClose,
  notice,
  watchlist,
  isFull,
  isPersistent,
  selectedIds,
  onToggleWatch,
  onToggleCompare,
  onClear,
  onOpenCompare,
}) {
  const [confirmClear, setConfirmClear] = useState(false);

  // 面板关闭或清单变空时，重置清空确认状态
  useEffect(() => {
    if (!open || watchlist.length === 0) setConfirmClear(false);
  }, [open, watchlist.length]);

  return (
    <>
      <Toast notice={notice} />

      {/* 遮罩 */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/60"
          style={{ backdropFilter: "blur(2px)" }}
          onClick={onClose}
        />
      )}

      {/* 抽屉 */}
      <aside
        className={`fixed top-0 right-0 z-[70] h-full w-full max-w-md flex flex-col transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: "#0b1220", borderLeft: "1px solid rgba(255,255,255,0.08)" }}
        aria-hidden={!open}
      >
        {/* 头部：标题 + n/6 徽章 + 关闭 */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <h2 className="text-base font-extrabold text-white tracking-tight">意向清单</h2>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: isFull ? "rgba(251,191,36,0.15)" : "rgba(99,102,241,0.15)",
                color: isFull ? "#fbbf24" : "#a5b4fc",
                border: `1px solid ${isFull ? "rgba(251,191,36,0.3)" : "rgba(99,102,241,0.3)"}`,
              }}
            >
              {watchlist.length}/{MAX_WATCH}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            aria-label="关闭意向清单"
          >
            ✕
          </button>
        </div>

        {/* 满员条 */}
        {isFull && (
          <div
            className="mx-5 mt-4 px-3 py-2 rounded-lg text-xs font-semibold"
            style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}
          >
            意向清单已满（{MAX_WATCH}/{MAX_WATCH}）
          </div>
        )}

        {/* 临时模式提示（内存降级：URL 恢复仍工作，刷新可丢） */}
        {isPersistent === false && (
          <div
            className="mx-5 mt-4 px-3 py-2 rounded-lg text-xs font-semibold"
            style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.25)" }}
          >
            本地存储不可用，刷新后意向清单将丢失
          </div>
        )}

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {watchlist.length === 0 ? (
            /* 空态 */
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="text-5xl mb-4">🌟</div>
              <p className="text-sm text-slate-400">还没有意向黑客松，去列表里添加一些吧</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {watchlist.map((item) => {
                const checked = selectedIds.includes(item.id);
                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{
                      background: checked ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${checked ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    {/* 对比勾选（最多 COMPARE_MAX 个；超出由逻辑层提示） */}
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleCompare(item.id)}
                      className="mt-1 w-4 h-4 cursor-pointer flex-shrink-0"
                      style={{ accentColor: "#6366f1" }}
                      aria-label={`选择 ${item.title} 参与对比`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white leading-snug line-clamp-2">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {item.platform || "—"} · {formatDeadlineSafe(item.deadline)}
                      </p>
                      {item.prizeRaw && (
                        <p className="text-xs font-semibold text-emerald-400 mt-0.5 truncate">{item.prizeRaw}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleWatch(item)}
                      className="flex-shrink-0 px-2 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-400 transition-colors"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      移出
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 底部：清空（两步确认） + 开始对比 */}
        {watchlist.length > 0 && (
          <div
            className="px-5 py-4 space-y-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-xs text-slate-600">
              已勾选 {selectedIds.length}/{COMPARE_MAX} 个用于对比
            </p>
            <div className="flex items-center gap-2">
              {confirmClear ? (
                <>
                  <button
                    type="button"
                    onClick={() => { onClear(); setConfirmClear(false); }}
                    className="px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                    style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.35)" }}
                  >
                    确认清空
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    取消
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-400 transition-colors"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  清空
                </button>
              )}
              <button
                type="button"
                onClick={onOpenCompare}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
              >
                开始对比（{selectedIds.length}）
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
