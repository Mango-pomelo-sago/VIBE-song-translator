/**
 * 法语种子歌单（含预计算难度）。
 * 由 scripts/build-songs-fr.mjs 生成；难度为内容词平均 CEFR 等级 → 0-100 分。
 * difficulty 为 null 表示尚未评分（歌曲可能暂时无歌词）。
 */
import type { NeteaseSong } from "@/lib/types";
import type { DifficultyScore } from "@/lib/difficulty";

export type SeedSongFr = NeteaseSong & { difficulty: DifficultyScore | null };

export const SEED_SONGS_FR: SeedSongFr[] = [
  { id: 19856953, name: "La Vie en Rose", artists: [{"id":0,"name":"Édith Piaf"}], album: {"id":0,"name":"La Vie en Rose"}, durationMs: null, difficulty: {"score":23,"level":"beginner","vocabCount":93,"unknownCount":0,"scheme":"cefr","averageLevel":"A1"} },
  { id: 22323672, name: "Non, je ne regrette rien", artists: [{"id":0,"name":"Édith Piaf"}], album: {"id":0,"name":"Non, je ne regrette rien"}, durationMs: null, difficulty: {"score":28,"level":"beginner","vocabCount":68,"unknownCount":0,"scheme":"cefr","averageLevel":"A1"} },
  { id: 1480189390, name: "La bohème", artists: [{"id":0,"name":"Charles Aznavour"}], album: {"id":0,"name":"La bohème"}, durationMs: null, difficulty: {"score":37,"level":"beginner","vocabCount":166,"unknownCount":0,"scheme":"cefr","averageLevel":"A2"} },
  { id: 505780914, name: "Ne me quitte pas", artists: [{"id":0,"name":"Jacques Brel"}], album: {"id":0,"name":"Ne me quitte pas"}, durationMs: null, difficulty: {"score":25,"level":"beginner","vocabCount":195,"unknownCount":0,"scheme":"cefr","averageLevel":"A1"} },
  { id: 26500459, name: "Formidable", artists: [{"id":0,"name":"Stromae"}], album: {"id":0,"name":"Formidable"}, durationMs: null, difficulty: {"score":32,"level":"beginner","vocabCount":181,"unknownCount":0,"scheme":"cefr","averageLevel":"A2"} },
  { id: 26349679, name: "Papaoutai", artists: [{"id":0,"name":"Stromae"}], album: {"id":0,"name":"Racine carrée"}, durationMs: null, difficulty: {"score":23,"level":"beginner","vocabCount":208,"unknownCount":0,"scheme":"cefr","averageLevel":"A1"} },
  { id: 19086497, name: "Alors on danse", artists: [{"id":0,"name":"Stromae"}], album: {"id":0,"name":"Cheese"}, durationMs: null, difficulty: {"score":27,"level":"beginner","vocabCount":111,"unknownCount":0,"scheme":"cefr","averageLevel":"A1"} },
  { id: 33539291, name: "Dernière danse", artists: [{"id":0,"name":"Indila"}], album: {"id":0,"name":"Mini World"}, durationMs: null, difficulty: {"score":32,"level":"beginner","vocabCount":158,"unknownCount":0,"scheme":"cefr","averageLevel":"A2"} },
  { id: 19914441, name: "Je veux", artists: [{"id":0,"name":"Zaz"}], album: {"id":0,"name":"Zaz"}, durationMs: null, difficulty: {"score":28,"level":"beginner","vocabCount":157,"unknownCount":0,"scheme":"cefr","averageLevel":"A1"} },
  { id: 27856338, name: "Bella", artists: [{"id":0,"name":"GIMS"}], album: {"id":0,"name":"Subliminal"}, durationMs: null, difficulty: {"score":27,"level":"beginner","vocabCount":324,"unknownCount":0,"scheme":"cefr","averageLevel":"A1"} },
  { id: 1888728442, name: "Bruxelles je t'aime", artists: [{"id":0,"name":"Angèle"}], album: {"id":0,"name":"Nonante-cinq"}, durationMs: null, difficulty: {"score":26,"level":"beginner","vocabCount":260,"unknownCount":0,"scheme":"cefr","averageLevel":"A1"} },
  { id: 2308867, name: "Pour que tu m'aimes encore", artists: [{"id":0,"name":"Céline Dion"}], album: {"id":0,"name":"D'eux"}, durationMs: null, difficulty: {"score":28,"level":"beginner","vocabCount":148,"unknownCount":0,"scheme":"cefr","averageLevel":"A1"} },
];
