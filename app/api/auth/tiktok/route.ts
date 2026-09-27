import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/onboarding?error=no_code', origin));
  }

  try {
    // 1. Exchange 'code' for access token with TikTok API
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

    // Log response in Vercel Server Logs for inspection
    console.log("TikTok Token Exchange Response:", JSON.stringify(tokenData));

    // TikTok OAuth v2 returns access_token directly or under data object
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

    // Capture TikTok error message if exchange failed
    const errorMsg = encodeURIComponent(
      tokenData.error_description || tokenData.message || tokenData.error || 'token_exchange_failed'
    );
    return NextResponse.redirect(new URL(`/onboarding?error=${errorMsg}`, origin));

  } catch (err: any) {
    console.error("TikTok Callback Exception:", err);
    return NextResponse.redirect(new URL(`/onboarding?error=${encodeURIComponent(err.message)}`, origin));
  }
}
