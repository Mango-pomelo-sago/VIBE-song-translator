import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearFrenchDictionaryCache,
  lookupFrenchWord,
} from "./dictionary";

const fetchMock = vi.fn();

function wiktionaryResponse(definitions: string[], partOfSpeech = "Noun") {
  return new Response(
    JSON.stringify({
      fr: [{ partOfSpeech, definitions: definitions.map((d) => ({ definition: d })) }],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

beforeEach(() => {
  clearFrenchDictionaryCache();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("lookupFrenchWord", () => {
  it("合并本地结构信息与 Wiktionary 释义，并清理 HTML", async () => {
    fetchMock.mockResolvedValue(
      wiktionaryResponse([
        '<a href="/wiki/love">love</a>, <i>affection</i>',
        '<style>.mw-parser-output .tag{color:red}</style>to manage',
      ]),
    );
    const entry = await lookupFrenchWord("amour");
    expect(entry).not.toBeNull();
    expect(entry!.reading).toBe("amuʁ");
    expect(entry!.gender).toBe("m");
    expect(entry!.level).toBe("A1");
    expect(entry!.source).toBe("wiktionary");
    expect(entry!.senses[0].definitions).toEqual(["love, affection", "to manage"]);
    expect(entry!.senses[0].partsOfSpeech).toEqual(["Noun"]);
  });

  it("429 等临时失败只返回本地信息，且不缓存，下次会重试", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 429 }));
    const first = await lookupFrenchWord("amour");
    expect(first!.senses).toEqual([]);
    expect(first!.source).toBe("lexique");

    fetchMock.mockResolvedValueOnce(wiktionaryResponse(["love"]));
    const second = await lookupFrenchWord("amour");
    expect(second!.senses[0].definitions).toEqual(["love"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("404 视为确实无词条，可缓存且不重复请求", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 404 }));
    await lookupFrenchWord("amour");
    const second = await lookupFrenchWord("amour");
    expect(second!.senses).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("网络异常不缓存，恢复后能拿到释义", async () => {
    fetchMock.mockRejectedValueOnce(new Error("timeout"));
    const first = await lookupFrenchWord("arriver");
    expect(first!.lemma).toBe("arriver");
    expect(first!.senses).toEqual([]);

    fetchMock.mockResolvedValueOnce(wiktionaryResponse(["to arrive"], "Verb"));
    const second = await lookupFrenchWord("arriver");
    expect(second!.senses[0].definitions).toEqual(["to arrive"]);
  });

  it("本地未收录但 Wiktionary 有词条时仍返回释义", async () => {
    fetchMock.mockResolvedValue(wiktionaryResponse(["a made-up word"]));
    const entry = await lookupFrenchWord("zzzznotaword");
    expect(entry).not.toBeNull();
    expect(entry!.senses[0].definitions).toEqual(["a made-up word"]);
  });

  it("本地未收录且临时失败时返回 null，不缓存", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 503 }));
    expect(await lookupFrenchWord("zzzznotaword")).toBeNull();

    fetchMock.mockResolvedValueOnce(new Response("", { status: 404 }));
    expect(await lookupFrenchWord("zzzznotaword")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
