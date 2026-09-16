import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function DELETE() {
  try {
    const cookieStore = cookies();

    // 1. Authenticate user
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
              // Called from Server Component
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

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: Missing admin key' },
        { status: 500 }
      );
    }

    // 2. Initialize Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 3. Delete user data from all custom application tables first
    await supabaseAdmin.from('connected_accounts').delete().eq('user_id', user.id);
    // Add any other user tables if you have them (e.g. profiles, analytics_cache, etc.)
    // await supabaseAdmin.from('profiles').delete().eq('id', user.id);

    // 4. Delete user permanently from Supabase Auth
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (authDeleteError) {
      console.error('Supabase Auth Admin Delete Error:', authDeleteError.message);
      return NextResponse.json(
        { error: `Auth deletion failed: ${authDeleteError.message}` },
        { status: 500 }
      );
    }

    // 5. Sign out session
    await supabaseSSR.auth.signOut();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Server error during account deletion:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
