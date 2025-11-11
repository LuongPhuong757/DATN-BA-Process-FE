import React, { useState } from 'react';
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
      <div className="result-header">
        <div className="header-icon">🔍</div>
        <div className="header-content">
          <h2>AI Analysis Results</h2>
          <p>Found {results.length} text element{results.length !== 1 ? 's' : ''} in your image</p>
        </div>
      </div>
      <div className="results-container">
        <div className="results-header">
          <span className="results-count">
            Found {results.length} item{results.length !== 1 ? 's' : ''}
          </span>
          <div className="action-buttons">
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
        </div>
        
        <div className="table-container">
          <table className="results-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Content</th>
                <th>Type</th>
                <th>Database</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {(isEditing ? editedResults : results).map((item) => (
                <tr key={item.id} className={`result-row ${isEditing ? 'editing' : ''}`}>
                  <td className="row-number">{item.id}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
