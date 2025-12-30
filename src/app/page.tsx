import { ClientPage } from "@/src/components/ClientPage/ClientPage.component";
import { db } from "@/src/lib/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  try {
    const feeds = await db.feed.findMany({
      include: {
        posts: {
          orderBy: {
            lastUpdatedAt: "desc",
          },
          take: 20,
        },
      },
    });

    type FeedWithPosts = (typeof feeds)[number];

    const activeFeeds = feeds
      .filter((feed: FeedWithPosts) => feed.posts.length > 0)
      .sort((a: FeedWithPosts, b: FeedWithPosts) => {
        const aLastUpdate = a.posts[0]?.lastUpdatedAt.getTime() || 0;
        const bLastUpdate = b.posts[0]?.lastUpdatedAt.getTime() || 0;
        return bLastUpdate - aLastUpdate;
      });

    return <ClientPage feeds={activeFeeds} />;
  } catch (error) {
    console.error("Error loading feeds:", error);
    // Return empty state if database fails
    return <ClientPage feeds={[]} />;
  }
}
