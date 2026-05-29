import { SummaryParseError } from "./errors.js";

const FENCED_JSON = /```(?:json)?\s*([\s\S]*?)```/i;

export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new SummaryParseError("Empty LLM response", "");
  }

  const fenced = trimmed.match(FENCED_JSON);
  const candidate = fenced?.[1]?.trim() ?? trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const slice = candidate.slice(start, end + 1);
      try {
        return JSON.parse(slice);
      } catch {
        throw new SummaryParseError("Failed to parse JSON from LLM response", slice.slice(0, 500));
      }
    }
    throw new SummaryParseError("No JSON object found in LLM response", candidate.slice(0, 500));
  }
}
