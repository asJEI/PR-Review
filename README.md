# PR-Review

AI驱动的代码审查助手，成为开发者的第二层思考。

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
- **Prompt 构建**：
  - 独立 `@pr-review/prompt-builder` 包
  - 将压缩上下文与相关性评分转为 summary/risk/review 三类 Agent prompt
  - 相关性优先、token 预算感知、不含 raw diff
- **PR 总结生成**：
  - 独立 `@pr-review/ai` 包
  - LLM Provider 抽象（Mock + OpenAI-compatible）
  - 结构化 JSON 解析、context grounding 校验、重试机制
- **类型安全**：完整的 TypeScript 类型系统

### 规划中
- 风险/Review Agent 执行层
- 结果聚合与可视化
- CI/CD 集成（GitHub Action）
- 私有化知识库支持

## 技术栈

- **语言**：TypeScript 5.7+
- **运行时**：Node.js 18+
- **包管理**：pnpm 11.x
- **构建**：TypeScript 编译器
- **测试**：Vitest 3.x

## 模块结构

```
packages/
├── shared/          # 共享类型定义
├── github/          # GitHub API 获取层
├── diff-parser/     # Diff 解析器
└── context-builder/ # 上下文构建（核心智能层）
└── context-compressor/ # 工程语义压缩（AI Agent 输入）
└── context-relevance/ # 相关性评分与 context 预算分配
└── prompt-builder/    # 审查 Prompt 构建（多 Agent 输入）
└── ai/                # AI Agent 执行（PR 总结生成等）

apps/
├── web/             # 前端（待实现）
└── server/          # 后端 API（待实现）
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 构建所有包

```bash
node scripts/build.mjs
```

### 运行测试

```bash
npm run test
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

// 环境变量：OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL
// node packages/ai/scripts/export-summary.mjs <pr-url> pr-summary.json
```

## 许可证

MIT License
