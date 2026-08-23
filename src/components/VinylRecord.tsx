const SIZES = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-24 w-24",
} as const;

type Size = keyof typeof SIZES;

/** 纯 CSS 黑胶唱片（可旋转），City Pop 主题视觉元素 */
export default function VinylRecord({ size = "md" }: { size?: Size }) {
  const box = SIZES[size];
  return (
    <div className={`relative shrink-0 ${box}`}>
      {/* 黑胶盘 */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 1px, #fff 1px, #fff 3px)",
        }}
        aria-hidden
      />
      {/* 旋转的盘面：标签 + 中心孔 + 高光点（让转动可见） */}
      <div className="animate-spin-slow absolute inset-0 rounded-full">
        <div
          className="absolute inset-[30%] rounded-full"
          style={{
            background:
              "conic-gradient(#f472b6 0deg 120deg, #0284c7 120deg 240deg, #fbbf24 240deg 360deg)",
          }}
          aria-hidden
        />
        <div className="absolute left-1/2 top-[26%] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white-soft/70" aria-hidden />
      </div>
      {/* 中心轴孔 */}
      <div className="absolute left-1/2 top-1/2 h-[12%] w-[12%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: "#1a1a1a" }} aria-hidden />
      {/* 静态反光 */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 40%, transparent 60%)",
        }}
        aria-hidden
      />
    </div>
  );
}