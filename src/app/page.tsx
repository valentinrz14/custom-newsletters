import { EmptyState } from "@/src/components/EmptyState/EmptyState.component";
import { FeedCard } from "@/src/components/FeedCard/FeedCard.component";
import { SidebarNav } from "@/src/components/SidebarNav/SidebarNav.component";
import { db } from "@/src/lib/db";

export default async function Page() {
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

  type FeedWithPosts = typeof feeds[number];

  const activeFeeds = feeds
    .filter((feed: FeedWithPosts) => feed.posts.length > 0)
    .sort((a: FeedWithPosts, b: FeedWithPosts) => {
      const aLastUpdate = a.posts[0]?.lastUpdatedAt.getTime() || 0;
      const bLastUpdate = b.posts[0]?.lastUpdatedAt.getTime() || 0;
      return bLastUpdate - aLastUpdate;
    });

  const hasAnyPosts = activeFeeds.length > 0;

  return (
    <main className="main-container layout-grid">
      <div className="sidebar-column">
        {hasAnyPosts && (
          <SidebarNav
            feeds={activeFeeds.map((f) => ({ id: f.id, name: f.name }))}
          />
        )}
      </div>
      <div className="content-column">
        {!hasAnyPosts && <EmptyState />}
        <div className="feeds-container">
          {activeFeeds.map((feed) => (
            <FeedCard key={feed.id} feed={feed} />
          ))}
        </div>
      </div>
    </main>
  );
}
