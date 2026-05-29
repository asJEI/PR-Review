const NOISE_PATH_PATTERNS: RegExp[] = [
  /(?:^|\/)vendor\//i,
  /(?:^|\/)dist\//i,
  /(?:^|\/)node_modules\//i,
  /(?:^|\/)build\//i,
  /(?:^|\/)generated\//i,
  /(?:^|\/)__generated__\//i,
  /(?:^|\/)package-lock\.json$/i,
  /(?:^|\/)pnpm-lock\.yaml$/i,
  /(?:^|\/)yarn\.lock$/i,
  /\.lock$/i,
  /\.min\.js$/i,
  /\.map$/i,
];

export function isNoisePath(filename: string): boolean {
  return NOISE_PATH_PATTERNS.some((pattern) => pattern.test(filename));
}

export function noisePathReason(filename: string): string {
  if (/package-lock\.json$|pnpm-lock\.yaml$|yarn\.lock$|\.lock$/i.test(filename)) {
    return "lock file";
  }

  if (/\.min\.js$|\.map$/i.test(filename)) {
    return "generated/minified asset";
  }

  if (/(?:^|\/)(vendor|dist|node_modules|build|generated|__generated__)\//i.test(filename)) {
    return "vendor/dist/generated path";
  }

  return "noise path pattern";
}
