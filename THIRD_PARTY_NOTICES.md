# 第三方数据与许可

本项目在运行或构建时使用以下第三方数据/词表。原始许可归各项目所有；本文件仅作署名与来源说明，不改变原许可。

## Lexique383（法语词表）

- **来源**：[Lexique.org — Lexique383](https://www.lexique.org/databases/Lexique383/Lexique383.tsv)
- **作者**：Boris New、Christophe Pallier、Marc Brysbaert、Denis Ferrand（Lexique 3.83）
- **许可**：[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- **本项目用途**：`scripts/build-fr-lexicon.mjs` 下载 Lexique383.tsv，提取词形、lemma、词性、阴阳性、单复数、词频与动词屈折信息，并将 Lexique 自有音标编码转写为 IPA。
- **派生数据**：`src/data/fr/lexicon.json` 是 Lexique383 的裁剪与转换版本，**同样以 CC BY-SA 4.0 许可发布**。若再分发该文件，请保留本署名、注明修改内容（裁剪列、转写 IPA、按词频估算 CEFR），并以相同许可共享。
- **修改说明**：
  - 仅保留本项目需要的列，并按词频裁剪；
  - `phon` 字段（Lexique 自有编码）经固定映射表转写为国际音标（IPA）；
  - 依据 lemma 词频排名估算 CEFR 等级（A1–C1），该等级为**启发式估算**，非官方分级；
  - 输出为紧凑 JSON 元组，字段结构见 `src/lib/fr/lexicon.ts`。

原始 `Lexique383.tsv` 不进入版本库（见 `.gitignore` 的 `data/`）。

## JLPT 词汇表

- **来源**：[tanos.co.uk JLPT 词汇表](https://github.com/Bluskyo/JLPT_Vocabulary) 及项目内 curated 修正
- **许可**：CC BY（详见上游仓库）
- **派生数据**：`src/data/jlpt.ts`（word → JLPT 等级）

## kuromoji（日语分词）

- **来源**：[kuromoji.js](https://github.com/takuyaa/kuromoji.js)，词典源自 IPADIC
- **许可**：Apache License 2.0
- **本项目用途**：经 npm 安装，运行时在服务端加载词典；词典文件通过 `next.config.ts` 的 `outputFileTracingIncludes` 打包进 `/api/song`。

## Jisho（日语词典）

- **来源**：[jisho.org](https://jisho.org)
- **本项目用途**：`/api/dictionary` 查询日语词条释义与 `jlpt` / `is_common` 标签。仅作在线查询，不批量抓取或再分发其数据。

## Wiktionary（法语词典）

- **来源**：[en.wiktionary.org](https://en.wiktionary.org)
- **许可**：文本以 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 提供（详见各页面）
- **本项目用途**：`/api/dictionary?lang=fr` 通过 REST API 查询英文释义并展示，附原文链接；不做持久化再分发。

## 网易云音乐

- **来源**：[music.163.com](https://music.163.com)
- **本项目用途**：搜索歌曲、获取 LRC 歌词与中文翻译。歌词版权归原作者与版权方所有，本项目仅供个人学习交流，并已通过 `robots` 屏蔽搜索引擎索引。
