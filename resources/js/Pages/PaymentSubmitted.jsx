import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { orderStatusLabel } from '../utils/orderStatus';
import { formatRupiah } from '../utils/currency';

export default function PaymentSubmitted({ order }) {
  const money = { format: formatRupiah };
  const orderStatus = order.status === 'awaiting_payment' ? 'Menunggu Konfirmasi Pembayaran' : orderStatusLabel(order.status);

  return (
    <div className="min-h-screen bg-[#FDFBF7] px-6 py-12 text-[#2C1E16]">
      <Head title="Bukti Pembayaran Dikirim" />

      <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-xl overflow-hidden rounded-[2rem] border border-[#2C1E16]/10 bg-white text-center shadow-xl">
        <div className="bg-[#2C1E16] px-7 pb-14 pt-10 text-white md:px-10"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#D4813E] shadow-lg shadow-black/20"><CheckCircle2 size={29} aria-hidden="true" /></div><p className="mt-5 text-xs font-bold uppercase tracking-[.2em] text-[#D4813E]">Pembayaran diterima</p><h1 className="mt-2 text-3xl font-bold">Bukti berhasil dikirim</h1></div>
        <div className="px-7 pb-8 md:px-10 md:pb-10">
        <p className="mt-2 text-sm text-[#2C1E16]/60">Pembayaran Anda sedang diverifikasi.</p>
        <p className="mt-1 text-sm text-[#2C1E16]/60">Pesanan akan diproses setelah pembayaran dikonfirmasi.</p>

        <dl className="mt-8 space-y-4 rounded-3xl bg-[#FDFBF7] p-5 text-left text-sm">
          <div className="flex justify-between gap-4"><dt className="text-[#2C1E16]/60">Nomor Pesanan</dt><dd className="font-bold">{order.order_number}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-[#2C1E16]/60">Status Pembayaran</dt><dd className="font-bold text-[#D4813E]">Pembayaran sedang diverifikasi</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-[#2C1E16]/60">Status Pesanan</dt><dd className="font-bold">{orderStatus}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-[#2C1E16]/60">Total</dt><dd className="font-bold">{money.format(order.total_amount || 0)}</dd></div>
        </dl>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link href={route('orders.history')} className="rounded-2xl bg-[#D4813E] px-5 py-3 font-bold text-white hover:bg-[#b86b30]">Pesanan Saya</Link>
          <Link href={route('orders.show', { order: order.order_id })} className="rounded-2xl border border-[#2C1E16]/15 px-5 py-3 font-bold hover:bg-[#2C1E16] hover:text-white">Lihat Detail Pesanan</Link>
        </div>
        <Link href={route('home')} className="mt-5 inline-block text-sm font-semibold text-[#D4813E] hover:underline">Kembali Belanja</Link>
        </div>
      </motion.main>
    </div>
  );
}
