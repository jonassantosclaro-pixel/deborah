/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Store } from './components/Store';
import { AdminPanel } from './components/AdminPanel';
import { Checkout } from './components/Checkout';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { useState, useEffect } from 'react';
import { CartItem } from './types';
import { AnimatePresence } from 'motion/react';
import { Cart } from './components/Cart';
import { IntroScreen } from './components/IntroScreen';

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showIntro, setShowIntro] = useState(true);

  // Intro timer
  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('deborah_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }, []);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      let newCart;
      if (existing) {
        newCart = prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i);
      } else {
        newCart = [...prev, item];
      }
      localStorage.setItem('deborah_cart', JSON.stringify(newCart));
      return newCart;
    });
    setCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const newCart = prev.filter(i => i.id !== id);
      localStorage.setItem('deborah_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const newCart = prev.map(i => {
        if (i.id === id) {
          const newQty = Math.max(1, i.quantity + delta);
          return { ...i, quantity: newQty };
        }
        return i;
      });
      localStorage.setItem('deborah_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  return (
    <Router>
      <AnimatePresence>
        {showIntro && <IntroScreen key="intro" />}
      </AnimatePresence>

      <div className="min-h-screen bg-[#FDF2F2] flex flex-col font-sans selection:bg-[#B17A7A]/30 selection:text-[#3C1A1A]">
        <Navbar cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} onCartClick={() => setCartOpen(true)} />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Store onAddToCart={addToCart} />} />
            <Route path="/checkout" element={<Checkout cart={cart} clearCart={() => { setCart([]); localStorage.removeItem('deborah_cart'); }} />} />
            <Route path="/admin/*" element={<AdminPanel />} />
          </Routes>
        </main>

        <Footer />

        <AnimatePresence>
          {cartOpen && (
            <Cart 
              items={cart} 
              onClose={() => setCartOpen(false)} 
              onRemove={removeFromCart}
              onUpdateQuantity={updateQuantity}
            />
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
}

