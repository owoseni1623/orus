import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrusHomeSellingPage.css';
import axios from 'axios';

const AdvancedPropertyCard = ({ property, onDetailView, onContactClick, onCheckoutClick, isAdmin, onEdit, onDelete, onToggleAvailability }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://orus-home.onrender.com';

  const DEFAULT_PLACEHOLDER = '/src/assets/placeholder-property.jpg';

  const getImageUrl = (imagePath) => {
    if (!imagePath) return DEFAULT_PLACEHOLDER;
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    const filename = imagePath.split(/[\/\\]/).pop();
    // Fixed: Make sure we're accessing the correct uploads path (with /uploads directly)
    const url = `${API_BASE_URL}/uploads/properties/${filename}`;
    console.log('Constructed image URL:', url);
    return url;
  };

  const handleImageError = () => {
    setImageError(true);
    console.log('Image failed to load, using placeholder');
  };

  const cycleImages = (e, direction) => {
    e.stopPropagation(); // Prevent card click when cycling images
    if (!property.images?.length) return;
    
    const propertyImages = property.images;
    const newIndex = direction === 'next' 
      ? (currentImageIndex + 1) % propertyImages.length
      : (currentImageIndex - 1 + propertyImages.length) % propertyImages.length;
    setCurrentImageIndex(newIndex);
    setImageError(false);
  };

  const handleCardClick = (e) => {
    // Don't trigger modal if clicking buttons or image navigation
    if (
      e.target.tagName === 'BUTTON' ||
      e.target.closest('.property-actions') ||
      e.target.closest('.image-navigation')
    ) {
      return;
    }
    onDetailView(property);
  };

  const currentImageUrl = imageError || !property.images?.length
    ? DEFAULT_PLACEHOLDER
    : getImageUrl(property.images[currentImageIndex]);

    return (
      <div 
        className="advanced-property-card"
        onClick={handleCardClick}
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleCardClick(e);
          }
        }}
      >
        <div className="property-image-container">
          <img 
            src={currentImageUrl}
            alt={property.title || 'Property Image'} 
            className="property-main-image"
            onError={handleImageError}
            crossOrigin="anonymous"
          />
          {property.images?.length > 1 && !imageError && (
            <div className="image-navigation">
              <button onClick={(e) => cycleImages(e, 'prev')}>◀</button>
              <button onClick={(e) => cycleImages(e, 'next')}>▶</button>
            </div>
          )}
        </div>
        
        <div className="property-details">
          <h3>{property.title}</h3>
          <p className="property-price">{property.price}</p>
          <div className="property-meta">
            <span>{property.location}</span>
            <div className="property-specs">
              <span>{property.bedrooms} Beds</span>
              <span>{property.bathrooms} Baths</span>
              <span>{property.area}</span>
            </div>
          </div>
          <div className="property-actions" onClick={e => e.stopPropagation()}>
            {isAdmin ? (
              <>
                <button 
                  className="edit-btn" 
                  onClick={() => onEdit(property)}
                >
                  Edit
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => onDelete(property._id)}
                >
                  Delete
                </button>
                <button 
                  className={`availability-btn ${property.isAvailable ? 'unpublish' : 'publish'}`}
                  onClick={() => onToggleAvailability(property)}
                >
                  {property.isAvailable ? 'Unpublish' : 'Publish'}
                </button>
              </>
            ) : (
              <>
                <button 
                  className="detail-view-btn" 
                  onClick={() => onDetailView(property)}
                >
                  View Details
                </button>
                <button 
                  className="contact-agent-btn"
                  onClick={() => onContactClick(property)}
                >
                  Contact Agent
                </button>
                <button 
                  className="checkout-btn"
                  onClick={() => onCheckoutClick(property)}
                >
                  Buy Property
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

const HomeSelling = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [currentModalImageIndex, setCurrentModalImageIndex] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    propertyInterest: ''
  });
  const [searchParams, setSearchParams] = useState({
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    location: ''
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://orus-home.onrender.com';

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAdmin(!!token);
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {}
      };

      if (isAdmin) {
        config.headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
      }

      // FIXED: Adding /api prefix to properties endpoint
      const response = await axios.get(`${API_BASE_URL}/api/properties`, config);
      console.log('API Response:', response.data);
      
      setProperties(response.data);
    } catch (err) {
      setError('Failed to fetch properties. Please try again later.');
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (property) => {
    navigate(`/admin/properties/edit/${property._id}`);
  };

  const handleDelete = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        // FIXED: Adding /api prefix to properties endpoint
        await axios.delete(`${API_BASE_URL}/api/properties/${propertyId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        fetchProperties();
      } catch (error) {
        console.error('Error deleting property:', error);
      }
    }
  };

  const handleToggleAvailability = async (property) => {
    try {
      // FIXED: Adding /api prefix to properties endpoint
      await axios.put(
        `${API_BASE_URL}/api/properties/${property._id}`,
        {
          ...property,
          isAvailable: !property.isAvailable
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      fetchProperties();
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const handlePropertyDetailView = (property) => {
    // Update this function to properly handle image URLs
    const processedProperty = {
      ...property,
      images: property.images?.map(imagePath => {
        if (!imagePath) return '/src/assets/placeholder-property.jpg';
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
          return imagePath;
        }
        const filename = imagePath.split(/[\/\\]/).pop();
        // FIXED: Ensure we're accessing the uploads directory directly without replacing /api
        return `${API_BASE_URL}/uploads/properties/${filename}`;
      })
    };
    setSelectedProperty(processedProperty);
  };

  const handlePropertyContact = (property) => {
    setContactForm(prev => ({
      ...prev,
      propertyInterest: property.title
    }));
    setIsContactModalOpen(true);
  };

  const handleCheckout = (property) => {
    localStorage.setItem('selectedProperty', JSON.stringify(property));
    navigate('/checkout');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchParamChange = async (e) => {
    const { name, value } = e.target;
    const updatedParams = {
      ...searchParams,
      [name]: value
    };
    setSearchParams(updatedParams);

    try {
      setLoading(true);
      const queryString = new URLSearchParams(updatedParams).toString();
      // FIXED: Adding /api prefix to properties/search endpoint
      const response = await axios.get(
        `${API_BASE_URL}/api/properties/search?${queryString}`
      );
      setProperties(response.data);
    } catch (err) {
      setError('Failed to search properties. Please try again later.');
      console.error('Error searching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitContact = async (e) => {
    e.preventDefault();
    try {
      // FIXED: Adding /api prefix to inquiries endpoint
      await axios.post(`${API_BASE_URL}/api/inquiries`, contactForm);
      alert('Inquiry submitted successfully!');
      setContactForm({
        name: '',
        email: '',
        phone: '',
        message: '',
        propertyInterest: ''
      });
      setIsContactModalOpen(false);
    } catch (err) {
      alert('Failed to submit inquiry. Please try again.');
      console.error('Error submitting inquiry:', err);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading properties...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="sb-orus-advanced-homepage">
      <header className="advanced-header">
        <div className="header-content">
          <h1>SB.Orus Nigeria Limited</h1>
          <p>Transforming Real Estate Dreams into Reality</p>
          {isAdmin && (
            <div className="admin-controls">
              <button onClick={() => navigate('/admin/properties/new')} className="add-property-btn">
                Add New Property
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="property-search-section">
        <div className="search-container">
          <input 
            type="number" 
            name="minPrice" 
            placeholder="Min Price (₦)"
            value={searchParams.minPrice}
            onChange={handleSearchParamChange}
          />
          <input 
            type="number" 
            name="maxPrice" 
            placeholder="Max Price (₦)"
            value={searchParams.maxPrice}
            onChange={handleSearchParamChange}
          />
          <select 
            name="bedrooms"
            value={searchParams.bedrooms}
            onChange={handleSearchParamChange}
          >
            <option value="">Bedrooms</option>
            <option value="3">3 Bedrooms</option>
            <option value="4">4 Bedrooms</option>
            <option value="5">5 Bedrooms</option>
            <option value="6">6+ Bedrooms</option>
          </select>
          <input 
            type="text" 
            name="location" 
            placeholder="Location"
            value={searchParams.location}
            onChange={handleSearchParamChange}
          />
        </div>
      </section>

      <section className="featured-properties">
        <h2>Featured Properties</h2>
        <div className="properties-grid">
          {properties.map(property => (
            <AdvancedPropertyCard 
              key={property._id} 
              property={property}
              isAdmin={isAdmin}
              onDetailView={handlePropertyDetailView}
              onContactClick={handlePropertyContact}
              onCheckoutClick={handleCheckout}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleAvailability={handleToggleAvailability}
            />
          ))}
        </div>
      </section>

      
      {/* Property Detail Modal */}
      {selectedProperty && (
        <div className="property-detail-modal">
          <div 
            className="modal-overlay" 
            onClick={() => {
              setSelectedProperty(null);
              setCurrentModalImageIndex(0);
            }}
          >
            <div 
              className="modal-content" 
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => {
                  setSelectedProperty(null);
                  setCurrentModalImageIndex(0);
                }} 
                className="close-modal-btn"
              >
                ×
              </button>
              
              <div className="modal-header">
                <h2>{selectedProperty.title}</h2>
                <p className="property-price">{selectedProperty.price}</p>
              </div>
              
              <div className="modal-body">
                {selectedProperty.images && selectedProperty.images.length > 0 && (
                  <div className="modal-image-container">
                    <img 
                      src={
                        selectedProperty.images[currentModalImageIndex] || 
                        '/src/assets/placeholder-property.jpg'
                      }
                      alt={selectedProperty.title}
                      className="modal-property-image"
                      onError={(e) => {
                        e.target.src = '/src/assets/placeholder-property.jpg';
                      }}
                      crossOrigin="anonymous"
                    />
                    
                    {/* Image Navigation */}
                    {selectedProperty.images.length > 1 && (
                      <>
                        <div className="modal-image-navigation">
                          <button 
                            onClick={() => setCurrentModalImageIndex((prev) => 
                              (prev - 1 + selectedProperty.images.length) % 
                              selectedProperty.images.length
                            )}
                            className="modal-nav-btn prev"
                          >
                            ◀
                          </button>
                          <button 
                            onClick={() => setCurrentModalImageIndex((prev) => 
                              (prev + 1) % selectedProperty.images.length
                            )}
                            className="modal-nav-btn next"
                          >
                            ▶
                          </button>
                        </div>
                        
                        <div className="modal-image-counter">
                          {currentModalImageIndex + 1} / {selectedProperty.images.length}
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {/* Property Details Grid */}
                <div className="property-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Location</span>
                    <span className="detail-value">{selectedProperty.location}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Bedrooms</span>
                    <span className="detail-value">{selectedProperty.bedrooms}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Bathrooms</span>
                    <span className="detail-value">{selectedProperty.bathrooms}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Area</span>
                    <span className="detail-value">{selectedProperty.area}</span>
                  </div>
                  {selectedProperty.yearBuilt && (
                    <div className="detail-item">
                      <span className="detail-label">Year Built</span>
                      <span className="detail-value">{selectedProperty.yearBuilt}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedProperty.description && (
                  <div className="property-description">
                    <h3>Description</h3>
                    <p>{selectedProperty.description}</p>
                  </div>
                )}

                {/* Features */}
                {selectedProperty.features && selectedProperty.features.length > 0 && (
                  <div className="property-features">
                    <h3>Features</h3>
                    <ul className="features-list">
                      {selectedProperty.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                <button 
                  className="contact-agent-btn"
                  onClick={() => {
                    setSelectedProperty(null);
                    handlePropertyContact(selectedProperty);
                  }}
                >
                  Contact Agent
                </button>
                <button 
                  className="checkout-btn"
                  onClick={() => {
                    setSelectedProperty(null);
                    handleCheckout(selectedProperty);
                  }}
                >
                  Buy Property
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {isContactModalOpen && (
        <div className="contact-modal">
          <div 
            className="modal-overlay" 
            onClick={() => setIsContactModalOpen(false)}
          >
            <form 
              onClick={(e) => e.stopPropagation()} 
              onSubmit={handleSubmitContact}
              className="contact-form"
            >
              <button 
                type="button" 
                onClick={() => setIsContactModalOpen(false)} 
                className="close-modal-btn"
              >
                ×
              </button>
              
              <h2>Contact About {contactForm.propertyInterest}</h2>
              
              <input 
                type="text"
                name="name"
                placeholder="Your Name"
                value={contactForm.name}
                onChange={handleInputChange}
                required
              />
              <input 
                type="email"
                name="email"
                placeholder="Your Email"
                value={contactForm.email}
                onChange={handleInputChange}
                required
              />
              <input 
                type="tel"
                name="phone"
                placeholder="Your Phone Number"
                value={contactForm.phone}
                onChange={handleInputChange}
                required
              />
              <textarea 
                name="message"
                placeholder="Your Message"
                value={contactForm.message}
                onChange={handleInputChange}
                required
              ></textarea>
              
              <button type="submit" className="submit-contact-btn">
                Send Inquiry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeSelling;