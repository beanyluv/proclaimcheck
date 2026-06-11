import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from '../utils/subdomain';
import { getDocs, saveDocs, addRiwayat, genDocs, syncDocs, documentTypes } from '../utils/documentData';
import { getCurrentUser } from '../utils/userData';
import { getUploadedFilesFromServer, uploadFileToServer } from '../utils/serverApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { analyzeDocumentImage, AIAnalysisResult } from '../utils/aiDetector';

const REQUIRED_DOC_COUNT = 14;

const getStatusStyling = (status: string) => {
  switch (status) {
    case 'Layak': return { statusBg: 'bg-[#e0f2ef]', statusText: 'text-[#1a5c52]', analysisBg: 'bg-[#e0f2ef]', analysisText: 'text-[#1a5c52]', dotColor: 'bg-[#2e9e6e]' };
    case 'Menunggu Review':
    case 'Pending': return { statusBg: 'bg-[#fef9e8]', statusText: 'text-[#c79b0c]', analysisBg: 'bg-[#fef9e8]', analysisText: 'text-[#c79b0c]', dotColor: 'bg-[#e6a91f]' };
    case 'Tidak Layak': return { statusBg: 'bg-[#fef0f0]', statusText: 'text-[#c70c0c]', analysisBg: 'bg-[#fef0f0]', analysisText: 'text-[#c70c0c]', dotColor: 'bg-[#e61f1f]' };
    default: return { statusBg: '', statusText: '', analysisBg: '', analysisText: '', dotColor: '' };
  }
};

export default function VerifikasiBerkasPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const currentUser = getCurrentUser();

  // Search state — pencarian hanya aktif setelah tombol "Cari" diklik
  const [puskesmasInput, setPuskesmasInput] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [searchedPuskesmas, setSearchedPuskesmas] = useState('');
  const [searchedMonth, setSearchedMonth] = useState('');
  const [searchedYear, setSearchedYear] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [selectedPuskesmasForView, setSelectedPuskesmasForView] = useState('');
  const [isVerifikasiExpanded, setIsVerifikasiExpanded] = useState(true);
  const [isPengaturanExpanded, setIsPengaturanExpanded] = useState(false);

  // Popup state
  const [showPopup, setShowPopup] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

  const [allDocuments, setAllDocuments] = useState(getDocs());
  const uploadedDocuments = useMemo(() => allDocuments.filter((doc: any) => doc.uploadedAt), [allDocuments]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/');
      return;
    }
    if (user.role !== 'Administrasi Klaim' && user.role !== 'Petugas Puskesmas') {
      navigate('/beranda');
    }
  }, [navigate]);

  useEffect(() => {
    const user = getCurrentUser();
    if (user && user.role === 'Petugas Puskesmas' && user.puskesmas) {
      const normalized = user.puskesmas.replace(/^Puskesmas\s+/i, '').trim();
      setPuskesmasInput(normalized);
      setSearchedPuskesmas(normalized);
      setHasSearched(true);
    }
  }, []);

  useEffect(() => {
    const sync = async () => {
      const docs = await syncDocs();
      setAllDocuments(docs);
    };
    sync();
    const interval = setInterval(sync, 5000);
    return () => clearInterval(interval);
  }, []);

  const puskesmasList = ['Mulia Hati 1','Mulia Hati 2','Budi Mulia 1','Budi Mulia 2','Harapan Kasih 1','Harapan Kasih 2','Sentosa 1','Sentosa 2','Citra Medika 1','Citra Medika 2','Sehat Mandiri 1','Sehat Mandiri 2'];
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const years = ['2024','2025','2026'];

  const filteredSuggestions = puskesmasList.filter(n => n.toLowerCase().includes(puskesmasInput.toLowerCase()));

  // ✅ Pencarian hanya aktif setelah klik tombol Cari
  const handleSearch = () => {
    setSearchedPuskesmas(puskesmasInput);
    setSearchedMonth(selectedMonth);
    setSearchedYear(selectedYear);
    setHasSearched(true);
    setSelectedPuskesmasForView('');
    setShowSuggestions(false);
  };

  const handleViewDocument = (doc: any) => {
    setSelectedDocument({ ...doc });
    setSelectedStatus(doc.status || '');
    
    // Load keterangan from doc.keterangan, or fall back to doc.analysis if it is a real notes string
    const initialKeterangan = doc.keterangan || 
      (doc.analysis && doc.analysis !== 'Menunggu Review' && doc.analysis !== 'Lagi Proses Review' && doc.analysis !== 'Belum Diunggah' ? doc.analysis : '') || 
      '';
    setKeterangan(initialKeterangan);
    setShowDocumentPreview(false);
    setShowPopup(true);

    // Memicu analisis ProClaim AI HANYA jika pengguna memiliki role 'Administrasi Klaim' dan dokumen berjenis 'Laporan kegiatan edukasi/penyuluhan & senam Prolanis'
    if (currentUser?.role === 'Administrasi Klaim' && doc.name === 'Laporan kegiatan edukasi/penyuluhan & senam Prolanis') {
      setAiResult(null); // Reset hasil analisis sebelumnya
      analyzeDocumentImage(doc.fileData, doc.uploadedFileName, (result) => {
        setAiResult(result);
        
        // SECURE PERSISTENCE: Automatically persist the AI analysis results in the database
        // if the document is still unverified and doesn't have a real analysis note yet.
        const currentDocs = getDocs();
        const dIdx = currentDocs.findIndex(d => d.id === doc.id);
        if (dIdx !== -1) {
          const currentDoc = currentDocs[dIdx];
          const isUnverified = !currentDoc.status || currentDoc.status === 'Menunggu Review';
          const hasNoRealAnalysis = !currentDoc.analysis || currentDoc.analysis === 'Menunggu Review' || currentDoc.analysis === 'Lagi Proses Review';
          
          if (isUnverified && hasNoRealAnalysis) {
            const styling = getStatusStyling(result.recommendation);
            const updatedDoc = {
              ...currentDoc,
              analysis: result.notes,
              ...styling
            };
            currentDocs[dIdx] = updatedDoc;
            saveDocs(currentDocs);
            setAllDocuments(currentDocs);
            
            // Map to server schema
            const payload = {
              id: updatedDoc.id,
              fileName: updatedDoc.uploadedFileName || null,
              fileData: updatedDoc.fileData || null,
              fileType: updatedDoc.fileType || null,
              videoLink: updatedDoc.videoLink || null,
              puskesmas: updatedDoc.puskesmas,
              month: updatedDoc.month,
              year: updatedDoc.year,
              documentType: updatedDoc.name,
              uploadedAt: updatedDoc.uploadedAt,
              uploadedBy: updatedDoc.uploadedBy || null,
              status: updatedDoc.status || null,
              keterangan: updatedDoc.keterangan || null,
              analysis: updatedDoc.analysis || null,
              lastModified: updatedDoc.lastModified || null,
              modifiedBy: updatedDoc.modifiedBy || null,
            };
            
            uploadFileToServer(payload).catch(err => {
              console.warn('Gagal menyimpan hasil analisis otomatis AI ke server:', err);
            });
          }
        }
      });
    } else {
      setAiResult(null);
    }
  };

  const handleSaveDocument = () => {
    const now = new Date();
    const dateTimeString = now.toLocaleString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
    }) + ' WIB';

    const newDocuments = [...allDocuments];
    const docIndex = newDocuments.findIndex(d => d.id === selectedDocument.id);

    if (docIndex !== -1) {
      const previousAnalysis = newDocuments[docIndex]?.analysis;
      const isPreviousAnalysisReal = previousAnalysis && previousAnalysis !== 'Menunggu Review' && previousAnalysis !== 'Lagi Proses Review';
      const analysisText = keterangan?.trim() ? keterangan : (isPreviousAnalysisReal ? previousAnalysis : (selectedStatus || ''));

      const styling = selectedStatus ? getStatusStyling(selectedStatus) : {
        statusBg: newDocuments[docIndex].statusBg,
        statusText: newDocuments[docIndex].statusText,
        analysisBg: newDocuments[docIndex].analysisBg,
        analysisText: newDocuments[docIndex].analysisText,
        dotColor: newDocuments[docIndex].dotColor
      };

      // Jika ada perubahan status, catat ke riwayat
      if (selectedStatus && selectedStatus !== newDocuments[docIndex].status) {
        const doc = newDocuments[docIndex];
        addRiwayat({
          waktu: dateTimeString,
          user: currentUser?.nama || 'Pengguna',
          role: currentUser?.role || 'Pengguna',
          action: 'Analisis',
          kategori: 'Verifikasi Berkas',
          pesan: `Menganalisis dokumen "${doc.name}" untuk ${doc.puskesmas}, ${doc.month} ${doc.year} → Status: ${selectedStatus}`,
          docId: doc.id,
          puskesmas: doc.puskesmas,
        });
      }

      newDocuments[docIndex] = {
        ...newDocuments[docIndex],
        status: selectedStatus || '',
        keterangan: keterangan || '',
        analysis: analysisText,
        lastModified: selectedStatus ? dateTimeString : newDocuments[docIndex].lastModified,
        modifiedBy: selectedStatus ? (currentUser?.nama || 'Admin') : newDocuments[docIndex].modifiedBy,
        ...styling
      };
      setAllDocuments(newDocuments);
      const updatedDoc = newDocuments[docIndex];

      // CRITICAL PAYLOAD MAPPING: Map to server API schema so that it doesn't fail with 400 Bad Request
      const payload = {
        id: updatedDoc.id,
        fileName: updatedDoc.uploadedFileName || null,
        fileData: updatedDoc.fileData || null,
        fileType: updatedDoc.fileType || null,
        videoLink: updatedDoc.videoLink || null,
        puskesmas: updatedDoc.puskesmas,
        month: updatedDoc.month,
        year: updatedDoc.year,
        documentType: updatedDoc.name, // Map name to documentType
        uploadedAt: updatedDoc.uploadedAt,
        uploadedBy: updatedDoc.uploadedBy || null,
        status: updatedDoc.status || null,
        keterangan: updatedDoc.keterangan || null,
        analysis: updatedDoc.analysis || null,
        lastModified: updatedDoc.lastModified || null,
        modifiedBy: updatedDoc.modifiedBy || null,
      };

      // Send update to server database
      uploadFileToServer(payload).catch(err => {
        console.warn('Gagal menyelaraskan status dokumen ke server:', err);
      });
    }
    setShowPopup(false);
    setSelectedDocument(null);
    setSelectedStatus('');
    setKeterangan('');
  };

  // Filter berdasarkan hasil pencarian (bukan input real-time)
  const documents = useMemo(() =>
    uploadedDocuments.filter(doc => {
      const matchPuskesmas = (!searchedPuskesmas || doc.puskesmas.toLowerCase().includes(searchedPuskesmas.toLowerCase())) &&
                             (!selectedPuskesmasForView || doc.puskesmas === selectedPuskesmasForView);
      const matchMonth = !searchedMonth || searchedMonth === 'Bulan' || doc.month === searchedMonth;
      const matchYear = !searchedYear || searchedYear === 'Tahun' || doc.year === searchedYear;
      return matchPuskesmas && matchMonth && matchYear;
    }),
    [uploadedDocuments, searchedPuskesmas, selectedPuskesmasForView, searchedMonth, searchedYear]
  );

  // Stats berdasarkan hasil pencarian
  const berkasLayak = documents.filter(d => d.status === 'Layak').length;
  const pending = documents.filter(d => d.status === 'Pending' || d.status === 'Menunggu Review' || !d.status).length;
  const tidakLayak = documents.filter(d => d.status === 'Tidak Layak').length;

  // Per-puskesmas summary
  const puskesmasSummary = useMemo(() =>
    puskesmasList.map(pName => {
      const docs = uploadedDocuments.filter(d => {
        const mp = d.puskesmas === pName;
        const mm = !searchedMonth || searchedMonth === 'Bulan' || d.month === searchedMonth;
        const my = !searchedYear || searchedYear === 'Tahun' || d.year === searchedYear;
        return mp && mm && my;
      });
      const layakCount = docs.filter(d => d.status === 'Layak').length;
      const pendingCount = docs.filter(d => d.status === 'Pending' || d.status === 'Menunggu Review' || !d.status).length;
      const tidakLayakCount = docs.filter(d => d.status === 'Tidak Layak').length;
      const verified = layakCount + pendingCount + tidakLayakCount;
      // ✅ Warning jika berkas < 14 atau tidak semua terverifikasi
      const hasWarning = docs.length < REQUIRED_DOC_COUNT || verified < docs.length;
      return { name: pName, total: docs.length, layak: layakCount, pending: pendingCount, tidakLayak: tidakLayakCount, verified, hasWarning };
    }),
    [allDocuments, searchedMonth, searchedYear]
  );

  // Documents for puskesmas detail view (check list of all 14 types)
  const puskesmasDetailDocs = useMemo(() => {
    if (!selectedPuskesmasForView) return [];
    
    // Find uploaded documents for this Puskesmas, month, and year
    const uploadedDocsForPeriod = allDocuments.filter(d => {
      const mp = d.puskesmas === selectedPuskesmasForView;
      const mm = !searchedMonth || searchedMonth === 'Bulan' || d.month === searchedMonth;
      const my = !searchedYear || searchedYear === 'Tahun' || d.year === searchedYear;
      return mp && mm && my && d.uploadedAt;
    });

    // Match all 14 types to build the complete checklist
    return documentTypes.map((docType, idx) => {
      const found = uploadedDocsForPeriod.find(d => d.name === docType.name);
      if (found) {
        // Apabila sudah diunggah, keterangan di status kelayakan bilangnya "Lagi Proses Review"
        // jika statusnya masih "Menunggu Review" atau belum dinilai (belum ada status)
        let displayAnalysis = found.analysis || '';
        let styling = {};
        
        if (!found.status || found.status === 'Menunggu Review') {
          if (!displayAnalysis || displayAnalysis === 'Menunggu Review' || displayAnalysis === 'Lagi Proses Review') {
            displayAnalysis = 'Lagi Proses Review';
            styling = {
              analysisBg: 'bg-[#fef9e8]',
              analysisText: 'text-[#c79b0c]',
              dotColor: 'bg-[#e6a91f]'
            };
          } else {
            // Styling dynamically based on the stored AI analysis content
            const isLayak = displayAnalysis.includes('lengkap') || displayAnalysis.includes('Layak') || (!displayAnalysis.includes('⚠️') && !displayAnalysis.includes('KURANG'));
            const isTidakLayak = displayAnalysis.includes('KURANG TANDA TANGAN dan STEMPEL') || displayAnalysis.includes('Tidak Layak');
            
            if (isLayak) {
              styling = {
                analysisBg: 'bg-[#e0f2ef]',
                analysisText: 'text-[#1a5c52]',
                dotColor: 'bg-[#2e9e6e]'
              };
            } else if (isTidakLayak) {
              styling = {
                analysisBg: 'bg-[#fef0f0]',
                analysisText: 'text-[#c70c0c]',
                dotColor: 'bg-[#e61f1f]'
              };
            } else {
              // Pending / Warning stempel
              styling = {
                analysisBg: 'bg-[#fef9e8]',
                analysisText: 'text-[#c79b0c]',
                dotColor: 'bg-[#e6a91f]'
              };
            }
          }
        }
        
        return {
          ...found,
          no: idx + 1,
          analysis: displayAnalysis,
          ...styling
        };
      }

      // Placeholder if not uploaded yet
      return {
        id: `missing-${idx}-${selectedPuskesmasForView}-${searchedMonth}-${searchedYear}`,
        no: idx + 1,
        icon: docType.icon,
        name: docType.name,
        analysis: 'Belum Diunggah',
        status: 'Belum Diunggah',
        statusBg: 'bg-[#fef0f0] border-[#f8d7da]',
        statusText: 'text-[#c70c0c]',
        analysisBg: 'bg-gray-100',
        analysisText: 'text-gray-500',
        dotColor: 'bg-gray-400',
        puskesmas: selectedPuskesmasForView,
        month: searchedMonth || 'Semua Bulan',
        year: searchedYear || 'Semua Tahun',
        uploadedAt: null,
      };
    });
  }, [allDocuments, selectedPuskesmasForView, searchedMonth, searchedYear]);

  // ✅ Warning untuk puskesmas yang sedang dilihat
  const currentPuskesmasWarning = useMemo(() => {
    if (!selectedPuskesmasForView) return null;
    const docs = puskesmasDetailDocs;
    const uploadedCount = docs.filter(d => d.uploadedAt).length;
    const verified = docs.filter(d => d.uploadedAt && d.lastModified && d.status).length;
    const layakCount = docs.filter(d => d.uploadedAt && d.status === 'Layak').length;
    
    if (uploadedCount < REQUIRED_DOC_COUNT) {
      return `⚠️ Berkas belum lengkap: ${uploadedCount} dari ${REQUIRED_DOC_COUNT} jenis berkas diunggah. Harap lengkapi semua berkas yang diperlukan.`;
    }
    if (verified < uploadedCount) {
      return `⚠️ ${uploadedCount - verified} berkas belum diverifikasi. Semua berkas harus diverifikasi sebelum klaim diproses.`;
    }
    if (layakCount < uploadedCount) {
      return `⚠️ Terdapat berkas yang Tidak Layak atau Pending. Klaim tidak dapat diproses sebelum semua berkas dinyatakan Layak.`;
    }
    return null;
  }, [selectedPuskesmasForView, puskesmasDetailDocs]);

  const selectedFileExtension = selectedDocument?.uploadedFileName?.split('.').pop()?.toLowerCase() || '';
  const selectedFileData = selectedDocument?.fileData;
  const selectedFileType = selectedDocument?.fileType || '';
  const isImagePreview = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(selectedFileExtension);
  const isPdfPreview = selectedFileExtension === 'pdf';
  const canPreviewFile = Boolean(selectedFileData && selectedDocument?.uploadedFileName);

  const sidebarNavItem = (path: string, label: string) => (
    <div onClick={() => navigate(path)}
      className={`flex items-center px-3 py-2.5 rounded-lg cursor-pointer mb-1 transition-all duration-200 ${isActive(path) ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'}`}>
      {isActive(path) && <div className="w-1 h-5 bg-white rounded-full mr-2 flex-shrink-0" />}
      <p className={`font-['Mukta'] text-[15px] text-white ${isActive(path) ? 'font-semibold' : ''}`}>{label}</p>
    </div>
  );

  const subNavItem = (path: string, label: string) => (
    <div onClick={() => navigate(path)}
      className={`flex items-center px-3 py-2 rounded-lg cursor-pointer mb-0.5 transition-all duration-200 ${isActive(path) ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'}`}>
      {isActive(path) && <div className="w-1 h-4 bg-white rounded-full mr-2 flex-shrink-0" />}
      <p className={`font-['Mukta'] text-[13px] text-white ${isActive(path) ? 'font-semibold' : 'opacity-80'}`}>{label}</p>
    </div>
  );

  return (
    <>
      {/* ✅ Search bar - data tampil HANYA setelah klik Cari */}
            <div className="bg-white rounded-[10px] p-4 mb-4 shadow-sm">
              <div className="flex gap-3 items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={puskesmasInput}
                    onChange={e => { setPuskesmasInput(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    disabled={currentUser?.role === 'Petugas Puskesmas'}
                    placeholder="Nama Puskesmas..."
                    className="w-full border border-[#d0e2de] rounded-lg px-4 py-2.5 font-['Mukta'] text-[14px] focus:outline-none focus:border-[#1f6f5f] transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  />
                  {showSuggestions && puskesmasInput && filteredSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-[#d0e2de] rounded-lg shadow-lg z-20 mt-1">
                      {filteredSuggestions.map(s => (
                        <div key={s} onClick={() => { setPuskesmasInput(s); setShowSuggestions(false); }}
                          className="px-4 py-2.5 hover:bg-[#f0f8f6] cursor-pointer font-['Mukta'] text-[14px] transition-colors">
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                  className="border border-[#d0e2de] rounded-lg px-3 py-2.5 font-['Mukta'] text-[14px] focus:outline-none focus:border-[#1f6f5f] bg-white">
                  <option value="">Bulan</option>
                  {months.map(m => <option key={m}>{m}</option>)}
                </select>
                <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                  className="border border-[#d0e2de] rounded-lg px-3 py-2.5 font-['Mukta'] text-[14px] focus:outline-none focus:border-[#1f6f5f] bg-white">
                  <option value="">Tahun</option>
                  {years.map(y => <option key={y}>{y}</option>)}
                </select>
                <button onClick={handleSearch}
                  className="flex items-center gap-2 bg-[#1f6f5f] text-white px-5 py-2.5 rounded-lg font-['Mukta'] text-[14px] font-medium hover:bg-[#165449] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Cari
                </button>
              </div>
            </div>

            {/* Stats - hanya tampil setelah search */}
            {hasSearched && (
              <>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[{ label: 'Berkas Layak', val: berkasLayak, color: 'text-[#1f6f5f]' },
                    { label: 'Menunggu Review', val: pending, color: 'text-[#c79b0c]' },
                    { label: 'Tidak Layak', val: tidakLayak, color: 'text-[#c70c0c]' }].map(s => (
                    <div key={s.label} className="bg-white rounded-[10px] p-6 text-center shadow-sm">
                      <p className="text-[#a8a8a8] font-['Mukta'] text-[16px] mb-2">{s.label}</p>
                      <p className={`font-['Mukta'] text-[48px] font-medium ${s.color}`}>{s.val}</p>
                    </div>
                  ))}
                </div>

                {/* ✅ Warning global jika ada puskesmas dengan berkas tidak lengkap */}
                {puskesmasSummary.some(p => p.hasWarning) && !selectedPuskesmasForView && (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="font-['Mukta'] text-[14px] font-semibold text-amber-800">Peringatan Kelengkapan Berkas</p>
                      <p className="font-['Mukta'] text-[13px] text-amber-700 mt-1">
                        {puskesmasSummary.filter(p => p.hasWarning).length} puskesmas memiliki berkas tidak lengkap atau belum sepenuhnya diverifikasi.
                        Setiap puskesmas harus memiliki {REQUIRED_DOC_COUNT} berkas dan semua harus diverifikasi sebelum klaim diproses.
                      </p>
                    </div>
                  </div>
                )}

                {/* ✅ Warning untuk puskesmas yang sedang dilihat */}
                {selectedPuskesmasForView && currentPuskesmasWarning && (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="font-['Mukta'] text-[13px] text-amber-800">{currentPuskesmasWarning}</p>
                  </div>
                )}

                {/* Daftar Puskesmas atau Detail */}
                <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
                  {!selectedPuskesmasForView ? (
                    <>
                      <div className="p-4 border-b border-[#f0f0f0] flex items-center justify-between">
                        <h3 className="font-['Mukta'] font-semibold text-[16px] text-[#1a4a43]">
                          Daftar Puskesmas {searchedPuskesmas && `— "${searchedPuskesmas}"`}
                        </h3>
                        <span className="text-[12px] text-[#5f9990] font-['Mukta']">
                          {searchedMonth || 'Semua Bulan'} {searchedYear || 'Semua Tahun'}
                        </span>
                      </div>
                      {puskesmasSummary
                        .filter(p => !searchedPuskesmas || p.name.toLowerCase().includes(searchedPuskesmas.toLowerCase()))
                        .map(p => (
                        <div key={p.name} onClick={() => setSelectedPuskesmasForView(p.name)}
                          className="flex items-center justify-between p-4 border-b border-[#f8f8f8] hover:bg-[#f9fdfc] cursor-pointer transition-colors group">
                          <div className="flex items-center gap-3">
                            {p.hasWarning && (
                              <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            )}
                            <p className="font-['Mukta'] text-[15px] font-medium text-[#1a4a43] group-hover:text-[#1f6f5f]">{p.name}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex gap-2 text-[12px]">
                              <span className="bg-[#e0f2ef] text-[#1a5c52] px-2.5 py-1 rounded-full font-['Mukta'] font-medium">{p.layak} Layak</span>
                              {p.pending > 0 && <span className="bg-[#fef9e8] text-[#c79b0c] px-2.5 py-1 rounded-full font-['Mukta'] font-medium">{p.pending} Pending</span>}
                              {p.tidakLayak > 0 && <span className="bg-[#fef0f0] text-[#c70c0c] px-2.5 py-1 rounded-full font-['Mukta'] font-medium">{p.tidakLayak} Tidak Layak</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-['Mukta'] text-[13px] text-[#5f9990]">{p.verified}/{p.total} berkas</span>
                              <svg className="w-4 h-4 text-[#5f9990] group-hover:text-[#1f6f5f] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <div className="p-4 border-b border-[#f0f0f0] flex items-center justify-between">
                        <div>
                          {currentUser?.role !== 'Petugas Puskesmas' && (
                            <button onClick={() => setSelectedPuskesmasForView('')}
                              className="flex items-center gap-1 text-[#1f6f5f] font-['Mukta'] text-[13px] hover:underline mb-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                              Kembali ke Daftar Puskesmas
                            </button>
                          )}
                          <h3 className="font-['Mukta'] font-semibold text-[16px] text-[#1a4a43]">Daftar Berkas — {selectedPuskesmasForView}</h3>
                        </div>
                        <span className="bg-[#1f6f5f] text-white px-3 py-1.5 rounded-full font-['Mukta'] text-[12px]">
                          {searchedMonth && searchedYear ? `${searchedMonth} ${searchedYear}` : searchedMonth || searchedYear || 'Semua Periode'}
                        </span>
                      </div>
                      {/* Table header */}
                      <div className="grid grid-cols-12 bg-[#f7fbfa] py-3 px-4 border-b border-[#e8f4f1]">
                        <div className="col-span-1 font-['Mukta'] text-[12px] text-[#5f9990] font-bold"></div>
                        <div className="col-span-4 font-['Mukta'] text-[12px] text-[#5f9990] font-bold uppercase tracking-wide">Jenis Dokumen</div>
                        <div className="col-span-3 font-['Mukta'] text-[12px] text-[#5f9990] font-bold uppercase tracking-wide">Hasil Analisis</div>
                        <div className="col-span-2 font-['Mukta'] text-[12px] text-[#5f9990] font-bold uppercase tracking-wide">Status</div>
                        <div className="col-span-2 font-['Mukta'] text-[12px] text-[#5f9990] font-bold uppercase tracking-wide">Riwayat</div>
                      </div>
                      {puskesmasDetailDocs.map((doc, index) => (
                        <div key={doc.id} className={`grid grid-cols-12 py-3.5 px-4 border-b border-[#f8f8f8] hover:bg-[#fafffe] transition-colors items-center ${!doc.uploadedAt ? 'bg-red-50/20' : ''}`}>
                          <div className="col-span-1 font-['Mukta'] text-[13px] text-[#5f9990]">{index + 1}</div>
                          <div className="col-span-4 flex items-center gap-2">
                            {doc.uploadedAt ? (
                              <button onClick={() => handleViewDocument(doc)}
                                className="flex items-center gap-1.5 bg-[#e0f2ef] text-[#1a5c52] px-3 py-1.5 rounded-lg font-['Mukta'] text-[12px] font-medium hover:bg-[#c5e8e0] transition-colors flex-shrink-0">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Lihat
                              </button>
                            ) : (
                              currentUser?.role === 'Petugas Puskesmas' ? (
                                <button onClick={() => navigate('/unggah-berkas', { state: { documentType: doc.name, month: searchedMonth || selectedMonth, year: searchedYear || selectedYear } })}
                                  className="flex items-center gap-1.5 bg-[#fef9e8] text-[#c79b0c] border border-[#fceebb] px-3 py-1.5 rounded-lg font-['Mukta'] text-[12px] font-medium hover:bg-[#faeed1] transition-colors flex-shrink-0">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                  </svg>
                                  Unggah
                                </button>
                              ) : (
                                <span className="text-[12px] text-gray-400 font-semibold px-3 py-1.5 bg-gray-100 rounded-lg flex-shrink-0">Belum Ada</span>
                              )
                            )}
                            <span className="font-['Mukta'] text-[13px] text-[#1a4a43]">{doc.name}</span>
                          </div>
                          <div className="col-span-3">
                            {doc.analysis ? (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-['Mukta'] text-[12px] ${doc.analysisBg} ${doc.analysisText}`}>
                                {doc.dotColor && <span className={`w-2 h-2 rounded-full ${doc.dotColor}`}></span>}
                                {doc.analysis}
                              </span>
                            ) : (
                              <span className="font-['Mukta'] text-[12px] text-gray-400 italic">Belum diverifikasi</span>
                            )}
                          </div>
                          <div className="col-span-2">
                            {doc.status ? (
                              <span className={`inline-block px-3 py-1 rounded-full font-['Mukta'] text-[12px] font-medium border ${doc.statusBg} ${doc.statusText}`}>
                                {doc.status}
                              </span>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                            )}
                          </div>
                          <div className="col-span-2">
                            {doc.lastModified ? (
                              <div>
                                <p className="font-['Mukta'] text-[12px] text-[#1a4a43] font-medium">{doc.modifiedBy}</p>
                                <p className="font-['Mukta'] text-[11px] text-[#5f9990]">{doc.lastModified}</p>
                              </div>
                            ) : (
                              <span className="font-['Mukta'] text-[12px] text-gray-400 italic">Belum diverifikasi</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {/* ✅ Warning jika < 14 berkas */}
                      {puskesmasDetailDocs.filter(d => d.uploadedAt).length < REQUIRED_DOC_COUNT && (
                        <div className="p-4 bg-amber-50 border-t border-amber-200 flex items-center gap-3">
                          <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <p className="font-['Mukta'] text-[13px] text-amber-800">
                            <strong>Berkas belum lengkap:</strong> Hanya {puskesmasDetailDocs.filter(d => d.uploadedAt).length} dari {REQUIRED_DOC_COUNT} jenis berkas tersedia.
                            Silakan unggah berkas yang kurang melalui menu <span className="font-semibold">Unggah Berkas</span>.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {/* Tampilan awal sebelum search */}
            {!hasSearched && (
              <div className="bg-white rounded-[10px] p-16 text-center shadow-sm">
                <svg className="w-16 h-16 text-[#d0e2de] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="font-['Mukta'] text-[18px] font-semibold text-[#1a4a43] mb-2">Cari Berkas Puskesmas</p>
                <p className="font-['Mukta'] text-[14px] text-[#5f9990]">Masukkan nama puskesmas, bulan, atau tahun lalu klik tombol <strong>Cari</strong></p>
              </div>
            )}

      {/* ✅ Popup Verifikasi */}
      {showPopup && selectedDocument && (
        <Dialog open={showPopup} onOpenChange={setShowPopup}>
          <DialogContent className="bg-white rounded-[16px] w-full max-w-[600px] max-h-[85vh] overflow-y-auto shadow-2xl">
            <DialogHeader className="p-6 border-b border-[#f0f0f0]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle className="font-bold text-[18px] text-[#1a4a43]">Verifikasi Berkas</DialogTitle>
                  <DialogDescription className="text-[13px] text-[#5f9990] mt-1">{selectedDocument.puskesmas} • {selectedDocument.month} {selectedDocument.year}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="p-6">
              <p className="font-['Mukta'] text-[15px] font-medium text-[#1a4a43] mb-4">{selectedDocument.name}</p>

              {/* Preview area */}
              <div className="bg-[#f7fbfa] rounded-lg p-4 mb-5 border border-[#d0e2de] cursor-pointer hover:bg-[#f0f8f6] transition-colors" onClick={() => setShowDocumentPreview(!showDocumentPreview)}>
                {showDocumentPreview ? (
                  <div className="space-y-3">
                    {selectedDocument.isVideo ? (
                      <div className="rounded-lg border border-[#d0e2de] p-4 bg-white">
                        <p className="font-['Mukta'] text-[14px] text-[#1a4a43] mb-2">Link Video</p>
                        <a href={selectedDocument.videoLink} target="_blank" rel="noreferrer" className="text-[#1f6f5f] underline break-all">
                          {selectedDocument.videoLink || 'Link video tidak tersedia'}
                        </a>
                        <div className="mt-3">
                          <a href={selectedDocument.videoLink} target="_blank" rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-lg bg-[#1f6f5f] px-4 py-2 text-white text-[14px]">
                            Buka Link
                          </a>
                        </div>
                      </div>
                    ) : selectedDocument.uploadedFileName ? (
                      <div className="rounded-lg border border-[#d0e2de] p-0 bg-white overflow-hidden">
                        {canPreviewFile ? (
                          <>
                            {isImagePreview ? (
                              <img src={selectedFileData} alt={selectedDocument.uploadedFileName} className="w-full object-contain bg-[#f8faf9]" />
                            ) : isPdfPreview ? (
                              <iframe src={selectedFileData} title={selectedDocument.uploadedFileName} className="w-full min-h-[420px]" />
                            ) : (
                              <object data={selectedFileData} type={selectedFileType || 'application/octet-stream'} className="w-full min-h-[420px]">
                                <div className="p-4">
                                  <p className="font-['Mukta'] text-[14px] text-[#1a4a43] mb-2">Pratinjau tidak tersedia.</p>
                                  <a href={selectedFileData} target="_blank" rel="noreferrer" className="text-[#1f6f5f] underline">
                                    Buka atau unduh {selectedDocument.uploadedFileName}
                                  </a>
                                </div>
                              </object>
                            )}
                            <div className="p-4 border-t border-[#e5e7eb]">
                              <p className="font-['Mukta'] text-[14px] text-[#1a4a43]">{selectedDocument.uploadedFileName}</p>
                              <p className="font-['Mukta'] text-[12px] text-[#7a7a7a] mt-2">Diunggah pada {selectedDocument.uploadedAt}</p>
                            </div>
                          </>
                        ) : (
                          <div className="p-4">
                            <p className="font-['Mukta'] text-[14px] text-[#1a4a43] mb-2">Nama Berkas</p>
                            <p className="font-['Mukta'] text-[13px] text-[#5f9990]">{selectedDocument.uploadedFileName}</p>
                            <p className="font-['Mukta'] text-[12px] text-[#7a7a7a] mt-2">Diunggah pada {selectedDocument.uploadedAt}</p>
                            <p className="font-['Mukta'] text-[12px] text-[#5f9990] mt-3">Pratinjau tidak tersedia untuk jenis file ini.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-[#d0e2de] p-4 bg-white text-[#5f9990]">
                        Preview file tidak tersedia.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4">
                    <svg className="w-10 h-10 text-[#5f9990] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="font-['Mukta'] text-[13px] text-[#5f9990]">Klik untuk preview dokumen</p>
                  </div>
                )}
              </div>

              {/* ProClaim AI Analysis Panel (Khusus Uji Coba Laporan Kegiatan - Hanya untuk Admin Klaim) */}
              {currentUser?.role === 'Administrasi Klaim' && selectedDocument && selectedDocument.name === 'Laporan kegiatan edukasi/penyuluhan & senam Prolanis' && aiResult && (
                <div className="mb-5 bg-gradient-to-br from-[#f2faf7] to-[#e6f4ef] border border-[#a3d8c9] rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[18px]">✨</span>
                    <div>
                      <h4 className="font-['Mukta'] font-bold text-[14px] text-[#1a5c52] leading-tight">ProClaim AI: Analisis Berkas Otomatis</h4>
                      <p className="font-['Mukta'] text-[11px] text-[#558d81]">Uji Coba Deteksi Tanda Tangan & Stempel Resmi</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-white rounded-lg p-2.5 border border-[#cbe6df] text-center">
                      <p className="font-['Mukta'] text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Tanda Tangan</p>
                      <p className="font-['Mukta'] text-[13px] font-bold mt-1">
                        {aiResult.hasSignature ? (
                          <span className="text-emerald-600 flex items-center justify-center gap-1">🟢 Terdeteksi</span>
                        ) : (
                          <span className="text-red-500 flex items-center justify-center gap-1">🔴 Kurang</span>
                        )}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 border border-[#cbe6df] text-center">
                      <p className="font-['Mukta'] text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Stempel FKTP</p>
                      <p className="font-['Mukta'] text-[13px] font-bold mt-1">
                        {aiResult.hasStamp ? (
                          <span className="text-emerald-600 flex items-center justify-center gap-1">🟢 Terdeteksi</span>
                        ) : (
                          <span className="text-red-500 flex items-center justify-center gap-1">🔴 Kurang</span>
                        )}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 border border-[#cbe6df] text-center">
                      <p className="font-['Mukta'] text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Kepercayaan AI</p>
                      <p className="font-['Mukta'] text-[13px] font-bold text-slate-700 mt-1">{aiResult.confidence}%</p>
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg border text-[12px] font-['Mukta'] leading-relaxed mb-3 ${
                    aiResult.recommendation === 'Layak' 
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' 
                      : aiResult.recommendation === 'Pending' 
                      ? 'bg-amber-50/50 border-amber-200 text-amber-800' 
                      : 'bg-red-50/50 border-red-200 text-red-800'
                  }`}>
                    <strong>Rekomendasi AI ({aiResult.recommendation}):</strong> {aiResult.notes}
                  </div>

                  {/* Tombol Terapkan Hasil AI (Khusus Admin Klaim) */}
                  {currentUser?.role === 'Administrasi Klaim' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStatus(aiResult.recommendation);
                        setKeterangan(aiResult.notes);
                      }}
                      className="w-full bg-[#1f6f5f] hover:bg-[#165449] active:scale-[0.98] text-white py-2 px-4 rounded-lg font-['Mukta'] text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
                    >
                      <span>⚡</span> Terapkan Hasil Rekomendasi AI
                    </button>
                  )}
                </div>
              )}

              {currentUser?.role === 'Petugas Puskesmas' ? (
                <>
                  {/* Status read-only */}
                  <div className="mb-4">
                    <label className="block font-['Mukta'] text-[14px] font-medium text-[#1a4a43] mb-1.5">Status Verifikasi</label>
                    {selectedStatus && selectedStatus !== 'Menunggu Review' ? (
                      <span className={`inline-block px-3 py-1.5 rounded-full font-['Mukta'] text-[13px] font-medium border ${
                        selectedStatus === 'Layak' ? 'bg-[#e0f2ef] border-[#1f6f5f] text-[#1a5c52]'
                        : selectedStatus === 'Pending' ? 'bg-[#fef9e8] border-[#e6a91f] text-[#c79b0c]'
                        : 'bg-[#fef0f0] border-[#e61f1f] text-[#c70c0c]'
                      }`}>
                        {selectedStatus}
                      </span>
                    ) : (
                      <span className="font-['Mukta'] text-[13px] text-gray-400 italic">Belum diverifikasi oleh admin</span>
                    )}
                  </div>

                  {/* Keterangan read-only */}
                  <div className="mb-5 bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <label className="block font-['Mukta'] text-[14px] font-semibold text-[#1a4a43] mb-1.5">Catatan / Analisis Admin Klaim</label>
                    <p className="font-['Mukta'] text-[14px] text-gray-700 whitespace-pre-wrap">
                      {keterangan?.trim() ? keterangan : 'Tidak ada catatan khusus dari admin.'}
                    </p>
                  </div>

                  <DialogFooter className="flex gap-3">
                    <button onClick={() => setShowPopup(false)}
                      className="flex-1 py-3 border border-[#d0e2de] rounded-lg font-['Mukta'] text-[15px] font-medium text-[#5f9990] hover:bg-gray-50 transition-colors">
                      Tutup
                    </button>
                    {(selectedStatus === 'Pending' || selectedStatus === 'Tidak Layak') && (
                      <button onClick={() => {
                        setShowPopup(false);
                        navigate('/unggah-berkas', {
                          state: {
                            documentType: selectedDocument.name,
                            month: selectedDocument.month,
                            year: selectedDocument.year
                          }
                        });
                      }}
                        className="flex-1 py-3 bg-[#1f6f5f] text-white rounded-lg font-['Mukta'] text-[15px] font-medium hover:bg-[#165449] transition-colors shadow-lg hover:shadow-xl transform hover:scale-[1.01] active:scale-[0.99]">
                        Perbaiki & Unggah Ulang
                      </button>
                    )}
                  </DialogFooter>
                </>
              ) : (
                <>
                  {/* Status selection */}
                  <div className="mb-4">
                    <label className="block font-['Mukta'] text-[14px] font-medium text-[#1a4a43] mb-2">Status Verifikasi</label>
                    <div className="flex gap-3">
                      {['Layak', 'Pending', 'Tidak Layak'].map(s => (
                        <button key={s} onClick={() => setSelectedStatus(s)}
                          className={`flex-1 py-2.5 rounded-lg font-['Mukta'] text-[14px] font-medium border-2 transition-all ${
                            selectedStatus === s
                              ? s === 'Layak' ? 'bg-[#e0f2ef] border-[#1f6f5f] text-[#1a5c52]'
                              : s === 'Pending' ? 'bg-[#fef9e8] border-[#e6a91f] text-[#c79b0c]'
                              : 'bg-[#fef0f0] border-[#e61f1f] text-[#c70c0c]'
                              : 'border-[#d0e2de] text-gray-500 hover:border-gray-400'
                          }`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Keterangan */}
                  <div className="mb-5">
                    <label className="block font-['Mukta'] text-[14px] font-medium text-[#1a4a43] mb-2">Keterangan / Catatan</label>
                    <textarea value={keterangan} onChange={e => setKeterangan(e.target.value)}
                      placeholder="Tambahkan keterangan atau catatan verifikasi..."
                      className="w-full border border-[#d0e2de] rounded-lg px-4 py-3 font-['Mukta'] text-[14px] focus:outline-none focus:border-[#1f6f5f] resize-none h-24 transition-colors" />
                  </div>

                  <DialogFooter>
                    <button onClick={() => setShowPopup(false)}
                      className="flex-1 py-3 border border-[#d0e2de] rounded-lg font-['Mukta'] text-[15px] font-medium text-[#5f9990] hover:bg-gray-50 transition-colors">
                      Batal
                    </button>
                    <button onClick={handleSaveDocument} disabled={!selectedStatus}
                      className="flex-1 py-3 bg-[#1f6f5f] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-['Mukta'] text-[15px] font-medium hover:bg-[#165449] transition-colors">
                      Simpan Verifikasi
                    </button>
                  </DialogFooter>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
