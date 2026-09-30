import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // state contains user_id if passed during authorization

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard?error=missing_code", request.url));
  }

  try {
    // 1. Exchange OAuth code for access token with TikTok
    const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI!,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("TikTok token exchange failed:", tokenData);
      return NextResponse.redirect(new URL("/dashboard?error=token_exchange_failed", request.url));
    }

    const { access_token, open_id } = tokenData;

    // 2. Initialize Supabase Admin Client using Service Role Key (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. Get the authenticated user ID from session/cookie or state parameter
    // If you pass user.id in the OAuth state parameter:
    let userId = state;

    if (!userId) {
      // Alternatively, resolve user from the Supabase auth cookie directly on the server
      const { data: { user } } = await supabaseAdmin.auth.getUser();
      userId = user?.id || null;
    }

    if (userId) {
      // 4. Directly update the profile table in Supabase on the server
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
      }
    }

    // 5. Clean redirect back to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err: any) {
    console.error("Callback handler error:", err);
    return NextResponse.redirect(new URL("/dashboard?error=server_error", request.url));
  }
}
