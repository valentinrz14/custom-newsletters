// Script de test para verificar el scraping
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { FEEDS } from "./src/lib/feeds";
import { scrapeAllFeeds } from "./src/lib/scrapper";
import { hashContent } from "./src/lib/hash";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || "file:./prisma/db.sqlite",
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
      },
      update: {
        name: feedConfig.name,
        url: feedConfig.url,
      },
    });
    console.log(`  ✓ Feed: ${feedConfig.name}`);
  }
  console.log("");

  // Scrapear
  console.log("🔍 Scrapeando feeds...");
  const scrapedData = await scrapeAllFeeds(FEEDS);
  console.log("");

  let newPostsCount = 0;
  let updatedPostsCount = 0;
  let unchangedPostsCount = 0;

  // Procesar posts
  for (const [feedId, scrapedPosts] of scrapedData.entries()) {
    console.log(`📰 Procesando ${scrapedPosts.length} posts de ${feedId}...`);

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

  console.log("");
  console.log("✅ Scraping completado!");
  console.log(`  📌 Posts nuevos: ${newPostsCount}`);
  console.log(`  🔄 Posts actualizados: ${updatedPostsCount}`);
  console.log(`  ⏸️  Posts sin cambios: ${unchangedPostsCount}`);
  console.log(
    `  📊 Total: ${newPostsCount + updatedPostsCount + unchangedPostsCount}`
  );
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(() => {
    db.$disconnect();
  });
