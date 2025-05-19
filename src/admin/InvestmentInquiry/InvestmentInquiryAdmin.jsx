import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Dialog } from '@headlessui/react';
import { Button } from '@mui/material';
import './InvestmentInquiryAdmin.css';

const InvestmentInquiryAdmin = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [responseFiles, setResponseFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedResponse, setEditedResponse] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list', 'detail', 'edit', 'reply'
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://orus-home.onrender.com';

  useEffect(() => {
    fetchInquiries();
  }, []);

  const debugImagePaths = (inquiry) => {
    if (inquiry && inquiry.adminResponse && inquiry.adminResponse.images) {
      console.log('Debug: Image paths in database:', inquiry.adminResponse.images);
      console.log('Debug: Constructed URLs:');
      inquiry.adminResponse.images.forEach(img => {
        console.log(`${API_URL}/uploads/investment-responses/${img}`);
      });
    }
  };

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/investment-inquiries`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setInquiries(response.data.data);
    } catch (err) {
      setError('Failed to fetch inquiries');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInquirySelect = (inquiry) => {
    setSelectedInquiry(inquiry);
    setResponseText(inquiry.adminResponse?.text || '');
    setEditedResponse(inquiry.adminResponse?.text || '');
    setResponseFiles([]);
    setSubmitMessage(null);
    setViewMode('detail');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    debugImagePaths(inquiry);
  };

  const handleResponseChange = (e) => {
    setResponseText(e.target.value);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      alert('You can only upload up to 10 images');
      return;
    }
    setResponseFiles(files);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setViewMode('edit');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedResponse(selectedInquiry.adminResponse?.text || '');
    setViewMode('detail');
  };

  const handleReply = () => {
    setViewMode('reply');
    setResponseText('');
    setResponseFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelReply = () => {
    setViewMode('detail');
    setResponseText('');
    setResponseFiles([]);
  };

  const handleStatusChange = async (inquiryId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/investment-inquiries/${inquiryId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setInquiries(prev => 
        prev.map(inq => 
          inq._id === inquiryId ? { ...inq, status: newStatus } : inq
        )
      );
      
      if (selectedInquiry && selectedInquiry._id === inquiryId) {
        setSelectedInquiry(prev => ({ ...prev, status: newStatus }));
      }
      
    } catch (err) {
      setSubmitMessage({
        type: 'error',
        text: 'Failed to update status'
      });
      console.error('Error:', err);
    }
  };

  const handleUpdate = async () => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('text', editedResponse);

      const response = await axios.put(
        `${API_URL}/api/investment-inquiries/${selectedInquiry._id}/respond`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSelectedInquiry(response.data.data);
      setInquiries(prev => 
        prev.map(inq => 
          inq._id === response.data.data._id ? response.data.data : inq
        )
      );
      setIsEditing(false);
      setViewMode('detail');
      setSubmitMessage({ type: 'success', text: 'Response updated successfully' });
    } catch (err) {
      setSubmitMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update response'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!selectedInquiry) return;
    
    setIsSubmitting(true);
    setSubmitMessage(null);
    
    try {
      const formData = new FormData();
      formData.append('text', responseText);
      
      responseFiles.forEach(file => {
        formData.append('responseImages', file);
      });
      
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/investment-inquiries/${selectedInquiry._id}/respond`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      setSelectedInquiry(response.data.data);
      setInquiries(prev => 
        prev.map(inq => 
          inq._id === response.data.data._id ? response.data.data : inq
        )
      );
      
      setViewMode('detail');
      setSubmitMessage({
        type: 'success',
        text: 'Response sent successfully'
      });
      
      setResponseFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (err) {
      setSubmitMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to send response'
      });
      console.error('Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInquiry = async (inquiryId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/api/investment-inquiries/${inquiryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setInquiries(prev => prev.filter(inq => inq._id !== inquiryId));
      
      if (selectedInquiry && selectedInquiry._id === inquiryId) {
        setSelectedInquiry(null);
        setViewMode('list');
      }
      
    } catch (err) {
      setSubmitMessage({
        type: 'error',
        text: 'Failed to delete inquiry'
      });
      console.error('Error:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) return (
    <div className="inv007-loading-spinner">
      <div className="inv007-spinner"></div>
      <p>Loading inquiries...</p>
    </div>
  );

  if (error) return (
    <div className="inv007-error-message">
      {error}
    </div>
  );

  return (
    <div className="inv007-investment-inquiry-admin">
      <header className="inv007-admin-header">
        <h1>Investment Inquiries Management</h1>
        {viewMode !== 'list' && (
          <Button 
            variant="contained"
            onClick={() => setViewMode('list')}
            className="inv007-back-button"
          >
            Back to List
          </Button>
        )}
      </header>
      
      <div className="inv007-admin-layout">
        {viewMode === 'list' ? (
          <div className="inv007-inquiries-list">
            <div className="inv007-list-header">
              <h2>Inquiries ({inquiries.length})</h2>
            </div>
            
            {inquiries.length === 0 ? (
              <div className="inv007-no-inquiries">
                <p>No inquiries found</p>
              </div>
            ) : (
              <div className="inv007-inquiry-cards">
                {inquiries.map(inquiry => (
                  <div 
                    key={inquiry._id}
                    className={`inv007-inquiry-card inv007-status-${inquiry.status}`}
                    onClick={() => handleInquirySelect(inquiry)}
                  >
                    <div className="inv007-card-header">
                      <h3>{inquiry.name}</h3>
                      <span className="inv007-status-badge">
                        {inquiry.status}
                      </span>
                    </div>
                    <div className="inv007-card-content">
                      <p>{inquiry.email}</p>
                      <p>{inquiry.investmentInterest}</p>
                      <time>{formatDate(inquiry.createdAt)}</time>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="inv007-inquiry-detail">
            {selectedInquiry && (
              <>
                <div className="inv007-detail-header">
                  <div className="inv007-detail-title">
                    <h2>Inquiry from {selectedInquiry.name}</h2>
                    <div className="inv007-detail-actions">
                      <select 
                        value={selectedInquiry.status}
                        onChange={(e) => handleStatusChange(selectedInquiry._id, e.target.value)}
                        className={`inv007-status-select inv007-status-${selectedInquiry.status}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="contacted">Contacted</option>
                        <option value="closed">Closed</option>
                      </select>
                      
                      {viewMode === 'detail' && (
                        <>
                          <Button 
                            variant="contained"
                            onClick={handleReply}
                          >
                            Reply
                          </Button>
                          <Button 
                            variant="contained"
                            onClick={handleEdit}
                          >
                            Edit Response
                          </Button>
                          <Button 
                            variant="contained" 
                            color="error"
                            onClick={() => setIsDeleteDialogOpen(true)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="inv007-detail-content">
                  <div className="inv007-inquiry-info">
                    <p><strong>Email:</strong> {selectedInquiry.email}</p>
                    <p><strong>Phone:</strong> {selectedInquiry.phone}</p>
                    <p><strong>Interest:</strong> {selectedInquiry.investmentInterest}</p>
                    <p><strong>Submitted:</strong> {formatDate(selectedInquiry.createdAt)}</p>
                    <p><strong>Message:</strong> {selectedInquiry.message}</p>
                    
                    {selectedInquiry.documents && selectedInquiry.documents.length > 0 && (
                      <div className="inv007-inquiry-documents">
                        <h3>Attached Documents</h3>
                        <ul className="inv007-document-list">
                          {selectedInquiry.documents.map((doc, index) => (
                            <li key={index}>
                              <a 
                                href={`${API_URL}/uploads/investment-inquiries/${doc}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {doc.substring(doc.indexOf('-') + 1)}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {viewMode === 'edit' ? (
                    <div className="inv007-edit-form">
                      <h3>Edit Response</h3>
                      <textarea
                        value={editedResponse}
                        onChange={(e) => setEditedResponse(e.target.value)}
                        className="inv007-edit-textarea"
                        rows={6}
                      />
                      <div className="inv007-form-actions">
                        <Button 
                          variant="contained"
                          onClick={handleUpdate} 
                          disabled={isSubmitting}
                        >
                          Save Changes
                        </Button>
                        <Button 
                          variant="outlined"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : viewMode === 'reply' ? (
                    <div className="inv007-reply-form">
                      <h3>New Response</h3>
                      <form onSubmit={handleSubmitResponse}>
                        <div className="inv007-form-group">
                          <textarea
                            value={responseText}
                            onChange={handleResponseChange}
                            placeholder="Enter your response to the inquiry"
                            rows={6}
                            required
                          ></textarea>
                        </div>
                        
                        <div className="inv007-form-group">
                          <label>Add Response Images (optional, max 10)</label>
                          <input
                            type="file"
                            onChange={handleFileChange}
                            multiple
                            accept="image/*"
                            ref={fileInputRef}
                          />
                          {responseFiles.length > 0 && (
                            <div className="inv007-selected-files">
                              <p>{responseFiles.length} file(s) selected</p>
                              <ul>
                                {responseFiles.map((file, index) => (
                                  <li key={index}>{file.name}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        {submitMessage && (
                          <div className={`inv007-submit-message inv007-${submitMessage.type}`}>
                            {submitMessage.text}
                          </div>
                        )}
                        
                        <div className="inv007-form-actions">
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? 'Sending...' : 'Send Response'}
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={handleCancelReply}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="inv007-view-content">
                      <div className="inv007-response-section">
                        <h3>Admin Response</h3>
                        {selectedInquiry.adminResponse ? (
                          <>
                            <p className="inv007-response-timestamp">
                              Sent: {formatDate(selectedInquiry.adminResponse.respondedAt)}
                            </p>
                            <div className="inv007-response-text">
                              {selectedInquiry.adminResponse.text}
                            </div>
                            
                            {selectedInquiry && selectedInquiry.adminResponse && 
                              selectedInquiry.adminResponse.images && 
                              selectedInquiry.adminResponse.images.length > 0 && (
                                <div className="inv007-response-images">
                                  <h4>Attached Images</h4>
                                  <div className="inv007-image-gallery">
                                    {selectedInquiry.adminResponse.images.map((img, index) => (
                                      <div key={index} className="inv007-gallery-item">
                                        <a 
                                          href={`${API_URL}/uploads/investment-responses/${img}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <img 
                                            src={`${API_URL}/uploads/investment-responses/${img}`}
                                            alt={`Response image ${index + 1}`}
                                            onError={(e) => {
                                              console.error(`Failed to load image: ${img}`);
                                              e.target.src = '/placeholder-image.png'; // Fallback image
                                              e.target.alt = 'Image not available';
                                            }}
                                          />
                                          <p className="inv007-image-caption">{img.split('-').slice(1).join('-')}</p>
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </>
                        ) : (
                          <p className="inv007-no-response">No response sent yet</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        className="inv007-delete-dialog"
      >
        <div className="inv007-dialog-content">
          <Dialog.Title>Delete Inquiry</Dialog.Title>
          <p>Are you sure? This action cannot be undone.</p>
          <div className="inv007-dialog-actions">
            <Button 
              variant="outlined"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="contained"
              color="error"
              onClick={() => {
                handleDeleteInquiry(selectedInquiry._id);
                setIsDeleteDialogOpen(false);
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default InvestmentInquiryAdmin;