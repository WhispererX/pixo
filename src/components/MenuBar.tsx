import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import ResizeCanvasDialog from './ResizeCanvasDialog';
import GridSettingsDialog from './GridSettingsDialog';
import NewSpriteDialog from './NewSpriteDialog';
import APIKeyDialog from './APIKeyDialog';
import KeyboardShortcutsDialog from './KeyboardShortcutsDialog';
import { getCurrentShortcuts, setShortcut, resetShortcuts, getShortcut, formatShortcut } from '../utils/shortcutManager';
import { setStoredAPIKey } from '../utils/apiKeyStorage';
import { getElectronAPI } from '../utils/electronAPI';
import './MenuBar.css';

interface MenuBarProps {
  onNewSprite: (width: number, height: number, name: string) => void;
  onSave: () => void;
  onSaveAs: () => void;
  onOpen: () => void;
  onExport: () => void;
  onResizeCanvas?: (width: number, height: number) => void;
  onFlipHorizontal?: () => void;
  onFlipVertical?: () => void;
  onRotate90CW?: () => void;
  onRotate90CCW?: () => void;
  onFillSelection?: () => void;
  onStrokeSelection?: () => void;
  onOutlineSelection?: () => void;
  onDuplicateSprite?: () => void;
  onTrimCanvas?: () => void;
  onSelectAll?: () => void;
  currentSpriteWidth?: number;
  currentSpriteHeight?: number;
  currentSpriteId?: string;
}

function MenuBar({ 
  onNewSprite, 
  onSave,
  onSaveAs,
  onOpen,
  onExport, 
  onResizeCanvas, 
  onFlipHorizontal, 
  onFlipVertical, 
  onRotate90CW,
  onRotate90CCW,
  onFillSelection,
  onStrokeSelection,
  onOutlineSelection,
  onDuplicateSprite,
  onTrimCanvas,
  onSelectAll,
  currentSpriteWidth = 32,
  currentSpriteHeight = 32,
  currentSpriteId
}: MenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [showResizeDialog, setShowResizeDialog] = useState(false);
  const [showGridDialog, setShowGridDialog] = useState(false);
  const [showNewSpriteDialog, setShowNewSpriteDialog] = useState(false);
  const [showAPIKeyDialog, setShowAPIKeyDialog] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const {
    undo,
    redo,
    activeTabId,
    tabs,
    removeTab,
    setActiveTab,
    setShowGrid,
    showGrid,
    zoom,
    setZoom,
    gridSize,
    gridColor,
    gridOpacity,
    setGridSize,
    setGridColor,
    setGridOpacity,
    showPreview,
    setShowPreview,
    invertSelection,
    clearSelection,
    selectedPixels,
    setModalOpen,
  } = useAppStore();

  const hasSelection = selectedPixels.size > 0;

  // Load recent files
  useEffect(() => {
    const loadRecentFiles = async () => {
      try {
        const api = await getElectronAPI();
        const files = await api.getRecentFiles();
        setRecentFiles(files);
      } catch {
        // Electron API not available
      }
    };
    loadRecentFiles();
  }, []);

  const handleMenuClick = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    setOpenMenu(null);
  };

  const handleZoomIn = () => {
    setZoom(Math.min(32, zoom + 2));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(1, zoom - 2));
  };

  const handleZoomReset = () => {
    setZoom(10);
  };

  const handleResizeCanvasClick = () => {
    setOpenMenu(null);
    setModalOpen(true);
    setShowResizeDialog(true);
  };

  const handleResizeCanvasConfirm = (width: number, height: number) => {
    if (onResizeCanvas) {
      onResizeCanvas(width, height);
    }
    setShowResizeDialog(false);
  };

  const handleGridSettingsClick = () => {
    setOpenMenu(null);
    setModalOpen(true);
    setShowGridDialog(true);
  };

  const handleGridSettingsConfirm = (size: number, color: string, opacity: number) => {
    setGridSize(size);
    setGridColor(color);
    setGridOpacity(opacity);
    setShowGridDialog(false);
  };

  const handleOpenRecentFile = async (filePath: string) => {
    setOpenMenu(null);
    try {
      const api = await getElectronAPI();
      const fileResult = await api.readFile(filePath);
      
      if (!fileResult.success || !fileResult.content) {
        alert('Failed to open file');
        return;
      }

      const data = JSON.parse(fileResult.content);
      const { addSprite, addTab } = useAppStore.getState();
      const spriteId = `sprite-${Date.now()}`;
      
      const sprite = {
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
        type: 'sprite' as const,
        title: sprite.name,
        spriteId,
        modified: false,
        filePath,
      });
    } catch (error) {
      alert('Failed to open file: ' + error);
    }
  };

  const handleCloseTab = () => {
    if (activeTabId === 'home') return;
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab?.modified) {
      if (!confirm('Close without saving?')) return;
    }
    removeTab(activeTabId);
    setOpenMenu(null);
  };

  const handleCloseAll = () => {
    const modifiedTabs = tabs.filter(t => t.type !== 'home' && t.modified);
    if (modifiedTabs.length > 0) {
      if (!confirm(`Close ${modifiedTabs.length} unsaved tab(s)?`)) return;
    }
    const tabsToClose = tabs.filter(t => t.type !== 'home');
    tabsToClose.forEach(t => removeTab(t.id));
    setActiveTab('home');
    setOpenMenu(null);
  };

  const handleExit = () => {
    const modifiedTabs = tabs.filter(t => t.modified);
    if (modifiedTabs.length > 0) {
      if (!confirm('You have unsaved changes. Exit anyway?')) return;
    }
    window.close();
  };

  return (
    <>
      {openMenu && (
        <div className="menu-backdrop" onClick={() => setOpenMenu(null)} />
      )}
      
      <div className="menu-bar">
        <div className="menu-item">
          <button
            className={`menu-button ${openMenu === 'file' ? 'active' : ''}`}
            onClick={() => handleMenuClick('file')}
          >
            File
          </button>
          {openMenu === 'file' && (
            <div className="menu-dropdown">
              <button onClick={() => { setModalOpen(true); handleMenuItemClick(() => setShowNewSpriteDialog(true)); }}>
                New Sprite
                <span className="shortcut">{formatShortcut(getShortcut('new'))}</span>
              </button>
              <button onClick={() => handleMenuItemClick(onOpen)}>
                Open
                <span className="shortcut">{formatShortcut(getShortcut('open'))}</span>
              </button>
              {recentFiles.length > 0 && (
                <div className="menu-submenu">
                  <button className="submenu-trigger">
                    Open Recent
                    <span className="submenu-arrow">▶</span>
                  </button>
                  <div className="menu-dropdown submenu-content">
                    {recentFiles.map((file, index) => (
                      <button key={index} onClick={() => handleMenuItemClick(() => handleOpenRecentFile(file))}>
                        {file.split(/[/\\]/).pop()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="menu-separator" />
              <button onClick={() => handleMenuItemClick(onSave)}>
                Save
                <span className="shortcut">{formatShortcut(getShortcut('save'))}</span>
              </button>
              <button onClick={() => handleMenuItemClick(onSaveAs)}>
                Save As...
                <span className="shortcut">{formatShortcut(getShortcut('saveAs'))}</span>
              </button>
              <button onClick={() => handleMenuItemClick(handleCloseTab)} disabled={activeTabId === 'home'}>
                Close
                <span className="shortcut">{formatShortcut(getShortcut('close'))}</span>
              </button>
              <button onClick={() => handleMenuItemClick(handleCloseAll)} disabled={tabs.filter(t => t.type !== 'home').length === 0}>
                Close All
                <span className="shortcut">{formatShortcut(getShortcut('closeAll'))}</span>
              </button>
              <div className="menu-separator" />
              <button onClick={() => handleMenuItemClick(onExport)}>
                Export as PNG
                <span className="shortcut">{formatShortcut(getShortcut('export'))}</span>
              </button>
              <div className="menu-separator" />
              <button onClick={() => { setModalOpen(true); handleMenuItemClick(() => setShowAPIKeyDialog(true)); }}>
                Set API Key
              </button>
              <div className="menu-separator" />
              <button onClick={() => handleMenuItemClick(handleExit)}>
                Exit
                <span className="shortcut">{formatShortcut(getShortcut('exit'))}</span>
              </button>
            </div>
          )}
        </div>

        <div className="menu-item">
          <button
            className={`menu-button ${openMenu === 'edit' ? 'active' : ''}`}
            onClick={() => handleMenuClick('edit')}
          >
            Edit
          </button>
          {openMenu === 'edit' && (
            <div className="menu-dropdown">
              <button onClick={() => handleMenuItemClick(undo)}>
                Undo
                <span className="shortcut">{formatShortcut(getShortcut('undo'))}</span>
              </button>
              <button onClick={() => handleMenuItemClick(redo)}>
                Redo
                <span className="shortcut">{formatShortcut(getShortcut('redo'))}</span>
              </button>
              <div className="menu-separator" />
              <button onClick={() => handleMenuItemClick(() => {})} disabled={!hasSelection}>
                Cut
                <span className="shortcut">{formatShortcut(getShortcut('cut'))}</span>
              </button>
              <button onClick={() => handleMenuItemClick(() => {})} disabled={!hasSelection}>
                Copy
                <span className="shortcut">{formatShortcut(getShortcut('copy'))}</span>
              </button>
              <button onClick={() => handleMenuItemClick(() => {})}>
                Paste
                <span className="shortcut">{formatShortcut(getShortcut('paste'))}</span>
              </button>
              <button onClick={() => handleMenuItemClick(() => {})} disabled={!hasSelection}>
                Delete
                <span className="shortcut">{formatShortcut(getShortcut('delete'))}</span>
              </button>
              <div className="menu-separator" />
              <button onClick={() => handleMenuItemClick(onFillSelection || (() => {}))} disabled={!hasSelection || !onFillSelection}>
                Fill
                <span className="shortcut">{formatShortcut(getShortcut('fill'))}</span>
              </button>
              <button onClick={() => handleMenuItemClick(onStrokeSelection || (() => {}))} disabled={!hasSelection || !onStrokeSelection}>
                Stroke
                <span className="shortcut">{formatShortcut(getShortcut('stroke'))}</span>
              </button>
              <div className="menu-separator" />
              <div className="menu-submenu">
                <button className="submenu-trigger">
                  Rotate
                  <span className="submenu-arrow">▶</span>
                </button>
                <div className="menu-dropdown submenu-content">
                  <button onClick={() => handleMenuItemClick(onRotate90CW || (() => {}))} disabled={!onRotate90CW}>
                    Rotate 90° Clockwise
                  </button>
                  <button onClick={() => handleMenuItemClick(onRotate90CCW || (() => {}))} disabled={!onRotate90CCW}>
                    Rotate 90° Counter-Clockwise
                  </button>
                </div>
              </div>
              <button onClick={() => handleMenuItemClick(onFlipHorizontal || (() => {}))} disabled={!onFlipHorizontal}>
                Flip Horizontal
                <span className="shortcut">{formatShortcut(getShortcut('flipH'))}</span>
              </button>
              <button onClick={() => handleMenuItemClick(onFlipVertical || (() => {}))} disabled={!onFlipVertical}>
                Flip Vertical
                <span className="shortcut">{formatShortcut(getShortcut('flipV'))}</span>
              </button>
              <div className="menu-separator" />
              <button onClick={() => handleMenuItemClick(() => {})} disabled={!hasSelection}>
                New Sprite from Selection
                <span className="shortcut">Ctrl+Alt+N</span>
              </button>
              <button onClick={() => handleMenuItemClick(() => {})}>
                Invert Colors
              </button>
              <button onClick={() => handleMenuItemClick(onOutlineSelection || (() => {}))} disabled={!hasSelection || !onOutlineSelection}>
                Outline
                <span className="shortcut">{formatShortcut(getShortcut('outline'))}</span>
              </button>
              <div className="menu-separator" />
              <button onClick={() => { setModalOpen(true); handleMenuItemClick(() => setShowShortcutsDialog(true)); }}>
                Keyboard Shortcuts...
                <span className="shortcut">{formatShortcut(getShortcut('shortcuts'))}</span>
              </button>
            </div>
          )}
        </div>

        <div className="menu-item">
          <button
            className={`menu-button ${openMenu === 'select' ? 'active' : ''}`}
            onClick={() => handleMenuClick('select')}
          >
            Select
          </button>
          {openMenu === 'select' && (
            <div className="menu-dropdown">
              <button onClick={() => handleMenuItemClick(onSelectAll || (() => {}))} disabled={!onSelectAll}>
                All
                <span className="shortcut">{formatShortcut(getShortcut('selectAll'))}</span>
              </button>
              <button onClick={() => handleMenuItemClick(clearSelection)}>
                Deselect
                <span className="shortcut">{formatShortcut(getShortcut('deselect'))}</span>
              </button>
              <button onClick={() => handleMenuItemClick(() => currentSpriteId && invertSelection(currentSpriteId))} disabled={!currentSpriteId}>
                Inverse
                <span className="shortcut">{formatShortcut(getShortcut('inverse'))}</span>
              </button>
            </div>
          )}
        </div>

        <div className="menu-item">
          <button
            className={`menu-button ${openMenu === 'sprite' ? 'active' : ''}`}
            onClick={() => handleMenuClick('sprite')}
          >
            Sprite
          </button>
          {openMenu === 'sprite' && (
            <div className="menu-dropdown">
              <button onClick={() => handleMenuItemClick(onDuplicateSprite || (() => {}))} disabled={!onDuplicateSprite || !currentSpriteId}>
                Duplicate
              </button>
              <button onClick={() => handleMenuItemClick(handleResizeCanvasClick)} disabled={!onResizeCanvas}>
                Canvas Size...
                <span className="shortcut">C</span>
              </button>
              <button onClick={() => handleMenuItemClick(onTrimCanvas || (() => {}))} disabled={!onTrimCanvas || !currentSpriteId}>
                Trim
              </button>
              <div className="menu-separator" />
              <button onClick={() => handleMenuItemClick(onFlipHorizontal || (() => {}))} disabled={!onFlipHorizontal}>
                Flip Horizontal
              </button>
              <button onClick={() => handleMenuItemClick(onFlipVertical || (() => {}))} disabled={!onFlipVertical}>
                Flip Vertical
              </button>
              <button onClick={() => handleMenuItemClick(onRotate90CW || (() => {}))} disabled={!onRotate90CW}>
                Rotate 90° Clockwise
              </button>
            </div>
          )}
        </div>

        <div className="menu-item">
          <button
            className={`menu-button ${openMenu === 'view' ? 'active' : ''}`}
            onClick={() => handleMenuClick('view')}
          >
            View
          </button>
          {openMenu === 'view' && (
            <div className="menu-dropdown">
              <button onClick={() => handleMenuItemClick(handleZoomIn)}>
                Zoom In
                <span className="shortcut">{formatShortcut(getShortcut('zoomIn'))}</span>
              </button>
              <button onClick={() => handleMenuItemClick(handleZoomOut)}>
                Zoom Out
                <span className="shortcut">{formatShortcut(getShortcut('zoomOut'))}</span>
              </button>
              <button onClick={() => handleMenuItemClick(handleZoomReset)}>
                Reset Zoom
                <span className="shortcut">{formatShortcut(getShortcut('resetZoom'))}</span>
              </button>
              <div className="menu-separator" />
              <button onClick={() => handleMenuItemClick(() => setShowGrid(!showGrid))}>
                {showGrid ? '✓ ' : ''}Show Grid
              </button>
              <button onClick={() => handleMenuItemClick(handleGridSettingsClick)}>
                Grid Settings...
              </button>
              <div className="menu-separator" />
              <button onClick={() => handleMenuItemClick(() => setShowPreview(!showPreview))}>
                {showPreview ? '✓ ' : ''}Show Preview
              </button>
            </div>
          )}
        </div>
      </div>

      {showResizeDialog && (
        <ResizeCanvasDialog
          currentWidth={currentSpriteWidth}
          currentHeight={currentSpriteHeight}
          onConfirm={handleResizeCanvasConfirm}
          onCancel={() => { setShowResizeDialog(false); setModalOpen(false); }}
        />
      )}

      {showGridDialog && (
        <GridSettingsDialog
          currentGridSize={gridSize}
          currentGridColor={gridColor}
          currentGridOpacity={gridOpacity}
          onConfirm={handleGridSettingsConfirm}
          onCancel={() => { setShowGridDialog(false); setModalOpen(false); }}
        />
      )}

      {showNewSpriteDialog && (
        <NewSpriteDialog
          onConfirm={(width, height, name) => {
            setShowNewSpriteDialog(false);
            setModalOpen(false);
            onNewSprite(width, height, name);
          }}
          onCancel={() => { setShowNewSpriteDialog(false); setModalOpen(false); }}
        />
      )}

      {showAPIKeyDialog && (
        <APIKeyDialog
          onConfirm={(key) => {
            setStoredAPIKey(key);
            setShowAPIKeyDialog(false);
            setModalOpen(false);
          }}
          onCancel={() => { setShowAPIKeyDialog(false); setModalOpen(false); }}
          message="Enter your OpenAI API key to use the AI image generation tool."
        />
      )}

      {showShortcutsDialog && (
        <KeyboardShortcutsDialog
          shortcuts={(
            () => {
              const s = getCurrentShortcuts();
              return [
                { id: 'new', category: 'File', description: 'New Sprite', shortcut: s.new },
                { id: 'open', category: 'File', description: 'Open', shortcut: s.open },
                { id: 'save', category: 'File', description: 'Save', shortcut: s.save },
                { id: 'saveAs', category: 'File', description: 'Save As', shortcut: s.saveAs },
                { id: 'close', category: 'File', description: 'Close Tab', shortcut: s.close },
                { id: 'closeAll', category: 'File', description: 'Close All', shortcut: s.closeAll },
                { id: 'export', category: 'File', description: 'Export', shortcut: s.export },
                { id: 'exit', category: 'File', description: 'Exit', shortcut: s.exit },
                { id: 'undo', category: 'Edit', description: 'Undo', shortcut: s.undo },
                { id: 'redo', category: 'Edit', description: 'Redo', shortcut: s.redo },
                { id: 'cut', category: 'Edit', description: 'Cut', shortcut: s.cut },
                { id: 'copy', category: 'Edit', description: 'Copy', shortcut: s.copy },
                { id: 'paste', category: 'Edit', description: 'Paste', shortcut: s.paste },
                { id: 'delete', category: 'Edit', description: 'Delete', shortcut: s.delete },
                { id: 'fill', category: 'Edit', description: 'Fill', shortcut: s.fill },
                { id: 'stroke', category: 'Edit', description: 'Stroke', shortcut: s.stroke },
                { id: 'flipH', category: 'Edit', description: 'Flip Horizontal', shortcut: s.flipH },
                { id: 'flipV', category: 'Edit', description: 'Flip Vertical', shortcut: s.flipV },
                { id: 'outline', category: 'Edit', description: 'Outline', shortcut: s.outline },
                { id: 'newFromSelection', category: 'Edit', description: 'New Sprite from Selection', shortcut: s.newFromSelection },
                { id: 'shortcuts', category: 'Edit', description: 'Keyboard Shortcuts', shortcut: s.shortcuts },
                { id: 'selectAll', category: 'Select', description: 'Select All', shortcut: s.selectAll },
                { id: 'deselect', category: 'Select', description: 'Deselect', shortcut: s.deselect },
                { id: 'inverse', category: 'Select', description: 'Inverse', shortcut: s.inverse },
                { id: 'canvasSize', category: 'Sprite', description: 'Canvas Size', shortcut: s.canvasSize },
                { id: 'zoomIn', category: 'View', description: 'Zoom In', shortcut: s.zoomIn },
                { id: 'zoomOut', category: 'View', description: 'Zoom Out', shortcut: s.zoomOut },
                { id: 'resetZoom', category: 'View', description: 'Reset Zoom', shortcut: s.resetZoom },
                { id: 'brush', category: 'Tools', description: 'Brush', shortcut: s.brush },
                { id: 'pencil', category: 'Tools', description: 'Pencil', shortcut: s.pencil },
                { id: 'eraser', category: 'Tools', description: 'Eraser', shortcut: s.eraser },
                { id: 'picker', category: 'Tools', description: 'Color Picker', shortcut: s.picker },
                { id: 'bucket', category: 'Tools', description: 'Fill Bucket', shortcut: s.bucket },
                { id: 'move', category: 'Tools', description: 'Move', shortcut: s.move },
                { id: 'zoom', category: 'Tools', description: 'Zoom Tool', shortcut: s.zoom },
                { id: 'line', category: 'Tools', description: 'Line', shortcut: s.line },
                { id: 'rectangle', category: 'Tools', description: 'Rectangle', shortcut: s.rectangle },
                { id: 'rectSelect', category: 'Tools', description: 'Rectangle Select', shortcut: s.rectSelect },
                { id: 'quickSelect', category: 'Tools', description: 'Quick Select', shortcut: s.quickSelect },
                { id: 'magicWand', category: 'Tools', description: 'Magic Wand', shortcut: s.magicWand },
                { id: 'ellipse', category: 'Tools', description: 'Ellipse', shortcut: s.ellipse },
                { id: 'ai', category: 'Tools', description: 'AI Generation', shortcut: s.ai },
              ];
            }
          )()}
          onClose={() => { setShowShortcutsDialog(false); setModalOpen(false); }}
          onUpdateShortcut={(id, newShortcut) => {
            setShortcut(id, newShortcut);
            
            setShowShortcutsDialog(false);
            setShowShortcutsDialog(true);
          }}
          onResetAll={() => {
            resetShortcuts();
            setShowShortcutsDialog(false);
            setShowShortcutsDialog(true);
          }}
        />
      )}
    </>
  );
}

export default MenuBar;
