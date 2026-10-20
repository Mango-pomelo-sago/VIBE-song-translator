import { NextRequest, NextResponse } from "next/server";
import {
  describeAiError,
  readAiConfigHeaders,
  resolveServerAiConfig,
} from "@/lib/ai-config-server";
import type { ResolvedAiConfig } from "@/lib/ai";
import { generateNotes } from "@/lib/notes";
import type { ProcessedLine } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 最多 2 次 AI 调用 × 30s 超时
export const maxDuration = 90;

/** POST /api/notes { songId, title, artist, lines } → { ok, notes: LearningNotes }
 *  可选请求头 x-ai-api-key / x-ai-base-url / x-ai-model。
 *  每首歌一次 AI 调用；缓存命中直接返回。 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    songId?: number;
    title?: string;
    artist?: string;
    lines?: ProcessedLine[];
  } | null;

  const songId = body?.songId;
  const title = body?.title?.trim();
  const lines = body?.lines;

  if (typeof songId !== "number" || !Number.isInteger(songId) || !title) {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }
  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ ok: false, error: "缺少歌词" }, { status: 400 });
  }

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
    const notes = await generateNotes(
      { id: songId, name: title },
      body?.artist?.trim() ?? "",
      lines,
      config,
    );
    return NextResponse.json({ ok: true, notes });
  } catch (e) {
    console.error("[api/notes]", songId, e instanceof Error ? e.name : "unknown");
    const failure = describeAiError(e, "笔记生成失败，请稍后重试");
    return NextResponse.json(
      { ok: false, code: failure.code, error: failure.error },
      { status: failure.status },
    );
  }
}
