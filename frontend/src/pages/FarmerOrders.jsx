import React, { useEffect, useState } from 'react';
import { getFarmerOrders, updateOrderStatus } from '../services/orderService';
import ProtectedRoute from '../components/ProtectedRoute';
import './FarmerOrders.css';

const StatusSelect = ({ value, onChange }) => {
  const options = ['pending','confirmed','on_route','shipped','delivered','received','cancelled'];
  return (
    <select value={value} onChange={(e)=>onChange(e.target.value)}>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
};

const FarmerOrdersContent = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingStatus, setPendingStatus] = useState({}); // {orderId: status}

  const loadOrders = async () => {
    try {
      setLoading(true);
      const list = await getFarmerOrders();
      setOrders(list);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const shortId = (id) => id ? id.substring(id.length - 6) : '';

  const setStatus = (id, status) => {
    setPendingStatus(prev => ({ ...prev, [id]: status }));
  };

  const saveStatus = async (id) => {
    const status = pendingStatus[id];
    if (!status) return;
    try {
      await updateOrderStatus(id, status, 'Updated by farmer');
      await loadOrders();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const markReceived = async (id) => {
    try {
      await updateOrderStatus(id, 'received', 'Farmer marked as received');
      await loadOrders();
    } catch (err) {
      alert(err.message || 'Failed to mark received');
    }
  };

  if (loading) return <div className="container fo">Loading your orders...</div>;
  if (error) return <div className="container fo error">{error}</div>;

  return (
    <div className="container fo">
      <h1>Orders for Your Products</h1>
      {orders.length === 0 ? (
        <div>No orders yet.</div>
      ) : (
        <ul className="fo-list">
          {orders.map((o) => (
            <li key={o._id} className="fo-item">
              <div className="fo-row">
                <div>
                  <strong>Order #{shortId(o._id)}</strong>
                  <div className="fo-meta">Status: <span className="status">{o.status}</span> • Items: {(o.items||[]).length} • Total: ₹{(o.totalPrice || o.total || 0).toFixed(2)}</div>
                </div>
              </div>
              <div className="fo-actions">
                <StatusSelect value={pendingStatus[o._id] || o.status} onChange={(s)=>setStatus(o._id, s)} />
                <button className="btn btn-primary" onClick={()=>saveStatus(o._id)}>Update</button>
                <button className="btn btn-secondary" onClick={()=>markReceived(o._id)}>Mark Received</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const FarmerOrders = () => (
  <ProtectedRoute roles={["farmer"]}>
    <FarmerOrdersContent />
  </ProtectedRoute>
);

export default FarmerOrders;