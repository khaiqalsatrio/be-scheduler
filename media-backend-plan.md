# Backend Development Plan for `media.tsx`

Berdasarkan analisis file UI `app/(tabs)/media.tsx`, halaman ini berfokus pada manajemen dokumen dan fitur asisten AI pintar (ChatAja Agent). Berikut adalah rencana kebutuhan backend yang harus disiapkan:

## 1. Skema Database (Entitas)

Kita membutuhkan entitas untuk menyimpan metadata dokumen yang diunggah.

**Tabel `Document` (atau `Media`)**
*   `id` (UUID / String) - Primary Key
*   `title` (String) - Nama dokumen (contoh: `Workshop_day1_AICOE`)
*   `file_url` (String) - URL lokasi penyimpanan file (misalnya di S3 / Cloud Storage)
*   `file_size` (Integer) - Ukuran file dalam bytes (untuk menampilkan info `2MB`)
*   `file_type` (String) - Tipe file (contoh: `application/pdf`)
*   `modified_by` (String/UUID) - Relasi ke tabel User yang terakhir memodifikasi
*   `location` (String) - Lokasi modifikasi (contoh: `Olah Rasio Room`)
*   `created_at` (Timestamp)
*   `updated_at` (Timestamp)

## 2. Kebutuhan API Endpoints

### A. Document Management
*   **`GET /api/documents`**
    *   **Deskripsi**: Mengambil daftar dokumen untuk ditampilkan pada list `documents`.
    *   **Response**: Array of Document objects (id, title, size, info teks, dll).
*   **`POST /api/documents/upload`**
    *   **Deskripsi**: Mengunggah dokumen baru (PDF, dll).
    *   **Payload**: `multipart/form-data` berisi file.
    *   **Proses**: Menyimpan file ke Object Storage (S3/GCS), mengekstrak metadata, lalu menyimpan record ke database.
*   **`DELETE /api/documents/:id`**
    *   **Deskripsi**: Menghapus dokumen (ketika user memilih opsi delete dari icon `MoreVertical`).

### B. AI Agent & Search (Ask ChatAja Agent)
*   **`POST /api/agent/chat`** (atau `/api/agent/ask`)
    *   **Deskripsi**: Endpoint untuk interaksi tanya jawab dengan AI Agent melalui search bar / chat.
    *   **Payload**: `{ "query": "Tolong cari dokumen tentang..." }`
    *   **Response**: Teks jawaban dari AI dan/atau referensi dokumen terkait (RAG - Retrieval-Augmented Generation).

### C. AI Document Generation (Buat Dokumen)
Bagian "Action Section" membutuhkan endpoint untuk men-generate dokumen spesifik menggunakan AI.
*   **`POST /api/documents/generate/recap`**
    *   **Deskripsi**: Membuat "Rekap presentasi narasumber" dari file audio/video/dokumen tertentu.
*   **`POST /api/documents/generate/report`**
    *   **Deskripsi**: Membuat "Laporan kegiatan" berdasarkan data/konteks yang diberikan.
*   **`POST /api/documents/generate/mom`**
    *   **Deskripsi**: Membuat "Minutes of Meeting (MoM) diskusi" dari rekaman atau transkrip.
    *   **Payload (Umum untuk ketiganya)**: `{ "source_document_ids": ["id1", "id2"], "context": "..." }`
    *   **Response**: Teks hasil generate AI atau URL dokumen PDF/Word yang baru dibuat.

## 3. Integrasi Layanan Pihak Ketiga (Third-Party Services)

*   **Cloud Object Storage**: AWS S3, Google Cloud Storage, atau MinIO (jika on-premise) untuk menyimpan file PDF atau dokumen yang diunggah.
*   **AI / LLM Provider**: OpenAI API (GPT-4), Google Gemini, atau LLM lokal (jika ada kebijakan privasi ketat) untuk memproses fitur:
    *   Ask ChatAja Agent.
    *   Pembuatan Dokumen Otomatis (Rekap, Laporan, MoM).
    *   *Catatan: Dibutuhkan arsitektur RAG (Retrieval-Augmented Generation) dan Vector Database (seperti Pinecone, Weaviate, atau pgvector) jika AI Agent perlu membaca isi dokumen-dokumen yang ada di server.*

## 4. Langkah Implementasi (Saran)

1.  **Tahap 1 (CRUD Dokumen Dasar)**: Siapkan Cloud Storage, buat tabel `Document`, dan selesaikan API untuk Upload serta Fetch (GET) dokumen. Hubungkan frontend agar list dokumen dinamis.
2.  **Tahap 2 (Prompt Engineering & AI Generation)**: Hubungkan backend dengan LLM provider. Buat prompt khusus untuk memproses fitur "Buat Dokumen" (MoM, Laporan, Rekap).
3.  **Tahap 3 (RAG & Agent)**: Implementasikan text-extraction (membaca teks dari PDF), buat embedding, simpan ke Vector DB, lalu buat endpoint `/api/agent/ask` agar user bisa bertanya terkait isi dokumen mereka.
