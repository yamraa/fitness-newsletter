"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PhoneGate from "@/components/PhoneGate";
import ShareBar from "@/components/ShareBar";

interface Article {
  title: string;
  source_url: string;
  topic: string;
  summary?: string;
  deep_read_content?: string;
  image_url?: string;
}

interface NewsletterData {
  main_article: Article;
  supporting_articles: Article[];
}

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&h=400&fit=crop",
];

function getImage(article: Article, index: number) {
  return article.image_url || PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
}

function ArticleCard({ article, index, featured = false }: { article: Article; index: number; featured?: boolean }) {
  return (
    <a
      href={article.source_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block group ${featured ? "col-span-2 sm:col-span-2" : ""}`}
    >
      <div className="overflow-hidden rounded-xl">
        <img
          src={getImage(article, index)}
          alt={article.title}
          className={`w-full object-cover group-hover:scale-105 transition-transform duration-300 ${featured ? "h-48 sm:h-72" : "h-40 sm:h-52"}`}
        />
      </div>
      <div className="mt-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          {article.topic}
        </span>
        <h3 className={`font-bold mt-1 text-gray-900 group-hover:text-green-600 transition-colors ${featured ? "text-xl sm:text-2xl" : "text-base"}`}>
          {article.title}
        </h3>
        <p className={`text-gray-600 mt-2 ${featured ? "text-base" : "text-sm sm:line-clamp-3"}`}>
          {article.deep_read_content || article.summary}
        </p>
        <span className="text-green-600 text-sm font-medium mt-2 inline-block">
          Read More &rarr;
        </span>
      </div>
    </a>
  );
}

function NewsletterContent() {
  const searchParams = useSearchParams();
  const topicsParam = searchParams.get("topics") || "";
  const topics = topicsParam.split(",").map((t) => decodeURIComponent(t.trim()));

  const [newsletter, setNewsletter] = useState<NewsletterData | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedPhone = localStorage.getItem("fitbrief_phone");
    if (savedPhone) {
      setUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (topics.length === 0 || !topicsParam) return;

    setLoading(true);
    fetch(`/api/newsletter?topics=${encodeURIComponent(topicsParam)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setNewsletter({
            main_article: data.newsletter.main_article,
            supporting_articles: data.newsletter.supporting_articles,
          });
        }
      })
      .catch(() => setError("Failed to load newsletter"))
      .finally(() => setLoading(false));
  }, [topicsParam]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Curating your personalized newsletter...</p>
        <p className="text-gray-500 text-sm mt-2">This may take a few seconds on first load</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!newsletter) return null;

  const allArticles = [newsletter.main_article, ...newsletter.supporting_articles];
  const visibleArticles = unlocked ? allArticles : allArticles.slice(0, 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Your FitBrief</h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <ShareBar
          url={typeof window !== "undefined" ? window.location.href : ""}
          text="Check out today's FitBrief — a personalized fitness newsletter!"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {visibleArticles.map((article, i) => (
          <ArticleCard key={i} article={article} index={i} featured={i === 0} />
        ))}
      </div>

      {!unlocked && (
        <div className="relative mt-[-60px] pt-20 bg-gradient-to-t from-white via-white to-transparent">
          <PhoneGate topics={topics} onUnlock={() => setUnlocked(true)} />
        </div>
      )}
    </div>
  );
}

export default function NewsletterPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Suspense
          fallback={
            <div className="text-center py-20">
              <p className="text-gray-600">Loading...</p>
            </div>
          }
        >
          <NewsletterContent />
        </Suspense>
      </div>
    </main>
  );
}
