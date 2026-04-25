import { Instagram, MapPin, Mail, Sparkle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { Settings } from '../types';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'settings'), limit(1)), (s) => {
      if (!s.empty) setSettings({ id: s.docs[0].id, ...s.docs[0].data() } as Settings);
    });
    return () => unsub();
  }, []);
  
  return (
    <footer className="bg-white text-brand-dark pt-32 pb-16 px-4 md:px-12 border-t border-black/5">
      <div className="max-w-[1400px] mx-auto flex flex-col items-center text-center space-y-16">
        
        {/* Top: Logo & Description */}
        <div className="space-y-6 max-w-sm">
          <img 
            src={settings?.logoUrl || "https://i.postimg.cc/zXRgnSG6/Captura-de-tela-2026-04-20-205007.png"} 
            alt="Logo" 
            className="h-16 w-auto object-contain mx-auto mb-4" 
          />
          <p className="text-[10px] uppercase tracking-[0.4em] font-medium text-brand-muted leading-relaxed">
            Eternizando momentos com brilho e sofisticação incomparável.
          </p>
        </div>

        {/* Middle: Links */}
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-6">
          <Link to="/" className="text-[11px] uppercase tracking-[0.2em] font-medium hover:text-brand-accent transition-colors">Início</Link>
          <button className="text-[11px] uppercase tracking-[0.2em] font-medium hover:text-brand-accent transition-colors">Coleções</button>
          <button className="text-[11px] uppercase tracking-[0.2em] font-medium hover:text-brand-accent transition-colors text-left">Personalizados</button>
          <a href={`https://wa.me/${settings?.whatsapp || "5577999110250"}`} className="text-[11px] uppercase tracking-[0.2em] font-medium hover:text-brand-accent transition-colors">Atendimento</a>
        </div>

        {/* Middle: Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full pt-16 border-t border-black/5">
           <div className="flex flex-col items-center space-y-3">
             <MapPin size={18} strokeWidth={1} className="text-brand-accent" />
             <p className="text-[10px] uppercase tracking-[0.2em] font-medium">{settings?.city || "Guanambi"}, {settings?.state || "Bahia"}</p>
           </div>
           <div className="flex flex-col items-center space-y-3">
             <Instagram size={18} strokeWidth={1} className="text-brand-accent" />
             <a href={settings?.instagram || "https://instagram.com/deborahsemijoiaspersonalizadas/"} target="_blank" rel="noreferrer" className="text-[10px] uppercase tracking-[0.2em] font-medium hover:text-brand-accent">@deborahsemijoias</a>
           </div>
           <div className="flex flex-col items-center space-y-3">
             <Mail size={18} strokeWidth={1} className="text-brand-accent" />
             <p className="text-[10px] uppercase tracking-[0.2em] font-medium">{settings?.email || "debosantos1101@gmail.com"}</p>
           </div>
        </div>

        {/* Bottom: Legal */}
        <div className="space-y-8 pt-16">
          <div className="flex items-center justify-center gap-3">
            <Sparkle size={14} className="text-brand-accent" />
            <p className="text-[9px] uppercase tracking-[0.5em] font-bold">Deborah Joias Personalizadas</p>
            <Sparkle size={14} className="text-brand-accent" />
          </div>
          <div className="text-[8px] uppercase tracking-[0.3em] font-medium text-brand-muted space-y-2">
            <p>© {currentYear} Todos os direitos reservados.</p>
            <p>Deborah Evellyn Santos da Silva | CNPJ: 66.366255/0001-80</p>
          </div>
          <Link to="/admin" className="inline-block text-[8px] uppercase tracking-[0.3em] font-bold text-brand-dark hover:text-brand-accent underline">Painel Administrativo</Link>
        </div>
      </div>
    </footer>
  );
}
