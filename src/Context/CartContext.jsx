import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/env';
import { toast } from 'react-toastify';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthHeader = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });

  const syncToLocalStorage = (items) => {
    try {
      localStorage.setItem('cartItems', JSON.stringify(items));
    } catch (error) {
      console.error('Error syncing to localStorage:', error);
    }
  };

  const handleApiError = (error) => {
    const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
    toast.error(errorMessage);
    setError(errorMessage);
    return error;
  };

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fix: Use API_URL directly as it already includes the /api prefix
        const response = await axios.get(`${API_URL}/api/cart`, getAuthHeader());
        const items = response.data?.data?.items || [];
        setCartItems(items);
        syncToLocalStorage(items);
      } catch (error) {
        handleApiError(error);
        const savedCart = localStorage.getItem('cartItems');
        if (savedCart) {
          try {
            setCartItems(JSON.parse(savedCart));
          } catch (e) {
            console.error('Error parsing saved cart:', e);
            setCartItems([]);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    const token = localStorage.getItem('token');
    if (token) {
      fetchCart();
    } else {
      setCartItems([]);
      setLoading(false);
    }
  }, []);


  const addToCart = async (item) => {
    if (!item?._id && !item?.id) {
      toast.error('Invalid item');
      return false;
    }

    // Only enforce minimum quantity of 200
    const quantity = Math.max(200, item.quantity || 200);

    try {
      setError(null);
      const response = await axios.post(
        `${API_URL}/cart`, 
        {
          blockId: item._id || item.id,
          quantity
        }, 
        getAuthHeader()
      );
      
      if (response.data.success) {
        const updatedItems = response.data.data?.items || [];
        setCartItems(updatedItems);
        syncToLocalStorage(updatedItems);
        toast.success('Item added to cart successfully');
        return true;
      }
      return false;
    } catch (error) {
      handleApiError(error);
      return false;
    }
  };


  const removeFromCart = async (itemId) => {
    if (!itemId) {
      toast.error('Invalid item ID');
      return false;
    }
  
    try {
      setError(null);
      const blockId = cartItems.find(item => 
        (item._id === itemId || item.id === itemId))?.block?._id;
      
      if (!blockId) {
        toast.error('Block not found');
        return false;
      }
  
      const response = await axios.delete(
        `${API_URL}/cart/${blockId}`, 
        getAuthHeader()
      );
      
      if (response.data.success) {
        const updatedItems = response.data.data?.items || [];
        setCartItems(updatedItems);
        syncToLocalStorage(updatedItems);
        toast.success('Item removed from cart');
        return true;
      }
      return false;
    } catch (error) {
      if (error.response?.status === 404) {
        const updatedItems = cartItems.filter(item => 
          (item._id !== itemId && item.id !== itemId)
        );
        setCartItems(updatedItems);
        syncToLocalStorage(updatedItems);
        return true;
      }
      handleApiError(error);
      return false;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (!itemId) {
      toast.error('Invalid item ID');
      return false;
    }
  
    if (!Number.isInteger(quantity)) {
      toast.error('Quantity must be a whole number');
      return false;
    }
  
    // Optional: Minimum quantity check
    if (quantity < 1) {
      toast.error('Minimum quantity is 1 item');
      return false;
    }
  
    try {
      setError(null);
      if (quantity === 0) {
        return await removeFromCart(itemId);
      }
  
      // Find the block ID from the cart items
      const cartItem = cartItems.find(item => 
        (item._id === itemId) || (item.block?._id === itemId) || (item.block === itemId)
      );
  
      if (!cartItem) {
        toast.error('Item not found in cart');
        return false;
      }
  
      // Ensure we extract the correct block ID
      const blockId = cartItem.block?._id || cartItem.block || cartItem._id;
  
      const response = await axios.put(
        `${API_URL}/cart/${blockId}`,
        { quantity },
        getAuthHeader()
      );
      
      if (response.data.success) {
        const updatedItems = response.data.data?.items || [];
        setCartItems(updatedItems);
        syncToLocalStorage(updatedItems);
        toast.success('Cart updated successfully');
        return true;
      }
      return false;
    } catch (error) {
      handleApiError(error);
      return false;
    }
  };


  const clearCart = async () => {
    try {
      setError(null);
      const response = await axios.delete(
        `${API_URL}/cart`, 
        getAuthHeader()
      );
      
      if (response.data.success) {
        setCartItems([]);
        localStorage.removeItem('cartItems');
        toast.success('Cart cleared successfully');
        return true;
      }
      return false;
    } catch (error) {
      setCartItems([]);
      localStorage.removeItem('cartItems');
      handleApiError(error);
      return true;
    }
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + (parseInt(item.quantity) || 0), 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = typeof item.price === 'number' ? item.price : 
        parseFloat(item.price?.toString().replace(/[^0-9.]/g, '') || '0');
      return total + (price * (parseInt(item.quantity) || 0));
    }, 0);
  };

  const contextValue = {
    cartItems,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === null) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export { CartContext };