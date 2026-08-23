/**
 * 生成 src/data/jlpt.ts（word→level 映射）。
 * 数据源：
 *  - 现有 curated 词表（保持）
 *  - tanos.co.uk 全表 scripts/jlpt-all.json（Bluskyo/JLPT_Vocabulary 转换，CC BY；
 *    下载：https://raw.githubusercontent.com/Bluskyo/JLPT_Vocabulary/main/data/vocab/results/JLPT_vocab_ALL.json）
 * 合并策略：同一 surface 多等级取最易（N5 最易 … N1 最难）。
 */
import fs from "node:fs";

const LEVEL_EASE = { N5: 1, N4: 2, N3: 3, N2: 4, N1: 5 }; // 数字越小越易
const map = new Map(); // word -> level

// 合法词键：仅日文（汉字/平假名/片假名/々/ー），排除括号、拉丁、数字、空格等。
// 注意 ・（片假名中点 U+30FB）落在 ゠-ヿ 区间内，但它会让裸标识符 key 无法被 TS 解析，须单独排除。
const WORD_RE = /^[々一-鿿぀-ゟ゠-ヿー]+$/;

function setIfEasier(word, lv) {
  if (!lv || !WORD_RE.test(word) || word.includes("・")) return;
  if (!map.has(word) || LEVEL_EASE[lv] < LEVEL_EASE[map.get(word)]) {
    map.set(word, lv);
  }
}

// 1) 现有 curated 词表
const srcPath = new URL("../src/data/jlpt.ts", import.meta.url);
const src = fs.readFileSync(srcPath, "utf8");
for (const m of src.matchAll(/([^\s:：,]+):\s*"(N[1-5])"/g)) {
  setIfEasier(m[1].trim(), m[2]);
}

// 2) tanos 全表
const jlptPath = new URL("./jlpt-all.json", import.meta.url);
if (fs.existsSync(jlptPath)) {
  const j = JSON.parse(fs.readFileSync(jlptPath, "utf8"));
  for (const [word, readings] of Object.entries(j)) {
    if (!WORD_RE.test(word)) continue; // 含括号/空格/拉丁等无法按 token 精确匹配，跳过
    let best = null;
    for (const r of readings) {
      const n = Number(r.level);
      const lv = n === 5 ? "N5" : n === 4 ? "N4" : n === 3 ? "N3" : n === 2 ? "N2" : "N1";
      if (!best || LEVEL_EASE[lv] < LEVEL_EASE[best]) best = lv;
    }
    setIfEasier(word, best);
  }
}

const count = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
for (const [, lv] of map) count[lv]++;

const byLevel = ["N5", "N4", "N3", "N2", "N1"]
  .map((lv) => [...map.entries()].filter(([, l]) => l === lv).map(([w]) => w));

const header = `/**
 * 本地 JLPT 词表（word → 等级）。
 * 由 scripts/build-jlpt.mjs 生成（curated + tanos.co.uk 全表，CC BY，取最易等级）。
 * miss 的词前端显示「未知」，hover 时与 Jisho 的 jlpt 交叉校验。
 */
export const JLPT_WORDS: Record<string, string> = {
`;
const sections = ["N5", "N4", "N3", "N2", "N1"].map((lv, i) => {
  const words = byLevel[i];
  const lines = [];
  for (let j = 0; j < words.length; j += 10) {
    lines.push("  " + words.slice(j, j + 10).map((w) => `${w}: "${lv}"`).join(", "));
  }
  return `  // ---- ${lv} ----\n${lines.join(",\n")},\n`;
});

const out = header + sections.join("\n") + "};\n";
fs.writeFileSync(srcPath, out, "utf8");
console.log(`generated: ${map.size} words (${JSON.stringify(count)})`);
