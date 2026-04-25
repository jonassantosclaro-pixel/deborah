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
        className="fixed inset-0 bg-brand-dark/40 backdrop-blur-md z-50"
      />
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-black/5"
      >
        <div className="p-8 border-b border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="text-brand-accent" size={20} strokeWidth={1.5} />
            <h2 className="font-serif text-2xl text-brand-dark">Sua Sacola</h2>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-brand-muted hover:text-brand-dark transition-colors">
            <X size={20} strokeWidth={1} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-8 thin-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <ShoppingBag size={48} strokeWidth={0.5} className="text-brand-accent/20" />
              <div className="space-y-2">
                 <p className="text-sm font-medium text-brand-dark">Sua sacola está vazia</p>
                 <p className="text-[10px] uppercase tracking-widest text-brand-muted">Descubra nossas peças exclusivas</p>
              </div>
              <button 
                onClick={onClose}
                className="button-outline text-[10px] w-full"
              >
                Continuar explorando
              </button>
            </div>
          ) : (
            <div className="space-y-10">
              {items.map((item) => (
                <div key={item.id} className="flex gap-6 group">
                  <div className="w-24 h-32 bg-neutral-50 overflow-hidden shrink-0">
                    <img src={item.imageUrl || undefined} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="text-[11px] uppercase tracking-[0.2em] font-medium text-brand-dark leading-tight">{item.name}</h3>
                       <button onClick={() => onRemove(item.id)} className="text-brand-muted hover:text-red-500 transition-colors">
                         <Trash2 size={14} strokeWidth={1.5} />
                       </button>
                    </div>
                    
                    <div className="flex-grow">
                      {item.selectedComplements && item.selectedComplements.length > 0 && (
                        <div className="mb-3 space-y-1">
                          {item.selectedComplements.map(c => (
                            <div key={c.id} className="text-[8px] text-brand-accent uppercase tracking-widest font-bold">
                              + {c.name}
                            </div>
                          ))}
                        </div>
                      )}

                      {item.personalization && (
                        <div className="mb-3 p-2 border-l-2 border-brand-accent bg-neutral-50">
                           <p className="text-[8px] uppercase tracking-widest font-bold text-brand-accent mb-0.5">Personalização:</p>
                           <p className="text-[10px] italic font-medium text-brand-dark">{item.personalization}</p>
                        </div>
                      )}

                      {item.selectedLength && (
                        <div className="mb-3 p-2 border-l-2 border-brand-dark bg-neutral-50">
                           <p className="text-[8px] uppercase tracking-widest font-bold text-brand-dark mb-0.5">Tamanho:</p>
                           <p className="text-[10px] font-medium">{item.selectedLength}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-black/10 text-brand-dark">
                        <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-2 hover:bg-neutral-50 transition-colors">
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-[10px] font-bold">{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-2 hover:bg-neutral-50 transition-colors">
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-xs font-bold text-brand-dark">
                        {(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-8 border-t border-black/5 space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-brand-muted">Subtotal estimado</span>
              <span className="text-xl font-bold text-brand-dark">
                {(subtotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <Link 
              to="/checkout" 
              onClick={onClose}
              className="button-primary w-full flex items-center justify-center gap-4"
            >
              Finalizar Atendimento
              <ArrowRight size={14} />
            </Link>
            <p className="text-[8px] text-center text-brand-muted uppercase tracking-[0.3em]">
              Frete e impostos calculados no pagamento
            </p>
          </div>
        )}
      </motion.div>
    </>
  );
}
