/** 词性分类：内容词 / 助词 判定（文节断句、难度评分共用） */

/** 内容词：名詞・動詞・形容詞・形容動詞・副詞・連体詞・感動詞・接続詞 */
const CONTENT_POS = new Set([
  "名詞",
  "動詞",
  "形容詞",
  "形容動詞",
  "副詞",
  "連体詞",
  "感動詞",
  "接続詞",
]);

/** 附属词：助詞・助動詞（追加到当前文节） */
export const ATTACHED_POS = new Set(["助詞", "助動詞"]);

/** 接头辞/接尾辞（缓冲或追加） */
export const PREFIX_POS = "接頭詞";
export const SUFFIX_POS = "接尾詞";

export function isContentWord(pos: string): boolean {
  return CONTENT_POS.has(pos);
}

export function isAttachedWord(pos: string): boolean {
  return ATTACHED_POS.has(pos);
}
