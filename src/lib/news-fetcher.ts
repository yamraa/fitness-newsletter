import Parser from "rss-parser";

const parser = new Parser({
  timeout: 5000,
});

interface RawArticle {
  title: string;
  url: string;
  topic: string;
}

const RSS_FEEDS: Record<string, string[]> = {
  "Workout & Strength Training": [
    "https://www.t-nation.com/rss/articles",
    "https://breakingmuscle.com/feed/",
  ],
  "Nutrition & Diet": [
    "https://www.healthline.com/rss/nutrition",
    "https://feeds.feedburner.com/PrecisionNutrition",
  ],
  "Weight Loss": [
    "https://www.healthline.com/rss/weight-management",
  ],
  "Yoga & Flexibility": [
    "https://www.yogajournal.com/feed/",
  ],
  "Running & Cardio": [
    "https://www.runnersworld.com/rss/all.xml/",
  ],
  "Supplements": [],
  "Mental Health & Mindfulness": [
    "https://www.mindful.org/feed/",
  ],
  "Sports-specific Training": [
    "https://www.stack.com/feed/",
  ],
};

async function fetchFromSerpAPI(topic: string): Promise<RawArticle[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return [];

  const query = encodeURIComponent(`${topic} fitness blog`);
  const url = `https://serpapi.com/search.json?engine=google&q=${query}&num=5&api_key=${apiKey}&tbs=qdr:w`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.organic_results) return [];

    return data.organic_results.map((item: { title: string; link: string }) => ({
      title: item.title,
      url: item.link,
      topic,
    }));
  } catch {
    console.error(`SerpAPI fetch failed for topic: ${topic}`);
    return [];
  }
}

async function fetchFromRSS(topic: string): Promise<RawArticle[]> {
  const feeds = RSS_FEEDS[topic] || [];
  const articles: RawArticle[] = [];

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      const items = feed.items.slice(0, 3).map((item) => ({
        title: item.title || "Untitled",
        url: item.link || "",
        topic,
      }));
      articles.push(...items);
    } catch {
      console.error(`RSS fetch failed: ${feedUrl}`);
    }
  }

  return articles;
}

export async function fetchArticlesForTopics(
  topics: string[]
): Promise<RawArticle[]> {
  const allArticles: RawArticle[] = [];

  const fetches = topics.flatMap((topic) => [
    fetchFromSerpAPI(topic),
    fetchFromRSS(topic),
  ]);

  const results = await Promise.allSettled(fetches);

  for (const result of results) {
    if (result.status === "fulfilled") {
      allArticles.push(...result.value);
    }
  }

  return allArticles;
}
