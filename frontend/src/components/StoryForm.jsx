import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createStory } from '../services/impactService';
import './StoryForm.css';

const StoryForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    role: 'Farmer', // Default role
    name: '',
    location: '',
    quote: '',
    stats: ['', '', ''],
    image: null
  });
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleStatsChange = (index, value) => {
    const newStats = [...formData.stats];
    newStats[index] = value;
    setFormData({
      ...formData,
      stats: newStats
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file
      });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'stats') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      await createStory(formDataToSend);
      
      alert('Your story has been submitted successfully!');
      navigate('/impact');
    } catch (err) {
      setError('Failed to submit your story. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="story-form-container">
      <h2>Share Your Impact Story</h2>
      <p className="form-intro">Tell us how Farm-to-Fork has impacted your life as a farmer or customer.</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="story-form">
        <div className="form-group">
          <label htmlFor="title">Story Title*</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="E.g., 'How direct selling changed my farm'"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="role">Your Role*</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="Farmer">Farmer</option>
            <option value="Customer">Customer</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="name">Your Name*</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your full name"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="location">Location*</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="City, State"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="quote">Your Quote*</label>
          <textarea
            id="quote"
            name="quote"
            value={formData.quote}
            onChange={handleChange}
            placeholder="Share a brief quote about your experience (max 150 characters)"
            maxLength={150}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Key Highlights (up to 3)</label>
          {formData.stats.map((stat, index) => (
            <input
              key={index}
              type="text"
              value={stat}
              onChange={(e) => handleStatsChange(index, e.target.value)}
              placeholder={`Highlight #${index + 1} (e.g., "20% more income")`}
              maxLength={20}
            />
          ))}
        </div>
        
        <div className="form-group">
          <label htmlFor="image">Your Photo*</label>
          <input
            type="file"
            id="image"
            name="image"
            onChange={handleImageChange}
            accept="image/*"
            required
          />
          {preview && (
            <div className="image-preview">
              <img src={preview} alt="Preview" />
            </div>
          )}
          <p className="file-hint">Please upload a clear photo of yourself or your farm/produce.</p>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => navigate('/impact')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Your Story'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoryForm;