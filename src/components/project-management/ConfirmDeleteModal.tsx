import React from 'react';
import './ConfirmDeleteModal.css';

interface ConfirmDeleteModalProps {
  screenName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ screenName, onConfirm, onCancel }) => {
  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <h3 className="confirm-modal-title">Confirm Delete</h3>
        </div>
        <div className="confirm-modal-body">
          <p>Are you sure you want to delete screen <strong>"{screenName}"</strong>?</p>
          <p className="confirm-warning">This action cannot be undone.</p>
        </div>
        <div className="confirm-modal-footer">
          <button className="confirm-cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="confirm-delete-button" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;

