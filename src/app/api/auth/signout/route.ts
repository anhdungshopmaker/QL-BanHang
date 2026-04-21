import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  return handleSignout(request);
}

export async function GET(request: Request) {
  return handleSignout(request);
}

async function handleSignout(request: Request) {
  const supabase = await createClient()

  // Sign out from Supabase (this will handle clearing the session cookies via the cookie store)
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Error during sign out:', error)
  }

  // Clear all Next.js server-side cache for the dashboard
  revalidatePath('/', 'layout')

  const response = NextResponse.redirect(new URL('/login', request.url), {
    status: 303,
  })

  // Aggressively clear client-side cache
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
}
