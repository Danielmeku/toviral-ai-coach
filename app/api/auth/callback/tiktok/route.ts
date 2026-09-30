import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

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

    // 1. Exchange code with TikTok
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
      console.error("TikTok API Token Error:", tokenData);
      return NextResponse.redirect(
        `${origin}/dashboard?error=${encodeURIComponent(
          tokenData.error_description || tokenData.error || "Token exchange failed"
        )}`
      );
    }

    const accessToken = tokenData.data?.access_token || tokenData.access_token;
    const openId = tokenData.data?.open_id || tokenData.open_id;

    if (!accessToken) {
      return NextResponse.redirect(`${origin}/dashboard?error=No+token+returned`);
    }

    // 2. Save tokens in HTTP-Only secure cookies
    const cookieStore = await cookies();
    cookieStore.set("tt_access_token", accessToken, {
      httpOnly: false, // allow client-side sync
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    if (openId) {
      cookieStore.set("tt_open_id", openId, {
        httpOnly: false,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    // 3. Redirect to dashboard with sync trigger flag
    return NextResponse.redirect(`${origin}/dashboard?sync_tiktok=true`);
  } catch (err: any) {
    console.error("Callback exception:", err);
    return NextResponse.redirect(`${origin}/dashboard?error=Unexpected+error`);
  }
}
