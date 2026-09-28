import React, { useEffect, useRef, useState } from "react";
import { Image, Smile, Send, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/useAuth";
import { createPost, getUploadUrl, uploadMediaToS3 } from "../../api/posts";
import { getApiErrorMessage } from "../../api/errors";
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [autoFocus]);

  // Auto-resize textarea height as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const MAX_CHARS = 200;
  const remainingChars = MAX_CHARS - content.length;
  const isOverLimit = remainingChars < 0;
  const charPercentage = Math.min(100, (content.length / MAX_CHARS) * 100);

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
      setError(
        "Please upload a supported image or video format (JPG, PNG, GIF, WebP, MP4, WebM).",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError("File size exceeds 15MB limit.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setMediaFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeMedia = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setMediaFile(null);
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isOverLimit || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      let mediaData: { mediaUrl: string; mediaKey: string } | undefined;

      if (mediaFile) {
        setUploadProgress("Preparing upload...");
        const uploadResponse = await getUploadUrl(mediaFile.type);

        setUploadProgress("Uploading media...");
        await uploadMediaToS3(uploadResponse.data.uploadUrl, mediaFile);

        mediaData = {
          mediaUrl: uploadResponse.data.mediaUrl,
          mediaKey: uploadResponse.data.mediaKey,
        };
      }

      setUploadProgress("Publishing...");
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
    } catch (err: unknown) {
      console.error("Failed to publish Zap:", err);
      setError(
        getApiErrorMessage(
          err,
          "Your Zap could not be published. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
      setUploadProgress(null);
    }
  };

  const commonEmojis = ["👍", "❤️", "🔥", "🚀", "✨", "😂", "🎉", "💯"];

  return (
    <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors duration-200">
      <div className="flex gap-3 sm:gap-4">
        {/* User Avatar */}
        <div className="relative shrink-0">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover ring-2 ring-gray-100 dark:ring-zinc-800"
            />
          ) : (
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-base shadow-sm uppercase">
              {user?.username?.charAt(0) || "Z"}
            </div>
          )}
        </div>

        {/* Composer Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-w-0 space-y-3">
          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs font-medium text-red-600 dark:text-red-400"
              >
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="p-1 hover:bg-red-500/20 rounded-md transition-colors"
                >
                  <X size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={content}
            disabled={isLoading}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            rows={2}
            className="w-full bg-transparent resize-none border-none focus:outline-none text-base placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-900 dark:text-zinc-100 min-h-[60px] leading-relaxed disabled:opacity-50"
          />

          {/* Media Preview Container */}
          <AnimatePresence>
            {previewUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="relative rounded-2xl overflow-hidden border border-gray-200/80 dark:border-zinc-800 bg-zinc-900 max-h-72 shadow-sm group"
              >
                {mediaFile?.type.startsWith("video/") ? (
                  <video
                    src={previewUrl}
                    controls
                    className="w-full h-full max-h-72 object-cover"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Upload preview"
                    className="w-full h-full max-h-72 object-cover"
                  />
                )}

                {/* Remove Media Button */}
                {!isLoading && (
                  <button
                    type="button"
                    onClick={removeMedia}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-zinc-900/80 text-white hover:bg-zinc-900 backdrop-blur-md transition-all duration-150 shadow-md hover:scale-105"
                  >
                    <X size={16} />
                  </button>
                )}

                {/* Upload Overlay during form submit */}
                {isLoading && uploadProgress && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
                    <Loader2 size={24} className="animate-spin text-white" />
                    <span className="text-xs font-semibold">
                      {uploadProgress}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Emoji Popover Drawer */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 w-fit"
              >
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg text-sm transition-transform active:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Toolbar */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800/80">
            {/* Left Controls: Media & Quick Actions */}
            <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <Image size={17} className="text-sky-500" />
                <span className="hidden sm:inline">Media</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
                  onChange={handleImageChange}
                  disabled={isLoading}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors text-amber-500"
              >
                <Smile size={17} />
              </button>
            </div>

            {/* Right Controls: Character Progress & Submit */}
            <div className="flex items-center gap-3">
              {/* Circular Character Limit Progress */}
              <div className="relative flex items-center justify-center">
                <svg className="w-6 h-6 transform -rotate-90">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    strokeWidth="2"
                    className="stroke-gray-200 dark:stroke-zinc-800 fill-none"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    strokeWidth="2"
                    strokeDasharray={56.5}
                    strokeDashoffset={56.5 - (56.5 * charPercentage) / 100}
                    className={`fill-none transition-all duration-200 ${
                      isOverLimit
                        ? "stroke-red-500"
                        : remainingChars <= 20
                          ? "stroke-amber-500"
                          : "stroke-sky-500"
                    }`}
                  />
                </svg>
                {remainingChars <= 20 && (
                  <span
                    className={`absolute text-[10px] font-bold ${
                      isOverLimit ? "text-red-500" : "text-amber-500"
                    }`}
                  >
                    {remainingChars}
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!content.trim() || isOverLimit || isLoading}
                type="submit"
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{uploadProgress || "Posting..."}</span>
                  </>
                ) : (
                  <>
                    <span>Post</span>
                    <Send size={13} />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
