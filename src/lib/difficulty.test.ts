import { describe, expect, it } from "vitest";
import {
  DIFFICULTY_LABELS,
  scoreLines,
  unknownRatio,
  wordDifficulty,
} from "./difficulty";
import type { MorphToken, ProcessedLine } from "./types";

function tok(surface: string, pos: string, basicForm = surface): MorphToken {
  return { surface, reading: null, basicForm, pos, posDetail: "", ruby: [], romaji: null };
}

function line(tokens: MorphToken[], text = tokens.map((t) => t.surface).join("")): ProcessedLine {
  return { index: 0, timeMs: 0, text, zh: null, zhSource: null, tokens };
}

describe("difficulty.wordDifficulty", () => {
  it("N5=1 … N1=5", () => {
    expect(wordDifficulty("空")).toBe(1); // N5
    expect(wordDifficulty("世界")).toBe(2); // N4
    expect(wordDifficulty("儚い")).toBe(4); // N2
  });
  it("词表未收录 → null", () => {
    expect(wordDifficulty("ホバークラフト")).toBeNull();
  });
});

describe("difficulty.scoreLines", () => {
  it("已知内容词取平均等级 → 分数与档位", () => {
    // 空/海 均为 N5（=1）→ avg 1 → 20 分 → 入门
    const d = scoreLines([
      line([tok("空", "名詞"), tok("を", "助詞"), tok("見る", "動詞")]),
      line([tok("海", "名詞"), tok("好き", "形容詞")]),
    ]);
    expect(d).not.toBeNull();
    expect(d!.score).toBe(20);
    expect(d!.level).toBe("beginner");
    expect(DIFFICULTY_LABELS[d!.level]).toBe("入门");
  });

  it("未知词不计入均值，但记入 unknownCount", () => {
    const d = scoreLines([
      line([tok("空", "名詞"), tok("ホバークラフト", "名詞")]),
    ]);
    expect(d!.vocabCount).toBe(2);
    expect(d!.unknownCount).toBe(1);
    // 已知仅 空（N5=1）→ avg 1 → 20 分
    expect(d!.score).toBe(20);
  });

  it("全部未知 → 中性 55 分 + unknownRatio=1", () => {
    const d = scoreLines([line([tok("ホバークラフト", "名詞")])]);
    expect(d!.score).toBe(55);
    expect(d!.level).toBe("intermediate");
    expect(unknownRatio(d)).toBe(1);
  });

  it("无内容词（纯助词/空行）→ null", () => {
    expect(scoreLines([line([tok("を", "助詞")])])).toBeNull();
    expect(scoreLines([])).toBeNull();
  });

  it("档位阈值：<40 入门 / <70 进阶 / ≥70 挑战", () => {
    // N2 词（=4）→ 80 分 → 挑战
    const hard = scoreLines([line([tok("儚い", "形容詞")])]);
    expect(hard!.score).toBe(80);
    expect(hard!.level).toBe("advanced");
    // N3 词（=3）→ 60 分 → 进阶
    const mid = scoreLines([line([tok("永遠", "名詞")])]);
    expect(mid!.score).toBe(60);
    expect(mid!.level).toBe("intermediate");
  });
});
