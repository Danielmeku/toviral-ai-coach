import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const origin = new URL(request.url).origin;
  
  // Must match EXACTLY what is in TikTok Developer Portal
  const redirectUri = encodeURIComponent(`${origin}/api/auth/callback/tiktok`);
  const scope = 'user.info.basic,video.list';

  // Construct official TikTok v2 authorization URL
  const tiktokAuthUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}`;

  return NextResponse.redirect(tiktokAuthUrl);
}
