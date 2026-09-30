'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function OnboardingPage() {
  const [fullName, setFullName] = useState('')
  const [handle, setHandle] = useState('')
  const [niche, setNiche] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?error=Please+log+in+first')
      } else {
        setCheckingAuth(false)
      }
    }
    checkUser()
  }, [router, supabase])

  const handleTikTokConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert("Please log in before connecting TikTok.")
        setLoading(false)
        return
      }

      // 1. Save profile fields
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName,
        tiktok_handle: handle.replace(/^@/, '').trim(),
        niche: niche,
      })

      // 2. Build authorization URL
      const clientKey = (process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY || "").trim()
      const redirectUri = encodeURIComponent("https://toviral-ai.vercel.app/api/auth/callback/tiktok")
      const scope = encodeURIComponent("user.info.basic,video.list")
      const state = encodeURIComponent(user.id)

      window.location.href = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`
    } catch (err: any) {
      alert(`Error: ${err.message}`)
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p className="text-sm text-gray-400">Verifying session...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 flex justify-center items-center bg-gray-950 text-white">
      <form onSubmit={handleTikTokConnect} className="w-full max-w-lg bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-sm space-y-4">
        <h2 className="text-xl font-bold">Profile Setup</h2>
        
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input 
            className="w-full border border-gray-700 bg-transparent p-2.5 rounded-xl text-sm" 
            onChange={(e) => setFullName(e.target.value)} 
            value={fullName}
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">TikTok Handle</label>
          <input 
            className="w-full border border-gray-700 bg-transparent p-2.5 rounded-xl text-sm" 
            onChange={(e) => setHandle(e.target.value)} 
            value={handle}
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Niche</label>
          <input 
            className="w-full border border-gray-700 bg-transparent p-2.5 rounded-xl text-sm" 
            onChange={(e) => setNiche(e.target.value)} 
            value={niche}
            required 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-semibold text-sm transition disabled:opacity-50"
        >
          {loading ? "Connecting..." : "Save & Authorize TikTok"}
        </button>
      </form>
    </div>
  )
}
