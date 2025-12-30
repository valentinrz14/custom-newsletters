import { db } from "@/src/lib/db";
import { FEEDS } from "@/src/lib/feeds";
import { scrapeAllFeeds } from "@/src/lib/scrapper";
import { hashContent } from "@/src/lib/hash";

export async function GET() {
  try {
    for (const feedConfig of FEEDS) {
      await db.feed.upsert({
        where: { id: feedConfig.id },
        create: {
          id: feedConfig.id,
          name: feedConfig.name,
          url: feedConfig.url,
        },
        update: {
          name: feedConfig.name,
          url: feedConfig.url,
        },
      });
    }

    const scrapedData = await scrapeAllFeeds(FEEDS);

    let newPostsCount = 0;
    let updatedPostsCount = 0;
    let unchangedPostsCount = 0;

    for (const [feedId, scrapedPosts] of scrapedData.entries()) {
      for (const scrapedPost of scrapedPosts) {
        const contentHash = hashContent(scrapedPost.content);

        const existingPost = await db.post.findUnique({
          where: {
            feedId_url: {
              feedId,
              url: scrapedPost.url,
            },
          },
        });

        if (!existingPost) {
          await db.post.create({
            data: {
              feedId,
              title: scrapedPost.title,
              url: scrapedPost.url,
              content: scrapedPost.content,
              publishedAt: scrapedPost.publishedAt,
              contentHash,
              firstSeenAt: new Date(),
              lastUpdatedAt: new Date(),
            },
          });
          newPostsCount++;
        } else if (existingPost.contentHash !== contentHash) {
          await db.post.update({
            where: { id: existingPost.id },
            data: {
              title: scrapedPost.title,
              content: scrapedPost.content,
              contentHash,
              lastUpdatedAt: new Date(),
              publishedAt: scrapedPost.publishedAt || existingPost.publishedAt,
            },
          });
          updatedPostsCount++;
        } else {
          unchangedPostsCount++;
        }
      }
      await db.feed.update({
        where: { id: feedId },
        data: {
          lastScrapedAt: new Date(),
        },
      });
    }

    return Response.json({
      ok: true,
      stats: {
        new: newPostsCount,
        updated: updatedPostsCount,
        unchanged: unchangedPostsCount,
        total: newPostsCount + updatedPostsCount + unchangedPostsCount,
      },
    });
  } catch (error) {
    console.error("Scraping error:", error);
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
