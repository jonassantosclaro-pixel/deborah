import { Instagram, Facebook, MessageCircle as WhatsApp, MapPin, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { Settings } from '../types';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const s = await getDocs(query(collection(db, 'settings'), limit(1)));
      if (!s.empty) setSettings({ id: s.docs[0].id, ...s.docs[0].data() } as Settings);
    };
    fetchSettings();
  }, []);
  
  return (
    <footer className="bg-brand-dark/5 text-black pt-16 pb-8 px-4 md:px-8 border-t border-brand-gold/10 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="space-y-4">
          <div className="flex flex-col">
            <img 
              src={settings?.logoUrl || "https://i.postimg.cc/DwTnbrYh/Captura-de-tela-2026-04-22-115752.png"} 
              alt="Logo" 
              className="h-14 w-auto object-contain self-start mb-2" 
            />
          </div>
          <p className="text-xs leading-relaxed italic pr-4">
            Semijoias que celebram sua essência com o brilho e a sofisticação que você merece.
          </p>
          <div className="flex gap-4 pt-2">
            <a href={settings?.instagram || "https://instagram.com/deborahsemijoiaspersonalizadas/"} target="_blank" rel="noreferrer" className="text-brand-pink hover:text-brand-dark transition-colors">
              <Instagram size={18} />
            </a>
            <a href={settings?.facebook || "#"} target="_blank" rel="noreferrer" className="text-brand-pink hover:text-brand-dark transition-colors">
              <Facebook size={18} />
            </a>
            <a href={`https://wa.me/${settings?.whatsapp || "5577999110250"}`} target="_blank" rel="noreferrer" className="text-green-500 hover:text-brand-dark transition-colors">
              <WhatsApp size={18} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-6 text-black uppercase tracking-[0.2em] text-[10px]">Mapa do Site</h4>
          <ul className="space-y-3 text-xs font-semibold uppercase tracking-wider text-black">
            <li><Link to="/" className="hover:text-brand-pink transition-colors">Início</Link></li>
            <li><button className="hover:text-brand-pink transition-colors text-left uppercase">Coleções</button></li>
            <li><button className="hover:text-brand-pink transition-colors text-left uppercase">Personalizados</button></li>
            <li><Link to="/admin" className="hover:text-brand-pink transition-colors">Painel Admin</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-6 text-black uppercase tracking-[0.2em] text-[10px]">Atendimento</h4>
          <ul className="space-y-4 text-xs font-medium text-black">
            <li className="flex items-center gap-3">
              <WhatsApp size={14} className="text-green-500" />
              <span>{settings?.whatsapp || "(77) 9 9911-0250"}</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={14} className="text-brand-gold" />
              <span>contato@deborahjoias.com.br</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-6 text-black uppercase tracking-[0.2em] text-[10px]">Nossa Sede</h4>
          <div className="flex items-start gap-3 text-xs font-medium text-black leading-relaxed">
            <MapPin size={14} className="mt-0.5 text-brand-gold shrink-0" />
            <span>Guanambi, Bahia<br />Envio para todo o Brasil</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-brand-gold/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] text-black font-bold uppercase tracking-[0.2em]">
        <div>© {currentYear} Deborah Joias Personalizadas</div>
        <div className="text-center">
          <div>Deborah Evellyn Santos da Silva | <strong>CNPJ: 66.366255/0001-80</strong></div>
        </div>
        <Link to="/admin" className="admin-link text-black hover:underline uppercase tracking-widest">Painel Admin</Link>
      </div>
    </footer>
  );
}
