import * as cheerio from "cheerio";

const CANDIDATES = [
  "https://react.statuscode.com",
  "https://thisweekinreact.com",
  "https://frontendfoc.us",
  "https://www.joshwcomeau.com/",
  "https://reactnativenewsletter.com",
  "https://mobiledevweekly.com",
  "https://nodeweekly.com",
  "https://javascriptweekly.com",
  "https://deno.com/blog",
  "https://edgeweekly.com",
  "https://devopsish.com",
  "https://increment.com",
  "https://swiftbysundell.com/newsletter/",
  "https://stratechery.com",
  "https://softwareleadweekly.com",
  "https://github.blog/changelog/",
];

async function findFeed() {
  console.log("Searching for feeds...");

  for (const url of CANDIDATES) {
    try {
      // Try common RSS paths first blindly? Or fetch main page and look for link tag
      const res = await fetch(url);
      if (!res.ok) {
        console.log(`❌ ${url}: Failed to fetch (${res.status})`);
        continue;
      }
      const html = await res.text();
      const $ = cheerio.load(html);

      let feedUrl =
        $('link[type="application/rss+xml"]').attr("href") ||
        $('link[type="application/atom+xml"]').attr("href") ||
        $('link[type="application/json"]').attr("href"); // fallback?

      if (!feedUrl) {
        // Try guessing common paths
        const guesses = [
          "/rss",
          "/feed",
          "/rss.xml",
          "/feed.xml",
          "/issues.rss",
        ];
        for (const guess of guesses) {
          const guessUrl = new URL(guess, url).toString();
          try {
            const gRes = await fetch(guessUrl, { method: "HEAD" });
            if (
              gRes.ok &&
              (gRes.headers.get("content-type")?.includes("xml") ||
                gRes.headers.get("content-type")?.includes("rss"))
            ) {
              feedUrl = guessUrl;
              break;
            }
          } catch {}
        }
      }

      if (feedUrl) {
        // Normalize relative URLs
        if (feedUrl.startsWith("/")) {
          feedUrl = new URL(feedUrl, url).toString();
        }
        console.log(`✅ ${url} => ${feedUrl}`);
      } else {
        console.log(`⚠️  ${url}: No feed found`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.log(`❌ ${url}: Error ${message}`);
    }
  }
}

findFeed();
