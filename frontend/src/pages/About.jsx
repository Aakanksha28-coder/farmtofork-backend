
import React, { useEffect } from 'react';
import './About.css';

const About = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="about">
      <section className="about-hero">
        <div className="container hero-inner">
          <h1 className="reveal">Farm to Fork: Empowering Small-Scale Farmers</h1>
          <p className="lead reveal">
            A transparent supply chain that connects local farmers directly with customers,
            ensuring fair prices, fresh produce, and sustainable practices.
          </p>
        </div>
      </section>

      <section className="about-grid container">
        <div className="card reveal">
          <h2>Our Vision</h2>
          <p>
            A world where every small-scale farmer thrives through direct market access,
            and every customer enjoys fresh, traceable, and responsibly sourced food.
          </p>
        </div>
        <div className="card reveal">
          <h2>Our Mission</h2>
          <p>
            To build a fair, digital marketplace that shortens the supply chain, increases
            farmer income, reduces waste, and delivers high-quality products at honest prices.
          </p>
        </div>
        <div className="card reveal">
          <h2>Core Pillars</h2>
          <ul className="pillars">
            <li>Transparency & Traceability</li>
            <li>Fair Pricing & Negotiation</li>
            <li>Logistics & Cold-Chain Support</li>
            <li>Sustainability & Waste Reduction</li>
            <li>Community & Local Impact</li>
          </ul>
        </div>
      </section>

      <section className="flow container">
        <h2 className="section-title reveal">How Farm-to-Fork Works</h2>
        <div className="steps">
          <div className="step reveal">
            <div className="icon">🌱</div>
            <h3>Source</h3>
            <p>Small farmers list fresh produce with quantity, grade, and harvest date.</p>
          </div>
          <div className="step reveal">
            <div className="icon">🤝</div>
            <h3>Negotiate</h3>
            <p>Transparent buyer-seller negotiation ensures fair, market-aligned pricing.</p>
          </div>
          <div className="step reveal">
            <div className="icon">🚚</div>
            <h3>Fulfill</h3>
            <p>Optimized logistics with cold-chain options minimize spoilage and delays.</p>
          </div>
          <div className="step reveal">
            <div className="icon">📦</div>
            <h3>Deliver</h3>
            <p>Orders are delivered fresh, with full traceability from farm to doorstep.</p>
          </div>
        </div>
      </section>

      <section className="split container">
        <div className="panel reveal">
          <h2>For Farmers</h2>
          <ul>
            <li>Direct access to local and urban buyers</li>
            <li>Fair pricing with negotiation tools</li>
            <li>Inventory management and demand insights</li>
            <li>Logistics support and route planning</li>
          </ul>
        </div>
        <div className="panel reveal">
          <h2>For Customers</h2>
          <ul>
            <li>Fresh, local, and seasonal produce</li>
            <li>Traceability with farm profiles</li>
            <li>Subscription boxes and pre-orders</li>
            <li>Quality assurance and community impact</li>
          </ul>
        </div>
      </section>

      <section className="impact container">
        <h2 className="section-title reveal">Sustainability & Impact</h2>
        <div className="metrics">
          <div className="metric reveal"><span className="num">30%</span><span>Less waste vs. conventional chains</span></div>
          <div className="metric reveal"><span className="num">+20%</span><span>Average farmer income uplift</span></div>
          <div className="metric reveal"><span className="num">100%</span><span>Transparent pricing and sourcing</span></div>
        </div>
      </section>

      <section className="cta">
        <div className="container reveal">
          <h2>Join the Farm-to-Fork Movement</h2>
          <p>Support local agriculture and enjoy fresher food with a lighter footprint.</p>
          <a className="btn-primary" href="/signup">Get Started</a>
        </div>
      </section>
    </div>
  );
};

export default About;