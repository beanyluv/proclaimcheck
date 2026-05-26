// ManajemenPenggunaPage.tsx — Letakkan di src/app/pages/ManajemenPenggunaPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import imgImage3 from '../../imports/VerifikasiBerkasProclaimCheck-1/ecd5bb1c63617aeaceefdae80e49afd2e592d178.png';
import Group284 from "../../imports/Group284/Group284";
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { getUsers, saveUsers, getCurrentUser } from '../utils/userData';
import { getUsersFromServer, createUserOnServer, updateUserOnServer, deleteUserOnServer } from '../utils/serverApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';

interface User { id: string; username: string; password: string; nama: string; email: string; role: string; foto?: string; }

const ROLES = ['Administrasi Klaim', 'Dokter', 'Petugas Puskesmas', 'Supervisor'];
const ROLE_PERMISSIONS: Record<string, string[]> = {
  'Administrasi Klaim': ['Beranda', 'Verifikasi Berkas', 'Laporan', 'Riwayat', 'Pengaturan'],
  'Dokter': ['Beranda', 'Verifikasi Berkas', 'Laporan'],
  'Petugas Puskesmas': ['Beranda', 'Unggah Berkas'],
  'Supervisor': ['Beranda', 'Verifikasi Berkas', 'Laporan', 'Riwayat'],
};

export default function ManajemenPenggunaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const currentUser = getCurrentUser();
  const [isVerifikasiExpanded, setIsVerifikasiExpanded] = useState(false);
  const [isPengaturanExpanded, setIsPengaturanExpanded] = useState(true);

  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ nama: '', username: '', email: '', password: '', role: 'Dokter' });
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const serverUsers = await getUsersFromServer();
        setUsers(serverUsers);
      } catch (error) {
        console.warn('Gagal ambil pengguna dari server, fallback ke local', error);
        setUsers(getUsers());
      }
    };

    loadUsers();

    const user = getCurrentUser();
    if (!user) {
      navigate('/');
      return;
    }

    if (user.role !== 'Administrasi Klaim') {
      navigate('/pengaturan');
    }
  }, [navigate]);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleSave = async () => {
    if (!form.nama || !form.username || !form.role) { showMsg('Harap isi nama, username, dan role', 'error'); return; }
    if (!editUser && !form.password) { showMsg('Password wajib diisi untuk pengguna baru', 'error'); return; }

    try {
      if (!editUser) {
        // Tambah pengguna baru
        const newUser: User = {
          id: Date.now().toString(),
          nama: form.nama,
          username: form.username,
          email: form.email,
          password: form.password,
          role: form.role,
        };
        const created = await createUserOnServer(newUser);
        const updated = [...users, created];
        setUsers(updated);
        showMsg(`Pengguna "${form.nama}" berhasil ditambahkan`);
      } else {
        const updatedUser = await updateUserOnServer(editUser.id, {
          username: form.username,
          password: form.password,
          nama: form.nama,
          email: form.email,
          role: form.role,
        });
        const updated = users.map(u => u.id === editUser.id ? updatedUser : u);
        setUsers(updated);
        showMsg(`Pengguna "${form.nama}" berhasil diperbarui`);
      }
    } catch (error: any) {
      showMsg(error?.message || 'Gagal menyimpan pengguna', 'error');
      return;
    }

    setShowForm(false);
    setEditUser(null);
    setForm({ nama: '', username: '', email: '', password: '', role: 'Dokter' });
  };

  const handleEdit = (user: User) => {
    setEditUser(user);
    setForm({ nama: user.nama, username: user.username, email: user.email, password: '', role: user.role });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) { showMsg('Tidak dapat menghapus akun sendiri', 'error'); return; }
    try {
      await deleteUserOnServer(id);
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      setDeleteConfirm(null);
      showMsg('Pengguna berhasil dihapus');
    } catch (error: any) {
      showMsg(error?.message || 'Gagal menghapus pengguna', 'error');
    }
  };

  const sidebarItem = (path: string, label: string) => (
    <div onClick={() => navigate(path)}
      className={`flex items-center px-3 py-2.5 rounded-lg cursor-pointer mb-1 transition-all duration-200 ${isActive(path) ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'}`}>
      {isActive(path) && <div className="w-1 h-5 bg-white rounded-full mr-2" />}
      <p className={`font-['Mukta'] text-[15px] text-white ${isActive(path) ? 'font-semibold' : ''}`}>{label}</p>
    </div>
  );
  const subItem = (path: string, label: string) => (
    <div onClick={() => navigate(path)}
      className={`flex items-center px-3 py-2 rounded-lg cursor-pointer mb-0.5 transition-all duration-200 ${isActive(path) ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'}`}>
      {isActive(path) && <div className="w-1 h-4 bg-white rounded-full mr-2" />}
      <p className={`font-['Mukta'] text-[13px] text-white ${isActive(path) ? 'font-semibold' : 'opacity-80'}`}>{label}</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <Sidebar avatarSrc={imgImage3} />

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Manajemen Pengguna" avatarSrc={imgImage3} userName={currentUser?.nama} />
        <div className="flex-1 bg-[#eee] bg-opacity-70 overflow-y-auto p-6">
          {msg && (
            <div className={`mb-4 p-4 rounded-lg border flex items-center gap-3 ${msgType === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`font-['Mukta'] text-[14px] ${msgType === 'success' ? 'text-green-700' : 'text-red-700'}`}>{msg}</p>
            </div>
          )}

          {/* User list */}
          <div className="bg-white rounded-[10px] shadow-sm overflow-hidden mb-5">
            <div className="p-4 border-b border-[#f0f0f0] flex items-center justify-between">
              <h3 className="font-['Mukta'] font-semibold text-[16px] text-[#1a4a43]">Daftar Pengguna ({users.length})</h3>
              <button onClick={() => { setEditUser(null); setForm({ nama:'',username:'',email:'',password:'',role:'Dokter' }); setShowForm(true); }}
                className="flex items-center gap-2 bg-[#1f6f5f] text-white px-4 py-2 rounded-lg font-['Mukta'] text-[14px] font-medium hover:bg-[#165449] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Tambah Pengguna
              </button>
            </div>
            <table className="w-full">
              <thead className="bg-[#f7fbfa]">
                <tr>
                  {['Nama', 'Username', 'Email', 'Role', 'Akses Menu', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-['Mukta'] text-[12px] text-[#5f9990] font-bold uppercase tracking-wide border-b border-[#e8f4f1]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-[#f8f8f8] hover:bg-[#fafffe] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#1f6f5f] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[12px] font-bold">{user.nama.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</span>
                        </div>
                        <span className="font-['Mukta'] text-[14px] font-medium text-[#1a4a43]">{user.nama}</span>
                        {user.id === currentUser?.id && <span className="text-[10px] bg-[#e0f2ef] text-[#1a5c52] px-2 py-0.5 rounded-full font-medium">Anda</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-['Mukta'] text-[13px] text-[#5f9990]">@{user.username}</td>
                    <td className="px-4 py-3.5 font-['Mukta'] text-[13px] text-[#5f9990]">{user.email || '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full font-['Mukta'] text-[12px] font-medium ${
                        user.role === 'Administrasi Klaim' ? 'bg-blue-100 text-blue-700'
                        : user.role === 'Dokter' ? 'bg-[#e0f2ef] text-[#1a5c52]'
                        : user.role === 'Supervisor' ? 'bg-purple-100 text-purple-700'
                        : 'bg-orange-100 text-orange-700'
                      }`}>{user.role}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(ROLE_PERMISSIONS[user.role] || []).map(p => (
                          <span key={p} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-['Mukta']">{p}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(user)}
                          className="px-3 py-1.5 border border-[#d0e2de] rounded-lg font-['Mukta'] text-[12px] font-medium text-[#1a4a43] hover:bg-[#f0f8f6] transition-colors">
                          Edit
                        </button>
                        {user.id !== currentUser?.id && (
                          <button onClick={() => setDeleteConfirm(user.id)}
                            className="px-3 py-1.5 border border-red-200 rounded-lg font-['Mukta'] text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors">
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Role permissions table */}
          <div className="bg-white rounded-[10px] shadow-sm p-5">
            <h3 className="font-['Mukta'] font-semibold text-[16px] text-[#1a4a43] mb-4">Hak Akses per Role</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-[#f7fbfa]">
                    <th className="px-4 py-2.5 text-left font-['Mukta'] font-bold text-[#5f9990] text-[12px] border-b border-[#e8f4f1]">Menu</th>
                    {Object.keys(ROLE_PERMISSIONS).map(r => (
                      <th key={r} className="px-4 py-2.5 text-center font-['Mukta'] font-bold text-[#5f9990] text-[12px] border-b border-[#e8f4f1]">{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['Beranda','Verifikasi Berkas','Unggah Berkas','Laporan','Riwayat','Pengaturan'].map(menu => (
                    <tr key={menu} className="border-b border-[#f8f8f8]">
                      <td className="px-4 py-2.5 font-['Mukta'] text-[13px] text-[#1a4a43] font-medium">{menu}</td>
                      {Object.values(ROLE_PERMISSIONS).map((perms, i) => (
                        <td key={i} className="px-4 py-2.5 text-center">
                          {perms.includes(menu) ? (
                            <span className="text-[#1f6f5f] text-lg">✓</span>
                          ) : (
                            <span className="text-gray-300 text-lg">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal - converted to Dialog for UI consistency */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-white rounded-[16px] w-full max-w-[520px]">
          <div className="p-5 border-b border-[#f0f0f0] flex justify-between items-center">
            <div>
              <h3 className="font-['Mukta'] font-bold text-[18px] text-[#1a4a43]">{editUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
              <p className="text-[13px] text-[#5f9990]">Isi data pengguna baru di bawah ini.</p>
            </div>
            <DialogHeader>
              <DialogTitle />
            </DialogHeader>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'Nama Lengkap *', key: 'nama', type: 'text', placeholder: 'Masukkan nama lengkap' },
              { label: 'Username *', key: 'username', type: 'text', placeholder: 'Masukkan username' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'Masukkan email' },
              { label: editUser ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password *', key: 'password', type: 'password', placeholder: 'Masukkan password' },
            ].map(f => (
              <div key={f.key}>
                <label className="block font-['Mukta'] text-[13px] font-medium text-[#1a4a43] mb-1.5">{f.label}</label>
                <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                  placeholder={f.placeholder}
                  className="w-full border border-[#d0e2de] rounded-lg px-4 py-2.5 font-['Mukta'] text-[14px] focus:outline-none focus:border-[#1f6f5f] transition-colors" />
              </div>
            ))}
            <div>
              <label className="block font-['Mukta'] text-[13px] font-medium text-[#1a4a43] mb-1.5">Role *</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                className="w-full border border-[#d0e2de] rounded-lg px-4 py-2.5 font-['Mukta'] text-[14px] focus:outline-none focus:border-[#1f6f5f] bg-white">
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
              <p className="font-['Mukta'] text-[11px] text-[#5f9990] mt-1.5">
                Akses: {(ROLE_PERMISSIONS[form.role] || []).join(', ')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-[#d0e2de] rounded-lg font-['Mukta'] text-[14px] text-[#5f9990] hover:bg-gray-50 transition-colors">Batal</button>
            <button onClick={handleSave} className="flex-1 py-2.5 bg-[#1f6f5f] text-white rounded-lg font-['Mukta'] text-[14px] font-medium hover:bg-[#165449] transition-colors">
              {editUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <DialogContent className="bg-white rounded-[16px] w-full max-w-[400px] p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Hapus Pengguna?</DialogTitle>
            <DialogDescription>Tindakan ini tidak dapat dibatalkan. Pengguna akan kehilangan akses ke sistem.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-[#d0e2de] rounded-lg font-['Mukta'] text-[14px] hover:bg-gray-50">Batal</button>
            <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-['Mukta'] text-[14px] font-medium hover:bg-red-700">Hapus</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
