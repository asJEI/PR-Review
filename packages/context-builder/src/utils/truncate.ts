export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3)}...`;
}

export function firstLine(text: string): string {
  const line = text.split(/\r?\n/)[0] ?? text;
  return line.trim();
}
