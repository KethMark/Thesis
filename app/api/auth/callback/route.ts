import client from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server-props";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {

        if (user) {
            try {
              // Check if profile exists
              const existingProfile = await client.profile.findUnique({
                where: {
                  userId: user.id
                }
              });
        
              if (!existingProfile) {
                console.log('No existing profile found. Proceeding to create one.');
        
                let fullname = user?.user_metadata?.full_name;
        
                // Create new profile
                await client.profile.create({
                  data: {
                    userId: user.id,
                    fullname: fullname || '',
                    email: user.user_metadata?.email || '',
                  }
                });
              }
            } catch (error) {
              console.error(error);
              return NextResponse.json(
                { message: "Error handling user profile" },
                { status: 500 }
              );
            }
          }
      }
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}