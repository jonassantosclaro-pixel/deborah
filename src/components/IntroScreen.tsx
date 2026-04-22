import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Sparkles, Hexagon } from 'lucide-react';
import { useEffect } from 'react';

export function IntroScreen() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for magnetic tilt effect
  const springConfig = { damping: 25, stiffness: 150 };
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-10, 10]), springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - window.innerWidth / 2);
      mouseY.set(e.clientY - window.innerHeight / 2);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-[#0A0505] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Futuristic Grid/Nodes Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`node-${i}`}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: 0.1
            }}
            animate={{ 
              opacity: [0.1, 0.4, 0.1],
              scale: [1, 1.2, 1],
            }}
            transition={{ 
              duration: Math.random() * 4 + 2, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="absolute text-brand-gold"
          >
            <Hexagon size={4} fill="currentColor" />
          </motion.div>
        ))}
        {/* Subtle grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#d4af3710_1px,transparent_1px),linear-gradient(to_bottom,#d4af3710_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Floating Sparkles (Stardust) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: 0,
            }}
            animate={{ 
              y: ["0%", "-10%"],
              opacity: [0, 0.8, 0],
            }}
            transition={{ 
              duration: Math.random() * 5 + 3, 
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            className="absolute text-brand-gold/40"
          >
            <Sparkles size={Math.random() * 12 + 4} />
          </motion.div>
        ))}
      </div>

      {/* Main Logo Container with 3D Tilt */}
      <motion.div
        style={{ rotateX, rotateY, perspective: 1000 }}
        className="relative flex flex-col items-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="relative"
        >
          {/* Futuristic Energy Aura */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.5, 0.2],
              background: [
                "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)",
                "radial-gradient(circle, rgba(212,175,55,0.25) 0%, transparent 70%)",
                "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)"
              ]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-[-120px] blur-[80px] rounded-full"
          />

          {/* Dynamic "Orbit" Rings */}
          {[1, 2, 3].map((ring) => (
            <motion.div 
              key={`ring-${ring}`}
              animate={{ rotate: ring % 2 === 0 ? 360 : -360 }}
              transition={{ duration: 10 + ring * 5, repeat: Infinity, ease: "linear" }}
              className="absolute rounded-full border border-brand-gold/10"
              style={{
                inset: -(ring * 25),
                borderWidth: '1px',
                opacity: 0.5 - (ring * 0.1)
              }}
            >
              {/* Energy pulse on ring */}
              <motion.div 
                animate={{ opacity: [0, 1, 0], scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: ring }}
                className="absolute inset-0 border border-brand-gold/20 rounded-full"
              />
            </motion.div>
          ))}
          
          {/* The Logo with Holographic Elements */}
          <div className="relative group">
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                filter: [
                  "drop-shadow(0 0 15px rgba(212,175,55,0.3))", 
                  "drop-shadow(0 0 40px rgba(212,175,55,0.6))", 
                  "drop-shadow(0 0 15px rgba(212,175,55,0.3))"
                ]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <img 
                src="https://i.postimg.cc/DwTnbrYh/Captura-de-tela-2026-04-22-115752.png" 
                alt="Deborah Joias" 
                className="w-64 h-64 md:w-96 md:h-96 object-contain relative z-10"
              />
            </motion.div>
            
            {/* Holographic Scan Line */}
            <motion.div 
              initial={{ top: "-20%" }}
              animate={{ top: "120%" }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-[2px] bg-brand-gold/40 z-20 shadow-[0_0_15px_rgba(212,175,55,0.8)] blur-[1px]"
            />

            {/* Futuristic Diamond Shine Overlay */}
            <div className="absolute inset-0 z-30 overflow-hidden rounded-full pointer-events-none mix-blend-color-dodge">
              <motion.div 
                animate={{ 
                  x: ["-200%", "200%"],
                  opacity: [0, 1, 0]
                }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 0.5 }}
                className="w-full h-full bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent absolute top-0 -skew-x-12"
              />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Cybernetic Status Indicator */}
      <div className="absolute bottom-24 flex flex-col items-center gap-4">
        <div className="flex gap-2 items-center">
            <motion.div 
              animate={{ opacity: [1, 0.4, 1] }} 
              transition={{ duration: 0.2, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-brand-gold rounded-full shadow-[0_0_8px_rgba(212,175,55,1)]" 
            />
            <span className="text-[9px] uppercase tracking-[0.4em] text-brand-gold/60 font-mono">Initializing Premium Experience</span>
        </div>
        <div className="w-40 h-[1px] bg-brand-gold/20 relative overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 w-1/2 bg-brand-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]"
          />
        </div>
      </div>

      {/* Futuristic Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 4, ease: "circOut" }}
          className="h-full bg-gradient-to-r from-brand-gold/20 via-brand-gold to-brand-gold/20 shadow-[0_0_20px_rgba(212,175,55,0.5)]"
        />
      </div>
    </motion.div>
  );
}
