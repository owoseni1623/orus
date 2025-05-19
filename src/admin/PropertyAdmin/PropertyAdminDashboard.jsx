import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './PropertyAdminDashboard.css';

const PropertyAdminDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const navigate = useNavigate();

  // Helper function to construct full image URL
  const getPropertyImageUrl = (imageName) => {
    if (!imageName) return null;
    if (imageName.startsWith('http://') || imageName.startsWith('https://')) {
      return imageName;
    }
    const filename = imageName.split(/[\/\\]/).pop();
    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
    return `${baseUrl}/uploads/properties/${filename}`;
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/properties`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setProperties(response.data || []);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error fetching properties';
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
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/properties/${id}`, {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        toast.success('Property deleted successfully');
        fetchProperties();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error deleting property');
        if (error.response?.status === 401) {
          navigate('/login');
        }
      }
    }
  };

  const toggleAvailability = async (property) => {
    try {
      const updatedProperty = {
        ...property,
        isAvailable: property.isAvailable !== undefined ? !property.isAvailable : false
      };
      
      await axios.put(
        `${import.meta.env.VITE_API_URL}/properties/${property._id}`,
        updatedProperty,
        {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      toast.success(`Property ${updatedProperty.isAvailable ? 'published' : 'unpublished'} successfully`);
      fetchProperties();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating property availability');
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handlePropertyDetailView = (property) => {
    setSelectedProperty(property);
  };

  if (loading) {
    return (
      <div className="dashboard-dash005">
        <div className="dashboard-container-dash005">
          <div className="loading-dash005">
            <div className="loading-spinner-dash005"></div>
            <p>Loading properties...</p>
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
          <h1>Property Management</h1>
          <button
            onClick={() => navigate('/admin/properties/new')}
            className="add-property-btn-dash005"
          >
            <span className="btn-icon-dash005">+</span>
            Add New Property
          </button>
        </div>

        {properties && properties.length > 0 ? (
          <div className="properties-grid-dash005">
            {properties.map((property) => (
              <div key={property._id} className="property-card-dash005">
                {property.images && property.images.length > 0 ? (
                  <div className="property-image-container-dash005">
                    <img
                      src={getPropertyImageUrl(property.images[0])}
                      alt={property.title}
                      className="property-image-dash005"
                    />
                    <div className="image-overlay-dash005">
                      <span className="property-status-dash005">
                        {property.isAvailable !== undefined 
                          ? (property.isAvailable ? 'Published' : 'Unpublished') 
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
                  <h3 className="property-title-dash005">{property.title}</h3>
                  
                  <div className="property-details-dash005">
                    <div className="detail-item-dash005">
                      <span className="detail-label-dash005">Location</span>
                      <span className="detail-value-dash005">{property.location}</span>
                    </div>
                    <div className="detail-item-dash005">
                      <span className="detail-label-dash005">Price</span>
                      <span className="detail-value-dash005">{property.price}</span>
                    </div>
                    <div className="detail-item-dash005">
                      <span className="detail-label-dash005">Bedrooms</span>
                      <span className="detail-value-dash005">{property.bedrooms}</span>
                    </div>
                    <div className="detail-item-dash005">
                      <span className="detail-label-dash005">Bathrooms</span>
                      <span className="detail-value-dash005">{property.bathrooms}</span>
                    </div>
                  </div>
                  
                  <div className="property-actions-dash005">
                    {property.isAvailable !== undefined && (
                      <button
                        onClick={() => toggleAvailability(property)}
                        className={`action-btn-dash005 ${property.isAvailable ? 'unpublish-dash005' : 'publish-dash005'}`}
                      >
                        {property.isAvailable ? 'Unpublish' : 'Publish'}
                      </button>
                    )}
                    <button
                      onClick={() => handlePropertyDetailView(property)}
                      className="action-btn-dash005 view-dash005"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => navigate(`/admin/properties/edit/${property._id}`)}
                      className="action-btn-dash005 edit-dash005"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(property._id)}
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
            <p>No properties found. Add some properties to get started.</p>
          </div>
        )}

        {/* Property Detail Modal */}
        {selectedProperty && (
          <div className="property-detail-modal-dash005" onClick={() => setSelectedProperty(null)}>
            <div className="property-detail-content-dash005" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setSelectedProperty(null)} 
                className="close-modal-btn-dash005"
              >
                ✕
              </button>
              
              <div className="property-detail-info-dash005">
                <h2>{selectedProperty.title}</h2>
                
                {selectedProperty.images && selectedProperty.images.length > 0 && (
                  <img
                    src={getPropertyImageUrl(selectedProperty.images[0])}
                    alt={selectedProperty.title}
                    className="modal-property-image-dash005"
                  />
                )}

                <div className="detail-section-dash005">
                  <h3>Location & Price</h3>
                  <div className="property-stats-dash005">
                    <div className="stat-item-dash005">
                      <div className="stat-label-dash005">Location</div>
                      <div className="stat-value-dash005">{selectedProperty.location}</div>
                    </div>
                    <div className="stat-item-dash005">
                      <div className="stat-label-dash005">Price</div>
                      <div className="stat-value-dash005">{selectedProperty.price}</div>
                    </div>
                  </div>
                </div>

                <div className="detail-section-dash005">
                  <h3>Property Details</h3>
                  <div className="property-stats-dash005">
                    <div className="stat-item-dash005">
                      <div className="stat-label-dash005">Bedrooms</div>
                      <div className="stat-value-dash005">{selectedProperty.bedrooms}</div>
                    </div>
                    <div className="stat-item-dash005">
                      <div className="stat-label-dash005">Bathrooms</div>
                      <div className="stat-value-dash005">{selectedProperty.bathrooms}</div>
                    </div>
                    <div className="stat-item-dash005">
                      <div className="stat-label-dash005">Area</div>
                      <div className="stat-value-dash005">{selectedProperty.area}</div>
                    </div>
                    <div className="stat-item-dash005">
                      <div className="stat-label-dash005">Year Built</div>
                      <div className="stat-value-dash005">{selectedProperty.yearBuilt}</div>
                    </div>
                  </div>
                </div>

                <div className="detail-section-dash005">
                  <h3>Features</h3>
                  <ul className="features-list-dash005">
                    {selectedProperty.features?.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>

                <div className="detail-section-dash005">
                  <h3>Description</h3>
                  <p>{selectedProperty.description}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyAdminDashboard;