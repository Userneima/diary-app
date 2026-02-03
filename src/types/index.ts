export interface Diary {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  color?: string;
  createdAt: number;
}

export interface AppState {
  diaries: Diary[];
  folders: Folder[];
  currentDiaryId: string | null;
  searchQuery: string;
}
