import { create } from 'zustand';
import { AppState, Sprite, Tab, Layer, Tool, ToolOptions } from '../types';

const DEFAULT_PALETTE = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#808080', '#C0C0C0',
  '#FFA500', '#A52A2A', '#DEB887', '#5F9EA0', '#7FFF00', '#D2691E', '#FF7F50', '#6495ED',
];

export const useAppStore = create<AppState>((set, get) => ({
  tabs: [
    {
      id: 'home',
      type: 'home',
      title: 'Home',
      modified: false,
    },
  ],
  activeTabId: 'home',
  sprites: new Map(),
  selectedTool: 'brush',
  toolOptions: {
    brushSize: 1,
    lineWidth: 1,
    shapeOutline: true,
    shapeFill: false,
  },
  primaryColor: '#000000',
  secondaryColor: '#FFFFFF',
  colorPalette: DEFAULT_PALETTE,
  zoom: 10,
  showGrid: true,
  gridColor: '#000000',
  gridSize: 16,
  gridOpacity: 1.0,
  showPreview: true,

  //UI State
  isModalOpen: false,
  
  // Selection state
  selectedPixels: new Set<string>(),
  selectionBounds: null as { x: number; y: number; width: number; height: number } | null,
  
  // History state
  history: [],
  historyIndex: -1,

  // Tab actions
  addTab: (tab: Tab) => {
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id,
    }));
  },

  removeTab: (tabId: string) => {
    set((state) => {
      const tabs = state.tabs.filter((t) => t.id !== tabId);
      let activeTabId = state.activeTabId;
      
      if (activeTabId === tabId) {
        const index = state.tabs.findIndex((t) => t.id === tabId);
        if (index > 0) {
          activeTabId = tabs[index - 1].id;
        } else if (tabs.length > 0) {
          activeTabId = tabs[0].id;
        }
      }
      
      const tab = state.tabs.find((t) => t.id === tabId);
      if (tab?.spriteId) {
        const sprites = new Map(state.sprites);
        sprites.delete(tab.spriteId);
        return { tabs, activeTabId, sprites };
      }
      
      return { tabs, activeTabId };
    });
  },

  setActiveTab: (tabId: string) => {
    set({ activeTabId: tabId });
  },

  updateTab: (tabId: string, updates: Partial<Tab>) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, ...updates } : tab
      ),
    }));
  },

  reorderTabs: (tabIds: string[]) => {
    set((state) => {
      const tabs = tabIds
        .map((id) => state.tabs.find((t) => t.id === id))
        .filter((t): t is Tab => t !== undefined);
      return { tabs };
    });
  },

  // Sprite actions
  addSprite: (sprite: Sprite) => {
    set((state) => {
      const sprites = new Map(state.sprites);
      sprites.set(sprite.id, sprite);
      return { sprites };
    });
  },

  updateSprite: (spriteId: string, updates: Partial<Sprite>) => {
    set((state) => {
      const sprites = new Map(state.sprites);
      const sprite = sprites.get(spriteId);
      if (sprite) {
        sprites.set(spriteId, { ...sprite, ...updates });
      }
      return { sprites };
    });
  },

  removeSprite: (spriteId: string) => {
    set((state) => {
      const sprites = new Map(state.sprites);
      sprites.delete(spriteId);
      return { sprites };
    });
  },

  // Tool actions
  setSelectedTool: (tool: Tool) => {
    set({ selectedTool: tool });
  },

  setToolOptions: (options: Partial<ToolOptions>) => {
    set((state) => ({
      toolOptions: { ...state.toolOptions, ...options },
    }));
  },

  setPrimaryColor: (color: string) => {
    set({ primaryColor: color });
  },

  setSecondaryColor: (color: string) => {
    set({ secondaryColor: color });
  },

  swapColors: () => {
    set((state) => ({
      primaryColor: state.secondaryColor,
      secondaryColor: state.primaryColor,
    }));
  },

  addColorToPalette: (color: string) => {
    set((state) => {
      if (!state.colorPalette.includes(color)) {
        return { colorPalette: [...state.colorPalette, color] };
      }
      return state;
    });
  },

  setGridSize: (size: number) => {
    set({ gridSize: size });
  },

  setGridColor: (color: string) => {
    set({ gridColor: color });
  },

  setGridOpacity: (opacity: number) => {
    set({ gridOpacity: opacity });
  },

  setZoom: (zoom: number) => {
    set({ zoom });
  },

  setShowGrid: (show: boolean) => {
    set({ showGrid: show });
  },

  setShowPreview: (show: boolean) => {
    set({ showPreview: show });
  },

  // UI modal actions
  setModalOpen: (open: boolean) => {
    set({ isModalOpen: open });
  },

  // Layer actions
  addLayer: (spriteId: string, layer: Layer) => {
    set((state) => {
      const sprites = new Map(state.sprites);
      const sprite = sprites.get(spriteId);
      if (sprite) {
        sprites.set(spriteId, {
          ...sprite,
          layers: [...sprite.layers, layer],
          activeLayerId: layer.id,
        });
      }
      return { sprites };
    });
  },

  removeLayer: (spriteId: string, layerId: string) => {
    set((state) => {
      const sprites = new Map(state.sprites);
      const sprite = sprites.get(spriteId);
      if (sprite && sprite.layers.length > 1) {
        const layers = sprite.layers.filter((l) => l.id !== layerId);
        const activeLayerId = sprite.activeLayerId === layerId 
          ? layers[0].id 
          : sprite.activeLayerId;
        sprites.set(spriteId, { ...sprite, layers, activeLayerId });
      }
      return { sprites };
    });
  },

  updateLayer: (spriteId: string, layerId: string, updates: Partial<Layer>) => {
    set((state) => {
      const sprites = new Map(state.sprites);
      const sprite = sprites.get(spriteId);
      if (sprite) {
        const layers = sprite.layers.map((layer) =>
          layer.id === layerId ? { ...layer, ...updates } : layer
        );
        sprites.set(spriteId, { ...sprite, layers });
      }
      return { sprites };
    });
  },

  setActiveLayer: (spriteId: string, layerId: string) => {
    set((state) => {
      const sprites = new Map(state.sprites);
      const sprite = sprites.get(spriteId);
      if (sprite) {
        sprites.set(spriteId, { ...sprite, activeLayerId: layerId });
      }
      return { sprites };
    });
  },

  reorderLayers: (spriteId: string, layerIds: string[]) => {
    set((state) => {
      const sprites = new Map(state.sprites);
      const sprite = sprites.get(spriteId);
      if (sprite) {
        const layers = layerIds
          .map((id) => sprite.layers.find((l) => l.id === id))
          .filter((l): l is Layer => l !== undefined);
        sprites.set(spriteId, { ...sprite, layers });
      }
      return { sprites };
    });
  },

  // Drawing actions
  setPixel: (spriteId: string, layerId: string, x: number, y: number, color: string) => {
    set((state) => {
      const sprites = new Map(state.sprites);
      const sprite = sprites.get(spriteId);
      if (sprite) {
        const layers = sprite.layers.map((layer) => {
          if (layer.id === layerId && !layer.locked) {
            const pixels = new Map(layer.pixels);
            pixels.set(`${x},${y}`, color);
            return { ...layer, pixels };
          }
          return layer;
        });
        sprites.set(spriteId, { ...sprite, layers });
      }
      return { sprites };
    });
  },

  clearPixel: (spriteId: string, layerId: string, x: number, y: number) => {
    set((state) => {
      const sprites = new Map(state.sprites);
      const sprite = sprites.get(spriteId);
      if (sprite) {
        const layers = sprite.layers.map((layer) => {
          if (layer.id === layerId && !layer.locked) {
            const pixels = new Map(layer.pixels);
            pixels.delete(`${x},${y}`);
            return { ...layer, pixels };
          }
          return layer;
        });
        sprites.set(spriteId, { ...sprite, layers });
      }
      return { sprites };
    });
  },

  fillArea: (spriteId: string, layerId: string, startX: number, startY: number, fillColor: string) => {
    const state = get();
    const sprite = state.sprites.get(spriteId);
    if (!sprite) return;

    const layer = sprite.layers.find((l) => l.id === layerId);
    if (!layer || layer.locked) return;

    const targetColor = layer.pixels.get(`${startX},${startY}`) || 'transparent';
    if (targetColor === fillColor) return;

    const pixels = new Map(layer.pixels);
    const stack: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      if (x < 0 || x >= sprite.width || y < 0 || y >= sprite.height) continue;

      const currentColor = pixels.get(key) || 'transparent';
      if (currentColor !== targetColor) continue;

      visited.add(key);
      pixels.set(key, fillColor);

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    set((state) => {
      const sprites = new Map(state.sprites);
      const sprite = sprites.get(spriteId);
      if (sprite) {
        const layers = sprite.layers.map((l) =>
          l.id === layerId ? { ...l, pixels } : l
        );
        sprites.set(spriteId, { ...sprite, layers });
      }
      return { sprites };
    });
  },
  
  // History actions
  pushHistory: (spriteId: string, layerId: string, pixels: Map<string, string>) => {
    set((state) => {
      const history = state.history.slice(0, state.historyIndex + 1);
      
      history.push({
        spriteId,
        layerId,
        pixels: new Map(pixels),
        timestamp: Date.now(),
      });
      
      const maxHistory = 50;
      if (history.length > maxHistory) {
        history.shift();
        return { history, historyIndex: history.length - 1 };
      }
      
      return { history, historyIndex: history.length - 1 };
    });
  },

  // Selection actions
  setSelection: (selectedPixels: Set<string>, bounds: { x: number; y: number; width: number; height: number } | null) => {
    set({ selectedPixels, selectionBounds: bounds });
  },

  clearSelection: () => {
    set({ selectedPixels: new Set<string>(), selectionBounds: null });
  },

  addToSelection: (x: number, y: number) => {
    set((state) => {
      const selectedPixels = new Set(state.selectedPixels);
      selectedPixels.add(`${x},${y}`);
      return { selectedPixels };
    });
  },

  removeFromSelection: (x: number, y: number) => {
    set((state) => {
      const selectedPixels = new Set(state.selectedPixels);
      selectedPixels.delete(`${x},${y}`);
      return { selectedPixels };
    });
  },

  invertSelection: (spriteId: string) => {
    const state = get();
    const sprite = state.sprites.get(spriteId);
    if (!sprite) return;

    const allPixels = new Set<string>();
    sprite.layers.forEach((layer) => {
      if (layer.visible) {
        layer.pixels.forEach((_, key) => {
          allPixels.add(key);
        });
      }
    });

    const newSelection = new Set<string>();
    allPixels.forEach((key) => {
      if (!state.selectedPixels.has(key)) {
        newSelection.add(key);
      }
    });

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    newSelection.forEach((key) => {
      const [x, y] = key.split(',').map(Number);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });

    const bounds = newSelection.size > 0
      ? { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
      : null;

    set({ selectedPixels: newSelection, selectionBounds: bounds });
  },
  
  undo: () => {
    const state = get();
    if (state.historyIndex < 0) return;
    
    const entry = state.history[state.historyIndex];
    const sprite = state.sprites.get(entry.spriteId);
    if (!sprite) return;
    
    set((state) => {
      const sprites = new Map(state.sprites);
      const sprite = sprites.get(entry.spriteId);
      if (sprite) {
        const layers = sprite.layers.map((layer) =>
          layer.id === entry.layerId
            ? { ...layer, pixels: new Map(entry.pixels) }
            : layer
        );
        sprites.set(entry.spriteId, { ...sprite, layers });
      }
      return { sprites, historyIndex: state.historyIndex - 1 };
    });
  },
  
  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;
    
    const nextIndex = state.historyIndex + 1;
    const entry = state.history[nextIndex];
    const sprite = state.sprites.get(entry.spriteId);
    if (!sprite) return;
    
    set({ historyIndex: nextIndex });
  },
}));
