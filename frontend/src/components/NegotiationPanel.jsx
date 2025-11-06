import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { startNegotiation, postMessage, getNegotiationsForProduct } from '../services/negotiationService';

const NegotiationPanel = ({ product }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [negotiation, setNegotiation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [price, setPrice] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isCustomer = currentUser?.role === 'customer';

  useEffect(() => {
    const init = async () => {
      setError('');
      try {
        if (!isAuthenticated || !isCustomer) return;
        const n = await startNegotiation(product._id);
        setNegotiation(n);
        const list = await getNegotiationsForProduct(product._id);
        const mine = list.find(x => String(x._id) === String(n._id)) || n;
        setMessages(mine.messages || []);
      } catch (err) {
        setError(err.message || 'Failed to start negotiation');
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product._id]);

  const sendOffer = async (e) => {
    e.preventDefault();
    if (!negotiation) return;
    setLoading(true);
    setError('');
    try {
      const updated = await postMessage(negotiation._id, { text, price: Number(price) });
      setMessages(updated.messages || []);
      setText('');
      setPrice('');
    } catch (err) {
      setError(err.message || 'Failed to send offer');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <div className="note">Sign in to start negotiation.</div>;
  }
  if (!isCustomer) {
    return <div className="note">Only customers can start negotiations here.</div>;
  }

  return (
    <div className="negotiation-panel">
      <h4>Negotiation</h4>
      {error && <div className="error">{error}</div>}
      <ul className="messages">
        {messages.map((m, idx) => (
          <li key={idx}>
            <strong>{String(m.sender) === String(currentUser._id) ? 'You' : 'Farmer'}:</strong>
            {m.text ? ` ${m.text}` : ''}
            {m.price !== undefined ? ` (₹${m.price})` : ''}
          </li>
        ))}
        {messages.length === 0 && <li>No messages yet. Propose your price to begin.</li>}
      </ul>
      <form onSubmit={sendOffer} className="offer-form">
        <input
          type="number"
          step="0.01"
          placeholder="Your price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Message (optional)"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-secondary" type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Offer'}
        </button>
      </form>
    </div>
  );
};

export default NegotiationPanel;