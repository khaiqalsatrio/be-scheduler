# API Dokumentasi: Conversation (Percakapan)

Semua endpoint di bawah ini dilindungi dengan **JWT Authentication** (`@UseGuards(JwtAuthGuard)`).
Header wajib pada setiap permintaan:
```http
Authorization: Bearer <token_jwt>
```

Base URL: `/conversations`

---

## 1. Membuat Percakapan Baru
Membuat percakapan baru (biasanya grup).

**Endpoint:**
`POST /conversations`

**Body Params (`CreateConversationDto`):**
```json
{
  "type": "group",
  "title": "Judul Grup (Opsional)",
  "photoUrl": "URL_FOTO (Opsional)"
}
```

**Response:**
Mengembalikan objek `Conversation` yang baru dibuat.

---

## 2. Membuat atau Mendapatkan Direct Message (DM)
Mendapatkan percakapan DM yang sudah ada dengan user lain, atau membuat DM baru jika belum ada.

**Endpoint:**
`POST /conversations/dm`

**Body Params:**
```json
{
  "targetUserId": "string" // ID user tujuan
}
```

**Response:**
Mengembalikan objek `Conversation` bertipe DM.

---

## 3. Mendapatkan Daftar Percakapan
Mengambil semua percakapan yang dimiliki oleh user yang sedang login.

**Endpoint:**
`GET /conversations`

**Query Params:**
- `type` (Opsional): Filter tipe percakapan (`dm` atau `group`)

**Response:**
Mengembalikan array of objects. Setiap percakapan memiliki detail seperti `unread_count`, `last_message`, `is_muted`, `is_archived`, dsb.

---

## 4. Mendapatkan Detail Percakapan
Mendapatkan informasi detail suatu percakapan berdasarkan ID-nya.

**Endpoint:**
`GET /conversations/:id`

**Path Params:**
- `id`: ID percakapan

**Response:**
Mengembalikan objek detail `Conversation` beserta anggota (`members`).

---

## 5. Mendapatkan Daftar Anggota Percakapan
Mengambil daftar anggota yang ada di dalam sebuah percakapan.

**Endpoint:**
`GET /conversations/:id/members`

**Path Params:**
- `id`: ID percakapan

**Response:**
Mengembalikan array of `ConversationMember`.

---

## 6. Menambahkan Anggota ke Percakapan
Menambahkan seorang user ke dalam percakapan (grup).

**Endpoint:**
`POST /conversations/:id/members`

**Path Params:**
- `id`: ID percakapan

**Body Params (`AddMemberDto`):**
```json
{
  "userId": "string",
  "role": "member" // atau "admin"
}
```

**Response:**
Mengembalikan objek `ConversationMember` yang baru ditambahkan.

---

## 7. Arsipkan / Batal Arsipkan Percakapan
Mengubah status pengarsipan (archive) untuk percakapan milik user yang sedang login.

**Endpoint:**
`PUT /conversations/:id/archive`

**Path Params:**
- `id`: ID percakapan

**Body Params:**
```json
{
  "isArchived": true // true untuk arsipkan, false untuk batalkan arsip
}
```

**Response:**
Mengembalikan objek `ConversationMember` yang telah diperbarui statusnya.
