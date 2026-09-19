import { router } from '@inertiajs/react';

export const toggleWishlist = (product, isWishlisted, options = {}) => {
  const requestOptions = { preserveScroll: true, ...options };

  return isWishlisted
    ? router.delete(route('wishlist.destroy', product.product_id), requestOptions)
    : router.post(route('wishlist.store', product.product_id), {}, requestOptions);
};
