"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  BarChart2,
  LineChart as LineIcon,
  PieChart as PieIcon,
} from "lucide-react";

interface VideoData {
  id?: string;
  title?: string;
  desc?: string;
  date?: string;
  created_at?: string;
  views?: number | string;
  playCount?: number | string;
  viewCount?: number | string;
  view_count?: number | string;
  likes?: number | string;
  diggCount?: number | string;
  likeCount?: number | string;
  like_count?: number | string;
  shares?: number | string;
  shareCount?: number | string;
  share_count?: number | string;
  comments?: number | string;
  commentCount?: number | string;
  comment_count?: number | string;
}

interface NormalizedVideo {
  id: string;
  title: string;
  date: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
}

interface PieDataItem {
  name: string;
  value: number;
}

const COLORS = [
  "#3B82F6",
  "#EC4899",
  "#10B981",
  "#F59E0B",
];

export default function AnalyticsView({
  videos = [],
}: {
  videos?: VideoData[];
}) {
  const [activeTab, setActiveTab] = useState<"line" | "bar" | "pie">("line");
  const [selectedVideoId, setSelectedVideoId] = useState<string>("all");
  const [mounted, setMounted] = useState<boolean>(false);

  // Ensures charts render only on client side where DOM container dimensions exist
  useEffect(() => {
    setMounted(true);
  }, []);

  /*
   * Normalize API data
   */
  const normalizedVideos = useMemo<NormalizedVideo[]>(() => {
    return (videos || []).map((video, index) => {
      return {
        id: String(video.id ?? `video-${index}`),

        title:
          video.title ||
          video.desc ||
          `Video #${index + 1}`,

        date:
          video.date ||
          video.created_at ||
          `Video ${index + 1}`,

        views: Number(
          video.views ??
            video.playCount ??
            video.viewCount ??
            video.view_count ??
            0
        ),

        likes: Number(
          video.likes ??
            video.diggCount ??
            video.likeCount ??
            video.like_count ??
            0
        ),

        shares: Number(
          video.shares ??
            video.shareCount ??
            video.share_count ??
            0
        ),

        comments: Number(
          video.comments ??
            video.commentCount ??
            video.comment_count ??
            0
        ),
      };
    });
  }, [videos]);

  /*
   * Selected videos
   */
  const filteredVideos = useMemo(() => {
    if (selectedVideoId === "all") {
      return normalizedVideos;
    }

    return normalizedVideos.filter(
      (video) => video.id === selectedVideoId
    );
  }, [normalizedVideos, selectedVideoId]);

  /*
   * Pie chart data
   */
  const pieData = useMemo<PieDataItem[]>(() => {
    const totalViews = filteredVideos.reduce(
      (total, video) => total + video.views,
      0
    );

    const totalLikes = filteredVideos.reduce(
      (total, video) => total + video.likes,
      0
    );

    const totalShares = filteredVideos.reduce(
      (total, video) => total + video.shares,
      0
    );

    const totalComments = filteredVideos.reduce(
      (total, video) => total + video.comments,
      0
    );

    return [
      {
        name: "Views",
        value: totalViews,
      },
      {
        name: "Likes",
        value: totalLikes,
      },
      {
        name: "Shares",
        value: totalShares,
      },
      {
        name: "Comments",
        value: totalComments,
      },
    ].filter((item) => item.value > 0);
  }, [filteredVideos]);

  /*
   * Totals
   */
  const totals = useMemo(() => {
    return filteredVideos.reduce(
      (total, video) => ({
        views: total.views + video.views,
        likes: total.likes + video.likes,
        shares: total.shares + video.shares,
        comments: total.comments + video.comments,
      }),
      {
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
      }
    );
  }, [filteredVideos]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md border border-gray-200 dark:border-gray-800 space-y-6 my-6">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">

        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Analytics Overview
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Performance metrics breakdown
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">

          {/* Video selector */}
          <select
            value={selectedVideoId}
            onChange={(event) =>
              setSelectedVideoId(event.target.value)
            }
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">
              All Videos ({normalizedVideos.length})
            </option>

            {normalizedVideos.map((video) => (
              <option
                key={video.id}
                value={video.id}
              >
                {video.title.length > 30
                  ? `${video.title.substring(0, 30)}...`
                  : video.title}
              </option>
            ))}
          </select>

          {/* Chart controls */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">

            <button
              type="button"
              onClick={() => setActiveTab("line")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "line"
                  ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <LineIcon className="w-4 h-4 inline mr-1" />
              Trend
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("bar")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "bar"
                  ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <BarChart2 className="w-4 h-4 inline mr-1" />
              Bar
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("pie")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "pie"
                  ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <PieIcon className="w-4 h-4 inline mr-1" />
              Pie
            </button>

          </div>
        </div>
      </div>

      {/* Chart */}
      <div
        className="w-full min-h-[420px]"
        style={{ height: 420 }}
      >
        {filteredVideos.length === 0 ? (

          <div className="h-full flex flex-col items-center justify-center text-gray-400">

            <BarChart2 className="w-10 h-10 mb-3 opacity-40" />

            <p className="text-sm">
              No video data available to render charts.
            </p>

            <p className="text-xs mt-1">
              No analytics data was provided.
            </p>

          </div>

        ) : !mounted ? (

          <div className="h-full w-full bg-gray-50 dark:bg-gray-800/50 rounded-xl animate-pulse" />

        ) : (

          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={100}
            minHeight={300}
          >
            {activeTab === "line" ? (
              <LineChart
                data={filteredVideos}
                margin={{
                  top: 10,
                  right: 20,
                  left: 10,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.2}
                />

                <XAxis
                  dataKey="date"
                  fontSize={12}
                />

                <YAxis
                  fontSize={12}
                />

                <Tooltip 
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    borderColor: "#374151",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                  }}
                  labelStyle={{
                    color: "#F9FAFB",
                    fontWeight: "600",
                    marginBottom: "6px",
                  }}
                  itemStyle={{
                    fontWeight: "500",
                  }}
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  name="Views"
                />

                <Line
                  type="monotone"
                  dataKey="likes"
                  stroke="#EC4899"
                  strokeWidth={2}
                  name="Likes"
                />

                <Line
                  type="monotone"
                  dataKey="shares"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Shares"
                />

                <Line
                  type="monotone"
                  dataKey="comments"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  name="Comments"
                />
              </LineChart>
            ) : activeTab === "bar" ? (
              <BarChart
                data={filteredVideos}
                margin={{
                  top: 30,
                  right: 20,
                  left: 10,
                  bottom: 80,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.2}
                />

                <XAxis
                  dataKey="title"
                  fontSize={11}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  tickFormatter={(value: string) =>
                    value && value.length > 15
                      ? `${value.substring(0, 15)}...`
                      : value
                  }
                />

                <YAxis
                  fontSize={12}
                />

                <Tooltip 
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    borderColor: "#374151",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                  }}
                  labelStyle={{
                    color: "#F9FAFB",
                    fontWeight: "600",
                    marginBottom: "6px",
                  }}
                  itemStyle={{
                    fontWeight: "500",
                  }}
                />

                <Legend 
                  verticalAlign="top" 
                  align="center"
                  wrapperStyle={{ paddingBottom: "15px" }}
                />

                <Bar
                  dataKey="views"
                  fill="#3B82F6"
                  name="Views"
                />

                <Bar
                  dataKey="likes"
                  fill="#EC4899"
                  name="Likes"
                />

                <Bar
                  dataKey="shares"
                  fill="#10B981"
                  name="Shares"
                />

                <Bar
                  dataKey="comments"
                  fill="#F59E0B"
                  name="Comments"
                />
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}-${index}`}
                      fill={
                        COLORS[index % COLORS.length]
                      }
                    />
                  ))}
                </Pie>

                <Tooltip 
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    borderColor: "#374151",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                  }}
                  labelStyle={{
                    color: "#F9FAFB",
                    fontWeight: "600",
                    marginBottom: "6px",
                  }}
                  itemStyle={{
                    fontWeight: "500",
                  }}
                />

                <Legend />
              </PieChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary Cards */}
      {filteredVideos.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">

          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total Views
            </p>

            <p className="text-lg font-bold text-blue-600">
              {totals.views.toLocaleString()}
            </p>
          </div>

          <div className="bg-pink-50 dark:bg-pink-950/30 rounded-xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total Likes
            </p>

            <p className="text-lg font-bold text-pink-600">
              {totals.likes.toLocaleString()}
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total Shares
            </p>

            <p className="text-lg font-bold text-green-600">
              {totals.shares.toLocaleString()}
            </p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total Comments
            </p>

            <p className="text-lg font-bold text-orange-600">
              {totals.comments.toLocaleString()}
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
