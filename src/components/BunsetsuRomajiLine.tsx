import type { Bunsetsu } from "@/lib/types";

/**
 * 文节断句的罗马音行：
 * 每个文节一组，组内内容词加粗、助词弱化；跨 token 促音已在 lib/bunsetsu 合并为一段。
 */
export default function BunsetsuRomajiLine({ bunsetsu }: { bunsetsu: Bunsetsu[] }) {
  return (
    <p className="font-romaji mt-0.5 text-xs leading-relaxed text-ink/55">
      {bunsetsu.map((b, i) => (
        <span key={i} className="mr-2 whitespace-nowrap">
          {b.romajiParts && b.romajiParts.length ? (
            b.romajiParts.map((p, j) => (
              <span
                key={j}
                className={p.head ? "font-semibold text-ink/80" : "text-ink/40"}
              >
                {p.text}
                {j < b.romajiParts!.length - 1 ? " " : null}
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
