import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  
  // Extract host origin dynamically from request header/URL
  const origin = new URL(request.url).origin;
  const redirectUri = encodeURIComponent(`${origin}/api/auth/callback/tiktok`);
  const scope = 'user.info.basic,video.list';

  // TikTok v2 Authorization URL
  const tiktokAuthUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}`;

  return NextResponse.redirect(tiktokAuthUrl);
}
