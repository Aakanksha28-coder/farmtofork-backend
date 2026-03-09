import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import { ReactComponent as LogoSVG } from './Logo.svg';
import { FaBars } from 'react-icons/fa';
import Drawer from './Drawer';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { currentUser, isAuthenticated } = useAuth();
  const displayName = (
    (currentUser && (currentUser.name || currentUser.username || currentUser.fullName)) ||
    (currentUser?.email ? currentUser.email.split('@')[0] : null) ||
    'User'
  );

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <div className="navbar-logo">
            <Link to="/">
              <LogoSVG className="logo" />
            </Link>
          </div>
          <div className="navbar-center">
            {isAuthenticated ? <span className="user-greeting">Hi, {displayName}</span> : null}
          </div>
          
          <button 
            onClick={toggleDrawer}
            className="drawer-toggle"
            aria-label="Open navigation menu"
          >
            <FaBars />
          </button>
        </div>
      </div>
      
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </nav>
  );
};

export default Navbar;