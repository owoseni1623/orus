import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EngineeringAdmin.css';

const EngineeringAdmin = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    projectType: '',
    description: '',
    status: ''
  });
  const [replyForm, setReplyForm] = useState({
    message: '',
    attachments: []
  });

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const response = await axios.get('/api/engineering');
      setConsultations(response.data.data);
      setLoading(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Error fetching consultations');
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status, e) => {
    e.stopPropagation();
    try {
      await axios.put(`/api/engineering/${id}/status`, { status });
      fetchConsultations();
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating status');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this consultation?')) {
      try {
        await axios.delete(`/api/engineering/${id}`);
        fetchConsultations();
        setSelectedConsultation(null);
        setIsEditing(false);
        setIsReplying(false);
      } catch (error) {
        setError(error.response?.data?.message || 'Error deleting consultation');
      }
    }
  };

  const handleEdit = (consultation, e) => {
    if (e) e.stopPropagation();
    setEditForm({
      name: consultation.name,
      email: consultation.email,
      projectType: consultation.projectType,
      description: consultation.description,
      status: consultation.status
    });
    setSelectedConsultation(consultation);
    setIsEditing(true);
    setIsReplying(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`/api/engineering/${selectedConsultation._id}`, editForm);
      if (response.data.success) {
        fetchConsultations();
        setIsEditing(false);
        const updatedConsultation = response.data.data;
        setSelectedConsultation(updatedConsultation);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating consultation');
    }
  };

  const handleReply = (consultation, e) => {
    if (e) e.stopPropagation();
    setSelectedConsultation(consultation);
    setIsReplying(true);
    setIsEditing(false);
    setReplyForm({
      message: '',
      attachments: []
    });
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('message', replyForm.message);
    replyForm.attachments.forEach((file) => {
      formData.append('attachments', file);
    });

    try {
      const response = await axios.post(
        `/api/engineering/${selectedConsultation._id}/reply`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      if (response.data.success) {
        fetchConsultations();
        setIsReplying(false);
        const updatedConsultation = response.data.data;
        setSelectedConsultation(updatedConsultation);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error sending reply');
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setReplyForm(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index, e) => {
    if (e) e.stopPropagation();
    setReplyForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      'in-review': 'status-review',
      approved: 'status-approved',
      rejected: 'status-rejected'
    };
    return statusClasses[status] || '';
  };

  const closeModal = () => {
    setSelectedConsultation(null);
    setIsEditing(false);
    setIsReplying(false);
  };

  const handleCardClick = (consultation) => {
    setSelectedConsultation(consultation);
    setIsEditing(false);
    setIsReplying(false);
  };

  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  // Get image URL with error handling
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If the path already includes the full URL or starts with /uploads, use it directly
    if (imagePath.startsWith('http') || imagePath.startsWith('/uploads')) {
      return imagePath;
    }
    
    // Otherwise, prepend the uploads path
    return `/uploads/engineering/${imagePath}`;
  };

  // Custom date formatter to avoid date-fns dependency issues
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      // Check if date is valid before formatting
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      // Format date without using date-fns: May 18, 2025
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) return <div className="engineering-admin-loading">Loading...</div>;
  if (error) return <div className="engineering-admin-error">Error: {error}</div>;

  return (
    <div className="eng006-engineering-admin">
      <header className="eng006-admin-header">
        <h1>Engineering Consultations Management</h1>
        <p>Total Consultations: {consultations.length}</p>
      </header>

      <div className="eng006-consultations-container">
        <div className="eng006-consultations-grid">
          {consultations.map((consultation) => (
            <div 
              key={consultation._id} 
              className="eng006-consultation-card"
              onClick={() => handleCardClick(consultation)}
            >
              <div className="eng006-consultation-header">
                <span className={`eng006-status-badge eng006-${getStatusClass(consultation.status)}`}>
                  {consultation.status}
                </span>
                <span className="eng006-consultation-date">
                  {formatDate(consultation.createdAt)}
                </span>
              </div>

              <div className="eng006-consultation-body">
                <h3>{consultation.name}</h3>
                <p className="eng006-email">{consultation.email}</p>
                <p className="eng006-project-type">Project: {consultation.projectType}</p>
                <div className="eng006-description">
                  <strong>Description:</strong>
                  <p>{consultation.description}</p>
                </div>

                {consultation.images?.length > 0 && (
                  <div className="eng006-images-grid">
                    {consultation.images.map((image, index) => (
                      <img
                        key={index}
                        src={getImageUrl(image)}
                        alt={`Project ${index + 1}`}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/api/placeholder/200/150';
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="eng006-consultation-actions" onClick={(e) => e.stopPropagation()}>
                <select
                  value={consultation.status}
                  onChange={(e) => handleStatusUpdate(consultation._id, e.target.value, e)}
                  className="eng006-status-select"
                >
                  <option value="pending">Pending</option>
                  <option value="in-review">In Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <div className="eng006-action-buttons">
                  <button
                    onClick={(e) => handleEdit(consultation, e)}
                    className="eng006-edit-button"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => handleReply(consultation, e)}
                    className="eng006-reply-button"
                  >
                    Reply
                  </button>
                  <button
                    onClick={(e) => handleDelete(consultation._id, e)}
                    className="eng006-delete-button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedConsultation && (
        <div className="eng006-modal-overlay" onClick={closeModal}>
          <div className="eng006-modal-content" onClick={handleModalContentClick}>
            <button className="eng006-modal-close" onClick={closeModal}>×</button>
            {isEditing ? (
              <div className="eng006-edit-form">
                <h2>Edit Consultation</h2>
                <form onSubmit={handleEditSubmit}>
                  <div className="eng006-form-group">
                    <label>Name:</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="eng006-form-group">
                    <label>Email:</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="eng006-form-group">
                    <label>Project Type:</label>
                    <select
                      value={editForm.projectType}
                      onChange={(e) => setEditForm(prev => ({ ...prev, projectType: e.target.value }))}
                      required
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="industrial">Industrial</option>
                      <option value="infrastructure">Infrastructure</option>
                    </select>
                  </div>
                  <div className="eng006-form-group">
                    <label>Description:</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="eng006-form-actions">
                    <button type="submit" className="eng006-submit-button">Save Changes</button>
                    <button type="button" className="eng006-cancel-button" onClick={() => setIsEditing(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            ) : isReplying ? (
              <div className="eng006-reply-form">
                <h2>Reply to Consultation</h2>
                <form onSubmit={handleReplySubmit}>
                  <div className="eng006-form-group">
                    <label>Message:</label>
                    <textarea
                      value={replyForm.message}
                      onChange={(e) => setReplyForm(prev => ({ ...prev, message: e.target.value }))}
                      required
                      placeholder="Type your reply here..."
                    />
                  </div>
                  <div className="eng006-form-group">
                    <label>Attachments:</label>
                    <div className="eng006-file-upload-container">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="eng006-file-input"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="eng006-file-upload-label">
                        Choose Files
                      </label>
                    </div>
                    <div className="eng006-attachment-preview">
                      {replyForm.attachments.map((file, index) => (
                        <div key={index} className="eng006-attachment-item">
                          <span>{file.name}</span>
                          <button
                            type="button"
                            onClick={(e) => removeAttachment(index, e)}
                            className="eng006-remove-attachment"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="eng006-form-actions">
                    <button type="submit" className="eng006-submit-button">Send Reply</button>
                    <button type="button" className="eng006-cancel-button" onClick={() => setIsReplying(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="eng006-consultation-details">
                <h2>{selectedConsultation.name}'s Project Details</h2>
                <div className="eng006-details-content">
                  <p><strong>Email:</strong> {selectedConsultation.email}</p>
                  <p><strong>Project Type:</strong> {selectedConsultation.projectType}</p>
                  <p>
                    <strong>Status:</strong> 
                    <span className={`eng006-status-badge eng006-${getStatusClass(selectedConsultation.status)}`}>
                      {selectedConsultation.status}
                    </span>
                  </p>
                  <div className="eng006-description-section">
                    <strong>Description:</strong>
                    <p>{selectedConsultation.description}</p>
                  </div>
                  {selectedConsultation.images?.length > 0 && (
                    <div className="eng006-details-images">
                      <strong>Project Images:</strong>
                      <div className="eng006-images-grid-large">
                        {selectedConsultation.images.map((image, index) => (
                          <img
                            key={index}
                            src={getImageUrl(image)}
                            alt={`Project ${index + 1}`}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/api/placeholder/400/300';
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedConsultation.replies && selectedConsultation.replies.length > 0 && (
                    <div className="eng006-replies-section">
                      <h3>Replies</h3>
                      {selectedConsultation.replies.map((reply, index) => (
                        <div key={index} className="eng006-reply-item">
                          <p className="eng006-reply-date">{formatDate(reply.createdAt)}</p>
                          <p className="eng006-reply-message">{reply.message}</p>
                          {reply.attachments && reply.attachments.length > 0 && (
                            <div className="eng006-reply-attachments">
                              {reply.attachments.map((attachment, idx) => (
                                <a
                                  key={idx} 
                                  href={getImageUrl(attachment)} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="eng006-attachment-link"
                                >
                                  Attachment {idx + 1}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="eng006-detail-actions">
                  <button onClick={(e) => handleEdit(selectedConsultation, e)} className="eng006-edit-button">
                    Edit
                  </button>
                  <button onClick={(e) => handleReply(selectedConsultation, e)} className="eng006-reply-button">
                    Reply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EngineeringAdmin;