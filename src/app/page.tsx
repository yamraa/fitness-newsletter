import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <h1 className="text-5xl font-bold mb-6 leading-tight">
          Your Daily Fitness Briefing
        </h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Get a curated, magazine-style fitness newsletter tailored to your
          interests. Powered by AI, sourced from the best fitness content on
          the web. Stay informed with expert insights, trending workouts,
          nutrition tips, and recovery strategies — delivered fresh every day.
          Choose the topics you care about and we handle the rest, so you
          never miss what matters in the fitness world.
        </p>
        <Link
          href="/topics"
          className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
        >
          Pick Your Topics
        </Link>
      </div>
    </main>
  );
}
