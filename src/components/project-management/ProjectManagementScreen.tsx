import React, { useState, useEffect, useMemo } from 'react';
import './ProjectManagementScreen.css';
import chatGPTService from '../../services/chatgptService';
import NewRegistrationModal from './NewRegistrationModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { Project } from '../shared/ProjectList';

interface ProjectManagementScreenProps {
  onBackToUpload: () => void;
}

const ProjectManagementScreen: React.FC<ProjectManagementScreenProps> = ({ onBackToUpload }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<number>>(new Set());
  const [selectedProject, setSelectedProject] = useState<string>('All');
  const [selectedScreen, setSelectedScreen] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editingScreenName, setEditingScreenName] = useState<string>('');
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean; screen: Project | null }>({
    isOpen: false,
    screen: null
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await chatGPTService.getProjectsScreens();
      if (data && data.length > 0) {
        // Transform API response to Project format
        // Use screenId from API response for delete/update operations
        const transformedProjects: Project[] = data.map((item: any) => ({
          id: item.screenId, // Use screenId from API - required for delete/update
          title: item.projectName || '',
          body: '',
          source: item.screenName || '',
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          processedItems: []
        }));
        setProjects(transformedProjects);
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setProjects([]);
      setError('');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (projectId: number) => {
    const newSelected = new Set(selectedProjectIds);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjectIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProjectIds.size === filteredProjects.length) {
      setSelectedProjectIds(new Set());
    } else {
      setSelectedProjectIds(new Set(filteredProjects.map(p => p.id)));
    }
  };

  const handleClearFilters = () => {
    setSelectedProject('All');
    setSelectedScreen('All');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const uniqueProjects = useMemo(() => {
    const projectNames = new Set(projects.map(p => p.title || p.source));
    return Array.from(projectNames);
  }, [projects]);

  const uniqueScreens = useMemo(() => {
    const screens = new Set(projects.map(p => p.source));
    return Array.from(screens);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    if (selectedProject !== 'All') {
      filtered = filtered.filter(p => (p.title || p.source) === selectedProject);
    }

    if (selectedScreen !== 'All') {
      filtered = filtered.filter(p => p.source === selectedScreen);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(term) ||
        p.body?.toLowerCase().includes(term) ||
        p.source?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [projects, selectedProject, selectedScreen, searchTerm]);

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const handleAddProject = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleRegister = async (projectName: string, screens: string[]) => {
    try {
      await chatGPTService.registerProject(projectName, screens);
      console.log('Successfully registered project:', projectName, screens);
      // Refresh projects list after successful registration
      await fetchProjects();
    } catch (error) {
      console.error('Error registering project:', error);
      throw error;
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleEditScreen = (project: Project) => {
    setEditingRowId(project.id);
    setEditingScreenName(project.source);
  };

  const handleSaveEdit = async (project: Project) => {
    try {
      if (!editingScreenName.trim()) {
        handleCancelEdit();
        return;
      }

      // Call API to update screen name
      await chatGPTService.updateScreen(project.id, editingScreenName.trim());
      
      // Update local state
      const updatedProjects = projects.map(p => 
        p.id === project.id ? { ...p, source: editingScreenName.trim() } : p
      );
      setProjects(updatedProjects);
      setEditingRowId(null);
      setEditingScreenName('');
      
      // Refresh list to get latest data
      await fetchProjects();
    } catch (error) {
      console.error('Error updating screen:', error);
      alert(error instanceof Error ? error.message : 'Failed to update screen');
    }
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditingScreenName('');
  };

  const handleDeleteScreen = (project: Project) => {
    setDeleteConfirmModal({
      isOpen: true,
      screen: project
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmModal.screen) return;

    try {
      // Call API to delete screen using the id from API
      await chatGPTService.deleteScreen(deleteConfirmModal.screen.id);
      
      // Close modal
      setDeleteConfirmModal({ isOpen: false, screen: null });
      
      // Refresh list to get latest data
      await fetchProjects();
    } catch (error) {
      console.error('Error deleting screen:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete screen');
      setDeleteConfirmModal({ isOpen: false, screen: null });
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmModal({ isOpen: false, screen: null });
  };

  if (loading) {
    return (
      <div className="history-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredProjects.length);

  return (
    <div className="history-container">
      <div className="history-header">
        <div className="header-left-section">
          <button className="hamburger-menu">☰</button>
          <h1 className="history-title">Project management</h1>
        </div>
        <div className="header-breadcrumb">
          <span className="breadcrumb-home">🏠</span>
          <span className="breadcrumb-separator"> &gt; </span>
          <span className="breadcrumb-item">Tools</span>
          <span className="breadcrumb-separator"> &gt; </span>
          <span className="breadcrumb-item active">Project management</span>
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-inputs">
          <select
            className="filter-select"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="All">All</option>
            {uniqueProjects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={selectedScreen}
            onChange={(e) => setSelectedScreen(e.target.value)}
          >
            <option value="All">All</option>
            {uniqueScreens.map((screen) => (
              <option key={screen} value={screen}>
                {screen}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-actions">
          <button className="clear-button" onClick={handleClearFilters}>
            Clear
          </button>
          <button className="search-button" onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>

      <div className="table-actions">
        <button className="add-button" onClick={handleAddProject}>
          Add
        </button>
        <div className="entries-selector">
          <span>Show</span>
          <select
            className="entries-select"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>entries</span>
        </div>
      </div>

      <div className="table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedProjectIds.size === filteredProjects.length && filteredProjects.length > 0}
                  onChange={handleSelectAll}
                />
                <span className="sort-icon">▼</span>
              </th>
              <th>STT <span className="sort-icon">▼</span></th>
              <th>Project <span className="sort-icon">▼</span></th>
              <th>Screen <span className="sort-icon">▼</span></th>
              <th>Registered Date <span className="sort-icon">▼</span></th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProjects.length > 0 ? (
              paginatedProjects.map((project, index) => (
                <tr key={project.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedProjectIds.has(project.id)}
                      onChange={() => handleSelectProject(project.id)}
                    />
                  </td>
                  <td>{startIndex + index}</td>
                  <td>{project.title || project.source}</td>
                  <td>
                    {editingRowId === project.id ? (
                      <input
                        type="text"
                        className="inline-edit-input"
                        value={editingScreenName}
                        onChange={(e) => setEditingScreenName(e.target.value)}
                        onBlur={() => handleSaveEdit(project)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(project);
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      project.source
                    )}
                  </td>
                  <td>{formatDate(project.createdAt)}</td>
                  <td>
                    <div className="table-actions-cell">
                      {editingRowId === project.id ? (
                        <>
                          <button
                            className="icon-button save-button"
                            onClick={() => handleSaveEdit(project)}
                            title="Save"
                          >
                            ✓
                          </button>
                          <button
                            className="icon-button cancel-button"
                            onClick={handleCancelEdit}
                            title="Cancel"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="icon-button edit-button"
                            onClick={() => handleEditScreen(project)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="icon-button delete-button"
                            onClick={() => handleDeleteScreen(project)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="no-data-cell">
                  <div className="no-data-message">
                    <div className="no-data-icon">📋</div>
                    <p>No data available</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-section">
        <div className="pagination-info">
          <span>Show</span>
          <select
            className="entries-select"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>entries</span>
        </div>
        <div className="pagination-info">
          <span>
            Showing {startIndex} to {endIndex} of {filteredProjects.length} entries
          </span>
        </div>
        <div className="pagination-controls">
          <button
            className="pagination-button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            &lt; Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <button
                key={pageNum}
                className={`pagination-button ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span className="pagination-ellipsis">...</span>
              <button
                className="pagination-button"
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}
          <button
            className="pagination-button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next &gt;
          </button>
        </div>
      </div>

      {isModalOpen && (
        <NewRegistrationModal
          onClose={handleModalClose}
          onRegister={handleRegister}
        />
      )}

      {deleteConfirmModal.isOpen && deleteConfirmModal.screen && (
        <ConfirmDeleteModal
          screenName={deleteConfirmModal.screen.source}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
};

export default ProjectManagementScreen;

