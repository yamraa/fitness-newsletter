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
