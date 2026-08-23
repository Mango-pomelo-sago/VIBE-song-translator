import { NextRequest, NextResponse } from "next/server";
import { searchSongs } from "@/lib/netease";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/search?s=歌名 → { ok, candidates } */
export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams.get("s")?.trim() ?? "";
  if (!s) {
    return NextResponse.json({ ok: false, error: "missing s" }, { status: 400 });
  }
  try {
    const candidates = await searchSongs(s);
    return NextResponse.json({ ok: true, candidates });
  } catch (e) {
    console.error("[api/search]", s, e);
    return NextResponse.json(
      { ok: false, error: "搜索失败，请稍后重试" },
      { status: 502 },
    );
  }
}
