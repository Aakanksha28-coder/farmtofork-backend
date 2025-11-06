import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaTimes } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import './Drawer.css';

const Drawer = ({ isOpen, onClose }) => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && e.target.classList.contains('drawer-overlay')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    // Prevent body scrolling when drawer is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  const displayName = (
    (currentUser && (currentUser.name || currentUser.username || currentUser.fullName)) ||
    (currentUser?.email ? currentUser.email.split('@')[0] : null) ||
    'User'
  );
  
  const roleLabel = currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : null;

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {isOpen && <div className="drawer-overlay"></div>}
      <div className={`drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <button className="drawer-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="drawer-content">
          {isAuthenticated && (
            <div className="drawer-user">
              <div className="user-greeting">Welcome, {displayName}</div>
              {roleLabel && <div className="user-role">{roleLabel}</div>}
            </div>
          )}
          <div className="drawer-links">
            <Link to="/" onClick={onClose}>Home</Link>
            <Link to="/about" onClick={onClose}>About</Link>
            <Link to="/features" onClick={onClose}>Features</Link>
            <Link to="/products" onClick={onClose}>Products</Link>
            <Link to="/market-prices" onClick={onClose}>Market Prices</Link>
            {currentUser?.role !== 'farmer' && (
              <Link to="/cart" onClick={onClose}>Cart</Link>
            )}
            <Link to="/impact" onClick={onClose}>Impact Stories</Link>
            {isAuthenticated && currentUser?.role !== 'farmer' && (
              <Link to="/my-orders" onClick={onClose}>My Orders</Link>
            )}
            {isAuthenticated && currentUser?.role === 'farmer' && (
              <>
                <Link to="/farmer" onClick={onClose}>Farmer Dashboard</Link>
                <Link to="/farmer/orders" onClick={onClose}>Farmer Orders</Link>
              </>
            )}
          </div>
          
          <div className="drawer-actions">
            {isAuthenticated ? (
              <>
                {currentUser?.role === 'admin' && (
                  <Link to="/admin/messages" className="drawer-btn primary" onClick={onClose}>
                    <FaEnvelope className="drawer-icon" /> Messages
                  </Link>
                )}
                <button onClick={handleLogout} className="drawer-btn secondary">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/signin" className="drawer-btn secondary" onClick={onClose}>
                  Sign In
                </Link>
                <Link to="/signup" className="drawer-btn primary" onClick={onClose}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Drawer;