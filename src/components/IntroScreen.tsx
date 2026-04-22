import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export function IntroScreen() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Particles/Sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: window.innerHeight + 10,
              opacity: 0,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              y: -100, 
              opacity: [0, 1, 0],
              rotate: 360
            }}
            transition={{ 
              duration: Math.random() * 5 + 3, 
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear"
            }}
            className="absolute text-brand-gold/40"
          >
            <Sparkles size={Math.random() * 20 + 10} />
          </motion.div>
        ))}
      </div>

      {/* Main Logo Animation */}
      <div className="relative flex flex-col items-center space-y-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="relative"
        >
          {/* Luxurious Ring/Circle */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-40px] border border-brand-gold/20 rounded-full"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-55px] border border-brand-pink/10 rounded-full"
          />
          
          <img 
            src="https://i.postimg.cc/DwTnbrYh/Captura-de-tela-2026-04-22-115752.png" 
            alt="Deborah Joias" 
            className="w-48 h-48 md:w-64 md:h-64 object-contain filter drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]"
          />
        </motion.div>

        <div className="flex flex-col items-center">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="font-serif text-3xl md:text-5xl font-bold tracking-[0.3em] text-brand-dark uppercase"
          >
            Deborah
          </motion.h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 1.5, duration: 1 }}
            className="h-[1px] bg-brand-gold/40 my-3"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="text-[10px] md:text-xs uppercase tracking-[0.5em] text-black font-bold"
          >
            Joias Personalizadas
          </motion.p>
        </div>
      </div>

      {/* Loading Progress Bar */}
      <div className="absolute bottom-16 w-48 h-[2px] bg-brand-gold/10 overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ duration: 4, ease: "easeInOut" }}
          className="h-full w-full bg-brand-gold"
        />
      </div>
    </motion.div>
  );
}
