"use client";

/**
 * 日系夏日感背景装饰：电线杆线条 + 云朵轮廓 + 斜阳射线。
 * 纯 SVG 极细线描边，pinned 全屏背景层，pointer-events: none 不阻挡交互。
 */
export default function SummerDecor() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-4 overflow-hidden"
      aria-hidden
    >
      
      {/* ── 电线杆线条：三条微微下垂的弧线 ── */}
      <svg
        className="absolute inset-x-0 top-0 h-[38vh] w-full"
        viewBox="0 0 1440 300"
        preserveAspectRatio="none"
        fill="none"
      >
        {/* 电线杆顶部小圆点 */}
        {[60, 380, 760, 1080, 1380].map((x) => (
          <circle key={x} cx={x} cy={0} r="2.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none" />
        ))}
        {/* 三条电线下垂弧线 */}
        <path d="M60 0 Q 400 90 760 45 Q 1120 0 1380 40" stroke="rgba(255,255,255,0.35)" strokeWidth="1" fill="none" />
        <path d="M60 0 Q 480 140 760 90 Q 1100 40 1380 90" stroke="rgba(255,255,255,0.28)" strokeWidth="1" fill="none" />
        <path d="M60 0 Q 520 175 760 130 Q 1080 85 1380 130" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
      </svg>

      {/* ── 云朵轮廓：3-4 朵线描云，缓慢上下漂移 ── */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {/* 云朵路径：由相连圆弧组成的线描云 */}
        <g className="animate-float" style={{ animationDuration: "9s" }}>
          <path
            d="M90 300 a30 30 0 0 1 30 -30 a24 24 0 0 1 46 0 a28 28 0 0 1 44 12 a22 22 0 0 1 0 18 h-120 z"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.2"
          />
        </g>
        <g className="animate-float" style={{ animationDuration: "12s", animationDelay: "-4s" }}>
          <path
            d="M500 180 a26 26 0 0 1 26 -26 a20 20 0 0 1 38 0 a24 24 0 0 1 36 10 a18 18 0 0 1 0 16 h-100 z"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.2"
          />
        </g>
        <g className="animate-float" style={{ animationDuration: "14s", animationDelay: "-8s" }}>
          <path
            d="M980 260 a34 34 0 0 1 34 -34 a26 26 0 0 1 50 0 a30 30 0 0 1 46 14 a24 24 0 0 1 0 20 h-130 z"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="1.2"
          />
        </g>
        <g className="animate-float" style={{ animationDuration: "11s", animationDelay: "-2s" }}>
          <path
            d="M1250 120 a24 24 0 0 1 24 -24 a18 18 0 0 1 34 0 a22 22 0 0 1 32 10 a16 16 0 0 1 0 14 h-90 z"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.2"
          />
        </g>
      </svg>
    </div>
  );
}