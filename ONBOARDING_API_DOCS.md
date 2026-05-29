# Onboarding & Auto-Channel API Documentation

Dokumentasi ini menjelaskan API yang digunakan untuk proses *Onboarding* pengguna baru, beserta efek samping otomatis (*side-effect*) berupa pembuatan dan penggabungan *channel* berdasarkan minat (*interests*).

---

## 1. Submit Onboarding Data (with Auto-Join Channel)

Menyimpan data profil pengguna baru (referensi dan minat) setelah menyelesaikan *flow onboarding* di Frontend. API ini secara otomatis di latar belakang akan mencari atau membuat *channel* (tipe: `channel`) berdasarkan `category` dari elemen pertama array `interests` yang dikirimkan, lalu memasukkan *user* ke dalamnya.

*   **URL:** `/onboarding`
*   **Method:** `POST`
*   **Auth Required:** Yes (Bearer Token)
*   **Headers:**
    *   `Authorization: Bearer <token>`
    *   `Content-Type: application/json`

### Request Body (JSON)

```json
{
  "references": ["Instagram", "Teman"],
  "interests": [
    {
      "category": "Olah Raga",
      "sub_category": "Sepak Bola"
    },
    {
      "category": "Teknologi",
      "sub_category": "Programming"
    }
  ]
}
```

*Keterangan Field:*
*   `references`: Array of string, referensi dari mana pengguna tahu aplikasi ini.
*   `interests`: Array of object. Harus minimal memiliki satu elemen. Elemen pertama (index 0) akan digunakan untuk *auto-join* channel.

### Success Response (201 Created)

```json
{
  "id": "uuid-onboarding-record",
  "userId": "uuid-user-id",
  "references": ["Instagram", "Teman"],
  "interests": [
    {
      "category": "Olah Raga",
      "sub_category": "Sepak Bola"
    },
    {
      "category": "Teknologi",
      "sub_category": "Programming"
    }
  ],
  "createdAt": "2026-05-27T07:00:00.000Z",
  "updatedAt": "2026-05-27T07:00:00.000Z"
}
```

> **Catatan untuk Frontend:** Karena proses *auto-create/join channel* berjalan di *background*, Frontend tidak perlu menunggu konfirmasi *channel* terbentuk. Setelah menerima respons `201 Created`, Frontend dapat langsung mengarahkan (*redirect*) *user* ke halaman utama (misal: halaman daftar *Chat/Channel*), dan *channel* minat utama akan otomatis muncul di daftar *channel* *user*.

---

## 2. Get User Onboarding Data

Mengambil data *onboarding* milik *user* yang sedang *login*.

*   **URL:** `/onboarding/me`
*   **Method:** `GET`
*   **Auth Required:** Yes (Bearer Token)

### Success Response (200 OK)

```json
{
  "id": "uuid-onboarding-record",
  "userId": "uuid-user-id",
  "references": ["Instagram"],
  "interests": [
    {
      "category": "Olah Raga",
      "sub_category": "Sepak Bola"
    }
  ],
  "createdAt": "2026-05-27T07:00:00.000Z",
  "updatedAt": "2026-05-27T07:00:00.000Z"
}
```

*(Atau mengembalikan `null`/`empty` jika user belum mengisi onboarding)*

---

## 3. Recommended Channels

*(Sebagai referensi tambahan untuk fitur Channel berbasis minat)*
Frontend dapat menampilkan rekomendasi channel lain yang sesuai dengan minat user namun belum diikuti.

*   **URL:** `/channels/recommended`
*   **Method:** `GET`
*   **Auth Required:** Yes (Bearer Token)

### Success Response (200 OK)

Mengembalikan daftar obrolan (`Conversation`) bertipe `channel` yang diurutkan berdasarkan kecocokan minat dari data Onboarding *user*, dan mengecualikan *channel* yang sudah diikuti.

```json
[
  {
    "id": "uuid-channel-1",
    "type": "channel",
    "title": "Komunitas Teknologi",
    "category": "Teknologi",
    "createdAt": "2026-05-27T07:00:00.000Z",
    "updatedAt": "2026-05-27T07:00:00.000Z"
  }
]
```
