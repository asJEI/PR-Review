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
PullRequestData
  → parse-diffs (parseUnifiedDiff + analyzeSemantics)
  → extract-symbols (mapSemanticToSymbolChanges)
  → extract-imports (mapSemanticToImportEdges)
  → build-dependency-graph
  → group-changes
  → build-summaries (deterministic + analyzeRisk riskHints)
  → compress-context (token budget)
  → ReviewContext
```

### Folder structure

```
packages/context-builder/src/
  build-review-context.ts     # buildReviewContext()
  pipeline/run-pipeline.ts
  pipeline/stages/            # One stage per file
  parsers/                    # Language detection, symbols, imports
  graph/                      # Dependency graph + connected components
  interfaces/                 # SymbolExtractor, AstAnalyzer, FileContentResolver
  utils/                      # Token estimate, commit themes, comments
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
| `AstAnalyzer` | `NoopAstAnalyzer` | Full AST analysis, call graphs |
| `FileContentResolver` | Not wired | Fetch blobs from GitHub |

### Public API

```ts
import { buildReviewContext } from "@pr-review/context-builder";

const context = buildReviewContext(pullRequestData, {
  maxEstimatedTokens: 12_000,
  maxContextLinesPerHunk: 8,
});
```

Output type `ReviewContext` is defined in `@pr-review/shared` (`types/context.ts`).
