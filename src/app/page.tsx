import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Your Daily Fitness Briefing
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Get a curated, magazine-style fitness newsletter tailored to your
          interests. Powered by AI, sourced from the best fitness content on
          the web.
        </p>
        <Link
          href="/topics"
          className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
        >
          Pick Your Topics
        </Link>
      </div>
    </main>
  );
}
