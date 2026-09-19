import { AnimatePresence, motion } from 'framer-motion';
import { Link } from '@inertiajs/react';
import { ChevronDown, LogOut, Settings, ShoppingBag } from 'lucide-react';

export default function MarketplaceAccountMenu({
  user,
  isOpen,
  onToggle,
  onClose,
  dropdownRef,
  profileHref,
  logoutHref,
}) {
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 bg-white border border-[#2C1E16]/15 hover:border-[#D4813E] py-1.5 px-3 rounded-full transition-all shadow-sm group"
      >
        <div className="w-7 h-7 rounded-full bg-[#D4813E] text-white flex items-center justify-center font-bold text-xs overflow-hidden">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>
        <span className="text-xs font-semibold text-[#2C1E16] max-w-[90px] truncate hidden sm:inline">
          {user.name}
        </span>
        <ChevronDown size={14} className={`text-[#2C1E16]/60 group-hover:text-[#D4813E] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-[#2C1E16]/10 py-2 z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-[#2C1E16]/10 bg-[#FDFBF7]">
              <p className="text-[10px] text-[#2C1E16]/50 uppercase tracking-wider font-bold">Masuk sebagai</p>
              <p className="text-xs font-bold text-[#2C1E16] truncate">{user.name}</p>
              <p className="text-[11px] text-[#2C1E16]/60 truncate">{user.email}</p>
            </div>

            <div className="py-1">
              {user.role === 'customer' && <Link href={route('orders.history')} className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-[#2C1E16]/80 hover:bg-[#D4813E]/10 hover:text-[#D4813E] transition-colors" onClick={onClose}><ShoppingBag size={15} /> Pesanan Saya</Link>}
              <Link
                href={profileHref}
                className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-[#2C1E16]/80 hover:bg-[#D4813E]/10 hover:text-[#D4813E] transition-colors"
                onClick={onClose}
              >
                <Settings size={15} /> Pengaturan Profil
              </Link>
            </div>

            <div className="border-t border-[#2C1E16]/10 pt-1">
              <Link
                href={logoutHref}
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
  );
}
