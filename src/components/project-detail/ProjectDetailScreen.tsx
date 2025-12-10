import React, { useState, useEffect } from 'react';
import TableView, { ProcessedItem } from '../shared/TableView';
import { Project } from '../shared/ProjectList';
import chatGPTService from '../../services/chatgptService';
import { API_CONFIG } from '../../config/api';
import './ProjectDetailScreen.css';

interface ProjectDetailScreenProps {
  selectedProject: Project | null;
  onProjectUpdate?: (updatedProject: Project) => void;
}

const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({
  selectedProject,
  onProjectUpdate
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>('');

  // Sync urlSheet from selectedProject
  useEffect(() => {
    if (selectedProject?.urlSheet) {
      setGoogleSheetUrl(selectedProject.urlSheet);
    } else {
      setGoogleSheetUrl('');
    }
  }, [selectedProject]);

  const handleSave = async (updatedItems: ProcessedItem[]) => {
    if (!selectedProject) return;
    
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      console.log('Saving updated items:', updatedItems);
      
      // Sử dụng chatgptService để update project detail với đúng API
      const result = await chatGPTService.updateProjectDetail(selectedProject.id, updatedItems);
      
      if (result.success) {
        setSaveMessage(result.message);
        console.log('Save successful:', result.message);
        
        // Gọi lại getProject để lấy dữ liệu mới nhất
        try {
          const updatedProject = await chatGPTService.getProject(selectedProject.id);
          if (updatedProject && onProjectUpdate) {
            onProjectUpdate(updatedProject);
            console.log('Project data refreshed:', updatedProject);
          }
        } catch (refreshError) {
          console.error('Error refreshing project data:', refreshError);
          // Không throw error ở đây để không làm gián đoạn flow thành công
        }
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setSaveMessage('');
        }, 3000);
      } else {
        throw new Error(result.message);
      }
      
    } catch (error) {
      console.error('Error updating project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSaveMessage(`Lỗi: ${errorMessage}`);
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setSaveMessage('');
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const exportToCSV = () => {
    if (!selectedProject || !selectedProject.processedItems) {
      return;
    }

    const items = selectedProject.processedItems;
    
    // Helper function to format required value
    const formatRequired = (required: boolean | null | undefined): string => {
      if (required === true) return 'Có';
      if (required === false) return 'Không';
      if (required === null) return 'Không xác định';
      return '';
    };
    
    // Define CSV headers (excluding ID fields and DB Field)
    const headers = [
      'STT',
      'Tên item',
      'Type',
      'Data Type',
      'Input/Output',
      'Data Source',
      'Required',
      'Mô tả'
    ];

    // Convert data to CSV format (excluding ID fields)
    const csvContent = [
      headers.join(','),
      ...items.map((item, index) => [
        index + 1,
        `"${item.content.replace(/"/g, '""')}"`, // Escape quotes in content
        `"${item.type}"`,
        `"${(item as any).dataType || ''}"`,
        `"${(item as any).io || 'Output'}"`,
        `"${item.database || '-'}"`,
        `"${formatRequired((item as any).required)}"`,
        `"${item.description.replace(/"/g, '""')}"` // Escape quotes in description
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `project_${selectedProject.id}_export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToGoogleSheet = async () => {
    if (!selectedProject || !selectedProject.processedItems) {
      return;
    }

    const items = selectedProject.processedItems;
    
    // Helper function to format required value
    const formatRequired = (required: boolean | null | undefined): string => {
      if (required === undefined) return 'không';
      if (required === true) return 'Có';
      if (required === false) return 'Không';
      if (required === null) return 'Không xác định';
      return '';
    };
    
    // Define headers (excluding DB Field)
    const headers = [
      'STT',
      'Tên item',
      'Type',
      'Data Type',
      'Input/Output',
      'Data Source',
      'Required',
      'Mô tả'
    ];

    // Prepare data for Google Sheet
    const sheetData = [
      headers,
      ...items.map((item, index) => [
        index + 1,
        item.content,
        item.type,
        (item as any).dataType || '',
        (item as any).io || 'Output',
        item.database || '-',
        formatRequired((item as any).required),
        item.description
      ])
    ];

    // Prepare JSON data for NestJS export endpoint
    const exportData = {
      title: selectedProject.title || `Project ${selectedProject.id}`,
      data: sheetData
    };

    try {
      setIsSaving(true);
      setSaveMessage('Đang tạo Google Sheet...');
      setGoogleSheetUrl('');
      
      // Call NestJS export endpoint
      const response = await fetch(`${API_CONFIG.BASE_URL}/google-sheet/oauth/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData)
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.url) {
        setGoogleSheetUrl(result.url);
        
        // Ensure login status is saved
        localStorage.setItem('google_sheet_logged_in', 'true');
        
        // Update project with urlSheet and all data like normal edit
        try {
          // Prepare payload giống với updateProjectDetail format
          const updatePayload = {
            results: items.map(item => ({
              content: item.content,
              type: item.type,
              database: item.database,
              description: item.description,
              imageProcessingResultId: item.imageProcessingResultId || 0,
              dataType: (item as any).dataType || 'string',
              dbField: (item as any).dbField || '',
              io: (item as any).io || 'Output',
              required: (item as any).required !== undefined ? (item as any).required : false
            })),
            timestamp: new Date().toISOString(),
            source: 'image-processor-export',
            title: selectedProject.title || `Project ${selectedProject.id}`,
            body: `Exported ${items.length} items to Google Sheet`,
            urlSheet: result.url
          };

          const updateResponse = await fetch(`${API_CONFIG.BASE_URL}/posts/${selectedProject.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatePayload)
          });

          if (!updateResponse.ok) {
            console.error('Failed to update project with urlSheet:', updateResponse.status);
            // Don't throw error here, just log it
          } else {
            const updatedProject = await updateResponse.json();
            // Update local project state if callback is provided
            if (updatedProject && onProjectUpdate) {
              onProjectUpdate(updatedProject);
            }
          }
        } catch (updateError) {
          console.error('Error updating project with urlSheet:', updateError);
          // Don't throw error here, just log it - sheet was created successfully
        }
        
        setSaveMessage('Đã tạo Google Sheet thành công!');
        
        setTimeout(() => {
          setSaveMessage('');
        }, 3000);
      } else {
        throw new Error(result.message || 'Không nhận được URL từ server');
      }
    } catch (error) {
      console.error('Error creating Google Sheet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSaveMessage(`Lỗi: ${errorMessage}`);
      
      // If export fails, remove login status from localStorage to show login button again
      localStorage.removeItem('google_sheet_logged_in');
      
      // Trigger storage event to update Sidebar
      window.dispatchEvent(new Event('storage'));
      
      setTimeout(() => {
        setSaveMessage('');
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };


  if (!selectedProject) {
    return (
      <div className="project-detail-container">
        <div className="empty-project">
          <p>No project selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-detail-container">
      <div className="result-page-header">
        <h1 className="page-title">{selectedProject.title}</h1>
        <div className="breadcrumbs">
          <span className="breadcrumb-icon">🏠</span>
          <span className="breadcrumb-separator">›</span>
          <span>Tools</span>
          <span className="breadcrumb-separator">›</span>
          <span>History</span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-active">Project Detail</span>
        </div>
      </div>

      <div className="results-actions">
        <div className="results-actions-left">
          <button 
            className="csv-export-button"
            onClick={exportToCSV}
            disabled={!selectedProject.processedItems || selectedProject.processedItems.length === 0}
          >
            CSV export
          </button>
          <button 
            className="gg-sheet-button"
            onClick={exportToGoogleSheet}
            disabled={!selectedProject.processedItems || selectedProject.processedItems.length === 0 || isSaving}
          >
            Export Sheet
          </button>
        </div>
      </div>

      {/* Google Sheet URL Display */}
      {(googleSheetUrl || selectedProject.urlSheet) && (
        <div className="google-sheet-url-container">
          <p className="google-sheet-label">Google Sheet URL:</p>
          <a 
            href={googleSheetUrl || selectedProject.urlSheet} 
            target="_blank" 
            rel="noopener noreferrer"
            className="google-sheet-link"
          >
            {googleSheetUrl || selectedProject.urlSheet}
          </a>
        </div>
      )}

      {/* Image Display */}
      {selectedProject.imageUrl && (
        <div className="project-image-container">
          {/* <div className="project-image-header">
            {/* <h3>Original Image</h3> */}
          {/* </div> */}
          <div className="project-image-wrapper">
            <img 
              src={`${API_CONFIG.BASE_URL}${selectedProject.imageUrl}`}
              alt="Original uploaded file"
              className="project-image"
              onError={(e) => {
                console.error('Error loading image:', selectedProject.imageUrl);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      {/* Save Message Display */}
      {saveMessage && (
        <div className={`save-message ${saveMessage.includes('Lỗi') ? 'error' : 'success'}`}>
          {saveMessage}
        </div>
      )}
      
      {/* Loading Overlay */}
      {isSaving && (
        <div className="saving-overlay">
          <div className="saving-spinner"></div>
          <span>Đang lưu...</span>
        </div>
      )}

      <div className="table-container-wrapper">
        <TableView 
          items={(selectedProject.processedItems || []).map((item, index) => ({
            ...item,
            stt: item.stt !== undefined && item.stt !== null ? item.stt : index + 1
          }))}
          isLoading={false}
          isEditable={true}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default ProjectDetailScreen;
