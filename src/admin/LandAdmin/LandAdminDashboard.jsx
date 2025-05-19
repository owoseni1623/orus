import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './LandAdminDashboard.css';

const LandAdminDashboard = () => {
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLand, setSelectedLand] = useState(null);
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const navigate = useNavigate();

  const getLandImageUrl = (imagePath) => {
    // Remove any extra quotes
    imagePath = imagePath.replace(/^["']|["']$/g, '');

    if (!imagePath) return '/fallback-image.jpg';
    
    // If it's a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Ensure the image path is clean
    const filename = imagePath
      .replace(/^uploads[/\\]/, '') // Remove 'uploads/' or 'uploads\' prefix
      .replace(/\\/g, '/') // Normalize slashes
      .split('/').pop(); // Get the actual filename
    
    // Construct the full URL
    return `${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/lands/${encodeURIComponent(filename)}`;
  };

  useEffect(() => {
    fetchLands();
  }, []);

  const fetchLands = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/lands`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setLands(response.data || []);
      // Initialize image indexes for each property
      const indexes = {};
      response.data.forEach(property => {
        indexes[property._id] = 0;
      });
      setCurrentImageIndexes(indexes);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error fetching lands';
      setError(errorMessage);
      toast.error(errorMessage);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this land property?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/lands/${id}`, {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        toast.success('Land property deleted successfully');
        fetchLands();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error deleting land property');
        if (error.response?.status === 401) {
          navigate('/login');
        }
      }
    }
  };

  const toggleAvailability = async (land) => {
    try {
      const updatedLand = {
        ...land,
        isAvailable: land.isAvailable !== undefined ? !land.isAvailable : false};
      
        await axios.put(
          `${import.meta.env.VITE_API_URL}/lands/${land._id}`,
          updatedLand,
          {
            withCredentials: true,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        toast.success(`Land property ${updatedLand.isAvailable ? 'published' : 'unpublished'} successfully`);
        fetchLands();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error updating land availability');
        if (error.response?.status === 401) {
          navigate('/login');
        }
      }
    };
  
    const handleLandDetailView = (land) => {
      setSelectedLand(land);
      setModalImageIndex(0);
    };
  
    const cycleImage = (propertyId, direction, isModal = false) => {
      const property = lands.find(p => p._id === propertyId);
      if (!property?.images?.length) return;
      
      const imageCount = property.images.length;
      
      if (isModal) {
        setModalImageIndex(prev => 
          direction === 'next'
            ? (prev + 1) % imageCount
            : (prev - 1 + imageCount) % imageCount
        );
      } else {
        setCurrentImageIndexes(prev => ({
          ...prev,
          [propertyId]: direction === 'next'
            ? (prev[propertyId] + 1) % imageCount
            : (prev[propertyId] - 1 + imageCount) % imageCount
        }));
      }
    };
  
    const formatPrice = (price) => {
      try {
        const numericPrice = Number(String(price).replace(/[^0-9]/g, ''));
        return new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN'
        }).format(numericPrice);
      } catch (err) {
        console.error('Error formatting price:', err);
        return price;
      }
    };
  
    if (loading) {
      return (
        <div className="dashboard-dash005">
          <div className="dashboard-container-dash005">
            <div className="loading-dash005">
              <div className="loading-spinner-dash005"></div>
              <p>Loading land properties...</p>
            </div>
          </div>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="dashboard-dash005">
          <div className="dashboard-container-dash005">
            <div className="error-dash005">
              <span className="error-icon-dash005">⚠️</span>
              <p>Error: {error}</p>
            </div>
          </div>
        </div>
      );
    }
  
    return (
      <div className="dashboard-dash005">
        <div className="dashboard-container-dash005">
          <div className="dashboard-header-dash005">
            <h1>Land Property Management</h1>
            <button
              onClick={() => navigate('/admin/lands/new')}
              className="add-property-btn-dash005"
            >
              <span className="btn-icon-dash005">+</span>
              Add New Land Property
            </button>
          </div>
  
          {lands && lands.length > 0 ? (
            <div className="properties-grid-dash005">
              {lands.map((land) => (
                <div key={land._id} className="property-card-dash005">
                  {land.images && land.images.length > 0 ? (
                    <div className="property-image-container-dash005">
                      <img
                        src={getLandImageUrl(land.images[currentImageIndexes[land._id]])}
                        alt={`${land.title} - Image ${currentImageIndexes[land._id] + 1}`}
                        className="property-image-dash005"
                        onClick={() => handleLandDetailView(land)}
                        onError={(e) => {
                          e.target.src = '/fallback-image.jpg';
                        }}
                      />
                      {land.images.length > 1 && (
                        <div className="image-navigation-dash005">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              cycleImage(land._id, 'prev');
                            }}
                            className="nav-button-dash005 prev-dash005"
                            aria-label="Previous image"
                          >
                            ◀
                          </button>
                          <span className="image-counter-dash005">
                            {currentImageIndexes[land._id] + 1} / {land.images.length}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              cycleImage(land._id, 'next');
                            }}
                            className="nav-button-dash005 next-dash005"
                            aria-label="Next image"
                          >
                            ▶
                          </button>
                        </div>
                      )}
                      <div className="image-overlay-dash005">
                        <span className="property-status-dash005">
                          {land.isAvailable !== undefined 
                            ? (land.isAvailable ? 'Published' : 'Unpublished') 
                            : 'Active'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="no-image-placeholder-dash005">
                      <span>No Image Available</span>
                    </div>
                  )}
                  
                  <div className="property-content-dash005">
                    <h3 className="property-title-dash005">{land.title}</h3>
                    
                    <div className="property-details-dash005">
                      <div className="detail-item-dash005">
                        <span className="detail-label-dash005">Location</span>
                        <span className="detail-value-dash005">{land.location}</span>
                      </div>
                      <div className="detail-item-dash005">
                        <span className="detail-label-dash005">Price</span>
                        <span className="detail-value-dash005">{formatPrice(land.price)}</span>
                      </div>
                      <div className="detail-item-dash005">
                        <span className="detail-label-dash005">Area</span>
                        <span className="detail-value-dash005">{land.area}</span>
                      </div>
                    </div>
                    
                    <div className="property-actions-dash005">
                      {land.isAvailable !== undefined && (
                        <button
                          onClick={() => toggleAvailability(land)}
                          className={`action-btn-dash005 ${land.isAvailable ? 'unpublish-dash005' : 'publish-dash005'}`}
                        >
                          {land.isAvailable ? 'Unpublish' : 'Publish'}
                        </button>
                      )}
                      <button
                        onClick={() => handleLandDetailView(land)}
                        className="action-btn-dash005 view-dash005"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => navigate(`/admin/lands/edit/${land._id}`)}
                        className="action-btn-dash005 edit-dash005"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(land._id)}
                        className="action-btn-dash005 delete-dash005"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-properties-dash005">
              <span className="no-properties-icon-dash005">📋</span>
              <p>No land properties found. Add some properties to get started.</p>
            </div>
          )}
  
          {selectedLand && (
            <div className="property-detail-modal-dash005" onClick={() => setSelectedLand(null)}>
              <div className="property-detail-content-dash005" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => setSelectedLand(null)} 
                  className="close-modal-btn-dash005"
                >
                  ✕
                </button>
                
                <div className="property-detail-info-dash005">
                  <h2>{selectedLand.title}</h2>
                  
                  {selectedLand.images && selectedLand.images.length > 0 && (
                    <div className="modal-image-container-dash005">
                      <img
                        src={getLandImageUrl(selectedLand.images[modalImageIndex])}
                        alt={`${selectedLand.title} - Image ${modalImageIndex + 1}`}
                        className="modal-property-image-dash005"
                        onError={(e) => {
                          e.target.src = '/fallback-image.jpg';
                        }}
                      />
                      {selectedLand.images.length > 1 && (
                        <div className="modal-image-navigation-dash005">
                          <button 
                            onClick={() => cycleImage(selectedLand._id, 'prev', true)}
                            className="modal-nav-button-dash005"
                            aria-label="Previous image"
                          >
                            ◀
                          </button>
                          <span className="modal-image-counter-dash005">
                            {modalImageIndex + 1} / {selectedLand.images.length}
                          </span>
                          <button 
                            onClick={() => cycleImage(selectedLand._id, 'next', true)}
                            className="modal-nav-button-dash005"
                            aria-label="Next image"
                          >
                            ▶
                          </button>
                        </div>
                      )}
                    </div>
                  )}
  
                  <div className="detail-section-dash005">
                    <h3>Location & Price</h3>
                    <div className="property-stats-dash005">
                      <div className="stat-item-dash005">
                        <div className="stat-label-dash005">Location</div>
                        <div className="stat-value-dash005">{selectedLand.location}</div>
                      </div>
                      <div className="stat-item-dash005">
                        <div className="stat-label-dash005">Price</div>
                        <div className="stat-value-dash005">{formatPrice(selectedLand.price)}</div>
                      </div>
                    </div>
                  </div>
  
                  <div className="detail-section-dash005">
                    <h3>Property Details</h3>
                    <div className="property-stats-dash005">
                      <div className="stat-item-dash005">
                        <div className="stat-label-dash005">Area</div>
                        <div className="stat-value-dash005">{selectedLand.area}</div>
                      </div>
                      <div className="stat-item-dash005">
                        <div className="stat-label-dash005">Type</div>
                        <div className="stat-value-dash005">{selectedLand.type}</div>
                      </div>
                    </div>
                  </div>
  
                  {selectedLand.features && selectedLand.features.length > 0 && (
                    <div className="detail-section-dash005">
                      <h3>Features</h3>
                      <ul className="features-list-dash005">
                        {selectedLand.features.map((feature, index) => (<li key={index}>{feature}</li>
                      ))}
                      </ul>
                    </div>
                  )}

                  {selectedLand.description && (
                    <div className="detail-section-dash005">
                      <h3>Description</h3>
                      <p>{selectedLand.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  export default LandAdminDashboard;