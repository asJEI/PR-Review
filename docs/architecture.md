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

## `packages/diff-parser` — Unified diff parser

Pure parser for GitHub unified diff patches. No language awareness or business logic.

```
packages/diff-parser/src/
  parse-unified-diff.ts   # parseUnifiedDiff(filename, patch)
  types.ts                # DiffHunk, DiffLine, ParsedFileDiff
```

---

## `packages/context-builder` — Engineering context pipeline

Transforms `PullRequestData` into `ReviewContext` for `packages/ai`. No LLM calls, no GitHub I/O, no UI.

### Pipeline

```
PullRequestData
  → parse-diffs (via diff-parser)
  → extract-symbols (heuristic SymbolExtractor)
  → extract-imports
  → build-dependency-graph
  → group-changes
  → build-summaries (deterministic)
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
| `SymbolExtractor` | `HeuristicSymbolExtractor` | Tree-sitter / TS compiler |
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
