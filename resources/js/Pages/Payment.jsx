import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, CheckCircle2, Copy, UploadCloud } from 'lucide-react';

export default function Payment({ order }) {
  const { data, setData, post, processing, errors } = useForm({ proof: null });
  const [copied, setCopied] = useState(false);
  const money = new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  });

  const uploadProof = (event) => {
    event.preventDefault();
    post(route('orders.proof', order.order_id), { forceFormData: true, preserveScroll: true });
  };

  const copyVaNumber = async () => {
    await navigator.clipboard?.writeText(order.va_number || '');
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  const canUpload = ['unpaid', 'rejected'].includes(order.payment_status);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C1E16] font-sans">
      <Head title="Pembayaran Virtual Account" />

      <nav className="border-b border-[#2C1E16]/10 bg-[#FDFBF7]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#D4813E] font-bold">Kopi Gajahmada</p>
            <h1 className="font-bold text-xl mt-1">Pembayaran Pesanan</h1>
          </div>
          <Link href={route('orders.show', order.order_id)} className="inline-flex items-center gap-2 text-sm font-semibold hover:text-[#D4813E] transition-colors">
            <ArrowLeft size={16} /> Detail Pesanan
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-8 items-start">
          <section className="bg-white rounded-[2rem] border border-[#2C1E16]/5 shadow-sm p-6 md:p-9">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#D4813E]/10 text-[#D4813E] flex items-center justify-center"><Building2 size={22} /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#2C1E16]/50">Pembayaran Virtual Account</p>
                <h2 className="text-2xl font-bold mt-1">Nomor Virtual Account</h2>
              </div>
            </div>

            <div className="mt-8 rounded-3xl bg-[#FDFBF7] border border-[#2C1E16]/10 p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-[#2C1E16]/50">{order.payment_bank_name || 'Bank'}</p>
              <p className="mt-1 text-sm font-semibold">{order.payment_account_name || 'Company Payment Account'}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-2xl md:text-3xl tracking-[0.12em] font-bold text-[#2C1E16]">{order.va_number}</span>
                <button type="button" onClick={copyVaNumber} className="inline-flex items-center gap-2 rounded-full border border-[#2C1E16]/15 px-4 py-2 text-xs font-bold hover:bg-[#2C1E16] hover:text-white transition-colors">
                  <Copy size={14} /> {copied ? 'Tersalin' : 'Salin'}
                </button>
              </div>
              <p className="text-sm text-[#2C1E16]/60 mt-4">Transfer tepat sesuai total tagihan, lalu unggah bukti pembayaran di bawah ini.</p>
            </div>

            {order.payment_status === 'rejected' && <p className="mt-6 text-sm text-red-600">Bukti pembayaran ditolak. {order.payment_review_note}</p>}
            {canUpload && <form onSubmit={uploadProof} className="mt-8">
              <label className="text-xs font-bold text-[#2C1E16]/60 uppercase tracking-wider">Upload Bukti Pembayaran</label>
              <label className="mt-3 min-h-32 flex flex-col items-center justify-center gap-3 px-5 py-6 rounded-3xl border-2 border-dashed border-[#2C1E16]/15 bg-[#FDFBF7] cursor-pointer hover:border-[#D4813E] transition-colors">
                <UploadCloud size={28} className="text-[#D4813E]" />
                <span className="text-sm font-medium text-center">{data.proof ? data.proof.name : 'Pilih foto bukti transfer (JPG, PNG, atau WEBP)'}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => setData('proof', event.target.files?.[0] ?? null)} />
              </label>
              {errors.proof && <p className="mt-2 text-xs text-red-500">{errors.proof}</p>}
              {order.payment_proof && <p className="mt-3 text-sm text-emerald-600 font-medium">Bukti pembayaran sudah dikirim dan sedang menunggu konfirmasi.</p>}
              <button type="submit" disabled={processing || !data.proof} className="mt-5 w-full h-14 rounded-full bg-[#D4813E] text-white font-bold shadow-lg shadow-[#D4813E]/20 hover:bg-[#b86b30] disabled:opacity-50 transition-colors">
                {processing ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
              </button>
            </form>}
            {!canUpload && <p className="mt-6 text-sm text-[#2C1E16]/60">{order.payment_status === 'paid' ? 'Pembayaran telah dikonfirmasi.' : 'Bukti pembayaran sedang menunggu konfirmasi.'}</p>}
          </section>

          <aside className="bg-[#2C1E16] text-[#FDFBF7] rounded-[2rem] shadow-xl p-7 md:p-8 sticky top-8">
            <p className="text-xs font-bold uppercase tracking-wider text-white/50">Ringkasan Order</p>
            <p className="font-bold text-lg mt-2">{order.order_number}</p>
            <div className="my-7 border-y border-white/10 py-6 space-y-4 text-sm">
              <div className="flex justify-between text-white/70"><span>Subtotal Produk</span><span className="font-medium text-white">{money.format(order.subtotal)}</span></div>
              <div className="flex justify-between text-white/70"><span>Biaya Pengiriman</span><span className="font-medium text-white">{money.format(order.delivery_fee)}</span></div>
            </div>
            <div className="flex justify-between items-end"><span className="text-white/70">Total Tagihan</span><span className="text-2xl font-bold text-[#D4813E]">{money.format(order.total_amount)}</span></div>
            <div className="mt-7 flex items-center gap-3 rounded-2xl border border-[#D4813E]/40 bg-[#D4813E]/10 p-4">
              <CheckCircle2 size={19} className="text-[#D4813E]" />
              <span className="text-sm font-medium">Metode: Virtual Account</span>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
