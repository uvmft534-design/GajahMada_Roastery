import { Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, CreditCard, LayoutDashboard, LogOut, Menu, UserRoundCheck, Users, X } from 'lucide-react';

const items = [
  { key: 'overview', label: 'Ringkasan', routeName: 'super-admin.dashboard', icon: LayoutDashboard },
  { key: 'users', label: 'Pengguna', routeName: 'super-admin.users.index', icon: Users },
  { key: 'payments', label: 'Pembayaran', routeName: 'super-admin.payment-settings.index', icon: CreditCard },
  { key: 'reports', label: 'Laporan', routeName: 'super-admin.reports.index', icon: BarChart3 },
];

export default function SuperAdminNav({ active }) {
  const { auth, superAdminNotifications = {} } = usePage().props;
  const paymentCount = Number(superAdminNotifications.paymentRequests || 0);
  const reportCount = Number(superAdminNotifications.reportsToReview || 0);
  const totalReview = paymentCount + reportCount;
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const close = (event) => { if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const badgeFor = (key) => key === 'payments' ? paymentCount : key === 'reports' ? reportCount : 0;
  const NavItem = ({ item, mobile = false }) => {
    const Icon = item.icon;
    const badge = badgeFor(item.key);
    const selected = active === item.key;
    return <Link href={route(item.routeName)} onClick={() => mobile && setMobileOpen(false)} aria-label={badge ? `${item.label}, ${badge} perlu ditinjau` : item.label} className={mobile ? `relative flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${selected ? 'bg-violet-700 text-white' : 'bg-white text-[#2C1E16]/70 ring-1 ring-[#2C1E16]/10'}` : `inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm transition ${selected ? 'border-violet-300 text-white' : 'border-transparent text-white/65 hover:text-white'}`}><span className="relative"><Icon size={17} />{badge > 0 && !mobile && <span className="absolute -right-2 -top-2 h-2 w-2 rounded-full bg-amber-300 ring-2 ring-violet-950" />}</span>{item.label}{badge > 0 && <span className={mobile ? 'ml-auto min-w-4 rounded-full bg-violet-700 px-1 text-center text-[9px] leading-4 text-white' : 'min-w-5 rounded-full bg-amber-400 px-1.5 py-0.5 text-center text-[10px] font-bold text-violet-950'}>{badge > 99 ? '99+' : badge}</span>}</Link>;
  };

  return <>
    <header className="hidden border-b border-white/10 bg-gradient-to-r from-violet-950 via-violet-900 to-indigo-950 px-8 py-4 text-white md:block xl:px-12"><div className="mx-auto flex max-w-[1600px] items-center justify-between gap-8"><Link href={route('super-admin.dashboard')} className="flex shrink-0 items-center gap-3 border-r border-white/15 pr-8"><span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-violet-200/35 bg-white"><img src="/images/logo.png" alt="Logo Kopi Gajahmada" className="h-full w-full object-cover" /></span><span><b className="block text-sm">Kopi Gajahmada</b><small className="text-[10px] font-bold uppercase tracking-[.18em] text-violet-200">Super Admin Console</small></span></Link><nav className="flex min-w-0 items-center gap-1" aria-label="Navigasi Super Admin">{items.map((item) => <NavItem key={item.key} item={item} />)}</nav><div className="relative shrink-0" ref={profileRef}><button type="button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} aria-haspopup="menu" aria-label="Buka menu akun Super Admin" className={`relative grid h-10 w-10 place-items-center overflow-hidden rounded-full border transition ${profileOpen ? 'border-amber-300 bg-white text-violet-800 ring-4 ring-violet-300/25' : 'border-white/25 text-violet-100 hover:border-amber-300 hover:text-white'}`}>{auth?.user?.avatar ? <img src={auth.user.avatar} alt={auth.user.name} className="h-full w-full object-cover" /> : <UserRoundCheck size={19} />}<span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-violet-950 bg-emerald-400" /></button><AnimatePresence>{profileOpen && <motion.div role="menu" initial={{ opacity: 0, y: 10, scale: .95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .95 }} transition={{ duration: .18 }} className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-violet-100 bg-white py-2 text-[#2C1E16] shadow-2xl"><div className="border-b border-violet-100 bg-violet-50 px-4 py-3"><p className="truncate text-sm font-bold">{auth?.user?.name || 'Super Admin'}</p><p className="mt-1 truncate text-xs text-[#2C1E16]/55">{auth?.user?.email}</p><span className="mt-2 inline-block rounded-full bg-violet-700 px-2 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-white">Super Admin</span></div><Link href={route('profile.edit')} role="menuitem" className="mt-1 flex items-center gap-3 px-4 py-2 text-xs font-medium text-[#2C1E16]/75 hover:bg-violet-50 hover:text-violet-700"><Users size={15} /> Profil Saya</Link><Link href={route('logout')} method="post" as="button" role="menuitem" className="mt-1 flex w-full items-center gap-3 px-4 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"><LogOut size={15} /> Keluar</Link></motion.div>}</AnimatePresence></div></div></header>
    <div className="sticky top-0 z-40 border-b border-violet-100 bg-white/95 backdrop-blur md:hidden"><div className="flex h-16 items-center justify-between px-5"><Link href={route('super-admin.dashboard')} className="flex items-center gap-2.5"><span className="h-8 w-8 overflow-hidden rounded-full border border-violet-200"><img src="/images/logo.png" alt="Logo Kopi Gajahmada" className="h-full w-full object-cover" /></span><span><b className="block text-sm">Kopi Gajahmada</b><small className="block text-[9px] font-bold uppercase tracking-[.14em] text-violet-600">Super Admin</small></span></Link><button type="button" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-label={totalReview > 0 ? `Buka navigasi Super Admin, ${totalReview} notifikasi perlu ditinjau` : 'Buka navigasi Super Admin'} className="relative rounded-full p-2 text-violet-800 hover:bg-violet-50">{mobileOpen ? <X size={22} /> : <Menu size={22} />}{totalReview > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-amber-400 px-1 text-[9px] font-bold leading-none text-violet-950 ring-2 ring-white">{totalReview > 99 ? '99+' : totalReview}</span>}</button></div><AnimatePresence>{mobileOpen && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-violet-100 bg-violet-50"><nav className="grid grid-cols-2 gap-2 px-5 py-4">{items.map((item) => <NavItem key={item.key} item={item} mobile />)}</nav><div className="mx-5 flex items-center justify-between border-t border-violet-200 py-4"><span className="min-w-0 text-xs text-[#2C1E16]/60"><b className="block truncate text-[#2C1E16]">{auth?.user?.name || 'Super Admin'}</b>Super Admin</span><Link href={route('logout')} method="post" as="button" className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-bold text-red-600 hover:bg-red-50"><LogOut size={15} /> Keluar</Link></div></motion.div>}</AnimatePresence></div>
  </>;
}
