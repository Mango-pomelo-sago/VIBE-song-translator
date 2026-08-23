"use client";

import { useEffect } from "react";
import { Disc3 } from "lucide-react";
import SdfLensBlur from "@/components/SdfLensBlur";

/** 全局错误边界：根布局级错误（global-error 必须自带 html/body）。 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body className="bg-clouds font-sans antialiased">
        <div className="flex min-h-screen items-center justify-center px-5">
          <div className="glass-card relative w-full max-w-md p-6 text-center">
            <SdfLensBlur />
            <div className="relative z-10">
              <div className="flex justify-center text-4xl" aria-hidden>
                <Disc3 size={40} />
              </div>
              <h2 className="font-sc mt-3 text-lg font-bold text-ink">播放出现了严重问题</h2>
              <p className="font-sc mt-1 text-sm text-ink/70">
                页面加载失败（{error.message ?? "未知错误"}）。
              </p>
              <button
                type="button"
                onClick={() => reset()}
                className="bauhaus-btn bauhaus-btn-blue mt-4 px-5 py-2 text-sm"
              >
                重试
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}