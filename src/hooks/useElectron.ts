import { ElectronAPI } from '@/types/ipc';

let cachedElectron: boolean | null = null;

export function useElectron() {
  if (cachedElectron === null) {
    cachedElectron = typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined';
  }

  const electronAPI = cachedElectron ? window.electronAPI : null;

  return {
    isElectron: cachedElectron,
    electronAPI,
  };
}
