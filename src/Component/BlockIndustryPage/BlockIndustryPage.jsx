import React, { useState, useContext, useEffect } from 'react';
import { CartContext } from '../../Context/CartContext';
import { toast } from 'react-toastify';
import { API_URL } from '../../config/env';
import { blockService } from '../../services/blockService';
import './BlockIndustryPage.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="error-message">Something went wrong. Please try again later.</div>;
    }
    return this.props.children;
  }
}

const BlockIndustryPage = () => {
  const { addToCart } = useContext(CartContext);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchParams, setSearchParams] = useState({
    category: '',
    minPrice: '',
    maxPrice: ''
  });
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [productQuantities, setProductQuantities] = useState({});

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await blockService.getBlocks();
      console.log('API Response:', response);
      
      // Check for valid data structure - expecting { success, data } format
      if (response && response.data) {
        // If data is in response.data.data (common pattern)
        const blocksData = response.data.data || response.data;
        
        const validBlocks = Array.isArray(blocksData) 
          ? blocksData.filter(block => block && typeof block === 'object')
          : [];
    
        console.log('Valid blocks:', validBlocks);
        setBlocks(validBlocks);
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (error) {
      console.error('Fetch blocks error:', error.response?.data || error.message);
      setError(error.message || 'Failed to fetch blocks');
      
      toast.error(error.response?.status === 404 
        ? 'Blocks API endpoint not found. Please check server configuration.' 
        : error.response?.status === 429
        ? 'Too many requests. Please wait.'
        : `Error: ${error.message || 'Failed to load blocks'}`
      );
      
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return `${API_URL.replace('/api', '')}/placeholder-block.png`;
    
    try {
      const cleanPath = imagePath
        .replace(/^\/+/, '')
        .replace(/^uploads\/+/, '')
        .replace(/^blocks\/+/, '');
      
      return `${API_URL.replace('/api', '')}/uploads/blocks/${cleanPath}`;
    } catch (error) {
      console.error('Error formatting image URL:', error);
      return `${API_URL.replace('/api', '')}/placeholder-block.png`;
    }
  };

  const renderBlockImage = (block) => {
    if (!block.images || block.images.length === 0) {
      return <div className="no-image">No Image Available</div>;
    }

    const imageUrl = getImageUrl(block.images[0]);

    return (
      <img 
        src={imageUrl}
        alt={block.title} 
        className="block-image"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `${API_URL.replace('/api', '')}/placeholder-block.png`;
        }}
        loading="lazy"
        crossOrigin="anonymous"
      />
    );
  };

  const renderBlockCard = (block) => (
    <div key={block._id} className="block-card">
      <div className="block-card-checkbox">
        <input 
          type="checkbox" 
          checked={selectedBlocks.includes(block)}
          onChange={() => handleBlockCheck(block)}
        />
      </div>
      <div className="block-card-image" onClick={() => handleBlockSelect(block)}>
        {renderBlockImage(block)}
      </div>
      <div className="block-card-details">
        <h3>{block.title}</h3>
        <p>{block.category}</p>
        <div className="block-card-footer">
          <div className="price-stock-info">
            <p className="block-price">Price: ₦{block.price}</p>
            <p className="block-stock">Available Stock: {block.stock}</p>
          </div>
          <div className="block-quantity-section">
            <div className="block-quantity-controls">
              <button 
                className="quantity-btn" 
                onClick={() => handleQuantityChange(block, (productQuantities[block._id] || 0) - 1)}
              >
                -
              </button>
              <input 
                type="number" 
                min="0"
                max={block.stock}
                value={productQuantities[block._id] || 0}
                onChange={(e) => handleQuantityChange(block, parseInt(e.target.value))}
                className="block-quantity-input"
              />
              <button 
                className="quantity-btn" 
                onClick={() => handleQuantityChange(block, (productQuantities[block._id] || 0) + 1)}
              >
                +
              </button>
            </div>
            <div className="block-actions-group">
              <button 
                onClick={() => addBlockToCart(block)}
                className="add-to-cart-btn"
              >
                Add to Cart
              </button>
              <button 
                className="request-quote-btn"
                onClick={handleQuoteRequest}
              >
                Request Quote
              </button>
              <button 
                className="technical-support-btn"
                onClick={handleTechnicalSupport}
              >
                Technical Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderModalImage = () => {
    if (!selectedBlock?.images?.length) {
      return <div className="no-image">No Image Available</div>;
    }

    const imageUrl = getImageUrl(selectedBlock.images[currentImageIndex]);

    return (
      <>
        <img 
          src={imageUrl}
          alt={selectedBlock.title} 
          className="main-block-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `${API_URL.replace('/api', '')}/placeholder-block.png`;
          }}
          crossOrigin="anonymous"
        />
        {selectedBlock.images.length > 1 && (
          <div className="block-image-navigation">
            <button onClick={() => cycleImages('prev')}>◀</button>
            <button onClick={() => cycleImages('next')}>▶</button>
          </div>
        )}
      </>
    );
  };

  const handleTechnicalSupport = () => {
    toast.info('Technical support request sent!');
  };

  const handleQuoteRequest = () => {
    toast.info('Quote request sent!');
  };

  const handleBlockSelect = (block) => {
    setSelectedBlock(block);
    setCurrentImageIndex(0);
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBlockCheck = (block) => {
    setSelectedBlocks(prev => 
      prev.includes(block) 
        ? prev.filter(b => b._id !== block._id)
        : [...prev, block]
    );
  };

  const handleQuantityChange = (block, quantity) => {
    const newQuantity = Math.max(0, Math.min(quantity, block.stock));
    setProductQuantities(prev => ({
      ...prev,
      [block._id]: newQuantity
    }));
  };

  const addBlockToCart = (block) => {
    const quantity = productQuantities[block._id] || 1;
    if (quantity <= 0) {
      toast.error('Please select a valid quantity');
      return;
    }
    
    addToCart({
      ...block,
      quantity: quantity
    });
    
    setProductQuantities(prev => ({
      ...prev,
      [block._id]: 0
    }));
    toast.success('Added to cart successfully');
  };

  const handleAddBlocksToCart = () => {
    selectedBlocks.forEach(block => {
      const quantity = productQuantities[block._id] || 1;
      if (quantity <= block.stock) {
        addToCart({
          ...block,
          quantity: quantity
        });
      } else {
        toast.error(`Not enough stock for ${block.title}`);
      }
    });
    setSelectedBlocks([]);
    setProductQuantities({});
  };

  const filteredBlocks = blocks.filter(block => {
    const matchesCategory = !searchParams.category || block.category === searchParams.category;
    const matchesMinPrice = !searchParams.minPrice || block.price >= parseInt(searchParams.minPrice);
    const matchesMaxPrice = !searchParams.maxPrice || block.price <= parseInt(searchParams.maxPrice);
    return matchesCategory && matchesMinPrice && matchesMaxPrice;
  });

  const cycleImages = (direction) => {
    if (!selectedBlock?.images?.length) return;
    const imageCount = selectedBlock.images.length;
    setCurrentImageIndex(prev => 
      direction === 'next' 
        ? (prev + 1) % imageCount 
        : (prev - 1 + imageCount) % imageCount
    );
  };

  const calculateTotalPrice = (blocks) => {
    return blocks.reduce((total, block) => {
      const quantity = productQuantities[block._id] || 1;
      return total + (block.price * quantity);
    }, 0);
  };

  if (loading) {
    return <div className="loading">Loading blocks...</div>;
  }

  if (error) {
    return <div className="error-message">
      <h3>Error loading blocks</h3>
      <p>{error}</p>
      <button onClick={fetchBlocks} className="retry-button">Try Again</button>
    </div>;
  }

  return (
    <ErrorBoundary>
      <div className="block-industry-page">
        <section className="block-search-section">
          <div className="search-container">
            <select 
              name="category" 
              value={searchParams.category} 
              onChange={handleSearchChange}
            >
              <option value="">All Categories</option>
              {['Solid Blocks', 'Aerated Blocks', 'Paving Blocks', 'Hollow Blocks', 
                'Special Blocks', 'Architectural Blocks', 'Sustainable Blocks', 'Heavy-Duty Blocks'].map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <input 
              type="number" 
              name="minPrice" 
              placeholder="Min Price" 
              value={searchParams.minPrice}
              onChange={handleSearchChange}
            />
            <input 
              type="number" 
              name="maxPrice" 
              placeholder="Max Price" 
              value={searchParams.maxPrice}
              onChange={handleSearchChange}
            />
          </div>
        </section>

        <section className="block-products-section">
          <h2>Our Block Product Range</h2>
          {filteredBlocks.length === 0 ? (
            <div className="no-blocks-message">
              No blocks available matching your criteria.
            </div>
          ) : (
            <div className="block-grid">
              {filteredBlocks.map(block => renderBlockCard(block))}
            </div>
          )}

          {selectedBlocks.length > 0 && (
            <div className="bulk-actions">
              <div>
                <p>Selected Blocks: {selectedBlocks.length}</p>
                <p>Total Price: ₦{calculateTotalPrice(selectedBlocks)}</p>
              </div>
              <button className="add-to-cart-btn" onClick={handleAddBlocksToCart}>
                Add Selected to Cart
              </button>
            </div>
          )}
        </section>

        {selectedBlock && (
          <div className="block-detail-modal">
            <div className="block-detail-content">
              <button className="close-modal" onClick={() => setSelectedBlock(null)}>×</button>
              
              <div className="block-detail-gallery">
                <div className="block-detail-checkbox">
                  <input 
                    type="checkbox" 
                    checked={selectedBlocks.includes(selectedBlock)}
                    onChange={() => handleBlockCheck(selectedBlock)}
                  />
                </div>
                {renderModalImage()}
              </div>

              <div className="block-detail-info">
                <h2>{selectedBlock.title}</h2>
                <div className="block-info-grid">
                  <div className="block-info-section">
                    <h3>Product Features</h3>
                    <ul>
                      {selectedBlock.features && selectedBlock.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="block-info-section">
                    <h3>Technical Specifications</h3>
                    {selectedBlock.technicalSpecs && Object.entries(selectedBlock.technicalSpecs).map(([key, value]) => (
                      <p key={key}>{key.replace(/([A-Z])/g, ' $1').trim()}: {value}</p>
                    ))}
                  </div>
                  <div className="block-info-section">
                    <h3>Applications</h3>
                    <ul>
                      {selectedBlock.applications && selectedBlock.applications.map((app, index) => (
                        <li key={index}>{app}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="block-info-section">
                    <h3>Quantity & Price</h3>
                    <div className="modal-quantity-control">
                      <input 
                        type="number" 
                        min="1"
                        max={selectedBlock.stock}
                        value={productQuantities[selectedBlock._id] || 1}
                        onChange={(e) => handleQuantityChange(selectedBlock, parseInt(e.target.value))}
                      />
                      <p>Price: ₦{selectedBlock.price}</p>
                      <p>Available Stock: {selectedBlock.stock}</p>
                    </div>
                  </div>
                </div>
                
                <div className="block-actions">
                  <button 
                    className="request-quote-btn"
                    onClick={handleQuoteRequest}
                  >
                    Request Quote
                  </button>
                  <button 
                    className="technical-support-btn"
                    onClick={handleTechnicalSupport}
                  >
                    Technical Support
                  </button>
                  <button 
                    className="add-to-cart-modal-btn"
                    onClick={() => {
                      const quantity = productQuantities[selectedBlock._id] || 1;
                      if (quantity <= selectedBlock.stock) {
                        addToCart({
                          ...selectedBlock,
                          quantity: quantity
                        });
                        setSelectedBlock(null);
                        toast.success('Added to cart successfully');
                      } else {
                        toast.error('Not enough stock available');
                      }
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default BlockIndustryPage;