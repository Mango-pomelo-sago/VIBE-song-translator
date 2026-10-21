import type { Bunsetsu, LangCode } from "@/lib/types";

/**
 * 语义分组行：
 * - 日语：文节罗马音，组内内容词加粗、助词弱化；
 * - 法语：不标发音，直接显示意群文本（词块之间用 / 分隔），方便按语义记忆。
 */
export default function BunsetsuRomajiLine({
  bunsetsu,
  lang = "ja",
}: {
  bunsetsu: Bunsetsu[];
  lang?: LangCode;
}) {
  if (lang === "fr") {
    return (
      <p className="lyric-wrap font-sc mt-0.5 text-xs leading-relaxed text-ink/55">
        {bunsetsu.map((b, i) => (
          <span key={i} className="whitespace-nowrap">
            {i > 0 ? <span className="mx-1 text-ink/30">/</span> : null}
            {b.text}
          </span>
        ))}
      </p>
    );
  }

  return (
    <p className="lyric-wrap font-romaji mt-0.5 text-xs leading-relaxed text-ink/55">
      {bunsetsu.map((b, i) => (
        <span key={i} className="mr-2 inline-block max-w-full">
          {b.romajiParts && b.romajiParts.length ? (
            b.romajiParts.map((p, j) => (
              <span
                key={j}
                className={p.head ? "font-semibold text-ink/80" : "text-ink/40"}
              >
                {p.text}
                {j < b.romajiParts!.length - 1 ? " " : null}
              </span>
            ))
          ) : (
            <span className="text-ink/60">{b.romaji}</span>
          )}
        </span>
      ))}
    </p>
  );
}
