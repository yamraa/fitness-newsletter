import { NextRequest, NextResponse } from "next/server";
import { getCachedNewsletter, saveCachedNewsletter } from "@/lib/cache";
import { fetchArticlesForTopics } from "@/lib/news-fetcher";
import { curateNewsletter } from "@/lib/ai-curator";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const topicsParam = request.nextUrl.searchParams.get("topics");

  if (!topicsParam) {
    return NextResponse.json({ error: "topics parameter required" }, { status: 400 });
  }

  const topics = topicsParam.split(",").map((t) => t.trim());

  if (topics.length === 0) {
    return NextResponse.json({ error: "at least one topic required" }, { status: 400 });
  }

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

  // Store main article in DB
  const { data: mainArticle, error: mainError } = await supabase
    .from("articles")
    .insert({
      title: curated.mainArticle.title,
      source_url: curated.mainArticle.source_url,
      topic: curated.mainArticle.topic,
      summary: null,
      deep_read_content: curated.mainArticle.deep_read_content,
    })
    .select()
    .single();

  if (mainError || !mainArticle) {
    return NextResponse.json({ error: "Failed to store main article" }, { status: 500 });
  }

  // Store supporting articles in DB
  const supportingInserts = curated.supportingArticles.map((a) => ({
    title: a.title,
    source_url: a.source_url,
    topic: a.topic,
    summary: a.summary,
    deep_read_content: null,
  }));

  const { data: supportingData, error: suppError } = await supabase
    .from("articles")
    .insert(supportingInserts)
    .select();

  if (suppError || !supportingData) {
    return NextResponse.json({ error: "Failed to store supporting articles" }, { status: 500 });
  }

  const supportingForCache = supportingData.map((a) => ({
    id: a.id,
    title: a.title,
    summary: curated.supportingArticles.find((s) => s.source_url === a.source_url)?.summary || "",
    source_url: a.source_url,
  }));

  // Build HTML
  const fullHtml = buildNewsletterHtml(curated);

  // Cache it
  const newsletter = await saveCachedNewsletter(
    topics,
    mainArticle.id,
    supportingForCache,
    fullHtml
  );

  return NextResponse.json({ newsletter });
}

function buildNewsletterHtml(curated: {
  mainArticle: { title: string; source_url: string; deep_read_content: string };
  supportingArticles: { title: string; source_url: string; summary: string }[];
}): string {
  const supporting = curated.supportingArticles
    .map(
      (a) =>
        `<div class="border-b border-gray-200 pb-4 mb-4">
          <h3 class="text-lg font-semibold">${a.title}</h3>
          <p class="text-gray-600 mt-1">${a.summary}</p>
          <a href="${a.source_url}" target="_blank" class="text-blue-600 text-sm mt-1 inline-block">Read full article →</a>
        </div>`
    )
    .join("");

  return `
    <article class="max-w-2xl mx-auto">
      <div class="mb-8">
        <h2 class="text-2xl font-bold mb-4">${curated.mainArticle.title}</h2>
        <div class="prose prose-lg">${curated.mainArticle.deep_read_content}</div>
        <a href="${curated.mainArticle.source_url}" target="_blank" class="text-blue-600 mt-4 inline-block">Read original →</a>
      </div>
      <hr class="my-8" />
      <h2 class="text-xl font-bold mb-4">More Reads</h2>
      ${supporting}
    </article>
  `;
}
