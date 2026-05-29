const SPECULATIVE_PATTERNS = [
  /\bmight be\b/i,
  /\bcould be\b/i,
  /\bmay cause\b/i,
  /\bpossibly\b/i,
  /\bperhaps\b/i,
  /\bmight have\b/i,
];

export function isSpeculativeClaim(text: string): boolean {
  return SPECULATIVE_PATTERNS.some((pattern) => pattern.test(text));
}

export function hasEvidenceAnchor(text: string, file: string, symbol: string | null): boolean {
  if (text.includes(file)) {
    return true;
  }
  if (symbol && text.includes(symbol)) {
    return true;
  }
  return false;
}

export function shouldDropSpeculativeComment(
  comment: string,
  file: string,
  symbol: string | null,
): boolean {
  if (!isSpeculativeClaim(comment)) {
    return false;
  }
  return !hasEvidenceAnchor(comment, file, symbol);
}
