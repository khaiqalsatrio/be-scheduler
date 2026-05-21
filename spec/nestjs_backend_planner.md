# Planner: Pembangunan Backend Service dengan NestJS

Dokumen ini berisi rencana komprehensif untuk membangun kembali *Backend Service* (BE) menggunakan **NestJS** untuk menggantikan backend lama yang telah dinonaktifkan. Rencana ini didasarkan pada spesifikasi endpoint REST API, dokumentasi WebSocket (Socket.IO), serta *Service Layer* yang ada pada kode frontend saat ini.

---

## 1. Stack Teknologi yang Direkomendasikan
*   **Framework Utama:** NestJS (TypeScript)
*   **Database:** PostgreSQL (pilihan terbaik untuk data relasional seperti user, chat, percakapan, dan agenda)
*   **ORM:** TypeORM (`@nestjs/typeorm` dan `typeorm`) dengan driver PostgreSQL (`pg`)
*   **Real-time Layer:** `@nestjs/websockets` dengan Socket.IO (`socket.io`)
*   **Autentikasi:** `@nestjs/jwt` & `passport-jwt` (JWT Bearer Token)
*   **Penyimpanan Media (File/Voice/Video):** NestJS Multer + AWS S3 / MinIO (atau penyimpanan lokal disk untuk tahap *development*)
*   **Validasi Data:** `class-validator` & `class-transformer` untuk validasi DTO (*Data Transfer Object*) secara ketat

---

## 2. Arsitektur Modul NestJS (Struktur Project)
Aplikasi NestJS akan dibagi menjadi beberapa modul independen dengan meletakkan berkas entity di dalam masing-masing modul:

```text
src/
├── app.module.ts                   # Modul root
├── main.ts                         # Entry point aplikasi (port, cors, validation pipe)
├── common/                         # Decorator, interceptor, guard, dan exception filter global
│   ├── decorators/
│   ├── guards/jwt-auth.guard.ts
│   ├── filters/http-exception.filter.ts
│   └── interceptors/transform.interceptor.ts
├── modules/
│   ├── auth/                       # Autentikasi (Login & Register)
│   ├── user/                       # Profile, User lookup, & User Entity
│   │   └── entities/user.entity.ts
│   ├── onboarding/                 # Alur onboarding & Onboarding Entity
│   │   └── entities/onboarding.entity.ts
│   ├── conversation/               # CRUD percakapan & Conversation/Member Entities
│   │   └── entities/
│   │       ├── conversation.entity.ts
│   │       └── conversation-member.entity.ts
│   ├── message/                    # Pengiriman pesan, reaksi, & Message/Reaction Entities
│   │   └── entities/
│   │       ├── message.entity.ts
│   │       └── reaction.entity.ts
│   ├── agenda/                     # CRUD agenda & Agenda Entity
│   │   └── entities/agenda.entity.ts
│   ├── channel/                    # Get channels & Channel/Member Entities
│   │   └── entities/
│   │       ├── channel.entity.ts
│   │       └── channel-member.entity.ts
│   ├── sticker/                    # Get stickers & Sticker/Pack Entities
│   │   └── entities/
│   │       ├── sticker-pack.entity.ts
│   │       └── sticker.entity.ts
│   └── ai/                         # Integrasi AI (Tera AI & AI Insight)
└── database/                       # Konfigurasi data-source dan file migrasi TypeORM
    ├── data-source.ts
    └── migrations/
```

---

## 3. Skema Database (TypeORM Entities)
Berikut adalah rancangan model database dalam bentuk entitas TypeScript menggunakan decorator TypeORM untuk menunjang fitur aplikasi:

### 3.1 User & Onboarding Entities
```typescript
// src/modules/user/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { ConversationMember } from '../../conversation/entities/conversation-member.entity';
import { Message } from '../../message/entities/message.entity';
import { Reaction } from '../../message/entities/reaction.entity';
import { Agenda } from '../../agenda/entities/agenda.entity';
import { ChannelMember } from '../../channel/entities/channel-member.entity';
import { UserOnboarding } from '../../onboarding/entities/onboarding.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password?: string;

  @Column()
  name: string;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  company: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  nik: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  position: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastActiveAt: Date;

  @Column({ default: false })
  isOnboarded: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ConversationMember, (membership) => membership.user)
  memberships: ConversationMember[];

  @OneToMany(() => Message, (message) => message.sender)
  messagesSent: Message[];

  @OneToMany(() => Reaction, (reaction) => reaction.user)
  reactions: Reaction[];

  @OneToMany(() => Agenda, (agenda) => agenda.user)
  agendas: Agenda[];

  @OneToMany(() => ChannelMember, (cm) => cm.user)
  channelsJoined: ChannelMember[];

  @OneToOne(() => UserOnboarding, (onboarding) => onboarding.user)
  onboarding: UserOnboarding;
}

// src/modules/onboarding/entities/onboarding.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('user_onboarding')
export class UserOnboarding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @OneToOne(() => User, (user) => user.onboarding, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('simple-array')
  references: string[];

  @Column('jsonb')
  interests: { category: string; sub_category: string }[];
}
```

### 3.2 Conversation Entities
```typescript
// src/modules/conversation/entities/conversation.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ConversationMember } from './conversation-member.entity';
import { Message } from '../../message/entities/message.entity';

export enum ConversationType {
  DM = 'dm',
  GROUP = 'group',
  PROJECT = 'project',
  DOCUMENT = 'document',
  DOC_ANALYZE = 'doc_analyze',
  TIME_MACHINE = 'time_machine',
  KNOWLEDGE = 'knowledge'
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ConversationType })
  type: ConversationType;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  photoUrl: string;

  @Column({ nullable: true })
  aiPrompt: string;

  @Column({ default: 'llm' })
  knowledgePolicy: string;

  @Column('simple-array', { nullable: true })
  knowledgeIds: string[];

  @Column({ nullable: true })
  pinnedMessageId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ConversationMember, (member) => member.conversation)
  members: ConversationMember[];

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];
}

// src/modules/conversation/entities/conversation-member.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from '../../user/entities/user.entity';

export enum MemberRole {
  ADMIN = 'admin',
  MEMBER = 'member'
}

@Entity('conversation_members')
@Unique(['conversationId', 'userId'])
export class ConversationMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  conversationId: string;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: MemberRole, default: MemberRole.MEMBER })
  role: MemberRole;

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  pinnedAt: Date;

  @Column({ default: false })
  isMuted: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @ManyToOne(() => Conversation, (conv) => conv.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @ManyToOne(() => User, (user) => user.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
```

### 3.3 Message & Reaction Entities
```typescript
// src/modules/message/entities/message.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Conversation } from '../../conversation/entities/conversation.entity';
import { User } from '../../user/entities/user.entity';
import { Reaction } from './reaction.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
  VOICE = 'voice',
  STICKER = 'sticker',
  LOCATION = 'location',
  CONTACT = 'contact',
  SYSTEM = 'system'
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read'
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  conversationId: string;

  @Column()
  senderId: string;

  @Column({ nullable: true })
  clientMessageId: string;

  @Column({ nullable: true })
  replyToMessageId: string;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column('jsonb', { nullable: true })
  meta: any;

  @Column({ type: 'enum', enum: MessageStatus, default: MessageStatus.SENT })
  status: MessageStatus;

  @Column({ type: 'timestamp', nullable: true })
  editedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Conversation, (conv) => conv.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @ManyToOne(() => User, (user) => user.messagesSent)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @ManyToOne(() => Message, (msg) => msg.replies, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'replyToMessageId' })
  replyTo: Message;

  @OneToMany(() => Message, (msg) => msg.replyTo)
  replies: Message[];

  @OneToMany(() => Reaction, (reaction) => reaction.message)
  reactions: Reaction[];
}

// src/modules/message/entities/reaction.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Message } from './message.entity';
import { User } from '../../user/entities/user.entity';

@Entity('reactions')
@Unique(['messageId', 'userId'])
export class Reaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  messageId: string;

  @Column()
  userId: string;

  @Column()
  emoji: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Message, (msg) => msg.reactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message: Message;

  @ManyToOne(() => User, (user) => user.reactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
```

### 3.4 Agenda, Channel, & Sticker Entities
```typescript
// src/modules/agenda/entities/agenda.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('agendas')
export class Agenda {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.agendas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}

// src/modules/channel/entities/channel.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { ChannelMember } from './channel-member.entity';

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  emoji: string;

  @Column({ nullable: true })
  color: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ChannelMember, (cm) => cm.channel)
  members: ChannelMember[];
}

// src/modules/channel/entities/channel-member.entity.ts
import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Channel } from './channel.entity';
import { User } from '../../user/entities/user.entity';

@Entity('channel_members')
export class ChannelMember {
  @PrimaryColumn()
  channelId: string;

  @PrimaryColumn()
  userId: string;

  @ManyToOne(() => Channel, (ch) => ch.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channelId' })
  channel: Channel;

  @ManyToOne(() => User, (usr) => usr.channelsJoined, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}

// src/modules/sticker/entities/sticker-pack.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Sticker } from './sticker.entity';

@Entity('sticker_packs')
export class StickerPack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @OneToMany(() => Sticker, (st) => st.pack)
  stickers: Sticker[];
}

// src/modules/sticker/entities/sticker.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { StickerPack } from './sticker-pack.entity';

@Entity('stickers')
export class Sticker {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  stickerPackId: string;

  @Column()
  imageUrl: string;

  @ManyToOne(() => StickerPack, (pack) => pack.stickers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stickerPackId' })
  pack: StickerPack;
}
```
```

---

## 4. Rincian Modul & Fungsionalitas REST API

Setiap REST Endpoint dikelompokkan berdasarkan controller di NestJS. Prefix API diatur ke `/v1` menggunakan `app.setGlobalPrefix('v1')`. Semua endpoint dilindungi oleh `JwtAuthGuard` kecuali Auth (Login/Register).

### 4.1 AuthModule
*   `POST /v1/register`
    *   **Payload:** `{ email, password, name, company, phone, nik }`
    *   **Fungsi:** Validasi data, *hashing* password menggunakan `bcrypt`, menyimpan data user baru, generate token JWT.
*   `POST /v1/login`
    *   **Payload:** `{ username, password }`
    *   **Fungsi:** Mencari user berdasarkan username/email, mencocokkan password, mengembalikan token JWT: `{ token, access_token }`.

### 4.2 OnboardingModule
*   `GET /v1/onboarding/status`
    *   **Fungsi:** Mengambil status onboarding user saat ini.
*   `GET /v1/onboarding/references/options`
    *   **Fungsi:** Menyediakan daftar opsi topik preferensi profesional.
*   `GET /v1/onboarding/interests/options`
    *   **Fungsi:** Menyediakan daftar opsi kategori minat/interest.
*   `POST /v1/onboarding/profile` (Multipart/form-data)
    *   **Payload:** `{ name, position, avatar? }` (File upload avatar)
    *   **Fungsi:** Simpan data langkah 1 onboarding (nama, posisi, file avatar di-upload ke storage).
*   `POST /v1/onboarding/references`
    *   **Payload:** `{ topics: string[] }` (Maksimal 5 topik)
    *   **Fungsi:** Simpan data langkah 2 onboarding.
*   `POST /v1/onboarding/interests`
    *   **Payload:** `{ interests: { category: string, sub_category: string }[] }` (Maksimal 3 minat)
    *   **Fungsi:** Simpan langkah 3 onboarding & tandai `isOnboarded = true` pada tabel User.

### 4.3 ConversationModule
*   `GET /v1/conversations`
    *   **Query Params:** `includeArchived?: boolean`
    *   **Fungsi:** Mengembalikan semua percakapan milik user login, lengkap dengan info penerima (untuk DM) dan detail pesan terakhir (`last_message`).
*   `POST /v1/conversations` (Multipart/form-data)
    *   **Payload:** `{ type, title?, participantIds: string[], photo?, ai_prompt?, knowledge_policy?, knowledge_ids? }`
    *   **Fungsi:** Membuat percakapan baru. Jika tipenya `dm` dan sudah ada percakapan antara kedua belah pihak, kembalikan percakapan yang sudah ada. Otomatis tambahkan AI Bot jika tipenya `group`.
*   `PATCH /v1/conversations/:id` (Multipart/form-data)
    *   **Payload:** `{ title?, ai_prompt?, knowledge_policy?, knowledge_ids?, photo? / avatar? }`
    *   **Fungsi:** Update metadata group. Hanya bisa diakses admin percakapan.
*   `DELETE /v1/conversations/:id`
    *   **Fungsi:** Reset percakapan. Menghapus percakapan & semua pesan secara fisik, lalu membuat percakapan baru dengan partisipan dan konfigurasi yang sama (menghasilkan ID percakapan baru).
*   `GET /v1/conversations/:id/members`
    *   **Fungsi:** Mengambil daftar anggota grup (AI Bot dikecualikan).
*   `POST /v1/conversations/:id/members`
    *   **Payload:** `{ userId: string }`
    *   **Fungsi:** Menambahkan anggota baru ke grup (Admin percakapan saja).
*   `DELETE /v1/conversations/:id/members/:userId`
    *   **Fungsi:** Menghapus anggota grup (atau *leave group* bagi diri sendiri).
*   `PUT /v1/conversations/:id/members/:userId/role`
    *   **Payload:** `{ role: 'admin' | 'member' }`
    *   **Fungsi:** Mengubah role anggota grup (Admin saja).
*   `PUT /v1/conversations/:id/pin` / `mute` / `archive`
    *   **Payload:** `{ isPinned / isMuted / isArchived: boolean }`
    *   **Fungsi:** Mengubah status konfigurasi percakapan khusus bagi user yang melakukan request.

### 4.4 MessageModule
*   `GET /v1/messages/:conversationId`
    *   **Query Params:** `limit?: number`, `cursor?: string` (ISO Date timestamp)
    *   **Fungsi:** Mengambil riwayat chat terurut terbalik (`created_at DESC`) untuk pagination berbasis cursor.
*   `POST /v1/messages` (Multipart/form-data - HTTP Fallback)
    *   **Payload:** `{ conversationId, clientMessageId, type, content?, replyToMessageId?, meta?, file? }`
    *   **Fungsi:** Mengirim pesan baru via REST API. Mendukung upload file (gambar, video, dokumen, voice note).
*   `POST /v1/messages/dm` (Multipart/form-data)
    *   **Payload:** `{ recipientId, clientMessageId, type, content?, file?, meta? }`
    *   **Fungsi:** Mengirim pesan langsung (jika DM belum ada, buat baru terlebih dahulu).
*   `PUT /v1/messages/read`
    *   **Payload:** `{ conversationId, lastMessageId? }`
    *   **Fungsi:** Menandai semua pesan di percakapan tersebut telah dibaca.
*   `PUT /v1/messages/read-all`
    *   **Fungsi:** Menandai semua pesan di semua percakapan milik user telah dibaca.
*   `GET /v1/messages/search/global` & `/messages/search/:conversationId`
    *   **Query Params:** `q: string`
    *   **Fungsi:** Melakukan pencarian teks pada isi pesan (maksimal 50 hasil).
*   `POST /v1/messages/:id/forward`
    *   **Payload:** `{ conversationIds: string[] }`
    *   **Fungsi:** Meneruskan pesan terpilih ke satu atau beberapa percakapan lain.
*   `POST /v1/messages/:id/reactions`
    *   **Payload:** `{ emoji: string }`
    *   **Fungsi:** Menambahkan/menghapus reaksi emoji pada pesan (*toggle*).
*   `PUT /v1/messages/:id/pin`
    *   **Payload:** `{ isPinned: boolean }`
    *   **Fungsi:** Memasang/melepas pin pada suatu pesan di percakapan.
*   `PUT /v1/messages/:id`
    *   **Payload:** `{ content: string }`
    *   **Fungsi:** Mengedit isi pesan teks (Hanya pengirim asli yang bisa melakukan edit).
*   `DELETE /v1/messages/:id`
    *   **Fungsi:** Menghapus pesan secara virtual untuk diri sendiri.

### 4.5 AgendaModule
*   `GET /v1/agendas`
    *   **Query Params:** `page?: number`, `limit?: number`
    *   **Fungsi:** Mengambil daftar agenda scheduler milik user bersangkutan.
*   `POST /v1/agendas`
    *   **Payload:** `{ title, date, notes? }`
    *   **Fungsi:** Membuat agenda scheduler baru.
*   `DELETE /v1/agendas/:id`
    *   **Fungsi:** Menghapus agenda scheduler.

### 4.6 ChannelModule
*   `GET /v1/channels`
    *   **Fungsi:** Mengambil daftar channel publik.
*   `GET /v1/channels/recommended`
    *   **Fungsi:** Mengambil rekomendasi channel sesuai interest user.

### 4.7 StickerModule
*   `GET /v1/stickers`
    *   **Fungsi:** Mendapatkan seluruh daftar paket stiker beserta gambarnya.

### 4.8 AiInsightModule & AiModule
*   `POST /v1/ai-insight/document/:conversationId`
    *   **Fungsi:** Memicu aksi AI (Tera AI) untuk membaca dokumen pendukung pada chat atau melakukan ringkasan otomatis percakapan.

---

## 5. Gateway WebSocket Real-time (`ChatGateway`)

WebSocket Gateway di NestJS menggunakan `socket.io` dan bertugas memproses interaksi *low-latency* real-time.

### 5.1 Autentikasi & Room Management
*   **Handshake Auth:** Membaca token JWT dari `handshake.auth.token` (untuk browser/mobile client) atau `handshake.headers.authorization`. Jika token tidak valid, koneksi ditolak (401).
*   **Rooms:**
    *   **Personal Room:** Setelah koneksi berhasil, socket secara otomatis bergabung ke room `user:<userId>`. Digunakan untuk menerima event pribadi (seperti notifikasi mention, read all, dll).
    *   **Conversation Room:** Client akan emit `conversation.join` (mengirim UUID percakapan) untuk masuk ke room tersebut, sehingga dapat menerima event *room-scoped* (typing, reading, message updates).

### 5.2 Pemetaan Event (Client → Server)
Metode di Gateway didekorasi dengan `@SubscribeMessage('event_name')`. Setiap request menyertakan callback ACK untuk memicu response sukses/gagal.

| Nama Event | Payload DTO | Logika Handler di Service NestJS |
| :--- | :--- | :--- |
| `conversations.get` | `null` | Ambil percakapan user, emit ACK `conversations.list` |
| `conversation.join` | `{ conversationId }` | Tambahkan socket client ke room `conversationId`, emit ACK `conversation.joined` |
| `conversation.leave` | `{ conversationId }` | Keluarkan socket client dari room, emit ACK `conversation.left` |
| `conversation.create` | `{ type, title?, participantIds, ai_prompt? }` | Validasi, simpan db, broadcast `conversation.created` ke seluruh peserta, emit ACK |
| `conversation.update` | `{ conversationId, title?, avatar_url?, photo_url?, ai_prompt? }` | Perbarui data grup, broadcast `conversation.updated` ke room, emit ACK |
| `conversation.delete` | `{ conversationId }` | Hapus & buat ulang, broadcast `conversation.deleted` ke peserta, emit ACK `conversation.recreated` |
| `conversation.pin` / `mute` / `archive` | `{ conversationId, state }` | Update konfigurasi member conversation di DB, emit ACK |
| `conversation.members.get` | `{ conversationId }` | Get member dari DB, emit ACK `conversation.members.list` |
| `conversation.member.add` | `{ conversationId, userId }` | Tambah di DB, broadcast `conversation.member.added` ke room, emit ACK |
| `conversation.member.remove` | `{ conversationId, userId }` | Hapus di DB, broadcast `conversation.member.removed`, kick user dari room WS, emit ACK |
| `conversation.member.role` | `{ conversationId, userId, role }` | Update role DB, broadcast `conversation.member.role_updated` ke room, emit ACK |
| `message.send` | `{ conversationId, clientMessageId, type, content?, replyToMessageId?, meta? }` | Simpan pesan ke DB (status: sent), broadcast `message.new` ke room percakapan, emit ACK `message.ack`. *Menerapkan throttling (max 5 pesan per detik per user)*. |
| `message.dm` | `{ recipientId, clientMessageId, type, content? }` | Dapatkan/Buat percakapan DM, simpan pesan, broadcast ke personal room penerima & pengirim, emit ACK `message.ack` |
| `messages.get` | `{ conversationId, limit?, cursor? }` | Fetch data riwayat dari DB (pagination cursor), emit ACK `messages.list` |
| `messages.search` / `global` | `{ query }` | Cari pesan di DB, emit ACK hasil pencarian |
| `messages.read_all` | `null` | Tandai semua terbaca di DB, emit ACK, push `messages.read_all` ke personal room |
| `message.forward` | `{ messageId, conversationIds }` | Duplikasi pesan di DB untuk percakapan baru, broadcast `message.new` ke room-room tujuan |
| `message.delivered` | `{ messageId }` | Update status pesan di DB ke `delivered`, broadcast `message.delivered` ke room |
| `message.read` | `{ conversationId, lastMessageId? }` | Update status pesan di DB ke `read`, broadcast `message.read` ke room |
| `message.edit` | `{ messageId, content }` | Update isi pesan di DB, broadcast `message.updated` ke room |
| `message.delete` | `{ messageId, forEveryone }` | Jika `forEveryone` = true, hapus di DB secara global (atau ganti konten menjadi pesan sistem terhapus), broadcast `message.deleted`. Jika false, tandai terhapus lokal. |
| `message.pin` | `{ messageId, isPinned }` | Pasang/lepas pin di DB, broadcast `message.pinned` ke room |
| `message.reaction` | `{ messageId, emoji }` | Toggle reaksi di DB, broadcast `message.reaction` ke room |
| `conversation.typing` | `{ conversationId }` | Broadcast `conversation.typing` (berisi `userId`) ke anggota lain di room percakapan |
| `conversation.reading` | `{ conversationId }` | Broadcast `conversation.reading` (berisi `userId`) ke anggota lain di room percakapan |
| `presence.heartbeat` | `null` | Perbarui status aktif user di cache Redis/Memory dengan TTL 60 detik. Emit ACK `presence.pulse`. |

### 5.3 Mekanisme Real-time Tambahan
*   **Presence (Online/Offline Status):**
    *   Menggunakan Redis untuk mencatat status kehadiran user berdasarkan *heartbeat* (diterima tiap 30-45 detik).
    *   Jika dalam 60 detik tidak ada heartbeat baru, tandai user sebagai *offline* dan broadcast event `presence.update` dengan status `offline` ke semua relasi percakapan user tersebut.
*   **Tera AI Bot Integrasi:**
    *   Ketika pesan dikirim ke grup yang menyertakan AI bot (atau saat AI bot di-mention), server memicu *AI Gateway Service*.
    *   Sebelum AI mulai memproses respons, server memancarkan event `ai.thinking` ke room percakapan untuk memberi tahu client bahwa AI sedang bekerja.
    *   Setelah AI selesai menghasilkan teks/respons, server memancarkan `ai.thinking.stop`, menyimpan respons AI ke database, dan membroadcast pesan baru tersebut lewat `message.new`.

---

## 6. Penanganan File & Keamanan
1.  **JWT Authentication Guard:** Dipasang secara global. Hanya endpoint tertentu (seperti `/v1/login` dan `/v1/register`) yang di-bypass menggunakan custom decorator `@Public()`.
2.  **Multer Interceptor untuk File Upload:**
    *   REST Endpoint yang mendukung file/media menggunakan `FileInterceptor` atau `AnyFilesInterceptor` untuk memproses *multipart/form-data*.
    *   File divalidasi berdasarkan tipe berkas (Mimetype) dan ukuran maksimal (misal: Gambar < 5MB, Video < 20MB, Dokumen < 10MB).
    *   Penyimpanan berkas dikirim langsung ke S3/MinIO dan menghasilkan presigned URL jangka pendek (exp: 1 jam) yang dimasukkan ke field `meta.file.url` sebelum respons dikirim ke client.
3.  **Idempotensi Pesan:**
    *   Memastikan client tidak mengirim pesan ganda karena gangguan sinyal dengan mencocokkan `senderId` + `clientMessageId`. Jika ditemukan duplikasi, langsung kembalikan data pesan yang sudah tersimpan tanpa menyimpan baru.
4.  **CORS Policy:**
    *   Konfigurasi CORS di NestJS diatur agar memperbolehkan request dari asal client mobile (React Native / Expo dev client).

---

## 7. Rencana Tahapan Eksekusi (Implementation Steps)

### Tahap 1: Inisialisasi & Setup Database
*   Inisialisasi project NestJS (`nest new bta-chat-backend`).
*   Konfigurasi database PostgreSQL & TypeORM (`npm install @nestjs/typeorm typeorm pg`).
*   Buat konfigurasi `DataSource` di `src/database/data-source.ts` dan hubungkan modul `TypeOrmModule.forRoot()` di `AppModule`.
*   Buat berkas entitas di masing-masing modul sesuai rancangan di atas, lalu buat migrasi database awal (`npx typeorm migration:generate src/database/migrations/InitialMigration`) dan jalankan migrasinya (`npx typeorm migration:run`).

### Tahap 2: Autentikasi & User Management
*   Implementasi `AuthModule` (Register, Login, token generation).
*   Setup `JwtStrategy` dan `JwtAuthGuard` untuk proteksi endpoint.
*   Membuat modul User untuk pencarian kontak (`/users/recipients`).

### Tahap 3: Onboarding & Profile
*   Implementasi logika penyimpanan data onboarding per langkah.
*   Integrasikan multer penyimpanan lokal untuk file avatar pada profil user.

### Tahap 4: Core Chat (REST + Gateway WebSocket)
*   Membuat `ConversationModule` & `MessageModule`.
*   Setup Socket.IO Gateway (`ChatGateway`) beserta middleware autentikasi koneksi WS.
*   Implementasikan event dasar: `conversation.join`, `conversation.leave`, `message.send` (REST & WS), dan push event `message.new`.

### Tahap 5: Chat Advanced (Fitur Chat Lanjutan)
*   Implementasi reaksi emoji, penyuntingan pesan, dan penghapusan pesan.
*   Tambahkan fungsionalitas pin pesan, forward pesan, dan sinkronisasi tanda terima pesan (`message.delivered` & `message.read`).
*   Implementasikan indikator mengetik (`conversation.typing`) dan kehadiran online (`presence.heartbeat`).

### Tahap 6: Agenda, Channels, & Stickers
*   Implementasikan CRUD modul Agenda untuk mensinkronkan scheduler mobile.
*   Membuat modul Channel untuk daftar channel & rekomendasi channel berdasarkan interest user.
*   Menyiapkan modul Sticker dengan data dummy/static assets packs.

### Tahap 7: Integrasi AI & Media Storage
*   Integrasikan pustaka AWS SDK / MinIO client untuk upload media asli.
*   Hubungkan module AI dengan API model LLM (misalnya Gemini API / OpenAI API) untuk menjawab input dalam grup, memproses `ai-insight`, dan emit status `ai.thinking` secara real-time.

### Tahap 8: Pengujian & Deployment
*   Membuat unit test untuk logika bisnis penting.
*   Deployment backend menggunakan Docker container, lengkap dengan file `Dockerfile` dan `docker-compose.yml` untuk PostgreSQL + Redis.
