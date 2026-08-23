import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ chat: vi.fn() }));
vi.mock("./ai", () => ({
  chat: mocks.chat,
  isConfigured: () => true,
  AiNotConfiguredError: class extends Error {},
}));

import {
  clearNotesCache,
  generateNotes,
  hasNotesCache,
  parseNotes,
} from "./notes";

const VALID = {
  background: "主题",
  cultural: [{ snippet: "花火", title: "夏", detail: "解释" }],
  grammar: [
    {
      pattern: "〜てしまう",
      meaning: "表示遗憾",
      rule: "て形+しまう",
      example: "忘れてしまう",
      translation: "就这样忘了",
    },
  ],
};

const LINES = [{ text: "夜に駆けて" }, { text: "追いかけて" }];

beforeEach(() => {
  mocks.chat.mockReset();
  clearNotesCache();
});

describe("parseNotes", () => {
  it("合法 JSON 通过校验", () => {
    expect(parseNotes(JSON.stringify(VALID))).toEqual(VALID);
  });
  it("缺字段抛错", () => {
    expect(() => parseNotes('{"background":"x"}')).toThrow();
  });
  it("非 JSON 抛错", () => {
    expect(() => parseNotes("not json")).toThrow();
  });
});

describe("generateNotes", () => {
  it("空歌词抛错、不调 AI", async () => {
    await expect(generateNotes({ id: 7000, name: "X" }, "", [{ text: " " }])).rejects.toThrow(
      /歌词为空/,
    );
    expect(mocks.chat).not.toHaveBeenCalled();
  });

  it("首次即合法 → 缓存命中不再调 AI", async () => {
    const song = { id: 7001, name: "夜に駆ける" };
    mocks.chat.mockResolvedValue(JSON.stringify(VALID));
    const a = await generateNotes(song, "YOASOBI", LINES);
    expect(a.background).toBe("主题");
    expect(hasNotesCache(song.id)).toBe(true);
    const b = await generateNotes(song, "YOASOBI", LINES);
    expect(b).toBe(a);
    expect(mocks.chat).toHaveBeenCalledTimes(1);
  });

  it("首次非法 → 重试一次成功", async () => {
    mocks.chat
      .mockResolvedValueOnce("not json")
      .mockResolvedValueOnce(JSON.stringify(VALID));
    const notes = await generateNotes({ id: 7002, name: "Lemon" }, "", LINES);
    expect(notes.grammar[0].pattern).toBe("〜てしまう");
    expect(mocks.chat).toHaveBeenCalledTimes(2);
  });

  it("重试仍非法 → 抛错", async () => {
    mocks.chat.mockResolvedValue("bad bad");
    await expect(generateNotes({ id: 7003, name: "X" }, "", LINES)).rejects.toThrow();
  });
});
