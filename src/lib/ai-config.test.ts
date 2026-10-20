import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AI_HEADER_BASE_URL,
  AI_HEADER_KEY,
  AI_HEADER_MODEL,
  AI_STORAGE_KEY,
  DEFAULT_AI_BASE_URL,
  DEFAULT_AI_MODEL,
  aiConfigHeaders,
  clearAiConfig,
  isAiConfigComplete,
  isValidBaseUrl,
  loadAiConfig,
  normalizeBaseUrl,
  saveAiConfig,
  type AiConfig,
} from "./ai-config";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => map.get(k) ?? null,
    key: (i: number) => [...map.keys()][i] ?? null,
    removeItem: (k: string) => {
      map.delete(k);
    },
    setItem: (k: string, v: string) => {
      map.set(k, String(v));
    },
  } as Storage;
}

let storage: Storage;

beforeEach(() => {
  storage = memoryStorage();
  vi.stubGlobal("window", { localStorage: storage });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("lib/ai-config", () => {
  it("无存储时返回 null", () => {
    expect(loadAiConfig()).toBeNull();
  });

  it("保存 / 读取往返，只保留白名单字段并补默认值", () => {
    const saved = saveAiConfig({
      apiKey: "  sk-abc  ",
      baseUrl: " https://example.com/v1/ ",
      model: "  my-model  ",
    });
    expect(saved).toEqual({
      apiKey: "sk-abc",
      baseUrl: "https://example.com/v1",
      model: "my-model",
    });
    expect(loadAiConfig()).toEqual(saved);
  });

  it("空的 baseUrl / model 回填默认值", () => {
    storage.setItem(
      AI_STORAGE_KEY,
      JSON.stringify({ apiKey: "sk", baseUrl: "", model: "  " }),
    );
    expect(loadAiConfig()).toEqual({
      apiKey: "sk",
      baseUrl: DEFAULT_AI_BASE_URL,
      model: DEFAULT_AI_MODEL,
    });
  });

  it("损坏的 JSON 视为未配置", () => {
    storage.setItem(AI_STORAGE_KEY, "{not json");
    expect(loadAiConfig()).toBeNull();
    storage.setItem(AI_STORAGE_KEY, JSON.stringify(["array"]));
    expect(loadAiConfig()).toBeNull();
  });

  it("忽略额外字段，不落盘 key 以外的敏感内容", () => {
    storage.setItem(
      AI_STORAGE_KEY,
      JSON.stringify({ apiKey: "sk", baseUrl: "", model: "", evil: "x" }),
    );
    saveAiConfig(loadAiConfig() as AiConfig);
    const raw = JSON.parse(storage.getItem(AI_STORAGE_KEY) as string);
    expect(Object.keys(raw).sort()).toEqual(["apiKey", "baseUrl", "model"]);
  });

  it("clearAiConfig 删除存储", () => {
    saveAiConfig({ apiKey: "sk", baseUrl: "", model: "" });
    clearAiConfig();
    expect(loadAiConfig()).toBeNull();
  });

  it("isAiConfigComplete 只要求 key", () => {
    expect(isAiConfigComplete(null)).toBe(false);
    expect(
      isAiConfigComplete({ apiKey: "", baseUrl: "", model: "" }),
    ).toBe(false);
    expect(
      isAiConfigComplete({ apiKey: "sk", baseUrl: "", model: "" }),
    ).toBe(true);
  });

  it("aiConfigHeaders：无 key 时不发送任何 AI 头（原子规则）", () => {
    expect(aiConfigHeaders(null)).toEqual({});
    expect(aiConfigHeaders({ apiKey: "  ", baseUrl: "https://x/v1", model: "m" })).toEqual(
      {},
    );
  });

  it("aiConfigHeaders：有 key 时发送非空字段", () => {
    expect(
      aiConfigHeaders({
        apiKey: " sk ",
        baseUrl: "https://example.com/v1/",
        model: "m",
      }),
    ).toEqual({
      [AI_HEADER_KEY]: "sk",
      [AI_HEADER_BASE_URL]: "https://example.com/v1",
      [AI_HEADER_MODEL]: "m",
    });
    expect(aiConfigHeaders({ apiKey: "sk", baseUrl: "", model: "" })).toEqual({
      [AI_HEADER_KEY]: "sk",
    });
  });

  it("normalizeBaseUrl / isValidBaseUrl", () => {
    expect(normalizeBaseUrl(" https://x.dev/v1/// ")).toBe("https://x.dev/v1");
    expect(isValidBaseUrl("https://api.deepseek.com/v1")).toBe(true);
    expect(isValidBaseUrl("http://localhost:11434/v1")).toBe(true);
    expect(isValidBaseUrl("ftp://x.dev")).toBe(false);
    expect(isValidBaseUrl("javascript:alert(1)")).toBe(false);
    expect(isValidBaseUrl("not-a-url")).toBe(false);
  });
});
