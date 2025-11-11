import React, { useState, useEffect } from 'react';
import './ProjectList.css';
import chatGPTService from '../../services/chatgptService';

export interface Project {
  id: number;
  title: string;
  body: string;
  source: string;
  timestamp: string;
  createdAt: string;
  processedItems: ProcessedItem[];
}

export interface ProcessedItem {
  id: number;
  itemId: number;
  content: string;
  type: string;
  database: string;
  description: string;
  imageProcessingResultId: number;
}

interface ProjectListProps {
  onBackToUpload: () => void;
  onViewProject: (project: Project) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ onBackToUpload, onViewProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all projects from API
      const allProjects = await chatGPTService.getAllProjects();
      if (allProjects && allProjects.length > 0) {
        setProjects(allProjects);
      } else {
        setError('No projects found');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProject = (project: Project) => {
    onViewProject(project);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'text':
        return '#2196F3';
      case 'button':
        return '#4CAF50';
      case 'icon':
        return '#FF9800';
      case 'table':
        return '#9C27B0';
      case 'chart':
        return '#F44336';
      default:
        return '#607D8B';
    }
  };

  if (loading) {
    return (
      <div className="project-list-container">
        <div className="project-list-header">
          <h2>Processed Projects</h2>
          <button className="back-button" onClick={onBackToUpload}>
            ← Back to Upload
          </button>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-list-container">
        <div className="project-list-header">
          <h2>Processed Projects</h2>
          <button className="back-button" onClick={onBackToUpload}>
            ← Back to Upload
          </button>
        </div>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={fetchProjects}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="project-list-container">
      <div className="project-list-header">
        <div className="header-left">
          <h2>Processed Projects</h2>
          <span className="project-count">
            {projects.length} project{projects.length !== 1 ? 's' : ''} found
          </span>
        </div>
        <div className="header-actions">
          <button className="refresh-button" onClick={fetchProjects}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="projects-grid">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <div className="project-header">
              <h3 className="project-title">{project.title}</h3>
              <div className="project-meta">
                <span className="project-source">{project.source}</span>
                <span className="project-date">{formatDate(project.createdAt)}</span>
              </div>
            </div>
            
            <div className="project-body">
              <p>{project.body}</p>
            </div>

            <div className="project-stats">
              <div className="stat-item">
                <span className="stat-label">Items:</span>
                <span className="stat-value">{project.processedItems.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">ID:</span>
                <span className="stat-value">#{project.id}</span>
              </div>
            </div>

            <div className="project-items-preview">
              <h4>Processed Items Preview:</h4>
              <div className="items-list">
                {project.processedItems && project.processedItems.length > 0 ? (
                  <>
                    {project.processedItems.map((item) => (
                      <div key={item.id} className="item-preview">
                        <div 
                          className="item-type-badge"
                          style={{ backgroundColor: getTypeColor(item.type) }}
                        >
                          {item.type}
                        </div>
                        <span className="item-content">{item.content}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="no-items">
                    No processed items available
                  </div>
                )}
              </div>
            </div>

            <div className="project-actions">
              <button 
                className="view-button"
                onClick={() => handleViewProject(project)}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3>No Projects Found</h3>
          <p>No processed projects are available at the moment.</p>
          <button className="refresh-button" onClick={fetchProjects}>
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
