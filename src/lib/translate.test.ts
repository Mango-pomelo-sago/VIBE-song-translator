import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ chat: vi.fn() }));
vi.mock("./ai", () => ({
  chat: mocks.chat,
  isConfigured: () => true,
  AiNotConfiguredError: class extends Error {},
}));

import { clearTranslateCache, hasTranslateCache, translateMissingLines } from "./translate";

const SONG = { id: 9001, name: "夜に駆ける" };

beforeEach(() => {
  mocks.chat.mockReset();
  clearTranslateCache();
});

afterEach(() => {
  mocks.chat.mockReset();
});

function replyJson(translations: Array<{ index: number; zh: string }>) {
  mocks.chat.mockResolvedValue(
    JSON.stringify({ translations }),
  );
}

describe("translateMissingLines", () => {
  it("空/全空行 → 空映射，不调 AI", async () => {
    expect(await translateMissingLines(SONG, "", [])).toEqual(new Map());
    expect(await translateMissingLines(SONG, "", [{ index: 1, text: "  " }])).toEqual(
      new Map(),
    );
    expect(mocks.chat).not.toHaveBeenCalled();
  });

  it("解析返回的 index→zh，漏译行跳过", async () => {
    replyJson([
      { index: 0, zh: "在夜里奔跑" },
      { index: 2, zh: "却无法追上你" },
    ]);
    const map = await translateMissingLines(SONG, "", [
      { index: 0, text: "夜に駆けて" },
      { index: 1, text: "追いかけて" },
      { index: 2, text: "届かなくて" },
    ]);
    expect(map.get(0)).toBe("在夜里奔跑");
    expect(map.get(2)).toBe("却无法追上你");
    expect(map.has(1)).toBe(false);
    expect(mocks.chat).toHaveBeenCalledTimes(1);
  });

  it("超过分块大小自动分块并合并", async () => {
    replyJson(
      Array.from({ length: 30 }, (_, i) => ({ index: i, zh: `译${i}` })),
    );
    const missing = Array.from({ length: 30 }, (_, i) => ({ index: i, text: `行${i}` }));
    const map = await translateMissingLines(SONG, "", missing);
    expect(map.size).toBe(30);
    expect(map.get(29)).toBe("译29");
    // 30 行 → 25 + 5 两块
    expect(mocks.chat).toHaveBeenCalledTimes(2);
  });

  it("模型把 JSON 包在代码块里也能解析", async () => {
    mocks.chat.mockResolvedValue('```json\n{"translations":[{"index":0,"zh":"你好"}]}\n```');
    const map = await translateMissingLines(SONG, "", [
      { index: 0, text: "こんにちは" },
    ]);
    expect(map.get(0)).toBe("你好");
  });

  it("按 songId 缓存：第二次直接返回不再调 AI", async () => {
    replyJson([{ index: 0, zh: "缓存结果" }]);
    const song2 = { id: 9002, name: "Lemon" };
    const a = await translateMissingLines(song2, "", [{ index: 0, text: "夢ならば" }]);
    const b = await translateMissingLines(song2, "", [{ index: 0, text: "夢ならば" }]);
    expect(a.get(0)).toBe("缓存结果");
    expect(b.get(0)).toBe("缓存结果");
    expect(hasTranslateCache(song2.id)).toBe(true);
    expect(mocks.chat).toHaveBeenCalledTimes(1);
  });
});
