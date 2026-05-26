# Be Scheduler API Documentation

This documentation describes the backend API for the Be Scheduler project, including authentication, user profile, onboarding, agendas, and conversations.

> Swagger is also enabled in `src/main.ts` at runtime under `/docs`.

## Base URL

- Local development: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/docs`

---

## Authentication

### Register new user

- Method: `POST`
- Endpoint: `/auth/register`
- Description: Create a new user account.
- Request body:
  ```json
  {
    "email": "user@example.com",
    "name": "John Doe",
    "username": "johndoe",
    "password": "secret123"
  }
  ```
- Response body (201):
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "username": "johndoe",
    "company": null,
    "phone": null,
    "nik": null,
    "avatar": null,
    "position": null,
    "lastActiveAt": "2026-05-22T00:00:00.000Z",
    "isOnboarded": false,
    "createdAt": "2026-05-22T00:00:00.000Z",
    "updatedAt": "2026-05-22T00:00:00.000Z"
  }
  ```

### Login

- Method: `POST`
- Endpoint: `/auth/login`
- Description: Authenticate a user and return a JWT access token.
- Request body:
  ```json
  {
    "email": "user@example.com",
    "password": "secret123"
  }
  ```
- Response body (200):
  ```json
  {
    "accessToken": "<jwt-token>"
  }
  ```

### Notes

- All protected routes require the header:
  - `Authorization: Bearer <accessToken>`
- The backend uses JWT authentication via `JwtAuthGuard`.

---

## Users

### Get current user profile

- Method: `GET`
- Endpoint: `/users/me`
- Description: Return the authenticated user's profile.
- Headers:
  - `Authorization: Bearer <accessToken>`
- Response body (200):
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "username": "johndoe",
    "company": "Acme Corp",
    "phone": "+621234567890",
    "nik": "1234567890",
    "avatar": "https://example.com/avatar.png",
    "position": "Product Manager",
    "lastActiveAt": "2026-05-22T00:00:00.000Z",
    "isOnboarded": true,
    "createdAt": "2026-05-22T00:00:00.000Z",
    "updatedAt": "2026-05-22T00:00:00.000Z"
  }
  ```

### Get all users

- Method: `GET`
- Endpoint: `/users`
- Description: Retrieve all users except the authenticated user. Useful for finding users to start a new chat with.
- Headers:
  - `Authorization: Bearer <accessToken>`
- Response body (200):
  ```json
  [
    {
      "id": "uuid",
      "email": "other@example.com",
      "name": "Jane Doe",
      "username": "janedoe",
      "company": "Acme Corp",
      "phone": "+621234567890",
      "nik": "1234567890",
      "avatar": "https://example.com/avatar2.png",
      "position": "Designer",
      "lastActiveAt": "2026-05-22T00:00:00.000Z",
      "isOnboarded": true,
      "createdAt": "2026-05-22T00:00:00.000Z",
      "updatedAt": "2026-05-22T00:00:00.000Z"
    }
  ]
  ```

### Update current user profile

- Method: `PATCH`
- Endpoint: `/users/me`
- Description: Update the authenticated user's profile fields.
- Headers:
  - `Authorization: Bearer <accessToken>`
- Request body examples:
  ```json
  {
    "name": "John Doe",
    "company": "Acme Corp",
    "phone": "+621234567890",
    "avatar": "https://example.com/avatar.png",
    "position": "Product Manager"
  }
  ```
- Response body: updated user profile object (same shape as `/users/me`).

### Updatable fields

- `email` (string, email)
- `name` (string)
- `username` (string)
- `company` (string)
- `phone` (string)
- `nik` (string)
- `avatar` (string)
- `position` (string)

---

## Onboarding

### Submit onboarding data

- Method: `POST`
- Endpoint: `/onboarding`
- Description: Save user onboarding answers.
- Headers:
  - `Authorization: Bearer <accessToken>`
- Request body:
  ```json
  {
    "references": [
      "example reference 1",
      "example reference 2"
    ],
    "interests": [
      {
        "category": "mobile",
        "sub_category": "android"
      },
      {
        "category": "web",
        "sub_category": "frontend"
      }
    ]
  }
  ```
- Response body: created onboarding record.

### Get my onboarding data

- Method: `GET`
- Endpoint: `/onboarding/me`
- Description: Retrieve onboarding data for the authenticated user.
- Headers:
  - `Authorization: Bearer <accessToken>`
- Response body (200):
  ```json
  {
    "id": "uuid",
    "userId": "uuid",
    "references": [
      "example reference 1",
      "example reference 2"
    ],
    "interests": [
      {
        "category": "mobile",
        "sub_category": "android"
      }
    ]
  }
  ```

---

## Agendas

### Create agenda item

- Method: `POST`
- Endpoint: `/agendas`
- Description: Create a new agenda item for the authenticated user.
- Headers:
  - `Authorization: Bearer <accessToken>`
- Request body:
  ```json
  {
    "title": "Sprint planning",
    "description": "Discuss roadmap and deliverables",
    "startAt": "2026-06-01T09:00:00.000Z",
    "endAt": "2026-06-01T10:00:00.000Z",
    "location": "Zoom",
    "isAllDay": false
  }
  ```
- Response body (201):
  ```json
  {
    "id": "uuid",
    "userId": "uuid",
    "title": "Sprint planning",
    "description": "Discuss roadmap and deliverables",
    "startAt": "2026-06-01T09:00:00.000Z",
    "endAt": "2026-06-01T10:00:00.000Z",
    "location": "Zoom",
    "isAllDay": false,
    "createdAt": "2026-05-22T00:00:00.000Z",
    "updatedAt": "2026-05-22T00:00:00.000Z"
  }
  ```

### List agendas

- Method: `GET`
- Endpoint: `/agendas`
- Description: List all agenda items owned by the authenticated user.
- Headers:
  - `Authorization: Bearer <accessToken>`
- Response body: array of agenda items.

### Get single agenda

- Method: `GET`
- Endpoint: `/agendas/:id`
- Description: Retrieve a specific agenda item by ID for the authenticated user.
- Headers:
  - `Authorization: Bearer <accessToken>`
- Response body: agenda item object.

### Update agenda item

- Method: `PATCH`
- Endpoint: `/agendas/:id`
- Description: Update an agenda item owned by the authenticated user.
- Headers:
  - `Authorization: Bearer <accessToken>`
- Request body: any subset of the agenda fields below
  ```json
  {
    "title": "Updated meeting title",
    "description": "Updated description",
    "startAt": "2026-06-01T09:30:00.000Z",
    "endAt": "2026-06-01T10:30:00.000Z",
    "location": "Room 101",
    "isAllDay": false
  }
  ```
- Response body: updated agenda item.

---

## Conversations

### Create conversation

- Method: `POST`
- Endpoint: `/conversations`
- Description: Create a new conversation for the authenticated user.
- Headers:
  - `Authorization: Bearer <accessToken>`
- Request body:
  ```json
  {
    "type": "group",
    "title": "Design Review",
    "photoUrl": "https://example.com/group.png"
  }
  ```

- Response body (201):
  ```json
  {
    "id": "uuid",
    "type": "group",
    "title": "Design Review",
    "photoUrl": "https://example.com/group.png",
    "aiPrompt": null,
    "knowledgePolicy": null,
    "knowledgeIds": [],
    "pinnedMessageId": null,
    "createdAt": "2026-05-22T00:00:00.000Z",
    "updatedAt": "2026-05-22T00:00:00.000Z"
  }
  ```

### List conversations

- Method: `GET`
- Endpoint: `/conversations`
- Description: List conversations the authenticated user belongs to.
- Headers:
  - `Authorization: Bearer <accessToken>`
- Response body: array of conversation objects.

### Get conversation detail

- Method: `GET`
- Endpoint: `/conversations/:id`
- Description: Get a conversation by its ID.
- Headers:
  - `Authorization: Bearer <accessToken>`
- Response body: conversation object.

### Add member to conversation

- Method: `POST`
- Endpoint: `/conversations/:id/members`
- Description: Add a new member to an existing conversation.
- Headers:
  - `Authorization: Bearer <accessToken>`
- Request body:
  ```json
  {
    "userId": "uuid-of-new-member",
    "role": "member"
  }
  ```
- Response body: new conversation member record.

### Conversation type enum

Allowed values for `type`:
- `dm`
- `group`
- `project`
- `document`
- `doc_analyze`
- `time_machine`
- `knowledge`

### Member role enum

Allowed values for `role`:
- `admin`
- `member`

---

## Messages

### Global search

- Method: `GET`
- Endpoint: `/messages/search/global`
- Description: Search across all messages for the current user.
- Query parameters:
  - `q`: Search query string
- Headers:
  - `Authorization: Bearer <accessToken>`

### Search in conversation

- Method: `GET`
- Endpoint: `/messages/search/:conversationId`
- Description: Search for messages within a specific conversation.
- Query parameters:
  - `q`: Search query string
- Headers:
  - `Authorization: Bearer <accessToken>`

### List messages

- Method: `GET`
- Endpoint: `/messages/:conversationId`
- Description: Retrieve messages for a specific conversation with pagination.
- Query parameters:
  - `limit`: Number of messages to return (default: 20)
  - `cursor`: Cursor string for pagination
- Headers:
  - `Authorization: Bearer <accessToken>`

### Create message

- Method: `POST`
- Endpoint: `/messages`
- Description: Send a new message. Supports file uploads.
- Headers:
  - `Authorization: Bearer <accessToken>`
- Content-Type: `multipart/form-data` or `application/json`
- Request body / form data:
  - `content`: Message text (string)
  - `conversationId`: ID of the conversation (uuid)
  - `type`: Message type, e.g., 'text', 'file', 'image' (optional)
  - `file`: File attachment (optional)

### Mark as read

- Method: `PUT`
- Endpoint: `/messages/read`
- Description: Mark all messages in a conversation as read by the current user.
- Headers:
  - `Authorization: Bearer <accessToken>`
- Request body:
  ```json
  {
    "conversationId": "uuid"
  }
  ```

### Update message

- Method: `PUT`
- Endpoint: `/messages/:messageId`
- Description: Edit a message's content.
- Headers:
  - `Authorization: Bearer <accessToken>`
- Request body:
  ```json
  {
    "content": "Updated message text",
    "meta": {} 
  }
  ```

### Delete message

- Method: `DELETE`
- Endpoint: `/messages/:messageId`
- Description: Delete a message.
- Headers:
  - `Authorization: Bearer <accessToken>`

### Toggle pin

- Method: `PUT`
- Endpoint: `/messages/:messageId/pin`
- Description: Pin or unpin a message.
- Headers:
  - `Authorization: Bearer <accessToken>`

### React to message

- Method: `POST`
- Endpoint: `/messages/:messageId/reactions`
- Description: Add or toggle a reaction to a message.
- Headers:
  - `Authorization: Bearer <accessToken>`
- Request body:
  ```json
  {
    "reaction": "👍"
  }
  ```

---

## Shared validation notes

- `email`: must be a valid email address.
- `name`, `username`, `company`, `phone`, `nik`, `avatar`, `position`: strings.
- `password`: minimum 6 characters.
- `startAt`, `endAt`: ISO 8601 date-time string.
- `isAllDay`: boolean.
- `references`: array of strings.
- `interests`: array of `{ category: string, sub_category: string }`.

---

## Integration tips for Frontend

1. Authenticate first with `/auth/login`.
2. Store the returned `accessToken` securely (e.g. in memory or secure storage).
3. Send `Authorization: Bearer <accessToken>` on all protected requests.
4. Use `/users/me` to populate current user data.
5. Use `/onboarding/me` to determine whether onboarding data exists.
6. Use `/agendas` and `/conversations` for scheduling and chat flows.

---

## Swagger UI

When backend is running, open:

- `http://localhost:3000/docs`

Use Swagger for interactive endpoint exploration and example payloads.
