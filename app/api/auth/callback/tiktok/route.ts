import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const stateUserId = searchParams.get("state");

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

    // 1. Exchange code for TikTok Access Token
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
      console.error("TikTok API Exchange Failure:", JSON.stringify(tokenData));
      return NextResponse.redirect(
        `${origin}/dashboard?error=${encodeURIComponent(
          tokenData.error_description || tokenData.error || "Token exchange failed"
        )}`
      );
    }

    const accessToken = tokenData.data?.access_token || tokenData.access_token;
    const openId = tokenData.data?.open_id || tokenData.open_id;

    if (!accessToken || !stateUserId) {
      console.error("Missing token or stateUserId. stateUserId:", stateUserId);
      return NextResponse.redirect(`${origin}/dashboard?error=Missing+user+id`);
    }

    // 2. Initialize Supabase Admin with Service Role Key (bypasses RLS)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in env");
      return NextResponse.redirect(`${origin}/dashboard?error=Server+config+error`);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 3. Update the existing profile row directly
    const { data, error: dbError } = await supabaseAdmin
      .from("profiles")
      .update({
        tiktok_access_token: accessToken,
        tiktok_open_id: openId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", stateUserId)
      .select();

    if (dbError) {
      console.error("Supabase Update Error Detailed:", JSON.stringify(dbError));
      return NextResponse.redirect(`${origin}/dashboard?error=Database+save+failed`);
    }

    // If update affected 0 rows, fallback to insert
    if (!data || data.length === 0) {
      const { error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: stateUserId,
          tiktok_access_token: accessToken,
          tiktok_open_id: openId,
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Supabase Insert Error Detailed:", JSON.stringify(insertError));
        return NextResponse.redirect(`${origin}/dashboard?error=Database+save+failed`);
      }
    }

    return NextResponse.redirect(`${origin}/dashboard`);
  } catch (err: any) {
    console.error("Callback exception:", err);
    return NextResponse.redirect(`${origin}/dashboard?error=Unexpected+error`);
  }
}
