"use client";

import { FITNESS_TOPICS } from "@/lib/topics";

const TOPIC_ICONS: Record<string, string> = {
  "Workout & Strength Training": "💪",
  "Nutrition & Diet": "🥗",
  "Weight Loss": "⚖️",
  "Yoga & Flexibility": "🧘",
  "Running & Cardio": "🏃",
  "Supplements": "💊",
  "Mental Health & Mindfulness": "🧠",
  "Sports-specific Training": "🏆",
};

interface TopicGridProps {
  selected: string[];
  onToggle: (topic: string) => void;
}

export default function TopicGrid({ selected, onToggle }: TopicGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {FITNESS_TOPICS.map((topic) => {
        const isSelected = selected.includes(topic);
        return (
          <button
            key={topic}
            onClick={() => onToggle(topic)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              isSelected
                ? "border-green-500 bg-green-500/10 text-white"
                : "border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-400"
            }`}
          >
            <span className="text-2xl block mb-2">{TOPIC_ICONS[topic]}</span>
            <span className="font-medium text-sm">{topic}</span>
          </button>
        );
      })}
    </div>
  );
}
