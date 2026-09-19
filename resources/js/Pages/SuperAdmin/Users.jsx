import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import SuperAdminNav from '@/Components/SuperAdminNav';

const labels = { customer: 'Customer', admin: 'Admin', courier: 'Courier', super_admin: 'Super Admin' };

export default function Users({ users, filters, staffAccesses = [] }) {
  const [search, setSearch] = useState(filters.search || '');
  const staffAccessForm = useForm({ email: '', role: 'admin' });
  const searchUsers = (event) => { event.preventDefault(); router.get(route('super-admin.users.index'), { search }, { preserveState: true, replace: true }); };
  const registerStaffAccess = (event) => {
    event.preventDefault();
    if (!window.confirm(`Daftarkan ${staffAccessForm.data.email} sebagai ${labels[staffAccessForm.data.role]}?`)) return;
    staffAccessForm.post(route('super-admin.staff-accesses.store'), { preserveScroll: true, onSuccess: () => staffAccessForm.reset('email') });
  };

  return <div className="min-h-screen bg-[#F7F3ED] text-[#2C1E16]">
    <Head title="User Management" /><SuperAdminNav active="users" />
    <main className="p-6 sm:p-10"><div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#2C1E16]/10 pb-7"><div><p className="text-[11px] font-bold uppercase tracking-[.2em] text-violet-700">Access governance</p><h1 className="mt-2 text-3xl font-bold">User Management</h1><p className="mt-2 text-sm text-[#2C1E16]/60">Akun publik tetap Customer. Akses Admin dan Courier hanya aktif setelah email yang didaftarkan masuk dengan Google OAuth.</p></div><Link href={route('super-admin.dashboard')} className="text-sm font-semibold text-violet-700">← Ringkasan</Link></div>

      <section className="mt-6 border border-violet-200 bg-violet-50 p-5"><h2 className="text-lg font-bold">Daftarkan akses staf</h2><p className="mt-1 text-sm text-[#2C1E16]/60">Tidak ada email undangan yang dikirim. Bagikan instruksi login Google kepada pemilik Gmail yang Anda daftarkan.</p>
        <form onSubmit={registerStaffAccess} className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_11rem_auto]">
          <label className="block text-xs font-bold text-[#2C1E16]/70">Email Gmail<input type="email" required value={staffAccessForm.data.email} onChange={(event) => staffAccessForm.setData('email', event.target.value)} placeholder="nama@gmail.com" className="mt-1.5 block w-full min-w-0 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-violet-600" /></label>
          <label className="block text-xs font-bold text-[#2C1E16]/70">Role akses<select value={staffAccessForm.data.role} onChange={(event) => staffAccessForm.setData('role', event.target.value)} className="mt-1.5 block w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-600"><option value="admin">Admin</option><option value="courier">Courier</option></select></label>
          <button disabled={staffAccessForm.processing} className="h-11 self-end rounded-xl bg-violet-800 px-5 text-sm font-semibold text-white disabled:opacity-60">{staffAccessForm.processing ? 'Mendaftarkan...' : 'Daftarkan akses'}</button>
        </form>
        {staffAccessForm.errors.email && <p className="mt-2 text-xs font-medium text-red-600">{staffAccessForm.errors.email}</p>}
      </section>

      <section className="mt-5 overflow-x-auto border border-[#2C1E16]/10 bg-white shadow-sm"><div className="border-b border-[#2C1E16]/10 p-4"><h2 className="font-bold">Akses staf terdaftar</h2></div><table className="w-full text-left text-sm"><thead className="bg-violet-950 text-white"><tr><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4">Diaktifkan oleh</th><th className="p-4">Aksi</th></tr></thead><tbody>{staffAccesses.map((access) => <tr key={access.id} className="border-t border-[#2C1E16]/10"><td className="p-4 font-medium">{access.email}</td><td className="p-4">{labels[access.role]}</td><td className="p-4"><span className={`rounded-full px-2 py-1 text-xs font-bold ${access.status === 'active' ? 'bg-emerald-100 text-emerald-700' : access.status === 'revoked' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{access.status === 'active' ? 'Aktif' : access.status === 'revoked' ? 'Dicabut' : 'Menunggu Google Login'}</span></td><td className="p-4">{access.activated_user?.name || '—'}</td><td className="p-4">{access.status !== 'revoked' && <button onClick={() => { if (window.confirm(`Cabut akses ${access.email}?`)) router.delete(route('super-admin.staff-accesses.destroy', access.id), { preserveScroll: true }); }} className="text-xs font-bold text-red-600">Cabut akses</button>}</td></tr>)}{staffAccesses.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-sm text-[#2C1E16]/55">Belum ada akses staf yang didaftarkan.</td></tr>}</tbody></table></section>
      <form onSubmit={searchUsers} className="mt-8 flex gap-2"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau email" className="w-full rounded-xl border border-[#2C1E16]/15 bg-white px-4 py-2.5" /><button className="rounded-xl bg-violet-800 px-5 py-2 text-sm font-semibold text-white">Cari</button></form>
      <div className="mt-5 overflow-x-auto border border-[#2C1E16]/10 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-violet-950 text-white"><tr><th className="p-4">Nama</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Google</th><th className="p-4">Dibuat</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-t border-[#2C1E16]/10 transition hover:bg-violet-50/50"><td className="p-4 font-semibold">{user.name}</td><td className="p-4">{user.email}</td><td className="p-4"><span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-bold text-violet-700">{labels[user.role]}</span></td><td className="p-4">{user.google_id ? 'Terhubung' : '—'}</td><td className="p-4">{new Date(user.created_at).toLocaleDateString('id-ID')}</td></tr>)}</tbody></table></div>
    </div></main>
  </div>;
}
