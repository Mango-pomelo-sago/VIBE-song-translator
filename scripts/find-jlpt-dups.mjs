import fs from "node:fs";
const src = fs.readFileSync(new URL("../src/data/jlpt.ts", import.meta.url), "utf8");
const lines = src.split("\n");
const seen = new Map(); // word -> level
const dups = [];
for (const ln of lines) {
  const m = ln.match(/([^\s:：]+):\s*"(N[1-5])"/g) ?? [];
  for (const pair of m) {
    const [w, lv] = pair.split(":");
    const clean = w.replace(/\s/g, "");
    if (seen.has(clean)) dups.push(`${clean}: ${seen.get(clean)} -> ${lv.replace(/"/g, "")} (line ${ln.trim().slice(0, 40)})`);
    else seen.set(clean, lv.replace(/"/g, ""));
  }
}
fs.writeFileSync(new URL("./dup-out.txt", import.meta.url), dups.join("\n"), "utf8");
console.log("dups:", dups.length);
