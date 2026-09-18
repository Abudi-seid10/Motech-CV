/** A short, unique-enough id for client-side list items (custom sections, etc). Not a UUID — doesn't need to be. */
export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
