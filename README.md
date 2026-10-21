# VIBE RECORDS · 听日语歌学日语 · 听法语歌学法语

打开这家小店，不用上课，也不用背单词表——你只需要挑一张喜欢的唱片。

输入歌名，歌词就来了，先跟着旋律听个感觉。正看着，标注已经悄悄就位：日语歌有罗马音与文节，法语歌把阴阳性、时态和意群直接标在词上；句子被拆成刚好能咽下去的一口。遇到眼生的词，鼠标挪过去，释义、等级、阴阳性、时态就浮出来——看上了就收进生词本，攒成自己的词库。抓词、分词、翻译这些活儿都在后台悄悄干，前端只管把歌词标得清爽好看。

学了多少，这家店心里有数。每首歌都有一枚难度标（JLPT 或 CEFR），推荐的音轨跟着你的水平走，一首一首往上爬。

希望你在这里，先听见一门语言，然后学会它。

---

## 两种语言，一条管线

搜索框左侧切换 **日本語 / Français**，两边共用同一套本地优先的标注引擎：

| | 日语 | 法语 |
|---|---|---|
| 分词 | kuromoji | `Intl.Segmenter` + 省音/连字符后处理 |
| 发音 | 罗马音 / 假名 ruby | 不在歌词上标注（学习重点在语法） |
| 语法 | 词性 | 行内语法标签 + 词卡阴阳性、单复数、动词时态/人称/变位 |
| 省音 | — | `l'` / `j'` 虚线下划线，词卡显示完整形式 |
| 分组行 | 文节 | 意群（np / vp / pp / 固定搭配） |
| 难度 | JLPT N5–N1 | CEFR A1–C1 + B1+ 词汇占比（复合评分） |
| 词典 | Jisho | 本地 Lexique + en.wiktionary |

法语的语法信息、变位、词频全部离线可得，**不配置 AI Key 也能完整学习**；AI 只负责异步补充中文释义与学习札记，失败不影响首屏。

法语歌词卡顶部有一行「本曲语法」速览：动词、阴阳性名词、形容词与 B1+ 词汇的数量，以及本曲用到的动词时态。点任一标签即可在整首歌词里高亮同类词（其余淡出），再点一次取消——适合集中观察一种语法现象。行内标签用颜色区分：阳（蓝）/ 阴（粉）/ 动词时态人称（琥珀）/ 形容词性数配合（青绿）。

## AI 配置

页面里点「AI 设置」即可填写自己的 API Key、Base URL 和模型（任意 OpenAI 兼容接口均可，如 DeepSeek、OpenAI、硅基流动、本地 Ollama）。

- 配置只保存在**本机浏览器 localStorage**（键名 `vibe-ai:v1`），每次请求通过请求头发给本站 API 路由；服务端不保存、不写日志。
- 优先级：**浏览器配置 > 服务端环境变量**。服务端没配环境变量、浏览器也没填时，相关功能优雅降级为 503 提示，并引导到「AI 设置」。
- 法语模式下，AI 还会在歌词渲染后异步补齐每个 lemma 的中文释义（`/api/annotate`）：每首最多 200 个 lemma、单次 ≤60、最多 3 次调用，30 天服务端缓存；本地已有的语法标签 / CEFR / 阴阳性 / 变位永远不被覆盖。
- 如果部署成公开服务，用户各自填自己的 Key；用户提供的 Base URL 会由服务端发起请求（支持本地模型），公开部署时请自行评估是否需要限制内网地址。

## 环境变量（可选兜底）

也可以复制 `.env.example` 为 `.env.local` 并在服务端统一配置：

| 变量 | 说明 |
|---|---|
| `DEEPSEEK_API_KEY` | 可选。服务端兜底 Key（翻译缺失行 + AI 笔记 + 法语释义标注） |
| `DEEPSEEK_MODEL` | 可选，默认 `deepseek-chat` |
| `DEEPSEEK_BASE_URL` | 可选，默认 `https://api.deepseek.com/v1` |

## 开发

```bash
npm install
npm run dev                    # http://localhost:3000
npm test                       # Vitest（分词 / 联诵 / 意群 / CEFR / 缓存隔离等）
node scripts/verify-fr.mjs     # 对 dev server 冒烟验证 5 首法语歌
npm run build                  # 生产构建（Turbopack）
```

> **注意**：本机环境若全局设了 `NODE_ENV`，构建前请先取消（`Remove-Item Env:NODE_ENV`），否则 `next build` 会以非标准 `NODE_ENV` 运行并触发内部 bug（`<Html> should not be imported outside of pages/_document`）。Next.js 会自动设置正确的 `NODE_ENV`。
>
> Turbopack 构建会从 `fonts.gstatic.com` 拉取 Noto 字体子集；网络不通时构建会失败（与本项目代码无关），此时可用 `npm run dev` 验证。
>
> **代理**：Node 24 的 `fetch` 默认不读 `HTTP_PROXY` / `HTTPS_PROXY`。法语释义来自 `en.wiktionary.org`，直连不通时会只剩本地结构信息（显示「本地词表已收录，暂无释义」）。`npm run dev` / `npm start` 已通过 `scripts/with-proxy.mjs` 在检测到代理环境变量时自动补 `NODE_USE_ENV_PROXY=1`；其他方式启动时请自行设置该变量。

## 数据与脚本

- `scripts/build-jlpt.mjs` — 合并 curated + [tanos.co.uk 全表](https://github.com/Bluskyo/JLPT_Vocabulary)（CC BY）→ 生成 `src/data/jlpt.ts`（8680 词，word→level）
- `scripts/build-songs.mjs` — 抓 14 首热门 J-pop 的难度评分 → 生成 `src/data/songs.ts`（需 dev server 运行）
- `scripts/build-fr-lexicon.mjs` — 下载 [Lexique383](https://www.lexique.org/databases/Lexique383/Lexique383.tsv)，裁剪、转 IPA、按词频估算 CEFR → 生成 `src/data/fr/lexicon.json`（约 5.2MB，仅服务端加载）
- `scripts/build-songs-fr.mjs` — 通过 dev server 预计算 24 首法语种子歌单难度 → 生成 `src/data/songs-fr.ts`
- `scripts/verify-fr.mjs` — 请求 `/api/song?lang=fr`，断言 tokens、IPA、CEFR、意群与难度

法语词表来源与许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)（Lexique383 为 CC BY-SA 4.0，派生 `lexicon.json` 同许可）。

## 部署

Vercel 部署（Node.js runtime / Fluid Compute）。kuromoji 词典与法语词表通过 `next.config.ts` 的 `outputFileTracingIncludes` 打进对应函数（注意：**不要**用通配符路径键，会破坏 Turbopack 的路由 manifest 聚合；只写精确键，如 `/api/song`、`/api/dictionary`）。

## 版权

歌词仅供个人学习交流，版权归原作者及版权方所有；原曲请前往网易云音乐收听。`robots.txt` 与 `<meta name="robots">` 已屏蔽搜索引擎收录。第三方词表许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
