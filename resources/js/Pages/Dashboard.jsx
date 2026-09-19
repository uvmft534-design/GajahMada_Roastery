import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { Search, ShoppingBag, User, ArrowRight, Heart, CheckCircle2, ChevronRight, Menu, X, LogOut, Settings, ChevronDown, Truck, ShieldCheck, Headphones, BadgeCheck } from 'lucide-react';
import { Link, usePage, router } from '@inertiajs/react';
import { getWishlist, toggleWishlist } from '../utils/wishlist';
import { formatRupiah } from '../utils/currency';
import ProductCard from '@/Components/Marketplace/ProductCard';

const NAV_LINKS = ['Beranda', 'Shop', 'Tentang Kami', 'Blog'];

const REASONS = [
  {
    title: "Kualitas Biji Pilihan",
    desc: "Kami hanya menyortir dan me-roast biji kopi grade terbaik dari berbagai penjuru nusantara untuk menjamin cita rasa."
  },
  {
    title: "Roasting Berpengalaman",
    desc: "Setiap batch dipanggang oleh roaster bersertifikat kami untuk menonjolkan karakter unik dari masing-masing origin."
  },
  {
    title: "Selalu Segar",
    desc: "Kopi dikemas segera setelah proses resting selesai, memastikan Anda menerima kopi dalam kondisi paling optimal."
  }
];

const POLICIES = [
  { title: "Pengiriman Cepat", desc: "Pesanan sebelum jam 15.00 dikirim di hari yang sama.", icon: Truck },
  { title: "Garansi Kualitas", desc: "Tidak puas dengan rasa? Kami ganti 100%.", icon: BadgeCheck },
  { title: "Dukungan 24/7", desc: "Tim CS kami siap membantu kebutuhan kopi Anda.", icon: Headphones },
  { title: "Pembayaran Aman", desc: "Transaksi dijamin aman dengan enkripsi terkini.", icon: ShieldCheck }
];

const slideInLeft = {
  hidden: { opacity: 0, x: -36 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

const slideInRight = {
  hidden: { opacity: 0, x: 36 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 }
  }
};

const staggerContainerSlow = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.08 }
  }
};

const brewCardTransition = { duration: 0.58, ease: [0.22, 1, 0.36, 1] };

export default function Dashboard() {
  const { auth, products = [], categories = [], selectedCategory = null, cartItemCount = 0 } = usePage().props;
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(selectedCategory);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  useEffect(() => {
    const refresh = () => setWishlist(getWishlist());
    refresh();
    window.addEventListener('wishlist:changed', refresh);
    return () => window.removeEventListener('wishlist:changed', refresh);
  }, []);

  const scrollConfig = { once: false, amount: 0.2, margin: "0px 0px -100px 0px" };
  const categoryKey = (category) => String(category || '').trim().toLocaleLowerCase('id-ID');
  const categoryFilters = ['Semua', ...categories.map((category) => String(category).trim()).filter(Boolean)];
  const filteredProducts = products.filter((product) => [product.product_name, product.category, product.description].filter(Boolean).some((value) => String(value).toLowerCase().includes(searchQuery.toLowerCase())));
  const searchResults = products.filter((product) => [product.product_name, product.category, product.description].filter(Boolean).some((value) => value.toLowerCase().includes(searchQuery.toLowerCase()))).slice(0, 4);
  const chooseCategory = (category) => { const selected = category === 'Semua' ? null : category; setActiveCategory(selected); setSearchQuery(''); setIsSearchOpen(false); router.get(route('dashboard'), selected ? { category: selected } : {}, { preserveScroll: true }); };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C1E16] font-sans overflow-x-hidden">
      
      {/* NAVBAR */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 w-full bg-[#FDFBF7]/90 backdrop-blur-md z-50 border-b border-[#2C1E16]/10"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border border-[#2C1E16]/20 group-hover:border-[#D4813E] transition-colors">
                <img src="/images/logo.png" alt="Logo Kopi Gajahmada" className="w-full h-full object-cover text-[8px] text-center" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block group-hover:text-[#D4813E] transition-colors">Kopi Gajahmada</span>
          </div>

          <div className="hidden md:flex items-center gap-8 font-medium text-sm tracking-wide">
            {NAV_LINKS.map((link) => (
              <a key={link} href={`#${link.toLowerCase()}`} className="hover:text-[#D4813E] transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-[#D4813E] hover:after:w-full after:transition-all after:duration-300">
                {link}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-5">
            <button onClick={() => setIsSearchOpen((open) => !open)} aria-label="Cari produk" aria-expanded={isSearchOpen} className="hover:text-[#D4813E] transition-transform hover:scale-110"><Search size={20} /></button>
            <button onClick={() => setIsWishlistOpen((open) => !open)} aria-label="Wishlist" aria-expanded={isWishlistOpen} className="relative hover:text-[#D4813E] transition-transform hover:scale-110"><Heart size={20} className={wishlist.length ? 'fill-[#D4813E]/20' : ''} />{wishlist.length > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#D4813E] px-1 text-[10px] font-bold text-white">{wishlist.length}</span>}</button>
            
            <Link
              href={auth && auth.user ? route('cart.index') : route('login')}
              aria-label="Keranjang belanja"
              className="relative hover:text-[#D4813E] transition-transform hover:scale-110"
            >
              <ShoppingBag size={20} />
              {cartItemCount > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#D4813E] px-1 text-[10px] font-bold text-white">{cartItemCount}</span>}
            </Link>

            {auth && auth.user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 bg-white border border-[#2C1E16]/15 hover:border-[#D4813E] py-1.5 px-3 rounded-full transition-all shadow-sm group"
                >
                  <div className="w-7 h-7 rounded-full bg-[#D4813E] text-white flex items-center justify-center font-bold text-xs overflow-hidden">
                    {auth.user.avatar ? (
                      <img src={auth.user.avatar} alt={auth.user.name} className="w-full h-full object-cover" />
                    ) : (
                      auth.user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-xs font-semibold text-[#2C1E16] max-w-[90px] truncate hidden sm:inline">
                    {auth.user.name}
                  </span>
                  <ChevronDown size={14} className={`text-[#2C1E16]/60 group-hover:text-[#D4813E] transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-[#2C1E16]/10 py-2 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-[#2C1E16]/10 bg-[#FDFBF7]">
                        <p className="text-[10px] text-[#2C1E16]/50 uppercase tracking-wider font-bold">Masuk sebagai</p>
                        <p className="text-xs font-bold text-[#2C1E16] truncate">{auth.user.name}</p>
                        <p className="text-[11px] text-[#2C1E16]/60 truncate">{auth.user.email}</p>
                      </div>

                      <div className="py-1">
                        {auth.user.role === 'customer' && <Link href={route('orders.history')} className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-[#2C1E16]/80 hover:bg-[#D4813E]/10 hover:text-[#D4813E] transition-colors" onClick={() => setIsDropdownOpen(false)}><ShoppingBag size={15} /> Pesanan Saya</Link>}
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-[#2C1E16]/80 hover:bg-[#D4813E]/10 hover:text-[#D4813E] transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <Settings size={15} /> Pengaturan Profil
                        </Link>
                      </div>

                      <div className="border-t border-[#2C1E16]/10 pt-1">
                        <Link
                          href="/logout"
                          method="post"
                          as="button"
                          className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <LogOut size={15} /> Keluar Akun
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login" className="hover:text-[#D4813E] transition-transform hover:scale-110">
                <User size={20} />
              </Link>
            )}
            
            <button className="md:hidden ml-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#FDFBF7] border-b border-[#2C1E16]/10 overflow-hidden"
            >
              <div className="px-6 py-4 flex flex-col gap-4">
                {NAV_LINKS.map((link) => (
                  <a key={link} href={`#${link.toLowerCase()}`} className="text-lg font-medium">
                    {link}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <AnimatePresence>{isWishlistOpen && <motion.aside initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.22 }} className="fixed right-4 top-24 z-50 w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-[#2C1E16]/10 bg-white p-4 shadow-2xl"><div className="flex items-center justify-between border-b border-[#2C1E16]/10 pb-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#D4813E]">Pilihan Anda</p><h2 className="font-bold">Wishlist</h2></div><button onClick={() => setIsWishlistOpen(false)} className="rounded-full p-2 hover:bg-orange-50"><X size={17} /></button></div>{wishlist.length === 0 ? <p className="py-8 text-center text-sm text-[#2C1E16]/60">Belum ada produk yang disukai.</p> : <div className="mt-3 max-h-[60vh] space-y-2 overflow-auto">{wishlist.map((product) => <div key={product.product_id} className="group flex items-center gap-3 rounded-2xl p-2 hover:bg-[#FFE9D2]/40"><Link href={route('products.show', product.product_id)} onClick={() => setIsWishlistOpen(false)} className="flex min-w-0 flex-1 items-center gap-3"><img src={product.image ? `/storage/${product.image}` : '/images/placeholder-coffee.png'} alt="" className="h-12 w-12 rounded-xl object-cover" /><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{product.product_name}</strong><small className="text-[#D4813E]">{product.variant_price_from ? formatRupiah(product.variant_price_from, { spaceAfterPrefix: true }) : 'Lihat detail'}</small></span></Link><button onClick={() => { toggleWishlist(product); setWishlist(getWishlist()); }} aria-label={`Hapus ${product.product_name} dari wishlist`} className="rounded-full p-2 text-[#2C1E16]/40 transition hover:bg-white hover:text-red-500"><Heart size={16} className="fill-red-500 text-red-500" /></button></div>)}</div>}</motion.aside>}</AnimatePresence>

      <AnimatePresence>{isSearchOpen && <motion.div initial={{ opacity: 0, y: -10, scale: .98 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="fixed top-24 left-4 right-4 z-50 rounded-3xl border border-[#2C1E16]/10 bg-white p-4 shadow-2xl md:left-auto md:right-8 md:w-[30rem]"><div className="flex items-center gap-2"><Search size={18} className="text-[#D4813E]" /><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari nama kopi, rasa, atau kategori..." className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none" />{searchQuery && <button onClick={() => setSearchQuery('')} aria-label="Hapus pencarian" className="rounded-full p-1 hover:bg-orange-50"><X size={16} /></button>}</div><div className="mt-4 border-t border-[#2C1E16]/10 pt-4"><p className="text-xs font-bold uppercase tracking-wider text-[#D4813E]">Discovery dari kategori sistem</p><h2 className="mt-1 font-bold">Belum tahu pilih kopi apa?</h2><div className="mt-3 grid grid-cols-2 gap-2">{categoryFilters.slice(1).map((category) => <button key={category} onClick={() => chooseCategory(category)} className="rounded-2xl border border-[#2C1E16]/10 bg-[#FFF5EA] p-3 text-left transition hover:border-[#D4813E] hover:bg-[#FFE9D2]"><span className="block truncate text-sm font-bold">{category}</span><span className="mt-1 block text-[11px] text-[#2C1E16]/55">{products.filter((product) => categoryKey(product.category) === categoryKey(category)).length} produk tersedia</span></button>)}</div></div></motion.div>}</AnimatePresence>

      <main className="pt-20">
        
        {/* SECTION 1: HERO */}
        <section id="beranda" className="relative max-w-7xl mx-auto px-6 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-12 lg:gap-8 min-h-[90vh] overflow-hidden">
          
          <motion.div 
            className="w-full lg:w-1/2 z-10"
            initial="hidden"
            whileInView="visible"
            viewport={scrollConfig}
            variants={staggerContainer}
          >
            <motion.div variants={slideInLeft} className="inline-block bg-[#2C1E16] text-[#FDFBF7] px-4 py-1.5 rounded-full text-xs font-bold tracking-widest mb-6 uppercase">
              Est. 2024
            </motion.div>
            <motion.h1 
              variants={slideInLeft}
              className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold leading-[1.1] tracking-tight mb-6"
            >
              Your Favorite <br/>
              <span className="text-[#D4813E] relative inline-block">
                Coffee
                <span className="absolute bottom-2 left-0 w-full h-3 bg-[#D4813E]/20 -z-10 -rotate-2"></span>
              </span> Solutions.
            </motion.h1>
            <motion.p 
              variants={slideInLeft}
              className="text-lg md:text-xl text-[#2C1E16]/70 max-w-lg mb-10 leading-relaxed"
            >
              Menjual berbagai macam roasted beans nusantara, dari filter ringan yang fruity hingga espresso blend yang bold dan pekat.
            </motion.p>
            
            <motion.div variants={slideInLeft} className="flex flex-wrap items-center gap-4">
              <a href="#shop" className="bg-[#D4813E] text-white px-8 py-4 rounded-full font-semibold flex items-center gap-2 hover:bg-[#b86b30] transition-all hover:gap-4 hover:shadow-lg hover:shadow-[#D4813E]/30">
                Pesan Sekarang <ArrowRight size={20} />
              </a>
              <a href="#shop" className="bg-transparent border border-[#2C1E16] text-[#2C1E16] px-8 py-4 rounded-full font-semibold hover:bg-[#2C1E16] hover:text-[#FDFBF7] transition-colors">
                Lihat Produk
              </a>
            </motion.div>
          </motion.div>

          <motion.div 
            className="w-full lg:w-1/2 relative h-[500px] md:h-[600px] flex items-center justify-center"
            initial="hidden"
            whileInView="visible"
            viewport={scrollConfig}
            variants={slideInRight}
          >
            <div className="absolute w-[60%] h-[70%] bg-gray-200 rounded-[2rem] shadow-2xl z-20 flex flex-col items-center justify-center border-4 border-white overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-500 hover:scale-105">
               <img src="/images/hero-filter.png" alt="Filter Beans" className="w-full h-full object-cover text-xs text-center flex items-center justify-center" />
            </div>
            
            <div className="absolute w-[45%] h-[55%] bg-gray-300 rounded-[2rem] shadow-xl z-10 -bottom-4 -left-4 flex items-center justify-center border-4 border-white overflow-hidden transform -rotate-6 hover:-rotate-12 transition-transform duration-500">
              <img src="/images/hero-espresso.png" alt="Espresso Blend" className="w-full h-full object-cover text-xs text-center flex items-center justify-center" />
            </div>
            
            <div className="absolute top-10 right-10 w-24 h-24 bg-orange-100 rounded-full blur-2xl opacity-60 animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-32 h-32 bg-[#2C1E16] rounded-full blur-3xl opacity-10"></div>
          </motion.div>
        </section>

        {/* SECTION 2: MENGAPA MEMILIH KAMI? */}
        <section id="tentang kami" className="bg-[#2C1E16] text-[#FDFBF7] py-24 px-6 overflow-hidden relative">
          <div className="absolute -left-20 top-20 w-64 h-64 border border-[#FDFBF7]/5 rounded-full"></div>
          <div className="absolute -right-20 bottom-10 w-96 h-96 border border-[#FDFBF7]/5 rounded-full"></div>

          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={scrollConfig}
              variants={slideInRight}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Mengapa Memilih Kami?</h2>
              <p className="text-[#FDFBF7]/70 max-w-2xl mx-auto">Dedikasi kami pada setiap tahap proses memastikan Anda mendapatkan pengalaman ngopi terbaik.</p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-12"
              initial="hidden"
              whileInView="visible"
              viewport={scrollConfig}
              variants={staggerContainerSlow}
            >
              {REASONS.map((reason, idx) => (
                <motion.div key={idx} variants={slideInLeft} className="flex flex-col items-center text-center group">
                  <div className="w-16 h-16 bg-[#D4813E] rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-[#D4813E]/20 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{reason.title}</h3>
                  <p className="text-[#FDFBF7]/70 leading-relaxed text-sm md:text-base">
                    {reason.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>

        </section>

        {/* PART 10.1 — SECTION 3: DAFTAR PRODUK */}
        <section id="shop" className="py-24 px-6 max-w-7xl mx-auto overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 gap-6 text-center md:text-left">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={scrollConfig}
              variants={slideInLeft}
            >
              <h2 className="inline-block text-4xl md:text-5xl font-bold mb-3 transition-colors duration-300 hover:text-[#D4813E]">Products</h2>
              <p className="text-[#2C1E16]/60">Temukan biji kopi favorit untuk rutinitas harian Anda.</p>
            </motion.div>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={scrollConfig}
              variants={slideInRight}
              className="flex gap-2"
            >
               <button className="w-10 h-10 rounded-full border border-[#2C1E16]/20 flex items-center justify-center hover:bg-[#2C1E16] hover:text-white transition-colors">
                  <ChevronRight className="rotate-180" size={20} />
               </button>
               <button className="w-10 h-10 rounded-full bg-[#D4813E] text-white flex items-center justify-center hover:bg-[#b86b30] transition-colors shadow-md shadow-[#D4813E]/30">
                  <ChevronRight size={20} />
               </button>
            </motion.div>
          </div>

          <div className="mb-8 flex flex-wrap items-center justify-center gap-2 md:justify-start" aria-label="Filter kategori produk">
            {categoryFilters.map((category) => <button key={category} onClick={() => chooseCategory(category)} className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${(!activeCategory && category === 'Semua') || categoryKey(activeCategory) === categoryKey(category) ? 'bg-[#2C1E16] text-white shadow-md' : 'border border-[#2C1E16]/15 bg-white hover:border-[#D4813E] hover:text-[#D4813E]'}`}>{category}</button>)}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#2C1E16]/10">
              <p className="text-[#2C1E16]/60 text-base font-medium">{searchQuery ? 'Produk tidak ditemukan. Coba kata kunci lain.' : 'Belum ada produk yang tersedia'}</p>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              {filteredProducts.map((product) => <ProductCard key={product.product_id} product={product} profile="customer" href={route('products.show', product.product_id)} isWishlisted={wishlist.some((item) => item.product_id === product.product_id)} onWishlist={(selectedProduct) => { toggleWishlist(selectedProduct); setWishlist(getWishlist()); }} />)}
            </motion.div>
          )}
        </section>

        {/* SECTION 4: GAYA SEDUH */}
        <section className="py-24 px-6 max-w-7xl mx-auto overflow-hidden">
          <motion.div initial="hidden" whileInView="visible" viewport={scrollConfig} variants={slideInLeft} className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Pilih Gaya Seduhmu</h2>
            <p className="text-[#2C1E16]/60">Koleksi kami dirancang khusus untuk memenuhi preferensi brewing Anda.</p>
          </motion.div>
          <MotionConfig transition={brewCardTransition}><motion.div initial="hidden" whileInView="visible" viewport={scrollConfig} variants={slideInRight} className="flex flex-col md:flex-row h-[500px] gap-4 w-full">
            <motion.div onMouseEnter={() => setHoveredCategory('espresso')} onMouseLeave={() => setHoveredCategory(null)} animate={{ flex: hoveredCategory === 'espresso' ? 2 : hoveredCategory === 'filter' ? 0.8 : 1 }} className="relative rounded-3xl overflow-hidden cursor-pointer group flex-1 transition-all duration-500 ease-out min-h-[200px] bg-gray-300">
              <div className="absolute inset-0 bg-[#2C1E16]/40 z-10 group-hover:bg-[#2C1E16]/20 transition-colors duration-500"></div><img src="/images/category-espresso.jpg" alt="Kategori Espresso" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/><div className="absolute bottom-0 left-0 z-20 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 sm:p-8"><h3 className="mb-0 text-2xl font-bold text-white transition-transform duration-300 group-hover:-translate-y-2 sm:text-3xl">Espresso Roast</h3><p className="mt-3 max-w-md translate-y-0 text-sm leading-6 text-white/80 opacity-100 transition-all duration-500 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">Profil sangrai medium-dark yang menghasilkan body tebal, manis karamel, dan crema yang sempurna untuk paduan susu.</p><Link href={route('collections.espresso')} className="mt-5 inline-flex rounded-full bg-[#D4813E] px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#2C1E16]">Lihat Koleksi</Link></div>
            </motion.div>
            <motion.div onMouseEnter={() => setHoveredCategory('filter')} onMouseLeave={() => setHoveredCategory(null)} animate={{ flex: hoveredCategory === 'filter' ? 2 : hoveredCategory === 'espresso' ? 0.8 : 1 }} className="relative rounded-3xl overflow-hidden cursor-pointer group flex-1 transition-all duration-500 ease-out min-h-[200px] bg-gray-200">
              <div className="absolute inset-0 bg-[#D4813E]/40 z-10 group-hover:bg-[#D4813E]/20 transition-colors duration-500"></div><img src="/images/category-filter.jpg" alt="Kategori Filter" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/><div className="absolute bottom-0 left-0 z-20 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 sm:p-8"><h3 className="mb-0 text-2xl font-bold text-white transition-transform duration-300 group-hover:-translate-y-2 sm:text-3xl">Filter Roast</h3><p className="mt-3 max-w-md translate-y-0 text-sm leading-6 text-white/80 opacity-100 transition-all duration-500 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">Profil sangrai light-medium untuk menonjolkan acidity yang cerah, aroma floral, dan sensasi fruity yang kompleks.</p><Link href={route('collections.filter')} className="mt-5 inline-flex rounded-full bg-[#D4813E] px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#2C1E16]">Lihat Koleksi</Link></div>
            </motion.div>
          </motion.div></MotionConfig>
        </section>

        {/* SECTION 5: KEBIJAKAN & CATATAN TOKO */}
        <section className="border-y border-[#2C1E16]/10 py-16 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={scrollConfig}
              variants={staggerContainer}
            >
              {POLICIES.map((policy, idx) => {
                const Icon = policy.icon;
                return <motion.div key={idx} variants={slideInLeft} whileHover={{ y: -5 }} className="group rounded-3xl border border-[#2C1E16]/10 bg-[#FDFBF7] p-6 shadow-sm transition-shadow hover:shadow-lg">
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-[#D4813E] text-white shadow-md shadow-[#D4813E]/25 transition-transform group-hover:scale-110"><Icon size={21} /></div>
                  <h4 className="font-bold text-base">{policy.title}</h4>
                  <p className="mt-2 text-sm text-[#2C1E16]/60 leading-relaxed">{policy.desc}</p>
                </motion.div>;
              })}
            </motion.div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer id="blog" className="bg-[#2C1E16] text-[#FDFBF7] py-16 overflow-hidden">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={scrollConfig}
          variants={slideInRight}
          className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12"
        >
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center overflow-hidden">
                 <img src="/images/logo.png" alt="Logo Kopi Gajahmada" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-[#D4813E]">Kopi Gajahmada</span>
            </div>
            <p className="text-[#FDFBF7]/60 max-w-sm mb-6 text-sm leading-relaxed">
              Menyajikan biji kopi nusantara kualitas terbaik. Di-roast dengan presisi untuk memenuhi standar tertinggi kedai kopi dan penyeduh rumahan.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-[#D4813E] uppercase tracking-wider text-sm">Tautan Cepat</h4>
            <ul className="flex flex-col gap-3 text-[#FDFBF7]/60 text-sm">
              <li><a href="#" className="hover:text-white hover:translate-x-2 transition-transform inline-block">Semua Produk</a></li>
              <li><a href="#" className="hover:text-white hover:translate-x-2 transition-transform inline-block">Tentang Roastery</a></li>
              <li><a href="#" className="hover:text-white hover:translate-x-2 transition-transform inline-block">Artikel Kopi</a></li>
              <li><a href="#" className="hover:text-white hover:translate-x-2 transition-transform inline-block">Kontak Kami</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-[#D4813E] uppercase tracking-wider text-sm">Kontak</h4>
            <ul className="flex flex-col gap-3 text-[#FDFBF7]/60 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-1">📍</span> Jl. Kopi Nusantara No. 88, Jakarta
              </li>
              <li className="flex items-center gap-2">
                <span>✉️</span> hello@kopigajahmada.com
              </li>
              <li className="flex items-center gap-2">
                <span>📞</span> +62 812 3456 7890
              </li>
            </ul>
          </div>
        </motion.div>
        
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/10 text-center text-sm text-[#FDFBF7]/40 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} Kopi Gajahmada Roastery. All rights reserved.</p>
          <div className="flex gap-4">
             <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
             <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
