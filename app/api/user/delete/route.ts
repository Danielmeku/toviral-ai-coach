import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verify user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Delete user data from your application tables (e.g., connected accounts, cached videos, tokens)
    const { error: dbError } = await supabase
      .from('connected_accounts') // Replace with your actual table name storing TikTok tokens/data
      .delete()
      .eq('user_id', userId);

    if (dbError) {
      console.error('Failed to delete user database records:', dbError.message);
    }

    // 2. Sign out the user and clear cookies
    await supabase.auth.signOut();

    return NextResponse.json({ success: true, message: 'Account data deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Server error during account deletion:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
