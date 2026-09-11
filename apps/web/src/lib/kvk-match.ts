/** Ruwe, verdraagzame naamvergelijking: hoofdletters/spaties/leestekens tellen niet mee. Puur, dus zonder 'server-only' apart getest. */
export function namesRoughlyMatch(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const na = norm(a);
  const nb = norm(b);
  return na.length > 0 && (na.includes(nb) || nb.includes(na));
}
