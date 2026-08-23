"use client";

/** 原版 Lucas Bebber 粘性滤镜：高斯模糊 + 颜色矩阵 + 合成（参数匹配 Codrops 原版） */
export default function GooeyFilter() {
  return (
    <svg aria-hidden="true" className="absolute -left-[9999px]" width="0" height="0">
      <defs>
        <filter id="goo-effect">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -15"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}