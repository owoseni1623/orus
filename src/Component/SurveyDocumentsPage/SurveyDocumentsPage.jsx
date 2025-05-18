import React, { useState, useRef } from 'react';
import axios from 'axios';
import './SurveyDocumentsPage.css';

axios.defaults.baseURL = 'https://orus-home.onrender.com';

// Icons (you can replace with actual SVG imports)
const icons = {
  document: '📄',
  location: '📍',
  measurement: '📏',
  verification: '✅',
  legal: '⚖️',
  certificate: '🏆'
};

const surveyProcessSteps = [
  {
    id: 1,
    title: "Initial Consultation",
    icon: icons.document,
    description: "Comprehensive discussion about your land acquisition needs and objectives.",
    details: [
      "Understanding client's specific requirements",
      "Preliminary land identification",
      "Risk assessment consultation"
    ]
  },
  {
    id: 2,
    title: "Site Location Verification",
    icon: icons.location,
    description: "Precise geographical positioning and land boundary identification.",
    details: [
      "GPS coordinate mapping",
      "Satellite imagery analysis",
      "Local terrain assessment"
    ]
  },
  {
    id: 3,
    title: "Physical Land Measurement",
    icon: icons.measurement,
    description: "Detailed topographical survey using advanced geospatial technologies.",
    details: [
      "High-precision digital measurements",
      "Drone aerial surveying",
      "Comprehensive land dimension documentation"
    ]
  },
  {
    id: 4,
    title: "Legal Documentation Verification",
    icon: icons.legal,
    description: "Comprehensive legal review of land ownership and transaction history.",
    details: [
      "Title deed examination",
      "Encumbrance certificate check",
      "Government land registry verification"
    ]
  },
  {
    id: 5,
    title: "Survey Report Compilation",
    icon: icons.document,
    description: "Detailed technical and legal documentation of survey findings.",
    details: [
      "Comprehensive survey report generation",
      "Graphical land representation",
      "Detailed measurement documentation"
    ]
  },
  {
    id: 6,
    title: "Final Certification",
    icon: icons.certificate,
    description: "Official survey certification and documentation issuance.",
    details: [
      "Government-approved survey certificate",
      "Authenticated land documentation",
      "Detailed property report"
    ]
  }
];

const testimonials = [
  {
    name: "Adebayo Okonkwo",
    role: "Real Estate Developer",
    quote: "SB.Orus transformed our land acquisition process with their meticulous survey techniques.",
    rating: 5
  },
  {
    name: "Chioma Eze",
    role: "Property Investor",
    quote: "Incredibly professional and thorough survey documentation that gave me complete peace of mind.",
    rating: 5
  }
];

const SurveyDocumentsPage = () => {
  const [activeStep, setActiveStep] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]); // Added missing state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    landLocation: '',
    additionalDetails: ''
  });
  const [submitStatus, setSubmitStatus] = useState({
    loading: false,
    success: false,
    error: null
  });

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
    const files = Array.from(e.target.files);
    // Limit to 10 files
    const limitedFiles = files.slice(0, 10);
    setSelectedFiles(limitedFiles);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    setSubmitStatus({ 
      loading: true, 
      success: false, 
      error: null 
    });
  
    try {
      const formDataToSend = new FormData();
      
      // Append text fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      // Append images
      selectedFiles.forEach(file => {
        formDataToSend.append('images', file);
      });
  
      const response = await axios.post('/api/surveys', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      setSubmitStatus({ 
        loading: false, 
        success: true, 
        error: null 
      });
  
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        landLocation: '',
        additionalDetails: ''
      });
      setSelectedFiles([]);
  
      alert('Survey request submitted successfully!');
  
    } catch (error) {
      console.error('Survey submission error:', error.response ? error.response.data : error);
      
      setSubmitStatus({ 
        loading: false, 
        success: false, 
        error: error.response?.data?.message || 'Submission failed' 
      });
  
      alert(error.response?.data?.message || 'Submission failed');
    }
  };
  
  return (
    <div className="survey-documents-page">
      <header className="survey-header">
        <div className="header-content">
          <h1>SB.Orus Survey Documents Process</h1>
          <p>Transforming Land Acquisition with Precision and Expertise</p>
        </div>
      </header>

      <section className="survey-process-section">
        <h2>Our Comprehensive Survey Process</h2>
        <div className="survey-process-grid" ref={processRef}>
          {surveyProcessSteps.map(step => (
            <div 
              key={step.id} 
              className={`survey-process-step ${activeStep === step.id ? 'active' : ''}`}
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

      <section className="survey-request-section">
        <div className="survey-request-container">
          <div className="survey-request-info">
            <h2>Request a Land Survey</h2>
            <p>Start your precise land acquisition journey with SB.Orus today.</p>
          </div>
          <form className="survey-request-form" onSubmit={handleFormSubmit}>
            {submitStatus.success && (
              <div className="success-message">
                Survey Request Submitted Successfully! Our team will contact you shortly.
              </div>
            )}
            {submitStatus.error && (
              <div className="error-message">
                {submitStatus.error}
              </div>
            )}
            <input 
              type="text" 
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleFormChange}
              required 
              disabled={submitStatus.loading}
            />
            <input 
              type="email" 
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleFormChange}
              required 
              disabled={submitStatus.loading}
            />
            <input 
              type="tel" 
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleFormChange}
              required 
              disabled={submitStatus.loading}
            />
            <input 
              type="text" 
              name="landLocation"
              placeholder="Land Location"
              value={formData.landLocation}
              onChange={handleFormChange}
              required 
              disabled={submitStatus.loading}
            />
            <div className="file-upload-section">
              <label htmlFor="survey-images">Upload Images (Max 10)</label>
              <input
                type="file"
                id="survey-images"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={submitStatus.loading}
                max="10"
              />
              <div className="selected-files">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="selected-file">
                    {file.name}
                  </div>
                ))}
              </div>
            </div>
            <textarea 
              name="additionalDetails"
              placeholder="Additional Details"
              value={formData.additionalDetails}
              onChange={handleFormChange}
              disabled={submitStatus.loading}
            ></textarea>
            <button 
              type="submit" 
              className={`submit-survey-request ${submitStatus.loading ? 'loading' : ''}`}
              disabled={submitStatus.loading}
            >
              {submitStatus.loading ? 'Submitting...' : 'Submit Survey Request'}
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

export default SurveyDocumentsPage;