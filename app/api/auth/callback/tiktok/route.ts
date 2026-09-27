import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  // Check if TikTok returned an explicit error parameter
  const tiktokError = requestUrl.searchParams.get('error') || requestUrl.searchParams.get('error_description');
  if (tiktokError) {
    return NextResponse.redirect(new URL(`/onboarding?error=${encodeURIComponent(tiktokError)}`, origin));
  }

  const code = requestUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/onboarding?error=no_code_from_tiktok', origin));
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim();
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim();
  const redirectUri = `${origin}/api/auth/callback/tiktok`;

  try {
    // 1. Exchange authorization code for TikTok access token
    const bodyParams = new URLSearchParams({
      client_key: clientKey!,
      client_secret: clientSecret!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: bodyParams.toString(),
    });

    const tokenData = await tokenResponse.json();

    console.log("TikTok Token Exchange Response:", JSON.stringify(tokenData));

    // Extract access_token & open_id (handling v2 top-level or data wrapper)
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

    // Capture specific error description returned by TikTok
    const errorDetails = tokenData.error_description || tokenData.message || tokenData.error || 'token_exchange_failed';
    return NextResponse.redirect(new URL(`/onboarding?error=${encodeURIComponent(errorDetails)}`, origin));

  } catch (err: any) {
    return NextResponse.redirect(new URL(`/onboarding?error=${encodeURIComponent(err.message)}`, origin));
  }
}
