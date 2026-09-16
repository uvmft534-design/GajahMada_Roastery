import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, LoaderCircle, LocateFixed, MapPin, Pencil, Phone, ShoppingBag, Truck, X, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

const rupiah = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
const formattedPhone = (phone = '') => {
    const digits = String(phone).replace(/\D/g, '');
    const localDigits = digits.startsWith('62') ? digits.slice(2) : digits.replace(/^0+/, '');
    const groups = [
        localDigits.slice(0, 3),
        ...(localDigits.slice(3).match(/.{1,4}/g) ?? []),
    ].filter(Boolean).join('-');

    return groups ? `+62 ${groups}` : '';
};
const addressRequiresManualDetails = (address = '') => {
    const hasStreet = /(?:\bjl\.?|\bjalan\b|\bgg\.?|\bgang\b)/i.test(address);
    const hasHouseNumber = /(?:\bno\.?\s*|\bnomor\s*)\d+/i.test(address);

    return !hasStreet || !hasHouseNumber;
};

export default function Checkout({ items, auth, shippingMethods = [], phoneMissing = false }) {
    const { flash } = usePage().props;
    const [confirming, setConfirming] = useState(false);
    const [editingAddress, setEditingAddress] = useState(false);
    const [editingNote, setEditingNote] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState('');
    const { data, setData, post, processing, errors } = useForm({
        cart_item_ids: items.map((item) => item.id), shipping_method_id: shippingMethods[0]?.id ?? '', payment_method: 'virtual_account',
        customer_name: auth.user.name ?? '', customer_phone: auth.user.phone ?? '', customer_address: auth.user.address ?? '', street_name: '', house_number: '', customer_note: '',
    }); 
    const subtotal = items.reduce((total, item) => total + Number(item.product.price) * item.qty, 0);
    const selectedShippingMethod = shippingMethods.find((method) => String(method.id) === String(data.shipping_method_id));
    const deliveryFee = Number(selectedShippingMethod?.delivery_fee ?? 0);
    const total = subtotal + deliveryFee;
    const needsManualAddressDetails = addressRequiresManualDetails(data.customer_address);

    const fillAddressFromCurrentLocation = () => {
        setLocationError('');
        if (!navigator.geolocation) {
            setLocationError('Browser ini tidak mendukung penggunaan lokasi saat ini.');
            return;
        }

        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(async ({ coords }) => {
            try {
                const response = await window.axios.post(route('checkout.current-location'), {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                });
                setData('customer_address', response.data.address);
            } catch (error) {
                setLocationError(error.response?.data?.message || 'Lokasi saat ini tidak dapat diubah menjadi alamat.');
            } finally {
                setLocationLoading(false);
            }
        }, () => {
            setLocationLoading(false);
            setLocationError('Izin lokasi diperlukan untuk menggunakan lokasi saat ini.');
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    };

    return <div className="min-h-screen bg-[#FDFBF7] text-[#2C1E16]">
        <Head title="Checkout" />
        <header className="border-b border-[#2C1E16]/10 bg-white"><div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6"><Link href={route('home')} className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#2C1E16]/20 bg-white transition-colors hover:border-[#D4813E]"><img src="/images/logo.png" alt="Beranda Kopi Gajahmada" className="h-full w-full object-cover" /></Link><Link href={route('cart.index')} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#2C1E16]/12 bg-[#FDFBF7] px-4 text-sm font-semibold transition-colors hover:border-[#D4813E]/45 hover:bg-[#FFF5EA] hover:text-[#D4813E]"><ArrowLeft size={16} /> Kembali ke Keranjang</Link></div></header>
        <main className="mx-auto max-w-6xl px-6 py-10">
            {flash?.success && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">{flash.success}</div>}
            <div className="mb-8 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFE9D2] text-[#D4813E]"><ShoppingBag size={22} /></div><div><h1 className="text-3xl font-bold">Checkout</h1><p className="text-sm text-[#2C1E16]/60">Konfirmasi produk dan data pengiriman Anda.</p></div></div>
            <form onSubmit={(event) => { event.preventDefault(); setConfirming(true); }} className="grid gap-8 lg:grid-cols-[1.45fr_0.85fr]">
                <div className="space-y-6">
                    <section className="rounded-3xl border border-[#2C1E16]/10 bg-white p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold">Produk yang dipilih</h2><p className="mt-1 text-sm text-[#2C1E16]/60">Ubah produk atau jumlahnya dari Keranjang Saya.</p></div><Link href={route('cart.index')} className="shrink-0 text-sm font-bold text-[#D4813E] hover:underline">Ubah keranjang</Link></div><div className="mt-5 divide-y divide-[#2C1E16]/10">{items.map((item) => <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0"><img src={item.product.image ? `/storage/${item.product.image}` : '/images/placeholder-coffee.png'} alt={item.product.product_name} className="h-16 w-16 rounded-2xl object-cover" /><div className="min-w-0 flex-1"><p className="font-bold">{item.product.product_name}</p><p className="text-sm text-[#2C1E16]/60">{item.brew_method === 'espresso' ? 'Espresso' : 'Filter'} · {item.qty} pcs</p></div><p className="text-sm font-bold">{rupiah(Number(item.product.price) * item.qty)}</p></div>)}</div>{errors.cart_item_ids && <p className="mt-4 text-sm text-red-600">{errors.cart_item_ids}</p>}<div className="mt-6 flex justify-center sm:justify-start"><Link href={`${route('home')}#shop`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#D4813E]/40 bg-[#FFF5EA] px-5 py-2.5 text-sm font-bold text-[#D4813E] transition hover:bg-[#D4813E] hover:text-white sm:px-4">Tambah produk lain</Link></div></section>
                    <section className="overflow-hidden rounded-[2rem] bg-[#FFF5EA] p-1">
                        <div className="rounded-[1.8rem] bg-white px-6 py-7 md:px-8">
                            <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2C1E16] text-[#FDFBF7]"><MapPin size={19}/></span><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#D4813E]">Langkah 1 dari 2</p><h2 className="text-lg font-bold">Informasi pengiriman</h2></div></div>
                            <p className="mt-5 border-b border-[#2C1E16]/10 pb-5 text-sm leading-relaxed text-[#2C1E16]/60">Nama dan nomor WhatsApp menggunakan data akun Anda. Alamat dan catatan hanya dapat diubah setelah menekan tombol Ubah.</p>
                            <div className="mt-2 grid gap-x-8 sm:grid-cols-2">
                                {phoneMissing && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 sm:col-span-2"><p className="font-bold">Nomor WhatsApp wajib diisi sebelum checkout.</p><p className="mt-1 text-amber-800/80">Lengkapi nomor Anda di Pengaturan Profil, lalu kembali ke checkout.</p><Link href={route('profile.edit')} className="mt-3 inline-flex rounded-xl bg-[#2C1E16] px-3 py-2 text-xs font-bold text-white hover:bg-[#B86632]">Buka Pengaturan Profil</Link></div>}
                                <InfoValue label="Nama penerima" value={data.customer_name || 'Belum diisi di profil'} />
                                {phoneMissing ? <div className="border-t border-[#2C1E16]/10 py-5"><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#2C1E16]/60">Nomor WhatsApp</p><Link href={route('profile.edit')} className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFF5EA] px-2.5 py-1.5 text-xs font-bold text-[#B86632] transition hover:bg-[#FFE9D2]"><Phone size={14} />Tambahkan nomor</Link></div><p className="mt-3 text-sm font-semibold text-red-600">Belum diisi di profil</p></div> : <InfoValue label="Nomor WhatsApp" value={formattedPhone(data.customer_phone)} />}
                                <div className="border-t border-[#2C1E16]/10 py-5 sm:col-span-2">
                                    <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-[.12em] text-[#2C1E16]/60">Alamat lengkap</span><div className="flex items-center gap-1"><button type="button" onClick={fillAddressFromCurrentLocation} disabled={locationLoading} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-[#B86632] transition hover:bg-[#FFF5EA] disabled:opacity-60"><>{locationLoading ? <LoaderCircle className="animate-spin" size={14} /> : <LocateFixed size={14} />}</>Gunakan lokasi saat ini</button><button type="button" onClick={() => setEditingAddress((editing) => !editing)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-[#B86632] transition hover:bg-[#FFF5EA]"><Pencil size={14} />{editingAddress ? 'Selesai' : 'Ubah'}</button></div></div>
                                    {editingAddress ? <textarea autoFocus rows="3" value={data.customer_address} onChange={(event) => setData('customer_address', event.target.value)} placeholder="Nama jalan, nomor rumah, kelurahan, kecamatan, dan kota" className="mt-3 w-full resize-none rounded-xl border border-[#D4813E]/50 bg-[#FFF9F3] px-3 py-3 text-sm outline-none focus:border-[#D4813E] focus:ring-0" /> : <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#2C1E16]/80">{data.customer_address || 'Alamat belum diisi. Tekan Ubah untuk menambahkan alamat pengiriman.'}</p>}
                                    {locationError && <p className="mt-2 text-xs font-medium text-red-600">{locationError}</p>}
                                    {errors.customer_address && <p className="mt-2 text-xs text-red-600">{errors.customer_address}</p>}
                                    {needsManualAddressDetails && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-bold text-amber-900">Lengkapi detail alamat</p><p className="mt-1 text-xs leading-relaxed text-amber-800/80">Lokasi belum memuat nama jalan dan nomor rumah. Keduanya wajib diisi agar pesanan dapat diantar.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><div><label htmlFor="street_name" className="text-xs font-bold text-amber-900">Nama jalan</label><input id="street_name" value={data.street_name} onChange={(event) => setData('street_name', event.target.value)} placeholder="Contoh: Gajah Mada" className="mt-1 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#D4813E] focus:ring-0" /><p className="mt-1 text-xs text-red-600">{errors.street_name}</p></div><div><label htmlFor="house_number" className="text-xs font-bold text-amber-900">Nomor rumah</label><input id="house_number" value={data.house_number} onChange={(event) => setData('house_number', event.target.value)} placeholder="Contoh: 12A" className="mt-1 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#D4813E] focus:ring-0" /><p className="mt-1 text-xs text-red-600">{errors.house_number}</p></div></div></div>}
                                </div>
                                <div className="border-t border-[#2C1E16]/10 py-5 sm:col-span-2">
                                    <div className="flex items-center justify-between gap-4"><span className="text-xs font-bold uppercase tracking-[.12em] text-[#2C1E16]/60">Catatan untuk pesanan <em className="normal-case tracking-normal text-[#2C1E16]/35">Opsional</em></span><button type="button" onClick={() => setEditingNote((editing) => !editing)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-[#B86632] transition hover:bg-[#FFF5EA]"><Pencil size={14} />{editingNote ? 'Selesai' : data.customer_note ? 'Ubah' : 'Tambah catatan'}</button></div>
                                    {editingNote ? <textarea autoFocus rows="2" value={data.customer_note} onChange={(event) => setData('customer_note', event.target.value)} placeholder="Contoh: Titip di satpam atau hubungi sebelum mengantar" className="mt-3 w-full resize-none rounded-xl border border-[#D4813E]/50 bg-[#FFF9F3] px-3 py-3 text-sm outline-none focus:border-[#D4813E] focus:ring-0" /> : <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#2C1E16]/80">{data.customer_note || 'Tidak ada catatan untuk pesanan ini.'}</p>}
                                    {errors.customer_note && <p className="mt-2 text-xs text-red-600">{errors.customer_note}</p>}
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="rounded-3xl border border-[#2C1E16]/10 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">Metode pengiriman</h2><p className="mt-1 text-sm text-[#2C1E16]/60">Pilih layanan pengiriman yang tersedia untuk pesanan Anda.</p>{shippingMethods.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700">Metode pengiriman belum tersedia. Silakan hubungi admin atau coba kembali nanti.</div> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{shippingMethods.map((method) => { const Icon = method.type?.toLowerCase().includes('instant') ? Zap : Truck; const selected = String(data.shipping_method_id) === String(method.id); return <label key={method.id} className={`cursor-pointer rounded-2xl border p-4 transition-all ${selected ? 'border-[#D4813E] bg-[#FFE9D2]/40 shadow-sm' : 'border-[#2C1E16]/10 hover:border-[#D4813E]/50'}`}><input type="radio" className="sr-only" value={method.id} checked={selected} onChange={(event) => setData('shipping_method_id', event.target.value)} /><span className="flex items-center gap-2 font-bold"><Icon size={17} className="text-[#D4813E]"/>{method.name}</span><span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-[#9A4F1D]">{method.type}</span><span className="mt-2 block text-sm font-bold text-[#2C1E16]">{rupiah(method.delivery_fee)}</span>{selected && <motion.p initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} className="mt-3 border-t border-[#D4813E]/20 pt-3 text-xs leading-relaxed text-[#2C1E16]/65">{method.description || 'Tidak ada deskripsi tambahan untuk metode ini.'}</motion.p>}</label>; })}</div>}{errors.shipping_method_id && <p className="mt-3 text-sm text-red-600">{errors.shipping_method_id}</p>}</section>
                </div>
                <aside className="h-fit rounded-3xl bg-[#2C1E16] p-6 text-white lg:sticky lg:top-6"><h2 className="text-xl font-bold">Ringkasan pesanan</h2><div className="mt-6 space-y-3 border-b border-white/15 pb-5 text-sm"><div className="flex justify-between"><span className="text-white/70">Subtotal</span><span>{rupiah(subtotal)}</span></div><div className="flex justify-between"><span className="text-white/70">Pengiriman</span><span>{selectedShippingMethod ? `${selectedShippingMethod.name} · ${rupiah(deliveryFee)}` : 'Belum dipilih'}</span></div></div><div className="mt-5 flex justify-between text-lg font-bold"><span>Total</span><span>{rupiah(total)}</span></div><p className="mt-5 text-sm leading-relaxed text-white/70">Setelah pesanan dibuat, selesaikan pembayaran melalui Virtual Account dan unggah bukti pembayaran.</p><button type="submit" disabled={processing || phoneMissing || !selectedShippingMethod} className="mt-6 w-full rounded-full bg-[#D4813E] px-5 py-3 font-bold hover:bg-[#b86b30] disabled:opacity-60">{phoneMissing ? 'Lengkapi Nomor WhatsApp' : processing ? 'Memproses...' : 'Buat Pesanan'}</button></aside>
            </form>
            <AnimatePresence>{confirming && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] grid place-items-center bg-[#2C1E16]/45 p-4"><motion.div initial={{scale:.94,y:16}} animate={{scale:1,y:0}} exit={{scale:.94,y:16}} className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-2xl"><button onClick={() => setConfirming(false)} className="float-right rounded-full p-2 hover:bg-orange-50"><X size={18}/></button><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFE9D2] text-[#D4813E]"><CheckCircle2/></span><h2 className="mt-5 text-2xl font-bold">Pesanan sudah sesuai?</h2><p className="mt-2 text-sm leading-relaxed text-[#2C1E16]/65">Periksa kembali produk, alamat, dan metode pengiriman. Setelah dibuat, pesanan akan menunggu pembayaran.</p><div className="mt-7 grid grid-cols-2 gap-3"><button type="button" onClick={() => setConfirming(false)} className="rounded-full border border-[#2C1E16]/15 px-4 py-3 font-bold hover:bg-[#FDFBF7]">Belum, cek lagi</button><button type="button" onClick={() => { setConfirming(false); post(route('orders.store')); }} disabled={processing || phoneMissing || !selectedShippingMethod} className="rounded-full bg-[#D4813E] px-4 py-3 font-bold text-white hover:bg-[#b86b30] disabled:opacity-60">Ya, buat pesanan</button></div></motion.div></motion.div>}</AnimatePresence>
        </main>
    </div>;
}

function InfoValue({ label, value }) {
    return <div className="border-t border-[#2C1E16]/10 py-5"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#2C1E16]/60">{label}</p><p className="mt-3 text-sm font-semibold text-[#2C1E16]">{value}</p></div>;
}
