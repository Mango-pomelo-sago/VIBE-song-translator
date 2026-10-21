/** 法语语法标签的共享文案（客户端安全） */

export const FR_POS_ZH: Record<string, string> = {
  NOUN: "名词",
  VERB: "动词",
  AUX: "助动词",
  ADJ: "形容词",
  ADV: "副词",
  PRON: "代词",
  DET: "限定词",
  PREP: "介词",
  CONJ: "连词",
  INTJ: "感叹词",
  NUM: "数词",
  UNK: "未知",
};

/** 名词/形容词的性数描述，如 « 阴性单数 » */
export function genderNumberZh(gender?: "m" | "f" | null, number?: "sg" | "pl" | null): string {
  const g = gender === "m" ? "阳性" : gender === "f" ? "阴性" : "";
  const n = number === "pl" ? "复数" : number === "sg" ? "单数" : "";
  return `${g}${n}`;
}

/** 冠词提示：把阴阳性直接落到 le/la、un/une 上 */
export function articleHintZh(
  gender?: "m" | "f" | null,
  number?: "sg" | "pl" | null,
): string {
  if (number === "pl") return "les/des";
  if (gender === "m") return "le/un";
  if (gender === "f") return "la/une";
  return "le/la · un/une";
}
