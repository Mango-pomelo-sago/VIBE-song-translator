# VIBE RECORDS｜听日文歌学日语

输入日文歌名 → 自动抓取网易云歌词 → 汉字上方标注罗马音（ruby 式）、每行下方按「文节」断句的罗马音 → hover 单词弹出 Jisho 词典释义与 JLPT 等级 → 右侧中文翻译对照。

**City Pop 复古唱片店**视觉风格：日落渐变、黑胶元素、粗描边 + 硬阴影卡片。

## 功能

- 🔍 网易云搜索选曲，自动抓取 `lrc`（日文）与 `tlyric`（中文翻译）
- 💿 汉字-假名锚点对齐 → 罗马音 ruby 注音（kuromoji 分词 + wanakana）
- ✂️ 文节（bunsetsu）断句：每行下方按语义单位分段罗马音，内容词加粗
- 📚 hover 任意单词 → Jisho 词典释义 + JLPT 等级徽章 + 一键收藏生词
- 🎯 JLPT 词汇着色（N5 绿 → N1 红），本地 8680 词词表即时标注
- 🧠 歌曲难度评分（内容词平均 JLPT 等级 → 0-100 分 + 入门/进阶/挑战），内置 14 首种子曲目按难度推荐
- 🌏 中文翻译：优先网易云 `tlyric`，缺失行由 **DeepSeek** 批量兜底（带 AI 标记）
- 📝 文化/语法 AI 笔记：每首歌自动生成背景、文化科普、语法点讲解
- 🗂️ 生词本收藏（localStorage 跨歌曲汇总）、显示偏好切换（罗马音/假名/隐藏 + 自测）

## 环境变量

复制 `.env.example` 为 `.env.local` 并填写：

| 变量 | 说明 |
|---|---|
| `DEEPSEEK_API_KEY` | **必填**。DeepSeek API key（翻译兜底 + AI 笔记用；未配置时相关功能优雅降级为 503 提示） |
| `DEEPSEEK_MODEL` | 可选，默认 `deepseek-chat`（模型名升级只改这里） |
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
