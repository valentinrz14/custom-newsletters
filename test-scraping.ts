// Script de test para verificar el scraping

import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";
import { FEEDS } from "./src/lib/feeds";
import { hashContent } from "./src/lib/hash";
import { scrapeAllFeeds } from "./src/lib/scrapper";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || "file:./prisma/db.sqlite",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const db = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Iniciando test de scraping...\n");

  // Verificar que los modelos existen
  console.log("📊 Verificando modelos de Prisma:");
  console.log("- db.feed:", typeof db.feed);
  console.log("- db.post:", typeof db.post);
  console.log("");

  // Crear/actualizar feeds
  console.log("📝 Creando feeds en la base de datos...");
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
    console.log(`  ✓ Feed: ${feedConfig.name}`);
  }
  console.log("");

  // Scrapear
  console.log("🔍 Scrapeando feeds...");
  const scrapeResults = await scrapeAllFeeds(FEEDS);
  console.log("");

  let newPostsCount = 0;
  let updatedPostsCount = 0;
  let unchangedPostsCount = 0;
  let successfulFeeds = 0;
  let failedFeeds = 0;

  // Procesar posts
  for (const result of scrapeResults) {
    const feedId = result.feedId;

    if (result.success) {
      console.log(`📰 Procesando ${result.posts.length} posts de ${feedId}...`);
      successfulFeeds++;

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
          lastSuccessfulScrapeAt: new Date(),
          scrapingStatus: "success",
          lastErrorMessage: null,
          consecutiveFailures: 0,
        },
      });
    } else {
      console.log(`❌ Error al scrapear ${feedId}: ${result.error}`);
      failedFeeds++;

      const currentFeed = await db.feed.findUnique({ where: { id: feedId } });
      await db.feed.update({
        where: { id: feedId },
        data: {
          lastScrapedAt: new Date(),
          scrapingStatus: "error",
          lastErrorMessage: result.error || "Unknown error",
          consecutiveFailures: (currentFeed?.consecutiveFailures || 0) + 1,
        },
      });
    }
  }

  console.log("");
  console.log("✅ Scraping completado!");
  console.log(`  📌 Posts nuevos: ${newPostsCount}`);
  console.log(`  🔄 Posts actualizados: ${updatedPostsCount}`);
  console.log(`  ⏸️  Posts sin cambios: ${unchangedPostsCount}`);
  console.log(
    `  📊 Total: ${newPostsCount + updatedPostsCount + unchangedPostsCount}`
  );
  console.log(`  ✅ Feeds exitosos: ${successfulFeeds}`);
  console.log(`  ❌ Feeds fallidos: ${failedFeeds}`);
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(() => {
    db.$disconnect();
  });
