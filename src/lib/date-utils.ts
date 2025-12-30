/**
 * Formatea una fecha de manera amigable en español
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Calcula el tiempo relativo desde una fecha (ej: "hace 2 días")
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes === 0 ? "Ahora mismo" : `Hace ${diffMinutes}m`;
    }
    return `Hace ${diffHours}h`;
  }

  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Hace ${weeks} ${weeks === 1 ? "semana" : "semanas"}`;
  }

  const months = Math.floor(diffDays / 30);
  return `Hace ${months} ${months === 1 ? "mes" : "meses"}`;
}

/**
 * Determina si un post es "nuevo" (visto en los últimos 7 días)
 */
export function isNew(firstSeenAt: Date): boolean {
  const diffDays = Math.floor(
    (Date.now() - firstSeenAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays <= 7;
}

/**
 * Determina si un post fue "actualizado recientemente" (últimos 7 días)
 */
export function isRecentlyUpdated(
  firstSeenAt: Date,
  lastUpdatedAt: Date
): boolean {
  // Solo es "actualizado" si lastUpdatedAt es diferente de firstSeenAt
  if (lastUpdatedAt.getTime() === firstSeenAt.getTime()) return false;

  const diffDays = Math.floor(
    (Date.now() - lastUpdatedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays <= 7;
}
