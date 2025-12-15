import { useState, useRef } from 'react';
import './ResizeCanvasDialog.css';

interface AIPromptDialogProps {
  onConfirm: (prompt: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  errorMessage?: string;
}

function AIPromptDialog({ onConfirm, onCancel, isLoading = false, errorMessage = '' }: AIPromptDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [mouseDownInside, setMouseDownInside] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onConfirm(prompt.trim());
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
          <h2>AI Image Generation</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            {errorMessage && <div style={{ color: '#ff6b6b', marginBottom: '12px', fontSize: '14px' }}>{errorMessage}</div>}
            
            <label style={{ display: 'block' }}>
              <span style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Describe the image you want to generate:
              </span>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='e.g., A pixelated medieval castle with a dragon'
                rows={4}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  borderRadius: '4px',
                  border: '1px solid #888',
                  backgroundColor: '#2a2a2a',
                  color: '#fff',
                  resize: 'vertical',
                }}
                autoFocus
              />
            </label>
          </div>
          <div className="dialog-footer">
            <button type="button" onClick={onCancel} disabled={isLoading}>Cancel</button>
            <button type="submit" disabled={!prompt.trim() || isLoading}>
              {isLoading ? 'Processing...' : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AIPromptDialog;