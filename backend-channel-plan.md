# Backend Implementation Plan: Interest-Based Channels

Dokumen ini merangkum rencana perbaikan dan penambahan fitur pada backend (`be-scheduler`) untuk merealisasikan fitur "Channel Berdasarkan Minat (Interests)" sesuai dengan alur *Onboarding* pengguna.

## 1. Pembaruan Skema Database (Database Migration)

Saat ini, *channels* dan *direct messages* (DM) tampaknya tercampur dalam satu entitas (kemungkinan `Conversation`). Kita perlu membedakannya dan menambahkan relasi dengan minat pengguna.

### A. Modifikasi Entitas User (User Entity)
*   **Tujuan**: Menyimpan pilihan minat (interests) pengguna yang dipilih saat proses Onboarding (Langkah ke-4: `InterestStep`).
*   **Aksi**: 
    *   Tambahkan kolom `interests` (berupa array of strings atau JSON) di tabel `User`.
    *   *Atau*, buat tabel relasi `UserInterests` jika menggunakan pendekatan *Many-to-Many* dengan tabel `Interests`.

### B. Modifikasi Entitas Conversation / Channel (Conversation Entity)
*   **Tujuan**: Memisahkan mana yang murni *Direct Message* (Chat Pribadi) dan mana yang merupakan *Channel* (Ruang Diskusi Komunitas).
*   **Aksi**:
    *   Pastikan ada kolom `type` dengan nilai enum seperti `'dm'` dan `'channel'`.
    *   Tambahkan kolom `category` atau `tags` pada tipe `'channel'` untuk menyimpan topik/kategori channel (misal: "Teknologi", "Olahraga", "Musik").

## 2. Pembuatan & Modifikasi Endpoint API

### A. Endpoint Onboarding / Minat
*   **Endpoint**: `PUT /users/interests` atau `POST /users/onboarding`
*   **Fungsi**: Menerima payload dari frontend ketika pengguna selesai memilih minat di `InterestStep`, lalu menyimpannya ke database.
*   **Payload Contoh**: `{ "interests": ["technology", "design", "business"] }`

### B. Endpoint Get Channels (Terfilter)
*   **Endpoint**: `GET /channels` (atau modifikasi `GET /conversations?type=channel`)
*   **Fungsi**: Hanya mengembalikan daftar percakapan yang bertipe `'channel'`. Saat ini frontend (di `ChannelService.ts`) memanggil `/conversations` yang juga me-return `'dm'`. Ini harus dipisahkan agar chat DM (seperti `# doni don`) tidak muncul di tab Channel.

### C. Endpoint Rekomendasi Channel
*   **Endpoint**: `GET /channels/recommended`
*   **Fungsi**: 
    1. Mengambil data `interests` dari *Current User* yang sedang login.
    2. Mencari di tabel `Channel / Conversation` yang mana `category` atau `tags`-nya cocok dengan minat pengguna tersebut.
    3. Memfilter agar *TIDAK* menampilkan channel yang sudah di-*join* oleh pengguna.
*   **Response**: Array of channel objects yang sesuai format `ChannelApiResponse` di frontend.

### D. Endpoint Join Channel
*   **Endpoint**: `POST /channels/:id/join`
*   **Fungsi**: Memungkinkan pengguna untuk bergabung (menjadi member) ke dalam sebuah channel yang direkomendasikan. Ini akan menambahkan user ID ke dalam daftar `members` dari `Conversation` tersebut.

## 3. Penyesuaian di Sisi Frontend (Setelah Backend Selesai)

Jika backend sudah diimplementasikan sesuai rencana di atas, frontend (`scheduler-main`) hanya perlu:
1. Memastikan fungsi penyimpanan `handleSaveInterests` di `OnboardingContext.tsx` menembak endpoint `PUT /users/interests`.
2. Menghapus data *mock* pada fungsi `getRecommendedChannels` di `ChannelService.ts` dan menggantinya dengan panggilan axios ke `apiClient.get('/channels/recommended')`.
3. Mengubah `apiClient.get('/conversations')` di fungsi `getChannels` menjadi endpoint khusus channel (misal `/channels` atau `/conversations?type=channel`) agar DM tidak bercampur.

---
**Status**: Selesai diimplementasikan.
