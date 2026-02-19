import React, { useState, useCallback } from 'react';
import { useDiaries } from '../../hooks/useDiaries';
import { useFolders } from '../../hooks/useFolders';
import { FolderTree } from '../Sidebar/FolderTree';
import { TagPanel } from '../Sidebar/TagPanel';
import { CalendarView } from '../Sidebar/CalendarView';
import { DiaryList } from '../Sidebar/DiaryList';
import { Editor } from '../Editor/Editor';
import { TableOfContents } from '../Editor/TableOfContents';
import { Input } from '../UI/Input';
import { TagInput } from '../UI/TagInput';
import { ExportModal } from '../UI/ExportModal';
import { ImportModal } from '../UI/ImportModal';
import { BookOpen, Download, Upload, Tag as TagIcon, Folder as FolderIcon, Calendar as CalendarIcon, Settings, ListChecks, Zap, Lock, LockOpen, List } from 'lucide-react';
import { TaskList } from '../Sidebar/TaskList';
import { AiSettingsModal } from '../UI/AiSettingsModal';
import { AnalysisPanel } from '../Analysis/AnalysisPanel';
import { ToastHost } from '../UI/ToastHost';
import { getDiaryWordCount } from '../../utils/text';

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
    moveDiary,
    setCurrentDiaryId,
    searchDiaries,
    importDiaries,
  } = useDiaries();

  const { folders, createFolder, updateFolder, deleteFolder, importFolders } = useFolders();

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [leftPanelView, setLeftPanelView] = useState<'folders' | 'tags' | 'calendar' | 'tasks'>('folders');
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isLeftSidebarExpanded, setIsLeftSidebarExpanded] = useState(false);
  const [isLeftSidebarPinned, setIsLeftSidebarPinned] = useState(false);
  const [showTableOfContents, setShowTableOfContents] = useState(true);
  const [hasTaskListModalOpen, setHasTaskListModalOpen] = useState(false);

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      if (currentDiaryId) {
        updateDiary(currentDiaryId, { title: newTitle });
      }
    },
    [currentDiaryId, updateDiary]
  );

  const handleContentChange = useCallback(
    (newContent: string) => {
      if (currentDiaryId) {
        updateDiary(currentDiaryId, { content: newContent });
      }
    },
    [currentDiaryId, updateDiary]
  );

  const handleAppendToDiary = useCallback(
    (content: string) => {
      if (currentDiaryId && currentDiary) {
        const newContent = currentDiary.content + content;
        updateDiary(currentDiaryId, { content: newContent });
      }
    },
    [currentDiaryId, currentDiary, updateDiary]
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

  const diaryTitle = currentDiary?.title ?? '';
  const diaryContent = currentDiary?.content ?? '';

  const wordCount = getDiaryWordCount(diaryContent);

  return (
    <div className="flex h-screen bg-gray-50">
      <div
        className={`flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
          isLeftSidebarPinned || isLeftSidebarExpanded ? 'w-64' : 'w-12'
        }`}
        onMouseEnter={() => !isLeftSidebarPinned && setIsLeftSidebarExpanded(true)}
        onMouseLeave={() => {
          // Don't collapse if focus is on a modal element or if TaskList has modal open
          if (hasTaskListModalOpen) return;
          const activeElement = document.activeElement;
          const isModalFocused = activeElement && (activeElement.closest('.fixed') || activeElement.closest('[role="dialog"]'));
          if (!isLeftSidebarPinned && !isModalFocused) {
            setIsLeftSidebarExpanded(false);
          }
        }}
      >
        {/* Sidebar Header Tabs */}
        <div
          className={`flex border-gray-200 bg-white ${
            isLeftSidebarPinned || isLeftSidebarExpanded
              ? 'flex-row border-b'
              : 'flex-col border-r'
          }`}
        >
          <button
            onClick={() => setLeftPanelView('folders')}
            className={`flex items-center justify-center gap-1 font-medium transition-colors ${
              isLeftSidebarPinned || isLeftSidebarExpanded
                ? 'flex-1 py-3 text-xs whitespace-nowrap'
                : 'flex-col w-12 h-12'
            } ${
              leftPanelView === 'folders'
                ? isLeftSidebarPinned || isLeftSidebarExpanded
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FolderIcon size={14} />
            {(isLeftSidebarPinned || isLeftSidebarExpanded) && t('Folders')}
          </button>
          <button
            onClick={() => setLeftPanelView('tags')}
            className={`flex items-center justify-center gap-1 font-medium transition-colors ${
              isLeftSidebarPinned || isLeftSidebarExpanded
                ? 'flex-1 py-3 text-xs whitespace-nowrap'
                : 'flex-col w-12 h-12'
            } ${
              leftPanelView === 'tags'
                ? isLeftSidebarPinned || isLeftSidebarExpanded
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TagIcon size={14} />
            {(isLeftSidebarPinned || isLeftSidebarExpanded) && t('Tags')}
          </button>
          <button
            onClick={() => setLeftPanelView('calendar')}
            className={`flex items-center justify-center gap-1 font-medium transition-colors ${
              isLeftSidebarPinned || isLeftSidebarExpanded
                ? 'flex-1 py-3 text-xs whitespace-nowrap'
                : 'flex-col w-12 h-12'
            } ${
              leftPanelView === 'calendar'
                ? isLeftSidebarPinned || isLeftSidebarExpanded
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CalendarIcon size={14} />
            {(isLeftSidebarPinned || isLeftSidebarExpanded) && t('Calendar')}
          </button>
          <button
            onClick={() => setLeftPanelView('tasks')}
            className={`flex items-center justify-center gap-1 font-medium transition-colors ${
              isLeftSidebarPinned || isLeftSidebarExpanded
                ? 'flex-1 py-3 text-xs whitespace-nowrap'
                : 'flex-col w-12 h-12'
            } ${
              leftPanelView === 'tasks'
                ? isLeftSidebarPinned || isLeftSidebarExpanded
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ListChecks size={14} />
            {(isLeftSidebarPinned || isLeftSidebarExpanded) && t('Tasks')}
          </button>
        </div>

        {/* Sidebar Content */}
        {(isLeftSidebarPinned || isLeftSidebarExpanded) && (
          <div className="flex-1 overflow-hidden">
            {leftPanelView === 'folders' ? (
              <FolderTree
                folders={folders}
                onCreateFolder={handleCreateFolder}
                onUpdateFolder={handleUpdateFolder}
                onDeleteFolder={deleteFolder}
                onMoveDiary={moveDiary}
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
            ) : leftPanelView === 'calendar' ? (
              <CalendarView
                diaries={diaries}
                onSelectDiary={setCurrentDiaryId}
                onCreateDiary={handleCreateDiaryForDate}
                onChangeDiaryDate={handleChangeDiaryDate}
              />
            ) : (
              <TaskList onModalStateChange={setHasTaskListModalOpen} />
            )}
          </div>
        )}

        {/* Pin Button */}
        {(isLeftSidebarPinned || isLeftSidebarExpanded) && (
          <div
            className={`border-gray-200 bg-white transition-all duration-300 ${
              isLeftSidebarPinned || isLeftSidebarExpanded
                ? 'border-t p-2 flex justify-end'
                : 'hidden'
            }`}
          >
            <button
              onClick={() => setIsLeftSidebarPinned(!isLeftSidebarPinned)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              title={isLeftSidebarPinned ? t('Unpin') : t('Pin')}
            >
              {isLeftSidebarPinned ? <Lock size={16} /> : <LockOpen size={16} />}
            </button>
          </div>
        )}
      </div>

      <div className="w-80 flex-shrink-0">
        <DiaryList
          diaries={filteredDiaries}
          currentDiaryId={currentDiaryId}
          onSelectDiary={setCurrentDiaryId}
          onCreateDiary={handleCreateDiary}
          onDeleteDiary={deleteDiary}
          onMoveDiary={moveDiary}
          searchQuery={searchQuery}
          onSearch={searchDiaries}
          selectedFolderId={selectedFolderId}
          folders={folders}
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
                  <button
                    onClick={() => setIsAnalysisOpen(true)}
                    className="ml-2 p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title={t('Analyze current diary')}
                    aria-label={t('Analyze current diary')}
                  >
                    <Zap size={18} />
                  </button>
                  <button
                    onClick={() => setShowTableOfContents(!showTableOfContents)}
                    className={`ml-2 p-2 rounded-lg transition-colors ${
                      showTableOfContents
                        ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    title={t('Toggle Table of Contents')}
                    aria-label={t('Toggle Table of Contents')}
                  >
                    <List size={18} />
                  </button>
                  <button
                    onClick={() => setIsAiSettingsOpen(true)}
                    className="ml-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    title={t('AI Settings')}
                    aria-label={t('AI Settings')}
                  >
                    <Settings size={18} />
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
            <div className="flex-1 overflow-hidden flex">
              <div className="flex-1 flex flex-col">
                <Editor
                  content={diaryContent}
                  onChange={handleContentChange}
                  editable={true}
                  onAnalyze={() => setIsAnalysisOpen(true)}
                  contentRightPanel={
                    showTableOfContents ? (
                      <div className="group h-full w-10 hover:w-72 transition-all duration-300 ease-in-out border-l border-gray-300 bg-gray-100 overflow-hidden flex-shrink-0 relative z-10">
                        <div className="h-full opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <TableOfContents content={diaryContent} />
                        </div>
                      </div>
                    ) : null
                  }
                />
              </div>
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

      <AiSettingsModal isOpen={isAiSettingsOpen} onClose={() => setIsAiSettingsOpen(false)} />

      <AnalysisPanel
        isOpen={isAnalysisOpen}
        diaryId={currentDiaryId}
        diaryContent={diaryContent}
        onClose={() => setIsAnalysisOpen(false)}
        onAppendToDiary={handleAppendToDiary}
      />

      <ToastHost />
    </div>
  );
};
