import React, { useCallback } from 'react';
import { Editor, useEditorState } from '@tiptap/react';
import {
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Image as ImageIcon,
  Link as LinkIcon,
  Table as TableIcon,
  Minus,
  Undo,
  Redo,
  Zap,
} from 'lucide-react';

import { t } from '../../i18n';

interface EditorToolbarProps {
  editor: Editor;
  onAnalyze?: () => void;
}

type ToolbarButtonProps = {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title: string;
};

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, isActive, children, title }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-2 rounded hover:bg-gray-100 transition-colors ${
      isActive ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
    }`}
  >
    {children}
  </button>
);

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor, onAnalyze }) => {
  const maxUsedHeading = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      let maxLevel = 0;
      currentEditor.state.doc.descendants((node) => {
        if (node.type.name === 'heading') {
          const level = Number(node.attrs.level || 0);
          if (level > maxLevel) {
            maxLevel = level;
          }
        }
      });
      return maxLevel;
    },
  });

  const maxVisibleHeadingLevel = Math.min(6, Math.max(3, maxUsedHeading + 1));

  const addImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          editor.chain().focus().setImage({ src: url }).run();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [editor]);

  const addLink = useCallback(() => {
    const url = window.prompt(t('Enter URL:'));
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const addTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const renderHeadingIcon = (level: number) => {
    const iconProps = { size: 18 };
    const baseClass = 'font-semibold flex items-center justify-center w-5 h-5';
    
    if (level === 1) {
      return <Heading1 {...iconProps} />;
    }
    if (level === 2) {
      return <Heading2 {...iconProps} />;
    }
    if (level === 3) {
      return <Heading3 {...iconProps} />;
    }
    
    // H4-H6 显示统一的标题图标风格
    return (
      <span className={baseClass}>
        <span className="text-xs">H{level}</span>
      </span>
    );
  };

  return (
    <>
      <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1 bg-gray-50">
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        title={t('Undo')}
      >
        <Undo size={18} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        title={t('Redo')}
      >
        <Redo size={18} />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {Array.from({ length: maxVisibleHeadingLevel }, (_, index) => index + 1).map((level) => (
        <ToolbarButton
          key={level}
          onClick={() => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run()}
          isActive={editor.isActive('heading', { level })}
          title={t(`Heading ${level}`)}
        >
          {renderHeadingIcon(level)}
        </ToolbarButton>
      ))}

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title={t('Bullet List')}
      >
        <List size={18} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title={t('Ordered List')}
      >
        <ListOrdered size={18} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive('taskList')}
        title={t('Task List')}
      >
        <CheckSquare size={18} />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title={t('Quote')}
      >
        <Quote size={18} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title={t('Code Block')}
      >
        <Code size={18} />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <ToolbarButton onClick={addLink} title={t('Add Link')}>
        <LinkIcon size={18} />
      </ToolbarButton>
      <ToolbarButton onClick={addImage} title={t('Add Image')}>
        <ImageIcon size={18} />
      </ToolbarButton>
      <ToolbarButton onClick={addTable} title={t('Insert Table')}>
        <TableIcon size={18} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title={t('Horizontal Rule')}
      >
        <Minus size={18} />
      </ToolbarButton>

      {/* AI analyze */}
      <ToolbarButton
        onClick={() => onAnalyze && onAnalyze()}
        title={t('Analyze')}
      >
        <Zap size={18} />
      </ToolbarButton>
      </div>
    </>
  );
};
