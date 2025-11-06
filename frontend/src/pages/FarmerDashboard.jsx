import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createProduct, getMyProducts, updateProduct, deleteProduct } from '../services/productService';
import { getNegotiationsForProduct, postMessage as postNegotiationMessage, acceptNegotiation } from '../services/negotiationService';
import ProtectedRoute from '../components/ProtectedRoute';
import './FarmerDashboard.css';

const FarmerDashboardContent = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', quantity: '', unit: 'kg', offer: '', isUpcoming: false, availableDate: '', imageFile: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', quantity: '', unit: 'kg', offer: '', isUpcoming: false, availableDate: '', imageFile: null });

  // View filter state: all | available | upcoming
  const [view, setView] = useState('all');
  // Negotiation state
  const [openNegoFor, setOpenNegoFor] = useState(null);
  const [negoMap, setNegoMap] = useState({}); // { productId: [negotiations] }
  const [negoReply, setNegoReply] = useState({}); // { negotiationId: { price:'', text:'' } }
  const [acceptPrice, setAcceptPrice] = useState({}); // { negotiationId: '' }

  const apiBase = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '');

  const loadMyProducts = async () => {
    try {
      const list = await getMyProducts();
      setProducts(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadMyProducts(); }, []);

  // Negotiation helpers inside component
  const loadNegotiations = async (productId) => {
    try {
      const items = await getNegotiationsForProduct(productId);
      setNegoMap(prev => ({ ...prev, [productId]: items }));
    } catch (err) {
      console.error('Failed to load negotiations', err);
    }
  };

  const toggleNegotiations = async (p) => {
    const pid = p._id;
    setOpenNegoFor(prev => (prev === pid ? null : pid));
    if (!negoMap[pid]) {
      await loadNegotiations(pid);
    }
  };

  const handleReplyChange = (negId, field, value) => {
    setNegoReply(prev => ({ ...prev, [negId]: { ...(prev[negId] || {}), [field]: value } }));
  };

  const sendReply = async (negId, productId) => {
    const data = negoReply[negId] || {};
    if (!data.price && !data.text) return;
    try {
      await postNegotiationMessage(negId, { price: data.price ? Number(data.price) : undefined, text: data.text || '' });
      await loadNegotiations(productId);
      setNegoReply(prev => ({ ...prev, [negId]: { price: '', text: '' } }));
    } catch (err) {
      console.error('Failed to send reply', err);
      alert(err.message || 'Failed to send reply');
    }
  };

  const acceptOffer = async (negId, productId) => {
    const price = acceptPrice[negId];
    try {
      await acceptNegotiation(negId, price ? Number(price) : undefined);
      await loadNegotiations(productId);
    } catch (err) {
      console.error('Failed to accept offer', err);
      alert(err.message || 'Failed to accept offer');
    }
  };
  const availableProducts = useMemo(() => products.filter(p => !p.isUpcoming), [products]);
  const upcomingProducts = useMemo(() => products.filter(p => !!p.isUpcoming), [products]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setForm(prev => ({ ...prev, [name]: files && files[0] ? files[0] : null }));
    } else {
      setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        quantity: Number(form.quantity),
        unit: form.unit,
        offer: form.offer,
        isUpcoming: form.isUpcoming,
        availableDate: form.availableDate || undefined,
        imageFile: form.imageFile || undefined
      };
      await createProduct(payload);
      setForm({ name: '', description: '', price: '', quantity: '', unit: 'kg', offer: '', isUpcoming: false, availableDate: '', imageFile: null });
      await loadMyProducts();
    } catch (err) {
      setError(err.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  // Edit handlers
  const startEdit = (p) => {
    setEditingId(p._id);
    setEditForm({
      name: p.name || '',
      description: p.description || '',
      price: p.price ?? '',
      quantity: p.quantity ?? '',
      unit: p.unit || 'kg',
      offer: p.offer || '',
      isUpcoming: !!p.isUpcoming,
      availableDate: p.availableDate ? new Date(p.availableDate).toISOString().slice(0,10) : '',
      imageFile: null
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', description: '', price: '', quantity: '', unit: 'kg', offer: '', isUpcoming: false, availableDate: '', imageFile: null });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setEditForm(prev => ({ ...prev, [name]: files && files[0] ? files[0] : null }));
    } else {
      setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      const payload = {
        name: editForm.name,
        description: editForm.description,
        price: editForm.price !== '' ? Number(editForm.price) : undefined,
        quantity: editForm.quantity !== '' ? Number(editForm.quantity) : undefined,
        unit: editForm.unit,
        offer: editForm.offer,
        isUpcoming: editForm.isUpcoming,
        availableDate: editForm.availableDate || undefined,
        imageFile: editForm.imageFile || undefined
      };
      await updateProduct(editingId, payload);
      await loadMyProducts();
      cancelEdit();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to update product');
    }
  };

  const markAvailableNow = async (p) => {
    try {
      await updateProduct(p._id, { isUpcoming: false });
      await loadMyProducts();
    } catch (err) { console.error(err); }
  };

  const markUpcoming = async (p) => {
    try {
      await updateProduct(p._id, { isUpcoming: true });
      await loadMyProducts();
    } catch (err) { console.error(err); }
  };

  const toggleUpcoming = async (p) => {
    try {
      await updateProduct(p._id, { isUpcoming: !p.isUpcoming });
      await loadMyProducts();
    } catch (err) { console.error(err); }
  };

  const removeProduct = async (p) => {
    try {
      await deleteProduct(p._id);
      await loadMyProducts();
    } catch (err) { console.error(err); }
  };

  const renderList = (list, type) => (
    <ul className="product-list">
      {list.map(p => (
        <li key={p._id} className="product-item">
          <div className="product-row">
            <div className="thumb">
              {p.imageUrl ? (
                <img src={`${apiBase}${p.imageUrl}`} alt={p.name} />
              ) : (
                <div className="placeholder" />
              )}
            </div>
            <div>
              <strong>{p.name}</strong> - ₹{p.price} / {p.unit} | Qty: {p.quantity}
              {p.offer ? <span className="offer"> ({p.offer})</span> : null}
              {p.isUpcoming ? <span className="badge">Upcoming</span> : null}
            </div>
          </div>

          {editingId === p._id ? (
            <form onSubmit={submitEdit} className="form fd-form" style={{ marginTop: '0.5rem' }}>
              <div className="grid fd-grid">
                <div>
                  <label>Name</label>
                  <input name="name" value={editForm.name} onChange={handleEditChange} />
                </div>
                <div>
                  <label>Description</label>
                  <input name="description" value={editForm.description} onChange={handleEditChange} />
                </div>
                <div>
                  <label>Price</label>
                  <input name="price" type="number" step="0.01" value={editForm.price} onChange={handleEditChange} />
                </div>
                <div>
                  <label>Quantity</label>
                  <input name="quantity" type="number" step="0.01" value={editForm.quantity} onChange={handleEditChange} />
                </div>
                <div>
                  <label>Unit</label>
                  <input name="unit" value={editForm.unit} onChange={handleEditChange} />
                </div>
                <div>
                  <label>Offer</label>
                  <input name="offer" value={editForm.offer} onChange={handleEditChange} />
                </div>
                <div>
                  <label>
                    <input type="checkbox" name="isUpcoming" checked={editForm.isUpcoming} onChange={handleEditChange} /> Upcoming
                  </label>
                </div>
                <div>
                  <label>Available Date</label>
                  <input name="availableDate" type="date" value={editForm.availableDate} onChange={handleEditChange} />
                </div>
                <div className="file-upload">
                  <label>Replace Image</label>
                  <input name="imageFile" type="file" accept="image/*" onChange={handleEditChange} />
                  {editForm.imageFile && (
                    <div className="preview">
                      <img src={URL.createObjectURL(editForm.imageFile)} alt="Preview" />
                    </div>
                  )}
                </div>
              </div>
              <div className="actions" style={{ marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
              </div>
            </form>
          ) : (
             <>
            <div className="actions">
              <button className="btn" onClick={() => startEdit(p)}>Edit</button>
              {p.isUpcoming ? (
                <button className="btn btn-secondary" onClick={() => markAvailableNow(p)}>Mark Available Now</button>
              ) : (
                <button className="btn btn-secondary" onClick={() => markUpcoming(p)}>Mark Upcoming</button>
              )}
              <button className="btn btn-danger" onClick={() => removeProduct(p)}>Delete</button>
              <button className="btn btn-outline" onClick={() => toggleNegotiations(p)}>
                {openNegoFor === p._id ? 'Hide Negotiations' : 'View Negotiations'}
                {Array.isArray(negoMap[p._id]) && negoMap[p._id].length ? ` (${negoMap[p._id].length})` : ''}
              </button>
            </div>

            {openNegoFor === p._id && (
              <div className="negotiations" style={{ marginTop: '0.5rem' }}>
                {Array.isArray(negoMap[p._id]) && negoMap[p._id].length > 0 ? (
                  negoMap[p._id].map(n => (
                    <div key={n._id} className="negotiation-card">
                      <div className="neg-meta">
                        <span>Customer: {(n.customer && (n.customer.name || n.customer.email))}</span>
                        <span style={{ marginLeft: '0.5rem' }}>Status: {n.status}</span>
                        {n.finalPrice ? <span style={{ marginLeft: '0.5rem' }}>Final: ₹{n.finalPrice}</span> : null}
                      </div>
                      <ul className="messages">
                        {(n.messages || []).map((m, idx) => (
                          <li key={idx}>
                            <strong>{String(m.sender) === String(currentUser?._id) ? 'You' : 'Customer'}:</strong>
                            {m.text ? (' ' + m.text) : ''}
                            {m.price ? (' (₹' + m.price + ')') : ''}
                          </li>
                        ))}
                      </ul>
                      {n.status === 'open' && (
                        <div className="neg-actions">
                          <div className="inline-form">
                            <input
                              type="number"
                              placeholder="Counter price"
                              value={negoReply[n._id]?.price || ''}
                              onChange={(e)=>handleReplyChange(n._id,'price',e.target.value)}
                            />
                            <input
                              type="text"
                              placeholder="Message"
                              value={negoReply[n._id]?.text || ''}
                              onChange={(e)=>handleReplyChange(n._id,'text',e.target.value)}
                            />
                            <button className="btn btn-secondary" onClick={()=>sendReply(n._id,p._id)}>Send</button>
                          </div>
                          <div className="inline-form" style={{ marginTop: '0.25rem' }}>
                            <input
                              type="number"
                              placeholder="Accept at price (optional)"
                              value={acceptPrice[n._id] || ''}
                              onChange={(e)=>setAcceptPrice(prev=>({...prev,[n._id]:e.target.value}))}
                            />
                            <button className="btn btn-primary" onClick={()=>acceptOffer(n._id,p._id)}>Accept Offer</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="empty">No negotiations yet.</div>
                )}
              </div>
            )}
            </>
          )}
        </li>
      ))}
      {list.length === 0 && <div className="empty">No {type} products.</div>}
    </ul>
  );

  return (
    <div className="container fd-container">
      <h1>Farmer Dashboard</h1>
      <p>Welcome {currentUser?.name || currentUser?.email}. Upload food options and manage listings.</p>

      <form onSubmit={handleSubmit} className="form fd-form">
        <div className="grid fd-grid">
          <div>
            <label>Name</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div>
            <label>Description</label>
            <input name="description" value={form.description} onChange={handleChange} />
          </div>
          <div>
            <label>Price</label>
            <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} required />
          </div>
          <div>
            <label>Quantity</label>
            <input name="quantity" type="number" step="0.01" value={form.quantity} onChange={handleChange} required />
          </div>
          <div>
            <label>Unit</label>
            <input name="unit" value={form.unit} onChange={handleChange} />
          </div>
          <div>
            <label>Offer</label>
            <input name="offer" value={form.offer} onChange={handleChange} placeholder="e.g. 10% off" />
          </div>
          <div>
            <label>
              <input type="checkbox" name="isUpcoming" checked={form.isUpcoming} onChange={handleChange} /> Upcoming
            </label>
          </div>
          <div>
            <label>Available Date</label>
            <input name="availableDate" type="date" value={form.availableDate} onChange={handleChange} />
          </div>
          <div className="file-upload">
            <label>Product Image</label>
            <input name="imageFile" type="file" accept="image/*" onChange={handleChange} />
            {form.imageFile && (
              <div className="preview">
                <img src={URL.createObjectURL(form.imageFile)} alt="Preview" />
              </div>
            )}
          </div>
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading} className="btn btn-primary fd-submit">{loading ? 'Uploading...' : 'Upload Product'}</button>
      </form>

      <div className="filters">
        <span>View: </span>
        <button className={`btn ${view==='all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('all')}>All</button>
        <button className={`btn ${view==='available' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('available')}>Available Now</button>
        <button className={`btn ${view==='upcoming' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('upcoming')}>Upcoming</button>
      </div>

      {view === 'available' && (
        <section className="section">
          <h2 className="section-title">Available Now</h2>
          {renderList(availableProducts, 'available')}
        </section>
      )}

      {view === 'upcoming' && (
        <section className="section">
          <h2 className="section-title">Upcoming</h2>
          {renderList(upcomingProducts, 'upcoming')}
        </section>
      )}

      {view === 'all' && (
        <>
          <section className="section">
            <h2 className="section-title">Available Now</h2>
            {renderList(availableProducts, 'available')}
          </section>
          <section className="section">
            <h2 className="section-title">Upcoming</h2>
            {renderList(upcomingProducts, 'upcoming')}
          </section>
        </>
      )}
    </div>
  );
};

const FarmerDashboard = () => (
  <ProtectedRoute roles={["farmer"]}>
    <FarmerDashboardContent />
  </ProtectedRoute>
);

export default FarmerDashboard;