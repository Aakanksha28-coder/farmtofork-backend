import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem('cart_items');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('cart_items', JSON.stringify(items));
  }, [items]);

  const addItem = (product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product._id);
      if (existing) {
        return prev.map(i => i.productId === product._id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, {
        productId: product._id,
        name: product.name,
        price: product.price,
        unit: product.unit || 'kg',
        quantity
      }];
    });
  };

  const removeItem = (productId) => setItems(prev => prev.filter(i => i.productId !== productId));

  const updateQty = (productId, quantity) => setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity } : i));

  const clearCart = () => setItems([]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shipping = items.length > 0 ? 30 : 0; // flat shipping for demo
    const total = subtotal + shipping;
    return { subtotal, shipping, total };
  }, [items]);

  const value = { items, addItem, removeItem, updateQty, clearCart, totals };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);