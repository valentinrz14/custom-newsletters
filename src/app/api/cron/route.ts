import { db } from "@/src/lib/db";
import { FEEDS } from "@/src/lib/feeds";
import { hashContent } from "@/src/lib/hash";
import { sendMail } from "@/src/lib/mail";
import { scrapeAllFeeds } from "@/src/lib/scrapper";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error("❌ Unauthorized cron request");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    for (const feedConfig of FEEDS) {
      await db.feed.upsert({
        where: { id: feedConfig.id },
        create: {
          id: feedConfig.id,
          name: feedConfig.name,
          url: feedConfig.url,
          category: feedConfig.category,
        },
        update: {
          name: feedConfig.name,
          url: feedConfig.url,
          category: feedConfig.category,
        },
      });
    }

    const scrapeResults = await scrapeAllFeeds(FEEDS);

    let newPostsCount = 0;
    let updatedPostsCount = 0;
    let unchangedPostsCount = 0;
    let successfulFeeds = 0;
    let failedFeeds = 0;

    for (const result of scrapeResults) {
      const feedId = result.feedId;

      // Update feed status based on scraping result
      const currentFeed = await db.feed.findUnique({ where: { id: feedId } });

      if (result.success) {
        await db.feed.update({
          where: { id: feedId },
          data: {
            lastScrapedAt: new Date(),
            lastSuccessfulScrapeAt: new Date(),
            scrapingStatus: "success",
            lastErrorMessage: null,
            consecutiveFailures: 0,
          },
        });
        successfulFeeds++;

        // Process posts
        for (const scrapedPost of result.posts) {
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
                publishedAt:
                  scrapedPost.publishedAt || existingPost.publishedAt,
              },
            });
            updatedPostsCount++;
          } else {
            unchangedPostsCount++;
          }
        }
      } else {
        // Handle scraping failure
        const consecutiveFailures =
          (currentFeed?.consecutiveFailures || 0) + 1;

        await db.feed.update({
          where: { id: feedId },
          data: {
            lastScrapedAt: new Date(),
            scrapingStatus: "error",
            lastErrorMessage: result.error || "Unknown error",
            consecutiveFailures,
          },
        });
        failedFeeds++;
      }
    }

    console.log("✅ Scraping completed:", {
      new: newPostsCount,
      updated: updatedPostsCount,
      unchanged: unchangedPostsCount,
      successful: successfulFeeds,
      failed: failedFeeds,
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
      feeds: {
        successful: successfulFeeds,
        failed: failedFeeds,
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
