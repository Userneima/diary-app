import type { Diary, Folder } from '../types';

type Backup = {
  timestamp: number;
  diaries: Diary[];
  folders: Folder[];
};

const DIARIES_KEY = 'diaries';
const FOLDERS_KEY = 'folders';
const BACKUPS_KEY = 'diaries_backups';
const MAX_BACKUPS = 10;

export const storage = {
  // Diaries
  getDiaries(): Diary[] {
    const data = localStorage.getItem(DIARIES_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveDiaries(diaries: Diary[]): void {
    localStorage.setItem(DIARIES_KEY, JSON.stringify(diaries));
    // record a snapshot after changes to help recovery
    try {
      this.saveSnapshotIfChanged();
    } catch (err) {
      // fail silently to not break normal flow
      console.warn('Failed to save snapshot', err);
    }
  },

  addDiary(diary: Diary): void {
    const diaries = this.getDiaries();
    diaries.push(diary);
    this.saveDiaries(diaries);
  },

  updateDiary(id: string, updates: Partial<Diary>): void {
    const diaries = this.getDiaries();
    const index = diaries.findIndex(d => d.id === id);
    if (index !== -1) {
      diaries[index] = { ...diaries[index], ...updates, updatedAt: Date.now() };
      this.saveDiaries(diaries);
    }
  },

  deleteDiary(id: string): void {
    const diaries = this.getDiaries();
    this.saveDiaries(diaries.filter(d => d.id !== id));
  },

  // Folders
  getFolders(): Folder[] {
    const data = localStorage.getItem(FOLDERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveFolders(folders: Folder[]): void {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    try {
      this.saveSnapshotIfChanged();
    } catch (err) {
      console.warn('Failed to save snapshot', err);
    }
  },

  addFolder(folder: Folder): void {
    const folders = this.getFolders();
    folders.push(folder);
    this.saveFolders(folders);
  },

  updateFolder(id: string, updates: Partial<Folder>): void {
    const folders = this.getFolders();
    const index = folders.findIndex(f => f.id === id);
    if (index !== -1) {
      folders[index] = { ...folders[index], ...updates };
      this.saveFolders(folders);
    }
  },

  deleteFolder(id: string): void {
    const folders = this.getFolders();
    this.saveFolders(folders.filter(f => f.id !== id));

    // Also update diaries that were in this folder
    const diaries = this.getDiaries();
    const updatedDiaries = diaries.map(d =>
      d.folderId === id ? { ...d, folderId: null } : d
    );
    this.saveDiaries(updatedDiaries);
  },

  // Backups
  getBackups(): Backup[] {
    const data = localStorage.getItem(BACKUPS_KEY);
    return data ? JSON.parse(data) : [];
  },

  privateSaveBackups(backups: Backup[]) {
    localStorage.setItem(BACKUPS_KEY, JSON.stringify(backups));
  },

  saveSnapshotIfChanged(): void {
    const diaries = this.getDiaries();
    const folders = this.getFolders();
    const backups = this.getBackups();
    const last = backups.length ? backups[backups.length - 1] : null;
    try {
      const same = last && JSON.stringify(last.diaries) === JSON.stringify(diaries) && JSON.stringify(last.folders) === JSON.stringify(folders);
      if (same) return;
      const next: Backup = { timestamp: Date.now(), diaries, folders };
      backups.push(next);
      if (backups.length > MAX_BACKUPS) {
        backups.splice(0, backups.length - MAX_BACKUPS);
      }
      this.privateSaveBackups(backups);
    } catch (err) {
      console.warn('saveSnapshotIfChanged error', err);
    }
  },

  restoreBackup(timestamp: number): Backup | null {
    const backups = this.getBackups();
    const b = backups.find(x => x.timestamp === timestamp);
    if (!b) return null;
    // restore directly into storage
    this.saveDiaries(b.diaries);
    this.saveFolders(b.folders);
    return b;
  },

  getAllData(): { diaries: Diary[]; folders: Folder[] } {
    return { diaries: this.getDiaries(), folders: this.getFolders() };
  },

  importAllData(data: any, options?: { replace?: boolean }) {
    try {
      const incomingDiaries: Diary[] = Array.isArray(data.diaries) ? data.diaries : [];
      const incomingFolders: Folder[] = Array.isArray(data.folders) ? data.folders : [];

      if (options?.replace) {
        this.saveFolders(incomingFolders);
        this.saveDiaries(incomingDiaries);
        return;
      }

      // Merge folders
      const existingFolders = this.getFolders();
      const folderMap = new Map(existingFolders.map(f => [f.id, f]));
      incomingFolders.forEach(f => {
        if (!f.id) f.id = cryptoRandomId();
        folderMap.set(f.id, { ...folderMap.get(f.id), ...f });
      });
      this.saveFolders(Array.from(folderMap.values()));

      // Merge diaries
      const existingDiaries = this.getDiaries();
      const diaryMap = new Map(existingDiaries.map(d => [d.id, d]));
      incomingDiaries.forEach(d => {
        if (!d.id) d.id = cryptoRandomId();
        if (diaryMap.has(d.id)) {
          diaryMap.set(d.id, { ...diaryMap.get(d.id)!, ...d });
        } else {
          diaryMap.set(d.id, d);
        }
      });
      this.saveDiaries(Array.from(diaryMap.values()));
    } catch (err) {
      console.error('importAllData failed', err);
      throw err;
    }
  },
};

// Simple fallback for crypto random id if uuid not available in raw util
function cryptoRandomId() {
  return 'id-' + Math.random().toString(36).slice(2, 9);
}
