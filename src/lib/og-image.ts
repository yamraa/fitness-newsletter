/**
 * Fetches Open Graph image from a URL by parsing meta tags.
 */
export async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FitBrief/1.0)",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Try og:image first, then twitter:image
    const ogMatch = html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i
    );
    if (ogMatch) return ogMatch[1];

    const twitterMatch = html.match(
      /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i
    );
    if (twitterMatch) return twitterMatch[1];

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches OG images for multiple articles in parallel.
 * Returns a map of source_url -> image_url.
 */
export async function fetchOgImages(
  urls: string[]
): Promise<Record<string, string>> {
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const image = await fetchOgImage(url);
      return { url, image };
    })
  );

  const map: Record<string, string> = {};
  for (const result of results) {
    if (result.status === "fulfilled" && result.value.image) {
      map[result.value.url] = result.value.image;
    }
  }
  return map;
}
