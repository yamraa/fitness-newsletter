import CryptoJS from "crypto-js";

export const FITNESS_TOPICS = [
  "Workout & Strength Training",
  "Nutrition & Diet",
  "Weight Loss",
  "Yoga & Flexibility",
  "Running & Cardio",
  "Supplements",
  "Mental Health & Mindfulness",
  "Sports-specific Training",
] as const;

export type FitnessTopic = (typeof FITNESS_TOPICS)[number];

export function hashTopics(topics: string[]): string {
  const sorted = [...topics].sort().join("+");
  return CryptoJS.MD5(sorted).toString();
}
