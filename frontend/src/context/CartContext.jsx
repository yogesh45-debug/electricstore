import React, { createContext, useState, useEffect, useContext } from 'react';
import { cartAPI } from '../services/api';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  const fetchCart = async () => {
    // Only fetch cart if customer is authenticated
    if (!user || user.role !== 'customer') {
      setCart({ items: [], subtotal: 0 });
      return;
    }
    setLoading(true);
    try {
      const response = await cartAPI.get();
      setCart(response.data);
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (productId, qty = 1) => {
    if (!user) throw new Error("Please log in to add items to your cart.");
    if (user.role !== 'customer') throw new Error("Only customer accounts can buy products.");
    
    await cartAPI.add(productId, qty);
    await fetchCart();
  };

  const updateQuantity = async (itemId, qty) => {
    await cartAPI.update(itemId, qty);
    await fetchCart();
  };

  const removeFromCart = async (itemId) => {
    await cartAPI.remove(itemId);
    await fetchCart();
  };

  const clearCartState = () => {
    setCart({ items: [], subtotal: 0 });
  };

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      loading, 
      fetchCart, 
      addToCart, 
      updateQuantity, 
      removeFromCart, 
      clearCartState, 
      cartCount 
    }}>
      {children}
    </CartContext.Provider>
  );
};
