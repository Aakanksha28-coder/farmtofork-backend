import React from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  return (
    <div className="hero">
      <div className="hero-background">
        <div className="hero-overlay"></div>
      </div>
      
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Fresh From Farm <br />
              <span className="highlight">To Your Table</span>
            </h1>
            <p className="hero-subtitle">
              Connect directly with local farmers and get fresh, organic produce delivered to your doorstep. Support sustainable farming and enjoy healthier food options.
            </p>
            <div className="hero-buttons">
              <Link to="/products" className="btn btn-primary">
                Shop Now
              </Link>
              <Link to="/impact" className="btn btn-outline">
                Meet Our Farmers
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;