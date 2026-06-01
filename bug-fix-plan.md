# 🛠️ Bug Fix Plan — NestJS Backend Console Logs

> **Tanggal:** 01 Juni 2026  
> **Sumber:** Log output dari `npm run start:dev`  
> **Prioritas:** Medium — tidak mempengaruhi fungsionalitas utama, namun berdampak pada keamanan, maintainability, dan debugging experience.

---

## Ringkasan Masalah

Terdapat **3 masalah** yang teridentifikasi dari log console:

| # | Masalah | Severity | File yang Diduga |
|---|---------|----------|-----------------|
| 1 | `[object Object]` pada log conversation join/leave | 🟡 Medium | `chat.gateway.ts` |
| 2 | DeprecationWarning: `url.parse()` | 🟠 High | Dependency pihak ketiga |
| 3 | DeprecationWarning: `client.query()` concurrent | 🟡 Medium | Konfigurasi TypeORM / `app.module.ts` |

---

## Bug #1 — `[object Object]` pada Conversation Log

### Deskripsi

```
Client KAoqWF67A7u-NyO-AAAD joined conversation [object Object]
Client KAoqWF67A7u-NyO-AAAD left conversation [object Object]
```

Object JavaScript di-interpolasi langsung ke dalam string tanpa di-serialize terlebih dahulu, menghasilkan output `[object Object]` yang tidak berguna untuk debugging.

### Root Cause

Di `chat.gateway.ts`, kemungkinan besar terdapat kode seperti:

```typescript
// ❌ Salah — data berupa object, bukan primitive
console.log(`Client ${client.id} joined conversation ${data}`);
```

Padahal `data` yang dikirim dari client adalah object, misalnya `{ conversationId: "abc-123" }`.

### Langkah Perbaikan

**1. Buka file `chat.gateway.ts`**

**2. Cari semua handler yang menggunakan `console.log` dengan interpolasi string dari payload:**

```typescript
// Sebelum
@SubscribeMessage('conversation.join')
handleJoin(client: Socket, data: any) {
  console.log(`Client ${client.id} joined conversation ${data}`);
  // ...
}
```

**3. Perbaiki dengan akses properti spesifik atau JSON.stringify:**

```typescript
// ✅ Setelah — opsi A: akses properti langsung
@SubscribeMessage('conversation.join')
handleJoin(client: Socket, data: { conversationId: string }) {
  console.log(`Client ${client.id} joined conversation ${data.conversationId}`);
  // ...
}

// ✅ Setelah — opsi B: gunakan JSON.stringify untuk debug lengkap
console.log(`Client ${client.id} joined conversation ${JSON.stringify(data)}`);
```

**4. Tambahkan typing yang jelas pada payload:**

```typescript
interface ConversationPayload {
  conversationId: string;
}

@SubscribeMessage('conversation.join')
handleJoin(client: Socket, data: ConversationPayload): void {
  const { conversationId } = data;
  console.log(`Client ${client.id} joined conversation ${conversationId}`);
  client.join(conversationId);
}
```

**5. Lakukan hal yang sama untuk semua event:** `conversation.join`, `conversation.leave`, `conversation.mute`, `message.delete`, `message.delivered`, `message.read`.

### Verifikasi

Setelah perbaikan, log harus menampilkan UUID yang valid:
```
Client KAoqWF67A7u-NyO-AAAD joined conversation a1b2c3d4-e5f6-...
```

---

## Bug #2 — DeprecationWarning: `url.parse()`

### Deskripsi

```
(node:20856) [DEP0169] DeprecationWarning: `url.parse()` behavior is not standardized 
and prone to errors that have security implications. Use the WHATWG URL API instead.
```

### Root Cause

Salah satu library/dependency yang digunakan masih menggunakan `url.parse()` dari Node.js legacy API. Ini bukan kode kita langsung, melainkan berasal dari dependency.

### Langkah Perbaikan

**1. Identifikasi sumber warning dengan menjalankan:**

```bash
node --trace-deprecation dist/main.js 2>&1 | grep -A 10 "url.parse"
```

**2. Periksa versi dependency yang bermasalah:**

```bash
npm list --depth=5 | grep -i "socket\|ws\|http"
```

**3. Update dependency yang bermasalah ke versi terbaru:**

```bash
npm update <nama-package>
# atau jika perlu major update:
npm install <nama-package>@latest
```

**4. Jika berasal dari `socket.io` atau `engine.io`:**

```bash
npm install socket.io@latest
```

**5. Jika tidak bisa diupdate (breaking change), tambahkan suppresswarning sementara di `main.ts` sambil menunggu patch:**

```typescript
// main.ts — TEMPORARY, hapus setelah dependency diupdate
process.emitWarning = (warning, ...args) => {
  if (typeof warning === 'string' && warning.includes('DEP0169')) return;
  originalEmitWarning(warning, ...args);
};
```

> ⚠️ Solusi suppress hanya bersifat sementara. Prioritaskan update dependency.

---

## Bug #3 — DeprecationWarning: `client.query()` Concurrent

### Deskripsi

```
(node:20856) DeprecationWarning: Calling client.query() when the client is already 
executing a query is deprecated and will be removed in pg@9.0. 
Use async/await or an external async flow control mechanism instead.
```

### Root Cause

TypeORM melakukan pemanggilan query secara paralel pada satu koneksi `pg` yang sama. Biasanya terjadi saat:
- Inisialisasi banyak `TypeOrmModule` sekaligus (terlihat ada 7+ module di log)
- Tidak menggunakan connection pooling dengan benar
- Query dijalankan tanpa menunggu promise sebelumnya selesai

### Langkah Perbaikan

**1. Periksa konfigurasi TypeORM di `app.module.ts`:**

```typescript
// Pastikan ada konfigurasi pool yang jelas
TypeOrmModule.forRoot({
  type: 'postgres',
  // ...
  extra: {
    max: 10,          // max pool connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  synchronize: false, // jangan gunakan true di production
})
```

**2. Pastikan semua repository/service menggunakan `async/await` dengan benar:**

```typescript
// ❌ Salah — fire and forget
this.userRepository.save(user);

// ✅ Benar — await hasil query
await this.userRepository.save(user);
```

**3. Jika ada query yang dijalankan di constructor atau lifecycle hook, pindahkan ke `onModuleInit`:**

```typescript
// ❌ Jangan jalankan query di constructor
constructor(private readonly repo: UserRepository) {
  this.repo.find(); // ini bisa menyebabkan concurrent query
}

// ✅ Gunakan onModuleInit
async onModuleInit() {
  await this.repo.find();
}
```

**4. Update `pg` ke versi terbaru jika memungkinkan:**

```bash
npm install pg@latest
```

---

## Checklist Perbaikan

- [ ] Fix `[object Object]` di semua `@SubscribeMessage` handler pada `chat.gateway.ts`
- [ ] Tambahkan TypeScript interface untuk semua WebSocket payload
- [ ] Jalankan `node --trace-deprecation` untuk identifikasi source `url.parse()`
- [ ] Update dependency yang menyebabkan `DEP0169`
- [ ] Audit semua query di service layer — pastikan semua `await`-ed
- [ ] Review konfigurasi connection pool TypeORM
- [ ] Tambahkan lint rule untuk mencegah `console.log` di production (`no-console` ESLint rule)
- [ ] Test ulang semua WebSocket event setelah perbaikan

---

## Rekomendasi Tambahan

### Gunakan Logger yang Proper

Ganti semua `console.log` dengan NestJS built-in Logger:

```typescript
import { Logger } from '@nestjs/common';

@WebSocketGateway()
export class ChatGateway {
  private readonly logger = new Logger(ChatGateway.name);

  handleJoin(client: Socket, data: ConversationPayload) {
    this.logger.log(`Client ${client.id} joined conversation ${data.conversationId}`);
  }
}
```

Ini memungkinkan log level filtering dan lebih mudah dimatikan di production.

### Nonaktifkan Verbose Log di Production

```typescript
// main.ts
const app = await NestFactory.create(AppModule, {
  logger: process.env.NODE_ENV === 'production' 
    ? ['error', 'warn'] 
    : ['log', 'debug', 'error', 'warn'],
});
```

---

*Plan ini dibuat berdasarkan analisis log output. Beberapa root cause mungkin berbeda setelah melihat source code asli.*