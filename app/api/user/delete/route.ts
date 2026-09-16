import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function DELETE() {
  try {
    const cookieStore = cookies();

    // 1. Authenticate the requesting user via SSR client
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Called from a Server Component
            }
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseSSR.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Delete user data from application tables
    const { error: dbError } = await supabaseSSR
      .from('connected_accounts')
      .delete()
      .eq('user_id', user.id);

    if (dbError) {
      console.error('Failed to delete database records:', dbError.message);
    }

    // 3. Initialize Admin Client to permanently delete the Auth account
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (authDeleteError) {
      console.error('Failed to delete user from Supabase Auth:', authDeleteError.message);
      return NextResponse.json({ error: 'Failed to delete user account' }, { status: 500 });
    }

    // 4. Sign out the session
    await supabaseSSR.auth.signOut();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Server error during account deletion:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
