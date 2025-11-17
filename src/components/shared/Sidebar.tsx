import React, { useState } from 'react';
import './Sidebar.css';

interface SidebarProps {
  currentView: 'upload' | 'projects' | 'project-detail';
  onNavigate: (view: 'upload' | 'projects') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const [isToolsExpanded, setIsToolsExpanded] = useState(true);

  const isHistoryActive = currentView === 'projects';

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
                className={`menu-item ${currentView === 'projects' ? '' : ''}`}
                onClick={() => onNavigate('projects')}
              >
                Project managemet
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
