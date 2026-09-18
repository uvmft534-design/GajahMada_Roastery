import { Head } from '@inertiajs/react';
import AdminBackButton from '@/Components/AdminBackButton';
import AdminPanelNav from '@/Components/AdminPanelNav';
import { orderStatusLabel } from '../../../utils/orderStatus';

const rupiah = (amount) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
}).format(Number(amount || 0));

const dateTime = (value) => value ? new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value)) : null;

const paymentStatusLabel = (status) => ({
  unpaid: 'Belum dibayar',
  pending_confirmation: 'Menunggu verifikasi',
  rejected: 'Pembayaran ditolak',
  paid: 'Dibayar',
}[status] || status || '—');

function DetailValue({ label, value }) {
  if (!value) return null;

  return <div className="border-t border-[#2C1E16]/10 py-4 first:border-t-0 first:pt-0">
    <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#2C1E16]/50">{label}</p>
    <p className="mt-1.5 break-words text-sm font-semibold leading-6 text-[#2C1E16]">{value}</p>
  </div>;
}

export default function AdminOrderShow({ order }) {
  const timestamps = [
    ['Dibuat', order.created_at],
    ['Pembayaran ditinjau', order.payment_reviewed_at],
    ['Mulai diproses', order.processing_at],
    ['Dikemas', order.packed_at],
    ['Pickup diminta', order.pickup_requested_at],
    ['Dijemput kurir', order.picked_up_at],
    ['Dikirim', order.shipped_at],
    ['Sampai tujuan', order.delivered_at],
    ['Selesai', order.completed_at],
  ].filter(([, value]) => value);

  return <div className="min-h-screen bg-[#F7F3ED] text-[#2C1E16]">
    <Head title={`Detail ${order.order_number}`} />
    <AdminPanelNav active="orders" />
    <main className="mx-auto max-w-6xl p-4 sm:p-6 md:p-10">
      <div className="mb-6 flex flex-col gap-4 border-b border-[#2C1E16]/10 pb-6 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#B86632]">Detail pesanan</p>
          <h1 className="mt-2 text-2xl font-bold tracking-[-.035em] sm:text-3xl">{order.order_number}</h1>
          <p className="mt-2 text-sm text-[#2C1E16]/60">Tinjau informasi pengiriman dan seluruh produk dalam pesanan ini.</p>
        </div>
        <AdminBackButton href={route('admin.orders.index')} label="Kembali ke Pesanan" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-6">
          <section className="border border-[#2C1E16]/10 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#2C1E16]/10 pb-5">
              <div><h2 className="text-lg font-bold">Produk dalam pesanan</h2><p className="mt-1 text-sm text-[#2C1E16]/60">{order.items?.length || 0} item tercatat pada snapshot pesanan.</p></div>
              <span className="rounded-full bg-[#D4813E]/10 px-3 py-1.5 text-xs font-bold text-[#9A4F1D]">{orderStatusLabel(order.status)}</span>
            </div>
            <div className="divide-y divide-[#2C1E16]/10">
              {order.items?.map((item) => <article key={item.order_item_id} className="py-5 first:pt-5 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3"><img src={item.product?.image ? `/storage/${item.product.image}` : '/images/placeholder-coffee.png'} alt={item.product_name} className="h-16 w-16 shrink-0 rounded-xl border border-[#2C1E16]/10 bg-[#FDFBF7] object-cover" /><div className="min-w-0"><h3 className="font-bold">{item.product_name}</h3>{item.product_category && <p className="mt-1 text-sm text-[#2C1E16]/60">Kategori: {item.product_category}</p>}</div></div>
                  <p className="text-sm font-bold">{rupiah(item.subtotal)}</p>
                </div>
                <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs text-[#2C1E16]/55">Jumlah</dt><dd className="mt-1 font-semibold">{item.qty}</dd></div>
                  <div><dt className="text-xs text-[#2C1E16]/55">Harga satuan</dt><dd className="mt-1 font-semibold">{rupiah(item.unit_price)}</dd></div>
                  <div><dt className="text-xs text-[#2C1E16]/55">Subtotal</dt><dd className="mt-1 font-semibold">{rupiah(item.subtotal)}</dd></div>
                  {item.brew_method && <div><dt className="text-xs text-[#2C1E16]/55">Metode seduh</dt><dd className="mt-1 font-semibold">{item.brew_method === 'espresso' ? 'Espresso' : item.brew_method === 'filter' ? 'Filter' : item.brew_method}</dd></div>}
                </dl>
                {item.item_note && <div className="mt-4 rounded-xl bg-[#FFF9F3] px-4 py-3 text-sm leading-6"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#9A4F1D]">Catatan produk</p><p className="mt-1 whitespace-pre-line">{item.item_note}</p></div>}
              </article>)}
            </div>
          </section>

          {order.customer_note && <section className="border border-[#2C1E16]/10 bg-white p-5 shadow-sm sm:p-7"><h2 className="text-lg font-bold">Catatan pesanan</h2><p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#2C1E16]/75">{order.customer_note}</p></section>}
          {order.delivery_note && <section className="border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-7"><h2 className="text-lg font-bold text-amber-950">Catatan pengiriman</h2><p className="mt-3 whitespace-pre-line text-sm leading-6 text-amber-900/80">{order.delivery_note}</p></section>}
        </div>

        <aside className="space-y-6">
          <section className="border border-[#2C1E16]/10 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-bold">Informasi pesanan</h2><div className="mt-5"><DetailValue label="Status pesanan" value={orderStatusLabel(order.status)} /><DetailValue label="Status pembayaran" value={paymentStatusLabel(order.payment_status)} /><DetailValue label="Metode pengiriman" value={order.shipping_method} /><DetailValue label="Nomor resi" value={order.tracking_number} /><DetailValue label="Total pembayaran" value={rupiah(order.total_amount)} /></div></section>
          <section className="border border-[#2C1E16]/10 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-bold">Penerima & pengiriman</h2><div className="mt-5"><DetailValue label="Nama pelanggan" value={order.customer_name || order.user?.name} /><DetailValue label="Nomor telepon" value={order.customer_phone} /><DetailValue label="Alamat pengiriman" value={order.customer_address} /><DetailValue label="Kurir" value={order.courier?.name} /></div></section>
          {timestamps.length > 0 && <section className="border border-[#2C1E16]/10 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-bold">Waktu pesanan</h2><div className="mt-5">{timestamps.map(([label, value]) => <DetailValue key={label} label={label} value={dateTime(value)} />)}</div></section>}
        </aside>
      </div>
    </main>
  </div>;
}
