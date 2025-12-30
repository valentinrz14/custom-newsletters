import { FEEDS } from "../lib/feeds";
import { scrapeFeed } from "../lib/scrapper";

async function verifyFeeds() {
  console.log(`Starting verification of ${FEEDS.length} feeds...`);

  for (const feed of FEEDS) {
    console.log(`\nTesting feed: ${feed.name} (${feed.url})...`);
    try {
      const result = await scrapeFeed(feed);
      if (result.success && result.posts.length > 0) {
        console.log(`✅ Success! Found ${result.posts.length} posts.`);
        console.log(`   Sample title: "${result.posts[0].title}"`);
        console.log(`   Sample url:   "${result.posts[0].url}"`);
      } else if (result.success) {
        console.warn(
          `⚠️  Warning: No posts found for ${feed.name}. Check selectors.`
        );
      } else {
        console.error(
          `❌ Error scraping ${feed.name}: ${result.error} (${result.errorType})`
        );
      }
    } catch (error) {
      console.error(`❌ Unexpected error scraping ${feed.name}:`, error);
    }
  }
}

verifyFeeds();
