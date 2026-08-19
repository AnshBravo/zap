# Zap React App - Architecture Preview

## Overview

**Zap** is a modern React 19 + TypeScript single-page application built with Vite, featuring real-time messaging, authentication, and a responsive 3-column layout. It uses TailwindCSS for styling and Socket.io for real-time communication.

---

## 📊 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    React Application                     │
│                       (main.tsx)                          │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    ┌───▼────┐   ┌────▼───┐   ┌─────▼────┐
    │ Theme  │   │  Auth  │   │  Socket  │
    │Context │   │Context │   │ Context  │
    └────────┘   └────────┘   └──────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
                   ┌───▼────┐
                   │   App  │
                   │Router  │
                   └───┬────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    ┌───▼──────┐  ┌────▼────┐  ┌─────▼────┐
    │ Sidebar  │  │  Content │  │RightBar  │
    │ (Layout) │  │  (Pages) │  │(Widgets) │
    └──────────┘  └──────────┘  └──────────┘
```

---

## 🗂️ Project Structure

### Root Level

```
client/
├── src/
│   ├── main.tsx              # Entry point with context providers
│   ├── App.tsx               # Router configuration
│   ├── index.css             # Global styles
│   ├── App.css               # App-specific styles
│   ├── api/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── types/
│   └── utils/
├── public/                   # Static assets
├── package.json              # Dependencies
├── vite.config.ts            # Vite build config
├── tailwind.config.ts        # TailwindCSS configuration
├── tsconfig.json             # TypeScript config
├── eslint.config.js          # ESLint rules
└── index.html                # HTML entry point
```

---

## 🔄 Context Providers (Dependency Injection)

### 1. **ThemeContext** (`src/context/ThemeContext.tsx`)

Manages application-wide theme state (dark/light mode)

```
Features:
├── State: theme ("dark" | "light")
├── Storage: localStorage ("zap_theme")
├── Auto-detect: System preference if not stored
├── Hook: useTheme()
└── Functionality:
    ├── toggleTheme()
    └── Applies "dark" class to document root
```

### 2. **AuthContext** (`src/context/AuthContext.tsx`)

Manages user authentication and session

```
Features:
├── State:
│   ├── user: User | null
│   ├── token: JWT token
│   ├── isAuthenticated: boolean
│   └── isLoading: boolean
├── Storage: localStorage ("zap_token", "zap_user")
├── Methods:
│   ├── login(email, password)
│   ├── register(username, email, password)
│   ├── logout()
│   └── updateUser(fields)
├── Hook: useAuth()
└── Initialization:
    └── Restores session on app load from localStorage
```

### 3. **SocketContext** (`src/context/SocketContext.tsx`)

Manages WebSocket connection for real-time features

```
Features:
├── Library: Socket.io-client
├── State:
│   ├── socket: Socket instance | null
│   └── isConnected: boolean
├── Server URL: VITE_SOCKET_URL or "http://localhost:3000"
├── Authentication: Uses JWT token from AuthContext
├── Connection Logic:
│   ├── Only connects when authenticated
│   ├── Auto-disconnects on logout
│   └── Uses WebSocket transport
├── Hook: useSocket()
└── Events:
    ├── "connect" → sets isConnected = true
    └── "disconnect" → sets isConnected = false
```

**Provider Nesting (main.tsx):**

```
ThemeProvider (outermost)
  └─ AuthProvider
      └─ SocketProvider
          └─ App (Router)
```

---

## 📍 Routing & Pages

### Routes (`src/App.tsx`)

```
Public Routes:
├── /login                 → LoginPage
└── /register              → RegisterPage

Protected Routes (within AppLayout):
├── /                      → FeedPage (Home Feed)
├── /explore               → ExplorePage
├── /notifications         → NotificationsPage
├── /messages              → MessagesPage
├── /profile               → ProfilePage (Current user)
└── /profile/:username     → ProfilePage (Other users)

Catch-all:
└── *                      → Redirects to /

Guard: ProtectedRoutes Component
├── Checks: isAuthenticated & isLoading
├── Shows: Loading state during authentication check
└── Currently: Protection disabled (commented out)
```

### Page Components (`src/pages/`)

- **LoginPage** - Authentication form
- **RegisterPage** - User registration form
- **HomePage** - Placeholder (FeedPage in routes)
- **ProfilePage** - User profile view
- Other pages: ExplorePage, NotificationsPage, MessagesPage (placeholders)

---

## 🎨 Layout System

### AppLayout (`src/components/layout/AppLayout.tsx`)

Responsive 3-column layout:

```
Desktop (3-column):
┌─────────────────────────────────────────────┐
│    Sidebar    │      Content      │  Widget │
│   (Fixed)     │      (Main)       │  (Fixed)│
│               │  <Outlet />       │         │
│               │  (Routes here)    │         │
└─────────────────────────────────────────────┘

Mobile:
┌──────────────────────┐
│   Mobile Navbar      │  (Sticky top)
├──────────────────────┤
│    Content           │  (Slides up under navbar)
│   <Outlet />         │
├──────────────────────┤
│  Mobile Nav Bar      │  (Fixed bottom)
└──────────────────────┘
```

### Layout Components

- **Sidebar** (`src/components/layout/Sidebar.tsx`)
  - Navigation menu (desktop only)
  - Fixed positioning
- **RightWidgetSidebar** (`src/components/layout/RightWidgetSidebar.tsx`)
  - Right-side widgets (desktop only)
  - Fixed positioning

- **MobileNavbar** (`src/components/layout/MobileNavbar.tsx`)
  - Mobile-specific navigation
  - Fixed at bottom on mobile

- **PageTransition** (Animations component)
  - Wraps `<Outlet />` for route transition effects
  - Uses Framer Motion

---

## 📦 Data Types (`src/types/index.ts`)

```typescript
User {
  id: string
  username: string
  email?: string
  bio?: string
  avatarUrl?: string | null
  createdAt?: string
  _count?: {
    posts: number
    followers: number
    following: number
  }
}

Post {
  id: string
  username: string
  authorId: string
  createdAt: string
  updatedAt: string
  author: { id, username, avatarUrl }
  _count: { likes, comments }
}

Comment {
  id: string
  content: string
  postId: string
  userId: string
  createdAt: string
  user: { id, username, avatarUrl }
}

Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  createdAt: string
  sender: { id, username, avatarUrl }
}

AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}
```

---

## 🔌 API Integration

### Axios Instance (`src/api/axios.ts`)

**Base Configuration:**

```javascript
Base URL: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
Content-Type: application/json
```

**Request Interceptor:**

```
Automatically attaches JWT token to all requests:
Authorization: Bearer <zap_token>
(Retrieved from localStorage)
```

**Response Interceptor:**

```
On 401 (Unauthorized):
├── Clears localStorage ("zap_token", "zap_user")
└── Rejects promise (triggers login redirect)

On other errors:
└── Passes through for component-level handling
```

**Endpoints Used:**

```
POST /auth/login
  Request: { email, password }
  Response: { data: { user, token } }

POST /auth/register
  Request: { username, email, password }
  Response: { data: { user, token } }

[Other endpoints to be implemented for posts, users, messages, etc.]
```

---

## 🎯 Key Features & Dependencies

### Core Libraries

| Package          | Version | Purpose                 |
| ---------------- | ------- | ----------------------- |
| react            | ^19.2.8 | UI framework            |
| react-dom        | ^19.2.8 | DOM rendering           |
| react-router-dom | ^7.18.2 | Routing & navigation    |
| typescript       | ~6.0.2  | Type safety             |
| vite             | ^8.2.0  | Build tool & dev server |

### State & Data

| Package               | Version  | Purpose                 |
| --------------------- | -------- | ----------------------- |
| @tanstack/react-query | ^5.101.4 | Server state management |
| axios                 | ^1.19.0  | HTTP client             |
| socket.io-client      | ^4.8.3   | WebSocket client        |

### UI & Styling

| Package                   | Version | Purpose                  |
| ------------------------- | ------- | ------------------------ |
| tailwindcss               | ^4.3.3  | Utility-first CSS        |
| @tailwindcss/vite         | ^4.3.3  | Vite plugin for Tailwind |
| lucide-react              | ^1.31.0 | Icon library             |
| framer-motion             | ^13.1.0 | Animation library        |
| @fontsource/space-grotesk | ^5.3.0  | Font (Space Grotesk)     |

---

## 🎨 Styling System

### TailwindCSS Configuration

- **Utility-first** CSS framework
- **Custom theme**: Dark mode support via Tailwind
- **Class utilities**: `dark:` prefix for dark mode variants
- **Custom colors**: `pure-border-light`, `pure-border-dark` (custom defined)
- **Responsive design**: Mobile-first breakpoints (lg: for desktop)

### CSS Structure

```
src/index.css          → Global Tailwind imports and base styles
src/App.css            → App-scoped component styles
tailwind.config.ts     → Custom theme configuration
```

### Responsive Classes in Use

```
pb-20 lg:pb-0          → Padding bottom responsive to navbar
border-pure-border-light dark:border-pure-border-dark
                       → Theme-aware borders
min-h-screen           → Full viewport height
flex flex-1 min-w-0    → Flexbox with overflow handling
```

---

## 🔐 Authentication Flow

```
┌─────────────────┐
│  User visits    │
│  /login or /reg │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Submits credentials to API     │
│  POST /auth/login or /register  │
└────────┬────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  API returns: { user, token }    │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  AuthContext stores:             │
│  ├─ User in state                │
│  ├─ Token in state               │
│  └─ Both in localStorage          │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  ProtectedRoutes checks auth     │
│  Allows access to protected      │
│  routes within AppLayout         │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  SocketContext initializes       │
│  WebSocket connection            │
│  (sends token in auth)           │
└──────────────────────────────────┘
```

---

## 📲 Real-time Communication (Socket.io)

```
Connection Flow:
1. User logs in → AuthContext has token
2. SocketContext detects isAuthenticated = true
3. Initializes Socket.io connection with auth token
4. Server validates token and establishes connection
5. Listens for "connect" / "disconnect" events
6. On logout → Socket auto-disconnects

Usage Pattern (in components):
const { socket, isConnected } = useSocket();
socket?.on("event_name", (data) => { ... });
socket?.emit("event_name", data);
```

---

## 📂 Component Organization

### Folder Structure

```
components/
├── common/
│   └── Animations.tsx       → PageTransition, reusable animations
├── feed/
│   ├── PostCard.tsx         → Individual post display
│   └── PostComposer.tsx     → Create new post form
└── layout/
    ├── AppLayout.tsx        → Main 3-column layout
    ├── Sidebar.tsx          → Left navigation
    ├── RightWidgetSidebar.tsx → Right widgets
    └── MobileNavbar.tsx     → Mobile bottom nav
```

### Currently Implemented Components

- **AppLayout** - Main layout wrapper
- **Sidebar** - Navigation (structure exists)
- **MobileNavbar** - Mobile navigation (structure exists)
- **RightWidgetSidebar** - Widget area (structure exists)
- **PageTransition** - Route animation wrapper

### Placeholder Components (To be implemented)

- **PostCard** - Display individual posts
- **PostComposer** - Create/compose new posts
- Custom page components for Explore, Notifications, Messages

---

## 🚀 Build & Development Setup

### Scripts (`package.json`)

```bash
npm run dev      # Start Vite dev server (hot reload)
npm run build    # Production build (TypeScript + Vite)
npm run lint     # ESLint check
npm run preview  # Preview production build locally
```

### Configuration Files

- **vite.config.ts** - Vite bundler & dev server config
- **tsconfig.json** - TypeScript compiler options
- **tailwind.config.ts** - Tailwind theme & plugins
- **eslint.config.js** - Code quality rules
- **.env files** - Environment variables (VITE_API_URL, VITE_SOCKET_URL)

### Environment Variables

```
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
```

---

## 🔄 State Management Strategy

### Context API (Current)

- **ThemeContext** - Global theme state
- **AuthContext** - User & authentication state
- **SocketContext** - WebSocket connection

### React Query (Installed but not yet integrated)

- For server-state management
- Caching API responses
- Automatic refetching

### Local Component State

- Form inputs, UI toggles, loading states
- Not centralized (managed in individual components)

---

## 🎯 Data Flow Summary

```
User Input
  │
  ▼
Component State / Form
  │
  ▼
API Call (axios)
  │
  ├─ Interceptor attaches JWT token
  └─ Interceptor handles 401 errors
  │
  ▼
Backend Response
  │
  ▼
Context Update (AuthContext, SocketContext)
  │
  ▼
localStorage Sync
  │
  ▼
Re-render Components (useAuth, useSocket hooks)
  │
  ▼
UI Update
```

---

## 🛠️ Future Architecture Improvements

### Recommended Enhancements

1. **Custom Hooks** (`src/hooks/`) - Create domain-specific hooks
   - `usePost()` - Post operations
   - `useUser()` - User operations
   - `useMessages()` - Messaging operations
   - `useFollow()` - Follow/unfollow logic

2. **React Query Integration**
   - Set up query client in main.tsx
   - Replace direct API calls with useQuery/useMutation
   - Implement optimistic updates

3. **Error Boundary**
   - Wrap route components with error boundary
   - Graceful error handling

4. **Logger Utility**
   - Centralized logging for debugging
   - Environment-based filtering

5. **API Module Structure**
   - Separate API calls into modules:
     - `api/auth.ts`, `api/posts.ts`, `api/users.ts`, etc.

6. **Component Slots Pattern**
   - More flexible layout components
   - Better composability

---

## ✅ Current Implementation Status

### ✅ Completed

- Basic app setup (Vite, React 19, TypeScript)
- Router configuration
- 3-column responsive layout (desktop + mobile)
- Context providers (Theme, Auth, Socket)
- Axios interceptors & error handling
- Type definitions for core entities
- TailwindCSS theming (dark/light)
- LocalStorage persistence

### 🔄 In Progress

- Feed page & post features
- User profile pages
- Messaging system

### ⏳ To Do

- Explore page features
- Notifications system
- Real-time Socket.io events
- React Query integration
- Custom hooks library
- Error handling & validation
- Component polish & animations

---

## 🔗 Quick Reference

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

**Last Updated:** August 19, 2026
**Version:** React 19.2.8 | Vite 8.2.0 | TypeScript 6.0.2
