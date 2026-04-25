import { motion, AnimatePresence } from 'motion/react';
import { Sparkle, ShoppingBag, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Settings } from '../types';

export function IntroScreen({ onComplete }: { onComplete: () => void }) {
  const [timeLeft, setTimeLeft] = useState(10);
  const [whatsapp, setWhatsapp] = useState('5577999110250');

  useEffect(() => {
    // Fetch WhatsApp number from settings
    const unsub = onSnapshot(query(collection(db, 'settings'), limit(1)), (s) => {
      if (!s.empty) {
        const data = s.docs[0].data() as Settings;
        if (data.whatsapp) {
          // Clean number for wa.me
          setWhatsapp(data.whatsapp.replace(/\D/g, ''));
        }
      }
    });

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${whatsapp}`, '_blank');
    onComplete();
  };

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-[#FDF2F2] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Immersive Background */}
      <motion.div 
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.15 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute inset-0 z-0"
      >
        <img 
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=2000" 
          alt="Luxury Jewelry" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/40" />
      </motion.div>

      {/* Luxury Particle System */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: 0,
            }}
            animate={{ 
              y: ["0%", "-10%"],
              opacity: [0, 0.6, 0],
            }}
            transition={{ 
              duration: Math.random() * 6 + 4, 
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            className="absolute text-brand-accent/60"
          >
            <Sparkle size={Math.random() * 10 + 4} />
          </motion.div>
        ))}
      </div>

      {/* Main Content Portal */}
      <div className="relative z-20 w-full max-w-lg px-8 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="mb-16 space-y-4"
        >
          <div className="space-y-1">
            <h1 className="text-3xl md:text-5xl font-serif text-brand-dark tracking-widest leading-tight">
              Deborah <span className="italic">Joias</span>
            </h1>
            <p className="text-[10px] md:text-[12px] uppercase tracking-[0.5em] text-brand-accent font-medium">
              Personalizadas
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-12">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            onClick={onComplete}
            className="group relative overflow-hidden bg-white/60 backdrop-blur-md border border-brand-accent/20 p-8 rounded-3xl transition-all hover:bg-white hover:border-brand-accent/50 flex flex-col items-center gap-4 shadow-sm hover:shadow-xl hover:shadow-brand-accent/5"
          >
            <div className="p-4 bg-brand-light rounded-2xl group-hover:bg-brand-accent group-hover:text-white transition-all duration-500">
              <ShoppingBag size={24} strokeWidth={1.5} className="text-brand-accent group-hover:text-white" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-dark">Explorar Loja</span>
              <p className="text-[9px] text-brand-dark/40 uppercase tracking-widest">Catálogo Completo</p>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            onClick={handleWhatsApp}
            className="group relative overflow-hidden bg-brand-pink/10 backdrop-blur-md border border-brand-pink/20 p-8 rounded-3xl transition-all hover:bg-brand-pink/20 hover:border-brand-pink/50 flex flex-col items-center gap-4 shadow-sm hover:shadow-xl hover:shadow-brand-pink/5"
          >
            <div className="p-4 bg-brand-light rounded-2xl group-hover:bg-brand-dark group-hover:text-white transition-all duration-500">
              <MessageCircle size={24} strokeWidth={1.5} className="text-brand-pink group-hover:text-white" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-dark">Atendimento VIP</span>
              <p className="text-[9px] text-brand-dark/40 uppercase tracking-widest">Suporte via WhatsApp</p>
            </div>
          </motion.button>
        </div>

        {/* Auto-Entry Timer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex gap-2 items-center">
            <span className="text-[9px] uppercase tracking-[0.3em] text-brand-dark/30 font-medium">Entrada automática em</span>
            <span className="text-brand-accent font-serif text-lg w-6">{timeLeft}s</span>
          </div>
          
          <div className="w-48 h-[2px] bg-brand-dark/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 10, ease: "linear" }}
              className="h-full bg-brand-accent shadow-[0_0_10px_rgba(212,175,55,0.4)]"
            />
          </div>
        </motion.div>
      </div>

      {/* Decorative Ornaments */}
      <div className="absolute top-0 left-0 p-12 hidden md:block opacity-30">
        <div className="w-[1px] h-32 bg-gradient-to-b from-brand-accent to-transparent" />
      </div>
      <div className="absolute bottom-0 right-0 p-12 hidden md:block opacity-30">
        <div className="w-[1px] h-32 bg-gradient-to-t from-brand-accent to-transparent" />
      </div>

    </motion.div>
  );
}

