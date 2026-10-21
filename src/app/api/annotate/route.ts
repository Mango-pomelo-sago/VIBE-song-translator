import { NextRequest, NextResponse } from "next/server";
import {
  describeAiError,
  readAiConfigHeaders,
  resolveServerAiConfig,
} from "@/lib/ai-config-server";
import type { ResolvedAiConfig } from "@/lib/ai";
import { annotateLyrics } from "@/lib/annotate";
import { normalizeLang } from "@/lib/lang/meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 最多 3 次 AI 调用 × 30s 超时
export const maxDuration = 120;

/** POST /api/annotate { songId, lang, lines: [{index,text}] } → { ok, lemmas }
 *  法语歌词的异步增强：本地标注先渲染，AI 只补中文释义。 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    songId?: number;
    lang?: unknown;
    lines?: Array<{ index: number; text: string }>;
  } | null;

  const songId = body?.songId;
  const lang = normalizeLang(body?.lang);
  const lines = body?.lines;

  if (typeof songId !== "number" || !Number.isInteger(songId)) {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }
  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ ok: false, error: "缺少歌词" }, { status: 400 });
  }
  if (lang !== "fr") {
    return NextResponse.json(
      { ok: false, error: "该语言暂不支持 AI 标注" },
      { status: 400 },
    );
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
    const lemmas = await annotateLyrics(songId, lines, config, "fr");
    return NextResponse.json({ ok: true, lemmas });
  } catch (e) {
    console.error("[api/annotate]", songId, e instanceof Error ? e.name : "unknown");
    const failure = describeAiError(e, "AI 标注失败，请稍后重试");
    return NextResponse.json(
      { ok: false, code: failure.code, error: failure.error },
      { status: failure.status },
    );
  }
}
