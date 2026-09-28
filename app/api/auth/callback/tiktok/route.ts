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
    // 1. Exchange authorization code for TikTok access token
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI!,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      console.error("TikTok token error:", tokenData);
      return NextResponse.redirect(`${origin}/dashboard?error=Token+exchange+failed`);
    }

    const accessToken = tokenData.access_token;
    const openId = tokenData.open_id;

    // 2. Initialize Supabase SSR client
    const cookieStore = await cookies();
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
            } catch {}
          },
        },
      }
    );

    // 3. Get current logged-in Supabase user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${origin}/login?error=Not+authenticated`);
    }

    // 4. Update the profile row with the new TikTok access token
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

    // Redirect back to dashboard on success
    return NextResponse.redirect(`${origin}/dashboard`);
  } catch (err: any) {
    console.error("Callback error:", err);
    return NextResponse.redirect(`${origin}/dashboard?error=Unexpected+error`);
  }
}
