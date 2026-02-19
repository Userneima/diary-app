import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Diary } from '../types';
import { storage } from '../utils/storage';

export const useDiaries = () => {
  const [diaries, setDiaries] = useState<Diary[]>(() => storage.getDiaries());
  const [currentDiaryId, setCurrentDiaryId] = useState<string | null>(() => {
    const loadedDiaries = storage.getDiaries();
    return loadedDiaries.length > 0 ? loadedDiaries[0].id : null;
  });
  const [searchQuery, setSearchQuery] = useState('');

  const createDiary = useCallback((folderId: string | null = null) => {
    const newDiary: Diary = {
      id: uuidv4(),
      title: 'Untitled',
      content: '',
      folderId,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    storage.addDiary(newDiary);
    setDiaries(prev => [newDiary, ...prev]);
    setCurrentDiaryId(newDiary.id);
    return newDiary;
  }, []);

  const updateDiary = useCallback((id: string, updates: Partial<Diary>) => {
    storage.updateDiary(id, updates);
    setDiaries(prev =>
      prev.map(d => (d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d))
    );
  }, []);

  const deleteDiary = useCallback((id: string) => {
    storage.deleteDiary(id);
    setDiaries(prev => prev.filter(d => d.id !== id));
    if (currentDiaryId === id) {
      const remaining = diaries.filter(d => d.id !== id);
      setCurrentDiaryId(remaining.length > 0 ? remaining[0].id : null);
    }
  }, [currentDiaryId, diaries]);

  // Import diaries (merge by default)
  const importDiaries = useCallback((imported: Diary[], options?: { replace?: boolean }) => {
    try {
      if (options?.replace) {
        // Replace all
        storage.saveDiaries(imported);
        setDiaries(imported);
        if (imported.length > 0) setCurrentDiaryId(imported[0].id);
        return;
      }

      const existing = storage.getDiaries();
      const map = new Map<string, Diary>(existing.map(d => [d.id, d]));
      imported.forEach(d => {
        const normalized = {
          ...d,
          id: d.id || uuidv4(),
        };
        // Ensure id exists
        if (map.has(normalized.id)) {
          // Overwrite existing with imported
          map.set(normalized.id, { ...map.get(normalized.id)!, ...normalized });
        } else {
          map.set(normalized.id, normalized);
        }
      });
      const merged = Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
      storage.saveDiaries(merged);
      setDiaries(merged);
      if (merged.length > 0 && !currentDiaryId) setCurrentDiaryId(merged[0].id);
    } catch (err) {
      console.error('Import diaries failed', err);
      throw err;
    }
  }, [currentDiaryId]);

  const moveDiary = useCallback((diaryId: string, folderId: string | null) => {
    updateDiary(diaryId, { folderId });
  }, [updateDiary]);

  const searchDiaries = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filteredDiaries = diaries.filter(diary => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      diary.title.toLowerCase().includes(lowerQuery) ||
      diary.content.toLowerCase().includes(lowerQuery) ||
      diary.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  });

  const currentDiary = diaries.find(d => d.id === currentDiaryId) || null;

  return {
    diaries: filteredDiaries,
    currentDiary,
    currentDiaryId,
    searchQuery,
    createDiary,
    updateDiary,
    deleteDiary,
    moveDiary,
    setCurrentDiaryId,
    searchDiaries,
    importDiaries,
  };
};
