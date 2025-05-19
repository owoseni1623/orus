import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './SurveyAdminDashboard.css';

// Custom Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose}>×</button>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

const SurveyAdminDashboard = () => {
  // State management
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyImages, setReplyImages] = useState([]);
  const [submitStatus, setSubmitStatus] = useState({
    loading: false,
    error: null
  });

  // Fetch surveys on component mount
  useEffect(() => {
    fetchSurveys();
  }, []);

  // Fetch surveys from backend
  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('/api/surveys', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const surveyData = response.data.data || response.data || [];
      setSurveys(surveyData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching surveys:', error);
      setError('Failed to fetch surveys');
      setLoading(false);
      toast.error('Unable to load survey requests');
    }
  };

  // Update survey status
  const updateSurveyStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(`/api/surveys/${id}`, 
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      fetchSurveys();
      toast.success('Survey status updated successfully');
    } catch (error) {
      toast.error('Failed to update survey status');
    }
  };

  // Handle reply image changes
  const handleReplyImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }
    setReplyImages(files);
  };

  // Send reply to survey request
  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast.error('Reply message cannot be empty');
      return;
    }

    setSubmitStatus({ loading: true, error: null });

    try {
      const formData = new FormData();
      formData.append('message', replyMessage);
      
      replyImages.forEach(file => {
        formData.append('images', file);
      });

      const token = localStorage.getItem('token');
      
      await axios.post(`/api/surveys/${selectedSurvey._id}/reply`, 
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setShowReplyModal(false);
      setReplyMessage('');
      setReplyImages([]);
      setSubmitStatus({ loading: false, error: null });
      fetchSurveys();
      toast.success('Reply sent successfully');
    } catch (error) {
      setSubmitStatus({ loading: false, error: 'Failed to send reply' });
      toast.error('Failed to send reply');
    }
  };

  // Determine status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'badge-warning';
      case 'In Progress': return 'badge-info';
      case 'Completed': return 'badge-success';
      default: return 'badge-secondary';
    }
  };

  // Get proper image URL with error handling
  const getImageUrl = (imageName) => {
    if (!imageName) return null;
    
    // Make sure the image path is correctly formatted
    const cleanPath = imageName.replace(/^uploads[\/\\]/, '');
    return `/uploads/surveys/${cleanPath}`;
  };

  // Filter surveys based on status
  const filteredSurveys = Array.isArray(surveys)
    ? (statusFilter === 'all' 
        ? surveys 
        : surveys.filter(survey => survey.status === statusFilter))
    : [];

  // Render loading state
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading survey requests...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchSurveys} className="btn-retry">
            Retry Fetching
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-admin-dashboard">
      <div className="dashboard-header">
        <h1>Survey Requests Management</h1>
        
        <div className="filter-section">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Requests</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {filteredSurveys.length === 0 ? (
        <div className="no-surveys-message">
          No survey requests found
        </div>
      ) : (
        <div className="surveys-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSurveys.map((survey) => (
                <tr key={survey._id}>
                  <td>{survey.name}</td>
                  <td>{survey.email}</td>
                  <td>{survey.landLocation}</td>
                  <td>
                    <span className={`badge ${getStatusColor(survey.status)}`}>
                      {survey.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => {
                          setSelectedSurvey(survey);
                          setShowDetailModal(true);
                        }}
                        className="btn-view"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedSurvey(survey);
                          setShowReplyModal(true);
                        }}
                        className="btn-reply"
                      >
                        Reply
                      </button>
                      <select
                        value={survey.status}
                        onChange={(e) => updateSurveyStatus(survey._id, e.target.value)}
                        className="status-change"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Survey Details Modal */}
      <Modal 
        isOpen={showDetailModal} 
        onClose={() => setShowDetailModal(false)}
      >
        {selectedSurvey && (
          <div className="survey-details">
            <h2>Survey Request Details</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <strong>Name:</strong> {selectedSurvey.name}
              </div>
              <div className="detail-item">
                <strong>Email:</strong> {selectedSurvey.email}
              </div>
              <div className="detail-item">
                <strong>Phone:</strong> {selectedSurvey.phone}
              </div>
              <div className="detail-item">
                <strong>Land Location:</strong> {selectedSurvey.landLocation}
              </div>
              <div className="detail-item full-width">
                <strong>Additional Details:</strong> 
                {selectedSurvey.additionalDetails || 'No additional details'}
              </div>
              <div className="detail-item">
                <strong>Status:</strong> {selectedSurvey.status}
              </div>
              <div className="detail-item">
                <strong>Submitted:</strong> {new Date(selectedSurvey.createdAt).toLocaleString()}
              </div>
              
              {/* Survey Images */}
              {selectedSurvey.images?.length > 0 && (
                <div className="survey-images full-width">
                  <h3>Uploaded Images</h3>
                  <div className="image-grid">
                    {selectedSurvey.images.map((image, index) => (
                      <div key={index} className="image-container">
                        <img
                          src={getImageUrl(image)}
                          alt={`Survey image ${index + 1}`}
                          className="survey-image"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/api/placeholder/300/300';
                            console.log(`Failed to load image: ${image}`);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Reply section if exists */}
              {selectedSurvey.adminReply?.message && (
                <div className="admin-reply full-width">
                  <h3>Admin Reply</h3>
                  <p>{selectedSurvey.adminReply.message}</p>
                  
                  {/* Reply Images */}
                  {selectedSurvey.adminReply.images?.length > 0 && (
                    <div className="reply-images">
                      <h4>Reply Images</h4>
                      <div className="image-grid">
                        {selectedSurvey.adminReply.images.map((image, index) => (
                          <div key={index} className="image-container">
                            <img
                              src={getImageUrl(image)}
                              alt={`Reply image ${index + 1}`}
                              className="reply-image"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/api/placeholder/300/300';
                                console.log(`Failed to load reply image: ${image}`);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reply Modal */}
      <Modal 
        isOpen={showReplyModal} 
        onClose={() => {
          setShowReplyModal(false);
          setReplyMessage('');
          setReplyImages([]);
        }}
      >
        {selectedSurvey && (
          <div className="reply-modal">
            <h2>Reply to {selectedSurvey.name}</h2>
            <textarea 
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Write your reply here..."
              rows={6}
            />
            
            <div className="reply-image-upload">
              <label htmlFor="reply-images">Attach Images (Max 10)</label>
              <input
                type="file"
                id="reply-images"
                accept="image/*"
                multiple
                onChange={handleReplyImageChange}
                max="10"
              />
              <div className="selected-files">
                {replyImages.length > 0 && (
                  <p>{replyImages.length} {replyImages.length === 1 ? 'image' : 'images'} selected</p>
                )}
                {replyImages.map((file, index) => (
                  <div key={index} className="selected-file">
                    {file.name}
                    <button
                      type="button"
                      className="remove-file"
                      onClick={() => {
                        const newFiles = [...replyImages];
                        newFiles.splice(index, 1);
                        setReplyImages(newFiles);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowReplyModal(false);
                  setReplyMessage('');
                  setReplyImages([]);
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button 
                onClick={handleSendReply}
                className="btn-send"
                disabled={!replyMessage.trim() || submitStatus.loading}
              >
                {submitStatus.loading ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
            
            {submitStatus.error && (
              <div className="error-message">
                {submitStatus.error}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SurveyAdminDashboard;