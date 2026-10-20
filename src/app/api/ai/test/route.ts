import { NextRequest, NextResponse } from "next/server";
import {
  describeAiError,
  readAiConfigHeaders,
  resolveServerAiConfig,
} from "@/lib/ai-config-server";
import { chat } from "@/lib/ai";
import type { ResolvedAiConfig } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 一次 30s 探测
export const maxDuration = 30;

/** POST /api/ai/test —— 用请求头里的配置做一次最小调用，验证 Key / Base URL / 模型。 */
export async function POST(req: NextRequest) {
  let config: ResolvedAiConfig | null;
  try {
    config = resolveServerAiConfig(readAiConfigHeaders(req.headers));
  } catch (e) {
    const failure = describeAiError(e, "AI 配置无效");
    return NextResponse.json(
      { ok: false, code: failure.code, error: failure.error },
      { status: failure.status },
    );
  }
  if (!config) {
    return NextResponse.json(
      {
        ok: false,
        code: "ai_not_configured",
        error: "未配置 AI API Key，请在「AI 设置」中填写",
      },
      { status: 503 },
    );
  }

  try {
    await chat([{ role: "user", content: "ping" }], {
      temperature: 0,
      maxTokens: 8,
      config,
    });
    return NextResponse.json({ ok: true, model: config.model });
  } catch (e) {
    console.error("[api/ai/test]", e instanceof Error ? e.name : "unknown");
    const failure = describeAiError(
      e,
      "连接失败，请检查 API Key、Base URL、模型名称与网络",
    );
    return NextResponse.json(
      { ok: false, code: failure.code, error: failure.error },
      { status: failure.status },
    );
  }
}
