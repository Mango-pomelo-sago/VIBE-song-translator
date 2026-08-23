/**
 * DeepSeek AI 统一封装（OpenAI 兼容 chat completions，直接 fetch）。
 * 环境变量：DEEPSEEK_API_KEY（必填）、DEEPSEEK_MODEL（默认 deepseek-chat）、
 *           DEEPSEEK_BASE_URL（默认 https://api.deepseek.com/v1）。
 * 换供应商 / 升级模型名只改这里。
 */

export class AiNotConfiguredError extends Error {
  constructor() {
    super("DEEPSEEK_API_KEY 未配置");
    this.name = "AiNotConfiguredError";
  }
}

const BASE_URL =
  (process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1").replace(/\/+$/, "");
export const MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
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
};

export function isConfigured(): boolean {
  return !!process.env.DEEPSEEK_API_KEY;
}

/** 单次对话，返回 assistant 的文本内容（非流式）。未配置 key 抛 AiNotConfiguredError。 */
export async function chat(
  messages: ChatMessage[],
  opts: ChatOptions = {},
): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new AiNotConfiguredError();

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens ?? 2000,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      stream: false,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`deepseek http ${res.status}: ${body.slice(0, 200)}`);
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
