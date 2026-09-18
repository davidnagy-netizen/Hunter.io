/** Browser-safe scoring helpers shared by future views. */
export function scoreBand(score) {
  if (score == null) return "unknown";
  if (score >= 80) return "strong";
  if (score >= 60) return "good";
  if (score >= 40) return "possible";
  return "weak";
}
