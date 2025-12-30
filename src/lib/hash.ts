/**
 * Genera un hash simple del contenido para detectar cambios
 */
export function hashContent(content: string): string {
  // Normalizar el contenido (quitar espacios extras, saltos de línea múltiples, etc.)
  const normalized = content.trim().replace(/\s+/g, " ").toLowerCase();

  // Hash simple basado en códigos de caracteres
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convertir a entero de 32 bits
  }

  return hash.toString(36);
}
