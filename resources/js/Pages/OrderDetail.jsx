import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { PackageCheck, Truck, CreditCard, MapPin, Phone, ClipboardCheck, UploadCloud, CheckCircle2 } from 'lucide-react';
import { orderStatusLabel } from '../utils/orderStatus';

export default function OrderDetail({ order, items = [] }) {
  const statusLabel = orderStatusLabel(order.status);
  const money = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  });

  const shippingLabel = order.shipping_method === 'instant' ? 'Instant' : 'Reguler';
  const { data, setData, post, processing, errors } = useForm({ proof: null });

  const uploadProof = (e) => {
    e.preventDefault();
    post(route('orders.proof', order.order_id), {
      forceFormData: true,
      preserveScroll: true,
    });
  };

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
                <div className="text-xs text-[#2C1E16]/60 mt-1">VA: {order.va_number || 'Menunggu nomor VA admin'}</div>
                <div className="text-[11px] uppercase mt-2 font-bold text-[#2C1E16]/50">Status pembayaran: {order.payment_status || 'unpaid'}</div>
              </div>
            </div>

            {order.payment_proof && (
              <div className="mt-6 rounded-2xl border border-[#2C1E16]/10 bg-[#FDFBF7] p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#2C1E16]/50">Bukti Pembayaran</div>
                <div className="mt-3">
                  <img src={`/storage/${order.payment_proof}`} alt="Bukti pembayaran" className="w-full max-h-72 object-contain rounded-xl border border-[#2C1E16]/10" />
                </div>
              </div>
            )}
            {order.payment_status === 'rejected' && <div className="mt-4 text-sm text-red-600">Bukti pembayaran ditolak. {order.payment_review_note}</div>}
            {order.status === 'awaiting_payment' && ['unpaid', 'rejected'].includes(order.payment_status) && <button onClick={() => router.post(route('orders.cancel', order.order_id))} className="mt-4 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600">Batalkan Pesanan</button>}

            <div className="mt-8">
              <div className="text-xs font-bold uppercase tracking-wider text-[#2C1E16]/50">Produk</div>
              <div className="space-y-4 mt-4">
                {items.map((item) => (
                  <div key={item.order_item_id} className="flex items-center justify-between border border-[#2C1E16]/10 rounded-2xl p-4">
                    <div>
                      <div className="font-bold text-sm">{item.product_name}</div>
                      <div className="text-xs text-[#2C1E16]/50 mt-1">Qty: {item.qty} • {item.product_category || 'Coffee'}</div>
                      <div className="text-xs text-[#2C1E16]/60 mt-1">Brew Method: {item.brew_method === 'espresso' ? 'Espresso' : item.brew_method === 'filter' ? 'Filter' : '—'}</div>
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
                  <div className="text-[11px] text-white/50">Admin mempersiapkan kirim</div>
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
                  <div className="text-[11px] text-white/50">Verifikasi tanda terima</div>
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

            <form onSubmit={uploadProof} className="mt-8 border-t border-white/10 pt-6">
              <div className="text-xs font-bold uppercase tracking-wider text-white/60">Upload Bukti Bayar</div>
              <label className="mt-3 flex items-center gap-2 px-4 py-3 border border-white/20 rounded-2xl text-sm text-white cursor-pointer hover:bg-white/10">
                <UploadCloud size={16} />
                <span>{data.proof ? data.proof.name : 'Pilih bukti transfer'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setData('proof', e.target.files[0])} />
              </label>
              {errors.proof && <div className="text-red-300 text-xs mt-2">{errors.proof}</div>}
              <button type="submit" disabled={processing} className="mt-3 w-full bg-white text-[#2C1E16] px-4 py-3 rounded-2xl font-bold text-xs disabled:opacity-50">
                {processing ? 'Mengunggah...' : 'Kirim Bukti'}
              </button>
            </form>
          </aside>
        </section>
      </div>
    </div>
  );
}
