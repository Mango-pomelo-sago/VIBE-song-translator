import { beforeEach, describe, expect, it } from "vitest";
import { tokenizeFrench } from "./tokenize";
import { applyLiaisons } from "./liaison";
import { segmentChunks } from "./chunks";
import { __setLexiconForTest } from "./lexicon";
import { FR_FIXTURE } from "./test-fixtures";
import type { Bunsetsu } from "@/lib/types";

beforeEach(() => {
  __setLexiconForTest(FR_FIXTURE);
});

function chunksOf(text: string): Bunsetsu[] {
  const tokens = tokenizeFrench(text);
  applyLiaisons(tokens);
  return segmentChunks(tokens);
}

describe("segmentChunks", () => {
  it("介词短语 dans la nuit → pp", () => {
    const [c] = chunksOf("dans la nuit");
    expect(c.kind).toBe("pp");
    expect(c.text).toBe("dans la nuit");
  });

  it("动词短语 je voudrais → vp", () => {
    const [c] = chunksOf("je voudrais");
    expect(c.kind).toBe("vp");
    expect(c.headIndex).toBe(1);
  });

  it("名词短语 le petit chat → np", () => {
    const [c] = chunksOf("le petit chat");
    expect(c.kind).toBe("np");
  });

  it("固定搭配 est-ce que → collocation", () => {
    const chunks = chunksOf("est-ce que");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].kind).toBe("collocation");
    expect(chunks[0].text).toBe("est-ce que");
  });

  it("je t'aime 作为一个固定搭配", () => {
    const chunks = chunksOf("je t'aime");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].kind).toBe("collocation");
  });

  it("标点切分意群且标点不入组", () => {
    const chunks = chunksOf("je danse, je chante");
    expect(chunks).toHaveLength(2);
    expect(chunks[0].text).toBe("je danse");
    expect(chunks[1].text).toBe("je chante");
  });

  it("联诵写进意群 IPA", () => {
    const [c] = chunksOf("les amis");
    expect(c.romaji).toBe("le‿zami");
  });

  it("意群 IPA 分段保留内容词标记", () => {
    const [c] = chunksOf("les amis");
    expect(c.romajiParts).toEqual([
      { text: "le‿z", head: false },
      { text: "ami", head: true },
    ]);
  });

  it("gloss 初始为 null，等待 AI 补充", () => {
    const [c] = chunksOf("le petit chat");
    expect(c.gloss).toBeNull();
  });

  it("主语、谓语与介词短语各自成组", () => {
    const chunks = chunksOf("Je vois la vie en rose");
    expect(chunks.map((c) => [c.kind, c.text])).toEqual([
      ["vp", "Je vois"],
      ["np", "la vie"],
      ["pp", "en rose"],
    ]);
  });

  it("谓语后的宾语另起名词短语", () => {
    const chunks = chunksOf("Il me dit des mots");
    expect(chunks.map((c) => c.text)).toEqual(["Il me dit", "des mots"]);
  });

  it("关系从句另起意群，不定式宾语不拆", () => {
    const chunks = chunksOf("Des yeux qui font baisser les miens");
    expect(chunks.map((c) => c.text)).toEqual([
      "Des yeux",
      "qui font",
      "baisser les miens",
    ]);
  });

  it("复合时态的助动词与分词不拆开", () => {
    const chunks = chunksOf("J'ai perdu le nord");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].kind).toBe("vp");
  });

  it("副词片段不会被介词误拆", () => {
    expect(chunksOf("il me parle tout bas")).toHaveLength(1);
  });

  it("助动词被标为普通动词时仍不拆分词", () => {
    const chunks = chunksOf("Il est entré dans mon coeur");
    expect(chunks.map((c) => c.text)).toEqual(["Il est entré", "dans mon coeur"]);
  });

  it("连词短语 dès que 不当作关系从句拆开", () => {
    const chunks = chunksOf("Et dès que je l'aperçois");
    expect(chunks.map((c) => c.text)).toEqual(["Et dès que je l'aperçois"]);
  });
});
