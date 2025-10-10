import React from 'react';

interface MessageDisplayProps {
  errorMessage: string;
  saveMessage: string;
  dbMessage: string;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({
  errorMessage,
  saveMessage,
  dbMessage
}) => {
  return (
    <>
      {errorMessage && (
        <div className="error-message" style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '12px',
          borderRadius: '4px',
          marginTop: '16px',
          border: '1px solid #ffcdd2'
        }}>
          {errorMessage}
        </div>
      )}
      {saveMessage && (
        <div className="save-message" style={{
          backgroundColor: saveMessage.includes('Error') ? '#ffebee' : '#e8f5e8',
          color: saveMessage.includes('Error') ? '#c62828' : '#2e7d32',
          padding: '12px',
          borderRadius: '4px',
          marginTop: '16px',
          border: `1px solid ${saveMessage.includes('Error') ? '#ffcdd2' : '#c8e6c9'}`
        }}>
          {saveMessage}
        </div>
      )}
      {dbMessage && (
        <div className="db-message" style={{
          backgroundColor: dbMessage.includes('Error') ? '#ffebee' : '#e3f2fd',
          color: dbMessage.includes('Error') ? '#c62828' : '#1565c0',
          padding: '12px',
          borderRadius: '4px',
          marginTop: '16px',
          border: `1px solid ${dbMessage.includes('Error') ? '#ffcdd2' : '#bbdefb'}`
        }}>
          {dbMessage}
        </div>
      )}
    </>
  );
};

export default MessageDisplay;
