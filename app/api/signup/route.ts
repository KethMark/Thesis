import client from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server-props";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = createClient()

    const { email, password, fullname } = await req.json();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          fullname
        }
      }
    })

    if (error || !data) {
      console.error(error)
      return NextResponse.json({ error: error?.message || "Signup failed" }, { status: 400 });
    }

    if (!data || !data.user || !data.user.id) {
      return NextResponse.json({ error: 'Theirs something wrong' }, { status: 401 });
    }

    const profile = await client.profile.create({
      data: {
        userId: data.user.id,
        fullname,
        email
      }
    })

    if(!profile) {
      console.error("Profile Error:", profile)
      return NextResponse.json({ 
        message: 'Theirs something wrong creating your profile'
      })
    }

    return NextResponse.json({ user: data.user });

  } catch (error) {
    console.error("Signup:", error)
    return NextResponse.json({
      message: "Signup backend"
    })
  }
}