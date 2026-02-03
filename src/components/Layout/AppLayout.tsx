import React, { useState, useEffect, useCallback } from 'react';
import { useDiaries } from '../../hooks/useDiaries';
import { useFolders } from '../../hooks/useFolders';
import { FolderTree } from '../Sidebar/FolderTree';
import { TagPanel } from '../Sidebar/TagPanel';
import { CalendarView } from '../Sidebar/CalendarView';
import { DiaryList } from '../Sidebar/DiaryList';
import { Editor } from '../Editor/Editor';
import { Input } from '../UI/Input';
import { TagInput } from '../UI/TagInput';
import { ExportModal } from '../UI/ExportModal';
import { ImportModal } from '../UI/ImportModal';
import { BookOpen, Download, Upload, Tag as TagIcon, Folder as FolderIcon, Calendar as CalendarIcon } from 'lucide-react';

import { t } from '../../i18n';

export const AppLayout: React.FC = () => {
  const {
    diaries,
    currentDiary,
    currentDiaryId,
    searchQuery,
    createDiary,
    updateDiary,
    deleteDiary,
    setCurrentDiaryId,
    searchDiaries,
    importDiaries,
  } = useDiaries();

  const { folders, createFolder, updateFolder, deleteFolder, importFolders } = useFolders();

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [diaryTitle, setDiaryTitle] = useState('');
  const [diaryContent, setDiaryContent] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [leftPanelView, setLeftPanelView] = useState<'folders' | 'tags' | 'calendar'>('folders');

  useEffect(() => {
    if (currentDiary) {
      setDiaryTitle(currentDiary.title);
      setDiaryContent(currentDiary.content);
    } else {
      setDiaryTitle('');
      setDiaryContent('');
    }
  }, [currentDiary]);

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setDiaryTitle(newTitle);
      if (currentDiaryId) {
        updateDiary(currentDiaryId, { title: newTitle });
      }
    },
    [currentDiaryId, updateDiary]
  );

  const handleContentChange = useCallback(
    (newContent: string) => {
      setDiaryContent(newContent);
      if (currentDiaryId) {
        updateDiary(currentDiaryId, { content: newContent });
      }
    },
    [currentDiaryId, updateDiary]
  );

  const handleCreateDiary = () => {
    createDiary(selectedFolderId);
  };

  const handleCreateDiaryForDate = (date: Date) => {
    const newDiary = createDiary(selectedFolderId);
    // 更新日记的创建时间为选中的日期
    if (newDiary) {
      updateDiary(newDiary.id, {
        createdAt: date.getTime(),
        updatedAt: date.getTime()
      });
    }
  };

  const handleChangeDiaryDate = (id: string, date: Date) => {
    updateDiary(id, { createdAt: date.getTime() });
  }; 

  const handleCreateFolder = (name: string, parentId: string | null) => {
    createFolder(name, parentId);
  };

  const handleUpdateFolder = (id: string, name: string) => {
    updateFolder(id, { name });
  };

  const handleSelectTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleClearTags = () => {
    setSelectedTags([]);
  };

  const handleRenameTag = (oldTag: string, newTag: string) => {
    diaries.forEach(diary => {
      if (diary.tags.includes(oldTag)) {
        const newTags = diary.tags.map(t => (t === oldTag ? newTag : t));
        updateDiary(diary.id, { tags: newTags });
      }
    });
  };

  const handleMergeTags = (tags: string[], newTag: string) => {
    diaries.forEach(diary => {
      const hasTags = diary.tags.some(t => tags.includes(t));
      if (hasTags) {
        const newTags = [...diary.tags.filter(t => !tags.includes(t)), newTag];
        updateDiary(diary.id, { tags: Array.from(new Set(newTags)) });
      }
    });
  };

  const handleDeleteTag = (tag: string) => {
    diaries.forEach(diary => {
      if (diary.tags.includes(tag)) {
        const newTags = diary.tags.filter(t => t !== tag);
        updateDiary(diary.id, { tags: newTags });
      }
    });
  };

  // Filter diaries by selected tags
  const filteredDiaries = selectedTags.length > 0
    ? diaries.filter(diary => selectedTags.every(tag => diary.tags.includes(tag)))
    : diaries;

  const wordCount = diaryContent
    ? diaryContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 flex-shrink-0 flex flex-col">
        <div className="flex border-b border-gray-200 bg-white">
          <button
            onClick={() => setLeftPanelView('folders')}
            className={`flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
              leftPanelView === 'folders'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FolderIcon size={14} />
            {t('Folders')}
          </button>
          <button
            onClick={() => setLeftPanelView('tags')}
            className={`flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
              leftPanelView === 'tags'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TagIcon size={14} />
            {t('Tags')}
          </button>
          <button
            onClick={() => setLeftPanelView('calendar')}
            className={`flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
              leftPanelView === 'calendar'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CalendarIcon size={14} />
            {t('Calendar')}
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {leftPanelView === 'folders' ? (
            <FolderTree
              folders={folders}
              onCreateFolder={handleCreateFolder}
              onUpdateFolder={handleUpdateFolder}
              onDeleteFolder={deleteFolder}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
            />
          ) : leftPanelView === 'tags' ? (
            <TagPanel
              diaries={diaries}
              selectedTags={selectedTags}
              onSelectTag={handleSelectTag}
              onClearTags={handleClearTags}
              onRenameTag={handleRenameTag}
              onMergeTags={handleMergeTags}
              onDeleteTag={handleDeleteTag}
            />
          ) : (
            <CalendarView
              diaries={diaries}
              onSelectDiary={setCurrentDiaryId}
              onCreateDiary={handleCreateDiaryForDate}
              onChangeDiaryDate={handleChangeDiaryDate}
            />
          )}
        </div>
      </div>

      <div className="w-80 flex-shrink-0">
        <DiaryList
          diaries={filteredDiaries}
          currentDiaryId={currentDiaryId}
          onSelectDiary={setCurrentDiaryId}
          onCreateDiary={handleCreateDiary}
          onDeleteDiary={deleteDiary}
          searchQuery={searchQuery}
          onSearch={searchDiaries}
          selectedFolderId={selectedFolderId}
        />
      </div>

      <div className="flex-1 flex flex-col">
        {currentDiary ? (
          <>
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <Input
                  value={diaryTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={t('Untitled')}
                  className="text-2xl font-bold border-none focus:ring-0 px-0 flex-1"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="ml-2 p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title={t('Import diaries and folders')}
                    aria-label={t('Import diaries and folders')}
                  >
                    <Upload size={18} />
                    <span className="sr-only">{t('Import diaries and folders')}</span>
                  </button>
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="ml-2 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title={t('Export current diary')}
                    aria-label={t('Export current diary')}
                  >
                    <Download size={20} />
                    <span className="sr-only">{t('Export')}</span>
                  </button>
                </div>
              </div>
              <div className="mt-3 mb-2">
                <TagInput
                  tags={currentDiary.tags}
                  onChange={(tags) => updateDiary(currentDiaryId!, { tags })}
                  placeholder={t('Add tags (press Enter)...')}
                />
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>{wordCount} {t('words')}</span>
                <span>•</span>
                <span>
                  {t('Last edited:')} {new Date(currentDiary.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <Editor
                content={diaryContent}
                onChange={handleContentChange}
                editable={true}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <BookOpen size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-xl font-medium mb-2">{t('No diary selected')}</p>
              <p className="text-sm">
                {t('Select a diary from the list or create a new one')}
              </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title={t('Import files (JSON/MD/HTML/TXT/DOCX/PDF)')}
                    aria-label={t('Import files')}
                  >
                    <Upload size={18} />
                    {t('Import')}
                  </button>
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title={t('Export all diaries')}
                    aria-label={t('Export all diaries')}
                  >
                    <Download size={18} />
                    {t('Export All Diaries')}
                  </button>
                </div>
            </div>
          </div>
        )}
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        diaries={diaries}
        currentDiary={currentDiary}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportDiaries={(d, opts) => importDiaries(d, opts)}
        onImportFolders={(f, opts) => importFolders(f, opts)}
      />
    </div>
  );
};
