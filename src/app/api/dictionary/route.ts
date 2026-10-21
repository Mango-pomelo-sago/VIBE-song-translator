import { NextRequest, NextResponse } from "next/server";
import { lookupWithFallback } from "@/lib/dictionary";
import { lookupFrenchWord } from "@/lib/fr/dictionary";
import { normalizeLang } from "@/lib/lang/meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 单次远程词典查询
export const maxDuration = 15;

/** GET /api/dictionary?word=词&fallback=基本形&lang=ja|fr → { ok, found, entry } */
export async function GET(req: NextRequest) {
  const word = req.nextUrl.searchParams.get("word")?.trim() ?? "";
  const fallback = req.nextUrl.searchParams.get("fallback")?.trim() || null;
  const lang = normalizeLang(req.nextUrl.searchParams.get("lang"));
  if (!word) {
    return NextResponse.json({ ok: false, error: "missing word" }, { status: 400 });
  }

  try {
    const entry =
      lang === "fr"
        ? await lookupFrenchWord(word, fallback)
        : await lookupWithFallback(word, fallback);
    return NextResponse.json({ ok: true, found: Boolean(entry), entry });
  } catch (e) {
    console.error("[api/dictionary]", lang, word, e);
    return NextResponse.json(
      { ok: false, error: "词典暂时不可用，稍后再试" },
      { status: 502 },
    );
  }
}
