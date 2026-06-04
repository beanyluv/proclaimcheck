import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../utils/userData';
import { getDocs, syncDocs } from '../utils/documentData';

export default function LaporanPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const [viewMode, setViewMode] = useState<'Bulanan' | 'Tahunan'>('Bulanan');
  const [selectedPuskesmas, setSelectedPuskesmas] = useState('Semua Puskesmas');
  
  // Set default filter ke tahun 2026 agar selaras dengan beranda
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('Semua Bulan');
  const [currentPage, setCurrentPage] = useState(1);
  const [allDocuments, setAllDocuments] = useState(getDocs());
  const rowsPerPage = 5;
  const [isVerifikasiExpanded, setIsVerifikasiExpanded] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/');
      return;
    }
    if (user.role !== 'Administrasi Klaim') {
      navigate('/beranda');
    }
  }, [navigate]);

  useEffect(() => {
    const sync = async () => {
      const docs = await syncDocs();
      setAllDocuments(docs);
    };
    sync();
    const interval = setInterval(sync, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentUser = getCurrentUser();

  const monthMap: Record<string, string> = {
    Januari: '01', Februari: '02', Maret: '03', April: '04', Mei: '05', Juni: '06',
    Juli: '07', Agustus: '08', September: '09', Oktober: '10', November: '11', Desember: '12',
  };

  const uploadedDocuments = allDocuments.filter(doc => {
    // Tampilkan dokumen yang:
    // 1. Sudah di-upload (punya uploadedAt), ATAU
    // 2. Sudah dianalisis (punya status), ATAU  
    // 3. Punya lastModified (sudah diverifikasi)
    return doc.uploadedAt || doc.status || doc.lastModified;
  });

  // Status kelompok berdasarkan 14 dokumen wajib per puskesmas per bulan/tahun
  // Rule: 
  // 1. Jika SEMUA dokumen layak → "Layak" (Terverifikasi)
  // 2. Jika dokumen ditolak dominan (>= 3 berkas) → "Tidak Layak"
  // 3. Jika berkas layak mayoritas (>= 10 berkas) dan ditolak sedikit (<= 2) → "Layak"
  // 4. Jika di antaranya (banyak pending / belum dinilai) → "Menunggu Review"
  const getGroupStatus = (docs: any[]) => {
    const totalDocs = docs.length;
    const hasTidakLayak = docs.some(doc => doc.status === 'Tidak Layak');
    const hasPendingOrUnverified = docs.some(doc => doc.status === 'Pending' || doc.status === 'Menunggu Review' || !doc.status);

    // 1. Jika ada salah satu tidak layak -> Tidak Layak
    if (hasTidakLayak) {
      return 'Tidak Layak';
    }

    // 2. Jika berkas belum lengkap (< 14) atau ada yang pending/belum dinilai -> Menunggu Review
    if (totalDocs < 14 || hasPendingOrUnverified) {
      return 'Menunggu Review';
    }

    // 3. Jika 14 berkas lengkap dan semuanya Layak -> Layak
    return 'Layak';
  };

  // Helper untuk parse waktu dari format "25 Mei 2026, 12:16 WIB"
  const parseWaktu = (waktuStr: string) => {
    if (!waktuStr) return { full: '', jam: '' };
    const parts = waktuStr.split(', ');
    return { full: waktuStr, jam: parts[1] ?? '' };
  };

  // Helper untuk membandingkan waktu (2 format: "25 Mei 2026, 12:16 WIB")
  const getMostRecentTime = (time1: string, time2: string) => {
    if (!time1) return time2;
    if (!time2) return time1;
    // Extract tanggal-jam dari kedua string untuk dibanding
    try {
      const t1 = time1.replace(' WIB', '');
      const t2 = time2.replace(' WIB', '');
      return t2 > t1 ? time2 : time1;
    } catch {
      return time1;
    }
  };

  const createGroupKey = (puskesmas: string, month: string, year: string) => {
    if (viewMode === 'Tahunan') {
      return `${puskesmas}-${year}`.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }
    return `${puskesmas}-${month}-${year}`.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  };

  const generateReportCode = (puskesmas: string, month: string, year: string) => {
    const seed = viewMode === 'Tahunan' ? `${puskesmas}-${year}` : `${puskesmas}-${month}-${year}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    const code = Math.abs(hash % 9000) + 1000;
    if (viewMode === 'Tahunan') {
      return `VX-${String(code).padStart(4, '0')}.Y`;
    }
    const monthIndex = Object.keys(monthMap).indexOf(month) + 1 || 1;
    return `VX-${String(code).padStart(4, '0')}.${monthIndex}`;
  };

  const groupedLaporanData = Object.values(uploadedDocuments.reduce((groups: Record<string, any>, doc: any) => {
    const key = createGroupKey(doc.puskesmas, doc.month, doc.year);
    const monthNumber = monthMap[doc.month] ?? '01';
    const tanggalRaw = `${doc.year}-${monthNumber}-01`;
    const tanggal = viewMode === 'Tahunan' ? `Tahun ${doc.year}` : `${doc.month} ${doc.year}`;

    // Gunakan lastModified (waktu analisis) jika ada, jika tidak gunakan uploadedAt
    const relevantTime = doc.lastModified || doc.uploadedAt || '';

    if (!groups[key]) {
      groups[key] = {
        id: generateReportCode(doc.puskesmas, doc.month, doc.year),
        tanggal,
        tanggalRaw,
        year: doc.year,
        month: doc.month,
        latestUploadedAt: relevantTime,
        latestModifiedTime: doc.lastModified || '',
        puskesmas: doc.puskesmas,
        docs: [doc],
      };
    } else {
      groups[key].docs.push(doc);
      // Ambil waktu terbaru (bisa upload atau analisis)
      const currentRelevant = doc.lastModified || doc.uploadedAt || '';
      if (currentRelevant) {
        groups[key].latestUploadedAt = getMostRecentTime(groups[key].latestUploadedAt, currentRelevant);
        if (doc.lastModified) {
          groups[key].latestModifiedTime = getMostRecentTime(groups[key].latestModifiedTime, doc.lastModified);
        }
      }
    }

    return groups;
  }, {} as Record<string, any>)).map(group => ({
    ...group,
    status: getGroupStatus(group.docs),
    totalDocuments: group.docs.length,
    layakCount: group.docs.filter((doc: any) => doc.status === 'Layak').length,
    pendingCount: group.docs.filter((doc: any) => doc.status !== 'Layak' && doc.status !== 'Tidak Layak').length,
    rejectedCount: group.docs.filter((doc: any) => doc.status === 'Tidak Layak').length,
    waktu: parseWaktu(group.latestModifiedTime || group.latestUploadedAt).jam,
  }));

  const filteredData = groupedLaporanData.filter(item => {
    const matchPuskesmas = selectedPuskesmas === 'Semua Puskesmas' || item.puskesmas === selectedPuskesmas;
    const matchYear = item.year === selectedYear;
    const matchMonth = viewMode === 'Tahunan' || selectedMonth === 'Semua Bulan' || item.month === selectedMonth;

    return matchPuskesmas && matchYear && matchMonth;
  });

  // Hitung status berdasarkan alur dokumen terunggah
  // Total Diproses = semua kelompok yang sudah upload (minimal 1 dokumen)
  const totalDiproses = filteredData.length;
  const terverifikasi = filteredData.filter(item => item.status === 'Layak').length;
  const menungguReview = filteredData.filter(item => item.status === 'Menunggu Review').length;
  const ditolak = filteredData.filter(item => item.status === 'Tidak Layak').length;

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  const handlePuskesmasChange = (value: string) => { setSelectedPuskesmas(value); setCurrentPage(1); };
  const handleYearChange = (value: string) => { setSelectedYear(value); setCurrentPage(1); };
  const handleMonthChange = (value: string) => { setSelectedMonth(value); setCurrentPage(1); };

  // ✅ REAL CSV EXPORT
  const handleExportCSV = () => {
    const headers = ['No', 'ID Verifikasi', 'Periode', 'Waktu', 'Nama Puskesmas', 'Status'];
    const rows = filteredData.map((item, index) => [
      index + 1,
      item.id,
      item.tanggal,
      item.waktu || '-',
      item.puskesmas,
      item.status || 'Belum Diverifikasi'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const BOM = '\uFEFF'; // UTF-8 BOM agar Excel baca dengan benar
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toISOString().slice(0, 10);
    link.download = `laporan-proclaim-check-${viewMode.toLowerCase()}-${selectedYear}-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusStyle = (status: string) => {
    if (status === 'Layak') return 'bg-[#d9ece3] text-[#1a5c52] border border-[#8cc8be]';
    if (status === 'Menunggu Review') return 'bg-[#fef9e8] text-[#c79b0c] border border-[#f5c57a]';
    if (status === 'Tidak Layak') return 'bg-[#fef0f0] text-[#c70c0c] border border-[#f0a8a8]';
    return 'bg-gray-100 text-gray-500 border border-gray-200';
  };

  const sidebarNavItem = (path: string, label: string) => (
    <div
      onClick={() => navigate(path)}
      className={`px-3 py-2 rounded cursor-pointer transition-colors mb-1 ${
        isActive(path) ? 'bg-white bg-opacity-20' : 'hover:bg-[#ffffff10]'
      }`}
    >
      <p className={`font-['Mukta'] text-[15px] ${isActive(path) ? 'text-white font-semibold' : 'text-white'}`}>
        {label}
      </p>
    </div>
  );

  return (
    <>
          {/* Filter Row */}
          <div className="bg-white rounded-[10px] p-4 mb-4 flex items-center gap-3 flex-wrap shadow-sm">
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              {(['Bulanan', 'Tahunan'] as const).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`px-4 py-1.5 rounded-md font-['Mukta'] text-[13px] font-medium transition-all ${viewMode === mode ? 'bg-[#1f6f5f] text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
                  {mode}
                </button>
              ))}
            </div>
            <select value={selectedPuskesmas} onChange={e => handlePuskesmasChange(e.target.value)}
              aria-label="Pilih Puskesmas"
              className="border border-[#d0e2de] rounded-lg px-3 py-2 font-['Mukta'] text-[13px] focus:outline-none focus:border-[#1f6f5f] bg-white">
              <option>Semua Puskesmas</option>
              {['Mulia Hati 1','Mulia Hati 2','Budi Mulia 1','Budi Mulia 2','Harapan Kasih 1','Harapan Kasih 2','Sentosa 1','Sentosa 2','Citra Medika 1','Citra Medika 2','Sehat Mandiri 1','Sehat Mandiri 2'].map(p => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <select value={selectedYear} onChange={e => handleYearChange(e.target.value)}
              title="Pilih Tahun"
              className="border border-[#d0e2de] rounded-lg px-3 py-2 font-['Mukta'] text-[13px] focus:outline-none focus:border-[#1f6f5f] bg-white">
              <option value="2024">Tahun 2024</option>
              <option value="2025">Tahun 2025</option>
              <option value="2026">Tahun 2026</option>
            </select>
            {viewMode === 'Bulanan' && (
              <select value={selectedMonth} onChange={e => handleMonthChange(e.target.value)}
                title="Pilih Bulan"
                className="border border-[#d0e2de] rounded-lg px-3 py-2 font-['Mukta'] text-[13px] focus:outline-none focus:border-[#1f6f5f] bg-white">
                <option value="Semua Bulan">Semua Bulan</option>
                {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
            <div className="ml-auto">
              {/* ✅ Real CSV Export Button */}
              <button onClick={handleExportCSV}
                disabled={filteredData.length === 0}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors font-['Mukta'] text-[13px] font-medium ${filteredData.length === 0 ? 'bg-[#b9c6bf] text-white cursor-not-allowed' : 'bg-[#1f6f5f] text-white hover:bg-[#165449]'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Simpan .csv
              </button>
            </div>
          </div>

          {filteredData.length === 0 && (
            <div className="mb-4 rounded-[10px] border border-[#f5ecd6] bg-[#fff8e5] px-4 py-3 text-[#7c6a38] shadow-sm">
              Data laporan belum tersedia. Laporan berkas belum diisi atau data dokumen telah dihapus.
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            {[
              { label: 'Total Diproses', value: totalDiproses },
              { label: 'Terverifikasi', value: terverifikasi },
              { label: 'Menunggu Review', value: menungguReview },
              { label: 'Ditolak', value: ditolak },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-[10px] p-5 text-center shadow-sm">
                <p className="text-[#818181] text-[15px] font-['Mukta'] font-medium mb-1">{stat.label}</p>
                <p className="text-[#818181] text-[42px] font-['Mukta'] font-medium leading-tight">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-[10px] overflow-hidden shadow-sm">
            <div className="bg-[#f7fbfa] border-b border-[#d0e2de] grid grid-cols-12 py-3 px-4">
              <div className="col-span-1 text-[#5f9990] font-['Mukta'] font-bold text-[13px] text-center">No</div>
              <div className="col-span-2 text-[#5f9990] font-['Mukta'] font-bold text-[13px] text-center">ID</div>
              <div className="col-span-2 text-[#5f9990] font-['Mukta'] font-bold text-[13px] text-center">Periode</div>
              <div className="col-span-2 text-[#5f9990] font-['Mukta'] font-bold text-[13px] text-center">Waktu</div>
              <div className="col-span-3 text-[#5f9990] font-['Mukta'] font-bold text-[13px] text-center">Puskesmas</div>
              <div className="col-span-2 text-[#5f9990] font-['Mukta'] font-bold text-[13px] text-center">Status</div>
            </div>
            {filteredData.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-400 font-['Mukta'] text-[15px]">Tidak ada data</p>
              </div>
            ) : (
              paginatedData.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 py-3 px-4 border-b border-[#f0f0f0] hover:bg-[#f9fdfc] transition-colors">
                  <div className="col-span-1 text-center font-['Mukta'] text-[13px] text-[#5f9990]">{startIndex + index + 1}</div>
                  <div className="col-span-2 text-center font-['Mukta'] text-[13px] text-[#1a4a43] font-medium">{item.id}</div>
                  <div className="col-span-2 text-center font-['Mukta'] text-[13px] text-[#5f9990]">{item.tanggal}</div>
                  <div className="col-span-2 text-center font-['Mukta'] text-[12px] text-[#5f9990] font-mono">{item.waktu}</div>
                  <div className="col-span-3 text-center font-['Mukta'] text-[13px] text-[#1a4a43]">{item.puskesmas}</div>
                  <div className="col-span-2 flex justify-center">
                    <span className={`px-3 py-1 rounded-full font-['Mukta'] text-[12px] font-medium ${getStatusStyle(item.status)}`}>
                      {item.status || 'Belum'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="font-['Mukta'] text-[13px] text-[#5f9990]">
                Menampilkan {startIndex + 1}–{Math.min(startIndex + rowsPerPage, filteredData.length)} dari {filteredData.length} data
              </p>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-[#d0e2de] font-['Mukta'] text-[13px] disabled:opacity-40 hover:bg-gray-50 transition-colors">
                  ‹ Sebelumnya
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg font-['Mukta'] text-[13px] transition-colors ${currentPage === p ? 'bg-[#1f6f5f] text-white' : 'border border-[#d0e2de] hover:bg-gray-50'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-[#d0e2de] font-['Mukta'] text-[13px] disabled:opacity-40 hover:bg-gray-50 transition-colors">
                  Berikutnya ›
                </button>
              </div>
            </div>
          )}
    </>
  );
}
