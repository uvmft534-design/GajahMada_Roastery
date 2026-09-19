import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Heart, Image as ImageIcon, ShoppingBag, Star } from 'lucide-react';
import { formatRupiah } from '@/utils/currency';

export default function ProductCard({
  product,
  profile,
  href,
  isWishlisted = false,
  onNavigate,
  onWishlist,
  onRequireWishlistLogin,
  motionProps = {},
}) {
  const isPublic = profile === 'public';
  const requiresLogin = isPublic && !onWishlist;
  const Root = isPublic ? motion.article : Link;
  const price = product.variant_price_from ?? (product.variants?.length === 1 ? product.variants[0]?.price : null);
  const rootProps = isPublic
    ? {
      ...motionProps,
      role: 'link',
      tabIndex: 0,
      'aria-label': `Lihat detail ${product.product_name}`,
      onClick: onNavigate,
      onKeyDown: (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onNavigate?.();
        }
      },
      className: 'group flex transform-gpu cursor-pointer flex-col justify-between rounded-3xl border border-[#2C1E16]/5 bg-white p-4 shadow-sm transition-[transform,border-color] duration-200 ease-out hover:-translate-y-1 hover:border-[#D4813E] hover:shadow-xl',
    }
    : {
      href,
      className: 'group flex transform-gpu flex-col justify-between rounded-3xl border border-[#2C1E16]/5 bg-white p-4 shadow-sm transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-[#D4813E] hover:shadow-xl cursor-pointer',
    };

  const handleWishlist = (event) => {
    if (!isPublic) event.preventDefault();
    event.stopPropagation();

    if (requiresLogin) onRequireWishlistLogin?.();
    else onWishlist?.(product);
  };

  return <Root {...rootProps}>
    <div>
      <div className={isPublic ? 'relative mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-orange-50/50 p-6' : 'relative w-full aspect-square bg-orange-50/50 rounded-2xl p-6 mb-4 flex items-center justify-center overflow-hidden'}>
        <button
          type={isPublic ? 'button' : undefined}
          onClick={handleWishlist}
          aria-label={requiresLogin ? `Masuk untuk menyukai ${product.product_name}` : `Sukai ${product.product_name}`}
          className="absolute right-3 top-3 z-10 rounded-full bg-white p-2 text-[#2C1E16]/45 shadow-sm transition-colors hover:text-red-500"
        >
          <Heart size={16} className={isWishlisted ? 'fill-red-500 text-red-500' : undefined} />
        </button>
        <div className={isPublic ? 'flex h-3/4 w-3/4 rotate-[-5deg] items-center justify-center overflow-visible bg-transparent transition-transform duration-300 ease-out group-hover:rotate-0' : 'w-3/4 h-3/4 bg-transparent flex items-center justify-center overflow-visible rotate-[-5deg] group-hover:rotate-0 transition-all duration-300'}>
          {isPublic && !product.image ? <ImageIcon size={48} className="text-[#D4813E]/40" /> : <img src={product.image ? `/storage/${product.image}` : '/images/placeholder-coffee.png'} alt={product.product_name} className={isPublic ? 'h-full w-full object-contain drop-shadow-xl' : 'w-full h-full object-contain filter drop-shadow-xl'} />}
        </div>
      </div>

      <div className="px-1">
        <div className={isPublic ? 'mb-2 flex items-center gap-1' : 'flex items-center gap-1 mb-2'}>
          <Star size={14} className="fill-[#D4813E] text-[#D4813E]" />
          <span className="text-xs font-bold text-[#2C1E16]/60">{Number(product.reviews_avg_rating || 0).toFixed(1)} / 5 ({product.reviews_count ?? 0})</span>
        </div>
        <h3 className={isPublic ? 'mb-1 truncate text-lg font-bold transition-colors group-hover:text-[#D4813E]' : 'font-bold text-lg mb-1 truncate group-hover:text-[#D4813E] transition-colors'}>{product.product_name}</h3>
        <p className={isPublic ? 'mb-2 min-h-[2rem] line-clamp-2 text-xs text-[#2C1E16]/60' : 'text-xs text-[#2C1E16]/60 mb-2 line-clamp-2 min-h-[2rem]'}>{isPublic ? product.description || '-' : product.description}</p>
        {product.category && <div className="mb-2 inline-flex rounded-full bg-[#FFE9D2] px-2 py-0.5 text-[10px] font-bold text-[#D4813E]">{product.category}</div>}
      </div>
    </div>

    <div className={isPublic ? 'mt-2 flex items-center justify-between border-t border-[#2C1E16]/5 px-1 pt-3' : 'px-1 flex items-center justify-between mt-2 pt-3 border-t border-[#2C1E16]/5'}>
      <div>
        <span className={isPublic ? 'text-xl font-bold' : 'font-bold text-xl'}>{price ? `${product.variants?.length > 1 ? 'Mulai ' : ''}${formatRupiah(price, { spaceAfterPrefix: true })}` : 'Belum tersedia'}</span>
        <div className={isPublic ? 'mt-0.5 text-xs text-[#2C1E16]/50' : 'text-xs text-[#2C1E16]/50 mt-0.5'}>Stok: {product.variant_stock_total || 0}</div>
      </div>
      {isPublic ? <button type="button" onClick={(event) => { event.stopPropagation(); onNavigate?.(); }} aria-label={`Lihat detail ${product.product_name}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4813E] text-white shadow-md shadow-[#D4813E]/25 transition-colors group-hover:bg-[#2C1E16]"><ShoppingBag size={16} /></button> : <span aria-label={`Lihat detail ${product.product_name}`} className="w-10 h-10 bg-[#D4813E] rounded-full flex items-center justify-center text-white group-hover:bg-[#2C1E16] transition-colors shadow-md shadow-[#D4813E]/25"><ShoppingBag size={16} /></span>}
    </div>
  </Root>;
}
