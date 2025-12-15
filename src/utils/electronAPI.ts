
export async function getElectronAPI(): Promise<typeof window.electronAPI> {
  if (window.electronAPI) {
    return window.electronAPI;
  }

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (window.electronAPI) {
        clearInterval(interval);
        resolve(window.electronAPI);
      } else if (Date.now() - startTime > 5000) {
        clearInterval(interval);
        reject(new Error('Electron API not available'));
      }
    }, 100);
  });
}

export async function safeElectronCall<T>(
  apiCall: (api: typeof window.electronAPI) => Promise<T>
): Promise<T> {
  try {
    const api = await getElectronAPI();
    return await apiCall(api);
  } catch (error) {
    console.error('Electron API call failed:', error);
    throw error;
  }
}
