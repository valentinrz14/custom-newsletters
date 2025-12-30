import { afterEach, describe, expect, it } from "bun:test";
import type { Feed, Post } from "@prisma/client";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FeedCard } from "./FeedCard.component";

afterEach(() => {
  cleanup();
});

const mockFeed: Feed & { posts: Post[] } = {
  id: "bun",
  name: "Bun",
  url: "https://bun.com",
  category: "Tech",
  lastScrapedAt: new Date(),
  lastSuccessfulScrapeAt: new Date(),
  scrapingStatus: "success",
  lastErrorMessage: null,
  consecutiveFailures: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  posts: Array.from({ length: 10 }, (_, i) => ({
    id: String(i),
    feedId: "bun",
    title: `Post ${i}`,
    url: `https://bun.com/post/${i}`,
    content: `Content ${i}`,
    publishedAt: new Date(),
    contentHash: `hash-${i}`,
    firstSeenAt: new Date(),
    lastUpdatedAt: new Date(),
    isRead: false,
    readAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
};

describe("FeedCard", () => {
  it("renders feed title and initial posts", () => {
    render(<FeedCard feed={mockFeed} />);

    expect(screen.getByText("Bun")).toBeInTheDocument();
    expect(screen.getAllByTestId("post-card")).toHaveLength(3);
  });

  it("expands to show all posts when button is clicked", () => {
    render(<FeedCard feed={mockFeed} />);

    const button = screen.getByRole("button", { name: /Ver 7 más/i });
    fireEvent.click(button);

    expect(screen.getAllByTestId("post-card")).toHaveLength(10);
    expect(screen.getByText("Ver menos")).toBeInTheDocument();
  });
});
