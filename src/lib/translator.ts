/**
 * Translation utility using LibreTranslate (free, open-source)
 * API: https://libretranslate.com
 */

interface TranslateOptions {
  text: string;
  source?: string; // Source language (default: 'en')
  target?: string; // Target language (default: 'es')
}

interface TranslateResponse {
  translatedText: string;
}

// Use public LibreTranslate instance or set your own
const LIBRETRANSLATE_URL =
  process.env.LIBRETRANSLATE_URL || "https://libretranslate.com";

/**
 * Translate text from English to Spanish using LibreTranslate
 */
export async function translate(
  text: string,
  options: Partial<TranslateOptions> = {}
): Promise<string> {
  const { source = "en", target = "es" } = options;

  // If text is empty, return empty string
  if (!text || text.trim().length === 0) {
    return "";
  }

  // If text is very short (likely already Spanish or not worth translating)
  if (text.trim().length < 3) {
    return text;
  }

  try {
    const response = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: text,
        source,
        target,
        format: "text",
      }),
    });

    if (!response.ok) {
      console.error(
        `Translation API error: ${response.status} ${response.statusText}`
      );
      // Return original text if translation fails
      return text;
    }

    const data = (await response.json()) as TranslateResponse;
    return data.translatedText;
  } catch (error) {
    console.error("Translation error:", error);
    // Return original text if translation fails
    return text;
  }
}

/**
 * Translate multiple texts in batch (more efficient)
 */
export async function translateBatch(
  texts: string[],
  options: Partial<TranslateOptions> = {}
): Promise<string[]> {
  const { source = "en", target = "es" } = options;

  // Filter out empty texts
  const validTexts = texts.filter((t) => t && t.trim().length >= 3);

  if (validTexts.length === 0) {
    return texts;
  }

  try {
    const translations = await Promise.all(
      validTexts.map((text) => translate(text, { source, target }))
    );

    // Map back to original array (keeping empty texts as-is)
    let translationIndex = 0;
    return texts.map((text) => {
      if (!text || text.trim().length < 3) {
        return text;
      }
      return translations[translationIndex++] ?? text;
    });
  } catch (error) {
    console.error("Batch translation error:", error);
    return texts;
  }
}

/**
 * Detect if text is likely in English (simple heuristic)
 */
export function isLikelyEnglish(text: string): boolean {
  if (!text || text.trim().length < 10) {
    return false;
  }

  // Common English words that are less common in Spanish
  const englishIndicators = [
    "the",
    "and",
    "for",
    "with",
    "this",
    "that",
    "from",
    "have",
    "been",
    "will",
  ];

  const lowerText = text.toLowerCase();
  const matches = englishIndicators.filter((word) =>
    lowerText.includes(` ${word} `)
  ).length;

  // If we find 2+ English indicators, likely English
  return matches >= 2;
}
