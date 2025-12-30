import { db } from "@/src/lib/db";
import { FEEDS } from "@/src/lib/feeds";
import { hashContent } from "@/src/lib/hash";
import { sendMail } from "@/src/lib/mail";
import { scrapeAllFeeds } from "@/src/lib/scrapper";

export async function GET() {
  try {
    console.log("🚀 Starting weekly feed scraping...");

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

    console.log("✅ Scraping completed:", {
      new: newPostsCount,
      updated: updatedPostsCount,
      unchanged: unchangedPostsCount,
    });

    if (
      process.env.GMAIL_USER &&
      process.env.GMAIL_PASSWORD &&
      process.env.MAIL_TO
    ) {
      try {
        await sendMail();
        console.log("📧 Email notification sent");
      } catch (emailError) {
        console.error("⚠️ Email sending failed:", emailError);
      }
    }

    return Response.json({
      ok: true,
      scraping: {
        new: newPostsCount,
        updated: updatedPostsCount,
        unchanged: unchangedPostsCount,
        total: newPostsCount + updatedPostsCount + unchangedPostsCount,
      },
    });
  } catch (error) {
    console.error("❌ Cron job failed:", error);
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
