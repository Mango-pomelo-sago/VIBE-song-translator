/**
 * 热门 J-pop 种子曲目（含预计算难度评分）。
 * 由 scripts/build-songs.mjs 生成；难度为内容词平均 JLPT 等级 → 0-100 分。
 */
import type { NeteaseSong } from "@/lib/types";
import type { DifficultyScore } from "@/lib/difficulty";

export type SeedSong = NeteaseSong & { difficulty: DifficultyScore };

export const SEED_SONGS: SeedSong[] = [
  { id: 1409311773, name: "夜に駆ける", artists: [{"id":0,"name":"YOASOBI"}], album: {"id":0,"name":"夜に駆ける"}, durationMs: null, difficulty: { score: 40, level: "intermediate", vocabCount: 243, unknownCount: 60 } },
  { id: 536622304, name: "Lemon", artists: [{"id":0,"name":"米津玄師"}], album: {"id":0,"name":"Lemon"}, durationMs: null, difficulty: { score: 35, level: "beginner", vocabCount: 175, unknownCount: 55 } },
  { id: 496869422, name: "打上花火", artists: [{"id":0,"name":"Daoko"},{"id":0,"name":"米津玄師"}], album: {"id":0,"name":"打上花火"}, durationMs: null, difficulty: { score: 36, level: "beginner", vocabCount: 156, unknownCount: 36 } },
  { id: 426881487, name: "前前前世 (movie ver.)", artists: [{"id":0,"name":"RADWIMPS"}], album: {"id":0,"name":"君の名は。"}, durationMs: null, difficulty: { score: 37, level: "beginner", vocabCount: 179, unknownCount: 62 } },
  { id: 38689152, name: "ひまわりの約束", artists: [{"id":0,"name":"秦基博"}], album: {"id":0,"name":"青の光景"}, durationMs: null, difficulty: { score: 33, level: "beginner", vocabCount: 136, unknownCount: 44 } },
  { id: 1365924378, name: "Pretender", artists: [{"id":0,"name":"Official髭男dism"}], album: {"id":0,"name":"Pretender"}, durationMs: null, difficulty: { score: 41, level: "intermediate", vocabCount: 209, unknownCount: 62 } },
  { id: 28409128, name: "奏 (かなで)", artists: [{"id":0,"name":"スキマスイッチ"}], album: {"id":0,"name":"奏"}, durationMs: null, difficulty: { score: 36, level: "beginner", vocabCount: 141, unknownCount: 39 } },
  { id: 657666, name: "残酷な天使のテーゼ", artists: [{"id":0,"name":"高橋洋子"}], album: {"id":0,"name":"残酷な天使のテーゼ/FLY ME TO THE MOON"}, durationMs: null, difficulty: { score: 47, level: "intermediate", vocabCount: 140, unknownCount: 48 } },
  { id: 817491, name: "世界に一つだけの花 (シングルヴァージョン)", artists: [{"id":0,"name":"SMAP"}], album: {"id":0,"name":"世界に一つだけの花"}, durationMs: null, difficulty: { score: 32, level: "beginner", vocabCount: 146, unknownCount: 40 } },
  { id: 28047035, name: "涙そうそう", artists: [{"id":0,"name":"夏川りみ"}], album: {"id":0,"name":"涙そうそう"}, durationMs: null, difficulty: { score: 55, level: "intermediate", vocabCount: 250, unknownCount: 141 } },
  { id: 22773558, name: "糸", artists: [{"id":0,"name":"中島みゆき"}], album: {"id":0,"name":"Singles 2000"}, durationMs: null, difficulty: { score: 38, level: "beginner", vocabCount: 89, unknownCount: 29 } },
  { id: 642776, name: "丸ノ内サディスティック", artists: [{"id":0,"name":"椎名林檎"}], album: {"id":0,"name":"無罪モラトリアム"}, durationMs: null, difficulty: { score: 43, level: "intermediate", vocabCount: 126, unknownCount: 63 } },
  { id: 1485033549, name: "ドライフラワー", artists: [{"id":0,"name":"優里"}], album: {"id":0,"name":"ドライフラワー"}, durationMs: null, difficulty: { score: 38, level: "beginner", vocabCount: 164, unknownCount: 44 } },
  { id: 2034742057, name: "アイドル", artists: [{"id":0,"name":"YOASOBI"}], album: {"id":0,"name":"アイドル"}, durationMs: null, difficulty: { score: 42, level: "intermediate", vocabCount: 280, unknownCount: 96 } },
  { id: 1632946293, name: "KICK BACK", artists: [{"id":0,"name":"米津玄師"}], album: {"id":0,"name":"KICK BACK"}, durationMs: null, difficulty: { score: 75, level: "advanced", vocabCount: 142, unknownCount: 68 } },
  { id: 1460892590, name: "廻廻奇譚", artists: [{"id":0,"name":"Eve"}], album: {"id":0,"name":"廻廻奇譚"}, durationMs: null, difficulty: { score: 72, level: "advanced", vocabCount: 168, unknownCount: 82 } },
  { id: 1416315190, name: "紅蓮華", artists: [{"id":0,"name":"LiSA"}], album: {"id":0,"name":"紅蓮華"}, durationMs: null, difficulty: { score: 70, level: "advanced", vocabCount: 155, unknownCount: 74 } },
];
