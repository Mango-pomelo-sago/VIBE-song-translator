#!/usr/bin/env node
/**
 * 生成法语离线词表 src/data/fr/lexicon.json。
 *
 * 数据源：Lexique383（New & Pallier），CC BY-SA 4.0
 *   https://www.lexique.org/databases/Lexique383/Lexique383.tsv
 *
 * 用法：
 *   node scripts/build-fr-lexicon.mjs                 # 自动下载（缓存到 data/fr/raw/）
 *   node scripts/build-fr-lexicon.mjs --input <tsv>   # 使用本地文件
 *   node scripts/build-fr-lexicon.mjs --min-form-freq 0.02 --max-lemma-rank 8000
 */
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_URL =
  "https://www.lexique.org/databases/Lexique383/Lexique383.tsv";
const RAW_DIR = path.join(ROOT, "data", "fr", "raw");
const RAW_PATH = path.join(RAW_DIR, "Lexique383.tsv");
const OUT_PATH = path.join(ROOT, "src", "data", "fr", "lexicon.json");

/** Lexique phon 编码 → IPA（逐字符映射，nasal 元音为两个 Unicode 码点） */
const PHON_TO_IPA = {
  a: "a", i: "i", y: "y", u: "u", o: "o", e: "e",
  O: "ɔ", E: "ɛ", "°": "ə", 3: "ə", 2: "ø", 9: "œ",
  5: "ɛ̃", 1: "œ̃", "@": "ɑ̃", "§": "ɔ̃",
  j: "j", 8: "ɥ", w: "w",
  p: "p", b: "b", t: "t", d: "d", k: "k", g: "ɡ",
  f: "f", v: "v", s: "s", z: "z", S: "ʃ", Z: "ʒ",
  m: "m", n: "n", N: "ɲ", l: "l", R: "ʁ", x: "x", G: "ŋ",
};

function phonToIpa(phon) {
  if (!phon) return "";
  let out = "";
  for (const ch of phon) out += PHON_TO_IPA[ch] ?? ch;
  return out.normalize("NFC");
}

function parseArgs(argv) {
  const opts = {
    input: "",
    url: DEFAULT_URL,
    minFormFreq: 0.2,
    maxLemmaRank: 4000,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--input") opts.input = argv[++i];
    else if (a === "--url") opts.url = argv[++i];
    else if (a === "--min-form-freq") opts.minFormFreq = Number(argv[++i]);
    else if (a === "--max-lemma-rank") opts.maxLemmaRank = Number(argv[++i]);
  }
  return opts;
}

async function exists(p) {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}

async function loadTsv(opts) {
  if (opts.input) {
    console.error(`[fr-lexicon] 读取本地文件 ${opts.input}`);
    return readFile(opts.input, "utf8");
  }
  if (await exists(RAW_PATH)) {
    console.error(`[fr-lexicon] 使用缓存 ${RAW_PATH}`);
    return readFile(RAW_PATH, "utf8");
  }
  console.error(`[fr-lexicon] 下载 ${opts.url} …`);
  const res = await fetch(opts.url);
  if (!res.ok) throw new Error(`下载失败：HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(RAW_DIR, { recursive: true });
  await writeFile(RAW_PATH, buf);
  console.error(`[fr-lexicon] 已缓存到 ${RAW_PATH}（${(buf.length / 1e6).toFixed(1)} MB）`);
  return buf.toString("utf8");
}

/** 函数词固定为 A1，避免高频虚词被误判 */
const FUNCTION_POS = new Set(["ART", "DET", "PRO", "PRE", "CON", "AUX"]);

/** 同形词里优先选择更常见的语式：直陈 > 条件 > 虚拟 > 不定式 > 分词 > 祈使 */
const MODE_RANK = { ind: 0, con: 1, sub: 2, inf: 3, par: 4, imp: 5 };

/** 同一词形对应多个人称时（如 avais = 1s/2s），优先 1s，其次 3s */
const PERSON_RANK = { "1s": 0, "3s": 1, "2s": 2, "1p": 3, "3p": 4, "2p": 5 };

function infoverRank(infover) {
  const mode = (infover || "").split(":")[0];
  return MODE_RANK[mode] ?? 6;
}

function personRank(infover) {
  const parts = (infover || "").split(":");
  return PERSON_RANK[parts[2]] ?? 9;
}

/**
 * Lexique 的 infover 一格里可能并列多个屈折（如
 * `imp:pre:2s;ind:pre:1s;ind:pre:3s;…`），取其中最常用者。
 */
function pickInfover(field) {
  const candidates = (field || "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  if (candidates.length === 0) return "";
  candidates.sort((a, b) => {
    const m = infoverRank(a) - infoverRank(b);
    if (m !== 0) return m;
    return personRank(a) - personRank(b);
  });
  return candidates[0];
}

/** 同形词排序：lemma 更常用者优先，其次语式/人称，最后看词形频率 */
function betterEntry(a, b) {
  const ar = lemmaRankOf(a);
  const br = lemmaRankOf(b);
  if (ar !== br) return ar < br;
  const ai = infoverRank(a.infover);
  const bi = infoverRank(b.infover);
  if (ai !== bi) return ai < bi;
  const ap = personRank(a.infover);
  const bp = personRank(b.infover);
  if (ap !== bp) return ap < bp;
  return a.formFreq > b.formFreq;
}

let lemmaRankRef = new Map();
function lemmaRankOf(r) {
  return lemmaRankRef.get(r.lemma) ?? Infinity;
}

function cefrBand(rank) {
  if (rank <= 600) return "A1";
  if (rank <= 1800) return "A2";
  if (rank <= 4000) return "B1";
  if (rank <= 9000) return "B2";
  return "C1";
}

const n = (v) => {
  const x = Number.parseFloat(v);
  return Number.isFinite(x) ? x : 0;
};

async function main() {
  const opts = parseArgs(process.argv);
  const text = await loadTsv(opts);
  const lines = text.split(/\r?\n/);
  const header = lines[0].split("\t");
  const col = (name) => {
    const i = header.indexOf(name);
    if (i < 0) throw new Error(`Lexique383 缺少列：${name}`);
    return i;
  };
  const C = {
    ortho: col("ortho"),
    phon: col("phon"),
    lemme: col("lemme"),
    cgram: col("cgram"),
    genre: col("genre"),
    nombre: col("nombre"),
    freqlemfilms2: col("freqlemfilms2"),
    freqlemlivres: col("freqlemlivres"),
    freqfilms2: col("freqfilms2"),
    freqlivres: col("freqlivres"),
    infover: col("infover"),
  };

  /** 第一遍：收集 lemma 频率，用于 CEFR 估算 */
  const lemmaFreq = new Map();
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const c = line.split("\t");
    if (c.length <= C.infover) continue;
    const ortho = (c[C.ortho] || "").normalize("NFC").trim();
    const lemma = (c[C.lemme] || ortho).normalize("NFC").trim();
    if (!ortho || !lemma) continue;
    // 多词条目无法与单个 token 对齐，跳过
    if (/\s/.test(ortho)) continue;

    const formFreq = Math.max(n(c[C.freqfilms2]), n(c[C.freqlivres]));
    const lemmaF = Math.max(n(c[C.freqlemfilms2]), n(c[C.freqlemlivres]));
    const prev = lemmaFreq.get(lemma);
    if (prev === undefined || lemmaF > prev) lemmaFreq.set(lemma, lemmaF);

    rows.push({
      ortho,
      lemma,
      cgram: (c[C.cgram] || "").trim(),
      genre: (c[C.genre] || "").trim(),
      nombre: (c[C.nombre] || "").trim(),
      infover: pickInfover(c[C.infover]),
      phon: (c[C.phon] || "").trim(),
      formFreq,
      lemmaFreq: lemmaF,
    });
  }

  /** lemma 排名（按频率降序，1 起） */
  const sortedLemmas = [...lemmaFreq.entries()].sort((a, b) => b[1] - a[1]);
  const lemmaRank = new Map();
  sortedLemmas.forEach(([lemma], idx) => lemmaRank.set(lemma, idx + 1));
  lemmaRankRef = lemmaRank;

  /** 同形词保留词频最高的一条 */
  const best = new Map();
  for (const r of rows) {
    const rank = lemmaRank.get(r.lemma) ?? Infinity;
    if (rank > opts.maxLemmaRank && r.formFreq < opts.minFormFreq) continue;
    const key = r.ortho.toLocaleLowerCase("fr");
    const prev = best.get(key);
    if (!prev || betterEntry(r, prev)) best.set(key, r);
  }

  const outRows = {};
  const posCounts = new Map();
  for (const [key, r] of best) {
    const rank = lemmaRank.get(r.lemma) ?? Infinity;
    const cefr = FUNCTION_POS.has(r.cgram) ? "A1" : cefrBand(rank);
    outRows[key] = [
      r.lemma,
      r.cgram,
      r.genre,
      r.nombre,
      phonToIpa(r.phon),
      Math.round(r.formFreq * 1000) / 1000,
      r.infover,
      cefr,
    ];
    posCounts.set(r.cgram, (posCounts.get(r.cgram) ?? 0) + 1);
  }

  const payload = {
    version: 1,
    source: "Lexique383 (New & Pallier) — https://www.lexique.org/",
    license: "CC BY-SA 4.0",
    note: "CEFR 为基于词频排名的估算，非官方分级；row = [lemma, cgram, genre, nombre, ipa, freq, infover, cefr]",
    rows: outRows,
  };
  const json = JSON.stringify(payload);
  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, json, "utf8");

  const sizeMb = Buffer.byteLength(json) / 1e6;
  console.error(`[fr-lexicon] 写出 ${Object.keys(outRows).length} 条 → ${OUT_PATH}`);
  console.error(`[fr-lexicon] 体积 ${sizeMb.toFixed(2)} MB`);
  console.error(
    `[fr-lexicon] 词性分布 ${JSON.stringify(Object.fromEntries([...posCounts].sort((a, b) => b[1] - a[1]).slice(0, 12)))}`,
  );
  if (sizeMb > 6) {
    console.error(
      "[fr-lexicon] 警告：体积超过 6MB，可提高 --min-form-freq 或降低 --max-lemma-rank",
    );
  }
}

main().catch((e) => {
  console.error("[fr-lexicon] 失败：", e);
  process.exit(1);
});
