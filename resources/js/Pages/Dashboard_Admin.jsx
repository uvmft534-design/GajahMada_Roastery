import React, { useState } from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { Package, Users, Plus, Edit, Trash2, TrendingUp, X, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { orderStatusLabel } from '../utils/orderStatus';
import AdminBackButton from '@/Components/AdminBackButton';
import AdminPanelNav from '@/Components/AdminPanelNav';

const standardVariants = () => [
  { weight_grams: 200, enabled: false, price: '', stock: '' },
  { weight_grams: 1000, enabled: false, price: '', stock: '' },
];
const variantsForProduct = (variants = []) => {
  const existing = variants.map((variant) => ({ ...variant, enabled: true }));
  return [...existing, ...standardVariants().filter((variant) => !existing.some((current) => Number(current.weight_grams) === variant.weight_grams))];
};
const weightLabel = (weight) => Number(weight) === 1000 ? '1 kg' : `${weight} gram`;

export default function DashboardAdmin({ section = 'overview', products = [], orders = [], analytics = {}, revenueAnalytics = {}, attention = {}, filters = {}, couriers = [], categories = [] }) {
  const { adminNotifications = {} } = usePage().props;
  const orderNotificationCount = Number(adminNotifications.orderNotificationCount || adminNotifications.newOrders || 0);
  const ordersNeedAttention = Number(adminNotifications.ordersNeedAttention || 0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCategoryInputOpen, setIsCategoryInputOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryError, setNewCategoryError] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [orderFilter, setOrderFilter] = useState(filters.status || 'all');
  const [selectedProof, setSelectedProof] = useState(null);
  const [courierAssignments, setCourierAssignments] = useState({});
  const orderRows = Array.isArray(orders) ? orders : orders.data || [];
  const filteredOrders = orderFilter === 'all' ? orderRows : orderRows.filter((order) => order.status === orderFilter);

  // Inertia Form Hook untuk kirim data & file gambar ke backend
  const { data, setData, post, transform, delete: destroy, processing, reset, errors } = useForm({
    product_name: '',
    category: '',
    variants: standardVariants(),
    description: '',
    image: null,
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    reset();
    setIsCategoryInputOpen(false);
    setNewCategoryName('');
    setNewCategoryError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setData({
      product_name: product.product_name,
      category: product.category || '',
      variants: variantsForProduct(product.variants),
      description: product.description || '',
      image: null, // file baru opsional saat edit
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (data.variants.filter((variant) => variant.enabled).length === 0) return;
    transform((current) => ({ ...current, variants: current.variants.filter((variant) => variant.enabled).map(({ enabled, ...variant }) => variant) }));
    post(editingProduct ? route('admin.products.update', editingProduct.product_id) : route('admin.products.store'), {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      },
    });
  };

  const handleDelete = (id) => {
    if (confirm('Yakin mau hapus produk ini dari database?')) {
      destroy(route('admin.products.destroy', id));
    }
  };

  const addCategoryFromProductForm = () => {
    const name = newCategoryName.trim();
    if (!name) {
      setNewCategoryError('Masukkan nama kategori terlebih dahulu.');
      return;
    }

    setIsAddingCategory(true);
    setNewCategoryError('');
    router.post(route('admin.product-categories.store'), { name }, {
      preserveScroll: true,
      onSuccess: () => {
        setData('category', name);
        setNewCategoryName('');
        setIsCategoryInputOpen(false);
      },
      onError: (formErrors) => setNewCategoryError(formErrors.name || 'Kategori tidak dapat disimpan.'),
      onFinish: () => setIsAddingCategory(false),
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F3ED] text-[#2C1E16] font-sans">
      <Head title="Admin Dashboard - Kopi Gajahmada" />

      <AdminPanelNav active={section} />

      {/* MAIN CONTENT */}
      <main className="mx-auto min-w-0 max-w-[1600px] p-4 sm:p-6 md:p-10">
        
        <div className="mb-5 flex flex-col justify-between gap-3 border-b border-[#2C1E16]/10 pb-5 sm:mb-8 sm:gap-5 sm:pb-7 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[.2em] text-[#B86632]">Admin workspace</p>
            <h1 className="text-2xl font-bold tracking-[-.035em] sm:text-3xl md:text-4xl">{{ overview: 'Ringkasan Operasional', orders: 'Pesanan Masuk', products: 'Katalog Produk' }[section]}</h1>
            <p className="mt-2 max-w-xl text-xs leading-5 text-[#2C1E16]/60 sm:text-sm sm:leading-6">{{ overview: 'Lihat apa yang perlu ditangani terlebih dahulu, tanpa mencari-cari menu.', orders: 'Tinjau pembayaran, proses pesanan, dan pengiriman dari satu alur kerja.', products: 'Kelola informasi produk dan persediaan dengan cepat.' }[section]}</p>
          </div>
          {section !== 'overview' && <AdminBackButton href={route('admin.dashboard')} label="Kembali ke Ringkasan" />}
        </div>

        {section === 'overview' && <>
        {orderNotificationCount > 0 && <Link href={route('admin.orders.index')} className="mb-5 flex flex-col gap-2 border-l-4 border-[#D4813E] bg-[#FFF5EA] p-3 transition hover:bg-[#FFE9D2] sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-5"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9A4F1D] sm:text-[11px] sm:tracking-[.16em]">Notifikasi pesanan</p><p className="mt-1 text-xs font-semibold text-[#2C1E16] sm:text-sm"><span className="mr-1 text-lg font-bold text-[#B86632] sm:text-xl">{orderNotificationCount}</span> pesanan baru atau masih memerlukan tindak lanjut.</p></div><span className="text-[10px] font-bold uppercase tracking-[.1em] text-[#9A4F1D] sm:text-xs sm:tracking-[.12em]">Buka →</span></Link>}
        {/* Stats */}
        <div className="mb-5 grid grid-cols-2 border-y border-[#2C1E16]/10 bg-white sm:mb-8 lg:grid-cols-4">
          <div className="border-b border-[#2C1E16]/10 p-4 transition-colors hover:bg-[#FFF9F3] sm:border-r sm:p-6 lg:border-b-0">
            <div className="mb-4 flex items-center justify-between sm:mb-7"><span className="text-[9px] font-bold uppercase tracking-[.1em] text-[#2C1E16]/55 sm:text-[11px] sm:tracking-[.16em]">Pendapatan valid</span><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFE5CE] text-[#B86632] sm:h-9 sm:w-9"><TrendingUp size={15} className="sm:hidden" /><TrendingUp size={18} className="hidden sm:block" /></span></div>
            <div>
              <h3 className="text-lg font-bold tracking-tight sm:text-2xl">Rp {Number(analytics.monthlyRevenue || 0).toLocaleString('id-ID')}</h3><p className="mt-1 text-[10px] text-[#2C1E16]/50 sm:text-xs">Bulan berjalan</p>
            </div>
          </div>

          <div className="border-b border-[#2C1E16]/10 p-4 transition-colors hover:bg-[#FFF9F3] sm:p-6 lg:border-b-0 lg:border-r"><div className="mb-4 flex items-center justify-between sm:mb-7"><span className="text-[9px] font-bold uppercase tracking-[.1em] text-[#2C1E16]/55 sm:text-[11px] sm:tracking-[.16em]">Pesanan valid</span><span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 sm:h-9 sm:w-9"><Package size={15} className="sm:hidden" /><Package size={18} className="hidden sm:block" /></span></div>
            <div>
              <h3 className="text-xl font-bold tracking-tight sm:text-2xl">{analytics.monthlyOrderCount || 0}</h3><p className="mt-1 text-[10px] text-[#2C1E16]/50 sm:text-xs">Bulan berjalan</p>
            </div>
          </div>

          <div className="border-b border-[#2C1E16]/10 p-4 transition-colors hover:bg-[#FFF9F3] sm:border-r sm:p-6 lg:border-b-0"><div className="mb-4 flex items-center justify-between sm:mb-7"><span className="text-[9px] font-bold uppercase tracking-[.1em] text-[#2C1E16]/55 sm:text-[11px] sm:tracking-[.16em]">Transaksi</span><span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-700 sm:h-9 sm:w-9"><Users size={15} className="sm:hidden" /><Users size={18} className="hidden sm:block" /></span></div>
            <div>
              <h3 className="text-xl font-bold tracking-tight sm:text-2xl">{analytics.transactions ?? 0}</h3><p className="mt-1 text-[10px] text-[#2C1E16]/50 sm:text-xs">Pembayaran tervalidasi</p>
            </div>
          </div>

          <div className="bg-[#2C1E16] p-4 text-[#FDFBF7] sm:p-6"><div className="mb-4 flex items-center justify-between sm:mb-7"><span className="text-[9px] font-bold uppercase tracking-[.1em] text-[#FDFBF7]/55 sm:text-[11px] sm:tracking-[.16em]">Nilai rata-rata</span><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[#F4C7A3] sm:h-9 sm:w-9"><TrendingUp size={15} className="sm:hidden" /><TrendingUp size={18} className="hidden sm:block" /></span></div>
            <div>
              <h3 className="text-lg font-bold tracking-tight sm:text-2xl">Rp {Number(analytics.avgTransaction || 0).toLocaleString('id-ID')}</h3><p className="mt-1 text-[10px] text-[#FDFBF7]/50 sm:text-xs">Per pesanan valid</p>
            </div>
          </div>
        </div>

        {/* Analytics chart section */}
        <section className="mb-5 overflow-hidden border border-[#2C1E16]/10 bg-white shadow-[0_18px_50px_rgba(44,30,22,.06)] sm:mb-8">
          <div className="flex flex-col justify-between gap-2 border-b border-[#2C1E16]/10 p-4 sm:flex-row sm:items-end sm:gap-3 sm:p-8">
            <div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#B86632] sm:text-[11px] sm:tracking-[.16em]">Pergerakan penjualan</p><h3 className="mt-1 text-lg font-bold tracking-tight sm:mt-2 sm:text-xl">Pendapatan 7 hari terakhir</h3></div>
            <p className="text-[10px] text-[#2C1E16]/55 sm:text-xs">Hanya pesanan dengan pembayaran valid.</p>
          </div>
          <RevenueLineChart trend={revenueAnalytics.trend || []} summary={revenueAnalytics.summary || {}} />
        </section>
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <AttentionCard title="Pesanan perlu ditangani" count={ordersNeedAttention} href={route('admin.orders.index')} />
          <AttentionCard title="Perlu verifikasi pembayaran" count={attention.paymentConfirmation} href={route('admin.orders.index')} />
          <AttentionCard title="Siap diproses" count={attention.readyToProcess} href={route('admin.orders.index')} />
          <AttentionCard title="Produk stok rendah" count={attention.lowStock} href={route('admin.products.index')} />
        </section>
        </>}

        {section === 'orders' && <>
        {/* Orders filter tabs */}
        <section className="overflow-hidden border border-[#2C1E16]/10 bg-white shadow-[0_18px_50px_rgba(44,30,22,.05)]">
          <div className="flex flex-col items-start justify-between gap-4 border-b border-[#2C1E16]/10 p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#B86632]">Antrian kerja</p><h3 className="mt-2 text-xl font-bold tracking-tight">Pesanan terbaru</h3>
              <p className="mt-1 text-xs text-[#2C1E16]/60">Pilih status untuk memusatkan perhatian pada tahap tertentu.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {[['all', 'Semua'], ['awaiting_payment', 'Menunggu Pembayaran'], ['processing', 'Diproses'], ['packed', 'Sudah Dikemas'], ['pickup_requested', 'Menunggu Pickup'], ['shipped', 'Dikirim'], ['delivered', 'Sampai'], ['cancelled', 'Dibatalkan']].map(([value, label]) => <button key={value} onClick={() => setOrderFilter(value)} className={`border px-3 py-2 transition ${orderFilter === value ? 'border-[#2C1E16] bg-[#2C1E16] text-white' : 'border-[#2C1E16]/12 bg-white text-[#2C1E16]/65 hover:border-[#B86632]'}`}>{label}</button>)}
            </div>
          </div>

          <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); router.get(route('admin.orders.index'), Object.fromEntries([...form.entries()].filter(([, value]) => value))); }} className="grid gap-3 border-b border-[#2C1E16]/10 p-4 sm:p-5 md:grid-cols-4"><input name="search" defaultValue={filters.search || ''} placeholder="Order, customer, HP, produk" className="rounded-xl border p-2.5 md:col-span-2" /><select name="payment_status" defaultValue={filters.payment_status || ''} className="rounded-xl border p-2.5"><option value="">Semua pembayaran</option><option value="unpaid">Belum dibayar</option><option value="pending_confirmation">Perlu verifikasi</option><option value="rejected">Ditolak</option><option value="paid">Dibayar</option></select><button className="rounded-xl bg-[#2C1E16] px-3 font-bold text-white">Cari</button><input name="from" type="date" defaultValue={filters.from || ''} className="rounded-xl border p-2.5" /><input name="to" type="date" defaultValue={filters.to || ''} className="rounded-xl border p-2.5" /><button type="button" onClick={() => router.get(route('admin.dashboard'))} className="rounded-xl border px-3 py-2.5 text-center font-bold">← Ringkasan</button><button type="button" onClick={() => router.get(route('admin.orders.index'))} className="rounded-xl border px-3 py-2.5 text-center font-bold">Reset</button></form>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#FDFBF7] border-b border-[#2C1E16]/10 text-xs font-bold uppercase tracking-wider text-[#2C1E16]/60">
                  <th className="p-4 pl-6 sm:pl-8">Order</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Produk</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                  <th className="min-w-[360px] p-4 pr-6 text-right sm:pr-8">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C1E16]/5">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-sm text-[#2C1E16]/50">Belum ada pesanan masuk.</td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.order_id} className="hover:bg-[#FDFBF7]/60 transition-colors">
                      <td className="p-4 pl-6 sm:pl-8">
                        <div className="font-bold">{order.order_number}</div>
                        <div className="text-[11px] text-[#2C1E16]/50">{new Date(order.created_at).toLocaleDateString('id-ID')}</div>
                      </td>
                      <td className="p-4 text-sm font-medium text-[#2C1E16]/80">{order.customer_name || order.user?.name || '-'}</td>
                      <td className="p-4 text-sm font-medium text-[#2C1E16]/80">{order.items?.[0]?.product_name || 'Produk'}</td>
                      <td className="p-4 font-bold">Rp {Number(order.total_amount || 0).toLocaleString('id-ID')}</td>
                      <td className="p-4">
                        <span className="rounded-full bg-[#D4813E]/10 px-3 py-1 text-[11px] font-bold text-[#D4813E] uppercase">{orderStatusLabel(order.status)}</span>
                        <div className="mt-1 text-[10px] font-bold uppercase text-[#2C1E16]/50">Payment: {order.payment_status}</div>
                        <div className="text-[10px] text-[#2C1E16]/50">{order.payment_bank_name || '-'} · {order.va_number || '-'}</div>
                      </td>
                      <td className="min-w-[360px] p-4 pr-6 text-right sm:pr-8"><div className="flex flex-wrap items-center justify-end gap-2">
                        <Link href={route('admin.orders.show', order.order_id)} className="rounded-xl border border-[#2C1E16]/15 bg-white px-3 py-2 text-xs font-bold text-[#2C1E16] transition hover:border-[#D4813E] hover:bg-[#FFF5EA] hover:text-[#9A4F1D]">Lihat Detail</Link>
                        {order.payment_status === 'pending_confirmation' && order.payment_proof && <button onClick={() => setSelectedProof({ url: route('orders.proof.view', order.order_id), order })} className="inline-flex items-center gap-1.5 rounded-xl border border-[#D4813E]/40 bg-[#FFF5EA] px-3 py-2 text-xs font-bold text-[#9A4F1D] transition hover:border-[#D4813E] hover:bg-[#FFE9D2]"><ImageIcon size={14}/> Lihat Bukti</button>}
                        {order.status === 'awaiting_payment' && order.payment_status === 'pending_confirmation' && <span className="inline-flex gap-2"><button onClick={() => { const reviewNote = window.prompt('Alasan penolakan pembayaran'); if (reviewNote) router.post(route('admin.orders.rejectPayment', order.order_id), { review_note: reviewNote }, { preserveScroll: true }); }} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Reject Payment</button><button onClick={() => router.post(route('admin.orders.approvePayment', order.order_id), {}, { preserveScroll: true })} className="rounded-xl bg-[#D4813E] px-3 py-2 text-xs font-bold text-white">Confirm Payment</button></span>}
                        {order.status === 'awaiting_payment' && order.payment_status === 'paid' && <button onClick={() => router.post(route('admin.orders.process', order.order_id), {}, { preserveScroll: true })} className="rounded-xl bg-[#D4813E] px-3 py-2 text-xs font-bold text-white">Proses Pesanan</button>}
                        {order.status === 'processing' && <button onClick={() => router.post(route('admin.orders.packed', order.order_id), {}, { preserveScroll: true })} className="rounded-xl bg-[#D4813E] px-3 py-2 text-xs font-bold text-white">Tandai Sudah Dikemas</button>}
                        {order.status === 'awaiting_payment' && ['unpaid', 'rejected'].includes(order.payment_status) && <button onClick={() => router.post(route('admin.orders.cancel', order.order_id), {}, { preserveScroll: true })} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Batalkan</button>}
                        {order.status === 'packed' && (couriers.length === 0 ? <div className="flex w-full flex-wrap items-center justify-end gap-2"><span className="text-xs font-bold text-[#2C1E16]/50">Belum ada Courier tersedia</span><button disabled className="h-10 rounded-xl bg-[#D4813E] px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">Request Pickup</button></div> : <div className="flex w-full flex-wrap items-center justify-end gap-2"><select value={courierAssignments[order.order_id] || ''} onChange={(event) => setCourierAssignments({ ...courierAssignments, [order.order_id]: event.target.value })} className="h-10 min-w-[160px] rounded-xl border border-[#2C1E16]/10 bg-white px-3 text-sm text-[#2C1E16]" aria-label={`Pilih courier untuk ${order.order_number}`}><option value="" disabled>Pilih Courier</option>{couriers.map((courier) => <option key={courier.id} value={courier.id}>{courier.name}</option>)}</select><button disabled={!courierAssignments[order.order_id]} onClick={() => router.post(route('admin.orders.request-pickup', order.order_id), { courier_id: courierAssignments[order.order_id], delivery_note: window.prompt('Catatan pengantaran untuk courier (opsional)', order.delivery_note || '') || null }, { preserveScroll: true })} className="h-10 rounded-xl bg-[#D4813E] px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">Request Pickup</button></div>)}
                        {['pickup_requested', 'picked_up', 'shipped'].includes(order.status) && <div className="text-xs font-bold text-[#D4813E]">Courier: {order.courier?.name || '-'}{order.tracking_number ? ` · ${order.tracking_number}` : ''}</div>}
                        {order.status === 'delivered' && <span className="text-xs font-bold text-[#D4813E]">Sudah Sampai</span>}
                        {order.status === 'completed' && <span className="text-xs font-bold text-[#D4813E]">Selesai</span>}
                      </div></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {orders.links && <div className="flex flex-wrap gap-2 border-t border-[#2C1E16]/10 p-4">{orders.links.map(link => <button key={link.label} disabled={!link.url} onClick={() => link.url && router.visit(link.url)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40" dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>}
        </section>

        {selectedProof && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between gap-4"><div><p className="font-bold">Bukti Pembayaran</p><p className="text-xs text-[#2C1E16]/60">{selectedProof.order.order_number}</p></div><button onClick={() => setSelectedProof(null)} className="rounded-xl border px-3 py-2 text-xs font-bold">Tutup</button></div><div className="mt-5 max-h-[70vh] overflow-auto rounded-2xl bg-[#FDFBF7] p-3"><img src={selectedProof.url} alt="Bukti pembayaran" className="max-h-[65vh] w-full object-contain" /><a href={selectedProof.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-bold text-[#D4813E]">Buka Bukti</a></div></div></div>}
        </>}

        {section === 'products' && <>
        {/* Table */}
        <div className="mt-2 overflow-hidden border border-[#2C1E16]/10 bg-white shadow-[0_18px_50px_rgba(44,30,22,.05)]">
          <div className="flex flex-col items-start justify-between gap-4 border-b border-[#2C1E16]/10 p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#B86632]">Persediaan & katalog</p><h3 className="mt-2 text-xl font-bold tracking-tight">Produk kopi</h3>
              <p className="mt-1 text-xs text-[#2C1E16]/60">Informasi produk, ulasan, dan jumlah stok tersedia.</p>
            </div>
            <button onClick={handleOpenAddModal} className="flex items-center gap-2 rounded-xl bg-[#D4813E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b86b30]"><Plus size={17} /> Tambah Produk</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#FDFBF7] border-b border-[#2C1E16]/10 text-xs font-bold uppercase tracking-wider text-[#2C1E16]/60">
                  <th className="p-4 pl-6 sm:pl-8">Gambar & Produk</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Deskripsi</th>
                  <th className="p-4">Harga</th>
                  <th className="p-4">Stok</th>
                  <th className="p-4 pr-6 sm:pr-8 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C1E16]/5">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-sm text-[#2C1E16]/50">
                      Belum ada produk di database. Klik tombol Tambah Produk di atas.
                    </td>
                  </tr>
                ) : (
                  products.map((item) => (
                    <tr key={item.product_id} className="hover:bg-[#FDFBF7]/60 transition-colors">
                      <td className="p-4 pl-6 sm:pl-8 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {item.image ? (
                            <img src={`/storage/${item.image}`} alt={item.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={20} className="text-[#D4813E]" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">{item.product_name}</div>
                          <div className="text-[11px] text-[#2C1E16]/50 font-mono">ID: #{item.product_id}</div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium text-[#2C1E16]/80">{item.category || '-'}</td>
                      <td className="p-4 text-sm font-medium text-[#2C1E16]/80">{item.reviews_avg_rating ? Number(item.reviews_avg_rating).toFixed(1) : '0.0'} / 5 ({item.reviews_count ?? 0})</td>
                      <td className="p-4 max-w-xs truncate text-xs text-[#2C1E16]/70">
                        {item.description || '-'}
                      </td>
                      <td className="p-4 font-bold">{(item.variant_price_from ?? (item.variants?.length === 1 ? item.variants[0]?.price : null)) ? `${item.variants?.length > 1 ? 'Mulai ' : ''}Rp ${Number(item.variant_price_from ?? item.variants[0]?.price).toLocaleString('id-ID')}` : '—'}</td>
                      <td className="p-4 font-medium text-[#2C1E16]/80"><p>Stok Total: {item.variant_stock_total || 0}</p><p className="mt-1 text-[11px] text-[#2C1E16]/50">{item.variants?.map((variant) => `${weightLabel(variant.weight_grams)}: ${variant.stock}`).join(' · ') || 'Belum dikonfigurasi'}</p></td>
                      <td className="p-4 pr-6 sm:pr-8 text-right flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenEditModal(item)}
                          className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.product_id)}
                          className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>}

      </main>

      {/* MODAL FORM */}
      {section === 'products' && isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col border border-[#2C1E16]/10 bg-white shadow-2xl">
            
            <div className="flex flex-none items-center justify-between border-b border-[#2C1E16]/10 px-5 py-4 sm:px-6">
              <div><p className="text-xs font-bold uppercase tracking-wider text-[#D4813E]">Katalog Produk</p><h3 className="mt-1 font-bold text-xl">{editingProduct ? 'Ubah Produk' : 'Tambah Produk Baru'}</h3></div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FDFBF7] flex items-center justify-center text-[#2C1E16]/60 hover:text-[#2C1E16]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="flex min-h-0 flex-1 flex-col">
              <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto px-5 py-4 sm:px-6 md:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2C1E16]/70 mb-1">
                  Nama produk
                </label>
                <input 
                  type="text" 
                  required
                  value={data.product_name}
                  onChange={(e) => setData('product_name', e.target.value)}
                  placeholder="Contoh: Flores Bajawa Natural"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#2C1E16]/15 text-sm focus:outline-none focus:border-[#D4813E]"
                />
                {errors.product_name && <p className="text-red-500 text-xs mt-1">{errors.product_name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2C1E16]/70 mb-1">
                  Kategori
                </label>
                <select
                  value={data.category}
                  onChange={(e) => setData('category', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#2C1E16]/15 text-sm focus:outline-none focus:border-[#D4813E]"
                ><option value="">Pilih kategori</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select>
                <button type="button" onClick={() => setIsCategoryInputOpen((open) => !open)} className="mt-2 text-xs font-semibold text-[#A85C2A] hover:underline">{isCategoryInputOpen ? 'Batal tambah kategori' : '+ Tambah kategori baru'}</button>
                {isCategoryInputOpen && <div className="mt-3 border-l-2 border-[#D4813E] pl-3"><div className="flex gap-2"><input value={newCategoryName} onChange={(event) => { setNewCategoryName(event.target.value); setNewCategoryError(''); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCategoryFromProductForm(); } }} maxLength="100" placeholder="Nama kategori" className="min-w-0 flex-1 rounded-lg border border-[#2C1E16]/15 px-3 py-2 text-sm outline-none focus:border-[#D4813E]"/><button type="button" onClick={addCategoryFromProductForm} disabled={isAddingCategory} className="rounded-lg bg-[#2C1E16] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{isAddingCategory ? '...' : 'Tambah'}</button></div>{newCategoryError && <p className="mt-1 text-xs text-red-600">{newCategoryError}</p>}</div>}
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>

              <div className="rounded-2xl border border-[#2C1E16]/10 bg-[#FDFBF7] p-4 md:col-span-2"><div className="flex items-baseline justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wider text-[#2C1E16]/70">Varian berat</p><p className="text-[11px] text-[#2C1E16]/55">Gunakan stok 0 untuk berhenti menjual sementara.</p></div><div className="mt-3 grid gap-3 md:grid-cols-2">{data.variants.map((variant, index) => { const isStandard = [200, 1000].includes(Number(variant.weight_grams)); return <div key={variant.weight_grams} className={`rounded-xl border p-3 ${variant.enabled ? 'border-[#D4813E]/40 bg-white' : 'border-[#2C1E16]/10 bg-white/60'}`}><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={variant.enabled} disabled={!isStandard} onChange={(event) => setData('variants', data.variants.map((current, currentIndex) => currentIndex === index ? { ...current, enabled: event.target.checked } : current))} className="accent-[#D4813E] disabled:opacity-70" />{weightLabel(variant.weight_grams)} {!isStandard && <span className="text-xs font-normal text-[#2C1E16]/50">varian legacy</span>}</label>{variant.enabled && <div className="mt-3 grid grid-cols-2 gap-3"><div><label className="text-xs font-semibold text-[#2C1E16]/60">Harga (Rp)</label><input type="text" inputMode="numeric" value={variant.price === '' ? '' : Number(variant.price).toLocaleString('id-ID')} onChange={(event) => setData('variants', data.variants.map((current, currentIndex) => currentIndex === index ? { ...current, price: event.target.value.replace(/\D/g, '') } : current))} className="mt-1 w-full rounded-xl border border-[#2C1E16]/15 px-3 py-2 text-sm" />{errors[`variants.${index}.price`] && <p className="mt-1 text-xs text-red-500">{errors[`variants.${index}.price`]}</p>}</div><div><label className="text-xs font-semibold text-[#2C1E16]/60">Stok</label><input type="number" min="0" value={variant.stock} onChange={(event) => setData('variants', data.variants.map((current, currentIndex) => currentIndex === index ? { ...current, stock: event.target.value } : current))} className="mt-1 w-full rounded-xl border border-[#2C1E16]/15 px-3 py-2 text-sm" />{errors[`variants.${index}.stock`] && <p className="mt-1 text-xs text-red-500">{errors[`variants.${index}.stock`]}</p>}</div></div>}</div>; })}</div>{errors.variants && <p className="mt-2 text-xs text-red-500">{errors.variants}</p>}</div>

              <div className="rounded-2xl border border-dashed border-[#D4813E]/40 bg-[#FFF9F3] p-4">
                <label className="flex cursor-pointer items-center gap-3" htmlFor="product-image">
                  <span className="rounded-xl bg-white p-3 text-[#D4813E] shadow-sm"><UploadCloud size={19}/></span><span><span className="block text-sm font-bold">Foto produk</span><span className="mt-0.5 block text-xs text-[#2C1E16]/55">PNG, JPG, atau WEBP · maksimal 2 MB</span></span>
                </label>
                <input id="product-image"
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setData('image', e.target.files[0])}
                  className="sr-only"
                />
                {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2C1E16]/70 mb-1">
                  Deskripsi
                </label>
                <textarea 
                  rows="2"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Catatan rasa & deskripsi kopi..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#2C1E16]/15 text-sm focus:outline-none focus:border-[#D4813E] resize-none"
                />
              </div>

              </div>

              <div className="flex flex-none gap-3 border-t border-[#2C1E16]/10 px-5 py-4 sm:px-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-[#2C1E16]/15 text-xs font-bold text-[#2C1E16]/70 hover:bg-[#FDFBF7]"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={processing}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#D4813E] hover:bg-[#b86b30] text-white text-xs font-bold shadow-md shadow-[#D4813E]/20 disabled:opacity-50"
                >
                  {processing ? 'Menyimpan...' : (editingProduct ? 'Simpan Perubahan' : 'Simpan Produk')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

function AttentionCard({ title, count = 0, href }) {
  return <Link href={href} className="group flex min-w-0 items-center gap-2 border-l-2 border-[#2C1E16]/15 bg-white px-3 py-3 transition hover:border-[#B86632] hover:bg-[#FFF9F3] sm:gap-4 sm:px-5 sm:py-5"><span className="min-w-6 text-2xl font-bold tracking-tight text-[#B86632] sm:min-w-10 sm:text-3xl">{count}</span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold leading-4 text-[#2C1E16]/75 sm:text-sm sm:leading-5">{title}</span><span className="mt-1 block text-[9px] font-bold uppercase tracking-[.08em] text-[#B86632] sm:text-[11px] sm:tracking-[.13em]">Tinjau</span></span><ArrowRightIcon /></Link>;
}

function ArrowRightIcon() {
  return <span aria-hidden="true" className="text-lg text-[#2C1E16]/35 transition group-hover:translate-x-1">→</span>;
}

function RevenueLineChart({ trend, summary }) {
  const [active, setActive] = useState(null);
  const max = Math.max(...trend.map(point => Number(point.revenue)), 1);
  if (!trend.some(point => Number(point.revenue) > 0)) return <div className="p-8 text-sm text-[#2C1E16]/60">Belum ada revenue valid dalam 7 hari terakhir.</div>;
  const points = trend.map((point, index) => `${30 + index * 90},${180 - (Number(point.revenue) / max) * 140}`).join(' ');
  const point = active === null ? null : trend[active];
  const format = amount => `Rp${Number(amount || 0).toLocaleString('id-ID')}`;
  const change = summary.change_percentage;
  return <div className="p-4 sm:p-8"><div className="mb-3 grid grid-cols-3 gap-2 text-[10px] sm:mb-4 sm:text-sm"><p><b className="text-xs sm:text-base">{format(summary.current_revenue)}</b><br/><span className="text-[#2C1E16]/60">revenue 7 hari</span></p><p><b className="text-xs sm:text-base">{summary.valid_order_count || 0}</b><br/><span className="text-[#2C1E16]/60">pesanan valid</span></p><p><b className="text-xs sm:text-base">{change === null ? 'Aktivitas baru' : `${change >= 0 ? '+' : ''}${change || 0}%`}</b><br/><span className="text-[#2C1E16]/60">vs 7 hari</span></p></div><div className="relative"><svg viewBox="0 0 600 220" className="h-44 w-full overflow-visible sm:h-56"><line x1="30" y1="180" x2="580" y2="180" stroke="#2C1E16" strokeOpacity=".15" /><line x1="30" y1="40" x2="30" y2="180" stroke="#2C1E16" strokeOpacity=".15" /><polyline points={points} fill="none" stroke="#D4813E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />{trend.map((item, index) => { const x = 30 + index * 90; const y = 180 - (Number(item.revenue) / max) * 140; return <g key={item.date}><circle cx={x} cy={y} r="10" fill="transparent" onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)} onClick={() => setActive(active === index ? null : index)} /><circle cx={x} cy={y} r="4" fill="#D4813E" /><text x={x} y="205" textAnchor="middle" className="fill-[#2C1E16]/60 text-[11px]">{item.label}</text></g>; })}</svg>{point && <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-xl bg-[#2C1E16] px-3 py-2 text-[10px] text-white shadow-xl sm:px-4 sm:py-3 sm:text-xs"><b>{point.label}</b><br/>Revenue valid: {format(point.revenue)}<br/>Pesanan valid: {point.valid_order_count}<br/>AOV harian: {format(point.daily_aov)}</div>}</div></div>;
}
