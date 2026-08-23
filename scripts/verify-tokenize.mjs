// 直接调 kuromoji，看 二人 的实际分词
import path from "path";
import kuromoji from "kuromoji";
import { toHiragana } from "wanakana";

const dicPath = path.join(process.cwd(), "node_modules", "kuromoji", "dict");
const out = [];
const t = await new Promise((res, rej) =>
  kuromoji.builder({ dicPath }).build((e, tk) => (e ? rej(e) : res(tk))),
);
for (const text of ["二人だけの空", "一人で", "二人なら", "二人三脚", "二人でいよう"]) {
  const toks = t.tokenize(text);
  out.push(
    `「${text}」 → ` +
      toks
        .map(
          (x) =>
            `${x.surface_form}[${x.pos}/${
              x.reading ? toHiragana(x.reading) : "-"
            }]`,
        )
        .join("  "),
  );
}
await import("node:fs").then((fs) =>
  fs.writeFileSync(new URL("./verify-out.txt", import.meta.url), out.join("\n"), "utf8"),
);
console.log("done");
