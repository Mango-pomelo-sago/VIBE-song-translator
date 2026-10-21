import { beforeEach, describe, expect, it } from "vitest";
import { tokenizeFrench } from "./tokenize";
import { applyLiaisons } from "./liaison";
import { __setLexiconForTest } from "./lexicon";
import { FR_FIXTURE } from "./test-fixtures";
import type { MorphToken } from "@/lib/types";

beforeEach(() => {
  __setLexiconForTest(FR_FIXTURE);
});

function analyze(text: string): MorphToken[] {
  const tokens = tokenizeFrench(text);
  applyLiaisons(tokens);
  return tokens;
}

describe("applyLiaisons", () => {
  it("les amis → 必须联诵 z", () => {
    const [les] = analyze("les amis");
    expect(les.liaison).toEqual({ type: "obligatory", phoneme: "z" });
  });

  it("un ami → 必须联诵 n", () => {
    const [un] = analyze("un ami");
    expect(un.liaison).toEqual({ type: "obligatory", phoneme: "n" });
  });

  it("petit ami → 必须联诵 t", () => {
    const [petit] = analyze("petit ami");
    expect(petit.liaison).toEqual({ type: "obligatory", phoneme: "t" });
  });

  it("et 后禁止联诵", () => {
    const [et] = analyze("et un");
    expect(et.liaison).toEqual({ type: "forbidden", phoneme: null });
  });

  it("h aspiré 禁止联诵（les hiboux）", () => {
    const [les] = analyze("les hiboux");
    expect(les.liaison).toEqual({ type: "forbidden", phoneme: null });
  });

  it("省音形式不联诵（l'ami）", () => {
    const [l] = analyze("l'ami");
    expect(l.elision).toEqual({ fullForm: "le" });
    expect(l.liaison).toBeUndefined();
  });

  it("trop aimable → 可选联诵", () => {
    const [trop] = analyze("trop aimable");
    expect(trop.liaison).toEqual({ type: "optional", phoneme: "p" });
  });

  it("单数名词后禁止联诵（chat adorable）", () => {
    const [chat] = analyze("chat adorable");
    expect(chat.liaison).toEqual({ type: "forbidden", phoneme: null });
  });

  it("辅音开头不触发", () => {
    const [les] = analyze("les chats");
    expect(les.liaison).toBeUndefined();
  });

  it("标点阻断联诵", () => {
    const tokens = analyze("les, amis");
    const les = tokens[0];
    expect(les.liaison).toBeUndefined();
  });
});
