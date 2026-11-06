import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../api/errors";
import { uploadMedia } from "../api/posts";
import { usersApi } from "../api/users";
import type { User } from "../types";

export function useEditProfile(
  profile: User,
  onUpdate: (user: User) => void,
  onClose: () => void,
) {
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const chooseAvatar = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file for your profile photo.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Profile photos must be 5 MB or smaller.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError(null);
  };

  const changeAvatarUrl = (value: string) => {
    setAvatarUrl(value);
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError(null);
      const nextAvatarUrl = avatarFile
        ? (await uploadMedia(avatarFile)).mediaUrl
        : avatarUrl.trim();
      const response = await usersApi.updateProfile({
        bio: bio.trim(),
        avatarUrl: nextAvatarUrl,
      });
      onUpdate(response.data.user);
      onClose();
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(
          requestError,
          "Something went wrong. Please try again.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return {
    bio,
    setBio,
    avatarUrl,
    setAvatarUrl: changeAvatarUrl,
    avatarFile,
    avatarPreview,
    saving,
    error,
    chooseAvatar,
    save,
  };
}
