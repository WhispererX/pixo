import { useState, useRef } from 'react';
import './ResizeCanvasDialog.css';

interface ExportDialogProps {
  onConfirm: (settings: ExportSettings) => void;
  onCancel: () => void;
}

export interface ExportSettings {
  layerMode: 'selected' | 'all' | 'visible';
  sliceMode: 'whole' | 'sliced';
  cellWidth?: number;
  cellHeight?: number;
  offsetX?: number;
  offsetY?: number;
}

function ExportDialog({ onConfirm, onCancel }: ExportDialogProps) {
  const [layerMode, setLayerMode] = useState<'selected' | 'all' | 'visible'>('visible');
  const [sliceMode, setSliceMode] = useState<'whole' | 'sliced'>('whole');
  const [cellWidth, setCellWidth] = useState('16');
  const [cellHeight, setCellHeight] = useState('16');
  const [offsetX, setOffsetX] = useState('0');
  const [offsetY, setOffsetY] = useState('0');
  const [mouseDownInside, setMouseDownInside] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onConfirm({
      layerMode,
      sliceMode,
      cellWidth: parseInt(cellWidth),
      cellHeight: parseInt(cellHeight),
      offsetX: parseInt(offsetX),
      offsetY: parseInt(offsetY),
    });
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
          <h2>Export Sprite</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            {/* Layer Mode */}
            <fieldset style={{ border: 'none', padding: 0, margin: '0 0 16px 0' }}>
              <legend style={{ fontSize: '13px', fontWeight: '600', color: '#cccccc', marginBottom: '8px' }}>
                Layers to Export
              </legend>
              <label style={{ display: 'block', marginBottom: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="selected"
                  checked={layerMode === 'selected'}
                  onChange={(e) => setLayerMode(e.target.value as 'selected' | 'all' | 'visible')}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '13px', color: '#e0e0e0' }}>Selected Layer Only</span>
              </label>
              <label style={{ display: 'block', marginBottom: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="all"
                  checked={layerMode === 'all'}
                  onChange={(e) => setLayerMode(e.target.value as 'selected' | 'all' | 'visible')}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '13px', color: '#e0e0e0' }}>All Layers</span>
              </label>
              <label style={{ display: 'block', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="visible"
                  checked={layerMode === 'visible'}
                  onChange={(e) => setLayerMode(e.target.value as 'selected' | 'all' | 'visible')}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '13px', color: '#e0e0e0' }}>Visible Layers Only</span>
              </label>
            </fieldset>

            {/* Slice Mode */}
            <fieldset style={{ border: 'none', padding: 0, margin: '0 0 16px 0' }}>
              <legend style={{ fontSize: '13px', fontWeight: '600', color: '#cccccc', marginBottom: '8px' }}>
                Export Mode
              </legend>
              <label style={{ display: 'block', marginBottom: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="whole"
                  checked={sliceMode === 'whole'}
                  onChange={(e) => setSliceMode(e.target.value as 'whole' | 'sliced')}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '13px', color: '#e0e0e0' }}>Export Whole Canvas</span>
              </label>
              <label style={{ display: 'block', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="sliced"
                  checked={sliceMode === 'sliced'}
                  onChange={(e) => setSliceMode(e.target.value as 'whole' | 'sliced')}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '13px', color: '#e0e0e0' }}>Slice by Cell Size</span>
              </label>
            </fieldset>

            {/* Slice Settings */}
            {sliceMode === 'sliced' && (
              <fieldset style={{ border: '1px solid #3e3e42', padding: '12px', borderRadius: '4px', marginTop: '12px' }}>
                <legend style={{ fontSize: '12px', fontWeight: '600', color: '#888888', padding: '0 8px' }}>
                  Slice Settings
                </legend>
                
                <div style={{ marginTop: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#cccccc' }}>
                    Cell Width:
                    <input
                      type="number"
                      min="1"
                      value={cellWidth}
                      onChange={(e) => setCellWidth(e.target.value)}
                      style={{
                        marginLeft: '8px',
                        width: '60px',
                        padding: '4px',
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #3e3e42',
                        color: '#ffffff',
                        borderRadius: '2px',
                      }}
                    />
                  </label>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#cccccc' }}>
                    Cell Height:
                    <input
                      type="number"
                      min="1"
                      value={cellHeight}
                      onChange={(e) => setCellHeight(e.target.value)}
                      style={{
                        marginLeft: '8px',
                        width: '60px',
                        padding: '4px',
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #3e3e42',
                        color: '#ffffff',
                        borderRadius: '2px',
                      }}
                    />
                  </label>
                </div>

                <div style={{ marginBottom: '6px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#cccccc' }}>
                    Offset X:
                    <input
                      type="number"
                      value={offsetX}
                      onChange={(e) => setOffsetX(e.target.value)}
                      style={{
                        marginLeft: '8px',
                        width: '60px',
                        padding: '4px',
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #3e3e42',
                        color: '#ffffff',
                        borderRadius: '2px',
                      }}
                    />
                  </label>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#cccccc' }}>
                    Offset Y:
                    <input
                      type="number"
                      value={offsetY}
                      onChange={(e) => setOffsetY(e.target.value)}
                      style={{
                        marginLeft: '8px',
                        width: '60px',
                        padding: '4px',
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #3e3e42',
                        color: '#ffffff',
                        borderRadius: '2px',
                      }}
                    />
                  </label>
                </div>
              </fieldset>
            )}
          </div>

          <div className="dialog-footer">
            <button type="button" onClick={onCancel}>Cancel</button>
            <button type="submit">Continue to Export</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExportDialog;
