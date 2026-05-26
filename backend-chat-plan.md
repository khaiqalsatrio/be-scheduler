# Rencana Implementasi Sistem Chat Backend (be-scheduler)

Dokumen ini merinci langkah-langkah dan struktur yang harus diimplementasikan pada *backend* (NestJS) agar terintegrasi penuh dengan *frontend* (Aplikasi Mobile) yang sudah ada.

## 1. Pembuatan Message Module (`src/modules/message`)

Saat ini *backend* belum memiliki *controller* dan *service* untuk menangani perpesanan. Kamu perlu membuat modul baru dengan perintah:
```bash
nest g module modules/message
nest g controller modules/message
nest g service modules/message
```

### Entity yang Dibutuhkan (`message.entity.ts`)
Tabel `messages` minimal harus menyimpan relasi ke `conversation_id`, `sender_id`, serta isi pesan, status, dan *meta* (untuk menyimpan info *file/attachment*).
- `id` (UUID)
- `conversation_id` (UUID, Relasi ke tabel Conversations)
- `sender_id` (UUID, Relasi ke tabel Users)
- `type` (Enum: 'text', 'image', 'video', 'file', 'voice')
- `content` (String / Text)
- `status` (Enum: 'sent', 'delivered', 'read')
- `is_pinned` (Boolean, default: false)
- `is_edited` (Boolean, default: false)
- `deleted_at` (Timestamp, nullable - *soft delete*)
- `meta` (JSONB, nullable - untuk menyimpan objek *file* atau URL dokumen)
- `reply_to_message_id` (UUID, nullable - Relasi ke diri sendiri)
- `created_at` / `updated_at` (Timestamp)

### REST API Endpoints yang Dibutuhkan (`message.controller.ts`)

| HTTP Method | Endpoint | Kegunaan |
|-------------|----------|----------|
| `GET` | `/messages/:conversationId` | Mengambil riwayat pesan untuk ruang *chat* tertentu. Harus mendukung *pagination* menggunakan parameter `limit` dan `cursor`. |
| `POST` | `/messages` | Mengirim pesan baru. Harus mendukung format `multipart/form-data` melalui `FileInterceptor` jika *frontend* mengirim *file attachment*, serta membaca `body` untuk teks dan info tipe. |
| `PUT` | `/messages/read` | Menandai semua pesan dalam suatu `conversationId` menjadi berstatus `read` untuk pengguna yang sedang *login*. |
| `PUT` | `/messages/:messageId` | Mengedit/memperbarui isi teks pesan. |
| `DELETE` | `/messages/:messageId` | Menghapus pesan secara lokal (atau *soft delete*). |
| `PUT` | `/messages/:messageId/pin` | Melakukan *pin* atau *unpin* pada pesan tertentu. |
| `POST` | `/messages/:messageId/reactions` | Menambahkan atau mengubah reaksi (emoji) pada pesan. |
| `GET` | `/messages/search/global` | Mencari pesan di semua percakapan berdasarkan parameter *query* `?q=...`. |
| `GET` | `/messages/search/:conversationId` | Mencari pesan pada percakapan tertentu berdasarkan parameter *query* `?q=...`. |

---

## 2. Pembuatan Chat WebSocket Gateway (`src/modules/chat/chat.gateway.ts`)

Untuk komunikasi *real-time*, kamu harus membuat *gateway* berbasis Socket.io.
```bash
nest g gateway modules/chat
```

### Konfigurasi Gateway
- Harus membaca *token* JWT yang dikirim *frontend* saat koneksi melalui `auth: { token: 'Bearer ...' }` untuk mendapatkan `userId`.

### Event Listeners (Frontend -> Backend)
Gateway harus mendengarkan (`@SubscribeMessage()`) *event* berikut dari *client*:
1. `conversation.join` : *Client* masuk ke suatu ruang *chat* (gunakan `client.join(conversationId)`).
2. `conversation.leave` : *Client* keluar dari ruang *chat* (`client.leave(conversationId)`).
3. `message.delivered` : Sinyal bahwa pesan telah sampai ke HP penerima.
4. `message.read` : Sinyal bahwa pengguna sedang membaca *room chat* tersebut.
5. `conversation.mute` : Pengaturan untuk membisukan notifikasi ruang percakapan.
6. `message.delete` : Menghapus pesan dengan parameter `forEveryone: true`.

### Event Emitters (Backend -> Frontend)
Backend harus me-*broadcast* (*emit*) *event* berikut ke `conversationId` yang sesuai:
1. `message.new` : Mengirim objek pesan yang baru saja dibuat/disimpan ke *database*.
2. `message.delivered` : Memberi tahu pengirim bahwa pesannya sukses terkirim (*ceklis dua abu-abu*).
3. `message.read` : Memberi tahu pengirim bahwa pesannya telah dibaca (*ceklis dua biru/hijau*).
4. `message.updated` : Di-*trigger* ketika seseorang mengedit pesannya.
5. `message.pinned` : Di-*trigger* ketika seseorang menge-pin pesan.
6. `message.deleted` : Di-*trigger* ketika pesan dihapus.
7. `message.reaction` : Di-*trigger* ketika ada pengguna yang memberikan/mengubah reaksi emoji.
8. `ai.thinking` & `ai.thinking.stop` : Opsional, jika terhubung ke Tera AI saat AI sedang memproses balasan.

## Urutan Pengerjaan yang Disarankan
1. Buat **Message Entity** dan pastikan migrasi tabel *database* berhasil.
2. Buat endpoint **`GET /messages/:conversationId`** dan **`POST /messages`**. Pastikan struktur *response* cocok dengan yang diharapkan *frontend*.
3. Implementasikan **WebSocket Gateway** untuk menangani *event* `message.new` (agar *chat* muncul secara *real-time*).
4. Buat endpoint pelengkap seperti *Read*, *Edit*, *Pin*, dan *React*.
5. Uji fungsionalitas keseluruhan dari aplikasi *mobile*.
