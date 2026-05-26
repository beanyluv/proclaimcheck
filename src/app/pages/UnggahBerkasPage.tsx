import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import imgImage3 from '../../imports/VerifikasiBerkasProclaimCheck-1/ecd5bb1c63617aeaceefdae80e49afd2e592d178.png';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import Group284 from "../../imports/Group284/Group284";
import { getDocuments, saveDocuments, resetDocuments, addRiwayat, createDocumentId } from '../utils/documentData';
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
    getUploadedFilesFromServer()
      .then((uploads) => setUploadedFiles(uploads))
      .catch((error) => {
        console.warn('Tidak dapat mengambil unggahan dari server:', error);
      });
  }, []);

  const puskesmasList = ['Mulia Hati 1','Mulia Hati 2','Budi Mulia 1','Budi Mulia 2','Harapan Kasih 1','Harapan Kasih 2','Sentosa 1','Sentosa 2','Citra Medika 1','Citra Medika 2','Sehat Mandiri 1','Sehat Mandiri 2'];
  const documentTypes = [
    'Laporan kegiatan edukasi/penyuluhan & senam Prolanis',
    'Fotocopy materi yang disampaikan',
    'Daftar hadir peserta',
    'Foto kegiatan edukasi/penyuluhan & senam',
    'Full video kegiatan',
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

  const isVideoDocument = documentType === 'Full video kegiatan';

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

  const readSelectedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedFileData(reader.result);
        setSelectedFileType(file.type || 'application/octet-stream');
      }
    };
    reader.onerror = () => {
      console.error('Gagal membaca file', reader.error);
      setSelectedFileData('');
      setSelectedFileType('');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      readSelectedFile(file);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
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

    // Tambah ke riwayat lokal
    const newUpload: UploadedFile = {
      id: Date.now().toString(),
      fileName: isVideoDocument ? undefined : selectedFile?.name,
      fileData: isVideoDocument ? undefined : selectedFileData,
      fileType: isVideoDocument ? undefined : selectedFileType,
      videoLink: isVideoDocument ? videoLink : undefined,
      puskesmas, month, year, documentType,
      uploadedAt: uploadedAtFormatted,
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

    setUploadedFiles(prev => [newUpload, ...prev]);

    // ✅ Catat ke riwayat sistem
    addRiwayat({
      waktu: uploadedAtFormatted,
      user: currentUser?.nama || 'Pengguna',
      role: currentUser?.role || 'Pengguna',
      action: 'Upload',
      kategori: 'Unggah Berkas',
      pesan: `Mengunggah ${documentType} untuk ${puskesmas}, ${month} ${year}`,
      docId: createDocumentId(puskesmas, documentType, month, year),
    });

    // ✅ BRIDGING: Update dokumen di localStorage agar muncul di Verifikasi Berkas
    const allDocs = getDocuments();
    const docId = createDocumentId(puskesmas, documentType, month, year);
    const docIndex = allDocs.findIndex((d: any) => d.id === docId);

    if (docIndex !== -1) {
      // Update dokumen yang sudah ada
      allDocs[docIndex] = {
        ...allDocs[docIndex],
        uploadedFileName: isVideoDocument ? undefined : selectedFile?.name,
        fileData: isVideoDocument ? undefined : selectedFileData,
        fileType: isVideoDocument ? undefined : selectedFileType,
        videoLink: isVideoDocument ? videoLink : allDocs[docIndex].videoLink,
        uploadedAt: uploadedAtFormatted,
        uploadedBy: currentUser?.nama || 'Pengguna',
      };
    } else {
      // Tambah dokumen baru jika belum ada
      allDocs.push({
        id: docId,
        numericId: allDocs.length + 1,
        no: 1,
        icon: isVideoDocument ? '🎥' : '📄',
        name: documentType,
        analysis: '',
        status: '',
        statusBg: 'bg-[#e0f2ef]',
        statusText: 'text-[#1a5c52]',
        analysisBg: 'bg-[#e0f2ef]',
        analysisText: 'text-[#1a5c52]',
        dotColor: 'bg-[#2e9e6e]',
        puskesmas, month, year,
        keterangan: '',
        isVideo: isVideoDocument,
        videoLink: isVideoDocument ? videoLink : undefined,
        uploadedFileName: isVideoDocument ? undefined : selectedFile?.name,
        fileData: isVideoDocument ? undefined : selectedFileData,
        fileType: isVideoDocument ? undefined : selectedFileType,
        uploadedAt: uploadedAtFormatted,
        uploadedBy: currentUser?.nama || 'Pengguna',
      });
    }
    saveDocuments(allDocs);

    // Reset form
    setSelectedFile(null); setSelectedFileData(''); setSelectedFileType(''); setVideoLink(''); setPuskesmas(''); setMonth(''); setYear(''); setDocumentType('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  };

  const handleResetUploads = () => {
    if (!window.confirm('Reset semua unggahan dokumen ke kondisi awal?')) return;
    resetDocuments();
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
    <div className="flex h-screen bg-[#fafafa]">
      {/* Sidebar */}
      <Sidebar avatarSrc={imgImage3} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Unggah Berkas" avatarSrc={imgImage3} userName={currentUser?.nama} />

        <div className="flex-1 overflow-auto p-6">
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
                    <p className="font-['Mukta'] text-[11px] text-[#5f9990]">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Maks. 10MB)</p>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block font-['Mukta'] text-[14px] text-[#1a4a43] font-medium mb-1.5">Puskesmas <span className="text-red-500">*</span></label>
                  <select title="Pilih Puskesmas" value={puskesmas} onChange={e => setPuskesmas(e.target.value)}
                    className="w-full bg-[#f7fbfa] border border-[#d0e2de] rounded-[8px] px-4 py-2.5 font-['Mukta'] text-[14px] text-[#1a4a43] focus:outline-none focus:border-[#1f6f5f]">
                    <option value="">Pilih Puskesmas</option>
                    {puskesmasList.map(p => <option key={p}>{p}</option>)}
                  </select>
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
                  <button onClick={handleResetUploads}
                    className="w-full px-6 py-3 border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 rounded-[8px] font-['Mukta'] text-[15px] font-medium transition-colors">
                    Reset Semua Unggahan
                  </button>
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
        </div>
      </div>
    </div>
  );
}
