import { ShoppingBag, Menu, User, Instagram, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { Settings } from '../types';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
}

export function Navbar({ cartCount, onCartClick }: NavbarProps) {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'settings'), limit(1)), (s) => {
      if (!s.empty) setSettings({ id: s.docs[0].id, ...s.docs[0].data() } as Settings);
    });
    return () => unsub();
  }, []);

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-black/5 px-4 py-4 md:px-12 backdrop-blur-md bg-white/95">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between relative">
        
        {/* Left Side: Menu Toggle + Social */}
        <div className="flex items-center gap-6 flex-1">
          <button className="text-brand-dark hover:scale-110 transition-transform">
            <Menu size={20} strokeWidth={1.5} />
          </button>
          <div className="hidden lg:flex items-center gap-4">
             <a href={settings?.instagram || "https://instagram.com/deborahsemijoiaspersonalizadas/"} target="_blank" rel="noreferrer" className="text-brand-dark hover:text-brand-accent transition-colors">
               <Instagram size={18} strokeWidth={1.5} />
             </a>
             <button className="text-brand-dark hover:text-brand-accent transition-colors">
               <Search size={18} strokeWidth={1.5} />
             </button>
          </div>
        </div>

        {/* Center: Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 flex justify-center">
          <Link to="/" className="flex items-center">
            <img 
              src={settings?.logoUrl || "https://i.postimg.cc/zXRgnSG6/Captura-de-tela-2026-04-20-205007.png"} 
              alt="Logo" 
              className="h-12 md:h-16 w-auto object-contain" 
            />
          </Link>
        </div>

        {/* Right Side: Admin + Cart */}
        <div className="flex items-center gap-4 md:gap-6 flex-1 justify-end">
          <Link to="/admin" className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-medium text-brand-dark hover:text-brand-accent transition-colors">
            <User size={18} strokeWidth={1.5} />
            <span className="hidden md:inline">Painel</span>
          </Link>
          
          <button 
            onClick={onCartClick}
            className="flex items-center gap-2 group p-1"
          >
            <div className="relative">
              <ShoppingBag size={20} strokeWidth={1.5} className="group-hover:text-brand-accent transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-dark text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] font-medium group-hover:text-brand-accent transition-colors">Sacola</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
