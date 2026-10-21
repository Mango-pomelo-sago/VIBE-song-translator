import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_PREFS, loadPrefs, savePrefs } from "./prefs";

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  const ls = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  } as Storage;
  (globalThis as unknown as { window: { localStorage: Storage } }).window = {
    localStorage: ls,
  };
});

describe("prefs localStorage 持久化", () => {
  it("无存储 → 默认值", () => {
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
  });

  it("保存后读取一致", () => {
    savePrefs({
      furigana: "kana",
      showBunsetsu: false,
      showTranslation: true,
      showGrammar: false,
    });
    expect(loadPrefs()).toEqual({
      furigana: "kana",
      showBunsetsu: false,
      showTranslation: true,
      showGrammar: false,
    });
  });

  it("损坏数据 → 默认值", () => {
    store.set("vibe-prefs:v1", "{broken json");
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
  });

  it("部分字段缺失 → 用默认补齐", () => {
    store.set("vibe-prefs:v1", JSON.stringify({ furigana: "hidden" }));
    expect(loadPrefs()).toEqual({
      furigana: "hidden",
      showBunsetsu: true,
      showTranslation: true,
      showGrammar: true,
    });
  });
});
