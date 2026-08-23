const res = await fetch(
  "http://localhost:3000/api/search?s=" + encodeURIComponent("夜に駆ける"),
);
const json = await res.json();
const out = [];
if (!json.ok) {
  out.push("ERR " + json.error);
} else {
  for (const s of (json.candidates ?? []).slice(0, 6)) {
    out.push(`${s.id}  ${s.name}  —  ${s.artists.map((a) => a.name).join("/")}`);
  }
}
await import("node:fs").then((fs) =>
  fs.writeFileSync(new URL("./verify-out.txt", import.meta.url), out.join("\n"), "utf8"),
);
console.log("done");
