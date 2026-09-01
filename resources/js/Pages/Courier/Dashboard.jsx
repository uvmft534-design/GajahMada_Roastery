import { Head, Link } from '@inertiajs/react';

export default function CourierDashboard() {
    return <main className="min-h-screen bg-[#FDFBF7] p-6 text-[#2C1E16] sm:p-12">
        <Head title="Courier Dashboard" />
        <section className="mx-auto max-w-2xl rounded-3xl border border-[#2C1E16]/10 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-widest text-[#D4813E]">Kopi Gajahmada</p>
            <h1 className="mt-3 text-3xl font-bold">Courier Dashboard</h1>
            <p className="mt-3 text-[#2C1E16]/70">Fitur courier akan dikembangkan pada tahap berikutnya.</p>
            <Link href={route('logout')} method="post" as="button" className="mt-7 rounded-xl bg-[#2C1E16] px-4 py-2 text-sm font-semibold text-white">Keluar</Link>
        </section>
    </main>;
}
