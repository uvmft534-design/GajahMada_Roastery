import React, { useState } from 'react';
import { Head, Link, usePage, useForm, router } from '@inertiajs/react';
import { Coffee, Package, Users, Plus, Edit, Trash2, LogOut, TrendingUp, X, Image as ImageIcon, CreditCard, FileText, LayoutDashboard } from 'lucide-react';
import { orderStatusLabel } from '../utils/orderStatus';

export default function DashboardAdmin({ section = 'overview', products = [], orders = [], analytics = {}, attention = {}, couriers = [], categories = [] }) {
  const { auth } = usePage().props;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [selectedProof, setSelectedProof] = useState(null);
  const [courierAssignments, setCourierAssignments] = useState({});
  const filteredOrders = orderFilter === 'all' ? orders : orders.filter((order) => order.status === orderFilter);

  // Inertia Form Hook untuk kirim data & file gambar ke backend
  const { data, setData, post, delete: destroy, processing, reset, errors } = useForm({
    product_name: '',
    category: '',
    price: '',
    stock: '',
    weight_grams: '',
    description: '',
    image: null,
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    reset();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setData({
      product_name: product.product_name,
      category: product.category || '',
      price: product.price,
      stock: product.stock,
      weight_grams: product.weight_grams || '',
      description: product.description || '',
      image: null, // file baru opsional saat edit
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (editingProduct) {
      // Update data (menggunakan _method spoofing untuk POST ke route update)
      post(route('admin.products.update', editingProduct.product_id), {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    } else {
      // Tambah produk baru
      post(route('admin.products.store'), {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    }
  };

  const handleDelete = (id) => {
    if (confirm('Yakin mau hapus produk ini dari database? ☕️')) {
      destroy(route('admin.products.destroy', id));
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C1E16] font-sans flex">
      <Head title="Admin Dashboard - Kopi Gajahmada" />

      {/* SIDEBAR */}
      <aside className="w-64 bg-[#2C1E16] text-[#FDFBF7] hidden md:flex flex-col justify-between p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-3 mb-10 pb-4 border-b border-white/10">
            <div className="w-10 h-10 bg-[#D4813E] rounded-xl flex items-center justify-center font-bold text-white shadow-md">
              <Coffee size={22} />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide">Admin Panel</h2>
              <p className="text-[11px] text-[#FDFBF7]/60">Kopi Gajahmada</p>
            </div>
          </div>

          <nav className="space-y-2 text-sm font-medium">
            <AdminNav href={route('admin.dashboard')} active={section === 'overview'} icon={<LayoutDashboard size={18} />}>Ringkasan</AdminNav>
            <AdminNav href={route('admin.orders.index')} active={section === 'orders'} icon={<Package size={18} />}>Pesanan</AdminNav>
            <AdminNav href={route('admin.products.index')} active={section === 'products'} icon={<Coffee size={18} />}>Produk</AdminNav>
            <Link href={route('admin.payment-settings.index')} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-[#FDFBF7]/70 hover:text-white">
              <CreditCard size={18} /> Payment Settings
            </Link>
            <Link href={route('admin.reports.index')} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-[#FDFBF7]/70 hover:text-white">
              <FileText size={18} /> Laporan
            </Link>
          </nav>
        </div>

        <div className="border-t border-white/10 pt-4">
          <Link 
            href={route('logout')} 
            method="post" 
            as="button" 
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
          >
            <LogOut size={18} /> Keluar Admin
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-[#2C1E16]/10">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{{ overview: 'Ringkasan Operasional', orders: 'Kelola Pesanan', products: 'Kelola Produk' }[section]}</h1>
            <p className="text-xs md:text-sm text-[#2C1E16]/60 mt-1">{{ overview: 'Prioritas kerja hari ini tanpa tabel operasional yang panjang.', orders: 'Tinjau status pembayaran dan fulfillment pesanan.', products: 'Kelola katalog produk tanpa mengganggu halaman pesanan.' }[section]}</p>
          </div>
          <div className="bg-white px-4 py-2.5 rounded-2xl border border-[#2C1E16]/10 shadow-sm text-xs font-semibold flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            Admin: <span className="text-[#D4813E]">{auth?.user?.name || 'Admin'}</span>
          </div>
        </div>

        {section === 'overview' && <>
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-[#2C1E16]/10 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 text-[#D4813E] rounded-2xl flex items-center justify-center font-bold">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs text-[#2C1E16]/60 uppercase font-bold tracking-wider">Pendapatan Valid Bulan Ini</p>
              <h3 className="text-2xl font-bold mt-1">Rp {Number(analytics.monthlyRevenue || 0).toLocaleString('id-ID')}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#2C1E16]/10 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
              <Package size={24} />
            </div>
            <div>
              <p className="text-xs text-[#2C1E16]/60 uppercase font-bold tracking-wider">Pesanan Valid Bulan Ini</p>
              <h3 className="text-2xl font-bold mt-1">{analytics.monthlyOrderCount || 0}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#2C1E16]/10 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center font-bold">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs text-[#2C1E16]/60 uppercase font-bold tracking-wider">Transaksi Valid Bulan Ini</p>
              <h3 className="text-2xl font-bold mt-1">{analytics.transactions ?? 0}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#2C1E16]/10 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center font-bold">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs text-[#2C1E16]/60 uppercase font-bold tracking-wider">Rata-Rata Transaksi Bulan Ini</p>
              <h3 className="text-2xl font-bold mt-1">Rp {Number(analytics.avgTransaction || 0).toLocaleString('id-ID')}</h3>
            </div>
          </div>
        </div>

        {/* Analytics chart section */}
        <section className="bg-white rounded-3xl border border-[#2C1E16]/10 shadow-sm mb-8 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-[#2C1E16]/10">
            <h3 className="font-bold text-lg">Revenue 7 Hari Terakhir</h3>
            <p className="text-xs text-[#2C1E16]/60 mt-1">Data order masuk untuk 7 hari terakhir</p>
          </div>
          <div className="p-6 sm:p-8 flex items-end gap-4 min-h-[220px]">
            {Array.isArray(analytics.chartData) && analytics.chartData.length > 0 ? (
              (() => {
                const maxValue = Math.max(...analytics.chartData, 1);
                return analytics.chartData.map((value, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex justify-center items-end h-36">
                      <div className="w-10 rounded-t-xl bg-[#D4813E] transition-all" style={{ height: `${Math.max((Number(value) / maxValue) * 150, value > 0 ? 8 : 0)}px` }}></div>
                    </div>
                    <span className="text-[10px] font-bold text-[#2C1E16]/60">{`D${idx + 1}`}</span>
                  </div>
                ));
              })()
            ) : (
              Array.from({ length: 7 }).map((_, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex justify-center items-end h-36">
                    <div className="w-10 rounded-t-xl bg-[#D4813E]" style={{ height: '0px' }}></div>
                  </div>
                  <span className="text-[10px] font-bold text-[#2C1E16]/60">{`D${idx + 1}`}</span>
                </div>
              ))
            )}
          </div>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          <AttentionCard title="Perlu verifikasi pembayaran" count={attention.paymentConfirmation} href={route('admin.orders.index')} />
          <AttentionCard title="Siap diproses" count={attention.readyToProcess} href={route('admin.orders.index')} />
          <AttentionCard title="Produk stok rendah" count={attention.lowStock} href={route('admin.products.index')} />
        </section>
        </>}

        {section === 'orders' && <>
        {/* Orders filter tabs */}
        <section className="bg-white rounded-3xl border border-[#2C1E16]/10 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-[#2C1E16]/10">
            <div>
              <h3 className="font-bold text-lg">Daftar Pesanan Terbaru</h3>
              <p className="text-xs text-[#2C1E16]/60">Status fulfillment dan pembayaran pesanan terbaru</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {[['all', 'Semua'], ['awaiting_payment', 'Menunggu Pembayaran'], ['processing', 'Diproses'], ['packed', 'Sudah Dikemas'], ['pickup_requested', 'Menunggu Pickup'], ['shipped', 'Dikirim'], ['delivered', 'Sampai'], ['cancelled', 'Dibatalkan']].map(([value, label]) => <button key={value} onClick={() => setOrderFilter(value)} className={`px-3 py-2 rounded-xl border border-[#2C1E16]/10 ${orderFilter === value ? 'bg-[#FDFBF7]' : ''}`}>{label}</button>)}
            </div>
          </div>

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
                      <td className="min-w-[360px] p-4 pr-6 text-right sm:pr-8">
                        {order.payment_status === 'pending_confirmation' && order.payment_proof && <button onClick={() => setSelectedProof({ url: route('orders.proof.view', order.order_id), order })} className="mr-2 rounded-xl border border-[#2C1E16]/10 px-3 py-2 text-xs font-bold">Lihat Bukti Pembayaran</button>}
                        {order.status === 'awaiting_payment' && order.payment_status === 'pending_confirmation' && <span className="inline-flex gap-2"><button onClick={() => { const reviewNote = window.prompt('Alasan penolakan pembayaran'); if (reviewNote) router.post(route('admin.orders.rejectPayment', order.order_id), { review_note: reviewNote }, { preserveScroll: true }); }} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Reject Payment</button><button onClick={() => router.post(route('admin.orders.approvePayment', order.order_id), {}, { preserveScroll: true })} className="rounded-xl bg-[#D4813E] px-3 py-2 text-xs font-bold text-white">Confirm Payment</button></span>}
                        {order.status === 'awaiting_payment' && order.payment_status === 'paid' && <button onClick={() => router.post(route('admin.orders.process', order.order_id), {}, { preserveScroll: true })} className="rounded-xl bg-[#D4813E] px-3 py-2 text-xs font-bold text-white">Proses Pesanan</button>}
                        {order.status === 'processing' && <button onClick={() => router.post(route('admin.orders.packed', order.order_id), {}, { preserveScroll: true })} className="rounded-xl bg-[#D4813E] px-3 py-2 text-xs font-bold text-white">Tandai Sudah Dikemas</button>}
                        {order.status === 'awaiting_payment' && ['unpaid', 'rejected'].includes(order.payment_status) && <button onClick={() => router.post(route('admin.orders.cancel', order.order_id), {}, { preserveScroll: true })} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Batalkan</button>}
                        {order.status === 'packed' && (couriers.length === 0 ? <div className="flex w-full flex-wrap items-center justify-end gap-2"><span className="text-xs font-bold text-[#2C1E16]/50">Belum ada Courier tersedia</span><button disabled className="h-10 rounded-xl bg-[#D4813E] px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">Request Pickup</button></div> : <div className="flex w-full flex-wrap items-center justify-end gap-2"><select value={courierAssignments[order.order_id] || ''} onChange={(event) => setCourierAssignments({ ...courierAssignments, [order.order_id]: event.target.value })} className="h-10 min-w-[160px] rounded-xl border border-[#2C1E16]/10 bg-white px-3 text-sm text-[#2C1E16]" aria-label={`Pilih courier untuk ${order.order_number}`}><option value="" disabled>Pilih Courier</option>{couriers.map((courier) => <option key={courier.id} value={courier.id}>{courier.name}</option>)}</select><button disabled={!courierAssignments[order.order_id]} onClick={() => router.post(route('admin.orders.request-pickup', order.order_id), { courier_id: courierAssignments[order.order_id], delivery_note: window.prompt('Catatan pengantaran untuk courier (opsional)', order.delivery_note || '') || null }, { preserveScroll: true })} className="h-10 rounded-xl bg-[#D4813E] px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">Request Pickup</button></div>)}
                        {['pickup_requested', 'picked_up', 'shipped'].includes(order.status) && <div className="text-xs font-bold text-[#D4813E]">Courier: {order.courier?.name || '-'}{order.tracking_number ? ` · ${order.tracking_number}` : ''}</div>}
                        {order.status === 'delivered' && <span className="text-xs font-bold text-[#D4813E]">Sudah Sampai</span>}
                        {order.status === 'completed' && <span className="text-xs font-bold text-[#D4813E]">Selesai</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selectedProof && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between gap-4"><div><p className="font-bold">Bukti Pembayaran</p><p className="text-xs text-[#2C1E16]/60">{selectedProof.order.order_number}</p></div><button onClick={() => setSelectedProof(null)} className="rounded-xl border px-3 py-2 text-xs font-bold">Tutup</button></div><div className="mt-5 max-h-[70vh] overflow-auto rounded-2xl bg-[#FDFBF7] p-3"><img src={selectedProof.url} alt="Bukti pembayaran" className="max-h-[65vh] w-full object-contain" /><a href={selectedProof.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-bold text-[#D4813E]">Buka Bukti</a></div></div></div>}
        </>}

        {section === 'products' && <>
        {/* Table */}
        <div className="bg-white rounded-3xl border border-[#2C1E16]/10 shadow-sm overflow-hidden mt-8">
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-[#2C1E16]/10">
            <div>
              <h3 className="font-bold text-lg">Daftar Produk Biji Kopi</h3>
              <p className="text-xs text-[#2C1E16]/60">Data real-time dari tabel database `products`.</p>
            </div>
            <button 
              onClick={handleOpenAddModal}
              className="bg-[#D4813E] hover:bg-[#b86b30] text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-[#D4813E]/20 hover:scale-[1.02]"
            >
              <Plus size={16} /> addProduct()
            </button>
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
                    <td colSpan="6" className="p-8 text-center text-sm text-[#2C1E16]/50">
                      Belum ada produk di database. Klik tombol Tambah Produk di atas! ☕️
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
                      <td className="p-4 font-bold">Rp {Number(item.price).toLocaleString('id-ID')}</td>
                      <td className="p-4 font-medium text-[#2C1E16]/80">{item.stock} unit</td>
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
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#2C1E16]/10">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl">
                {editingProduct ? '✏️ Update Produk' : '✨ Tambah Produk Baru'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FDFBF7] flex items-center justify-center text-[#2C1E16]/60 hover:text-[#2C1E16]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2C1E16]/70 mb-1">
                  Nama Produk (`product_name`)
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
                  Kategori (`category`)
                </label>
                <select
                  value={data.category}
                  onChange={(e) => setData('category', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#2C1E16]/15 text-sm focus:outline-none focus:border-[#D4813E]"
                ><option value="">Pilih kategori</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#2C1E16]/70 mb-1">
                    Harga (`price`)
                  </label>
                  <div className="flex items-center rounded-xl border border-[#2C1E16]/15"><span className="pl-4 text-sm font-bold">Rp</span><input
                    type="text" inputMode="numeric"
                    required
                    value={data.price === '' ? '' : Number(data.price).toLocaleString('id-ID')}
                    onChange={(e) => setData('price', e.target.value.replace(/\D/g, ''))}
                    placeholder="125.000"
                    className="w-full px-3 py-2.5 text-sm focus:outline-none"
                  /></div>
                </div>
                <div><label className="block text-xs font-bold uppercase tracking-wider text-[#2C1E16]/70 mb-1">Berat Produk (g)</label><input type="number" min="1" required value={data.weight_grams} onChange={(e) => setData('weight_grams', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#2C1E16]/15 text-sm" /></div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#2C1E16]/70 mb-1">
                    Stok (`stock`)
                  </label>
                  <input 
                    type="number" 
                    required
                    value={data.stock}
                    onChange={(e) => setData('stock', e.target.value)}
                    placeholder="20"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#2C1E16]/15 text-sm focus:outline-none focus:border-[#D4813E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2C1E16]/70 mb-1">
                  Upload Foto Produk (`image`)
                </label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setData('image', e.target.files[0])}
                  className="w-full text-xs text-[#2C1E16]/70 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-[#D4813E] hover:file:bg-orange-100"
                />
                {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2C1E16]/70 mb-1">
                  Deskripsi (`description`)
                </label>
                <textarea 
                  rows="3"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Catatan rasa & deskripsi kopi..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#2C1E16]/15 text-sm focus:outline-none focus:border-[#D4813E] resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
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
                  {processing ? 'Menyimpan...' : (editingProduct ? 'Simpan Perubahan' : 'Simpan ke Database')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

function AdminNav({ href, active, icon, children }) {
  return <Link href={href} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${active ? 'bg-[#D4813E] text-white shadow-md shadow-[#D4813E]/20' : 'text-[#FDFBF7]/70 hover:bg-white/10 hover:text-white'}`}>{icon}{children}</Link>;
}

function AttentionCard({ title, count = 0, href }) {
  return <Link href={href} className="rounded-2xl border border-[#2C1E16]/10 bg-white p-5 shadow-sm transition-colors hover:border-[#D4813E]/50"><p className="text-sm font-semibold text-[#2C1E16]/70">{title}</p><p className="mt-2 text-3xl font-bold">{count}</p><span className="mt-3 inline-block text-xs font-bold text-[#D4813E]">Buka modul →</span></Link>;
}
