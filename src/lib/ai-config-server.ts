/**
 * 服务端 AI 配置解析：请求头 > 环境变量。
 * 安全约束（原子规则）：只有请求带 x-ai-api-key 时才使用整套请求配置，
 * 绝不把用户提供的 baseUrl 与服务端环境变量里的 key 组合，防止 Key 外泄。
 */

import {
  AI_HEADER_BASE_URL,
  AI_HEADER_KEY,
  AI_HEADER_MODEL,
  DEFAULT_AI_BASE_URL,
  DEFAULT_AI_MODEL,
  isValidBaseUrl,
  normalizeBaseUrl,
  type AiConfig,
} from "./ai-config";
import {
  AiAuthError,
  AiConfigError,
  AiNotConfiguredError,
  type ResolvedAiConfig,
} from "./ai";

export function readAiConfigHeaders(headers: Headers): Partial<AiConfig> {
  const pick = (name: string) => (headers.get(name) ?? "").trim();
  const out: Partial<AiConfig> = {};
  const apiKey = pick(AI_HEADER_KEY);
  if (apiKey) out.apiKey = apiKey;
  const baseUrl = pick(AI_HEADER_BASE_URL);
  if (baseUrl) out.baseUrl = baseUrl;
  const model = pick(AI_HEADER_MODEL);
  if (model) out.model = model;
  return out;
}

/** 解析本次请求实际使用的配置；完全没有 key 时返回 null。baseUrl 非法时抛 AiConfigError。 */
export function resolveServerAiConfig(
  request: Partial<AiConfig>,
): ResolvedAiConfig | null {
  const requestKey = request.apiKey?.trim() ?? "";

  const config: ResolvedAiConfig = requestKey
    ? {
        apiKey: requestKey,
        baseUrl:
          normalizeBaseUrl(request.baseUrl ?? "") || DEFAULT_AI_BASE_URL,
        model: (request.model ?? "").trim() || DEFAULT_AI_MODEL,
      }
    : {
        apiKey: (process.env.DEEPSEEK_API_KEY ?? "").trim(),
        baseUrl:
          normalizeBaseUrl(process.env.DEEPSEEK_BASE_URL ?? "") ||
          DEFAULT_AI_BASE_URL,
        model: (process.env.DEEPSEEK_MODEL ?? "").trim() || DEFAULT_AI_MODEL,
      };

  if (!config.apiKey) return null;
  if (!isValidBaseUrl(config.baseUrl)) throw new AiConfigError();
  return config;
}

export type AiFailure = { status: number; code: string; error: string };

/** 将内部错误映射为统一的中文响应（不包含任何密钥信息）。 */
export function describeAiError(e: unknown, fallback: string): AiFailure {
  if (e instanceof AiNotConfiguredError) {
    return {
      status: 503,
      code: "ai_not_configured",
      error: "未配置 AI API Key，请在「AI 设置」中填写",
    };
  }
  if (e instanceof AiAuthError) {
    return {
      status: 401,
      code: "ai_auth_failed",
      error: `API Key 无效或无权限（HTTP ${e.status}），请在「AI 设置」中检查`,
    };
  }
  if (e instanceof AiConfigError) {
    return {
      status: 400,
      code: "ai_config_invalid",
      error: "Base URL 无效，请填写以 http(s):// 开头的地址",
    };
  }
  return { status: 502, code: "ai_failed", error: fallback };
}
