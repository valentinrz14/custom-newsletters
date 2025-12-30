/**
 * Genera un hash simple del contenido para detectar cambios
 */
export function hashContent(content: string): string {
  const normalized = content.trim().replace(/\s+/g, " ").toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return hash.toString(36);
}
