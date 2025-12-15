
import { useAppStore } from '../store/appStore';
import { getElectronAPI } from '../utils/electronAPI';
import { Sprite, Layer, Tab } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface MenuAction {
  id: string;
  label: string;
  shortcut?: string;
  category: string;
  disabled?: boolean;
  checked?: boolean;
  separator?: boolean;
  submenu?: MenuAction[];
}

export async function handleNewSprite(width: number, height: number, name: string) {
  const { addSprite, addTab, setActiveTab } = useAppStore.getState();
  
  const spriteId = uuidv4();
  const defaultLayer: Layer = {
    id: uuidv4(),
    name: 'Layer 1',
    visible: true,
    opacity: 100,
    pixels: new Map<string, string>(),
    locked: false,
  };

  addSprite({
    id: spriteId,
    name,
    width,
    height,
    backgroundColor: '#FFFFFF',
    layers: [defaultLayer],
    activeLayerId: defaultLayer.id,
  });

  const newTab: Tab = {
    id: uuidv4(),
    type: 'sprite',
    title: name,
    spriteId,
    modified: false,
  };

  addTab(newTab);
  setActiveTab(newTab.id);
}

export async function handleOpen() {
  const { addSprite, addTab, setActiveTab } = useAppStore.getState();
  
  try {
    const api = await getElectronAPI();
    const result = await api.openFileDialog();
    
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return;
    }

    const filePath = result.filePaths[0];
    const fileResult = await api.readFile(filePath);
    
    if (!fileResult.success || !fileResult.content) {
      alert('Failed to open file');
      return;
    }

    const data = JSON.parse(fileResult.content);
    const spriteId = uuidv4();
    
    const sprite: Sprite = {
      ...data,
      id: spriteId,
      layers: data.layers.map((layer: any) => ({
        ...layer,
        pixels: new Map(Object.entries(layer.pixels)),
      })),
    };

    addSprite(sprite);
    const newTab: Tab = {
      id: uuidv4(),
      type: 'sprite',
      title: sprite.name,
      spriteId,
      modified: false,
      filePath,
    };
    addTab(newTab);
    setActiveTab(newTab.id);
    
    await api.addRecentFile(filePath);
  } catch (error) {
    console.error('Open failed:', error);
    alert('Failed to open file');
  }
}

export async function handleSave(currentSpriteId?: string, currentTabId?: string) {
  if (!currentSpriteId || !currentTabId) return;
  
  const { sprites, tabs, updateTab } = useAppStore.getState();
  const sprite = sprites.get(currentSpriteId);
  const tab = tabs.find(t => t.id === currentTabId);
  
  if (!sprite) return;
  
  try {
    const api = await getElectronAPI();
    let filePath = tab?.filePath;

    if (!filePath) {
      return await handleSaveAs(currentSpriteId, currentTabId);
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
      updateTab(currentTabId, { 
        modified: false, 
        filePath,
        title: sprite.name 
      });
      await api.addRecentFile(filePath);
    } else {
      alert('Failed to save file: ' + saveResult.error);
    }
  } catch (error) {
    console.error('Save failed:', error);
  }
}

export async function handleSaveAs(currentSpriteId?: string, currentTabId?: string) {
  if (!currentSpriteId || !currentTabId) return;
  
  const { sprites, updateTab } = useAppStore.getState();
  const sprite = sprites.get(currentSpriteId);
  
  if (!sprite) return;
  
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
      updateTab(currentTabId, { 
        modified: false, 
        filePath,
        title: sprite.name 
      });
      await api.addRecentFile(filePath);
    } else {
      alert('Failed to save file: ' + saveResult.error);
    }
  } catch (error) {
    console.error('Save as failed:', error);
  }
}

export function handleCloseTab(tabId?: string) {
  if (!tabId || tabId === 'home') return;
  
  const { tabs, removeTab } = useAppStore.getState();
  const tab = tabs.find(t => t.id === tabId);
  
  if (tab?.modified) {
    if (!confirm('You have unsaved changes. Are you sure you want to close this tab?')) {
      return;
    }
  }
  
  removeTab(tabId);
}

export function handleCloseAllTabs() {
  const { tabs, removeTab } = useAppStore.getState();
  const hasModified = tabs.some(t => t.type !== 'home' && t.modified);
  
  if (hasModified) {
    if (!confirm('You have unsaved changes. Are you sure you want to close all tabs?')) {
      return;
    }
  }
  
  tabs.forEach(tab => {
    if (tab.type !== 'home') {
      removeTab(tab.id);
    }
  });
}

export async function handleExit() {
  const { tabs } = useAppStore.getState();
  const hasModified = tabs.some(t => t.modified);
  
  if (hasModified) {
    if (!confirm('You have unsaved changes. Are you sure you want to exit?')) {
      return;
    }
  }
  
  window.close();
}

// Selection operations
export function handleSelectAll(currentSpriteId?: string) {
  if (!currentSpriteId) return;
  
  const { sprites, setSelection } = useAppStore.getState();
  const sprite = sprites.get(currentSpriteId);
  if (!sprite) return;
  
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
}

export function handleDeselect() {
  const { clearSelection } = useAppStore.getState();
  clearSelection();
}

// Sprite operations
export function handleDuplicateSprite(currentSpriteId?: string) {
  if (!currentSpriteId) return;
  
  const { sprites, addSprite, addTab, setActiveTab } = useAppStore.getState();
  const sprite = sprites.get(currentSpriteId);
  if (!sprite) return;
  
  const newSpriteId = uuidv4();
  const newSprite: Sprite = {
    ...sprite,
    id: newSpriteId,
    name: sprite.name + ' Copy',
    layers: sprite.layers.map(layer => ({
      ...layer,
      id: uuidv4(),
      pixels: new Map(layer.pixels)
    }))
  };
  
  addSprite(newSprite);
  
  const newTab: Tab = {
    id: uuidv4(),
    type: 'sprite',
    title: newSprite.name,
    spriteId: newSpriteId,
    modified: false,
  };
  
  addTab(newTab);
  setActiveTab(newTab.id);
}

export function handleTrimCanvas(currentSpriteId?: string) {
  if (!currentSpriteId) return;
  
  const { sprites, updateSprite } = useAppStore.getState();
  const sprite = sprites.get(currentSpriteId);
  if (!sprite) return;
  
  // Find the bounds of all non-transparent pixels
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let hasPixels = false;
  
  sprite.layers.forEach(layer => {
    layer.pixels.forEach((_, key) => {
      const [x, y] = key.split(',').map(Number);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      hasPixels = true;
    });
  });
  
  if (!hasPixels || minX === 0 && minY === 0 && maxX === sprite.width - 1 && maxY === sprite.height - 1) {
    alert('Nothing to trim');
    return;
  }
  
  const newWidth = maxX - minX + 1;
  const newHeight = maxY - minY + 1;
  
  const newLayers = sprite.layers.map(layer => {
    const newPixels = new Map<string, string>();
    layer.pixels.forEach((color, key) => {
      const [x, y] = key.split(',').map(Number);
      newPixels.set(`${x - minX},${y - minY}`, color);
    });
    return { ...layer, pixels: newPixels };
  });
  
  updateSprite(currentSpriteId, {
    width: newWidth,
    height: newHeight,
    layers: newLayers
  });
}
