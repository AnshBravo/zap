import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { RightWidgetSidebar } from "./RightWidgetSidebar";
import { MobileNavbar } from "./MobileNavbar";
import { PageTransition } from "../common/Animations";
import type { Post } from "../../types";
import PostComposer from "../feed/PostComposer";

export interface AppLayoutContext {
  selectedPost: Post | null;
  setSelectedPost: React.Dispatch<React.SetStateAction<Post | null>>;
  handleToggleComments: (post: Post) => void;
}

export function AppLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isShortiesRoute = pathname === "/shorties";
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const handleToggleComments = (post: Post) => {
    // Toggle off if clicking the same post, otherwise set active post
    setSelectedPost((prev) => (prev?.id === post.id ? null : post));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex justify-center transition-colors">
      <div className="w-full max-w-7xl flex">
        {/* Left Sidebar */}
        <Sidebar onCreatePost={() => setCreateOpen(true)} />

        {/* Center Main Content Viewport */}
        <main className="flex-1 min-h-screen border-r border-pure-border-light dark:border-pure-border-dark pb-20 lg:pb-0 min-w-0">
          <PageTransition>
            {/* Pass state & handler to outlet routes */}
            <Outlet
              context={
                {
                  selectedPost,
                  setSelectedPost,
                  handleToggleComments,
                } satisfies AppLayoutContext
              }
            />
          </PageTransition>
        </main>

        {/* Right Widget Sidebar */}
        {!isShortiesRoute && (
          <RightWidgetSidebar
            selectedPost={selectedPost}
            onCloseComments={() => setSelectedPost(null)}
          />
        )}
      </div>

      {/* Mobile Navigation */}
      <MobileNavbar onCreatePost={() => setCreateOpen(true)} />

      <AnimatePresence>
        {createOpen && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/65 p-3 sm:p-6"
            onClick={() => setCreateOpen(false)}
          >
            <motion.section
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto border border-pure-border-light bg-white dark:border-pure-border-dark dark:bg-black"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                aria-label="Close create post"
                className="absolute right-3 top-3 z-10 bg-white p-2 dark:bg-black"
              >
                <X size={18} />
              </button>
              <h2 className="border-b border-pure-border-light px-5 py-4 text-center text-sm font-bold dark:border-pure-border-dark">
                Create post
              </h2>
              <PostComposer
                autoFocus
                onPostCreated={(post) => {
                  setCreateOpen(false);
                  window.dispatchEvent(
                    new CustomEvent("zap:post-created", { detail: post }),
                  );
                  navigate("/");
                }}
              />
            </motion.section>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
