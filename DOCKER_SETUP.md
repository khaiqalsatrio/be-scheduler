# Docker Setup Guide

Panduan untuk menjalankan aplikasi BE-Scheduler dengan Docker sehingga folder uploads disimpan di Docker volume, bukan di host machine.

## 📋 Prasyarat

- Docker 20.10+
- Docker Compose 2.0+

## 🚀 Cara Menjalankan

### 1. Production Mode

Untuk menjalankan aplikasi dalam mode production:

```bash
docker-compose up -d
```

**Apa yang terjadi:**
- Image Docker dibangun otomatis
- PostgreSQL database dimulai
- NestJS backend dimulai
- Folder uploads disimpan dalam Docker volume `uploads_data`
- Aplikasi dapat diakses di `http://localhost:4000`
- Database dapat diakses di `localhost:5432`

### 2. Development Mode

Untuk development dengan hot-reload:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

**Apa yang terjadi:**
- Source code di-mount secara langsung untuk hot-reload
- Perubahan di `src/` otomatis ter-reload
- Semua uploads tetap tersimpan dalam Docker volume
- Environment set ke `development` dengan `DB_SYNCHRONIZE: true`

## 🛑 Menghentikan Services

```bash
# Production
docker-compose down

# Development
docker-compose -f docker-compose.dev.yml down
```

## 🧹 Membersihkan Semua Data (termasuk Volumes)

**⚠️ Warning: Data uploads akan dihapus!**

```bash
# Production
docker-compose down -v

# Development
docker-compose -f docker-compose.dev.yml down -v
```

## 📂 Lokasi Uploads di Docker

Dalam Docker container, uploads disimpan di:
- `/app/uploads/` - General uploads
- `/app/uploads/avatars/` - User avatar images

**Di Host Machine:** 
- Data tersimpan dalam Docker named volume `uploads_data` atau `uploads_data_dev`
- Bukan di folder `./uploads` lagi!

## 🔍 Melihat Docker Volume

```bash
# List semua volumes
docker volume ls

# Inspect volume production
docker volume inspect scheduler_uploads_data

# Inspect volume development
docker volume inspect scheduler_uploads_data_dev
```

## 📊 Melihat Logs

```bash
# Backend logs
docker-compose logs -f backend

# Database logs
docker-compose logs -f postgres

# All services
docker-compose logs -f
```

## 🔧 Rebuild Image

Jika ada perubahan di `package.json` atau `Dockerfile`:

```bash
# Production rebuild
docker-compose build --no-cache

# Development rebuild
docker-compose -f docker-compose.dev.yml build --no-cache
```

## ✅ Verify Setup

1. **Check Backend Health:**
   ```bash
   curl http://localhost:4000/health
   ```

2. **Check Database Connection:**
   ```bash
   docker-compose exec backend npm run start:prod
   ```

3. **View Running Containers:**
   ```bash
   docker-compose ps
   ```

## 📝 Environment Variables

Environment variables sudah dikonfigurasi dalam `docker-compose.yml`:

- `DB_HOST`: `postgres` (nama service di docker-compose)
- `DB_PORT`: `5432`
- `DB_USER`: `postgres`
- `DB_PASSWORD`: `Alfirdaus29`
- `DB_NAME`: `scheduler`
- `PORT`: `4000`
- `NODE_ENV`: `production` atau `development`

Untuk production, ubah `.env` dan rebuild image.

## 🐛 Troubleshooting

### Port sudah digunakan
```bash
# Ubah port di docker-compose.yml
# Ganti "4000:4000" dengan "8000:4000" misalnya
```

### Database connection failed
```bash
# Check database log
docker-compose logs postgres

# Database mungkin belum ready, tunggu beberapa saat
docker-compose logs --tail=20 postgres
```

### Uploads tidak muncul
```bash
# Verify volume mounted
docker-compose exec backend ls -la /app/uploads

# Check volume contents
docker volume inspect scheduler_uploads_data
```

## 📌 Notes

- `.gitignore` sudah dikonfigurasi agar folder `uploads/` tidak di-commit
- Jika menjalankan app tanpa Docker, folder `uploads/` akan dibuat di host
- Untuk hybrid setup, pastikan konsisten menggunakan salah satu (Docker atau Host)
