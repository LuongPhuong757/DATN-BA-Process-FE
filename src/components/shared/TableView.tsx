import React, { useState, useRef, useEffect } from 'react';
import './TableView.css';

// Simple Dropdown Component with slide down animation
interface SimpleDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  getTypeColor: (type: string) => string;
}

const SimpleDropdown: React.FC<SimpleDropdownProps> = ({ 
  value, 
  onChange, 
  options, 
  getTypeColor 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown - only when open
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  // Find the label for the current value
  const currentOption = options.find(opt => opt.value === value);
  const displayLabel = currentOption ? currentOption.label : value;

  return (
    <div className={`simple-dropdown ${isOpen ? 'dropdown-open' : ''}`} ref={dropdownRef}>
      <div 
        className="dropdown-trigger"
        onClick={handleToggle}
        style={{ backgroundColor: getTypeColor(value) }}
      >
        <span>{displayLabel}</span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </div>
      
      <div className={`dropdown-menu ${isOpen ? 'open' : ''}`}>
        {options.map((option) => (
          <div
            key={option.value}
            className={`dropdown-option ${value === option.value ? 'selected' : ''}`}
            onClick={() => handleSelect(option.value)}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export interface ProcessedItem {
  id: number;
  itemId: number;
  content: string;
  type: string;
  database: string | null;
  description: string;
  imageProcessingResultId: number;
  dataType?: string;
  dbField?: string;
  io?: string;
  required?: boolean | null;
  stt?: number;
}

export interface ProcessedItemWithoutId {
  content: string;
  type: string;
  database: string | null;
  description: string;
  imageProcessingResultId: number;
  dataType?: string;
  dbField?: string;
  io?: string;
  required?: boolean | null;
}

interface TableViewProps {
  items: ProcessedItem[];
  isLoading?: boolean;
  isEditable?: boolean;
  onSave?: (updatedItems: ProcessedItem[]) => void;
  onSaveToDB?: (items: ProcessedItemWithoutId[]) => void;
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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<ProcessedItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingToDB, setIsSavingToDB] = useState(false);

  // Type options for dropdown
  const typeOptions = [
    { value: 'Label', label: 'Label' },
    { value: 'Textbox', label: 'Textbox' },
    { value: 'Number', label: 'Number' },
    { value: 'Dropdown', label: 'Dropdown' },
    { value: 'Icon', label: 'Icon' },
    { value: 'Button', label: 'Button' },
    { value: 'Image', label: 'Image' },
    { value: 'Toggle', label: 'Toggle' },
    { value: 'Radio button', label: 'Radio button' },
    { value: 'Hyperlink', label: 'Hyperlink' },
  ];

  // Data type options for dropdown
  const dataTypeOptions = [
    { value: 'string', label: 'String' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'url', label: 'URL' },
    { value: 'date', label: 'Date' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'json', label: 'JSON' }
  ];

  // IO options for dropdown
  const ioOptions = [
    { value: 'Input', label: 'Input' },
    { value: 'Output', label: 'Output' },
    { value: 'Action', label: 'Action' }
  ];

  // Required options for dropdown (using string values for dropdown, convert to boolean/null)
  const requiredOptions = [
    { value: 'true', label: '✓ Bắt buộc' },
    { value: 'false', label: '✗ Không bắt buộc' },
    { value: 'null', label: '∆ Tùy điều kiện' }
  ];

  // Helper function to convert required value to string for dropdown
  const requiredToString = (value: boolean | null | undefined): string => {
    if (value === true) return 'true';
    if (value === false) return 'false';
    return 'null';
  };

  // Helper function to convert string to required value
  const stringToRequired = (value: string): boolean | null => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  };

  // Helper function to render required icon
  const renderRequiredIcon = (required: boolean | null | undefined) => {
    if (required === true) {
      return <span className="required-icon required-true" title="Bắt buộc">✓</span>;
    }
    if (required === false) {
      return <span className="required-icon required-false" title="Không bắt buộc">✗</span>;
    }
    return <span className="required-icon required-conditional" title="Tùy điều kiện">∆</span>;
  };

  // Handle edit functions
  const handleEdit = () => {
    setEditedItems([...items]);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedItems([]);
  };

  const handleFieldChange = (id: number, field: keyof ProcessedItem, value: string | boolean | null) => {
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
      // Remove id and itemId fields from items before sending to database
      const itemsWithoutId = items.map(({ id, itemId, ...item }) => item);
      await onSaveToDB(itemsWithoutId);
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
      const matchesSearch = searchTerm === '' || 
        item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
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
      case 'label':
        return '#2196F3';
      case 'textbox':
        return '#42A5F5';
      case 'button':
        return '#4CAF50';
      case 'icon':
        return '#FF9800';
      case 'dropdown':
        return '#9C27B0';
      case 'image':
        return '#E91E63';
      case 'toggle':
        return '#00BCD4';
      case 'radio button':
        return '#FF5722';
      case 'hyperlink':
        return '#795548';
      case 'number':
        return '#009688';
      default:
        return '#607D8B';
    }
  };

  const getIOColor = (io: string) => {
    switch (io?.toLowerCase()) {
      case 'input':
        return '#4CAF50';
      case 'output':
        return '#2196F3';
      case 'action':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  // const getDataTypeColor = (dataType: string) => {
  //   switch (dataType.toLowerCase()) {
  //     case 'string': return '#2196F3';
  //     case 'number': return '#4CAF50';
  //     case 'boolean': return '#FF9800';
  //     case 'date': return '#9C27B0';
  //     case 'email': return '#F44336';
  //     case 'phone': return '#607D8B';
  //     case 'url': return '#795548';
  //     case 'json': return '#E91E63';
  //     default: return '#9E9E9E';
  //   }
  // };

  const getSortIcon = (field: keyof ProcessedItem) => {
    const isActive = sortField === field;
    const isDesc = isActive && sortDirection === 'desc';
    return <span className={`sort-icon ${isDesc ? 'rotated' : ''}`}>▼</span>;
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

  const formatType = (type: string) => {
    if (!type) return '';
    // Fix common typos
    const fixedType = type.toLowerCase().replace('botton', 'button');
    // Find matching option
    const option = typeOptions.find(opt => opt.value.toLowerCase() === fixedType);
    if (option) {
      return option.label;
    }
    // If no match, capitalize first letter
    return fixedType.charAt(0).toUpperCase() + fixedType.slice(1);
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
        <table className={`data-table ${isEditing ? 'editing' : ''}`}>
          <thead>
            <tr>
              <th 
                className="sortable"
                onClick={() => handleSort('id')}
              >
                STT {getSortIcon('id')}
              </th>
              <th>
                Type
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('content')}
              >
                Tên item {getSortIcon('content')}
              </th>
              <th>
                Data Type
              </th>
              <th>
                Input/Output
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('database')}
              >
                Data Source {getSortIcon('database')}
              </th>
              <th>
                Required
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('description')}
              >
                Mô tả {getSortIcon('description')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedItems.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? 'even' : 'odd'}>
                <td className="stt-cell">{item.stt !== undefined ? item.stt : item.id}</td>
                <td className="type-cell">
                  {isEditing ? (
                    <SimpleDropdown
                      value={item.type}
                      onChange={(value) => handleFieldChange(item.id, 'type', value)}
                      options={typeOptions}
                      getTypeColor={getTypeColor}
                    />
                  ) : (
                    <span className="type-text">{formatType(item.type)}</span>
                  )}
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
                    <span className="content-text">{item.content}</span>
                  )}
                </td>
                <td className="datatype-cell">
                  {isEditing ? (
                    <SimpleDropdown
                      value={item.dataType || 'string'}
                      onChange={(value) => handleFieldChange(item.id, 'dataType', value)}
                      options={dataTypeOptions}
                      getTypeColor={(value) => '#2196F3'}
                    />
                  ) : (
                    <span className="datatype-text">{item.dataType || '-'}</span>
                  )}
                </td>
                <td className="io-cell">
                  {isEditing ? (
                    <SimpleDropdown
                      value={item.io || 'Output'}
                      onChange={(value) => handleFieldChange(item.id, 'io', value)}
                      options={ioOptions}
                      getTypeColor={getIOColor}
                    />
                  ) : (
                    <span 
                      className="io-text"
                      style={{ 
                        backgroundColor: getIOColor(item.io || ''),
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      {item.io || 'Output'}
                    </span>
                  )}
                </td>
                <td className="database-cell">
                  {isEditing ? (
                    <input
                      type="text"
                      value={item.database || '-'}
                      onChange={(e) => handleFieldChange(item.id, 'database', e.target.value === '-' ? null : e.target.value)}
                      className="edit-input"
                    />
                  ) : (
                    <span className="database-text">{item.database || '-'}</span>
                  )}
                </td>
                <td className="required-cell">
                  {isEditing ? (
                    <SimpleDropdown
                      value={requiredToString(item.required)}
                      onChange={(value) => handleFieldChange(item.id, 'required', stringToRequired(value))}
                      options={requiredOptions}
                      getTypeColor={(value) => {
                        if (value === 'true') return '#F44336';
                        if (value === 'null') return '#FF9800';
                        return '#9E9E9E';
                      }}
                    />
                  ) : (
                    renderRequiredIcon(item.required)
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
                    <span className="description-text">{formatDescription(item.description)}</span>
                  )}
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
            {searchTerm
              ? 'Try adjusting your search criteria'
              : 'No processed items available for this project'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default TableView;
