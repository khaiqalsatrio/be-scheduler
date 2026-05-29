# Rencana Implementasi: Auto-Create & Auto-Join Channel Berdasarkan Minat

Dokumen ini berisi rencana implementasi untuk fitur pembuatan *channel* otomatis dan penggabungan (*auto-join*) pengguna baru ke dalam *channel* komunitas yang sesuai dengan minat (*interests*) mereka setelah menyelesaikan proses *Onboarding*.

## 1. Tujuan
Meningkatkan interaksi pengguna baru dengan cara otomatis memasukkan mereka ke dalam ruang obrolan (*channel*) dengan pengguna lain yang memiliki frekuensi/minat yang sama.

## 2. Lokasi Perubahan Logika Utama
Perubahan utama akan terjadi pada sistem *Backend* (`be-scheduler`), khususnya pada modul **Onboarding** (`src/modules/onboarding/onboarding.service.ts`) dan interaksinya dengan modul **Conversation / Channel**.

*   **Trigger:** Saat pengguna memanggil endpoint `POST /onboarding` (ketika submit profil pada langkah terakhir Onboarding).

## 3. Alur Algoritma (Step-by-Step)

Ketika fungsi `createOnboarding` di dalam `OnboardingService` dipanggil, setelah data `UserOnboarding` berhasil disimpan ke database, sistem akan menjalankan langkah-langkah berikut:

### Langkah A: Ekstraksi Data Minat
Sistem akan membaca properti `interests` (JSON array) dari payload yang dikirimkan.
*   *Contoh:* Ambil indeks pertama dari array minat sebagai kategori utama. `const primaryCategory = dto.interests[0].category;` (misal: "Olah Raga").

### Langkah B: Cek Ketersediaan Channel
Sistem akan mencari di database `conversations` apakah *Channel* untuk kategori ini sudah ada.
*   **Kriteria Pencarian:** `type = 'channel'` DAN `category = primaryCategory`.

### Langkah C: Eksekusi (Pembuatan / Penggabungan)
*   **Skenario 1: Channel Belum Ada**
    1. Buat entitas `Conversation` baru.
    2. Set `type` menjadi `ConversationType.CHANNEL`.
    3. Set `title` secara dinamis, contoh: `"Komunitas " + primaryCategory` (Hasil: "Komunitas Olah Raga").
    4. Set `category` sesuai kategori pembuatnya.
    5. Masukkan *User* tersebut ke `conversation_members` di channel baru tersebut (bisa dengan peran `ADMIN` atau `MEMBER`).
*   **Skenario 2: Channel Sudah Ada**
    1. Ambil `id` dari *channel* yang ditemukan pada Langkah B.
    2. Langsung buat entitas `ConversationMember` baru untuk *User* tersebut dengan referensi `conversationId` dari channel yang sudah ada (mendaftarkannya sebagai member).

## 4. Penyesuaian Antar Modul (Dependency Injection)
Karena logika ini dieksekusi di `OnboardingService` namun memanipulasi data `Conversation`, kita perlu:
1. Mengimpor/meng-inject `ConversationService` atau `ChannelService` ke dalam `OnboardingService`.
2. Atau, menggunakan pendekatan *Event-Driven* (misal menggunakan `@nestjs/event-emitter`) dengan memancarkan event `onboarding.completed`. Modul channel akan *listen* (mendengarkan) event ini dan menjalankan logika auto-join secara otomatis (pendekatan ini **sangat disarankan** karena lebih bersih dan tidak membebani respon API).

## 5. Pertimbangan & Optimasi Lanjutan
*   **Proses Asinkron (*Non-blocking*):** Pembentukan channel sebaiknya tidak memblokir / memperlama *response time* dari request `/onboarding`. Gunakan fungsi `async` yang tidak perlu di-`await` langsung oleh controller, atau gunakan *Event Emitter*.
*   **Batas Kapasitas (*Channel Limit*):** Di masa depan, jika member dalam satu channel melebihi batas tertentu (misal 100 orang), pencarian di Langkah B harus memfilter channel yang belum penuh, dan jika semua penuh, buat channel baru (misal: "Komunitas Olah Raga #2").

---
**Status**: Siap untuk dieksekusi.
