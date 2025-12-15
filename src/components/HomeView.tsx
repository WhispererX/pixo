import { useState, useEffect } from 'react';
import { FiFile, FiFolder, FiClock, FiImage } from 'react-icons/fi';
import { useAppStore } from '../store/appStore';
import { Sprite, Layer } from '../types';
import './HomeView.css';

function HomeView() {
  const { addTab, addSprite } = useAppStore();
  const [showNewSpriteDialog, setShowNewSpriteDialog] = useState(false);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  
  // New sprite form state
  const [width, setWidth] = useState(32);
  const [height, setHeight] = useState(32);
  const [backgroundColor, setBackgroundColor] = useState('transparent');

  useEffect(() => {
    // Load recent files
    if (window.electronAPI) {
      window.electronAPI.getRecentFiles().then((files) => {
        setRecentFiles(files);
      });
    }
  }, []);

  const handleCreateNewSprite = () => {
    setShowNewSpriteDialog(true);
  };

  const handleConfirmNewSprite = () => {
    const spriteId = `sprite-${Date.now()}`;
    const layerId = `layer-${Date.now()}`;
    
    const layer: Layer = {
      id: layerId,
      name: 'Layer 1',
      visible: true,
      opacity: 100,
      pixels: new Map(),
      locked: false,
    };

    const sprite: Sprite = {
      id: spriteId,
      name: 'Untitled',
      width,
      height,
      backgroundColor,
      layers: [layer],
      activeLayerId: layerId,
    };

    addSprite(sprite);
    addTab({
      id: `tab-${Date.now()}`,
      type: 'sprite',
      title: 'Untitled',
      spriteId,
      modified: false,
    });

    setShowNewSpriteDialog(false);
  };

  const handleOpenFile = async () => {
    if (!window.electronAPI) return;
    
    const result = await window.electronAPI.openFileDialog();
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return;
    }

    const filePath = result.filePaths[0];
    const fileResult = await window.electronAPI.readFile(filePath);
    
    if (!fileResult.success || !fileResult.content) {
      alert('Failed to open file');
      return;
    }

    try {
      const data = JSON.parse(fileResult.content);
      const spriteId = `sprite-${Date.now()}`;
      
      const sprite: Sprite = {
        ...data,
        id: spriteId,
        layers: data.layers.map((layer: any) => ({
          ...layer,
          pixels: new Map(Object.entries(layer.pixels)),
        })),
      };

      addSprite(sprite);
      addTab({
        id: `tab-${Date.now()}`,
        type: 'sprite',
        title: sprite.name,
        spriteId,
        modified: false,
        filePath,
      });

      await window.electronAPI.addRecentFile(filePath);
      
      // Refresh recent files list
      const files = await window.electronAPI.getRecentFiles();
      setRecentFiles(files);
    } catch (error) {
      alert('Invalid file format');
    }
  };

  const handleOpenRecentFile = async (filePath: string) => {
    if (!window.electronAPI) return;
    
    const fileResult = await window.electronAPI.readFile(filePath);
    
    if (!fileResult.success || !fileResult.content) {
      alert('Failed to open file');
      return;
    }

    try {
      const data = JSON.parse(fileResult.content);
      const spriteId = `sprite-${Date.now()}`;
      
      const sprite: Sprite = {
        ...data,
        id: spriteId,
        layers: data.layers.map((layer: any) => ({
          ...layer,
          pixels: new Map(Object.entries(layer.pixels)),
        })),
      };

      addSprite(sprite);
      addTab({
        id: `tab-${Date.now()}`,
        type: 'sprite',
        title: sprite.name,
        spriteId,
        modified: false,
        filePath,
      });
    } catch (error) {
      alert('Invalid file format');
    }
  };

  return (
    <div className="home-view">
      <div className="home-hero">
        <div className="hero-content">
          <div className="app-logo">
            <FiImage size={64} />
          </div>
          <h1 className="app-title">Pixo</h1>
          <p className="app-tagline">Professional Pixel Art Editor</p>
        </div>
      </div>

      <div className="home-content">
        <h3 className="quick-actions-label">Quick Actions</h3>
        <div className="action-cards">
          <button className="action-card new-file" onClick={handleCreateNewSprite}>
            <FiFile size={32} />
            <h3>New Sprite</h3>
            <p>Create a new pixel art project</p>
          </button>

          <button className="action-card open-file" onClick={handleOpenFile}>
            <FiFolder size={32} />
            <h3>Open File</h3>
            <p>Browse and open existing projects</p>
          </button>
        </div>

        <div className="recent-section">
          <div className="section-header">
            <FiClock size={20} />
            <h2>Recent Files</h2>
          </div>
          {recentFiles.length > 0 ? (
            <div className="recent-files">
              {recentFiles.map((filePath, index) => {
                const fileName = filePath.split(/[/\\]/).pop() || filePath;
                return (
                  <button
                    key={index}
                    className="recent-file-item"
                    onClick={() => handleOpenRecentFile(filePath)}
                    title={filePath}
                  >
                    <FiFile size={18} />
                    <div className="recent-file-info">
                      <span className="recent-file-name">{fileName}</span>
                      <span className="recent-file-path">{filePath}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>No recent files yet. Start creating!</p>
            </div>
          )}
        </div>
      </div>

      {showNewSpriteDialog && (
        <div className="modal-backdrop" onClick={() => setShowNewSpriteDialog(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Sprite</h2>
            
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

            <div className="form-group">
              <label>Background</label>
              <div className="background-options">
                <button
                  className={`bg-option ${backgroundColor === 'transparent' ? 'active' : ''}`}
                  onClick={() => setBackgroundColor('transparent')}
                >
                  <div className="bg-preview transparent"></div>
                  Transparent
                </button>
                <button
                  className={`bg-option ${backgroundColor === '#ffffff' ? 'active' : ''}`}
                  onClick={() => setBackgroundColor('#ffffff')}
                >
                  <div className="bg-preview white"></div>
                  White
                </button>
                <button
                  className={`bg-option ${backgroundColor === '#000000' ? 'active' : ''}`}
                  onClick={() => setBackgroundColor('#000000')}
                >
                  <div className="bg-preview black"></div>
                  Black
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button className="button-secondary" onClick={() => setShowNewSpriteDialog(false)}>
                Cancel
              </button>
              <button className="button-primary" onClick={handleConfirmNewSprite}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeView;
