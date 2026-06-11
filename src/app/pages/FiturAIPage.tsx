import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from '../utils/subdomain';
import { getCurrentUser } from '../utils/userData';
import { analyzeDocumentImage, AIAnalysisResult } from '../utils/aiDetector';
import { getDocs, saveDocs, addRiwayat, createDocumentId } from '../utils/documentData';
import { uploadFileToServer } from '../utils/serverApi';

export default function FiturAIPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileData, setSelectedFileData] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

  // Application states (for linking to Puskesmas checklist)
  const [selectedPuskesmas, setSelectedPuskesmas] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedDocType, setSelectedDocType] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const puskesmasList = [
    'Mulia Hati 1','Mulia Hati 2','Budi Mulia 1','Budi Mulia 2',
    'Harapan Kasih 1','Harapan Kasih 2','Sentosa 1','Sentosa 2',
    'Citra Medika 1','Citra Medika 2','Sehat Mandiri 1','Sehat Mandiri 2'
  ];

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

  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const years = ['2024','2025','2026'];

  // Set default values if current user is Petugas Puskesmas
  useEffect(() => {
    if (currentUser && currentUser.role === 'Petugas Puskesmas' && currentUser.puskesmas) {
      const normalized = currentUser.puskesmas.replace(/^Puskesmas\s+/i, '').trim();
      setSelectedPuskesmas(normalized);
    }
  }, [currentUser]);

  // Handle image conversion/compression
  const compressImage = (file: File, quality = 0.6): Promise<{ fileData: string; type: string }> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => resolve({ fileData: reader.result as string, type: file.type });
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
        return;
      }

      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_DIM = 1200;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            width = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const reader = new FileReader();
          reader.onload = () => resolve({ fileData: reader.result as string, type: file.type });
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({ fileData: dataUrl, type: 'image/jpeg' });
      };
      img.onerror = (e) => reject(e);
    });
  };

  const handleFileSelect = async (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      alert('Ukuran berkas melebihi batas 4 MB! Silakan unggah berkas yang lebih kecil.');
      return;
    }
    setSelectedFile(file);
    setAiResult(null); // Reset previous results
    
    try {
      const result = await compressImage(file);
      setSelectedFileData(result.fileData);
      setSelectedFileType(result.type || 'application/octet-stream');
    } catch (error) {
      console.error('Gagal memuat berkas:', error);
      setSelectedFileData('');
      setSelectedFileType('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Run AI Analysis
  const handleAnalyze = () => {
    if (!selectedFileData) return;
    setIsAnalyzing(true);
    setAiResult(null);

    // Simulate standard ProClaim AI analysis delay with real callback
    setTimeout(() => {
      analyzeDocumentImage(selectedFileData, selectedFile?.name, (result) => {
        setAiResult(result);
        setIsAnalyzing(false);
      });
    }, 2000); // 2 seconds scan simulation for immersive premium experience
  };

  // Apply results to Puskesmas checklist database
  const handleApplyToDatabase = async () => {
    if (!aiResult || !selectedPuskesmas || !selectedMonth || !selectedYear || !selectedDocType) {
      alert('Mohon lengkapi semua kolom pemetaan sebelum menyimpan.');
      return;
    }

    const docId = createDocumentId(selectedPuskesmas, selectedDocType, selectedMonth, selectedYear);
    const uploadedAtFormatted = new Date().toLocaleString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
    }) + ' WIB';

    const getStatusStyling = (status: string) => {
      switch (status) {
        case 'Layak': return { statusBg: 'bg-[#e0f2ef]', statusText: 'text-[#1a5c52]', analysisBg: 'bg-[#e0f2ef]', analysisText: 'text-[#1a5c52]', dotColor: 'bg-[#2e9e6e]' };
        case 'Pending': return { statusBg: 'bg-[#fef9e8]', statusText: 'text-[#c79b0c]', analysisBg: 'bg-[#fef9e8]', analysisText: 'text-[#c79b0c]', dotColor: 'bg-[#e6a91f]' };
        case 'Tidak Layak': return { statusBg: 'bg-[#fef0f0]', statusText: 'text-[#c70c0c]', analysisBg: 'bg-[#fef0f0]', analysisText: 'text-[#c70c0c]', dotColor: 'bg-[#e61f1f]' };
        default: return { statusBg: '', statusText: '', analysisBg: '', analysisText: '', dotColor: '' };
      }
    };

    const styling = getStatusStyling(aiResult.recommendation);

    // Construct baseline uploads schema payload
    const payload = {
      id: docId,
      fileName: selectedFile?.name || 'analisis_ai_scan.jpg',
      fileData: selectedFileData,
      fileType: selectedFileType,
      puskesmas: selectedPuskesmas,
      month: selectedMonth,
      year: selectedYear,
      documentType: selectedDocType,
      uploadedAt: uploadedAtFormatted,
      uploadedBy: currentUser?.nama || 'ProClaim AI',
      status: aiResult.recommendation,
      keterangan: aiResult.notes,
      analysis: aiResult.notes,
      lastModified: uploadedAtFormatted,
      modifiedBy: 'ProClaim AI (Verifikasi Otomatis)',
    };

    try {
      // 1. Sync to server database
      await uploadFileToServer(payload);

      // 2. Sync in-memory baseline cache
      const updatedDocs = [...getDocs()];
      const docIndex = updatedDocs.findIndex(d => d.id === docId);

      const cachedEntry = {
        ...updatedDocs[docIndex],
        id: docId,
        name: selectedDocType,
        uploadedFileName: payload.fileName,
        fileData: payload.fileData,
        fileType: payload.fileType,
        uploadedAt: payload.uploadedAt,
        uploadedBy: payload.uploadedBy,
        status: payload.status,
        keterangan: payload.keterangan,
        analysis: payload.analysis,
        lastModified: payload.lastModified,
        modifiedBy: payload.modifiedBy,
        puskesmas: selectedPuskesmas,
        month: selectedMonth,
        year: selectedYear,
        ...styling
      };

      if (docIndex !== -1) {
        updatedDocs[docIndex] = cachedEntry;
      } else {
        updatedDocs.push(cachedEntry);
      }
      saveDocs(updatedDocs);

      // 3. Save to system activities logs
      addRiwayat({
        waktu: uploadedAtFormatted,
        user: 'ProClaim AI',
        role: 'Sistem AI',
        action: 'Analisis',
        kategori: 'Fitur AI',
        pesan: `Melakukan verifikasi AI otomatis untuk "${selectedDocType}" di ${selectedPuskesmas} (${selectedMonth} ${selectedYear}) → Hasil: ${aiResult.recommendation}`,
        docId: docId,
        puskesmas: selectedPuskesmas,
      });

      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to save AI verification to database:', err);
      alert(`Gagal menyimpan: ${err?.message || err}`);
    }
  };

  const isImagePreview = selectedFile && selectedFile.type.startsWith('image/');
  const isPdfPreview = selectedFile && selectedFile.type === 'application/pdf';

  return (
    <>
      <style>{`
        @keyframes laser-sweep {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .laser-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, #10b981, transparent);
          box-shadow: 0 0 8px #10b981;
          animation: laser-sweep 2.5s infinite ease-in-out;
          z-index: 10;
        }
      `}</style>

      {showSaveSuccess && (
        <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-['Mukta'] text-[14px] text-emerald-800 font-medium">
            Hasil analisis AI berhasil disimpan ke database! Berkas kini tercatat sebagai <strong>{aiResult?.recommendation}</strong>. Anda dapat melihat detailnya di menu <strong>Verifikasi Berkas</strong>.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Area: File Upload & Scanning (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-[#d0e2de] p-6 shadow-sm">
            <h2 className="font-['Mukta'] font-bold text-[22px] text-[#1a4a43] mb-1">Scanner ProClaim AI</h2>
            <p className="font-['Mukta'] text-[14px] text-[#5f9990] mb-5">Pindai tanda tangan & stempel resmi pada dokumen pelaporan secara instan.</p>

            {/* Drop Zone / Image Display Area */}
            <div 
              onDragOver={handleDragOver} 
              onDragLeave={handleDragLeave} 
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl overflow-hidden min-h-[350px] flex flex-col items-center justify-center transition-all ${
                isDragging ? 'border-[#1f6f5f] bg-[#f0f8f6]' : 'border-[#a8d5ce] bg-[#f7fbfa]'
              }`}
            >
              {isAnalyzing && <div className="laser-line"></div>}

              {selectedFileData ? (
                <div className="w-full h-full flex flex-col items-center p-4">
                  {/* File preview */}
                  <div className="relative max-w-full max-h-[320px] rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm flex items-center justify-center">
                    {isImagePreview ? (
                      <img src={selectedFileData} alt="Preview" className="max-w-full max-h-[300px] object-contain" />
                    ) : isPdfPreview ? (
                      <iframe src={selectedFileData} title="PDF Preview" className="w-[500px] h-[300px] border-none" />
                    ) : (
                      <div className="p-8 text-center">
                        <svg className="w-12 h-12 text-[#5f9990] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="font-['Mukta'] text-[13px] text-[#5f9990]">{selectedFile?.name}</p>
                      </div>
                    )}

                    {/* Analyzing Dark Screen Overlay */}
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#10b981] border-t-transparent mb-3"></div>
                        <p className="font-['Mukta'] text-[15px] font-semibold animate-pulse">Memindai Berkas...</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between w-full border-t border-[#e5e7eb] pt-3">
                    <div className="min-w-0">
                      <p className="font-['Mukta'] text-[14px] font-semibold text-[#1a4a43] truncate">{selectedFile?.name}</p>
                      <p className="font-['Mukta'] text-[12px] text-slate-400">Tipe: {selectedFile?.type || 'Berkas'} • {(selectedFile!.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button 
                      onClick={() => { setSelectedFile(null); setSelectedFileData(''); setAiResult(null); }}
                      className="text-red-500 hover:text-red-700 font-['Mukta'] text-[13px] font-medium"
                    >
                      Hapus Berkas
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center p-8 text-center cursor-pointer">
                  <svg className="w-16 h-16 text-[#5f9990] mb-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="font-['Mukta'] text-[16px] font-semibold text-[#1a4a43] mb-1">Seret & lepas berkas di sini untuk memindai</p>
                  <p className="font-['Mukta'] text-[13px] text-[#5f9990] mb-4">Mendukung gambar JPG, PNG, atau dokumen PDF.</p>
                  <label htmlFor="ai-file-upload" className="cursor-pointer">
                    <div className="bg-[#1f6f5f] hover:bg-[#165449] active:scale-[0.98] text-white px-5 py-2.5 rounded-lg font-['Mukta'] text-[14px] font-medium transition-all shadow-sm">
                      Pilih Berkas
                    </div>
                    <input 
                      id="ai-file-upload" 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => e.target.files && e.target.files.length > 0 && handleFileSelect(e.target.files[0])} 
                      accept=".pdf,.jpg,.jpeg,.png" 
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Scan Action Trigger */}
            <div className="mt-5">
              <button
                onClick={handleAnalyze}
                disabled={!selectedFileData || isAnalyzing}
                className="w-full bg-[#1f6f5f] hover:bg-[#165449] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-['Mukta'] text-[15px] font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Memproses Analisis AI...
                  </>
                ) : (
                  <>
                    <span>✨</span> Jalankan Analisis ProClaim AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Area: Results & Linking (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Result Block */}
          <div className="bg-white rounded-xl border border-[#d0e2de] p-6 shadow-sm flex-1 flex flex-col">
            <h3 className="font-['Mukta'] font-bold text-[18px] text-[#1a4a43] mb-4 border-b border-[#f0f0f0] pb-2">Hasil Pemindaian AI</h3>
            
            {aiResult ? (
              <div className="space-y-5 flex-1 flex flex-col">
                
                {/* Recommendation Ribbon */}
                <div className={`p-4 rounded-xl border-2 flex items-center gap-3 ${
                  aiResult.recommendation === 'Layak' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : aiResult.recommendation === 'Pending' 
                    ? 'bg-amber-50 border-amber-200 text-amber-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <span className="text-[26px]">
                    {aiResult.recommendation === 'Layak' ? '🟢' : aiResult.recommendation === 'Pending' ? '🟡' : '🔴'}
                  </span>
                  <div>
                    <p className="font-['Mukta'] text-[10px] font-bold uppercase tracking-wider opacity-80 leading-none">Rekomendasi Kelayakan</p>
                    <p className="font-['Mukta'] text-[18px] font-extrabold mt-1">{aiResult.recommendation}</p>
                  </div>
                </div>

                {/* Checklist parameters */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#f7fbfa] rounded-lg p-3 border border-[#d0e2de] text-center">
                    <p className="font-['Mukta'] text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Tanda Tangan</p>
                    <p className="font-['Mukta'] text-[15px] font-bold mt-1.5">
                      {aiResult.hasSignature ? (
                        <span className="text-emerald-600 flex items-center justify-center gap-1">🟢 Terdeteksi</span>
                      ) : (
                        <span className="text-red-500 flex items-center justify-center gap-1">🔴 Tidak Ada</span>
                      )}
                    </p>
                  </div>
                  <div className="bg-[#f7fbfa] rounded-lg p-3 border border-[#d0e2de] text-center">
                    <p className="font-['Mukta'] text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Stempel Resmi</p>
                    <p className="font-['Mukta'] text-[15px] font-bold mt-1.5">
                      {aiResult.hasStamp ? (
                        <span className="text-emerald-600 flex items-center justify-center gap-1">🟢 Terdeteksi</span>
                      ) : (
                        <span className="text-red-500 flex items-center justify-center gap-1">🔴 Tidak Ada</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* AI Confidence gauge */}
                <div className="bg-[#f7fbfa] border border-[#d0e2de] rounded-lg p-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-['Mukta'] text-[13px] text-[#1a4a43] font-medium">Tingkat Kepercayaan AI</span>
                    <span className="font-['Mukta'] text-[14px] font-bold text-[#1f6f5f]">{aiResult.confidence}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${aiResult.confidence}%` }}
                    ></div>
                  </div>
                </div>

                {/* Explanation text */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <span className="font-['Mukta'] text-[13px] font-bold text-[#1a4a43] block mb-1">Catatan Analisis:</span>
                  <p className="font-['Mukta'] text-[13px] text-slate-700 leading-relaxed italic">"{aiResult.notes}"</p>
                </div>

                {/* Action panel to link to database */}
                <div className="mt-auto border-t border-[#f0f0f0] pt-4 space-y-4">
                  <h4 className="font-['Mukta'] font-semibold text-[14px] text-[#1a4a43]">Simpan & Terapkan ke Dokumen Puskesmas</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block font-['Mukta'] text-[11px] text-[#5f9990] font-semibold uppercase tracking-wider mb-1">Nama Puskesmas</label>
                      <select 
                        title="Puskesmas"
                        value={selectedPuskesmas} 
                        onChange={e => setSelectedPuskesmas(e.target.value)}
                        disabled={currentUser?.role === 'Petugas Puskesmas'}
                        className="w-full bg-[#f7fbfa] border border-[#d0e2de] rounded-lg px-3 py-2 font-['Mukta'] text-[13px]"
                      >
                        <option value="">Pilih Puskesmas</option>
                        {puskesmasList.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block font-['Mukta'] text-[11px] text-[#5f9990] font-semibold uppercase tracking-wider mb-1">Jenis Dokumen</label>
                      <select 
                        title="Jenis Dokumen"
                        value={selectedDocType} 
                        onChange={e => setSelectedDocType(e.target.value)}
                        className="w-full bg-[#f7fbfa] border border-[#d0e2de] rounded-lg px-3 py-2 font-['Mukta'] text-[13px]"
                      >
                        <option value="">Pilih Jenis Dokumen</option>
                        {documentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-['Mukta'] text-[11px] text-[#5f9990] font-semibold uppercase tracking-wider mb-1">Bulan</label>
                        <select 
                          title="Bulan"
                          value={selectedMonth} 
                          onChange={e => setSelectedMonth(e.target.value)}
                          className="w-full bg-[#f7fbfa] border border-[#d0e2de] rounded-lg px-3 py-2 font-['Mukta'] text-[13px]"
                        >
                          <option value="">Pilih Bulan</option>
                          {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block font-['Mukta'] text-[11px] text-[#5f9990] font-semibold uppercase tracking-wider mb-1">Tahun</label>
                        <select 
                          title="Tahun"
                          value={selectedYear} 
                          onChange={e => setSelectedYear(e.target.value)}
                          className="w-full bg-[#f7fbfa] border border-[#d0e2de] rounded-lg px-3 py-2 font-['Mukta'] text-[13px]"
                        >
                          <option value="">Pilih Tahun</option>
                          {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleApplyToDatabase}
                      disabled={!selectedPuskesmas || !selectedMonth || !selectedYear || !selectedDocType}
                      className="w-full mt-2 bg-[#1f6f5f] hover:bg-[#165449] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-lg font-['Mukta'] text-[14px] font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      📁 Terapkan Analisis AI ke Database
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-slate-400">
                <svg className="w-12 h-12 text-[#d0e2de] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="font-['Mukta'] text-[14px] text-slate-400">Silakan unggah berkas dan jalankan analisis ProClaim AI untuk melihat hasil penilaian di panel ini.</p>
              </div>
            )}

          </div>

        </div>

      </div>
    </>
  );
}
