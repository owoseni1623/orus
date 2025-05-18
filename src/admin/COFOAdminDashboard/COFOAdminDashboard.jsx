import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './COFOAdminDashboard.css';

// API base URL configuration
axios.defaults.baseURL = 'https://orus-home.onrender.com';

// Enhanced Modal Component
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

// Enhanced Image Preview Modal Component
const ImagePreviewModal = ({ isOpen, onClose, imageUrl, imageName }) => {
  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = imageName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download image');
      console.error('Download error:', error);
    }
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = '/placeholder-image.png';
    toast.error('Failed to load image');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content image-preview-modal">
        <button className="modal-close-btn" onClick={onClose}>×</button>
        <div className="modal-body">
          <div className="image-preview-container">
            <img 
              src={imageUrl} 
              alt="Document Preview" 
              className="preview-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder-image.png'; // Add a placeholder image
                toast.error('Failed to load image');
              }}
            />
            <div className="image-preview-actions">
              <button 
                className="download-btn"
                onClick={handleDownload}
              >
                Download Image
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const COFOAdminDashboard = () => {
  // Your existing state
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  
  // Enhanced image handling state
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: null, name: null });
  const [replyImages, setReplyImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchApplications();
  }, []);

  // Your existing fetchApplications function
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get('/api/v1/cofo', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setApplications(response.data.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError(error.response?.data?.message || 'Failed to fetch applications');
      toast.error('Unable to load C of O applications');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced image preview handler
  const handleImagePreview = (imageUrl, imageName) => {
    setSelectedImage({ url: imageUrl, name: imageName });
    setShowImagePreviewModal(true);
  };

  // Your existing handlers
  const handleReplyImageSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length + replyImages.length > 10) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 5MB limit`);
        return;
      }
      
      if (!file.type.match('image.*')) {
        toast.error(`File ${file.name} is not an image`);
        return;
      }
    });

    setReplyImages(prevImages => [...prevImages, ...files]);
  };

  const handleRemoveReplyImage = (index) => {
    setReplyImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const handleSendReply = async () => {
    if (!selectedApplication || (!replyMessage.trim() && replyImages.length === 0)) {
      toast.error('Please enter a message or attach images');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('message', replyMessage);
      replyImages.forEach(image => {
        formData.append('images', image);
      });

      await axios.post(
        `/api/v1/cofo/${selectedApplication._id}/reply`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      );

      toast.success('Reply sent successfully');
      setReplyMessage('');
      setReplyImages([]);
      setShowReplyModal(false);
      setUploadProgress(0);
      fetchApplications();
    } catch (error) {
      toast.error('Failed to send reply');
      console.error('Reply error:', error);
    }
  };

  // Your existing updateApplicationStatus function
  const updateApplicationStatus = async (id, newStatus, newStage) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(`/api/v1/cofo/${id}/stage`, 
        { 
          status: newStatus,
          currentStage: newStage 
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      await fetchApplications();
      toast.success('Application status updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update application status');
    }
  };

  const filteredApplications = statusFilter === 'all' 
    ? applications 
    : applications.filter(app => app.status === statusFilter);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'processing': return 'badge-info';
      case 'verified': return 'badge-success';
      case 'approved': return 'badge-success';
      case 'rejected': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="cofo015-admin-dashboard">
      {/* Your existing header section */}
      <div className="cofo015-dashboard-header">
        <h1>C of O Applications Management</h1>
        
        <div className="cofo015-filter-section">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cofo015-status-filter"
          >
            <option value="all">All Applications</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="verified">Verified</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications table */}
      <div className="cofo015-applications-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Property Type</th>
              <th>Location</th>
              <th>Package</th>
              <th>Stage</th>
              <th>Status</th>
              <th>Documents</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.map((application) => (
              <tr key={application._id}>
                <td>{application.fullName}</td>
                <td>{application.propertyType}</td>
                <td>{application.propertyLocation}</td>
                <td>{application.selectedPackage}</td>
                <td>Stage {application.currentStage}</td>
                <td>
                  <span className={`cofo015-badge ${getStatusColor(application.status)}`}>
                    {application.status}
                  </span>
                </td>
                <td>
                  <div className="cofo015-documents">
                    {application.documents.map((doc, index) => (
                      <div key={index} className="cofo015-document-item">
                        <span 
                          className="cofo015-document-name"
                          onClick={() => handleImagePreview(doc.url, doc.name)}
                        >
                          {doc.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="cofo015-action-buttons">
                    <button 
                      onClick={() => {
                        setSelectedApplication(application);
                        setShowDetailModal(true);
                      }}
                      className="cofo015-btn-view"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        setSelectedApplication(application);
                        setShowReplyModal(true);
                      }}
                      className="cofo015-btn-reply"
                    >
                      Reply
                    </button>
                    <select
                      value={application.currentStage}
                      onChange={(e) => updateApplicationStatus(
                        application._id, 
                        application.status,
                        parseInt(e.target.value)
                      )}
                      className="cofo015-stage-change"
                    >
                      <option value="1">Stage 1</option>
                      <option value="2">Stage 2</option>
                      <option value="3">Stage 3</option>
                      <option value="4">Stage 4</option>
                    </select>
                    <select
                      value={application.status}
                      onChange={(e) => updateApplicationStatus(
                        application._id,
                        e.target.value,
                        application.currentStage
                      )}
                      className="cofo015-status-change"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="verified">Verified</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Application Details Modal */}
      <Modal 
        isOpen={showDetailModal} 
        onClose={() => setShowDetailModal(false)}
      >
        {selectedApplication && (
          <div className="cofo015-application-details">
            <h2>Application Details</h2>
            <div className="cofo015-detail-grid">
              <div className="cofo015-detail-item">
                <strong>Name:</strong> {selectedApplication.fullName}
              </div>
              <div className="cofo015-detail-item">
                <strong>Email:</strong> {selectedApplication.email}
              </div>
              <div className="cofo015-detail-item">
                <strong>Phone:</strong> {selectedApplication.phoneNumber}
              </div>
              <div className="cofo015-detail-item">
                <strong>Property Type:</strong> {selectedApplication.propertyType}
              </div>
              <div className="cofo015-detail-item">
                <strong>Location:</strong> {selectedApplication.propertyLocation}
              </div>
              <div className="cofo015-detail-item">
                <strong>Package:</strong> {selectedApplication.selectedPackage}
              </div>
              <div className="cofo015-detail-item">
                <strong>Current Stage:</strong> {selectedApplication.currentStage}
              </div>
              <div className="cofo015-detail-item">
                <strong>Status:</strong> {selectedApplication.status}
              </div>
              <div className="cofo015-detail-item full-width">
                <strong>Additional Notes:</strong> 
                {selectedApplication.additionalNotes || 'No additional notes'}
              </div>
              <div className="cofo015-detail-item">
                <strong>Submitted:</strong> 
                {new Date(selectedApplication.createdAt).toLocaleString()}
              </div>
              <div className="cofo015-detail-item full-width">
                <strong>Documents:</strong>
                <div className="cofo015-documents-grid">
                  {selectedApplication.documents.map((doc, index) => (
                    <div key={index} className="cofo015-document-preview">
                      <img 
                        src={doc.url} 
                        alt={doc.name}
                        onClick={() => handleImagePreview(doc.url, doc.name)}
                        className="cofo015-document-thumbnail"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-image.png';
                        }}
                      />
                      <span>{doc.name}</span>
                    </div>
                  ))}
                </div>
              </div>
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
          setUploadProgress(0);
        }}
      >
        <div className="cofo015-reply-modal">
          <h2>Reply to Application</h2>
          <div className="cofo015-reply-content">
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Enter your message..."
              rows={5}
              className="cofo015-reply-textarea"
            />
            <div className="cofo015-reply-images">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleReplyImageSelect}
                className="cofo015-image-input"
              />
              <div className="cofo015-selected-images">
                {replyImages.map((image, index) => (
                  <div key={index} className="cofo015-selected-image">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Selected ${index + 1}`}
                      className="cofo015-image-preview"
                    />
                    <button
                      onClick={() => handleRemoveReplyImage(index)}
                      className="cofo015-remove-image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              {uploadProgress > 0 && (
                <div className="cofo015-upload-progress">
                  <div 
                    className="cofo015-progress-bar"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    {uploadProgress}%
                  </div>
                </div>
              )}
            </div>
            <div className="cofo015-reply-actions">
              <button 
                onClick={handleSendReply}
                className="cofo015-btn-send"
                disabled={!replyMessage.trim() && replyImages.length === 0}
              >
                Send Reply
              </button>
              <button 
                onClick={() => {
                  setShowReplyModal(false);
                  setReplyMessage('');
                  setReplyImages([]);
                  setUploadProgress(0);
                }}
                className="cofo015-btn-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Enhanced Image Preview Modal */}
      <ImagePreviewModal
        isOpen={showImagePreviewModal}
        onClose={() => {
          setShowImagePreviewModal(false);
          setSelectedImage({ url: null, name: null });
        }}
        imageUrl={selectedImage.url}
        imageName={selectedImage.name}
      />
    </div>
  );
};

export default COFOAdminDashboard;