# Zap API Documentation

Current backend contract for the Zap Express server, Prisma schema, controllers, and Socket.IO implementation.

## 1. Overview

Zap is a social networking backend built with:

- Node.js
- Express.js
- TypeScript
- PostgreSQL via Prisma ORM
- JWT-based authentication
- Socket.IO for real-time notifications and messaging
- CORS-enabled client access

### Base URLs

- REST API: http://localhost:3000/api/v1
- Socket.IO server: http://localhost:3000
- Health endpoint: http://localhost:3000/health

### Authentication model

The API uses JWT tokens issued after successful registration or login.

Headers:

```http
Authorization: Bearer <jwt_token>
```

The token is verified in the auth middleware and attached to `req.user` for protected routes.

---

## 2. Technology Stack

### Backend stack

- Runtime: Node.js
- Web framework: Express.js
- Language: TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Security: bcryptjs + JWT
- Real-time layer: Socket.IO
- Validation: explicit controller-level checks
- Error handling: centralized middleware with custom error class

### API conventions

- API version prefix: `/api/v1`
- JSON payloads for request and response bodies
- Success responses use a standard `status` field
- Errors are surfaced through centralized middleware and custom `ApiError`
- Pagination is supported on list endpoints using `page` and `limit`

---

## 3. Application Architecture

### Core modules

- Auth routes: authentication and session lookup
- User routes: public profiles and follow actions
- Post routes: feed, post details, create/delete, likes, and comments
- Message routes: private chat history retrieval
- Socket layer: authenticated real-time delivery

### Main data models

- User
- Post
- Like
- Comment
- Follows
- Message

### Request lifecycle

1. Client sends HTTP request.
2. Express routes match the URL and HTTP method.
3. Middleware runs, including JWT checks for protected endpoints.
4. Controller performs Prisma database operations.
5. Response is returned in a standard JSON envelope.
6. Global error middleware handles exceptions and returns structured errors.

---

## 4. Standard Response Format

### Success response

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "cmx123",
      "username": "jane",
      "email": "jane@example.com"
    }
  }
}
```

### Message response

```json
{
  "status": "success",
  "message": "Post deleted successfully"
}
```

### Error response

```json
{
  "status": "error",
  "message": "Invalid email or password",
  "statusCode": 401
}
```

### Common HTTP status codes

- `200 OK` — Request successful
- `201 Created` — Resource created successfully
- `400 Bad Request` — Invalid request payload or validation failure
- `401 Unauthorized` — Missing or invalid JWT token
- `403 Forbidden` — User is authenticated but not allowed to perform the action
- `404 Not Found` — Requested resource does not exist
- `409 Conflict` — Duplicate username or email
- `500 Internal Server Error` — Unhandled server error

---

## 5. Authentication Endpoints

### 5.1 Register a new user

- Method: `POST`
- Route: `/api/v1/auth/register`
- Access: Public

Request body:

```json
{
  "username": "jane",
  "email": "jane@example.com",
  "password": "Password123!"
}
```

Example response:

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": "cmx123",
      "username": "jane",
      "email": "jane@example.com",
      "bio": null,
      "avatarUrl": null,
      "createdAt": "2026-08-19T10:30:00.000Z"
    }
  }
}
```

### 5.2 Log in

- Method: `POST`
- Route: `/api/v1/auth/login`
- Access: Public

Request body:

```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```

Example response:

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": "cmx123",
      "username": "jane",
      "email": "jane@example.com",
      "bio": "Software developer",
      "avatarUrl": "https://example.com/avatar.jpg",
      "createdAt": "2026-08-19T10:30:00.000Z",
      "updatedAt": "2026-08-19T10:45:00.000Z"
    }
  }
}
```

### 5.3 Get current authenticated user

- Method: `GET`
- Route: `/api/v1/auth/me`
- Access: Private

Example response:

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "cmx123",
      "username": "jane",
      "email": "jane@example.com",
      "bio": "Software developer",
      "avatarUrl": "https://example.com/avatar.jpg",
      "createdAt": "2026-08-19T10:30:00.000Z",
      "updatedAt": "2026-08-19T10:45:00.000Z"
    }
  }
}
```

---

## 6. Post Endpoints

### 6.1 Request a media upload URL

- Method: `POST`
- Route: `/api/v1/posts/upload-url`
- Access: Private

The client requests a short-lived S3 presigned `PUT` URL before creating a post. Supported media types are:

- `image/jpeg`
- `image/png`
- `image/gif`
- `image/webp`
- `video/mp4`
- `video/webm`

Request body:

```json
{
  "fileType": "image/png"
}
```

Example response:

```json
{
  "status": "success",
  "data": {
    "uploadUrl": "https://zap-app-media-store-2026.s3.us-east-1.amazonaws.com/...?...",
    "mediaUrl": "https://zap-app-media-store-2026.s3.us-east-1.amazonaws.com/uploads/user_1/....png",
    "mediaKey": "uploads/user_1/1734567890-ab12cd.png"
  }
}
```

The client must upload the file directly to `uploadUrl` with an HTTP `PUT` and the exact `Content-Type` used in the request. The URL expires after five minutes. The S3 bucket must allow browser `PUT` requests from the configured client origin.

### 6.2 Get feed

- Method: `GET`
- Route: `/api/v1/posts`
- Access: Public

Query parameters:

- `page` (optional, default `1`)
- `limit` (optional, default `10`, max `50`)

Example:

```http
GET /api/v1/posts?page=1&limit=10
```

Example response:

```json
{
  "status": "success",
  "data": {
    "posts": [
      {
        "id": "post_123",
        "content": "A new post from the community",
        "authorId": "user_1",
        "createdAt": "2026-08-19T12:00:00.000Z",
        "updatedAt": "2026-08-19T12:00:00.000Z",
        "author": {
          "id": "user_1",
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
      "totalPosts": 52,
      "totalPages": 6,
      "hasNextPage": true
    }
  }
}
```

### 6.3 Create a post

- Method: `POST`
- Route: `/api/v1/posts`
- Access: Private

Request body:

```json
{
  "content": "Hello everyone! This is my first post on Zap.",
  "mediaUrl": "https://zap-app-media-store-2026.s3.us-east-1.amazonaws.com/uploads/user_1/1734567890-ab12cd.png",
  "mediaKey": "uploads/user_1/1734567890-ab12cd.png"
}
```

Validation rules:

- `content` is required
- must be a non-empty string
- maximum length is 200 characters
- `mediaUrl` and `mediaKey` are optional, but must be supplied together
- `mediaKey` must belong to the authenticated user's `uploads/{userId}/` prefix
- `mediaUrl` must correspond to the generated S3 URL for `mediaKey`

Example response:

```json
{
  "status": "success",
  "data": {
    "post": {
      "id": "post_123",
      "content": "Hello everyone! This is my first post on Zap.",
      "mediaUrl": "https://zap-app-media-store-2026.s3.us-east-1.amazonaws.com/uploads/user_1/1734567890-ab12cd.png",
      "mediaKey": "uploads/user_1/1734567890-ab12cd.png",
      "authorId": "user_1",
      "createdAt": "2026-08-19T12:00:00.000Z",
      "updatedAt": "2026-08-19T12:00:00.000Z",
      "author": {
        "id": "user_1",
        "username": "jane",
        "avatarUrl": "https://example.com/avatar.jpg"
      }
    }
  }
}
```

### 6.4 Get a single post by ID

- Method: `GET`
- Route: `/api/v1/posts/:id`
- Access: Public

### 6.5 Delete a post

- Method: `DELETE`
- Route: `/api/v1/posts/:id`
- Access: Private

Only the post author can delete the post.

Example response:

```json
{
  "status": "success",
  "message": "Post deleted successfully"
}
```

When a post has media, deletion removes the S3 object before deleting the database record. If S3 deletion fails, the post is not deleted.

---

## 7. Post Interaction Endpoints

### 7.1 Toggle like on a post

- Method: `POST`
- Route: `/api/v1/posts/:postId/like`
- Access: Private

Behavior:

- If the user has not liked the post, a like is created.
- If the user has already liked the post, the like is removed.

Example response when liked:

```json
{
  "status": "success",
  "message": "Post liked successfully",
  "liked": true
}
```

Example response when unliked:

```json
{
  "status": "success",
  "message": "Post unLiked successfully",
  "liked": false
}
```

### 7.2 Add a comment

- Method: `POST`
- Route: `/api/v1/posts/:postId/comments`
- Access: Private

Request body:

```json
{
  "content": "This is a great post."
}
```

Example response:

```json
{
  "status": "success",
  "data": {
    "comment": {
      "id": "comment_123",
      "content": "This is a great post.",
      "postId": "post_123",
      "userId": "user_1",
      "createdAt": "2026-08-19T12:15:00.000Z",
      "user": {
        "id": "user_1",
        "username": "jane",
        "avatarUrl": "https://example.com/avatar.jpg"
      }
    }
  }
}
```

### 7.3 Get comments for a post

- Method: `GET`
- Route: `/api/v1/posts/:postId/comments`
- Access: Public

Query parameters:

- `page` (optional, default `1`)
- `limit` (optional, default `10`)

### 7.4 Delete a comment

- Method: `DELETE`
- Route: `/api/v1/comments/:commentId`
- Access: Private

Only the comment owner can delete the comment.

---

## 8. User Endpoints

### 8.1 Get a public user profile

- Method: `GET`
- Route: `/api/v1/users/:username`
- Access: Public

Example response:

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "user_1",
      "username": "jane",
      "bio": "Software developer",
      "avatarUrl": "https://example.com/avatar.jpg",
      "createdAt": "2026-08-19T10:30:00.000Z",
      "_count": {
        "posts": 12
      }
    }
  }
}
```

### 8.2 Update user profile

- Method: `PATCH`
- Route: `/api/v1/users/me`
- Access: Private

Request body:

```json
{
  "bio": "Updated bio",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

### 8.3 Toggle follow or unfollow

- Method: `POST`
- Route: `/api/v1/users/:targetUserId`
- Access: Private

This endpoint acts as a toggle.

Example response when following:

```json
{
  "status": "success",
  "message": "Followed successfully.",
  "following": true
}
```

Example response when unfollowing:

```json
{
  "status": "success",
  "message": "Unfollowed successfully",
  "following": false
}
```

### 8.4 Get followers

- Method: `GET`
- Route: `/api/v1/users/:targetUserId/followers`
- Access: Public

### 8.5 Get following

- Method: `GET`
- Route: `/api/v1/users/:targetUserId/following`
- Access: Public

---

## 9. Messaging Endpoints

### 9.1 Get chat history

- Method: `GET`
- Route: `/api/v1/messages/:otherUserId`
- Access: Private

Query parameters:

- `page` (optional, default `1`)
- `limit` (optional, default `20`, max `50`)

Example response:

```json
{
  "status": "success",
  "data": {
    "messages": 12,
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalMessages": 12,
      "totalPages": 1,
      "hasNextPage": false
    }
  }
}
```

> Note: The current controller implementation returns `messages` as a count value rather than the actual array. This is important for client-side integration and should be corrected if the intended chat API is to return message records rather than a numeric summary.

---

## 10. Health and Operational Endpoints

### 10.1 Server health check

- Method: `GET`
- Route: `/health`
- Access: Public

Example response:

```json
{
  "status": "ok",
  "message": "Server is running healthy."
}
```

---

## 11. Real-Time Events with Socket.IO

The backend initializes Socket.IO and authenticates each client using a JWT token.

### Connection example

```javascript
const socket = io("http://localhost:3000", {
  auth: {
    token: "<jwt_token>",
  },
});
```

### Authenticated socket behavior

- User is joined into a room named `user:<userId>`
- Notifications for likes, comments, and follows are emitted to the target user room
- Direct message events are emitted to the receiving user room

### Event list

#### `notification`

Emitted when a user interacts with another user’s content.

Example payload:

```json
{
  "type": "LIKE",
  "message": "Someone liked your post!",
  "postId": "post_123",
  "triggeredBy": "user_2"
}
```

Supported notification types:

- `LIKE`
- `COMMENT`
- `FOLLOW`

#### `receive_message`

Emitted when a message is delivered to the recipient user.

#### `message_sent`

Emitted back to the sender after message persistence succeeds.

#### `error`

Emitted to the client when message delivery or socket actions fail.

---

## 12. Security and Infrastructure Notes

### Security practices implemented

- Passwords are hashed using bcrypt before storage
- JWTs are used to protect private routes
- CORS is enabled for the client origin
- Prisma enforces referential integrity and unique constraints

### Environment configuration

The backend expects environment variables such as:

- `DATABASE_URL`
- `JWT_SECRET`
- `CLIENT_URL`
- `AWS_REGION`
- `AWS_S3_BUCKET_NAME`
- AWS credentials supplied through the AWS SDK credential chain

---

## 13. Route Summary

| Resource           | Method   | Path                                    | Access  |
| ------------------ | -------- | --------------------------------------- | ------- |
| Health check       | `GET`    | `/health`                               | Public  |
| Register           | `POST`   | `/api/v1/auth/register`                 | Public  |
| Login              | `POST`   | `/api/v1/auth/login`                    | Public  |
| Current user       | `GET`    | `/api/v1/auth/me`                       | Private |
| Feed               | `GET`    | `/api/v1/posts`                         | Public  |
| Request upload URL | `POST`   | `/api/v1/posts/upload-url`              | Private |
| Create post        | `POST`   | `/api/v1/posts`                         | Private |
| Get post           | `GET`    | `/api/v1/posts/:id`                     | Public  |
| Delete post        | `DELETE` | `/api/v1/posts/:id`                     | Private |
| Toggle like        | `POST`   | `/api/v1/posts/:postId/like`            | Private |
| Add comment        | `POST`   | `/api/v1/posts/:postId/comments`        | Private |
| Get comments       | `GET`    | `/api/v1/posts/:postId/comments`        | Public  |
| Delete comment     | `DELETE` | `/api/v1/comments/:commentId`           | Private |
| Update profile     | `PATCH`  | `/api/v1/users/me`                      | Private |
| Toggle follow      | `POST`   | `/api/v1/users/:targetUserId`           | Private |
| Followers          | `GET`    | `/api/v1/users/:targetUserId/followers` | Public  |
| Following          | `GET`    | `/api/v1/users/:targetUserId/following` | Public  |
| User profile       | `GET`    | `/api/v1/users/:username`               | Public  |
| Chat history       | `GET`    | `/api/v1/messages/:otherUserId`         | Private |

---

## 14. Notes for Frontend Integration

- Store the JWT in a secure client-side storage mechanism and attach it to every protected request.
- Use the Socket.IO connection for notifications and direct-message updates.
- Handle all API errors by checking the HTTP status code and message.
- Apply pagination on all list endpoints to keep large datasets manageable.
- Normalize all returned IDs and timestamps before rendering UI state.
- For media posts, request an upload URL, upload directly to S3, then create the post with the returned `mediaUrl` and `mediaKey`.
- Media URLs require readable S3 objects or a configured CDN/read-access strategy.

Last updated: 2026-09-06
