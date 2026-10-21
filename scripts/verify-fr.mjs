#!/usr/bin/env node
/**
 * 法语歌词管线冒烟验证：对本地 dev server 的 /api/song 发请求，
 * 断言每首歌都有 tokens、IPA、CEFR、意群与 CEFR 难度。
 *
 * 用法：node scripts/verify-fr.mjs [baseUrl]
 * 前置：npm run dev（NODE_ENV 不要设成 production）
 */

const BASE = process.argv[2] || "http://localhost:3000";

const SONGS = [
  { id: 19856953, name: "La Vie en Rose", artist: "Édith Piaf" },
  { id: 26349679, name: "Papaoutai", artist: "Stromae" },
  { id: 33539291, name: "Dernière danse", artist: "Indila" },
  { id: 1888728442, name: "Bruxelles je t'aime", artist: "Angèle" },
  { id: 1480189390, name: "La bohème", artist: "Charles Aznavour" },
];

function fail(msg) {
  console.error(`  ✗ ${msg}`);
  return 1;
}

async function verify(song) {
  const res = await fetch(`${BASE}/api/song`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      song: {
        id: song.id,
        name: song.name,
        artists: [{ id: 0, name: song.artist }],
        album: null,
      },
      lang: "fr",
    }),
    signal: AbortSignal.timeout(90_000),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    return fail(`HTTP ${res.status}：${json?.error ?? "无响应"}`);
  }
  const data = json.data;
  const withTokens = data.lines.filter((l) => l.tokens?.length);
  if (data.lang !== "fr") return fail(`lang 应为 fr，实际 ${data.lang}`);
  if (withTokens.length === 0) return fail("没有任何已分词的歌词行");

  const tokens = withTokens.flatMap((l) => l.tokens);
  const ipa = tokens.filter((t) => t.ipa && t.ruby?.some((r) => r.kind === "ipa"));
  if (ipa.length === 0) return fail("没有 IPA 标注");
  const leveled = tokens.filter((t) => t.level);
  if (leveled.length === 0) return fail("没有 CEFR 等级");
  const chunks = withTokens.flatMap((l) => l.bunsetsu ?? []);
  if (chunks.length === 0) return fail("没有意群");
  const unknown = tokens.filter((t) => t.pos === "UNK");
  const liaisons = tokens.filter((t) => t.liaison);
  if (data.difficulty?.scheme !== "cefr") {
    return fail(`难度口径应为 cefr，实际 ${data.difficulty?.scheme}`);
  }

  console.log(
    `  ✓ ${song.name}｜${withTokens.length} 行 · ${tokens.length} 词 · ` +
      `${ipa.length} IPA · ${leveled.length} 分级 · ${chunks.length} 意群 · ` +
      `${liaisons.length} 联诵 · ${unknown.length} 未登录 · ` +
      `难度 ${data.difficulty.averageLevel ?? "?"}`,
  );
  if (unknown.length > tokens.length * 0.5) {
    return fail(`未登录词过多（${unknown.length}/${tokens.length}）`);
  }
  return 0;
}

let failures = 0;
console.log(`验证 ${SONGS.length} 首法语歌 @ ${BASE}`);
for (const song of SONGS) {
  try {
    failures += await verify(song);
  } catch (e) {
    failures += fail(e instanceof Error ? e.message : String(e));
  }
}
if (failures > 0) {
  console.error(`\n${failures} 项失败`);
  process.exit(1);
}
console.log("\n全部通过");
