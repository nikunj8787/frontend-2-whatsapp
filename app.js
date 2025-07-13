import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MessageSquare, 
  Users, 
  Bot, 
  BarChart3, 
  Settings, 
  Send, 
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  LogOut,
  Crown,
  Shield,
  Zap,
  Globe,
  Menu,
  X
} from 'lucide-react';

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

      const response = await axios.post(endpoint, data);
      
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
      const errorMessage = error.response?.data?.error || `${authMode} failed. Please try again.`;
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
      color: 'from-green-500 to-emerald-600',
      icon: MessageSquare
    },
    { 
      label: 'Active Contacts', 
      value: analytics.contacts?.active || '0', 
      change: '+12%', 
      color: 'from-blue-500 to-cyan-600',
      icon: Users
    },
    { 
      label: 'Bot Rules', 
      value: analytics.botRules?.active || '0', 
      change: '+45%', 
      color: 'from-purple-500 to-violet-600',
      icon: Bot
    },
    { 
      label: 'Response Rate', 
      value: analytics.engagement?.responseRate || '0%', 
      change: '+5%', 
      color: 'from-orange-500 to-red-600',
      icon: BarChart3
    },
  ];

  // Authentication form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-32 h-32 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 left-1/2 w-32 h-32 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="relative max-w-md w-full">
          <div className="glass rounded-3xl p-8 shadow-2xl border border-white/20">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-glow">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 gradient-text">WhatsApp SaaS Pro</h1>
              <p className="text-gray-300">Premium Business Communication</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              {authMode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                    className="input-primary text-gray-800"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                  className="input-primary text-gray-800"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={authForm.password}
                    onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                    className="input-primary text-gray-800 pr-12"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-xl border border-red-800/30">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {authLoading ? (
                  <div className="spinner"></div>
                ) : (
                  <>
                    {authMode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    {authMode === 'login' ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-300">
                {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
                <button
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                    setAuthError('');
                    setAuthForm({ email: '', password: '', name: '' });
                  }}
                  className="ml-2 text-green-400 hover:text-green-300 font-semibold transition-colors"
                >
                  {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification.show && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center gap-2 transform transition-all duration-300 ${
            notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          }`}>
            {notification.type === 'error' ? 
              <AlertCircle className="w-5 h-5" /> : 
              <CheckCircle className="w-5 h-5" />
            }
            {notification.message}
          </div>
        )}
      </div>
    );
  }

  // Dashboard content rendering functions
  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 p-8 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Crown className="w-8 h-8 text-yellow-400 animate-pulse" />
                <span className="text-yellow-400 font-bold text-lg">Premium Dashboard</span>
              </div>
              <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}!</h1>
              <p className="text-xl opacity-90">Manage your WhatsApp business communications with style</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-20 -top-20 w-60 h-60 bg-purple-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card group hover:transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:animate-pulse`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-green-600 text-sm font-semibold bg-green-100 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</h3>
              <p className="text-gray-600 font-medium">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setActiveTab('messages')}
              className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 rounded-xl hover:transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <Send className="w-6 h-6 mb-2 mx-auto" />
              <span className="font-semibold">Send Message</span>
            </button>
            <button 
              onClick={() => setActiveTab('contacts')}
              className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white p-4 rounded-xl hover:transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <Users className="w-6 h-6 mb-2 mx-auto" />
              <span className="font-semibold">Contacts</span>
            </button>
            <button 
              onClick={() => setActiveTab('automation')}
              className="bg-gradient-to-br from-purple-500 to-violet-600 text-white p-4 rounded-xl hover:transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <Bot className="w-6 h-6 mb-2 mx-auto" />
              <span className="font-semibold">Bot Rules</span>
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-4 rounded-xl hover:transform hover