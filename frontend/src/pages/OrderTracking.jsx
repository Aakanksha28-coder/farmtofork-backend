import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getOrderById } from '../services/orderService';
import './OrderTracking.css';

const OrderTracking = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await getOrderById(id);
        setOrder(data);
      } catch (err) {
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrder();
  }, [id]);

  if (loading) return <div className="container tracking">Loading order details...</div>;
  if (error) return <div className="container tracking error">{error}</div>;
  if (!order) return <div className="container tracking">Order not found</div>;

  const shortId = order._id ? order._id.substring(order._id.length - 6) : '';
  const tracking = Array.isArray(order.tracking) ? order.tracking : [];
  const shipping = order.shippingAddress || {};

  return (
    <div className="container tracking">
      <h1>Order #{shortId}</h1>
      
      <div className="tracking-grid">
        <div className="tracking-details">
          <div className="tracking-status">
            <h2>Order Status: <span className="status">{order.status}</span></h2>
            <div className="timeline">
              {tracking.length === 0 ? (
                <div className="timeline-event">
                  <div className="event-dot"></div>
                  <div className="event-content">
                    <div className="event-status">pending</div>
                    <div className="event-date">No history yet</div>
                  </div>
                </div>
              ) : (
                tracking.map((event, index) => (
                  <div key={index} className="timeline-event">
                    <div className="event-dot"></div>
                    <div className="event-content">
                      <div className="event-status">{event.status}</div>
                      <div className="event-date">{new Date(event.timestamp).toLocaleString()}</div>
                      {event.note && <div className="event-comment">{event.note}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="shipping-info">
            <h2>Shipping Information</h2>
            {shipping.address && <p><strong>Address:</strong> {shipping.address}</p>}
            {shipping.addressLine1 && <p><strong>Address Line 1:</strong> {shipping.addressLine1}</p>}
            {shipping.addressLine2 && <p><strong>Address Line 2:</strong> {shipping.addressLine2}</p>}
            {shipping.city && <p><strong>City:</strong> {shipping.city}</p>}
            {shipping.state && <p><strong>State:</strong> {shipping.state}</p>}
            {shipping.postalCode && <p><strong>Postal Code:</strong> {shipping.postalCode}</p>}
            {shipping.phone && <p><strong>Phone:</strong> {shipping.phone}</p>}
          </div>
          
          <div className="payment-info">
            <h2>Payment Information</h2>
            <p><strong>Method:</strong> {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
            <p><strong>Status:</strong> {order.isPaid ? 'Paid' : 'Not Paid'}</p>
            {order.isPaid && order.paidAt && (
              <p><strong>Paid At:</strong> {new Date(order.paidAt).toLocaleString()}</p>
            )}
          </div>
        </div>
        
        <div className="order-items">
          <h2>Order Items</h2>
          {(order.items || []).map((item, idx) => (
            <div key={item.product || idx} className="order-item">
              <div className="item-info">
                <span className="item-name">{item.name}</span>
                <span className="item-price">₹{item.price} × {item.quantity}</span>
              </div>
              <span className="item-total">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          
          <div className="order-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>₹{((order.totalPrice || 0) - (order.shippingPrice || 0)).toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Shipping</span>
              <span>₹{(order.shippingPrice || 0).toFixed(2)}</span>
            </div>
            <div className="total-row grand-total">
              <span>Total</span>
              <span>₹{(order.totalPrice || order.total || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;