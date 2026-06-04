-- ==========================================
-- SETUP ROW LEVEL SECURITY (RLS) SUPABASE
-- Aplikasi: ProClaim Check
-- File: supabase_rls_setup.sql
-- ==========================================

-- Catatan Penting:
-- Karena aplikasi ini menggunakan client-side Anon Key (VITE_SUPABASE_ANON_KEY) tanpa 
-- menggunakan Supabase Auth (JWT) bawaan untuk masuk ke sesi (melainkan dengan query 
-- manual ke tabel 'users'), semua operasi RLS diatur agar dapat diakses oleh peran 
-- 'anon' dan 'authenticated'. Hal ini menjamin kompatibilitas penuh dengan alur data 
-- client-side saat ini sambil tetap mengaktifkan fondasi keamanan RLS.

-- ==========================================
-- 1. TABEL: users
-- ==========================================

-- Aktifkan Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Hapus kebijakan lama jika ada
DROP POLICY IF EXISTS "Allow public SELECT on users" ON users;
DROP POLICY IF EXISTS "Allow public INSERT on users" ON users;
DROP POLICY IF EXISTS "Allow public UPDATE on users" ON users;
DROP POLICY IF EXISTS "Allow public DELETE on users" ON users;

-- Buat Kebijakan Akses
CREATE POLICY "Allow public SELECT on users" ON users 
    FOR SELECT 
    TO anon, authenticated 
    USING (true);

CREATE POLICY "Allow public INSERT on users" ON users 
    FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (true);

CREATE POLICY "Allow public UPDATE on users" ON users 
    FOR UPDATE 
    TO anon, authenticated 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public DELETE on users" ON users 
    FOR DELETE 
    TO anon, authenticated 
    USING (true);


-- ==========================================
-- 2. TABEL: messages
-- ==========================================

-- Aktifkan Row Level Security (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Hapus kebijakan lama jika ada
DROP POLICY IF EXISTS "Allow public SELECT on messages" ON messages;
DROP POLICY IF EXISTS "Allow public INSERT on messages" ON messages;
DROP POLICY IF EXISTS "Allow public UPDATE on messages" ON messages;
DROP POLICY IF EXISTS "Allow public DELETE on messages" ON messages;

-- Buat Kebijakan Akses
CREATE POLICY "Allow public SELECT on messages" ON messages 
    FOR SELECT 
    TO anon, authenticated 
    USING (true);

CREATE POLICY "Allow public INSERT on messages" ON messages 
    FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (true);

CREATE POLICY "Allow public UPDATE on messages" ON messages 
    FOR UPDATE 
    TO anon, authenticated 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public DELETE on messages" ON messages 
    FOR DELETE 
    TO anon, authenticated 
    USING (true);


-- ==========================================
-- 3. TABEL: uploads
-- ==========================================

-- Aktifkan Row Level Security (RLS)
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Hapus kebijakan lama jika ada
DROP POLICY IF EXISTS "Allow public SELECT on uploads" ON uploads;
DROP POLICY IF EXISTS "Allow public INSERT on uploads" ON uploads;
DROP POLICY IF EXISTS "Allow public UPDATE on uploads" ON uploads;
DROP POLICY IF EXISTS "Allow public DELETE on uploads" ON uploads;

-- Buat Kebijakan Akses
CREATE POLICY "Allow public SELECT on uploads" ON uploads 
    FOR SELECT 
    TO anon, authenticated 
    USING (true);

CREATE POLICY "Allow public INSERT on uploads" ON uploads 
    FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (true);

CREATE POLICY "Allow public UPDATE on uploads" ON uploads 
    FOR UPDATE 
    TO anon, authenticated 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public DELETE on uploads" ON uploads 
    FOR DELETE 
    TO anon, authenticated 
    USING (true);


-- ==========================================
-- 4. STORAGE: uploads bucket setup & policies
-- ==========================================

-- Buat bucket uploads jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Hapus kebijakan lama jika ada
DROP POLICY IF EXISTS "Allow public SELECT on storage uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public INSERT on storage uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public UPDATE on storage uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public DELETE on storage uploads" ON storage.objects;

-- Buat Kebijakan Akses Storage Bucket 'uploads'
CREATE POLICY "Allow public SELECT on storage uploads" ON storage.objects
    FOR SELECT 
    TO anon, authenticated 
    USING (bucket_id = 'uploads');

CREATE POLICY "Allow public INSERT on storage uploads" ON storage.objects
    FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Allow public UPDATE on storage uploads" ON storage.objects
    FOR UPDATE 
    TO anon, authenticated 
    USING (bucket_id = 'uploads')
    WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Allow public DELETE on storage uploads" ON storage.objects
    FOR DELETE 
    TO anon, authenticated 
    USING (bucket_id = 'uploads');
