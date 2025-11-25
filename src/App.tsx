import React, { useState, useEffect } from 'react';
import './App.css';
import UploadScreen from './components/upload/UploadScreen';
import ProjectsScreen from './components/projects/ProjectsScreen';
import ProjectDetailScreen from './components/project-detail/ProjectDetailScreen';
import ProjectManagementScreen from './components/project-management/ProjectManagementScreen';
import Sidebar from './components/shared/Sidebar';
import ErrorModal from './components/shared/ErrorModal';
import { ProcessedItem, ProcessedItemWithoutId } from './components/shared/ResultDisplay';
import { Project } from './components/shared/ProjectList';
import chatGPTService from './services/chatgptService';

const GOOGLE_LOGIN_STORAGE_KEY = 'google_sheet_logged_in';

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessedItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [dbMessage, setDbMessage] = useState<string>('');
  const [currentView, setCurrentView] = useState<'upload' | 'projects' | 'project-detail' | 'project-management'>('upload');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorModalData, setErrorModalData] = useState<{
    message: string;
    details?: {
      status?: number;
      statusText?: string;
      type?: string;
      code?: string;
      param?: string;
      rawResponse?: string;
    };
  } | null>(null);

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const pathname = window.location.pathname;

      // Check if this is OAuth success callback
      if (pathname.includes('/oauth/success') && success === 'true') {
        // Save to localStorage
        localStorage.setItem(GOOGLE_LOGIN_STORAGE_KEY, 'true');
        
        // Trigger storage event to update Sidebar immediately
        window.dispatchEvent(new Event('storage'));
        
        // Clear URL params and redirect to home
        window.history.replaceState({}, document.title, '/');
        setCurrentView('upload');
      }
    };

    handleOAuthCallback();
  }, []);

  const handleImageUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setResults([]);
      setErrorMessage('');
      
      // Process image with ChatGPT
      const processedResults = await chatGPTService.processImage(file);
      console.log('processedResults', processedResults);
      setResults(processedResults);
    } catch (error) {
      console.error('Error processing image:', error);
      
      // Get error message for display
      let errorMsg = 'Đã xảy ra lỗi khi xử lý ảnh. Vui lòng thử lại.';
      let errorDetails: {
        status?: number;
        statusText?: string;
        type?: string;
        code?: string;
        param?: string;
        rawResponse?: string;
      } = {};
      
      if (error instanceof Error) {
        errorMsg = error.message;
        
        // Get additional error details if available
        const errorDetailsObj = (error as any).details;
        const errorStatus = (error as any).status;
        const errorStatusText = (error as any).statusText;
        
        if (errorStatus) {
          errorDetails.status = errorStatus;
        }
        if (errorStatusText) {
          errorDetails.statusText = errorStatusText;
        }
        if (errorDetailsObj) {
          if (errorDetailsObj.error) {
            const apiError = errorDetailsObj.error;
            if (apiError.type) {
              errorDetails.type = apiError.type;
            }
            if (apiError.code) {
              errorDetails.code = apiError.code;
            }
            if (apiError.param) {
              errorDetails.param = apiError.param;
            }
          }
          if (errorDetailsObj.rawResponse) {
            errorDetails.rawResponse = errorDetailsObj.rawResponse;
          }
        }
        
        // Show error modal
        setErrorModalData({
          message: errorMsg,
          details: Object.keys(errorDetails).length > 0 ? errorDetails : undefined
        });
        setIsErrorModalOpen(true);
        
        // Also set error message for UI display
        setErrorMessage(errorMsg);
      } else {
        errorMsg = 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
        setErrorModalData({
          message: errorMsg
        });
        setIsErrorModalOpen(true);
        setErrorMessage(errorMsg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNavigate = (view: 'upload' | 'projects' | 'project-management') => {
    setCurrentView(view);
    if (view === 'upload') {
      setSelectedProject(null);
    }
  };

  const handleSaveResults = async (updatedResults: ProcessedItem[]) => {
    try {
      setSaveMessage('');
      // Just update local state without calling API
      setResults(updatedResults);
      setSaveMessage('Results updated successfully!');
      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error updating results:', error);
      setSaveMessage('Failed to update results. Please try again.');
    }
  };

  const handleSaveToDB = async (results: ProcessedItemWithoutId[], screenId: number, imageUrl: string) => {
    try {
      setDbMessage('');
      const response = await chatGPTService.saveToDatabase(results, screenId, imageUrl);
      
      if (response.success) {
        setDbMessage(response.message);
        setResults([]); // Clear results to show success message
        // Clear success message after 5 seconds
        setTimeout(() => setDbMessage(''), 5000);
      } else {
        setDbMessage(`Error: ${response.message}`);
      }
    } catch (error) {
      console.error('Error saving to database:', error);
      let errorMsg = 'Failed to save to database. Please try again.';
      
      if (error instanceof Error) {
        errorMsg = `Error: Failed to save to database: ${error.message}`;
      }
      
      setDbMessage(errorMsg);
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('project-detail');
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setSelectedProject(updatedProject);
  };

  const handleClearMessages = () => {
    setDbMessage('');
    setResults([]);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'projects':
        return (
          <ProjectsScreen 
            onBackToUpload={() => handleNavigate('upload')}
            onViewProject={handleViewProject}
          />
        );
      
      case 'project-management':
        return (
          <ProjectManagementScreen 
            onBackToUpload={() => handleNavigate('upload')}
          />
        );
      
      case 'project-detail':
        return (
          <ProjectDetailScreen 
            selectedProject={selectedProject}
            onProjectUpdate={handleProjectUpdate}
          />
        );
      
      default:
        return (
          <UploadScreen
            isProcessing={isProcessing}
            results={results}
            isConnected={isConnected}
            errorMessage={errorMessage}
            saveMessage={saveMessage}
            dbMessage={dbMessage}
            onImageUpload={handleImageUpload}
            onConnectionChange={setIsConnected}
            onSaveResults={handleSaveResults}
            onSaveToDB={handleSaveToDB}
            onClearMessages={handleClearMessages}
          />
        );
    }
  };

  return (
    <div className="App">
      <Sidebar 
        currentView={currentView}
        onNavigate={handleNavigate}
      />
      
      <main className="App-main">
        {renderCurrentView()}
      </main>
      
      {errorModalData && (
        <ErrorModal
          isOpen={isErrorModalOpen}
          errorMessage={errorModalData.message}
          errorDetails={errorModalData.details}
          onClose={() => {
            setIsErrorModalOpen(false);
            setErrorModalData(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
