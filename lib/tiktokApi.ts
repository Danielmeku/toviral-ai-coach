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

  // STEP 1: Search user to get profile data matching tikwm/tiktok-scraper7 schema
  const userUrl = `https://${host}/user/search?keywords=${encodeURIComponent(cleanHandle)}&count=10&cursor=0`;
  const userRes = await fetch(userUrl, { method: 'GET', headers, next: { revalidate: 3600 } });

  if (!userRes.ok) {
    const errorText = await userRes.text();
    throw new Error(`User lookup failed (${userRes.status}): ${errorText || userRes.statusText}`);
  }

  const userData = await userRes.json();
  const userList = userData?.user_list || userData?.data || [];
  const matchedUser = userList[0]?.user_info || userList[0]?.user || userList[0];

  if (!matchedUser) {
    throw new Error(`Could not locate user profile details for "${cleanHandle}"`);
  }

  // STEP 2: Format extracted profile metrics into the existing TikTokVideoMetric signature
  return [
    {
      id: String(matchedUser.uid || matchedUser.id || '1'),
      title: `${matchedUser.nickname || cleanHandle}'s Profile Overview`,
      playCount: Number(matchedUser.total_favorited || matchedUser.follower_count || 0),
      diggCount: Number(matchedUser.total_favorited || 0),
      commentCount: Number(matchedUser.aweme_count || 0),
      shareCount: Number(matchedUser.follower_count || 0),
      createdTime: Number(matchedUser.create_time || Date.now() / 1000),
    },
  ];
}
