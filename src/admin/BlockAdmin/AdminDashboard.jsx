import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Helper function to construct full image URL
  const getBlockImageUrl = (imageName) => {
    if (!imageName) return null;
    
    // Ensure we're using the base URL without /api at the end
    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
    return `${baseUrl}/uploads/blocks/${imageName}`;
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/blocks`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Admin Dashboard - Fetched blocks:', response.data.data);
      setBlocks(response.data.data || []);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error fetching blocks';
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
    if (window.confirm('Are you sure you want to delete this block?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/blocks/${id}`, {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        toast.success('Block deleted successfully');
        fetchBlocks();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error deleting block');
        if (error.response?.status === 401) {
          navigate('/login');
        }
      }
    }
  };

  const toggleAvailability = async (block) => {
    try {
      const updatedBlock = {
        ...block,
        isAvailable: !block.isAvailable
      };
      
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/blocks/${block._id}`,
        updatedBlock,
        {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      toast.success(`Block ${updatedBlock.isAvailable ? 'published' : 'unpublished'} successfully`);
      fetchBlocks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating block availability');
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-container">
          <div className="error">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Block Management</h1>
          <button
            onClick={() => navigate('/admin/blocks/new')}
            className="add-block-btn"
          >
            Add New Block
          </button>
        </div>

        {blocks && blocks.length > 0 ? (
          <div className="blocks-grid">
            {blocks.map((block) => (
              <div key={block._id} className="block-card">
                {block.images && block.images.length > 0 && (
                  <div className="block-image-container">
                    <img
                      src={getBlockImageUrl(block.images[0])}
                      alt={block.title}
                      className="block-image"
                    />
                  </div>
                )}
                <div className="block-content">
                  <h3>{block.title}</h3>
                  <p>Category: {block.category}</p>
                  <p>Price: ₦{block.price}</p>
                  <p>Stock: {block.stock}</p>
                  <p className="status">
                    Status: {block.isAvailable ? 'Published' : 'Unpublished'}
                  </p>
                  
                  <div className="block-actions">
                    <button
                      onClick={() => toggleAvailability(block)}
                      className={`action-btn ${block.isAvailable ? 'unpublish' : 'publish'}`}
                    >
                      {block.isAvailable ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => navigate(`/admin/blocks/edit/${block._id}`)}
                      className="action-btn edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(block._id)}
                      className="action-btn delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-blocks">
            No blocks found. Add some blocks to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;