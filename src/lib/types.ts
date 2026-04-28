export interface User {
  id: string;
  name: string;
  phone: string;
  topics: string[];
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  title: string;
  source_url: string;
  topic: string;
  summary: string | null;
  deep_read_content: string | null;
  fetched_at: string;
  created_at: string;
}

export interface SupportingArticle {
  id: string;
  title: string;
  summary: string;
  source_url: string;
}

export interface CachedNewsletter {
  id: string;
  topics_hash: string;
  topics: string[];
  date: string;
  main_article_id: string;
  supporting_articles: SupportingArticle[];
  full_html: string;
  created_at: string;
}
