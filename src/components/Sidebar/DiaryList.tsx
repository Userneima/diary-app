import React, { useState } from 'react';
import { Plus, Search, Trash2, Calendar } from 'lucide-react';
import type { Diary } from '../../types';
import { formatDate, formatRelativeTime } from '../../utils/date';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { t } from '../../i18n';

interface DiaryListProps {
  diaries: Diary[];
  currentDiaryId: string | null;
  onSelectDiary: (id: string) => void;
  onCreateDiary: () => void;
  onDeleteDiary: (id: string) => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  selectedFolderId: string | null;
}

export const DiaryList: React.FC<DiaryListProps> = ({
  diaries,
  currentDiaryId,
  onSelectDiary,
  onCreateDiary,
  onDeleteDiary,
  searchQuery,
  onSearch,
  selectedFolderId,
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingDiaryId, setDeletingDiaryId] = useState<string | null>(null);

  const filteredDiaries = diaries.filter(
    diary => selectedFolderId === null || diary.folderId === selectedFolderId
  );

  const sortedDiaries = [...filteredDiaries].sort(
    (a, b) => b.updatedAt - a.updatedAt
  );

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
          <h2 className="text-lg font-semibold text-gray-900">{t('Diaries')}</h2>
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
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedDiaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
            <Calendar size={48} className="mb-2" />
            <p className="text-sm text-center">
              {searchQuery ? t('No diaries found') : t('No diaries yet. Create one!')}
            </p>
          </div>
        ) : (
          sortedDiaries.map(diary => (
            <div
              key={diary.id}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors group relative ${
                currentDiaryId === diary.id
                  ? 'bg-blue-50 border-l-4 border-l-blue-600'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onSelectDiary(diary.id)}
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
                          className="inline-block px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700"
                        >
                          {tag}
                        </span>
                      ))}
                      {diary.tags.length > 3 && (
                        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                          +{diary.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{formatRelativeTime(diary.updatedAt)}</span>
                    <span>•</span>
                    <span>{formatDate(diary.createdAt)}</span>
                  </div>
                </div>
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
