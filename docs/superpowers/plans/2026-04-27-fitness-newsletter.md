# Fitness Newsletter App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone fitness newsletter web app that curates AI-powered newsletters from real fitness content, using a lead-capture gate (name + phone) to unlock the full newsletter.

**Architecture:** Next.js 14 App Router with Supabase (Postgres) for storage. On-the-fly content pipeline: fetch from NewsAPI + RSS → curate via OpenAI → cache by topic-combo hash per day. Teaser/gate pattern for lead capture. localStorage for returning user identification.

**Tech Stack:** Next.js 14, Supabase, OpenAI (GPT-4o-mini), NewsAPI, rss-parser, Tailwind CSS, Vercel

---

## File Structure

```
fitness-newsletter/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    — Root layout with Tailwind + fonts
│   │   ├── page.tsx                      — Landing page
│   │   ├── topics/
│   │   │   └── page.tsx                  — Topic selection page
│   │   ├── newsletter/
│   │   │   └── page.tsx                  — Newsletter view (teaser + full)
│   │   └── api/
│   │       ├── newsletter/
│   │       │   └── route.ts              — GET: generate/fetch cached newsletter
│   │       └── users/
│   │           └── route.ts              — POST: save user (name + phone)
│   ├── lib/
│   │   ├── supabase.ts                   — Supabase client
│   │   ├── news-fetcher.ts               — NewsAPI + RSS fetching
│   │   ├── ai-curator.ts                 — OpenAI curation logic
│   │   ├── cache.ts                      — Newsletter cache read/write
│   │   ├── topics.ts                     — Topic list + hash utility
│   │   └── types.ts                      — Shared TypeScript types
│   └── components/
│       ├── TopicGrid.tsx                 — Checkbox grid of fitness topics
│       ├── NewsletterTeaser.tsx           — Half newsletter with blur overlay
│       ├── NewsletterFull.tsx             — Full magazine-style newsletter
│       └── PhoneGate.tsx                 — Name + phone number form
├── .env.local.example                    — Template for env vars
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

### Task 1: Project Setup & Dependencies

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `tailwind.config.ts`
- Create: `src/app/layout.tsx`
- Create: `.env.local.example`
- Create: `.gitignore`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd ~/Habuild\ Repos/fitness-newsletter
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Select defaults when prompted. This creates the full Next.js scaffold.

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js openai rss-parser crypto-js
npm install -D @types/crypto-js
```

- [ ] **Step 3: Create .env.local.example**

Create `.env.local.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
NEWS_API_KEY=your_newsapi_key
```

- [ ] **Step 4: Create .env.local with your actual keys**

Copy `.env.local.example` to `.env.local` and fill in real values. Do NOT commit `.env.local`.

- [ ] **Step 5: Verify .gitignore includes .env.local**

The create-next-app scaffold should already include `.env.local` in `.gitignore`. Verify this.

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: initialize next.js project with dependencies"
```

---

### Task 2: Supabase Setup & Database Schema

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/lib/types.ts`

- [ ] **Step 1: Create Supabase project**

Go to https://supabase.com, create a new project. Copy the URL and anon key into `.env.local`.

- [ ] **Step 2: Run SQL to create tables**

In the Supabase SQL editor, run:

```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  topics TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  source_url TEXT NOT NULL,
  topic TEXT NOT NULL,
  summary TEXT,
  deep_read_content TEXT,
  fetched_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cached_newsletters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topics_hash TEXT NOT NULL,
  topics TEXT[] NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  main_article_id UUID REFERENCES articles(id),
  supporting_articles JSONB NOT NULL DEFAULT '[]',
  full_html TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(topics_hash, date)
);

CREATE INDEX idx_articles_topic_date ON articles(topic, fetched_at);
CREATE INDEX idx_cached_newsletters_hash_date ON cached_newsletters(topics_hash, date);
```

- [ ] **Step 3: Create Supabase client**

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 4: Create shared types**

Create `src/lib/types.ts`:

```typescript
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
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase.ts src/lib/types.ts
git commit -m "feat: add supabase client and type definitions"
```

---

### Task 3: Topics Utility

**Files:**
- Create: `src/lib/topics.ts`

- [ ] **Step 1: Create topics list and hash utility**

Create `src/lib/topics.ts`:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/topics.ts
git commit -m "feat: add fitness topics list and hash utility"
```

---

### Task 4: News Fetcher

**Files:**
- Create: `src/lib/news-fetcher.ts`

- [ ] **Step 1: Create news fetcher**

Create `src/lib/news-fetcher.ts`:

```typescript
import Parser from "rss-parser";

const parser = new Parser();

interface RawArticle {
  title: string;
  url: string;
  topic: string;
}

const RSS_FEEDS: Record<string, string[]> = {
  "Workout & Strength Training": [
    "https://www.t-nation.com/rss/articles",
    "https://breakingmuscle.com/feed/",
  ],
  "Nutrition & Diet": [
    "https://www.healthline.com/rss/nutrition",
    "https://feeds.feedburner.com/PrecisionNutrition",
  ],
  "Weight Loss": [
    "https://www.healthline.com/rss/weight-management",
  ],
  "Yoga & Flexibility": [
    "https://www.yogajournal.com/feed/",
  ],
  "Running & Cardio": [
    "https://www.runnersworld.com/rss/all.xml/",
  ],
  "Supplements": [
    "https://examine.com/rss/",
  ],
  "Mental Health & Mindfulness": [
    "https://www.mindful.org/feed/",
  ],
  "Sports-specific Training": [
    "https://www.stack.com/feed/",
  ],
};

async function fetchFromNewsAPI(topic: string): Promise<RawArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  const query = encodeURIComponent(topic);
  const url = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== "ok") return [];

    return data.articles.map((a: { title: string; url: string }) => ({
      title: a.title,
      url: a.url,
      topic,
    }));
  } catch {
    console.error(`NewsAPI fetch failed for topic: ${topic}`);
    return [];
  }
}

async function fetchFromRSS(topic: string): Promise<RawArticle[]> {
  const feeds = RSS_FEEDS[topic] || [];
  const articles: RawArticle[] = [];

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      const items = feed.items.slice(0, 3).map((item) => ({
        title: item.title || "Untitled",
        url: item.link || "",
        topic,
      }));
      articles.push(...items);
    } catch {
      console.error(`RSS fetch failed: ${feedUrl}`);
    }
  }

  return articles;
}

export async function fetchArticlesForTopics(
  topics: string[]
): Promise<RawArticle[]> {
  const allArticles: RawArticle[] = [];

  const fetches = topics.flatMap((topic) => [
    fetchFromNewsAPI(topic),
    fetchFromRSS(topic),
  ]);

  const results = await Promise.allSettled(fetches);

  for (const result of results) {
    if (result.status === "fulfilled") {
      allArticles.push(...result.value);
    }
  }

  return allArticles;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/news-fetcher.ts
git commit -m "feat: add news fetcher for NewsAPI and RSS feeds"
```

---

### Task 5: AI Curator

**Files:**
- Create: `src/lib/ai-curator.ts`

- [ ] **Step 1: Create AI curator**

Create `src/lib/ai-curator.ts`:

```typescript
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface RawArticle {
  title: string;
  url: string;
  topic: string;
}

interface CuratedNewsletter {
  mainArticle: {
    title: string;
    source_url: string;
    topic: string;
    deep_read_content: string;
  };
  supportingArticles: {
    title: string;
    source_url: string;
    topic: string;
    summary: string;
  }[];
}

export async function curateNewsletter(
  articles: RawArticle[],
  topics: string[]
): Promise<CuratedNewsletter> {
  const articleList = articles
    .map((a, i) => `${i + 1}. [${a.topic}] "${a.title}" — ${a.url}`)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a fitness magazine editor. You curate newsletters in a magazine style.
Given a list of fitness articles, you must:
1. Pick ONE article as the "deep read" — write 300-400 words of engaging, informative magazine-style content about its topic. Do NOT just summarize — expand on the topic with practical advice, context, and insights.
2. Pick 3-5 OTHER articles as supporting reads — write a 2-3 sentence summary for each.

Return ONLY valid JSON in this exact format:
{
  "mainArticle": {
    "title": "string",
    "source_url": "string",
    "topic": "string",
    "deep_read_content": "string (300-400 words, magazine-style)"
  },
  "supportingArticles": [
    {
      "title": "string",
      "source_url": "string",
      "topic": "string",
      "summary": "string (2-3 sentences)"
    }
  ]
}`,
      },
      {
        role: "user",
        content: `User's selected topics: ${topics.join(", ")}

Available articles:
${articleList}

Curate a magazine-style newsletter from these articles.`,
      },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("OpenAI returned empty response");
  }

  return JSON.parse(content) as CuratedNewsletter;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai-curator.ts
git commit -m "feat: add AI curator for magazine-style newsletter generation"
```

---

### Task 6: Newsletter Cache

**Files:**
- Create: `src/lib/cache.ts`

- [ ] **Step 1: Create cache logic**

Create `src/lib/cache.ts`:

```typescript
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
  mainArticleId: string,
  supportingArticles: { id: string; title: string; summary: string; source_url: string }[],
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
      main_article_id: mainArticleId,
      supporting_articles: supportingArticles,
      full_html: fullHtml,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to cache newsletter: ${error.message}`);
  return data as CachedNewsletter;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/cache.ts
git commit -m "feat: add newsletter cache read/write logic"
```

---

### Task 7: Newsletter API Route

**Files:**
- Create: `src/app/api/newsletter/route.ts`

- [ ] **Step 1: Create newsletter API**

Create `src/app/api/newsletter/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCachedNewsletter, saveCachedNewsletter } from "@/lib/cache";
import { fetchArticlesForTopics } from "@/lib/news-fetcher";
import { curateNewsletter } from "@/lib/ai-curator";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const topicsParam = request.nextUrl.searchParams.get("topics");

  if (!topicsParam) {
    return NextResponse.json({ error: "topics parameter required" }, { status: 400 });
  }

  const topics = topicsParam.split(",").map((t) => t.trim());

  if (topics.length === 0) {
    return NextResponse.json({ error: "at least one topic required" }, { status: 400 });
  }

  // Check cache first
  const cached = await getCachedNewsletter(topics);
  if (cached) {
    return NextResponse.json({ newsletter: cached });
  }

  // Fetch articles
  const rawArticles = await fetchArticlesForTopics(topics);

  if (rawArticles.length === 0) {
    return NextResponse.json(
      { error: "No articles found for selected topics" },
      { status: 404 }
    );
  }

  // AI curation
  const curated = await curateNewsletter(rawArticles, topics);

  // Store main article in DB
  const { data: mainArticle, error: mainError } = await supabase
    .from("articles")
    .insert({
      title: curated.mainArticle.title,
      source_url: curated.mainArticle.source_url,
      topic: curated.mainArticle.topic,
      summary: null,
      deep_read_content: curated.mainArticle.deep_read_content,
    })
    .select()
    .single();

  if (mainError || !mainArticle) {
    return NextResponse.json({ error: "Failed to store main article" }, { status: 500 });
  }

  // Store supporting articles in DB
  const supportingInserts = curated.supportingArticles.map((a) => ({
    title: a.title,
    source_url: a.source_url,
    topic: a.topic,
    summary: a.summary,
    deep_read_content: null,
  }));

  const { data: supportingData, error: suppError } = await supabase
    .from("articles")
    .insert(supportingInserts)
    .select();

  if (suppError || !supportingData) {
    return NextResponse.json({ error: "Failed to store supporting articles" }, { status: 500 });
  }

  const supportingForCache = supportingData.map((a) => ({
    id: a.id,
    title: a.title,
    summary: curated.supportingArticles.find((s) => s.source_url === a.source_url)?.summary || "",
    source_url: a.source_url,
  }));

  // Build HTML
  const fullHtml = buildNewsletterHtml(curated);

  // Cache it
  const newsletter = await saveCachedNewsletter(
    topics,
    mainArticle.id,
    supportingForCache,
    fullHtml
  );

  return NextResponse.json({ newsletter });
}

function buildNewsletterHtml(curated: {
  mainArticle: { title: string; source_url: string; deep_read_content: string };
  supportingArticles: { title: string; source_url: string; summary: string }[];
}): string {
  const supporting = curated.supportingArticles
    .map(
      (a) =>
        `<div class="border-b border-gray-200 pb-4 mb-4">
          <h3 class="text-lg font-semibold">${a.title}</h3>
          <p class="text-gray-600 mt-1">${a.summary}</p>
          <a href="${a.source_url}" target="_blank" class="text-blue-600 text-sm mt-1 inline-block">Read full article →</a>
        </div>`
    )
    .join("");

  return `
    <article class="max-w-2xl mx-auto">
      <div class="mb-8">
        <h2 class="text-2xl font-bold mb-4">${curated.mainArticle.title}</h2>
        <div class="prose prose-lg">${curated.mainArticle.deep_read_content}</div>
        <a href="${curated.mainArticle.source_url}" target="_blank" class="text-blue-600 mt-4 inline-block">Read original →</a>
      </div>
      <hr class="my-8" />
      <h2 class="text-xl font-bold mb-4">More Reads</h2>
      ${supporting}
    </article>
  `;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/newsletter/route.ts
git commit -m "feat: add newsletter API route with fetch, curate, cache pipeline"
```

---

### Task 8: Users API Route

**Files:**
- Create: `src/app/api/users/route.ts`

- [ ] **Step 1: Create users API**

Create `src/app/api/users/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, phone, topics } = body;

  if (!name || !phone || !topics || topics.length === 0) {
    return NextResponse.json(
      { error: "name, phone, and topics are required" },
      { status: 400 }
    );
  }

  // Check if user already exists by phone
  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("phone", phone)
    .single();

  if (existingUser) {
    // Update their topics
    const { data, error } = await supabase
      .from("users")
      .update({ name, topics, updated_at: new Date().toISOString() })
      .eq("phone", phone)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  }

  // Create new user
  const { data, error } = await supabase
    .from("users")
    .insert({ name, phone, topics })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "phone parameter required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("phone", phone)
    .single();

  if (error || !data) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: data });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/users/route.ts
git commit -m "feat: add users API route for lead capture and lookup"
```

---

### Task 9: Landing Page

**Files:**
- Create: `src/app/page.tsx`

- [ ] **Step 1: Build landing page**

Replace `src/app/page.tsx` with:

```tsx
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
```

- [ ] **Step 2: Update root layout**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FitBrief — Your Daily Fitness Newsletter",
  description:
    "AI-curated fitness newsletter tailored to your interests",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx src/app/layout.tsx
git commit -m "feat: add landing page and root layout"
```

---

### Task 10: Topic Selection Page

**Files:**
- Create: `src/components/TopicGrid.tsx`
- Create: `src/app/topics/page.tsx`

- [ ] **Step 1: Create TopicGrid component**

Create `src/components/TopicGrid.tsx`:

```tsx
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
```

- [ ] **Step 2: Create topics page**

Create `src/app/topics/page.tsx`:

```tsx
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
          if (data.user) {
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
    <main className="min-h-screen bg-gray-900 text-white py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">What interests you?</h1>
        <p className="text-gray-400 mb-8">
          Pick one or more fitness topics to build your personalized newsletter.
        </p>

        <TopicGrid selected={selected} onToggle={handleToggle} />

        <div className="mt-8 text-center">
          <button
            onClick={handleContinue}
            disabled={selected.length === 0}
            className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors ${
              selected.length > 0
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            Build My Newsletter ({selected.length} selected)
          </button>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TopicGrid.tsx src/app/topics/page.tsx
git commit -m "feat: add topic selection page with grid component"
```

---

### Task 11: Newsletter Page (Teaser + Gate + Full)

**Files:**
- Create: `src/components/NewsletterTeaser.tsx`
- Create: `src/components/NewsletterFull.tsx`
- Create: `src/components/PhoneGate.tsx`
- Create: `src/app/newsletter/page.tsx`

- [ ] **Step 1: Create NewsletterTeaser component**

Create `src/components/NewsletterTeaser.tsx`:

```tsx
interface NewsletterTeaserProps {
  html: string;
}

export default function NewsletterTeaser({ html }: NewsletterTeaserProps) {
  return (
    <div className="relative">
      <div
        className="max-h-[500px] overflow-hidden"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-gray-900 to-transparent" />
    </div>
  );
}
```

- [ ] **Step 2: Create NewsletterFull component**

Create `src/components/NewsletterFull.tsx`:

```tsx
interface NewsletterFullProps {
  html: string;
}

export default function NewsletterFull({ html }: NewsletterFullProps) {
  return (
    <div
      className="prose prose-invert prose-lg max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

- [ ] **Step 3: Create PhoneGate component**

Create `src/components/PhoneGate.tsx`:

```tsx
"use client";

import { useState } from "react";

interface PhoneGateProps {
  topics: string[];
  onUnlock: () => void;
}

export default function PhoneGate({ topics, onUnlock }: PhoneGateProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, topics }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      localStorage.setItem("fitbrief_phone", phone);
      onUnlock();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-8 max-w-md mx-auto mt-8">
      <h3 className="text-xl font-bold text-white mb-2">
        Unlock the full newsletter
      </h3>
      <p className="text-gray-400 text-sm mb-6">
        Enter your details to read the complete edition. We save your info so
        your topic preferences are remembered next time.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-green-500 focus:outline-none"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-green-500 focus:outline-none"
            placeholder="+91 98765 43210"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : "Read Full Newsletter"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Create newsletter page**

Create `src/app/newsletter/page.tsx`:

```tsx
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
```

- [ ] **Step 5: Commit**

```bash
git add src/components/NewsletterTeaser.tsx src/components/NewsletterFull.tsx src/components/PhoneGate.tsx src/app/newsletter/page.tsx
git commit -m "feat: add newsletter page with teaser, phone gate, and full view"
```

---

### Task 12: End-to-End Smoke Test

- [ ] **Step 1: Start the dev server**

```bash
cd ~/Habuild\ Repos/fitness-newsletter
npm run dev
```

- [ ] **Step 2: Test the full flow**

1. Open `http://localhost:3000` — verify landing page renders
2. Click "Pick Your Topics" — verify topic grid shows 8 topics
3. Select 2-3 topics, click "Build My Newsletter" — verify redirect to `/newsletter`
4. Verify loading spinner shows, then teaser (half newsletter with blur) appears
5. Verify PhoneGate form shows below the teaser
6. Enter name + phone, submit — verify full newsletter unlocks
7. Refresh the page — verify returning user sees full newsletter without gate (localStorage)
8. Open a new incognito tab, go to same URL — verify gate appears again

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: smoke test fixes"
```

---

### Task 13: Vercel Deployment

- [ ] **Step 1: Deploy to Vercel**

```bash
npx vercel
```

Follow prompts to link to a Vercel project.

- [ ] **Step 2: Set environment variables**

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add OPENAI_API_KEY
vercel env add NEWS_API_KEY
```

- [ ] **Step 3: Deploy to production**

```bash
vercel --prod
```

- [ ] **Step 4: Verify production deployment**

Open the production URL and run through the same flow from Task 12.
