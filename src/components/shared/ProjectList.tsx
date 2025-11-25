import React, { useState, useEffect, useMemo } from 'react';
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
  imageUrl?: string;
  urlSheet?: string;
}

export interface ProcessedItem {
  id: number;
  itemId: number;
  content: string;
  type: string;
  database: string;
  description: string;
  imageProcessingResultId: number;
  dataType?: string;
  dbField?: string;
  io?: string;
  required?: boolean | null;
  stt?: number;
}

interface ProjectListProps {
  onBackToUpload: () => void;
  onViewProject: (project: Project) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ onBackToUpload, onViewProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<number>>(new Set());
  const [selectedProject, setSelectedProject] = useState<string>('All');
  const [selectedScreen, setSelectedScreen] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError('');
      
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

  const handleExportCSV = () => {
    const headers = ['STT', 'Project', 'Screen', 'Registered Date'];
    const rows = filteredProjects.map((project, index) => [
      index + 1,
      project.title || project.source,
      project.source,
      formatDate(project.createdAt)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `projects_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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

  if (error) {
    return (
      <div className="history-container">
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

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredProjects.length);

  return (
    <div className="history-container">
      <div className="history-header">
        <div className="header-left-section">
          <button className="hamburger-menu">☰</button>
          <h1 className="history-title">History</h1>
        </div>
        <div className="header-breadcrumb">
          <span className="breadcrumb-home">🏠</span>
          <span className="breadcrumb-separator"> &gt; </span>
          <span className="breadcrumb-item">Tools</span>
          <span className="breadcrumb-separator"> &gt; </span>
          <span className="breadcrumb-item active">History</span>
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
        <button className="csv-export-button" onClick={handleExportCSV}>
          CSV export
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
            {paginatedProjects.map((project, index) => (
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
                <td>{project.source}</td>
                <td>{formatDate(project.createdAt)}</td>
                <td>
                  <button
                    className="details-button"
                    onClick={() => handleViewProject(project)}
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
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
    </div>
  );
};

export default ProjectList;
