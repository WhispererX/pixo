import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  saveFileDialog: async () => {
    try {
      return await ipcRenderer.invoke('save-file-dialog');
    } catch (error) {
      console.error('Error in saveFileDialog:', error);
      throw error;
    }
  },
  openFileDialog: async () => {
    try {
      return await ipcRenderer.invoke('open-file-dialog');
    } catch (error) {
      console.error('Error in openFileDialog:', error);
      throw error;
    }
  },
  saveFile: async (filePath: string, content: string) => {
    try {
      return await ipcRenderer.invoke('save-file', filePath, content);
    } catch (error) {
      console.error('Error in saveFile:', error);
      throw error;
    }
  },
  readFile: async (filePath: string) => {
    try {
      return await ipcRenderer.invoke('read-file', filePath);
    } catch (error) {
      console.error('Error in readFile:', error);
      throw error;
    }
  },
  exportPNG: async (filePath: string, dataUrl: string) => {
    try {
      return await ipcRenderer.invoke('export-png', filePath, dataUrl);
    } catch (error) {
      console.error('Error in exportPNG:', error);
      throw error;
    }
  },
  getRecentFiles: async () => {
    try {
      return await ipcRenderer.invoke('get-recent-files');
    } catch (error) {
      console.error('Error in getRecentFiles:', error);
      throw error;
    }
  },
  addRecentFile: async (filePath: string) => {
    try {
      return await ipcRenderer.invoke('add-recent-file', filePath);
    } catch (error) {
      console.error('Error in addRecentFile:', error);
      throw error;
    }
  },
});
