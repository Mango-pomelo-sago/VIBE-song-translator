/**
 * 生成 src/data/songs.ts：
 * 1) 对热门 J-pop 曲目逐一搜索网易云，取首个候选（歌曲元数据）；
 * 2) 调 /api/song 主管线取真实难度评分；
 * 3) 输出 data/songs.ts（含 precomputed difficulty）。
 * 需 dev server 在 http://localhost:3000 运行。
 */
import fs from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = new URL("../src/data/songs.ts", import.meta.url);

const QUERIES = [
  "夜に駆ける YOASOBI",
  "Lemon 米津玄師",
  "打上花火 DAOKO",
  "前前前世 RADWIMPS",
  "ひまわりの約束 秦基博",
  "Pretender Official髭男dism",
  "奏 スキマスイッチ",
  "残酷な天使のテーゼ",
  "世界に一つだけの花 SMAP",
  "涙そうそう 夏川りみ",
  "糸 中島みゆき",
  "丸の内サディスティック 椎名林檎",
  "ドライフラワー 優里",
  "アイドル YOASOBI",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(q) {
  const res = await fetch(`${BASE}/api/search?s=${encodeURIComponent(q)}`);
  const json = await res.json();
  if (!json.ok || !json.candidates?.length) return null;
  const c = json.candidates[0];
  return {
    id: c.id,
    name: c.name,
    artists: c.artists?.map((a) => a.name) ?? [],
    album: c.album?.name ?? null,
  };
}

async function difficulty(song) {
  const res = await fetch(`${BASE}/api/song`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ song }),
  });
  const json = await res.json();
  return json.ok ? json.data?.difficulty ?? null : null;
}

const rows = [];
for (const q of QUERIES) {
  try {
    const song = await search(q);
    if (!song) {
      rows.push({ query: q, song: null, error: "search miss" });
      console.log("MISS", q);
      await sleep(400);
      continue;
    }
    const diff = await difficulty(song);
    rows.push({ query: q, song, difficulty: diff });
    console.log(
      "OK",
      q,
      "->",
      song.name,
      diff ? `[${diff.score} ${diff.level}]` : "[no diff]",
    );
  } catch (e) {
    rows.push({ query: q, song: null, error: String(e) });
    console.log("ERR", q, String(e));
  }
  await sleep(500);
}

// 转成 data/songs.ts 的结构
const seeds = rows
  .filter((r) => r.song && r.difficulty)
  .map((r) => ({
    id: r.song.id,
    name: r.song.name,
    artists: r.song.artists,
    album: r.song.album,
    difficulty: r.difficulty,
  }));

const header = `/**
 * 热门 J-pop 种子曲目（含预计算难度评分）。
 * 由 scripts/build-songs.mjs 生成；难度为内容词平均 JLPT 等级 → 0-100 分。
 */
import type { NeteaseSong } from "@/lib/types";
import type { DifficultyScore } from "@/lib/difficulty";

export type SeedSong = NeteaseSong & { difficulty: DifficultyScore };

export const SEED_SONGS: SeedSong[] = [
`;
const body = seeds
  .map(
    (s) =>
      `  { id: ${s.id}, name: ${JSON.stringify(s.name)}, artists: ${JSON.stringify(
        s.artists.map((n) => ({ id: 0, name: n })),
      )}, album: ${JSON.stringify(
        s.album ? { id: 0, name: s.album } : null,
      )}, durationMs: null, difficulty: { score: ${s.difficulty.score}, level: "${
        s.difficulty.level
      }", vocabCount: ${s.difficulty.vocabCount}, unknownCount: ${
        s.difficulty.unknownCount
      } } },`,
  )
  .join("\n");

fs.writeFileSync(OUT, header + body + "\n];\n", "utf8");
fs.writeFileSync(
  new URL("./songs-out.txt", import.meta.url),
  JSON.stringify(rows, null, 2),
  "utf8",
);
console.log(`written ${seeds.length} seeds`);
