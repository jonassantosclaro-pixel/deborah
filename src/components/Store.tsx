import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import { Product, Category, SubCategory, CartItem, Complement, Settings } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ChevronRight, X, Plus, Sparkle } from 'lucide-react';
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
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const unsubSettings = onSnapshot(query(collection(db, 'settings'), limit(1)), (s) => {
      if (!s.empty) setSettings({ id: s.docs[0].id, ...s.docs[0].data() } as Settings);
    });

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
      unsubSettings();
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
    <div className="pb-32 px-4 md:px-12">
      {/* Centered Luxury Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 pt-16 pb-20">
         <motion.div 
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] font-medium text-brand-muted"
         >
           <div className="w-10 h-[1px] bg-brand-muted/30" />
           Exclusividade & Brilho
           <div className="w-10 h-[1px] bg-brand-muted/30" />
         </motion.div>
         <motion.h1 
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="text-4xl md:text-6xl font-serif text-brand-dark"
         >
           Deborah Joias
         </motion.h1>
         <motion.p 
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="text-sm text-brand-muted font-light max-w-lg mx-auto"
         >
           Explore nossa coleção de semijoias premium e personalizadas, criadas para eternizar seus melhores momentos.
         </motion.p>
      </div>

      {/* Minimalism Filter Bar */}
      <div className="max-w-[1400px] mx-auto border-y border-brand-dark/5 py-8 mb-16 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
        <button 
          onClick={() => { setSelectedCategory('all'); setSelectedSubCategory('all'); }}
          className={cn(
            "text-[11px] uppercase tracking-[0.2em] transition-all relative py-1",
            selectedCategory === 'all' ? "text-brand-dark font-bold after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-brand-accent" : "text-brand-muted hover:text-brand-dark"
          )}
        >
          Coleção Geral
        </button>
        {categories.map(cat => (
          <div key={cat.id} className="relative group">
            <button 
              onClick={() => { setSelectedCategory(cat.id); setSelectedSubCategory('all'); }}
              className={cn(
                "text-[11px] uppercase tracking-[0.2em] transition-all relative py-1",
                selectedCategory === cat.id ? "text-brand-dark font-bold after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-brand-accent" : "text-brand-muted hover:text-brand-dark"
              )}
            >
              {cat.name}
            </button>
            
            {selectedCategory === cat.id && subCategories.some(s => s.categoryId === cat.id) && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 flex gap-4 min-w-[200px] justify-center items-center">
                 {subCategories.filter(s => s.categoryId === cat.id).map(sub => (
                   <button
                     key={sub.id}
                     onClick={() => setSelectedSubCategory(sub.id)}
                     className={cn(
                       "text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border transition-all",
                       selectedSubCategory === sub.id ? "bg-brand-dark border-brand-dark text-white" : "border-brand-dark/5 text-brand-muted hover:border-brand-dark"
                     )}
                   >
                     {sub.name}
                   </button>
                 ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Product Grid Area */}
      <div className="max-w-[1400px] mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="aspect-[3/4] bg-neutral-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-40 border border-dashed border-brand-dark/10 rounded-2xl">
            <p className="text-brand-muted text-xs uppercase tracking-widest">Nenhuma peça encontrada nesta categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
            {filteredProducts.map((product, idx) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group cursor-pointer"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="aspect-[3/4] overflow-hidden bg-neutral-50 mb-6 relative">
                  <img 
                    src={product.imageUrl || undefined} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                  />
                  
                  {/* Subtle Overlays */}
                  <div className="absolute inset-0 bg-brand-dark/0 group-hover:bg-brand-dark/5 transition-colors duration-500" />
                  
                  {/* Luxury Action Overlay */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                     <button className="bg-white px-6 py-3 whitespace-nowrap shadow-xl text-[10px] uppercase font-bold tracking-[0.2em] text-brand-dark flex items-center gap-2">
                       Personalizar <Sparkle size={12} className="text-brand-accent" />
                     </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-center px-4">
                  <h3 className="text-[11px] uppercase tracking-[0.2em] font-medium text-brand-dark transition-colors">{product.name}</h3>
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-[1px] w-4 bg-brand-accent/30" />
                    <p className="text-sm font-semibold tracking-wider text-brand-dark">
                      {(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <div className="h-[1px] w-4 bg-brand-accent/30" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => { setSelectedProduct(null); setPersonalization(''); }}
               className="absolute inset-0 bg-brand-dark/40 backdrop-blur-md"
             />
             <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 10 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 10 }}
               className="bg-white w-full max-w-4xl h-fit max-h-[90vh] rounded-lg overflow-hidden shadow-2xl relative z-10 flex flex-col md:grid md:grid-cols-2"
             >
                <div className="bg-neutral-50 h-64 md:h-full">
                  <img src={selectedProduct.imageUrl || undefined} className="w-full h-full object-cover" />
                </div>
                
                <div className="p-8 md:p-12 overflow-y-auto thin-scrollbar">
                   <div className="space-y-8 h-full flex flex-col">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                           <h2 className="text-3xl font-serif text-brand-dark leading-tight">{selectedProduct.name}</h2>
                           <button 
                             onClick={() => { setSelectedProduct(null); setPersonalization(''); }}
                             className="p-2 -mr-2 text-brand-muted hover:text-brand-dark"
                           >
                             <X size={20} strokeWidth={1} />
                           </button>
                        </div>
                        <p className="text-xl font-medium tracking-tight text-brand-accent">{(selectedProduct.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        <p className="text-xs text-brand-muted leading-relaxed font-light">{selectedProduct.description}</p>
                      </div>

                      <div className="space-y-6 flex-grow">
                        {/* Personalization Section */}
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-brand-dark uppercase tracking-widest">Iniciais ou Nome para Gravação</label>
                          <input 
                            type="text" 
                            placeholder="Sua personalização aqui..." 
                            className="w-full bg-neutral-50 border-b border-brand-dark/10 py-3 text-xs outline-none focus:border-brand-accent transition-colors"
                            value={personalization}
                            onChange={e => setPersonalization(e.target.value)}
                          />
                        </div>

                        {/* Length Selection */}
                        {(selectedProduct.hasLength || /colar|corrente|cordao|cordão/i.test(selectedProduct.name)) && (
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold text-brand-dark uppercase tracking-widest">Tamanho da Corrente</label>
                            <div className="flex gap-4">
                               {['40cm', '45cm', '50cm', '60cm'].map(len => (
                                 <button
                                   key={len}
                                   type="button"
                                   onClick={() => setSelectedLength(len)}
                                   className={cn(
                                     "text-[10px] font-medium tracking-widest pb-1 border-b-2 transition-all",
                                     selectedLength === len ? "border-brand-accent text-brand-dark font-bold" : "border-transparent text-brand-muted hover:text-brand-dark"
                                   )}
                                 >
                                   {len}
                                 </button>
                               ))}
                            </div>
                          </div>
                        )}

                        {/* Complements */}
                        {selectedProduct.complements && selectedProduct.complements.length > 0 && (
                          <div className="space-y-4">
                            <label className="text-[10px] font-bold text-brand-dark uppercase tracking-widest">Complete sua Peça</label>
                            <div className="space-y-3">
                              {selectedProduct.complements.map(comp => (
                                <div 
                                  key={comp.id} 
                                  onClick={() => toggleComplement(comp)}
                                  className={cn(
                                    "flex items-center gap-4 p-4 cursor-pointer border transition-all",
                                    selectedComplements.some(c => c.id === comp.id) ? "border-brand-accent bg-brand-accent/5" : "border-brand-dark/5 hover:border-brand-dark/20"
                                  )}
                                >
                                  <div className="w-12 h-12 bg-neutral-100 rounded overflow-hidden">
                                     <img src={comp.imageUrl || undefined} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-grow">
                                     <p className="text-[10px] uppercase font-bold tracking-widest">{comp.name}</p>
                                     <p className="text-[9px] text-brand-accent font-bold">+ {(comp.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                  </div>
                                  <div className={cn(
                                    "w-4 h-4 border flex items-center justify-center",
                                    selectedComplements.some(c => c.id === comp.id) ? "bg-brand-dark border-brand-dark text-white" : "border-brand-dark/20"
                                  )}>
                                    {selectedComplements.some(c => c.id === comp.id) && <Plus size={10} />}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-8 border-t border-brand-dark/5 space-y-6">
                         <div className="flex justify-between items-center px-2">
                           <span className="text-[10px] uppercase tracking-widest font-bold">Resumo do Investimento</span>
                           <span className="text-xl font-bold">
                             {((selectedProduct.price + selectedComplements.reduce((acc, c) => acc + c.price, 0))).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                           </span>
                         </div>
                         <button 
                           onClick={handleAddToCart}
                           className="button-primary w-full shadow-lg shadow-brand-dark/10 flex items-center justify-center gap-3"
                         >
                           Adicionar à Sacola
                           <ShoppingBag size={14} />
                         </button>
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Featured Collection Section */}
      <section className="max-w-[1400px] mx-auto mt-40">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10 order-2 lg:order-1">
               <div className="space-y-4">
                 <p className="text-[10px] uppercase tracking-[0.4em] text-brand-muted">Arte em Metais Nobres</p>
                 <h2 className="text-5xl md:text-7xl font-serif text-brand-dark leading-tight">Joias que Contam Histórias</h2>
               </div>
               <p className="text-sm font-light text-brand-muted leading-relaxed max-w-md">
                 Cada peça é desenvolvida sob medida, utilizando os melhores materiais e técnicas de acabamento manual. Luxo acessível com a exclusividade que você merece.
               </p>
               <button className="button-outline group flex items-center gap-4">
                 Conheça nosso processo
                 <ChevronRight size={14} className="group-hover:translate-x-2 transition-transform" />
               </button>
            </div>
            <div className="relative order-1 lg:order-2">
               <div className="aspect-[4/5] bg-neutral-100 overflow-hidden">
                 <img 
                   src={settings?.heroImageUrl || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200"} 
                   className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" 
                 />
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}
