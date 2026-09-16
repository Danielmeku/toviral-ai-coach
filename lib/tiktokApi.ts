export interface TikTokVideoMetric {
  id: string;
  title: string;
  playCount: number;
  diggCount: number; // Likes
  commentCount: number;
  shareCount: number;
  createdTime: number;
}

export async function fetchTikTokStats(handle: string): Promise<TikTokVideoMetric[]> {
  const cleanHandle = handle.replace(/^@/, '').trim();

  if (!cleanHandle) {
    throw new Error('A valid TikTok username is required');
  }

  const host = process.env.RAPIDAPI_HOST || 'tiktok-scraper7.p.rapidapi.com';
  const apiKey = process.env.RAPIDAPI_KEY || '';

  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY is missing from environment variables');
  }

  const headers = {
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': host,
  };

  // 1. Fetch user post feed/videos list directly
  const postsUrl = `https://${host}/user/posts?unique_id=${encodeURIComponent(cleanHandle)}&count=30&cursor=0`;
  let postsRes = await fetch(postsUrl, { method: 'GET', headers, next: { revalidate: 3600 } });

  // Fallback to secondary endpoint structure if first endpoint fails
  if (!postsRes.ok) {
    const searchUrl = `https://${host}/user/search?keywords=${encodeURIComponent(cleanHandle)}&count=10`;
    postsRes = await fetch(searchUrl, { method: 'GET', headers, next: { revalidate: 3600 } });
  }

  if (!postsRes.ok) {
    const errorText = await postsRes.text();
    throw new Error(`Data fetch failed (${postsRes.status}): ${errorText || postsRes.statusText}`);
  }

  const resData = await postsRes.json();

  // Extract array of individual videos
  const rawPosts =
    resData?.data?.videos ||
    resData?.data?.itemList ||
    resData?.videos ||
    resData?.itemList ||
    resData?.data ||
    (Array.isArray(resData) ? resData : []);

  if (!Array.isArray(rawPosts) || rawPosts.length === 0) {
    throw new Error(`No videos found for user "${cleanHandle}"`);
  }

  // 2. Map every video post to its metrics array
  return rawPosts.map((item: any, index: number) => {
    const stats = item.statistics || item.stats || item;

    return {
      id: String(item.id || item.video_id || item.aweme_id || index + 1),
      title: item.title || item.desc || item.share_info?.share_desc || `Video ${index + 1}`,
      playCount: Number(stats.play_count || stats.playCount || stats.views || 0),
      diggCount: Number(stats.digg_count || stats.diggCount || stats.likes || 0),
      commentCount: Number(stats.comment_count || stats.commentCount || stats.comments || 0),
      shareCount: Number(stats.share_count || stats.shareCount || stats.shares || 0),
      createdTime: Number(item.create_time || item.createTime || Math.floor(Date.now() / 1000)),
    };
  });
}
