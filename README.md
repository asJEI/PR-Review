# PR-Review

AI驱动的代码审查助手，成为开发者的第二层思考。

# 在线验证（本项目已部署至云服务器中）
http://119.45.237.47:8081/

本项目已经尝试并入**开源导师**项目中,最新演示地址为：
http://119.45.237.47:8082/

# 视频演示

链接：https://www.bilibili.com/video/BV1cVVE6WEac/?spm_id_from=333.1387.homepage.video_card.click&vd_source=27dd0ecc5860cffe2555156e912ee83e（已失效）

## 项目定位

PR-Review 是一个具备上下文感知能力的 AI 代码审查系统，帮助开发者理解 PR 中的变更、识别工程风险，并生成高质量的审查建议。

核心理念：
- 工程语义优先（而非简单的变量名检查）
- 上下文感知分析
- 减少误报，理解代码关系
- 类评审者的推理能力

## 功能特性

### 已实现
- **GitHub PR 数据获取**：完整获取 PR 元数据、变更文件、提交记录、评论
- **Diff 解析**：统一 diff 格式解析，提取 hunk、行号、变更类型
- **Diff 语义分析**：函数/类/interface/import/export/async 变更检测
- **工程风险分析**：auth、数据库、缓存、async、错误处理、并发等规则检测（含 confidence）
- **上下文构建**：
  - 复用 diff-parser 语义层，映射为审查上下文
  - 分析 import 依赖关系与 1-hop 依赖扩展
  - 关联文件分组（目录/依赖/重命名）
  - 可组合 ContextEnricher 管道（周围代码、call-chain 启发式、风险聚合）
  - 模块级工程上下文（`EngineeringModuleContext`）
  - 语义摘要与 token 压缩
  - 支持 diff-parser 直连输入（无需 GitHub metadata）
- **上下文压缩**：
  - 独立 `@pr-review/context-compressor` 包
  - 规则驱动工程语义压缩（非 LLM 摘要）
  - 去除 vendor/lock/format-only 噪声
  - 输出 `coreChange`、`logicChanges`、`architecturalImpact` 等高信号结构
- **相关性评分**：
  - 独立 `@pr-review/context-relevance` 包
  - 文件/函数/模块级 relevanceScore 与 priority
  - 可解释 reasons + context token 预算分配
- **Focused Diff 提取**：
  - 独立 `@pr-review/focused-diff` 包
  - Hunk 排序、符号映射、噪声过滤、token 预算压缩
  - 仅注入 review prompt；完整 ReviewContext 保留用于行号 grounding
- **Line Mapping 引擎**：
  - 独立 `@pr-review/line-mapping` 包
  - 符号/评论 → 精确 diff 行号、hunk、GitHub position
  - 生成 GitHub Review API 兼容 payload（line/side/position）
- **Prompt 构建**：
  - 独立 `@pr-review/prompt-builder` 包
  - 将压缩上下文与相关性评分转为 summary/risk/review 三类 Agent prompt
  - 相关性优先、token 预算感知、不含 raw diff
- **PR 总结生成**：
  - 独立 `@pr-review/ai` 包
  - LLM Provider 抽象（Mock + OpenAI-compatible）
  - 结构化 JSON 解析、context grounding 校验、重试机制
- **风险审查生成**：
  - `@pr-review/ai` 包内 Risk Review Generator
  - 置信度评分、severity 分类、可解释 reasoning
  - 低误报过滤（grounding + confidence threshold）
- **Review Comment 生成**：
  - `@pr-review/ai` 包内 Review Comment Generator
  - 可组合 post-processors、hunk 行号解析（防幻觉）
  - 可选 `riskReport` 增强、GitHub Review payload 辅助函数
- **统一 Review Execution**：
  - `executeReview()` 统一编排 summary、risk、review comments 三类 Agent
  - 合并 grounding warnings、latency、usage、attempts、reliabilityScore
  - 支持 execution-level recovery、MockProvider 回退和阶段事件
- **后端 API 服务**：
  - `apps/server` 提供 `POST /api/reviews`，输入 GitHub PR URL 后自动完成拉取、解析、LLM 审查和结构化返回
  - 支持 `reviewId`、内存缓存、轮询进度 `GET /api/reviews/:id`
  - 预留 SSE 事件接口 `GET /api/reviews/:id/events`
- **类型安全**：完整的 TypeScript 类型系统

- **前端 Web UI**：
  - `apps/web` 三列式可视化界面（文件树 / diff / AI Review 面板）
  - PR URL 输入、进度展示、轮询结果
  - Summary / Risks / Comments / Meta 结构化展示
  - "复制为 PR 评论"功能

### 规划中
- CI/CD 集成（GitHub Action）
- 私有化知识库支持

## 技术栈

- **语言**：TypeScript 5.7+
- **运行时**：Node.js 18+
- **包管理**：pnpm 11.x
- **构建**：TypeScript 编译器
- **测试**：Vitest 3.x
- **后端 API**：Node.js built-in `http` server（暂未引入 Express/Fastify）
- **LLM Provider**：OpenAI-compatible、DeepSeek、Anthropic、MockProvider

## 第三方库与依赖说明

项目采用 monorepo + workspace 内部包拆分，核心分析链路尽量由本项目实现，避免把核心逻辑隐藏在外部框架中。

- **TypeScript**：全项目类型系统与构建基础。
- **Vitest**：各 package 的单元测试框架。
- **pnpm workspace**：管理 `packages/*` 与 `apps/*`（server、web）。
- **Octokit / GitHub API 相关依赖**：用于 `packages/github` 拉取 PR metadata、files、commits、comments。
- **LLM Provider SDK/HTTP 封装**：项目内部实现 OpenAI-compatible、DeepSeek、Anthropic provider 适配，统一到 `ReviewLLMClient`。
- **Node.js built-in modules**：`apps/server` 使用 `node:http`、`node:url`、`node:crypto` 等内置模块提供 API、缓存 id 与基础服务能力。

原则说明：第三方库主要用于工程基础能力（HTTP、测试、GitHub API、类型构建），PR 审查的上下文构建、风险识别、prompt 编排、grounding、line mapping、confidence scoring 等核心逻辑均在本仓库内实现。

## 模块结构

```
packages/
├── shared/          # 共享类型定义
├── github/          # GitHub API 获取层
├── diff-parser/     # Diff 解析器
└── context-builder/ # 上下文构建（核心智能层）
└── context-compressor/ # 工程语义压缩（AI Agent 输入）
└── context-relevance/ # 相关性评分与 context 预算分配
└── focused-diff/      # Focused diff 提取（review prompt 专用）
└── line-mapping/      # 行号映射与 GitHub Review payload
└── prompt-builder/    # 审查 Prompt 构建（多 Agent 输入）
└── ai/                # AI Agent 执行（PR 总结生成等）

apps/
├── web/             # 前端 Web UI（三列式可视化界面）
└── server/          # 后端 API（已实现 MVP）
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

> **pnpm 11+ 说明**：若安装时出现 `ERR_PNPM_IGNORED_BUILDS`（esbuild 构建脚本被拦截），请确认 [`pnpm-workspace.yaml`](pnpm-workspace.yaml) 中已配置 `allowBuilds.esbuild: true`，然后重新执行 `pnpm install`。

### 构建所有包

```bash
node scripts/build.mjs
```

构建会依次编译 `packages/*` 与 `apps/server`。

### 运行测试

```bash
npm run test
```

### 配置环境变量

复制 `.env.example` 为 `.env`，至少按需填写 GitHub token 和一个 LLM provider key：

```bash
GITHUB_TOKEN=your_github_token
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=your_deepseek_key
```

可选 provider：

- `LLM_PROVIDER=openai` + `OPENAI_API_KEY`
- `LLM_PROVIDER=deepseek` + `DEEPSEEK_API_KEY`
- `LLM_PROVIDER=anthropic` + `ANTHROPIC_API_KEY`

如果未配置 LLM API Key，系统会回退到 MockProvider，适合演示接口链路，但不代表真实模型分析结果。

### 启动后端 API

```bash
node scripts/build.mjs
pnpm run start:server
```

默认监听：

```text
http://127.0.0.1:8787
```

健康检查：

```bash
curl http://127.0.0.1:8787/api/healthz
```

### 使用后端 API 审查 PR

同步返回完整结果：

```bash
curl -X POST http://127.0.0.1:8787/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "prUrl": "https://github.com/owner/repo/pull/42",
    "async": false
  }'
```

异步任务模式（默认）：

```bash
curl -X POST http://127.0.0.1:8787/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "prUrl": "https://github.com/owner/repo/pull/42"
  }'
```

返回：

```json
{
  "ok": true,
  "reviewId": "generated-review-id",
  "status": "queued",
  "progress": {
    "percent": 0
  }
}
```

轮询结果：

```bash
curl http://127.0.0.1:8787/api/reviews/generated-review-id
```

SSE 进度事件：

```bash
curl http://127.0.0.1:8787/api/reviews/generated-review-id/events
```

强制 Mock 演示：

```bash
curl -X POST http://127.0.0.1:8787/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "prUrl": "https://github.com/owner/repo/pull/42",
    "forceMock": true
  }'
```

### 端到端验证

```bash
# 离线验证（使用 mock 数据）
node --input-type=module -e "
  import { buildReviewContext } from './packages/context-builder/dist/index.js';
  // 使用 mock PR 数据验证
  console.log(buildReviewContext(mockData));
"

# 在线验证（需要 GitHub Token）
export GITHUB_TOKEN=your_token_here
node packages/context-builder/scripts/smoke.mjs \
  "https://github.com/owner/repo/pull/42"

# 导出完整 ReviewContext 为 UTF-8 JSON（Windows 请勿用 `> file.json` 重定向）
node packages/context-builder/scripts/export-context.mjs \
  "https://github.com/owner/repo/pull/42" \
  review-context.json
```

## 核心 API

### 后端 Review API（推荐演示入口）

#### 功能描述

`apps/server` 将已有 package 能力封装成 HTTP API。用户传入 GitHub PR URL 后，服务自动拉取 PR 数据，构建工程上下文，调用 LLM 生成 PR 总结、风险识别和 Review 建议，并返回结构化结果。

主要接口：

- `POST /api/reviews`：创建 PR 审查任务
- `GET /api/reviews/:id`：查询任务状态和结果
- `GET /api/reviews/:id/events`：订阅 SSE 阶段事件
- `GET /api/healthz`：健康检查

#### 实现思路

后端 API 保持薄封装，不重新实现分析逻辑，而是复用现有 package：

```text
POST /api/reviews
  -> getPullRequest
  -> buildReviewContext
  -> compressReviewContext
  -> scoreRelevance
  -> extractFocusedDiffs
  -> buildReviewPrompts
  -> executeReview
  -> ReviewExecutionReport
```

服务层额外负责：

- 请求校验与 JSON 错误返回
- provider 选择与 Mock 回退
- `reviewId` 生成与内存缓存
- `status/progress` 轮询状态
- SSE 阶段事件输出

#### 测试方式

```bash
node scripts/build.mjs
pnpm run start:server
curl http://127.0.0.1:8787/api/healthz
```

然后调用：

```bash
curl -X POST http://127.0.0.1:8787/api/reviews \
  -H "Content-Type: application/json" \
  -d '{"prUrl":"https://github.com/owner/repo/pull/42","async":false}'
```

期望返回包含：

- `summary`：PR 变更总结
- `risks`：风险项、severity、confidence、reasoning
- `comments`：Review 建议、file、line、suggestion、confidence
- `meta`：provider、latency、usage、reliabilityScore、groundingWarnings

### 前端 Web UI（可视化展示）

#### 功能描述

`apps/web` 提供三列式 PR Review 可视化界面，让用户可以输入 GitHub PR URL，实时查看分析进度，并在完成后浏览文件树、查看 diff、阅读 AI 生成的结构化审查结果。

界面布局：
- **左列**：文件树，展示变更文件、修改类型（M/A/D/R）、风险等级、评论数
- **中列**：Diff 展示区，新增/删除行高亮，评论锚点
- **右列**：AI Review 面板，展示 Summary / Risks / Comments / Meta 信息

#### 实现思路

前端采用 React + Vite + Tailwind CSS：

- **首屏**：简洁的 PR URL 输入界面，提交后进入分析状态
- **进度展示**：7 阶段进度条（获取 PR → 构建上下文 → 压缩评分 → 提取 diff → 构建 prompts → AI review → grounding）
- **三列布局**：桌面端三列展示，移动端自适应为 Tab 切换
- **数据流**：React hooks 管理状态，轮询获取审查结果，SSE 预留事件接口
- **API 对接**：通过 proxy 配置代理到后端 `http://127.0.0.1:8787`

技术栈：
- React 18 + TypeScript 5.7
- Vite（快速开发构建）
- Tailwind CSS（原子化样式）
- React Router（页面路由）
- Lucide React（图标）

#### 使用方式

启动开发服务器：

```bash
# 先启动后端 API
pnpm run start:server

# 再启动前端（新终端）
pnpm run dev:web
```

前端默认运行在 `http://localhost:3000`，通过 proxy 访问后端 API。

使用流程：
1. 首页输入 GitHub PR URL（如 `https://github.com/owner/repo/pull/42`）
2. 点击"开始分析"，进入进度页面
3. 等待分析完成（自动轮询进度）
4. 在三列界面浏览：
   - 左侧选择文件
   - 中间查看 diff（新增绿色/删除红色）
   - 右侧阅读 AI Review（Summary、风险、评论、元数据）
5. 点击"复制为 PR 评论"按钮，可一键复制评论文本

### Diff 语义分析

```typescript
import { parseUnifiedDiff, analyzeSemantics } from '@pr-review/diff-parser';

const parsed = parseUnifiedDiff('src/auth.ts', patch);
const semantic = analyzeSemantics(parsed, { language: 'typescript' });

console.log(semantic.functions);
console.log(semantic.imports);      // { added: [], removed: [] }
console.log(semantic.asyncChanges);
```

### 工程风险分析

```typescript
import { parseUnifiedDiff, analyzeSemantics, analyzeRisk } from '@pr-review/diff-parser';

const parsed = parseUnifiedDiff('src/auth.ts', patch);
const semantic = analyzeSemantics(parsed, { language: 'typescript' });
const risk = analyzeRisk({ filename: 'src/auth.ts', language: 'typescript', semantic, parsed });

console.log(risk.riskHints);   // 高置信度风险提示
console.log(risk.findings);    // 含 confidence 与 evidence
```

### 构建审查上下文

```typescript
import { buildReviewContext, buildReviewContextFromParsedDiffs } from '@pr-review/context-builder';

const context = buildReviewContext(pullRequestData);

// 模块级输出示例
console.log(context.modules[0]);
// {
//   module: "src/auth",
//   affectedFunctions: [{ name: "login", kind: "method", changeType: "added" }],
//   relatedFiles: ["src/auth/service.ts", "src/auth/hash.ts"],
//   dependencies: [...],
//   expandedDependencies: [...],
//   callChainHints: [...],
//   riskContext: ["Auth logic changed"],
//   surroundingContext: [...],
//   semanticSummary: "src/auth: 2 file(s) changed; key symbols login ..."
// }

// 无 GitHub metadata，直接使用 diff 文件列表
const fromDiffs = buildReviewContextFromParsedDiffs([
  { filename: 'src/main.ts', patch: '...' },
]);
```

### 压缩审查上下文（供 AI Agent 使用）

```typescript
import { buildReviewContext } from '@pr-review/context-builder';
import { compressReviewContext } from '@pr-review/context-compressor';

const reviewContext = buildReviewContext(pullRequestData);
const compressed = compressReviewContext(reviewContext, {
  maxEstimatedTokens: 6000,
});

console.log(compressed.modules[0]?.coreChange);
// "Authentication/authorization logic update"

console.log(compressed.modules[0]?.logicChanges);
// [{ symbol: "login", whatChanged: "...", whyItMatters: "...", riskSignals: [...] }]
// 不含 raw hunks / 完整文件内容

// 导出 UTF-8 JSON（Windows 请勿用 shell 重定向）
// node packages/context-compressor/scripts/export-compressed.mjs <pr-url> output.json
```

### 相关性评分（审查优先级排序）

```typescript
import { buildReviewContext } from '@pr-review/context-builder';
import { compressReviewContext } from '@pr-review/context-compressor';
import { scoreRelevance } from '@pr-review/context-relevance';

const reviewContext = buildReviewContext(pullRequestData);
const compressed = compressReviewContext(reviewContext);

const report = scoreRelevance(
  { reviewContext, compressedContext: compressed },
  { totalContextBudget: 6000 },
);

console.log(report.rankedFileOrder);
console.log(report.files[0]);
// {
//   file: "src/auth/jwt.ts",
//   relevanceScore: 0.92,
//   priority: "high",
//   reasons: ["authentication-related path", "authentication logic modified"],
//   suggestedContextTokens: 1800,
//   compressionLevel: "preserve"
// }
```

### Focused Diff 提取（review prompt 专用）

```typescript
import { buildReviewContext } from '@pr-review/context-builder';
import { compressReviewContext } from '@pr-review/context-compressor';
import { scoreRelevance } from '@pr-review/context-relevance';
import { extractFocusedDiffs } from '@pr-review/focused-diff';
import { buildReviewPrompts } from '@pr-review/prompt-builder';

const reviewContext = buildReviewContext(pullRequestData);
const compressed = compressReviewContext(reviewContext);
const report = scoreRelevance({ reviewContext, compressedContext: compressed });

const focusedDiffReport = extractFocusedDiffs({
  reviewContext,
  compressedContext: compressed,
  relevanceReport: report,
});

const prompts = buildReviewPrompts({
  compressedContext: compressed,
  relevanceReport: report,
  reviewContext,
  focusedDiffReport,
});

// reviewPrompt 包含 "Focused code changes" 小节；summary/risk 不变

// CLI 导出
// node packages/focused-diff/scripts/export-focused-diffs.mjs <pr-url> focused-diffs.json
```

### Line Mapping（评论行号 grounding）

```typescript
import { buildPathAliases, mapCommentToLocation, formatGitHubReviewComment } from '@pr-review/line-mapping';

const patchesByFile = Object.fromEntries(
  pullRequestData.changedFiles.map((file) => [file.filename, file.patch]),
);
const pathAliases = buildPathAliases(pullRequestData.changedFiles);

const mapping = mapCommentToLocation(
  { reviewContext, patchesByFile, pathAliases },
  { file: 'src/auth/jwt.ts', line: null, symbol: 'verifyToken', lineHint: '42' },
);

console.log(mapping);
// { file, symbol, hunkIndex, startLine, endLine, changedLines, side, githubPosition, confidence }

const payload = formatGitHubReviewComment(mapping, 'Validate token expiry');
// { path, line, side, position?, body }
```

### 构建审查 Prompt（供多 Agent 使用）

```typescript
import { buildReviewContext } from '@pr-review/context-builder';
import { compressReviewContext } from '@pr-review/context-compressor';
import { scoreRelevance } from '@pr-review/context-relevance';
import { buildReviewPrompts } from '@pr-review/prompt-builder';

const reviewContext = buildReviewContext(pullRequestData);
const compressed = compressReviewContext(reviewContext);
const report = scoreRelevance({ reviewContext, compressedContext: compressed });

const prompts = buildReviewPrompts({
  compressedContext: compressed,
  relevanceReport: report,
  reviewContext,
});

console.log(prompts.summaryPrompt);
console.log(prompts.riskPrompt);
console.log(prompts.reviewPrompt);
// 不含 raw diff；按相关性排序；token 预算内组装

// node packages/prompt-builder/scripts/export-prompts.mjs <pr-url> output.json
```

### 生成 PR 总结（LLM）

```typescript
import { buildReviewPrompts } from '@pr-review/prompt-builder';
import { generatePrSummary } from '@pr-review/ai';

const prompts = buildReviewPrompts({ compressedContext: compressed, relevanceReport: report, reviewContext });

const summary = await generatePrSummary({
  summaryPrompt: prompts.summaryPrompt,
  compressedContext: compressed,
  relevanceReport: report,
  reviewContext,
});

console.log(summary);
// {
//   title, summary, keyChanges, affectedSystems, architecturalImpact, meta
// }

// 环境变量：复制 `.env.example` 为 `.env` 并填入 Key（`.env` 已被 gitignore）
// LLM_PROVIDER=deepseek, DEEPSEEK_API_KEY=..., 或 OPENAI_API_KEY / ANTHROPIC_API_KEY
// node packages/ai/scripts/export-summary.mjs <pr-url> pr-summary.json
```

### LLM Provider Layer（直接调用）

```typescript
import { ReviewLLMClient, createReviewLLMClientFromEnv } from '@pr-review/ai';

const llm = createReviewLLMClientFromEnv();
const summaryResult = await llm.generateSummary(reviewPrompt);
// { provider, model, latencyMs, usage: { promptTokens, completionTokens, estimatedCostUsd }, result, attempts }

const riskResult = await llm.generateRiskReview(riskPrompt);
const commentResult = await llm.generateReviewComments(reviewPrompt);
```

### 生成风险审查（LLM）

```typescript
import { buildReviewPrompts } from '@pr-review/prompt-builder';
import { generateRiskReview } from '@pr-review/ai';

const prompts = buildReviewPrompts({ compressedContext: compressed, relevanceReport: report, reviewContext });

const riskReport = await generateRiskReview({
  riskPrompt: prompts.riskPrompt,
  compressedContext: compressed,
  relevanceReport: report,
  reviewContext,
});

console.log(riskReport.risks);
// [{ severity, category, description, affectedFiles, recommendation, confidence, confidenceScore, reasoning }]

// node packages/ai/scripts/export-risk-review.mjs <pr-url> risk-review.json
```

### 生成 Review Comments（LLM）

```typescript
import { buildReviewPrompts } from '@pr-review/prompt-builder';
import { generateRiskReview, generateReviewComments, toGitHubReviewPayloads } from '@pr-review/ai';

const prompts = buildReviewPrompts({ compressedContext: compressed, relevanceReport: report, reviewContext });
const riskReport = await generateRiskReview({ riskPrompt: prompts.riskPrompt, compressedContext: compressed, relevanceReport: report, reviewContext });

const commentReport = await generateReviewComments({
  reviewPrompt: prompts.reviewPrompt,
  compressedContext: compressed,
  relevanceReport: report,
  reviewContext,
  riskReport,
  patchesByFile,
  pathAliases,
});

console.log(commentReport.comments);
// [{ file, line, symbol, mapping?, severity, comment, ... }]

console.log(toGitHubReviewPayloads(commentReport.comments));
// GitHub Review API payloads with line, side, position

// node packages/ai/scripts/export-review-comments.mjs <pr-url> review-comments.json
```

### 统一 Review Execution（推荐）

`executeReview()` 在一次调用中并行运行 summary + risk，再顺序运行 comments，并合并 grounding、置信度与执行元数据：

```typescript
import { buildReviewPrompts } from '@pr-review/prompt-builder';
import { extractFocusedDiffs } from '@pr-review/focused-diff';
import { buildPathAliases } from '@pr-review/line-mapping';
import { executeReview, toGitHubReviewPayloads } from '@pr-review/ai';

const focusedDiffReport = extractFocusedDiffs({ reviewContext, compressedContext: compressed, relevanceReport: report });
const prompts = buildReviewPrompts({ compressedContext: compressed, relevanceReport: report, reviewContext, focusedDiffReport });

const fullReport = await executeReview({
  summaryPrompt: prompts.summaryPrompt,
  riskPrompt: prompts.riskPrompt,
  reviewPrompt: prompts.reviewPrompt,
  compressedContext: compressed,
  relevanceReport: report,
  reviewContext,
  focusedDiffReport,
  patchesByFile,
  pathAliases,
});

console.log(fullReport.summary, fullReport.risks, fullReport.comments);
console.log(fullReport.meta.reliabilityScore, fullReport.meta.latencyMs);
console.log(toGitHubReviewPayloads(fullReport.comments.comments));

// node packages/ai/scripts/export-full-review.mjs <pr-url> full-review.json
// export-review-comments.mjs 仍可用，内部调用 executeReview 并只写出 comments 子集
```

## 许可证

MIT License
