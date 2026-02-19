import React, { useMemo, useState } from 'react';
import { Plus, Search, Trash2, Calendar, Folder } from 'lucide-react';
import type { Diary, Folder as DiaryFolder } from '../../types';
import { formatDate, formatRelativeTime } from '../../utils/date';
import { getDiaryWordCount } from '../../utils/text';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { t } from '../../i18n';
import { showToast } from '../../utils/toast';

interface DiaryListProps {
  diaries: Diary[];
  currentDiaryId: string | null;
  onSelectDiary: (id: string) => void;
  onCreateDiary: () => void;
  onDeleteDiary: (id: string) => void;
  onMoveDiary: (diaryId: string, folderId: string | null) => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  selectedFolderId: string | null;
  folders: DiaryFolder[];
}

export const DiaryList: React.FC<DiaryListProps> = ({
  diaries,
  currentDiaryId,
  onSelectDiary,
  onCreateDiary,
  onDeleteDiary,
  onMoveDiary,
  searchQuery,
  onSearch,
  selectedFolderId,
  folders,
}) => {
  const [sortMode, setSortMode] = useState<
    'updated-desc' | 'updated-asc' | 'created-desc' | 'created-asc' | 'title-asc' | 'title-desc'
  >('updated-desc');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingDiaryId, setDeletingDiaryId] = useState<string | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [movingDiaryId, setMovingDiaryId] = useState<string | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);

  const getTagColor = (tag: string) => {
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-green-100 text-green-700 border-green-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-pink-100 text-pink-700 border-pink-200',
      'bg-yellow-100 text-yellow-700 border-yellow-200',
      'bg-indigo-100 text-indigo-700 border-indigo-200',
      'bg-red-100 text-red-700 border-red-200',
      'bg-orange-100 text-orange-700 border-orange-200',
    ];
    const index = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const filteredDiaries = diaries.filter(
    diary => selectedFolderId === null || diary.folderId === selectedFolderId
  );

  const sortedDiaries = useMemo(() => {
    const normalizedTitle = (title: string) => (title || '').trim().toLocaleLowerCase();
    const list = [...filteredDiaries];

    return list.sort((a, b) => {
      switch (sortMode) {
        case 'updated-asc':
          return a.updatedAt - b.updatedAt;
        case 'created-desc':
          return b.createdAt - a.createdAt;
        case 'created-asc':
          return a.createdAt - b.createdAt;
        case 'title-asc':
          return normalizedTitle(a.title).localeCompare(normalizedTitle(b.title), 'zh-CN', {
            sensitivity: 'base',
          });
        case 'title-desc':
          return normalizedTitle(b.title).localeCompare(normalizedTitle(a.title), 'zh-CN', {
            sensitivity: 'base',
          });
        case 'updated-desc':
        default:
          return b.updatedAt - a.updatedAt;
      }
    });
  }, [filteredDiaries, sortMode]);

  const totalCount = diaries.length;
  const visibleCount = sortedDiaries.length;

  const openDeleteModal = (diaryId: string) => {
    setDeletingDiaryId(diaryId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteDiary = () => {
    if (deletingDiaryId) {
      onDeleteDiary(deletingDiaryId);
      setDeletingDiaryId(null);
      setIsDeleteModalOpen(false);
    }
  };

  const openMoveModal = (diary: Diary) => {
    setMovingDiaryId(diary.id);
    setTargetFolderId(diary.folderId);
    setIsMoveModalOpen(true);
  };

  const handleMoveDiary = () => {
    if (!movingDiaryId) {
      return;
    }
    onMoveDiary(movingDiaryId, targetFolderId);
    showToast(t('Diary moved successfully'), 'success');
    setIsMoveModalOpen(false);
    setMovingDiaryId(null);
    setTargetFolderId(null);
  };

  const getPreviewText = (content: string): string => {
    const div = document.createElement('div');
    div.innerHTML = content;
    const text = div.textContent || div.innerText || '';
    return text.slice(0, 100) + (text.length > 100 ? '...' : '');
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('Diaries')}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('Showing diaries summary').replace('{visible}', String(visibleCount)).replace('{total}', String(totalCount))}
            </p>
          </div>
          <button
            onClick={onCreateDiary}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title={t('New Diary')}
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder={t('Search diaries...')}
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="mt-3">
          <label className="block text-xs text-gray-500 mb-1">{t('Sort by')}</label>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="updated-desc">{t('Last edited (newest first)')}</option>
            <option value="updated-asc">{t('Last edited (oldest first)')}</option>
            <option value="created-desc">{t('Created date (newest first)')}</option>
            <option value="created-asc">{t('Created date (oldest first)')}</option>
            <option value="title-asc">{t('Title A-Z')}</option>
            <option value="title-desc">{t('Title Z-A')}</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedDiaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
            <Calendar size={48} className="mb-2" />
            <p className="text-sm text-center">
              {searchQuery ? t('No diaries found') : t('No diaries yet. Create one!')}
            </p>
            {!searchQuery && (
              <button
                onClick={onCreateDiary}
                className="mt-3 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {t('Create first diary')}
              </button>
            )}
          </div>
        ) : (
          sortedDiaries.map(diary => (
            <div
              key={diary.id}
              draggable
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors group relative ${
                currentDiaryId === diary.id
                  ? 'bg-blue-50 border-l-4 border-l-blue-600'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onSelectDiary(diary.id)}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('application/x-diary-id', diary.id);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate mb-1">
                    {diary.title || t('Untitled')}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                    {getPreviewText(diary.content) || t('No content')}
                  </p>
                  {diary.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {diary.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className={`inline-block px-2 py-0.5 text-xs rounded-full border ${getTagColor(tag)}`}
                        >
                          {tag}
                        </span>
                      ))}
                      {diary.tags.length > 3 && (
                        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                          +{diary.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{getDiaryWordCount(diary.content)} {t('words')}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(diary.updatedAt)}</span>
                    <span>•</span>
                    <span>{formatDate(diary.createdAt)}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openMoveModal(diary);
                  }}
                  className="ml-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-blue-100 text-blue-600 rounded transition-opacity"
                  title={t('Move to Folder')}
                >
                  <Folder size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteModal(diary.id);
                  }}
                  className="ml-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 text-red-600 rounded transition-opacity"
                  title={t('Delete')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={isMoveModalOpen}
        onClose={() => {
          setIsMoveModalOpen(false);
          setMovingDiaryId(null);
          setTargetFolderId(null);
        }}
        title={t('Move to Folder')}
      >
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">{t('Select destination folder')}</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={targetFolderId ?? ''}
            onChange={(e) => setTargetFolderId(e.target.value || null)}
          >
            <option value="">{t('All Diaries')}</option>
            {folders.map(folder => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleMoveDiary} className="flex-1">
            {t('Move')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setIsMoveModalOpen(false);
              setMovingDiaryId(null);
              setTargetFolderId(null);
            }}
            className="flex-1"
          >
            {t('Cancel')}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingDiaryId(null);
        }}
        title={t('Delete Diary')}
      >
        <p className="text-gray-600 mb-4">
          {t('Are you sure you want to delete this diary? This action cannot be undone.')}
        </p>
        <div className="flex gap-2">
          <Button variant="danger" onClick={handleDeleteDiary} className="flex-1">
            {t('Delete')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setDeletingDiaryId(null);
            }}
            className="flex-1"
          >
            {t('Cancel')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
