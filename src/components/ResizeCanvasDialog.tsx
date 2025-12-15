import { useState, useRef } from 'react';
import './ResizeCanvasDialog.css';

interface ResizeCanvasDialogProps {
  currentWidth: number;
  currentHeight: number;
  onConfirm: (width: number, height: number) => void;
  onCancel: () => void;
}

function ResizeCanvasDialog({ currentWidth, currentHeight, onConfirm, onCancel }: ResizeCanvasDialogProps) {
  const [width, setWidth] = useState(currentWidth);
  const [height, setHeight] = useState(currentHeight);
  const [mouseDownInside, setMouseDownInside] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleConfirm = () => {
    if (width > 0 && height > 0 && width <= 1024 && height <= 1024) {
      onConfirm(width, height);
    }
  };

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      setMouseDownInside(false);
    }
  };

  const handleContentMouseDown = (e: React.MouseEvent) => {
    setMouseDownInside(true);
    e.stopPropagation();
  };

  const handleBackdropMouseUp = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current && !mouseDownInside) {
      onCancel();
    }
    setMouseDownInside(false);
  };

  return (
    <div 
      ref={backdropRef}
      className="dialog-backdrop" 
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
    >
      <div 
        className="dialog-content" 
        onMouseDown={handleContentMouseDown}
      >
        <div className="dialog-header">
          <h3>Resize Canvas</h3>
        </div>
        <div className="dialog-body">
          <div className="form-group">
            <label>Width (px)</label>
            <input
              type="number"
              min="1"
              max="1024"
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value) || 1)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Height (px)</label>
            <input
              type="number"
              min="1"
              max="1024"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="info-text">
            Current: {currentWidth} × {currentHeight}
          </div>
        </div>
        <div className="dialog-footer">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleConfirm}>
            Resize
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResizeCanvasDialog;
