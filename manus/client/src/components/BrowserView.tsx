import React, { useRef, useEffect, useState } from 'react';
import './BrowserView.css';

interface GridData {
  rows: number;
  cols: number;
  cellWidth: number; // Original cell width from server
  cellHeight: number; // Original cell height from server
}

interface BrowserViewProps {
  screenshotData: string | null;
  gridData: GridData | null;
  // sendMessage: (message: any) => void; // Will be used later for interactions
}

const BrowserView: React.FC<BrowserViewProps> = ({ screenshotData, gridData }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (imageRef.current) {
      const updateDimensions = () => {
        if (imageRef.current) {
          setImageDimensions({
            width: imageRef.current.offsetWidth,
            height: imageRef.current.offsetHeight,
          });
        }
      };

      // Update dimensions when the image loads or the window resizes
      const currentImageRef = imageRef.current;
      currentImageRef.onload = updateDimensions;
      window.addEventListener('resize', updateDimensions);
      
      // Call once if image is already loaded (e.g. from cache)
      if (currentImageRef.complete) {
        updateDimensions();
      }

      return () => {
        currentImageRef.onload = null; // Clean up onload handler
        window.removeEventListener('resize', updateDimensions);
      };
    }
  }, [screenshotData]); // Re-run when screenshotData changes, as it might change image dimensions

  const renderGrid = () => {
    if (!gridData || !imageDimensions || !screenshotData) return null;

    const { rows, cols } = gridData;
    // Calculate cell dimensions based on the *displayed* image size
    const displayCellWidth = imageDimensions.width / cols;
    const displayCellHeight = imageDimensions.height / rows;

    const lines = [];

    // Draw vertical lines
    for (let i = 0; i <= cols; i++) {
      lines.push(
        <line
          key={`v-${i}`}
          x1={i * displayCellWidth}
          y1={0}
          x2={i * displayCellWidth}
          y2={imageDimensions.height}
          stroke="rgba(0, 0, 0, 0.3)"
          strokeWidth="1"
        />
      );
    }
    // Draw horizontal lines
    for (let i = 0; i <= rows; i++) {
      lines.push(
        <line
          key={`h-${i}`}
          x1={0}
          y1={i * displayCellHeight}
          x2={imageDimensions.width}
          y2={i * displayCellHeight}
          stroke="rgba(0, 0, 0, 0.3)"
          strokeWidth="1"
        />
      );
    }

    return (
      <svg
        className="grid-overlay"
        width={imageDimensions.width}
        height={imageDimensions.height}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        {lines}
      </svg>
    );
  };

  return (
    <div className="browser-view-container">
      {!screenshotData && <p className="loading-message">Waiting for browser content...</p>}
      <div className="screenshot-wrapper" style={{ position: 'relative', width: '100%', height: '100%' }}>
        {screenshotData && (
          <img
            ref={imageRef}
            src={`data:image/png;base64,${screenshotData}`}
            alt="Browser Screenshot"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        )}
        {gridData && imageDimensions && renderGrid()}
      </div>
    </div>
  );
};

export default BrowserView;
