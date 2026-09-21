/**
 * The checklist key for one required document. Keyed by the document's own
 * text, not its position: the catalog is refreshed, lists get reordered, and
 * a tick must stay on the document it was made against.
 */
export function docKey(oppId: string, doc: string): string {
  return `${oppId}::${doc}`;
}
