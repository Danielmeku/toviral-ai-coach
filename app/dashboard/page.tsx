"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import AnalyticsView from "@/components/AnalyticsView";
import TikTokCoachChat from "@/components/AiCoachChat";
import TermsModal from "@/components/TermsModal";

export default function DashboardPage() {
  const router = useRouter();
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

  useEffect(() => {
    async function checkTerms() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !user.user_metadata?.has_accepted_terms) {
        setShowTermsModal(true);
      }
    }
    checkTerms();
  }, [supabase]);

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

  const fetchTikTokData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tiktok/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
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

      {/* Fetch Form */}
      <form onSubmit={fetchTikTokData} className="flex gap-3 max-w-md">
        <input
          type="text"
          placeholder="Enter TikTok Handle (e.g. username(no @ needed))"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
        >
          {loading ? "Fetching..." : "Fetch Stats"}
        </button>
      </form>

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
        <h3 className="text-base font-bold text-red-500">Danger Zone</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          Disconnect your TikTok integration, revoke OAuth tokens, and permanently delete all your stored analytics data from ToViral AI.
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
