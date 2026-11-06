import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../api/errors";
import { usersApi } from "../api/users";
import type { User } from "../types";

export type FollowListTab = "followers" | "following";

export function useFollowList(
  username: string | undefined,
  currentUsername: string | undefined,
  activeTab: FollowListTab,
) {
  const targetUsername = username || currentUsername;
  const listKey = targetUsername ? `${targetUsername}:${activeTab}` : null;
  const [users, setUsers] = useState<User[]>([]);
  const [loadedListKey, setLoadedListKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [followState, setFollowState] = useState<Record<string, boolean>>({});
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!targetUsername || !listKey) return;

    let cancelled = false;
    const fetchList = async () => {
      try {
        const profile = await usersApi.getProfile(targetUsername);
        const targetUserId = profile.data.user.id;
        const [followersResponse, followingResponse] = await Promise.all([
          usersApi.getFollowers(targetUserId, 1, 50),
          usersApi.getFollowing(targetUserId, 1, 50),
        ]);
        if (cancelled) return;

        const followers = followersResponse.data.followers ?? [];
        const following = followingResponse.data.following ?? [];
        const followingIds = new Set(following.map((item) => item.id));
        const list = activeTab === "followers" ? followers : following;

        setUsers(list);
        setError(null);
        setFollowState(
          Object.fromEntries(
            list.map((item) => [item.id, followingIds.has(item.id)]),
          ),
        );
      } catch (requestError: unknown) {
        if (!cancelled) {
          setUsers([]);
          setError(
            getApiErrorMessage(
              requestError,
              "We couldn't load this list right now.",
            ),
          );
        }
      } finally {
        if (!cancelled) setLoadedListKey(listKey);
      }
    };

    void fetchList();
    return () => {
      cancelled = true;
    };
  }, [activeTab, listKey, targetUsername]);

  const toggleFollow = async (targetUserId: string) => {
    if (pendingIds.has(targetUserId)) return;
    setPendingIds((current) => new Set(current).add(targetUserId));
    setError(null);
    try {
      const response = await usersApi.toggleFollow(targetUserId);
      setFollowState((current) => ({
        ...current,
        [targetUserId]: response.following,
      }));
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(requestError, "Follow status could not be updated."),
      );
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(targetUserId);
        return next;
      });
    }
  };

  return {
    targetUsername,
    users,
    loading: Boolean(listKey) && loadedListKey !== listKey,
    error: loadedListKey === listKey ? error : null,
    followState,
    pendingIds,
    toggleFollow,
  };
}
