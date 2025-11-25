import React from 'react';
import './ErrorModal.css';

interface ErrorModalProps {
  isOpen: boolean;
  errorMessage: string;
  errorDetails?: {
    status?: number;
    statusText?: string;
    type?: string;
    code?: string;
    param?: string;
    rawResponse?: string;
  };
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  errorMessage,
  errorDetails,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="error-modal-overlay" onClick={onClose}>
      <div className="error-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="error-modal-header">
          <h2 className="error-modal-title">⚠️ Lỗi ChatGPT API</h2>
          <button className="error-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="error-modal-body">
          <div className="error-message-main">
            <p className="error-text">{errorMessage}</p>
          </div>
          
          {errorDetails && (
            <div className="error-details">
              {errorDetails.status && (
                <div className="error-detail-item">
                  <span className="error-detail-label">Status:</span>
                  <span className="error-detail-value">{errorDetails.status}</span>
                </div>
              )}
              
              {errorDetails.statusText && (
                <div className="error-detail-item">
                  <span className="error-detail-label">Status Text:</span>
                  <span className="error-detail-value">{errorDetails.statusText}</span>
                </div>
              )}
              
              {errorDetails.type && (
                <div className="error-detail-item">
                  <span className="error-detail-label">Error Type:</span>
                  <span className="error-detail-value">{errorDetails.type}</span>
                </div>
              )}
              
              {errorDetails.code && (
                <div className="error-detail-item">
                  <span className="error-detail-label">Error Code:</span>
                  <span className="error-detail-value">{errorDetails.code}</span>
                </div>
              )}
              
              {errorDetails.param && (
                <div className="error-detail-item">
                  <span className="error-detail-label">Parameter:</span>
                  <span className="error-detail-value">{errorDetails.param}</span>
                </div>
              )}
              
              {errorDetails.rawResponse && (
                <div className="error-detail-item error-detail-full">
                  <span className="error-detail-label">Raw Response:</span>
                  <pre className="error-detail-value error-raw-response">{errorDetails.rawResponse}</pre>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="error-modal-footer">
          <button className="error-modal-button" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;

