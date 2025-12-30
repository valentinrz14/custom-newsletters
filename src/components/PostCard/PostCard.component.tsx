import { useState } from "react";
import {
  getRelativeTime,
  isNew,
  isRecentlyUpdated,
} from "@/src/lib/date-utils";
import type { PostCardProps } from "./PostCard.interfaces";
import styles from "./PostCard.module.css";

export function PostCard({ post }: PostCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const showNewBadge = isNew(post.firstSeenAt);
  const showUpdatedBadge =
    !showNewBadge && isRecentlyUpdated(post.firstSeenAt, post.lastUpdatedAt);

  const displayTitle = post.titleEs || post.title;
  const displayContent = post.contentEs || post.content;

  return (
    <button
      type="button"
      className={`group ${styles.card}`}
      onClick={() => setShowDetails(!showDetails)}
      aria-expanded={showDetails}
      data-testid="post-card"
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{displayTitle}</h3>
        <div className={styles.badges}>
          {showNewBadge && (
            <span className={`${styles.badge} ${styles.badgeNew}`}>Nuevo</span>
          )}
          {showUpdatedBadge && (
            <span className={`${styles.badge} ${styles.badgeUpdated}`}>
              Actualizado
            </span>
          )}
        </div>
      </div>
      <div className={styles.meta}>
        <time className={styles.date}>
          {getRelativeTime(post.lastUpdatedAt)}
        </time>
      </div>
      {displayContent && (
        <div className={styles.content}>
          {showDetails ? (
            <>
              <p>{displayContent}</p>
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.readMoreButton}
                onClick={(e) => e.stopPropagation()}
              >
                Leer nota original
              </a>
            </>
          ) : (
            <p>{displayContent.slice(0, 200)}...</p>
          )}
        </div>
      )}
    </button>
  );
}
