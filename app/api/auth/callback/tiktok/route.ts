import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const stateUserId = searchParams.get("state"); // User ID passed from onboarding

  if (!code) {
    return NextResponse.redirect(`${origin}/dashboard?error=Missing+code`);
  }

  try {
    const clientKey = (
      process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY ||
      process.env.TIKTOK_CLIENT_KEY ||
      ""
    ).trim();
    const clientSecret = (process.env.TIKTOK_CLIENT_SECRET || "").trim();
    const redirectUri = "https://toviral-ai.vercel.app/api/auth/callback/tiktok";

    // 1. Exchange authorization code for TikTok access token
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
          tokenData.error_description || tokenData.error || "Token exchange failed"
        )}`
      );
    }

    const accessToken = tokenData.data?.access_token || tokenData.access_token;
    const openId = tokenData.data?.open_id || tokenData.open_id;

    if (!accessToken) {
      return NextResponse.redirect(`${origin}/dashboard?error=No+access+token`);
    }

    // 2. Identify Target User ID
    let targetUserId = stateUserId;

    if (!targetUserId) {
      // Fallback to checking cookie session if state was omitted
      const cookieStore = await cookies();
      const supabaseSSR = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
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
      const { data: { user } } = await supabaseSSR.auth.getUser();
      targetUserId = user?.id || null;
    }

    if (!targetUserId) {
      return NextResponse.redirect(`${origin}/login?error=Session+lost+during+redirect`);
    }

    // 3. Save directly via Supabase Admin Client using SUPABASE_SERVICE_ROLE_KEY
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: dbError } = await supabaseAdmin.from("profiles").upsert({
      id: targetUserId,
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
