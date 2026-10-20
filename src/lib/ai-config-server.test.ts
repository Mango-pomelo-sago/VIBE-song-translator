import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AiAuthError,
  AiConfigError,
  AiNotConfiguredError,
} from "./ai";
import {
  describeAiError,
  readAiConfigHeaders,
  resolveServerAiConfig,
} from "./ai-config-server";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("lib/ai-config-server.readAiConfigHeaders", () => {
  it("读取并 trim 三个请求头", () => {
    const headers = new Headers({
      "x-ai-api-key": "  sk-user  ",
      "x-ai-base-url": " https://user.example/v1 ",
      "x-ai-model": " user-model ",
    });
    expect(readAiConfigHeaders(headers)).toEqual({
      apiKey: "sk-user",
      baseUrl: "https://user.example/v1",
      model: "user-model",
    });
  });

  it("忽略空值", () => {
    expect(
      readAiConfigHeaders(
        new Headers({ "x-ai-api-key": "   ", "x-ai-base-url": "" }),
      ),
    ).toEqual({});
  });
});

describe("lib/ai-config-server.resolveServerAiConfig", () => {
  it("请求级配置优先于环境变量", () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "sk-env");
    vi.stubEnv("DEEPSEEK_BASE_URL", "https://env.example/v1");
    vi.stubEnv("DEEPSEEK_MODEL", "env-model");

    expect(
      resolveServerAiConfig({
        apiKey: "sk-user",
        baseUrl: "https://user.example/v1/",
        model: "user-model",
      }),
    ).toEqual({
      apiKey: "sk-user",
      baseUrl: "https://user.example/v1",
      model: "user-model",
    });
  });

  it("请求未带 key 时使用环境变量", () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "sk-env");
    vi.stubEnv("DEEPSEEK_BASE_URL", "https://env.example/v1");
    vi.stubEnv("DEEPSEEK_MODEL", "env-model");

    expect(resolveServerAiConfig({})).toEqual({
      apiKey: "sk-env",
      baseUrl: "https://env.example/v1",
      model: "env-model",
    });
  });

  it("原子规则：只带 baseUrl/model 不带 key 时忽略请求值（防止 env key 被发往任意地址）", () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "sk-env");
    vi.stubEnv("DEEPSEEK_BASE_URL", "https://env.example/v1");
    vi.stubEnv("DEEPSEEK_MODEL", "env-model");

    expect(
      resolveServerAiConfig({
        baseUrl: "https://evil.example/v1",
        model: "evil-model",
      }),
    ).toEqual({
      apiKey: "sk-env",
      baseUrl: "https://env.example/v1",
      model: "env-model",
    });
  });

  it("请求有 key 但缺 baseUrl/model 时补默认值", () => {
    expect(resolveServerAiConfig({ apiKey: "sk-user" })).toEqual({
      apiKey: "sk-user",
      baseUrl: "https://api.deepseek.com/v1",
      model: "deepseek-chat",
    });
  });

  it("完全没有 key 时返回 null", () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    expect(resolveServerAiConfig({})).toBeNull();
  });

  it("非法 baseUrl 抛 AiConfigError", () => {
    expect(() =>
      resolveServerAiConfig({ apiKey: "sk", baseUrl: "ftp://x.dev" }),
    ).toThrow(AiConfigError);

    vi.stubEnv("DEEPSEEK_API_KEY", "sk-env");
    vi.stubEnv("DEEPSEEK_BASE_URL", "not-a-url");
    expect(() => resolveServerAiConfig({})).toThrow(AiConfigError);
  });
});

describe("lib/ai-config-server.describeAiError", () => {
  it("映射未配置 / 鉴权 / 配置错误", () => {
    expect(describeAiError(new AiNotConfiguredError(), "x")).toMatchObject({
      status: 503,
      code: "ai_not_configured",
    });
    expect(describeAiError(new AiAuthError(401), "x")).toMatchObject({
      status: 401,
      code: "ai_auth_failed",
    });
    expect(describeAiError(new AiConfigError(), "x")).toMatchObject({
      status: 400,
      code: "ai_config_invalid",
    });
    expect(describeAiError(new Error("boom"), "fallback")).toEqual({
      status: 502,
      code: "ai_failed",
      error: "fallback",
    });
  });
});
