# ⚡ Zap Social Network - API Documentation (v1)

**Base URL:** `http://localhost:3000/api/v1`  
**WebSocket Server:** `http://localhost:3000`  
**Auth Strategy:** Bearer JWT Token in `Authorization` Header (`Authorization: Bearer <token>`)

---

## 📋 Server Architecture Information

### Technology Stack

- **Runtime:** Node.js + Express.js (TypeScript)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (JSON Web Tokens) with bcrypt password hashing
- **Real-time:** Socket.io for WebSocket communication
- **Database Migrations:** Prisma migrations with version control

### Core Entities & Database Schema

```
User
├── id (UUID, Primary Key)
├── username (String, Unique)
├── email (String, Unique)
├── passwordHash (String)
├── bio (String, optional)
├── avatarUrl (String, optional)
├── createdAt (DateTime)
├── updatedAt (DateTime)
└── Relationships:
    ├── posts (One-to-Many)
    ├── comments (One-to-Many)
    ├── likes (One-to-Many)
    ├── followers (Many-to-Many via Follows)
    ├── following (Many-to-Many via Follows)
    ├── sentMessages (One-to-Many)
    └── receivedMessages (One-to-Many)

Post
├── id (UUID, Primary Key)
├── content (String, max 200 chars)
├── authorId (UUID, Foreign Key)
├── createdAt (DateTime)
├── updatedAt (DateTime)
└── Relationships:
    ├── author (Many-to-One)
    ├── likes (One-to-Many)
    └── comments (One-to-Many)

Comment
├── id (UUID, Primary Key)
├── content (String)
├── postId (UUID, Foreign Key)
├── userId (UUID, Foreign Key)
├── createdAt (DateTime)
└── Relationships:
    ├── post (Many-to-One)
    └── user (Many-to-One)

Like
├── userId (UUID, Foreign Key, Primary Key Part 1)
├── postId (UUID, Foreign Key, Primary Key Part 2)
├── Composite Key: (userId, postId)
└── Relationships:
    ├── user (Many-to-One)
    └── post (Many-to-One)

Follows
├── followerId (UUID, Foreign Key, Primary Key Part 1)
├── followingId (UUID, Foreign Key, Primary Key Part 2)
├── createdAt (DateTime)
├── Composite Key: (followerId, followingId)
└── Relationships:
    ├── follower (Many-to-One → User)
    └── following (Many-to-One → User)

Message
├── id (UUID, Primary Key)
├── content (String)
├── senderId (UUID, Foreign Key)
├── receiverId (UUID, Foreign Key)
├── createdAt (DateTime)
└── Relationships:
    ├── sender (Many-to-One)
    └── receiver (Many-to-One)
```

### Architecture Layers

```
Routes Layer (Express Router)
  ├── auth.routes.ts     → Authentication endpoints
  ├── post.routes.ts     → Post CRUD + interactions
  ├── user.routes.ts     → User profile + follow/unfollow
  ├── message.routes.ts  → Messaging endpoints
  └── comment.routes.ts  → Comment operations
         ↓
Controllers Layer (Business Logic)
  ├── auth.controller.ts         → Login, Register, Get Me
  ├── post.controller.ts         → Create, Get, Delete posts + Feed
  ├── user.controller.ts         → Get User, Update Profile
  ├── interaction.controller.ts  → Like, Comment, Delete Comment
  ├── follow.controller.ts       → Follow, Unfollow, Get Followers/Following
  └── message.controller.ts      → Get Chat History
         ↓
Middleware Layer
  ├── auth.middleware.ts   → JWT verification & user attachment
  └── error.middleware.ts  → Global error handling & response formatting
         ↓
Database Layer (Prisma)
  └── prisma.ts → Database connection & ORM client
         ↓
Utilities
  ├── ApiError.ts      → Custom error class (status, message)
  ├── asyncHandler.ts  → Wrapper for async/await error handling
  ├── jwt.ts           → JWT signing & verification
  └── password.ts      → Password hashing & comparison
```

### Error Handling Strategy

All API errors follow a consistent format:

```json
{
  "status": "error",
  "message": "Error description",
  "statusCode": 400,
  "stack": "Error stack trace (development only)"
}
```

**Common HTTP Status Codes:**

- `200` - Success (GET, successful operations)
- `201` - Created (POST resource creation)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found (resource not found)
- `409` - Conflict (duplicate email/username)
- `500` - Server Error

### Socket.io Real-time Events

**Namespaces & Rooms:**

```
Rooms:
  - user:{userId}  → Individual user notifications
  - post:{postId}  → Post-specific events (future)
```

**Emitted Events:**

```
notification
  ├── type: "LIKE" → User liked a post
  ├── type: "COMMENT" → User commented on post
  └── type: "FOLLOW" → User started following

message
  └── New message sent in real-time (to be integrated)
```

### Authentication Flow

```
1. User submits credentials (email, password) to POST /auth/register or /auth/login
2. Server validates input & checks database
3. For valid credentials:
   - Generate JWT token: signToken({ userId })
   - Return user data + token
4. Client stores token in localStorage
5. All subsequent requests include: Authorization: Bearer <token>
6. Middleware (protect) verifies token:
   - Decodes JWT
   - Attaches user to req.user
   - Proceeds if valid
7. On 401: Client clears token & redirects to login

JWT Structure:
- Header: { alg: "HS256", typ: "JWT" }
- Payload: { userId, iat, exp }
- Secret: JWT_SECRET from .env
```

### Middleware Stack

```
Request Flow:
1. Global Error Middleware (top)
2. Route-specific Middleware
   ├── protect (JWT verification) → Only for authenticated routes
   └── Optional: validation middleware (future)
3. Controller (business logic)
4. Response sent
5. Error Middleware (catches any errors)
```

---

## 1. Authentication (`/auth`)

### 1.1 Register User

- **Endpoint:** `POST /auth/register`
- **Access:** Public
- **Description:** Create a new user account and receive JWT token
- **Body:**
  ```json
  {
    "username": "jane",
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "status": "success",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "data": {
      "user": {
        "id": "user-uuid",
        "username": "jane",
        "email": "jane@example.com",
        "bio": null,
        "avatarUrl": null,
        "createdAt": "2026-08-19T10:30:00.000Z"
      }
    }
  }
  ```
- **Validation Rules:**
  - Username & email must be unique
  - Email must match valid email format
  - All fields required
- **Error Responses:**
  - `400 Bad Request` - Invalid input format
  - `409 Conflict` - Email/username already exists

### 1.2 Login User

- **Endpoint:** `POST /auth/login`
- **Access:** Public
- **Description:** Authenticate with email and password, receive JWT token
- **Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "data": {
      "user": {
        "id": "user-uuid",
        "username": "jane",
        "email": "jane@example.com",
        "bio": "Software developer",
        "avatarUrl": "https://example.com/avatar.jpg",
        "createdAt": "2026-08-19T10:30:00.000Z",
        "updatedAt": "2026-08-19T11:00:00.000Z"
      }
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request` - Missing/invalid email or password
  - `401 Unauthorized` - Invalid credentials

### 1.3 Get Current User

- **Endpoint:** `GET /auth/me`
- **Access:** Private (Requires JWT)
- **Headers:**
  ```
  Authorization: Bearer <token>
  ```
- **Description:** Retrieve authenticated user's profile information
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "user-uuid",
        "username": "jane",
        "email": "jane@example.com",
        "bio": "Software developer",
        "avatarUrl": "https://example.com/avatar.jpg",
        "createdAt": "2026-08-19T10:30:00.000Z",
        "updatedAt": "2026-08-19T11:00:00.000Z"
      }
    }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized` - Invalid or missing token

---

## 2. Posts (`/posts`)

### 2.1 Create Post

- **Endpoint:** `POST /posts`
- **Access:** Private (Requires JWT)
- **Description:** Create a new post by authenticated user
- **Body:**
  ```json
  {
    "content": "Hello everyone! This is my first post on Zap!"
  }
  ```
- **Validation:**
  - Content must not be empty
  - Max 200 characters
- **Response (201 Created):**
  ```json
  {
    "status": "success",
    "data": {
      "post": {
        "id": "post-uuid",
        "content": "Hello everyone! This is my first post on Zap!",
        "authorId": "user-uuid",
        "createdAt": "2026-08-19T12:00:00.000Z",
        "updatedAt": "2026-08-19T12:00:00.000Z",
        "author": {
          "id": "user-uuid",
          "username": "jane",
          "avatarUrl": "https://example.com/avatar.jpg"
        }
      }
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request` - Empty or too long content
  - `401 Unauthorized` - Not authenticated

### 2.2 Get Feed (Paginated)

- **Endpoint:** `GET /posts`
- **Access:** Public
- **Query Parameters:**
  - `page` (optional, default=1) - Page number
  - `limit` (optional, default=10, max=50) - Posts per page
- **Description:** Get paginated posts feed ordered by newest first
- **Example:** `GET /posts?page=1&limit=10`
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "posts": [
        {
          "id": "post-uuid",
          "content": "Post content...",
          "authorId": "user-uuid",
          "createdAt": "2026-08-19T12:00:00.000Z",
          "updatedAt": "2026-08-19T12:00:00.000Z",
          "author": {
            "id": "user-uuid",
            "username": "jane",
            "avatarUrl": "https://example.com/avatar.jpg"
          },
          "_count": {
            "likes": 5,
            "comments": 2
          }
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "totalPosts": 42,
        "totalPages": 5,
        "hasNextPage": true
      }
    }
  }
  ```

### 2.3 Get Single Post

- **Endpoint:** `GET /posts/:id`
- **Access:** Public
- **Description:** Retrieve a specific post by ID
- **Response (200 OK):** Same structure as Create Post response
- **Error Responses:**
  - `404 Not Found` - Post doesn't exist

### 2.4 Delete Post

- **Endpoint:** `DELETE /posts/:id`
- **Access:** Private (Requires JWT, must be post author)
- **Description:** Delete a post (only by the author)
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Post deleted successfully"
  }
  ```
- **Error Responses:**
  - `401 Unauthorized` - Not authenticated
  - `403 Forbidden` - Not post author
  - `404 Not Found` - Post doesn't exist

---

## 3. Post Interactions (`/posts/:postId/...`)

### 3.1 Toggle Like

- **Endpoint:** `POST /posts/:postId/like`
- **Access:** Private (Requires JWT)
- **Description:** Like or unlike a post (toggle behavior)
- **Body:** (empty)
- **Response (201 Created - Like Added or 200 OK - Like Removed):**
  ```json
  {
    "status": "success",
    "message": "Post liked successfully",
    "liked": true
  }
  ```
  OR (when unliking):
  ```json
  {
    "status": "success",
    "message": "Post unLiked successfully",
    "liked": false
  }
  ```
- **Real-time Notification:**
  - If post author differs from liker: Socket.io emits "notification" with type "LIKE"
- **Error Responses:**
  - `401 Unauthorized` - Not authenticated
  - `404 Not Found` - Post doesn't exist

### 3.2 Add Comment

- **Endpoint:** `POST /posts/:postId/comments`
- **Access:** Private (Requires JWT)
- **Description:** Add a comment to a post
- **Body:**
  ```json
  {
    "content": "Great post! I really enjoyed this."
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Comment added successfully",
    "data": {
      "comment": {
        "id": "comment-uuid",
        "content": "Great post! I really enjoyed this.",
        "postId": "post-uuid",
        "userId": "user-uuid",
        "createdAt": "2026-08-19T12:15:00.000Z",
        "user": {
          "id": "user-uuid",
          "username": "jane",
          "avatarUrl": "https://example.com/avatar.jpg"
        }
      }
    }
  }
  ```
- **Real-time Notification:**
  - If post author differs from commenter: Socket.io emits "notification" with type "COMMENT"
- **Error Responses:**
  - `400 Bad Request` - Empty comment content
  - `401 Unauthorized` - Not authenticated
  - `404 Not Found` - Post doesn't exist

### 3.3 Get Post Comments

- **Endpoint:** `GET /posts/:postId/comments`
- **Access:** Public
- **Query Parameters:**
  - `page` (optional, default=1)
  - `limit` (optional, default=10)
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "comments": [
        {
          "id": "comment-uuid",
          "content": "Comment content...",
          "postId": "post-uuid",
          "userId": "user-uuid",
          "createdAt": "2026-08-19T12:15:00.000Z",
          "user": {
            "id": "user-uuid",
            "username": "jane",
            "avatarUrl": "https://example.com/avatar.jpg"
          }
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "totalComments": 5,
        "totalPages": 1,
        "hasNextPage": false
      }
    }
  }
  ```

### 3.4 Delete Comment

- **Endpoint:** `DELETE /comments/:commentId`
- **Access:** Private (Requires JWT, must be comment author)
- **Description:** Delete a comment (only by the author)
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Comment deleted successfully"
  }
  ```
- **Error Responses:**
  - `401 Unauthorized` - Not authenticated
  - `403 Forbidden` - Not comment author
  - `404 Not Found` - Comment doesn't exist

---

## 4. Users (`/users`)

### 4.1 Get Public User Profile

- **Endpoint:** `GET /users/:username`
- **Access:** Public
- **Description:** Retrieve public profile information for a user by username
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "user-uuid",
        "username": "jane",
        "bio": "Software developer & tech enthusiast",
        "avatarUrl": "https://example.com/avatar.jpg",
        "createdAt": "2026-08-19T10:30:00.000Z",
        "_count": {
          "posts": 12
        }
      }
    }
  }
  ```
- **Note:** Public profile doesn't expose email or private data
- **Error Responses:**
  - `404 Not Found` - User doesn't exist

### 4.2 Update Own Profile

- **Endpoint:** `PATCH /users/me`
- **Access:** Private (Requires JWT)
- **Description:** Update authenticated user's bio and avatar URL
- **Body:**
  ```json
  {
    "bio": "Updated bio text",
    "avatarUrl": "https://example.com/new-avatar.jpg"
  }
  ```
- **Note:** Both fields are optional - only send fields you want to update
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "user-uuid",
        "username": "jane",
        "bio": "Updated bio text",
        "avatarUrl": "https://example.com/new-avatar.jpg",
        "createdAt": "2026-08-19T10:30:00.000Z",
        "updatedAt": "2026-08-19T13:00:00.000Z"
      }
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request` - Invalid field types
  - `401 Unauthorized` - Not authenticated

---

## 5. Follow System (`/users/:targetUserId/...`)

### 5.1 Toggle Follow/Unfollow

- **Endpoint:** `POST /users/:targetUserId`
- **Access:** Private (Requires JWT)
- **Description:** Follow or unfollow a user (toggle behavior)
- **Body:** (empty)
- **Response (201 Created - Following or 200 OK - Unfollowed):**
  ```json
  {
    "status": "success",
    "message": "Followed successfully.",
    "following": true
  }
  ```
  OR (when unfollowing):
  ```json
  {
    "status": "success",
    "message": "Unfollowed successfully",
    "following": false
  }
  ```
- **Real-time Notification:**
  - If user follows another: Socket.io emits "notification" with type "FOLLOW" to target user
- **Validation:**
  - Cannot follow yourself
- **Error Responses:**
  - `400 Bad Request` - Attempting to follow yourself
  - `401 Unauthorized` - Not authenticated
  - `404 Not Found` - Target user doesn't exist

### 5.2 Get Followers List

- **Endpoint:** `GET /users/:targetUserId/followers`
- **Access:** Public
- **Query Parameters:**
  - `page` (optional, default=1)
  - `limit` (optional, default=10)
- **Description:** Get paginated list of users following the target user
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "followers": [
        {
          "id": "follower-uuid",
          "username": "john",
          "avatarUrl": "https://example.com/john-avatar.jpg"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "totalFollowers": 25,
        "totalPages": 3,
        "hasNextPage": true
      }
    }
  }
  ```
- **Error Responses:**
  - `404 Not Found` - User doesn't exist

### 5.3 Get Following List

- **Endpoint:** `GET /users/:targetUserId/following`
- **Access:** Public
- **Query Parameters:**
  - `page` (optional, default=1)
  - `limit` (optional, default=10)
- **Description:** Get paginated list of users that the target user is following
- **Response (200 OK):** Same structure as Get Followers List
- **Error Responses:**
  - `404 Not Found` - User doesn't exist

---

## 6. Messaging (`/messages`)

### 6.1 Get Chat History

- **Endpoint:** `GET /messages/:otherUserId`
- **Access:** Private (Requires JWT)
- **Query Parameters:**
  - `page` (optional, default=1)
  - `limit` (optional, default=20, max=50)
- **Description:** Retrieve message history between current user and another user, paginated
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "messages": [
        {
          "id": "message-uuid",
          "content": "Hey, how are you?",
          "senderId": "sender-uuid",
          "receiverId": "receiver-uuid",
          "createdAt": "2026-08-19T14:00:00.000Z",
          "sender": {
            "id": "sender-uuid",
            "username": "jane",
            "avatarUrl": "https://example.com/avatar.jpg"
          }
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "totalMessages": 45,
        "totalPages": 3,
        "hasNextPage": true
      }
    }
  }
  ```
- **Note:** Messages are ordered from oldest to newest within each page
- **Real-time (Socket.io):**
  - New messages sent via WebSocket to connected recipients
  - Event name: `message`
- **Error Responses:**
  - `400 Bad Request` - Invalid user ID
  - `401 Unauthorized` - Not authenticated

---

## 📡 Socket.io Real-time Events

### Connection

```javascript
// Client connects with JWT token
const socket = io("http://localhost:3000", {
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  },
  transports: ["websocket"],
});

// Server validates token and establishes connection
socket.on("connect", () => {
  console.log("Connected to server");
});
```

### User-Specific Rooms

Each authenticated user is added to a room: `user:{userId}`

```
Example: user:12345 → Receives notifications targeted to user 12345
```

### Notification Events

**1. Like Notification**

```javascript
socket.on("notification", (data) => {
  // data.type === "LIKE"
  // data.message === "Someone liked your post!"
  // data.postId === "post-uuid"
  // data.triggeredBy === "user-uuid" (who liked)
});
```

**2. Comment Notification**

```javascript
socket.on("notification", (data) => {
  // data.type === "COMMENT"
  // data.message === "@jane commented on your post!"
  // data.postId === "post-uuid"
  // data.commentId === "comment-uuid"
  // data.triggeredBy === { id, username, avatarUrl }
});
```

**3. Follow Notification**

```javascript
socket.on("notification", (data) => {
  // data.type === "FOLLOW"
  // data.message === "A user started following you"
  // data.followerId === "user-uuid"
});
```

### Message Event (Future Implementation)

```javascript
socket.on("message", (data) => {
  // data.id === "message-uuid"
  // data.content === "Message content"
  // data.senderId === "sender-uuid"
  // data.receiverId === "receiver-uuid"
  // data.createdAt === "2026-08-19T14:00:00.000Z"
});
```

---

## 🔧 Utility Functions & Helpers

### Password Utilities

```typescript
hashPassword(password: string) → Promise<string>
  // Hashes password using bcrypt with 10 salt rounds

comparePasswords(password: string, hash: string) → Promise<boolean>
  // Compares plain password with hash
```

### JWT Utilities

```typescript
signToken(payload: { userId: string }) → string
  // Creates JWT with userId payload
  // Expiration: Configured in .env (typically 7 days)

verifyToken(token: string) → { userId: string }
  // Decodes and verifies JWT signature
  // Throws error if invalid or expired
```

### Error Class

```typescript
ApiError.badRequest(message) → ApiError (400)
ApiError.unauthorized(message) → ApiError (401)
ApiError.forbidden(message) → ApiError (403)
ApiError.notFound(message) → ApiError (404)
ApiError.conflict(message) → ApiError (409)
```

---

## ✅ Best Practices for API Usage

1. **Rate Limiting:** Implement on client side to prevent spam
2. **Pagination:** Always use pagination for endpoints returning lists
3. **Error Handling:** Check `status` field and handle errors gracefully
4. **Token Management:** Refresh tokens before expiration (implement refresh endpoint if needed)
5. **WebSocket:** Maintain persistent connection for real-time notifications
6. **Validation:** Validate inputs before sending to API
7. **Security:** Never expose JWT token in URLs; use Authorization header only

---

## 🔗 Related Documentation

- Client Architecture: See `REACT_ARCHITECTURE.md`
- Database Schema: See `server/prisma/schema.prisma`
- Environment Variables: Configure in `server/.env`

**Last Updated:** August 19, 2026  
**API Version:** v1  
**Status:** Active Development
