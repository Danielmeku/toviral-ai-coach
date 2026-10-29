import { createClient } from '@supabase/supabase-js';

// Supabase client instance using service role key or public client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface TikTokVideoMetric {
  id: string;
  title: string;
  playCount: number;
  diggCount: number; // Likes
  commentCount: number;
  shareCount: number;
  createdTime: number;
}

/**
 * Validates the stored access token and automatically refreshes it using the refresh token if expired.
 * @param userId The Supabase user ID
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('tiktok_access_token, tiktok_refresh_token, tiktok_token_expires_at')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = profile.tiktok_token_expires_at || 0;

  // 1. If access token is valid (with 5-minute safety window), return it
  if (profile.tiktok_access_token && expiresAt - now > 300) {
    return profile.tiktok_access_token;
  }

  // 2. If access token is expired, attempt token refresh using refresh token
  if (!profile.tiktok_refresh_token) {
    return profile.tiktok_access_token || null; // Fallback to current token if refresh token is unavailable
  }

  try {
    const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        client_key: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: profile.tiktok_refresh_token,
      }),
    });

    const data = await res.json();

    if (data.access_token) {
      const newExpiresAt = Math.floor(Date.now() / 1000) + (data.expires_in || 86400);

      await supabase
        .from('profiles')
        .update({
          tiktok_access_token: data.access_token,
          tiktok_refresh_token: data.refresh_token || profile.tiktok_refresh_token,
          tiktok_token_expires_at: newExpiresAt,
        })
        .eq('id', userId);

      return data.access_token;
    }
  } catch (err) {
    console.error('Failed to refresh TikTok access token:', err);
  }

  return profile.tiktok_access_token || null;
}

/**
 * Fetches user video list & metrics using the official TikTok v2 Display API
 * @param accessToken The OAuth access token obtained during user login
 */
export async function fetchTikTokStats(accessToken: string): Promise<TikTokVideoMetric[]> {
  if (!accessToken) {
    throw new Error('TikTok access token is required');
  }

  // Official TikTok API v2 endpoint for user video list
  const url = 'https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,create_time,like_count,comment_count,share_count,view_count';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      max_count: 20,
    }),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Official TikTok API request failed (${response.status}): ${errorText}`);
  }

  const resData = await response.json();

  if (resData.error && resData.error.code !== 'ok') {
    throw new Error(`TikTok API error: ${resData.error.message || resData.error.code}`);
  }

  const videos = resData?.data?.videos || [];

  if (!Array.isArray(videos) || videos.length === 0) {
    return [];
  }

  return videos.map((video: any, index: number) => ({
    id: String(video.id || `video-${index + 1}`),
    title: video.title || video.video_description || `Video ${index + 1}`,
    playCount: Number(video.view_count || 0),
    diggCount: Number(video.like_count || 0),
    commentCount: Number(video.comment_count || 0),
    shareCount: Number(video.share_count || 0),
    createdTime: Number(video.create_time || Math.floor(Date.now() / 1000)),
  }));
}
