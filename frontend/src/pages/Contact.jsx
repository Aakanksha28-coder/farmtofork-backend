import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { submitContactMessage } from '../services/contactService';
import './Contact.css';

const Contact = () => {
  const { currentUser } = useAuth();
  const [form, setForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
    role: currentUser?.role || 'guest',
    consent: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus('');
    try {
      // Send to backend API
      await submitContactMessage({
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: form.subject,
        message: form.message,
        role: form.role
      });
      setStatus('Thanks! Your message has been sent. We will get back to you shortly.');
      setForm({ 
        name: currentUser?.name || '', 
        email: currentUser?.email || '', 
        phone: '', 
        subject: 'General Inquiry', 
        message: '', 
        role: currentUser?.role || 'guest',
        consent: false 
      });
    } catch (err) {
      setStatus('Something went wrong. Please try again later.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-page container">
      <header className="contact-header">
        <h1>Contact Us</h1>
        <p className="lead">Questions, partnerships, or support — we’re here to help.</p>
      </header>

      <div className="contact-grid">
        <section className="contact-form">
          <h2>Send a Message</h2>
          {status && <div className="status">{status}</div>}
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="field">
                <label htmlFor="name">Name*</label>
                <input id="name" name="name" type="text" value={form.name} onChange={handleChange} required />
              </div>
              <div className="field">
                <label htmlFor="email">Email*</label>
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="Optional" />
              </div>
            </div>

            <div className="row">
              <div className="field full">
                <label htmlFor="subject">Subject*</label>
                <select id="subject" name="subject" value={form.subject} onChange={handleChange} required>
                  <option>General Inquiry</option>
                  <option>Customer Support</option>
                  <option>Farmer Onboarding</option>
                  <option>Partnerships</option>
                  <option>Investor Relations</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div className="field full">
                <label htmlFor="message">Message*</label>
                <textarea id="message" name="message" value={form.message} onChange={handleChange} rows={6} required />
              </div>
            </div>

            <div className="consent">
              <label className="checkbox">
                <input type="checkbox" name="consent" checked={form.consent} onChange={handleChange} required />
                I agree to be contacted regarding my inquiry.
              </label>
            </div>

            <div className="actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send Message'}
              </button>
            </div>
          </form>
        </section>

        <aside className="contact-info">
          <h2>Contact Information</h2>
          <ul>
            <li><strong>Email:</strong> support@farmtofork.local</li>
            <li><strong>Phone:</strong> +91 98765 43210</li>
            <li><strong>Hours:</strong> Mon–Fri, 9:00–18:00 IST</li>
            <li><strong>Address:</strong> Farm-to-Fork HQ, Bengaluru, Karnataka</li>
          </ul>
          <div className="map-placeholder">
            <div className="map-box">Map Placeholder</div>
            <p className="map-note">Add a real map embed later.</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Contact;