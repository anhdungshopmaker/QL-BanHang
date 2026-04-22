import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const supabase = await createClient()

  // 1. logout Supabase
  await supabase.auth.signOut()

  // 2. Lấy cookieStore (Bắt buộc dùng await trong phiên bản Next.js này)
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  const response = NextResponse.redirect(
    new URL('/login', request.url),
    { status: 303 }
  )

  // 3. Xóa triệt để các session cookie của Supabase
  allCookies.forEach((cookie) => {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.delete(cookie.name)
    }
  })

  return response
}
