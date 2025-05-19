import React, { useState, useRef } from 'react';
import axios from 'axios';
import './CofO.css';

// Set default axios config
axios.defaults.baseURL = 'https://orus-home.onrender.com';

// Axios interceptor to add authorization header
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const processSteps = [
  {
    id: 1,
    title: "Application Submission",
    icon: '📝',
    description: "Submit your Certificate of Occupancy application with required details.",
    details: [
      "Complete application form",
      "Provide property information",
      "Select processing package"
    ]
  },
  {
    id: 2,
    title: "Document Verification",
    icon: '✔️',
    description: "Initial verification of submitted documents and information.",
    details: [
      "Document review",
      "Information validation",
      "Requirements check"
    ]
  },
  {
    id: 3,
    title: "Processing & Review",
    icon: '⚡',
    description: "Application processing and thorough review by relevant authorities.",
    details: [
      "Application processing",
      "Technical review",
      "Compliance check"
    ]
  },
  {
    id: 4,
    title: "Certificate Issuance",
    icon: '📜',
    description: "Final approval and issuance of Certificate of Occupancy.",
    details: [
      "Final approval",
      "Certificate generation",
      "Document delivery"
    ]
  }
];

const testimonials = [
  {
    name: "John Doe",
    role: "Property Owner",
    quote: "The COFO process was seamless and professional.",
    rating: 5
  },
  {
    name: "Jane Smith",
    role: "Real Estate Developer",
    quote: "Excellent service and prompt processing of our COFO application.",
    rating: 5
  }
];

const propertyTypes = {
  residential: [
    { value: "residential", label: "Residential (General)" },
    { value: "single_family", label: "Single Family Home" },
    { value: "apartment", label: "Apartment Building" },
    { value: "duplex", label: "Duplex" },
    { value: "townhouse", label: "Townhouse" }
  ],
  commercial: [
    { value: "commercial", label: "Commercial (General)" },
    { value: "office", label: "Office Space" },
    { value: "retail", label: "Retail Space" },
    { value: "shopping_center", label: "Shopping Center" }
  ],
  industrial: [
    { value: "industrial", label: "Industrial (General)" },
    { value: "warehouse", label: "Warehouse" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "storage", label: "Storage Facility" }
  ]
};

const COFOPage = () => {
  const [activeStep, setActiveStep] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    propertyLocation: '',
    propertyType: 'residential',
    selectedPackage: 'Standard Processing',
    additionalNotes: ''
  });
  const [submitStatus, setSubmitStatus] = useState({
    loading: false,
    success: false,
    error: null
  });
  const [files, setFiles] = useState([]);
  const processRef = useRef(null);

  const handleStepClick = (stepId) => {
    setActiveStep(activeStep === stepId ? null : stepId);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 10) {
      alert('You can only upload up to 10 files');
      e.target.value = '';
      return;
    }
    setFiles(Array.from(e.target.files));
  };

  const handleFormSubmit = async (e) => {
  e.preventDefault();
  
  setSubmitStatus({ 
    loading: true, 
    success: false, 
    error: null 
  });

  // Check if user is authenticated
  const token = localStorage.getItem('token');
  if (!token) {
    setSubmitStatus({
      loading: false,
      success: false,
      error: 'Please login to submit your application'
    });
    return;
  }

  try {
    // Create FormData object
    const formDataToSend = new FormData();
    
    // Append all form fields
    for (const [key, value] of Object.entries(formData)) {
      formDataToSend.append(key, value);
    }
    
    // Don't try to parse the token and extract user ID here
    // The backend will handle user identification from the auth token
    
    // Append files
    files.forEach((file) => {
      formDataToSend.append('documents', file);
    });

    // Log the form data for debugging
    console.log('Form Data Contents:');
    for (let pair of formDataToSend.entries()) {
      console.log(pair[0], pair[1]);
    }

    // Make the API request with the correct headers
    const response = await axios.post('/api/v1/cofo', formDataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    setSubmitStatus({ 
      loading: false, 
      success: true, 
      error: null 
    });

    // Reset form
    setFormData({
      fullName: '',
      email: '',
      phoneNumber: '',
      propertyLocation: '',
      propertyType: 'residential',
      selectedPackage: 'Standard Processing',
      additionalNotes: ''
    });
    setFiles([]);

    alert('COFO application submitted successfully!');

  } catch (error) {
    console.error('COFO submission error:', error);
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message ||
                        'Submission failed. Please try again.';
    
    setSubmitStatus({ 
      loading: false, 
      success: false, 
      error: errorMessage
    });

    alert(errorMessage);
  }
};


  return (
    <div className="cofo-page">
      <header className="cofo-header">
        <div className="header-content">
          <h1>Certificate of Occupancy (COFO) Application Process</h1>
          <p>Secure Your Property Rights with Official Documentation</p>
        </div>
      </header>

      <section className="process-section">
        <h2>COFO Application Process</h2>
        <div className="process-grid" ref={processRef}>
          {processSteps.map(step => (
            <div 
              key={step.id} 
              className={`process-step ${activeStep === step.id ? 'active' : ''}`}
              onClick={() => handleStepClick(step.id)}
            >
              <div className="step-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p className="step-description">{step.description}</p>
              {activeStep === step.id && (
                <ul className="step-details">
                  {step.details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="request-section">
        <div className="request-container">
          <div className="request-info">
            <h2>Apply for Certificate of Occupancy</h2>
            <p>Start your COFO application process today.</p>
          </div>
          <form className="request-form" onSubmit={handleFormSubmit}>
            {submitStatus.success && (
              <div className="success-message">
                COFO Application Submitted Successfully! Our team will contact you shortly.
              </div>
            )}
            {submitStatus.error && (
              <div className="error-message">
                {submitStatus.error}
              </div>
            )}
            <div className="form-group">
              <input 
                type="text" 
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleFormChange}
                required 
                disabled={submitStatus.loading}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <input 
                type="email" 
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleFormChange}
                required 
                disabled={submitStatus.loading}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <input 
                type="tel" 
                name="phoneNumber"
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={handleFormChange}
                required 
                disabled={submitStatus.loading}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <input 
                type="text" 
                name="propertyLocation"
                placeholder="Property Location"
                value={formData.propertyLocation}
                onChange={handleFormChange}
                required 
                disabled={submitStatus.loading}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleFormChange}
                required
                disabled={submitStatus.loading}
                className="form-select"
              >
                {Object.entries(propertyTypes).map(([category, types]) => (
                  <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                    {types.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="form-group">
              <select
                name="selectedPackage"
                value={formData.selectedPackage}
                onChange={handleFormChange}
                required
                disabled={submitStatus.loading}
                className="form-select"
              >
                <option value="Standard Processing">Standard Processing</option>
                <option value="Premium Express">Premium Express</option>
                <option value="VIP Acceleration">VIP Acceleration</option>
              </select>
            </div>
            <div className="form-group">
              <textarea 
                name="additionalNotes"
                placeholder="Additional Notes"
                value={formData.additionalNotes}
                onChange={handleFormChange}
                disabled={submitStatus.loading}
                className="form-textarea"
              ></textarea>
            </div>
            <div className="form-group">
              <label className="form-label">Upload Documents (Max 10 files)</label>
              <input 
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.avif"
                onChange={handleFileChange}
                className="form-input"
                disabled={submitStatus.loading}
              />
              <small className="form-text">Supported formats: JPG, JPEG, PNG, AVIF, PDF. Max size: 5MB per file.</small>
            </div>
            <button 
              type="submit" 
              className={`submit-request ${submitStatus.loading ? 'loading' : ''}`}
              disabled={submitStatus.loading}
            >
              {submitStatus.loading ? 'Submitting...' : 'Submit COFO Application'}
            </button>
          </form>
        </div>
      </section>

      <section className="testimonials-section">
        <h2>What Our Clients Say</h2>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <p className="testimonial-quote">"{testimonial.quote}"</p>
              <div className="testimonial-author">
                <h4>{testimonial.name}</h4>
                <p>{testimonial.role}</p>
                <div className="rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i}>⭐</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default COFOPage;