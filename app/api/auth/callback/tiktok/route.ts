import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/dashboard?error=Missing+code`);
  }

  try {
    // 1. Force the exact same client key used in the frontend onboarding authorization step
    const clientKey = (
      process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY || 
      process.env.TIKTOK_CLIENT_KEY || 
      ""
    ).trim();
    
    const clientSecret = (process.env.TIKTOK_CLIENT_SECRET || "").trim();
    const redirectUri = "https://toviral-ai.vercel.app/api/auth/callback/tiktok";

    // 2. Exchange authorization code for TikTok access token
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: code.trim(),
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error || tokenData.error_code) {
      console.error("TikTok Token Exchange Error Response:", tokenData);
      return NextResponse.redirect(
        `${origin}/dashboard?error=${encodeURIComponent(
          tokenData.error_description || tokenData.error || "Token+exchange+failed"
        )}`
      );
    }

    const accessToken = tokenData.data?.access_token || tokenData.access_token;
    const openId = tokenData.data?.open_id || tokenData.open_id;

    if (!accessToken) {
      return NextResponse.redirect(`${origin}/dashboard?error=No+access+token`);
    }

    // 3. Initialize Supabase SSR client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    // 4. Get current user & update database
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${origin}/login?error=Not+authenticated`);
    }

    const { error: dbError } = await supabase.from("profiles").upsert({
      id: user.id,
      tiktok_access_token: accessToken,
      tiktok_open_id: openId,
      updated_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("Database save error:", dbError);
      return NextResponse.redirect(`${origin}/dashboard?error=Failed+to+save+token`);
    }

    return NextResponse.redirect(`${origin}/dashboard`);
  } catch (err: any) {
    console.error("Callback error:", err);
    return NextResponse.redirect(`${origin}/dashboard?error=Unexpected+error`);
  }
}
