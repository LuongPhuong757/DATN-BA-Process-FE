import React, { useState, useEffect } from 'react';
import './ConnectionStatus.css';
import chatGPTService from '../../services/chatgptService';

interface ConnectionStatusProps {
  onConnectionChange: (isConnected: boolean) => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ onConnectionChange }) => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [message, setMessage] = useState('Checking connection...');
  const [isRetrying, setIsRetrying] = useState(false);

  const checkConnection = async () => {
    try {
      setStatus('checking');
      setMessage('Checking connection...');
      
      const result = await chatGPTService.testConnection();
      
      if (result.success) {
        setStatus('connected');
        setMessage(result.message);
        onConnectionChange(true);
      } else {
        setStatus('disconnected');
        setMessage(result.message);
        onConnectionChange(false);
      }
    } catch (error) {
      setStatus('disconnected');
      setMessage('Failed to check connection');
      onConnectionChange(false);
    }
  };

  const retryConnection = async () => {
    setIsRetrying(true);
    await checkConnection();
    setIsRetrying(false);
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className={`connection-status ${status}`}>
      <div className="status-indicator">
        {status === 'checking' && <div className="spinner"></div>}
        {status === 'connected' && <span className="status-icon">✅</span>}
        {status === 'disconnected' && <span className="status-icon">❌</span>}
      </div>
      
      <div className="status-content">
        <span className="status-text">
          {status === 'checking' && 'Checking ChatGPT API connection...'}
          {status === 'connected' && 'ChatGPT API Connected'}
          {status === 'disconnected' && 'ChatGPT API Disconnected'}
        </span>
        <p className="status-message">{message}</p>
      </div>
      
      {status === 'disconnected' && (
        <button 
          className="retry-button"
          onClick={retryConnection}
          disabled={isRetrying}
        >
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;
