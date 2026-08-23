import { NextRequest, NextResponse } from "next/server";
import { isConfigured } from "@/lib/ai";
import { generateNotes } from "@/lib/notes";
import type { ProcessedLine } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/notes { songId, title, artist, lines } → { ok, notes: LearningNotes }
 *  每首歌一次 DeepSeek 调用；缓存命中直接返回。 */
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

  if (!isConfigured()) {
    return NextResponse.json(
      { ok: false, error: "服务端未配置 DEEPSEEK_API_KEY，无法生成笔记" },
      { status: 503 },
    );
  }

  try {
    const notes = await generateNotes(
      { id: songId, name: title },
      body?.artist?.trim() ?? "",
      lines,
    );
    return NextResponse.json({ ok: true, notes });
  } catch (e) {
    console.error("[api/notes]", songId, e);
    return NextResponse.json(
      { ok: false, error: "笔记生成失败，请稍后重试" },
      { status: 502 },
    );
  }
}
