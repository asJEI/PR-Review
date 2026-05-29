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
