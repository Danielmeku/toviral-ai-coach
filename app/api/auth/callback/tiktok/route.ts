import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(`${origin}/dashboard?error=missing_code`);
  }

  // Ensure redirect URI matches exact environment setup
  const redirectUri =
    process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI ||
    `${origin}/api/tiktok/callback`;

  const clientKey = process.env.TIKTOK_CLIENT_KEY || process.env.TIKTOK_CLIENT_ID;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  try {
    // 1. Exchange OAuth code with TikTok API v2
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: new URLSearchParams({
        client_key: clientKey!,
        client_secret: clientSecret!,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();

    // Debugging details if exchange fails
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("TikTok OAuth Token Error details:", {
        status: tokenRes.status,
        data: tokenData,
        sentRedirectUri: redirectUri,
        clientKeyPresent: !!clientKey,
        clientSecretPresent: !!clientSecret,
      });
      return NextResponse.redirect(`${origin}/dashboard?error=token_exchange_failed`);
    }

    const { access_token, open_id } = tokenData;

    // 2. Identify the active logged-in user session
    const cookieStore = cookies();
    const supabaseUserClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabaseUserClient.auth.getUser();
    const userId = user?.id || state;

    if (!userId) {
      console.error("No authenticated user found during TikTok OAuth callback.");
      return NextResponse.redirect(`${origin}/dashboard?error=user_not_authenticated`);
    }

    // 3. Save access token directly using Admin Service Role (bypassing RLS restrictions)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: dbError } = await supabaseAdmin
      .from("profiles")
      .update({
        tiktok_access_token: access_token,
        tiktok_open_id: open_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (dbError) {
      console.error("Failed to update profile in database:", dbError.message);
      return NextResponse.redirect(`${origin}/dashboard?error=db_save_failed`);
    }

    // 4. Success redirect
    return NextResponse.redirect(`${origin}/dashboard`);
  } catch (err: any) {
    console.error("TikTok OAuth Callback catch error:", err);
    return NextResponse.redirect(`${origin}/dashboard?error=server_error`);
  }
}
