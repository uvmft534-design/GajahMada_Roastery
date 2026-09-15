import React from 'react';
import { ShoppingBag, ChevronLeft } from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';

export default function CollectionPageShell({ collectionName }) {
  const { auth, cartItemCount = 0 } = usePage().props;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FDFBF7] pb-24 font-sans text-[#2C1E16]">
      <nav className="fixed top-0 z-50 w-full border-b border-[#2C1E16]/10 bg-[#FDFBF7]/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="group flex items-center gap-3"><span className="text-xl font-bold tracking-tight transition-colors group-hover:text-[#D4813E]">Kopi Gajahmada</span></Link>
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-1 text-sm font-semibold transition-colors hover:text-[#D4813E]"><ChevronLeft size={18} /> Kembali</Link>
            <Link href={auth?.user ? route('cart.index') : route('login')} className="relative" aria-label="Keranjang">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2C1E16]/15 bg-white shadow-sm"><ShoppingBag size={20} /></span>
              {cartItemCount > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#D4813E] px-1 text-[10px] font-bold text-white">{cartItemCount}</span>}
            </Link>
          </div>
        </div>
      </nav>
      <main className="mx-auto min-h-screen max-w-7xl px-6 pt-28" aria-label={`Koleksi ${collectionName}`} />
    </div>
  );
}
