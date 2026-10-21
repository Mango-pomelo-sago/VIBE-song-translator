import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./ai", () => ({ chat: vi.fn(), isConfigured: vi.fn(() => true) }));

import { chat } from "./ai";
import { clearTranslateCache, hasTranslateCache, translateMissingLines } from "./translate";
import { clearNotesCache, generateNotes, hasNotesCache } from "./notes";

const chatMock = vi.mocked(chat);

const TRANSLATION_JSON = JSON.stringify({
  translations: [{ index: 1, zh: "你好" }],
});

const NOTES_JSON = JSON.stringify({
  background: "背景",
  cultural: [{ snippet: "Paris", title: "巴黎", detail: "城市。" }],
  grammar: [
    {
      pattern: "être + adj.",
      meaning: "系表结构",
      rule: "主语 + être + 形容词",
      example: "Je suis fatigué.",
      translation: "我累了。",
    },
  ],
});

function systemOf(call: unknown): string {
  const messages = (call as [{ role: string; content: string }[], unknown])[0];
  return messages.find((m) => m.role === "system")!.content;
}

beforeEach(() => {
  clearTranslateCache();
  clearNotesCache();
  chatMock.mockReset();
  chatMock.mockResolvedValue(TRANSLATION_JSON as never);
});

describe("translateMissingLines 语言隔离", () => {
  const song = { id: 9001, name: "Test" };
  const missing = [{ index: 1, text: "Bonjour" }];

  it("默认使用日语提示词", async () => {
    await translateMissingLines(song, "", missing);
    expect(systemOf(chatMock.mock.calls[0])).toContain("日文");
  });

  it("法语使用法语提示词", async () => {
    await translateMissingLines(song, "", missing, undefined, "fr");
    expect(systemOf(chatMock.mock.calls[0])).toContain("法语");
  });

  it("同一首歌 ja / fr 缓存互不串味", async () => {
    await translateMissingLines(song, "", missing);
    await translateMissingLines(song, "", missing, undefined, "fr");
    expect(chatMock).toHaveBeenCalledTimes(2);
    expect(hasTranslateCache(9010, undefined, "ja")).toBe(false);
    expect(hasTranslateCache(9010, undefined, "fr")).toBe(false);
    expect(hasTranslateCache(song.id, undefined, "ja")).toBe(true);
    expect(hasTranslateCache(song.id, undefined, "fr")).toBe(true);

    await translateMissingLines(song, "", missing, undefined, "fr");
    expect(chatMock).toHaveBeenCalledTimes(2);
  });
});

describe("generateNotes 语言隔离", () => {
  const song = { id: 9002, name: "Test" };
  const lines = [{ text: "Je suis fatigué." }];

  beforeEach(() => {
    chatMock.mockResolvedValue(NOTES_JSON as never);
  });

  it("法语提示词强调阴阳性/变位/联诵", async () => {
    await generateNotes(song, "", lines, undefined, "fr");
    const system = systemOf(chatMock.mock.calls[0]);
    expect(system).toContain("法语");
    expect(system).toContain("阴阳性");
    expect(system).toContain("联诵");
  });

  it("同一首歌 ja / fr 缓存互不串味", async () => {
    await generateNotes(song, "", lines);
    await generateNotes(song, "", lines, undefined, "fr");
    expect(chatMock).toHaveBeenCalledTimes(2);
    expect(hasNotesCache(song.id, undefined, "ja")).toBe(true);
    expect(hasNotesCache(song.id, undefined, "fr")).toBe(true);

    const again = await generateNotes(song, "", lines, undefined, "fr");
    expect(chatMock).toHaveBeenCalledTimes(2);
    expect(again.background).toBe("背景");
  });
});
