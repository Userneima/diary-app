import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { AnyExtension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import * as UnderlineExtension from '@tiptap/extension-underline';
import * as StrikeExtension from '@tiptap/extension-strike';
import * as LinkExtension from '@tiptap/extension-link';
import * as ImageExtension from '@tiptap/extension-image';
import * as TableExtension from '@tiptap/extension-table';
import * as TableRowExtension from '@tiptap/extension-table-row';
import * as TableCellExtension from '@tiptap/extension-table-cell';
import * as TableHeaderExtension from '@tiptap/extension-table-header';
import * as TaskListExtension from '@tiptap/extension-task-list';
import * as TaskItemExtension from '@tiptap/extension-task-item';
import * as HighlightExtension from '@tiptap/extension-highlight';
import * as TextStyleExtension from '@tiptap/extension-text-style';
import * as ColorExtension from '@tiptap/extension-color';
import { EditorToolbar } from './EditorToolbar';
import { TextBubbleMenu } from './TextBubbleMenu';

const getExtension = (moduleExports: unknown, namedExport: string): AnyExtension => {
  const exportsRecord = moduleExports as Record<string, unknown>;
  return (exportsRecord.default ?? exportsRecord[namedExport] ?? moduleExports) as AnyExtension;
};

const Underline = getExtension(UnderlineExtension, 'Underline');
const Strike = getExtension(StrikeExtension, 'Strike');
const Link = getExtension(LinkExtension, 'Link');
const Image = getExtension(ImageExtension, 'Image');
const Table = getExtension(TableExtension, 'Table');
const TableRow = getExtension(TableRowExtension, 'TableRow');
const TableCell = getExtension(TableCellExtension, 'TableCell');
const TableHeader = getExtension(TableHeaderExtension, 'TableHeader');
const TaskList = getExtension(TaskListExtension, 'TaskList');
const TaskItem = getExtension(TaskItemExtension, 'TaskItem');
const Highlight = getExtension(HighlightExtension, 'Highlight');
const TextStyle = getExtension(TextStyleExtension, 'TextStyle');
const Color = getExtension(ColorExtension, 'Color');

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
  onAnalyze?: () => void;
  contentRightPanel?: React.ReactNode;
}

export const Editor: React.FC<EditorProps> = ({
  content,
  onChange,
  editable = true,
  onAnalyze,
  contentRightPanel,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      Strike,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Tab') {
          event.preventDefault();
          const { state, dispatch } = view;
          const { $from } = state.selection;
          const indent = '　'; // 1个中文全角空格
          const tr = state.tr.insertText(indent, $from.pos, $from.pos);
          dispatch(tr);
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {editable && <EditorToolbar editor={editor} onAnalyze={onAnalyze} />}
      {editable && <TextBubbleMenu editor={editor} />}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto">
          <EditorContent editor={editor} className="h-full" />
        </div>
        {contentRightPanel}
      </div>
    </div>
  );
};
