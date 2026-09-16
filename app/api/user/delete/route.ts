import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function DELETE() {
  try {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );

    // Verify authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete user records from your database
    const { error: dbError } = await supabase
      .from('connected_accounts')
      .delete()
      .eq('user_id', user.id);

    if (dbError) {
      console.error('Failed to delete database records:', dbError.message);
    }

    // Sign out user session
    await supabase.auth.signOut();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Server error during account deletion:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
