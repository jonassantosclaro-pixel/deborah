import { ShoppingBag, Menu, User, Instagram, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { Settings } from '../types';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
}

export function Navbar({ cartCount, onCartClick }: NavbarProps) {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const s = await getDocs(query(collection(db, 'settings'), limit(1)));
      if (!s.empty) setSettings({ id: s.docs[0].id, ...s.docs[0].data() } as Settings);
    };
    fetchSettings();
  }, []);

  return (
    <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-[10px] border-b border-brand-gold/20 px-4 py-3 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="md:hidden text-brand-dark">
            <Menu size={24} />
          </button>
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={settings?.logoUrl || "https://i.postimg.cc/DwTnbrYh/Captura-de-tela-2026-04-22-115752.png"} 
              alt="Logo" 
              className="h-10 md:h-14 w-auto object-contain transition-transform group-hover:scale-105" 
            />
          </Link>
          
          <div className="hidden xl:flex items-center gap-4 ml-6 pl-6 border-l border-brand-gold/20">
             <a href={settings?.instagram || "https://instagram.com/deborahsemijoiaspersonalizadas/"} target="_blank" rel="noreferrer" className="text-black hover:text-brand-pink transition-colors">
               <Instagram size={18} />
             </a>
             <a href={settings?.facebook || "#"} target="_blank" rel="noreferrer" className="text-black hover:text-brand-pink transition-colors">
               <Facebook size={18} />
             </a>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 font-semibold text-[13px] text-black uppercase tracking-wider">
          <Link to="/" className="hover:text-brand-pink transition-colors relative after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-brand-pink after:scale-x-0 hover:after:scale-x-100 after:transition-transform">Home</Link>
          <button className="hover:text-brand-pink transition-colors uppercase">Coleções</button>
          <button className="hover:text-brand-pink transition-colors uppercase">Personalizados</button>
        </div>

        <div className="flex items-center gap-4 text-brand-dark font-bold text-sm">
          <a href={`https://wa.me/${settings?.whatsapp || "5577999110250"}`} target="_blank" rel="noreferrer" className="hidden lg:flex items-center gap-2 text-green-500 hover:text-green-600 transition-colors uppercase tracking-widest text-[11px]">
            Fale Conosco <span className="text-lg">✆</span>
          </a>
          <Link to="/admin" className="p-2 hover:text-brand-pink transition-colors">
            <User size={22} />
          </Link>
          <button 
            onClick={onCartClick}
            className="relative p-2 hover:text-brand-pink transition-all hover:scale-110 active:scale-95"
          >
            <ShoppingBag size={24} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-brand-pink text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
