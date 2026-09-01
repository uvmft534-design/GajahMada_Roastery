import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { orderStatusLabel } from '../utils/orderStatus';
import { BadgeCheck, Bike, ClipboardList, Coffee, CreditCard, MapPin, Package, PackageCheck, PackageSearch, Star, Truck, XCircle } from 'lucide-react';

export default function OrderTracking({ order }) {
  const reduceMotion = useReducedMotion();
  const steps = [
    ['Pesanan Dibuat', 'awaiting_payment', ClipboardList],
    ['Pembayaran Dikonfirmasi', 'payment_confirmed', CreditCard],
    ['Sedang Diproses', 'processing', Coffee],
    ['Sudah Dikemas', 'packed', Package],
    ['Menunggu Pickup', 'pickup_requested', PackageSearch],
    ['Dijemput Kurir', 'picked_up', Bike],
    ['Dalam Pengiriman', 'shipped', Truck],
    ['Sampai Tujuan', 'delivered', MapPin],
    ['Selesai', 'completed', Star],
  ];
  const statusIndex = ['awaiting_payment', 'processing', 'packed', 'pickup_requested', 'picked_up', 'shipped', 'delivered', 'completed'].indexOf(order.status);
  const stepState = (key, index) => {
    if (key === 'payment_confirmed') return order.payment_status === 'paid' ? 'done' : 'future';
    const adjustedIndex = index === 0 ? 0 : index - 1;
    return adjustedIndex < statusIndex ? 'done' : adjustedIndex === statusIndex ? 'current' : 'future';
  };
  const currentStep = steps.find(([, key]) => key === order.status);
  const CurrentStatusIcon = currentStep?.[2] || PackageCheck;

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
              <div className="mt-2 flex items-center gap-2 text-2xl font-bold text-[#D4813E]"><CurrentStatusIcon size={23} aria-hidden="true" />{orderStatusLabel(order.status)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-[#2C1E16]/50">Nomor Tracking</div>
              <div className="font-bold mt-2">{order.tracking_number || 'Belum tersedia'}</div>
            </div>
          </div>

          {order.status === 'cancelled' ? <div className="mt-10 flex items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-center font-bold text-red-700"><XCircle size={25} aria-hidden="true" />Pesanan Dibatalkan</div> : <div className="mt-10 overflow-x-auto pb-3"><div className="flex min-w-[960px] px-2">{steps.map(([label, key, Icon], index) => { const state = stepState(key, index); const isCurrent = state === 'current'; const isDone = state === 'done'; return <motion.div key={key} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : index * 0.05, duration: 0.3 }} className="relative flex min-w-[106px] flex-1 flex-col items-center text-center" aria-current={isCurrent ? 'step' : undefined}><div className="relative z-10"><motion.div animate={isCurrent && !reduceMotion ? { scale: [1, 1.05, 1] } : undefined} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white ${isCurrent ? 'border-[#D4813E] text-[#D4813E] shadow-[0_0_0_6px_rgba(212,129,62,0.13)]' : isDone ? 'border-[#D4813E] text-[#B86B30]' : 'border-[#2C1E16]/15 text-[#2C1E16]/35'}`}><Icon size={19} aria-hidden="true" />{isCurrent && !reduceMotion && <motion.span className="absolute inset-[-7px] rounded-full border border-[#D4813E]/30" animate={{ scale: [1, 1.25], opacity: [0.45, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }} />}</motion.div></div>{index < steps.length - 1 && <motion.span initial={reduceMotion ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: reduceMotion ? 0 : index * 0.05, duration: 0.35 }} className={`absolute left-[calc(50%+1.35rem)] top-[1.3rem] h-0.5 w-[calc(100%-2.7rem)] origin-left ${isDone ? 'bg-[#D4813E]' : 'bg-[#2C1E16]/15'}`} />}<motion.div initial={reduceMotion ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : 0.12 + index * 0.05, duration: 0.25 }} className={`mt-3 text-[11px] font-bold leading-tight ${isCurrent ? 'text-[#D4813E]' : isDone ? 'text-[#2C1E16]' : 'text-[#2C1E16]/45'}`}>{label}</motion.div><div className={`mt-1 text-[10px] ${isCurrent ? 'text-[#D4813E]' : 'text-[#2C1E16]/40'}`}>{isDone ? 'Selesai' : isCurrent ? 'Status saat ini' : 'Menunggu'}</div></motion.div>})}</div></div>}

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
