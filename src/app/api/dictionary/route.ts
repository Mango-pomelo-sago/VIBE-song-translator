import { NextRequest, NextResponse } from "next/server";
import { lookupWithFallback } from "@/lib/dictionary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/dictionary?word=词&fallback=基本形 → { ok, found, entry } */
export async function GET(req: NextRequest) {
  const word = req.nextUrl.searchParams.get("word")?.trim() ?? "";
  const fallback = req.nextUrl.searchParams.get("fallback")?.trim() || null;
  if (!word) {
    return NextResponse.json({ ok: false, error: "missing word" }, { status: 400 });
  }

  try {
    const entry = await lookupWithFallback(word, fallback);
    return NextResponse.json({ ok: true, found: Boolean(entry), entry });
  } catch (e) {
    console.error("[api/dictionary]", word, e);
    return NextResponse.json(
      { ok: false, error: "词典暂时不可用，稍后再试" },
      { status: 502 },
    );
  }
}
