/** 多语言引擎的类型契约（纯类型，客户端可安全引用） */

import type {
  Bunsetsu,
  DictEntry,
  LangCode,
  MorphToken,
  ProcessedLine,
  RubySegment,
} from "@/lib/types";
import type { DifficultyScore } from "@/lib/difficulty";

/** 一行歌词经某语言管线标注后的结果 */
export type AnnotatedLine = {
  tokens: MorphToken[];
  /** 行级合并的标注段（ja：汉字 ruby；fr：每词 IPA） */
  ruby: RubySegment[];
  /** 整行读音：ja 罗马音；fr IPA */
  readingLine: string | null;
  /** 语义分组：ja 文节；fr 意群 */
  chunks: Bunsetsu[];
  warnings: string[];
};

/**
 * 一种学习语言的完整管线。
 * 实现必须是纯本地的：annotateLine 不得调用 AI 或外部网络。
 */
export interface LanguageProfile {
  readonly code: LangCode;
  /** BCP-47，供 Intl / 未来的 TTS 使用 */
  readonly locale: string;
  /** 本地引擎可用性预检（仅日语需要加载 kuromoji） */
  preflight?(): Promise<void>;
  annotateLine(text: string): Promise<AnnotatedLine>;
  scoreDifficulty(lines: ProcessedLine[]): DifficultyScore | null;
  readonly dictionary: {
    lookup(word: string, lemma?: string | null): Promise<DictEntry | null>;
  };
}
