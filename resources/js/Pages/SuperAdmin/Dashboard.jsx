import { Head, Link, usePage } from '@inertiajs/react';

export default function SuperAdminDashboard({ userCount }) {
    const { auth } = usePage().props;
    return <main className="min-h-screen bg-[#FDFBF7] p-6 text-[#2C1E16] sm:p-12"><Head title="Super Admin Dashboard" />
        <section className="mx-auto max-w-4xl rounded-3xl border border-[#2C1E16]/10 bg-white p-8 shadow-sm sm:p-10">
            <p className="text-sm font-bold uppercase tracking-widest text-[#D4813E]">Kopi Gajahmada · Super Admin</p>
            <h1 className="mt-3 text-3xl font-bold">Selamat datang, {auth.user.name}</h1>
            <div className="mt-8 grid gap-5 sm:grid-cols-2"><div className="rounded-2xl bg-[#FDFBF7] p-6"><p className="text-sm text-[#2C1E16]/60">Total pengguna</p><p className="mt-2 text-4xl font-bold">{userCount}</p></div><Link href={route('super-admin.users.index')} className="rounded-2xl bg-[#D4813E] p-6 text-white"><p className="font-bold">User Management</p><p className="mt-2 text-sm text-white/85">Atur role customer, admin, dan courier.</p></Link></div>
            <Link href={route('logout')} method="post" as="button" className="mt-8 text-sm font-semibold text-[#2C1E16]/70">Keluar</Link>
        </section>
    </main>;
}
