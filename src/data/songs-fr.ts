/**
 * 法语种子歌单（含预计算难度）。
 * 由 scripts/build-songs-fr.mjs 生成；难度 = 内容词平均 CEFR 等级 + B1+ 词汇占比 → 0-100 分。
 * difficulty 为 null 表示尚未评分（歌曲可能暂时无歌词）。
 */
import type { NeteaseSong } from "@/lib/types";
import type { DifficultyScore } from "@/lib/difficulty";

export type SeedSongFr = NeteaseSong & { difficulty: DifficultyScore | null };

export const SEED_SONGS_FR: SeedSongFr[] = [
  { id: 19856953, name: "La Vie en Rose", artists: [{"id":0,"name":"Édith Piaf"}], album: {"id":0,"name":"La Vie en Rose"}, durationMs: null, difficulty: {"score":13,"level":"beginner","vocabCount":93,"unknownCount":0,"scheme":"cefr","averageLevel":"A1","rareRatio":0.022} },
  { id: 22323672, name: "Non, je ne regrette rien", artists: [{"id":0,"name":"Édith Piaf"}], album: {"id":0,"name":"Non, je ne regrette rien"}, durationMs: null, difficulty: {"score":28,"level":"beginner","vocabCount":67,"unknownCount":0,"scheme":"cefr","averageLevel":"A1","rareRatio":0.134} },
  { id: 1480189390, name: "La bohème", artists: [{"id":0,"name":"Charles Aznavour"}], album: {"id":0,"name":"La bohème"}, durationMs: null, difficulty: {"score":42,"level":"intermediate","vocabCount":165,"unknownCount":0,"scheme":"cefr","averageLevel":"A2","rareRatio":0.212} },
  { id: 505780914, name: "Ne me quitte pas", artists: [{"id":0,"name":"Jacques Brel"}], album: {"id":0,"name":"Ne me quitte pas"}, durationMs: null, difficulty: {"score":18,"level":"beginner","vocabCount":194,"unknownCount":0,"scheme":"cefr","averageLevel":"A1","rareRatio":0.062} },
  { id: 26500459, name: "Formidable", artists: [{"id":0,"name":"Stromae"}], album: {"id":0,"name":"Formidable"}, durationMs: null, difficulty: {"score":31,"level":"intermediate","vocabCount":181,"unknownCount":0,"scheme":"cefr","averageLevel":"A2","rareRatio":0.138} },
  { id: 26349679, name: "Papaoutai", artists: [{"id":0,"name":"Stromae"}], album: {"id":0,"name":"Racine carrée"}, durationMs: null, difficulty: {"score":15,"level":"beginner","vocabCount":207,"unknownCount":0,"scheme":"cefr","averageLevel":"A1","rareRatio":0.043} },
  { id: 19086497, name: "Alors on danse", artists: [{"id":0,"name":"Stromae"}], album: {"id":0,"name":"Cheese"}, durationMs: null, difficulty: {"score":23,"level":"beginner","vocabCount":111,"unknownCount":0,"scheme":"cefr","averageLevel":"A1","rareRatio":0.09} },
  { id: 33539291, name: "Dernière danse", artists: [{"id":0,"name":"Indila"}], album: {"id":0,"name":"Mini World"}, durationMs: null, difficulty: {"score":32,"level":"intermediate","vocabCount":157,"unknownCount":0,"scheme":"cefr","averageLevel":"A2","rareRatio":0.14} },
  { id: 19914441, name: "Je veux", artists: [{"id":0,"name":"Zaz"}], album: {"id":0,"name":"Zaz"}, durationMs: null, difficulty: {"score":22,"level":"beginner","vocabCount":150,"unknownCount":0,"scheme":"cefr","averageLevel":"A1","rareRatio":0.08} },
  { id: 27856338, name: "Bella", artists: [{"id":0,"name":"GIMS"}], album: {"id":0,"name":"Subliminal"}, durationMs: null, difficulty: {"score":21,"level":"beginner","vocabCount":321,"unknownCount":0,"scheme":"cefr","averageLevel":"A1","rareRatio":0.075} },
  { id: 1888728442, name: "Bruxelles je t'aime", artists: [{"id":0,"name":"Angèle"}], album: {"id":0,"name":"Nonante-cinq"}, durationMs: null, difficulty: {"score":19,"level":"beginner","vocabCount":253,"unknownCount":0,"scheme":"cefr","averageLevel":"A1","rareRatio":0.063} },
  { id: 2308867, name: "Pour que tu m'aimes encore", artists: [{"id":0,"name":"Céline Dion"}], album: {"id":0,"name":"D'eux"}, durationMs: null, difficulty: {"score":24,"level":"beginner","vocabCount":148,"unknownCount":0,"scheme":"cefr","averageLevel":"A1","rareRatio":0.095} },
  { id: 565191980, name: "Basique", artists: [{"id":0,"name":"Orelsan"}], album: {"id":0,"name":"La fête est finie"}, durationMs: null, difficulty: {"score":49,"level":"advanced","vocabCount":216,"unknownCount":0,"scheme":"cefr","averageLevel":"A2","rareRatio":0.236} },
  { id: 1471187227, name: "Bande organisée", artists: [{"id":0,"name":"13 Organisé"}], album: {"id":0,"name":"13 Organisé"}, durationMs: null, difficulty: {"score":58,"level":"advanced","vocabCount":464,"unknownCount":0,"scheme":"cefr","averageLevel":"A2","rareRatio":0.332} },
  { id: 16430601, name: "La nuit je mens", artists: [{"id":0,"name":"Alain Bashung"}], album: {"id":0,"name":"Fantaisie militaire"}, durationMs: null, difficulty: {"score":53,"level":"advanced","vocabCount":140,"unknownCount":0,"scheme":"cefr","averageLevel":"A2","rareRatio":0.3} },
  { id: 1871061509, name: "Désenchantée", artists: [{"id":0,"name":"Mylène Farmer"}], album: {"id":0,"name":"L'Autre…"}, durationMs: null, difficulty: {"score":50,"level":"advanced","vocabCount":142,"unknownCount":0,"scheme":"cefr","averageLevel":"A2","rareRatio":0.289} },
  { id: 1294696149, name: "Les copains d'abord", artists: [{"id":0,"name":"Georges Brassens"}], album: {"id":0,"name":"Les copains d'abord"}, durationMs: null, difficulty: {"score":44,"level":"intermediate","vocabCount":145,"unknownCount":0,"scheme":"cefr","averageLevel":"A2","rareRatio":0.228} },
  { id: 528235489, name: "Chanson pour l'Auvergnat", artists: [{"id":0,"name":"Georges Brassens"}], album: {"id":0,"name":"Chanson pour l'Auvergnat"}, durationMs: null, difficulty: {"score":39,"level":"intermediate","vocabCount":130,"unknownCount":0,"scheme":"cefr","averageLevel":"A2","rareRatio":0.192} },
  { id: 16804485, name: "L'Aigle noir", artists: [{"id":0,"name":"Barbara"}], album: {"id":0,"name":"L'Aigle noir"}, durationMs: null, difficulty: {"score":40,"level":"intermediate","vocabCount":164,"unknownCount":0,"scheme":"cefr","averageLevel":"A2","rareRatio":0.207} },
  { id: 22417581, name: "Mistral gagnant", artists: [{"id":0,"name":"Renaud"}], album: {"id":0,"name":"Mistral gagnant"}, durationMs: null, difficulty: {"score":41,"level":"intermediate","vocabCount":145,"unknownCount":0,"scheme":"cefr","averageLevel":"A2","rareRatio":0.214} },
  { id: 3032071, name: "Sans contrefaçon", artists: [{"id":0,"name":"Mylène Farmer"}], album: {"id":0,"name":"Ainsi soit je…"}, durationMs: null, difficulty: {"score":43,"level":"intermediate","vocabCount":111,"unknownCount":0,"scheme":"cefr","averageLevel":"A2","rareRatio":0.216} },
  { id: 17762585, name: "La corrida", artists: [{"id":0,"name":"Francis Cabrel"}], album: {"id":0,"name":"Samedi soir sur la Terre"}, durationMs: null, difficulty: {"score":31,"level":"intermediate","vocabCount":131,"unknownCount":0,"scheme":"cefr","averageLevel":"A2","rareRatio":0.137} },
  { id: 17762589, name: "Je t'aimais, je t'aime, je t'aimerai", artists: [{"id":0,"name":"Francis Cabrel"}], album: {"id":0,"name":"Samedi soir sur la Terre"}, durationMs: null, difficulty: {"score":30,"level":"intermediate","vocabCount":121,"unknownCount":0,"scheme":"cefr","averageLevel":"A2","rareRatio":0.14} },
  { id: 1321708995, name: "Djadja", artists: [{"id":0,"name":"Aya Nakamura"}], album: {"id":0,"name":"Nakamura"}, durationMs: null, difficulty: {"score":44,"level":"intermediate","vocabCount":144,"unknownCount":0,"scheme":"cefr","averageLevel":"A2","rareRatio":0.243} },
];
