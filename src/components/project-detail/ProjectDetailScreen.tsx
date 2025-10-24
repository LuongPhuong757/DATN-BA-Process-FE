import React, { useState } from 'react';
import TableView, { ProcessedItem } from '../shared/TableView';
import { Project } from '../shared/ProjectList';
import chatGPTService from '../../services/chatgptService';
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
    
    // Define CSV headers (excluding ID fields)
    const headers = [
      'Content',
      'Type',
      'Database',
      'Description',
      'Data Type',
      'DB Field'
    ];

    // Convert data to CSV format (excluding ID fields)
    const csvContent = [
      headers.join(','),
      ...items.map(item => [
        `"${item.content.replace(/"/g, '""')}"`, // Escape quotes in content
        `"${item.type}"`,
        `"${item.database}"`,
        `"${item.description.replace(/"/g, '""')}"`, // Escape quotes in description
        `"${(item as any).dataType || ''}"`,
        `"${(item as any).dbField || ''}"`
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

  return (
    <div className="project-detail-container">
      {selectedProject && (
        <>
          <div className="project-detail-header">
            <div className="project-info">
              <h2 className="project-title">{selectedProject.title}</h2>
              <p className="project-description">{selectedProject.body}</p>
              <div className="project-stats">
                <span className="stat-item">
                  📊 {selectedProject.processedItems.length} items
                </span>
                <span className="stat-item">
                  📅 {new Date(selectedProject.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="project-actions">
              <button 
                className="export-csv-button"
                onClick={exportToCSV}
                disabled={!selectedProject.processedItems || selectedProject.processedItems.length === 0}
              >
                📥 Export CSV
              </button>
            </div>
          </div>
          
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
          
          <TableView 
            items={selectedProject.processedItems}
            isLoading={false}
            isEditable={true}
            onSave={handleSave}
          />
        </>
      )}
    </div>
  );
};

export default ProjectDetailScreen;
