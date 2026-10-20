import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AiAuthError,
  AiConfigError,
  AiNotConfiguredError,
  chat,
} from "./ai";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("lib/ai.chat", () => {
  it("未配置 key 抛 AiNotConfiguredError", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    await expect(
      chat([{ role: "user", content: "hi" }]),
    ).rejects.toBeInstanceOf(AiNotConfiguredError);
  });

  it("发送 OpenAI 兼容请求并解析 content", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "sk-test");
    const calls: Array<{ url: string; init: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ url: String(url), init: init ?? {} });
        return new Response(
          JSON.stringify({ choices: [{ message: { content: "你好" } }] }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );
    const out = await chat([{ role: "user", content: "hello" }], { json: true });
    expect(out).toBe("你好");
    expect(calls.length).toBe(1);
    const body = JSON.parse(String(calls[0].init.body));
    expect(body.model).toBe("deepseek-chat");
    expect(body.messages[0].content).toBe("hello");
    expect(body.response_format).toEqual({ type: "json_object" });
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe(
      "Bearer sk-test",
    );
  });

  it("请求级 config 优先于环境变量", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "sk-env");
    vi.stubEnv("DEEPSEEK_MODEL", "env-model");
    const calls: Array<{ url: string; init: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ url: String(url), init: init ?? {} });
        return new Response(
          JSON.stringify({ choices: [{ message: { content: "ok" } }] }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );

    await chat([{ role: "user", content: "hi" }], {
      config: {
        apiKey: "sk-user",
        baseUrl: "https://example.com/v1/",
        model: "user-model",
      },
    });

    expect(calls[0].url).toBe("https://example.com/v1/chat/completions");
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe(
      "Bearer sk-user",
    );
    expect(JSON.parse(String(calls[0].init.body)).model).toBe("user-model");
  });

  it("http 非 2xx 抛错", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "sk-test");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("oops", { status: 429 })));
    await expect(
      chat([{ role: "user", content: "x" }]),
    ).rejects.toThrow(/deepseek http 429/);
  });

  it("401 / 403 抛 AiAuthError", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "sk-test");
    for (const status of [401, 403]) {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response("denied", { status })),
      );
      const err = await chat([{ role: "user", content: "x" }]).catch((e) => e);
      expect(err).toBeInstanceOf(AiAuthError);
      expect((err as AiAuthError).status).toBe(status);
    }
  });

  it("非法 baseUrl 抛 AiConfigError 且不发请求", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    for (const baseUrl of ["ftp://example.com", "not-a-url"]) {
      await expect(
        chat([{ role: "user", content: "x" }], {
          config: { apiKey: "sk-test", baseUrl, model: "m" },
        }),
      ).rejects.toBeInstanceOf(AiConfigError);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("错误信息不包含 key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("server error", { status: 500 })),
    );
    const err = await chat([{ role: "user", content: "x" }], {
      config: {
        apiKey: "sk-super-secret",
        baseUrl: "https://example.com/v1",
        model: "m",
      },
    }).catch((e) => e);
    expect(String(err)).not.toContain("sk-super-secret");
  });
});
