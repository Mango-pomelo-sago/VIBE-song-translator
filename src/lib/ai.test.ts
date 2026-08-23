import { afterEach, describe, expect, it, vi } from "vitest";
import { AiNotConfiguredError, chat } from "./ai";

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

  it("http 非 2xx 抛错", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "sk-test");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("oops", { status: 429 })));
    await expect(
      chat([{ role: "user", content: "x" }]),
    ).rejects.toThrow(/deepseek http 429/);
  });
});
