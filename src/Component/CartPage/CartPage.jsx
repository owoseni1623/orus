import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../Context/CartContext';
import { API_URL } from '../../config/env';
import './CartPage.css';

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, loading, error } = useContext(CartContext);
  const navigate = useNavigate();

  const handleQuantityChange = async (itemId, currentQuantity, increment) => {
    const newQuantity = increment ? currentQuantity + 1 : currentQuantity - 1;
    
    // Optional: Add a minimum quantity check if needed
    if (newQuantity >= 1) {
      await updateQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (window.confirm('Are you sure you want to remove this item?')) {
      await removeFromCart(itemId);
    }
  };

  const parsePrice = (price) => {
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
      return isNaN(numericPrice) ? 0 : numericPrice;
    }
    return 0;
  };

  const calculateTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = parsePrice(item.price);
      return total + (price * item.quantity);
    }, 0).toFixed(2);
  };

  if (loading) {
    return <div className="cart-page loading">Loading cart...</div>;
  }

  if (error) {
    return <div className="cart-page error">Error: {error}</div>;
  }

  return (
    <div className="cart-page">
      <h1>Your Cart</h1>
      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <p className="empty-cart-message">Your cart is empty</p>
          <button 
            className="continue-shopping-btn"
            onClick={() => navigate('/services/block-industry')}
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items-container">
            {cartItems.map(item => (
              <div key={item._id || item.id} className="cart-item-card">
                <div className="cart-item-image-container">
                  <img 
                    src={`${API_URL.replace('/api', '')}/uploads/blocks/${item.images?.[0] || 'placeholder-block.png'}`}
                    alt={item.title}
                    className="cart-item-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/placeholder-block.png';
                    }}
                  />
                </div>
                <div className="cart-item-details">
                  <h3 className="cart-item-title">{item.title}</h3>
                  <p className="cart-item-category">{item.category}</p>
                  <p className="cart-item-price">₦{parsePrice(item.price).toFixed(2)}</p>
                  <div className="cart-item-stock">
                    Stock Available: {item.stock}
                  </div>
                  <div className="quantity-control">
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(item._id || item.id, item.quantity, false)}
                      disabled={item.quantity <= 200}
                    >
                      -
                    </button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(item._id || item.id, item.quantity, true)}
                      disabled={item.quantity >= item.stock}
                    >
                      +
                    </button>
                  </div>
                  <div className="cart-item-total">
                    Total: ₦{(parsePrice(item.price) * item.quantity).toFixed(2)}
                  </div>
                  <button 
                    className="remove-item-btn" 
                    onClick={() => handleRemoveItem(item._id || item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <div className="cart-total">
              <h2>Cart Total</h2>
              <p>Total Items: {cartItems.reduce((total, item) => total + item.quantity, 0)}</p>
              <p>Total Price: ₦{calculateTotalPrice()}</p>
            </div>
            <button 
              className="checkout-btn" 
              onClick={() => navigate('/checkout')}
              disabled={cartItems.length === 0}
            >
              Proceed to Checkout
            </button>
            <button 
              className="continue-shopping-btn"
              onClick={() => navigate('/services/block-industry')}
            >
              Continue Shopping
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;