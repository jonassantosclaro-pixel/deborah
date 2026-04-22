import { useState, FormEvent, useEffect } from 'react';
import { CartItem, Order, Settings } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Package, Truck, CreditCard, QrCode, CheckCircle2, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, limit } from 'firebase/firestore';

interface CheckoutProps {
  cart: CartItem[];
  clearCart: () => void;
}

export function Checkout({ cart, clearCart }: CheckoutProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const s = await getDocs(query(collection(db, 'settings'), limit(1)));
      if (!s.empty) setSettings({ id: s.docs[0].id, ...s.docs[0].data() } as Settings);
    };
    fetchSettings();
  }, []);

  const subtotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const total = subtotal + shippingCost;

  const handleCepBlur = async () => {
    if (formData.cep.length === 8) {
      setCalculatingShipping(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${formData.cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
          }));
          setShippingCost(data.uf === 'BA' ? 1500 : 2500);
        }
      } catch (e) {
        console.error('CEP error', e);
      } finally {
        setCalculatingShipping(false);
      }
    }
  };

  const handleSubmitOrder = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const order: Order = {
      customerName: formData.name,
      customerPhone: formData.phone,
      address: {
        street: formData.street,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        cep: formData.cep,
      },
      items: cart,
      total,
      shippingCost,
      status: 'pending',
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, 'orders'), order);
      
      const itemsList = cart.map(i => {
        let text = `- ${i.quantity}x ${i.name} (R$ ${ (i.price/100).toFixed(2) })`;
        if (i.selectedComplements && i.selectedComplements.length > 0) {
          text += `%0A  + Complementos: ${i.selectedComplements.map(c => c.name).join(', ')}`;
        }
        return text;
      }).join('%0A');
      const message = `*Olá, Deborah! Novo Pedido realizado no site!*%0A%0A*Pedido ID:* ${docRef.id}%0A*Cliente:* ${formData.name}%0A*Telefone:* ${formData.phone}%0A%0A*Itens:*%0A${itemsList}%0A%0A*Total:* R$ ${(total/100).toFixed(2)} (Frete R$ ${(shippingCost/100).toFixed(2)})%0A%0A*Endereço:*%0A${formData.street}, ${formData.number} - ${formData.neighborhood}%0A${formData.city}/${formData.state} - CEP: ${formData.cep}`;
      
      const whatsappNumber = settings?.whatsapp || '5577999110250';
      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
      
      setStep(2);
      clearCart();
    } catch (e) {
      console.error('Order creation failed', e);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && step === 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-20 h-20 bg-[#FDF2F2] text-[#B17A7A] rounded-full flex items-center justify-center mb-4">
          <ShoppingBag size={40} />
        </div>
        <h2 className="text-2xl font-serif font-bold">Seu carrinho está vazio</h2>
        <p className="text-[#3C1A1A]/60">Adicione alguns produtos para continuar.</p>
        <Link to="/" className="bg-[#3C1A1A] text-white px-8 py-3 rounded-full font-bold">Voltar para a loja</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div 
            key="checkout"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            {/* Form Side */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <Link to="/" className="p-2 hover:bg-white rounded-full transition-colors text-brand-pink">
                  <ChevronLeft size={24} />
                </Link>
                <h1 className="text-3xl font-serif font-bold text-brand-dark">Finalizar Compra</h1>
              </div>

              <form onSubmit={handleSubmitOrder} className="space-y-6">
                <div className="frosted-glass p-8 rounded-3xl shadow-sm space-y-6">
                  <div className="flex items-center gap-2 text-brand-pink font-bold mb-4">
                    <CheckCircle2 size={20} />
                    <span className="uppercase text-[10px] tracking-widest">Seus Dados</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black uppercase tracking-wider">Nome Completo</label>
                      <input 
                        required
                        className="w-full bg-white/50 border border-brand-gold/10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-pink/20 text-sm text-black"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black uppercase tracking-wider">WhatsApp (com DDD)</label>
                      <input 
                        required
                        className="w-full bg-white/50 border border-brand-gold/10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-pink/20 text-sm text-black"
                        placeholder="77 99999-9999"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="frosted-glass p-8 rounded-3xl shadow-sm space-y-6">
                  <div className="flex items-center gap-2 text-brand-pink font-bold mb-4">
                    <Truck size={20} />
                    <span className="uppercase text-[10px] tracking-widest leading-none">Endereço de Entrega</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black uppercase tracking-wider">CEP</label>
                      <input 
                        required
                        className="w-full bg-white/50 border border-brand-gold/10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-pink/20 text-sm text-black"
                        placeholder="00000-000"
                        maxLength={8}
                        value={formData.cep}
                        onChange={e => setFormData({ ...formData, cep: e.target.value.replace(/\D/g, '') })}
                        onBlur={handleCepBlur}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black uppercase tracking-wider">Rua/Logradouro</label>
                      <input 
                        required
                        className="w-full bg-white/50 border border-brand-gold/10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-pink/20 text-sm text-black"
                        value={formData.street}
                        onChange={e => setFormData({ ...formData, street: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black uppercase tracking-wider">Número</label>
                      <input 
                        required
                        className="w-full bg-white/50 border border-brand-gold/10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-pink/20 text-sm text-black"
                        value={formData.number}
                        onChange={e => setFormData({ ...formData, number: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black uppercase tracking-wider">Bairro</label>
                      <input 
                        required
                        className="w-full bg-white/50 border border-brand-gold/10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-pink/20 text-sm text-black"
                        value={formData.neighborhood}
                        onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black uppercase tracking-wider">Cidade</label>
                      <input 
                        required
                        readOnly
                        className="w-full bg-gray-50 border border-brand-gold/10 px-4 py-3 rounded-xl focus:outline-none text-black text-sm"
                        value={formData.city}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black uppercase tracking-wider">Estado</label>
                      <input 
                        required
                        readOnly
                        className="w-full bg-gray-50 border border-brand-gold/10 px-4 py-3 rounded-xl focus:outline-none text-black text-sm"
                        value={formData.state}
                      />
                    </div>
                  </div>
                </div>

                <div className="frosted-glass p-8 rounded-3xl shadow-sm space-y-6">
                  <div className="flex items-center gap-2 text-brand-pink font-bold mb-4">
                    <CreditCard size={20} />
                    <span className="uppercase text-[10px] tracking-widest">Pagamento</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 bg-brand-pink text-white p-4 rounded-xl shadow-md border border-brand-pink">
                      <QrCode size={18} />
                      <div className="flex-grow">
                        <p className="text-xs font-bold uppercase tracking-widest">PIX</p>
                      </div>
                      <CheckCircle2 size={16} />
                    </div>
                    <div className="flex items-center gap-3 bg-white/30 p-4 rounded-xl border border-brand-gold/20 opacity-60">
                      <CreditCard size={18} className="text-gray-400" />
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cartão</p>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || calculatingShipping || !formData.cep}
                  className="w-full bg-green-500 text-white py-5 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-green-500/10 uppercase tracking-widest h-16"
                >
                  {loading ? 'Processando...' : 'Finalizar e Enviar WhatsApp'}
                </button>
              </form>
            </div>

            {/* Summary Side */}
            <div className="lg:sticky lg:top-32 space-y-6 self-start">
              <div className="frosted-glass-heavy p-8 rounded-[2rem] shadow-xl">
                <h2 className="font-serif text-xl font-bold mb-6 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-brand-dark">
                    <Package className="text-brand-pink" />
                    Seu Carrinho
                  </span>
                  <span className="text-xs font-normal opacity-60 uppercase tracking-widest">{cart.length} Itens</span>
                </h2>
                
                <div className="space-y-4 max-h-60 overflow-y-auto pr-4 mb-6 thin-scrollbar">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm border-b border-black/5 pb-2">
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-white flex items-center justify-center rounded text-[10px] font-bold text-brand-pink">{item.quantity}x</span>
                        <span className="text-brand-dark font-medium">{item.name}</span>
                      </span>
                      <span className="font-bold text-brand-pink">{(item.price * item.quantity / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-4 border-t border-brand-gold/10">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                    <span>Subtotal</span>
                    <span>{(subtotal / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                    <span>Frete</span>
                    <span>
                      {calculatingShipping ? 'Calculando...' : (shippingCost / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-4 mt-4 border-t border-brand-gold/30">
                    <span className="text-xl font-serif font-bold text-brand-dark">Total</span>
                    <span className="text-2xl font-bold text-black">
                      {(total / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pix-info bg-[#f0f7f4] p-4 rounded-xl border border-green-200 border-dashed text-[11px] text-green-700 leading-relaxed">
                 <strong>Pagamento PIX:</strong><br />
                 CNPJ: 66.366255/0001-80<br />
                 Escaneie o QR Code após a finalização para liberação imediata.
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center space-y-8 bg-white p-12 rounded-[3rem] shadow-2xl border border-[#B17A7A]/10"
          >
            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-serif font-bold">Pedido Confirmado!</h1>
              <p className="text-[#3C1A1A]/60">Sua peça exclusiva está quase pronta para brilhar em você.</p>
            </div>

            <div className="bg-[#FDF2F2] p-8 rounded-3xl space-y-6">
              <p className="text-xs font-bold uppercase tracking-widest text-black">Pague Agora via PIX</p>
              <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mx-auto mb-4 border-4 border-[#B17A7A]/10">
                <QRCodeSVG value={`00020126360014BR.GOV.BCB.PIX0114${(settings?.pixKey || '66366255000180').replace(/\D/g, '')}5204000053039865405${(total/100).toFixed(2)}5802BR5915Deborah Evellyn6008Guanambi62070503***6304`} size={200} />
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-[#3C1A1A]/40 uppercase tracking-widest mb-1">Chave PIX</p>
                  <p className="font-mono font-bold text-lg select-all">{settings?.pixKey || '66.366.255/0001-80'}</p>
                </div>
                <div className="bg-white p-4 rounded-xl text-left border border-[#B17A7A]/10">
                   <div className="flex justify-between font-bold text-sm mb-1">
                     <span>Valor Total</span>
                     <span className="text-black">{(total / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                   </div>
                   <p className="text-[10px] text-[#3C1A1A]/40">Favor enviar o comprovante no WhatsApp.</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#3C1A1A]/60">Enviamos os detalhes do pedido e o link de pagamento para o seu WhatsApp também!</p>
            
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-[#3C1A1A] text-white py-4 rounded-xl font-bold hover:bg-[#B17A7A] transition-all"
            >
              Voltar para a Loja
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShieldCheck({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
