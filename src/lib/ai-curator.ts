import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  };
  supportingArticles: {
    title: string;
    source_url: string;
    topic: string;
    summary: string;
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
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a fitness magazine editor. You curate newsletters in a magazine style.
Given a list of fitness articles, you must:
1. Pick ONE article as the "deep read" — write 300-400 words of engaging, informative magazine-style content about its topic. Do NOT just summarize — expand on the topic with practical advice, context, and insights.
2. Pick 3-5 OTHER articles as supporting reads — write a 2-3 sentence summary for each.

Return ONLY valid JSON in this exact format:
{
  "mainArticle": {
    "title": "string",
    "source_url": "string",
    "topic": "string",
    "deep_read_content": "string (300-400 words, magazine-style)"
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
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("OpenAI returned empty response");
  }

  return JSON.parse(content) as CuratedNewsletter;
}
