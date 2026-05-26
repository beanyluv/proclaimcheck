# Setup Supabase Database untuk Production

Panduan lengkap setup Supabase untuk persistent data storage di Vercel.

## 1. Buat akun Supabase gratis

1. Buka https://supabase.com
2. Click **Start your project** 
3. Sign up dengan email atau GitHub
4. Verify email kamu

## 2. Buat project Supabase baru

1. Di dashboard, click **New project**
2. Isi form:
   - **Name**: `proclaim-check` (atau nama lain)
   - **Database Password**: Buat password kuat, catat untuk nanti
   - **Region**: Pilih Singapore atau Jakarta (terdekat ke Indonesia)
   - **Pricing Plan**: Pilih **Free** (500MB storage, unlimited API calls)
3. Click **Create new project** dan tunggu ~5 menit sampai selesai

## 3. Create database tables

Setelah project siap:

1. Di sidebar, buka **SQL Editor**
2. Click **New Query**
3. Copy-paste SQL schema di bawah ini dan jalankan

### SQL Schema

```sql
-- Create uploads table
CREATE TABLE uploads (
  id TEXT PRIMARY KEY,
  fileName TEXT,
  fileType TEXT,
  fileData TEXT,
  videoLink TEXT,
  puskesmas TEXT NOT NULL,
  month TEXT NOT NULL,
  year TEXT NOT NULL,
  documentType TEXT NOT NULL,
  uploadedAt TEXT NOT NULL,
  uploadedBy TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Create users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nama TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL,
  foto TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Create indexes untuk query cepat
CREATE INDEX idx_uploads_puskesmas ON uploads(puskesmas);
CREATE INDEX idx_uploads_year_month ON uploads(year, month);
CREATE INDEX idx_users_username ON users(username);
```

4. Jalankan query dengan click tombol **Run** atau Ctrl+Enter

## 4. Enable Row Level Security (RLS) - Optional tapi recommended

Di **Authentication → Policies**, enable RLS untuk public access:

```sql
-- Allow public read access to uploads
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON uploads FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON uploads FOR INSERT WITH CHECK (true);

-- Allow public read/write to users (simple setup)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON users FOR DELETE USING (true);
```

## 5. Get credentials

1. Di sidebar, buka **Settings → API**
2. Copy **Project URL** (contoh: `https://xxxxx.supabase.co`)
3. Copy **anon public key** (contoh: `eyJhbGc...`)

## 6. Setup environment variables

### Lokal (development)

Buat file `.env.local` di root folder (jangan commit):

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...xxxxx
```

### Vercel (production)

1. Buka project di Vercel dashboard
2. Settings → **Environment Variables**
3. Tambah tiga variable:
   - **Key**: `VITE_SUPABASE_URL` → **Value**: `https://xxxxx.supabase.co`
   - **Key**: `VITE_SUPABASE_ANON_KEY` → **Value**: `eyJhbGc...xxxxx`
   - **Key**: `SUPABASE_SERVICE_ROLE` → **Value**: `<service_role key dari Supabase>`
4. Click **Save**
5. Redeploy app

```powershell
vercel --prod
```

## 7. Test koneksi

### Lokal (dev)

```bash
npm run dev
```

Buka browser, test upload file. Seharusnya data masuk ke Supabase.

Verifikasi di Supabase Dashboard:
- Settings → **SQL Editor**
- Jalankan: `SELECT * FROM uploads;`
- Harusnya terlihat data yang baru di-upload

## 8. Migrasi data lama (jika perlu)

Jika ada data di `server/db.json`, import ke Supabase:

1. Export data dari `server/db.json` (JSON format)
2. Di Supabase, buka **Table Editor**
3. Click table **uploads**, lalu **Insert row** (atau import CSV jika banyak)
4. Paste data manual atau import dari file

## Struktur Database

### Table: `uploads`

| Column | Type | Nullable |
|--------|------|----------|
| id | TEXT | No (PRIMARY KEY) |
| fileName | TEXT | Yes |
| fileType | TEXT | Yes |
| fileData | TEXT | Yes (base64 encoded) |
| videoLink | TEXT | Yes |
| puskesmas | TEXT | No |
| month | TEXT | No |
| year | TEXT | No |
| documentType | TEXT | No |
| uploadedAt | TEXT | No |
| uploadedBy | TEXT | Yes |
| createdAt | TIMESTAMP | Yes (default NOW) |
| updatedAt | TIMESTAMP | Yes (default NOW) |

### Table: `users`

| Column | Type | Nullable |
|--------|------|----------|
| id | TEXT | No (PRIMARY KEY) |
| username | TEXT | No (UNIQUE) |
| password | TEXT | No |
| nama | TEXT | No |
| email | TEXT | Yes |
| role | TEXT | No |
| foto | TEXT | Yes |
| createdAt | TIMESTAMP | Yes (default NOW) |
| updatedAt | TIMESTAMP | Yes (default NOW) |

## Troubleshooting

### "No rows returned" saat GET data

- Pastikan RLS policies sudah di-enable
- Check di Supabase dashboard apakah data benar-benar tersimpan

### "Connection refused" error

- Pastikan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` benar
- Pastikan environment variables sudah di-set di Vercel

### "CORS error"

- Supabase sudah handle CORS otomatis
- Jika masih error, check browser console untuk detail error

## Monitoring

Di Supabase Dashboard, bisa monitor:

- **Table Editor**: Lihat semua data secara real-time
- **Logs**: Monitor API calls dan errors
- **Realtime**: Setup real-time listeners untuk data changes

## Backup & Restore

Supabase auto-backup data harian. Untuk restore:

- Settings → **Backups**
- Pilih date yang mau di-restore
- Click restore

---

**Questions?** Check Supabase docs di https://supabase.com/docs
