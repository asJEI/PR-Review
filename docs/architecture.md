# Architecture

## `packages/github` — GitHub PR fetcher

Single responsibility: communicate with the GitHub REST API, parse PR URLs, normalize responses, and surface domain errors. No AI, UI, or business rules.

### Folder structure

```
packages/github/src/
  index.ts              # Public API surface
  get-pull-request.ts   # Orchestrator: getPullRequest()
  pr-link-parser.ts     # Pure URL → ParsedPrUrl
  validation.ts         # Input guards before I/O
  pr-client.ts          # Octokit factory
  paginate.ts           # List endpoint pagination
  normalize.ts          # Octokit → @pr-review/shared types
  map-github-error.ts   # RequestError → domain errors
  errors.ts             # Typed error hierarchy
```

### Data flow

1. `validatePrUrl` — reject invalid user input
2. `parsePrUrl` — extract `owner`, `repo`, `pullNumber`
3. `createOctokitClient` — optional `GITHUB_TOKEN` for higher rate limits
4. `pulls.get` — confirm PR exists, normalize metadata
5. Parallel paginated fetches: files (with patch), commits, issue comments, review comments
6. Normalize and return `PullRequestData` for `context-builder`

### Public API

```ts
import { getPullRequest } from "@pr-review/github";

const data = await getPullRequest("https://github.com/owner/repo/pull/42");
```

Types live in `@pr-review/shared` so downstream packages never import Octokit shapes.

---

## `packages/diff-parser` — Unified diff parser + semantic layer

Structural parser for GitHub unified diff patches, plus a lightweight regex-based semantic layer.

```
packages/diff-parser/src/
  parse-unified-diff.ts        # parseUnifiedDiff — pure structure, no semantics
  semantic/
    analyze-semantics.ts       # analyzeSemantics, parseAndAnalyze
    extractors/                # functions, classes, imports, exports, async
    patterns/                  # per-language regex rules
    interfaces/                # SemanticExtractor (Tree-sitter hook)
  risk/
    analyze-risk.ts            # analyzeRisk, parseAnalyzeAndAssessRisk
    detectors/                 # auth, db, cache, async, error, concurrency
    engine/run-detectors.ts    # composable rule pipeline + confidence filter
    interfaces/                # RiskDetector
```

### Public API

```ts
const parsed = parseUnifiedDiff(filename, patch);
const semantic = analyzeSemantics(parsed, { language: "typescript" });
const risk = analyzeRisk({ filename, language, semantic, parsed });
// risk.riskHints — high-confidence engineering risk messages
// risk.findings — structured { id, message, confidence, evidence }
```

MVP uses `RegexSemanticExtractor` and rule-based `RiskDetector`s. No AST or LSP.

---

## `packages/context-builder` — Engineering context pipeline

Transforms `PullRequestData` into `ReviewContext` for `packages/ai`. No LLM calls, no GitHub I/O, no UI.

### Pipeline

```
PullRequestData (or ParsedDiffFileInput[])
  → parse-diffs (parseUnifiedDiff + analyzeSemantics)
  → extract-symbols (mapSemanticToSymbolChanges)
  → extract-imports (mapSemanticToImportEdges)
  → build-dependency-graph
  → group-changes
  → enrich-context (ContextEnricher chain)
  → build-summaries (deterministic + riskByFile riskHints)
  → compress-context (token budget)
  → build-module-contexts
  → ReviewContext
```

### Enricher chain

Default enrichers run in fixed order via `runEnrichers()`:

| Enricher | Output on `PipelineState` |
|----------|----------------------------|
| `SurroundingContextEnricher` | `enrichedHunksByFile` — proximity-trimmed hunk context |
| `DependencyExpansionEnricher` | `expandedDepsByFile` — 1-hop internal + external modules |
| `CallChainEnricher` | `callChainHints` — import edges + shared symbol names |
| `RiskContextEnricher` | `riskByFile` — per-file risk with data-file gating |

### Module-level output

`ReviewContext.modules` is an array of `EngineeringModuleContext`, one per `ChangeGroup`:

```ts
interface EngineeringModuleContext {
  module: string;
  affectedFunctions: SymbolChange[];
  relatedFiles: string[];
  dependencies: ImportEdge[];
  expandedDependencies: string[];
  callChainHints: CallChainHint[];
  riskContext: string[];
  surroundingContext: HunkContext[];
  semanticSummary: string;
}
```

### Folder structure

```
packages/context-builder/src/
  build-review-context.ts     # buildReviewContext()
  adapters/parsed-diff-input.ts  # buildReviewContextFromParsedDiffs()
  enrichers/                  # ContextEnricher implementations
  modules/                    # ChangeGroup → EngineeringModuleContext
  pipeline/run-pipeline.ts
  pipeline/stages/            # One stage per file
  parsers/                    # Language detection
  graph/                      # Dependency graph + connected components
  interfaces/                 # SymbolExtractor, AstAnalyzer, FileContentResolver
  utils/                      # Token estimate, hunk context, risk filter
```

### MVP limits

- Surrounding code comes from **patch context lines only** (no full-file fetch)
- Symbol extraction is **regex/heuristic**; `AstAnalyzer` is a no-op stub
- Summaries are **deterministic** (not LLM-generated)

### Extension points

| Interface | MVP | Future |
|-----------|-----|--------|
| `SemanticExtractor` (diff-parser) | `RegexSemanticExtractor` | Tree-sitter |
| `RiskDetector` (diff-parser) | 6 rule-based detectors | Custom rules / ML scoring |
| `ContextEnricher` (context-builder) | 4 default enrichers | Custom enricher injection |
| `AstAnalyzer` | `NoopAstAnalyzer` | Full AST analysis, call graphs |
| `FileContentResolver` | Not wired | Fetch blobs from GitHub |

### Public API

```ts
import { buildReviewContext, buildReviewContextFromParsedDiffs } from "@pr-review/context-builder";

const context = buildReviewContext(pullRequestData, {
  maxEstimatedTokens: 12_000,
  maxContextLinesPerHunk: 8,
});

// Without GitHub metadata (diff-parser output only):
const fromDiffs = buildReviewContextFromParsedDiffs([
  { filename: "src/auth.ts", patch: "..." },
]);
```

Output type `ReviewContext` is defined in `@pr-review/shared` (`types/context.ts`). It includes file-level `files`, `changeGroups`, and module-level `modules`.

---

## `packages/context-compressor` — Engineering context compression

Transforms `ReviewContext` into `CompressedReviewContext` for downstream AI agents. **Not an LLM summarizer** — rule-based, deterministic compression that removes raw code and noise while preserving engineering signals.

### Data flow

```
ReviewContext (from context-builder)
  → NoiseFilterProcessor
  → SignalExtractorProcessor
  → IntentExtractorProcessor
  → LogicCompressorProcessor
  → ArchitecturalImpactProcessor
  → ModuleAssemblerProcessor
  → TokenBudgetProcessor
  → CompressedReviewContext
```

### Folder structure

```
packages/context-compressor/src/
  compress-review-context.ts    # compressReviewContext()
  pipeline/                     # CompressionState, defaults, orchestrator
  processors/                   # Composable CompressionProcessor chain
  filters/                      # Path/change/risk noise filters
  signals/                      # Risk, semantic, path, commit intent
  strategies/                   # coreChange, logicChange, architectural rules
  utils/                        # Token estimate, scoring, diff noise detect
  adapters/                     # ReviewContext → CompressionState
```

### Output shape

`CompressedModuleContext` per module:

- `coreChange` — one-line engineering intent (e.g. "Authentication/authorization logic update")
- `logicChanges` — structured what/why per symbol (no raw hunks)
- `architecturalImpact`, `riskContext`, `dependencies`
- `priorityScore` — for future embedding/rerank

### Public API

```ts
import { buildReviewContext } from "@pr-review/context-builder";
import { compressReviewContext } from "@pr-review/context-compressor";

const reviewContext = buildReviewContext(pullRequestData);
const compressed = compressReviewContext(reviewContext, {
  maxEstimatedTokens: 6000,
});
```

Standalone from `buildReviewContext()` — call explicitly before passing to `packages/ai`.

### Relationship to context-builder compression

| Layer | Package | Role |
|-------|---------|------|
| Structural token trim | `context-builder` (`compress-context.ts`) | Truncate hunk lines, drop files by score |
| Semantic compression | `context-compressor` | Remove raw code; emit engineering summaries |
| Relevance scoring | `context-relevance` | Rank files/symbols/modules; allocate context budget |
| Prompt building | `prompt-builder` | Assemble summary/risk/review prompts for agents |
| Summary generation | `ai` | Execute summary prompt via LLM; parse structured output |
| Risk review generation | `ai` | Execute risk prompt; confidence scoring and grounding filter |
| Review comment generation | `ai` | Execute review prompt; hunk-grounded line comments |

---

## `packages/context-relevance` — Relevance scoring

Ranks modified files, symbols, and modules by engineering importance for downstream AI agents. Rule-based, explainable — no LLM calls.

### Data flow

```
ReviewContext (+ optional CompressedReviewContext)
  → FileRelevanceScorer
  → SymbolRelevanceScorer
  → ModuleRelevanceScorer
  → ContextBudgetAllocator
  → RelevanceReport
```

### Output shape

- `FileRelevanceScore`: `relevanceScore`, `priority`, `reasons`, `suggestedContextTokens`, `compressionLevel`
- `SymbolRelevanceScore`: per-function/method ranking
- `ModuleRelevanceScore`: aggregated module priority + `topFiles`
- `rankedFileOrder` / `rankedSymbolOrder`: agent review sequence

### Public API

```ts
import { buildReviewContext } from "@pr-review/context-builder";
import { compressReviewContext } from "@pr-review/context-compressor";
import { scoreRelevance } from "@pr-review/context-relevance";

const reviewContext = buildReviewContext(pullRequestData);
const compressed = compressReviewContext(reviewContext);

const report = scoreRelevance(
  { reviewContext, compressedContext: compressed },
  { totalContextBudget: 6000 },
);
```

Standalone API — call explicitly after context building/compression.

---

## `packages/prompt-builder` — Review prompt builder

Transforms compressed engineering context and relevance scores into structured, token-budgeted prompts for downstream AI agents. **No LLM calls** — provider-agnostic string output only.

### Data flow

```
CompressedReviewContext + RelevanceReport (+ optional ReviewContext)
  → PromptInputAdapter
  → SummaryPromptBuilder
  → RiskPromptBuilder
  → ReviewCommentPromptBuilder
  → SectionPrioritizer
  → TokenAwareAssembler
  → ReviewPromptBundle
```

### Output shape

- `summaryPrompt`: architectural intent, module impact, commit themes
- `riskPrompt`: auth/security, async/concurrency, DB/cache, error-handling signals
- `reviewPrompt`: targeted review comments for high-relevance files/symbols
- `stats`: per-prompt token estimates, included/dropped sections

### Public API

```ts
import { buildReviewContext } from "@pr-review/context-builder";
import { compressReviewContext } from "@pr-review/context-compressor";
import { scoreRelevance } from "@pr-review/context-relevance";
import { buildReviewPrompts } from "@pr-review/prompt-builder";

const reviewContext = buildReviewContext(pullRequestData);
const compressed = compressReviewContext(reviewContext);
const report = scoreRelevance({ reviewContext, compressedContext: compressed });

const prompts = buildReviewPrompts({
  compressedContext: compressed,
  relevanceReport: report,
  reviewContext,
});
// { summaryPrompt, riskPrompt, reviewPrompt, stats, builtAt }
```

Composable builders (`SummaryPromptBuilder`, `RiskPromptBuilder`, `ReviewCommentPromptBuilder`) are exported for future multi-agent routing in `packages/ai`.

Standalone API — call explicitly after compression and relevance scoring.

---

## `packages/ai` — PR Summary Generator

Executes `summaryPrompt` via provider-agnostic LLM abstraction and returns strongly typed `PrSummary`.

### Data flow

```
SummaryGeneratorInput (+ optional SummaryGeneratorOptions)
  → initSummaryState
  → LLMProvider.complete (with retry)
  → parseSummaryResponse
  → validateSummaryGrounding
  → PrSummary
```

### Providers

| Provider | Role |
|----------|------|
| `MockProvider` | Deterministic JSON for tests/dev |
| `OpenAICompatibleProvider` | fetch-based OpenAI/Azure/local chat completions |
| `withRetry` | Retries 429/5xx with exponential backoff |

Env: `OPENAI_API_KEY`, `OPENAI_BASE_URL` (default `https://api.openai.com/v1`), `OPENAI_MODEL` (default `gpt-4o-mini`).

### Output shape

```ts
interface PrSummary {
  title: string;
  summary: string;
  keyChanges: string[];
  affectedSystems: string[];
  architecturalImpact: string;
  generatedAt: string;
  meta: { provider, model, tokens, groundingWarnings };
}
```

### Public API

```ts
import { buildReviewPrompts } from "@pr-review/prompt-builder";
import { generatePrSummary } from "@pr-review/ai";

const prompts = buildReviewPrompts({ compressedContext, relevanceReport, reviewContext });

const summary = await generatePrSummary({
  summaryPrompt: prompts.summaryPrompt,
  compressedContext,
  relevanceReport,
  reviewContext,
});
```

Standalone API — call explicitly after `buildReviewPrompts`. Falls back to `MockProvider` when `OPENAI_API_KEY` is unset.

### Risk Review Generator

Executes `riskPrompt` and returns confidence-aware `RiskReviewReport`.

```
RiskReviewGeneratorInput (+ options)
  → initRiskState
  → LLMProvider.complete (with retry)
  → parseRiskResponse
  → validateRiskGrounding
  → applyConfidenceScoring
  → filterRisksByConfidence
  → RiskReviewReport
```

```ts
import { buildReviewPrompts } from "@pr-review/prompt-builder";
import { generateRiskReview } from "@pr-review/ai";

const prompts = buildReviewPrompts({ compressedContext, relevanceReport, reviewContext });

const riskReport = await generateRiskReview({
  riskPrompt: prompts.riskPrompt,
  compressedContext,
  relevanceReport,
  reviewContext,
});
// { risks[], overallRiskLevel, meta: { filteredCount, groundingWarnings } }
```

Shared agent infrastructure: [`agents/agent-defaults.ts`](packages/ai/src/agents/agent-defaults.ts) (`resolveProvider`, `getBaseProviderId`).

### Review Comment Generator

Executes `reviewPrompt` and returns grounded, confidence-filtered `ReviewCommentReport`.

```
ReviewCommentGeneratorInput (+ optional riskReport)
  → initCommentState
  → LLMProvider.complete (with retry)
  → parseCommentResponse
  → runCommentProcessors (style/dedupe/discussion)
  → validateCommentGrounding
  → applyCommentConfidenceScoring
  → filterCommentsByConfidence + sortByRelevance
  → ReviewCommentReport
```

```ts
import { buildReviewPrompts } from "@pr-review/prompt-builder";
import { generateRiskReview, generateReviewComments, toGitHubReviewPayloads } from "@pr-review/ai";

const prompts = buildReviewPrompts({ compressedContext, relevanceReport, reviewContext });
const riskReport = await generateRiskReview({ riskPrompt: prompts.riskPrompt, compressedContext, relevanceReport, reviewContext });

const commentReport = await generateReviewComments({
  reviewPrompt: prompts.reviewPrompt,
  compressedContext,
  relevanceReport,
  reviewContext,
  riskReport,
});

const githubPayloads = toGitHubReviewPayloads(commentReport.comments);
```

Line numbers are resolved only from `reviewContext` hunks via [`line-resolver.ts`](packages/ai/src/comments/utils/line-resolver.ts) — never from unvalidated LLM output.
