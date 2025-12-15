const API_KEY_STORAGE_KEY = 'pixo_openai_api_key';

export const getStoredAPIKey = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
};

export const setStoredAPIKey = (key: string): void => {
  if (typeof window === 'undefined') return;
  if (key) {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
  } else {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  }
};

export const hasStoredAPIKey = (): boolean => {
  return getStoredAPIKey().length > 0;
};
