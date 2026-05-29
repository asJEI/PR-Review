import type { FileContext, ReviewContext } from "@pr-review/shared";
import {
  mapCommentToLocation,
  resolveCommentLineNumber,
  toLineMappingInput,
  type LineMappingInput,
} from "@pr-review/line-mapping";

export function findFileContext(
  reviewContext: ReviewContext | undefined,
  file: string,
): FileContext | undefined {
  return reviewContext?.files.find((entry) => entry.filename === file);
}

export interface ResolveCommentLineOptions {
  patchesByFile?: LineMappingInput["patchesByFile"];
  pathAliases?: LineMappingInput["pathAliases"];
}

export function resolveCommentLine(
  file: string,
  lineHint: string | null,
  symbol: string | null,
  reviewContext: ReviewContext | undefined,
  options?: ResolveCommentLineOptions,
): number | null {
  if (!reviewContext) {
    return null;
  }

  const input = toLineMappingInput(
    reviewContext,
    options?.patchesByFile,
    options?.pathAliases,
  );

  return resolveCommentLineNumber(input, {
    file,
    line: null,
    symbol,
    lineHint,
  });
}

export function resolveCommentMapping(
  file: string,
  lineHint: string | null,
  symbol: string | null,
  line: number | null,
  reviewContext: ReviewContext | undefined,
  options?: ResolveCommentLineOptions,
) {
  if (!reviewContext) {
    return null;
  }

  const input = toLineMappingInput(
    reviewContext,
    options?.patchesByFile,
    options?.pathAliases,
  );

  return mapCommentToLocation(input, {
    file,
    line,
    symbol,
    lineHint,
  });
}
