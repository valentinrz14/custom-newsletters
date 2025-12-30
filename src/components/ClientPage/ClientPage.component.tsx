"use client";

import { EmptyState } from "../EmptyState/EmptyState.component";
import { FeedCard } from "../FeedCard/FeedCard.component";
import { SidebarNav } from "../SidebarNav/SidebarNav.component";
import type { ClientPageProps } from "./ClientPage.interfaces";

export function ClientPage({ feeds }: ClientPageProps) {
  const hasAnyPosts = feeds.length > 0;

  return (
    <main className="main-container layout-grid">
      <div className="sidebar-column">
        {hasAnyPosts && (
          <SidebarNav
            feeds={feeds.map((f) => ({
              id: f.id,
              name: f.name,
              category: f.category,
              scrapingStatus: f.scrapingStatus,
            }))}
          />
        )}
      </div>
      <div className="content-column">
        {!hasAnyPosts && <EmptyState />}
        <div className="feeds-container">
          {feeds.map((feed) => (
            <FeedCard key={feed.id} feed={feed} />
          ))}
        </div>
      </div>
    </main>
  );
}
