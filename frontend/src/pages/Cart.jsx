import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import './Cart.css';

const Cart = () => {
  const { items, updateQty, removeItem, totals } = useCart();
  const navigate = useNavigate();

  return (
    <div className="container cart">
      <h1>Your Cart</h1>
      {items.length === 0 ? (
        <p>Your cart is empty. Browse products and add some!</p>
      ) : (
        <div className="cart-grid">
          <div className="cart-items">
            {items.map((i) => (
              <div key={i.productId} className="cart-item">
                <div className="info">
                  <strong>{i.name}</strong>
                  <div className="meta">₹{i.price}/{i.unit}</div>
                </div>
                <div className="controls">
                  <input
                    type="number"
                    min={1}
                    value={i.quantity}
                    onChange={(e) => updateQty(i.productId, Number(e.target.value) || 1)}
                  />
                  <button className="btn btn-danger" onClick={() => removeItem(i.productId)}>Remove</button>
                </div>
                <div className="line-total">₹{(i.price * i.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h3>Summary</h3>
            <div className="row"><span>Subtotal</span><span>₹{totals.subtotal.toFixed(2)}</span></div>
            <div className="row"><span>Shipping</span><span>₹{totals.shipping.toFixed(2)}</span></div>
            <div className="row total"><span>Total</span><span>₹{totals.total.toFixed(2)}</span></div>
            <button className="btn btn-primary" onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;