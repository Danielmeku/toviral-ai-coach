import { NextResponse } from 'next/server';

export async function GET() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`);
  const scope = 'user.info.basic,video.list';

  // TikTok v2 Authorization URL
  const tiktokAuthUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}`;

  return NextResponse.redirect(tiktokAuthUrl);
}
