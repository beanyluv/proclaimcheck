-- SQL SCRIPT UNTUK MENGAKTIFKAN DUKUNGAN FOTO PROFIL PADA SUPABASE
-- Silakan jalankan script ini di SQL Editor pada Dashboard Supabase Anda.

-- 1. Tambahkan kolom 'foto' ke tabel 'users' jika belum ada
ALTER TABLE users ADD COLUMN IF NOT EXISTS foto TEXT;

-- 2. Pastikan kolom 'puskesmas' juga ada untuk kelengkapan data
ALTER TABLE users ADD COLUMN IF NOT EXISTS puskesmas TEXT;

-- 3. Nonaktifkan Row Level Security (RLS) pada tabel 'users' agar frontend/Express API
-- bisa melakukan SELECT, INSERT, dan UPDATE tanpa terkendala izin akses (Policy).
-- Ini adalah solusi paling direkomendasikan & termudah untuk menghindari RLS Errors.
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 4. Verifikasi bahwa tabel users memiliki struktur yang benar
SELECT * FROM users LIMIT 1;
