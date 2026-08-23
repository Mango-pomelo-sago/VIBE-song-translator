"use client";

import { useEffect } from "react";
import { Disc3 } from "lucide-react";
import SdfLensBlur from "@/components/SdfLensBlur";

/** 客户端错误边界：渲染失败时给出重试，而不是白屏 */
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
    <div className="bg-clouds relative flex min-h-screen items-center justify-center px-5">
      <div className="glass-card relative w-full max-w-md p-6 text-center">
        <SdfLensBlur />
        <div className="relative z-10">
          <div className="flex justify-center text-4xl" aria-hidden>
            <Disc3 size={40} />
          </div>
          <h2 className="font-sc mt-3 text-lg font-bold text-ink">播放出了点小问题</h2>
          <p className="font-sc mt-1 text-sm text-ink/70">
            页面渲染失败（{error.message ?? "未知错误"}）。刷新或重试试试。
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
  );
}