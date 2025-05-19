import React, { useState } from 'react';

const LandCard = ({ land, onDetailView, onInquiryClick, isAdmin, onEdit, onDelete, onToggleAvailability }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://orus-home.onrender.com';
  
  const DEFAULT_PLACEHOLDER = '/src/assets/placeholder-property.jpg';

  const getImageUrl = (filename) => {
    if (!filename) return DEFAULT_PLACEHOLDER;
    
    // If it's a full URL, return as is
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }
    
    // Ensure the filename is clean (no path prefixes)
    const cleanFilename = filename.split('/').pop();
    
    // Construct the full URL directly - don't use relative paths
    return `${API_BASE_URL}/api/uploads/lands/${encodeURIComponent(cleanFilename)}`;
  };
  
  const handleImageError = (e) => {
    console.error('Image failed to load:', e.target.src);
    setImageError(true);
    e.target.src = DEFAULT_PLACEHOLDER;
  };

  const cycleImages = (e, direction) => {
    e.stopPropagation();
    if (!land.images?.length) return;
    
    const landImages = land.images;
    const newIndex = direction === 'next' 
      ? (currentImageIndex + 1) % landImages.length
      : (currentImageIndex - 1 + landImages.length) % landImages.length;
    setCurrentImageIndex(newIndex);
    setImageError(false);
  };

  const currentImageUrl = imageError || !land.images?.length
    ? DEFAULT_PLACEHOLDER
    : getImageUrl(land.images[currentImageIndex]);

  const formatPrice = (price) => {
    try {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format(price);
    } catch (err) {
      console.error('Error formatting price:', err);
      return price;
    }
  };

  return (
    <div className="land006-card" onClick={() => onDetailView(land)}>
      <div className="land006-image-container">
        <img 
          src={currentImageUrl}
          alt={land.title || 'Land Image'} 
          className="land006-main-image"
          onError={handleImageError}
          style={{
            objectFit: 'cover',
            width: '100%',
            height: '250px',
            minHeight: '250px'
          }}
        />
        {land.images?.length > 1 && !imageError && (
          <div className="land006-image-navigation">
            <button onClick={(e) => cycleImages(e, 'prev')}>◀</button>
            <button onClick={(e) => cycleImages(e, 'next')}>▶</button>
          </div>
        )}
      </div>
      
      <div className="land006-details">
        <h3>{land.title}</h3>
        <p className="land006-price">{formatPrice(land.price)}</p>
        <div className="land006-meta">
          <span>{land.location}</span>
          <span>{land.area}</span>
        </div>
        <div className="land006-actions" onClick={e => e.stopPropagation()}>
          {isAdmin ? (
            <>
              <button onClick={() => onEdit(land)} className="land006-edit-btn">
                Edit
              </button>
              <button onClick={() => onDelete(land._id)} className="land006-delete-btn">
                Delete
              </button>
              <button 
                onClick={() => onToggleAvailability(land)}
                className={`land006-availability-btn ${land.isAvailable ? 'land006-unpublish' : 'land006-publish'}`}
              >
                {land.isAvailable ? 'Unpublish' : 'Publish'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onDetailView(land)} className="land006-detail-view-btn">
                View Details
              </button>
              <button onClick={() => onInquiryClick(land)} className="land006-inquiry-btn">
                Make Inquiry
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandCard;