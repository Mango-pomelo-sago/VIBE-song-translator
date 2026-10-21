/**
 * 生成法语种子歌单：通过本地 dev server 调 /api/song?lang=fr 预计算难度。
 *
 * 用法：先 npm run dev，然后 npm run build:songs-fr
 * 服务不可用时 difficulty 写 null，UI 显示「未评分」，不影响点击加载。
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const SONGS = [
  { id: 19856953, name: "La Vie en Rose", artist: "Édith Piaf", album: "La Vie en Rose" },
  { id: 22323672, name: "Non, je ne regrette rien", artist: "Édith Piaf", album: "Non, je ne regrette rien" },
  { id: 1480189390, name: "La bohème", artist: "Charles Aznavour", album: "La bohème" },
  { id: 505780914, name: "Ne me quitte pas", artist: "Jacques Brel", album: "Ne me quitte pas" },
  { id: 26500459, name: "Formidable", artist: "Stromae", album: "Formidable" },
  { id: 26349679, name: "Papaoutai", artist: "Stromae", album: "Racine carrée" },
  { id: 19086497, name: "Alors on danse", artist: "Stromae", album: "Cheese" },
  { id: 33539291, name: "Dernière danse", artist: "Indila", album: "Mini World" },
  { id: 19914441, name: "Je veux", artist: "Zaz", album: "Zaz" },
  { id: 27856338, name: "Bella", artist: "GIMS", album: "Subliminal" },
  { id: 1888728442, name: "Bruxelles je t'aime", artist: "Angèle", album: "Nonante-cinq" },
  { id: 2308867, name: "Pour que tu m'aimes encore", artist: "Céline Dion", album: "D'eux" },
  // 更难的一档：B1+ 词汇密度更高，用于填充「进阶 / 挑战」
  { id: 565191980, name: "Basique", artist: "Orelsan", album: "La fête est finie" },
  { id: 1471187227, name: "Bande organisée", artist: "13 Organisé", album: "13 Organisé" },
  { id: 16430601, name: "La nuit je mens", artist: "Alain Bashung", album: "Fantaisie militaire" },
  { id: 1871061509, name: "Désenchantée", artist: "Mylène Farmer", album: "L'Autre…" },
  { id: 1294696149, name: "Les copains d'abord", artist: "Georges Brassens", album: "Les copains d'abord" },
  { id: 528235489, name: "Chanson pour l'Auvergnat", artist: "Georges Brassens", album: "Chanson pour l'Auvergnat" },
  { id: 16804485, name: "L'Aigle noir", artist: "Barbara", album: "L'Aigle noir" },
  { id: 22417581, name: "Mistral gagnant", artist: "Renaud", album: "Mistral gagnant" },
  { id: 3032071, name: "Sans contrefaçon", artist: "Mylène Farmer", album: "Ainsi soit je…" },
  { id: 17762585, name: "La corrida", artist: "Francis Cabrel", album: "Samedi soir sur la Terre" },
  { id: 17762589, name: "Je t'aimais, je t'aime, je t'aimerai", artist: "Francis Cabrel", album: "Samedi soir sur la Terre" },
  { id: 1321708995, name: "Djadja", artist: "Aya Nakamura", album: "Nakamura" },
];

async function fetchDifficulty(song) {
  const body = {
    song: {
      id: song.id,
      name: song.name,
      artists: [{ id: 0, name: song.artist }],
      album: { id: 0, name: song.album },
      durationMs: null,
    },
    lang: "fr",
  };
  try {
    const res = await fetch(`${BASE}/api/song`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90_000),
    });
    const json = await res.json();
    if (!json?.ok) {
      console.warn(`! ${song.name}: ${json?.error ?? res.status}`);
      return null;
    }
    const d = json.data?.difficulty ?? null;
    console.log(`✓ ${song.name}: ${d ? `${d.averageLevel ?? "?"} / ${d.score}` : "未评分"}`);
    return d;
  } catch (e) {
    console.warn(`! ${song.name}: ${e.message}`);
    return null;
  }
}

function row(song, difficulty) {
  const artists = JSON.stringify([{ id: 0, name: song.artist }]);
  const album = JSON.stringify({ id: 0, name: song.album });
  const diff = difficulty
    ? JSON.stringify({
        score: difficulty.score,
        level: difficulty.level,
        vocabCount: difficulty.vocabCount,
        unknownCount: difficulty.unknownCount,
        scheme: "cefr",
        averageLevel: difficulty.averageLevel ?? null,
        rareRatio: difficulty.rareRatio ?? null,
      })
    : "null";
  return `  { id: ${song.id}, name: ${JSON.stringify(song.name)}, artists: ${artists}, album: ${album}, durationMs: null, difficulty: ${diff} },`;
}

const results = [];
for (const song of SONGS) {
  results.push({ song, difficulty: await fetchDifficulty(song) });
}

const content = `/**
 * 法语种子歌单（含预计算难度）。
 * 由 scripts/build-songs-fr.mjs 生成；难度 = 内容词平均 CEFR 等级 + B1+ 词汇占比 → 0-100 分。
 * difficulty 为 null 表示尚未评分（歌曲可能暂时无歌词）。
 */
import type { NeteaseSong } from "@/lib/types";
import type { DifficultyScore } from "@/lib/difficulty";

export type SeedSongFr = NeteaseSong & { difficulty: DifficultyScore | null };

export const SEED_SONGS_FR: SeedSongFr[] = [
${results.map((r) => row(r.song, r.difficulty)).join("\n")}
];
`;

const out = path.join(process.cwd(), "src", "data", "songs-fr.ts");
writeFileSync(out, content, "utf8");
console.log(`\n写入 ${out}（${results.length} 首）`);
