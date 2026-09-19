const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatNumberId = (value) => Number(value || 0).toLocaleString('id-ID');

export const formatRupiah = (value, { spaceAfterPrefix = false } = {}) => {
  if (!spaceAfterPrefix) return rupiahFormatter.format(Number(value || 0));

  return `Rp ${formatNumberId(value)}`;
};
