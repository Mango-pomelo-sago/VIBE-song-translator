import { beforeEach, describe, expect, it } from "vitest";
import { tokenizeFrench, splitWord, mapCgram, normalizeFrench } from "./tokenize";
import { __setLexiconForTest } from "./lexicon";
import { FR_FIXTURE } from "./test-fixtures";

beforeEach(() => {
  __setLexiconForTest(FR_FIXTURE);
});

const surfaces = (text: string) => tokenizeFrench(text).map((t) => t.surface);

describe("tokenizeFrench", () => {
  it("拆开省音并标注完整形式", () => {
    const tokens = tokenizeFrench("J'ai perdu le nord");
    expect(tokens.map((t) => t.surface)).toEqual(["J'", "ai", "perdu", "le", "nord"]);
    expect(tokens[0].elision).toEqual({ fullForm: "je" });
    expect(tokens[1].elision).toBeUndefined();
    expect(tokens[0].content).toBe(false);
  });

  it("省音形式去掉词尾 schwa", () => {
    const [j] = tokenizeFrench("J'ai");
    expect(j.ipa).toBe("ʒ");
  });

  it("弯引号归一后同样拆分", () => {
    const tokens = tokenizeFrench("l’amour");
    expect(tokens.map((t) => t.surface)).toEqual(["l'", "amour"]);
    expect(tokens[1].basicForm).toBe("amour");
  });

  it("aujourd'hui 不拆分", () => {
    expect(surfaces("aujourd'hui")).toEqual(["aujourd'hui"]);
    expect(splitWord("aujourd'hui")).toHaveLength(1);
  });

  it("连字符按原样保留空格信息", () => {
    const tokens = tokenizeFrench("Laisse-moi partir");
    expect(tokens.map((t) => t.surface)).toEqual([
      "Laisse",
      "-",
      "moi",
      "partir",
    ]);
    expect(tokens[1].spaceBefore).toBe(false);
    expect(tokens[2].spaceBefore).toBe(false);
    expect(tokens[3].spaceBefore).toBe(true);
  });

  it("spaceBefore 反映原文空格", () => {
    const tokens = tokenizeFrench("les amis");
    expect(tokens.map((t) => t.spaceBefore)).toEqual([false, true]);
  });

  it("省音后的宿主词不带多余空格", () => {
    const tokens = tokenizeFrench("Il me l'a dit");
    expect(tokens.map((t) => t.surface)).toEqual(["Il", "me", "l'", "a", "dit"]);
    expect(tokens.map((t) => t.spaceBefore)).toEqual([false, true, true, false, true]);
  });

  it("标点独立成 token", () => {
    const tokens = tokenizeFrench("Bonjour, le monde !");
    const puncts = tokens.filter((t) => t.pos === "PUNCT");
    expect(puncts.map((t) => t.surface)).toEqual([",", "!"]);
  });

  it("未登录词不猜测音标", () => {
    const [t] = tokenizeFrench("xyzzy");
    expect(t.pos).toBe("UNK");
    expect(t.ipa).toBeNull();
    expect(t.level).toBeNull();
    expect(t.ruby).toEqual([]);
  });

  it("名词标注阴阳性，动词标注变位", () => {
    const tokens = tokenizeFrench("l'amour");
    const amour = tokens[1];
    expect(amour.gender).toBe("m");
    expect(amour.number).toBe("sg");
    expect(amour.level).toBe("A1");

    const [, ai] = tokenizeFrench("j'ai");
    expect(ai.verb).toEqual({
      infinitive: "avoir",
      mood: "indicatif",
      tense: "présent",
      person: 1,
      number: "sg",
    });
  });

  it("形容词保留性数，用于配合提示", () => {
    const [petit] = tokenizeFrench("petit chat");
    expect(petit.pos).toBe("ADJ");
    expect(petit.gender).toBe("m");
    expect(petit.number).toBe("sg");
  });

  it("IPA ruby 的 kind 为 ipa", () => {
    const [t] = tokenizeFrench("amour");
    expect(t.ruby).toEqual([{ text: "amour", reading: "amuʁ", kind: "ipa" }]);
  });

  it("normalizeFrench 处理 NFC / 撇号 / NBSP", () => {
    expect(normalizeFrench("l’amour")).toBe("l'amour");
    expect(normalizeFrench("a b")).toBe("a b");
  });

  it("cgram 映射", () => {
    expect(mapCgram("NOM")).toBe("NOUN");
    expect(mapCgram("VER")).toBe("VERB");
    expect(mapCgram("PRO:per")).toBe("PRON");
    expect(mapCgram("ART:def")).toBe("DET");
    expect(mapCgram("XXX")).toBe("UNK");
  });
});
