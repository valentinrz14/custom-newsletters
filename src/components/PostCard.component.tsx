import type { Post } from "@prisma/client";
import {
  getRelativeTime,
  isNew,
  isRecentlyUpdated,
} from "@/src/lib/date-utils";

export interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const showNewBadge = isNew(post.firstSeenAt);
  const showUpdatedBadge =
    !showNewBadge && isRecentlyUpdated(post.firstSeenAt, post.lastUpdatedAt);

  return (
    <article className="group post-card">
      <div className="post-header">
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="post-title"
        >
          {post.title}
        </a>
        <div className="post-badges">
          {showNewBadge && <span className="badge badge-new">Nuevo</span>}
          {showUpdatedBadge && (
            <span className="badge badge-updated">Actualizado</span>
          )}
        </div>
      </div>

      <div className="post-meta">
        <time className="post-date">{getRelativeTime(post.lastUpdatedAt)}</time>
      </div>

      {post.content && (
        <p className="post-content">{post.content.slice(0, 200)}...</p>
      )}
    </article>
  );
}
