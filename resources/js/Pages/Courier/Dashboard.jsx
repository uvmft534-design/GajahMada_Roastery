import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, MapPin, Phone, Settings, UserRoundCheck } from 'lucide-react';
import { orderStatusLabel } from '../../utils/orderStatus';

export default function CourierDashboard({ orders = [], overview = {} }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef(null);
    const trackingForm = useForm({ tracking_number: '' });

    useEffect(() => {
        const closeProfileMenu = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) setIsProfileMenuOpen(false);
        };
        document.addEventListener('mousedown', closeProfileMenu);
        return () => document.removeEventListener('mousedown', closeProfileMenu);
    }, []);

    const saveTracking = (event, order) => {
        event.preventDefault();
        trackingForm.post(route('courier.orders.save-tracking', order.order_id), { preserveScroll: true, onSuccess: () => trackingForm.reset() });
    };
    const hasCoordinates = (order) => order.destination_latitude !== null
        && order.destination_latitude !== undefined
        && order.destination_longitude !== null
        && order.destination_longitude !== undefined;
    // OpenStreetMap is embedded below; this action deliberately opens Google Maps for navigation.
    const openMapsUrl = (order) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.customer_address)}`;
    const openStreetMapUrl = (order) => {
        const latitude = Number(order.destination_latitude);
        const longitude = Number(order.destination_longitude);
        const offset = 0.003;

        return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - offset}%2C${latitude - offset}%2C${longitude + offset}%2C${latitude + offset}&layer=mapnik&marker=${latitude}%2C${longitude}`;
    };
    const itemConfiguration = (item) => [
        `Metode seduh: ${item.brew_method === 'espresso' ? 'Espresso' : 'Filter'}`,
        item.item_note ? `Catatan produk: ${item.item_note}` : null,
    ].filter(Boolean);

    return <div className="min-h-screen bg-[#FDFBF7] text-[#2C1E16]">
        <Head title="Courier Dashboard" />
        <nav className="border-b border-white/10 bg-[#241811] px-5 py-3 text-[#FDFBF7] sm:px-8">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
                <Link href={route('courier.dashboard')} className="group flex items-center gap-3">
                    <span className="h-10 w-10 overflow-hidden rounded-full border border-white/20 bg-white"><img src="/images/logo.png" alt="Logo Kopi Gajahmada" className="h-full w-full object-cover" /></span>
                    <span><b className="block text-sm transition-colors group-hover:text-[#E6A16D]">Kopi Gajahmada</b><small className="block text-[10px] font-medium uppercase tracking-[.16em] text-white/55">Courier Workspace</small></span>
                </Link>
                <div className="relative" ref={profileMenuRef}>
                    <button type="button" onClick={() => setIsProfileMenuOpen((open) => !open)} aria-expanded={isProfileMenuOpen} aria-haspopup="menu" aria-label="Buka menu profil" className={`relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border transition ${isProfileMenuOpen ? 'border-[#E6A16D] bg-white text-[#B86632] ring-4 ring-[#D4813E]/15' : 'border-white/20 text-white/75 hover:border-[#E6A16D] hover:text-white'}`}>
                        {user?.avatar ? <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" /> : <UserRoundCheck size={20} />}
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#241811] bg-emerald-400" />
                    </button>
                    <AnimatePresence>{isProfileMenuOpen && <motion.div role="menu" initial={{ opacity: 0, y: 10, scale: .95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .95 }} transition={{ duration: .2, ease: 'easeOut' }} className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-[#2C1E16]/10 bg-white py-2 text-[#2C1E16] shadow-2xl"><div className="border-b border-[#2C1E16]/10 bg-[#FDFBF7] px-4 py-3"><p className="truncate text-sm font-bold">{user?.name || 'Courier'}</p><p className="mt-1 truncate text-xs text-[#2C1E16]/55">{user?.email || 'Akun courier'}</p><span className="mt-2 inline-block text-[10px] font-bold uppercase tracking-[.12em] text-[#9A4F1D]">Courier</span></div><Link href={route('profile.edit')} onClick={() => setIsProfileMenuOpen(false)} role="menuitem" className="mt-1 flex items-center gap-3 px-4 py-2 text-xs font-medium text-[#2C1E16]/75 transition hover:bg-[#FFF5EA] hover:text-[#B86632]"><Settings size={15} /> Pengaturan Profil</Link><Link href={route('logout')} method="post" as="button" role="menuitem" className="mt-1 flex w-full items-center gap-3 px-4 py-2 text-left text-xs font-medium text-red-600 transition hover:bg-red-50"><LogOut size={15} /> Keluar</Link></motion.div>}</AnimatePresence>
                </div>
            </div>
        </nav>
        <main className="mx-auto max-w-6xl p-6 sm:p-10">
            <div className="mb-8"><p className="text-xs font-bold uppercase tracking-widest text-[#D4813E]">Operasional pengiriman</p><h1 className="mt-2 text-3xl font-bold">Courier Dashboard</h1><p className="mt-1 text-sm text-[#2C1E16]/60">Kelola pickup dan pengiriman yang ditugaskan kepada Anda.</p></div>
            <section className="mb-8 grid gap-4 sm:grid-cols-3">{[['Pickup Baru', overview.newPickups || 0], ['Sedang Dikirim', overview.inDelivery || 0], ['Selesai Hari Ini', overview.completedToday || 0]].map(([label, value]) => <div key={label} className="rounded-3xl border border-[#2C1E16]/10 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-[#2C1E16]/50">{label}</p><p className="mt-2 text-3xl font-bold text-[#D4813E]">{value}</p></div>)}</section>
            <section className="rounded-3xl border border-[#2C1E16]/10 bg-white p-6 shadow-sm sm:p-8"><div className="mb-6"><h2 className="text-xl font-bold">Pickup Request & Pengiriman</h2><p className="mt-1 text-sm text-[#2C1E16]/60">Hanya pesanan yang ditugaskan kepada Anda ditampilkan.</p></div><div className="space-y-5">{orders.length === 0 && <p className="rounded-2xl bg-[#FDFBF7] p-5 text-sm text-[#2C1E16]/60">Belum ada pesanan yang ditugaskan.</p>}{orders.map((order) => <article key={order.order_id} className="rounded-2xl border border-[#2C1E16]/10 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold">{order.order_number}</p><div className="mt-2 space-y-2 text-xs text-[#2C1E16]/60">{order.items?.map((item) => <div key={item.order_item_id}><p>{item.product_name} × {item.qty}</p>{itemConfiguration(item).map((configuration) => <p key={configuration} className="mt-0.5">{configuration}</p>)}</div>) || 'Produk'}</div></div><span className="rounded-full bg-[#D4813E]/10 px-3 py-1 text-xs font-bold text-[#D4813E]">{orderStatusLabel(order.status)}</span></div><div className="mt-4 grid gap-3 text-sm md:grid-cols-2"><p className="flex gap-2"><Phone size={16} className="shrink-0 text-[#D4813E]" />{order.customer_name} · {order.customer_phone}</p><p className="flex gap-2"><MapPin size={16} className="shrink-0 text-[#D4813E]" />{order.customer_address}</p><p><b>Catatan pesanan:</b> {order.customer_note || 'Tidak ada'}</p><p><b>Pengiriman:</b> {order.shipping_method || 'Belum dipilih'}</p><p><b>Resi:</b> {order.tracking_number || 'Belum tersedia'}</p></div>{hasCoordinates(order) && <div className="mt-4 overflow-hidden rounded-xl border border-[#2C1E16]/10 bg-[#FDFBF7]"><p className="px-3 py-2 text-xs font-bold text-[#2C1E16]/60">Lokasi Tujuan</p><iframe title={`Lokasi tujuan ${order.order_number}`} src={openStreetMapUrl(order)} className="h-52 w-full border-0" loading="lazy" /></div>}<div className="mt-5 flex flex-wrap gap-2"><a href={openMapsUrl(order)} target="_blank" rel="noreferrer" className="rounded-xl border border-[#D4813E]/40 bg-[#FFF5EA] px-4 py-2 text-sm font-bold text-[#B86632]">Buka di Google Maps</a>{order.status === 'pickup_requested' && <button onClick={() => router.post(route('courier.orders.confirm-pickup', order.order_id), {}, { preserveScroll: true })} className="rounded-xl bg-[#D4813E] px-4 py-2 text-sm font-bold text-white">Konfirmasi Pickup</button>}{order.status === 'picked_up' && !order.tracking_number && <><button onClick={() => router.post(route('courier.orders.generate-tracking', order.order_id), {}, { preserveScroll: true })} className="rounded-xl bg-[#D4813E] px-4 py-2 text-sm font-bold text-white">Generate Resi</button><form onSubmit={(event) => saveTracking(event, order)} className="flex gap-2"><input value={trackingForm.data.tracking_number} onChange={(event) => trackingForm.setData('tracking_number', event.target.value)} placeholder="Input resi manual" className="rounded-xl border border-[#2C1E16]/15 px-3 py-2 text-sm" /><button className="rounded-xl border border-[#2C1E16]/15 px-3 py-2 text-sm font-bold">Simpan Resi</button></form></>}{order.status === 'picked_up' && order.tracking_number && <button onClick={() => router.post(route('courier.orders.start-shipping', order.order_id), {}, { preserveScroll: true })} className="rounded-xl bg-[#D4813E] px-4 py-2 text-sm font-bold text-white">Mulai Pengiriman</button>}{order.status === 'shipped' && <button onClick={() => router.post(route('courier.orders.delivered', order.order_id), {}, { preserveScroll: true })} className="rounded-xl bg-[#D4813E] px-4 py-2 text-sm font-bold text-white">Tandai Sudah Sampai</button>}</div></article>)}</div></section>
        </main>
    </div>;
}
