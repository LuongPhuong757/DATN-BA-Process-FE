import React, { useState, useMemo } from 'react';
import './ResultDisplay.css';

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
}

export interface ProcessedItemWithoutId {
  content: string;
  type: string;
  database: string;
  description: string;
  imageProcessingResultId: number;
  dataType?: string;
  dbField?: string;
}

interface ResultDisplayProps {
  results: ProcessedItem[];
  isLoading: boolean;
  onSave?: (updatedResults: ProcessedItem[]) => void;
  onSaveToDB?: (results: ProcessedItemWithoutId[]) => void;
  isReadOnly?: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ results, isLoading, onSave, onSaveToDB, isReadOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedResults, setEditedResults] = useState<ProcessedItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingToDB, setIsSavingToDB] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  const [selectedDate, setSelectedDate] = useState('Last 30 days');
  const [selectedProject, setSelectedProject] = useState('All');
  const [selectedScreen, setSelectedScreen] = useState('All');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const handleEdit = () => {
    setEditedResults([...results]);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedResults([]);
  };

  const handleFieldChange = (id: number, field: keyof ProcessedItem, value: string) => {
    setEditedResults(prev => 
      prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(editedResults);
      setIsEditing(false);
      setEditedResults([]);
    } catch (error) {
      console.error('Error saving results:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToDB = async () => {
    if (!onSaveToDB) return;
    
    setIsSavingToDB(true);
    try {
      // Remove id and itemId fields from results before sending to database
      const resultsWithoutId = results.map(({ id, itemId, ...item }) => item);
      await onSaveToDB(resultsWithoutId);
    } catch (error) {
      console.error('Error saving to database:', error);
    } finally {
      setIsSavingToDB(false);
    }
  };

  const formatDescription = (text: string) => {
    if (!text) return '';
    return text.split('.').map((part, index, array) => {
      if (index === array.length - 1 && part.trim() === '') {
        return '';
      }
      return index < array.length - 1 ? part + '.' : part;
    }).filter(part => part.trim() !== '').join('.\n');
  };

  const handleClearFilters = () => {
    setSelectedDate('Last 30 days');
    setSelectedProject('All');
    setSelectedScreen('All');
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const dataToExport = isEditing ? editedResults : results;
    const headers = ['STT', 'Content', 'Type', 'Database', 'Description'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map((item, index) => [
        index + 1,
        `"${item.content.replace(/"/g, '""')}"`,
        `"${item.type.replace(/"/g, '""')}"`,
        `"${item.database.replace(/"/g, '""')}"`,
        `"${item.description.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentData = isEditing ? editedResults : results;
      setSelectedRows(new Set(currentData.map(item => item.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const paginatedResults = useMemo(() => {
    const dataToShow = isEditing ? editedResults : results;
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    return dataToShow.slice(startIndex, endIndex);
  }, [isEditing, editedResults, results, currentPage, entriesPerPage]);

  const totalPages = Math.ceil((isEditing ? editedResults.length : results.length) / entriesPerPage);
  const startEntry = (currentPage - 1) * entriesPerPage + 1;
  const endEntry = Math.min(currentPage * entriesPerPage, isEditing ? editedResults.length : results.length);
  const totalEntries = isEditing ? editedResults.length : results.length;
  if (isLoading) {
    return (
      <div className="result-display">
        <div className="result-header">
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
    );
  }

  if (results.length === 0) {
    return (
      <div className="result-display">
        <div className="result-header">
          <div className="header-icon">📊</div>
          <div className="header-content">
            <h2>AI Analysis Results</h2>
            <p>Upload an image to see the analysis results</p>
          </div>
        </div>
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
      </div>
    );
  }

  return (
    <div className="result-display">
      <div className="result-page-header">
        <h1 className="page-title">AI Analysis Results</h1>
        <div className="breadcrumbs">
          <span className="breadcrumb-icon">🏠</span>
          <span className="breadcrumb-separator">›</span>
          <span>Tools</span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-active">Results</span>
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-input-group">
          <div className="filter-input-wrapper">
            <input
              type="text"
              className="filter-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              placeholder="Last 30 days"
            />
            <span className="filter-icon">📅</span>
          </div>
          <div className="filter-select-group">
            <label className="filter-label">Project</label>
            <select
              className="filter-select"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="All">All</option>
            </select>
          </div>
          <div className="filter-select-group">
            <label className="filter-label">Screen</label>
            <select
              className="filter-select"
              value={selectedScreen}
              onChange={(e) => setSelectedScreen(e.target.value)}
            >
              <option value="All">All</option>
            </select>
          </div>
        </div>
        <div className="filter-buttons">
          <button className="filter-clear-button" onClick={handleClearFilters}>
            Clear
          </button>
          <button className="filter-search-button" onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>

      <div className="results-actions">
        <div className="results-actions-left">
          <button className="csv-export-button" onClick={handleExportCSV}>
            CSV export
          </button>
          {!isEditing && !isReadOnly && (
            <>
              <button className="edit-button" onClick={handleEdit}>
                Edit
              </button>
              <button 
                className="save-to-db-button" 
                onClick={handleSaveToDB}
                disabled={isSavingToDB}
              >
                {isSavingToDB ? 'Saving to DB...' : 'Save To DB'}
              </button>
            </>
          )}
          {isEditing && (
            <div className="edit-controls">
              <button 
                className="save-button" 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button className="cancel-button" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          )}
        </div>
        <div className="entries-selector">
          <span>Show</span>
          <select
            className="entries-select"
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
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
        <table className="results-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedRows.size === (isEditing ? editedResults.length : results.length) && (isEditing ? editedResults.length : results.length) > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="row-checkbox"
                />
              </th>
              <th>STT</th>
              <th>Content</th>
              <th>Type</th>
              <th>Database</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {paginatedResults.map((item, index) => {
              const globalIndex = (currentPage - 1) * entriesPerPage + index + 1;
              return (
                <tr key={item.id} className={`result-row ${isEditing ? 'editing' : ''}`}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item.id)}
                      onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                      className="row-checkbox"
                    />
                  </td>
                  <td className="row-number">{globalIndex}</td>
                  <td className="content-cell">
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.content}
                        onChange={(e) => handleFieldChange(item.id, 'content', e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      item.content
                    )}
                  </td>
                  <td className="type-cell">
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.type}
                        onChange={(e) => handleFieldChange(item.id, 'type', e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      <span className={`type-badge type-${item.type.toLowerCase()}`}>
                        {item.type}
                      </span>
                    )}
                  </td>
                  <td className="database-cell">
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.database}
                        onChange={(e) => handleFieldChange(item.id, 'database', e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      item.database
                    )}
                  </td>
                  <td className="description-cell">
                    {isEditing ? (
                      <textarea
                        value={item.description}
                        onChange={(e) => handleFieldChange(item.id, 'description', e.target.value)}
                        className="edit-input"
                        rows={3}
                      />
                    ) : (
                      <div className="description-text">
                        {formatDescription(item.description)}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination-container">
        <div className="entries-info">
          <span>Show</span>
          <select
            className="entries-select-bottom"
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
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
          Showing {startEntry} to {endEntry} of {totalEntries} entries
        </div>
        <div className="pagination-controls">
          <button
            className="pagination-button"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
