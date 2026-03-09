import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Impact.css';

const publicUrl = process.env.PUBLIC_URL || '';
// Helper function to get role-based image
const getRoleImage = (role, index) => {
  if (role === 'Farmer') {
    return `${publicUrl}/images/impact/farmer${index % 5 + 1}${index % 5 === 0 ? '.png' : '.jpg'}`;
  } else {
    return `${publicUrl}/images/impact/customer${index % 4 + 1}.jpg`;
  }
};

const stories = [
  {
    title: 'From Surplus to Stable Income',
    role: 'Farmer',
    name: 'Ramesh Kumar',
    location: 'Kolhapur, Maharashtra',
    image: getRoleImage('Farmer', 0),
    quote: 'Listing directly helped me sell fresh produce the same day, reducing waste and ensuring a fair price.',
    stats: ['+22% income', '0 middlemen', 'Same-day sales']
  },
  {
    title: 'Traceable Produce for My Family',
    role: 'Customer',
    name: 'Anita Sharma',
    location: 'Kolhapur,Maharashtra',
    image: getRoleImage('Customer', 0),
    quote: 'I can see which farm my vegetables come from and choose seasonal items for better taste.',
    stats: ['100% traceable', 'Seasonal picks', 'Weekly basket']
  },
  {
    title: 'Negotiation Built on Trust',
    role: 'Farmer',
    name: 'Sita Devi',
    location: 'Sangli, Maharashtra',
    image: getRoleImage('Farmer', 1),
    quote: 'Buyers respect the effort that goes into farming. Negotiation helps us meet halfway.',
    stats: ['Fair pricing', 'Repeat buyers', 'Transparent deals']
  },
  {
    title: 'Freshness I Can Taste',
    role: 'Customer',
    name: 'Rahul Verma',
    location: 'Satara, Maharashtra',
    image: getRoleImage('Customer', 1),
    quote: 'Produce arrives within 24 hours of harvest. The quality is unmatched.',
    stats: ['24h harvest-to-home', 'Local growers', 'Less waste']
  },
  {
    title: 'Better Planning with Pre-Orders',
    role: 'Farmer',
    name: 'Arjun Singh',
    location: 'Sangli, Maharashtra',
    image: getRoleImage('Farmer', 2),
    quote: 'Pre-orders help me plan harvests accurately and avoid overproduction.',
    stats: ['Demand insights', 'Less spoilage', 'Stable cashflow']
  },
  {
    title: 'Community Impact You Can See',
    role: 'Customer',
    name: 'Meera Joshi',
    location: 'Sindudurg, Maharashtra',
    image: getRoleImage('Customer', 2),
    quote: 'It feels good to know my purchase directly supports small-scale farmers near my city.',
    stats: ['Local support', 'Fair trade', 'Sustainability']
  },
  {
    title: 'Sustainable Practices Pay Off',
    role: 'Farmer',
    name: 'Karthik P',
    location: 'Satara, Maharashtra',
    image: getRoleImage('Farmer', 3),
    quote: 'Organic methods and direct sales help me maintain quality and get rewarded for it.',
    stats: ['Organic methods', 'Premium price', 'Loyal customers']
  },
  {
    title: 'Seasonal Boxes for My Kitchen',
    role: 'Customer',
    name: 'Nidhi Patel',
    location: 'Pune, Maharashtra',
    image: getRoleImage('Customer', 3),
    quote: 'The seasonal box variety keeps our meals exciting and healthy.',
    stats: ['Curated variety', 'Budget friendly', 'Family favorite']
  },
  {
    title: 'Upcoming Crops, Guaranteed Buyers',
    role: 'Farmer',
    name: 'Devendra',
    location: 'Satara, Maharashtra',
    image: getRoleImage('Farmer', 4),
    quote: 'Listing upcoming harvests lets customers pre-book. It reduces risk and ensures demand.',
    stats: ['Pre-booked', 'Lower risk', 'Planned logistics']
  }
];



const Impact = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

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

  const handleAddStory = () => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    navigate('/add-story');
  };

  return (
    <div className="impact-page container">
      <header className="impact-header">
        <h1 className="reveal">Impact Stories</h1>
        <p className="lead reveal">Real experiences from farmers and customers building a fair, transparent food system.</p>
      </header>

      <section className="stories-grid">
        {stories.map((s, idx) => (
          <article key={idx} className="story-card reveal">
            <div className="story-image">
              <img
                src={s.image}
                alt={`${s.role} ${s.name}`}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null; // prevent infinite loop if placeholder fails
                  e.currentTarget.src = `${publicUrl}/images/impact/placeholder.svg`;
                }}
              />
            </div>
            <div className="story-content">
              <div className="story-meta">
                <span className="role">{s.role}</span>
                <span className="dot">•</span>
                <span className="location">{s.location}</span>
              </div>
              <h3 className="story-title">{s.title}</h3>
              <p className="story-quote">“{s.quote}”</p>
              <div className="story-stats">
                {s.stats.map((t, i) => (
                  <span key={i} className="badge">{t}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="impact-cta reveal">
        <h2>Share your story</h2>
        <p>Help others learn from your experience. Add your impact as a farmer or customer.</p>
        <button className="btn btn-primary" onClick={handleAddStory}>Add Your Story</button>
        {!isAuthenticated && <p className="note">You’ll be asked to register or log in.</p>}
      </section>
    </div>
  );
};

export default Impact;