import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Star, Heart, 
  Minus, Plus, Store, CheckCircle2, ChevronLeft, ExternalLink 
} from 'lucide-react';
import { Link, router, usePage } from '@inertiajs/react';

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
  const { product, auth } = usePage().props;

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
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleQtyChange = (type) => {
    if (type === 'min' && qty > 1) setQty(qty - 1);
    if (type === 'plus' && qty < (product.stock || 99)) setQty(qty + 1);
  };

  const handleAddToCart = () => {
    if (!auth?.user) {
      window.location.href = route('login');
      return;
    }

    router.post(route('cart.store', product.product_id), { qty });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C1E16] font-sans overflow-x-hidden pb-24">
      
      <nav className="fixed top-0 w-full bg-[#FDFBF7]/90 backdrop-blur-md z-50 border-b border-[#2C1E16]/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="font-bold text-xl tracking-tight group-hover:text-[#D4813E] transition-colors">Kopi Gajahmada</span>
          </Link>

          <div className="flex items-center gap-5">
            <Link href="/" className="text-sm font-semibold flex items-center gap-1 hover:text-[#D4813E] transition-colors">
              <ChevronLeft size={18} /> Kembali
            </Link>
            
            <Link href={auth?.user ? route('cart.index') : route('login')} className="relative">
              <div className="w-10 h-10 rounded-full bg-white border border-[#2C1E16]/15 flex items-center justify-center shadow-sm">
                <ShoppingBag size={20} />
              </div>
            </Link>
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

            <motion.div variants={fadeInUp} className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center justify-between border border-[#2C1E16]/20 rounded-full h-14 px-4 sm:w-32 bg-white">
                  <button onClick={() => handleQtyChange('min')} className="hover:text-[#D4813E]">
                    <Minus size={18} />
                  </button>
                  <span className="font-bold text-lg w-8 text-center">{qty}</span>
                  <button onClick={() => handleQtyChange('plus')} className="hover:text-[#D4813E]">
                    <Plus size={18} />
                  </button>
                </div>

                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddToCart}
                  className="flex-1 bg-[#2C1E16] text-[#FDFBF7] rounded-full h-14 flex items-center justify-center gap-2 font-bold hover:bg-[#D4813E] transition-colors shadow-lg shadow-[#2C1E16]/10"
                >
                  <ShoppingBag size={20} /> Masukkan Keranjang
                </motion.button>
              </div>

              <Link href={auth?.user ? route('cart.index') : route('login')} className="w-full bg-[#D4813E] text-white rounded-full h-14 font-bold shadow-lg shadow-[#D4813E]/30 hover:bg-[#b86b30] transition-colors grid place-items-center">
                Lihat Keranjang
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="flex items-center gap-2 text-sm font-semibold text-[#2C1E16]/60 hover:text-[#D4813E] transition-colors"
              >
                <Heart size={20} className={isWishlisted ? 'fill-red-500 text-red-500' : ''} />
                {isWishlisted ? 'Disimpan di Wishlist' : 'Tambah ke Wishlist'}
              </motion.button>
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

            {/* SESUAIKAN JADI product_id */}
            <motion.div variants={fadeInUp} className="mt-8 text-xs text-[#2C1E16]/40 font-mono">
              PRODUCT ID: #{product.product_id} — Kopi Gajahmada Verified Item
            </motion.div>

          </motion.div>
        </div>
      </main>
    </div>
  );
}
