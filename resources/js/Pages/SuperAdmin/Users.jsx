import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const labels = { customer: 'Customer', admin: 'Admin', courier: 'Courier', super_admin: 'Super Admin' };
export default function Users({ users, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const searchUsers = (event) => { event.preventDefault(); router.get(route('super-admin.users.index'), { search }, { preserveState: true, replace: true }); };
    const updateRole = (user, role) => router.patch(route('super-admin.users.role.update', user.id), { role }, { preserveScroll: true });
    return <main className="min-h-screen bg-[#FDFBF7] p-6 text-[#2C1E16] sm:p-12"><Head title="User Management" />
        <div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-[#D4813E]">Super Admin</p><h1 className="mt-2 text-3xl font-bold">User Management</h1></div><Link href={route('super-admin.dashboard')} className="text-sm font-semibold">← Dashboard</Link></div>
        <form onSubmit={searchUsers} className="mt-7 flex gap-2"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau email" className="w-full rounded-xl border-[#2C1E16]/20 bg-white px-4 py-2"/><button className="rounded-xl bg-[#2C1E16] px-4 py-2 text-sm font-semibold text-white">Cari</button></form>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#2C1E16]/10 bg-white"><table className="w-full text-left text-sm"><thead className="bg-[#2C1E16] text-white"><tr><th className="p-4">Nama</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Google</th><th className="p-4">Dibuat</th><th className="p-4">Ubah role</th></tr></thead><tbody>{users.map(user => <tr key={user.id} className="border-t border-[#2C1E16]/10"><td className="p-4 font-semibold">{user.name}</td><td className="p-4">{user.email}</td><td className="p-4">{labels[user.role]}</td><td className="p-4">{user.google_id ? 'Terhubung' : '—'}</td><td className="p-4">{new Date(user.created_at).toLocaleDateString('id-ID')}</td><td className="p-4">{user.role === 'super_admin' ? <span className="text-[#2C1E16]/50">Dilindungi</span> : <select value={user.role} onChange={e => updateRole(user, e.target.value)} className="rounded-lg border-[#2C1E16]/20 text-sm"><option value="customer">Customer</option><option value="admin">Admin</option><option value="courier">Courier</option></select>}</td></tr>)}</tbody></table></div></div>
    </main>;
}
