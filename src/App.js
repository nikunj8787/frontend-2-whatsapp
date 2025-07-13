import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Simple icon components (since we don't have lucide-react in this setup)
const MessageSquare = () => <span style={{fontSize: '20px'}}>💬</span>;
const Users = () => <span style={{fontSize: '20px'}}>👥</span>;
const Bot = () => <span style={{fontSize: '20px'}}>🤖</span>;
const BarChart3 = () => <span style={{fontSize: '20px'}}>📊</span>;
const Settings = () => <span style={{fontSize: '20px'}}>⚙️</span>;
const Send = () => <span style={{fontSize: '20px'}}>📤</span>;
const LogIn = () => <span style={{fontSize: '20px'}}>🔐</span>;
const UserPlus = () => <span style={{fontSize: '20px'}}>✨</span>;
const Eye = () => <span style={{fontSize: '16px'}}>👁️</span>;
const EyeOff = () => <span style={{fontSize: '16px'}}>🙈</span>;
const CheckCircle = () => <span style={{fontSize: '20px'}}>✅</span>;
const AlertCircle = () => <span style={{fontSize: '20px'}}>⚠️</span>;
const LogOut = () => <span style={{fontSize: '20px'}}>🚪</span>;
const Crown = () => <span style={{fontSize: '20px'}}>👑</span>;
const Shield = () => <span style={{fontSize: '16px'}}>🛡️</span>;
const Zap = () => <span style={{fontSize: '20px'}}>⚡</span>;
const Globe = () => <span style={{fontSize: '20px'}}>🌐</span>;
const Menu = () => <span style={{fontSize: '20px'}}>☰</span>;
const X = () => <span style={{fontSize: '20px'}}>✕</span>;

// API Configuration - Your Railway Backend URL
const API_BASE_URL = 'https://whatsapp-ai-realestate-production.up.railway.app';

const WhatsAppSaaSDashboard = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Dashboard state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState({ to: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [analytics, setAnalytics] = useState({});

  // Form states
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: ''
  });

  // Configure axios
  useEffect(() => {
    axios.defaults.baseURL = API_BASE_URL;
    axios.defaults.timeout = 10000;
    
    // Add response interceptor for error handling
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          handleLogout();
        }
        return Promise.reject(error);
      }
    );
  }, []);

  // Check for existing authentication
  useEffect(() => {
    const token = localStorage.getItem('whatsapp_saas_token');
    const userData = localStorage.getItem('whatsapp_saas_user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadDashboardData();
    }
  }, []);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      const [messagesRes, analyticsRes] = await Promise.all([
        axios.get('/api/messages?limit=5'),
        axios.get('/api/analytics/overview')
      ]);
      
      if (messagesRes.data.success) {
        setMessages(messagesRes.data.messages || []);
      }
      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.analytics || {});
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  };

  // Authentication functions
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const data = authMode === 'login' 
        ? { email: authForm.email, password: authForm.password }
        : authForm;

      console.log('Attempting authentication...', {
        endpoint: `${API_BASE_URL}${endpoint}`,
        mode: authMode,
        data: { ...data, password: '[HIDDEN]' }
      });

      const response = await axios.post(endpoint, data);
      
      console.log('Authentication response:', response.data);
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        // Store authentication data
        localStorage.setItem('whatsapp_saas_token', token);
        localStorage.setItem('whatsapp_saas_user', JSON.stringify(user));
        
        // Set axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Update state
        setIsAuthenticated(true);
        setUser(user);
        
        showNotification(`Welcome ${user.name}! ${authMode === 'register' ? 'Account created successfully.' : 'Logged in successfully.'}`);
        
        // Load dashboard data
        loadDashboardData();
      }
    } catch (error) {
      console.error('Authentication error:', error);
      
      let errorMessage;
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.error || `Server error: ${error.response.status}`;
        console.error('Server error response:', error.response.data);
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Network error: Unable to connect to server. Please check your internet connection.';
        console.error('Network error:', error.request);
      } else {
        // Something else happened
        errorMessage = `Request setup error: ${error.message}`;
        console.error('Request error:', error.message);
      }
      
      setAuthError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('whatsapp_saas_token');
    localStorage.removeItem('whatsapp_saas_user');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
    setActiveTab('dashboard');
    showNotification('Logged out successfully');
  };

  // Message sending function
  const handleSendMessage = async () => {
    if (!newMessage.to || !newMessage.message) {
      showNotification('Please enter phone number and message', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/whatsapp/send-message', {
        to: newMessage.to,
        message: newMessage.message,
        type: 'text'
      });

      if (response.data.success) {
        setMessages(prev => [{
          id: Date.now(),
          to: newMessage.to,
          message: newMessage.message,
          timestamp: new Date().toLocaleTimeString(),
          direction: 'outgoing',
          status: 'sent'
        }, ...prev]);
        
        setNewMessage({ to: '', message: '' });
        showNotification('Message sent successfully!');
        
        // Reload analytics
        loadDashboardData();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to send message';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Sidebar items
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'automation', label: 'Bot Rules', icon: Bot },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Stats from analytics
  const stats = [
    { 
      label: 'Messages Sent', 
      value: analytics.messages?.total || '0', 
      change: '+23%', 
      color: 'linear-gradient(135deg, #10b981, #059669)',
      icon: MessageSquare
    },
    { 
      label: 'Active Contacts', 
      value: analytics.contacts?.active || '0', 
      change: '+12%', 
      color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      icon: Users
    },
    { 
      label: 'Bot Rules', 
      value: analytics.botRules?.active || '0', 
      change: '+45%', 
      color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      icon: Bot
    },
    { 
      label: 'Response Rate', 
      value: analytics.engagement?.responseRate || '0%', 
      change: '+5%', 
      color: 'linear-gradient(135deg, #f59e0b, #d97706)',
      icon: BarChart3
    },
  ];

  // Authentication form
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        {/* Animated background elements */}
        <div style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none'
        }}>
          <div style={{
            position: 'absolute',
            top: '80px',
            left: '80px',
            width: '128px',
            height: '128px',
            background: 'rgba(34, 197, 94, 0.2)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            animation: 'float 6s ease-in-out infinite'
          }}></div>
          <div style={{
            position: 'absolute',
            top: '160px',
            right: '80px',
            width: '128px',
            height: '128px',
            background: 'rgba(59, 130, 246, 0.2)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            animation: 'float 6s ease-in-out infinite 2s'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '80px',
            left: '50%',
            width: '128px',
            height: '128px',
            background: 'rgba(139, 92, 246, 0.2)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            animation: 'float 6s ease-in-out infinite 4s'
          }}></div>
        </div>

        <div style={{
          position: 'relative',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
                animation: 'glow 2s ease-in-out infinite alternate'
              }}>
                <MessageSquare />
              </div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: 'white',
                margin: '0 0 8px',
                background: 'linear-gradient(45deg, #10b981, #3b82f6, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                WhatsApp SaaS Pro
              </h1>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
                Premium Business Communication
              </p>
            </div>

            <form onSubmit={handleAuth} style={{ marginBottom: '24px' }}>
              {authMode === 'register' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginBottom: '8px'
                  }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '8px'
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '8px'
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={authForm.password}
                    onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      paddingRight: '48px',
                      borderRadius: '12px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              {authError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#fca5a5',
                  background: 'rgba(239, 68, 68, 0.2)',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  marginBottom: '20px'
                }}>
                  <AlertCircle />
                  <span style={{ fontSize: '14px' }}>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                style={{
                  width: '100%',
                  background: authLoading ? '#ccc' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  fontWeight: '600',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: authLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '16px'
                }}
              >
                {authLoading ? (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid white',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                ) : (
                  <>
                    {authMode === 'login' ? <LogIn /> : <UserPlus />}
                    {authMode === 'login' ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '0 0 8px' }}>
                {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
              </p>
              <button
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setAuthError('');
                  setAuthForm({ email: '', password: '', name: '' });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#10b981',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '16px',
                  textDecoration: 'underline'
                }}
              >
                {authMode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification.show && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            background: notification.type === 'error' ? '#ef4444' : '#10b981',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {notification.type === 'error' ? <AlertCircle /> : <CheckCircle />}
            {notification.message}
          </div>
        )}

        <style>
          {`
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-20px); }
            }
            @keyframes glow {
              from { box-shadow: 0 0 20px rgba(16, 185, 129, 0.5); }
              to { box-shadow: 0 0 30px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.6); }
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // Dashboard content rendering functions
  const renderDashboard = () => (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Hero Section */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '32px',
        color: 'white',
        marginBottom: '32px'
      }}>
        <div style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Crown />
              <span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '18px' }}>Premium Dashboard</span>
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px' }}>
              Welcome back, {user?.name}!
            </h1>
            <p style={{ fontSize: '18px', opacity: 0.9, margin: 0 }}>
              Manage your WhatsApp business communications with style
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              marginTop: '16px'
            }}
          >
            <LogOut />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-4px) scale(1.02)';
                e.target.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0px) scale(1)';
                e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: stat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                }}>
                  <Icon />
                </div>
                <span style={{
                  color: '#10b981',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '4px 8px',
                  borderRadius: '20px'
                }}>
                  {stat.change}
                </span>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 4px' }}>
                {stat.value}
              </h3>
              <p style={{ color: '#6b7280', fontWeight: '500', margin: 0 }}>
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions and Recent Activity */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '32px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Zap />
            Quick Actions
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <button
              onClick={() => setActiveTab('messages')}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center'
              }}
            >
              <Send />
              <div style={{ marginTop: '8px', fontWeight: '600' }}>Send Message</div>
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center'
              }}
            >
              <Users />
              <div style={{ marginTop: '8px', fontWeight: '600' }}>Contacts</div>
            </button>
            <button
              onClick={() => setActiveTab('automation')}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center'
              }}
            >
              <Bot />
              <div style={{ marginTop: '8px', fontWeight: '600' }}>Bot Rules</div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center'
              }}
            >
              <BarChart3 />
              <div style={{ marginTop: '8px', fontWeight: '600' }}>Analytics</div>
            </button>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Globe />
            Recent Messages
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '32px 0' }}>
                No messages yet
              </p>
            ) : (
              messages.slice(0, 4).map((msg, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(0, 0, 0, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <MessageSquare />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 4px' }}>
                      To: {msg.to}
                    </p>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {msg.message}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px' }}>
                      {msg.timestamp}
                    </p>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      background: '#10b981',
                      borderRadius: '50%'
                    }}></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Send />
          Send New Message
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '24px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Phone Number
            </label>
            <input
              type="text"
              value={newMessage.to}
              onChange={(e) => setNewMessage({...newMessage, to: e.target.value})}
              placeholder="+91 9876543210"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid rgba(0, 0, 0, 0.1)',
                background: 'rgba(255, 255, 255, 0.8)',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Message
            </label>
            <textarea
              value={newMessage.message}
              onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
              placeholder="Type your message here..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid rgba(0, 0, 0, 0.1)',
                background: 'rgba(255, 255, 255, 0.8)',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                resize: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
        <button
          onClick={handleSendMessage}
          disabled={loading}
          style={{
            background: loading ? '#ccc' : 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            fontWeight: '600',
            padding: '14px 24px',
            borderRadius: '12px',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px'
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Sending...
            </>
          ) : (
            <>
              <Send />
              Send Message
            </>
          )}
        </button>
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '16px'
        }}>
          Message History
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '32px 0' }}>
              No messages sent yet
            </p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}
              >
                <div>
                  <p style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 4px' }}>
                    To: {msg.to}
                  </p>
                  <p style={{ color: '#6b7280', margin: 0 }}>
                    {msg.message}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px' }}>
                    {msg.timestamp}
                  </p>
                  <span style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    background: '#10b981',
                    borderRadius: '50%'
                  }}></span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderComingSoon = (title, icon, description) => (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '48px 24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          {React.createElement(icon)}
          {title}
        </h2>
        <div style={{ paddingTop: '32px', paddingBottom: '32px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>
            {React.createElement(icon)}
          </div>
          <p style={{ color: '#6b7280', fontSize: '18px', marginBottom: '8px' }}>
            Coming Soon!
          </p>
          <p style={{ color: '#9ca3af' }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'messages': return renderMessages();
      case 'contacts': return renderComingSoon('Contact Management', Users, 'Organize and manage all your WhatsApp contacts');
      case 'automation': return renderComingSoon('Bot Automation Rules', Bot, 'Create intelligent auto-responses and workflows');
      case 'analytics': return renderComingSoon('Advanced Analytics', BarChart3, 'Track performance, engagement, and ROI');
      case 'settings': return renderComingSoon('Settings & Configuration', Settings, 'Configure your WhatsApp API and preferences');
      default: return renderDashboard();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f3e8ff 0%, #dbeafe 50%, #e0f2fe 100%)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '80px',
          width: '256px',
          height: '256px',
          background: 'rgba(139, 92, 246, 0.1)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          animation: 'float 8s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '160px',
          right: '80px',
          width: '256px',
          height: '256px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          animation: 'float 8s ease-in-out infinite 2s'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          width: '256px',
          height: '256px',
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          animation: 'float 8s ease-in-out infinite 4s'
        }}></div>
      </div>
      
      <div style={{
        position: 'relative',
        zIndex: 20,
        display: 'flex',
        minHeight: '100vh'
      }}>
        {/* Sidebar */}
        <div style={{
          width: isSidebarOpen ? '288px' : '80px',
          transition: 'all 0.3s ease',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ padding: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '32px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
              }}>
                <MessageSquare />
              </div>
              {isSidebarOpen && (
                <div>
                  <h1 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: 0
                  }}>
                    WhatsApp Pro
                  </h1>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    Premium SaaS
                  </p>
                </div>
              )}
            </div>
            
            <nav style={{ marginBottom: '24px' }}>
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      background: activeTab === item.id
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'transparent',
                      color: activeTab === item.id ? 'white' : '#6b7280',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      marginBottom: '8px',
                      fontWeight: activeTab === item.id ? '600' : '500',
                      transform: activeTab === item.id ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: activeTab === item.id ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== item.id) {
                        e.target.style.background = 'rgba(255, 255, 255, 0.6)';
                        e.target.style.color = '#1f2937';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== item.id) {
                        e.target.style.background = 'transparent';
                        e.target.style.color = '#6b7280';
                      }
                    }}
                  >
                    <Icon />
                    {isSidebarOpen && <span>{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
          
          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '24px',
            right: '24px'
          }}>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
              }}
            >
              {isSidebarOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          height: '100vh'
        }}>
          {renderContent()}
        </div>
      </div>

      {/* Premium Badge */}
      <div style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 1000
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <Shield />
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>PREMIUM</span>
        </div>
      </div>

      {/* Notification */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '16px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          background: notification.type === 'error' ? '#ef4444' : '#10b981',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '500',
          transform: 'translateX(0)',
          transition: 'all 0.3s ease'
        }}>
          {notification.type === 'error' ? <AlertCircle /> : <CheckCircle />}
          {notification.message}
        </div>
      )}

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default WhatsAppSaaSDashboard;
