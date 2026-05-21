# 📘 Be Scheduler — API Documentation

> **Base URL:** `http://localhost:4000`
> **Swagger UI:** `http://localhost:4000/docs`
> **Version:** `1.0`
> **Authentication:** Bearer Token (JWT)

---

## 🔐 Authentication

All protected endpoints require the following header:

```http
Authorization: Bearer <access_token>
```

The token is obtained from the **Login** endpoint.

---

## 📋 Endpoint Overview

| Module | Method | Endpoint | Auth | Description |
|--------|--------|----------|------|-------------|
| Auth | `POST` | `/auth/register` | ❌ | Register a new user |
| Auth | `POST` | `/auth/login` | ❌ | Login and get JWT token |
| User | `GET` | `/users/me` | ✅ | Get current user profile |
| User | `PATCH` | `/users/me` | ✅ | Update current user profile |
| Onboarding | `POST` | `/onboarding` | ✅ | Submit onboarding data |
| Onboarding | `GET` | `/onboarding/me` | ✅ | Get my onboarding data |
| Conversation | `POST` | `/conversations` | ✅ | Create a new conversation |
| Conversation | `GET` | `/conversations` | ✅ | List my conversations |
| Conversation | `GET` | `/conversations/:id` | ✅ | Get conversation detail |
| Conversation | `POST` | `/conversations/:id/members` | ✅ | Add member to conversation |
| Agenda | `POST` | `/agendas` | ✅ | Create a new agenda |
| Agenda | `GET` | `/agendas` | ✅ | List my agendas |
| Agenda | `GET` | `/agendas/:id` | ✅ | Get agenda detail |
| Agenda | `PATCH` | `/agendas/:id` | ✅ | Update an agenda |

---

## 🔑 Auth

### Register

```
POST /auth/register
```

Register a new user account. No authentication required.

**Request Body**

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "username": "johndoe",
  "password": "secret123"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | `string` | ✅ | Valid email format |
| `name` | `string` | ✅ | Not empty |
| `username` | `string` | ✅ | Not empty |
| `password` | `string` | ✅ | Min 6 characters |

**Response `201 Created`**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "username": "johndoe",
  "company": null,
  "phone": null,
  "nik": null,
  "avatar": null,
  "position": null,
  "isOnboarded": false,
  "lastActiveAt": "2026-05-21T10:00:00.000Z",
  "createdAt": "2026-05-21T10:00:00.000Z",
  "updatedAt": "2026-05-21T10:00:00.000Z"
}
```

> ⚠️ The `password` field is **never** returned in any response.

**Error Responses**

| Status | Reason |
|--------|--------|
| `400 Bad Request` | Validation failed (wrong format or length) |
| `409 Conflict` | Email already registered |

---

### Login

```
POST /auth/login
```

Authenticate and retrieve a JWT access token.

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | `string` | ✅ | Valid email format |
| `password` | `string` | ✅ | Not empty |

**Response `200 OK`**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**JWT Payload (decoded)**

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "username": "johndoe"
}
```

**Error Responses**

| Status | Reason |
|--------|--------|
| `400 Bad Request` | Invalid email format |
| `401 Unauthorized` | Incorrect email or password |

---

## 👤 User

### Get My Profile

```
GET /users/me
```

Returns the profile of the currently authenticated user.

**Headers**

```http
Authorization: Bearer <access_token>
```

**Response `200 OK`**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "username": "johndoe",
  "company": "PT. Contoh",
  "phone": "081234567890",
  "nik": "3271010101910001",
  "avatar": "https://cdn.example.com/avatar.jpg",
  "position": "Software Engineer",
  "isOnboarded": true,
  "lastActiveAt": "2026-05-21T10:00:00.000Z",
  "createdAt": "2026-05-01T08:00:00.000Z",
  "updatedAt": "2026-05-21T10:00:00.000Z"
}
```

**Error Responses**

| Status | Reason |
|--------|--------|
| `401 Unauthorized` | Token missing or invalid |
| `404 Not Found` | User not found |

---

### Update My Profile

```
PATCH /users/me
```

Update the profile of the currently authenticated user. All fields are optional.

**Headers**

```http
Authorization: Bearer <access_token>
```

**Request Body** _(all fields optional)_

```json
{
  "email": "newemail@example.com",
  "name": "John Updated",
  "username": "john_updated",
  "company": "PT. Baru",
  "phone": "089999999999",
  "nik": "3271010101910001",
  "avatar": "https://cdn.example.com/new-avatar.jpg",
  "position": "Tech Lead"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | `string` | ❌ | Valid email format |
| `name` | `string` | ❌ | String |
| `username` | `string` | ❌ | String |
| `company` | `string` | ❌ | String |
| `phone` | `string` | ❌ | String |
| `nik` | `string` | ❌ | String |
| `avatar` | `string` | ❌ | String (URL) |
| `position` | `string` | ❌ | String |

**Response `200 OK`**

Returns the updated user profile (same structure as `GET /users/me`).

**Error Responses**

| Status | Reason |
|--------|--------|
| `400 Bad Request` | Validation failed |
| `401 Unauthorized` | Token missing or invalid |
| `404 Not Found` | User not found |

---

## 🧭 Onboarding

### Submit Onboarding

```
POST /onboarding
```

Save onboarding data (references & interests) for the current user. Typically called once after registration.

**Headers**

```http
Authorization: Bearer <access_token>
```

**Request Body**

```json
{
  "references": ["teman", "media sosial", "iklan"],
  "interests": [
    {
      "category": "Teknologi",
      "sub_category": "Web Development"
    },
    {
      "category": "Bisnis",
      "sub_category": "Startup"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `references` | `string[]` | ✅ | Array of referral source strings |
| `interests` | `object[]` | ✅ | Array of interest objects |
| `interests[].category` | `string` | ✅ | Main interest category |
| `interests[].sub_category` | `string` | ✅ | Interest sub-category |

**Response `201 Created`**

```json
{
  "id": "550e8400-e29b-41d4-a716-000000000001",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "references": ["teman", "media sosial", "iklan"],
  "interests": [
    { "category": "Teknologi", "sub_category": "Web Development" },
    { "category": "Bisnis", "sub_category": "Startup" }
  ]
}
```

**Error Responses**

| Status | Reason |
|--------|--------|
| `400 Bad Request` | Interests is not a valid array of objects |
| `401 Unauthorized` | Token missing or invalid |

---

### Get My Onboarding

```
GET /onboarding/me
```

Returns the onboarding data of the current user.

**Headers**

```http
Authorization: Bearer <access_token>
```

**Response `200 OK`**

```json
{
  "id": "550e8400-e29b-41d4-a716-000000000001",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "references": ["teman", "media sosial"],
  "interests": [
    { "category": "Teknologi", "sub_category": "Web Development" }
  ]
}
```

> Returns `null` if user has not submitted onboarding data yet.

**Error Responses**

| Status | Reason |
|--------|--------|
| `401 Unauthorized` | Token missing or invalid |

---

## 💬 Conversation

### Create Conversation

```
POST /conversations
```

Create a new conversation. The creator is automatically added as **Admin**.

**Headers**

```http
Authorization: Bearer <access_token>
```

**Request Body**

```json
{
  "type": "group",
  "title": "Tim Project Alpha",
  "photoUrl": "https://cdn.example.com/group-photo.jpg"
}
```

| Field | Type | Required | Valid Values |
|-------|------|----------|--------------|
| `type` | `enum` | ✅ | `dm`, `group`, `project`, `document`, `doc_analyze`, `time_machine`, `knowledge` |
| `title` | `string` | ❌ | Any string |
| `photoUrl` | `string` | ❌ | URL string |

**Conversation Types**

| Type | Description |
|------|-------------|
| `dm` | Direct Message (1-on-1) |
| `group` | Group chat |
| `project` | Project-based chat |
| `document` | Document-based chat |
| `doc_analyze` | AI-powered document analysis |
| `time_machine` | Time machine feature |
| `knowledge` | Knowledge base chat |

**Response `201 Created`**

```json
{
  "id": "conv-uuid-xxx",
  "type": "group",
  "title": "Tim Project Alpha",
  "photoUrl": "https://cdn.example.com/group-photo.jpg",
  "aiPrompt": null,
  "knowledgePolicy": "llm",
  "knowledgeIds": [],
  "pinnedMessageId": null,
  "createdAt": "2026-05-21T10:00:00.000Z",
  "updatedAt": "2026-05-21T10:00:00.000Z",
  "members": [
    {
      "id": "member-uuid-xxx",
      "conversationId": "conv-uuid-xxx",
      "userId": "user-uuid-xxx",
      "role": "admin",
      "joinedAt": "2026-05-21T10:00:00.000Z",
      "isMuted": false,
      "isArchived": false
    }
  ]
}
```

**Error Responses**

| Status | Reason |
|--------|--------|
| `400 Bad Request` | Invalid `type` value |
| `401 Unauthorized` | Token missing or invalid |

---

### List My Conversations

```
GET /conversations
```

Returns all conversations the current user is a member of.

**Headers**

```http
Authorization: Bearer <access_token>
```

**Response `200 OK`**

```json
[
  {
    "id": "conv-uuid-xxx",
    "type": "group",
    "title": "Tim Project Alpha",
    "photoUrl": null,
    "aiPrompt": null,
    "knowledgePolicy": "llm",
    "knowledgeIds": [],
    "pinnedMessageId": null,
    "createdAt": "2026-05-21T10:00:00.000Z",
    "updatedAt": "2026-05-21T10:00:00.000Z",
    "members": [
      {
        "id": "member-uuid-xxx",
        "conversationId": "conv-uuid-xxx",
        "userId": "user-uuid-xxx",
        "role": "admin",
        "joinedAt": "2026-05-21T10:00:00.000Z",
        "isMuted": false,
        "isArchived": false
      }
    ]
  }
]
```

> Returns `[]` if the user has not joined any conversation.

---

### Get Conversation Detail

```
GET /conversations/:id
```

Returns the detail of a specific conversation including its members.

**Headers**

```http
Authorization: Bearer <access_token>
```

**Path Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | `string (UUID)` | Conversation ID |

**Response `200 OK`**

Same structure as a single item from `GET /conversations`.

**Error Responses**

| Status | Reason |
|--------|--------|
| `401 Unauthorized` | Token missing or invalid |
| `404 Not Found` | Conversation not found |

---

### Add Member to Conversation

```
POST /conversations/:id/members
```

Add a user to an existing conversation. Idempotent — if the user is already a member, the existing record is returned without error.

**Headers**

```http
Authorization: Bearer <access_token>
```

**Path Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | `string (UUID)` | Conversation ID |

**Request Body**

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "role": "member"
}
```

| Field | Type | Required | Valid Values |
|-------|------|----------|--------------|
| `userId` | `string` | ✅ | UUID of the user to add |
| `role` | `enum` | ✅ | `admin`, `member` |

**Response `201 Created`**

```json
{
  "id": "member-uuid-xxx",
  "conversationId": "conv-uuid-xxx",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "role": "member",
  "joinedAt": "2026-05-21T10:00:00.000Z",
  "pinnedAt": null,
  "isMuted": false,
  "isArchived": false
}
```

**Error Responses**

| Status | Reason |
|--------|--------|
| `400 Bad Request` | Invalid `role` value |
| `401 Unauthorized` | Token missing or invalid |
| `404 Not Found` | Conversation not found |

---

## 📅 Agenda

### Create Agenda

```
POST /agendas
```

Create a new agenda for the current user.

**Headers**

```http
Authorization: Bearer <access_token>
```

**Request Body**

```json
{
  "title": "Sprint Review Meeting",
  "description": "Review sprint 3 with product team",
  "startAt": "2026-05-25T09:00:00.000Z",
  "endAt": "2026-05-25T10:00:00.000Z",
  "location": "Meeting Room 3A",
  "isAllDay": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | ✅ | Agenda title |
| `description` | `string` | ❌ | Agenda description |
| `startAt` | `string` (ISO 8601) | ✅ | Start time, e.g. `2026-05-25T09:00:00.000Z` |
| `endAt` | `string` (ISO 8601) | ✅ | End time |
| `location` | `string` | ❌ | Location |
| `isAllDay` | `boolean` | ✅ | `true` if this is an all-day event |

**Response `201 Created`**

```json
{
  "id": "agenda-uuid-xxx",
  "userId": "user-uuid-xxx",
  "title": "Sprint Review Meeting",
  "description": "Review sprint 3 with product team",
  "startAt": "2026-05-25T09:00:00.000Z",
  "endAt": "2026-05-25T10:00:00.000Z",
  "location": "Meeting Room 3A",
  "isAllDay": false,
  "createdAt": "2026-05-21T10:00:00.000Z",
  "updatedAt": "2026-05-21T10:00:00.000Z"
}
```

**Error Responses**

| Status | Reason |
|--------|--------|
| `400 Bad Request` | `startAt`/`endAt` is not ISO 8601, or `isAllDay` is not boolean |
| `401 Unauthorized` | Token missing or invalid |

---

### List My Agendas

```
GET /agendas
```

Returns all agendas belonging to the current user.

**Headers**

```http
Authorization: Bearer <access_token>
```

**Response `200 OK`**

```json
[
  {
    "id": "agenda-uuid-xxx",
    "userId": "user-uuid-xxx",
    "title": "Sprint Review Meeting",
    "description": "Review sprint 3",
    "startAt": "2026-05-25T09:00:00.000Z",
    "endAt": "2026-05-25T10:00:00.000Z",
    "location": "Meeting Room 3A",
    "isAllDay": false,
    "createdAt": "2026-05-21T10:00:00.000Z",
    "updatedAt": "2026-05-21T10:00:00.000Z"
  }
]
```

---

### Get Agenda Detail

```
GET /agendas/:id
```

Returns a specific agenda owned by the current user.

**Headers**

```http
Authorization: Bearer <access_token>
```

**Path Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | `string (UUID)` | Agenda ID |

**Response `200 OK`**

Same structure as a single item from `GET /agendas`.

**Error Responses**

| Status | Reason |
|--------|--------|
| `401 Unauthorized` | Token missing or invalid |
| `404 Not Found` | Agenda not found or does not belong to the user |

---

### Update Agenda

```
PATCH /agendas/:id
```

Update an existing agenda. All fields are optional.

**Headers**

```http
Authorization: Bearer <access_token>
```

**Path Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | `string (UUID)` | Agenda ID |

**Request Body** _(all fields optional)_

```json
{
  "title": "Sprint Review Meeting - Updated",
  "description": "Updated description",
  "startAt": "2026-05-25T10:00:00.000Z",
  "endAt": "2026-05-25T11:00:00.000Z",
  "location": "Online via Zoom",
  "isAllDay": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | ❌ | New title |
| `description` | `string` | ❌ | New description |
| `startAt` | `string` (ISO 8601) | ❌ | New start time |
| `endAt` | `string` (ISO 8601) | ❌ | New end time |
| `location` | `string` | ❌ | New location |
| `isAllDay` | `boolean` | ❌ | All-day flag |

**Response `200 OK`**

Returns the updated agenda (same structure as `GET /agendas/:id`).

**Error Responses**

| Status | Reason |
|--------|--------|
| `400 Bad Request` | Invalid date format or validation error |
| `401 Unauthorized` | Token missing or invalid |
| `404 Not Found` | Agenda not found or does not belong to the user |

---

## 📐 Data Models

### User

```typescript
{
  id:           string    // UUID, Primary Key
  email:        string    // Unique, stored lowercase
  name:         string
  username:     string    // Unique
  company:      string | null
  phone:        string | null
  nik:          string | null
  avatar:       string | null
  position:     string | null
  isOnboarded:  boolean
  lastActiveAt: Date
  createdAt:    Date
  updatedAt:    Date
}
```

### UserOnboarding

```typescript
{
  id:         string    // UUID, Primary Key
  userId:     string    // FK → users.id
  references: string[]
  interests:  { category: string; sub_category: string }[]
}
```

### Conversation

```typescript
{
  id:               string    // UUID, Primary Key
  type:             'dm' | 'group' | 'project' | 'document'
                    | 'doc_analyze' | 'time_machine' | 'knowledge'
  title:            string | null
  photoUrl:         string | null
  aiPrompt:         string | null
  knowledgePolicy:  string           // default: 'llm'
  knowledgeIds:     string[]
  pinnedMessageId:  string | null
  createdAt:        Date
  updatedAt:        Date
  members:          ConversationMember[]
}
```

### ConversationMember

```typescript
{
  id:               string    // UUID, Primary Key
  conversationId:   string    // FK → conversations.id
  userId:           string    // FK → users.id
  role:             'admin' | 'member'
  joinedAt:         Date
  pinnedAt:         Date | null
  isMuted:          boolean
  isArchived:       boolean
}
```

### Agenda

```typescript
{
  id:          string    // UUID, Primary Key
  userId:      string    // FK → users.id
  title:       string
  description: string | null
  startAt:     Date      // timestamptz
  endAt:       Date      // timestamptz
  location:    string | null
  isAllDay:    boolean
  createdAt:   Date
  updatedAt:   Date
}
```

---

## ⚡ Integration Flow Examples

### Registration & Onboarding Flow

```
1.  POST  /auth/register          → Register a new account
2.  POST  /auth/login             → Login, save the accessToken
3.  POST  /onboarding             → Submit onboarding data (requires Bearer token)
4.  GET   /users/me               → Check profile and isOnboarded status
```

### Agenda Management Flow

```
1.  POST  /auth/login             → Get accessToken
2.  POST  /agendas                → Create a new agenda
3.  GET   /agendas                → List all agendas
4.  PATCH /agendas/:id            → Update a specific agenda
5.  GET   /agendas/:id            → Get agenda detail
```

### Group Conversation Flow

```
1.  POST  /auth/login                     → Get accessToken
2.  POST  /conversations                  → Create a group conversation (type: "group")
3.  POST  /conversations/:id/members      → Add members (role: "member")
4.  GET   /conversations                  → List all my conversations
5.  GET   /conversations/:id              → Get conversation detail + members
```

---

## ❌ Error Response Format

NestJS returns standard error objects:

**Validation Error (400)**
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

**Single Message Error**
```json
{
  "statusCode": 409,
  "message": "Email already registered",
  "error": "Conflict"
}
```

**Unauthorized**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Not Found**
```json
{
  "statusCode": 404,
  "message": "Agenda not found",
  "error": "Not Found"
}
```

---

## 🔧 Environment Variables

```env
# Runtime
PORT=4000
NODE_ENV=development

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=scheduler
DB_SYNCHRONIZE=true

# Auth
JWT_SECRET=your-jwt-secret

# API Docs
SWAGGER_USER=admin
SWAGGER_PASSWORD=admin

# Object Storage (MinIO)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_BUCKET_PUBLIC=tetangga
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=minio123

# Cache & Messaging
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672
KAFKA_BROKERS=localhost:9092
```

---

## 📝 Important Notes

- All request bodies containing **undeclared fields** will be **rejected** (`forbidNonWhitelisted: true`)
- The `password` field is **never returned** in any response
- Agendas are **private per user** — users can only access their own agendas
- `POST /conversations/:id/members` is **idempotent** — adding an existing member returns the existing record without error
- Date fields (`startAt`, `endAt`) must be in **ISO 8601** format, e.g. `2026-05-25T09:00:00.000Z`
- Use **Swagger UI** at `http://localhost:4000/docs` to try all endpoints interactively using the `Authorize` button with your Bearer token
