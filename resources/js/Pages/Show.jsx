import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Star, Heart, 
  Minus, Plus, Store, CheckCircle2, ChevronLeft, ExternalLink 
} from 'lucide-react';
import { Link, router, usePage } from '@inertiajs/react';
import { hasWishlisted, toggleWishlist } from '../utils/wishlist';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function Show() {
  const { product, auth, cartItemCount = 0 } = usePage().props;

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] text-[#2C1E16] font-sans flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Produk Tidak Ditemukan ☕</h1>
        <p className="text-[#2C1E16]/60 mb-6 text-sm">Maaf, data produk dengan ID tersebut tidak ada.</p>
        <Link href="/" className="bg-[#D4813E] text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-[#D4813E]/30 hover:bg-[#b86b30] transition-colors">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const [qty, setQty] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(() => hasWishlisted(product.product_id));
  const [isAdding, setIsAdding] = useState(false);
  const [cartFeedback, setCartFeedback] = useState('');
  const [isWishlisting, setIsWishlisting] = useState(false);
  const [wishlistFeedback, setWishlistFeedback] = useState('');
  const [flyingProduct, setFlyingProduct] = useState(null);
  const productImageRef = useRef(null);
  const cartButtonRef = useRef(null);
  const wishlistButtonRef = useRef(null);
  const addToCartTimerRef = useRef(null);
  const wishlistTimerRef = useRef(null);

  useEffect(() => () => {
    window.clearTimeout(addToCartTimerRef.current);
    window.clearTimeout(wishlistTimerRef.current);
  }, []);

  const handleQtyChange = (type) => {
    if (type === 'min' && qty > 1) setQty(qty - 1);
    if (type === 'plus' && qty < (product.stock || 99)) setQty(qty + 1);
  };

  const animateProductTo = (targetRef) => {
    const productImageBounds = productImageRef.current?.getBoundingClientRect();
    const targetBounds = targetRef.current?.getBoundingClientRect();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!productImageBounds || !targetBounds || reduceMotion) return reduceMotion;

    const size = Math.min(productImageBounds.width, productImageBounds.height, 112);
    setFlyingProduct({
      x: productImageBounds.left + (productImageBounds.width - size) / 2,
      y: productImageBounds.top + (productImageBounds.height - size) / 2,
      size,
      targetX: targetBounds.left + targetBounds.width / 2 - size / 2,
      targetY: targetBounds.top + targetBounds.height / 2 - size / 2,
    });

    return false;
  };

  const handleAddToCart = () => {
    if (!auth?.user) {
      window.location.href = route('login');
      return;
    }

    if (isAdding || Number(product.stock) < 1) return;

    const reduceMotion = animateProductTo(cartButtonRef);

    setIsAdding(true);
    setCartFeedback(`${qty} produk sedang dimasukkan ke keranjang.`);

    addToCartTimerRef.current = window.setTimeout(() => {
      router.post(route('cart.store', product.product_id), { qty, stay_on_product: true }, {
        preserveScroll: true,
        onSuccess: () => {
          setIsAdding(false);
          setCartFeedback(`${qty} produk berhasil ditambahkan ke keranjang.`);
        },
        onError: () => {
          setFlyingProduct(null);
          setIsAdding(false);
          setCartFeedback('Produk belum dapat dimasukkan. Silakan coba lagi.');
        },
      });
    }, reduceMotion ? 0 : 650);
  };

  const handleWishlist = () => {
    if (!auth?.user) {
      window.location.href = route('login');
      return;
    }

    if (isWishlisting) return;

    const willBeWishlisted = !isWishlisted;
    const reduceMotion = willBeWishlisted ? animateProductTo(wishlistButtonRef) : true;
    toggleWishlist(product);
    setIsWishlisted(willBeWishlisted);
    setIsWishlisting(true);
    setWishlistFeedback(willBeWishlisted ? `${product.product_name} ditambahkan ke wishlist.` : `${product.product_name} dihapus dari wishlist.`);
    wishlistTimerRef.current = window.setTimeout(() => setIsWishlisting(false), reduceMotion ? 0 : 650);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C1E16] font-sans overflow-x-hidden pb-24">
      
      <nav className="fixed top-0 w-full bg-[#FDFBF7]/90 backdrop-blur-md z-50 border-b border-[#2C1E16]/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="group flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#2C1E16]/20 bg-white transition-colors hover:border-[#D4813E]">
            <img src="/images/logo.png" alt="Beranda Kopi Gajahmada" className="h-full w-full object-cover" />
          </Link>

          <div className="flex items-center gap-5">
            <Link href="/" className="text-sm font-semibold flex items-center gap-1 hover:text-[#D4813E] transition-colors">
              <ChevronLeft size={18} /> Kembali
            </Link>
            
            <Link ref={cartButtonRef} href={auth?.user ? route('cart.index') : route('login')} className="relative" aria-label="Buka keranjang">
              <motion.div
                animate={isAdding ? { scale: [1, 1.16, 1] } : { scale: 1 }}
                transition={{ duration: 0.35, delay: 0.48 }}
                className="w-10 h-10 rounded-full bg-white border border-[#2C1E16]/15 flex items-center justify-center shadow-sm"
              >
                <ShoppingBag size={20} />
              </motion.div>
              {cartItemCount > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#D4813E] px-1 text-[10px] font-bold text-white">{cartItemCount}</span>}
            </Link>
            <motion.button
              ref={wishlistButtonRef}
              type="button"
              onClick={handleWishlist}
              aria-label={isWishlisted ? 'Hapus dari wishlist' : 'Tambahkan ke wishlist'}
              animate={isWishlisting ? { scale: [1, 1.16, 1] } : { scale: 1 }}
              transition={{ duration: 0.35, delay: 0.48 }}
              className="grid h-10 w-10 place-items-center rounded-full border border-[#2C1E16]/15 bg-white shadow-sm transition-colors hover:text-red-500"
            >
              <Heart size={20} className={isWishlisted ? 'fill-red-500 text-red-500' : ''} />
            </motion.button>
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-4 max-w-7xl mx-auto px-6 text-sm text-[#2C1E16]/50">
        <Link href="/" className="hover:text-[#D4813E] transition-colors">Beranda</Link> 
        <span className="mx-2">/</span> 
        {/* SESUAIKAN JADI product_name */}
        <span className="text-[#2C1E16] font-medium">{product.product_name}</span>
      </div>

      <main className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
          
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2 aspect-square bg-orange-50/60 rounded-[2rem] flex items-center justify-center p-8 relative overflow-hidden border border-[#2C1E16]/10 shadow-xl"
          >
            {product.category && (
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm text-xs font-bold px-4 py-1.5 rounded-full text-[#D4813E] z-20 shadow-sm">
                {product.category}
              </div>
            )}

            <motion.img 
              ref={productImageRef}
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              src={product.image ? `/storage/${product.image}` : '/images/placeholder-coffee.png'} 
              alt={product.product_name} 
              className="w-4/5 h-4/5 object-contain filter drop-shadow-2xl"
            />
          </motion.div>

          <motion.div 
            className="w-full lg:w-1/2 flex flex-col"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <div className="flex items-center gap-1.5 mb-2 text-[#D4813E]">
                <Star size={16} fill="currentColor" />
                <span className="text-sm font-bold text-[#2C1E16]/70">
                  {Number(product.reviews_avg_rating || 0).toFixed(1)} <span className="font-normal text-[#2C1E16]/45">({product.reviews_count ?? 0} ulasan)</span>
                </span>
              </div>
              {/* SESUAIKAN JADI product_name */}
              <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-[#2C1E16]">{product.product_name}</h1>
              <div className="text-3xl font-extrabold text-[#D4813E]">
                Rp {Number(product.price || 0).toLocaleString('id-ID')}
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="mb-8">
              <div className="bg-white p-5 rounded-2xl border border-[#2C1E16]/10 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C1E16]/40 mb-2">Deskripsi Produk</h3>
                <p className="text-[#2C1E16]/75 leading-relaxed text-sm">
                  {product.description || "Tidak ada deskripsi khusus untuk produk ini."}
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-4 py-6 border-y border-[#2C1E16]/10 mb-8">
              <div>
                <div className="text-xs text-[#2C1E16]/50 mb-1 uppercase tracking-wider font-bold">Kategori</div>
                <div className="font-medium">{product.category || 'Umum'}</div>
              </div>
              <div>
                <div className="text-xs text-[#2C1E16]/50 mb-1 uppercase tracking-wider font-bold">Stok</div>
                <div className="font-medium flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600" /> {product.stock ?? 0} Pcs
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="mb-6 flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex h-14 w-full items-center justify-between rounded-2xl border border-[#2C1E16]/15 bg-white px-3 sm:w-auto sm:min-w-[190px]">
                  <span className="text-sm font-medium text-[#2C1E16]/55">Jumlah</span>
                  <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handleQtyChange('min')} aria-label="Kurangi jumlah" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#2C1E16] transition-colors hover:bg-[#FFF5EA] hover:text-[#D4813E]">
                    <Minus size={18} />
                  </button>
                  <AnimatePresence mode="popLayout"><motion.span key={qty} initial={{ opacity: 0, scale: 0.65, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.65 }} transition={{ type: 'spring', stiffness: 420, damping: 22 }} className="w-8 text-center text-lg font-bold">{qty}</motion.span></AnimatePresence>
                  <button type="button" onClick={() => handleQtyChange('plus')} aria-label="Tambah jumlah" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#2C1E16] transition-colors hover:bg-[#FFF5EA] hover:text-[#D4813E]">
                    <Plus size={18} />
                  </button>
                  </div>
                </div>

                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  disabled={isAdding || Number(product.stock) < 1}
                  aria-busy={isAdding}
                  className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#2C1E16] px-6 text-base font-bold text-[#FDFBF7] shadow-lg shadow-[#2C1E16]/10 transition-colors hover:bg-[#D4813E] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
                >
                  <ShoppingBag size={21} /> <span>{Number(product.stock) < 1 ? 'Stok Habis' : isAdding ? 'Menambahkan…' : 'Masukkan ke Keranjang'}</span>
                </motion.button>
              </div>

              {cartFeedback && <p aria-live="polite" className="-mt-1 text-center text-sm font-medium text-[#D4813E]">{cartFeedback}</p>}

              <Link href={auth?.user ? route('cart.index') : route('login')} className="grid h-14 w-full place-items-center rounded-2xl bg-[#D4813E] font-bold text-white shadow-lg shadow-[#D4813E]/30 transition-colors hover:bg-[#b86b30]">
                Lihat Keranjang
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={handleWishlist}
                disabled={isWishlisting}
                className="flex items-center gap-2 text-sm font-semibold text-[#2C1E16]/60 transition-colors hover:text-[#D4813E] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Heart size={20} className={isWishlisted ? 'fill-red-500 text-red-500' : ''} />
                {isWishlisted ? 'Disimpan di Wishlist' : 'Tambah ke Wishlist'}
              </motion.button>
              <p aria-live="polite" className="mt-1 min-h-5 text-sm font-medium text-[#D4813E]">{wishlistFeedback}</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-10 pt-8 border-t border-[#2C1E16]/10">
              <div className="text-sm font-bold mb-4 text-[#2C1E16]/60 uppercase tracking-wider">Tersedia juga di:</div>
              <div className="flex gap-3">
                <a href="#" className="w-12 h-12 rounded-full border border-[#2C1E16]/10 flex items-center justify-center hover:bg-[#42B549] hover:text-white transition-all">
                   <Store size={20} />
                </a>
                <a href="#" className="w-12 h-12 rounded-full border border-[#2C1E16]/10 flex items-center justify-center hover:bg-[#EE4D2D] hover:text-white transition-all">
                   <ShoppingBag size={20} />
                </a>
                <a href="#" className="w-12 h-12 rounded-full border border-[#2C1E16]/10 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all">
                   <ExternalLink size={20} />
                </a>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </main>

      <AnimatePresence>
        {flyingProduct && (
          <motion.img
            src={product.image ? `/storage/${product.image}` : '/images/placeholder-coffee.png'}
            alt=""
            aria-hidden="true"
            className="pointer-events-none fixed z-[60] rounded-2xl object-contain drop-shadow-2xl"
            style={{ left: flyingProduct.x, top: flyingProduct.y, width: flyingProduct.size, height: flyingProduct.size }}
            initial={{ opacity: 0, scale: 0.85, rotate: -8 }}
            animate={{
              opacity: [0, 1, 1, 0.2],
              scale: [0.85, 1, 0.65, 0.2],
              rotate: [-8, 6, 16, 25],
              x: [0, (flyingProduct.targetX - flyingProduct.x) * 0.45, (flyingProduct.targetX - flyingProduct.x) * 0.8, flyingProduct.targetX - flyingProduct.x],
              y: [0, -80, -36, flyingProduct.targetY - flyingProduct.y],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, times: [0, 0.2, 0.82, 1], ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => setFlyingProduct(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
