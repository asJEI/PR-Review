import type { BuildContextOptions } from "@pr-review/shared";

export const DEFAULT_BUILD_OPTIONS: Required<BuildContextOptions> = {
  maxEstimatedTokens: 12_000,
  maxContextLinesPerHunk: 8,
  maxSymbolsPerFile: 20,
  includeExistingComments: true,
};

export function resolveBuildOptions(
  options?: BuildContextOptions,
): Required<BuildContextOptions> {
  return {
    ...DEFAULT_BUILD_OPTIONS,
    ...options,
  };
}
