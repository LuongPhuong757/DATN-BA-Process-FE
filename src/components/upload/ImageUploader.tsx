import React, { useState, useRef } from 'react';
import './ImageUploader.css';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  isProcessing: boolean;
  isConnected?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, isProcessing, isConnected = true }) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onImageUpload(file);
    } else {
      alert('Please upload an image file');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="image-uploader">
      <div className="uploader-header">
        <div className="header-icon">🖼️</div>
        <div className="header-content">
          <h2>AI Image Analysis</h2>
          <p>Upload an image to extract text content using ChatGPT Vision API</p>
        </div>
      </div>
      
      {!isConnected && (
        <div className="connection-warning">
          <span className="warning-icon">⚠️</span>
          <span>ChatGPT API is not connected. Image processing will use mock data.</span>
        </div>
      )}
      
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        
        {previewUrl ? (
          <div className="image-preview">
            <img src={previewUrl} alt="Preview" />
            {isProcessing && (
              <div className="processing-overlay">
                <div className="processing-content">
                  <div className="processing-spinner"></div>
                  <span>AI is analyzing your image...</span>
                </div>
              </div>
            )}
            <div className="preview-actions">
              <button 
                className="change-image-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                📷 Change Image
              </button>
            </div>
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon-container">
              <div className="upload-icon">📁</div>
              <div className="upload-icon-secondary">✨</div>
            </div>
            <div className="upload-text">
              <h3>Drop your image here</h3>
              <p>or click to browse files</p>
            </div>
            <div className="upload-hints">
              <div className="hint-item">
                <span className="hint-icon">📸</span>
                <span>JPG, PNG, GIF, WebP</span>
              </div>
              <div className="hint-item">
                <span className="hint-icon">🔍</span>
                <span>AI Text Extraction</span>
              </div>
              <div className="hint-item">
                <span className="hint-icon">⚡</span>
                <span>Fast Processing</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {isProcessing && (
        <div className="processing-status">
          <div className="status-content">
            <div className="spinner"></div>
            <div className="status-text">
              <h4>Processing with AI...</h4>
              <p>Extracting text content from your image</p>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
