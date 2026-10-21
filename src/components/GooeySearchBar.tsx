"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GooeyFilter from "./GooeyFilter";
import SearchIcon from "./SearchIcon";
import LoadingIcon from "./LoadingIcon";
import { isUnsupportedBrowser } from "@/lib/isUnsupportedBrowser";

type Props = {
  onSearch?: (query: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

/** ── 原版 Codrops 两态动画（复刻 App.jsx） ── */
const buttonVariants = {
  initial: { x: 0, width: 100 },
  step1: { x: 0, width: 100 },
  step2: { x: -30, width: 180 },
};

const iconVariants = {
  hidden: { x: -50, opacity: 0 },
  visible: { x: 16, opacity: 1 },
};

/** 忠实复刻 Codrops 粘性搜索：折叠胶囊 → 弹性展开成输入框 + 独立圆形图标，液态融合 */
export default function GooeySearchBar({
  onSearch,
  disabled = false,
  placeholder = "输入日文歌名…",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [query, setQuery] = useState("");

  const isUnsupported = useMemo(() => isUnsupportedBrowser(), []);

  // step=2 自动聚焦输入框；step=1 清空状态（复刻原版 useEffect）
  function handleButtonClick() {
    setStep(2);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    onSearch?.(q);
  }

  return (
    <div className={isUnsupported ? "gooey-search no-goo" : "gooey-search"}>
      <GooeyFilter />

      <div className="gooey-stage">
        <motion.div
          className="gooey-inner"
          initial="initial"
          animate={step === 1 ? "step1" : "step2"}
          transition={{ duration: 0.75, type: "spring", bounce: 0.15 }}
        >
          <motion.div
            variants={buttonVariants}
            onClick={handleButtonClick}
            whileHover={{ scale: step === 2 ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="gs-btn"
            role="button"
          >
            {step === 1 ? (
              <span className="gs-text">搜索</span>
            ) : (
              <form onSubmit={submit} className="gs-form">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="gs-input"
                  placeholder={placeholder}
                  aria-label="歌名搜索"
                />
              </form>
            )}
          </motion.div>

          <AnimatePresence mode="wait">
            {step === 2 && (
              <motion.div
                key="icon"
                className="gs-separate"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={iconVariants}
                transition={{
                  delay: 0.1,
                  duration: 0.85,
                  type: "spring",
                  bounce: 0.15,
                }}
                onClick={() => submit()}
                role="button"
                aria-label="搜索"
              >
                {!disabled ? (
                  <SearchIcon isUnsupported={isUnsupported} />
                ) : (
                  <LoadingIcon />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}