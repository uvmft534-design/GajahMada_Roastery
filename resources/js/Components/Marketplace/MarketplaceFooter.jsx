import { motion } from 'framer-motion';

export default function MarketplaceFooter({ scrollConfig, slideInRight }) {
  return <footer id="blog" className="bg-[#2C1E16] text-[#FDFBF7] py-16 overflow-hidden">
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
          <li className="flex items-start gap-2"><span className="mt-1">📍</span> Jl. Kopi Nusantara No. 88, Jakarta</li>
          <li className="flex items-center gap-2"><span>✉️</span> hello@kopigajahmada.com</li>
          <li className="flex items-center gap-2"><span>📞</span> +62 812 3456 7890</li>
        </ul>
      </div>
    </motion.div>

    <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/10 text-center text-sm text-[#FDFBF7]/40 flex flex-col md:flex-row justify-between items-center gap-4">
      <p>&copy; {new Date().getFullYear()} Kopi Gajahmada Roastery. All rights reserved.</p>
      <div className="flex gap-4"><a href="#" className="hover:text-white transition-colors">Privacy Policy</a><a href="#" className="hover:text-white transition-colors">Terms of Service</a></div>
    </div>
  </footer>;
}
