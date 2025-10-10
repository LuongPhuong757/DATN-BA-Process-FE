import React, { useState } from 'react';
import './TableView.css';

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

interface TableViewProps {
  items: ProcessedItem[];
  isLoading?: boolean;
  isEditable?: boolean;
  onSave?: (updatedItems: ProcessedItem[]) => void;
  onSaveToDB?: (items: ProcessedItem[]) => void;
}

const TableView: React.FC<TableViewProps> = ({ 
  items, 
  isLoading = false, 
  isEditable = false, 
  onSave, 
  onSaveToDB
}) => {
  const [sortField, setSortField] = useState<keyof ProcessedItem>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<ProcessedItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingToDB, setIsSavingToDB] = useState(false);

  // Get unique types for filter
  const uniqueTypes = Array.from(new Set(items.map(item => item.type)));

  // Handle edit functions
  const handleEdit = () => {
    setEditedItems([...items]);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedItems([]);
  };

  const handleFieldChange = (id: number, field: keyof ProcessedItem, value: string) => {
    setEditedItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(editedItems);
      setIsEditing(false);
      setEditedItems([]);
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
      await onSaveToDB(items);
    } catch (error) {
      console.error('Error saving to database:', error);
    } finally {
      setIsSavingToDB(false);
    }
  };

  // Filter and sort items
  const currentItems = isEditing ? editedItems : items;
  const filteredAndSortedItems = currentItems
    .filter(item => {
      const matchesType = filterType === 'all' || item.type === filterType;
      const matchesSearch = searchTerm === '' || 
        item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

  const handleSort = (field: keyof ProcessedItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
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

  const getDataTypeColor = (dataType: string) => {
    switch (dataType.toLowerCase()) {
      case 'string': return '#2196F3';
      case 'number': return '#4CAF50';
      case 'boolean': return '#FF9800';
      case 'date': return '#9C27B0';
      case 'email': return '#F44336';
      case 'phone': return '#607D8B';
      case 'url': return '#795548';
      case 'json': return '#E91E63';
      default: return '#9E9E9E';
    }
  };

  const getSortIcon = (field: keyof ProcessedItem) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (isLoading) {
    return (
      <div className="table-loading">
        <div className="loading-spinner"></div>
        <p>Loading project details...</p>
      </div>
    );
  }

  return (
    <div className="table-view-container">
      {/* Table Controls */}
      <div className="table-controls">
        <div className="search-section">
          <div className="search-input-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search content or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
        <div className="filter-section">
          <label className="filter-label">Filter by type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div className="results-info">
          <span className="results-count">
            {filteredAndSortedItems.length} of {items.length} items
          </span>
        </div>
        
        {isEditable && (
          <div className="action-buttons">
            {!isEditing ? (
              <>
                <button 
                  className="edit-button"
                  onClick={handleEdit}
                >
                  ✏️ Edit
                </button>
                {onSaveToDB && (
                  <button 
                    className="save-db-button"
                    onClick={handleSaveToDB}
                    disabled={isSavingToDB}
                  >
                    {isSavingToDB ? '⏳' : '💾'} Save to DB
                  </button>
                )}
              </>
            ) : (
              <>
                <button 
                  className="save-button"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? '⏳' : '✅'} Save
                </button>
                <button 
                  className="cancel-button"
                  onClick={handleCancel}
                >
                  ❌ Cancel
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th 
                className="sortable"
                onClick={() => handleSort('id')}
              >
                ID {getSortIcon('id')}
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('type')}
              >
                Type {getSortIcon('type')}
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('content')}
              >
                Content {getSortIcon('content')}
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('description')}
              >
                Description {getSortIcon('description')}
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('database')}
              >
                Database {getSortIcon('database')}
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('dataType')}
              >
                Data Type {getSortIcon('dataType')}
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('dbField')}
              >
                DB Field {getSortIcon('dbField')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedItems.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? 'even' : 'odd'}>
                <td className="id-cell">
                  <span className="id-badge">#{item.id}</span>
                </td>
                <td className="type-cell">
                  <span 
                    className="type-badge"
                    style={{ backgroundColor: getTypeColor(item.type) }}
                  >
                    {item.type}
                  </span>
                </td>
                <td className="content-cell">
                  {isEditing ? (
                    <input
                      type="text"
                      value={item.content}
                      onChange={(e) => handleFieldChange(item.id, 'content', e.target.value)}
                      className="edit-input"
                    />
                  ) : (
                    <div className="content-text" title={item.content}>
                      {item.content}
                    </div>
                  )}
                </td>
                <td className="description-cell">
                  {isEditing ? (
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleFieldChange(item.id, 'description', e.target.value)}
                      className="edit-input"
                    />
                  ) : (
                    <div className="description-text" title={item.description}>
                      {item.description}
                    </div>
                  )}
                </td>
                <td className="database-cell">
                  <span className="database-badge">
                    {item.database}
                  </span>
                </td>
                <td className="datatype-cell">
                  <span className="datatype-badge" style={{ backgroundColor: getDataTypeColor(item.dataType || 'string') }}>
                    {item.dataType || 'string'}
                  </span>
                </td>
                <td className="dbfield-cell">
                  <span className="dbfield-text" title={item.dbField}>
                    {item.dbField || 'content_field'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredAndSortedItems.length === 0 && (
        <div className="table-empty">
          <div className="empty-icon">📋</div>
          <h3>No items found</h3>
          <p>
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'No processed items available for this project'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default TableView;
