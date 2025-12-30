import * as cheerio from "cheerio";
import { decode } from "he";
import type { FeedConfig } from "./feeds";

export interface ScrapedPost {
  title: string;
  url: string;
  content: string;
  publishedAt: Date | null;
}

export interface ScrapeResult {
  feedId: string;
  success: boolean;
  posts: ScrapedPost[];
  error?: string;
  errorType?: "network" | "parse" | "timeout" | "ssl" | "unknown";
}

/**
 * Normaliza una URL relativa convirtiéndola en absoluta
 */
function normalizeUrl(url: string, baseUrl: string): string {
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) {
    const base = new URL(baseUrl);
    return `${base.protocol}//${base.host}${url}`;
  }
  return `${baseUrl}/${url}`;
}

/**
 * Limpia el contenido HTML y extrae solo texto
 */
function cleanHtmlContent(content: string): string {
  if (!content) return "";

  if (content.includes("<") && content.includes(">")) {
    const $ = cheerio.load(content);
    content = $.text();
  }

  content = decode(content);

  const footerPatterns = [
    /The post .+ appeared first on .+\./gi,
    /Read more on .+\./gi,
    /Continue reading on .+\./gi,
    /This article was originally published on .+\./gi,
  ];

  for (const pattern of footerPatterns) {
    content = content.replace(pattern, "");
  }

  content = content.replace(/\s+/g, " ").trim();

  return content;
}

/**
 * Intenta parsear una fecha desde diferentes formatos
 */
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    if (!Number.isNaN(date.getTime())) return date;
  } catch {}

  return null;
}

async function fetchWithRetry(
  url: string,
  retries = 3,
  timeout = 10000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; FeedAggregator/1.0; +https://github.com)",
        },
      });

      clearTimeout(timeoutId);

      if (res.ok) return res;

      // If not ok but not a network error, throw immediately
      if (res.status >= 400) {
        throw new Error(
          `HTTP ${res.status}: ${res.statusText} for URL: ${url}`
        );
      }
    } catch (e) {
      const error = e as Error & { cause?: Error & { code?: string } };

      // Log detailed error info
      console.error(
        `Fetch attempt ${i + 1}/${retries} failed for ${url}:`,
        error.message
      );

      // Check for SSL/certificate errors
      const isCertError =
        error.cause?.code === "SELF_SIGNED_CERT_IN_CHAIN" ||
        error.cause?.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
        error.message.includes("certificate");

      // Don't retry on certain errors
      if (error.message.includes("404") || error.message.includes("410")) {
        throw new Error(`Feed not found (${error.message})`);
      }

      if (isCertError) {
        throw new Error(
          `SSL certificate error for ${url}. This feed may have an invalid or self-signed certificate.`
        );
      }

      // On last retry, throw with more context
      if (i === retries - 1) {
        throw new Error(
          `Failed to fetch ${url} after ${retries} retries: ${error.message}`
        );
      }
    }

    // Wait before retrying with exponential backoff
    await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
  }

  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

/**
 * Extrae posts de un feed específico usando sus selectores
 */
export async function scrapeFeed(feed: FeedConfig): Promise<ScrapeResult> {
  try {
    const response = await fetchWithRetry(feed.url);
    if (!response.ok) {
      return {
        feedId: feed.id,
        success: false,
        posts: [],
        error: `HTTP ${response.status}: ${response.statusText}`,
        errorType: "network",
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html, { xmlMode: feed.isXml });

    const posts: ScrapedPost[] = [];
    const containers = feed.selectors.container
      ? $(feed.selectors.container)
      : $("body");

    containers.slice(0, 10).each((_, container) => {
      const $container = $(container);

      const titleElement = $container.find(feed.selectors.title).first();
      const title = decode(titleElement.text().trim());
      if (!title) return;

      let linkElement = titleElement.find("a");
      if (linkElement.length === 0) {
        linkElement = $container.find(feed.selectors.link).first();
      }

      let href = linkElement.attr("href");

      if (!href && feed.isXml) {
        href = linkElement.text().trim();
      }

      if (!href) return;

      const url = normalizeUrl(href, feed.url);

      let publishedAt: Date | null = null;
      if (feed.selectors.date) {
        const dateElement = $container.find(feed.selectors.date).first();
        const dateStr =
          dateElement.attr("datetime") || dateElement.text().trim();
        publishedAt = parseDate(dateStr);
      }

      let content = "";
      if (feed.selectors.content) {
        const contentElements = $container.find(feed.selectors.content);
        const rawContent = contentElements
          .slice(0, 3)
          .map((_, el) => {
            const html = $(el).html();
            if (html && html.includes("<")) {
              return html;
            }
            return $(el).text();
          })
          .get()
          .join(" ");

        content = cleanHtmlContent(rawContent);
      }

      if (!content) {
        content = cleanHtmlContent($container.text().trim().slice(0, 500));
      }

      const finalContent = content.slice(0, 1000).trim();

      posts.push({
        title,
        url,
        content: finalContent,
        publishedAt,
      });
    });

    return {
      feedId: feed.id,
      success: true,
      posts,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    let errorType: "network" | "parse" | "timeout" | "ssl" | "unknown" =
      "unknown";
    if (
      errorMessage.includes("timeout") ||
      errorMessage.includes("ETIMEDOUT") ||
      errorMessage.includes("aborted")
    ) {
      errorType = "timeout";
    } else if (
      errorMessage.includes("certificate") ||
      errorMessage.includes("SSL") ||
      errorMessage.includes("SELF_SIGNED")
    ) {
      errorType = "ssl";
    } else if (
      errorMessage.includes("fetch") ||
      errorMessage.includes("ENOTFOUND") ||
      errorMessage.includes("ECONNREFUSED")
    ) {
      errorType = "network";
    } else if (
      errorMessage.includes("parse") ||
      errorMessage.includes("selector")
    ) {
      errorType = "parse";
    }

    console.error(`Error scraping ${feed.id}:`, errorMessage);
    return {
      feedId: feed.id,
      success: false,
      posts: [],
      error: errorMessage,
      errorType,
    };
  }
}

/**
 * Extrae posts de todas las fuentes configuradas
 */
export async function scrapeAllFeeds(
  feeds: FeedConfig[]
): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  for (const feed of feeds) {
    const result = await scrapeFeed(feed);
    results.push(result);
    console.log(
      `Scraped ${feed.name}: ${
        result.success
          ? `${result.posts.length} posts`
          : `ERROR - ${result.error}`
      }`
    );
  }

  return results;
}
