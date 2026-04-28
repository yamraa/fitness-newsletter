"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import NewsletterTeaser from "@/components/NewsletterTeaser";
import NewsletterFull from "@/components/NewsletterFull";
import PhoneGate from "@/components/PhoneGate";

function NewsletterContent() {
  const searchParams = useSearchParams();
  const topicsParam = searchParams.get("topics") || "";
  const topics = topicsParam.split(",").map((t) => decodeURIComponent(t.trim()));

  const [html, setHtml] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if returning user
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
          setHtml(data.newsletter.full_html);
        }
      })
      .catch(() => setError("Failed to load newsletter"))
      .finally(() => setLoading(false));
  }, [topicsParam]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400">
          Curating your personalized newsletter...
        </p>
        <p className="text-gray-500 text-sm mt-2">
          This may take a few seconds on first load
        </p>
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

  if (!html) return null;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Your FitBrief</h1>
      <p className="text-gray-400 mb-8">
        {new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      {unlocked ? (
        <NewsletterFull html={html} />
      ) : (
        <>
          <NewsletterTeaser html={html} />
          <PhoneGate topics={topics} onUnlock={() => setUnlocked(true)} />
        </>
      )}
    </div>
  );
}

export default function NewsletterPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Suspense
          fallback={
            <div className="text-center py-20">
              <p className="text-gray-400">Loading...</p>
            </div>
          }
        >
          <NewsletterContent />
        </Suspense>
      </div>
    </main>
  );
}
