import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables FIRST
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        process.env[key] = val;
      }
    });
  }
} catch (e) {
  console.error('Error loading env:', e.message);
}

const createDocumentId = (puskesmas, documentType, month, year) => {
  const seed = `${puskesmas}|${documentType}|${month}|${year}`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `doc${(hash >>> 0).toString(36)}`;
};

const documentTypes = [
  'Laporan kegiatan edukasi/penyuluhan & senam Prolanis',
  'Fotocopy materi yang disampaikan',
  'Daftar hadir peserta',
  'Foto kegiatan edukasi (penyuluhan) & senam',
  'Full vidio kegiatan yang di upload di IG/youtube FKTP',
  'Kuitansi jasa instruktur/narasumber',
  'Nota pembelian konsumsi',
  'Kuitansi pembelian konsumsi',
  'Kuitansi total tagihan',
  'Fotocopy proposal kegiatan tahun 2025',
  'Formulir Pengajuan Klaim (FPK)',
  'Berita acara serah terima klaim',
  'Surat pengajuan klaim',
  'Surat tanggung jawab mutlak bermaterai',
];

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const puskesmasList = [
  'Mulia Hati 1', 'Mulia Hati 2',
  'Budi Mulia 1', 'Budi Mulia 2',
  'Harapan Kasih 1', 'Harapan Kasih 2',
  'Sentosa 1', 'Sentosa 2',
  'Citra Medika 1', 'Citra Medika 2',
  'Sehat Mandiri 1', 'Sehat Mandiri 2'
];

async function main() {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE || process.env.VITE_SUPABASE_SERVICE_ROLE || process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.error('Missing Supabase credentials in .env.local!');
    process.exit(1);
  }
  
  const supabase = createClient(url, key);
  
  // Hapus semua data uploads lama di Supabase menggunakan loop paginasi agar terhapus 100%
  console.log('Cleaning existing uploads from Supabase for a 100% fresh start...');
  let hasMoreToDelete = true;
  let totalDeleted = 0;
  while (hasMoreToDelete) {
    const { data, error } = await supabase.from('uploads').select('id').limit(500);
    if (error) {
      console.warn('Gagal membaca data untuk dibersihkan:', error.message);
      break;
    }
    if (data && data.length > 0) {
      const ids = data.map(d => d.id);
      const { error: delError } = await supabase.from('uploads').delete().in('id', ids);
      if (delError) {
        console.warn('Gagal menghapus batch data:', delError.message);
        break;
      }
      totalDeleted += ids.length;
      console.log(`Berhasil menghapus ${ids.length} baris data lama (Total: ${totalDeleted}).`);
    } else {
      hasMoreToDelete = false;
    }
  }
  console.log('Database uploads selesai dibersihkan.');
  
  console.log('Generating dummy uploads for ALL Puskesmas (2024, 2025, and Jan-Mar 2026)...');
  const uploads = [];
  
  for (const puskesmas of puskesmasList) {
    console.log(`- Generating for: ${puskesmas}`);
    
    // 1. Generate for 2024 (Semua LAYAK)
    for (const month of months) {
      const uploadedAt = `15 ${month} 2024 pukul 10:00 WIB`;
      const verifiedAt = `18 ${month} 2024 pukul 14:00 WIB`;
      
      for (const docType of documentTypes) {
        const docId = createDocumentId(puskesmas, docType, month, '2024');
        const filename = `${docType.toLowerCase().replace(/[\/\s()&]/g, '_')}_2024_${month.toLowerCase()}.pdf`;
        
        uploads.push({
          id: docId,
          filename: docType === 'Full vidio kegiatan yang di upload di IG/youtube FKTP' ? null : filename,
          filetype: docType === 'Full vidio kegiatan yang di upload di IG/youtube FKTP' ? null : 'application/pdf',
          filedata: docType === 'Full vidio kegiatan yang di upload di IG/youtube FKTP' ? null : 'data:application/pdf;base64,JVBERi0xLjQKJ...',
          videolink: docType === 'Full vidio kegiatan yang di upload di IG/youtube FKTP' ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : null,
          puskesmas: puskesmas,
          month: month,
          year: '2024',
          documenttype: docType,
          uploadedat: uploadedAt,
          uploadedby: 'Kanaya Talitakamta',
          status: 'Layak',
          keterangan: 'Dokumen lengkap, jelas, dan sesuai kriteria verifikasi.',
          analysis: 'Layak',
          lastmodified: verifiedAt,
          modifiedby: 'Tabita Antika'
        });
      }
    }
    
    // 2. Generate for 2025 (Bervariasi)
    for (const month of months) {
      const uploadedAt = `12 ${month} 2025 pukul 09:30 WIB`;
      const verifiedAt = `14 ${month} 2025 pukul 11:15 WIB`;
      
      for (const docType of documentTypes) {
        const docId = createDocumentId(puskesmas, docType, month, '2025');
        const filename = `${docType.toLowerCase().replace(/[\/\s()&]/g, '_')}_2025_${month.toLowerCase()}.pdf`;
        const isVideo = docType === 'Full vidio kegiatan yang di upload di IG/youtube FKTP';
        
        let status = 'Layak';
        let keterangan = 'Dokumen lengkap dan sah.';
        let lastModified = verifiedAt;
        let modifiedBy = 'Tabita Antika';
        
        const mIdx = months.indexOf(month);
        const dIdx = documentTypes.indexOf(docType);
        const seedValue = (puskesmas.charCodeAt(0) + mIdx + dIdx) % 10;
        
        if (mIdx >= 4 && mIdx <= 7) {
          if (seedValue === 1 || seedValue === 3) {
            status = 'Pending';
            keterangan = 'Foto/Nota kurang jelas, mohon unggah ulang versi resolusi tinggi.';
          } else if (seedValue === 5) {
            status = 'Tidak Layak';
            keterangan = 'Proposal yang diunggah salah tahun. Harus tahun 2025.';
          }
        } else if (mIdx >= 8) {
          if (seedValue === 2) {
            status = 'Pending';
            keterangan = 'Berkas kurang tanda tangan basah FKTP.';
          } else if (seedValue === 4) {
            status = 'Tidak Layak';
            keterangan = 'Nominal kuitansi tidak cocok dengan nota pembelian.';
          } else if (seedValue === 6 || seedValue === 8) {
            status = 'Menunggu Review';
            keterangan = '';
            lastModified = null;
            modifiedBy = null;
          }
        }
        
        uploads.push({
          id: docId,
          filename: isVideo ? null : filename,
          filetype: isVideo ? null : 'application/pdf',
          filedata: isVideo ? null : 'data:application/pdf;base64,JVBERi0xLjQKJ...',
          videolink: isVideo ? 'https://www.instagram.com/p/sample123/' : null,
          puskesmas: puskesmas,
          month: month,
          year: '2025',
          documenttype: docType,
          uploadedat: uploadedAt,
          uploadedby: 'Ferdyana Nurkamila Putri',
          status: status,
          keterangan: keterangan,
          analysis: status === 'Menunggu Review' ? 'Menunggu Review' : status,
          lastmodified: lastModified,
          modifiedby: modifiedBy
        });
      }
    }

    // 3. Generate for 2026 (Januari - Maret, Bervariasi)
    const months2026 = ['Januari', 'Februari', 'Maret'];
    for (const month of months2026) {
      const uploadedAt = `10 ${month} 2026 pukul 08:45 WIB`;
      const verifiedAt = `12 ${month} 2026 pukul 13:30 WIB`;
      
      for (const docType of documentTypes) {
        const docId = createDocumentId(puskesmas, docType, month, '2026');
        const filename = `${docType.toLowerCase().replace(/[\/\s()&]/g, '_')}_2026_${month.toLowerCase()}.pdf`;
        const isVideo = docType === 'Full vidio kegiatan yang di upload di IG/youtube FKTP';
        
        let status = 'Layak';
        let keterangan = 'Berkas lengkap, sah dan disetujui.';
        let lastModified = verifiedAt;
        let modifiedBy = 'Tabita Antika';
        
        const mIdx = months2026.indexOf(month);
        const dIdx = documentTypes.indexOf(docType);
        
        // Pola penyebaran status agar variatif per Puskesmas dan tipe dokumen
        const seedValue = (puskesmas.charCodeAt(puskesmas.length - 1) + mIdx + dIdx) % 12;
        
        if (seedValue === 1 || seedValue === 4) {
          status = 'Pending';
          keterangan = 'Foto pendukung kegiatan blur atau tidak fokus. Mohon upload ulang.';
        } else if (seedValue === 2 || seedValue === 6) {
          status = 'Tidak Layak';
          keterangan = 'Kuitansi total tagihan tidak menyertakan materai Rp10.000.';
        } else if (seedValue === 3 || seedValue === 7 || seedValue === 9) {
          status = 'Menunggu Review';
          keterangan = '';
          lastModified = null;
          modifiedBy = null;
        }
        
        uploads.push({
          id: docId,
          filename: isVideo ? null : filename,
          filetype: isVideo ? null : 'application/pdf',
          filedata: isVideo ? null : 'data:application/pdf;base64,JVBERi0xLjQKJ...',
          videolink: isVideo ? 'https://www.youtube.com/watch?v=kJQP7kiw5Fk' : null,
          puskesmas: puskesmas,
          month: month,
          year: '2026',
          documenttype: docType,
          uploadedat: uploadedAt,
          uploadedby: 'Kanaya Talitakamta',
          status: status,
          keterangan: keterangan,
          analysis: status === 'Menunggu Review' ? 'Menunggu Review' : status,
          lastmodified: lastModified,
          modifiedby: modifiedBy
        });
      }
    }
  }
  
  console.log(`Generated total of ${uploads.length} dummy upload entries across 2024, 2025, and Jan-Mar 2026.`);
  
  // 4. Insert into Supabase
  console.log('Inserting/updating uploads in Supabase in batches of 150...');
  
  const BATCH_SIZE = 150;
  let batchCount = 1;
  for (let i = 0; i < uploads.length; i += BATCH_SIZE) {
    const batch = uploads.slice(i, i + BATCH_SIZE);
    
    const { error } = await supabase.from('uploads').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`Error inserting batch ${batchCount}:`, error.message);
      process.exit(1);
    }
    console.log(`Batch ${batchCount} inserted successfully (${batch.length} rows).`);
    batchCount++;
  }
  
  console.log('=== ALL DATA SEEDING COMPLETED SUCCESSFULLY! ===');
  process.exit(0);
}

main();
