"use client";

import { useState, memo } from "react";
import type { Post } from "@prisma/client";
import { formatDate } from "@/src/lib/date-utils";
import { PostCard } from "../PostCard/PostCard.component";
import styles from "./FeedCard.module.css";
import type { FeedCardProps } from "./FeedCardProps.interfaces";

export const FeedCard = memo(function FeedCard({ feed }: FeedCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showError, setShowError] = useState(false);

  if (feed.posts.length === 0) return null;

  const hasMore = feed.posts.length > 3;
  const displayedPosts =
    isExpanded || !hasMore ? feed.posts : feed.posts.slice(0, 3);

  const isHealthy = feed.scrapingStatus === "success";
  const hasError = feed.scrapingStatus === "error";

  return (
    <section id={feed.id} className={`${styles.section} scroll-mt-24`}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{feed.name}</h2>
          <div className={styles.statusBadge}>
            <span
              className={`${styles.indicator} ${
                isHealthy ? styles.indicatorSuccess : styles.indicatorError
              }`}
              title={isHealthy ? "Operativo" : "Error en actualización"}
            />
          </div>
        </div>
        {feed.lastSuccessfulScrapeAt && (
          <p className={styles.date}>
            Última actualización exitosa:{" "}
            {formatDate(new Date(feed.lastSuccessfulScrapeAt))}
          </p>
        )}
        {hasError && feed.lastErrorMessage && (
          <div className={styles.errorSection}>
            <button
              type="button"
              onClick={() => setShowError(!showError)}
              className={styles.errorToggle}
            >
              <span className={styles.errorIcon}>⚠️</span>
              <span>
                Error al actualizar ({feed.consecutiveFailures} fallo
                {feed.consecutiveFailures > 1 ? "s" : ""})
              </span>
              <svg
                role="img"
                aria-label="Expandir"
                className={`${styles.expandIcon} ${
                  showError ? styles.expandIconRotated : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {showError && (
              <div className={styles.errorDetails}>
                <code className={styles.errorMessage}>
                  {feed?.lastErrorMessage}
                </code>
                {feed.lastScrapedAt && (
                  <p className={styles.errorTimestamp}>
                    Último intento: {formatDate(new Date(feed.lastScrapedAt))}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </header>
      <div className={styles.postsContainer}>
        {displayedPosts.map((post: Post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`group ${styles.expandButton}`}
        >
          <span>
            {isExpanded ? "Ver menos" : `Ver ${feed.posts.length - 3} más`}
          </span>
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            role="img"
          >
            <title>{isExpanded ? "Collapse" : "Expand"}</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}
    </section>
  );
});
