import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, User, ArrowRight, Heart, CheckCircle2, ChevronRight, Menu, X, Image as ImageIcon } from 'lucide-react';
import { Link, router, usePage } from '@inertiajs/react';
import { toggleWishlist } from '../utils/wishlist';
import { formatRupiah } from '../utils/currency';
import ProductCard from '@/Components/Marketplace/ProductCard';
import MarketplaceAccountMenu from '@/Components/Marketplace/MarketplaceAccountMenu';
import MarketplaceFooter from '@/Components/Marketplace/MarketplaceFooter';
import StoreBenefits from '@/Components/Marketplace/StoreBenefits';

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

// Animasi dari Kiri
const slideInLeft = {
  hidden: { opacity: 0, x: -36 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

// Animasi dari Kanan
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

const productCardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } },
};

const brewCardTransition = { duration: 0.58, ease: [0.22, 1, 0.36, 1] };

export default function App({ products = [], categories = [], selectedCategory = null }) {
  const { auth, cartItemCount = 0, wishlist: accountWishlist = [] } = usePage().props;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(selectedCategory);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [wishlist, setWishlist] = useState(accountWishlist);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  
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

  const scrollConfig = { once: false, amount: 0.2, margin: "0px 0px -100px 0px" };
  useEffect(() => setWishlist(accountWishlist), [accountWishlist]);

  const categoryKey = (category) => String(category || '').trim().toLocaleLowerCase('id-ID');
  const categoryFilters = ['Semua', ...categories.map((category) => String(category).trim()).filter(Boolean)];
  const filteredProducts = products.filter((product) =>
    [product.product_name, product.category, product.description]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const searchResults = products.filter((product) => [product.product_name, product.category, product.description].filter(Boolean).some((value) => String(value).toLowerCase().includes(searchQuery.toLowerCase()))).slice(0, 4);
  const browseCategory = (category) => { const selected = category === 'Semua' ? null : category; setSearchQuery(''); setActiveCategory(selected); setIsSearchOpen(false); router.get(route('home'), selected ? { category: selected } : {}, { preserveScroll: true }); };

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
            {NAV_LINKS.map((link) => {
              const href = link === 'Beranda' ? route('home') : `${route('home')}#${link.toLowerCase()}`;
              return (
                <Link key={link} href={href} className="hover:text-[#D4813E] transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-[#D4813E] hover:after:w-full after:transition-all after:duration-300">
                  {link}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-5">
            <button onClick={() => setIsSearchOpen((open) => !open)} aria-label="Cari produk" aria-expanded={isSearchOpen} className="hover:text-[#D4813E] transition-transform hover:scale-110"><Search size={20} /></button>
            <button onClick={() => { auth?.user ? setIsWishlistOpen((open) => !open) : window.location.href = route('login'); }} aria-label={auth?.user ? 'Wishlist' : 'Masuk untuk membuka wishlist'} aria-expanded={auth?.user ? isWishlistOpen : undefined} className="relative hover:text-[#D4813E] transition-transform hover:scale-110"><Heart size={20} className={auth?.user && wishlist.length ? 'fill-[#D4813E]/20' : ''} />{auth?.user && wishlist.length > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#D4813E] px-1 text-[10px] font-bold text-white">{wishlist.length}</span>}</button>
            
            <Link
              href={route('login')}
              aria-label="Keranjang belanja"
              className="relative hover:text-[#D4813E] transition-transform hover:scale-110"
            >
              <ShoppingBag size={20} />
              {cartItemCount > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#D4813E] px-1 text-[10px] font-bold text-white">{cartItemCount}</span>}
            </Link>

            {auth && auth.user ? (
              <MarketplaceAccountMenu
                user={auth.user}
                isOpen={isDropdownOpen}
                onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
                onClose={() => setIsDropdownOpen(false)}
                dropdownRef={dropdownRef}
                profileHref={route('profile.edit')}
                logoutHref={route('logout')}
              />
            ) : (
              <Link href={route('login')} className="hover:text-[#D4813E] transition-transform hover:scale-110">
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
                {NAV_LINKS.map((link) => {
                  const href = link === 'Beranda' ? route('home') : `${route('home')}#${link.toLowerCase()}`;
                  return (
                    <Link key={link} href={href} className="text-lg font-medium">
                      {link}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <AnimatePresence>{isWishlistOpen && <motion.aside initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: .22 }} className="fixed right-4 top-24 z-50 w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-[#2C1E16]/10 bg-white p-4 shadow-2xl"><div className="flex items-center justify-between border-b border-[#2C1E16]/10 pb-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#D4813E]">Pilihan Anda</p><h2 className="font-bold">Wishlist</h2></div><button onClick={() => setIsWishlistOpen(false)} className="rounded-full p-2 hover:bg-orange-50"><X size={17}/></button></div>{wishlist.length === 0 ? <p className="py-8 text-center text-sm text-[#2C1E16]/60">Belum ada produk yang disukai.</p> : <div className="mt-3 max-h-[60vh] space-y-2">{wishlist.map((product) => <div key={product.product_id} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-[#FFE9D2]/40"><Link href={route('products.show', product.product_id)} onClick={() => setIsWishlistOpen(false)} className="flex min-w-0 flex-1 items-center gap-3"><img src={product.image ? `/storage/${product.image}` : '/images/placeholder-coffee.png'} alt="" className="h-12 w-12 rounded-xl object-cover"/><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{product.product_name}</strong><small className="text-[#D4813E]">{product.variant_price_from ? formatRupiah(product.variant_price_from, { spaceAfterPrefix: true }) : 'Lihat detail'}</small></span></Link><button onClick={() => toggleWishlist(product, true, { onSuccess: () => setWishlist((current) => current.filter((item) => item.product_id !== product.product_id)) })} aria-label={`Hapus ${product.product_name} dari wishlist`} className="rounded-full p-2 text-red-500 hover:bg-white"><Heart size={16} className="fill-red-500"/></button></div>)}</div>}</motion.aside>}</AnimatePresence>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="fixed top-24 left-4 right-4 md:left-auto md:right-8 md:w-[28rem] z-50 rounded-2xl border border-[#2C1E16]/10 bg-white p-3 shadow-xl">
            <div className="flex items-center gap-2">
              <Search size={18} className="text-[#D4813E]" />
              <input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }); setIsSearchOpen(false); } }} placeholder="Cari kopi, kategori, atau rasa..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
              {searchQuery && <button onClick={() => setSearchQuery('')} aria-label="Hapus pencarian" className="rounded-full p-1 hover:bg-orange-50"><X size={16} /></button>}
            </div>
            <div className="mt-4 border-t border-[#2C1E16]/10 pt-4"><p className="text-xs font-bold uppercase tracking-wider text-[#D4813E]">Discovery</p><h2 className="mt-1 font-bold">Belum tahu pilih kopi apa?</h2><p className="mt-1 text-xs text-[#2C1E16]/55">Pilih kategori yang tersimpan pada sistem.</p><div className="mt-3 grid grid-cols-2 gap-2">{categoryFilters.slice(1).map((category) => <button key={category} onClick={() => browseCategory(category)} className="rounded-2xl border border-[#2C1E16]/10 bg-[#FFF5EA] p-3 text-left transition hover:border-[#D4813E] hover:bg-[#FFE9D2]"><span className="block truncate text-sm font-bold">{category}</span><span className="mt-1 block text-[11px] text-[#2C1E16]/55">{products.filter((product) => categoryKey(product.category) === categoryKey(category)).length} produk tersedia</span></button>)}</div></div>{searchQuery && <div className="mt-4 border-t border-[#2C1E16]/10 pt-4"><p className="text-xs font-bold uppercase tracking-wider text-[#2C1E16]/50">Produk yang cocok</p>{searchResults.length ? <div className="mt-2 space-y-1">{searchResults.map((product) => <Link key={product.product_id} href={route('products.show', product.product_id)} onClick={() => setIsSearchOpen(false)} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-[#FFF5EA]"><img src={product.image ? `/storage/${product.image}` : '/images/placeholder-coffee.png'} alt="" className="h-10 w-10 rounded-xl object-cover"/><span className="min-w-0"><strong className="block truncate text-sm">{product.product_name}</strong><small className="text-[#2C1E16]/50">{product.category || 'Kopi pilihan'}</small></span></Link>)}</div> : <p className="mt-2 text-xs text-[#2C1E16]/55">Produk tidak ditemukan.</p>}</div>}
          </motion.div>
        )}
      </AnimatePresence>

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
              Est. 2020
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
              <Link href={route('login')} className="bg-[#D4813E] text-white px-8 py-4 rounded-full font-semibold flex items-center gap-2 hover:bg-[#b86b30] transition-all hover:gap-4 hover:shadow-lg hover:shadow-[#D4813E]/30">
                Pesan Sekarang <ArrowRight size={20} />
              </Link>
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
          </motion.div>
        </section>

        {/* SECTION 2: MENGAPA MEMILIH KAMI */}
        <section id="tentang kami" className="bg-[#2C1E16] text-[#FDFBF7] py-24 px-6 overflow-hidden relative">
          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
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

        {/* PART 10.1 — SECTION 3: DAFTAR PRODUK (Murni dari Database) */}
        <section id="shop" className="py-24 px-6 max-w-7xl mx-auto overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 gap-6 text-center md:text-left">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={scrollConfig}
              variants={slideInLeft}
            >
              <h2 className="inline-block text-4xl md:text-5xl font-bold mb-3 transition-colors duration-300 hover:text-[#D4813E]">Products</h2>
              <p className="text-[#2C1E16]/60">Temukan biji kopi pilihan langsung dari database kami.</p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={scrollConfig}
              variants={slideInRight}
              className="flex gap-2"
            >
              <button type="button" aria-label="Produk sebelumnya" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2C1E16]/20 transition-colors hover:bg-[#2C1E16] hover:text-white">
                <ChevronRight className="rotate-180" size={20} />
              </button>
              <button type="button" aria-label="Produk berikutnya" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4813E] text-white shadow-md shadow-[#D4813E]/30 transition-colors hover:bg-[#b86b30]">
                <ChevronRight size={20} />
              </button>
            </motion.div>
          </div>

          <div className="mb-8 flex flex-wrap items-center justify-center gap-2 md:justify-start" aria-label="Filter kategori produk">
            {categoryFilters.map((category) => <button key={category} onClick={() => browseCategory(category)} className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${(!activeCategory && category === 'Semua') || categoryKey(activeCategory) === categoryKey(category) ? 'bg-[#2C1E16] text-white shadow-md' : 'border border-[#2C1E16]/15 bg-white hover:border-[#D4813E] hover:text-[#D4813E]'}`}>{category}</button>)}
          </div>

          {filteredProducts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white rounded-3xl border border-[#2C1E16]/10 shadow-sm"
            >
              <ImageIcon size={48} className="mx-auto text-[#D4813E]/40 mb-4 animate-bounce" />
              <h3 className="font-bold text-xl text-[#2C1E16] mb-2">{searchQuery ? 'Produk tidak ditemukan' : 'Belum Ada Produk'}</h3>
              <p className="text-sm text-[#2C1E16]/60">{searchQuery ? 'Coba gunakan kata kunci lain.' : 'Belum ada produk yang tersedia'}</p>
            </motion.div>
          ) : (
            <motion.div 
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerContainer}
            >
              {filteredProducts.map((product) => <ProductCard key={product.product_id} product={product} profile="public" isWishlisted={wishlist.some((item) => item.product_id === product.product_id)} onNavigate={() => router.visit(route('products.show', product.product_id))} onWishlist={auth?.user ? (selectedProduct) => { const selected = wishlist.some((item) => item.product_id === selectedProduct.product_id); toggleWishlist(selectedProduct, selected, { onSuccess: () => setWishlist((current) => selected ? current.filter((item) => item.product_id !== selectedProduct.product_id) : [selectedProduct, ...current]) }); } : undefined} onRequireWishlistLogin={() => { window.location.href = route('login'); }} motionProps={{ variants: productCardVariants, whileHover: { y: -4 }, transition: { type: 'tween', duration: 0.18, ease: 'easeOut' } }} />)}
            </motion.div>
          )}
        </section>

        {/* SECTION 4: KATEGORI KOPI */}
        <section className="py-24 px-6 max-w-7xl mx-auto overflow-hidden">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={scrollConfig}
            variants={slideInLeft}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Pilih Gaya Seduhmu</h2>
            <p className="text-[#2C1E16]/60">Koleksi kami dirancang khusus untuk memenuhi preferensi brewing Anda.</p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={scrollConfig}
            variants={slideInRight}
            className="flex flex-col md:flex-row h-[500px] gap-4 w-full"
          >
            <motion.div
              onMouseEnter={() => setHoveredCategory('espresso')}
              onMouseLeave={() => setHoveredCategory(null)}
              animate={{ 
                flex: hoveredCategory === 'espresso' ? 2 : hoveredCategory === 'filter' ? 0.8 : 1 
              }}
              transition={brewCardTransition}
              style={{ willChange: 'flex' }}
              className="relative min-h-[200px] flex-1 cursor-pointer overflow-hidden rounded-3xl bg-gray-300 group"
            >
              <div className="absolute inset-0 bg-[#2C1E16]/40 z-10 group-hover:bg-[#2C1E16]/20 transition-colors duration-500"></div>
              <img 
                src="/images/category-espresso.jpg" 
                alt="Kategori Espresso" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute bottom-0 left-0 z-20 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 sm:p-8">
                <h3 className="mb-0 text-2xl font-bold text-white transition-transform duration-300 group-hover:-translate-y-2 sm:text-3xl">Espresso Roast</h3>
                <p className="mt-3 max-w-md translate-y-0 text-sm leading-6 text-white/80 opacity-100 transition-all duration-500 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">Profil sangrai medium-dark yang menghasilkan body tebal, manis karamel, dan crema yang sempurna untuk paduan susu.</p>
                <Link
                  href={route('collections.espresso')}
                  className="mt-5 inline-flex rounded-full bg-[#D4813E] px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#2C1E16]"
                >
                  Lihat Koleksi
                </Link>
              </div>
            </motion.div>

            <motion.div
              onMouseEnter={() => setHoveredCategory('filter')}
              onMouseLeave={() => setHoveredCategory(null)}
              animate={{ 
                flex: hoveredCategory === 'filter' ? 2 : hoveredCategory === 'espresso' ? 0.8 : 1 
              }}
              transition={brewCardTransition}
              style={{ willChange: 'flex' }}
              className="relative min-h-[200px] flex-1 cursor-pointer overflow-hidden rounded-3xl bg-gray-200 group"
            >
              <div className="absolute inset-0 bg-[#D4813E]/40 z-10 group-hover:bg-[#D4813E]/20 transition-colors duration-500"></div>
              <img 
                src="/images/category-filter.jpg" 
                alt="Kategori Filter" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute bottom-0 left-0 z-20 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 sm:p-8">
                <h3 className="mb-0 text-2xl font-bold text-white transition-transform duration-300 group-hover:-translate-y-2 sm:text-3xl">Filter Roast</h3>
                <p className="mt-3 max-w-md translate-y-0 text-sm leading-6 text-white/80 opacity-100 transition-all duration-500 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">Profil sangrai light-medium untuk menonjolkan acidity yang cerah, aroma floral, dan sensasi fruity yang kompleks.</p>
                <Link
                  href={route('collections.filter')}
                  className="mt-5 inline-flex rounded-full bg-[#D4813E] px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#2C1E16]"
                >
                  Lihat Koleksi
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* SECTION 5: KEBIJAKAN & CATATAN TOKO */}
        <StoreBenefits scrollConfig={scrollConfig} staggerContainer={staggerContainer} slideInLeft={slideInLeft} />

      </main>

      {/* FOOTER */}
      <MarketplaceFooter scrollConfig={scrollConfig} slideInRight={slideInRight} />
    </div>
  );
}
