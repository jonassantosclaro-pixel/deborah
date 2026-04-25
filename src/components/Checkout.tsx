import { useState, FormEvent, useEffect } from 'react';
import { CartItem, Order, Settings } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Truck, CreditCard, QrCode, CheckCircle2, ShoppingBag, ShieldCheck, Sparkle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, limit } from 'firebase/firestore';

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
  const [submittedDetails, setSubmittedDetails] = useState<{ total: number, pixKey: string } | null>(null);
  
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
    const unsub = onSnapshot(query(collection(db, 'settings'), limit(1)), (s) => {
      if (!s.empty) setSettings({ id: s.docs[0].id, ...s.docs[0].data() } as Settings);
    });
    return () => unsub();
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
          setShippingCost(data.uf === 'BA' ? 15.00 : 25.00);
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
        let text = `- ${i.quantity}x ${i.name} (R$ ${ (i.price).toFixed(2) })`;
        if (i.personalization) {
          text += `%0A  *Personalização:* ${i.personalization}`;
        }
        if (i.selectedLength) {
          text += `%0A  *Tamanho:* ${i.selectedLength}`;
        }
        if (i.selectedComplements && i.selectedComplements.length > 0) {
          text += `%0A  + Complementos: ${i.selectedComplements.map(c => c.name).join(', ')}`;
        }
        return text;
      }).join('%0A');
      const message = `*Olá, Deborah! Novo Pedido realizado no site!*%0A%0A*Pedido ID:* ${docRef.id}%0A*Cliente:* ${formData.name}%0A*Telefone:* ${formData.phone}%0A%0A*Itens:*%0A${itemsList}%0A%0A*Total:* R$ ${(total).toFixed(2)} (Frete R$ ${(shippingCost).toFixed(2)})%0A%0A*Endereço:*%0A${formData.street}, ${formData.number} - ${formData.neighborhood}%0A${formData.city}/${formData.state} - CEP: ${formData.cep}`;
      
      const whatsappNumber = settings?.whatsapp || '5577999110250';
      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
      
      setSubmittedDetails({
        total: total,
        pixKey: settings?.pixKey || '66366255000180'
      });
      
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 px-6">
        <div className="relative">
          <ShoppingBag size={80} strokeWidth={0.5} className="text-brand-accent/20" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-2 -right-2 text-brand-accent"
          >
            <Sparkle size={20} />
          </motion.div>
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-serif text-brand-dark">Sua sacola está vazia</h2>
          <p className="text-brand-muted text-sm tracking-widest max-w-xs mx-auto">Comece a preenchê-la com nossas peças exclusivas banhadas em sentimentos.</p>
        </div>
        <Link to="/" className="button-primary px-12">Explorar Coleção</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-12 py-16">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div 
            key="checkout"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-16"
          >
            {/* Form Side */}
            <div className="lg:col-span-7 space-y-12">
              <div className="flex flex-col gap-6">
                <Link to="/" className="flex items-center gap-2 text-brand-muted hover:text-brand-dark transition-colors group w-fit">
                  <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  <span className="text-[10px] uppercase tracking-[0.3em] font-medium">Voltar para a Coleção</span>
                </Link>
                <div className="space-y-2">
                   <p className="text-[10px] uppercase tracking-[0.5em] font-medium text-brand-accent">Início do Pedido</p>
                   <h1 className="text-4xl md:text-5xl font-serif text-brand-dark leading-tight">Finalização <br /> <span className="italic">Exclusiva</span></h1>
                </div>
              </div>

              <form onSubmit={handleSubmitOrder} className="space-y-16">
                {/* 1. Personal Details */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4 text-brand-dark">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full border border-brand-accent/30 text-[10px] font-bold text-brand-accent">01</span>
                    <h2 className="text-[11px] uppercase tracking-[0.4em] font-bold">Dados de Contato</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-brand-muted ml-1">Nome Completo</label>
                      <input 
                        required
                        placeholder="Ex: Maria Clara Silva"
                        className="w-full bg-transparent border-b border-black/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-[13px] font-medium"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-brand-muted ml-1">WhatsApp</label>
                      <input 
                        required
                        className="w-full bg-transparent border-b border-black/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-[13px] font-medium"
                        placeholder="77 99999-9999"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </section>

                {/* 2. Shipping Address */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4 text-brand-dark">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full border border-brand-accent/30 text-[10px] font-bold text-brand-accent">02</span>
                    <h2 className="text-[11px] uppercase tracking-[0.4em] font-bold">Endereço de Entrega</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-4 space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-brand-muted ml-1">CEP</label>
                      <input 
                        required
                        className="w-full bg-transparent border-b border-brand-dark/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-[13px] font-medium"
                        placeholder="00000-000"
                        maxLength={8}
                        value={formData.cep}
                        onChange={e => setFormData({ ...formData, cep: e.target.value.replace(/\D/g, '') })}
                        onBlur={handleCepBlur}
                      />
                    </div>
                    <div className="md:col-span-8 space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-brand-muted ml-1">Rua / Av.</label>
                      <input 
                        required
                        className="w-full bg-transparent border-b border-brand-dark/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-[13px] font-medium"
                        value={formData.street}
                        onChange={e => setFormData({ ...formData, street: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-brand-muted ml-1">Número</label>
                      <input 
                        required
                        className="w-full bg-transparent border-b border-brand-dark/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-[13px] font-medium"
                        value={formData.number}
                        onChange={e => setFormData({ ...formData, number: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-9 space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-brand-muted ml-1">Bairro</label>
                      <input 
                        required
                        className="w-full bg-transparent border-b border-brand-dark/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-[13px] font-medium"
                        value={formData.neighborhood}
                        onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-8 space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-brand-muted ml-1">Cidade</label>
                      <input 
                        required
                        readOnly
                        className="w-full bg-neutral-50/50 border-b border-brand-dark/10 py-3 focus:outline-none text-[13px] font-medium text-brand-muted"
                        value={formData.city}
                      />
                    </div>
                    <div className="md:col-span-4 space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-brand-muted ml-1">Estado</label>
                      <input 
                        required
                        readOnly
                        className="w-full bg-neutral-50/50 border-b border-brand-dark/10 py-3 focus:outline-none text-[13px] font-medium text-brand-muted"
                        value={formData.state}
                      />
                    </div>
                  </div>
                </section>

                {/* 3. Payment Selection */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4 text-brand-dark">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full border border-brand-accent/30 text-[10px] font-bold text-brand-accent">03</span>
                    <h2 className="text-[11px] uppercase tracking-[0.4em] font-bold">Forma de Atendimento</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 border border-brand-accent p-6 bg-neutral-50 relative">
                      <QrCode size={20} strokeWidth={1} className="text-brand-accent" />
                      <div className="flex-grow">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-dark">PIX / Transferência</p>
                        <p className="text-[9px] text-brand-muted mt-1 underline underline-offset-4 decoration-brand-accent/30 italic">Liberação instantânea</p>
                      </div>
                      <CheckCircle2 size={16} className="text-brand-accent absolute top-4 right-4" />
                    </div>
                    <div className="flex items-center gap-4 border border-brand-dark/5 p-6 opacity-40 grayscale pointer-events-none">
                      <CreditCard size={20} strokeWidth={1} />
                      <div className="flex-grow">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-dark">Cartão de Crédito</p>
                        <p className="text-[9px] mt-1 text-brand-muted">Em breve disponível</p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="space-y-6">
                   <button 
                    type="submit" 
                    disabled={loading || calculatingShipping || !formData.cep}
                    className="button-primary w-full h-16 text-sm flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed group transition-all"
                  >
                    {loading ? (
                      <span className="animate-pulse">Eternizando seu pedido...</span>
                    ) : (
                      <>
                        Confirmar & Central de WhatsApp
                        <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                           <Truck size={18} strokeWidth={1.5} />
                        </motion.div>
                      </>
                    )}
                  </button>
                  <p className="text-[9px] text-center text-brand-muted uppercase tracking-[0.3em] font-medium">
                     Ambiente de pagamento 100% seguro & criptografado
                  </p>
                </div>
              </form>
            </div>

            {/* Summary Side */}
            <aside className="lg:col-span-5 lg:sticky lg:top-36 self-start space-y-10">
              <div className="border border-black/5 p-10 space-y-10">
                <div className="space-y-2">
                   <h3 className="text-[11px] uppercase tracking-[0.5em] font-bold text-brand-dark">Resumo da Sacola</h3>
                   <div className="w-8 h-[1px] bg-brand-accent" />
                </div>
                
                <div className="space-y-8 max-h-[350px] overflow-y-auto thin-scrollbar pr-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="w-16 h-20 bg-neutral-50 overflow-hidden shrink-0">
                         <img src={item.imageUrl || undefined} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow space-y-1">
                        <div className="flex justify-between items-start">
                           <p className="text-[10px] uppercase tracking-widest font-bold text-brand-dark leading-tight">{item.name}</p>
                           <p className="text-[11px] font-medium text-brand-dark">{(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                        <div className="flex items-center gap-2 text-brand-muted text-[9px] font-medium uppercase tracking-widest">
                           <span>Qtd: {item.quantity}</span>
                           {item.selectedLength && (
                             <>
                               <div className="w-1 h-1 rounded-full bg-brand-accent/30" />
                               <span>Tam: {item.selectedLength}</span>
                             </>
                           )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-8 border-t border-black/5">
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] font-medium text-brand-muted">
                    <span>Subtotal</span>
                    <span>{(subtotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] font-medium text-brand-muted">
                    <span>Envio Estimado</span>
                    <span>
                      {calculatingShipping ? (
                        <span className="animate-pulse">Calculando...</span>
                      ) : (
                        shippingCost > 0 ? (shippingCost).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Grátis'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-6 border-t border-brand-accent/20">
                    <span className="text-xl font-serif text-brand-dark italic">Total</span>
                    <span className="text-2xl font-bold text-brand-dark">
                      {(total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-neutral-50/80 border border-brand-accent/10">
                 <ShieldCheck size={20} strokeWidth={1} className="text-brand-accent mt-0.5 shrink-0" />
                 <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-brand-dark">Proteção & Logística</p>
                    <p className="text-[9px] leading-relaxed text-brand-muted font-medium">Asseguramos que sua peça chegue com todo o cuidado necessário. Enviamos o código de rastreamento via WhatsApp.</p>
                 </div>
              </div>
            </aside>
          </motion.div>
        ) : (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center space-y-12 py-10"
          >
            <div className="space-y-6">
               <motion.div 
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                 className="w-24 h-24 bg-neutral-50 text-brand-accent rounded-full flex items-center justify-center mx-auto"
               >
                 <CheckCircle2 size={48} strokeWidth={1} />
               </motion.div>
               <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.6em] font-medium text-brand-accent">Pedido Recebido</p>
                  <h1 className="text-5xl font-serif text-brand-dark">Brilho a <span className="italic">Caminho</span></h1>
                  <p className="text-brand-muted text-sm font-light tracking-[0.05em] max-w-sm mx-auto">Tudo certo! Sua peça exclusiva está sendo separada com todo o amor por nossa equipe.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-black/5 shadow-2xl overflow-hidden bg-white">
              <div className="p-10 space-y-8 text-left border-b md:border-b-0 md:border-r border-black/5">
                <div className="space-y-2">
                   <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-brand-muted">Instruções de Pagamento</p>
                   <h3 className="text-xl font-serif text-brand-dark">Pagamento Instantâneo PIX</h3>
                </div>
                
                <div className="space-y-5">
                   <div className="space-y-1">
                      <p className="text-[8px] uppercase tracking-[0.4em] font-medium text-brand-muted">Chave CNPJ</p>
                      <p className="font-mono text-sm font-bold text-brand-dark select-all p-3 bg-neutral-50 border border-neutral-100 rounded">
                        {submittedDetails?.pixKey.includes('/') ? submittedDetails.pixKey : '66.366.255/0001-80'}
                      </p>
                   </div>
                   <div className="flex justify-between items-center bg-brand-dark text-white p-4">
                      <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-brand-accent">Valor Total</span>
                      <span className="text-lg font-bold">{(submittedDetails?.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                   </div>
                   <p className="text-[9px] italic text-brand-muted leading-relaxed">
                      * Por favor, após o pagamento <span className="font-bold text-brand-dark">envie o comprovante</span> na nossa conversa de WhatsApp que abriu. Isso agiliza o seu envio!
                   </p>
                </div>
              </div>

              <div className="p-10 flex flex-col items-center justify-center space-y-6 bg-neutral-50/30">
                <div className="bg-white p-6 shadow-xl border border-black/5">
                  {(() => {
                    const finalTotal = submittedDetails?.total || 0;
                    const rawPixKey = (submittedDetails?.pixKey || '66366255000180').replace(/\D/g, '');
                    const amount = finalTotal.toFixed(2);
                    const amountLen = amount.length.toString().padStart(2, '0');
                    const cityName = settings?.city?.substring(0, 15) || "Guanambi";
                    const cityNameLen = cityName.length.toString().padStart(2, "0");
                    const pixPayload = `00020126360014BR.GOV.BCB.PIX0114${rawPixKey}52040000530398654${amountLen}${amount}5802BR5915Deborah Evellyn60${cityNameLen}${cityName}62070503***6304`;
                    return <QRCodeSVG value={pixPayload} size={220} />;
                  })()}
                </div>
                <p className="text-[10px] uppercase tracking-[0.4em] font-medium text-brand-muted">Escaneie para Pagar</p>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/')}
              className="button-outline px-16 group"
            >
              Retornar à Boutique
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
