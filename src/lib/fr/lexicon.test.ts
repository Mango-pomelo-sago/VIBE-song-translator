import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { lookupLexicon, normalizeWord, __setLexiconForTest } from "./lexicon";
import { parseInfover, describeVerb } from "./verbs";
import { FR_FIXTURE } from "./test-fixtures";

beforeEach(() => {
  __setLexiconForTest(FR_FIXTURE);
});

afterEach(() => {
  __setLexiconForTest(null);
});

describe("lookupLexicon", () => {
  it("查询变位形式得到原形与屈折信息", () => {
    const entry = lookupLexicon("ai");
    expect(entry).toMatchObject({
      lemma: "avoir",
      cgram: "AUX",
      ipa: "ɛ",
      infover: "ind:pre:1s",
      cefr: "A1",
    });
  });

  it("名词带阴阳性与单复数", () => {
    expect(lookupLexicon("amis")).toMatchObject({
      lemma: "ami",
      gender: "m",
      nombre: "pl",
      cefr: "A1",
    });
  });

  it("大小写与首尾空格不敏感", () => {
    expect(lookupLexicon("  Amis ")?.lemma).toBe("ami");
  });

  it("未收录返回 null", () => {
    expect(lookupLexicon("xyzzy")).toBeNull();
    expect(lookupLexicon("")).toBeNull();
  });

  it("normalizeWord 统一小写与 NFC", () => {
    expect(normalizeWord("ÉTÉ")).toBe("été");
  });
});

describe("parseInfover", () => {
  it("直陈式现在时第一人称单数", () => {
    expect(parseInfover("ind:pre:1s", "avoir")).toEqual({
      infinitive: "avoir",
      mood: "indicatif",
      tense: "présent",
      person: 1,
      number: "sg",
    });
  });

  it("条件式", () => {
    expect(parseInfover("cnd:pre:1s", "vouloir")).toMatchObject({
      mood: "conditionnel",
      person: 1,
    });
  });

  it("不定式", () => {
    expect(parseInfover("inf", "partir")).toEqual({
      infinitive: "partir",
      mood: "infinitif",
      tense: "présent",
      person: null,
      number: null,
    });
  });

  it("过去分词", () => {
    expect(parseInfover("par:pas", "partir")).toMatchObject({
      mood: "participe",
      tense: "passé",
      person: null,
    });
  });

  it("无法识别返回 null", () => {
    expect(parseInfover("", "x")).toBeNull();
    expect(parseInfover("zzz:pre", "x")).toBeNull();
  });

  it("describeVerb 输出可读描述", () => {
    expect(describeVerb(parseInfover("ind:pre:1s", "avoir")!)).toBe(
      "indicatif · présent · 1re pers. sg",
    );
  });
});
