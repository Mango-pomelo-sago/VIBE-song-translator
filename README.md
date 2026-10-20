# VIBE RECORDS · 听日语歌学日语

打开这家小店，不用上课，也不用背单词表——你只需要挑一张喜欢的唱片。

输入歌名，歌词就来了，先跟着旋律听个感觉。正看着，每行汉字上头悄悄标好了罗马音，连读也不用查；句子再往下被按文节断好，像是有人帮你把歌词拆成了刚好能咽下去的一口。遇到眼生的词，鼠标挪过去，释义和 JLPT 等级就浮出来——看上了就收进生词本，攒成自己的词库。抓词、分词、翻译这些活儿都在后台悄悄干，前端只管把歌词标得清爽好看。

学了多少，这家店心里有数。每首歌都有一枚难度标：入门、进阶、挑战，推荐的音轨跟着你的水平走，一首一首往上爬。

希望你在这里，先听见日语，然后学会日语。

---

## AI 配置

页面里点「AI 设置」即可填写自己的 API Key、Base URL 和模型（任意 OpenAI 兼容接口均可，如 DeepSeek、OpenAI、硅基流动、本地 Ollama）。

- 配置只保存在**本机浏览器 localStorage**（键名 `vibe-ai:v1`），每次请求通过请求头发给本站 API 路由；服务端不保存、不写日志。
- 优先级：**浏览器配置 > 服务端环境变量**。服务端没配环境变量、浏览器也没填时，相关功能优雅降级为 503 提示，并引导到「AI 设置」。
- 如果部署成公开服务，用户各自填自己的 Key；用户提供的 Base URL 会由服务端发起请求（支持本地模型），公开部署时请自行评估是否需要限制内网地址。

## 环境变量（可选兜底）

也可以复制 `.env.example` 为 `.env.local` 并在服务端统一配置：

| 变量 | 说明 |
|---|---|
| `DEEPSEEK_API_KEY` | 可选。服务端兜底 Key（翻译缺失行 + AI 笔记用） |
| `DEEPSEEK_MODEL` | 可选，默认 `deepseek-chat` |
| `DEEPSEEK_BASE_URL` | 可选，默认 `https://api.deepseek.com/v1` |

## 开发

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # Vitest 单元测试（对齐 / 文节 / 罗马音 / JLPT / 难度 / 翻译解析）
npm run build      # 生产构建（Turbopack）
```

> **注意**：本机环境若全局设了 `NODE_ENV`，构建前请先取消（`Remove-Item Env:NODE_ENV`），否则 `next build` 会以非标准 `NODE_ENV` 运行并触发内部 bug（`<Html> should not be imported outside of pages/_document`）。Next.js 会自动设置正确的 `NODE_ENV`。

## 数据与脚本

- `scripts/build-jlpt.mjs` — 合并 curated + [tanos.co.uk 全表](https://github.com/Bluskyo/JLPT_Vocabulary)（CC BY）→ 生成 `src/data/jlpt.ts`（8680 词，word→level）
- `scripts/build-songs.mjs` — 抓 14 首热门 J-pop 的难度评分 → 生成 `src/data/songs.ts`（需 dev server 运行）

## 部署

Vercel 部署（Node.js runtime / Fluid Compute）。kuromoji 词典通过 `next.config.ts` 的 `outputFileTracingIncludes` 打进 `/api/song` 函数（注意：**不要**用通配符路径键，会破坏 Turbopack 的路由 manifest 聚合）。

## 版权

歌词仅供个人学习交流，版权归原作者及版权方所有；原曲请前往网易云音乐收听。`robots.txt` 与 `<meta name="robots">` 已屏蔽搜索引擎收录。