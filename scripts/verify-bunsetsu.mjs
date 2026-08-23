// M4 验证：调 /api/song，抽样输出文节罗马音（重点：跨 token 促音合并）
const song = { id: 1409311773, name: "夜に駆ける", artists: [], album: null };

const res = await fetch("http://localhost:3000/api/song", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ song }),
});

const json = await res.json();
const out = [];
if (!json.ok) {
  out.push("API ERROR: " + json.error);
} else {
  const picks = ["二人", "分か", "わか", "海", "空", "いつの間", "傷", "色", "月", "夢"];
  const seen = new Set();
  out.push(`warnings: ${json.data.warnings?.join(" | ") || "(none)"}`);
  for (const l of json.data.lines) {
    if (!l.bunsetsu?.length) continue;
    const hit = picks.some((p) => l.text.includes(p));
    if (hit && !seen.has(l.index) && seen.size < 8) {
      seen.add(l.index);
      out.push(
        `[${l.index}] ${l.text}\n    romaji: ${l.romaji}\n    bunsetsu: ` +
          l.bunsetsu
            .map((b) => `${b.text} → "${b.romaji}"` + (b.romajiParts?.length ? "" : ""))
            .join("  ·  "),
      );
    }
  }
}
await import("node:fs").then((fs) =>
  fs.writeFileSync(new URL("./verify-out.txt", import.meta.url), out.join("\n"), "utf8"),
);
console.log("written");
