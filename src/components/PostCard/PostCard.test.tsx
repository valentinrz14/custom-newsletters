import { afterEach, describe, expect, it } from "bun:test";
import type { Post } from "@prisma/client";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PostCard } from "./PostCard.component";

afterEach(() => {
  cleanup();
});

const mockPost: Post = {
  id: "1",
  title: "Test Post Title",
  url: "https://example.com/post",
  content: "This is a test post content that should be displayed.",
  createdAt: new Date("2023-01-01"),
  updatedAt: new Date("2023-01-01"),
  firstSeenAt: new Date("2023-10-01"),
  lastUpdatedAt: new Date("2023-10-01"),
  feedId: "feed-1",
  publishedAt: new Date("2023-01-01"),
  contentHash: "mock-hash",
  isRead: false,
  readAt: null,
};

describe("PostCard", () => {
  it("renders post title and content", () => {
    render(<PostCard post={mockPost} />);

    const title = screen.getByRole("heading", { name: /Test Post Title/i });
    expect(title).toBeInTheDocument();

    expect(screen.getByText(/This is a test post/i)).toBeInTheDocument();
  });

  it("expands details on click", () => {
    render(<PostCard post={mockPost} />);

    const card = screen.getByRole("button", { name: /Test Post Title/i });
    fireEvent.click(card);

    const link = screen.getByRole("link", { name: /Leer nota original/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", mockPost.url);
  });

  it("shows 'Nuevo' badge if post is new", () => {
    const newPost = { ...mockPost, firstSeenAt: new Date() };
    render(<PostCard post={newPost} />);
    expect(screen.getByText("Nuevo")).toBeInTheDocument();
  });
});
