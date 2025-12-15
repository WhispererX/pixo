import { useState, useRef } from 'react';
import './ResizeCanvasDialog.css';

interface GridSettingsDialogProps {
  currentGridSize: number;
  currentGridColor: string;
  currentGridOpacity: number;
  onConfirm: (gridSize: number, gridColor: string, gridOpacity: number) => void;
  onCancel: () => void;
}

function GridSettingsDialog({ 
  currentGridSize, 
  currentGridColor, 
  currentGridOpacity, 
  onConfirm, 
  onCancel 
}: GridSettingsDialogProps) {
  const [gridSize, setGridSize] = useState(currentGridSize);
  const [gridColor, setGridColor] = useState(currentGridColor);
  const [gridOpacity, setGridOpacity] = useState(currentGridOpacity);
  const [mouseDownInside, setMouseDownInside] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleConfirm = () => {
    onConfirm(gridSize, gridColor, gridOpacity);
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
          <h3>Grid Settings</h3>
        </div>
        <div className="dialog-body">
          <div className="form-group">
            <label>Grid Size (pixels)</label>
            <input
              type="number"
              min="1"
              max="64"
              value={gridSize}
              onChange={(e) => setGridSize(parseInt(e.target.value) || 1)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Grid Color</label>
            <input
              type="color"
              value={gridColor}
              onChange={(e) => setGridColor(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Grid Opacity</label>
            <input
              type="range"
              min="0"
              max="100"
              value={gridOpacity * 100}
              onChange={(e) => setGridOpacity(parseInt(e.target.value) / 100)}
            />
            <span className="range-value">{Math.round(gridOpacity * 100)}%</span>
          </div>
        </div>
        <div className="dialog-footer">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleConfirm}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default GridSettingsDialog;
