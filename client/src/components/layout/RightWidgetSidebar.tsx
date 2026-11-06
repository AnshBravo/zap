import React from "react";
import { MessageSquare, X, Send, Loader2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useRightWidget } from "../../hooks/useRightWidget";
import type { Post } from "../../types";

interface RightWidgetSidebarProps {
  selectedPost: Post | null;
  onCloseComments: () => void;
}

export function RightWidgetSidebar({
  selectedPost,
  onCloseComments,
}: RightWidgetSidebarProps) {
  const {
    user,
    feedError,
    suggestions,
    followState,
    suggestionError,
    toggleFollow,
    comments,
    commentDraft,
    setCommentDraft,
    isLoadingComments,
    isSubmitting,
    commentError,
    addComment,
    deleteComment,
  } = useRightWidget(selectedPost);

  const handleAddComment = (event: React.FormEvent) => {
    event.preventDefault();
    void addComment();
  };

  return (
    <aside className="sticky top-0 h-screen w-80 xl:w-96 hidden lg:flex flex-col border-l border-pure-border-light dark:border-pure-border-dark bg-white dark:bg-black shrink-0 transition-colors">
      <div className="max-h-[44%] shrink-0 overflow-y-auto border-b border-pure-border-light p-4 dark:border-pure-border-dark">
        {user && (
          <div className="mb-5 flex items-center justify-between gap-3">
            <Link
              to={`/profile/${user.username}`}
              className="flex min-w-0 items-center gap-3"
            >
              <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-black text-xs font-bold uppercase text-white dark:bg-white dark:text-black">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user.username[0]
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold">
                  @{user.username}
                </span>
                <span className="block truncate text-[10px] text-pure-gray-light dark:text-pure-gray-dark">
                  {user.bio || "Your profile"}
                </span>
              </span>
            </Link>
            <Link
              to="/profile"
              className="shrink-0 text-[10px] font-bold text-pure-gray-light hover:text-black dark:text-pure-gray-dark dark:hover:text-white"
            >
              View
            </Link>
          </div>
        )}

        <h2 className="mb-3 text-xs font-bold uppercase text-pure-gray-light dark:text-pure-gray-dark">
          Suggested accounts
        </h2>
        {feedError && (
          <p role="alert" className="mb-2 text-[10px] text-red-600">
            {feedError}
          </p>
        )}
        {suggestionError && (
          <p role="alert" className="mb-2 text-[10px] text-red-600">
            {suggestionError}
          </p>
        )}
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="flex items-center justify-between gap-2"
            >
              <Link
                to={`/profile/${suggestion.username}`}
                className="flex min-w-0 items-center gap-2"
              >
                <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-pure-hover-light text-[10px] font-bold uppercase dark:bg-pure-hover-dark">
                  {suggestion.avatarUrl ? (
                    <img
                      src={suggestion.avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    suggestion.username[0]
                  )}
                </span>
                <span className="truncate text-xs font-semibold">
                  @{suggestion.username}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => void toggleFollow(suggestion.id)}
                className="shrink-0 px-2 py-1 text-[10px] font-bold text-black dark:text-white"
              >
                {followState[suggestion.id] ? "Following" : "Follow"}
              </button>
            </div>
          ))}
          {!suggestions.length && (
            <p className="text-xs text-pure-gray-light dark:text-pure-gray-dark">
              New accounts will appear here.
            </p>
          )}
        </div>
      </div>

      {/* SECTION 2: Comments Pane (~75% remaining height) */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Comments Header */}
        <div className="p-3 border-b border-pure-border-light dark:border-pure-border-dark flex items-center justify-between shrink-0 bg-pure-hover-light/30 dark:bg-pure-hover-dark/30">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-black dark:text-white" />
            <h3 className="font-bold text-xs text-black dark:text-white">
              Comments
            </h3>
          </div>
          {selectedPost && (
            <button
              onClick={onCloseComments}
              className="p-1 rounded-md hover:bg-pure-hover-light dark:hover:bg-pure-hover-dark text-pure-gray-light dark:text-pure-gray-dark transition-colors"
              title="Close comments"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dynamic Comments Body */}
        {!selectedPost ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-pure-gray-light dark:text-pure-gray-dark">
            <MessageSquare size={32} className="mb-2 opacity-40" />
            <p className="text-xs font-medium">
              Click on any post's comment icon to view discussion
            </p>
          </div>
        ) : (
          /* Active Post Comments */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Active Post Snippet Preview */}
            <div className="p-3 border-b border-pure-border-light dark:border-pure-border-dark bg-pure-hover-light/20 dark:bg-pure-hover-dark/20 shrink-0">
              <p className="text-[11px] font-medium text-pure-gray-light dark:text-pure-gray-dark mb-0.5">
                Replying to{" "}
                <span className="font-bold text-black dark:text-white">
                  @{selectedPost.author.username}
                </span>
              </p>
              <p className="text-xs text-black dark:text-white line-clamp-2 italic">
                "{selectedPost.content}"
              </p>
            </div>

            {commentError && (
              <p role="alert" className="px-3 pt-3 text-xs text-red-600">
                {commentError}
              </p>
            )}

            {/* Comment Stream */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {isLoadingComments ? (
                <div className="flex items-center justify-center py-8 text-xs text-pure-gray-light dark:text-pure-gray-dark">
                  <Loader2 className="animate-spin mr-2" size={14} />
                  Loading...
                </div>
              ) : comments.length === 0 ? (
                <p className="text-xs text-center text-pure-gray-light dark:text-pure-gray-dark py-8">
                  No comments yet. Start the conversation!
                </p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-2.5 rounded-xl border border-pure-border-light dark:border-pure-border-dark bg-white dark:bg-black group"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-black dark:text-white">
                        @{comment.user.username}
                      </span>
                      {comment.userId === user?.id && (
                        <button
                          onClick={() => void deleteComment(comment.id)}
                          className="text-pure-gray-light hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-black dark:text-white leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Input Form Box */}
            <form
              onSubmit={handleAddComment}
              className="p-3 border-t border-pure-border-light dark:border-pure-border-dark flex gap-2 shrink-0 bg-white dark:bg-black"
            >
              <input
                type="text"
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 rounded-xl border border-pure-border-light dark:border-pure-border-dark bg-white dark:bg-black px-3 py-1.5 text-xs text-black dark:text-white placeholder:text-pure-gray-light dark:placeholder:text-pure-gray-dark focus:outline-none focus:border-black dark:focus:border-white transition-all"
              />
              <button
                type="submit"
                disabled={!commentDraft.trim() || isSubmitting}
                className="p-2 rounded-xl bg-black text-white dark:bg-white dark:text-black disabled:opacity-40 transition-opacity"
              >
                {isSubmitting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Send size={13} />
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
}
