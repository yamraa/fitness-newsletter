import { supabase } from "./supabase";
import { hashTopics } from "./topics";
import { CachedNewsletter } from "./types";

export async function getCachedNewsletter(
  topics: string[]
): Promise<CachedNewsletter | null> {
  const topicsHash = hashTopics(topics);
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("cached_newsletters")
    .select("*")
    .eq("topics_hash", topicsHash)
    .eq("date", today)
    .single();

  if (error || !data) return null;
  return data as CachedNewsletter;
}

export async function saveCachedNewsletter(
  topics: string[],
  mainArticle: { title: string; source_url: string; topic: string; deep_read_content: string; image_url?: string },
  supportingArticles: { title: string; source_url: string; topic: string; summary: string; image_url?: string }[],
  fullHtml: string
): Promise<CachedNewsletter> {
  const topicsHash = hashTopics(topics);
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("cached_newsletters")
    .insert({
      topics_hash: topicsHash,
      topics,
      date: today,
      main_article: mainArticle,
      supporting_articles: supportingArticles,
      full_html: fullHtml,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to cache newsletter: ${error.message}`);
  return data as CachedNewsletter;
}
