'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function syncTikTokTokens() {
      const shouldSync = searchParams.get('sync_tiktok')
      if (!shouldSync) return

      // Helper function to read cookie value
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(';').shift()
        return null
      }

      const accessToken = getCookie('tt_access_token')
      const openId = getCookie('tt_open_id')

      if (!accessToken) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update user profile directly from client session (bypasses cross-site RLS locks)
      const { error } = await supabase
        .from('profiles')
        .update({
          tiktok_access_token: accessToken,
          tiktok_open_id: openId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (!error) {
        // Clean URL parameters and refresh
        router.replace('/dashboard')
        router.refresh()
      } else {
        console.error("Client DB sync error:", error.message)
      }
    }

    syncTikTokTokens()
  }, [searchParams, supabase, router])

  // ... rest of your Dashboard UI component
}
