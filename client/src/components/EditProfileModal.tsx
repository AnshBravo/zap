import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usersApi } from "../api/users";
import type { User } from "../types";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: User;
  onUpdate: (updatedUser: User) => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onUpdate,
}: EditProfileModalProps) {
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const BIO_MAX_LENGTH = 160;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      // Make the backend API call to update the profile details
      const res = await usersApi.updateProfile({
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
      });

      // Pass the updated user object back to the parent Profile page state
      onUpdate(res.data.user);
      onClose();
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      setError(
        err?.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Container Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-pure-border-light dark:border-pure-border-dark rounded-2xl p-6 shadow-xl relative z-10 text-black dark:text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black tracking-tight">
                Edit Profile
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-pure-gray-light hover:bg-pure-hover-light dark:hover:bg-pure-hover-dark transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-500 font-semibold mb-4 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                {error}
              </p>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Avatar URL Input Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-pure-gray-light">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-pure-hover-light dark:bg-pure-hover-dark border border-pure-border-light dark:border-pure-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                />
              </div>

              {/* Bio TextArea Input Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-pure-gray-light">
                    Bio
                  </label>
                  <span
                    className={`text-[10px] font-bold ${bio.length > BIO_MAX_LENGTH ? "text-red-500" : "text-pure-gray-light"}`}
                  >
                    {bio.length} / {BIO_MAX_LENGTH}
                  </span>
                </div>
                <textarea
                  maxLength={BIO_MAX_LENGTH}
                  placeholder="Tell the world about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-sm bg-pure-hover-light dark:bg-pure-hover-dark border border-pure-border-light dark:border-pure-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
                />
              </div>

              {/* Action Submit Row */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving || bio.length > BIO_MAX_LENGTH}
                  className="px-5 py-2.5 text-sm font-bold bg-black text-white dark:bg-white dark:text-black rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
