/** "vip, warm , " → ["vip", "warm"]. The server dedupes and caps the list; this only splits and trims. */
export function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
