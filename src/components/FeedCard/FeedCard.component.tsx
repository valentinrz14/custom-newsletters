"use client";

import { useState } from "react";
import { formatDate } from "@/src/lib/date-utils";
import { PostCard } from "../PostCard/PostCard.component";
import styles from "./FeedCard.module.css";
import type { FeedCardProps } from "./FeedCardProps.interfaces";

export function FeedCard({ feed }: FeedCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (feed.posts.length === 0) return null;

  const hasMore = feed.posts.length > 3;
  const displayedPosts =
    isExpanded || !hasMore ? feed.posts : feed.posts.slice(0, 3);

  return (
    <section id={feed.id} className={`${styles.section} scroll-mt-24`}>
      <header className={styles.header}>
        <h2 className={styles.title}>{feed.name}</h2>
        {feed.lastScrapedAt && (
          <p className={styles.date}>
            Última actualización: {formatDate(new Date(feed.lastScrapedAt))}
          </p>
        )}
      </header>
      <div className={styles.postsContainer}>
        {displayedPosts.map((post) => (
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
}
