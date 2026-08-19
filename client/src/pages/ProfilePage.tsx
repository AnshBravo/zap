import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Calendar, Link as LinkIcon, MapPin, Edit3 } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { username } = useParams<{ username?: string }>();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"posts" | "replies" | "likes">(
    "posts",
  );

  // Determine if the user is viewing his own profile or someone else's profile.
  const profileUsername = username || currentUser?.username || "user";
  const isOwnProfile = !username || username === currentUser?.username;

  // Placeholder user profile data (will link to backend API)
  const profile = {
    username: profileUsername,
    displayName:
      profileUsername.charAt(0).toUpperCase() + profileUsername.slice(1),
    bio: "Building minimalist web experiences. I love minimalism and the color black with white (not old fashioned btw)",
    location: "Earth",
    website: "https://zap.dev",
    joinedDate: "August 2026",
    followingCount: 128,
    followersCount: 1420,
  };

  const tabs = [
    { id: "posts", label: "Posts" },
    { id: "replies", label: "Replies" },
    { id: "likes", label: "Likes" },
  ] as const;

  return (
    <div className="w-full min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-pure-border-light dark:border-pure-border-dark px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black tracking-tight">
            {profile.displayName}
          </h1>
          <p className="text-xs text-pure-gray-light dark:text-pure-gray-dark">
            0 Zaps
          </p>
        </div>
      </div>

      {/* Cover Header Banner */}
      <div className="h-32 sm:h-48 w-full bg-pure-hover-light dark:bg-pure-hover-dark border-b border-pure-border-light dark:border-pure-border-dark relative">
        {/* Profile Avatar Overlay */}
        <div className="absolute -bottom-10 left-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-2xl sm:text-3xl border-4 border-white dark:border-black uppercase shadow-sm">
            {profile.username.charAt(0)}
          </div>
        </div>
      </div>

      {/* Profile Details Bar */}
      <div className="px-6 pt-3 pb-6 border-b border-pure-border-light dark:border-pure-border-dark">
        {/* Action Button (Edit Profile / Follow) */}
        <div className="flex justify-end mb-4">
          {isOwnProfile ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl border border-pure-border-light dark:border-pure-border-dark hover:bg-pure-hover-light dark:hover:bg-pure-hover-dark transition-colors flex items-center gap-2"
            >
              <Edit3 size={15} />
              Edit Profile
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
            >
              Follow
            </motion.button>
          )}
        </div>

        {/* Name & Handle */}
        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-tight">
            {profile.displayName}
          </h2>
          <p className="text-sm font-medium text-pure-gray-light dark:text-pure-gray-dark">
            @{profile.username}
          </p>
        </div>

        {/* Bio */}
        <p className="mt-3 text-sm font-normal leading-relaxed">
          {profile.bio}
        </p>

        {/* Metadata Badges */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs font-medium text-pure-gray-light dark:text-pure-gray-dark">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} />
            <span>{profile.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <LinkIcon size={14} />
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-black dark:hover:text-white transition-colors"
            >
              {profile.website.replace("https://", "")}
            </a>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            <span>Joined {profile.joinedDate}</span>
          </div>
        </div>

        {/* Followers / Following Counts */}
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold">{profile.followingCount}</span>
            <span className="text-pure-gray-light dark:text-pure-gray-dark font-medium">
              Following
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold">{profile.followersCount}</span>
            <span className="text-pure-gray-light dark:text-pure-gray-dark font-medium">
              Followers
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-pure-border-light dark:border-pure-border-dark">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3.5 text-xs sm:text-sm font-bold transition-all relative ${
              activeTab === tab.id
                ? "text-black dark:text-white"
                : "text-pure-gray-light dark:text-pure-gray-dark hover:text-black dark:hover:text-white"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="profileTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white"
              />
            )}
          </button>
        ))}
      </div>

      {/* Feed Content Placeholder */}
      <div className="p-6 text-center text-sm text-pure-gray-light dark:text-pure-gray-dark font-medium">
        No {activeTab} yet.
      </div>
    </div>
  );
}
