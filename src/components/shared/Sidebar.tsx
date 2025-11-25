import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../../config/api';
import './Sidebar.css';

interface SidebarProps {
  currentView: 'upload' | 'projects' | 'project-detail' | 'project-management';
  onNavigate: (view: 'upload' | 'projects' | 'project-management') => void;
}

const GOOGLE_LOGIN_STORAGE_KEY = 'google_sheet_logged_in';

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const [isToolsExpanded, setIsToolsExpanded] = useState(true);
  const [isGoogleLoggedIn, setIsGoogleLoggedIn] = useState<boolean>(false);

  const isHistoryActive = currentView === 'projects';
  const isProjectManagementActive = currentView === 'project-management';

  // Check Google login status from localStorage and API
  useEffect(() => {
    const checkGoogleLoginStatus = () => {
      // Check localStorage first
      const storedStatus = localStorage.getItem(GOOGLE_LOGIN_STORAGE_KEY);
      if (storedStatus === 'true') {
        setIsGoogleLoggedIn(true);
        return;
      }

      // If not in localStorage, check API
      const checkAPI = async () => {
        try {
          const response = await fetch(`${API_CONFIG.BASE_URL}/google-sheet/oauth/status`, {
            method: 'GET',
            credentials: 'include',
          });

          if (response.ok) {
            const result = await response.json();
            const isAuthenticated = result.authenticated || false;
            setIsGoogleLoggedIn(isAuthenticated);
            // Update localStorage based on API response
            if (isAuthenticated) {
              localStorage.setItem(GOOGLE_LOGIN_STORAGE_KEY, 'true');
            } else {
              localStorage.removeItem(GOOGLE_LOGIN_STORAGE_KEY);
            }
          } else {
            setIsGoogleLoggedIn(false);
            localStorage.removeItem(GOOGLE_LOGIN_STORAGE_KEY);
          }
        } catch (error) {
          console.error('Error checking Google login status:', error);
          setIsGoogleLoggedIn(false);
          localStorage.removeItem(GOOGLE_LOGIN_STORAGE_KEY);
        }
      };

      checkAPI();
    };

    checkGoogleLoginStatus();
    
    // Check status periodically
    const interval = setInterval(checkGoogleLoginStatus, 30000); // Check every 30 seconds
    
    // Listen for storage changes (in case login status changes in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === GOOGLE_LOGIN_STORAGE_KEY) {
        setIsGoogleLoggedIn(e.newValue === 'true');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleGoogleLogin = () => {
    // Redirect to NestJS OAuth2 endpoint
    const oauthUrl = `${API_CONFIG.BASE_URL}/google-sheet/oauth/auth`;
    window.location.href = oauthUrl;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-welcome">
          <h3>Welcome</h3>
        </div>

        <div className="sidebar-section">
          <div 
            className="sidebar-section-header"
            onClick={() => setIsToolsExpanded(!isToolsExpanded)}
          >
            <div className="section-title">
              <span className="section-icon">🏠</span>
              <span>Tools</span>
            </div>
            <span className={`section-chevron ${isToolsExpanded ? 'expanded' : ''}`}>
              ▲
            </span>
          </div>

          {isToolsExpanded && (
            <div className="sidebar-menu-items">
              <div 
                className={`menu-item ${currentView === 'upload' ? 'active' : ''}`}
                onClick={() => onNavigate('upload')}
              >
                Gen spec
              </div>
              <div 
                className={`menu-item ${isHistoryActive ? 'active' : ''}`}
                onClick={() => onNavigate('projects')}
              >
                History
              </div>
              <div 
                className={`menu-item ${isProjectManagementActive ? 'active' : ''}`}
                onClick={() => onNavigate('project-management')}
              >
                Project management
              </div>
            </div>
          )}
        </div>

        {/* Google Login Section */}
        {!isGoogleLoggedIn && (
          <div className="sidebar-section">
            <button 
              className="sidebar-google-login-button"
              onClick={handleGoogleLogin}
            >
              <span className="google-icon">🔐</span>
              <span>Login with Google</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
