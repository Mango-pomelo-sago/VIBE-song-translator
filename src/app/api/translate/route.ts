import { NextRequest, NextResponse } from "next/server";
import {
  describeAiError,
  readAiConfigHeaders,
  resolveServerAiConfig,
} from "@/lib/ai-config-server";
import type { ResolvedAiConfig } from "@/lib/ai";
import { translateMissingLines } from "@/lib/translate";
import type { MissingLine } from "@/lib/translate";
import { normalizeLang } from "@/lib/lang/meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// HARD_LIMIT/CHUNK = 最多 5 段 × 30s 超时 ≈ 150s；Hobby 上限同为 300s
export const maxDuration = 300;

/** POST /api/translate { songId, songName, artists, missing: [{index,text}], lang? }
 *  可选请求头 x-ai-api-key / x-ai-base-url / x-ai-model（用户在「AI 设置」里配置）。
 *  DeepSeek 批量补齐缺失翻译；缓存命中直接返回。 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    songId?: number;
    songName?: string;
    artists?: string;
    missing?: MissingLine[];
    lang?: unknown;
  } | null;

  const songId = body?.songId;
  const songName = body?.songName?.trim();
  const missing = body?.missing;
  const lang = normalizeLang(body?.lang);

  if (typeof songId !== "number" || !Number.isInteger(songId) || !songName) {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }
  if (!Array.isArray(missing) || missing.length === 0) {
    return NextResponse.json({ ok: true, translations: [] });
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
    const map = await translateMissingLines(
      { id: songId, name: songName },
      body?.artists?.trim() ?? "",
      missing,
      config,
      lang,
    );
    const translations = [...map.entries()]
      .map(([index, zh]) => ({ index, zh }))
      .sort((a, b) => a.index - b.index);
    return NextResponse.json({ ok: true, translations });
  } catch (e) {
    console.error(
      "[api/translate]",
      songId,
      e instanceof Error ? e.name : "unknown",
    );
    const failure = describeAiError(e, "AI 翻译失败，请稍后重试");
    return NextResponse.json(
      { ok: false, code: failure.code, error: failure.error },
      { status: failure.status },
    );
  }
}
