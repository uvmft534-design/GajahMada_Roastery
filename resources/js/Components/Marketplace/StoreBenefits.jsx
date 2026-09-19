import { motion } from 'framer-motion';
import { BadgeCheck, Headphones, ShieldCheck, Truck } from 'lucide-react';

const POLICIES = [
  { title: 'Pengiriman Cepat', desc: 'Pesanan sebelum jam 15.00 dikirim di hari yang sama.', icon: Truck },
  { title: 'Garansi Kualitas', desc: 'Tidak puas dengan rasa? Kami ganti 100%.', icon: BadgeCheck },
  { title: 'Dukungan 24/7', desc: 'Tim CS kami siap membantu kebutuhan kopi Anda.', icon: Headphones },
  { title: 'Pembayaran Aman', desc: 'Transaksi dijamin aman dengan enkripsi terkini.', icon: ShieldCheck },
];

export default function StoreBenefits({ scrollConfig, staggerContainer, slideInLeft }) {
  return <section className="border-y border-[#2C1E16]/10 py-16 bg-white overflow-hidden">
    <div className="max-w-7xl mx-auto px-6">
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        initial="hidden"
        whileInView="visible"
        viewport={scrollConfig}
        variants={staggerContainer}
      >
        {POLICIES.map((policy, idx) => {
          const Icon = policy.icon;
          return <motion.div key={idx} variants={slideInLeft} whileHover={{ y: -5 }} className="group rounded-3xl border border-[#2C1E16]/10 bg-[#FDFBF7] p-6 shadow-sm transition-shadow hover:shadow-lg">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-[#D4813E] text-white shadow-md shadow-[#D4813E]/25 transition-transform group-hover:scale-110"><Icon size={21} /></div>
            <h4 className="font-bold text-base">{policy.title}</h4>
            <p className="mt-2 text-sm text-[#2C1E16]/60 leading-relaxed">{policy.desc}</p>
          </motion.div>;
        })}
      </motion.div>
    </div>
  </section>;
}
