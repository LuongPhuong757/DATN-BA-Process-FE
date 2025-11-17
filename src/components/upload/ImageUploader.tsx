import React, { useState, useRef, useEffect } from 'react';
import './ImageUploader.css';
import { API_CONFIG } from '../../config/api';

interface Project {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  screens: Array<{
    id: number;
    name: string;
    description: string | null;
    projectId: number;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  isProcessing: boolean;
  isConnected?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, isProcessing, isConnected = true }) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onImageUpload(file);
    } else {
      alert('Please upload an image file');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const fetchProjects = async () => {
    if (isLoadingProjects) return;
    
    try {
      setIsLoadingProjects(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/projects`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status}`);
      }

      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleDropdownToggle = () => {
    const willOpen = !isDropdownOpen;
    setIsDropdownOpen(willOpen);
    if (willOpen) {
      fetchProjects();
    }
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="image-uploader">
      <div className="uploader-header">
        <div className="header-icon">🖼️</div>
        <div className="header-content">
          <h2>AI Image Analysis</h2>
          <p>Upload an image to extract text content using ChatGPT Vision API</p>
        </div>
      </div>
      
      {!isConnected && (
        <div className="connection-warning">
          <span className="warning-icon">⚠️</span>
          <span>ChatGPT API is not connected. Image processing will use mock data.</span>
        </div>
      )}

      <div className="project-selector-container">
        <label className="project-selector-label">Project name :</label>
        <div className="project-dropdown-wrapper" ref={dropdownRef}>
          <div 
            className={`project-dropdown ${isDropdownOpen ? 'open' : ''}`}
            onClick={handleDropdownToggle}
          >
            <span className={`project-dropdown-value ${!selectedProject ? 'placeholder' : ''}`}>
              {selectedProject?.name || 'Select project'}
            </span>
            <span className="dropdown-arrow-icon">▼</span>
          </div>
          {isDropdownOpen && (
            <div className="project-dropdown-menu">
              {isLoadingProjects ? (
                <div className="dropdown-loading">
                  <div className="dropdown-spinner"></div>
                  <span>Loading projects...</span>
                </div>
              ) : projects.length > 0 ? (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className={`project-dropdown-item ${selectedProject?.id === project.id ? 'selected' : ''}`}
                    onClick={() => handleSelectProject(project)}
                  >
                    {project.name}
                  </div>
                ))
              ) : (
                <div className="dropdown-empty">No projects found</div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        
        {previewUrl ? (
          <div className="image-preview">
            <img src={previewUrl} alt="Preview" />
            {isProcessing && (
              <div className="processing-overlay">
                <div className="processing-content">
                  <div className="processing-spinner"></div>
                  <span>AI is analyzing your image...</span>
                </div>
              </div>
            )}
            <div className="preview-actions">
              <button 
                className="change-image-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                📷 Change Image
              </button>
            </div>
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon-container">
              <div className="upload-icon">📁</div>
              <div className="upload-icon-secondary">✨</div>
            </div>
            <div className="upload-text">
              <h3>Drop your image here</h3>
              <p>or click to browse files</p>
            </div>
            <div className="upload-hints">
              <div className="hint-item">
                <span className="hint-icon">📸</span>
                <span>JPG, PNG, GIF, WebP</span>
              </div>
              <div className="hint-item">
                <span className="hint-icon">🔍</span>
                <span>AI Text Extraction</span>
              </div>
              <div className="hint-item">
                <span className="hint-icon">⚡</span>
                <span>Fast Processing</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
