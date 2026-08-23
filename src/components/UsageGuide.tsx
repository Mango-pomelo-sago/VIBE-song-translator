"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Search, Disc3, BookOpen, X } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: Search,
    title: "搜歌",
    desc: "输入日文歌名，自动抓取原版歌词与中文翻译。",
  },
  {
    n: "02",
    icon: Disc3,
    title: "读词",
    desc: "汉字上方标注罗马音，每行下方按文节断句。",
  },
  {
    n: "03",
    icon: BookOpen,
    title: "查词",
    desc: "hover 任意单词弹出释义与 JLPT 等级，一键收藏生词。",
  },
];

/** 使用说明弹窗：三步卡片（搜歌/读词/查词） */
export default function UsageGuide() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bauhaus-btn bauhaus-btn-blue whitespace-nowrap text-sm"
      >
        使用说明
      </button>

      {open
        ? createPortal(
            <div className="glass-modal-overlay z-[9999]" onClick={() => setOpen(false)}>
              <div
                className="glass-modal relative w-[32rem] max-w-[90vw] p-6"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 关闭按钮 */}
                <button
                  onClick={() => setOpen(false)}
                  className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-glass-hover hover:text-ink"
                  aria-label="关闭"
                >
                  <X size={14} />
                </button>

                <h2 className="font-display mb-5 text-center text-xl tracking-wide text-ink">
                  使用说明
                </h2>

                <div className="flex flex-row gap-3">
                  {STEPS.map((s, i) => (
                    <div
                      key={s.n}
                      className="glass-card relative flex flex-1 flex-col items-center gap-2 p-3 text-center"
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <span
                        className="font-display absolute right-1.5 top-0.5 text-3xl leading-none text-bauhaus-blue/20"
                        aria-hidden
                      >
                        {s.n}
                      </span>
                      <div className="shrink-0 text-2xl" aria-hidden>
                        <s.icon />
                      </div>
                      <div>
                        <h3 className="font-sc text-sm font-bold text-ink">
                          {s.title}
                        </h3>
                        <p className="font-sc mt-0.5 text-xs leading-snug text-ink/70">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="bauhaus-btn bauhaus-btn-blue mt-5 w-full text-xs"
                >
                  返回
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}