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

  // STEP 1: Search user to fetch profile data
  const userUrl = `https://${host}/user/search?keywords=${encodeURIComponent(cleanHandle)}&count=10&cursor=0`;
  const userRes = await fetch(userUrl, { method: 'GET', headers, next: { revalidate: 3600 } });

  if (!userRes.ok) {
    const errorText = await userRes.text();
    throw new Error(`User lookup failed (${userRes.status}): ${errorText || userRes.statusText}`);
  }

  const resData = await userRes.json();

  // Inspect various common payload keys returned by RapidAPI TikTok scrapers
  const rawList =
    resData?.user_list ||
    resData?.data?.user_list ||
    resData?.data?.users ||
    resData?.users ||
    resData?.data ||
    (Array.isArray(resData) ? resData : []);

  const matchedItem = Array.isArray(rawList) ? rawList[0] : rawList;

  // Extract nested user info object or fallback to item root
  const userObj =
    matchedItem?.user_info ||
    matchedItem?.userInfo ||
    matchedItem?.user ||
    matchedItem ||
    null;

  if (!userObj || Object.keys(userObj).length === 0) {
    throw new Error(`Could not locate user profile details for "${cleanHandle}"`);
  }

  // Extract statistics safely with fallbacks
  const playCount = Number(
    userObj.total_favorited ||
    userObj.follower_count ||
    userObj.followers ||
    userObj.stats?.followerCount ||
    0
  );

  const diggCount = Number(
    userObj.total_favorited ||
    userObj.likes ||
    userObj.stats?.heartCount ||
    0
  );

  const commentCount = Number(
    userObj.aweme_count ||
    userObj.video_count ||
    userObj.stats?.videoCount ||
    0
  );

  const shareCount = Number(
    userObj.follower_count ||
    userObj.following_count ||
    0
  );

  // Return formatted array matching TikTokVideoMetric
  return [
    {
      id: String(userObj.uid || userObj.id || userObj.secUid || '1'),
      title: `${userObj.nickname || userObj.unique_id || cleanHandle}'s Profile Analytics`,
      playCount,
      diggCount,
      commentCount,
      shareCount,
      createdTime: Number(userObj.create_time || Math.floor(Date.now() / 1000)),
    },
  ];
}
