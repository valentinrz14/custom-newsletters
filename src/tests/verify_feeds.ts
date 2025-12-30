import { FEEDS } from "../lib/feeds";
import { scrapeFeed } from "../lib/scrapper";

async function verifyFeeds() {
  console.log(`Starting verification of ${FEEDS.length} feeds...`);

  for (const feed of FEEDS) {
    console.log(`\nTesting feed: ${feed.name} (${feed.url})...`);
    try {
      const posts = await scrapeFeed(feed);
      if (posts.length > 0) {
        console.log(`✅ Success! Found ${posts.length} posts.`);
        console.log(`   Sample title: "${posts[0].title}"`);
        console.log(`   Sample url:   "${posts[0].url}"`);
      } else {
        console.warn(
          `⚠️  Warning: No posts found for ${feed.name}. Check selectors.`
        );
      }
    } catch (error) {
      console.error(`❌ Error scraping ${feed.name}:`, error);
    }
  }
}

verifyFeeds();
