import { EmptyState } from "@/src/components/EmptyState.component";
import { FeedCard } from "@/src/components/FeedCard.component";
import { SidebarNav } from "@/src/components/SidebarNav.component";
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
    orderBy: {
      name: "asc",
    },
  });

  const activeFeeds = feeds.filter((feed) => feed.posts.length > 0);
  const hasAnyPosts = activeFeeds.length > 0;

  return (
    <main className="main-container layout-grid">
      <div className="sidebar-column">
        <div className="sticky top-8">
          {hasAnyPosts && (
            <SidebarNav
              feeds={activeFeeds.map((f) => ({ id: f.id, name: f.name }))}
            />
          )}
        </div>
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
