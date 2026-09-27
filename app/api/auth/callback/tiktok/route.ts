import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  const code = requestUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/onboarding?error=no_code_from_tiktok', origin));
  }

  try {
    const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim();
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim();
    const redirectUri = `${origin}/api/auth/callback/tiktok`;

    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        client_key: clientKey!,
        client_secret: clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }).toString(),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token || tokenData.data?.access_token;
    const openId = tokenData.open_id || tokenData.data?.open_id;

    if (accessToken) {
      const cookieStore = cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: any) {
              cookieStore.set({ name, value, ...options });
            },
            remove(name: string, options: any) {
              cookieStore.set({ name, value: '', ...options });
            },
          },
        }
      );

      // 2. Get active user session
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Save token to profile associated with the authenticated user ID
        const { error: upsertErr } = await supabase.from('profiles').upsert({
          id: user.id,
          tiktok_access_token: accessToken,
          tiktok_open_id: openId,
          updated_at: new Date().toISOString(),
        });

        if (upsertErr) {
          console.error("Failed to update profile token:", upsertErr);
        }
      } else {
        console.warn("No active Supabase user session found during TikTok callback execution.");
      }

      return NextResponse.redirect(new URL('/dashboard', origin));
    }

    const errorDetails = tokenData.error_description || tokenData.message || 'token_exchange_failed';
    return NextResponse.redirect(new URL(`/onboarding?error=${encodeURIComponent(errorDetails)}`, origin));

  } catch (err: any) {
    return NextResponse.redirect(new URL(`/onboarding?error=${encodeURIComponent(err.message)}`, origin));
  }
}
