import React, { useState, useRef, useEffect, useCallback } from 'react';
import TableView from '../shared/TableView';
import { ProcessedItem, ProcessedItemWithoutId } from '../shared/ResultDisplay';
import './UploadScreen.css';
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

interface UploadScreenProps {
  isProcessing: boolean;
  results: ProcessedItem[];
  isConnected: boolean;
  errorMessage: string;
  saveMessage: string;
  dbMessage: string;
  onImageUpload: (file: File) => Promise<void>;
  onConnectionChange: (connected: boolean) => void;
  onSaveResults: (updatedResults: ProcessedItem[]) => Promise<void>;
  onSaveToDB: (results: ProcessedItemWithoutId[], screenId: number) => Promise<void>;
  onClearMessages: () => void;
}

const UploadScreen: React.FC<UploadScreenProps> = ({
  isProcessing,
  results,
  isConnected,
  errorMessage,
  saveMessage,
  dbMessage,
  onImageUpload,
  onConnectionChange,
  onSaveResults,
  onSaveToDB,
  onClearMessages
}) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedScreen, setSelectedScreen] = useState<{ id: number; name: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isScreenDropdownOpen, setIsScreenDropdownOpen] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const screenDropdownRef = useRef<HTMLDivElement>(null);

  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleReadFile = async () => {
    if (!selectedFile) {
      alert('Please select an image first');
      return;
    }
    if (!selectedProject) {
      alert('Please select a project name first');
      return;
    }
    if (!selectedScreen) {
      alert('Please select a screen name first');
      return;
    }
    
    try {
      await onImageUpload(selectedFile);
    } catch (error) {
      console.error('Error processing image:', error);
    }
  };

  const fetchProjects = async () => {
    if (isLoadingProjects) return;
    
    try {
      setIsLoadingProjects(true);
      console.log('Fetching projects from:', `${API_CONFIG.BASE_URL}/projects`);
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
      console.log('Fetched projects data:', data);
      const projectsArray = Array.isArray(data) ? data : [];
      console.log('Projects array:', projectsArray);
      setProjects(projectsArray);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleProjectDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const willOpen = !isProjectDropdownOpen;
    console.log('Dropdown toggle - willOpen:', willOpen, 'current state:', isProjectDropdownOpen);
    setIsProjectDropdownOpen(willOpen);
    if (willOpen) {
      fetchProjects();
    }
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setSelectedScreen(null);
    setIsProjectDropdownOpen(false);
    console.log('Selected project:', project);
  };

  const handleScreenDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedProject) return;
    setIsScreenDropdownOpen(!isScreenDropdownOpen);
  };

  const handleSelectScreen = (screen: { id: number; name: string }) => {
    setSelectedScreen(screen);
    setIsScreenDropdownOpen(false);
  };

  const handleClear = useCallback(() => {
    setSelectedProject(null);
    setSelectedScreen(null);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClearMessages();
  }, [previewUrl, onClearMessages]);

  const processFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Clear previous preview
    setPreviewUrl(prevUrl => {
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl);
      }
      return null;
    });
    
    // Set new file and create preview
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

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
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProjectDropdownOpen && projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
      if (isScreenDropdownOpen && screenDropdownRef.current && !screenDropdownRef.current.contains(event.target as Node)) {
        setIsScreenDropdownOpen(false);
      }
    };

    // Use setTimeout to avoid immediate closure on the same click that opened it
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProjectDropdownOpen, isScreenDropdownOpen]);

  // Clear all fields when save to DB is successful
  useEffect(() => {
    if (dbMessage && dbMessage.includes('Successfully saved')) {
      // Delay to show success message before clearing (2 seconds)
      const timer = setTimeout(() => {
        handleClear();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [dbMessage, handleClear]);

  return (
    <div className="upload-screen-container">
      <div className="upload-content-wrapper">
        <div className="upload-main-content">
          <div 
            className={`upload-area-new ${dragActive ? 'drag-active' : ''}`}
            onClick={handleSelectFile}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {previewUrl ? (
              <div className="image-preview-container">
                <img src={previewUrl} alt="Preview" className="preview-image" />
                <button 
                  className="change-image-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectFile();
                  }}
                  disabled={isProcessing}
                >
                  📷 Change Image
                </button>
              </div>
            ) : (
              <div className="upload-text-new">
                Drag and drop or click to select the image
              </div>
            )}
          </div>

          <div className="input-fields-container">
            <div className="input-field-wrapper">
              <label className="input-label">Project name :</label>
              <div className="select-input-wrapper" ref={projectDropdownRef}>
                <div 
                  className={`custom-dropdown ${isProjectDropdownOpen ? 'open' : ''}`}
                  onClick={handleProjectDropdownToggle}
                >
                  <span className={`dropdown-value ${!selectedProject ? 'placeholder' : ''}`}>
                    {selectedProject?.name || 'Select project'}
                  </span>
                  <span className="dropdown-arrow">▼</span>
                </div>
                {isProjectDropdownOpen && (
                  <div className="dropdown-menu" style={{ display: 'block' }}>
                    {isLoadingProjects ? (
                      <div className="dropdown-loading">
                        <div className="dropdown-spinner"></div>
                        <span>Loading projects...</span>
                      </div>
                    ) : projects.length > 0 ? (
                      projects.map((project) => (
                        <div
                          key={project.id}
                          className={`dropdown-item ${selectedProject?.id === project.id ? 'selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectProject(project);
                          }}
                        >
                          {project.name}
                        </div>
                      ))
                    ) : (
                      <div className="dropdown-empty">No projects found (count: {projects.length})</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="input-field-wrapper">
              <label className="input-label">Screen name :</label>
              <div className="select-input-wrapper" ref={screenDropdownRef}>
                <div 
                  className={`custom-dropdown ${isScreenDropdownOpen ? 'open' : ''} ${!selectedProject ? 'disabled' : ''}`}
                  onClick={handleScreenDropdownToggle}
                >
                  <span className={`dropdown-value ${!selectedScreen ? 'placeholder' : ''}`}>
                    {selectedScreen?.name || (selectedProject ? 'Select screen' : 'Select project first')}
                  </span>
                  <span className="dropdown-arrow">▼</span>
                </div>
                {isScreenDropdownOpen && selectedProject && (
                  <div className="dropdown-menu" style={{ display: 'block' }}>
                    {selectedProject.screens && selectedProject.screens.length > 0 ? (
                      selectedProject.screens.map((screen) => (
                        <div
                          key={screen.id}
                          className={`dropdown-item ${selectedScreen?.id === screen.id ? 'selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectScreen({ id: screen.id, name: screen.name });
                          }}
                        >
                          {screen.name}
                        </div>
                      ))
                    ) : (
                      <div className="dropdown-empty">No screens found</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              className="read-file-button" 
              onClick={handleReadFile}
              disabled={!selectedFile || !selectedProject || !selectedScreen || isProcessing}
            >
              Read file
            </button>
            <button 
              className="clear-button" 
              onClick={handleClear}
              disabled={isProcessing}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="right-panel">
        {isProcessing ? (
          <div className="processing-container">
            <div className="processing-header">
              <div className="header-icon">🔍</div>
              <div className="header-content">
                <h2>AI Analysis Results</h2>
                <p>Processing your image with ChatGPT Vision API</p>
              </div>
            </div>
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <div className="loading-text">
                <h4>Analyzing image content...</h4>
                <p>Extracting text and identifying elements</p>
              </div>
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
            </div>
          </div>
        ) : dbMessage ? (
          <div className="success-container">
            <div className="success-header">
              <div className="header-icon">💾</div>
              <div className="header-content">
                <h2>Database Save Successful!</h2>
                <p>Your results have been saved to database</p>
              </div>
            </div>
            <div className="success-content">
              <div className="success-icon">🎉</div>
              <div className="success-text">
                <h4>Saved to Database!</h4>
                <p>{dbMessage}</p>
              </div>
              <div className="success-actions">
                <button 
                  className="upload-new-button"
                  onClick={onClearMessages}
                >
                  📤 Upload New Image
                </button>
              </div>
            </div>
          </div>
        ) : results.length > 0 ? (
          <TableView 
            items={results.map(item => ({
              id: item.id,
              itemId: item.id,
              content: item.content,
              type: item.type,
              database: item.database,
              description: item.description,
              imageProcessingResultId: 0,
              dataType: item.dataType,
              dbField: item.dbField
            }))}
            isLoading={false}
            isEditable={true}
            onSave={onSaveResults}
            onSaveToDB={(items) => {
              if (!selectedScreen) {
                alert('Please select a screen first');
                return;
              }
              onSaveToDB(items, selectedScreen.id);
            }}
          />
        ) : (
          <div className="empty-results">
            <div className="empty-icon">📊</div>
            <h3>No Results Yet</h3>
            <p>Upload an image to see the AI analysis results</p>
            <div className="empty-hints">
              <div className="hint-item">
                <span className="hint-icon">🖼️</span>
                <span>Upload an image</span>
              </div>
              <div className="hint-item">
                <span className="hint-icon">🤖</span>
                <span>AI will analyze content</span>
              </div>
              <div className="hint-item">
                <span className="hint-icon">📝</span>
                <span>View extracted text</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadScreen;
