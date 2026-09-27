import { NextResponse } from 'next/server';
import { fetchTikTokStats } from '@/lib/tiktokApi';

async function handleTikTokFetch(accessToken: string | null) {
  if (!accessToken) {
    return NextResponse.json(
      { error: 'TikTok Access Token is required' },
      { status: 400 }
    );
  }

  try {
    const metrics = await fetchTikTokStats(accessToken);
    return NextResponse.json({ success: true, metrics });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error fetching data from TikTok API' },
      { status: 500 }
    );
  }
}

// 1. GET Handler (?access_token=...)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accessToken = searchParams.get('access_token') || searchParams.get('token');
  return handleTikTokFetch(accessToken);
}

// 2. POST Handler ({ access_token: "..." })
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accessToken = body.access_token || body.accessToken || body.token;
    return handleTikTokFetch(accessToken);
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid JSON request body' },
      { status: 400 }
    );
  }
}
