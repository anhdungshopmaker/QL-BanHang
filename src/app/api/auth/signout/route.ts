import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  return handleSignout(request);
}

export async function GET(request: Request) {
  return handleSignout(request);
}

async function handleSignout(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  revalidatePath('/', 'layout')

  const response = NextResponse.redirect(new URL('/login', request.url), {
    status: 303,
  })

  // Bruteforce delete ALL tokens starting with 'sb-'
  allCookies.forEach(cookie => {
    if (cookie.name.startsWith('sb-')) {
       cookieStore.delete(cookie.name)
       response.cookies.delete(cookie.name)
    }
  })

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
}
