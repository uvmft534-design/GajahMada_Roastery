import { router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

export default function AdminBackButton({ href, label = 'Kembali ke Dashboard', className = '' }) {
  return <button type="button" onClick={() => router.get(href)} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#2C1E16]/15 bg-white px-4 py-2 text-sm font-bold text-[#2C1E16] transition hover:border-[#D4813E] hover:bg-[#FFF5EA] hover:text-[#D4813E] ${className}`}><ArrowLeft size={16} />{label}</button>;
}
