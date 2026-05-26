import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import imgImage3 from '../../imports/Frame271-1/ecd5bb1c63617aeaceefdae80e49afd2e592d178.png';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { getDocuments } from '../utils/documentData';
import Group284 from "../../imports/Group284/Group284";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';

export default function BerandaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedYear, setSelectedYear] = useState('2025');
  const [allDocuments, setAllDocuments] = useState(getDocuments());
  const [isVerifikasiExpanded, setIsVerifikasiExpanded] = useState(true);
  const [showPuskesmasModal, setShowPuskesmasModal] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Reload documents from localStorage on mount
  useEffect(() => {
    const interval = setInterval(() => {
      setAllDocuments(getDocuments());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Only count documents that have been uploaded
  const uploadedDocuments = allDocuments.filter((doc: any) => doc.uploadedAt);
  const filteredDocuments = uploadedDocuments.filter((doc: any) => doc.year === selectedYear);

  // Calculate statistics
  const totalBerkas = filteredDocuments.length;
  const terverifikasi = filteredDocuments.filter((doc: any) => doc.lastModified && doc.status === 'Layak').length;
  const pending = filteredDocuments.filter((doc: any) => doc.lastModified && doc.status === 'Pending').length;
  const ditolak = filteredDocuments.filter((doc: any) => doc.lastModified && doc.status === 'Tidak Layak').length;

  const stats = [
    { label: 'Total Berkas', value: totalBerkas.toString(), bgColor: 'bg-[#d3e9ed]', iconColor: 'text-[#090D97]' },
    { label: 'Terverifikasi', value: terverifikasi.toString(), bgColor: 'bg-[#d3edd9]', iconColor: 'text-[#09976C]' },
    { label: 'Review Tertunda', value: pending.toString(), bgColor: 'bg-[#ecedd3]', iconColor: 'text-[#976C09]' },
    { label: 'Ditolak', value: ditolak.toString(), bgColor: 'bg-[#edd3d3]', iconColor: 'text-[#97090B]' },
  ];

  // Calculate per-Puskesmas data
  const puskesmasList = [
    'Mulia Hati 1', 'Mulia Hati 2', 'Budi Mulia 1', 'Budi Mulia 2',
    'Harapan Kasih 1', 'Harapan Kasih 2', 'Sentosa 1', 'Sentosa 2',
    'Citra Medika 1', 'Citra Medika 2', 'Sehat Mandiri 1'
  ];

  const fullPuskesmasData = puskesmasList.map(puskesmasName => {
    const puskesmasDocs = uploadedDocuments.filter((doc: any) => doc.puskesmas === puskesmasName && doc.year === selectedYear);
    const verified = puskesmasDocs.filter((doc: any) => doc.lastModified && doc.status === 'Layak').length;
    const pendingCount = puskesmasDocs.filter((doc: any) => doc.lastModified && doc.status === 'Pending').length;
    const rejected = puskesmasDocs.filter((doc: any) => doc.lastModified && doc.status === 'Tidak Layak').length;
    const total = puskesmasDocs.length;
    const percentage = total > 0 ? Math.round(((verified + pendingCount + rejected) / total) * 100) : 0;

    return {
      name: `Puskesmas ${puskesmasName}`,
      verified,
      pending: pendingCount,
      rejected,
      total,
      percentage
    };
  }).sort((a, b) => b.percentage - a.percentage);

  const puskesmasData = fullPuskesmasData.slice(0, 5);

  // Calculate monthly trends
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthlyData = months.map(month => {
    const monthDocs = uploadedDocuments.filter((doc: any) => doc.month === month && doc.year === selectedYear);
    return {
      month,
      verified: monthDocs.filter((doc: any) => doc.lastModified && doc.status === 'Layak').length,
      pending: monthDocs.filter((doc: any) => doc.lastModified && doc.status === 'Pending').length,
      rejected: monthDocs.filter((doc: any) => doc.lastModified && doc.status === 'Tidak Layak').length
    };
  });

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <Sidebar avatarSrc={imgImage3} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Beranda" avatarSrc={imgImage3} userName="Tabita Antika" />

        {/* Content Area */}
        <div className="flex-1 bg-[#eee] bg-opacity-70 overflow-y-auto p-6">
          {/* Year Filter */}
          <div className="flex justify-end mb-4">
            <select
              title="Pilih Tahun"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white border-2 border-[#1f6f5f] rounded-[10px] px-4 py-2 font-['Mukta'] text-[14px] text-[#1f6f5f] cursor-pointer outline-none"
            >
              <option value="2024">Tahun 2024</option>
              <option value="2025">Tahun 2025</option>
              <option value="2026">Tahun 2026</option>
            </select>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-[#fcfffa] border-2 border-[#1f6f5f] rounded-[17px] p-4 shadow-md">
                <div className={`${stat.bgColor} rounded-lg w-12 h-12 flex items-center justify-center mb-3`}>
                  <svg className={`w-8 h-8 ${stat.iconColor}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                  </svg>
                </div>
                <p className="text-[35px] font-['Mukta'] font-extrabold opacity-70">{stat.value}</p>
                <p className="text-[18px] text-[#5e5e5e] opacity-70 font-['Mukta']">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Monthly Trends */}
            <div className="col-span-2 bg-[#fcfffa] border-2 border-[#1f6f5f] rounded-[17px] p-6 shadow-md">
              <h3 className="text-[27px] font-['Mukta'] font-extrabold opacity-70 mb-2">Tren Bulanan</h3>
              <p className="text-[15px] text-[#5e5e5e] opacity-70 mb-4 font-['Mukta'] -mt-1">Statistik verifikasi berkas per bulan</p>
              <div className="h-48 flex items-end justify-around gap-2 border-b border-black pb-2 mt-36">
                {monthlyData.map((data, idx) => {
                  const maxHeight = 180;
                  const maxValue = Math.max(...monthlyData.map(d => d.verified + d.pending + d.rejected));
                  const scale = maxValue > 0 ? maxHeight / maxValue : 1;
                  const monthShort = data.month.substring(0, 3);

                  return (
                    <div key={data.month} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="w-full flex flex-col items-center gap-1">
                        {data.verified > 0 && (
                          <div
                            className="w-4 bg-[#2fa084] rounded-t transition-all duration-300 hover:bg-[#25826b] hover:scale-110 cursor-pointer shadow-sm hover:shadow-lg"
                            style={{ height: `${Math.max(data.verified * scale, 10)}px` }}
                            title={`Terverifikasi: ${data.verified}`}
                          ></div>
                        )}
                        {data.pending > 0 && (
                          <div
                            className="w-4 bg-[#ebbd14] rounded-t transition-all duration-300 hover:bg-[#d4aa0f] hover:scale-110 cursor-pointer shadow-sm hover:shadow-lg"
                            style={{ height: `${Math.max(data.pending * scale, 10)}px` }}
                            title={`Pending: ${data.pending}`}
                          ></div>
                        )}
                        {data.rejected > 0 && (
                          <div
                            className="w-4 bg-[#f94141] rounded-t transition-all duration-300 hover:bg-[#e03030] hover:scale-110 cursor-pointer shadow-sm hover:shadow-lg"
                            style={{ height: `${Math.max(data.rejected * scale, 10)}px` }}
                            title={`Ditolak: ${data.rejected}`}
                          ></div>
                        )}
                      </div>
                      <p className="text-[13px] text-[#5e5e5e] opacity-70 group-hover:font-semibold transition-all">{monthShort}</p>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-6 mt-8 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#2fa084]"></div>
                  <span className="text-[11px] text-[#5e5e5e]">Terverifikasi</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#ebbd14]"></div>
                  <span className="text-[11px] text-[#5e5e5e]">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#f94141]"></div>
                  <span className="text-[11px] text-[#5e5e5e]">Ditolak</span>
                </div>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-[#fcfffa] border-2 border-[#1f6f5f] rounded-[17px] p-6 shadow-md">
              <h3 className="text-[27px] font-['Mukta'] font-extrabold opacity-70 mb-2">Distribusi Status</h3>
              <p className="text-[15px] text-[#5e5e5e] opacity-70 mb-4 font-['Mukta']">Persentase status berkas</p>
              <div className="relative w-40 h-40 mx-auto mb-4">
                {(() => {
                  const total = terverifikasi + pending + ditolak;
                  const circumference = 2 * Math.PI * 40;
                  const verifiedPercent = total > 0 ? (terverifikasi / total) * 100 : 0;
                  const pendingPercent = total > 0 ? (pending / total) * 100 : 0;
                  const rejectedPercent = total > 0 ? (ditolak / total) * 100 : 0;

                  const verifiedDash = (verifiedPercent / 100) * circumference;
                  const pendingDash = (pendingPercent / 100) * circumference;
                  const rejectedDash = (rejectedPercent / 100) * circumference;

                  const verifiedOffset = 0;
                  const pendingOffset = -verifiedDash;
                  const rejectedOffset = -(verifiedDash + pendingDash);

                  const totalVerifiedPercent = totalBerkas > 0 ? Math.round((terverifikasi / totalBerkas) * 100) : 0;

                  return (
                    <>
                      <svg viewBox="0 0 100 100" className="transform -rotate-90">
                        {verifiedDash > 0 && (
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#2fa084" strokeWidth="20"
                            strokeDasharray={`${verifiedDash} ${circumference}`}
                            strokeDashoffset={verifiedOffset} />
                        )}
                        {pendingDash > 0 && (
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#ebbd14" strokeWidth="20"
                            strokeDasharray={`${pendingDash} ${circumference}`}
                            strokeDashoffset={pendingOffset} />
                        )}
                        {rejectedDash > 0 && (
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#f94141" strokeWidth="20"
                            strokeDasharray={`${rejectedDash} ${circumference}`}
                            strokeDashoffset={rejectedOffset} />
                        )}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-[11px] text-black">{totalVerifiedPercent}%</p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#2fa084]"></div>
                  <span className="text-[11px] text-[#5e5e5e]">Terverifikasi</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#ebbd14]"></div>
                  <span className="text-[11px] text-[#5e5e5e]">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#f94141]"></div>
                  <span className="text-[11px] text-[#5e5e5e]">Ditolak</span>
                </div>
              </div>
            </div>
          </div>

          {/* Puskesmas Progress */}
          <div className="bg-[#fcfffa] border-2 border-[#1f6f5f] rounded-[17px] p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-[27px] font-['Mukta'] font-extrabold opacity-70">Kelengkapan Berkas per Puskesmas</h3>
                <p className="text-[15px] text-[#5e5e5e] opacity-70 font-['Mukta']">Progres pengumpulan berkas Prolanis</p>
              </div>
              <button
                onClick={() => setShowPuskesmasModal(true)}
                className="text-[15px] text-[#5e5e5e] opacity-70 hover:text-[#1f6f5f] transition-colors"
              >
                lihat semua
              </button>
            </div>

            <div className="space-y-4">
              {puskesmasData.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[18px] font-['Mukta'] font-medium opacity-70">{item.name}</p>
                    <p className="text-[15px] font-['Mukta'] font-semibold opacity-70">{item.percentage}%</p>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                    <div className="bg-[#2fa084]" style={{ width: `${item.percentage > 0 ? (item.verified / (item.verified + item.pending + item.rejected)) * item.percentage : 0}%` }}></div>
                    <div className="bg-[#ebbd14]" style={{ width: `${item.percentage > 0 ? (item.pending / (item.verified + item.pending + item.rejected)) * item.percentage : 0}%` }}></div>
                    <div className="bg-[#f94141]" style={{ width: `${item.percentage > 0 ? (item.rejected / (item.verified + item.pending + item.rejected)) * item.percentage : 0}%` }}></div>
                  </div>
                  <div className="flex gap-4 mt-1 text-[8px] text-[#5e5e5e] opacity-70">
                    <span>{item.verified} Terverifikasi</span>
                    <span>{item.pending} Pending</span>
                    <span>{item.rejected} Ditolak</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Dialog open={showPuskesmasModal} onOpenChange={setShowPuskesmasModal}>
        <DialogContent className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden bg-white rounded-[24px] shadow-2xl">
          <DialogHeader className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <DialogTitle className="text-[20px] font-semibold text-[#1f6f5f]">Detail Kelengkapan Berkas</DialogTitle>
              <DialogDescription className="text-[13px] text-[#5e5e5e] opacity-80">Semua Puskesmas untuk tahun {selectedYear}</DialogDescription>
            </div>
          </DialogHeader>
          <div className="max-h-[75vh] overflow-y-auto p-6 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {fullPuskesmasData.map((item, index) => (
                <div key={index} className="bg-[#f8faf7] rounded-[15px] p-4 border border-[#dbe9e0]">
                  <div className="flex items-center justify-between mb-3 gap-4">
                    <div>
                      <p className="text-[14px] text-[#5e5e5e] uppercase tracking-[0.15em] font-semibold font-['Mukta']">{item.name}</p>
                      <p className="text-[12px] text-[#8b8b8b] mt-1">Total berkas: {item.total}</p>
                    </div>
                    <span className="text-[16px] font-bold text-[#1f6f5f]">{item.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#e9f4ef] overflow-hidden mb-3">
                    <div className="h-full bg-[#2fa084]" style={{ width: `${item.total > 0 ? (item.verified / item.total) * 100 : 0}%` }} />
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-[#f8f8f8] mb-3">
                    <div className="bg-[#2fa084]" style={{ width: `${item.total > 0 ? (item.verified / item.total) * 100 : 0}%` }} />
                    <div className="bg-[#ebbd14]" style={{ width: `${item.total > 0 ? (item.pending / item.total) * 100 : 0}%` }} />
                    <div className="bg-[#f94141]" style={{ width: `${item.total > 0 ? (item.rejected / item.total) * 100 : 0}%` }} />
                  </div>
                  <div className="flex flex-wrap gap-2 text-[12px] text-[#5e5e5e]">
                    <span className="px-2 py-1 rounded-full bg-[#dff5e4] text-[#1b5d42]">Terverifikasi {item.verified}</span>
                    <span className="px-2 py-1 rounded-full bg-[#fff5d4] text-[#6d5b12]">Pending {item.pending}</span>
                    <span className="px-2 py-1 rounded-full bg-[#ffe5e5] text-[#9d2626]">Ditolak {item.rejected}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
