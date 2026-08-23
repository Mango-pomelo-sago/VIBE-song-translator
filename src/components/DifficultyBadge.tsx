import type { DifficultyLevel, DifficultyScore } from "@/lib/difficulty";
import { DIFFICULTY_LABELS, unknownRatio } from "@/lib/difficulty";

/** 等级配色：入门绿 → 进阶琥珀 → 挑战红 */
export const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  beginner: "#6CBE6A",
  intermediate: "#f59e0b",
  advanced: "#fb7185",
};

const BADGE_BG: Record<DifficultyLevel, string> = {
  beginner: "#f0fdf4",
  intermediate: "#fff7e6",
  advanced: "#fef1f2",
};

type Props = {
  difficulty: DifficultyScore | null | undefined;
  /** 紧凑模式：只显示分档文字徽章（推荐行用） */
  compact?: boolean;
};

/**
 * 歌曲难度徽章：0-100 分 + 档位（入门/进阶/挑战）。
 * 覆盖不足（词表未收录比例高）时给出「近似」提示，避免误导。
 */
export default function DifficultyBadge({ difficulty, compact }: Props) {
  if (!difficulty) return null;
  const color = DIFFICULTY_COLORS[difficulty.level];
  const label = DIFFICULTY_LABELS[difficulty.level];
  const ratio = unknownRatio(difficulty);
  const approx = ratio > 0.5;

  if (compact) {
    return (
      <span
        className="font-sc inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-bold leading-none"
        style={{ backgroundColor: BADGE_BG[difficulty.level], borderColor: color, color }}
        title={
          approx
            ? `该曲目 ${difficulty.unknownCount}/${difficulty.vocabCount} 词未收录词表，难度为近似值`
            : `难度分 ${difficulty.score}（${label}）`
        }
      >
        {label}
        {approx ? <span className="font-romaji opacity-70">·~</span> : null}
      </span>
    );
  }

  return (
    <div
      className="font-sc inline-flex flex-col items-center gap-0.5 rounded border-2 px-2 py-1 leading-none"
      style={{
        backgroundColor: BADGE_BG[difficulty.level],
        borderColor: color,
        color,
      }}
      title={`内容词平均 JLPT 等级 → 难度分 ${difficulty.score}（0-100，越高越难）`}
    >
      <span className="font-romaji text-lg font-bold">{Math.round(difficulty.score / 10)}/10</span>
      <span className="text-[11px] font-bold">{label}</span>
      {approx ? (
        <span className="font-romaji text-[10px] opacity-70">覆盖率低 · 近似</span>
      ) : null}
    </div>
  );
}
