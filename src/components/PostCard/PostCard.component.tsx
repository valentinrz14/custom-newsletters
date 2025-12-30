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
  const [isRead, setIsRead] = useState(post.isRead);
  const showNewBadge = isNew(post.firstSeenAt);
  const showUpdatedBadge =
    !showNewBadge && isRecentlyUpdated(post.firstSeenAt, post.lastUpdatedAt);

  const handleClick = async () => {
    setShowDetails(!showDetails);

    // Mark as read when expanding details
    if (!isRead && !showDetails) {
      setIsRead(true);
      try {
        await fetch(`/api/posts/${post.id}/read`, { method: "POST" });
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }
  };

  return (
    <div
      className={`group ${styles.card}`}
      style={{ opacity: isRead ? 0.6 : 1 }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-expanded={showDetails}
      data-testid="post-card"
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{post.title}</h3>
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
        <time className={styles.date} suppressHydrationWarning>
          {getRelativeTime(post.lastUpdatedAt)}
        </time>
      </div>
      {post.content && (
        <div className={styles.content}>
          {showDetails ? (
            <>
              <p>{post.content}</p>
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
            <p>{post.content.slice(0, 200)}...</p>
          )}
        </div>
      )}
    </div>
  );
}
