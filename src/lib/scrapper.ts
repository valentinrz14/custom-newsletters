import * as cheerio from "cheerio";
import { decode } from "he";
import type { FeedConfig } from "./feeds";

export interface ScrapedPost {
  title: string;
  url: string;
  content: string;
  publishedAt: Date | null;
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
  } catch {
    // Ignorar errores de parsing
  }

  return null;
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
    } catch (e) {
      if (i === retries - 1) throw e;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

/**
 * Extrae posts de un feed específico usando sus selectores
 */
export async function scrapeFeed(feed: FeedConfig): Promise<ScrapedPost[]> {
  try {
    const response = await fetchWithRetry(feed.url);
    if (!response.ok) {
      console.error(`Failed to fetch ${feed.url}: ${response.status}`);
      return [];
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

      // If no href and it's an XML feed (or we want to fallback), check text content
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
            // Si el elemento contiene HTML (común en RSS), obtener el HTML
            const html = $(el).html();
            if (html && html.includes("<")) {
              return html;
            }
            // Si no, obtener el texto
            return $(el).text();
          })
          .get()
          .join(" ");

        content = cleanHtmlContent(rawContent);
      }

      if (!content) {
        content = cleanHtmlContent($container.text().trim().slice(0, 500));
      }

      // Limitar el contenido final
      const finalContent = content.slice(0, 1000).trim();

      posts.push({
        title,
        url,
        content: finalContent,
        publishedAt,
      });
    });

    return posts;
  } catch (error) {
    console.error(`Error scraping ${feed.id}:`, error);
    return [];
  }
}

/**
 * Extrae posts de todas las fuentes configuradas
 */
export async function scrapeAllFeeds(
  feeds: FeedConfig[]
): Promise<Map<string, ScrapedPost[]>> {
  const results = new Map<string, ScrapedPost[]>();

  for (const feed of feeds) {
    const posts = await scrapeFeed(feed);
    results.set(feed.id, posts);
    console.log(`Scraped ${posts.length} posts from ${feed.name}`);
  }

  return results;
}
