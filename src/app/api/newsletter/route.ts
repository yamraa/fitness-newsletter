import { NextRequest, NextResponse } from "next/server";
import { getCachedNewsletter, saveCachedNewsletter } from "@/lib/cache";
import { fetchArticlesForTopics } from "@/lib/news-fetcher";
import { curateNewsletter } from "@/lib/ai-curator";
import { fetchOgImages } from "@/lib/og-image";

export async function GET(request: NextRequest) {
  const topicsParam = request.nextUrl.searchParams.get("topics");

  if (!topicsParam) {
    return NextResponse.json({ error: "topics parameter required" }, { status: 400 });
  }

  const topics = topicsParam.split(",").map((t) => t.trim());

  if (topics.length === 0) {
    return NextResponse.json({ error: "at least one topic required" }, { status: 400 });
  }

  try {
    // Check cache first
    const cached = await getCachedNewsletter(topics);
    if (cached) {
      return NextResponse.json({ newsletter: cached });
    }

    // Fetch articles
    const rawArticles = await fetchArticlesForTopics(topics);

    if (rawArticles.length === 0) {
      return NextResponse.json(
        { error: "No articles found for selected topics" },
        { status: 404 }
      );
    }

    // AI curation
    const curated = await curateNewsletter(rawArticles, topics);

    // Fetch OG images for all curated articles
    const allUrls = [
      curated.mainArticle.source_url,
      ...curated.supportingArticles.map((a) => a.source_url),
    ];
    const imageMap = await fetchOgImages(allUrls);

    // Attach images to articles
    curated.mainArticle.image_url = imageMap[curated.mainArticle.source_url];
    for (const article of curated.supportingArticles) {
      article.image_url = imageMap[article.source_url];
    }

    // Build HTML
    const fullHtml = buildNewsletterHtml(curated);

    // Cache it
    const newsletter = await saveCachedNewsletter(
      topics,
      curated.mainArticle,
      curated.supportingArticles,
      fullHtml
    );

    return NextResponse.json({ newsletter });
  } catch (err) {
    console.error("Newsletter generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate newsletter. Please try again." },
      { status: 500 }
    );
  }
}

function buildNewsletterHtml(curated: {
  mainArticle: { title: string; source_url: string; deep_read_content: string };
  supportingArticles: { title: string; source_url: string; summary: string }[];
}): string {
  const supporting = curated.supportingArticles
    .map(
      (a) =>
        `<div style="background: #ffffff; border-radius: 12px; padding: 18px 20px; margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
          <h3 style="font-size: 17px; font-weight: 600; font-family: 'Georgia', serif; margin: 0 0 6px 0; color: #111827;">${a.title}</h3>
          <p style="font-size: 15px; color: #6b7280; margin: 0 0 8px 0; line-height: 1.6;">${a.summary}</p>
          <a href="${a.source_url}" target="_blank" style="font-size: 13px; color: #10b981; text-decoration: none; font-weight: 500;">Read more →</a>
        </div>`
    )
    .join("");

  return `
    <article style="max-width: 640px; margin: 0 auto; font-family: 'Georgia', serif;">
      <div style="background: #ffffff; border-radius: 16px; padding: 32px; margin-bottom: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
        <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #10b981; font-family: sans-serif; font-weight: 600;">Featured Read</span>
        <h2 style="font-size: 26px; font-weight: 700; margin: 12px 0 20px 0; line-height: 1.3; color: #111827;">${curated.mainArticle.title}</h2>
        <div style="font-size: 18px; line-height: 1.8; color: #374151;">${curated.mainArticle.deep_read_content}</div>
        <a href="${curated.mainArticle.source_url}" target="_blank" style="display: inline-block; margin-top: 20px; padding: 10px 24px; background: #10b981; color: white; border-radius: 8px; text-decoration: none; font-size: 14px; font-family: sans-serif; font-weight: 500;">Read Original →</a>
      </div>
      <div style="border-top: 2px solid #e5e7eb; padding-top: 24px;">
        <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #111827; font-family: sans-serif; letter-spacing: 0.5px;">More Reads</h2>
        ${supporting}
      </div>
    </article>
  `;
}
