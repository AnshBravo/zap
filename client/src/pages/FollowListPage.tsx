import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, UserPlus, UserCheck } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usersApi } from "../api/users";
import type { User } from "../types";

export default function FollowListPage() {
  const { username } = useParams<{ username?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const activeTab = useMemo(
    () =>
      location.pathname.endsWith("/following") ? "following" : "followers",
    [location.pathname],
  );

  const targetUsername = username || currentUser?.username;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followState, setFollowState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchList = async () => {
      if (!targetUsername) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const profileRes = await usersApi.getProfile(targetUsername);
        const targetUserId = profileRes.data.user.id;

        const [followersRes, followingRes] = await Promise.all([
          usersApi.getFollowers(targetUserId, 1, 50),
          usersApi.getFollowing(targetUserId, 1, 50),
        ]);

        const followers = followersRes.data.followers || [];
        const following = followingRes.data.following || [];
        const followingIds = new Set(following.map((userItem) => userItem.id));

        const nextUsers = activeTab === "followers" ? followers : following;

        setUsers(nextUsers);
        setFollowState(
          Object.fromEntries(following.map((userItem) => [userItem.id, true])),
        );

        if (activeTab === "followers") {
          setFollowState((prev) => {
            const nextState: Record<string, boolean> = { ...prev };
            for (const userItem of followers) {
              nextState[userItem.id] = followingIds.has(userItem.id);
            }
            return nextState;
          });
        }
      } catch (err: any) {
        console.error("Failed to load follow list:", err);
        setError(
          err?.response?.data?.message ||
            "We couldn’t load this list right now.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [activeTab, targetUsername]);

  const handleToggleFollow = async (targetUserId: string) => {
    if (!currentUser || targetUserId === currentUser.id) return;

    try {
      const res = await usersApi.toggleFollow(targetUserId);
      setFollowState((prev) => ({ ...prev, [targetUserId]: res.following }));
    } catch (err) {
      console.error("Failed to toggle follow:", err);
    }
  };

  const goBackToProfile = () => {
    if (username) {
      navigate(`/profile/${username}`);
      return;
    }

    navigate("/profile");
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-black">
      <div className="sticky top-0 z-10 border-b border-pure-border-light dark:border-pure-border-dark bg-white/80 dark:bg-black/80 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <button
          onClick={goBackToProfile}
          className="p-2 rounded-full hover:bg-pure-hover-light dark:hover:bg-pure-hover-dark transition-colors"
          aria-label="Back to profile"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-black tracking-tight">
            {targetUsername ? `@${targetUsername}` : "Profile"}
          </h1>
          <p className="text-[11px] uppercase tracking-[0.18em] text-pure-gray-light dark:text-pure-gray-dark">
            {activeTab === "followers" ? "Followers" : "Following"}
          </p>
        </div>
      </div>

      <div className="flex border-b border-pure-border-light dark:border-pure-border-dark">
        {[
          {
            label: "Followers",
            path: username
              ? `/profile/${username}/followers`
              : "/profile/followers",
          },
          {
            label: "Following",
            path: username
              ? `/profile/${username}/following`
              : "/profile/following",
          },
        ].map((tab) => {
          const isActive = activeTab === tab.label.toLowerCase();

          return (
            <Link
              key={tab.label}
              to={tab.path}
              className={`flex-1 py-3 text-center text-xs sm:text-sm font-bold transition-colors ${
                isActive
                  ? "text-black dark:text-white"
                  : "text-pure-gray-light dark:text-pure-gray-dark"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-pure-gray-light dark:text-pure-gray-dark">
          <Loader2 className="animate-spin mr-2" size={18} />
          Loading...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-sm text-red-500">{error}</div>
      ) : users.length === 0 ? (
        <div className="p-10 text-center text-sm text-pure-gray-light dark:text-pure-gray-dark">
          No {activeTab} yet.
        </div>
      ) : (
        <div className="divide-y divide-pure-border-light dark:divide-pure-border-dark">
          {users.map((userItem) => {
            const isCurrentUser = currentUser?.id === userItem.id;
            const isFollowing = followState[userItem.id] ?? false;

            return (
              <div
                key={userItem.id}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-pure-hover-light/40 dark:hover:bg-pure-hover-dark/40 transition-colors"
              >
                <Link
                  to={
                    userItem.username === currentUser?.username
                      ? "/profile"
                      : `/profile/${userItem.username}`
                  }
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <div className="w-11 h-11 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black uppercase text-sm shrink-0">
                    {userItem.avatarUrl ? (
                      <img
                        src={userItem.avatarUrl}
                        alt={userItem.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      userItem.username.charAt(0)
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">
                      @{userItem.username}
                    </p>
                    {userItem.bio && (
                      <p className="text-xs text-pure-gray-light dark:text-pure-gray-dark truncate">
                        {userItem.bio}
                      </p>
                    )}
                  </div>
                </Link>

                {!isCurrentUser && (
                  <button
                    onClick={() => handleToggleFollow(userItem.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isFollowing
                        ? "border border-pure-border-light dark:border-pure-border-dark text-black dark:text-white"
                        : "bg-black text-white dark:bg-white dark:text-black"
                    }`}
                  >
                    {isFollowing ? (
                      <span className="inline-flex items-center gap-1.5">
                        <UserCheck size={13} /> Following
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <UserPlus size={13} /> Follow
                      </span>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
