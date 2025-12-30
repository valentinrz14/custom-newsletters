"use client";

import { useState } from "react";
import type { Feed, Post } from "@prisma/client";
import { PostCard } from "./PostCard.component";
import { formatDate } from "@/src/lib/date-utils";

export interface FeedCardProps {
  feed: Feed & {
    posts: Post[];
  };
}

export function FeedCard({ feed }: FeedCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (feed.posts.length === 0) return null;

  const hasMore = feed.posts.length > 5;
  const displayedPosts =
    isExpanded || !hasMore ? feed.posts : feed.posts.slice(0, 5);

  return (
    <section id={feed.id} className="feed-section scroll-mt-24">
      <header className="feed-header">
        <h2 className="feed-title">{feed.name}</h2>
        {feed.lastScrapedAt && (
          <p className="feed-date">
            Última actualización: {formatDate(new Date(feed.lastScrapedAt))}
          </p>
        )}
      </header>

      <div className="posts-container">
        {displayedPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="expand-button group"
        >
          <span>
            {isExpanded ? "Ver menos" : `Ver ${feed.posts.length - 5} más`}
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
