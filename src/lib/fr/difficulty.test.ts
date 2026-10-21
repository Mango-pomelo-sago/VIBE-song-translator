import { describe, expect, it } from "vitest";
import { scoreFrenchLines } from "./difficulty";
import type { MorphToken, ProcessedLine } from "@/lib/types";

function token(
  surface: string,
  pos: string,
  level: string | null,
): MorphToken {
  return {
    surface,
    reading: null,
    basicForm: surface,
    pos,
    posDetail: "",
    ruby: [],
    romaji: null,
    level,
  };
}

function line(tokens: MorphToken[], index = 0): ProcessedLine {
  return {
    index,
    timeMs: null,
    text: tokens.map((t) => t.surface).join(" "),
    zh: null,
    zhSource: null,
    tokens,
  };
}

describe("scoreFrenchLines", () => {
  it("A1 内容词 → beginner 且带 CEFR 口径", () => {
    const d = scoreFrenchLines([line([token("bonjour", "NOUN", "A1")])]);
    expect(d).not.toBeNull();
    expect(d!.scheme).toBe("cefr");
    expect(d!.level).toBe("beginner");
    expect(d!.averageLevel).toBe("A1");
    expect(d!.vocabCount).toBe(1);
  });

  it("B2/C1 → advanced", () => {
    const d = scoreFrenchLines([
      line([token("chatouiller", "VERB", "C1"), token("hiboux", "NOUN", "B2")]),
    ]);
    expect(d!.score).toBe(90);
    expect(d!.level).toBe("advanced");
    expect(d!.averageLevel).toBe("C1");
  });

  it("未知词不计均值但计入 unknownCount", () => {
    const d = scoreFrenchLines([
      line([token("bonjour", "NOUN", "A1"), token("xyzzy", "NOUN", null)]),
    ]);
    expect(d!.vocabCount).toBe(2);
    expect(d!.unknownCount).toBe(1);
    expect(d!.averageLevel).toBe("A1");
  });

  it("忽略功能词", () => {
    const d = scoreFrenchLines([
      line([token("le", "DET", "A1"), token("et", "CONJ", "A1")]),
    ]);
    expect(d).toBeNull();
  });

  it("无内容词返回 null", () => {
    expect(scoreFrenchLines([line([])])).toBeNull();
  });
});
