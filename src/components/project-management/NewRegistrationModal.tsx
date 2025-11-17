import React, { useState } from 'react';
import './NewRegistrationModal.css';

interface NewRegistrationModalProps {
  onClose: () => void;
  onRegister: (projectName: string, screens: string[]) => void;
}

const NewRegistrationModal: React.FC<NewRegistrationModalProps> = ({ onClose, onRegister }) => {
  const [projectName, setProjectName] = useState('');
  const [screens, setScreens] = useState<string[]>(['']);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleAddScreen = () => {
    setScreens([...screens, '']);
    setErrorMessage('');
  };

  const handleScreenChange = (index: number, value: string) => {
    const newScreens = [...screens];
    newScreens[index] = value;
    setScreens(newScreens);
    setErrorMessage('');
  };

  const handleProjectNameChange = (value: string) => {
    setProjectName(value);
    setErrorMessage('');
  };

  const handleRemoveScreen = (index: number) => {
    if (screens.length > 1) {
      const newScreens = screens.filter((_, i) => i !== index);
      setScreens(newScreens);
      setErrorMessage('');
    }
  };

  const handleRegister = async () => {
    const validScreens = screens.filter(screen => screen.trim() !== '');
    if (projectName.trim() && validScreens.length > 0) {
      try {
        setErrorMessage('');
        await onRegister(projectName.trim(), validScreens);
        onClose();
      } catch (error: any) {
        console.error('Error registering project:', error);
        // Extract error message from API response
        let errorMsg = 'Failed to register project. Please try again.';
        if (error?.message) {
          errorMsg = error.message;
        } else if (typeof error === 'string') {
          errorMsg = error;
        }
        setErrorMessage(errorMsg);
      }
    }
  };

  const isFormValid = () => {
    return projectName.trim().length > 0 && 
           projectName.trim().length <= 250 &&
           screens.some(screen => screen.trim().length > 0 && screen.trim().length <= 150);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New registration</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Project name</label>
            <input
              type="text"
              className="form-input"
              value={projectName}
              onChange={(e) => handleProjectNameChange(e.target.value)}
              placeholder="Within 250 characters"
              maxLength={250}
            />
          </div>

          {errorMessage && (
            <div className="error-message-container">
              <div className="error-icon">⚠️</div>
              <p className="error-message-text">{errorMessage}</p>
            </div>
          )}

          <div className="form-section">
            <h3 className="section-title">List screen</h3>
            {screens.map((screen, index) => (
              <div key={index} className="screen-input-group">
                <label className="form-label">{`Screen ${index + 1}:`}</label>
                <div className="screen-input-wrapper">
                  <input
                    type="text"
                    className="form-input"
                    value={screen}
                    onChange={(e) => handleScreenChange(index, e.target.value)}
                    placeholder="No more than 150 characters"
                    maxLength={150}
                  />
                  {screens.length > 1 && (
                    <button
                      className="remove-screen-button"
                      onClick={() => handleRemoveScreen(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button className="add-screen-button" onClick={handleAddScreen}>
              <span className="add-icon">+</span>
            </button>
          </div>

          <p className="instruction-text">
            Register the project infomation. If you agree, click "Register".
          </p>
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`register-button ${!isFormValid() ? 'disabled' : ''}`}
            onClick={handleRegister}
            disabled={!isFormValid()}
          >
            {isFormValid() ? 'Register' : 'Please enter'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewRegistrationModal;

