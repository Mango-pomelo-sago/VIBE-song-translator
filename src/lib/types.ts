/** 跨前后端共享的类型契约 */

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

/** 汉字-假名对齐后的一个可渲染片段 */
export type RubySegment = {
  text: string;
  /** 汉字段的罗马音；假名/标点为 null（不标注） */
  reading: string | null;
  /** 汉字段的平假名读音（注音「假名」档用）；假名/标点为 null */
  kana?: string | null;
  kind: "kanji" | "kana" | "other";
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
};

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
  /** 整行罗马音（M3：token 空格分隔；M4：文节分段） */
  romaji?: string | null;
  /** M4：文节列表 */
  bunsetsu?: Bunsetsu[];
};

/** 主管线返回的完整歌词数据 */
export type SongData = {
  song: NeteaseSong;
  lines: ProcessedLine[];
  warnings?: string[];
  /** M9：难度评分（内容词平均 JLPT 等级） */
  difficulty?: import("./difficulty").DifficultyScore | null;
};

/** Jisho 词典释义（hover 用） */
export type DictSense = {
  english: string[];
  partsOfSpeech: string[];
};

export type DictEntry = {
  /** 主拼写（表面形或 Jisho slug） */
  word: string;
  /** 假名读音 */
  reading?: string | null;
  /** Jisho 的 JLPT tags，如 ["N1"]；可能为空 */
  jlpt?: string[];
  isCommon?: boolean;
  senses: DictSense[];
  /** jisho.org 查询链接 */
  url: string;
  source: "jisho";
};
