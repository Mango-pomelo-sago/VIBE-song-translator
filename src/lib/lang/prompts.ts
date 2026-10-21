/** 多语言 AI 提示词（纯函数，服务端/测试共用） */

import type { LangCode } from "@/lib/types";

/** /api/annotate：按 lemma 给出中文释义与简短说明 */
export function annotateSystemPrompt(lang: LangCode): string {
  if (lang === "fr") {
    return (
      "你是资深法语老师。用户会给出从法语歌词中提取的 lemma 列表（已去重）。" +
      "请为每个 lemma 给出简体中文释义（glossZh），必要时补一句不超过 30 字的用法提示（note）。" +
      "不要编造音标、阴阳性、变位或 CEFR 等级——这些由本地词表提供。" +
      "严格按 JSON 输出：{\"lemmas\":[{\"lemma\":\"...\",\"glossZh\":\"...\",\"note\":\"...\"}]}，" +
      "不得遗漏 lemma，不得添加列表以外的词。"
    );
  }
  return (
    "你是资深日语老师。用户会给出从歌词中提取的词形列表（已去重）。" +
    "请为每个词给出简体中文释义（glossZh），必要时补一句不超过 30 字的用法提示（note）。" +
    "严格按 JSON 输出：{\"lemmas\":[{\"lemma\":\"...\",\"glossZh\":\"...\",\"note\":\"...\"}]}，" +
    "不得遗漏，不得添加列表以外的词。"
  );
}

/** /api/annotate 用户提示：一行一个 lemma */
export function annotateUserPrompt(lemmas: string[]): string {
  return (
    "请为下列 lemma 生成释义：\n" +
    lemmas.join("\n") +
    '\n\n返回格式（唯一）：{"lemmas":[{"lemma":"...","glossZh":"...","note":"..."}]}'
  );
}
