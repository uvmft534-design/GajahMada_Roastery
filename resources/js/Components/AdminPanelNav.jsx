import { Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Boxes, CreditCard, FileText, LayoutDashboard, LogOut, Menu, MessageSquareWarning, Package, UserRoundCheck, X } from 'lucide-react';

const items = [
  { key: 'overview', label: 'Ringkasan', routeName: 'admin.dashboard', icon: LayoutDashboard },
  { key: 'orders', label: 'Pesanan', routeName: 'admin.orders.index', icon: Package },
  { key: 'products', label: 'Produk', routeName: 'admin.products.index', icon: Boxes },
  { key: 'complaints', label: 'Komplain', routeName: 'admin.complaints.index', icon: MessageSquareWarning },
  { key: 'payments', label: 'Pembayaran', routeName: 'admin.payment-settings.index', icon: CreditCard },
  { key: 'reports', label: 'Laporan', routeName: 'admin.reports.index', icon: FileText },
];

export default function AdminPanelNav({ active }) {
  const { auth, adminNotifications = {} } = usePage().props;
  const orderNotificationCount = Number(adminNotifications.orderNotificationCount || adminNotifications.newOrders || 0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const closeProfileMenu = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) setIsProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', closeProfileMenu);
    return () => document.removeEventListener('mousedown', closeProfileMenu);
  }, []);

  return <>
    <header className="hidden border-b border-white/10 bg-[#241811] px-8 py-4 text-[#FDFBF7] md:block xl:px-12">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-8">
        <Link href={route('admin.dashboard')} className="flex shrink-0 items-center gap-3 border-r border-white/15 pr-8"><span className="h-10 w-10 overflow-hidden rounded-full border border-white/20 bg-white"><img src="/images/logo.png" alt="Logo Kopi Gajahmada" className="h-full w-full object-cover" /></span><span><b className="block text-sm">Kopi Gajahmada</b><small className="text-[10px] font-medium uppercase tracking-[.18em] text-white/50">Ruang Operasional</small></span></Link>
        <nav className="flex min-w-0 items-center gap-1" aria-label="Navigasi admin">{items.map((item) => { const Icon = item.icon; const selected = active === item.key; const badge = item.key === 'orders' ? orderNotificationCount : 0; return <Link key={item.key} href={route(item.routeName)} aria-label={item.key === 'orders' && badge > 0 ? `${item.label}, ${badge} perlu ditangani` : item.label} className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm transition ${selected ? 'border-[#E6A16D] text-white' : 'border-transparent text-white/65 hover:text-white'}`}><span className="relative"><Icon size={17}/>{badge > 0 && <span className="absolute -right-2 -top-2 h-2 w-2 rounded-full bg-[#E6A16D] ring-2 ring-[#241811]" aria-hidden="true" />}</span>{item.label}{badge > 0 && <span className="min-w-5 rounded-full bg-[#D4813E] px-1.5 py-0.5 text-center text-[10px] font-bold text-white">{badge > 99 ? '99+' : badge}</span>}</Link>; })}</nav>
        <div className="relative shrink-0" ref={profileMenuRef}><button type="button" onClick={() => setIsProfileMenuOpen((open) => !open)} aria-expanded={isProfileMenuOpen} aria-haspopup="menu" aria-label="Buka menu profil" className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition ${isProfileMenuOpen ? 'border-[#E6A16D] bg-white text-[#B86632] ring-4 ring-[#D4813E]/15' : 'border-white/20 text-white/75 hover:border-[#E6A16D] hover:text-white'}`}><UserRoundCheck size={20}/><span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#241811] bg-emerald-400" /></button><AnimatePresence>{isProfileMenuOpen && <motion.div role="menu" initial={{ opacity: 0, y: 10, scale: .95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .95 }} transition={{ duration: .2, ease: 'easeOut' }} className="absolute right-0 mt-2 z-50 w-64 overflow-hidden rounded-2xl border border-[#2C1E16]/10 bg-white py-2 text-[#2C1E16] shadow-2xl"><div className="border-b border-[#2C1E16]/10 bg-[#FDFBF7] px-4 py-3"><p className="truncate text-sm font-bold">{auth?.user?.name || 'Admin'}</p><p className="mt-1 truncate text-xs text-[#2C1E16]/55">{auth?.user?.email || 'Akun administrator'}</p><span className="mt-2 inline-block text-[10px] font-bold uppercase tracking-[.12em] text-[#9A4F1D]">{auth?.user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span></div><Link href={route('logout')} method="post" as="button" role="menuitem" className="mt-1 flex w-full items-center gap-3 px-4 py-2 text-left text-xs font-medium text-red-600 transition hover:bg-red-50"><LogOut size={15}/> Keluar</Link></motion.div>}</AnimatePresence></div>
      </div>
    </header>
    <div className="sticky top-0 z-40 border-b border-[#2C1E16]/10 bg-[#FDFBF7]/95 backdrop-blur md:hidden">
      <div className="flex h-16 items-center justify-between px-5"><Link href={route('admin.dashboard')} className="flex items-center gap-2.5"><span className="h-8 w-8 overflow-hidden rounded-full border border-[#2C1E16]/15 bg-white"><img src="/images/logo.png" alt="Logo Kopi Gajahmada" className="h-full w-full object-cover"/></span><span><b className="block text-sm">Kopi Gajahmada</b><small className="block text-[9px] font-medium uppercase tracking-[.14em] text-[#2C1E16]/50">Admin</small></span></Link><button type="button" onClick={() => setIsMobileNavOpen((open) => !open)} aria-expanded={isMobileNavOpen} aria-controls="admin-mobile-navigation" aria-label="Buka navigasi admin" className="rounded-full p-2 text-[#2C1E16] transition hover:bg-[#FFE9D2]">{isMobileNavOpen ? <X size={22}/> : <Menu size={22}/>}</button></div>
      <AnimatePresence>{isMobileNavOpen && <motion.div id="admin-mobile-navigation" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: .22, ease: 'easeOut' }} className="overflow-hidden border-t border-[#2C1E16]/10 bg-[#FDFBF7]"><nav className="grid grid-cols-2 gap-2 px-5 py-4" aria-label="Navigasi admin">{items.map((item) => { const Icon = item.icon; const selected = active === item.key; const badge = item.key === 'orders' ? orderNotificationCount : 0; return <Link key={item.key} href={route(item.routeName)} onClick={() => setIsMobileNavOpen(false)} className={`relative flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${selected ? 'bg-[#2C1E16] text-white' : 'bg-white text-[#2C1E16]/70 ring-1 ring-[#2C1E16]/10'}`}><Icon size={17}/>{item.label}{badge > 0 && <span className="ml-auto min-w-4 rounded-full bg-[#D4813E] px-1 text-center text-[9px] leading-4 text-white">{badge > 9 ? '9+' : badge}</span>}</Link>; })}</nav><div className="mx-5 flex items-center justify-between border-t border-[#2C1E16]/10 py-4"><span className="text-xs text-[#2C1E16]/60"><b className="block text-[#2C1E16]">{auth?.user?.name || 'Admin'}</b>{auth?.user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span><Link href={route('logout')} method="post" as="button" className="flex items-center gap-2 text-xs font-bold text-red-600"><LogOut size={15}/> Keluar</Link></div></motion.div>}</AnimatePresence>
    </div>
  </>;
}
