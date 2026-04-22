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
    cnpj: '',
    ownerName: '',
    pixKey: '',
    logoUrl: 'https://i.postimg.cc/DwTnbrYh/Captura-de-tela-2026-04-22-115752.png',
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
      <div className="min-h-screen bg-[#fcfaf7] flex items-center justify-center p-4">
        <div className="bg-white/70 backdrop-blur-[20px] p-12 rounded-[2.5rem] shadow-2xl border border-brand-gold/10 w-full max-w-md text-center space-y-8">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center mb-4">
              <span className="font-serif text-3xl font-bold text-black">D</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-black">Painel Administrativo</h1>
            <p className="text-xs text-black/60 uppercase tracking-widest font-bold mt-2">Acesso Restrito</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-black uppercase tracking-widest pl-2">E-mail</label>
              <input 
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white border border-brand-gold/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-pink/20 outline-none transition-all"
                placeholder="seu@email.com"
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-black uppercase tracking-widest pl-2">Senha</label>
              <input 
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white border border-brand-gold/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-pink/20 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{error}</p>}

            <button 
              type="submit"
              className="w-full bg-[#3C1A1A] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#B17A7A] transition-all uppercase tracking-widest text-xs shadow-lg"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfaf7] flex">
      {/* Sidebar */}
      <aside className="w-80 bg-white/70 backdrop-blur-[20px] p-10 flex flex-col gap-12 shrink-0 h-screen sticky top-0 border-r border-brand-gold/20 shadow-xl overflow-y-auto thin-scrollbar">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 border border-black rounded-full flex items-center justify-center">
              <span className="font-serif text-lg font-bold text-black">D</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold tracking-tight text-black leading-none">Admin</span>
              <span className="text-[9px] text-black/40 truncate max-w-[150px]">{user?.email}</span>
            </div>
        </div>

        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setTab('products')}
            className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-all", tab === 'products' ? "bg-black text-white" : "hover:bg-black/5 text-black")}
          >
            <ShoppingBag size={20} /> Produtos
          </button>
          <button 
            onClick={() => setTab('categories')}
            className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-all", tab === 'categories' ? "bg-black text-white" : "hover:bg-black/5 text-black")}
          >
            <Grid size={20} /> Categorias
          </button>
          <button 
            onClick={() => setTab('orders')}
            className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-all", tab === 'orders' ? "bg-black text-white" : "hover:bg-black/5 text-black")}
          >
            <Package size={20} /> Pedidos
          </button>
          <button 
            onClick={() => setTab('settings')}
            className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-all", tab === 'settings' ? "bg-black text-white" : "hover:bg-black/5 text-black")}
          >
            <SettingsIcon size={20} /> Configurações
          </button>
        </nav>

        <div className="mt-auto">
          <button onClick={() => auth.signOut()} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 transition-colors">
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-grow p-12 overflow-y-auto">
        {tab === 'products' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-serif font-bold text-black">Produtos</h1>
                <p className="text-sm text-black">Gerencie o catálogo da Deborah Semijoias</p>
              </div>
              <button 
                onClick={() => { setShowProductForm(true); setEditingProduct(null); }}
                className="bg-[#3C1A1A] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#B17A7A] transition-all"
              >
                <Plus size={20} /> Novo Produto
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                  <img src={p.imageUrl || undefined} alt={p.name} className="w-20 h-20 object-cover rounded-xl bg-gray-100" />
                  <div className="flex-grow flex flex-col justify-between py-1">
                    <div>
                      <h3 className="font-bold text-sm truncate text-black">{p.name}</h3>
                      <p className="text-xs text-black font-bold">{(p.price/100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => {
                          setEditingProduct(p);
                          setProductForm({ ...p });
                          setShowProductForm(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                       >
                         <Edit size={16} />
                       </button>
                       <button onClick={() => deleteProduct(p.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="frosted-glass p-8 rounded-[2rem] shadow-sm border border-white/60 space-y-6 self-start">
               <div className="flex items-center justify-between border-b border-brand-gold/10 pb-4">
                 <div className="flex items-center gap-3">
                   <Grid size={20} className="text-black" />
                   <h2 className="text-xl font-bold font-serif text-black">Categorias Principais</h2>
                 </div>
                 {categories.length === 0 && (
                   <button 
                    onClick={seedDefaultCategories}
                    className="text-[10px] font-bold text-black border border-black/20 px-3 py-1 rounded-full uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                   >
                     Inicializar Padrão
                   </button>
                 )}
               </div>
               <div className="flex gap-2">
                 <input 
                  className="flex-grow bg-white/50 border border-brand-gold/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-pink/10 outline-none" 
                  placeholder="Ex: Brincos" 
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                 />
                 <button onClick={addCategory} className="bg-brand-pink text-white px-4 py-3 rounded-xl hover:bg-brand-dark transition-colors"><Plus size={20} /></button>
               </div>
               <div className="space-y-2">
                 {categories.map(c => (
                   <div key={c.id} className="bg-white/60 p-4 rounded-xl border border-white flex justify-between items-center group transition-all hover:shadow-md">
                     <span className="uppercase tracking-[0.2em] text-[10px] font-bold text-black">{c.name}</span>
                     <button onClick={() => deleteDoc(doc(db, 'categories', c.id))} className="text-red-300 hover:text-red-500 transition-colors">
                       <Trash2 size={14}/>
                     </button>
                   </div>
                 ))}
               </div>
             </div>

             <div className="frosted-glass p-8 rounded-[2rem] shadow-sm border border-white/60 space-y-6">
               <div className="flex items-center gap-3 border-b border-brand-gold/10 pb-4">
                 <Package size={20} className="text-black" />
                 <h2 className="text-xl font-bold font-serif text-black">Subcategorias</h2>
               </div>
               <div className="space-y-3">
                  <select 
                    className="w-full bg-white/50 border border-brand-gold/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-pink/10 outline-none font-medium text-sm"
                    value={subCategoryForm.categoryId}
                    onChange={e => setSubCategoryForm({...subCategoryForm, categoryId: e.target.value})}
                  >
                    <option value="">Selecione Categoria Pai</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <input 
                      className="flex-grow bg-white/50 border border-brand-gold/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-pink/10 outline-none" 
                      placeholder="Ex: Argolas Pequenas" 
                      value={subCategoryForm.name}
                      onChange={e => setSubCategoryForm({...subCategoryForm, name: e.target.value})}
                    />
                    <button onClick={addSubCategory} className="bg-brand-pink text-white px-4 py-3 rounded-xl hover:bg-brand-dark transition-colors"><Plus size={20} /></button>
                  </div>
               </div>
               <div className="space-y-3 pt-4">
                 {categories.map(cat => (
                   <div key={cat.id} className="space-y-2">
                     <h3 className="text-[9px] uppercase tracking-widest font-bold text-black pl-2">{cat.name}</h3>
                     <div className="grid grid-cols-1 gap-2">
                       {subCategories.filter(s => s.categoryId === cat.id).map(s => (
                         <div key={s.id} className="bg-white/40 p-3 rounded-lg border border-white/50 flex justify-between items-center text-[11px] font-semibold text-black">
                           {s.name}
                           <button onClick={() => deleteDoc(doc(db, 'sub_categories', s.id))} className="text-red-300 hover:text-red-500 transition-colors">
                             <Trash2 size={12}/>
                           </button>
                         </div>
                       ))}
                       {subCategories.filter(s => s.categoryId === cat.id).length === 0 && (
                         <p className="text-[9px] text-gray-300 italic pl-2">Nenhuma subcategoria.</p>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        )}

        {tab === 'orders' && (
          <div className="space-y-8">
            <h1 className="text-3xl font-serif font-bold">Últimos Pedidos</h1>
            <div className="space-y-4">
              {orders.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds).map(o => (
                <div key={o.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-black">{o.customerName}</h3>
                      <p className="text-xs text-black/60">{o.customerPhone}</p>
                    </div>
                    <span className="bg-[#FDF2F2] text-[#B17A7A] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{o.status}</span>
                  </div>
                  <div className="text-xs text-black bg-gray-50 p-4 rounded-xl space-y-2">
                    {o.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-start border-b border-gray-100 last:border-0 pb-1">
                        <div>
                          <div className="font-bold text-black">{item.quantity}x {item.name}</div>
                          {item.selectedComplements && item.selectedComplements.length > 0 && (
                            <div className="text-[10px] text-black font-bold pl-2 italic">
                              + {item.selectedComplements.map(c => c.name).join(', ')}
                            </div>
                          )}
                          {item.personalization && (
                            <div className="text-[10px] text-brand-pink font-bold pl-2 italic">
                              Personalização: {item.personalization}
                            </div>
                          )}
                          {item.selectedLength && (
                            <div className="text-[10px] text-brand-gold font-bold pl-2 italic">
                              Tamanho: {item.selectedLength}
                            </div>
                          )}
                        </div>
                        <span className="text-black">{(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                    <span className="text-xs font-bold text-black">Total: {(o.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    <button className="text-xs text-black font-bold hover:underline">Ver no WhatsApp</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="max-w-2xl frosted-glass p-12 rounded-[2.5rem] shadow-xl border border-white/60 space-y-10">
            <div className="flex items-center gap-4 border-b border-brand-gold/10 pb-6">
              <div className="p-3 bg-black/10 rounded-2xl text-black">
                <SettingsIcon size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-serif font-bold text-black">Configurações</h1>
                <p className="text-[10px] uppercase tracking-widest text-black font-bold">Redes Sociais e Contato</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-black uppercase tracking-widest">WhatsApp Principal (com DDD)</label>
                <input 
                  className="w-full bg-white/50 border border-brand-gold/10 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-pink/20 transition-all font-medium text-black"
                  placeholder="5577999999999"
                  value={settingsForm.whatsapp}
                  onChange={e => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-black uppercase tracking-widest">Instagram (Link Completo)</label>
                <input 
                  className="w-full bg-white/50 border border-brand-gold/10 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-pink/20 transition-all font-medium text-black"
                  placeholder="https://instagram.com/sualoja"
                  value={settingsForm.instagram}
                  onChange={e => setSettingsForm({ ...settingsForm, instagram: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-black uppercase tracking-widest">Facebook (Link Completo)</label>
                <input 
                  className="w-full bg-white/50 border border-brand-gold/10 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-pink/20 transition-all font-medium text-black"
                  placeholder="https://facebook.com/sualoja"
                  value={settingsForm.facebook}
                  onChange={e => setSettingsForm({ ...settingsForm, facebook: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-black uppercase tracking-widest">CNPJ da Loja</label>
                <input 
                  className="w-full bg-white/50 border border-brand-gold/10 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-pink/20 transition-all font-medium text-black"
                  value={settingsForm.cnpj}
                  onChange={e => setSettingsForm({ ...settingsForm, cnpj: e.target.value })}
                />
              </div>
               <div className="space-y-2">
                <label className="text-[10px] font-bold text-black uppercase tracking-widest">Chave PIX</label>
                <input 
                  className="w-full bg-white/50 border border-brand-gold/10 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-pink/20 transition-all font-medium text-black"
                  value={settingsForm.pixKey}
                  onChange={e => setSettingsForm({ ...settingsForm, pixKey: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-black uppercase tracking-widest">URL da Logo (Opcional)</label>
                <input 
                  className="w-full bg-white/50 border border-brand-gold/10 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-pink/20 transition-all font-medium text-black"
                  placeholder="https://sua-logo.png"
                  value={settingsForm.logoUrl}
                  onChange={e => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-black uppercase tracking-widest">Frete Grátis a partir de (R$)</label>
                <input 
                  type="number"
                  className="w-full bg-white/50 border border-brand-gold/10 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-pink/20 transition-all font-medium text-black"
                  value={settingsForm.freeShippingThreshold}
                  onChange={e => setSettingsForm({ ...settingsForm, freeShippingThreshold: Number(e.target.value) })}
                />
              </div>

              <button 
                onClick={saveSettings}
                className="w-full bg-brand-pink text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-brand-dark transition-all shadow-xl shadow-brand-pink/20"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Product Modal */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-2xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-serif font-bold">{editingProduct ? 'Editar' : 'Novo'} Produto</h2>
              <button onClick={() => setShowProductForm(false)} className="p-2 hover:bg-gray-100 rounded-full"><X/></button>
            </div>

            <form onSubmit={saveProduct} className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-black uppercase tracking-widest">Nome do Produto</label>
                <input required className="w-full border border-brand-gold/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-pink/10 outline-none" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-black uppercase tracking-widest">Descrição</label>
                <textarea className="w-full border border-brand-gold/10 rounded-xl px-4 py-3 h-24 focus:ring-2 focus:ring-brand-pink/10 outline-none" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-black uppercase tracking-widest">Preço (R$)</label>
                <input type="number" step="0.01" required className="w-full border border-brand-gold/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-pink/10 outline-none" value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-black uppercase tracking-widest">Categoria</label>
                 <select required className="w-full border border-brand-gold/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-pink/10 outline-none" value={productForm.categoryId} onChange={e => setProductForm({...productForm, categoryId: e.target.value})}>
                    <option value="">Selecione</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-black uppercase tracking-widest">Subcategoria</label>
                 <select 
                  className="w-full border border-brand-gold/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-pink/10 outline-none"
                  value={productForm.subCategoryId} 
                  onChange={e => setProductForm({...productForm, subCategoryId: e.target.value})}
                 >
                    <option value="">Nenhuma</option>
                    {subCategories.filter(s => s.categoryId === productForm.categoryId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-black uppercase tracking-widest">Link da Imagem (URL)</label>
                <div className="flex gap-2">
                  <input required className="flex-grow border border-brand-gold/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-pink/10 outline-none" value={productForm.imageUrl} onChange={e => setProductForm({...productForm, imageUrl: e.target.value})} />
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-brand-gold/10">
                    {productForm.imageUrl ? <img src={productForm.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-gray-300"/>}
                  </div>
                </div>
              </div>

              {/* Complements Section */}
              <div className="col-span-2 space-y-4 pt-4 border-t border-brand-gold/10">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-black uppercase tracking-widest">Complementos do Item</h3>
                  <button type="button" onClick={addComplementToForm} className="text-[10px] font-bold text-black flex items-center gap-1 uppercase tracking-widest hover:text-brand-pink transition-colors">
                    <Plus size={14} /> Adicionar Complemento
                  </button>
                </div>
                
                <div className="space-y-3">
                  {productForm.complements.map((comp) => (
                    <div key={comp.id} className="grid grid-cols-[1fr_100px_1fr_40px] gap-2 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <input 
                        placeholder="Nome (ex: Bag de Presente)" 
                        className="bg-white border rounded-lg px-3 py-1.5 text-xs"
                        value={comp.name}
                        onChange={e => updateComplementInForm(comp.id, 'name', e.target.value)}
                      />
                      <input 
                        type="number"
                        step="0.01"
                        placeholder="Valor" 
                        className="bg-white border rounded-lg px-3 py-1.5 text-xs"
                        value={comp.price}
                        onChange={e => updateComplementInForm(comp.id, 'price', Number(e.target.value))}
                      />
                      <input 
                        placeholder="URL Imagem" 
                        className="bg-white border rounded-lg px-3 py-1.5 text-xs"
                        value={comp.imageUrl}
                        onChange={e => updateComplementInForm(comp.id, 'imageUrl', e.target.value)}
                      />
                      <button type="button" onClick={() => removeComplementFromForm(comp.id)} className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {productForm.complements.length === 0 && (
                    <p className="text-[10px] text-center text-black italic">Nenhum complemento adicionado.</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl">
                <input type="checkbox" className="w-5 h-5 rounded border-brand-gold/20 text-brand-pink focus:ring-brand-pink" checked={productForm.featured} onChange={e => setProductForm({...productForm, featured: e.target.checked})} />
                <label className="text-[10px] font-bold text-black uppercase tracking-widest">Destaque na Home</label>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl">
                <input type="checkbox" className="w-5 h-5 rounded border-brand-gold/20 text-brand-pink focus:ring-brand-pink" checked={productForm.hasLength} onChange={e => setProductForm({...productForm, hasLength: e.target.checked})} />
                <label className="text-[10px] font-bold text-black uppercase tracking-widest">Opção de Tamanho (Correntes)</label>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl">
                <input type="checkbox" className="w-5 h-5 rounded border-brand-gold/20 text-brand-pink focus:ring-brand-pink" checked={productForm.active} onChange={e => setProductForm({...productForm, active: e.target.checked})} />
                <label className="text-[10px] font-bold text-black uppercase tracking-widest">Item Disponível</label>
              </div>

              <div className="col-span-2 pt-6">
                <button type="submit" className="w-full bg-brand-dark text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:bg-brand-pink transition-all uppercase tracking-widest text-xs">
                  <Save size={20} /> Salvar Peça
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
