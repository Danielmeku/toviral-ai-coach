import { NextResponse } from 'next/server';
import { fetchTikTokStats, getValidAccessToken } from '@/lib/tiktokApi';

async function handleTikTokFetch(accessToken: string | null, userId: string | null) {
  let validToken = accessToken;

  // If userId is provided, ensure we resolve a fresh valid token via refresh logic
  if (userId) {
    const refreshedToken = await getValidAccessToken(userId);
    if (refreshedToken) {
      validToken = refreshedToken;
    }
  }

  if (!validToken) {
    return NextResponse.json(
      { error: 'TikTok Access Token is required' },
      { status: 400 }
    );
  }

  try {
    const metrics = await fetchTikTokStats(validToken);
    return NextResponse.json({ success: true, metrics });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error fetching data from TikTok API' },
      { status: 500 }
    );
  }
}

// 1. GET Handler (?access_token=...&userId=...)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accessToken = searchParams.get('access_token') || searchParams.get('token');
  const userId = searchParams.get('userId') || searchParams.get('user_id');
  return handleTikTokFetch(accessToken, userId);
}

// 2. POST Handler ({ access_token: "...", userId: "..." })
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accessToken = body.access_token || body.accessToken || body.token;
    const userId = body.userId || body.user_id;
    return handleTikTokFetch(accessToken, userId);
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid JSON request body' },
      { status: 400 }
    );
  }
}
