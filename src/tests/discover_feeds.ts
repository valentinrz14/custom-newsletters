import * as cheerio from "cheerio";

const CANDIDATES = [
  "https://react.statuscode.com",
  "https://thisweekinreact.com",
  "https://frontendfoc.us",
  "https://www.joshwcomeau.com/newsletter/",
  "https://reactnativenewsletter.com",
  // "https://expo.dev/blog", // Already added
  "https://mobiledevweekly.com",
  "https://nodeweekly.com",
  "https://javascriptweekly.com",
  "https://backendfoc.us",
  // "https://bun.sh/blog", // Already added
  "https://deno.com/newsletter",
  "https://edgeweekly.com",
  "https://devopsish.com",
  "https://increment.com",
  "https://platformengineeringweekly.com",
  "https://www.macstories.net",
  "https://swiftbysundell.com/newsletter/",
  "https://www.lennysnewsletter.com",
  "https://stratechery.com",
  "https://softwareleadweekly.com",
  "https://testingjavascript.com/newsletter",
  "https://perf.email",
  "https://github.blog/changelog/",
  "https://hackernewsletter.com",
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
    } catch (error) {
      console.log(`❌ ${url}: Error ${error.message}`);
    }
  }
}

findFeed();
