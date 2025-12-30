import type { Feed, Post } from "@prisma/client";

export interface FeedCardProps {
  feed: Feed & {
    posts: Post[];
  };
}
