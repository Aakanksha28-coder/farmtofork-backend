import React from 'react';
import Features from '../components/Features';
import './FeaturesPage.css';

const FeaturesPage = () => {
  return (
    <div className="features-page container">
      <header className="features-page-header">
        <h1>Platform Features</h1>
        <p>See how Farm-to-Fork connects farmers and customers with a transparent, fair marketplace.</p>
      </header>

      <Features />

      <section className="features-cta">
        <h2>Ready to experience fresher food?</h2>
        <p>Explore products listed directly by local farmers and support sustainable agriculture.</p>
        <a className="btn btn-primary" href="/products">Browse Products</a>
      </section>
    </div>
  );
};

export default FeaturesPage;