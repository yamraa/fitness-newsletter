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

async function fetchFromGoogleCSE(topic: string): Promise<RawArticle[]> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  if (!apiKey || !cx) return [];

  const query = encodeURIComponent(`${topic} fitness blog`);
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&num=5&dateRestrict=d7`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.items) return [];

    return data.items.map((item: { title: string; link: string }) => ({
      title: item.title,
      url: item.link,
      topic,
    }));
  } catch {
    console.error(`Google CSE fetch failed for topic: ${topic}`);
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
    fetchFromGoogleCSE(topic),
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
