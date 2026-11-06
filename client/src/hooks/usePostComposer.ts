import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../api/errors";
import { createPost, uploadMedia } from "../api/posts";
import type { Post } from "../types";

export function usePostComposer(onPostCreated?: (post: Post) => void) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const selectMedia = (file: File) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please upload a supported image or video format (JPG, PNG, GIF, WebP, MP4, WebM).",
      );
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("File size exceeds 15MB limit.");
      return;
    }

    setError(null);
    setMediaFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeMedia = () => {
    setPreviewUrl(null);
    setMediaFile(null);
  };

  const appendEmoji = (emoji: string) => {
    setContent((current) => current + emoji);
    setShowEmojiPicker(false);
  };

  const publish = async () => {
    if (!content.trim() || content.length > 200 || loading) return;

    try {
      setLoading(true);
      setError(null);
      let mediaData: { mediaUrl: string; mediaKey: string } | undefined;
      if (mediaFile) {
        setUploadProgress("Uploading media...");
        mediaData = await uploadMedia(mediaFile);
      }

      setUploadProgress("Publishing...");
      const response = await createPost({
        content: content.trim(),
        ...mediaData,
      });
      onPostCreated?.(response.data.post);
      setContent("");
      setPreviewUrl(null);
      setMediaFile(null);
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(
          requestError,
          "Your Zap could not be published. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  return {
    content,
    setContent,
    loading,
    uploadProgress,
    previewUrl,
    mediaFile,
    error,
    setError,
    showEmojiPicker,
    setShowEmojiPicker,
    remainingChars: 200 - content.length,
    charPercentage: Math.min(100, (content.length / 200) * 100),
    selectMedia,
    removeMedia,
    appendEmoji,
    publish,
  };
}
