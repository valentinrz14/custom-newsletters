import { render, screen } from "@testing-library/react";
import { PostCard } from "./PostCard.component";
import type { Post } from "@prisma/client";

const mockPost: Post = {
  id: "1",
  feedId: "feed-1",
  title: "Test Post Title",
  url: "https://example.com/post",
  content: "This is a test post content that should be displayed.",
  publishedAt: new Date("2023-10-01T12:00:00Z"),
  contentHash: "hash",
  firstSeenAt: new Date("2023-10-01T12:00:00Z"),
  lastUpdatedAt: new Date("2023-10-01T12:00:00Z"),
  createdAt: new Date("2023-10-01T12:00:00Z"),
  updatedAt: new Date("2023-10-01T12:00:00Z"),
};

describe("PostCard", () => {
  it("renders post title and content", () => {
    render(<PostCard post={mockPost} />);

    const titleLink = screen.getByRole("link", { name: /Test Post Title/i });
    expect(titleLink).toBeInTheDocument();
    expect(titleLink).toHaveAttribute("href", "https://example.com/post");

    expect(
      screen.getByText(/This is a test post content/i)
    ).toBeInTheDocument();
  });

  it("shows 'Nuevo' badge if post is new", () => {
    // Mock isNew logic effectively by using a very recent date
    const newPost = { ...mockPost, firstSeenAt: new Date() };
    render(<PostCard post={newPost} />);
    expect(screen.getByText("Nuevo")).toBeInTheDocument();
  });
});
