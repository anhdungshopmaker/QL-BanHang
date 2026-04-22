import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password, fullName, role, shopId, username, staffCode } = await req.json();

    // Use Service Role to bypass RLS and create users
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Create user in Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (authError) throw authError;

    // 2. Update the profile (Trigger might have created one, but we need to set shop_id, role, username, staff_code)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        shop_id: shopId,
        role: role,
        full_name: fullName,
        username: username,
        staff_code: staffCode
      })
      .eq('id', authUser.user.id);

    if (profileError) throw profileError;

    return NextResponse.json({ success: true, user: authUser.user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
