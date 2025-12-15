import { useState, useRef } from 'react';
import './ResizeCanvasDialog.css';

interface NewSpriteDialogProps {
  onConfirm: (width: number, height: number, name: string) => void;
  onCancel: () => void;
}

function NewSpriteDialog({ onConfirm, onCancel }: NewSpriteDialogProps) {
  const [width, setWidth] = useState(32);
  const [height, setHeight] = useState(32);
  const [name, setName] = useState('New Sprite');
  const [mouseDownInside, setMouseDownInside] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleConfirm = () => {
    if (width > 0 && height > 0 && name.trim()) {
      onConfirm(width, height, name.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onCancel();
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
        onKeyDown={handleKeyDown} 
        onMouseDown={handleContentMouseDown}
      >
        <div className="dialog-header">
          <h3>New Sprite</h3>
        </div>
        <div className="dialog-body">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Width</label>
            <input
              type="number"
              min="1"
              max="512"
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="form-group">
            <label>Height</label>
            <input
              type="number"
              min="1"
              max="512"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="info-text">Create a new sprite with these dimensions.</div>
        </div>
        <div className="dialog-footer">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={handleConfirm}>Create</button>
        </div>
      </div>
    </div>
  );
}

export default NewSpriteDialog;
