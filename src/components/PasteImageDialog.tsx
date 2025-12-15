import { useState, useRef } from 'react';
import './ResizeCanvasDialog.css';

interface PasteImageDialogProps {
  imageWidth: number;
  imageHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  onCrop: () => void;
  onResizeCanvas: () => void;
  onCancel: () => void;
}

function PasteImageDialog({ 
  imageWidth, 
  imageHeight, 
  canvasWidth, 
  canvasHeight, 
  onCrop, 
  onResizeCanvas, 
  onCancel 
}: PasteImageDialogProps) {
  const [mouseDownInside, setMouseDownInside] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

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
          <h2>Paste Image</h2>
        </div>
        <div className="dialog-body">
          <p>
            The image you're pasting ({imageWidth}×{imageHeight}) is larger than the canvas ({canvasWidth}×{canvasHeight}).
          </p>
          <p>How would you like to proceed?</p>
        </div>
        <div className="dialog-footer">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onCrop}>Crop to Fit</button>
          <button onClick={onResizeCanvas}>Resize Canvas</button>
        </div>
      </div>
    </div>
  );
}

export default PasteImageDialog;
