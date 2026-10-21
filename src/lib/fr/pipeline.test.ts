/** 使用真实 lexicon.json 的整行集成测试（不加 fixture，验证生成物可用） */

import { beforeAll, describe, expect, it } from "vitest";
import { lexiconSize, __setLexiconForTest } from "./lexicon";
import { frProfile } from "@/lib/lang/fr";
import type { ProcessedLine } from "@/lib/types";

beforeAll(() => {
  __setLexiconForTest(null);
});

describe("法语标注管线（真实词表）", () => {
  it("词表已生成且规模合理", () => {
    expect(lexiconSize()).toBeGreaterThan(50_000);
  });

  it("Les amis sont arrivés 得到 IPA、联诵与意群", async () => {
    const a = await frProfile.annotateLine("Les amis sont arrivés");
    const [les, amis, sont, arrives] = a.tokens;

    expect(les.ipa).toBe("le");
    expect(amis.ipa).toBe("ami");
    expect(les.liaison).toEqual({ type: "obligatory", phoneme: "z" });
    expect(sont.liaison).toEqual({ type: "obligatory", phoneme: "t" });
    expect(arrives.verb).toMatchObject({ infinitive: "arriver", mood: "participe" });
    expect(amis.number).toBe("pl");

    // 名词主语与谓语分成两个意群，联诵各自保留在所属意群里
    expect(a.chunks.map((c) => c.text)).toEqual(["Les amis", "sont arrivés"]);
    expect(a.chunks[0].kind).toBe("np");
    expect(a.chunks[1].kind).toBe("vp");
    expect(a.chunks[0].romaji).toContain("‿z");
    expect(a.chunks[1].romaji).toContain("‿t");
    expect(a.ruby.some((r) => r.kind === "ipa")).toBe(true);
    expect(a.readingLine).toBeTruthy();
  });

  it("难度评分为 CEFR 口径", async () => {
    const a = await frProfile.annotateLine("Les amis sont arrivés");
    const line: ProcessedLine = {
      index: 0,
      timeMs: 0,
      text: "Les amis sont arrivés",
      zh: null,
      zhSource: null,
      tokens: a.tokens,
    };
    const d = frProfile.scoreDifficulty([line]);
    expect(d?.scheme).toBe("cefr");
    expect(d?.averageLevel).toMatch(/^(A1|A2|B1|B2|C1)$/);
  });

  it("省音与弯引号在真实词表下正常", async () => {
    const a = await frProfile.annotateLine("J’ai perdu le nord");
    expect(a.tokens.map((t) => t.surface)).toEqual(["J'", "ai", "perdu", "le", "nord"]);
    expect(a.tokens[0].elision).toEqual({ fullForm: "je" });
    expect(a.tokens[0].ipa).toBe("ʒ");
    expect(a.tokens[1].verb?.infinitive).toBe("avoir");
  });
});
