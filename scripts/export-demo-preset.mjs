/**
 * Export a preset demo bundle (result + artifacts) for the web UI.
 *
 * Usage:
 *   node scripts/export-demo-preset.mjs <preset-id> [pr-url]
 *   node scripts/export-demo-preset.mjs --all
 *   node scripts/export-demo-preset.mjs --all --mock
 *   node scripts/export-demo-preset.mjs vite-monorepo-refactor --model deepseek-v4-pro --out apps/web/public/demos/compare/foo.json
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { hasLlmApiKey, loadEnv } from "./load-env.mjs";
import { buildReviewContext } from "../packages/context-builder/dist/index.js";
import { compressReviewContext } from "../packages/context-compressor/dist/index.js";
import { scoreRelevance } from "../packages/context-relevance/dist/index.js";
import { extractFocusedDiffs } from "../packages/focused-diff/dist/index.js";
import { buildReviewPrompts } from "../packages/prompt-builder/dist/index.js";
import { buildPathAliases } from "../packages/line-mapping/dist/index.js";
import {
  executeReview,
  ReviewExecutionMockProvider,
  resolveProviderFromEnv,
  resolveProviderEnv,
} from "../packages/ai/dist/index.js";
import { getPullRequest } from "../packages/github/dist/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const OUTPUT_DIR = resolve(__dirname, "../apps/web/public/demos");

export const PRESET_DEFINITIONS = {
  "xiangshan-hpm": {
    prUrl: "https://github.com/OpenXiangShan/XiangShan-Design-Doc/pull/136",
    title: "fix(HPM.md): fix PMU register names and bit field offsets",
    category: "文档/规格修正",
    description: "修复 PMU 文档中寄存器名称与位域偏移笔误，涉及 mhpmevent 与 mcountinhibit/xcounteren 描述。",
    tagColor: "blue",
  },
  "naga-agent-auth": {
    prUrl: "https://github.com/RTGS2017/NagaAgent/pull/313",
    title: "feat(frontend): 网关/本地模式配置 UI 与登录跳过 emit",
    category: "认证权限相关",
    description: "登录跳过 emit、网关/本地模式配置 UI、敏感字段 password 输入与 Windows UTF-8 日志修复。",
    tagColor: "orange",
  },
  "vite-monorepo-refactor": {
    prUrl: "https://github.com/netease-youdao/LobsterAI/pull/944",
    title: "fix(mcp): fix scrollbar overflowing modal rounded corners",
    category: "大型重构相关",
    description: "修复 MCP 自定义服务器弹框滚动条溢出圆角问题，拆分外层裁剪、内容滚动与底部按钮三层结构。",
    tagColor: "purple",
  },
};

function resolveProvider(forceMock) {
  if (forceMock) {
    return { provider: new ReviewExecutionMockProvider(), resolvedProviderId: "mock" };
  }

  const envProvider = resolveProviderFromEnv();
  if (envProvider) {
    const id = process.env.LLM_PROVIDER?.toLowerCase() ?? "auto";
    return { provider: envProvider, resolvedProviderId: id === "auto" ? "deepseek" : id };
  }

  if (hasLlmApiKey()) {
    return { provider: resolveProviderFromEnv(), resolvedProviderId: "unknown" };
  }

  console.error("Warning: No LLM API key found; using MockProvider.");
  return { provider: new ReviewExecutionMockProvider(), resolvedProviderId: "mock" };
}

function resolveModel(explicitModel) {
  if (explicitModel) {
    return explicitModel;
  }
  const env = resolveProviderEnv();
  return env?.defaultModel ?? process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
}

export async function exportPreset(presetId, options = {}) {
  const {
    prUrlOverride,
    forceMock = false,
    model: explicitModel,
    outputPath: customOutputPath,
    maxAgentRetries,
    continueOnPartialFailure,
  } = options;

  const meta = PRESET_DEFINITIONS[presetId];
  if (!meta) {
    throw new Error(`Unknown preset id: ${presetId}`);
  }

  const prUrl = prUrlOverride ?? meta.prUrl;
  const model = resolveModel(explicitModel);
  console.error(`Exporting preset "${presetId}" from ${prUrl} (model: ${model}) ...`);

  const providerResolution = resolveProvider(forceMock);
  const prData = await getPullRequest(prUrl);
  const reviewContext = buildReviewContext(prData);
  const compressed = compressReviewContext(reviewContext, {
    maxEstimatedTokens: Number(process.env.MAX_ESTIMATED_TOKENS ?? 6000),
  });
  const relevanceReport = scoreRelevance(
    { reviewContext, compressedContext: compressed },
    { totalContextBudget: Number(process.env.TOTAL_CONTEXT_BUDGET ?? 6000) },
  );
  const focusedDiffReport = extractFocusedDiffs({
    reviewContext,
    compressedContext: compressed,
    relevanceReport,
  });
  const prompts = buildReviewPrompts({
    compressedContext: compressed,
    relevanceReport,
    reviewContext,
    focusedDiffReport,
  });

  const patchesByFile = Object.fromEntries(
    prData.changedFiles.map((file) => [file.filename, file.patch]),
  );
  const pathAliases = buildPathAliases(prData.changedFiles);

  const report = await executeReview(
    {
      summaryPrompt: prompts.summaryPrompt,
      riskPrompt: prompts.riskPrompt,
      reviewPrompt: prompts.reviewPrompt,
      compressedContext: compressed,
      relevanceReport,
      reviewContext,
      focusedDiffReport,
      patchesByFile,
      pathAliases,
    },
    {
      provider: providerResolution.provider,
      model,
      maxAgentRetries: options.maxAgentRetries ?? 2,
      continueOnPartialFailure: options.continueOnPartialFailure ?? providerResolution.resolvedProviderId === "mock",
    },
  );

  const artifacts = {
    changedFiles: prData.changedFiles.map((file) => ({
      filename: file.filename,
      status: file.status,
      patch: file.patch,
      additions: file.additions,
      deletions: file.deletions,
      previousFilename: file.previousFilename,
    })),
    fileRelevance: relevanceReport.files.map((entry) => ({
      file: entry.file,
      relevanceScore: entry.relevanceScore,
      priority: entry.priority,
    })),
    resolvedProvider: providerResolution.resolvedProviderId,
  };

  const warnings =
    providerResolution.resolvedProviderId === "mock"
      ? ["No LLM API key found, fallback to MockProvider"]
      : [];

  const bundle = {
    id: presetId,
    prUrl,
    title: meta.title,
    category: meta.category,
    description: meta.description,
    tagColor: meta.tagColor,
    llmModel: model,
    generatedAt: new Date().toISOString(),
    review: {
      ok: true,
      reviewId: `demo-${presetId}`,
      status: "completed",
      progress: { percent: 100 },
      result: report,
      artifacts,
      warnings,
    },
  };

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const outputPath = customOutputPath
    ? resolve(process.cwd(), customOutputPath)
    : resolve(OUTPUT_DIR, `${presetId}.json`);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `\uFEFF${JSON.stringify(bundle, null, 2)}`, "utf8");
  console.error(`Wrote preset demo to ${outputPath}`);
  return { outputPath, bundle };
}

function getArg(args, name) {
  const idx = args.indexOf(name);
  if (idx === -1 || idx + 1 >= args.length) {
    return undefined;
  }
  return args[idx + 1];
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const args = process.argv.slice(2);
  const forceMock = args.includes("--mock");
  const exportAll = args.includes("--all");
  const explicitModel = getArg(args, "--model");
  const explicitOut = getArg(args, "--out");
  const positional = args.filter((arg, index) => {
    if (arg.startsWith("--")) {
      return false;
    }
    const prev = args[index - 1];
    return prev !== "--model" && prev !== "--out";
  });

  loadEnv();

  if (exportAll) {
    for (const presetId of Object.keys(PRESET_DEFINITIONS)) {
      await exportPreset(presetId, { forceMock, model: explicitModel, outputPath: explicitOut });
    }
  } else if (positional.length >= 1) {
    const presetId = positional[0];
    const prUrl = positional[1];
    await exportPreset(presetId, {
      prUrlOverride: prUrl,
      forceMock,
      model: explicitModel,
      outputPath: explicitOut,
    });
  } else {
    console.error(`Usage:
  node scripts/export-demo-preset.mjs <preset-id> [pr-url] [--model <name>] [--out <path>]
  node scripts/export-demo-preset.mjs --all [--mock] [--model <name>]

Presets: ${Object.keys(PRESET_DEFINITIONS).join(", ")}`);
    process.exit(1);
  }
}
