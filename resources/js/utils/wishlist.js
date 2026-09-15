const KEY = 'kopi-gajahmada-wishlist';

export const getWishlist = () => {
  try { return JSON.parse(window.localStorage.getItem(KEY) || '[]'); } catch { return []; }
};

export const hasWishlisted = (productId) => getWishlist().some((product) => product.product_id === productId);

export const toggleWishlist = (product) => {
  const current = getWishlist();
  const exists = current.some((item) => item.product_id === product.product_id);
  const next = exists ? current.filter((item) => item.product_id !== product.product_id) : [product, ...current];
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('wishlist:changed'));
  return next;
};
