// Electron API types
export interface ElectronAPI {
  saveFileDialog: () => Promise<{ canceled: boolean; filePath?: string }>;
  openFileDialog: () => Promise<{ canceled: boolean; filePaths?: string[] }>;
  saveFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  readFileBinary: (filePath: string) => Promise<{ success: boolean; base64?: string; error?: string }>;
  exportPNG: (filePath: string, dataUrl: string) => Promise<{ success: boolean; error?: string }>;
  getRecentFiles: () => Promise<string[]>;
  addRecentFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  onOpenFile: (callback: (filePath: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
