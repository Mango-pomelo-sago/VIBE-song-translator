/**
 * AI 统一封装（OpenAI 兼容 chat completions，直接 fetch）。
 * 配置来源：请求级 config（用户在「AI 设置」里填的）优先；
 * 否则回退环境变量 DEEPSEEK_API_KEY / DEEPSEEK_MODEL / DEEPSEEK_BASE_URL。
 * 换供应商 / 升级模型名只需改配置，无需改代码。
 */

import {
  DEFAULT_AI_BASE_URL,
  DEFAULT_AI_MODEL,
  isValidBaseUrl,
  normalizeBaseUrl,
} from "./ai-config";

export type ResolvedAiConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export class AiNotConfiguredError extends Error {
  readonly code = "ai_not_configured";
  constructor() {
    super("AI API Key 未配置");
    this.name = "AiNotConfiguredError";
  }
}

/** Base URL 不是合法的 http(s) 地址 */
export class AiConfigError extends Error {
  readonly code = "ai_config_invalid";
  constructor(message = "AI Base URL 无效") {
    super(message);
    this.name = "AiConfigError";
  }
}

/** 供应商返回 401/403：Key 无效或无权限 */
export class AiAuthError extends Error {
  readonly code = "ai_auth_failed";
  constructor(readonly status: number) {
    super(`AI 鉴权失败（HTTP ${status}）`);
    this.name = "AiAuthError";
  }
}

/** 其他非 2xx；detail 不含 key */
export class AiHttpError extends Error {
  readonly code = "ai_http_error";
  constructor(
    readonly status: number,
    detail: string,
  ) {
    super(`deepseek http ${status}: ${detail}`);
    this.name = "AiHttpError";
  }
}

const REQUEST_TIMEOUT = 30_000;

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatOptions = {
  temperature?: number;
  maxTokens?: number;
  /** 强制 JSON 输出（response_format json_object） */
  json?: boolean;
  /** 请求级配置；缺省时读环境变量 */
  config?: ResolvedAiConfig;
};

/** 仅检查环境变量（保留给旧调用方） */
export function isConfigured(): boolean {
  return !!process.env.DEEPSEEK_API_KEY?.trim();
}

function envConfig(): ResolvedAiConfig {
  return {
    apiKey: (process.env.DEEPSEEK_API_KEY ?? "").trim(),
    baseUrl:
      normalizeBaseUrl(process.env.DEEPSEEK_BASE_URL ?? "") || DEFAULT_AI_BASE_URL,
    model: (process.env.DEEPSEEK_MODEL ?? "").trim() || DEFAULT_AI_MODEL,
  };
}

/** 单次对话，返回 assistant 的文本内容（非流式）。未配置 key 抛 AiNotConfiguredError。 */
export async function chat(
  messages: ChatMessage[],
  opts: ChatOptions = {},
): Promise<string> {
  const config = opts.config ?? envConfig();
  const key = config.apiKey.trim();
  if (!key) throw new AiNotConfiguredError();

  const baseUrl = normalizeBaseUrl(config.baseUrl);
  if (!isValidBaseUrl(baseUrl)) throw new AiConfigError();
  const model = config.model.trim() || DEFAULT_AI_MODEL;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens ?? 2000,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      stream: false,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new AiAuthError(res.status);
    }
    const body = await res.text().catch(() => "");
    throw new AiHttpError(res.status, body.slice(0, 200));
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content) {
    throw new Error("deepseek: 空响应");
  }
  return content;
}
