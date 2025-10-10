import React, { useState } from 'react';
import './App.css';
import UploadScreen from './components/upload/UploadScreen';
import ProjectsScreen from './components/projects/ProjectsScreen';
import ProjectDetailScreen from './components/project-detail/ProjectDetailScreen';
import Navigation from './components/shared/Navigation';
import { ProcessedItem } from './components/shared/ResultDisplay';
import { Project } from './components/shared/ProjectList';
import chatGPTService from './services/chatgptService';

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessedItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [dbMessage, setDbMessage] = useState<string>('');
  const [currentView, setCurrentView] = useState<'upload' | 'projects' | 'project-detail'>('upload');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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
      
      // Set user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('Rate limit exceeded')) {
          setErrorMessage('Rate limit exceeded. Please wait a moment before trying again.');
        } else if (error.message.includes('Invalid API key')) {
          setErrorMessage('API key issue. Please check your OpenAI API key configuration.');
        } else if (error.message.includes('Payment required')) {
          setErrorMessage('Billing issue. Please check your OpenAI account billing.');
        } else if (error.message.includes('Model or endpoint not found')) {
          setErrorMessage('Model not found. Please check your OpenAI API configuration.');
        } else {
          setErrorMessage('Failed to process image. Please try again.');
        }
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNavigate = (view: 'upload' | 'projects') => {
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

  const handleSaveToDB = async (results: ProcessedItem[]) => {
    try {
      setDbMessage('');
      const response = await chatGPTService.saveToDatabase(results);
      
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
      setDbMessage('Failed to save to database. Please try again.');
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('project-detail');
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
      
      case 'project-detail':
        return (
          <ProjectDetailScreen 
            selectedProject={selectedProject}
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
      <Navigation 
        currentView={currentView}
        onNavigate={handleNavigate}
        projectTitle={selectedProject?.title}
      />
      
      <main className="App-main">
        {renderCurrentView()}
      </main>
      
      <footer className="App-footer">
        <p>Powered by OpenAI ChatGPT Vision API</p>
      </footer>
    </div>
  );
}

export default App;
