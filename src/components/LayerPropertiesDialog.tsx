import { useState, useRef } from 'react';
import './LayerPropertiesDialog.css';

interface LayerPropertiesDialogProps {
  layerName: string;
  layerOpacity: number;
  onConfirm: (name: string, opacity: number) => void;
  onCancel: () => void;
}

function LayerPropertiesDialog({ layerName, layerOpacity, onConfirm, onCancel }: LayerPropertiesDialogProps) {
  const [name, setName] = useState(layerName);
  const [opacity, setOpacity] = useState(layerOpacity);
  const [mouseDownInside, setMouseDownInside] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleConfirm = () => {
    if (name.trim() && opacity >= 0 && opacity <= 100) {
      onConfirm(name.trim(), opacity);
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
          <h3>Layer Properties</h3>
        </div>
        <div className="dialog-body">
          <div className="form-group">
            <label htmlFor="layer-name">Name:</label>
            <input
              id="layer-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="layer-opacity">Opacity: {opacity}%</label>
            <input
              id="layer-opacity"
              type="range"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(parseInt(e.target.value))}
            />
          </div>
        </div>
        <div className="dialog-footer">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleConfirm}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default LayerPropertiesDialog;
