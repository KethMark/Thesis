import { createClient } from "@/utils/supabase/server-props";
import { NextResponse } from "next/server";

export async function DELETE() {
  try {
    const supabase = createClient() 

    const { error } = await supabase.auth.signOut()

    if(error) {
      console.error('Error', error)
      return NextResponse.json({ message: 'Unable to logout'}, { status: 403})
    }

    return NextResponse.json({success: true, message: 'Logout success'})
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Theirs a problem singning out your account'})
  }
}