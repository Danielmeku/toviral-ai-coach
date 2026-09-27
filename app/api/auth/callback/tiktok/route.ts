import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  
  // Check for error parameters returned directly by TikTok
  const errorFromTikTok = requestUrl.searchParams.get('error') || requestUrl.searchParams.get('error_description');
  if (errorFromTikTok) {
    return NextResponse.redirect(new URL(`/onboarding?error=${encodeURIComponent(errorFromTikTok)}`, origin));
  }

  const code = requestUrl.searchParams.get('code');

  // If no code parameter was passed by TikTok
  if (!code) {
    return NextResponse.redirect(new URL('/onboarding?error=no_code_from_tiktok', origin));
  }

  try {
    // Exchange authorization code for TikTok access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${origin}/api/auth/callback/tiktok`,
      }),
    });

    const tokenData = await tokenResponse.json();

    const accessToken = tokenData.access_token || tokenData.data?.access_token;
    const openId = tokenData.open_id || tokenData.data?.open_id;

    if (accessToken) {
      const cookieStore = cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
      );

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          tiktok_access_token: accessToken,
          tiktok_open_id: openId,
        });
      }

      return NextResponse.redirect(new URL('/dashboard', origin));
    }

    const errDesc = tokenData.error_description || tokenData.message || tokenData.error || 'token_exchange_failed';
    return NextResponse.redirect(new URL(`/onboarding?error=${encodeURIComponent(errDesc)}`, origin));

  } catch (err: any) {
    return NextResponse.redirect(new URL(`/onboarding?error=${encodeURIComponent(err.message)}`, origin));
  }
}
