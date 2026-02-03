import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Folder } from '../types';
import { storage } from '../utils/storage';

export const useFolders = () => {
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    const loadedFolders = storage.getFolders();
    setFolders(loadedFolders);
  }, []);

  const createFolder = useCallback((name: string, parentId: string | null = null) => {
    const newFolder: Folder = {
      id: uuidv4(),
      name,
      parentId,
      createdAt: Date.now(),
    };
    storage.addFolder(newFolder);
    setFolders(prev => [...prev, newFolder]);
    return newFolder;
  }, []);

  const updateFolder = useCallback((id: string, updates: Partial<Folder>) => {
    storage.updateFolder(id, updates);
    setFolders(prev => prev.map(f => (f.id === id ? { ...f, ...updates } : f)));
  }, []);

  const deleteFolder = useCallback((id: string) => {
    storage.deleteFolder(id);
    setFolders(prev => prev.filter(f => f.id !== id));
  }, []);

  const importFolders = useCallback((imported: Folder[], options?: { replace?: boolean }) => {
    try {
      if (options?.replace) {
        storage.saveFolders(imported);
        setFolders(imported);
        return;
      }
      const existing = storage.getFolders();
      const map = new Map(existing.map(f => [f.id, f]));
      imported.forEach(f => {
        if (!f.id) {
          f.id = uuidv4();
        }
        if (map.has(f.id)) {
          map.set(f.id, { ...map.get(f.id)!, ...f });
        } else {
          map.set(f.id, f);
        }
      });
      const merged = Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
      storage.saveFolders(merged);
      setFolders(merged);
    } catch (err) {
      console.error('Import folders failed', err);
      throw err;
    }
  }, []);

  return {
    folders,
    createFolder,
    updateFolder,
    deleteFolder,
    importFolders,
  };
};

