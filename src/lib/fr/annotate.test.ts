import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../ai", () => ({ chat: vi.fn() }));

import { chat } from "../ai";
import {
  BATCH,
  MAX_CALLS,
  MAX_LEMMAS,
  annotateLyrics,
  clearAnnotateCache,
  collectLemmas,
} from "../annotate";

const chatMock = vi.mocked(chat);

/** 从 user prompt 中取回本次请求的 lemma 列表 */
function lemmasOf(messages: Array<{ role: string; content: string }>): string[] {
  const user = messages.find((m) => m.role === "user")!.content;
  return user.split("\n\n")[0].split("\n").slice(1);
}

const okChat = async (messages: Array<{ role: string; content: string }>) =>
  JSON.stringify({
    lemmas: lemmasOf(messages).map((lemma) => ({
      lemma,
      glossZh: `释义:${lemma}`,
      note: null,
    })),
  });

beforeEach(() => {
  clearAnnotateCache();
  chatMock.mockReset();
  chatMock.mockImplementation(okChat as never);
});

describe("collectLemmas", () => {
  it("只收内容词、按 lemma 去重", () => {
    const lemmas = collectLemmas([
      { text: "Les amis sont arrivés" },
      { text: "Les amis sont partis" },
    ]);
    // 限定词/助动词/介词不进列表
    expect(lemmas).not.toContain("les");
    expect(lemmas).not.toContain("sont");
    // 同一个 lemma 只出现一次
    expect(lemmas.filter((l) => l.toLowerCase() === "ami")).toHaveLength(1);
    expect(lemmas.length).toBeGreaterThan(0);
  });

  it("忽略空行", () => {
    expect(collectLemmas([{ text: "   " }])).toEqual([]);
  });

  it("上限为 MAX_LEMMAS", () => {
    // 用真实歌词构造远超上限的行数
    const lines = Array.from({ length: 400 }, (_, i) => ({
      text: `L'amour ${i % 2 ? "chante" : "danse"} dans la nuit`,
    }));
    expect(collectLemmas(lines).length).toBeLessThanOrEqual(MAX_LEMMAS);
  });
});

describe("annotateLyrics", () => {
  it("调用 AI 并返回与 lemma 对应的释义", async () => {
    const result = await annotateLyrics(1, [{ text: "Les amis sont arrivés" }]);
    expect(chatMock).toHaveBeenCalledTimes(1);
    const sent = lemmasOf(chatMock.mock.calls[0][0] as never);
    expect(result.map((r) => r.lemma)).toEqual(sent);
    expect(result.every((r) => r.glossZh.startsWith("释义:"))).toBe(true);
    expect(result.length).toBeLessThanOrEqual(BATCH);
  });

  it("忽略请求列表以外的 lemma", async () => {
    chatMock.mockResolvedValue(
      JSON.stringify({
        lemmas: [
          { lemma: "ami", glossZh: "朋友" },
          { lemma: "zzz-not-requested", glossZh: "不该出现" },
        ],
      }) as never,
    );
    const result = await annotateLyrics(2, [{ text: "Les amis sont arrivés" }]);
    expect(result.map((r) => r.lemma)).not.toContain("zzz-not-requested");
  });

  it("30 天缓存：同一首歌只调用一次", async () => {
    const lines = [{ text: "Les amis sont arrivés" }];
    await annotateLyrics(3, lines);
    await annotateLyrics(3, lines);
    expect(chatMock).toHaveBeenCalledTimes(1);
  });

  it("响应不是 JSON 时抛错", async () => {
    chatMock.mockResolvedValue("这不是 JSON" as never);
    await expect(
      annotateLyrics(4, [{ text: "Les amis sont arrivés" }]),
    ).rejects.toThrow(/JSON/);
  });

  it("zod 拒绝结构错误的 JSON", async () => {
    chatMock.mockResolvedValue(JSON.stringify({ lemmas: [{ lemma: 1 }] }) as never);
    await expect(
      annotateLyrics(5, [{ text: "Les amis sont arrivés" }]),
    ).rejects.toThrow();
  });

  it("兼容被 ```json 包裹的响应", async () => {
    chatMock.mockResolvedValue(
      '```json\n{"lemmas":[{"lemma":"ami","glossZh":"朋友"}]}\n```' as never,
    );
    const result = await annotateLyrics(6, [{ text: "Les amis sont arrivés" }]);
    expect(result).toEqual([{ lemma: "ami", glossZh: "朋友" }]);
  });

  it("非法语直接返回空数组，不调用 AI", async () => {
    expect(await annotateLyrics(7, [{ text: "Les amis" }], undefined, "ja")).toEqual(
      [],
    );
    expect(chatMock).not.toHaveBeenCalled();
  });

  it("限额常量符合计划", () => {
    expect(MAX_LEMMAS).toBe(200);
    expect(BATCH).toBe(60);
    expect(MAX_CALLS).toBe(3);
  });
});
