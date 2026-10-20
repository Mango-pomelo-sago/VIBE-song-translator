/**
 * AI 配置（BYOK）：仅存本机浏览器 localStorage，请求时通过请求头发给本站 API。
 * 服务端不持久化；任何字段都不应出现在日志里。
 */

export type AiConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export const AI_STORAGE_KEY = "vibe-ai:v1";
export const DEFAULT_AI_BASE_URL = "https://api.deepseek.com/v1";
export const DEFAULT_AI_MODEL = "deepseek-chat";

export const AI_HEADER_KEY = "x-ai-api-key";
export const AI_HEADER_BASE_URL = "x-ai-base-url";
export const AI_HEADER_MODEL = "x-ai-model";

/** trim 并去掉尾部斜杠 */
export function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

/** 只接受 http / https 地址 */
export function isValidBaseUrl(raw: string): boolean {
  try {
    const url = new URL(raw.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitize(input: Partial<AiConfig> | null | undefined): AiConfig {
  const apiKey = typeof input?.apiKey === "string" ? input.apiKey.trim() : "";
  const baseUrl =
    typeof input?.baseUrl === "string" ? normalizeBaseUrl(input.baseUrl) : "";
  const model = typeof input?.model === "string" ? input.model.trim() : "";
  return {
    apiKey,
    baseUrl: baseUrl || DEFAULT_AI_BASE_URL,
    model: model || DEFAULT_AI_MODEL,
  };
}

/** 读取本机配置；无配置、损坏或浏览器不可用时返回 null。 */
export function loadAiConfig(): AiConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AI_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return sanitize(parsed as Partial<AiConfig>);
  } catch {
    return null;
  }
}

/** 只写入白名单字段，返回实际保存的规范化配置。 */
export function saveAiConfig(config: AiConfig): AiConfig {
  const clean = sanitize(config);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(clean));
    } catch {
      // 隐私模式 / 配额不足：忽略，本次会话仍可用
    }
  }
  return clean;
}

export function clearAiConfig(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AI_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function isAiConfigComplete(config: AiConfig | null | undefined): boolean {
  return !!config?.apiKey?.trim();
}

/**
 * 生成随请求发送的 AI 请求头。
 * 原子规则：没有 key 时不发送任何 AI 头，服务端因此只会使用环境变量。
 */
export function aiConfigHeaders(
  config: AiConfig | null | undefined,
): Record<string, string> {
  const key = config?.apiKey?.trim();
  if (!key) return {};

  const headers: Record<string, string> = { [AI_HEADER_KEY]: key };
  const baseUrl = normalizeBaseUrl(config?.baseUrl ?? "");
  if (baseUrl) headers[AI_HEADER_BASE_URL] = baseUrl;
  const model = config?.model?.trim();
  if (model) headers[AI_HEADER_MODEL] = model;
  return headers;
}
