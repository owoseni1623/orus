import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import styles from './BlockForm.module.css';
import { API_URL } from '../../config/env';

const BlockForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    size: '',
    price: '',
    strength: '',
    features: [''],
    applications: [''],
    images: [],
    technicalSpecs: {
      dimensions: '',
      weight: '',
      compressionStrength: '',
      waterAbsorption: '',
      thermalConductivity: ''
    },
    stock: 0,
    isAvailable: true
  });

  // Get token from localStorage
  const getAuthToken = () => localStorage.getItem('token');

  // Axios config with auth header
  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    },
    withCredentials: true
  };

  useEffect(() => {
    if (id) {
      fetchBlock();
    }
  }, [id]);

  const fetchBlock = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/blocks/${id}`,
        axiosConfig
      );
      setFormData(response.data.data);
    } catch (error) {
      toast.error('Error fetching block details');
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        navigate('/admin/blocks');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTechnicalSpecChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      technicalSpecs: {
        ...prev.technicalSpecs,
        [name]: value
      }
    }));
  };

  const handleArrayChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('images', file);
    });
  
    try {
      const response = await axios.post(
        `${API_URL}/upload/blocks`, // Change to specific blocks upload endpoint
        formData,
        {
          ...axiosConfig,
          headers: {
            ...axiosConfig.headers,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
  
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...response.data.urls] // Use response.data.urls
      }));
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Error uploading images');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const endpoint = `${API_URL}/api/blocks${id ? `/${id}` : ''}`;
      const method = id ? 'put' : 'post';
      
      // Clean up empty values in arrays
      const cleanedFormData = {
        ...formData,
        features: formData.features.filter(f => f.trim() !== ''),
        applications: formData.applications.filter(a => a.trim() !== '')
      };

      console.log('Submitting to endpoint:', endpoint);
      console.log('Form data:', cleanedFormData);
      
      const response = await axios[method](
        endpoint,
        cleanedFormData,
        axiosConfig
      );

      console.log('Response:', response.data);
      toast.success(`Block ${id ? 'updated' : 'created'} successfully`);
      navigate('/admin/blocks');
    } catch (error) {
      console.error('Error saving block:', error);
      if (error.response?.status === 401) {
        toast.error('Please login to continue');
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || `Error ${id ? 'updating' : 'creating'} block`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.formTitle}>
        {id ? 'Edit Block' : 'Add New Block'}
      </h1>

      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          {/* Basic Information */}
          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={styles.inputField}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={styles.selectField}
                required
              >
                <option value="">Select Category</option>
                <option value="Solid Blocks">Solid Blocks</option>
                <option value="Aerated Blocks">Aerated Blocks</option>
                <option value="Paving Blocks">Paving Blocks</option>
                <option value="Hollow Blocks">Hollow Blocks</option>
                <option value="Special Blocks">Special Blocks</option>
                <option value="Architectural Blocks">Architectural Blocks</option>
                <option value="Sustainable Blocks">Sustainable Blocks</option>
                <option value="Heavy-Duty Blocks">Heavy-Duty Blocks</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Size</label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleChange}
                className={styles.inputField}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Price (₦)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className={styles.inputField}
                required
                min="0"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Strength</label>
              <input
                type="text"
                name="strength"
                value={formData.strength}
                onChange={handleChange}
                className={styles.inputField}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Stock</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className={styles.inputField}
                required
                min="0"
              />
            </div>

            <div className={styles.formGroup}>
            <label className={styles.inputLabel}>
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleChange}
                  className={styles.checkboxField}
                />
                Available for Purchase
              </label>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Technical Specifications</h3>
            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Dimensions</label>
              <input
                type="text"
                name="dimensions"
                value={formData.technicalSpecs.dimensions}
                onChange={handleTechnicalSpecChange}
                className={styles.inputField}
                placeholder="e.g., 400mm x 200mm x 200mm"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Weight</label>
              <input
                type="text"
                name="weight"
                value={formData.technicalSpecs.weight}
                onChange={handleTechnicalSpecChange}
                className={styles.inputField}
                placeholder="e.g., 12.5 kg"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Compression Strength</label>
              <input
                type="text"
                name="compressionStrength"
                value={formData.technicalSpecs.compressionStrength}
                onChange={handleTechnicalSpecChange}
                className={styles.inputField}
                placeholder="e.g., 7.0 N/mm²"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Water Absorption</label>
              <input
                type="text"
                name="waterAbsorption"
                value={formData.technicalSpecs.waterAbsorption}
                onChange={handleTechnicalSpecChange}
                className={styles.inputField}
                placeholder="e.g., ≤ 10%"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Thermal Conductivity</label>
              <input
                type="text"
                name="thermalConductivity"
                value={formData.technicalSpecs.thermalConductivity}
                onChange={handleTechnicalSpecChange}
                className={styles.inputField}
                placeholder="e.g., 0.27 W/mK"
              />
            </div>
          </div>

          {/* Features and Applications */}
          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Features</label>
              <div className={styles.arrayContainer}>
                {formData.features.map((feature, index) => (
                  <div key={index} className={styles.arrayField}>
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleArrayChange(index, 'features', e.target.value)}
                      className={styles.arrayInput}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayField('features', index)}
                      className={styles.removeButton}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField('features')}
                  className={styles.addButton}
                >
                  Add Feature
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Applications</label>
              <div className={styles.arrayContainer}>
                {formData.applications.map((application, index) => (
                  <div key={index} className={styles.arrayField}>
                    <input
                      type="text"
                      value={application}
                      onChange={(e) => handleArrayChange(index, 'applications', e.target.value)}
                      className={styles.arrayInput}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayField('applications', index)}
                      className={styles.removeButton}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField('applications')}
                  className={styles.addButton}
                >
                  Add Application
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Images</label>
              <div className={styles.imageUploadContainer}>
                <input
                  type="file"
                  multiple
                  onChange={handleImageUpload}
                  className={styles.fileInput}
                  accept="image/*"
                />
                <div className={styles.imageGrid}>
                  {formData.images.map((image, index) => (
                    <div key={index} className={styles.imageContainer}>
                      <img
                        src={image}
                        alt={`Preview ${index + 1}`}
                        className={styles.previewImage}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== index)
                          }));
                        }}
                        className={styles.imageDeleteButton}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => navigate('/admin/blocks')}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Saving...' : id ? 'Update Block' : 'Create Block'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BlockForm;