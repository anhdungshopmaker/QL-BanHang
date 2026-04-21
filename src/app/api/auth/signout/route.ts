import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const cookieStore = cookies()
  const allCookies = cookieStore.getAll()

  const response = NextResponse.redirect(new URL('/login', request.url), {
    status: 303,
  })

  allCookies.forEach(cookie => {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.delete(cookie.name)
    }
  })

  return response
}
