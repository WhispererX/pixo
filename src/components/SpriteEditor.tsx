import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FiSave, FiDownload } from 'react-icons/fi';
import Toolbar from './Toolbar';
import ToolOptions from './ToolOptions';
import Canvas from './Canvas';
import ColorsView from './ColorsView';
import LayerPanel from './LayerPanel';
import PreviewPanel from './PreviewPanel';
import ResizeHandle from './ResizeHandle';
import AIPromptDialog from './AIPromptDialog';
import PasteImageDialog from './PasteImageDialog';
import ExportDialog, { type ExportSettings } from './ExportDialog';
import APIKeyDialog from './APIKeyDialog';
import { useAppStore } from '../store/appStore';
import { getStoredAPIKey, setStoredAPIKey } from '../utils/apiKeyStorage';
import { getElectronAPI } from '../utils/electronAPI';
import { getCurrentShortcuts, matchesShortcut } from '../utils/shortcutManager';
import './SpriteEditor.css';

interface SpriteEditorProps {
  spriteId: string;
}

function SpriteEditor({ spriteId }: SpriteEditorProps, ref: any) {
  const { sprites, tabs, activeTabId, updateTab, setSelectedTool, undo, redo, showPreview, addLayer, setPixel, selectedTool } = useAppStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [leftPanelWidth, setLeftPanelWidth] = useState(240);
  const [toolbarWidth] = useState(52);
  const [colorPanelHeight, setColorPanelHeight] = useState(350);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showPasteDialog, setShowPasteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAPIKeyDialog, setShowAPIKeyDialog] = useState(false);
  const [apiKeyMessage, setApiKeyMessage] = useState('');
  const [pendingPasteImage, setPendingPasteImage] = useState<{ img: HTMLImageElement; imageData: ImageData } | null>(null);
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState('');
  const sprite = sprites.get(spriteId);
  const activeTab = tabs.find((t) => t.id === activeTabId);

  if (!sprite) return null;

  useEffect(() => {
    setEditingTitle(sprite.name);
  }, [sprite.name]);

  const handlePaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageTypes = item.types.filter((type) => type.startsWith('image/'));
        if (imageTypes.length > 0) {
          const blob = await item.getType(imageTypes[0]);
          const img = new Image();
          const url = URL.createObjectURL(blob);
          
          img.onload = () => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const ctx = tempCanvas.getContext('2d');
            if (!ctx) return;
            
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            
            if (img.width > sprite.width || img.height > sprite.height) {
              setPendingPasteImage({ img, imageData });
              setShowPasteDialog(true);
              URL.revokeObjectURL(url);
              return;
            }

            pasteImageToLayer(imageData, img.width, img.height, false);
            URL.revokeObjectURL(url);
          };
          
          img.src = url;
          break;
        }
      }
    } catch (err) {
      console.error('Paste failed:', err);
    }
  };

  const pasteImageToLayer = (imageData: ImageData, imgWidth: number, imgHeight: number, resizeCanvas: boolean) => {
    const targetWidth = resizeCanvas ? Math.max(sprite.width, imgWidth) : sprite.width;
    const targetHeight = resizeCanvas ? Math.max(sprite.height, imgHeight) : sprite.height;
    if (resizeCanvas) {
      handleResizeCanvas(targetWidth, targetHeight);
    }

    const newLayerId = `layer-${Date.now()}`;
    const { setActiveLayer, setSelection } = useAppStore.getState();
    
    addLayer(spriteId, {
      id: newLayerId,
      name: 'Pasted Image',
      visible: true,
      opacity: 100,
      pixels: new Map(),
      locked: false,
    });
    
    setActiveLayer(spriteId, newLayerId);
    
    const pastedSelection = new Set<string>();
    for (let y = 0; y < Math.min(imgHeight, targetHeight); y++) {
      for (let x = 0; x < Math.min(imgWidth, targetWidth); x++) {
        const idx = (y * imgWidth + x) * 4;
        const r = imageData.data[idx];
        const g = imageData.data[idx + 1];
        const b = imageData.data[idx + 2];
        const a = imageData.data[idx + 3];
        
        if (a > 0) {
          const color = `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
          setPixel(spriteId, newLayerId, x, y, color);
          pastedSelection.add(`${x},${y}`);
        }
      }
    }
    
    if (pastedSelection.size > 0) {
      setSelection(pastedSelection, {
        x: 0,
        y: 0,
        width: Math.min(imgWidth, targetWidth),
        height: Math.min(imgHeight, targetHeight),
      });
    }
  };

  useImperativeHandle(ref, () => ({
    handleSave,
    handleSaveAs,
    handleOpen,
    handleExport,
    handleResizeCanvas,
    handleFlipHorizontal,
    handleFlipVertical,
    handleRotate90CW,
    handleRotate90CCW,
    handleFillSelection,
    handleStrokeSelection,
    handleOutlineSelection,
    handleDuplicateSprite,
    handleTrimCanvas,
    handleSelectAll,
  }));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { isModalOpen } = useAppStore.getState();
      const modalActive = isModalOpen || !!document.querySelector('.menu-backdrop') || !!document.querySelector('.shortcuts-dialog-overlay');
      const s = getCurrentShortcuts();

      if (matchesShortcut(e, s.saveAs)) {
        e.preventDefault();
        handleSaveAs();
        return;
      }
      if (matchesShortcut(e, s.save)) {
        e.preventDefault();
        handleSave();
        return;
      }
      if (matchesShortcut(e, s.open)) {
        e.preventDefault();
        handleOpen();
        return;
      }
      if (matchesShortcut(e, s.export)) {
        e.preventDefault();
        handleExport();
        return;
      }
      if (matchesShortcut(e, s.closeAll)) {
        e.preventDefault();
        const { tabs, removeTab, setActiveTab } = useAppStore.getState();
        const modifiedTabs = tabs.filter(t => t.type !== 'home' && t.modified);
        if (modifiedTabs.length > 0) {
          if (!confirm(`Close ${modifiedTabs.length} unsaved tab(s)?`)) return;
        }
        const tabsToClose = tabs.filter(t => t.type !== 'home');
        tabsToClose.forEach(t => removeTab(t.id));
        setActiveTab('home');
        return;
      }
      if (matchesShortcut(e, s.close)) {
        e.preventDefault();
        const { activeTabId, tabs, removeTab } = useAppStore.getState();
        if (activeTabId === 'home') return;
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (activeTab?.modified) {
          if (!confirm('Close without saving?')) return;
        }
        removeTab(activeTabId);
        return;
      }
      if (matchesShortcut(e, s.exit)) {
        e.preventDefault();
        const { tabs } = useAppStore.getState();
        const modifiedTabs = tabs.filter(t => t.modified);
        if (modifiedTabs.length > 0) {
          if (!confirm('You have unsaved changes. Exit anyway?')) return;
        }
        window.close();
        return;
      }
      
      if (matchesShortcut(e, s.paste)) {
        e.preventDefault();
        const clipboard: Set<string> = (window as any)._pixoSelectionClipboard;
        if (clipboard && clipboard.size > 0) {
          if ((document as any)._pixoLastCursorPos) {
            const pos = (document as any)._pixoLastCursorPos as { x: number; y: number };
            const { sprites, setSelection } = useAppStore.getState();
            const sprite = sprites.get(spriteId);
            if (sprite) {
              const activeLayer = sprite.layers.find((l) => l.id === sprite.activeLayerId);
              if (activeLayer) {
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                clipboard.forEach((key) => {
                  const [x, y] = key.split(',').map(Number);
                  minX = Math.min(minX, x); minY = Math.min(minY, y);
                  maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
                });
                
                const pastedSelection = new Set<string>();
                clipboard.forEach((key) => {
                  const [x, y] = key.split(',').map(Number);
                  const nx = pos.x + (x - minX);
                  const ny = pos.y + (y - minY);
                  if (nx >= 0 && nx < sprite.width && ny >= 0 && ny < sprite.height) {
                    const color = activeLayer.pixels.get(key) || useAppStore.getState().primaryColor;
                    useAppStore.getState().setPixel(spriteId, activeLayer.id, nx, ny, color);
                    pastedSelection.add(`${nx},${ny}`);
                  }
                });
                
                if (pastedSelection.size > 0) {
                  const selectionWidth = maxX - minX + 1;
                  const selectionHeight = maxY - minY + 1;
                  setSelection(pastedSelection, {
                    x: pos.x,
                    y: pos.y,
                    width: selectionWidth,
                    height: selectionHeight,
                  });
                }
              }
            }
          }
          return;
        }
        handlePaste();
        return;
      }

      if (matchesShortcut(e, s.copy)) {
        e.preventDefault();
        const { selectedPixels } = useAppStore.getState();
        (window as any)._pixoSelectionClipboard = selectedPixels ? new Set(selectedPixels) : new Set();
        return;
      }
      if (matchesShortcut(e, s.cut)) {
        e.preventDefault();
        const { selectedPixels, sprites } = useAppStore.getState();
        (window as any)._pixoSelectionClipboard = selectedPixels ? new Set(selectedPixels) : new Set();
        const sprite = sprites.get(spriteId);
        if (sprite) {
          const activeLayer = sprite.layers.find((l) => l.id === sprite.activeLayerId);
          if (activeLayer) {
            selectedPixels.forEach((key) => {
              const [x, y] = key.split(',').map(Number);
              useAppStore.getState().clearPixel(spriteId, activeLayer.id, x, y);
            });
          }
        }
        return;
      }
      if (matchesShortcut(e, s.delete)) {
        e.preventDefault();
        const { selectedPixels, sprites } = useAppStore.getState();
        const sprite = sprites.get(spriteId);
        if (sprite) {
          const activeLayer = sprite.layers.find((l) => l.id === sprite.activeLayerId);
          if (activeLayer) {
            selectedPixels.forEach((key) => {
              const [x, y] = key.split(',').map(Number);
              useAppStore.getState().clearPixel(spriteId, activeLayer.id, x, y);
            });
          }
        }
        return;
      }
      
      if (matchesShortcut(e, s.undo)) {
        e.preventDefault();
        undo();
        return;
      }
      if (matchesShortcut(e, s.redo)) {
        e.preventDefault();
        redo();
        return;
      }
      
      if (matchesShortcut(e, s.selectAll)) {
        e.preventDefault();
        handleSelectAll();
        return;
      }
      if (matchesShortcut(e, s.deselect)) {
        const { clearSelection } = useAppStore.getState();
        clearSelection();
        return;
      }
      
      if (isEditingTitle) return;
      if (modalActive) return;
      
      if (matchesShortcut(e, s.flipH)) {
        e.preventDefault();
        handleFlipHorizontal();
        return;
      }
      if (matchesShortcut(e, s.flipV)) {
        e.preventDefault();
        handleFlipVertical();
        return;
      }
      if (matchesShortcut(e, s.outline)) {
        e.preventDefault();
        handleOutlineSelection();
        return;
      }
      
      if (matchesShortcut(e, s.fill)) {
        e.preventDefault();
        handleFillSelection();
        return;
      }
      if (matchesShortcut(e, s.stroke)) {
        e.preventDefault();
        handleStrokeSelection();
        return;
      }
      
      if (matchesShortcut(e, s.brush)) { e.preventDefault(); setSelectedTool('brush'); return; }
      if (matchesShortcut(e, s.pencil)) { e.preventDefault(); setSelectedTool('pencil'); return; }
      if (matchesShortcut(e, s.eraser)) { e.preventDefault(); setSelectedTool('eraser'); return; }
      if (matchesShortcut(e, s.picker)) { e.preventDefault(); setSelectedTool('picker'); return; }
      if (matchesShortcut(e, s.bucket)) { e.preventDefault(); setSelectedTool('bucket'); return; }
      if (matchesShortcut(e, s.move) && !e.shiftKey) { e.preventDefault(); setSelectedTool('move'); return; }
      if (matchesShortcut(e, s.zoom) && !e.ctrlKey) { e.preventDefault(); setSelectedTool('zoom'); return; }
      if (matchesShortcut(e, s.line)) { e.preventDefault(); setSelectedTool('line'); return; }
      if (matchesShortcut(e, s.rectangle)) { e.preventDefault(); setSelectedTool('rectangle'); return; }
      if (matchesShortcut(e, s.rectSelect)) { e.preventDefault(); setSelectedTool('rectangleSelect'); return; }
      if (matchesShortcut(e, s.quickSelect)) { e.preventDefault(); setSelectedTool('quickSelect'); return; }
      if (matchesShortcut(e, s.magicWand)) { e.preventDefault(); setSelectedTool('magicWand'); return; }
      if (matchesShortcut(e, s.ellipse) && !e.shiftKey) { e.preventDefault(); setSelectedTool('ellipse'); return; }
      if (matchesShortcut(e, s.ai) && !e.ctrlKey) { e.preventDefault(); setSelectedTool('ai'); return; }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditingTitle, setSelectedTool, undo, redo]);

  useEffect(() => {
    if (selectedTool === 'ai') {
      setShowAIDialog(true);
    }
  }, [selectedTool]);

  const handleTitleChange = () => {
    if (editingTitle.trim()) {
      const { updateSprite } = useAppStore.getState();
      updateTab(activeTab!.id, { title: editingTitle.trim() });
      updateSprite(spriteId, { name: editingTitle.trim() });
    } else {
      setEditingTitle(sprite.name);
    }
    setIsEditingTitle(false);
  };

  const handleSave = async () => {
    try {
      const api = await getElectronAPI();
      let filePath = activeTab?.filePath;

      if (!filePath) {
        const result = await api.saveFileDialog();
        if (result.canceled || !result.filePath) return;
        filePath = result.filePath;
      }

      if (!filePath.endsWith('.pix')) {
        filePath += '.pix';
      }

      const data = {
        name: sprite.name,
        width: sprite.width,
        height: sprite.height,
        backgroundColor: sprite.backgroundColor,
        layers: sprite.layers.map((layer) => ({
          id: layer.id,
          name: layer.name,
          visible: layer.visible,
          opacity: layer.opacity,
          locked: layer.locked,
          pixels: Object.fromEntries(layer.pixels),
        })),
        colorPalette: useAppStore.getState().colorPalette,
      };

      const saveResult = await api.saveFile(filePath, JSON.stringify(data, null, 2));
      
      if (saveResult.success) {
        if (activeTab) {
          updateTab(activeTab.id, { 
            modified: false, 
            filePath,
            title: sprite.name 
          });
        }
        await api.addRecentFile(filePath);
      } else {
        alert('Failed to save file: ' + saveResult.error);
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Save functionality not available');
    }
  };

  const handleSaveAs = async () => {
    try {
      const api = await getElectronAPI();
      const result = await api.saveFileDialog();
      if (result.canceled || !result.filePath) return;

      let filePath = result.filePath;
      if (!filePath.endsWith('.pix')) {
        filePath += '.pix';
      }

      const data = {
        name: sprite.name,
        width: sprite.width,
        height: sprite.height,
        backgroundColor: sprite.backgroundColor,
        layers: sprite.layers.map((layer) => ({
          id: layer.id,
          name: layer.name,
          visible: layer.visible,
          opacity: layer.opacity,
          locked: layer.locked,
          pixels: Object.fromEntries(layer.pixels),
        })),
        colorPalette: useAppStore.getState().colorPalette,
      };

      const saveResult = await api.saveFile(filePath, JSON.stringify(data, null, 2));
      
      if (saveResult.success) {
        if (activeTab) {
          updateTab(activeTab.id, { 
            modified: false, 
            filePath,
            title: sprite.name 
          });
        }
        await api.addRecentFile(filePath);
      } else {
        alert('Failed to save file: ' + saveResult.error);
      }
    } catch (error) {
      console.error('Save As failed:', error);
      alert('Save functionality not available');
    }
  };

  const handleOpen = async () => {
    try {
      const api = await getElectronAPI();
      const result = await api.openFileDialog();
      if (result.canceled || !result.filePaths || result.filePaths.length === 0) return;

      const filePath = result.filePaths[0];
      const fileResult = await api.readFile(filePath);
      
      if (!fileResult.success || !fileResult.content) {
        alert('Failed to open file');
        return;
      }

      const data = JSON.parse(fileResult.content);
      const spriteId = `sprite-${Date.now()}`;
      
      const loadedSprite = {
        ...data,
        id: spriteId,
        layers: data.layers.map((layer: any) => ({
          ...layer,
          pixels: new Map(Object.entries(layer.pixels)),
        })),
      };

      const { addSprite, addTab } = useAppStore.getState();
      addSprite(loadedSprite);
      addTab({
        id: `tab-${Date.now()}`,
        type: 'sprite',
        title: loadedSprite.name,
        spriteId,
        modified: false,
        filePath,
      });

      await api.addRecentFile(filePath);
    } catch (error) {
      console.error('Open failed:', error);
      alert('Failed to open file: ' + error);
    }
  };

  const handleExport = async () => {
    setShowExportDialog(true);
  };

  const handleExportWithSettings = async (settings: ExportSettings) => {
    setShowExportDialog(false);
    
    try {
      const api = await getElectronAPI();

      const result = await api.saveFileDialog();
      if (result.canceled || !result.filePath) return;

      let filePath = result.filePath;
      if (!filePath.endsWith('.png')) {
        filePath += '.png';
      }

      const { sprites: allSprites } = useAppStore.getState();
      const currentSprite = allSprites.get(spriteId);
      if (!currentSprite) return;

      let layersToExport = currentSprite.layers;
      
      if (settings.layerMode === 'selected') {
        layersToExport = [currentSprite.layers.find(l => l.id === currentSprite.activeLayerId)!];
      } else if (settings.layerMode === 'visible') {
        layersToExport = currentSprite.layers.filter(l => l.visible);
      }

      if (settings.sliceMode === 'whole') {
        const canvas = document.createElement('canvas');
        canvas.width = currentSprite.width;
        canvas.height = currentSprite.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (currentSprite.backgroundColor !== 'transparent') {
          ctx.fillStyle = currentSprite.backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        layersToExport.forEach((layer) => {
          const opacity = layer.opacity / 100;
          ctx.globalAlpha = opacity;

          layer.pixels.forEach((color, key) => {
            const [x, y] = key.split(',').map(Number);
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
          });
        });

        ctx.globalAlpha = 1;
        const dataUrl = canvas.toDataURL('image/png');
        const exportResult = await api.exportPNG(filePath, dataUrl);
        
        if (!exportResult.success) {
          alert('Failed to export PNG: ' + exportResult.error);
        }
      } else {
        const cellW = settings.cellWidth || 16;
        const cellH = settings.cellHeight || 16;
        const offsetX = settings.offsetX || 0;
        const offsetY = settings.offsetY || 0;

        const cols = Math.ceil((currentSprite.width - offsetX) / cellW);
        const rows = Math.ceil((currentSprite.height - offsetY) / cellH);

        //TODO - export slices in zip folder instead of exporting the first slice.
        
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const startX = offsetX + col * cellW;
            const startY = offsetY + row * cellH;
            const endX = Math.min(startX + cellW, currentSprite.width);
            const endY = Math.min(startY + cellH, currentSprite.height);

            const canvas = document.createElement('canvas');
            canvas.width = endX - startX;
            canvas.height = endY - startY;
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            if (currentSprite.backgroundColor !== 'transparent') {
              ctx.fillStyle = currentSprite.backgroundColor;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            layersToExport.forEach((layer) => {
              const opacity = layer.opacity / 100;
              ctx.globalAlpha = opacity;

              for (let x = startX; x < endX; x++) {
                for (let y = startY; y < endY; y++) {
                  const color = layer.pixels.get(`${x},${y}`);
                  if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(x - startX, y - startY, 1, 1);
                  }
                }
              }
            });

            const dataUrl = canvas.toDataURL('image/png');
            const sliceFileName = filePath.replace('.png', `_${row}_${col}.png`);
            await api.exportPNG(sliceFileName, dataUrl);
          }
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleResizeCanvas = (newWidth: number, newHeight: number) => {
    const { updateSprite } = useAppStore.getState();
    
    const newLayers = sprite.layers.map(layer => {
      const newPixels = new Map<string, string>();
      
      layer.pixels.forEach((color, key) => {
        const [x, y] = key.split(',').map(Number);
        if (x < newWidth && y < newHeight) {
          newPixels.set(key, color);
        }
      });
      
      return {
        ...layer,
        pixels: newPixels
      };
    });
    
    updateSprite(spriteId, {
      width: newWidth,
      height: newHeight,
      layers: newLayers
    });
  };

  const handleFlipHorizontal = () => {
    const { updateSprite } = useAppStore.getState();
    
    const newLayers = sprite.layers.map(layer => {
      const newPixels = new Map<string, string>();
      
      layer.pixels.forEach((color, key) => {
        const [x, y] = key.split(',').map(Number);
        const newX = sprite.width - 1 - x;
        newPixels.set(`${newX},${y}`, color);
      });
      
      return {
        ...layer,
        pixels: newPixels
      };
    });
    
    updateSprite(spriteId, { layers: newLayers });
  };

  const handleFlipVertical = () => {
    const { updateSprite } = useAppStore.getState();
    
    const newLayers = sprite.layers.map(layer => {
      const newPixels = new Map<string, string>();
      
      layer.pixels.forEach((color, key) => {
        const [x, y] = key.split(',').map(Number);
        const newY = sprite.height - 1 - y;
        newPixels.set(`${x},${newY}`, color);
      });
      
      return {
        ...layer,
        pixels: newPixels
      };
    });
    
    updateSprite(spriteId, { layers: newLayers });
  };

  const handleRotate90CW = () => {
    const { updateSprite } = useAppStore.getState();
    
    const newLayers = sprite.layers.map(layer => {
      const newPixels = new Map<string, string>();
      
      layer.pixels.forEach((color, key) => {
        const [x, y] = key.split(',').map(Number);
        const newX = sprite.height - 1 - y;
        const newY = x;
        newPixels.set(`${newX},${newY}`, color);
      });
      
      return {
        ...layer,
        pixels: newPixels
      };
    });
    
    updateSprite(spriteId, {
      width: sprite.height,
      height: sprite.width,
      layers: newLayers
    });
  };

  const handleRotate90CCW = () => {
    const { updateSprite } = useAppStore.getState();
    
    const newLayers = sprite.layers.map(layer => {
      const newPixels = new Map<string, string>();
      
      layer.pixels.forEach((color, key) => {
        const [x, y] = key.split(',').map(Number);
        const newX = y;
        const newY = sprite.width - 1 - x;
        newPixels.set(`${newX},${newY}`, color);
      });
      
      return {
        ...layer,
        pixels: newPixels
      };
    });
    
    updateSprite(spriteId, {
      width: sprite.height,
      height: sprite.width,
      layers: newLayers
    });
  };

  const handleFillSelection = () => {
    const { selectedPixels, sprites, primaryColor } = useAppStore.getState();
    if (selectedPixels.size === 0) return;
    
    const sprite = sprites.get(spriteId);
    if (!sprite) return;
    
    const activeLayer = sprite.layers.find(l => l.id === sprite.activeLayerId);
    if (!activeLayer || activeLayer.locked) return;
    
    selectedPixels.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      setPixel(spriteId, activeLayer.id, x, y, primaryColor);
    });
  };

  const handleStrokeSelection = () => {
    const { selectedPixels, selectionBounds, sprites, primaryColor } = useAppStore.getState();
    if (!selectionBounds || selectedPixels.size === 0) return;
    
    const sprite = sprites.get(spriteId);
    if (!sprite) return;
    
    const activeLayer = sprite.layers.find(l => l.id === sprite.activeLayerId);
    if (!activeLayer || activeLayer.locked) return;
    
    const { x: minX, y: minY, width, height } = selectionBounds;
    const maxX = minX + width - 1;
    const maxY = minY + height - 1;
    
    selectedPixels.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      const isEdge = x === minX || x === maxX || y === minY || y === maxY;
      if (isEdge) {
        setPixel(spriteId, activeLayer.id, x, y, primaryColor);
      }
    });
  };

  const handleOutlineSelection = () => {
    const { selectedPixels, sprites, primaryColor } = useAppStore.getState();
    if (selectedPixels.size === 0) return;
    
    const sprite = sprites.get(spriteId);
    if (!sprite) return;
    
    const activeLayer = sprite.layers.find(l => l.id === sprite.activeLayerId);
    if (!activeLayer || activeLayer.locked) return;
    
    const outline = new Set<string>();
    
    selectedPixels.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      const neighbors = [
        [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
      ];
      
      neighbors.forEach(([nx, ny]) => {
        const neighborKey = `${nx},${ny}`;
        if (!selectedPixels.has(neighborKey) && nx >= 0 && nx < sprite.width && ny >= 0 && ny < sprite.height) {
          outline.add(neighborKey);
        }
      });
    });
    
    outline.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      setPixel(spriteId, activeLayer.id, x, y, primaryColor);
    });
  };

  const handleDuplicateSprite = () => {
    const { addSprite, addTab } = useAppStore.getState();
    const newSpriteId = `sprite-${Date.now()}`;
    
    const newSprite = {
      ...sprite,
      id: newSpriteId,
      name: `${sprite.name} Copy`,
      layers: sprite.layers.map(layer => ({
        ...layer,
        id: `layer-${Date.now()}-${Math.random()}`,
        pixels: new Map(layer.pixels)
      }))
    };
    
    addSprite(newSprite);
    addTab({
      id: `tab-${Date.now()}`,
      type: 'sprite' as const,
      title: newSprite.name,
      spriteId: newSpriteId,
      modified: false
    });
  };

  const handleTrimCanvas = () => {
    const { updateSprite } = useAppStore.getState();
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasPixels = false;
    
    sprite.layers.forEach(layer => {
      layer.pixels.forEach((_, key) => {
        hasPixels = true;
        const [x, y] = key.split(',').map(Number);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      });
    });
    
    if (!hasPixels) return;
    
    const newWidth = maxX - minX + 1;
    const newHeight = maxY - minY + 1;
    
    const newLayers = sprite.layers.map(layer => {
      const newPixels = new Map<string, string>();
      
      layer.pixels.forEach((color, key) => {
        const [x, y] = key.split(',').map(Number);
        newPixels.set(`${x - minX},${y - minY}`, color);
      });
      
      return {
        ...layer,
        pixels: newPixels
      };
    });
    
    updateSprite(spriteId, {
      width: newWidth,
      height: newHeight,
      layers: newLayers
    });
  };

  const handleSelectAll = () => {
    const { setSelection } = useAppStore.getState();
    const allPixels = new Set<string>();
    
    for (let y = 0; y < sprite.height; y++) {
      for (let x = 0; x < sprite.width; x++) {
        allPixels.add(`${x},${y}`);
      }
    }
    
    setSelection(allPixels, {
      x: 0,
      y: 0,
      width: sprite.width,
      height: sprite.height
    });
  };

  const handleAIGenerate = async (prompt: string) => {
    setAIError('');
    setAILoading(true);
    
    try {
      const apiKey = getStoredAPIKey();
      if (!apiKey) {
        setAIError('');
        setApiKeyMessage('No API key found. Please enter your OpenAI API key to use image generation.');
        setShowAPIKeyDialog(true);
        setShowAIDialog(false);
        setAILoading(false);
        return;
      }

      const enhancedPrompt = `${prompt}. Important: Generate ${sprite.width}x${sprite.height} resolution image.`;

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          n: 1,
          model: 'dall-e-3',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || response.statusText;
        if (response.status === 401) {
          setAIError('');
          setApiKeyMessage('Invalid API key. Please enter a valid OpenAI API key.');
          setShowAPIKeyDialog(true);
          setShowAIDialog(false);
        } else {
          throw new Error(errorMessage);
        }
        setAILoading(false);
        return;
      }

      const data = await response.json();
      const imageUrl = data.data[0].url;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = sprite.width;
        tempCanvas.height = sprite.height;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;

        const scale = Math.min(sprite.width / img.width, sprite.height / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetX = (sprite.width - scaledWidth) / 2;
        const offsetY = (sprite.height - scaledHeight) / 2;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
        const imageData = ctx.getImageData(0, 0, sprite.width, sprite.height);

        pasteImageToLayer(imageData, sprite.width, sprite.height, false);
        setShowAIDialog(false);
        setAILoading(false);
      };
      img.onerror = () => {
        setAIError('Failed to load generated image');
        setAILoading(false);
      };
      img.src = imageUrl;
    } catch (error) {
      console.error('AI generation failed:', error);
      setAIError(error instanceof Error ? error.message : 'Failed to generate image. Please try again.');
      setAILoading(false);
    }
  };

  const handleSetAPIKey = (key: string) => {
    setStoredAPIKey(key);
    setShowAPIKeyDialog(false);

    if (selectedTool === 'ai') {
      setShowAIDialog(true);
    }
  };

  const handlePasteDialogCrop = () => {
    if (pendingPasteImage) {
      pasteImageToLayer(pendingPasteImage.imageData, pendingPasteImage.img.width, pendingPasteImage.img.height, false);
      setPendingPasteImage(null);
      setShowPasteDialog(false);
    }
  };

  const handlePasteDialogResize = () => {
    if (pendingPasteImage) {
      pasteImageToLayer(pendingPasteImage.imageData, pendingPasteImage.img.width, pendingPasteImage.img.height, true);
      setPendingPasteImage(null);
      setShowPasteDialog(false);
    }
  };

  return (
    <div className="sprite-editor">
      {showAPIKeyDialog && (
        <APIKeyDialog
          onConfirm={handleSetAPIKey}
          onCancel={() => {
            setShowAPIKeyDialog(false);
            setApiKeyMessage('');
          }}
          message={apiKeyMessage}
        />
      )}
      {showAIDialog && (
        <AIPromptDialog
          onConfirm={handleAIGenerate}
          onCancel={() => {
            setShowAIDialog(false);
            setAIError('');
            setAILoading(false);
          }}
          isLoading={aiLoading}
          errorMessage={aiError}
        />
      )}
      {showPasteDialog && pendingPasteImage && (
        <PasteImageDialog
          imageWidth={pendingPasteImage.img.width}
          imageHeight={pendingPasteImage.img.height}
          canvasWidth={sprite.width}
          canvasHeight={sprite.height}
          onCrop={handlePasteDialogCrop}
          onResizeCanvas={handlePasteDialogResize}
          onCancel={() => {
            setPendingPasteImage(null);
            setShowPasteDialog(false);
          }}
        />
      )}
      {showExportDialog && (
        <ExportDialog
          onConfirm={handleExportWithSettings}
          onCancel={() => setShowExportDialog(false)}
        />
      )}
      <div className="sprite-editor-header">
        <div className="sprite-info">
          {isEditingTitle ? (
            <input
              type="text"
              className="sprite-name-input"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={handleTitleChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleChange();
                if (e.key === 'Escape') {
                  setIsEditingTitle(false);
                  setEditingTitle(sprite.name);
                }
              }}
              autoFocus
            />
          ) : (
            <span
              className="sprite-name"
              onClick={() => setIsEditingTitle(true)}
              title="Click to edit sprite name"
            >
              {sprite.name}
            </span>
          )}
          <span className="sprite-dimensions">
            {sprite.width} × {sprite.height}
          </span>
        </div>
        <ToolOptions />
        <div className="sprite-actions">
          <button className="header-button icon-only" onClick={handleSave} title="Save (Ctrl+S)">
            <FiSave size={18} />
          </button>
          <button className="header-button icon-only" onClick={handleExport} title="Export as PNG">
            <FiDownload size={18} />
          </button>
        </div>
      </div>

      <div className="sprite-editor-content">
        <Toolbar style={{ width: toolbarWidth }} />
        
        <div className="sprite-editor-center">
          <Canvas spriteId={spriteId} />
          
          <ResizeHandle 
            direction="horizontal" 
            onResize={(delta) => setLeftPanelWidth(Math.max(180, Math.min(400, leftPanelWidth - delta)))}
          />
          
          <div className="left-panel" style={{ width: leftPanelWidth }}>
            <div style={{ height: colorPanelHeight, overflow: 'hidden' }}>
              <ColorsView style={{ width: '100%', height: '100%' }} />
            </div>
            
            <ResizeHandle 
              direction="vertical" 
              onResize={(delta) => setColorPanelHeight(Math.max(120, Math.min(400, colorPanelHeight + delta)))}
            />
            
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <LayerPanel spriteId={spriteId} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
          
          {showPreview && <PreviewPanel spriteId={spriteId} />}
        </div>
      </div>
    </div>
  );
}

export default forwardRef(SpriteEditor);
