import { useState, useEffect, FormEvent } from 'react';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Product, Category, SubCategory, Order, Settings, Complement } from '../types';
import { motion } from 'motion/react';
import { Plus, Trash2, Edit, Save, X, ShoppingBag, Grid, Settings as SettingsIcon, Package, LogOut, Upload, Image as ImageIcon, ClipboardList, Tag } from 'lucide-react';
import { cn } from '../lib/utils';

export function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<'products' | 'categories' | 'orders' | 'settings'>('products');
  const [loading, setLoading] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  // Form States
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<{
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    categoryId: string;
    subCategoryId: string;
    featured: boolean;
    active: boolean;
    hasLength: boolean;
    complements: Complement[];
  }>({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    categoryId: '',
    subCategoryId: '',
    featured: false,
    active: true,
    hasLength: false,
    complements: []
  });

  const [categoryName, setCategoryName] = useState('');
  const [subCategoryForm, setSubCategoryForm] = useState({ name: '', categoryId: '' });
  const [settingsForm, setSettingsForm] = useState<Settings>({
    whatsapp: '',
    instagram: '',
    facebook: '',
    email: 'debosantos1101@gmail.com',
    cnpj: '',
    ownerName: '',
    pixKey: '',
    city: 'Guanambi',
    state: 'BA',
    logoUrl: 'https://i.postimg.cc/zXRgnSG6/Captura-de-tela-2026-04-20-205007.png',
    heroImageUrl: '',
    freeShippingThreshold: 0
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    const onError = (err: any) => {
      console.error("Firestore snapshot error:", err);
      if (err.code === 'permission-denied') {
        setError('Você não tem permissão para acessar alguns dados. Verifique se seu e-mail está autorizado no console do Firebase.');
      }
    };

    const unsubProducts = onSnapshot(collection(db, 'products'), {
      next: (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as Product))),
      error: onError
    });
    
    const unsubCategories = onSnapshot(collection(db, 'categories'), {
      next: (s) => setCategories(s.docs.map(d => ({ id: d.id, ...d.data() } as Category))),
      error: onError
    });
    
    const unsubSub = onSnapshot(collection(db, 'sub_categories'), {
      next: (s) => setSubCategories(s.docs.map(d => ({ id: d.id, ...d.data() } as SubCategory))),
      error: onError
    });
    
    const unsubOrders = onSnapshot(collection(db, 'orders'), {
      next: (s) => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() } as Order))),
      error: onError
    });
    
    const unsubSettings = onSnapshot(collection(db, 'settings'), {
      next: (s) => {
        if (!s.empty) {
          const data = { id: s.docs[0].id, ...s.docs[0].data() } as Settings;
          setSettings(data);
          setSettingsForm(data);
        }
      },
      error: onError
    });
    
    return () => {
      unsubProducts();
      unsubCategories();
      unsubSub();
      unsubOrders();
      unsubSettings();
    };
  }, [user]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      console.error('Login failed', e);
      setError('E-mail ou senha incorretos.');
    }
  };

  const saveProduct = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const data = { ...productForm, createdAt: serverTimestamp() };
    
    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), data);
      } else {
        await addDoc(collection(db, 'products'), data);
      }
      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({ name: '', description: '', price: 0, imageUrl: '', categoryId: '', subCategoryId: '', featured: false, active: true, hasLength: false, complements: [] });
    } catch (err: any) {
      console.error("Save failed:", err);
      setError('Erro ao salvar produto. Verifique suas permissões de administrador.');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    setError('');
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err: any) {
      console.error("Delete failed:", err);
      alert('Erro ao excluir: Você não tem permissão de administrador.');
      setError('Erro ao excluir: Verifique se seu usuário é um administrador.');
    }
  };

  const addCategory = async () => {
    if (!categoryName) return;
    setError('');
    try {
      await addDoc(collection(db, 'categories'), { name: categoryName });
      setCategoryName('');
    } catch (err: any) {
      setError('Erro ao adicionar categoria: Verifique suas permissões.');
    }
  };

  const addSubCategory = async () => {
    if (!subCategoryForm.name || !subCategoryForm.categoryId) return;
    setError('');
    try {
      await addDoc(collection(db, 'sub_categories'), subCategoryForm);
      setSubCategoryForm({ name: '', categoryId: '' });
    } catch (err: any) {
      setError('Erro ao adicionar subcategoria: Verifique suas permissões.');
    }
  };

  const seedDefaultCategories = async () => {
    if (!confirm('Deseja pré-cadastrar as categorias padrão de semijoias? Isso adicionará Brincos, Colares, Anéis, etc.')) return;
    
    const defaults = [
      { name: 'Brincos', subs: ['Argolas', 'Ear Cuffs', 'Ear Jackets', 'Pequenos/Delicados', 'Pendentes/Festa'] },
      { name: 'Colares', subs: ['Chokers', 'Longos', 'Com Pingente', 'Gravatinhas'] },
      { name: 'Pulseiras', subs: ['Rígidas (Braceletes)', 'Elos/Correntaria', 'Com Berloques'] },
      { name: 'Anéis', subs: ['Solitários', 'Alianças', 'Ajustáveis', 'Aparadores'] },
      { name: 'Personalizados', subs: ['Nomes/Iniciais', 'Foto Gravação', 'Dados de Nascimento'] },
      { name: 'Conjuntos', subs: ['Colar + Brinco', 'Pulseira + Anel'] },
      { name: 'Tornozeleiras', subs: ['Simples', 'Com Pingentes'] },
      { name: 'Linha Infantil', subs: ['Brincos Baby', 'Pulseiras Nome'] }
    ];

    try {
      for (const cat of defaults) {
        // Only if name doesn't exist already in the local state to be safe
        if (!categories.find(c => c.name === cat.name)) {
          const docRef = await addDoc(collection(db, 'categories'), { name: cat.name });
          for (const sub of cat.subs) {
             await addDoc(collection(db, 'sub_categories'), { name: sub, categoryId: docRef.id });
          }
        }
      }
      alert('Categorias pré-cadastradas com sucesso!');
    } catch (e) {
      console.error(e);
      alert('Ocorreu um erro ao cadastrar.');
    }
  };

  const saveSettings = async () => {
    setError('');
    try {
      if (settings?.id) {
        await updateDoc(doc(db, 'settings', settings.id), { ...settingsForm });
      } else {
        await addDoc(collection(db, 'settings'), { ...settingsForm });
      }
      alert('Configurações salvas com sucesso!');
    } catch (err: any) {
      console.error('Settings save failed', err);
      setError('Erro ao salvar configurações. Verifique suas permissões.');
      alert('Erro ao salvar: Verifique se você é um administrador.');
    }
  };

  const addComplementToForm = () => {
    const newComplement: Complement = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      imageUrl: '',
      price: 0
    };
    setProductForm({ ...productForm, complements: [...productForm.complements, newComplement] });
  };

  const updateComplementInForm = (id: string, field: keyof Complement, value: any) => {
    const updated = productForm.complements.map(c => c.id === id ? { ...c, [field]: value } : c);
    setProductForm({ ...productForm, complements: updated });
  };

  const removeComplementFromForm = (id: string) => {
    setProductForm({ ...productForm, complements: productForm.complements.filter(c => c.id !== id) });
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-serif text-[#B17A7A]">Carregando...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-12 md:p-16 rounded-3xl shadow-xl w-full max-w-md text-center space-y-10 border border-brand-dark/5"
        >
          <div className="space-y-4">
            <h1 className="text-4xl font-serif text-brand-dark italic">Loja <br /> <span className="not-italic font-normal">Admin</span></h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-brand-muted font-bold">Acesso Exclusivo</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6 text-left">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-brand-dark uppercase tracking-widest ml-1">E-mail Corporativo</label>
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-brand-dark/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-sm font-medium"
                  placeholder="admin@deborahjoias.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-brand-dark uppercase tracking-widest ml-1">Senha de Segurança</label>
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-brand-dark/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-sm font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-[9px] uppercase tracking-widest font-bold">{error}</p>}

            <button 
              type="submit"
              className="button-primary w-full py-5 text-[11px]"
            >
              Autenticar
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-white p-12 flex flex-col gap-16 shrink-0 h-screen sticky top-0 border-r border-brand-dark/5">
        <div className="space-y-2">
          <h2 className="font-serif text-2xl text-brand-dark">Painel de <br /> <span className="italic">Gestão</span></h2>
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
             <span className="text-[9px] uppercase tracking-widest font-bold text-brand-muted truncate max-w-[150px]">{user?.email}</span>
          </div>
        </div>

        <nav className="flex flex-col gap-4">
          <button 
            onClick={() => setTab('products')}
            className={cn("flex items-center gap-4 text-[11px] uppercase tracking-[0.2em] font-bold transition-all p-2 -ml-2", tab === 'products' ? "text-brand-dark border-r-2 border-brand-accent" : "text-brand-muted hover:text-brand-dark")}
          >
            <ShoppingBag size={18} strokeWidth={1.5} /> Catálogo
          </button>
          <button 
            onClick={() => setTab('categories')}
            className={cn("flex items-center gap-4 text-[11px] uppercase tracking-[0.2em] font-bold transition-all p-2 -ml-2", tab === 'categories' ? "text-brand-dark border-r-2 border-brand-accent" : "text-brand-muted hover:text-brand-dark")}
          >
            <Grid size={18} strokeWidth={1.5} /> Categorias
          </button>
          <button 
            onClick={() => setTab('orders')}
            className={cn("flex items-center gap-4 text-[11px] uppercase tracking-[0.2em] font-bold transition-all p-2 -ml-2", tab === 'orders' ? "text-brand-dark border-r-2 border-brand-accent" : "text-brand-muted hover:text-brand-dark")}
          >
            <Package size={18} strokeWidth={1.5} /> Pedidos
          </button>
          <button 
            onClick={() => setTab('settings')}
            className={cn("flex items-center gap-4 text-[11px] uppercase tracking-[0.2em] font-bold transition-all p-2 -ml-2", tab === 'settings' ? "text-brand-dark border-r-2 border-brand-accent" : "text-brand-muted hover:text-brand-dark")}
          >
            <SettingsIcon size={18} strokeWidth={1.5} /> Ajustes
          </button>
        </nav>

        <div className="mt-auto">
          <button onClick={() => auth.signOut()} className="flex items-center gap-4 text-[11px] uppercase tracking-[0.2em] font-bold text-red-400 hover:text-red-500 transition-colors p-2 -ml-2">
            <LogOut size={18} strokeWidth={1.5} /> Encerrar
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-grow p-16 overflow-y-auto">
        {tab === 'products' && (
          <div className="space-y-12 max-w-6xl">
            <div className="flex justify-between items-end border-b border-black/5 pb-8">
              <div className="space-y-1">
                <h1 className="text-4xl font-serif text-brand-dark">Catálogo</h1>
                <p className="text-[10px] uppercase tracking-[0.3em] text-brand-muted font-bold">Gestão de Inventário Premium</p>
              </div>
              <button 
                onClick={() => { setShowProductForm(true); setEditingProduct(null); }}
                className="button-primary px-8 py-4 text-[10px]"
              >
                <Plus size={16} strokeWidth={1.5} className="mr-2" /> Adicionar Peça
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {products.map(p => (
                <div key={p.id} className="group bg-white p-6 rounded-2xl border border-black/5 hover:border-brand-accent/30 transition-all flex border-transparent hover:shadow-xl hover:shadow-black/5">
                  <div className="w-24 h-32 shrink-0 bg-neutral-100 rounded-lg overflow-hidden border border-black/5">
                    <img src={p.imageUrl || undefined} alt={p.name} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500" />
                  </div>
                  <div className="flex-grow flex flex-col justify-between pl-6 py-1">
                    <div className="space-y-1">
                      <h3 className="font-serif text-lg text-brand-dark truncate">{p.name}</h3>
                      <p className="text-[11px] font-bold text-brand-accent">{(p.price/100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <div className="flex gap-4 pt-4 border-t border-black/5 mt-4">
                       <button 
                        onClick={() => {
                          setEditingProduct(p);
                          setProductForm({ ...p });
                          setShowProductForm(true);
                        }}
                        className="text-brand-muted hover:text-brand-dark transition-colors uppercase text-[9px] font-bold tracking-widest flex items-center gap-1"
                       >
                         <Edit size={12} /> Editar
                       </button>
                       <button onClick={() => deleteProduct(p.id)} className="text-red-300 hover:text-red-500 transition-colors uppercase text-[9px] font-bold tracking-widest flex items-center gap-1">
                         <Trash2 size={12} /> Remover
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl">
             <div className="bg-white p-10 rounded-3xl border border-black/5 space-y-10 self-start">
               <div className="flex items-center justify-between border-b border-black/5 pb-6">
                 <div className="space-y-1">
                   <h2 className="text-2xl font-serif text-brand-dark italic">Categorias</h2>
                   <p className="text-[9px] uppercase tracking-widest text-brand-muted font-bold">Estrutura Principal</p>
                 </div>
                 {categories.length === 0 && (
                   <button 
                    onClick={seedDefaultCategories}
                    className="text-[9px] font-bold text-brand-accent border border-brand-accent/20 px-4 py-1.5 rounded-full uppercase tracking-widest hover:bg-brand-accent hover:text-white transition-all shadow-sm"
                   >
                     Reset Padrão
                   </button>
                 )}
               </div>
               <div className="flex gap-4">
                 <input 
                  className="flex-grow bg-transparent border-b border-black/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-sm font-medium" 
                  placeholder="Nova Categoria" 
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                 />
                 <button onClick={addCategory} className="bg-brand-dark text-white p-3 rounded-lg hover:bg-brand-accent transition-colors shadow-md shadow-brand-dark/10"><Plus size={18} /></button>
               </div>
               <div className="space-y-1 bg-neutral-50 p-2 rounded-2xl border border-black/5">
                 {categories.map(c => (
                   <div key={c.id} className="bg-white p-4 rounded-xl border border-black/5 flex justify-between items-center group transition-all hover:bg-neutral-50 shadow-sm border-transparent">
                     <span className="uppercase tracking-[0.2em] text-[10px] font-bold text-brand-dark">{c.name}</span>
                     <button onClick={() => deleteDoc(doc(db, 'categories', c.id))} className="text-red-200 hover:text-red-500 transition-colors">
                       <Trash2 size={14}/>
                     </button>
                   </div>
                 ))}
               </div>
             </div>

             <div className="bg-white p-10 rounded-3xl border border-black/5 space-y-10">
               <div className="space-y-1 border-b border-black/5 pb-6">
                 <h2 className="text-2xl font-serif text-brand-dark italic">Subcategorias</h2>
                 <p className="text-[9px] uppercase tracking-widest text-brand-muted font-bold">Nível de Detalhamento</p>
               </div>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-brand-muted uppercase tracking-widest ml-1">Vincular a Categoria</label>
                    <select 
                      className="w-full bg-transparent border-b border-black/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-sm font-medium"
                      value={subCategoryForm.categoryId}
                      onChange={e => setSubCategoryForm({...subCategoryForm, categoryId: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <input 
                      className="flex-grow bg-transparent border-b border-black/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-sm font-medium" 
                      placeholder="Nome da Subcategoria" 
                      value={subCategoryForm.name}
                      onChange={e => setSubCategoryForm({...subCategoryForm, name: e.target.value})}
                    />
                    <button onClick={addSubCategory} className="bg-brand-dark text-white p-3 rounded-lg hover:bg-brand-accent transition-colors shadow-md shadow-brand-dark/10"><Plus size={18} /></button>
                  </div>
               </div>
               <div className="space-y-6 pt-4">
                 {categories.map(cat => (
                   <div key={cat.id} className="space-y-3">
                     <h3 className="text-[9px] uppercase tracking-[0.3em] font-bold text-brand-accent border-l-2 border-brand-accent pl-3">{cat.name}</h3>
                     <div className="grid grid-cols-1 gap-2 pl-4">
                       {subCategories.filter(s => s.categoryId === cat.id).map(s => (
                         <div key={s.id} className="bg-neutral-50 p-3 rounded-xl border border-black/5 flex justify-between items-center text-[10px] font-semibold text-brand-dark tracking-wide">
                           {s.name}
                           <button onClick={() => deleteDoc(doc(db, 'sub_categories', s.id))} className="text-red-200 hover:text-red-500 transition-colors">
                             <Trash2 size={12}/>
                           </button>
                         </div>
                       ))}
                       {subCategories.filter(s => s.categoryId === cat.id).length === 0 && (
                         <p className="text-[9px] text-brand-muted italic opacity-50">Vazio.</p>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        )}

        {tab === 'orders' && (
          <div className="space-y-12 max-w-6xl">
            <div className="space-y-1 border-b border-black/5 pb-8">
              <h1 className="text-4xl font-serif text-brand-dark">Reservas & Pedidos</h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-brand-muted font-bold">Fluxo de Vendas e Atendimento</p>
            </div>
            <div className="grid grid-cols-1 gap-8">
              {orders.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds).map(o => (
                <div key={o.id} className="bg-white p-10 rounded-3xl border border-black/5 space-y-8 shadow-sm hover:shadow-xl transition-all border-transparent">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                       <p className="text-[10px] uppercase tracking-widest font-bold text-brand-accent italic">Pedido #{(o.id || '').slice(-6).toUpperCase()}</p>
                      <h3 className="text-2xl font-serif text-brand-dark">{o.customerName}</h3>
                      <div className="flex gap-4">
                        <span className="text-[11px] font-bold text-brand-muted flex items-center gap-1"><Package size={12} strokeWidth={1.5} /> {o.customerPhone}</span>
                      </div>
                    </div>
                    <span className="bg-black text-white px-5 py-2 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-black/20">{o.status}</span>
                  </div>
                  <div className="bg-neutral-50 rounded-2xl p-8 space-y-6">
                    {o.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center border-b border-black/5 last:border-0 pb-6 last:pb-0">
                        <div className="space-y-2">
                          <div className="font-serif text-lg text-brand-dark">{item.quantity}x {item.name}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                            {item.selectedComplements && item.selectedComplements.length > 0 && (
                              <div className="text-[10px] text-brand-muted font-bold uppercase tracking-wide">
                                <span className="opacity-50">+</span> {item.selectedComplements.map(c => c.name).join(', ')}
                              </div>
                            )}
                            {item.personalization && (
                              <div className="text-[10px] text-brand-accent font-bold uppercase tracking-wide">
                                Personalização: {item.personalization}
                              </div>
                            )}
                            {item.selectedLength && (
                              <div className="text-[10px] text-brand-accent font-bold uppercase tracking-wide">
                                Tamanho: {item.selectedLength}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-brand-dark">{(item.price * item.quantity / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="space-y-1">
                       <p className="text-[10px] uppercase tracking-widest text-brand-muted font-bold">Investimento Total</p>
                       <span className="text-2xl font-serif text-brand-dark">{(o.total / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <button className="button-outline px-8 truncate text-[10px] w-auto">Detalhes Internos</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="max-w-2xl space-y-12">
            <div className="space-y-1 border-b border-black/5 pb-8">
              <h1 className="text-4xl font-serif text-brand-dark">Ajustes</h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-brand-muted font-bold">Configurações de Identidade e Contato</p>
            </div>
            
            <div className="grid grid-cols-1 gap-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-brand-dark uppercase tracking-widest block ml-1">WhatsApp de Vendas</label>
                  <input 
                    className="w-full bg-transparent border-b border-black/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-sm font-medium"
                    placeholder="5577999999999"
                    value={settingsForm.whatsapp}
                    onChange={e => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-brand-dark uppercase tracking-widest block ml-1">E-mail de Contato</label>
                  <input 
                    className="w-full bg-transparent border-b border-black/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-sm font-medium"
                    placeholder="email@exemplo.com"
                    value={settingsForm.email}
                    onChange={e => setSettingsForm({ ...settingsForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-brand-dark uppercase tracking-widest block ml-1">Cidade</label>
                  <input 
                    className="w-full bg-transparent border-b border-black/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-sm font-medium"
                    placeholder="Cidade"
                    value={settingsForm.city}
                    onChange={e => setSettingsForm({ ...settingsForm, city: e.target.value })}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-brand-dark uppercase tracking-widest block ml-1">Estado (UF)</label>
                  <input 
                    className="w-full bg-transparent border-b border-black/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-sm font-medium"
                    placeholder="Ex: BA"
                    maxLength={2}
                    value={settingsForm.state}
                    onChange={e => setSettingsForm({ ...settingsForm, state: e.target.value })}
                  />
                </div>
                <div className="space-y-4 col-span-2">
                  <label className="text-[10px] font-bold text-brand-dark uppercase tracking-widest block ml-1">Foto Principal / Banner (URL)</label>
                  <div className="flex gap-4 items-end">
                    <input 
                      className="flex-grow bg-transparent border-b border-black/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-sm font-medium"
                      placeholder="https://suaimagem.com/foto.jpg"
                      value={settingsForm.heroImageUrl}
                      onChange={e => setSettingsForm({ ...settingsForm, heroImageUrl: e.target.value })}
                    />
                    <div className="w-16 h-10 bg-neutral-100 rounded border border-black/5 flex items-center justify-center overflow-hidden">
                      {settingsForm.heroImageUrl ? <img src={settingsForm.heroImageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-brand-muted opacity-30"/>}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-brand-dark uppercase tracking-widest block ml-1">Instagram (@)</label>
                  <input 
                    className="w-full bg-transparent border-b border-black/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-sm font-medium"
                    placeholder="https://instagram.com/sualoja"
                    value={settingsForm.instagram}
                    onChange={e => setSettingsForm({ ...settingsForm, instagram: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-8 p-10 bg-white rounded-3xl border border-black/5">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-brand-dark uppercase tracking-widest block ml-1">Chave PIX (CNPJ Preferencial)</label>
                    <input 
                      className="w-full bg-transparent border-b border-black/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-sm font-medium"
                      value={settingsForm.pixKey}
                      onChange={e => setSettingsForm({ ...settingsForm, pixKey: e.target.value })}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-brand-dark uppercase tracking-widest block ml-1">CNPJ Oficial</label>
                    <input 
                      className="w-full bg-transparent border-b border-black/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-sm font-medium"
                      value={settingsForm.cnpj}
                      onChange={e => setSettingsForm({ ...settingsForm, cnpj: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-brand-dark uppercase tracking-widest block ml-1">Limiar de Frete Grátis (R$)</label>
                  <input 
                    type="number"
                    className="w-full bg-transparent border-b border-black/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-sm font-medium font-serif text-lg"
                    value={settingsForm.freeShippingThreshold}
                    onChange={e => setSettingsForm({ ...settingsForm, freeShippingThreshold: Number(e.target.value) })}
                  />
                </div>
              </div>

              <button 
                onClick={saveSettings}
                className="button-primary w-full py-5 text-[11px]"
              >
                Atualizar Preferências
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Product Modal */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-brand-dark/20 backdrop-blur-md"
            onClick={() => setShowProductForm(false)}
          />
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white w-full max-w-2xl rounded-3xl p-12 max-h-[90vh] overflow-y-auto space-y-10 relative z-10 shadow-2xl"
          >
            <div className="flex justify-between items-end border-b border-black/5 pb-8">
              <div className="space-y-1">
                <h2 className="text-3xl font-serif text-brand-dark">{editingProduct ? 'Ajustar' : 'Nova'} <span className="italic">Criação</span></h2>
                <p className="text-[9px] uppercase tracking-widest text-brand-muted font-bold">Ficha Técnica do Produto</p>
              </div>
              <button onClick={() => setShowProductForm(false)} className="p-2 hover:rotate-90 transition-transform"><X size={20}/></button>
            </div>

            <form onSubmit={saveProduct} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-brand-dark uppercase tracking-widest block ml-1">Designação da Peça</label>
                  <input required className="w-full bg-transparent border-b border-black/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-sm font-medium" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-brand-dark uppercase tracking-widest block ml-1">Narrativa / Descrição</label>
                  <textarea className="w-full bg-transparent border-b border-black/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-sm font-medium h-20 resize-none" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-brand-dark uppercase tracking-widest block ml-1">Valor de Mercado (R$)</label>
                  <input type="number" step="0.01" required className="w-full bg-transparent border-b border-black/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-lg font-serif" value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-brand-dark uppercase tracking-widest block ml-1">Arquitetura / Categoria</label>
                   <select required className="w-full bg-transparent border-b border-black/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-sm font-medium h-[45px]" value={productForm.categoryId} onChange={e => setProductForm({...productForm, categoryId: e.target.value})}>
                      <option value="">Definir...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-brand-dark uppercase tracking-widest block ml-1">Segmento / Subcategoria</label>
                   <select 
                    className="w-full bg-transparent border-b border-black/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-sm font-medium h-[45px]"
                    value={productForm.subCategoryId} 
                    onChange={e => setProductForm({...productForm, subCategoryId: e.target.value})}
                   >
                      <option value="">Nenhum</option>
                      {subCategories.filter(s => s.categoryId === productForm.categoryId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-brand-dark uppercase tracking-widest block ml-1">Referência Visual (URL)</label>
                  <div className="flex gap-4 items-end">
                    <input required className="flex-grow bg-transparent border-b border-black/10 py-3 focus:border-brand-accent transition-colors focus:outline-none text-xs font-medium" value={productForm.imageUrl} onChange={e => setProductForm({...productForm, imageUrl: e.target.value})} />
                    <div className="w-10 h-10 bg-neutral-100 rounded border border-black/5 flex items-center justify-center overflow-hidden">
                      {productForm.imageUrl ? <img src={productForm.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-brand-muted opacity-30"/>}
                    </div>
                  </div>
                </div>

                <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  <div className="flex items-center gap-3 bg-neutral-50 p-4 rounded-xl border border-black/5 hover:bg-white transition-colors cursor-pointer" onClick={() => setProductForm({...productForm, featured: !productForm.featured})}>
                    <div className={cn("w-4 h-4 rounded border border-black/20 flex items-center justify-center", productForm.featured && "bg-brand-accent border-brand-accent")}>
                      {productForm.featured && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <label className="text-[9px] font-bold text-brand-dark uppercase tracking-widest select-none cursor-pointer">Destaque Editorial</label>
                  </div>
                  <div className="flex items-center gap-3 bg-neutral-50 p-4 rounded-xl border border-black/5 hover:bg-white transition-colors cursor-pointer" onClick={() => setProductForm({...productForm, hasLength: !productForm.hasLength})}>
                    <div className={cn("w-4 h-4 rounded border border-black/20 flex items-center justify-center", productForm.hasLength && "bg-brand-accent border-brand-accent")}>
                      {productForm.hasLength && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <label className="text-[9px] font-bold text-brand-dark uppercase tracking-widest select-none cursor-pointer">Opção de Tamanho</label>
                  </div>
                  <div className="flex items-center gap-3 bg-neutral-50 p-4 rounded-xl border border-black/5 hover:bg-white transition-colors cursor-pointer" onClick={() => setProductForm({...productForm, active: !productForm.active})}>
                    <div className={cn("w-4 h-4 rounded border border-black/20 flex items-center justify-center", productForm.active && "bg-brand-accent border-brand-accent")}>
                      {productForm.active && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <label className="text-[9px] font-bold text-brand-dark uppercase tracking-widest select-none cursor-pointer">Visível no Salão</label>
                  </div>
                </div>
              </div>

              {/* Complements Section */}
              <div className="space-y-6 pt-10 border-t border-black/5">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-lg font-serif text-brand-dark italic">Serviços & Adicionais</h3>
                    <p className="text-[9px] uppercase tracking-widest text-brand-muted font-bold">Personalização e Complementos</p>
                  </div>
                  <button type="button" onClick={addComplementToForm} className="text-[9px] font-bold text-brand-accent flex items-center gap-2 uppercase tracking-widest hover:text-brand-dark transition-colors border border-brand-accent/20 px-3 py-1.5 rounded-full shadow-sm">
                    <Plus size={14} /> Incluir Opção
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {productForm.complements.map((comp) => (
                    <div key={comp.id} className="grid grid-cols-[1fr_120px_1fr_40px] gap-6 items-end bg-neutral-50 p-6 rounded-2xl border border-black/5 shadow-sm">
                      <div className="space-y-2">
                        <label className="text-[8px] font-bold text-brand-muted uppercase tracking-widest ml-1">Título do Adicional</label>
                        <input 
                          placeholder="Ex: Embalagem para Presente" 
                          className="w-full bg-transparent border-b border-black/10 py-1.5 text-xs font-medium focus:border-brand-accent outline-none transition-colors"
                          value={comp.name}
                          onChange={e => updateComplementInForm(comp.id, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-bold text-brand-muted uppercase tracking-widest ml-1">Acréscimo (R$)</label>
                        <input 
                          type="number"
                          step="0.01"
                          placeholder="0,00" 
                          className="w-full bg-transparent border-b border-black/10 py-1.5 text-xs font-serif focus:border-brand-accent outline-none transition-colors"
                          value={comp.price}
                          onChange={e => updateComplementInForm(comp.id, 'price', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-bold text-brand-muted uppercase tracking-widest ml-1">URL da Imagem</label>
                        <input 
                          placeholder="https://..." 
                          className="w-full bg-transparent border-b border-black/10 py-1.5 text-[10px] font-medium focus:border-brand-accent outline-none transition-colors"
                          value={comp.imageUrl}
                          onChange={e => updateComplementInForm(comp.id, 'imageUrl', e.target.value)}
                        />
                      </div>
                      <button type="button" onClick={() => removeComplementFromForm(comp.id)} className="text-red-200 hover:text-red-500 transition-colors pb-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {productForm.complements.length === 0 && (
                    <div className="py-12 border-2 border-dashed border-black/5 rounded-3xl flex flex-col items-center justify-center space-y-2 opacity-40">
                      <Package size={24} strokeWidth={1} />
                      <p className="text-[10px] text-center font-bold uppercase tracking-widest">Nenhum adicional configurado.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-10 border-t border-black/5">
                <button type="submit" className="button-primary w-full py-6 text-[11px] shadow-2xl">
                  <Save size={18} strokeWidth={1.5} className="mr-3" /> Confirmar Alterações e Publicar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
