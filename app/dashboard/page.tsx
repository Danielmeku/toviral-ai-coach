"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import AnalyticsView from "@/components/AnalyticsView";
import TikTokCoachChat from "@/components/AiCoachChat";
import TermsModal from "@/components/TermsModal";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<"videos" | "analytics" | "coach">("analytics");
  const [videos, setVideos] = useState<any[]>([]);
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchTikTokData = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // 1. Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated. Please log in.");
      }

      // 2. Fetch the stored TikTok token from the profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("tiktok_access_token, tiktok_handle")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.tiktok_access_token) {
        throw new Error("No TikTok access token found. Please sign in with TikTok.");
      }

      if (profile.tiktok_handle) {
        setHandle(profile.tiktok_handle);
      }

      // 3. Request metrics using stored access token
      const res = await fetch("/api/tiktok/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: profile.tiktok_access_token }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to fetch metrics");
      }

      setVideos(data.metrics || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Sync TikTok cookie token to Supabase profile directly from browser session
  useEffect(() => {
    async function syncAndInit() {
      const { data: { user } } = await supabase.auth.getUser();

      // Terms modal check
      if (user && !user.user_metadata?.has_accepted_terms) {
        setShowTermsModal(true);
      }

      // Read cookie helper
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift();
        return null;
      };

      const syncFlag = searchParams.get("sync_tiktok");
      const accessToken = getCookie("tt_access_token");
      const openId = getCookie("tt_open_id");

      // If redirected from TikTok callback with token cookie
      if ((syncFlag || accessToken) && user) {
        if (accessToken) {
          const { error: updateErr } = await supabase
            .from("profiles")
            .update({
              tiktok_access_token: accessToken,
              tiktok_open_id: openId || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

          if (updateErr) {
            console.error("Failed to sync TikTok token to Supabase:", updateErr.message);
          } else {
            // Clear URL query parameters after sync
            router.replace("/dashboard");
          }
        }
      }

      // Load metrics for account
      fetchTikTokData();
    }

    syncAndInit();
  }, [supabase, searchParams, router, fetchTikTokData]);

  const handleAcceptTerms = async () => {
    const { error } = await supabase.auth.updateUser({
      data: {
        has_accepted_terms: true,
        accepted_terms_at: new Date().toISOString(),
      },
    });

    if (!error) {
      setShowTermsModal(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This will permanently erase all your saved TikTok data, metrics, and tokens from our database. This action cannot be undone."
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete account. Please try again.");
        setDeleting(false);
      }
    } catch (err) {
      console.error("Account deletion failed:", err);
      alert("An unexpected error occurred while deleting your account.");
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* First-Time User Terms Modal */}
      {showTermsModal && <TermsModal onAccept={handleAcceptTerms} />}

      {/* Fetch Control */}
      <div className="flex items-center justify-between max-w-md">
        <button
          type="button"
          onClick={() => fetchTikTokData()}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh Stats"}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Tab Navigation Buttons */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-4">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === "analytics"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          Analytics Charts
        </button>
        <button
          onClick={() => setActiveTab("videos")}
          className={`pb-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === "videos"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          All Videos ({videos.length})
        </button>
        <button
          onClick={() => setActiveTab("coach")}
          className={`pb-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === "coach"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          🤖 AI Coach
        </button>
      </div>

      {/* Dynamic Tab Content */}
      {activeTab === "analytics" ? (
        <AnalyticsView videos={videos} />
      ) : activeTab === "videos" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((vid, index) => (
            <div key={vid.id || index} className="p-4 border dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 shadow-sm">
              <p className="font-medium text-sm line-clamp-2">{vid.title || "Untitled"}</p>
              <div className="mt-4 flex justify-between text-xs text-gray-500">
                <span>👁️ {(vid.playCount ?? vid.views ?? 0).toLocaleString()}</span>
                <span>❤️ {(vid.diggCount ?? vid.likes ?? 0).toLocaleString()}</span>
                <span>💬 {(vid.commentCount ?? vid.comments ?? 0).toLocaleString()}</span>
                <span>🔁 {(vid.shareCount ?? vid.shares ?? 0).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex justify-center">
          <TikTokCoachChat userAnalytics={{ handle, videoCount: videos.length, videos }} />
        </div>
      )}

      {/* Danger Zone: Account & Data Deletion */}
      <div className="mt-12 pt-6 border-t border-red-500/20 bg-red-950/10 rounded-xl p-5 space-y-3">
        <h3 className="text-base font-bold text-red-500">Please Read First!</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          Disconnect your TikTok integration, ToViral AI password and permanently delete all your stored analytics data from ToViral AI.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl transition disabled:opacity-50"
        >
          {deleting ? "Deleting Data..." : "Delete Account & All Data"}
        </button>
      </div>
    </div>
  );
}
