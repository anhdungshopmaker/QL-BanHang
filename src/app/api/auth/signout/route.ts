import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await (await createClient())
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Error during sign out:', error)
  }

  // Redirect to login page and clear the browser cache for this route structure
  return NextResponse.redirect(new URL('/login', request.url), {
    status: 303,
  })
}
