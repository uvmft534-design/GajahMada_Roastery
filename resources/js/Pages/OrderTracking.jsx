import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { orderStatusLabel } from '../utils/orderStatus';
import { PackageCheck, MapPin, Truck, CheckCircle2 } from 'lucide-react';

export default function OrderTracking({ order }) {
  const steps = [['Pesanan Dibuat', 'awaiting_payment'], ['Pembayaran Dikonfirmasi', 'payment_confirmed'], ['Sedang Diproses', 'processing'], ['Sudah Dikemas', 'packed'], ['Menunggu Pickup', 'pickup_requested'], ['Dijemput Kurir', 'picked_up'], ['Dalam Pengiriman', 'shipped'], ['Sampai Tujuan', 'delivered'], ['Selesai', 'completed']];
  const statusIndex = ['awaiting_payment', 'processing', 'packed', 'pickup_requested', 'picked_up', 'shipped', 'delivered', 'completed'].indexOf(order.status);
  const stepState = (key, index) => {
    if (key === 'payment_confirmed') return order.payment_status === 'paid' ? 'done' : 'future';
    const adjustedIndex = index === 0 ? 0 : index - 1;
    return adjustedIndex < statusIndex ? 'done' : adjustedIndex === statusIndex ? 'current' : 'future';
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C1E16]">
      <Head title="Lacak Pesanan" />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#D4813E] font-bold">Tracking Order</div>
            <h1 className="text-3xl font-bold mt-2">{order.order_number}</h1>
          </div>
          <Link href={route('orders.history')} className="border border-[#2C1E16]/10 px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#2C1E16] hover:text-white transition">
            Riwayat Pesanan
          </Link>
        </div>

        <section className="bg-white rounded-[2rem] border border-[#2C1E16]/10 p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-[#2C1E16]/50">Status Saat Ini</div>
              <div className="text-2xl font-bold text-[#D4813E] mt-2">{orderStatusLabel(order.status)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-[#2C1E16]/50">Nomor Tracking</div>
              <div className="font-bold mt-2">{order.tracking_number || 'Belum tersedia'}</div>
            </div>
          </div>

          {order.status === 'cancelled' ? <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-5 text-center font-bold text-red-700">Pesanan Dibatalkan</div> : <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{steps.map(([label, key], index) => { const state = stepState(key, index); return <div key={key} className={`rounded-2xl border p-4 ${state === 'current' ? 'border-[#D4813E] bg-orange-50' : state === 'done' ? 'border-emerald-200 bg-emerald-50' : 'border-[#2C1E16]/10'}`}><div className="flex items-center gap-3">{state === 'done' ? <CheckCircle2 size={22} className="text-emerald-600" /> : <div className={`h-5 w-5 rounded-full border-2 ${state === 'current' ? 'border-[#D4813E] bg-[#D4813E]' : 'border-[#2C1E16]/20'}`} />}<div><div className="text-xs font-bold uppercase text-[#2C1E16]/70">{label}</div><div className="mt-1 text-[11px] text-[#2C1E16]/50">{state === 'done' ? 'Selesai' : state === 'current' ? 'Status saat ini' : 'Menunggu'}</div></div></div></div>})}</div>}

          <div className="mt-8 grid md:grid-cols-2 gap-5">
            <div className="rounded-3xl border border-[#2C1E16]/10 bg-[#FDFBF7] p-5">
              <div className="flex items-center gap-3">
                <Truck size={22} className="text-[#D4813E]" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#2C1E16]/50">Jasa Pengiriman</div>
                  <div className="font-bold mt-1">{order.shipping_method === 'instant' ? 'Instant' : 'Reguler'}</div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#2C1E16]/10 bg-[#FDFBF7] p-5">
              <div className="flex items-center gap-3">
                <MapPin size={22} className="text-[#D4813E]" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#2C1E16]/50">Alamat Pengiriman</div>
                  <div className="font-bold mt-1 text-sm">{order.customer_address}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href={route('orders.show', order.order_id)} className="inline-flex items-center gap-2 border border-[#2C1E16]/20 px-5 py-3 rounded-2xl font-bold hover:bg-[#2C1E16] hover:text-white transition">
              <PackageCheck size={16} /> Lihat Detail Pesanan
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
