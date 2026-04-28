export interface User {
  id: string;
  creator_name: string;
  country_code: string;
  phone: string;
  answers: Record<string, number>;
  topics: string[];
  created_at: string;
}

export interface CachedNewsletter {
  id: string;
  topics_hash: string;
  topics: string[];
  date: string;
  main_article: {
    title: string;
    source_url: string;
    topic: string;
    deep_read_content: string;
    image_url?: string;
  };
  supporting_articles: {
    title: string;
    source_url: string;
    topic: string;
    summary: string;
    image_url?: string;
  }[];
  full_html: string;
  created_at: string;
}
