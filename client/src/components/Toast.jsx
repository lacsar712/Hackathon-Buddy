export default function Toast({ toast }) {
  if (!toast || !toast.message) return null;

  const palette = {
    success: {
      bg: "rgba(16,185,129,0.14)",
      border: "rgba(16,185,129,0.35)",
      color: "#6ee7b7",
    },
    error: {
      bg: "rgba(239,68,68,0.14)",
      border: "rgba(239,68,68,0.35)",
      color: "#fca5a5",
    },
    info: {
      bg: "rgba(59,130,246,0.14)",
      border: "rgba(59,130,246,0.35)",
      color: "#93c5fd",
    },
  };
  const c = palette[toast.type] || palette.info;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] pointer-events-none px-4">
      <div
        className="animate-fade-in px-4 py-2.5 rounded-xl text-sm font-semibold backdrop-blur-md shadow-2xl whitespace-nowrap"
        style={{
          background: c.bg,
          color: c.color,
          border: `1px solid ${c.border}`,
        }}
      >
        {toast.message}
      </div>
    </div>
  );
}
