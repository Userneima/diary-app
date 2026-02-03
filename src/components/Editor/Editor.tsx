import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
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

const Underline = (UnderlineExtension as any).default || UnderlineExtension.Underline || UnderlineExtension;
const Strike = (StrikeExtension as any).default || StrikeExtension.Strike || StrikeExtension;
const Link = (LinkExtension as any).default || LinkExtension.Link || LinkExtension;
const Image = (ImageExtension as any).default || ImageExtension.Image || ImageExtension;
const Table = (TableExtension as any).default || TableExtension.Table || TableExtension;
const TableRow = (TableRowExtension as any).default || TableRowExtension.TableRow || TableRowExtension;
const TableCell = (TableCellExtension as any).default || TableCellExtension.TableCell || TableCellExtension;
const TableHeader = (TableHeaderExtension as any).default || TableHeaderExtension.TableHeader || TableHeaderExtension;
const TaskList = (TaskListExtension as any).default || TaskListExtension.TaskList || TaskListExtension;
const TaskItem = (TaskItemExtension as any).default || TaskItemExtension.TaskItem || TaskItemExtension;
const Highlight = (HighlightExtension as any).default || HighlightExtension.Highlight || HighlightExtension;
const TextStyle = (TextStyleExtension as any).default || TextStyleExtension.TextStyle || TextStyleExtension;
const Color = (ColorExtension as any).default || ColorExtension.Color || ColorExtension;

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
}

export const Editor: React.FC<EditorProps> = ({
  content,
  onChange,
  editable = true,
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
      {editable && <EditorToolbar editor={editor} />}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
};
