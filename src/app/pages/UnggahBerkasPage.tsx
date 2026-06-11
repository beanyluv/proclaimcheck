import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from '../utils/subdomain';
import { getDocs, saveDocs, resetDocs, addRiwayat, createDocumentId, documentTypes } from '../utils/documentData';
import { getCurrentUser } from '../utils/userData';
import { uploadFileToServer, getUploadedFilesFromServer } from '../utils/serverApi';

interface UploadedFile {
  id: string;
  fileName?: string;
  fileData?: string;
  fileType?: string;
  videoLink?: string;
  puskesmas: string;
  month: string;
  year: string;
  documentType: string;
  uploadedAt: string;
}

export default function UnggahBerkasPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileData, setSelectedFileData] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [puskesmas, setPuskesmas] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isVerifikasiExpanded, setIsVerifikasiExpanded] = useState(true);

  const currentUser = getCurrentUser();

  useEffect(() => {
    const fetchUploads = () => {
      getUploadedFilesFromServer()
        .then((uploads) => {
          if (currentUser && currentUser.role === 'Petugas Puskesmas' && currentUser.puskesmas) {
            const normalizedUserPusk = currentUser.puskesmas.replace(/^Puskesmas\s+/i, '').trim().toLowerCase();
            const filtered = (uploads || []).filter((u: any) => {
              const filePusk = (u.puskesmas || '').replace(/^Puskesmas\s+/i, '').trim().toLowerCase();
              return filePusk === normalizedUserPusk;
            });
            setUploadedFiles(filtered);
          } else {
            setUploadedFiles(uploads || []);
          }
        })
        .catch((error) => {
          console.warn('Tidak dapat mengambil unggahan dari server:', error);
        });
    };

    fetchUploads();

    // Listen to background offline sync notifications
    window.addEventListener('offline-synced', fetchUploads);
    return () => {
      window.removeEventListener('offline-synced', fetchUploads);
    };
  }, [currentUser]);

  useEffect(() => {
    // 1. Lock/prefill Puskesmas if Petugas Puskesmas
    if (currentUser && currentUser.role === 'Petugas Puskesmas' && currentUser.puskesmas) {
      const normalized = currentUser.puskesmas.replace(/^Puskesmas\s+/i, '').trim();
      setPuskesmas(normalized);
    }
    
    // 2. Prefill from navigation state (re-upload perbaikan)
    if (location.state) {
      const { documentType: stateDocType, month: stateMonth, year: stateYear } = location.state as any;
      if (stateDocType) setDocumentType(stateDocType);
      if (stateMonth) setMonth(stateMonth);
      if (stateYear) setYear(stateYear);
      
      // Clean location state to avoid pre-filling again on subsequent actions
      window.history.replaceState({}, document.title);
    }
  }, [currentUser, location.state]);

  const puskesmasList = ['Mulia Hati 1','Mulia Hati 2','Budi Mulia 1','Budi Mulia 2','Harapan Kasih 1','Harapan Kasih 2','Sentosa 1','Sentosa 2','Citra Medika 1','Citra Medika 2','Sehat Mandiri 1','Sehat Mandiri 2'];
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

  const isVideoDocument = documentType === 'Full vidio kegiatan yang di upload di IG/youtube FKTP';

  useEffect(() => {
    if (isVideoDocument) {
      setSelectedFile(null);
      setSelectedFileData('');
      setSelectedFileType('');
    } else {
      setVideoLink('');
    }
  }, [documentType]);

  const validateVideoLink = (link: string) => {
    const instaPattern = /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/(?:p|reel|tv)\/[A-Za-z0-9_-]+/;
    const ytPattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[A-Za-z0-9_-]+/;
    return instaPattern.test(link) || ytPattern.test(link);
  };

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
            height = MAX_DIM;
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

  const readSelectedFile = async (file: File) => {
    try {
      const result = await compressImage(file);
      setSelectedFileData(result.fileData);
      setSelectedFileType(result.type || 'application/octet-stream');
    } catch (error) {
      console.error('Gagal membaca/mengompres berkas', error);
      setSelectedFileData('');
      setSelectedFileType('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.size > 4 * 1024 * 1024) {
        alert("Ukuran berkas melebihi batas 4 MB! Silakan unggah berkas yang lebih kecil.");
        return;
      }
      setSelectedFile(file);
      readSelectedFile(file);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 4 * 1024 * 1024) {
        alert("Ukuran berkas melebihi batas 4 MB! Silakan unggah berkas yang lebih kecil.");
        return;
      }
      setSelectedFile(file);
      readSelectedFile(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // ✅ BRIDGING: Upload langsung masuk ke dokumen yang bisa diverifikasi
  const handleUpload = async () => {
    if (isVideoDocument) {
      if (!videoLink || !puskesmas || !month || !year || !documentType) { alert('Mohon lengkapi semua field'); return; }
      if (!validateVideoLink(videoLink)) { alert('Link video tidak valid. Gunakan link Instagram atau YouTube'); return; }
    } else {
      if (!selectedFile || !puskesmas || !month || !year || !documentType) { alert('Mohon lengkapi semua field'); return; }
      if (!selectedFileData) {
        alert('Mohon tunggu file selesai dimuat atau pilih file kembali.');
        return;
      }
    }

    // Waktu upload dalam format standar
    const uploadedAtFormatted = new Date().toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';

    const docId = createDocumentId(puskesmas, documentType, month, year);

    // Tambah ke riwayat lokal
    const newUpload = {
      id: docId,
      fileName: isVideoDocument ? undefined : selectedFile?.name,
      fileData: isVideoDocument ? undefined : selectedFileData,
      fileType: isVideoDocument ? undefined : selectedFileType,
      videoLink: isVideoDocument ? videoLink : undefined,
      puskesmas, month, year, documentType,
      uploadedAt: uploadedAtFormatted,
      status: 'Menunggu Review',
      keterangan: '',
      analysis: 'Menunggu Review',
      lastModified: undefined,
      modifiedBy: undefined,
    };

    try {
      await uploadFileToServer({
        ...newUpload,
        uploadedBy: currentUser?.nama || 'Pengguna',
      });
    } catch (error) {
      console.error('Gagal menyimpan unggahan ke server', error);
      const msg = (error as any)?.message || String(error);
      alert(`Gagal menyimpan unggahan ke server: ${msg}`);
      return;
    }

    setUploadedFiles(prev => [newUpload as any, ...prev]);

    // ✅ Update local baseline in-memory cache directly!
    const updatedDocs = [...getDocs()];
    const docIndex = updatedDocs.findIndex(d => d.id === docId);
    if (docIndex !== -1) {
      updatedDocs[docIndex] = {
        ...updatedDocs[docIndex],
        uploadedFileName: newUpload.fileName,
        fileData: newUpload.fileData,
        fileType: newUpload.fileType,
        videoLink: newUpload.videoLink,
        uploadedAt: newUpload.uploadedAt,
        uploadedBy: currentUser?.nama || 'Pengguna',
        status: newUpload.status,
        keterangan: newUpload.keterangan,
        analysis: newUpload.analysis,
        lastModified: undefined,
        modifiedBy: undefined,
        statusBg: 'bg-[#fef9e8]',
        statusText: 'text-[#c79b0c]',
        analysisBg: 'bg-[#fef9e8]',
        analysisText: 'text-[#c79b0c]',
        dotColor: 'bg-[#e6a91f]'
      };
      saveDocs(updatedDocs);
    } else {
      // Append the custom uploaded document if it does not exist in baselineDocs
      const docTypeInfo = documentTypes.find(dt => dt.name === documentType);
      const icon = docTypeInfo ? docTypeInfo.icon : '📋';
      updatedDocs.push({
        id: docId,
        numericId: Math.floor(Math.random() * 1000000) + 10000,
        no: 1,
        icon: icon,
        name: documentType,
        uploadedFileName: newUpload.fileName,
        fileData: newUpload.fileData,
        fileType: newUpload.fileType,
        videoLink: newUpload.videoLink,
        uploadedAt: newUpload.uploadedAt,
        uploadedBy: currentUser?.nama || 'Pengguna',
        status: newUpload.status,
        keterangan: newUpload.keterangan,
        analysis: newUpload.analysis,
        lastModified: undefined,
        modifiedBy: undefined,
        puskesmas,
        month,
        year,
        isVideo: isVideoDocument,
        statusBg: 'bg-[#fef9e8]',
        statusText: 'text-[#c79b0c]',
        analysisBg: 'bg-[#fef9e8]',
        analysisText: 'text-[#c79b0c]',
        dotColor: 'bg-[#e6a91f]'
      });
      saveDocs(updatedDocs);
    }

    // ✅ Catat ke riwayat sistem
    addRiwayat({
      waktu: uploadedAtFormatted,
      user: currentUser?.nama || 'Pengguna',
      role: currentUser?.role || 'Pengguna',
      action: 'Unggah',
      kategori: 'Unggah Berkas',
      pesan: `Mengunggah ${documentType} untuk ${puskesmas}, ${month} ${year}`,
      docId: docId,
      puskesmas: puskesmas,
    });

    // Reset form
    setSelectedFile(null); setSelectedFileData(''); setSelectedFileType(''); setVideoLink(''); setMonth(''); setYear(''); setDocumentType('');
    if (currentUser?.role !== 'Petugas Puskesmas') {
      setPuskesmas('');
    }
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  };

  const handleResetUploads = () => {
    if (!window.confirm('Reset semua unggahan dokumen ke kondisi awal?')) return;
    resetDocs();
    setUploadedFiles([]);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  };

  const sidebarItem = (path: string, label: string) => (
    <div onClick={() => navigate(path)}
      className={`px-3 py-2 rounded cursor-pointer transition-colors mb-1 ${isActive(path) ? 'bg-white bg-opacity-20' : 'hover:bg-[#ffffff10]'}`}>
      <p className="font-['Mukta'] text-white text-[15px]">{label}</p>
    </div>
  );

  const handleGoToVerifikasi = () => navigate('/verifikasi-berkas');

  return (
    <>
      {showSuccess && (
            <div className="mb-5 bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-['Mukta'] text-[14px] text-green-800 font-medium">
                  ✅ Berkas berhasil diunggah! Sekarang bisa dilihat dan diverifikasi di menu <strong>Verifikasi Berkas → Lihat Berkas</strong>.
                </p>
              </div>
              <button onClick={handleGoToVerifikasi}
                className="self-start rounded-lg bg-[#1f6f5f] text-white px-4 py-2 text-[14px] font-['Mukta'] font-medium hover:bg-[#165449] transition-colors">
                Lihat Berkas Sekarang
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Form */}
            <div className="bg-white rounded-[10px] border border-[#d0e2de] p-6 shadow-sm">
              <h2 className="font-['Mukta'] font-semibold text-[20px] text-[#1a4a43] mb-5">Formulir Unggah Berkas</h2>

              {/* Upload Area */}
              {isVideoDocument ? (
                <div className="border-2 border-dashed border-[#a8d5ce] rounded-[10px] p-6 mb-5 bg-[#f7fbfa]">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-12 h-12 text-[#5f9990]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-['Mukta'] text-[15px] text-[#1a4a43] font-medium">Masukkan Link Video</p>
                    <input type="url" value={videoLink} onChange={e => setVideoLink(e.target.value)}
                      placeholder="https://youtube.com/... atau https://instagram.com/..."
                      className="w-full bg-white border border-[#d0e2de] rounded-[8px] px-4 py-2.5 font-['Mukta'] text-[14px] focus:outline-none focus:border-[#1f6f5f]" />
                    <p className="font-['Mukta'] text-[11px] text-[#5f9990]">Link dari Instagram atau YouTube</p>
                  </div>
                </div>
              ) : (
                <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-[10px] p-6 mb-5 transition-all ${isDragging ? 'border-[#1f6f5f] bg-[#f0f8f6]' : 'border-[#a8d5ce] bg-[#f7fbfa]'}`}>
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-12 h-12 text-[#5f9990]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {selectedFile ? (
                      <div className="text-center">
                        <p className="font-['Mukta'] text-[15px] text-[#1a4a43] font-medium">{selectedFile.name}</p>
                        <p className="font-['Mukta'] text-[13px] text-[#5f9990]">{formatFileSize(selectedFile.size)}</p>
                      </div>
                    ) : (
                      <p className="font-['Mukta'] text-[15px] text-[#1a4a43] font-medium">Seret & lepas berkas di sini</p>
                    )}
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="bg-[#1f6f5f] hover:bg-[#165449] text-white px-5 py-2 rounded-[8px] font-['Mukta'] text-[14px] font-medium transition-colors">
                        {selectedFile ? 'Ganti Berkas' : 'Pilih Berkas'}
                      </div>
                      <input id="file-upload" type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" />
                    </label>
                    <p className="font-['Mukta'] text-[11px] text-[#5f9990]">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Maks. 4MB)</p>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block font-['Mukta'] text-[14px] text-[#1a4a43] font-medium mb-1.5">Puskesmas <span className="text-red-500">*</span></label>
                  <select title="Pilih Puskesmas" value={puskesmas} onChange={e => setPuskesmas(e.target.value)}
                    disabled={currentUser?.role === 'Petugas Puskesmas'}
                    className="w-full bg-[#f7fbfa] border border-[#d0e2de] rounded-[8px] px-4 py-2.5 font-['Mukta'] text-[14px] text-[#1a4a43] focus:outline-none focus:border-[#1f6f5f] disabled:bg-gray-100 disabled:cursor-not-allowed">
                    <option value="">Pilih Puskesmas</option>
                    {puskesmasList.map(p => <option key={p}>{p}</option>)}
                  </select>
                  {currentUser?.role === 'Petugas Puskesmas' && (
                    <p className="font-['Mukta'] text-[11px] text-[#5f9990] mt-1.5">Akun Anda terikat pada {currentUser.puskesmas}</p>
                  )}
                </div>
                <div>
                  <label className="block font-['Mukta'] text-[14px] text-[#1a4a43] font-medium mb-1.5">Jenis Dokumen <span className="text-red-500">*</span></label>
                  <select title="Pilih Jenis Dokumen" value={documentType} onChange={e => setDocumentType(e.target.value)}
                    className="w-full bg-[#f7fbfa] border border-[#d0e2de] rounded-[8px] px-4 py-2.5 font-['Mukta'] text-[14px] text-[#1a4a43] focus:outline-none focus:border-[#1f6f5f]">
                    <option value="">Pilih Jenis Dokumen</option>
                    {documentTypes.map(type => <option key={type}>{type}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-['Mukta'] text-[14px] text-[#1a4a43] font-medium mb-1.5">Bulan <span className="text-red-500">*</span></label>
                    <select title="Pilih Bulan" value={month} onChange={e => setMonth(e.target.value)}
                      className="w-full bg-[#f7fbfa] border border-[#d0e2de] rounded-[8px] px-4 py-2.5 font-['Mukta'] text-[14px] text-[#1a4a43] focus:outline-none focus:border-[#1f6f5f]">
                      <option value="">Bulan</option>
                      {months.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-['Mukta'] text-[14px] text-[#1a4a43] font-medium mb-1.5">Tahun <span className="text-red-500">*</span></label>
                    <select title="Pilih Tahun" value={year} onChange={e => setYear(e.target.value)}
                      className="w-full bg-[#f7fbfa] border border-[#d0e2de] rounded-[8px] px-4 py-2.5 font-['Mukta'] text-[14px] text-[#1a4a43] focus:outline-none focus:border-[#1f6f5f]">
                      <option value="">Tahun</option>
                      {years.map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex gap-3">
                    <button onClick={handleUpload}
                      disabled={!puskesmas || !month || !year || !documentType || (isVideoDocument ? !videoLink : !selectedFile)}
                      className="flex-1 bg-[#1f6f5f] hover:bg-[#165449] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-[8px] font-['Mukta'] text-[15px] font-medium transition-colors">
                      Unggah Berkas
                    </button>
                    <button onClick={() => { setSelectedFile(null); setVideoLink(''); setPuskesmas(''); setMonth(''); setYear(''); setDocumentType(''); }}
                      className="px-6 py-3 border border-[#d0e2de] bg-white hover:bg-gray-50 text-[#1a4a43] rounded-[8px] font-['Mukta'] text-[15px] font-medium transition-colors">
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: History */}
            <div className="bg-white rounded-[10px] border border-[#d0e2de] p-6 shadow-sm">
              <h2 className="font-['Mukta'] font-semibold text-[20px] text-[#1a4a43] mb-5">Riwayat Unggahan</h2>
              {uploadedFiles.length === 0 ? (
                <div className="text-center py-16">
                  <svg className="w-16 h-16 text-[#d0e2de] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="font-['Mukta'] text-[14px] text-[#5f9990]">Belum ada berkas yang diunggah sesi ini</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {uploadedFiles.map(upload => (
                    <div key={upload.id} className="bg-[#f7fbfa] border border-[#d0e2de] rounded-[8px] p-4 hover:border-[#1f6f5f] transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-[#e0f2ef] rounded-[8px] flex items-center justify-center flex-shrink-0">
                            {upload.videoLink ? (
                              <svg className="w-5 h-5 text-[#1f6f5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-[#1f6f5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-['Mukta'] text-[14px] text-[#1a4a43] font-medium truncate">
                              {upload.fileName || upload.videoLink}
                            </p>
                            <p className="font-['Mukta'] text-[12px] text-[#5f9990] mt-0.5">{upload.documentType}</p>
                            <div className="flex gap-3 mt-1 text-[11px] text-[#5f9990]">
                              <span>{upload.puskesmas}</span>
                              <span>•</span>
                              <span>{upload.month} {upload.year}</span>
                              <span>•</span>
                              <span>{upload.uploadedAt}</span>
                            </div>
                          </div>
                        </div>
                        <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-['Mukta'] text-[11px] font-medium flex-shrink-0 whitespace-nowrap">
                          ✓ Berhasil
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
    </>
  );
}
