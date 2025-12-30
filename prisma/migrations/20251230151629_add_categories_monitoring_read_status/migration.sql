-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Feed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Tech',
    "lastScrapedAt" DATETIME,
    "lastSuccessfulScrapeAt" DATETIME,
    "scrapingStatus" TEXT NOT NULL DEFAULT 'unknown',
    "lastErrorMessage" TEXT,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Feed" ("createdAt", "id", "lastScrapedAt", "name", "updatedAt", "url") SELECT "createdAt", "id", "lastScrapedAt", "name", "updatedAt", "url" FROM "Feed";
DROP TABLE "Feed";
ALTER TABLE "new_Feed" RENAME TO "Feed";
CREATE INDEX "Feed_scrapingStatus_idx" ON "Feed"("scrapingStatus");
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "content" TEXT,
    "publishedAt" DATETIME,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentHash" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Post_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("content", "contentHash", "createdAt", "feedId", "firstSeenAt", "id", "lastUpdatedAt", "publishedAt", "title", "updatedAt", "url") SELECT "content", "contentHash", "createdAt", "feedId", "firstSeenAt", "id", "lastUpdatedAt", "publishedAt", "title", "updatedAt", "url" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE INDEX "Post_feedId_idx" ON "Post"("feedId");
CREATE INDEX "Post_lastUpdatedAt_idx" ON "Post"("lastUpdatedAt");
CREATE INDEX "Post_isRead_idx" ON "Post"("isRead");
CREATE UNIQUE INDEX "Post_feedId_url_key" ON "Post"("feedId", "url");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
