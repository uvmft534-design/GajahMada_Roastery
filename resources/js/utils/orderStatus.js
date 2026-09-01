export const orderStatusLabel = (status) => ({
  awaiting_payment: 'Menunggu Pembayaran',
  processing: 'Pesanan Diproses',
  packed: 'Sudah Dikemas',
  cancelled: 'Pesanan Dibatalkan',
  shipped: 'Dalam Pengiriman',
  completed: 'Selesai',
}[status] || status);
