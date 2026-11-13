import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  Clapperboard,
  Heart,
  Loader2,
  MessageCircle,
  Pause,
  Play,
  Share2,
  UserCheck,
  UserPlus,
  Volume2,
  VolumeX,
} from "lucide-react";

import type { Post } from "../types";
import { useShortieReelActions, useShorties } from "../hooks/useShorties";
import type { AppLayoutContext } from "../components/layout/AppLayout";

function Reel({
  post,
  onComment,
}: {
  post: Post;
  onComment: (post: Post) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const {
    liked,
    likes,
    likeLoading,
    following,
    pending,
    error,
    toggleLike,
    toggleFollow,
    share,
  } = useShortieReelActions(post);

  // Automatically play videos when they enter the viewport.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.preload = "auto";
          void video.play().catch(() => setPlaying(false));
        } else {
          video.pause();
          video.preload = "none";
        }
      },
      { threshold: 0.7 },
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
      video.pause();
    };
  }, []);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  };

  return (
    <article className="relative mx-auto flex h-full w-auto max-w-full max-h-full aspect-[9/16] snap-center items-end overflow-hidden bg-black text-white">
      {/* Video */}
      <video
        ref={videoRef}
        src={post.mediaUrl || undefined}
        muted={muted}
        playsInline
        loop
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;

          setProgress(
            video.duration ? (video.currentTime / video.duration) * 100 : 0,
          );
        }}
        onClick={togglePlayback}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Center playback button */}
      {!playing && (
        <button
          type="button"
          onClick={togglePlayback}
          aria-label="Play video"
          className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/45 p-4"
        >
          <Play size={28} fill="currentColor" />
        </button>
      )}

      {/* Bottom gradient */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/75 to-transparent" />

      {/* Video information */}
      <div className="relative z-10 flex w-full items-end justify-between gap-4 p-4 pb-7 sm:p-6">
        <div className="min-w-0 flex-1">
          {error && (
            <p role="alert" className="mb-2 text-xs text-white">
              {error}
            </p>
          )}

          {/* Author */}
          <div className="mb-3 flex items-center gap-2">
            <Link
              to={`/profile/${post.author.username}`}
              aria-label={`View ${post.author.username}'s profile`}
              className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-white/70 bg-black text-xs font-bold uppercase"
            >
              {post.author.avatarUrl ? (
                <img
                  src={post.author.avatarUrl}
                  alt=""
                  width={36}
                  height={36}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                post.author.username[0]
              )}
            </Link>

            <Link
              to={`/profile/${post.author.username}`}
              className="truncate text-sm font-bold"
            >
              @{post.author.username}
            </Link>

            <button
              type="button"
              disabled={likeLoading}
              onClick={() => void toggleFollow()}
              className="flex shrink-0 items-center gap-1 border border-white/70 px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50"
            >
              {following ? <UserCheck size={13} /> : <UserPlus size={13} />}
              {following ? "Following" : "Follow"}
            </button>
          </div>

          {/* Caption */}
          <p className="line-clamp-3 max-w-136 text-sm leading-relaxed">
            {post.content}
          </p>

          <p className="mt-2 text-xs text-white/75">
            Original audio · @{post.author.username}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 flex-col items-center gap-5 pb-1">
          <button
            type="button"
            disabled={pending}
            onClick={() => void toggleLike()}
            aria-label={liked ? "Unlike video" : "Like video"}
            className="flex flex-col items-center gap-1 disabled:opacity-50"
          >
            <Heart size={25} fill={liked ? "white" : "none"} />
            <span className="text-xs font-semibold">{likes}</span>
          </button>

          <button
            type="button"
            onClick={() => onComment(post)}
            aria-label="Open comments"
            className="flex flex-col items-center gap-1"
          >
            <MessageCircle size={24} />
            <span className="text-xs font-semibold">
              {post._count.comments}
            </span>
          </button>

          <button
            type="button"
            onClick={() => void share()}
            aria-label="Share video"
          >
            <Share2 size={23} />
          </button>

          <button
            type="button"
            onClick={() => setMuted((value) => !value)}
            aria-label={muted ? "Unmute video" : "Mute video"}
          >
            {muted ? <VolumeX size={23} /> : <Volume2 size={23} />}
          </button>

          <button
            type="button"
            onClick={togglePlayback}
            aria-label={playing ? "Pause video" : "Play video"}
          >
            {playing ? <Pause size={22} /> : <Play size={22} />}
          </button>
        </div>
      </div>

      {/* Playback progress */}
      <div className="absolute inset-x-0 bottom-0 z-20 h-1 bg-white/30">
        <div className="h-full bg-white" style={{ width: `${progress}%` }} />
      </div>
    </article>
  );
}

export default function ShortiesPage() {
  const { posts, loading, error } = useShorties();

  const { handleToggleComments } = useOutletContext<AppLayoutContext>();

  return (
    <section className="relative h-[calc(100dvh-4rem)] overflow-hidden bg-black lg:h-screen">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4 text-white">
        <h1 className="flex items-center gap-2 text-base font-bold">
          <Clapperboard size={18} />
          Shorties
        </h1>

        <span className="text-xs text-white/65">{posts.length} videos</span>
      </header>

      {/* Loading */}
      {loading ? (
        <div className="grid h-full place-items-center text-white/70">
          <div className="flex items-center gap-2 text-xs">
            <Loader2 size={16} className="animate-spin" />
            <span>Loading videos</span>
          </div>
        </div>
      ) : error ? (
        <div className="grid h-full place-items-center px-6 text-center text-sm text-white">
          {error}
        </div>
      ) : posts.length ? (
        /* Reels container */
        <div className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain pt-12">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex h-[calc(100dvh-7rem)] w-full snap-center justify-center lg:h-[calc(100dvh-2rem)]"
            >
              <Reel post={post} onComment={handleToggleComments} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid h-full place-items-center px-6 text-center text-sm text-white/70">
          No video posts yet.
        </div>
      )}
    </section>
  );
}
