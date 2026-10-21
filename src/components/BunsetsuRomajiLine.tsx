import type { Bunsetsu, LangCode } from "@/lib/types";

type ChunkKind = NonNullable<Bunsetsu["kind"]>;

/** 意群类型的颜色与中文名（悬停可看） */
const CHUNK_META: Record<ChunkKind, { label: string; decoration: string }> = {
  np: { label: "名词短语", decoration: "decoration-bauhaus-blue/40" },
  vp: { label: "动词短语", decoration: "decoration-bauhaus-yellow-dim/50" },
  pp: { label: "介词短语", decoration: "decoration-teal-600/40" },
  collocation: { label: "固定搭配", decoration: "decoration-bauhaus-red/50" },
  phrase: { label: "意群", decoration: "decoration-industrial/25" },
  bunsetsu: { label: "文节", decoration: "decoration-industrial/20" },
};

/**
 * 语义分组行：
 * - 日语：文节罗马音，组内内容词加粗、助词弱化；
 * - 法语：不标发音，按意群显示词块；意群用点状下划线区分类别，
 *   固定搭配更醒目。只有一个意群且不是固定搭配时省略，避免重复整行歌词。
 */
export default function BunsetsuRomajiLine({
  bunsetsu,
  lang = "ja",
}: {
  bunsetsu: Bunsetsu[];
  lang?: LangCode;
}) {
  if (lang === "fr") {
    if (bunsetsu.length < 2 && bunsetsu[0]?.kind !== "collocation") return null;

    return (
      <p className="lyric-wrap font-lyric-fr mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[11px] leading-relaxed text-ink/50">
        {bunsetsu.map((b, i) => {
          const meta = b.kind ? CHUNK_META[b.kind] : null;
          return (
            <span key={i} className="inline-flex items-baseline gap-1">
              {i > 0 ? <span className="text-ink/20">/</span> : null}
              <span
                className={`underline decoration-dotted underline-offset-2 ${
                  meta?.decoration ?? "decoration-industrial/20"
                } ${b.kind === "collocation" ? "font-semibold text-ink/65" : ""}`}
                title={meta ? `${meta.label}：${b.text}` : b.text}
              >
                {b.text}
              </span>
            </span>
          );
        })}
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
