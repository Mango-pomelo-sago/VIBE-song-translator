/** 跨前后端共享的类型契约 */

/** 学习语言。新增语言时在此扩展，并在 lib/lang 中注册 profile。 */
export type LangCode = "ja" | "fr";

/** 网易云搜索返回的歌曲信息 */
export type NeteaseArtist = {
  id: number;
  name: string;
};

export type NeteaseAlbum = {
  id: number;
  name: string;
  picUrl?: string | null;
};

export type NeteaseSong = {
  id: number;
  name: string;
  artists: NeteaseArtist[];
  album: NeteaseAlbum | null;
  durationMs?: number | null;
};

/** LRC 解析后的一行歌词 */
export type LyricLine = {
  timeMs: number;
  text: string;
  zh?: string | null;
};

/** 词上方的标注种类：ja 的汉字、假名、标点；fr 的 IPA、普通词 */
export type RubyKind = "kanji" | "kana" | "other" | "ipa" | "word";

/** 汉字-假名对齐后的一个可渲染片段（fr：一个 token 的 IPA 标注） */
export type RubySegment = {
  text: string;
  /** 上方标注：ja 为罗马音/假名，fr 为 IPA；无标注为 null */
  reading: string | null;
  /** 汉字段的平假名读音（注音「假名」档用）；假名/标点为 null */
  kana?: string | null;
  kind: RubyKind;
};

/** CEFR 等级（法语词汇分级） */
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1";

/** 法语名词阴阳性 */
export type Gender = "m" | "f";

/** 法语动词变位信息 */
export type VerbInfo = {
  /** 原形（不定式） */
  infinitive: string;
  /** indicatif / subjonctif / conditionnel / impératif / infinitif / participe… */
  mood: string;
  /** présent / imparfait / futur / passé composé… */
  tense: string;
  person: 1 | 2 | 3 | null;
  number: "sg" | "pl" | null;
};

/** 联诵信息，挂在左词上，描述它与下一个词之间 */
export type LiaisonInfo = {
  type: "obligatory" | "optional" | "forbidden";
  /** 实际联诵出的辅音，如 z / t / n / ʁ；禁止联诵时为 null */
  phoneme: string | null;
};

/** 省音信息，如 l' 对应 le */
export type ElisionInfo = {
  fullForm: string;
};

/** kuromoji 分词后的一个词 token */
export type MorphToken = {
  surface: string;
  /** 假名读音（平假名），缺失为 null */
  reading: string | null;
  basicForm: string;
  /** part_of_speech_level1：名詞/動詞/助詞… */
  pos: string;
  posDetail: string;
  /** 对齐结果 */
  ruby: RubySegment[];
  /** 整 token 罗马音（含助词例外），缺失为 null */
  romaji: string | null;
  warnings?: string[];

  // ---- 语言无关的可选标注（日语不设置；法语使用）----
  /** 是否内容词。组件用 `content ?? isContentWord(pos)`，避免按语言分支 */
  content?: boolean;
  /** 国际音标（fr） */
  ipa?: string | null;
  /** 等级：JLPT N5..N1 或 CEFR A1..C1 */
  level?: string | null;
  /** 每百万词频 */
  frequency?: number | null;
  /** 名词阴阳性 */
  gender?: Gender | null;
  /** 单复数 */
  number?: "sg" | "pl" | null;
  /** 动词变位信息 */
  verb?: VerbInfo | null;
  /** 与下一个词之间的联诵 */
  liaison?: LiaisonInfo | null;
  /** 本 token 是省音形式 */
  elision?: ElisionInfo | null;
  /** AI 补充的简短中文释义 */
  gloss?: string | null;
  /** AI 补充的一句用法提示 */
  glossNote?: string | null;
  /** 法语排版：本 token 前是否应输出空格 */
  spaceBefore?: boolean;
};

/** 文节（bunsetsu）：一个或几个 token 组成的语义单位 */
export type Bunsetsu = {
  tokens: MorphToken[];
  /** 文节表面形 */
  text: string;
  /** 文节罗马音 */
  romaji: string;
  /** 内容词索引（加粗用），无内容词（纯助词文节）为 -1 */
  headIndex: number;
  /**
   * 罗马音分段（内容词加粗、助词弱化）；
   * 跨 token 促音已合并进同一段（分かっ+た → "wakatta" 一段）。
   */
  romajiParts?: { text: string; head: boolean }[];

  // ---- 通用意群字段（fr 使用；ja 的 bunsetsu 不设置）----
  /** 意群类型：名词短语 / 动词短语 / 介词短语 / 固定搭配 */
  kind?: "np" | "vp" | "pp" | "collocation" | "phrase" | "bunsetsu";
  /** AI 补充的意群中文释义 */
  gloss?: string | null;
};

/** 意群：与文节共用结构，ProcessedLine.bunsetsu 槽位承载 */
export type Chunk = Bunsetsu;

/** 前端渲染的一行歌词（M3+ 含分词/对齐/罗马音，M4+ 含文节） */
export type ProcessedLine = {
  index: number;
  timeMs: number | null;
  text: string;
  zh: string | null;
  zhSource: "netease" | "ai" | null;
  tokens?: MorphToken[];
  /** 行级合并的 ruby 段 */
  ruby?: RubySegment[];
  /** 整行读音（ja：罗马音；fr：IPA） */
  romaji?: string | null;
  /** 语义分组行：ja 为文节，fr 为意群 */
  bunsetsu?: Bunsetsu[];
};

/** 主管线返回的完整歌词数据 */
export type SongData = {
  song: NeteaseSong;
  /** 学习语言；缺省视为 ja 以兼容旧数据 */
  lang: LangCode;
  lines: ProcessedLine[];
  warnings?: string[];
  /** M9：难度评分（内容词平均 JLPT 等级） */
  difficulty?: import("./difficulty").DifficultyScore | null;
};

/** 词典释义（hover 用）：ja 走 Jisho 的 english，fr 用 definitions */
export type DictSense = {
  english: string[];
  /** 法语词条释义（en.wiktionary 的英文释义） */
  definitions?: string[];
  lang?: "en" | "zh" | "fr";
  partsOfSpeech: string[];
};

export type DictSource = "jisho" | "lexique" | "wiktionary" | "ai";

export type DictEntry = {
  /** 主拼写（表面形或 Jisho slug） */
  word: string;
  /** ja：假名读音；fr：IPA */
  reading?: string | null;
  /** Jisho 的 JLPT tags，如 ["N1"]；可能为空 */
  jlpt?: string[];
  /** CEFR 等级（fr） */
  cefr?: string[];
  /** 统一的等级字段：JLPT 或 CEFR */
  level?: string | null;
  isCommon?: boolean;
  /** fr：名词阴阳性 */
  gender?: Gender | null;
  /** fr：原形 */
  lemma?: string | null;
  /** fr：每百万词频 */
  frequency?: number | null;
  /** fr：动词变位 */
  verb?: VerbInfo | null;
  senses: DictSense[];
  /** 词典查询链接 */
  url: string;
  source: DictSource;
  /** 学习语言；缺省视为 ja */
  lang?: LangCode;
};
