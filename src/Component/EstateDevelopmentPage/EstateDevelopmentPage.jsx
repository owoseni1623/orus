import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './EstateDevelopmentPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://orus-home.onrender.com';

// Estate Development Data
const developmentServices = [
  {
    id: 1,
    title: "Land Acquisition",
    icon: "🏞️",
    description: "Strategic Land Procurement & Assessment",
    details: [
      "Comprehensive land survey and due diligence",
      "Legal documentation and title verification",
      "Geographical and environmental analysis",
      "Investment potential assessment"
    ],
    technologies: [
      "GIS Mapping",
      "Satellite Imagery Analysis",
      "Legal Compliance Tools",
      "Investment Modeling Software"
    ]
  },
  {
    id: 2,
    title: "Property Development",
    icon: "🏘️",
    description: "End-to-End Real Estate Development",
    details: [
      "Master planning and conceptual design",
      "Architectural and engineering integration",
      "Sustainable development strategies",
      "Project management and execution"
    ],
    technologies: [
      "BIM Technology",
      "3D Visualization Tools",
      "Sustainability Certification Platforms",
      "Project Management Software"
    ]
  },
  {
    id: 3,
    title: "Investment Opportunities",
    icon: "💰",
    description: "Strategic Real Estate Investment Solutions",
    details: [
      "Portfolio diversification consulting",
      "Risk assessment and mitigation",
      "Financial modeling and projection",
      "Market trend analysis"
    ],
    technologies: [
      "Financial Analysis Tools",
      "Real Estate Investment Platforms",
      "Economic Forecasting Software",
      "Risk Management Systems"
    ]
  }
];

const featuredProjects = [
  {
    id: 1,
    title: "Lekki Luxury Estates",
    location: "Lekki, Lagos",
    type: "Residential Development",
    description: "Premium gated community with smart home technologies",
    investment: "₦2.5 Billion",
    roi: "12-15% Annual Return",
    status: "In Development",
    image: "/Images/estate.jpg"
  },
  {
    id: 2,
    title: "Abuja Tech Park",
    location: "Abuja, FCT",
    type: "Commercial Development",
    description: "Integrated technology and business innovation hub",
    investment: "₦4.7 Billion",
    roi: "15-18% Annual Return",
    status: "Planning Stage",
    image: "/Images/park0.png"
  }
];

const EstateDevelopmentPage = () => {
  const [activeService, setActiveService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    investmentInterest: '',
    message: ''
  });
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const servicesRef = useRef(null);
  const [isServicesVisible, setIsServicesVisible] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsServicesVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (servicesRef.current) {
      observer.observe(servicesRef.current);
    }

    return () => {
      if (servicesRef.current) {
        observer.unobserve(servicesRef.current);
      }
    };
  }, []);

  const handleServiceClick = (serviceId) => {
    setActiveService(activeService === serviceId ? null : serviceId);
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
    if (files.length > 10) {
      alert('You can only upload up to 10 files');
      return;
    }
    setSelectedFiles(files);
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      investmentInterest: '',
      message: ''
    });
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const formDataToSend = new FormData();
      
      // Add form fields to FormData
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      // Add files to FormData
      selectedFiles.forEach(file => {
        formDataToSend.append('documents', file);
      });

      // Submit the data using the defined API_URL
      const response = await axios.post(
        `${API_URL}/investment-inquiries`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSubmitMessage({
        type: 'success',
        text: 'Your investment inquiry has been received. We will contact you shortly!'
      });
      
      resetForm();
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        text: error.response?.data?.message || 'There was an error submitting your inquiry. Please try again.'
      });
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="estate-development-page">
      <header className="estate-header">
        <div className="header-overlay">
          <h1>SB.Orus Nigeria Limited</h1>
          <p>Transforming Landscapes, Creating Wealth</p>
          <div className="header-stats">
            <div className="stat-item">
              <h3>₦50B+</h3>
              <p>Assets Under Management</p>
            </div>
            <div className="stat-item">
              <h3>15+</h3>
              <p>Successful Projects</p>
            </div>
            <div className="stat-item">
              <h3>7</h3>
              <p>Nigerian States</p>
            </div>
          </div>
        </div>
      </header>

      <section ref={servicesRef} className="development-services">
        <h2>Our Development Services</h2>
        <div className={`services-grid ${isServicesVisible ? 'services-animated' : ''}`}>
          {developmentServices.map(service => (
            <div 
              key={service.id} 
              className={`service-card ${activeService === service.id ? 'service-active' : ''}`}
              onClick={() => handleServiceClick(service.id)}
            >
              <div className="service-icon">{service.icon}</div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              {activeService === service.id && (
                <div className="service-details">
                  <ul>
                    {service.details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                  <div className="service-technologies">
                    <strong>Key Technologies:</strong>
                    <div className="tech-tags">
                      {service.technologies.map((tech, index) => (
                        <span key={index} className="tech-tag">{tech}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="featured-projects">
        <h2>Featured Development Projects</h2>
        <div className="projects-grid">
          {featuredProjects.map(project => (
            <div 
              key={project.id} 
              className="project-card"
              onClick={() => handleProjectClick(project)}
            >
              <div className="project-image">
                <img src={project.image} alt={project.title} />
                <div className="project-status">{project.status}</div>
              </div>
              <div className="project-details">
                <h3>{project.title}</h3>
                <p>{project.location}</p>
                <div className="project-investment-info">
                  <span>Investment: {project.investment}</span>
                  <span>ROI: {project.roi}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedProject && (
          <div className="project-modal">
            <div className="modal-content">
              <span className="close-modal" onClick={() => setSelectedProject(null)}>×</span>
              <h2>{selectedProject.title}</h2>
              <img src={selectedProject.image} alt={selectedProject.title} />
              <div className="modal-details">
                <p><strong>Location:</strong> {selectedProject.location}</p>
                <p><strong>Type:</strong> {selectedProject.type}</p>
                <p>{selectedProject.description}</p>
                <div className="investment-details">
                  <p>Total Investment: {selectedProject.investment}</p>
                  <p>Projected ROI: {selectedProject.roi}</p>
                  <p>Current Status: {selectedProject.status}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="investment-consultation">
        <div className="consultation-container">
          <div className="consultation-info">
            <h2>Explore Investment Opportunities</h2>
            <p>Connect with our expert team to discover personalized real estate investment strategies</p>
          </div>
          <form onSubmit={handleFormSubmit} className="consultation-form">
            <input 
              type="text" 
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleFormChange}
              required 
            />
            <input 
              type="email" 
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleFormChange}
              required 
            />
            <input 
              type="tel" 
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleFormChange}
              required 
            />
            <select 
              name="investmentInterest"
              value={formData.investmentInterest}
              onChange={handleFormChange}
              required
            >
              <option value="">Select Investment Interest</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="mixed-use">Mixed-Use</option>
              <option value="land">Land Acquisition</option>
            </select>
            
            <select 
              name="message"
              value={formData.message}
              onChange={handleFormChange}
              required
            >
              <option value="">Tell us about your investment goals</option>
              <option value="passive-income">Looking for passive income through real estate</option>
              <option value="capital-appreciation">Seeking long-term capital appreciation</option>
              <option value="portfolio-diversification">Wanting to diversify investment portfolio</option>
              <option value="development-partnership">Interested in development partnership opportunities</option>
              <option value="retirement-planning">Planning for retirement through property investment</option>
              <option value="first-time-investor">First-time investor seeking guidance</option>
              <option value="overseas-investor">Foreign/Diaspora investor looking for opportunities</option>
              <option value="other">Other (we'll contact you for details)</option>
            </select>
            
            <div className="file-upload-container">
              <p>Upload relevant documents (optional, max 10 files)</p>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx" 
              />
              {selectedFiles.length > 0 && (
                <div className="selected-files">
                  <p>{selectedFiles.length} file(s) selected</p>
                  <ul>
                    {selectedFiles.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {submitMessage && (
              <div className={`submit-message ${submitMessage.type}`}>
                {submitMessage.text}
              </div>
            )}
            
            <button 
              type="submit" 
              className="submit-consultation"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Request Investment Consultation'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default EstateDevelopmentPage;