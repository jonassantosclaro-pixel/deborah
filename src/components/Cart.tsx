import { motion } from 'motion/react';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { CartItem } from '../types';
import { Link } from 'react-router-dom';

interface CartProps {
  items: CartItem[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
}

export function Cart({ items, onClose, onRemove, onUpdateQuantity }: CartProps) {
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
      />
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white/70 backdrop-blur-[20px] shadow-2xl z-50 flex flex-col border-l border-brand-gold/20"
      >
        <div className="p-6 border-b border-brand-gold/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-brand-pink" />
            <h2 className="font-serif text-xl font-bold text-brand-dark">Meu Carrinho</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-brand-pink/10 rounded-full transition-colors text-brand-dark">
            <X size={20} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <ShoppingBag size={48} className="text-brand-gold/20" />
              <p className="text-brand-dark/60 font-medium">Seu carrinho está vazio.</p>
              <button 
                onClick={onClose}
                className="text-black font-bold uppercase text-xs tracking-widest hover:underline underline-offset-8"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 group bg-white/40 p-3 rounded-2xl border border-white/60">
                <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-brand-gold/5">
                  <img src={item.imageUrl || undefined} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between">
                    <h3 className="font-bold text-[13px] text-brand-dark">{item.name}</h3>
                    <button onClick={() => onRemove(item.id)} className="text-black hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-black mb-1 truncate max-w-[200px] font-medium">
                    {item.description}
                  </p>

                  {item.selectedComplements && item.selectedComplements.length > 0 && (
                    <div className="mb-2 space-y-0.5">
                      {item.selectedComplements.map(c => (
                        <div key={c.id} className="text-[9px] text-black font-bold flex items-center gap-1 uppercase tracking-widest leading-tight">
                          + {c.name}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-brand-gold/20 rounded-lg bg-white/60 overflow-hidden">
                      <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-1 hover:bg-brand-pink/10 transition-colors">
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-1 hover:bg-brand-pink/10 transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="font-bold text-brand-pink">
                      {(item.price * item.quantity / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 bg-brand-gold/5 border-t border-brand-gold/10 space-y-4">
            <div className="flex justify-between items-center bg-white/40 p-4 rounded-xl">
              <span className="text-xs font-bold uppercase tracking-widest text-black">Subtotal</span>
              <span className="font-bold text-xl text-brand-pink">
                {(subtotal / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <Link 
              to="/checkout" 
              onClick={onClose}
              className="w-full bg-brand-pink text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-sm hover:bg-brand-dark transition-all shadow-lg active:scale-[0.98]"
            >
              Finalizar Pedido
              <ArrowRight size={18} />
            </Link>
            <p className="text-[9px] text-center text-black uppercase tracking-[0.2em] font-bold">
              Frete calculado no checkout
            </p>
          </div>
        )}
      </motion.div>
    </>
  );
}
