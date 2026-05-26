# Panduan Deploy Supabase + Vercel via Terminal

Langkah lengkap setup production dengan persistent database.

## ⚡ LANGKAH CEPAT (5 menit)

### 1️⃣ Setup Supabase (sekali aja)

Buka SUPABASE_SETUP.md dan ikuti sampai step 5 (Get credentials).

### 2️⃣ Setup environment variables lokal

```powershell
cd c:\PROCLAIMCHECK_FULL\PROCLAIM_CHECK

# Buat .env.local (jangan commit file ini!)
# Edit file ini dengan credentials dari Supabase:
# VITE_SUPABASE_URL=https://xxxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### 3️⃣ Test lokal

```powershell
npm install
npm run dev
```

Buka http://localhost:5173 dan test upload file. Cek di Supabase dashboard apakah data masuk.

### 4️⃣ Commit dan push ke GitHub

```powershell
git add -A
git commit -m "Setup Supabase production database"
git push origin main
```

### 5️⃣ Setup Vercel environment

Di Vercel dashboard (https://vercel.com):

1. Pilih project **proclaim-check** (atau nama project kamu)
2. Settings → **Environment Variables**
3. Tambah 2 variable dari Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```
4. **Save** dan **Redeploy**

### 6️⃣ Deploy

```powershell
cd c:\PROCLAIMCHECK_FULL\PROCLAIM_CHECK

# Login Vercel (jika belum)
vercel login

# Deploy ke production
vercel --prod
```

Tunggu sampai deploy selesai. Vercel akan kasih URL live aplikasi.

---

## 🔍 Testing Checklist

Setelah deploy, verify semua berjalan:

### ✅ Test GET uploads
```powershell
# Di PowerShell, cek API response
$response = Invoke-WebRequest -Uri "https://your-app.vercel.app/api/uploads" -Method GET
$response.Content | ConvertFrom-Json
```

### ✅ Test GET users
```powershell
$response = Invoke-WebRequest -Uri "https://your-app.vercel.app/api/users" -Method GET
$response.Content | ConvertFrom-Json
```

### ✅ Test di browser
1. Buka https://your-app.vercel.app
2. Login dengan akun default
3. Upload file dari menu "Unggah Berkas"
4. Verify di Supabase dashboard data tersimpan

---

## 🔧 Troubleshooting

### Masalah: "Cannot find module '@supabase/supabase-js'"
```powershell
npm install
```

### Masalah: Upload gagal dengan error "400 Missing required fields"
- Check console browser (F12 → Console) untuk detail error
- Pastikan semua field form sudah terisi

### Masalah: "500 Server error" di /api/uploads
- Check Vercel logs: `vercel logs --prod`
- Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sudah di-set di Vercel

### Masalah: Data tidak muncul di Supabase dashboard
1. Cek RLS policies sudah enabled
2. Run query di SQL Editor: `SELECT COUNT(*) FROM uploads;`
3. Jika 0, berarti data tidak tersimpan

### Masalah: "Username sudah digunakan" padahal baru pertama kali
- Ada conflict di database
- Buka Supabase dashboard → Table Editor → Users
- Delete user duplicate

---

## 📊 Monitoring Production

### Lihat live logs Vercel
```powershell
vercel logs --prod
```

### Lihat real-time queries Supabase
1. Buka Supabase dashboard → Logs
2. Filter "API Requests" untuk lihat semua request dari aplikasi

### Backup data
Supabase auto-backup harian. Manual backup:
```sql
-- Di Supabase SQL Editor
COPY (SELECT * FROM uploads) TO STDOUT WITH CSV;
COPY (SELECT * FROM users) TO STDOUT WITH CSV;
```

---

## 🚀 Deploy update (setelah perubahan kode)

1. Commit changes ke GitHub
2. Run:
   ```powershell
   vercel --prod
   ```

Or automatic: Push ke GitHub → Vercel auto-deploy.

---

## ❌ Jika mau revert ke lowdb (development)

```powershell
# Di Vercel dashboard, hapus:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# Redeploy → system balik pakai lowdb fallback
```

---

**Need help?** Baca SUPABASE_SETUP.md untuk detail lengkap.
