import { getUploadedFilesFromServer, addRiwayatToServer, getRiwayatFromServer } from './serverApi';
import { getCurrentUser } from './userData';

// cache lokal buat doc & riwayat
let cacheDocs: any[] = [];
let cacheRiwayat: any[] = [];

export const createDocumentId = (puskesmas: string, documentType: string, month: string, year: string) => {
  const seed = `${puskesmas}|${documentType}|${month}|${year}`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `doc${(hash >>> 0).toString(36)}`;
};

export const documentTypes = [
  { icon: '📋', name: 'Laporan kegiatan edukasi/penyuluhan & senam Prolanis', isVideo: false },
  { icon: '📄', name: 'Fotocopy materi yang disampaikan', isVideo: false },
  { icon: '👥', name: 'Daftar hadir peserta', isVideo: false },
  { icon: '📸', name: 'Foto kegiatan edukasi (penyuluhan) & senam', isVideo: false },
  { icon: '🎥', name: 'Full vidio kegiatan yang di upload di IG/youtube FKTP', isVideo: true },
  { icon: '👨‍⚕️', name: 'Kuitansi jasa instruktur/narasumber', isVideo: false },
  { icon: '📝', name: 'Nota pembelian konsumsi', isVideo: false },
  { icon: '🧾', name: 'Kuitansi pembelian konsumsi', isVideo: false },
  { icon: '💰', name: 'Kuitansi total tagihan', isVideo: false },
  { icon: '📋', name: 'Fotocopy proposal kegiatan tahun 2025', isVideo: false },
  { icon: '📊', name: 'Formulir Pengajuan Klaim (FPK)', isVideo: false },
  { icon: '✅', name: 'Berita acara serah terima klaim', isVideo: false },
  { icon: '✉️', name: 'Surat pengajuan klaim', isVideo: false },
  { icon: '📩', name: 'Surat tanggung jawab mutlak bermaterai', isVideo: false }
];

export const genDocs = () => {
  const puskesmasList = [
    'Mulia Hati 1', 'Mulia Hati 2', 'Budi Mulia 1', 'Budi Mulia 2',
    'Harapan Kasih 1', 'Harapan Kasih 2', 'Sentosa 1', 'Sentosa 2',
    'Citra Medika 1', 'Citra Medika 2', 'Sehat Mandiri 1', 'Sehat Mandiri 2'
  ];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const years = ['2024', '2025', '2026'];

  let allDocs: any[] = [];
  let globalId = 1;

  puskesmasList.forEach((puskesmas, puskesmasIndex) => {
    let no = 1;
    documentTypes.forEach((docType, docIndex) => {
      const monthIndex = (puskesmasIndex + docIndex) % months.length;
      const yearIndex = puskesmasIndex % years.length;
      const month = months[monthIndex];
      const year = years[yearIndex];

      const videoLinks = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://www.youtube.com/watch?v=9bZkp7q19f0',
        'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
        'https://youtu.be/LDU_Txk06tM',
        'https://www.instagram.com/p/sample123/'
      ];

      // bikin id unik
      const uniqueId = createDocumentId(puskesmas, docType.name, month, year);

      allDocs.push({
        id: uniqueId,
        numericId: globalId++,
        no: no++,
        icon: docType.icon,
        name: docType.name,
        analysis: '',
        status: '',
        statusBg: 'bg-[#e0f2ef]',
        statusText: 'text-[#1a5c52]',
        analysisBg: 'bg-[#e0f2ef]',
        analysisText: 'text-[#1a5c52]',
        dotColor: 'bg-[#2e9e6e]',
        puskesmas: puskesmas,
        month: month,
        year: year,
        keterangan: '',
        isVideo: docType.isVideo,
        videoLink: docType.isVideo ? videoLinks[docIndex % videoLinks.length] : undefined
      });
    });
  });

  return allDocs;
};

// get docs dari cache, kalo kosong bikin baru
export const getDocs = () => {
  if (cacheDocs.length > 0) {
    return cacheDocs;
  }
  cacheDocs = genDocs();
  return cacheDocs;
};

// simpan ke cache
export const saveDocs = (documents: any[]) => {
  cacheDocs = documents;
};

// reset balik ke awal
export const resetDocs = () => {
  cacheDocs = genDocs();
  return cacheDocs;
};

export const getRiwayatList = () => {
  return cacheRiwayat;
};

export const addRiwayat = (riwayatItem: any) => {
  const user = getCurrentUser();
  const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
  
  const fullItem = {
    id,
    username: user?.username || 'unknown',
    puskesmas: user?.puskesmas || riwayatItem.puskesmas || null,
    waktu: riwayatItem.waktu,
    user: user?.nama || riwayatItem.user || 'Pengguna',
    role: user?.role || riwayatItem.role || 'Pengguna',
    action: riwayatItem.action,
    kategori: riwayatItem.kategori,
    pesan: riwayatItem.pesan,
    docId: riwayatItem.docId || null
  };
  
  cacheRiwayat.unshift(fullItem);
  cacheRiwayat = cacheRiwayat.slice(0, 500);
  
  // lgsg tembak ke server
  addRiwayatToServer(fullItem).catch(err => {
    console.warn(`[riwayat] gagal simpan ke server: ${err?.message || err}`);
  });
  
  return cacheRiwayat;
};

export const clearRiwayat = () => {
  cacheRiwayat = [];
};

export const syncRiwayat = async (): Promise<any[]> => {
  try {
    const serverRiwayat = await getRiwayatFromServer();
    if (serverRiwayat && serverRiwayat.length > 0) {
      cacheRiwayat = serverRiwayat;
    }
    return cacheRiwayat;
  } catch (error) {
    console.warn('err sync riwayat:', error);
    return cacheRiwayat;
  }
};

const getStatusStyling = (status: string) => {
  switch (status) {
    case 'Layak': return { statusBg: 'bg-[#e0f2ef]', statusText: 'text-[#1a5c52]', analysisBg: 'bg-[#e0f2ef]', analysisText: 'text-[#1a5c52]', dotColor: 'bg-[#2e9e6e]' };
    case 'Menunggu Review':
    case 'Pending': return { statusBg: 'bg-[#fef9e8]', statusText: 'text-[#c79b0c]', analysisBg: 'bg-[#fef9e8]', analysisText: 'text-[#c79b0c]', dotColor: 'bg-[#e6a91f]' };
    case 'Tidak Layak': return { statusBg: 'bg-[#fef0f0]', statusText: 'text-[#c70c0c]', analysisBg: 'bg-[#fef0f0]', analysisText: 'text-[#c70c0c]', dotColor: 'bg-[#e61f1f]' };
    default: return { statusBg: '', statusText: '', analysisBg: '', analysisText: '', dotColor: '' };
  }
};

export const syncDocs = async (): Promise<any[]> => {
  try {
    const serverUploads = await getUploadedFilesFromServer();
    const localDocs = getDocs();
    const baselineDocs = localDocs.length > 0 ? localDocs : genDocs();

    if (serverUploads && serverUploads.length > 0) {
      serverUploads.forEach((upload: any) => {
        const docIndex = baselineDocs.findIndex(d => d.id === upload.id);
        if (docIndex !== -1) {
          baselineDocs[docIndex] = {
            ...baselineDocs[docIndex],
            uploadedFileName: upload.fileName || baselineDocs[docIndex].uploadedFileName || undefined,
            fileData: upload.fileData || baselineDocs[docIndex].fileData || undefined,
            fileType: upload.fileType || baselineDocs[docIndex].fileType || undefined,
            videoLink: upload.videoLink || baselineDocs[docIndex].videoLink || undefined,
            uploadedAt: upload.uploadedAt || baselineDocs[docIndex].uploadedAt || undefined,
            uploadedBy: upload.uploadedBy || baselineDocs[docIndex].uploadedBy || undefined,
            status: upload.status || baselineDocs[docIndex].status || '',
            keterangan: upload.keterangan || baselineDocs[docIndex].keterangan || '',
            analysis: upload.analysis || baselineDocs[docIndex].analysis || '',
            lastModified: upload.lastModified || baselineDocs[docIndex].lastModified || undefined,
            modifiedBy: upload.modifiedBy || baselineDocs[docIndex].modifiedBy || undefined,
            ...getStatusStyling(upload.status || baselineDocs[docIndex].status)
          };
        } else {
          const docTypeInfo = documentTypes.find(dt => dt.name === upload.documentType);
          const icon = docTypeInfo ? docTypeInfo.icon : '📋';
          const isVideo = docTypeInfo ? docTypeInfo.isVideo : false;
          const status = upload.status || 'Menunggu Review';
          
          const newDoc = {
            id: upload.id,
            numericId: Math.floor(Math.random() * 1000000) + 10000,
            no: 1,
            icon: icon,
            name: upload.documentType,
            uploadedFileName: upload.fileName || undefined,
            fileData: upload.fileData || undefined,
            fileType: upload.fileType || undefined,
            videoLink: upload.videoLink || undefined,
            uploadedAt: upload.uploadedAt || undefined,
            uploadedBy: upload.uploadedBy || 'Pengguna',
            status: status,
            keterangan: upload.keterangan || '',
            analysis: upload.analysis || 'Menunggu Review',
            lastModified: upload.lastModified || undefined,
            modifiedBy: upload.modifiedBy || undefined,
            puskesmas: upload.puskesmas,
            month: upload.month,
            year: upload.year,
            isVideo: isVideo,
            ...getStatusStyling(status)
          };
          baselineDocs.push(newDoc);
        }
      });
    }

    saveDocs(baselineDocs);
    return baselineDocs;
  } catch (error) {
    console.warn('sync error:', error);
    return getDocs();
  }
};
