import React from 'react';
import './StatusBar.css';

interface StatusBarProps {
  connectionStatus: string; // e.g., 'Connecting', 'Open', 'Closed', 'Error'
  isExecuting?: boolean; // Optional: to show a loading indicator
  statusMessage?: string; // General status messages from the backend or app
}

const StatusBar: React.FC<StatusBarProps> = ({ connectionStatus, isExecuting, statusMessage }) => {
  let statusText = '';
  let statusClass = '';

  switch (connectionStatus) {
    case 'Open':
      statusText = 'Connected';
      statusClass = 'connected';
      break;
    case 'Closed':
      statusText = 'Disconnected';
      statusClass = 'disconnected';
      break;
    case 'Error':
      statusText = 'Connection Error';
      statusClass = 'error';
      break;
    case 'Connecting':
      statusText = 'Connecting...';
      statusClass = 'connecting';
      break;
    default:
      statusText = connectionStatus; // Show the raw status if not specifically handled
      statusClass = 'unknown';
  }

  return (
    <div className={`status-bar-component ${statusClass}`}>
      <div className="connection-status">
        <span className={`indicator ${statusClass}`}></span>
        {statusText}
      </div>
      {isExecuting && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Processing...</span>
        </div>
      )}
      {statusMessage && !isExecuting && ( // Display general status message if not executing
        <div className="general-status-message">
          {statusMessage}
        </div>
      )}
    </div>
  );
};

export default StatusBar;
