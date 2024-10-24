import client from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server-props";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient();

  const { data } = await supabase.auth.getUser();

  const docsList = await client.user.findMany({
    where: {
      userId: data.user?.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(docsList);
}