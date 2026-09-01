import React, { useState } from 'react';
import { useForm, Link, Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Coffee, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('register'), {
      onFinish: () => reset('password', 'password_confirmation'),
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C1E16] flex flex-col justify-between font-sans selection:bg-[#D4813E] selection:text-white">
      <Head title="Daftar Akun - Kopi Gajahmada" />

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-[#2C1E16]/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[650px]">
          
          {/* SISI KIRI: Visual & Branding (Hidden on Mobile) */}
          <div className="hidden lg:flex lg:col-span-5 bg-[#2C1E16] text-[#FDFBF7] p-10 flex-col justify-between relative overflow-hidden">
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4813E]/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4813E]/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

            {/* Header Brand */}
            <div className="relative z-10">
              <Link href="/" className="inline-flex items-center gap-3 group">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center overflow-hidden border border-white/20 group-hover:border-[#D4813E] transition-colors">
                  <img src="/images/logo.png" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <span className="font-bold text-lg text-[#FDFBF7] group-hover:text-[#D4813E] transition-colors">
                  Kopi Gajahmada
                </span>
              </Link>
            </div>

            {/* Middle Quotes & Value Proposition */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative z-10 my-auto py-8"
            >
              <div className="inline-flex items-center gap-2 bg-[#D4813E]/20 border border-[#D4813E]/40 px-3 py-1 rounded-full text-xs font-semibold text-[#D4813E] mb-6">
                <Sparkles size={14} /> Join The Coffee Circle ☕️
              </div>
              <h2 className="text-3xl font-bold leading-tight mb-4">
                Mulai Petualangan Rasa Kopi Nusantara.
              </h2>
              <p className="text-sm text-[#FDFBF7]/70 leading-relaxed mb-6">
                Dapatkan akses promo eksklusif, lacak pesanan sangrai kamu, dan nikmati diskon spesial pelanggan setia.
              </p>

              <ul className="space-y-3 text-xs text-[#FDFBF7]/80">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#D4813E]" /> 100% Specialty Grade Beans
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#D4813E]" /> Pengiriman Segar Pasca Resting
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#D4813E]" /> Point Rewards Setiap Transaksi
                </li>
              </ul>
            </motion.div>

            {/* Footer Left */}
            <div className="relative z-10 text-xs text-[#FDFBF7]/40">
              &copy; {new Date().getFullYear()} Kopi Gajahmada Roastery.
            </div>
          </div>

          {/* SISI KANAN: Form Pendaftaran */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-[#FDFBF7]/50">
            
            {/* Top Navigation */}
            <div className="flex items-center justify-between mb-8">
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#2C1E16]/60 hover:text-[#D4813E] transition-colors"
              >
                <ArrowLeft size={16} /> Kembali ke Beranda
              </Link>
              <div className="text-xs text-[#2C1E16]/60">
                Sudah punya akun?{' '}
                <Link href={route('login')} className="font-bold text-[#D4813E] hover:underline">
                  Masuk
                </Link>
              </div>
            </div>

            {/* Form Header */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#2C1E16] tracking-tight mb-2">
                Buat Akun Baru ✨
              </h1>
              <p className="text-xs sm:text-sm text-[#2C1E16]/60">
                Lengkapi data diri kamu di bawah ini untuk bergabung.
              </p>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-[#2C1E16] uppercase tracking-wider mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2C1E16]/40" />
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className={`w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border text-sm transition-all focus:outline-none ${
                      errors.name 
                        ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                        : 'border-[#2C1E16]/15 focus:border-[#D4813E] focus:ring-2 focus:ring-[#D4813E]/20'
                    }`}
                    required
                  />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Grid 2 Kolom: Email & Nomor HP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-[#2C1E16] uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2C1E16]/40" />
                    <input
                      type="email"
                      value={data.email}
                      onChange={(e) => setData('email', e.target.value)}
                      placeholder="budi@gmail.com"
                      className={`w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border text-sm transition-all focus:outline-none ${
                        errors.email 
                          ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                          : 'border-[#2C1E16]/15 focus:border-[#D4813E] focus:ring-2 focus:ring-[#D4813E]/20'
                      }`}
                      required
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Nomor Telepon */}
                <div>
                  <label className="block text-xs font-bold text-[#2C1E16] uppercase tracking-wider mb-1.5">
                    No. WhatsApp / HP
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2C1E16]/40" />
                    <input
                      type="text"
                      value={data.phone}
                      onChange={(e) => setData('phone', e.target.value)}
                      placeholder="08123456789"
                      className={`w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border text-sm transition-all focus:outline-none ${
                        errors.phone 
                          ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                          : 'border-[#2C1E16]/15 focus:border-[#D4813E] focus:ring-2 focus:ring-[#D4813E]/20'
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>

              {/* Grid 2 Kolom: Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kata Sandi */}
                <div>
                  <label className="block text-xs font-bold text-[#2C1E16] uppercase tracking-wider mb-1.5">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2C1E16]/40" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={data.password}
                      onChange={(e) => setData('password', e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-10 py-2.5 bg-white rounded-xl border text-sm transition-all focus:outline-none ${
                        errors.password 
                          ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                          : 'border-[#2C1E16]/15 focus:border-[#D4813E] focus:ring-2 focus:ring-[#D4813E]/20'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2C1E16]/40 hover:text-[#2C1E16]"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                {/* Konfirmasi Kata Sandi */}
                <div>
                  <label className="block text-xs font-bold text-[#2C1E16] uppercase tracking-wider mb-1.5">
                    Ulangi Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2C1E16]/40" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={data.password_confirmation}
                      onChange={(e) => setData('password_confirmation', e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-10 py-2.5 bg-white rounded-xl border text-sm transition-all focus:outline-none ${
                        errors.password_confirmation 
                          ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                          : 'border-[#2C1E16]/15 focus:border-[#D4813E] focus:ring-2 focus:ring-[#D4813E]/20'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2C1E16]/40 hover:text-[#2C1E16]"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password_confirmation && (
                    <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing}
                className="w-full mt-4 bg-[#D4813E] hover:bg-[#b86b30] text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-[#D4813E]/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? (
                  <span>Mendaftarkan Akun...</span>
                ) : (
                  <>
                    <span>Daftar Sekarang</span>
                    <Coffee size={18} />
                  </>
                )}
              </button>

            </form>

          </div>
        </div>
      </div>
    </div>
  );
}