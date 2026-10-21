import { NextRequest, NextResponse } from "next/server";
import { fetchLyric } from "@/lib/netease";
import { attachZh, parseLrc } from "@/lib/lrc";
import { getProfile, hasProfile } from "@/lib/lang/registry.server";
import { normalizeLang } from "@/lib/lang/meta";
import type { AnnotatedLine } from "@/lib/lang/types";
import type { NeteaseSong, ProcessedLine, SongData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 抓词重试 + kuromoji 冷启动加载词典 + 全文同步分词
export const maxDuration = 60;

/** POST /api/song { song: NeteaseSong, lang?: "ja" | "fr" } → { ok, data: SongData }
 *  主管线：抓词 → LRC 解析 → 对齐 tlyric → 按语言选择 profile 标注 → 难度评分。 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    song?: NeteaseSong;
    lang?: unknown;
  } | null;
  const song = body?.song;
  const id = song?.id;
  if (!song || typeof id !== "number" || !Number.isInteger(id)) {
    return NextResponse.json({ ok: false, error: "invalid song" }, { status: 400 });
  }

  const lang = normalizeLang(body?.lang);
  if (!hasProfile(lang)) {
    return NextResponse.json(
      { ok: false, error: `暂不支持该语言：${lang}` },
      { status: 400 },
    );
  }
  const profile = getProfile(lang);

  try {
    // 轻量预检：仅日语需要确认 kuromoji 词典可用
    try {
      await profile.preflight?.();
    } catch (e) {
      console.error("[api/song] profile preflight failed", lang, e);
      return NextResponse.json(
        { ok: false, error: "分词引擎未就绪，请检查词典安装" },
        { status: 503 },
      );
    }

    const { lrc, tlyric } = await fetchLyric(id);
    if (!lrc) {
      return NextResponse.json(
        { ok: false, error: "该歌曲没有可用的歌词（可能为纯音乐或下架）" },
        { status: 404 },
      );
    }

    const lrcLines = parseLrc(lrc);
    const tlyricLines = tlyric ? parseLrc(tlyric) : [];
    const merged = attachZh(lrcLines, tlyricLines);

    const warnings: string[] = [];
    const lines: ProcessedLine[] = [];

    for (let i = 0; i < merged.length; i++) {
      const l = merged[i];
      let annotation: AnnotatedLine | null = null;

      if (l.text) {
        try {
          annotation = await profile.annotateLine(l.text);
          warnings.push(...annotation.warnings);
        } catch (e) {
          warnings.push(`annotate fail line ${i}: ${e}`);
        }
      }

      lines.push({
        index: i,
        timeMs: l.timeMs,
        text: l.text,
        zh: l.zh ?? null,
        zhSource: l.zh ? "netease" : null,
        tokens: annotation?.tokens ?? [],
        ruby: annotation?.ruby ?? [],
        romaji: annotation?.readingLine ?? null,
        // 空行/标注失败时保持 undefined，与改造前一致
        bunsetsu: annotation ? annotation.chunks : undefined,
      });
    }

    const difficulty = profile.scoreDifficulty(lines);
    const data: SongData = { song, lang, lines, warnings, difficulty };
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error("[api/song]", id, e);
    return NextResponse.json(
      { ok: false, error: "歌词加载失败，请稍后重试" },
      { status: 502 },
    );
  }
}
