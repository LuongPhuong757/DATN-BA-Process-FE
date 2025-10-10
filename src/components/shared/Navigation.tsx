import React from 'react';
import './Navigation.css';

interface NavigationProps {
  currentView: 'upload' | 'projects' | 'project-detail';
  onNavigate: (view: 'upload' | 'projects') => void;
  projectTitle?: string;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate, projectTitle }) => {
  const getBreadcrumb = () => {
    switch (currentView) {
      case 'upload':
        return [{ label: 'Image Upload', active: true }];
      case 'projects':
        return [
          { label: 'Image Upload', active: false, onClick: () => onNavigate('upload') },
          { label: 'Projects', active: true }
        ];
      case 'project-detail':
        return [
          { label: 'Image Upload', active: false, onClick: () => onNavigate('upload') },
          { label: 'Projects', active: false, onClick: () => onNavigate('projects') },
          { label: projectTitle || 'Project Detail', active: true }
        ];
      default:
        return [];
    }
  };

  const breadcrumbs = getBreadcrumb();

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <div className="brand-icon">🖼️</div>
          <h1 className="brand-title">Image Processor</h1>
        </div>
        
        <div className="nav-breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="breadcrumb-separator">›</span>}
              <span 
                className={`breadcrumb-item ${crumb.active ? 'active' : ''}`}
                onClick={crumb.onClick}
              >
                {crumb.label}
              </span>
            </React.Fragment>
          ))}
        </div>

        <div className="nav-actions">
          {currentView !== 'upload' && (
            <button 
              className="nav-button primary"
              onClick={() => onNavigate('upload')}
            >
              📤 Upload New
            </button>
          )}
          {currentView !== 'projects' && (
            <button 
              className="nav-button secondary"
              onClick={() => onNavigate('projects')}
            >
              📁 View Projects
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;


