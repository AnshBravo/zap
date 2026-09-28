# Zap Client

Zap's web client is a React 19, TypeScript, and Vite application. It uses React Router, Axios, Socket.IO, Framer Motion, Tailwind CSS, Lucide icons, and Space Grotesk.

## Setup

```powershell
npm install
```

Create `client/.env.local` when the API or socket server is not at the local defaults:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
```

`VITE_API_URL` overrides the API base URL. Without it, the client uses the local API on localhost and the configured hosted API on other hosts. `VITE_SOCKET_URL` defaults to `http://localhost:3000`.

## Commands

```powershell
npm run dev
npm run lint
npm run build
npm run preview
```

## Main Routes

- `/` - paginated home feed and post creation
- `/search` - server-backed people and post search
- `/explore` - media grid of recent posts
- `/shorties` - vertical video feed for video posts
- `/notifications` - live notifications retained in this browser per account
- `/messages` - chat history via REST and message delivery via Socket.IO
- `/profile/:username` - posts, Shorties, Saved, profile editing, and follow lists

## Media

Post and profile-photo uploads request a presigned URL from `POST /api/v1/posts/upload-url`, upload directly to S3, then save the returned media URL. Configure the S3 bucket CORS policy to allow browser `PUT` requests from the client origin. Review [the API contract](../API_DOCUMENTATION.md) for request and response details.
You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
