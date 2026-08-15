# ⚡ Zap Social Network - API Documentation (v1)

**Base URL:** `http://localhost:5000/api/v1`  
**WebSocket Server:** `ws://localhost:5000`  
**Auth Strategy:** Bearer JWT Token in `Authorization` Header (`Authorization: Bearer <token>`)

---

## 1. Authentication (`/auth`)

### 1.1 Register User

- **Endpoint:** `POST /auth/register`
- **Access:** Public
- **Body:**
  ```json
  {
    "username": "jane",
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
