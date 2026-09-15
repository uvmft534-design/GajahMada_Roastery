import React, { useState } from 'react';
import { useForm, Link, Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Coffee, 
} from 'lucide-react';

export default function Login({ status, canResetPassword }) {
  const [showPassword, setShowPassword] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('login'), {
      onFinish: () => reset('password'),
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C1E16] flex flex-col justify-between font-sans selection:bg-[#D4813E] selection:text-white">
      <Head title="Masuk - Kopi Gajahmada" />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-[#2C1E16]/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* SISI KIRI: Branding Visual */}
          <div className="hidden lg:flex lg:col-span-5 bg-[#2C1E16] text-[#FDFBF7] p-10 flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4813E]/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4813E]/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

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

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative z-10 my-auto py-8"
            >
              <h2 className="text-3xl font-bold leading-tight mb-4">
                Siap Menikmati Cangkir Kopi Hari Ini?
              </h2>
              <p className="text-sm text-[#FDFBF7]/70 leading-relaxed">
                Masuk ke akun kamu untuk melihat riwayat pesanan, promo khusus, dan rekomendasi biji kopi pilihan roaster.
              </p>
            </motion.div>

            <div className="relative z-10 text-xs text-[#FDFBF7]/40">
              &copy; {new Date().getFullYear()} Kopi Gajahmada Roastery.
            </div>
          </div>

          {/* SISI KANAN: Form Login */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-[#FDFBF7]/50">
            
            <div className="flex items-center justify-between mb-8">
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#2C1E16]/60 hover:text-[#D4813E] transition-colors"
              >
                <ArrowLeft size={16} /> Kembali ke Beranda
              </Link>
              <div className="text-xs text-[#2C1E16]/60">
                Belum punya akun?{' '}
                <Link href={route('register')} className="font-bold text-[#D4813E] hover:underline">
                  Daftar
                </Link>
              </div>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#2C1E16] tracking-tight mb-2">
                Selamat Datang 
              </h1>
              <p className="text-xs sm:text-sm text-[#2C1E16]/60">
                Silakan masuk dengan akun yang sudah terdaftar.
              </p>
            </div>

            {status && (
              <div className="mb-4 text-xs font-medium text-green-600 bg-green-50 p-3 rounded-xl border border-green-200">
                {status}
              </div>
            )}

            {/* Tombol Login Google */}
            <a
              href="/auth/google"
              className="w-full mb-5 bg-white border border-[#2C1E16]/15 hover:border-[#D4813E] text-[#2C1E16] font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-3 transition-all hover:shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Masuk dengan Google</span>
            </a>

            <div className="relative flex py-2 items-center mb-5">
              <div className="flex-grow border-t border-[#2C1E16]/10"></div>
              <span className="flex-shrink mx-4 text-xs text-[#2C1E16]/40 uppercase tracking-widest font-semibold">atau email</span>
              <div className="flex-grow border-t border-[#2C1E16]/10"></div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2C1E16] uppercase tracking-wider mb-1.5">
                  Gmail
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2C1E16]/40" />
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="@gmail.com"
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

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-[#2C1E16] uppercase tracking-wider">
                    Kata Sandi
                  </label>
                  {canResetPassword && (
                    <Link
                      href={route('password.request')}
                      className="text-xs text-[#D4813E] hover:underline"
                    >
                      Lupa password?
                    </Link>
                  )}
                </div>
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

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.remember}
                    onChange={(e) => setData('remember', e.target.checked)}
                    className="rounded border-[#2C1E16]/20 text-[#D4813E] focus:ring-[#D4813E]"
                  />
                  <span className="text-xs text-[#2C1E16]/70">Ingat saya di perangkat ini</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full mt-2 bg-[#D4813E] hover:bg-[#b86b30] text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-[#D4813E]/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? (
                  <span>Memproses...</span>
                ) : (
                  <>
                    <span>Masuk</span>
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
