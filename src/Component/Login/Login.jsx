import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true); // Set loading state when starting login process

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    // Password validation
    if (!password) {
      setError('Password is required');
      setIsLoading(false);
      return;
    }

    try {
      // Log the attempt
      console.log('Attempting login with email:', email);
      
      // Attempt login
      const result = await login(email, password);

      if (result.success) {
        console.log('Login successful, redirecting to home');
        // Redirect to dashboard or home page
        navigate('/');
      } else {
        console.error('Login failed:', result.message);
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false); // Reset loading state regardless of outcome
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-header">
          <img 
            src="/Images/orus.jpg" 
            alt="SB.Orus Logo" 
            className="login-logo" 
          />
          <h1>SB.Orus Nigeria Limited</h1>
          <p>Property Management & Real Estate Solutions</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                // Clear previous error when user starts typing
                if (error) setError('');
              }}
              placeholder="Enter your email"
              required 
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                // Clear previous error when user starts typing
                if (error) setError('');
              }}
              placeholder="Enter your password"
              required 
              disabled={isLoading}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            <a href="/forgot-password" className="forgot-password">
              Forgot Password?
            </a>
          </div>
        </form>

        <div className="signup-link">
          Don't have an account? 
          <a href="/register"> Register Here</a>
        </div>
      </div>
    </div>
  );
};

export default Login;