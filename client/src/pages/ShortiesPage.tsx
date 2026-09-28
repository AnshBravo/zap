import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
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
  X,
} from "lucide-react";
import type { Post, Comment } from "../types";
import { postsApi } from "../api/posts";
import { usersApi } from "../api/users";
import { getApiErrorMessage } from "../api/errors";

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
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [likes, setLikes] = useState(post._count.likes);
  const [following, setFollowing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    usersApi
      .getProfile(post.author.username)
      .then((response) => {
        if (active) setFollowing(response.data.user.isFollowing ?? false);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [post.author.username]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => setPlaying(false));
        } else {
          video.pause();
        }
      },
      { threshold: 0.7 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const toggleLike = async () => {
    if (pending) return;
    try {
      setPending(true);
      const response = await postsApi.toggleLike(post.id);
      setLiked(response.liked);
      setLikes((current) => Math.max(0, current + (response.liked ? 1 : -1)));
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, "Like could not be updated."));
    } finally {
      setPending(false);
    }
  };

  const toggleFollow = async () => {
    if (pending) return;
    try {
      setPending(true);
      const response = await usersApi.toggleFollow(post.author.id);
      setFollowing(response.following);
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(requestError, "Follow status could not be updated."),
      );
    } finally {
      setPending(false);
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/shorties#${post.id}`;
    try {
      if (navigator.share)
        await navigator.share({
          title: `@${post.author.username}`,
          text: post.content,
          url,
        });
      else await navigator.clipboard.writeText(url);
    } catch {
      setError("Share was cancelled or unavailable.");
    }
  };

  return (
    <article className="relative mx-auto flex h-full w-full max-w-120 snap-center items-end overflow-hidden bg-black text-white">
      <video
        ref={videoRef}
        src={post.mediaUrl || undefined}
        muted={muted}
        playsInline
        loop
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          setProgress(
            video.duration ? (video.currentTime / video.duration) * 100 : 0,
          );
        }}
        onClick={() => {
          const video = videoRef.current;
          if (!video) return;
          if (video.paused) void video.play().catch(() => setPlaying(false));
          else video.pause();
        }}
        className="absolute inset-0 h-full w-full object-contain"
      />
      {!playing && (
        <button
          type="button"
          onClick={() => void videoRef.current?.play()}
          aria-label="Play video"
          className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 bg-black/45 p-4"
        >
          <Play size={28} fill="currentColor" />
        </button>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/75 to-transparent" />

      <div className="relative z-10 flex w-full items-end justify-between gap-4 p-4 pb-7 sm:p-6">
        <div className="min-w-0 flex-1">
          {error && (
            <p role="alert" className="mb-2 text-xs text-white">
              {error}
            </p>
          )}
          <div className="mb-3 flex items-center gap-2">
            <Link
              to={`/profile/${post.author.username}`}
              className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-white/70 bg-black text-xs font-bold uppercase"
            >
              {post.author.avatarUrl ? (
                <img
                  src={post.author.avatarUrl}
                  alt=""
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
              disabled={pending}
              onClick={() => void toggleFollow()}
              className="flex shrink-0 items-center gap-1 border border-white/70 px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50"
            >
              {following ? <UserCheck size={13} /> : <UserPlus size={13} />}
              {following ? "Following" : "Follow"}
            </button>
          </div>
          <p className="line-clamp-3 max-w-136 text-sm leading-relaxed">
            {post.content}
          </p>
          <p className="mt-2 text-xs text-white/75">
            Original audio · @{post.author.username}
          </p>
        </div>

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
            onClick={() => {
              const video = videoRef.current;
              if (!video) return;
              if (video.paused)
                void video.play().catch(() => setPlaying(false));
              else video.pause();
            }}
            aria-label={playing ? "Pause video" : "Play video"}
          >
            {playing ? <Pause size={22} /> : <Play size={22} />}
          </button>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-20 h-1 bg-white/30">
        <div className="h-full bg-white" style={{ width: `${progress}%` }} />
      </div>
    </article>
  );
}

export default function ShortiesPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    postsApi
      .getFeed(1, 50)
      .then((response) => {
        if (!cancelled)
          setPosts(
            response.data.posts.filter((post) =>
              /\.(mp4|webm)(?:$|\?)/i.test(post.mediaUrl || ""),
            ),
          );
      })
      .catch((requestError: unknown) => {
        if (!cancelled)
          setError(
            getApiErrorMessage(requestError, "Shorties could not be loaded."),
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activePost) return;
    let cancelled = false;
    postsApi
      .getComments(activePost.id, 1, 50)
      .then((response) => {
        if (!cancelled) setComments(response.data.comments);
      })
      .catch((requestError: unknown) => {
        if (!cancelled)
          setCommentError(
            getApiErrorMessage(requestError, "Comments could not be loaded."),
          );
      })
      .finally(() => {
        if (!cancelled) setCommentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activePost]);

  const addComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!activePost || !draft.trim()) return;
    try {
      const response = await postsApi.addComment(activePost.id, draft.trim());
      setComments((current) => [response.data.comment, ...current]);
      setDraft("");
      setCommentError(null);
    } catch (requestError: unknown) {
      setCommentError(
        getApiErrorMessage(requestError, "Comment could not be posted."),
      );
    }
  };

  return (
    <section className="relative h-[calc(100dvh-4rem)] overflow-hidden bg-black lg:h-screen">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4 text-white">
        <h1 className="flex items-center gap-2 text-base font-bold">
          <Clapperboard size={18} />
          Shorties
        </h1>
        <span className="text-xs text-white/65">{posts.length} videos</span>
      </header>
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
        <div className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain pt-12">
          {posts.map((post) => (
            <div
              key={post.id}
              className="h-[calc(100dvh-7rem)] snap-center lg:h-[calc(100dvh-2rem)]"
            >
              <Reel
                post={post}
                onComment={(selected) => {
                  setCommentLoading(true);
                  setComments([]);
                  setActivePost(selected);
                  setCommentError(null);
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid h-full place-items-center px-6 text-center text-sm text-white/70">
          No video posts yet.
        </div>
      )}

      {activePost && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 sm:items-center"
          onClick={() => setActivePost(null)}
        >
          <section
            className="max-h-[82vh] w-full max-w-lg overflow-hidden border border-pure-border-light bg-white dark:border-pure-border-dark dark:bg-black"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-pure-border-light px-4 py-3 dark:border-pure-border-dark">
              <h2 className="text-sm font-bold">Comments</h2>
              <button
                type="button"
                onClick={() => setActivePost(null)}
                aria-label="Close comments"
              >
                <X size={18} />
              </button>
            </header>
            {commentError && (
              <p role="alert" className="px-4 pt-3 text-xs text-red-600">
                {commentError}
              </p>
            )}
            <div className="max-h-[55vh] space-y-3 overflow-y-auto p-4">
              {commentLoading ? (
                <Loader2 size={18} className="mx-auto animate-spin" />
              ) : (
                comments.map((comment) => (
                  <p key={comment.id} className="text-sm">
                    <Link
                      to={`/profile/${comment.user.username}`}
                      className="mr-2 font-bold"
                    >
                      @{comment.user.username}
                    </Link>
                    {comment.content}
                  </p>
                ))
              )}
              {!commentLoading && !comments.length && (
                <p className="text-center text-sm text-pure-gray-light dark:text-pure-gray-dark">
                  No comments yet.
                </p>
              )}
            </div>
            <form
              onSubmit={addComment}
              className="flex gap-2 border-t border-pure-border-light p-3 dark:border-pure-border-dark"
            >
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={500}
                placeholder="Add a comment..."
                className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="px-3 text-sm font-semibold disabled:opacity-40"
              >
                Post
              </button>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
