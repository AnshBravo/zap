# Zap Frontend Architecture

## Overview

Zap is a React 19, TypeScript, and Vite single-page application with authenticated routes, a responsive shell, and Socket.IO communication.

---

## Architectural Summary

The client application follows a layered architecture:

- Presentation layer: pages, layout components, and reusable UI blocks
- State layer: React context providers for authentication, theme, and socket connectivity
- Service layer: Axios-based API modules for backend communication
- Real-time layer: Socket.IO client listeners and event-driven updates
- Routing layer: protected route structure with page-level navigation

At a high level:

```text
React App
  ├─ App shell and routing
  ├─ Auth / theme / socket providers
  ├─ Page-level feature modules
  │   ├─ Feed
  │   ├─ Explore
  │   ├─ Messages
  │   ├─ Notifications
  │   ├─ Profile
  │   └─ Follow lists
  ├─ Reusable components
  ├─ API client modules
  └─ Shared utilities and types
```

---

## Tech Stack

### Core frontend stack

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Axios
- Socket.IO Client
- Framer Motion
- Lucide React

---

## Project Structure

```text
client/
├── src/
│   ├── App.tsx                     # Route definitions and protected layout
│   ├── main.tsx                    # App bootstrap and provider wiring
│   ├── index.css                   # Tailwind base and global styles
│   ├── App.css                     # App-specific styling overrides
│   ├── api/
│   │   ├── axios.ts                # Shared API config and interceptors
│   │   ├── auth.ts                 # Authentication endpoints
│   │   ├── posts.ts                # Feed and post APIs
│   │   ├── users.ts                # Profile and follow APIs
│   │   ├── messages.ts             # Messaging APIs
│   │   └── ...
│   ├── components/
│   │   ├── common/
│   │   │   └── Animations.tsx      # Shared motion utilities
│   │   ├── feed/
│   │   │   ├── PostCard.tsx        # Post list item rendering
│   │   │   └── PostComposer.tsx    # New post composer
│   │   └── layout/
│   │       ├── AppLayout.tsx       # Main responsive shell
│   │       ├── Sidebar.tsx         # Desktop navigation
│   │       ├── MobileNavbar.tsx    # Mobile navigation
│   │       ├── TopNavbar.tsx       # Top header navigation
│   │       ├── RightWidgetSidebar.tsx
│   │       └── ...
│   ├── context/
│   │   ├── AuthContext.tsx         # Auth and session state
│   │   ├── SocketContext.tsx       # Socket lifecycle and connection state
│   │   └── ThemeContext.tsx        # Theme toggling and persistence
│   ├── hooks/
│   │   └── ...                     # Reusable feature hooks
│   ├── pages/
│   │   ├── FeedPage.tsx            # Home feed
│   │   ├── ExplorePage.tsx         # Browse and discover content
│   │   ├── MessagesPage.tsx        # Messaging interface
│   │   ├── NotificationsPage.tsx   # Notification stream
│   │   ├── ProfilePage.tsx         # User profile page
│   │   ├── FollowListPage.tsx     # Followers / following lists
│   │   ├── LoginPage.tsx           # Auth login view
│   │   ├── RegisterPage.tsx        # Auth registration view
│   │   └── ...
│   ├── types/
│   │   └── index.ts                # Shared application types
│   ├── utils/
│   │   └── ...                     # Formatters and helpers
│   └── assets/
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── tailwind.config.ts
├── eslint.config.js
└── README.md
```

---

## Application Shell and Layout

The app uses a consistent shell across authenticated routes via `AppLayout`.

### Layout responsibilities

- Desktop: three-column composition with navigation, content, and widgets
- Mobile: compact stacked layout with persistent navigation
- Shared page wrappers to preserve visual consistency across the app
- Route transitions and smooth motion through reusable animation utilities

### Layout structure

```text
AppLayout
  ├─ Sidebar / Navigation
  ├─ Main Content Outlet
  └─ Right Sidebar / Widgets
```

---

## Routing Model

The application routes are centralized in `App.tsx` and guarded by authentication state.

### Public routes

- `/login`
- `/register`

### Protected routes

- `/`
- `/explore`
- `/notifications`
- `/messages`
- `/profile`
- `/profile/:username`
- `/profile/:username/followers`
- `/profile/:username/following`

### Routing principle

Protected routes only render when the user is authenticated and the session is ready. Until then, the app keeps the user in a loading state to prevent flashes of unauthenticated content.

---

## State Management

### 1. Auth context

`AuthContext` owns the authenticated user session and session persistence.

Responsibilities:

- track signed-in user information
- manage token storage
- maintain authentication state
- persist user session across refreshes
- handle logout and invalid token recovery

### 2. Theme context

`ThemeContext` manages the application visual mode.

Responsibilities:

- dark / light mode toggling
- persisted preference in local storage
- applying the global theme class to the document root

### 3. Socket context

`SocketContext` manages the live connection used for notifications and messaging.

Responsibilities:

- initialize connection after authentication
- share socket instance with components
- listen for connection/disconnection lifecycle events
- handle user-specific room subscriptions and event-driven updates

---

## API Layer

The frontend uses a centralized Axios client in `src/api/axios.ts`.

### API configuration

- shared base URL derived from environment configuration
- JSON content type for all requests
- automatic bearer token attachment for authenticated calls
- centralized unauthorized handling to clear stale session data and force re-authentication
- direct S3 uploads use the presigned URL returned by the posts API and send the file's exact MIME type

### Request flow

```text
Component action
  ↓
API module method
  ↓
Axios request interceptor
  ↓
Authorization header attached
  ↓
Backend response
  ↓
Local component state update / UI refresh
```

### API module organization

Features are separated by domain:

- `auth` for login, signup, session checks
- `posts` for feed, post creation, likes, comments
- `users` for profile data, follow state, followers, following
- `messages` for conversation history and message sending

### Media upload flow

Media post creation is a two-stage operation:

```text
PostComposer selects a file
  ↓
postsApi.getUploadUrl(file.type)
  ↓
postsApi.uploadMedia(uploadUrl, file) via browser PUT to S3
  ↓
postsApi.createPost({ content, mediaUrl, mediaKey })
  ↓
PostCard renders the returned media URL
```

The server allowlists image and video MIME types, scopes generated keys to the authenticated user, and requires `mediaUrl` and `mediaKey` to match. The upload URL is short-lived, while the resulting media URL must be readable by the client through the configured S3 or CDN access policy.

---

## Real-time Communication

The client uses Socket.IO for immediacy in social features such as:

- direct messaging
- live notifications
- feed/event-driven updates

### Typical socket usage pattern

- connect when user is authenticated
- subscribe to user-specific rooms using the authenticated user id
- listen for event payloads such as `receive_message` and `notification`
- update local UI state immediately without refetching the entire page

This pattern improves perceived responsiveness and supports collaborative social behavior in real time.

---

## Feature Architecture

### Feed

The feed page loads posts from the backend, displays the composer for new posts, and supports content interactions such as:

- creating a new post
- selecting image or video media and uploading it directly to S3 before post creation
- liking posts
- adding comments
- viewing author metadata, timestamps, and attached media

### Explore

`ExplorePage` provides content discovery and user/content browsing.

### Messages

The messaging feature is built around conversation history and real-time message delivery.

Flow:

- load conversations with one or more users
- display ordered message history
- send new messages through the API and socket channel
- update the message list in real time on receipt

### Notifications

The notification page listens to backend-emitted notification events and maps them into a readable output format for the user.

### Profile and follow system

The profile experience includes:

- viewing a selected user profile
- following or unfollowing users
- displaying follower and following counts
- opening dedicated follower and following list pages
- linking user counts to relationship views

This is implemented as a directional social graph where:

- followers = users who follow this profile
- following = users this profile follows

---

## Data and Domain Model

The frontend expects several domain entities with consistent fields across the backend and UI.

### Representative types

```ts
interface User {
  id: string;
  username: string;
  email?: string;
  bio?: string;
  avatarUrl?: string | null;
  createdAt?: string;
}

interface Post {
  id: string;
  authorId: string;
  content: string;
  mediaUrl?: string | null;
  mediaKey?: string | null;
  createdAt: string;
  updatedAt?: string;
  author?: User;
  _count?: {
    likes: number;
    comments: number;
  };
}

interface Comment {
  id: string;
  content: string;
  userId: string;
  postId: string;
  createdAt: string;
  user?: User;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  sender?: User;
}
```

---

## Security and Session Handling

The frontend follows a session-first approach for secure access:

- tokens are stored in client storage after login
- API requests attach the token via interceptor
- expired or invalid auth triggers cleanup and redirect behavior
- protected routes prevent access to restricted content before session hydration is complete

---

## Development and Build Workflow

### Standard scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

### Configuration files

- `vite.config.ts` for dev/build bundling
- `tsconfig*.json` for TypeScript configuration
- `tailwind.config.ts` for theming and utility configuration
- `eslint.config.js` for lint enforcement

---

## Quick Reference

### Useful Paths

- Entry: `src/main.tsx`
- Routes: `src/App.tsx`
- Layouts: `src/components/layout/`
- Contexts: `src/context/`
- Pages: `src/pages/`
- Types: `src/types/index.ts`
- API: `src/api/axios.ts`

### Key Hooks

```typescript
useAuth(); // Get user, token, auth methods
useTheme(); // Get theme, toggleTheme
useSocket(); // Get socket instance, connection status
```

### Key Methods

```typescript
login(email, password);
register(username, email, password);
logout();
updateUser(fields);
toggleTheme();
```

---

**Last Updated:** September 6, 2026
**Version:** React 19.2.8 | Vite 8.2.0 | TypeScript 6.0.2
