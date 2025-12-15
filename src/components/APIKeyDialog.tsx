import { useState, useRef } from 'react';
import './ResizeCanvasDialog.css';

interface APIKeyDialogProps {
  onConfirm: (key: string) => void;
  onCancel: () => void;
  message?: string;
}

function APIKeyDialog({ onConfirm, onCancel, message }: APIKeyDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [mouseDownInside, setMouseDownInside] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onConfirm(apiKey.trim());
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
        style={{ maxWidth: '500px' }}
      >
        <div className="dialog-header">
          <h2>OpenAI API Key</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            {message && <div style={{ color: '#ffcc00', marginBottom: '12px', fontSize: '13px', lineHeight: '1.4' }}>{message}</div>}
            <label style={{ display: 'block' }}>
              <span style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#cccccc' }}>
                Enter your OpenAI API Key:
              </span>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    handleSubmit(e as any);
                  } else if (e.key === 'Escape') {
                    onCancel();
                  }
                }}
                placeholder="sk-..."
                style={{
                  width: '100%',
                  padding: '8px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  borderRadius: '4px',
                  border: '1px solid #888',
                  backgroundColor: '#2a2a2a',
                  color: '#fff',
                  letterSpacing: '0.1em',
                }}
                autoFocus
              />
              <p style={{ fontSize: '12px', color: '#888888', marginTop: '8px' }}>
                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: '#007acc' }}>platform.openai.com/api-keys</a>
              </p>
            </label>
          </div>
          <div className="dialog-footer">
            <button type="button" onClick={onCancel}>Cancel</button>
            <button type="submit" disabled={!apiKey.trim()}>Save API Key</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default APIKeyDialog;
