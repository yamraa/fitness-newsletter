import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "placeholder",
  baseURL: "https://openrouter.ai/api/v1",
});

interface RawArticle {
  title: string;
  url: string;
  topic: string;
}

interface CuratedNewsletter {
  mainArticle: {
    title: string;
    source_url: string;
    topic: string;
    deep_read_content: string;
    image_url?: string;
  };
  supportingArticles: {
    title: string;
    source_url: string;
    topic: string;
    summary: string;
    image_url?: string;
  }[];
}

export async function curateNewsletter(
  articles: RawArticle[],
  topics: string[]
): Promise<CuratedNewsletter> {
  const articleList = articles
    .map((a, i) => `${i + 1}. [${a.topic}] "${a.title}" — ${a.url}`)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "openai/gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a fitness magazine editor. You curate newsletters in a magazine style.
Given a list of fitness articles, you must:
1. Pick ONE article as the "deep read" — write 200-250 words of engaging, in-depth magazine-style content about its topic. Cover the key takeaways, practical advice, and interesting details from the article. Keep it punchy and actionable. Include a relevant motivational or expert quote wrapped in <blockquote> tags.
2. Pick 3-5 OTHER articles as supporting reads — write a 1-2 sentence summary for each.

Return ONLY valid JSON in this exact format:
{
  "mainArticle": {
    "title": "string",
    "source_url": "string",
    "topic": "string",
    "deep_read_content": "string (200-250 words, detailed and punchy)"
  },
  "supportingArticles": [
    {
      "title": "string",
      "source_url": "string",
      "topic": "string",
      "summary": "string (2-3 sentences)"
    }
  ]
}`,
      },
      {
        role: "user",
        content: `User's selected topics: ${topics.join(", ")}

Available articles:
${articleList}

Curate a magazine-style newsletter from these articles.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("AI returned empty response");
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("AI returned invalid JSON");
    }
  }

  // Normalize keys — AI may return snake_case or camelCase
  return {
    mainArticle: parsed.mainArticle || parsed.main_article,
    supportingArticles: parsed.supportingArticles || parsed.supporting_articles || [],
  } as CuratedNewsletter;
}
