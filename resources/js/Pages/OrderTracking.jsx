import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { Bike, ClipboardList, Coffee, CreditCard, MapPin, Package, PackageCheck, PackageSearch, Star, Truck, XCircle } from 'lucide-react';

const formatTimelineTime = (value) => new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value));

export default function OrderTracking({ order }) {
  const reduceMotion = useReducedMotion();
  const operationalStatus = {
    processing: ['Sedang Diproses', Coffee],
    packed: ['Sudah Dikemas', Package],
    pickup_requested: ['Menunggu Pickup', PackageSearch],
    picked_up: ['Dijemput Kurir', Bike],
    shipped: ['Dalam Pengiriman', Truck],
    delivered: ['Pesanan Sampai', MapPin],
    completed: ['Selesai', Star],
  };
  const currentProgress = operationalStatus[order.status]
    || (order.payment_status === 'paid'
      ? ['Pembayaran Dikonfirmasi', CreditCard]
      : order.payment_status === 'pending_confirmation'
        ? ['Menunggu Konfirmasi Pembayaran', CreditCard]
        : order.payment_status === 'rejected'
          ? ['Pembayaran Ditolak', CreditCard]
          : ['Menunggu Pembayaran', CreditCard]);
  const [currentStatusLabel, CurrentStatusIcon] = currentProgress;
  const hasReachedDelivery = ['delivered', 'completed'].includes(order.status);
  const hasCompleted = order.status === 'completed';
  const paymentOrFulfillmentStarted = order.payment_status === 'paid' || !['awaiting_payment', 'cancelled'].includes(order.status);
  const steps = [
    { label: 'Pesanan Dibuat', Icon: ClipboardList, state: paymentOrFulfillmentStarted ? 'done' : 'current' },
    { label: currentStatusLabel, Icon: CurrentStatusIcon, state: hasReachedDelivery ? 'done' : paymentOrFulfillmentStarted ? 'current' : 'future' },
    { label: 'Pesanan Sampai', Icon: MapPin, state: hasCompleted ? 'done' : order.status === 'delivered' ? 'current' : 'future' },
    { label: 'Selesai', Icon: Star, state: hasCompleted ? 'current' : 'future' },
  ];
  const timeline = [
    { label: 'Pesanan dibuat', detail: 'Pesanan berhasil dibuat dan menunggu pembayaran.', at: order.created_at, Icon: ClipboardList },
    order.payment_status === 'paid' && { label: 'Pembayaran dikonfirmasi', detail: 'Pembayaran telah diverifikasi oleh admin.', at: order.payment_reviewed_at, Icon: CreditCard },
    { label: 'Pesanan sedang diproses', detail: 'Admin mulai menyiapkan pesanan Anda.', at: order.processing_at, Icon: Coffee },
    { label: 'Pesanan sudah dikemas', detail: 'Pesanan siap diserahkan ke kurir.', at: order.packed_at, Icon: Package },
    { label: 'Menunggu pickup', detail: 'Kurir telah diminta untuk mengambil pesanan.', at: order.pickup_requested_at, Icon: PackageSearch },
    { label: 'Dijemput kurir', detail: 'Kurir telah mengambil pesanan Anda.', at: order.picked_up_at, Icon: Bike },
    { label: 'Dalam pengiriman', detail: 'Pesanan sedang dikirim ke alamat Anda.', at: order.shipped_at, Icon: Truck },
    { label: 'Pesanan sampai', detail: 'Pesanan telah sampai di tujuan.', at: order.delivered_at, Icon: MapPin },
    { label: 'Pesanan selesai', detail: 'Pesanan telah diselesaikan.', at: order.completed_at, Icon: Star },
  ].filter((event) => event?.at);

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
              <div className="mt-2 flex items-center gap-2 text-2xl font-bold text-[#D4813E]"><CurrentStatusIcon size={23} aria-hidden="true" />{currentStatusLabel}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-[#2C1E16]/50">Nomor Tracking</div>
              <div className="font-bold mt-2">{order.tracking_number || 'Belum tersedia'}</div>
            </div>
          </div>

          {order.status === 'cancelled' ? <div className="mt-10 flex items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-center font-bold text-red-700"><XCircle size={25} aria-hidden="true" />Pesanan Dibatalkan</div> : <div className="mt-10 overflow-hidden"><div className="grid grid-cols-4 px-1 sm:px-2">{steps.map(({ label, Icon, state }, index) => { const isCurrent = state === 'current'; const isDone = state === 'done'; return <motion.div key={`${label}-${index}`} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : index * 0.05, duration: 0.3 }} className="relative flex min-w-0 flex-col items-center pb-5 text-center sm:pb-0" aria-current={isCurrent ? 'step' : undefined}><div className="relative z-10"><motion.div animate={isCurrent && !reduceMotion ? { scale: [1, 1.05, 1] } : undefined} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white sm:h-11 sm:w-11 ${isCurrent ? 'border-[#D4813E] text-[#D4813E] shadow-[0_0_0_6px_rgba(212,129,62,0.13)]' : isDone ? 'border-[#D4813E] text-[#B86B30]' : 'border-[#2C1E16]/15 text-[#2C1E16]/35'}`}><Icon size={18} aria-hidden="true" />{isCurrent && !reduceMotion && <motion.span className="absolute inset-[-7px] rounded-full border border-[#D4813E]/30" animate={{ scale: [1, 1.25], opacity: [0.45, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }} />}</motion.div></div>{index < steps.length - 1 && <motion.span initial={reduceMotion ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: reduceMotion ? 0 : index * 0.05, duration: 0.35 }} className={`absolute left-[calc(50%+1.2rem)] top-[1.2rem] h-0.5 w-[calc(100%-2.4rem)] origin-left sm:left-[calc(50%+1.35rem)] sm:top-[1.3rem] sm:w-[calc(100%-2.7rem)] ${isDone ? 'bg-[#D4813E]' : 'bg-[#2C1E16]/15'}`} />}<motion.div initial={reduceMotion ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : 0.12 + index * 0.05, duration: 0.25 }} className={`mt-3 break-words px-1 text-[10px] font-bold leading-tight sm:text-[11px] ${isCurrent ? 'text-[#D4813E]' : isDone ? 'text-[#2C1E16]' : 'text-[#2C1E16]/45'}`}>{label}</motion.div><div className={`mt-1 text-[9px] sm:text-[10px] ${isCurrent ? 'text-[#D4813E]' : 'text-[#2C1E16]/40'}`}>{isDone ? 'Selesai' : isCurrent ? 'Status saat ini' : 'Menunggu'}</div></motion.div>})}</div></div>}

          {order.status !== 'cancelled' && <section className="mt-8 rounded-3xl border border-[#2C1E16]/10 bg-[#FDFBF7] p-5"><h2 className="text-base font-bold">Riwayat pesanan</h2><ol className="mt-5 space-y-5">{timeline.map(({ label, detail, at, Icon }, index) => <li key={`${label}-${at}`} className="relative flex gap-3"><div className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FFE9D2] text-[#D4813E]"><Icon size={16} aria-hidden="true" /></div>{index < timeline.length - 1 && <span className="absolute left-[1.05rem] top-9 h-[calc(100%+0.35rem)] w-px bg-[#2C1E16]/10" />}<div className="min-w-0 pb-1"><div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><p className="font-bold text-[#2C1E16]">{label}</p><time className="text-xs font-semibold text-[#B86632]">{formatTimelineTime(at)}</time></div><p className="mt-1 text-sm leading-relaxed text-[#2C1E16]/60">{detail}</p></div></li>)}</ol></section>}

          <div className="mt-8 grid md:grid-cols-2 gap-5">
            <div className="rounded-3xl border border-[#2C1E16]/10 bg-[#FDFBF7] p-5">
              <div className="flex items-center gap-3">
                <Truck size={22} className="text-[#D4813E]" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#2C1E16]/50">Jasa Pengiriman</div>
                  <div className="font-bold mt-1">{order.shipping_method || 'Belum dipilih'}</div>
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
