import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { Product, Category, SubCategory, CartItem, Complement } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Heart, Search, Filter, Sparkles, ChevronRight, X, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

interface StoreProps {
  onAddToCart: (item: CartItem) => void;
}

export function Store({ onAddToCart }: StoreProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedComplements, setSelectedComplements] = useState<Complement[]>([]);
  const [personalization, setPersonalization] = useState<string>('');
  const [selectedLength, setSelectedLength] = useState<string>('45cm');

  useEffect(() => {
    const qProducts = query(collection(db, 'products'), where('active', '==', true));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
      setLoading(false);
    });

    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(data);
    });

    const unsubscribeSub = onSnapshot(collection(db, 'sub_categories'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubCategory));
      setSubCategories(data);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeSub();
    };
  }, []);

  useEffect(() => {
    let result = products;
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.categoryId === selectedCategory);
    }
    if (selectedSubCategory !== 'all') {
      result = result.filter(p => p.subCategoryId === selectedSubCategory);
    }
    setFilteredProducts(result);
  }, [selectedCategory, selectedSubCategory, products]);

  const toggleComplement = (comp: Complement) => {
    setSelectedComplements(prev => 
      prev.find(c => c.id === comp.id) 
        ? prev.filter(c => c.id !== comp.id)
        : [...prev, comp]
    );
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const isNecklace = selectedProduct.hasLength || /colar|corrente|cordao|cordão/i.test(selectedProduct.name);
    const finalPrice = selectedProduct.price + selectedComplements.reduce((acc, c) => acc + c.price, 0);
    onAddToCart({
      ...selectedProduct,
      price: finalPrice,
      selectedComplements: selectedComplements,
      personalization: personalization,
      selectedLength: isNecklace ? selectedLength : undefined,
      quantity: 1
    });
    setSelectedProduct(null);
    setSelectedComplements([]);
    setPersonalization('');
    setSelectedLength('45cm');
  };

  return (
    <div className="space-y-12 pb-20 pt-8">
      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        
        {/* Sidebar Filters */}
        <aside className="frosted-glass-gold p-6 rounded-[15px] self-start space-y-8 hidden lg:block">
          <div>
            <h3 className="text-xs font-bold text-black uppercase tracking-widest mb-4">Categorias</h3>
            <ul className="space-y-4">
              <li 
                onClick={() => { setSelectedCategory('all'); setSelectedSubCategory('all'); }}
                className={cn(
                  "text-sm cursor-pointer border-b border-black/5 pb-2 transition-colors",
                  selectedCategory === 'all' ? "text-brand-pink font-bold" : "text-black hover:text-brand-pink"
                )}
              >
                Todas as Peças
              </li>
              {categories.map(cat => (
                <li key={cat.id} className="space-y-2">
                  <div 
                    onClick={() => { setSelectedCategory(cat.id); setSelectedSubCategory('all'); }}
                    className={cn(
                      "text-sm cursor-pointer border-b border-black/5 pb-2 transition-colors flex justify-between items-center",
                      selectedCategory === cat.id ? "text-brand-pink font-bold" : "text-black hover:text-brand-pink"
                    )}
                  >
                    {cat.name}
                    <ChevronRight size={14} className={cn("transition-transform", selectedCategory === cat.id && "rotate-90")} />
                  </div>
                  
                  {selectedCategory === cat.id && (
                    <ul className="pl-4 space-y-2 pt-2 border-l border-brand-gold/20">
                      {subCategories.filter(s => s.categoryId === cat.id).map(sub => (
                        <li 
                          key={sub.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedSubCategory(sub.id); }}
                          className={cn(
                            "text-[10px] uppercase tracking-widest cursor-pointer transition-colors",
                            selectedSubCategory === sub.id ? "text-brand-gold font-bold" : "text-black hover:text-brand-gold"
                          )}
                        >
                          • {sub.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-black uppercase tracking-widest mb-4">Complementos</h3>
            <div className="text-[11px] text-black space-y-1 font-medium">
              <p>✓ Banho de Ouro 18k</p>
              <p>✓ Banho de Prata 925</p>
              <p>✓ Gravação a Laser</p>
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-3xl font-bold text-brand-dark">
              {selectedCategory === 'all' ? 'Coleção Completa' : categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            <div className="flex items-center gap-2 text-xs font-bold text-black uppercase tracking-[0.2em]">
              Exclusividade <Sparkles size={14} />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 space-y-4 animate-pulse h-80 shadow-sm" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-32 frosted-glass rounded-3xl border-2 border-dashed border-brand-gold/20">
              <p className="text-brand-dark/40 font-medium">Nenhuma joia disponível no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product, idx) => (
                <motion.div 
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-xl p-5 shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col items-center text-center group"
                >
                  <div className="w-full aspect-square bg-gray-50 rounded-lg overflow-hidden mb-4 relative">
                    <img 
                      src={product.imageUrl || undefined} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-brand-pink shadow-md">
                        <Heart size={16} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold mb-1 h-10 overflow-hidden line-clamp-2">{product.name}</h3>
                  <p className="text-black font-bold text-lg mb-4">
                    {(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <button 
                    onClick={() => {
                      setSelectedProduct(product);
                    }}
                    className="w-full bg-brand-pink text-white py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-brand-dark transition-all shadow-md active:scale-95"
                  >
                    Personalizar e Comprar
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Product Detail / Complements Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => { setSelectedProduct(null); setPersonalization(''); }}
               className="absolute inset-0 bg-black/40 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row max-h-[90vh]"
             >
                <div className="w-full md:w-1/2 aspect-square md:h-auto bg-gray-50">
                  <img src={selectedProduct.imageUrl || undefined} className="w-full h-full object-cover" />
                </div>
                <div className="w-full md:w-1/2 p-8 flex flex-col h-full overflow-y-auto">
                   <div className="flex-grow space-y-6">
                      <div>
                        <h2 className="text-2xl font-serif font-bold text-brand-dark">{selectedProduct.name}</h2>
                        <p className="text-black font-bold text-xl mt-1">{(selectedProduct.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      </div>
                      
                      <p className="text-xs text-black leading-relaxed italic">{selectedProduct.description}</p>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-black uppercase tracking-widest">Nome para Personalização (Opcional)</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Maria" 
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-brand-pink/10"
                          value={personalization}
                          onChange={e => setPersonalization(e.target.value)}
                        />
                      </div>

                      {(selectedProduct.hasLength || /colar|corrente|cordao|cordão/i.test(selectedProduct.name)) && (
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-black uppercase tracking-widest">Tamanho da Corrente</label>
                          <div className="grid grid-cols-4 gap-2">
                             {['40cm', '45cm', '50cm', '60cm'].map(len => (
                               <button
                                 key={len}
                                 type="button"
                                 onClick={() => setSelectedLength(len)}
                                 className={cn(
                                   "py-2 rounded-lg text-[10px] font-bold border transition-all",
                                   selectedLength === len ? "bg-brand-gold border-brand-gold text-white" : "bg-white border-brand-gold/20 text-brand-dark hover:border-brand-gold"
                                 )}
                               >
                                 {len}
                               </button>
                             ))}
                          </div>
                        </div>
                      )}

                      {selectedProduct.complements && selectedProduct.complements.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-bold text-black uppercase tracking-widest border-b border-brand-gold/10 pb-2">Complete sua Joia</h4>
                          <div className="space-y-2">
                            {selectedProduct.complements.map(comp => (
                              <label 
                                key={comp.id} 
                                className={cn(
                                  "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                                  selectedComplements.find(c => c.id === comp.id) ? "bg-brand-pink/5 border-brand-pink" : "border-gray-100 hover:border-brand-gold/20"
                                )}
                              >
                                <input 
                                  type="checkbox" 
                                  className="hidden" 
                                  checked={selectedComplements.some(c => c.id === comp.id)} 
                                  onChange={() => toggleComplement(comp)}
                                />
                                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-black/5">
                                  <img src={comp.imageUrl || undefined} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-grow">
                                   <p className="text-[11px] font-bold text-brand-dark">{comp.name}</p>
                                   <p className="text-[10px] text-brand-pink font-bold">+ {(comp.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                </div>
                                <div className={cn(
                                  "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                  selectedComplements.find(c => c.id === comp.id) ? "bg-brand-pink border-brand-pink" : "border-gray-300"
                                )}>
                                  {selectedComplements.find(c => c.id === comp.id) && <Plus size={12} className="text-white" />}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                   </div>

                   <div className="pt-8 mt-6 border-t border-brand-gold/10">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-bold text-black uppercase tracking-widest">Valor Final</span>
                        <span className="text-lg font-bold text-brand-dark">
                          {((selectedProduct.price + selectedComplements.reduce((acc, c) => acc + c.price, 0))).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                      <button 
                        onClick={handleAddToCart}
                        className="w-full bg-brand-pink text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-dark transition-all shadow-xl shadow-brand-pink/20"
                      >
                        Confirmar e Adicionar
                      </button>
                   </div>
                </div>
                <button 
                  onClick={() => { setSelectedProduct(null); setPersonalization(''); }}
                  className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full text-brand-dark shadow-md md:text-white md:bg-brand-dark/20 md:hover:bg-brand-dark/40 transition-colors"
                >
                  <X size={20} />
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Featured Banner Soft Version */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mt-20">
        <div className="frosted-glass-heavy p-12 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-pink/5 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative z-10 space-y-6 max-w-xl">
            <h2 className="font-serif text-4xl font-bold leading-tight text-brand-dark">Presenteie com <span className="text-brand-pink">Eternidade</span></h2>
            <p className="text-black leading-relaxed">Nossas joias personalizadas são criadas com banho premium e alma. Peças únicas para momentos inesquecíveis.</p>
            <button className="bg-brand-pink text-white px-10 py-4 rounded-full font-bold shadow-lg hover:shadow-brand-pink/20 transition-all flex items-center gap-2">
              Ver Personalizados <ChevronRight size={18} />
            </button>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-4 rotate-3">
             <div className="w-40 h-40 rounded-2xl overflow-hidden border-4 border-white shadow-xl">
               <img src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=300" className="w-full h-full object-cover" />
             </div>
             <div className="w-40 h-40 rounded-2xl overflow-hidden border-4 border-white shadow-xl translate-y-8">
               <img src="https://images.unsplash.com/photo-1611085583191-a3b136727b8a?auto=format&fit=crop&q=80&w=300" className="w-full h-full object-cover" />
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
