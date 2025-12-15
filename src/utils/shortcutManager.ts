// Keyboard shortcut management system

export interface ShortcutDefinition {
  id: string;
  category: string;
  description: string;
  defaultKeys: string;
  action: () => void;
  condition?: () => boolean;
}

export interface ShortcutRegistry {
  [id: string]: ShortcutDefinition;
}

const STORAGE_KEY = 'pixo-keyboard-shortcuts';

export const DEFAULT_SHORTCUTS: Record<string, string> = {
  // File
  new: 'Ctrl+N',
  open: 'Ctrl+O',
  save: 'Ctrl+S',
  saveAs: 'Ctrl+Shift+S',
  close: 'Ctrl+W',
  closeAll: 'Ctrl+Shift+W',
  export: 'Ctrl+E',
  exit: 'Ctrl+Q',
  // Edit
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Y',
  cut: 'Ctrl+X',
  copy: 'Ctrl+C',
  paste: 'Ctrl+V',
  delete: 'Delete',
  fill: 'F',
  stroke: 'S',
  flipH: 'Shift+H',
  flipV: 'Shift+V',
  outline: 'Shift+O',
  newFromSelection: 'Ctrl+Alt+N',
  shortcuts: 'Ctrl+Alt+Shift+K',
  // Select
  selectAll: 'Ctrl+A',
  deselect: 'Esc',
  inverse: 'Ctrl+Shift+I',
  // Sprite/View
  canvasSize: 'C',
  zoomIn: '+',
  zoomOut: '-',
  resetZoom: '0',
  // Tools
  brush: 'B',
  pencil: 'P',
  eraser: 'E',
  picker: 'I',
  bucket: 'G',
  move: 'H',
  zoom: 'Z',
  line: 'L',
  rectangle: 'R',
  rectSelect: 'M',
  quickSelect: 'Q',
  magicWand: 'W',
  ellipse: 'O',
  ai: 'A',
};

// Load custom shortcuts from localStorage
export function loadCustomShortcuts(): Record<string, string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save custom shortcuts to localStorage
export function saveCustomShortcuts(customShortcuts: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customShortcuts));
}

// Reset shortcuts to defaults
export function resetShortcuts() {
  localStorage.removeItem(STORAGE_KEY);
}

// Get current shortcuts = defaults overridden by saved custom
export function getCurrentShortcuts(): Record<string, string> {
  const custom = loadCustomShortcuts();
  return { ...DEFAULT_SHORTCUTS, ...custom };
}

// Get a single shortcut by id
export function getShortcut(id: string): string {
  const current = getCurrentShortcuts();
  return current[id] || '';
}

// Update single shortcut and persist
export function setShortcut(id: string, value: string) {
  if (!isValidShortcut(value)) return;
  const custom = loadCustomShortcuts();
  custom[id] = value;
  saveCustomShortcuts(custom);
}

// Parse key combination from keyboard event
export function getKeyCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  
  // Handle special keys
  const key = e.key;
  if (key === ' ') {
    parts.push('Space');
  } else if (key === 'Escape') {
    parts.push('Esc');
  } else if (key === 'Delete') {
    parts.push('Delete');
  } else if (key === 'Backspace') {
    parts.push('Backspace');
  } else if (key === 'Enter') {
    parts.push('Enter');
  } else if (key.length === 1) {
    parts.push(key.toUpperCase());
  }
  
  return parts.join('+');
}

// Check if key combination matches
export function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  const combo = getKeyCombo(e);
  return combo === shortcut;
}

// Format shortcut for display (platform-specific)
export function formatShortcut(shortcut: string): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  if (isMac) {
    return shortcut
      .replace('Ctrl', '⌘')
      .replace('Alt', '⌥')
      .replace('Shift', '⇧');
  }
  return shortcut;
}

// Validate shortcut string
export function isValidShortcut(shortcut: string): boolean {
  if (!shortcut) return false;
  const parts = shortcut.split('+');
  if (parts.length === 0) return false;
  
  // Must have at least one key
  const lastPart = parts[parts.length - 1];
  if (!lastPart || lastPart.length === 0) return false;
  
  return true;
}
