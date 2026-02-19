import React, { useState } from 'react';
import { Folder as FolderIcon, FolderPlus, Edit2, Trash2 } from 'lucide-react';
import type { Folder } from '../../types';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';
import { Input } from '../UI/Input';
import { t } from '../../i18n';
import { showToast } from '../../utils/toast';

interface FolderTreeProps {
  folders: Folder[];
  onCreateFolder: (name: string, parentId: string | null) => void;
  onUpdateFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onMoveDiary: (diaryId: string, folderId: string | null) => void;
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onMoveDiary,
  selectedFolderId,
  onSelectFolder,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  const getDraggedDiaryId = (e: React.DragEvent): string | null => {
    const diaryId = e.dataTransfer.getData('application/x-diary-id');
    return diaryId || null;
  };

  const handleDropToFolder = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    const diaryId = getDraggedDiaryId(e);
    if (!diaryId) {
      setDragOverTarget(null);
      return;
    }
    onMoveDiary(diaryId, folderId);
    showToast(t('Diary moved successfully'), 'success');
    setDragOverTarget(null);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), null);
      setNewFolderName('');
      setIsCreateModalOpen(false);
    }
  };

  const handleEditFolder = () => {
    if (editingFolder && newFolderName.trim()) {
      onUpdateFolder(editingFolder.id, newFolderName.trim());
      setNewFolderName('');
      setEditingFolder(null);
      setIsEditModalOpen(false);
    }
  };

  const handleDeleteFolder = () => {
    if (deletingFolderId) {
      onDeleteFolder(deletingFolderId);
      setDeletingFolderId(null);
      setIsDeleteModalOpen(false);
    }
  };

  const openEditModal = (folder: Folder) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (folderId: string) => {
    setDeletingFolderId(folderId);
    setIsDeleteModalOpen(true);
  };



  const rootFolders = folders.filter(f => !f.parentId);

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">{t('Folders')}</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={t('New Folder')}
          >
            <FolderPlus size={18} className="text-gray-600" />
          </button>
        </div>
        <button
          onClick={() => onSelectFolder(null)}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
            dragOverTarget === 'all'
              ? 'bg-blue-100 text-blue-800'
              : selectedFolderId === null
              ? 'bg-blue-50 text-blue-700'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverTarget('all');
          }}
          onDragLeave={() => setDragOverTarget(null)}
          onDrop={(e) => handleDropToFolder(e, null)}
        >
          {t('All Diaries')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {rootFolders.map(folder => (
          <div key={folder.id} className="mb-1">
            <div
              className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors group ${
                dragOverTarget === folder.id
                  ? 'bg-blue-100 text-blue-800'
                  : selectedFolderId === folder.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverTarget(folder.id);
              }}
              onDragLeave={() => setDragOverTarget(null)}
              onDrop={(e) => handleDropToFolder(e, folder.id)}
            >
              <div
                className="flex items-center flex-1"
                onClick={() => onSelectFolder(folder.id)}
              >
                <FolderIcon size={16} className="mr-2" />
                <span className="text-sm font-medium truncate">{folder.name}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(folder);
                  }}
                  className="p-1 hover:bg-gray-200 rounded"
                  title={t('Edit')}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteModal(folder.id);
                  }}
                  className="p-1 hover:bg-red-100 text-red-600 rounded"
                  title={t('Delete')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewFolderName('');
        }}
        title={t('Create New Folder')}
      >
        <Input
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder={t('Folder name')}
          onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
          autoFocus
        />
        <div className="flex gap-2 mt-4">
          <Button onClick={handleCreateFolder} className="flex-1">
            {t('Create')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setIsCreateModalOpen(false);
              setNewFolderName('');
            }}
            className="flex-1"
          >
            {t('Cancel')}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingFolder(null);
          setNewFolderName('');
        }}
        title={t('Rename Folder')}
      >
        <Input
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder={t('Folder name')}
          onKeyPress={(e) => e.key === 'Enter' && handleEditFolder()}
          autoFocus
        />
        <div className="flex gap-2 mt-4">
          <Button onClick={handleEditFolder} className="flex-1">
            {t('Save')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setIsEditModalOpen(false);
              setEditingFolder(null);
              setNewFolderName('');
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
          setDeletingFolderId(null);
        }}
        title={t('Delete Folder')}
      >
        <p className="text-gray-600 mb-4">
          {t('Are you sure you want to delete this folder? Diaries in this folder will be moved to "All Diaries".')}
        </p>
        <div className="flex gap-2">
          <Button variant="danger" onClick={handleDeleteFolder} className="flex-1">
            {t('Delete')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setDeletingFolderId(null);
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
