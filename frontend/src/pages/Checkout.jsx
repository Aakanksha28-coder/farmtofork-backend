import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { createOrder } from '../services/orderService';
import './Checkout.css';

const Checkout = () => {
  const { items, totals, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    shippingAddress: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
    paymentMethod: 'cod'
  });

  if (items.length === 0) {
    return (
      <div className="container checkout">
        <h1>Checkout</h1>
        <p>Your cart is empty. Please add items before checkout.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Browse Products</button>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create order payload aligned to backend
      const orderItems = items.map(item => ({
        product: item.productId,
        quantity: item.quantity,
      }));

      const orderData = {
        items: orderItems,
        shippingAddress: {
          address: form.shippingAddress,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          phone: form.phone
        },
        paymentMethod: form.paymentMethod,
        shippingPrice: totals.shipping,
        totalPrice: totals.total
      };

      const order = await createOrder(orderData);
      clearCart();
      navigate(`/order/${order._id}`);
    } catch (err) {
      setError(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container checkout">
      <h1>Checkout</h1>
      
      <div className="checkout-grid">
        <div className="checkout-form">
          <h2>Shipping Information</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="shippingAddress">Address</label>
              <input 
                type="text" 
                id="shippingAddress" 
                name="shippingAddress" 
                value={form.shippingAddress} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input 
                  type="text" 
                  id="city" 
                  name="city" 
                  value={form.city} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="state">State</label>
                <input 
                  type="text" 
                  id="state" 
                  name="state" 
                  value={form.state} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="postalCode">Postal Code</label>
                <input 
                  type="text" 
                  id="postalCode" 
                  name="postalCode" 
                  value={form.postalCode} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone" 
                  value={form.phone} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
            
            <h2>Payment Method</h2>
            <div className="payment-methods">
              <div className="payment-method">
                <input 
                  type="radio" 
                  id="cod" 
                  name="paymentMethod" 
                  value="cod" 
                  checked={form.paymentMethod === 'cod'} 
                  onChange={handleChange} 
                />
                <label htmlFor="cod">Cash on Delivery</label>
              </div>
              
              <div className="payment-method">
                <input 
                  type="radio" 
                  id="online" 
                  name="paymentMethod" 
                  value="online" 
                  checked={form.paymentMethod === 'online'} 
                  onChange={handleChange} 
                />
                <label htmlFor="online">Online Payment (UPI/Card)</label>
              </div>
            </div>
            
            {error && <div className="error">{error}</div>}
            
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </form>
        </div>
        
        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="order-items">
            {items.map((item) => (
              <div key={item.productId} className="order-item">
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  <span className="item-price">₹{item.price} × {item.quantity}</span>
                </div>
                <span className="item-total">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="order-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>₹{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Shipping</span>
              <span>₹{totals.shipping.toFixed(2)}</span>
            </div>
            <div className="total-row grand-total">
              <span>Total</span>
              <span>₹{totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;