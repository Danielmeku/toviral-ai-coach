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
