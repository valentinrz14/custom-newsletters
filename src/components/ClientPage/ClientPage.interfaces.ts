import type { Feed, Post } from "@prisma/client";

type FeedWithPosts = Feed & { posts: Post[] };

export interface ClientPageProps {
  feeds: FeedWithPosts[];
}
