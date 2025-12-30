import { render, screen, fireEvent } from "@testing-library/react";
import { FeedCard } from "./FeedCard.component";
import type { Feed, Post } from "@prisma/client";

const mockFeed: Feed & { posts: Post[] } = {
  id: "bun",
  name: "Bun",
  url: "https://bun.com",
  lastScrapedAt: new Date(),
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
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
};

describe("FeedCard", () => {
  it("renders feed title and initial posts", () => {
    render(<FeedCard feed={mockFeed} />);

    expect(screen.getByText("Bun")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(5); // Should show 5 initially
  });

  it("expands to show all posts when button is clicked", () => {
    render(<FeedCard feed={mockFeed} />);

    const button = screen.getByRole("button", { name: /Ver 5 más/i });
    fireEvent.click(button);

    expect(screen.getAllByRole("article")).toHaveLength(10);
    expect(screen.getByText("Ver menos")).toBeInTheDocument();
  });
});
