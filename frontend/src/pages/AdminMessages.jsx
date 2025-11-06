import React, { useState, useEffect } from 'react';
import { getContactMessages, updateMessageStatus } from '../services/contactService';
import './AdminMessages.css';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    q: ''
  });
  const [activeMessage, setActiveMessage] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, [filters]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const data = await getContactMessages(filters);
      setMessages(data);
      setError('');
    } catch (err) {
      setError('Failed to load messages. ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateMessageStatus(id, newStatus);
      setMessages(messages.map(msg => 
        msg._id === id ? { ...msg, status: newStatus } : msg
      ));
      if (activeMessage?._id === id) {
        setActiveMessage({ ...activeMessage, status: newStatus });
      }
    } catch (err) {
      setError('Failed to update status. ' + err.message);
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'new': return 'status-new';
      case 'in_progress': return 'status-progress';
      case 'resolved': return 'status-resolved';
      default: return '';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'farmer': return 'Farmer';
      case 'customer': return 'Customer';
      case 'guest': return 'Guest';
      default: return role;
    }
  };

  return (
    <div className="admin-messages">
      <header>
        <h1>Contact Messages</h1>
        <p>Manage and respond to customer and farmer inquiries</p>
      </header>

      <div className="filters">
        <div className="filter-group">
          <label htmlFor="role">Role</label>
          <select 
            id="role" 
            name="role" 
            value={filters.role} 
            onChange={handleFilterChange}
          >
            <option value="">All Roles</option>
            <option value="farmer">Farmer</option>
            <option value="customer">Customer</option>
            <option value="guest">Guest</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status">Status</label>
          <select 
            id="status" 
            name="status" 
            value={filters.status} 
            onChange={handleFilterChange}
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="filter-group search">
          <label htmlFor="q">Search</label>
          <input 
            type="text" 
            id="q" 
            name="q" 
            value={filters.q} 
            onChange={handleFilterChange}
            placeholder="Search messages..."
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="messages-container">
        <div className="messages-list">
          {loading ? (
            <div className="loading">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="no-messages">No messages found</div>
          ) : (
            <ul>
              {messages.map(msg => (
                <li 
                  key={msg._id} 
                  className={`message-item ${activeMessage?._id === msg._id ? 'active' : ''} ${getStatusClass(msg.status)}`}
                  onClick={() => setActiveMessage(msg)}
                >
                  <div className="message-header">
                    <span className="message-subject">{msg.subject}</span>
                    <span className={`message-status ${getStatusClass(msg.status)}`}>
                      {msg.status === 'new' ? 'New' : 
                       msg.status === 'in_progress' ? 'In Progress' : 'Resolved'}
                    </span>
                  </div>
                  <div className="message-meta">
                    <span className="message-sender">{msg.name}</span>
                    <span className="message-role">{getRoleLabel(msg.role)}</span>
                  </div>
                  <div className="message-preview">{msg.message.substring(0, 60)}...</div>
                  <div className="message-date">{formatDate(msg.createdAt)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="message-detail">
          {activeMessage ? (
            <div className="detail-content">
              <div className="detail-header">
                <h2>{activeMessage.subject}</h2>
                <div className="detail-actions">
                  <select 
                    value={activeMessage.status}
                    onChange={(e) => handleStatusChange(activeMessage._id, e.target.value)}
                    className={getStatusClass(activeMessage.status)}
                  >
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
              
              <div className="detail-meta">
                <div className="sender-info">
                  <div><strong>From:</strong> {activeMessage.name}</div>
                  <div><strong>Email:</strong> {activeMessage.email}</div>
                  {activeMessage.phone && <div><strong>Phone:</strong> {activeMessage.phone}</div>}
                  <div><strong>Role:</strong> {getRoleLabel(activeMessage.role)}</div>
                </div>
                <div className="message-info">
                  <div><strong>Received:</strong> {formatDate(activeMessage.createdAt)}</div>
                </div>
              </div>
              
              <div className="detail-body">
                <p>{activeMessage.message}</p>
              </div>
              
              <div className="detail-footer">
                <button className="btn btn-primary">Reply via Email</button>
                <button className="btn btn-secondary">Mark as Resolved</button>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <p>Select a message to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;