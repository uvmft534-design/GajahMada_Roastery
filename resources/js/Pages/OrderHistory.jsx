import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { PackageCheck, Truck, CalendarDays, ArrowRight } from 'lucide-react';
import { orderStatusLabel } from '../utils/orderStatus';

export default function OrderHistory({ orders = [] }) {
  const { flash = {} } = usePage().props;
  const money = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  });
  const paymentStatusLabel = (status) => ({
    unpaid: 'Menunggu pembayaran',
    pending_confirmation: 'Pembayaran sedang diverifikasi',
    paid: 'Pembayaran dikonfirmasi',
    rejected: 'Bukti pembayaran perlu diunggah ulang',
  }[status] || status);
  const orderedAt = (date) => date ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date)) : '-';

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C1E16]">
      <Head title="Riwayat Pesanan" />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-[#D4813E] font-bold">Akun saya</p>
            <h1 className="text-3xl font-bold mt-2">Riwayat Pesanan</h1>
            <p className="mt-2 text-sm text-[#2C1E16]/60">Pantau pesanan dan perjalanan kopi pilihan Anda.</p>
          </div>
          <Link href={route('home')} className="border border-[#2C1E16]/10 px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#2C1E16] hover:text-white transition">
            Kembali ke Shop
          </Link>
        </div>

        {flash.success && <div role="status" className="mb-6 flex items-center gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
          <PackageCheck size={21} aria-hidden="true" />
          <p className="font-bold">{flash.success}</p>
        </div>}

        <section className="rounded-[2rem] border border-[#2C1E16]/10 bg-white p-4 shadow-sm md:p-6">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <PackageCheck size={46} className="mx-auto text-[#D4813E]" />
              <h3 className="font-bold text-xl mt-4">Belum ada riwayat pesanan</h3>
              <p className="text-sm text-[#2C1E16]/50 mt-2">Pesanan Anda akan muncul di sini setelah checkout.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <article key={order.order_id} className="group rounded-3xl border border-[#2C1E16]/10 p-5 transition hover:border-[#D4813E]/50 hover:shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-[#2C1E16]/50">Order Number</div>
                      <div className="font-bold text-lg mt-1">{order.order_number}</div>
                      <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#2C1E16]/55"><CalendarDays size={13} /> Dipesan {orderedAt(order.created_at)}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-[#2C1E16]/50">Status</div>
                      <div className="font-bold text-[#D4813E] uppercase mt-1">{orderStatusLabel(order.status)}</div>
                      <div className="mt-1 text-xs text-[#2C1E16]/60">{paymentStatusLabel(order.payment_status)}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-[#2C1E16]/50">Total</div>
                      <div className="font-bold mt-1">{money.format(order.total_amount || 0)}</div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={route('orders.show', order.order_id)} className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-[#2C1E16]/10 text-xs font-bold hover:bg-[#2C1E16] hover:text-white transition">
                        Detail <ArrowRight size={13}/>
                      </Link>
                      <Link href={route('orders.tracking', order.order_id)} className="px-4 py-2 rounded-xl bg-[#D4813E] text-white text-xs font-bold hover:bg-[#b86b30] transition">
                        <span className="inline-flex items-center gap-1"><Truck size={14} /> Lacak</span>
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-[#2C1E16]/60">
                    {order.items?.map((item) => (
                      <span key={item.order_item_id} className="inline-flex items-center gap-2 mr-4">
                        <span className="w-2 h-2 rounded-full bg-[#D4813E]" /> {item.product_name} x {item.qty}{item.weight_grams && <small>· Berat: {Number(item.weight_grams) === 1000 ? '1kg' : `${item.weight_grams}g`}</small>}<small>· Metode seduh: {item.brew_method === 'espresso' ? 'Espresso' : 'Filter'}</small>{item.item_note && <small>· Catatan produk: {item.item_note}</small>}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
