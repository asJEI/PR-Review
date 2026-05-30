/**
 * Compare DeepSeek V4 Flash vs Pro on preset PRs.
 *
 * Usage:
 *   node scripts/compare-deepseek-models.mjs
 *   node scripts/compare-deepseek-models.mjs vite-monorepo-refactor
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnv } from "./load-env.mjs";
import { exportPreset, PRESET_DEFINITIONS } from "./export-demo-preset.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPARE_DIR = resolve(__dirname, "../apps/web/public/demos/compare");
const REPORT_PATH = resolve(COMPARE_DIR, "comparison-report.md");

const MODELS = [
  { id: "flash", model: "deepseek-v4-flash" },
  { id: "pro", model: "deepseek-v4-pro" },
];

function summarizeBundle(bundle) {
  const result = bundle.review?.result;
  const meta = result?.meta;
  const summary = result?.summary;
  const risks = result?.risks?.risks ?? [];
  const comments = result?.comments?.comments ?? [];

  return {
    model: bundle.llmModel ?? meta?.models?.summary ?? "unknown",
    reliabilityScore: meta?.reliabilityScore ?? 0,
    latencySec: ((meta?.latencyMs?.total ?? 0) / 1000).toFixed(1),
    totalTokens: meta?.usage?.totalTokens ?? 0,
    estimatedCostUsd: meta?.usage?.estimatedCostUsd ?? null,
    riskCount: risks.length,
    highOrCriticalRisks: risks.filter((r) => r.severity === "critical" || r.severity === "high").length,
    commentCount: comments.length,
    summaryTitle: summary?.title ?? "",
    summaryText: summary?.summary ?? "",
    keyChanges: summary?.keyChanges ?? [],
    topRisks: risks.slice(0, 3).map((r) => `[${r.severity}] ${r.category}: ${r.description}`),
    topComments: comments.slice(0, 3).map((c) => `[${c.severity}] ${c.file}: ${c.comment}`),
    groundingWarnings: meta?.groundingWarnings?.length ?? 0,
  };
}

function scoreSummary(metrics) {
  if (metrics.error) {
    return -1000;
  }
  return (
    metrics.reliabilityScore * 100 +
    metrics.commentCount * 2 +
    metrics.highOrCriticalRisks * 3 -
    metrics.groundingWarnings * 5
  );
}

function buildReport(results) {
  const lines = [
    "# DeepSeek V4 Flash vs Pro 预设 PR 对比报告",
    "",
    `生成时间: ${new Date().toISOString()}`,
    "",
    "模型 ID（[DeepSeek API](https://api-docs.deepseek.com/news/news260424)）：",
    "- Flash: `deepseek-v4-flash`",
    "- Pro: `deepseek-v4-pro`",
    "",
  ];

  for (const [presetId, byModel] of Object.entries(results)) {
    const meta = PRESET_DEFINITIONS[presetId];
    const flash = byModel.flash;
    const pro = byModel.pro;
    const flashScore = scoreSummary(flash);
    const proScore = scoreSummary(pro);
    const winner =
      proScore > flashScore ? "Pro" : proScore < flashScore ? "Flash" : "平局";

    lines.push(`## ${presetId}`, "");
    lines.push(`- **PR**: ${meta.prUrl}`);
    lines.push(`- **标题**: ${meta.title}`);
    lines.push(`- **综合推荐**: ${winner}`);
    if (flash.error) {
      lines.push(`- **Flash 错误**: ${flash.error}`);
    }
    if (pro.error) {
      lines.push(`- **Pro 错误**: ${pro.error}`);
    }
    lines.push("");
    lines.push("| 指标 | Flash | Pro |");
    lines.push("|------|-------|-----|");
    lines.push(`| 可靠性评分 | ${(flash.reliabilityScore * 100).toFixed(0)}% | ${(pro.reliabilityScore * 100).toFixed(0)}% |`);
    lines.push(`| 耗时 | ${flash.latencySec}s | ${pro.latencySec}s |`);
    lines.push(`| Tokens | ${flash.totalTokens} | ${pro.totalTokens} |`);
    lines.push(`| 风险数 (高/严重) | ${flash.riskCount} (${flash.highOrCriticalRisks}) | ${pro.riskCount} (${pro.highOrCriticalRisks}) |`);
    lines.push(`| 评论数 | ${flash.commentCount} | ${pro.commentCount} |`);
    lines.push(`| Grounding 警告 | ${flash.groundingWarnings} | ${pro.groundingWarnings} |`);
    lines.push("");

    lines.push("### Flash Summary");
    lines.push(flash.summaryText || "_无_");
    lines.push("");
    lines.push("### Pro Summary");
    lines.push(pro.summaryText || "_无_");
    lines.push("");

    if (flash.topRisks.length > 0 || pro.topRisks.length > 0) {
      lines.push("### 主要风险对比");
      lines.push("");
      lines.push("**Flash:**");
      for (const item of flash.topRisks) {
        lines.push(`- ${item}`);
      }
      lines.push("");
      lines.push("**Pro:**");
      for (const item of pro.topRisks) {
        lines.push(`- ${item}`);
      }
      lines.push("");
    }

    if (flash.topComments.length > 0 || pro.topComments.length > 0) {
      lines.push("### 主要评论对比");
      lines.push("");
      lines.push("**Flash:**");
      for (const item of flash.topComments) {
        lines.push(`- ${item}`);
      }
      lines.push("");
      lines.push("**Pro:**");
      for (const item of pro.topComments) {
        lines.push(`- ${item}`);
      }
      lines.push("");
    }

    lines.push(`详细 JSON: \`compare/${presetId}-flash.json\`, \`compare/${presetId}-pro.json\``);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

loadEnv();
mkdirSync(COMPARE_DIR, { recursive: true });

const presetFilter = process.argv[2];
const presetIds = presetFilter
  ? [presetFilter]
  : Object.keys(PRESET_DEFINITIONS);

const results = {};

for (const presetId of presetIds) {
  results[presetId] = {};

  for (const { id, model } of MODELS) {
    const outputPath = resolve(COMPARE_DIR, `${presetId}-${id}.json`);
    console.error(`\n=== ${presetId} / ${model} ===`);

    try {
      await exportPreset(presetId, {
        model,
        outputPath,
        maxAgentRetries: 2,
        continueOnPartialFailure: true,
      });
      const bundle = JSON.parse(readFileSync(outputPath, "utf8").replace(/^\uFEFF/, ""));
      results[presetId][id] = { ...summarizeBundle(bundle), error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed: ${message}`);
      results[presetId][id] = {
        model,
        error: message,
        reliabilityScore: 0,
        latencySec: "—",
        totalTokens: 0,
        estimatedCostUsd: null,
        riskCount: 0,
        highOrCriticalRisks: 0,
        commentCount: 0,
        summaryTitle: "",
        summaryText: "",
        keyChanges: [],
        topRisks: [],
        topComments: [],
        groundingWarnings: 0,
      };
    }
  }
}

const report = buildReport(results);
writeFileSync(REPORT_PATH, `\uFEFF${report}`, "utf8");
console.error(`\nWrote comparison report to ${REPORT_PATH}`);
