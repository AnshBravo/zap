import React, { useEffect, useRef, useState } from "react";
import { Image, Smile, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { createPost, getUploadUrl, uploadMediaToS3 } from "../../api/posts";
import type { Post } from "../../types";

interface PostComposerProps {
  onPostCreated?: (newPost: Post) => void;
  autoFocus?: boolean;
}

export default function PostComposer({
  onPostCreated,
  autoFocus = false,
}: PostComposerProps) {
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [autoFocus]);

  const MAX_CHARS = 200;
  const remainingChars = MAX_CHARS - content.length;
  const isOverLimit = remainingChars < 0;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG, GIF, WebP, MP4, or WebM file.");
      e.target.value = "";
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError("Files must be 15MB or smaller.");
      e.target.value = "";
      return;
    }

    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setMediaFile(file);
    e.target.value = "";
  };

  const removeMedia = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setMediaFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isOverLimit || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      let mediaData: { mediaUrl: string; mediaKey: string } | undefined;

      if (mediaFile) {
        const uploadResponse = await getUploadUrl(mediaFile.type);
        await uploadMediaToS3(uploadResponse.data.uploadUrl, mediaFile);
        mediaData = {
          mediaUrl: uploadResponse.data.mediaUrl,
          mediaKey: uploadResponse.data.mediaKey,
        };
      }

      const response = await createPost({
        content: content.trim(),
        ...mediaData,
      });
      const createdPost = response.data.post as Post;

      if (onPostCreated) {
        onPostCreated(createdPost);
      }

      setContent("");
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setMediaFile(null);
    } catch (err: any) {
      console.error("Failed to publish Zap:", err);
      setError(
        err?.response?.data?.message ||
          "Your Zap could not be published. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="p-4 border-b border-pure-border-light dark:border-pure-border-dark bg-white dark:bg-black">
      <div className="flex gap-3">
        {/* User Avatar */}
        <div className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-base shrink-0 uppercase">
          {user?.username?.charAt(0) || "Z"}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-3">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={content}
            maxLength={MAX_CHARS}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            rows={3}
            className="w-full bg-transparent resize-none border-none focus:outline-none text-sm placeholder:text-pure-gray-light dark:placeholder:text-pure-gray-dark text-black dark:text-white"
          />

          {/* Media Preview Box */}
          <AnimatePresence>
            {previewUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative rounded-2xl overflow-hidden border border-pure-border-light dark:border-pure-border-dark max-h-60 bg-pure-hover-light dark:bg-pure-hover-dark"
              >
                {mediaFile?.type.startsWith("video/") ? (
                  <video
                    src={previewUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Upload preview"
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={removeMedia}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-pure-border-light dark:border-pure-border-dark">
            <div className="flex items-center gap-2 text-pure-gray-light dark:text-pure-gray-dark">
              <label className="p-2 rounded-xl hover:bg-pure-hover-light dark:hover:bg-pure-hover-dark cursor-pointer transition-colors">
                <Image size={18} />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-pure-hover-light dark:hover:bg-pure-hover-dark transition-colors"
              >
                <Smile size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Character Counter */}
              <span
                className={`text-xs font-semibold ${
                  isOverLimit
                    ? "text-rose-500"
                    : remainingChars <= 20
                      ? "text-amber-500"
                      : "text-pure-gray-light dark:text-pure-gray-dark"
                }`}
              >
                {remainingChars}
              </span>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={
                  !content.trim() ||
                  isOverLimit ||
                  isLoading
                }
                type="submit"
                className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                <Send size={14} />
                <span>{isLoading ? "Publishing..." : "Zap"}</span>
              </motion.button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
