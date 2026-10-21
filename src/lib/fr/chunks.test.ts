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
});
