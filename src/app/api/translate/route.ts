import { NextRequest, NextResponse } from "next/server";
import { isConfigured } from "@/lib/ai";
import { translateMissingLines } from "@/lib/translate";
import type { MissingLine } from "@/lib/translate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/translate { songId, songName, artists, missing: [{index,text}] }
 *  DeepSeek 批量补齐缺失翻译；缓存命中直接返回。 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    songId?: number;
    songName?: string;
    artists?: string;
    missing?: MissingLine[];
  } | null;

  const songId = body?.songId;
  const songName = body?.songName?.trim();
  const missing = body?.missing;

  if (typeof songId !== "number" || !Number.isInteger(songId) || !songName) {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }
  if (!Array.isArray(missing) || missing.length === 0) {
    return NextResponse.json({ ok: true, translations: [] });
  }

  if (!isConfigured()) {
    return NextResponse.json(
      { ok: false, error: "服务端未配置 DEEPSEEK_API_KEY，无法 AI 翻译" },
      { status: 503 },
    );
  }

  try {
    const map = await translateMissingLines(
      { id: songId, name: songName },
      body?.artists?.trim() ?? "",
      missing,
    );
    const translations = [...map.entries()]
      .map(([index, zh]) => ({ index, zh }))
      .sort((a, b) => a.index - b.index);
    return NextResponse.json({ ok: true, translations });
  } catch (e) {
    console.error("[api/translate]", songId, e);
    return NextResponse.json(
      { ok: false, error: "AI 翻译失败，请稍后重试" },
      { status: 502 },
    );
  }
}
