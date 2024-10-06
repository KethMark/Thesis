import { createClient } from "@/utils/supabase/server-props";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = createClient();

    const { email, password } = await req.json();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Failed to sign in" }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
    
  } catch (error) {
    console.error("Error handling signin: ", error);
    return NextResponse.json({
      message: "Their's something wrong"}
    )
  }
}