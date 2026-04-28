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

  // Check if user already exists by phone in quizzes table
  const { data: existingUser } = await supabase
    .from("quizzes")
    .select("*")
    .eq("phone", phone)
    .single();

  if (existingUser) {
    // Update their topics
    const { data, error } = await supabase
      .from("quizzes")
      .update({ creator_name: name, topics })
      .eq("phone", phone)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  }

  // Create new entry in quizzes
  const { data, error } = await supabase
    .from("quizzes")
    .insert({ creator_name: name, country_code: "+91", phone, topics, answers: {} })
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
    .from("quizzes")
    .select("*")
    .eq("phone", phone)
    .single();

  if (error || !data) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: data });
}
