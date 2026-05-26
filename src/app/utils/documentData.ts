export const createDocumentId = (puskesmas: string, documentType: string, month: string, year: string) => {
  const seed = `${puskesmas}|${documentType}|${month}|${year}`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `doc${(hash >>> 0).toString(36)}`;
};

export const generateDocuments = () => {
  const puskesmasList = [
    'Mulia Hati 1', 'Mulia Hati 2', 'Budi Mulia 1', 'Budi Mulia 2',
    'Harapan Kasih 1', 'Harapan Kasih 2', 'Sentosa 1', 'Sentosa 2',
    'Citra Medika 1', 'Citra Medika 2', 'Sehat Mandiri 1'
  ];
  const documentTypes = [
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
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const years = ['2024', '2025', '2026'];

  let allDocs: any[] = [];
  let globalId = 1;

  puskesmasList.forEach((puskesmas, puskesmasIndex) => {
    let no = 1; // Reset numbering for each Puskesmas
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

      // Create unique alphanumeric ID based on puskesmas, document type, month, and year
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

// Get documents from localStorage or return empty baseline
export const getDocuments = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('documents');
    if (stored) {
      const docs = JSON.parse(stored);
      // Check if documents have old numeric IDs and need migration
      if (docs.length > 0 && typeof docs[0].id === 'number') {
        // Old format detected, regenerate with new unique IDs but preserve status
        const newDocs = generateDocuments();
        // Migrate status and data from old docs to new docs
        newDocs.forEach(newDoc => {
          const oldDoc = docs.find((d: any) =>
            d.name === newDoc.name &&
            d.puskesmas === newDoc.puskesmas &&
            d.month === newDoc.month &&
            d.year === newDoc.year
          );
          if (oldDoc) {
            newDoc.status = oldDoc.status || '';
            newDoc.keterangan = oldDoc.keterangan || '';
            newDoc.analysis = oldDoc.analysis || '';
            newDoc.lastModified = oldDoc.lastModified;
            newDoc.modifiedBy = oldDoc.modifiedBy;
            newDoc.statusBg = oldDoc.statusBg;
            newDoc.statusText = oldDoc.statusText;
            newDoc.analysisBg = oldDoc.analysisBg;
            newDoc.analysisText = oldDoc.analysisText;
            newDoc.dotColor = oldDoc.dotColor;
          }
        });
        // Save migrated data
        saveDocuments(newDocs);
        return newDocs;
      }
      return docs;
    }
  }
  return [];
};

// Save documents to localStorage
export const saveDocuments = (documents: any[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('documents', JSON.stringify(documents));
  }
};

// Reset documents to initial empty baseline
export const resetDocuments = () => {
  if (typeof window !== 'undefined') {
    const documents: any[] = [];
    saveDocuments(documents);
    return documents;
  }
  return [];
};

// ===== RIWAYAT HISTORY SYSTEM =====
export const getRiwayatList = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('riwayat_history');
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return [];
};

export const addRiwayat = (riwayatItem: any) => {
  if (typeof window !== 'undefined') {
    const list = getRiwayatList();
    // Add ke awal list (most recent first)
    list.unshift(riwayatItem);
    // Limit ke 500 items terakhir
    const limited = list.slice(0, 500);
    localStorage.setItem('riwayat_history', JSON.stringify(limited));
    return limited;
  }
  return [];
};

export const clearRiwayat = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('riwayat_history');
  }
};
