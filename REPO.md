# REPO.md — 科学家精神文化长廊数字化扫描与交互平台 V2.1

> 维护规则：每次框架、架构、组件、路由、依赖、数据结构或素材接入变化时，必须同步更新本文件。本文件是项目权威结构文档。

## 版本记录

| 版本 | 日期 | 摘要 |
|---|---|---|
| V1.3 | 2026-07 | 多页面 Demo：扫描、事件页、场景页、问答、生图、新闻 |
| V2.0 | 2026-07-21 | 聚焦式重构：墙面智扫 → `/experience/[storyId]` → 四交互 → 精神印记 |
| V2.1 | 2026-07-21 | 体验页新增轻量点云预览 → 真实 PLY 入场转换；完成后保留手动切换 |

## 项目定位

项目名称：数智赋能红色文化传播——科学家精神文化长廊数字化扫描与交互平台。

V2.1 延续 V2.0 的聚焦主链路：

```text
文化墙扫码或拍照
→ 识别 storyId
→ /experience/[storyId]
→ 三维漫游 / 时序故事 / 声景讲述 / 节点问答
→ Canvas 生成“科学家精神印记卡”
→ 延伸学习：知识问答 / 新闻速递
```

首期只维护两个故事：

- `qian-xuesen`：钱学森·科技报国
- `change5`：嫦娥五号·逐月取壤

## 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | Next.js 16.2.9 App Router |
| 语言 | TypeScript |
| 样式 | Tailwind CSS v4 |
| 3D | Three.js, @react-three/fiber, @react-three/drei |
| 点云 | 复用 V1.3 PLY 点云加载器，按需加载 |
| 状态 | 体验页使用本地 `useReducer`，旧 Zustand store 保留兼容 |
| 动效 | animate.css 子集 + CSS transition + Canvas 2D |

## 路由

| 路由 | 状态 | 说明 |
|---|---|---|
| `/` | 简化入口 | PC/直接访问入口：项目说明、墙面智扫、两个故事卡、延伸链接 |
| `/scan` | 核心入口 | 上传/拍照识别，成功后播放 Canvas 扫描转场并进入体验页 |
| `/experience/[storyId]` | 核心主页面 | 两个故事共用同一移动端优先沉浸模板 |
| `/event/[id]` | 兼容重定向 | `qian_xuesen_001` → `qian-xuesen` |
| `/scene/[id]` | 兼容重定向 | `change5` → `change5`，`atomic_bomb` → `qian-xuesen` |
| `/qa`, `/extras/qa` | 附属 | 知识问答，体验完成页作为延伸学习入口 |
| `/news`, `/extras/news` | 附属 | 新闻速递，体验完成页作为延伸学习入口 |
| `/generate` | 实验保留 | 不再作为主功能；V2.0 主收束为本地 Canvas 印记卡 |

## 核心目录

```text
app/
├── page.tsx
├── scan/page.tsx
├── experience/[storyId]/page.tsx
├── event/[id]/page.tsx
├── scene/[id]/page.tsx
├── extras/qa/page.tsx
└── extras/news/page.tsx

components/experience/
├── ExperienceShell.tsx
├── TopStoryBar.tsx
├── BottomActionDock.tsx
├── StoryBottomSheet.tsx
├── QuestionBottomSheet.tsx
├── MediaModal.tsx
├── CompletionPanel.tsx
├── scene/
│   ├── ScenePoster.tsx
│   └── ImmersiveScene.tsx
└── canvas/
    ├── ScanTransitionCanvas.tsx
    └── SpiritImprintCard.tsx

data/
└── stories.v2.json

lib/
├── stories.ts
├── imprint-card.ts
└── types.ts
```

## 数据模型

V2.0 使用统一 `StoryExperience`，替代 V1.3 中分离的 `EventItem` 和 `SceneData`：

- `id`, `legacyIds`, `title`, `shortTitle`, `subtitle`, `description`
- `theme`: `heritage-red` 或 `lunar-blue`
- `spiritKeywords`
- `hero.poster`, `hero.mobilePoster`
- `scene.modelHigh`, `scene.modelCompressed`, `scene.fallbackPoster`
- `audio.bgm`, `audio.bgmVolume`
- `chapters[5]`: 标题、摘要、正文、章节图、视频/旁白占位、相机/热点、问题卡

旧 ID 映射：

```text
qian_xuesen_001 → qian-xuesen
atomic_bomb      → qian-xuesen
change5          → change5
```

## 素材接入

V2.0 交付包保留在：

```text
红色文化长廊_V2.0_交付包/
```

已接入运行时素材：

```text
public/assets/stories/qian_xuesen/
├── hero_poster.png
├── chapter_01.png ... chapter_05.png
├── video_cover_base.png
└── imprint_card_bg.png

public/assets/stories/change5/
├── hero_poster.png
├── chapter_01.png ... chapter_05.png
├── video_cover_base.png
└── imprint_card_bg.png

public/assets/ui/v2/
├── scan_guide_v2.png
├── scan_retry.png
├── model_loading_overlay.png
├── extended_learning_bg.png
├── spirit_texture.png
├── qr_placeholder_texture.png
└── pc_entry_bg.png
```

全部交付 PNG 原图同步归档在：

```text
public/assets/v2_delivery/
```

## 体验页行为

- 首屏只显示故事 poster 和文字，不立即加载 27MB/34MB PLY。
- 用户点击“开始沉浸探索”后先使用现有模型的轻量点云 3D 预览效果，随后显示“正在进入真实三维场景”提示并自动切换为原始 `.ply` Gaussian Splat 渲染。
- 体验页保留 3D 渲染切换：原始 PLY、轻量点云。
- 入场转换完成后不再重复提示，用户可自行切换两种 3D 模式。
- 3D 场景展示 5 个章节节点；点击节点会切换到对应章节，并将故事讲述面板定位到该节点下方。
- 无 WebGL、低内存或省流模式时使用静态 poster fallback。
- 移动端使用 `100dvh` 和 `env(safe-area-inset-bottom)`。
- 上滑/下滑切换章节，横向拖拽留给 3D 观察。
- Bottom Sheet 展示章节正文、短视频入口和旁白入口。
- 问题卡每章最多一个，回答后显示克制反馈。
- 完成条件：访问至少 4/5 章节、触发至少 1 次视频/旁白、完成至少 2 个问题。
- 精神印记卡完全由浏览器 Canvas 本地生成，不依赖账号、后端或生成式 API。

## 性能约束

- 体验页同一时刻最多一个 WebGL Canvas。
- 首页不再加载 HeroThreeScene、NewsMarquee 或五功能 Dock。
- 原始 PLY 使用 `@mkkellogg/gaussian-splats-3d` 直接加载，避免把 Gaussian Splat 降级成普通点云。
- 轻量点云保留 V1.3 的 `GaussianSplatViewer` 设置，复用当前 `modelHigh`，不额外引入移动端低密度模型。
- 页面隐藏时音频停止；3D 失败不阻塞故事阅读。

## 验证记录

已执行：

```bash
npm run lint
npm run build
```

结果：

- `npm run lint`：通过，有 V1.3 遗留 `<img>`、旧组件 unused 等 warning。
- `npm run build`：通过。`next.config.ts` 已设置 `turbopack.root`，避免父目录 lockfile 影响 V2.0 dev/build。

## 后续建议

- 若后续需要进一步优化首屏性能，再评估是否引入独立移动端低密度模型。
- 接入真实授权视频、普通旁白音频和字幕 `.vtt`。
- 将 `/qa`、`/news` 迁移到 `/extras/*` 实体页后，再保留旧路由重定向。
- 对 V1.3 不再默认使用的组件做二次清理，降低 lint warning。
