import Parser from "rss-parser";

const parser = new Parser();

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
  "Supplements": [
    "https://examine.com/rss/",
  ],
  "Mental Health & Mindfulness": [
    "https://www.mindful.org/feed/",
  ],
  "Sports-specific Training": [
    "https://www.stack.com/feed/",
  ],
};

async function fetchFromNewsAPI(topic: string): Promise<RawArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  const query = encodeURIComponent(topic);
  const url = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== "ok") return [];

    return data.articles.map((a: { title: string; url: string }) => ({
      title: a.title,
      url: a.url,
      topic,
    }));
  } catch {
    console.error(`NewsAPI fetch failed for topic: ${topic}`);
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
    fetchFromNewsAPI(topic),
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
