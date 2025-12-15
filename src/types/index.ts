// Tool types
export type Tool = 
  | 'brush' 
  | 'pencil'
  | 'colorReplace'
  | 'eraser'
  | 'magicEraser'
  | 'picker' 
  | 'bucket' 
  | 'line' 
  | 'rectangle' 
  | 'circle' 
  | 'ellipse'
  | 'move'
  | 'zoom'
  | 'rectangleSelect'
  | 'quickSelect'
  | 'magicWand'
  | 'ai';

// Layer type
export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  pixels: Map<string, string>;
  locked: boolean;
}

// Sprite type
export interface Sprite {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  layers: Layer[];
  activeLayerId: string;
}

// Tab type
export type TabType = 'home' | 'sprite';

export interface Tab {
  id: string;
  type: TabType;
  title: string;
  spriteId?: string;
  modified: boolean;
  filePath?: string;
}

// Tool options
export interface ToolOptions {
  brushSize: number;
  lineWidth: number;
  shapeOutline: boolean;
  shapeFill: boolean;
}

// History entry for undo/redo
export interface HistoryEntry {
  spriteId: string;
  layerId: string;
  pixels: Map<string, string>;
  timestamp: number;
}

// App state
export interface AppState {
  // Tabs
  tabs: Tab[];
  activeTabId: string;
  
  // Sprites
  sprites: Map<string, Sprite>;
  
  // Tool state
  selectedTool: Tool;
  toolOptions: ToolOptions;
  primaryColor: string;
  secondaryColor: string;
  colorPalette: string[];
  
  // Canvas state
  zoom: number;
  showGrid: boolean;
  gridColor: string;
  gridSize: number;
  gridOpacity: number;
  showPreview: boolean;
  // UI state
  isModalOpen: boolean;
  
  // Selection state
  selectedPixels: Set<string>;
  selectionBounds: { x: number; y: number; width: number; height: number } | null;
  
  // History state
  history: HistoryEntry[];
  historyIndex: number;
  
  // Actions
  addTab: (tab: Tab) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  reorderTabs: (tabIds: string[]) => void;
  
  addSprite: (sprite: Sprite) => void;
  updateSprite: (spriteId: string, updates: Partial<Sprite>) => void;
  removeSprite: (spriteId: string) => void;
  
  setSelectedTool: (tool: Tool) => void;
  setToolOptions: (options: Partial<ToolOptions>) => void;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  swapColors: () => void;
  addColorToPalette: (color: string) => void;
  
  setGridSize: (size: number) => void;
  setGridColor: (color: string) => void;
  setGridOpacity: (opacity: number) => void;
  
  setZoom: (zoom: number) => void;
  setShowGrid: (show: boolean) => void;
  setShowPreview: (show: boolean) => void;
  // UI modal
  setModalOpen: (open: boolean) => void;
  
  // Selection actions
  setSelection: (selectedPixels: Set<string>, bounds: { x: number; y: number; width: number; height: number } | null) => void;
  clearSelection: () => void;
  addToSelection: (x: number, y: number) => void;
  removeFromSelection: (x: number, y: number) => void;
  invertSelection: (spriteId: string) => void;
  
  // Layer actions
  addLayer: (spriteId: string, layer: Layer) => void;
  removeLayer: (spriteId: string, layerId: string) => void;
  updateLayer: (spriteId: string, layerId: string, updates: Partial<Layer>) => void;
  setActiveLayer: (spriteId: string, layerId: string) => void;
  reorderLayers: (spriteId: string, layerIds: string[]) => void;
  
  // Drawing actions
  setPixel: (spriteId: string, layerId: string, x: number, y: number, color: string) => void;
  clearPixel: (spriteId: string, layerId: string, x: number, y: number) => void;
  fillArea: (spriteId: string, layerId: string, x: number, y: number, color: string) => void;
  
  // History actions
  undo: () => void;
  redo: () => void;
  pushHistory: (spriteId: string, layerId: string, pixels: Map<string, string>) => void;
}
