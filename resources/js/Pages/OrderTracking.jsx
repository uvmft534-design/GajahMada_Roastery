import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PackageCheck, MapPin, Truck, CheckCircle2 } from 'lucide-react';

export default function OrderTracking({ order }) {
  const statuses = ['pending', 'shipped', 'completed', 'cancelled'];
  const currentIndex = statuses.indexOf(order.status);

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
              <div className="text-2xl font-bold text-[#D4813E] mt-2 capitalize">{order.status}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-[#2C1E16]/50">Nomor Tracking</div>
              <div className="font-bold mt-2">{order.tracking_number}</div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-4">
            {['Pesanan Dibuat', 'Dalam Proses', 'Dikirim', 'Selesai'].map((label, idx) => (
              <div key={label} className="rounded-2xl border p-4 text-center">
                <div className="flex items-center justify-center">
                  {currentIndex >= idx ? (
                    <CheckCircle2 size={24} className="text-emerald-600" />
                  ) : (
                    <Truck size={24} className="text-[#2C1E16]/30" />
                  )}
                </div>
                <div className="mt-3 text-xs font-bold text-[#2C1E16]/60 uppercase">{label}</div>
              </div>
            ))}
          </div>

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
