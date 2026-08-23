# 📋 项目交接总结：VIBE RECORDS（日语歌曲学习网站）

> **项目目录**：`d:\Vibe-song translate`（Next.js 15 App Router，git 仓库，分支 master）
> **状态**：M1–M10 全部完成 + 一轮 4 项修复已完成 + **二轮 2 项 Codrops 视觉效果完成**，`npm run build` 通过。
> **上轮工作**：完整 UI 重构（玻璃拟态 + 工业风 + 构成主义 + 包豪斯 + 日式夏日）、双栏布局、我的歌单。
> **本轮工作**：SDF 镜头模糊效果 + Gooey 粘性搜索效果 + 构建环境坑点修复

## 一、产品定位

「听日语歌学日语」：输入日文歌名 →
1. 自动抓取歌词（网易云）
2. 汉字上方标注**罗马音**（ruby/furigana 式）
3. 每行下方单独罗马音，按**文节（bunsetsu）**断句分段
4. **hover 单词** → 弹词典释义（Jisho）+ JLPT 等级 + 收藏生词
5. 右侧一列**中文翻译**逐行对应

## 二、本轮（第二轮）完成内容

### 效果一：SDF 镜头模糊（页面大标题）

| 文件 | 说明 |
|------|------|
| [src/components/SdfLensBlur.tsx](src/components/SdfLensBlur.tsx) | Three.js + WebGL 全屏画布，`sdRoundRect` + `sdCircle` 着色器，鼠标跟随镜头阻尼（lerp 0.08），镜头内边缘锐利/外柔和 |
| [src/components/HomeTitle.tsx](src/components/HomeTitle.tsx) | 隔离客户端组件，封装 `useRef` + `next/dynamic({ ssr: false })`，让 page.tsx 保持 Server Component |
| [src/app/page.tsx](src/app/page.tsx) | 导入 HomeTitle 替代直接 `<h1>`，保持 Server Component |

**技术要点**：
- `"use client"` + `next/dynamic({ ssr: false })` + `useRef` 必须隔离到独立组件，不能用在 Server Component 中
- 正交相机 `OrthographicCamera(-1,1,1,-1,0.1,10)`，全屏 `PlaneGeometry(2,2)`
- 8 个 uniform：`uResolution/uTitleCenter/uTitleSize/uMouse/uLensRadius(0.1)/uSharpEdge(0.005)/uSoftEdge(0.08)/uTime`
- `ResizeObserver` 追踪标题 DOM 边界框，窗口 resize 时更新
- 无 WebGL 时静默降级（canvas `getContext` 检测）

### 效果二：Gooey 粘性搜索

| 文件 | 说明 |
|------|------|
| [src/components/GooeyFilter.tsx](src/components/GooeyFilter.tsx) | SVG 滤镜定义，`feGaussianBlur(stdDeviation=6)` + `feColorMatrix(alpha 20 -15)` + `feComposite(atop)` |
| [src/components/GooeySearchBar.tsx](src/components/GooeySearchBar.tsx) | 替换 SearchBar，Framer Motion `motion.input/motion.button` + spring(`stiffness:350,damping:26`) + `AnimatePresence` 建议标签 |
| [src/components/SearchFlow.tsx](src/components/SearchFlow.tsx) | 导入 GooeySearchBar 替代 SearchBar（props 不变） |

**技术要点**：
- `feColorMatrix` 矩阵值 `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -15` 实现粘性融合
- 聚焦时容器加 `filter: url(#gooey)`，失焦移除
- 建议标签用 `motion.button` + `layout` + 交错 `delay` 动画
- Safari 12+ 完全兼容三个滤镜元素

### 新增依赖
- `three: ^0.185.1`（自带类型，但需额外安装 `@types/three`）
- `framer-motion: ^13.1.0`
- `@types/three`（devDependencies）

## 三、架构与数据流

**核心原则**：kuromoji 分词、网络抓取、AI 调用全在**服务端 API 路由**；前端只渲染，bundle 不含 4MB 词典。

```
输入歌名 → GET /api/search?s=歌名        （候选歌曲列表）
选曲     → POST /api/song { song }        （主管线）
            netease抓词(lrc+tlyric) → LRC解析 → kuromoji分词
            → 汉字-假名对齐 → 罗马音 → 文节断句
            → JLPT等级标注(本地词表) → 难度评分 → 合并tlyric
            → 返回 SongData（完整标注 JSON）
hover    → GET /api/dictionary?word=词    （Jisho + 缓存 + 限流）
翻译缺失 → POST /api/translate            （DeepSeek 批量，缓存）
文化/语法 → POST /api/notes { songId }    （DeepSeek 一次调用，结构化，缓存）
本地     → 生词本收藏 / 显示偏好切换（localStorage + React Context）
```

**关键决策**：词典/AI 都放独立路由，不塞进 `/api/song`，避免冷启动与函数超时；页面先渲染，词典/翻译/笔记渐进加载。

## 四、核心算法

1. **汉字-假名对齐（锚点法）**——kuromoji 给整 token 读音，按表面形里的假名锚点拆分出汉字读音；纯假名无 ruby、reading 缺失降级为 null（绝不乱标）。
2. **文节断句**——内容词开新文节，助词/助动词/记号/接尾追加；助词例外「は」→wa、「へ」→e。
3. **JLPT 标注**——本地词表 `data/jlpt.ts`（构建脚本生成，打包进前端）+ Jisho `jlpt`/`is_common` 交叉校验。
4. **难度评分**——内容词等级加权（N5=1…N1=5、非常用=6）→ 0-100 分。档位：`<38` 入门 / `<55` 进阶 / `>=55` 挑战。UI 显示 `x/10`。
5. **AI 笔记**——每首歌一次 DeepSeek 调用，Zod 校验返回 `LearningNotes{background, cultural[], grammar[]}`，缓存 key `notes:{songId}`。

## 五、技术栈

Next.js 15（App Router）+ TypeScript + Tailwind CSS v4 · `kuromoji` + `wanakana` · `ai` + `@ai-sdk/openai-compatible` + `zod` · `vitest` · `three` · `framer-motion` · 缓存（localStorage + 服务端内存 LRU）

**DeepSeek 接入**：统一封装在 `lib/ai.ts` —— `createOpenAICompatible({ baseURL: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com/v1', apiKey: process.env.DEEPSEEK_API_KEY })`，模型 `process.env.DEEPSEEK_MODEL ?? 'deepseek-chat'`。模型名/baseURL 走环境变量，改动只在一处。

## 六、文件结构（src/）

```
app/{layout,page,globals.css,error,global-error,not-found} + api/{search,song,dictionary,translate,notes}/route.ts
components/ SearchBar · SongCandidateCard · NowPlayingHeader · LyricView · WordTooltip
           · DisplaySettings · VocabStore/VocabDrawer · DifficultyBadge · LearningNotesPanel
           · RecommendationPanel · VinylRecord · UsageGuide · PlaylistPanel · PlaylistStore
           · Loading/ErrorState
           · HomeTitle · SdfLensBlur      ← 本轮新增
           · GooeyFilter · GooeySearchBar  ← 本轮新增
lib/ netease · lrc · japanese(kuromoji单例) · align · bunsetsu · romaji
    · ai(DeepSeek统一封装) · dictionary · translate · notes · jlpt · difficulty · vocab · cache · types
data/ jlpt.ts（生成） · songs.ts（14 首种子曲，最高难度 55=涙そうそう）
scripts/build-jlpt.mjs · public/kuromoji-dict/ · next.config.ts（outputFileTracingIncludes 词典入包）
```

## 七、本机关键坑点（会复现，务必先看）

- **全局环境变量 `NODE_ENV=production` 已设**。`next build` 前必须 `Remove-Item Env:NODE_ENV`（设为 development 会触发 `<Html> should not be imported outside of pages/_document` 内部 bug）。dev/test 需显式 `$env:NODE_ENV='development'`。
- `next.config.ts` 的 `outputFileTracingIncludes` **不要用通配符键**（如 `"/api/*"`）——会静默破坏 Turbopack 顶层 `app-paths-manifest.json`，导致 `/api/song` 在 production 下 404。只写精确键 `"/api/song"`。
- kuromoji 词典已双路径：node_modules（主）+ `public/kuromoji-dict`（兜底），`/api/song` 已 trace 24 个文件。
- 生成 `src/data/jlpt.ts` 时 `・`(U+30FB) 落在 `゠-ヿ` 区间会让裸标识符 key 无法被 TS 解析——build-jlpt.mjs 的 WORD_RE 须显式 `word.includes("・")` 排除。
- **Google 字体可能下载失败**（此前 build 报 `Can't resolve '@vercel/turbopack-next/internal/font/google/font'`）。属网络问题，重试 build 即可；若持续，需为 `next/font/google` 配置本地化或自托管。
- **npm install 间歇性删除 344 个 dev 包**：`npm install <pkg>` 后 node_modules 可能只剩几个包。修复方案：`taskkill /f /im node.exe` → `Remove-Item -Recurse -Force node_modules` → 删 `package-lock.json` → `npm install --include=dev`。

## 八、验证方式

- Vitest 单测：align / bunsetsu / romaji 助词例外 / jlpt / difficulty（86 个全绿）
- 端到端：搜「夜に駆ける」「Lemon」→ ruby、文节、着色、hover、收藏、自测、AI 笔记、翻译对齐
- `npm run build` 确认词典入包不 404；模拟网易云失败验证「粘贴 LRC」逃生门
- **视觉效果验证**：首页加载后，"VIBE RECORDS" 标题后方有 SDF 镜头模糊画布，鼠标移动时镜头阻尼跟随；聚焦搜索框，输入框与按钮出现粘性液态融合效果，建议标签交错淡入淡出

## 九、未决事项

- **用户仍未提供 `DEEPSEEK_API_KEY`**（`.env.local` 里为空白）——翻译兜底与 AI 笔记会 503 优雅降级，需填 key 后验证。
- 设计稿/制品未同步到 Figma（本会话未涉及设计推送）。
- 两个非阻塞 ESLint 警告（可修可不修）：
  - `PlaylistPanel.tsx:17:18` — `'has'` assigned but never used
  - `SdfLensBlur.tsx:221:22` — `containerRef.current` in effect cleanup 可能已变化（建议把 ref 值复制到 effect 内局部变量）

## 十、下个对话的起点

1. 无需再走计划流程，代码已就绪，直接 `npm run build` / `npm run dev` 验证。
2. **构建前必做**：`Remove-Item Env:NODE_ENV`（否则 /404 预渲染报错 `<Html> should not be imported outside of pages/_document`）。
3. 需要准备的环境变量（`.env.local`）：
   - **`DEEPSEEK_API_KEY`**（必填，DeepSeek 平台申请，翻译/文化/语法用）
   - `DEEPSEEK_MODEL`（可选，默认 `deepseek-chat`）
   - `DEEPSEEK_BASE_URL`（可选，默认 `https://api.deepseek.com/v1`）
4. 潜在后续：DeepSeek key 填入后验证翻译/笔记流；Vercel 部署（Node.js runtime/Fluid Compute，不用 edge）；修 ESLint 警告。