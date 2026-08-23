"use client";

import { useEffect, useRef } from "react";

const SIZES = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-24 w-24",
} as const;

type Size = keyof typeof SIZES;

/** Rose Two 曲线配色：轨迹线白色 + 粒子包豪斯蓝 */
const TRAIL_COLOR = "#ffffff";
const PARTICLE_COLOR = "#0284c7";

/** Rose Two 曲线参数（r = a·cos(2θ)，带呼吸 + 旋转 + 粒子拖尾） */
const CONFIG = {
  particleCount: 74,
  trailSpan: 0.3,
  durationMs: 5200,
  rotationDurationMs: 28000,
  pulseDurationMs: 4300,
  strokeWidth: 4.6,
  roseA: 9.2,
  roseABoost: 0.6,
  roseBreathBase: 0.72,
  roseBreathBoost: 0.28,
  roseScale: 3.25,
};

function normalizeProgress(progress: number) {
  return ((progress % 1) + 1) % 1;
}

/** 呼吸：随时间在 0.52 ~ 1.0 之间脉动，放大/缩小曲线细节 */
function getDetailScale(time: number) {
  const pulseProgress = (time % CONFIG.pulseDurationMs) / CONFIG.pulseDurationMs;
  const pulseAngle = pulseProgress * Math.PI * 2;
  return 0.52 + ((Math.sin(pulseAngle + 0.55) + 1) / 2) * 0.48;
}

/** 缓慢整体旋转（绕 viewBox 中心 50,50） */
function getRotation(time: number) {
  return -((time % CONFIG.rotationDurationMs) / CONFIG.rotationDurationMs) * 360;
}

/** 曲线上任意进度的点：r(t) = (a + boost·s)(breath 基底 + boost·s)·cos(2t) */
function pointOnRose(progress: number, detailScale: number) {
  const t = progress * Math.PI * 2;
  const a = CONFIG.roseA + detailScale * CONFIG.roseABoost;
  const r =
    a *
    (CONFIG.roseBreathBase + detailScale * CONFIG.roseBreathBoost) *
    Math.cos(2 * t);
  return {
    x: 50 + Math.cos(t) * r * CONFIG.roseScale,
    y: 50 + Math.sin(t) * r * CONFIG.roseScale,
  };
}

function buildPath(detailScale: number, steps = 480) {
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const p = pointOnRose(i / steps, detailScale);
    d += `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }
  return d;
}

/** Rose Two 曲线动画（可旋转玫瑰曲线 + 粒子拖尾），轨迹线白色 / 粒子包豪斯蓝 */
export default function RoseCurve({ size = "md" }: { size?: Size }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const group = groupRef.current;
    const path = pathRef.current;
    if (!svg || !group || !path) return;

    // 粒子：沿曲线移动的圆点，尾部渐隐形成拖尾
    const particles = Array.from({ length: CONFIG.particleCount }, () => {
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      circle.setAttribute("fill", PARTICLE_COLOR);
      group.appendChild(circle);
      return circle;
    });

    const startedAt = performance.now();
    let raf = 0;

    const render = (now: number) => {
      const time = now - startedAt;
      const progress = (time % CONFIG.durationMs) / CONFIG.durationMs;
      const detailScale = getDetailScale(time);

      group.setAttribute("transform", `rotate(${getRotation(time)} 50 50)`);
      path.setAttribute("d", buildPath(detailScale));

      particles.forEach((node, index) => {
        const tailOffset = index / (CONFIG.particleCount - 1);
        const p = pointOnRose(
          normalizeProgress(progress - tailOffset * CONFIG.trailSpan),
          detailScale,
        );
        const fade = Math.pow(1 - tailOffset, 0.56);
        node.setAttribute("cx", p.x.toFixed(2));
        node.setAttribute("cy", p.y.toFixed(2));
        node.setAttribute("r", (0.9 + fade * 2.7).toFixed(2));
        node.setAttribute("opacity", (0.04 + fade * 0.96).toFixed(3));
      });

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      particles.forEach((p) => p.remove());
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden
      className={`relative z-10 shrink-0 ${SIZES[size]}`}
      >
      <g ref={groupRef}>
        <path
          ref={pathRef}
          stroke={TRAIL_COLOR}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={CONFIG.strokeWidth}
          opacity="0.35"
        />
      </g>
    </svg>
  );
}