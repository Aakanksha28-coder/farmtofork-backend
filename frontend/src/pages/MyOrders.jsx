import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../services/orderService';
import './MyOrders.css';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getMyOrders();
        setOrders(Array.isArray(data) ? data : data?.orders || []);
      } catch (err) {
        console.error('Failed to load orders', err);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <div className="my-orders"><p>Loading orders...</p></div>;
  if (error) return <div className="my-orders"><p className="error">{error}</p></div>;

  if (!orders.length) {
    return (
      <div className="my-orders">
        <h2>My Orders</h2>
        <p>You have no orders yet.</p>
        <Link to="/products" className="btn">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="my-orders">
      <h2>My Orders</h2>
      <ul className="orders-list">
        {orders.map((order) => (
          <li key={order._id} className="order-item">
            <div className="order-summary">
              <div>
                <strong>Order ID:</strong> {order._id}
              </div>
              <div>
                <strong>Status:</strong> {order.status}
              </div>
              <div>
                <strong>Total:</strong> ${order.totalPrice?.toFixed(2) ?? order.total?.toFixed(2)}
              </div>
            </div>
            <div className="order-actions">
              <Link to={`/order/${order._id}`} className="btn">Track</Link>
            </div>
            <div className="order-items">
              {order.items?.map((item) => (
                <div key={item.product?._id ?? item.product} className="order-item-row">
                  <span>{item.product?.name ?? item.name ?? 'Item'}</span>
                  <span>x{item.quantity}</span>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MyOrders;