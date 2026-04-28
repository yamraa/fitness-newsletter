"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopicGrid from "@/components/TopicGrid";

export default function TopicsPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Check if returning user
    const savedPhone = localStorage.getItem("fitbrief_phone");
    if (savedPhone) {
      fetch(`/api/users?phone=${encodeURIComponent(savedPhone)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.user && data.user.topics) {
            setSelected(data.user.topics);
          }
        });
    }
  }, []);

  const handleToggle = (topic: string) => {
    setSelected((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  };

  const handleContinue = () => {
    if (selected.length === 0) return;
    const topicsParam = encodeURIComponent(selected.join(","));
    router.push(`/newsletter?topics=${topicsParam}`);
  };

  return (
    <main className="min-h-screen bg-white text-gray-900 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">What interests you?</h1>
        <p className="text-gray-600 mb-8">
          Pick one or more fitness topics to build your personalized newsletter.
        </p>

        <TopicGrid selected={selected} onToggle={handleToggle} />

        <div className="mt-8 text-center">
          <button
            onClick={handleContinue}
            disabled={selected.length === 0}
            className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors ${
              selected.length > 0
                ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Build My Newsletter ({selected.length} selected)
          </button>
        </div>
      </div>
    </main>
  );
}
