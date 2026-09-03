import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

const rupiah = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

export default function Checkout({ items, auth }) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        cart_item_ids: items.map((item) => item.id), shipping_method: 'regular', payment_method: 'virtual_account',
        customer_name: auth.user.name ?? '', customer_phone: auth.user.phone ?? '', customer_address: auth.user.address ?? '', customer_note: '',
    });
    const subtotal = items.reduce((total, item) => total + Number(item.product.price) * item.qty, 0);
    const deliveryFee = data.shipping_method === 'instant' ? 30000 : 25000;
    const total = subtotal + deliveryFee;

    return <div className="min-h-screen bg-[#FDFBF7] text-[#2C1E16]">
        <Head title="Checkout" />
        <header className="border-b border-[#2C1E16]/10 bg-white"><div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6"><Link href={route('home')} className="text-xl font-bold">Kopi Gajahmada</Link><Link href={route('cart.index')} className="inline-flex items-center gap-2 text-sm font-semibold hover:text-[#D4813E]"><ArrowLeft size={16} /> Kembali ke Keranjang</Link></div></header>
        <main className="mx-auto max-w-6xl px-6 py-10">
            {flash?.success && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">{flash.success}</div>}
            <div className="mb-8 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFE9D2] text-[#D4813E]"><ShoppingBag size={22} /></div><div><h1 className="text-3xl font-bold">Checkout</h1><p className="text-sm text-[#2C1E16]/60">Konfirmasi produk dan data pengiriman Anda.</p></div></div>
            <form onSubmit={(event) => { event.preventDefault(); post(route('orders.store')); }} className="grid gap-8 lg:grid-cols-[1.45fr_0.85fr]">
                <div className="space-y-6">
                    <section className="rounded-3xl border border-[#2C1E16]/10 bg-white p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold">Produk yang dipilih</h2><p className="mt-1 text-sm text-[#2C1E16]/60">Ubah produk atau jumlahnya dari Keranjang Saya.</p></div><Link href={route('cart.index')} className="shrink-0 text-sm font-bold text-[#D4813E] hover:underline">Ubah keranjang</Link></div><div className="mt-5 divide-y divide-[#2C1E16]/10">{items.map((item) => <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0"><img src={item.product.image ? `/storage/${item.product.image}` : '/images/placeholder-coffee.png'} alt={item.product.product_name} className="h-16 w-16 rounded-2xl object-cover" /><div className="min-w-0 flex-1"><p className="font-bold">{item.product.product_name}</p><p className="text-sm text-[#2C1E16]/60">{item.brew_method === 'espresso' ? 'Espresso' : 'Filter'} · {item.qty} pcs</p></div><p className="text-sm font-bold">{rupiah(Number(item.product.price) * item.qty)}</p></div>)}</div>{errors.cart_item_ids && <p className="mt-4 text-sm text-red-600">{errors.cart_item_ids}</p>}<Link href={`${route('home')}#shop`} className="mt-5 inline-block text-sm font-semibold text-[#D4813E] hover:underline">Tambah produk lain</Link></section>
                    <section className="rounded-3xl border border-[#2C1E16]/10 bg-white p-6"><h2 className="text-lg font-bold">Informasi pengiriman</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Nama lengkap" error={errors.customer_name}><input value={data.customer_name} onChange={(e) => setData('customer_name', e.target.value)} className="input" /></Field><Field label="Nomor HP" error={errors.customer_phone}><input value={data.customer_phone} onChange={(e) => setData('customer_phone', e.target.value)} className="input" /></Field><Field label="Alamat lengkap" error={errors.customer_address} className="sm:col-span-2"><textarea rows="3" value={data.customer_address} onChange={(e) => setData('customer_address', e.target.value)} className="input resize-none" /></Field><Field label="Catatan pesanan (opsional)" error={errors.customer_note} className="sm:col-span-2"><textarea rows="3" value={data.customer_note} onChange={(e) => setData('customer_note', e.target.value)} className="input resize-none" /></Field></div></section>
                    <section className="rounded-3xl border border-[#2C1E16]/10 bg-white p-6"><h2 className="text-lg font-bold">Metode pengiriman</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{[['regular', 'Regular', 25000], ['instant', 'Instant', 30000]].map(([value, label, price]) => <label key={value} className={`cursor-pointer rounded-2xl border p-4 ${data.shipping_method === value ? 'border-[#D4813E] bg-[#FFE9D2]/40' : 'border-[#2C1E16]/10'}`}><input type="radio" className="sr-only" value={value} checked={data.shipping_method === value} onChange={(e) => setData('shipping_method', e.target.value)} /><span className="block font-bold">{label}</span><span className="text-sm text-[#2C1E16]/60">{rupiah(price)}</span></label>)}</div>{errors.shipping_method && <p className="mt-3 text-sm text-red-600">{errors.shipping_method}</p>}</section>
                </div>
                <aside className="h-fit rounded-3xl bg-[#2C1E16] p-6 text-white lg:sticky lg:top-6"><h2 className="text-xl font-bold">Ringkasan pesanan</h2><div className="mt-6 space-y-3 border-b border-white/15 pb-5 text-sm"><div className="flex justify-between"><span className="text-white/70">Subtotal</span><span>{rupiah(subtotal)}</span></div><div className="flex justify-between"><span className="text-white/70">Pengiriman</span><span>{rupiah(deliveryFee)}</span></div></div><div className="mt-5 flex justify-between text-lg font-bold"><span>Total</span><span>{rupiah(total)}</span></div><p className="mt-5 text-sm leading-relaxed text-white/70">Setelah pesanan dibuat, selesaikan pembayaran melalui Virtual Account dan unggah bukti pembayaran.</p><button type="submit" disabled={processing} className="mt-6 w-full rounded-full bg-[#D4813E] px-5 py-3 font-bold hover:bg-[#b86b30] disabled:opacity-60">{processing ? 'Memproses...' : 'Buat Pesanan'}</button></aside>
            </form>
        </main>
    </div>;
}

function Field({ label, error, className = '', children }) {
    return <label className={`block ${className}`}><span className="mb-2 block text-sm font-semibold">{label}</span>{children}{error && <span className="mt-1 block text-sm text-red-600">{error}</span>}</label>;
}
