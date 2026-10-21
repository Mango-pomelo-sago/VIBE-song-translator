import { describe, expect, it } from "vitest";
import type { MorphToken, ProcessedLine } from "@/lib/types";
import { matchesGrammarFocus, summarizeGrammar } from "./grammar";

function tok(p: Partial<MorphToken> & { surface: string; basicForm: string }): MorphToken {
  return {
    reading: null,
    pos: "UNK",
    posDetail: "",
    ruby: [],
    romaji: null,
    ...p,
  };
}

function line(...tokens: MorphToken[]): ProcessedLine {
  return { index: 0, timeMs: 0, text: "", zh: null, zhSource: null, tokens };
}

const nounM = (basicForm: string) =>
  tok({ surface: basicForm, basicForm, pos: "NOUN", gender: "m", number: "sg" });
const nounF = (basicForm: string) =>
  tok({ surface: basicForm, basicForm, pos: "NOUN", gender: "f", number: "sg" });
const verb = (surface: string, infover: string, level = "A2") =>
  tok({
    surface,
    basicForm: surface,
    pos: "VERB",
    level,
    verb: {
      infinitive: infover,
      mood: "indicatif",
      tense: "présent",
      person: 3,
      number: "sg",
    },
  });

describe("summarizeGrammar", () => {
  it("按去重原形统计阴阳性名词、动词、形容词", () => {
    const lines = [
      line(nounM("ami"), nounM("ami"), nounF("nuit"), verb("chante", "chanter")),
      line(
        nounF("nuit"),
        tok({ surface: "belle", basicForm: "beau", pos: "ADJ", gender: "f" }),
        tok({ surface: "beau", basicForm: "beau", pos: "ADJ", gender: "m" }),
      ),
    ];
    const s = summarizeGrammar(lines);
    expect(s.masculine).toBe(1);
    expect(s.feminine).toBe(1);
    expect(s.verbs).toBe(1);
    expect(s.adjectives).toBe(1);
  });

  it("动词时态按原形去重", () => {
    const s = summarizeGrammar([
      line(verb("chante", "chanter"), verb("chantent", "chanter")),
    ]);
    expect(s.verbs).toBe(1);
    expect(s.tenses).toEqual([{ label: "现在时", count: 1 }]);
  });

  it("B1+ 只统计 B1/B2/C1 词", () => {
    const s = summarizeGrammar([
      line(
        nounM("ami"),
        tok({ surface: "amour", basicForm: "amour", pos: "NOUN", level: "B1" }),
        tok({ surface: "chat", basicForm: "chat", pos: "NOUN", level: "A1" }),
        tok({ surface: "rare", basicForm: "rare", pos: "ADJ", level: "C1" }),
      ),
    ]);
    expect(s.b1plus).toBe(2);
  });

  it("没有 token 时返回零值", () => {
    expect(summarizeGrammar([line()])).toMatchObject({
      masculine: 0,
      feminine: 0,
      verbs: 0,
      adjectives: 0,
      b1plus: 0,
      tenses: [],
    });
  });
});

describe("matchesGrammarFocus", () => {
  it("按阴阳性、动词、形容词、B1+ 匹配", () => {
    expect(matchesGrammarFocus(nounM("ami"), "m")).toBe(true);
    expect(matchesGrammarFocus(nounM("ami"), "f")).toBe(false);
    expect(matchesGrammarFocus(nounF("nuit"), "f")).toBe(true);
    expect(matchesGrammarFocus(verb("chante", "chanter", "B1"), "verb")).toBe(true);
    expect(matchesGrammarFocus(nounM("ami"), "verb")).toBe(false);
    expect(
      matchesGrammarFocus(
        tok({ surface: "belle", basicForm: "beau", pos: "ADJ", level: "B1" }),
        "adj",
      ),
    ).toBe(true);
    expect(matchesGrammarFocus(nounM("ami"), "b1plus")).toBe(false);
    expect(
      matchesGrammarFocus(
        tok({ surface: "amour", basicForm: "amour", pos: "NOUN", level: "B1" }),
        "b1plus",
      ),
    ).toBe(true);
  });
});
