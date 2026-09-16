import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { PackageCheck, Truck, CreditCard, MapPin, Phone, ClipboardCheck, Star, MessageSquareWarning } from 'lucide-react';
import { orderStatusLabel } from '../utils/orderStatus';

function ReviewForm({ order, item }) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const { data, setData, post, processing, errors } = useForm({ rating: 0, comment: '' });
  const displayedRating = hoveredRating || data.rating;

  const submit = (event) => {
    event.preventDefault();
    post(route('orders.items.review.store', [order.order_id, item.order_item_id]), { preserveScroll: true });
  };

  return <form onSubmit={submit} className="mt-4 border-t border-[#2C1E16]/10 pt-4">
    <div className="text-xs font-bold uppercase tracking-wider text-[#2C1E16]/50">Beri Penilaian</div>
    <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHoveredRating(0)}>{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" onMouseEnter={() => setHoveredRating(rating)} onClick={() => setData('rating', rating)} aria-label={`Beri rating ${rating} dari 5`} className="rounded p-1 text-[#D4813E]"><Star size={20} fill={rating <= displayedRating ? 'currentColor' : 'none'} /></button>)}</div>
    {errors.rating && <p className="mt-1 text-xs text-red-600">{errors.rating}</p>}
    <textarea value={data.comment} onChange={(event) => setData('comment', event.target.value)} maxLength="1000" placeholder="Tulis komentar (opsional)" className="mt-3 w-full rounded-xl border border-[#2C1E16]/10 bg-[#FDFBF7] p-3 text-sm" />
    {errors.comment && <p className="mt-1 text-xs text-red-600">{errors.comment}</p>}
    <button disabled={processing || !data.rating} className="mt-3 rounded-xl bg-[#D4813E] px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">Kirim Penilaian</button>
  </form>;
}

function ComplaintForm({ order, items }) {
  const { data, setData, post, processing, errors } = useForm({ category: 'product', order_item_id: items[0]?.order_item_id || '', description: '', evidences: [] });
  const eligible = order.delivered_at && new Date(order.delivered_at).getTime() + 24 * 60 * 60 * 1000 >= Date.now();
  if (!eligible) return null;
  return <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
    <div className="flex gap-3"><MessageSquareWarning className="shrink-0 text-amber-700" size={20} /><div><h2 className="font-bold">Ajukan Komplain</h2><p className="mt-1 text-xs text-[#2C1E16]/70">Pengaduan terbuka sampai 1×24 jam setelah pesanan sampai. Sertakan keterangan dan foto bila diperlukan.</p></div></div>
    <form onSubmit={(event) => { event.preventDefault(); post(route('orders.complaints.store', order.order_id)); }} className="mt-4 space-y-3">
      <div className="grid gap-3 md:grid-cols-2"><select value={data.category} onChange={(event) => setData('category', event.target.value)} className="rounded-xl border p-3 text-sm"><option value="product">Masalah produk</option><option value="delivery">Masalah pengiriman</option></select>{data.category === 'product' && <select value={data.order_item_id} onChange={(event) => setData('order_item_id', event.target.value)} className="rounded-xl border p-3 text-sm"><option value="">Pilih produk</option>{items.map((item) => <option key={item.order_item_id} value={item.order_item_id}>{item.product_name} (x{item.qty})</option>)}</select>}</div>
      <textarea value={data.description} onChange={(event) => setData('description', event.target.value)} maxLength="3000" required placeholder="Jelaskan masalah yang Anda alami" className="min-h-28 w-full rounded-xl border p-3 text-sm" />
      <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setData('evidences', Array.from(event.target.files).slice(0, 3))} className="block w-full text-xs" /><p className="text-[11px] text-[#2C1E16]/60">Maksimal 3 foto, masing-masing 4 MB (JPG, PNG, atau WEBP).</p>
      {(errors.description || errors.order_item_id || errors.evidences) && <p className="text-xs text-red-600">{errors.description || errors.order_item_id || errors.evidences}</p>}<button disabled={processing} className="rounded-xl bg-amber-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Kirim Komplain</button>
    </form>
  </section>;
}

export default function OrderDetail({ order, items = [] }) {
  const statusLabel = orderStatusLabel(order.status);
  const paymentStatusLabel = ({
    unpaid: 'Menunggu pembayaran',
    pending_confirmation: 'Pembayaran sedang diverifikasi',
    paid: 'Pembayaran dikonfirmasi',
    rejected: 'Bukti pembayaran perlu diunggah ulang',
  }[order.payment_status] || order.payment_status || 'Menunggu pembayaran');
  const money = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  });

  const shippingLabel = order.shipping_method || 'Belum dipilih';
  const canContinuePayment = order.status === 'awaiting_payment' && ['unpaid', 'rejected'].includes(order.payment_status);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C1E16]">
      <Head title="Detail Pesanan" />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#D4813E] font-bold">Roastery Order</p>
            <h1 className="text-3xl font-bold mt-2">Detail Pesanan</h1>
          </div>
          <Link href={route('dashboard')} className="border border-[#2C1E16]/10 px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#2C1E16] hover:text-white transition">
            Kembali ke Dashboard
          </Link>
        </div>

        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-[#2C1E16]/10 p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#2C1E16]/10 pb-5">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#2C1E16]/50">Order Number</div>
                <div className="text-2xl font-bold mt-2">{order.order_number}</div>
              </div>
              <span className="px-4 py-2 rounded-full bg-[#D4813E]/10 text-[#D4813E] font-bold text-xs uppercase">
                {statusLabel}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="rounded-2xl bg-[#FDFBF7] p-4 border border-[#2C1E16]/10">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2C1E16]/50">
                  <Truck size={15} /> Jasa Pengiriman
                </div>
                <div className="text-sm font-bold mt-2">{shippingLabel}</div>
              </div>

              <div className="rounded-2xl bg-[#FDFBF7] p-4 border border-[#2C1E16]/10">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2C1E16]/50">
                  <CreditCard size={15} /> Pembayaran
                </div>
                <div className="text-sm font-bold mt-2">Virtual Account</div>
                <div className="text-xs text-[#2C1E16]/60 mt-1">{order.payment_bank_name || 'Bank'} · {order.payment_account_name || 'Company Payment Account'}</div>
                <div className="text-xs text-[#2C1E16]/60 mt-1">VA: {order.va_number || 'Nomor Virtual Account akan tersedia segera.'}</div>
                <div className="text-[11px] uppercase mt-2 font-bold text-[#2C1E16]/50">Status pembayaran: {paymentStatusLabel}</div>
              </div>

              <div className="rounded-2xl bg-[#FDFBF7] p-4 border border-[#2C1E16]/10">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2C1E16]/50">
                  <Truck size={15} /> Courier & Tracking
                </div>
                <div className="text-sm font-bold mt-2">{order.courier?.name || 'Courier belum ditugaskan'}</div>
                <div className="text-xs text-[#2C1E16]/60 mt-1">{order.tracking_number || 'Nomor resi akan tersedia setelah pesanan dijemput courier.'}</div>
              </div>
            </div>

            {order.payment_proof && (
              <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-[#2C1E16]/10 bg-[#FDFBF7] p-4">
                <div><div className="text-xs font-bold uppercase tracking-wider text-[#2C1E16]/50">Bukti Pembayaran</div><p className="mt-1 text-sm text-[#2C1E16]/65">Bukti telah dikirim dan tersimpan dengan aman.</p></div>
                <a href={route('orders.proof.view', order.order_id)} target="_blank" rel="noreferrer" className="shrink-0 rounded-full border border-[#2C1E16]/15 px-4 py-2 text-xs font-bold hover:bg-[#2C1E16] hover:text-white">Lihat bukti</a>
              </div>
            )}
            {order.payment_status === 'rejected' && <div className="mt-4 text-sm text-red-600">Bukti pembayaran ditolak. {order.payment_review_note}</div>}
            {canContinuePayment && <Link href={route('orders.payment', { order: order.order_id })} className="mt-4 inline-flex rounded-xl bg-[#D4813E] px-4 py-2 text-sm font-bold text-white hover:bg-[#b86b30]">
              {order.payment_status === 'rejected' ? 'Upload Ulang Bukti Pembayaran' : 'Bayar Sekarang'}
            </Link>}
            {order.status === 'awaiting_payment' && ['unpaid', 'rejected'].includes(order.payment_status) && <button onClick={() => router.post(route('orders.cancel', order.order_id))} className="mt-4 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600">Batalkan Pesanan</button>}
            {order.status === 'delivered' && <button onClick={() => router.post(route('orders.complete', order.order_id))} className="mt-4 rounded-xl bg-[#D4813E] px-4 py-2 text-sm font-bold text-white">Konfirmasi Barang Diterima</button>}

            <ComplaintForm order={order} items={items} />
            {order.complaints?.length > 0 && <section className="mt-6 rounded-2xl border border-[#2C1E16]/10 p-5"><h2 className="font-bold">Komplain Anda</h2><div className="mt-3 space-y-2">{order.complaints.map((complaint) => <Link key={complaint.id} href={route('complaints.show', complaint.id)} className="flex items-center justify-between rounded-xl bg-[#FDFBF7] p-3 text-sm hover:bg-[#D4813E]/10"><span>{complaint.item?.product_name || 'Pengiriman'} · {complaint.category === 'product' ? 'Produk' : 'Pengiriman'}</span><span className="font-bold text-[#D4813E]">{complaint.status}</span></Link>)}</div></section>}

            <div className="mt-8">
              <div className="text-xs font-bold uppercase tracking-wider text-[#2C1E16]/50">Produk</div>
              <div className="space-y-4 mt-4">
                {items.map((item) => (
                  <div key={item.order_item_id} className="flex items-center justify-between border border-[#2C1E16]/10 rounded-2xl p-4">
                    <div>
                      <div className="font-bold text-sm">{item.product_name}</div>
                      <div className="text-xs text-[#2C1E16]/50 mt-1">Qty: {item.qty} • {item.product_category || 'Coffee'}</div>
                      <div className="text-xs text-[#2C1E16]/60 mt-1">Brew Method: {item.brew_method === 'espresso' ? 'Espresso' : item.brew_method === 'filter' ? 'Filter' : '—'}</div>
                      {order.status === 'completed' && (item.review ? <div className="mt-4 border-t border-[#2C1E16]/10 pt-4"><div className="text-xs font-bold uppercase tracking-wider text-[#2C1E16]/50">Penilaian Anda</div><div className="mt-2 flex gap-1 text-[#D4813E]">{[1, 2, 3, 4, 5].map((rating) => <Star key={rating} size={17} fill={rating <= item.review.rating ? 'currentColor' : 'none'} />)}</div>{item.review.comment && <p className="mt-2 text-sm text-[#2C1E16]/70">{item.review.comment}</p>}</div> : <ReviewForm order={order} item={item} />)}
                    </div>
                    <div className="font-bold text-[#D4813E]">{money.format(item.subtotal || item.unit_price * item.qty)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-[#FDFBF7] p-4 border border-[#2C1E16]/10">
              <div className="text-xs font-bold uppercase tracking-wider text-[#2C1E16]/50">Catatan Pesanan</div>
              <div className="mt-2 text-sm text-[#2C1E16]/70 whitespace-pre-line">{order.customer_note || 'Tidak ada catatan.'}</div>
            </div>
          </div>

          <aside className="bg-[#2C1E16] text-[#FDFBF7] rounded-[2rem] p-8 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60">
              <PackageCheck size={15} /> Status Pesanan
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#D4813E] mt-1" />
                <div>
                  <div className="text-sm font-bold">{statusLabel}</div>
                  <div className="text-[11px] text-white/50">Order dibuat</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-white/40 mt-1" />
                <div>
                  <div className="text-sm font-bold">Sedang Dikemas</div>
                  <div className="text-[11px] text-white/50">Pesanan sedang disiapkan untuk pengiriman</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-white/40 mt-1" />
                <div>
                  <div className="text-sm font-bold">Dalam Pengiriman</div>
                  <div className="text-[11px] text-white/50">Tracking aktif</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-white/40 mt-1" />
                <div>
                  <div className="text-sm font-bold">Selesai</div>
                  <div className="text-[11px] text-white/50">Konfirmasi penerimaan pesanan</div>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="text-xs font-bold uppercase tracking-wider text-white/60">Alamat Pengiriman</div>
              <div className="mt-3 text-sm text-white/80">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={15} /> <span>{order.customer_address || 'Alamat belum diisi'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={15} /> <span>{order.customer_phone || 'Nomor telepon belum diisi'}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-[11px] uppercase text-white/50">Subtotal</div>
                <div className="font-bold mt-2">{money.format(order.subtotal || 0)}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-[11px] uppercase text-white/50">Ongkir</div>
                <div className="font-bold mt-2">{money.format(order.delivery_fee || 0)}</div>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-6">
              <div className="flex items-center justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-[#D4813E]">{money.format(order.total_amount || 0)}</span>
              </div>
            </div>

            <div className="mt-8">
              <Link href={route('orders.tracking', order.order_id)} className="w-full inline-flex justify-center items-center gap-2 bg-[#D4813E] text-white px-4 py-3 rounded-2xl font-bold hover:bg-[#b86b30] transition">
                <ClipboardCheck size={16} /> Lacak Pesanan
              </Link>
            </div>

          </aside>
        </section>
      </div>
    </div>
  );
}
