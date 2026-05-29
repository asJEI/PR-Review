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
- **上下文构建**：
  - 识别修改的函数/类/方法（启发式提取）
  - 分析 import 依赖关系
  - 关联文件分组（目录/依赖/重命名）
  - 语义摘要与 token 压缩
- **类型安全**：完整的 TypeScript 类型系统

### 规划中
- AI Agent 分析层（总结、风险、性能、架构）
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
```

## 许可证

MIT License
