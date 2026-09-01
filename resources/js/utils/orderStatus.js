export const orderStatusLabel = (status) => ({
  awaiting_payment: 'Menunggu Pembayaran',
  processing: 'Pesanan Diproses',
  packed: 'Sudah Dikemas',
  pickup_requested: 'Menunggu Pickup',
  picked_up: 'Dijemput Kurir',
  shipped: 'Dalam Pengiriman',
  delivered: 'Sampai Tujuan',
  completed: 'Selesai',
  cancelled: 'Pesanan Dibatalkan',
}[status] || status);
