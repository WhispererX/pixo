import { useState, useEffect } from 'react';
import './KeyboardShortcutsDialog.css';
import { formatShortcut, getCurrentShortcuts } from '../utils/shortcutManager';

interface ShortcutItem {
  id: string;
  category: string;
  description: string;
  shortcut: string;
}

interface KeyboardShortcutsDialogProps {
  shortcuts: ShortcutItem[];
  onClose: () => void;
  onUpdateShortcut?: (id: string, newShortcut: string) => void;
  onResetAll?: () => void;
}

function KeyboardShortcutsDialog({ shortcuts, onClose, onUpdateShortcut, onResetAll }: KeyboardShortcutsDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [capturedKeys, setCapturedKeys] = useState('');
  const [conflictWith, setConflictWith] = useState<string | null>(null);

  const filteredShortcuts = shortcuts.filter(
    (s) =>
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.shortcut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedShortcuts = filteredShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutItem[]>);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (capturing) {
        e.preventDefault();
        e.stopPropagation();
        
        const parts: string[] = [];
        if (e.ctrlKey) parts.push('Ctrl');
        if (e.altKey) parts.push('Alt');
        if (e.shiftKey) parts.push('Shift');
        
        const key = e.key;
        if (key === 'Escape') {
          setCapturing(false);
          setEditingId(null);
          return;
        } else if (key === 'Enter') {
          if (conflictWith) {
            return;
          }
          if (capturedKeys && editingId && onUpdateShortcut) {
            onUpdateShortcut(editingId, capturedKeys);
          }
          setCapturing(false);
          setEditingId(null);
          setCapturedKeys('');
          return;
        }
        
        if (key.length === 1) {
          parts.push(key.toUpperCase());
        } else if (['Delete', 'Backspace', 'Space', 'Tab'].includes(key)) {
          parts.push(key);
        }
        
        if (parts.length > 0) {
          const combo = parts.join('+');
          setCapturedKeys(combo);
          const current = getCurrentShortcuts();
          const conflictId = Object.entries(current).find(([id, val]) => val === combo && id !== editingId)?.[0] || null;
          setConflictWith(conflictId);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [capturing, capturedKeys, editingId, onClose, onUpdateShortcut]);

  const handleStartCapture = (id: string, currentShortcut: string) => {
    setEditingId(id);
    setCapturing(true);
    setCapturedKeys(currentShortcut);
    setConflictWith(null);
  };

  return (
    <div className="shortcuts-dialog-overlay">
      <div className="keyboard-shortcuts-dialog">
        <div className="dialog-header">
          <h2>Keyboard Shortcuts</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="dialog-body">
          <div className="shortcuts-search">
            <input
              type="text"
              placeholder="Search shortcuts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="shortcuts-list">
            {Object.entries(groupedShortcuts).map(([category, items]) => (
              <div key={category} className="shortcuts-category">
                <h3>{category}</h3>
                <table>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="shortcut-description">{item.description}</td>
                        <td className="shortcut-keys">
                          {editingId === item.id && capturing ? (
                            <span className={"capturing-keys" + (conflictWith ? " conflict" : "")}>
                              {capturedKeys || 'Press keys...'}
                            </span>
                          ) : (
                            <span 
                              className="shortcut-badge"
                              onClick={() => onUpdateShortcut && handleStartCapture(item.id, item.shortcut)}
                              style={{ cursor: onUpdateShortcut ? 'pointer' : 'default' }}
                            >
                              {formatShortcut(item.shortcut)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {capturing && (
            <div className="capture-hint">
              Press the key combination you want to use, then press <strong>Enter</strong> to confirm or <strong>Esc</strong> to cancel.
              {conflictWith && (
                <div className="conflict-warning">
                  This shortcut is already used by <strong>{conflictWith}</strong>. Choose a different combination.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="dialog-footer">
          {onResetAll && (
            <button onClick={onResetAll} className="reset-button">
              Reset All to Defaults
            </button>
          )}
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcutsDialog;
