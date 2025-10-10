import React from 'react';
import ImageUploader from './ImageUploader';
import ConnectionStatus from '../shared/ConnectionStatus';
import TableView from '../shared/TableView';
import MessageDisplay from '../shared/MessageDisplay';
import { ProcessedItem } from '../shared/ResultDisplay';

interface UploadScreenProps {
  isProcessing: boolean;
  results: ProcessedItem[];
  isConnected: boolean;
  errorMessage: string;
  saveMessage: string;
  dbMessage: string;
  onImageUpload: (file: File) => Promise<void>;
  onConnectionChange: (connected: boolean) => void;
  onSaveResults: (updatedResults: ProcessedItem[]) => Promise<void>;
  onSaveToDB: (results: ProcessedItem[]) => Promise<void>;
  onClearMessages: () => void;
}

const UploadScreen: React.FC<UploadScreenProps> = ({
  isProcessing,
  results,
  isConnected,
  errorMessage,
  saveMessage,
  dbMessage,
  onImageUpload,
  onConnectionChange,
  onSaveResults,
  onSaveToDB,
  onClearMessages
}) => {
  return (
    <div className="app-container">
      <div className="left-panel">
        <ConnectionStatus onConnectionChange={onConnectionChange} />
        <ImageUploader 
          onImageUpload={onImageUpload}
          isProcessing={isProcessing}
          isConnected={isConnected}
        />
        <MessageDisplay 
          errorMessage={errorMessage}
          saveMessage={saveMessage}
          dbMessage={dbMessage}
        />
      </div>
      
      <div className="right-panel">
        {isProcessing ? (
          <div className="processing-container">
            <div className="processing-header">
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
        ) : dbMessage ? (
          <div className="success-container">
            <div className="success-header">
              <div className="header-icon">💾</div>
              <div className="header-content">
                <h2>Database Save Successful!</h2>
                <p>Your results have been saved to database</p>
              </div>
            </div>
            <div className="success-content">
              <div className="success-icon">🎉</div>
              <div className="success-text">
                <h4>Saved to Database!</h4>
                <p>{dbMessage}</p>
              </div>
              <div className="success-actions">
                <button 
                  className="upload-new-button"
                  onClick={onClearMessages}
                >
                  📤 Upload New Image
                </button>
              </div>
            </div>
          </div>
        ) : results.length > 0 ? (
          <TableView 
            items={results.map(item => ({
              id: item.id,
              itemId: item.id,
              content: item.content,
              type: item.type,
              database: item.database,
              description: item.description,
              imageProcessingResultId: 0,
              dataType: item.dataType,
              dbField: item.dbField
            }))}
            isLoading={false}
            isEditable={true}
            onSave={onSaveResults}
            onSaveToDB={onSaveToDB}
          />
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default UploadScreen;
