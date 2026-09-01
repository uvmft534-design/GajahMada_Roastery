import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShoppingBag, User, ArrowLeft, Plus, Minus, 
  Trash2, Building2, CheckCircle2, Star,
  Menu, X
} from 'lucide-react';
import { Link, usePage, useForm } from '@inertiajs/react';

const NAV_LINKS = ['Beranda', 'Shop', 'Tentang Kami', 'Blog'];

// Data keranjang diisi dari props Inertia
const INITIAL_CART = []; // empty placeholder, real data created from product props in component

// Animasi dasar
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function App() {
  const { product, qty: initialQty = 1, auth } = usePage().props;
  const productStock = Math.max(0, Number(product?.stock ?? 0));
  const checkoutQty = productStock > 0
    ? Math.min(Math.max(1, Number(initialQty) || 1), productStock)
    : 1;
  const { data, setData, post, processing, errors, clearErrors } = useForm({
    product_id: product?.product_id ?? '',
    qty: checkoutQty,
    brew_method: '',
    shipping_method: 'regular',
    payment_method: 'virtual_account',
    customer_name: auth?.user?.name ?? '',
    customer_phone: auth?.user?.phone ?? '',
    customer_address: auth?.user?.address ?? '',
    customer_note: '',
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => {
    if (!product) return [];
    return [{
      id: product.product_id,
      name: product.product_name,
      desc: `${product.category || 'Umum'} • ${product.stock ?? 0} Pcs`,
      price: Number(product.price || 0),
      qty: checkoutQty,
      stock: productStock,
      image: product.image ? `/storage/${product.image}` : '/images/placeholder-coffee.png',
      rating: typeof product.reviews_avg_rating === 'number' ? Number(product.reviews_avg_rating) : 0,
      color: 'bg-orange-50'
    }];
  });

  const cartQty = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const shippingFee = subtotal > 0 ? (data.shipping_method === 'instant' ? 30000 : 25000) : 0;
  const total = subtotal + shippingFee;

  // Format Rupiah
  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // Actions
  const handleQtyChange = (id, action) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextQty = action === 'plus'
          ? Math.min(item.qty + 1, item.stock)
          : Math.max(item.qty - 1, 1);

        setData('qty', nextQty);
        return { ...item, qty: nextQty };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateReceiverField = (field, value) => {
    setData(field, value);
    clearErrors(field);
  };

  const submitCheckout = (e) => {
    e.preventDefault();

    if (!auth?.user) {
      window.location.href = route('login');
      return;
    }

    post(route('orders.store'), {
      preserveScroll: true,
      onSuccess: () => {
        setIsCartOpen(false);
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C1E16] font-sans overflow-x-hidden selection:bg-[#D4813E] selection:text-white">
      
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
                <img src="/images/logo.png" alt="Logo Kopi Gajahmada" className="w-full h-full object-cover" />
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
            <button className="hover:text-[#D4813E] transition-transform hover:scale-110"><Search size={20} /></button>
            <Link href={auth && auth.user ? route('profile.edit') : route('login')} className="hover:text-[#D4813E] transition-transform hover:scale-110">
              <User size={20} />
            </Link>
            <div className="relative">
              <button
                onClick={() => setIsCartOpen((prev) => !prev)}
                className="hover:text-[#D4813E] transition-transform hover:scale-110 relative text-[#D4813E]"
              >
                <ShoppingBag size={20} />
                {cartQty > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#D4813E] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {cartQty}
                  </span>
                )}
              </button>

              {isCartOpen && cartItems.length > 0 && (
                <div className="absolute right-0 mt-3 w-72 bg-white border border-[#2C1E16]/10 rounded-3xl shadow-xl shadow-[#2C1E16]/10 z-50">
                  <div className="px-4 py-4 border-b border-[#2C1E16]/10 font-semibold text-sm">Isi Keranjang</div>
                  <div className="max-h-64 overflow-y-auto p-4 space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-2xl object-cover border border-[#2C1E16]/10" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold truncate">{item.name}</div>
                          <div className="text-[11px] text-[#2C1E16]/60">x{item.qty} • {formatIDR(item.price)}</div>
                        </div>
                        <button type="button" onClick={() => handleRemoveItem(item.id)} aria-label={`Hapus ${item.name} dari keranjang`} className="rounded-full p-2 text-[#2C1E16]/40 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button className="md:hidden ml-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </motion.nav>

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

      {/* HEADER PAGE */}
      <div className="pt-32 pb-8 max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-sm text-[#2C1E16]/50 mb-6 w-fit cursor-pointer hover:text-[#D4813E] transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Shop
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold tracking-tight"
        >
          Checkout
        </motion.h1>
      </div>

      <main className="max-w-7xl mx-auto px-6 pb-24">
        {cartItems.length > 0 && (
          <motion.section
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-[#2C1E16]/5 mb-10"
          >
            <div className="flex items-center gap-3 text-[#2C1E16]">
              <div className="w-12 h-12 rounded-3xl bg-[#FFE9D2] grid place-items-center text-[#D4813E]">
                <ShoppingBag size={22} />
              </div>
              <div>
                <div className="font-bold text-lg">Keranjang Kamu</div>
                <div className="text-sm text-[#2C1E16]/60">{cartQty} produk ditambahkan ke keranjang</div>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-4 border border-[#2C1E16]/10 rounded-3xl p-4">
                  <img src={item.image} alt={item.name} className="w-16 h-16 rounded-3xl object-cover border border-[#2C1E16]/10" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{item.name}</div>
                    <div className="text-[11px] text-[#2C1E16]/50">{item.desc}</div>
                    <div className="flex items-center gap-2 text-xs text-[#2C1E16]/60 mt-2">
                      <Star size={14} className="text-[#D4813E]" />
                      <span>{Number(item.rating || 0).toFixed(1)} / 5</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-sm text-[#D4813E]">x{item.qty}</div>
                    <button type="button" onClick={() => handleRemoveItem(item.id)} aria-label={`Hapus ${item.name} dari keranjang`} className="rounded-full p-2 text-[#2C1E16]/40 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* KOLOM KIRI: ITEMS & SHIPPING FORM */}
          <motion.div 
            className="w-full lg:w-[60%] flex flex-col gap-10"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* --- CART ITEMS --- */}
            <motion.section variants={fadeInUp} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-[#2C1E16]/5">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                Keranjang Belanja <span className="text-sm font-normal text-[#2C1E16]/40">({cartQty} Produk)</span>
              </h2>
              
              <div className="flex flex-col gap-6">
                <AnimatePresence mode="popLayout">
                  {cartItems.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="text-center py-10 text-[#2C1E16]/50"
                    >
                      Keranjang belanja kosong <br/>
                      <Link href={`${route('home')}#shop`} className="text-[#D4813E] font-medium hover:underline mt-2 inline-block">Silahkan pilih produk</Link>
                    </motion.div>
                  ) : (
                    cartItems.map((item) => (
                      <motion.div 
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, x: -50, height: 0, marginBottom: 0, overflow: "hidden" }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-[#2C1E16]/5 last:border-0 last:pb-0"
                      >
                        {/* Image */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl overflow-hidden border border-[#2C1E16]/10 bg-white">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 flex flex-col gap-1 w-full">
                          <h3 className="font-bold text-lg leading-tight pr-8">{item.name}</h3>
                          <p className="text-xs text-[#2C1E16]/50">{item.desc}</p>
                          <div className="flex items-center gap-2 text-xs text-[#2C1E16]/60">
                            <Star size={14} className="text-[#D4813E]" />
                            <span>{item.rating.toFixed(1)} / 5</span>
                          </div>
                        </div>
                        {/* Actions (Qty & Delete) */}
                        <div className="flex items-center gap-4 mt-2 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                          
                          <div className="flex items-center justify-between border border-[#2C1E16]/20 rounded-full h-10 px-3 w-28 bg-[#FDFBF7]">
                            <motion.button 
                              type="button"
                              whileTap={{ scale: 0.8 }} 
                              onClick={() => handleQtyChange(item.id, 'min')}
                              className={`text-[#2C1E16] hover:text-[#D4813E] ${item.qty <= 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                            >
                              <Minus size={14} />
                            </motion.button>
                            
                            <motion.span 
                              key={item.qty}
                              initial={{ y: -10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              className="font-bold text-sm w-6 text-center"
                            >
                              {item.qty}
                            </motion.span>
                            
                            <motion.button 
                              type="button"
                              whileTap={{ scale: 0.8 }} 
                              onClick={() => handleQtyChange(item.id, 'plus')}
                              disabled={item.qty >= item.stock}
                              className={`text-[#2C1E16] hover:text-[#D4813E] ${item.qty >= item.stock ? 'opacity-30 cursor-not-allowed' : ''}`}
                            >
                              <Plus size={14} />
                            </motion.button>
                          </div>

                          <motion.button 
                            type="button"
                            whileHover={{ scale: 1.1, color: '#ef4444' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-[#2C1E16]/30 hover:bg-red-50 p-2 rounded-full transition-colors"
                          >
                            <Trash2 size={18} />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
                {errors.qty && <p className="text-red-500 text-xs font-medium">{errors.qty}</p>}
              </div>
            </motion.section>

            {/* --- BREW METHOD --- */}
            {cartItems.length > 0 && (
              <motion.section variants={fadeInUp} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-[#2C1E16]/5">
                <h2 className="text-xl font-bold">Preferensi Seduhan</h2>
                <p className="mt-1 text-sm text-[#2C1E16]/60">Pilih metode seduh untuk pesanan ini.</p>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { value: 'espresso', title: 'ESPRESSO', description: 'Bold, rich, concentrated' },
                    { value: 'filter', title: 'FILTER', description: 'Clean, aromatic, balanced' },
                  ].map((method) => (
                    <label key={method.value} className={`cursor-pointer rounded-2xl border p-5 transition-colors ${data.brew_method === method.value ? 'border-[#D4813E] bg-[#FFE9D2]/50 ring-1 ring-[#D4813E]' : 'border-[#2C1E16]/10 bg-[#FDFBF7] hover:border-[#D4813E]/50'}`}>
                      <input type="radio" name="brew_method" value={method.value} checked={data.brew_method === method.value} onChange={(event) => setData('brew_method', event.target.value)} className="sr-only" />
                      <span className="block text-sm font-bold tracking-wide">{method.title}</span>
                      <span className="mt-1 block text-xs text-[#2C1E16]/60">{method.description}</span>
                    </label>
                  ))}
                </div>
                {errors.brew_method && <p className="mt-3 text-red-500 text-xs font-medium">{errors.brew_method}</p>}
              </motion.section>
            )}

            {/* --- SHIPPING INFO --- */}
            {cartItems.length > 0 && (
              <motion.section variants={fadeInUp} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-[#2C1E16]/5">
                <h2 className="text-xl font-bold mb-6">Informasi Pengiriman</h2>
                
                <form id="checkout-form" onSubmit={submitCheckout} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-[#2C1E16]/60 uppercase tracking-wider">Nama Lengkap</label>
                    <input type="text" value={data.customer_name} onChange={(e) => updateReceiverField('customer_name', e.target.value)} placeholder="Masukkan nama..." className="w-full bg-[#FDFBF7] border border-[#2C1E16]/10 rounded-xl px-4 py-3 outline-none focus:border-[#D4813E] focus:ring-1 focus:ring-[#D4813E] transition-all" />
                    {errors.customer_name && <span className="text-red-500 text-xs">{errors.customer_name}</span>}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-[#2C1E16]/60 uppercase tracking-wider">Nomor HP</label>
                    <input type="tel" value={data.customer_phone} onChange={(e) => updateReceiverField('customer_phone', e.target.value)} placeholder="08..." className="w-full bg-[#FDFBF7] border border-[#2C1E16]/10 rounded-xl px-4 py-3 outline-none focus:border-[#D4813E] focus:ring-1 focus:ring-[#D4813E] transition-all" />
                    {errors.customer_phone && <span className="text-red-500 text-xs">{errors.customer_phone}</span>}
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-xs font-bold text-[#2C1E16]/60 uppercase tracking-wider">Alamat Lengkap</label>
                    <textarea rows="3" maxLength="1000" value={data.customer_address} onChange={(e) => updateReceiverField('customer_address', e.target.value)} placeholder="Nama jalan, gedung, RT/RW..." className="w-full bg-[#FDFBF7] border border-[#2C1E16]/10 rounded-xl px-4 py-3 outline-none focus:border-[#D4813E] focus:ring-1 focus:ring-[#D4813E] transition-all resize-none"></textarea>
                    {errors.customer_address && <span className="text-red-500 text-xs">{errors.customer_address}</span>}
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-xs font-bold text-[#2C1E16]/60 uppercase tracking-wider">Catatan Pesanan <span className="normal-case font-normal">(opsional)</span></label>
                    <textarea rows="3" maxLength="500" value={data.customer_note} onChange={(e) => setData('customer_note', e.target.value)} placeholder="Contoh: grind jangan terlalu halus, packing double, atau catatan lainnya..." className="w-full bg-[#FDFBF7] border border-[#2C1E16]/10 rounded-xl px-4 py-3 outline-none focus:border-[#D4813E] focus:ring-1 focus:ring-[#D4813E] transition-all resize-none"></textarea>
                    <span className="text-right text-xs text-[#2C1E16]/50">{data.customer_note.length} / 500</span>
                    {errors.customer_note && <span className="text-red-500 text-xs">{errors.customer_note}</span>}
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-xs font-bold text-[#2C1E16]/60 uppercase tracking-wider">Metode Pengiriman</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { value: 'regular', title: 'REGULAR', price: 'Rp25.000', description: 'Pengiriman standar' },
                        { value: 'instant', title: 'INSTANT', price: 'Rp30.000', description: 'Pengiriman prioritas' },
                      ].map((shipping) => (
                        <label key={shipping.value} className={`cursor-pointer rounded-2xl border p-4 transition-colors ${data.shipping_method === shipping.value ? 'border-[#D4813E] bg-[#FFE9D2]/50 ring-1 ring-[#D4813E]' : 'border-[#2C1E16]/10 bg-[#FDFBF7] hover:border-[#D4813E]/50'}`}>
                          <input type="radio" name="shipping_method" value={shipping.value} checked={data.shipping_method === shipping.value} onChange={(event) => setData('shipping_method', event.target.value)} className="sr-only" />
                          <span className="block text-sm font-bold">{shipping.title}</span>
                          <span className="mt-1 block text-sm font-semibold text-[#D4813E]">{shipping.price}</span>
                          <span className="mt-1 block text-xs text-[#2C1E16]/60">{shipping.description}</span>
                        </label>
                      ))}
                    </div>
                    {errors.shipping_method && <span className="text-red-500 text-xs">{errors.shipping_method}</span>}
                  </div>
                </form>
              </motion.section>
            )}
          </motion.div>

          {/* KOLOM KANAN: ORDER SUMMARY */}
          {cartItems.length > 0 && (
            <motion.div 
              className="w-full lg:w-[40%]"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-[#2C1E16] text-[#FDFBF7] p-6 md:p-8 rounded-[2rem] shadow-xl sticky top-28">
                <h2 className="text-xl font-bold mb-6 text-white">Ringkasan Order</h2>
                
                {/* Rincian Harga */}
                <div className="flex flex-col gap-4 border-b border-white/10 pb-6 mb-6 text-sm">
                  <div className="flex justify-between items-center text-white/70">
                    <span>Subtotal Produk</span>
                    <span className="font-medium text-white">{formatIDR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-white/70">
                    <span>Biaya Pengiriman</span>
                    <span className="font-medium text-white">{formatIDR(shippingFee)}</span>
                  </div>
                  {/* Bagian Promo dihapus sesuai instruksi */}
                </div>

                <div className="flex justify-between items-end mb-8">
                  <span className="text-white/70">Total Tagihan</span>
                  <span className="text-3xl font-bold text-[#D4813E]">{formatIDR(total)}</span>
                </div>

                {/* Metode Pembayaran */}
                <div className="mb-8">
                  <span className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3 block">Metode Pembayaran</span>
                  <div className="w-full flex items-center justify-between p-4 rounded-xl border bg-[#D4813E]/10 border-[#D4813E] text-white">
                    <div className="flex items-center gap-3">
                      <Building2 size={20} className="text-[#D4813E]" />
                      <span className="font-medium text-sm">Virtual Account</span>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-[#D4813E] border border-[#D4813E] flex items-center justify-center">
                      <CheckCircle2 size={12} className="text-white" />
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <motion.button 
                  type="submit"
                  form="checkout-form"
                  whileHover={{ scale: 1.02, backgroundColor: '#b86b30' }}
                  whileTap={{ scale: 0.95 }}
                  disabled={processing || cartItems.length === 0}
                  className="w-full bg-[#D4813E] text-white rounded-full h-14 font-bold shadow-lg shadow-[#D4813E]/20 flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {processing ? 'Memproses...' : 'Bayar Sekarang'}
                  <ArrowLeft size={18} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                
                <p className="text-center text-xs text-white/40 mt-4">
                  Dengan memproses pesanan, kamu menyetujui Syarat & Ketentuan kami.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      
      {/* FOOTER */}
      <footer className="bg-white text-[#2C1E16] py-10 border-t border-[#2C1E16]/10 text-center text-sm">
        <p className="text-[#2C1E16]/50">&copy; {new Date().getFullYear()} Kopi Gajahmada Roastery</p>
      </footer>

    </div>
  );
}
