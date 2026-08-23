import { NextRequest, NextResponse } from "next/server";
import { fetchLyric } from "@/lib/netease";
import { attachZh, parseLrc } from "@/lib/lrc";
import { tokenizeLine } from "@/lib/japanese";
import { segmentBunsetsu } from "@/lib/bunsetsu";
import { scoreLines } from "@/lib/difficulty";
import type {
  MorphToken,
  NeteaseSong,
  ProcessedLine,
  RubySegment,
  SongData,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/song { song: NeteaseSong } → { ok, data: SongData }
 *  主管线：抓词 → LRC 解析 → 对齐 tlyric → 分词 → 汉字假名对齐 → 罗马音。
 *  （M4+ 在此追加文节断句，M5 追加 JLPT 标注与难度） */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    song?: NeteaseSong;
  } | null;
  const song = body?.song;
  const id = song?.id;
  if (!song || typeof id !== "number" || !Number.isInteger(id)) {
    return NextResponse.json({ ok: false, error: "invalid song" }, { status: 400 });
  }

  try {
    // 轻量预检：kuromoji 词典是否可正常工作
    try { await tokenizeLine("テスト"); }
    catch (e) {
      console.error("[api/song] kuromoji init failed", e);
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
      let tokens: MorphToken[] = [];
      let ruby: RubySegment[] = [];
      let romaji: string | null = null;
      let bunsetsu: ProcessedLine["bunsetsu"];

      if (l.text) {
        try {
          tokens = await tokenizeLine(l.text);
          ruby = tokens.flatMap((t) => t.ruby);
          // M4：行罗马音改由文节给出（文节级拼接修复跨 token 促音，如 分かっ+た→wakatta）
          bunsetsu = segmentBunsetsu(tokens);
          romaji = bunsetsu.map((b) => b.romaji).filter(Boolean).join(" ") || null;
          for (const t of tokens) {
            if (t.warnings?.length) warnings.push(...t.warnings);
          }
        } catch (e) {
          warnings.push(`tokenize fail line ${i}: ${e}`);
        }
      }

      lines.push({
        index: i,
        timeMs: l.timeMs,
        text: l.text,
        zh: l.zh ?? null,
        zhSource: l.zh ? "netease" : null,
        tokens,
        ruby,
        romaji: romaji || null,
        bunsetsu,
      });
    }

    // M9：难度评分（内容词平均 JLPT 等级）
    const difficulty = scoreLines(lines);
    const data: SongData = { song, lines, warnings, difficulty };
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error("[api/song]", id, e);
    return NextResponse.json(
      { ok: false, error: "歌词加载失败，请稍后重试" },
      { status: 502 },
    );
  }
}
