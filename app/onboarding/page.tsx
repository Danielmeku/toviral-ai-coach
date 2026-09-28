'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function OnboardingPage() {
  const [fullName, setFullName] = useState('')
  const [handle, setHandle] = useState('')
  const [niche, setNiche] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleTikTokConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // 1. Save onboarding profile details to Supabase if logged in
      if (user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: user.id,
          full_name: fullName,
          tiktok_handle: handle.replace(/^@/, '').trim(),
          niche: niche,
        })

        if (profileError) {
          console.warn("Profile save warning:", profileError.message)
        }
      }

      // 2. Direct browser redirect to official TikTok OAuth Endpoint
      const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY || process.env.TIKTOK_CLIENT_KEY
      const redirectUri = encodeURIComponent("https://toviral-ai.vercel.app/api/auth/callback/tiktok")
      const scope = encodeURIComponent("user.info.basic,video.list")
      const csrfState = Math.random().toString(36).substring(2, 15)

      const tiktokAuthUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}&state=${csrfState}`

      // Trigger full browser navigation to TikTok
      window.location.href = tiktokAuthUrl
    } catch (err: any) {
      alert(`Unexpected error: ${err.message}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4 flex justify-center items-center bg-gray-50 dark:bg-gray-950">
      <form onSubmit={handleTikTokConnect} className="w-full max-w-lg bg-white dark:bg-gray-900 border dark:border-gray-800 p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Setup</h2>
          <p className="text-xs text-gray-500 mt-1">Fill in your details and connect your TikTok account to view analytics.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
          <input 
            className="w-full border dark:border-gray-700 bg-transparent p-2.5 rounded-xl mt-1 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600" 
            onChange={(e) => setFullName(e.target.value)} 
            value={fullName}
            placeholder="John Doe"
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">TikTok Handle</label>
          <input 
            className="w-full border dark:border-gray-700 bg-transparent p-2.5 rounded-xl mt-1 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600" 
            onChange={(e) => setHandle(e.target.value)} 
            value={handle}
            placeholder="username (without @)"
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Niche</label>
          <input 
            className="w-full border dark:border-gray-700 bg-transparent p-2.5 rounded-xl mt-1 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600" 
            placeholder="e.g. Fitness, Tech, Gaming" 
            onChange={(e) => setNiche(e.target.value)} 
            value={niche}
            required 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full mt-2 bg-black hover:bg-gray-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white p-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            "Connecting..."
          ) : (
            <>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 448 512">
                <path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25V349.38A162.55 162.55 0 1 1 185 188.31V258.2a90.08 90.08 0 1 0 51.7 81.67V0h68.52a141.43 141.43 0 0 0 3.1 29.43 141.32 141.32 0 0 0 20.3 40.61A143.15 143.15 0 0 0 380 102.39a141.07 141.07 0 0 0 68 18.52z"/>
              </svg>
              Save & Authorize TikTok
            </>
          )}
        </button>
      </form>
    </div>
  )
}
