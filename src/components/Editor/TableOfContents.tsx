import React, { useMemo } from 'react';
import { FileText } from 'lucide-react';
import { extractHeadings } from '../../utils/toc';
import { t } from '../../i18n';

interface TableOfContentsProps {
  content: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ content }) => {
  const headings = useMemo(() => extractHeadings(content), [content]);

  if (headings.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 p-4 bg-gray-100">
        <FileText size={32} className="mb-2 opacity-50" />
        <p className="text-sm text-center">{t('No headings in this article')}</p>
      </div>
    );
  }

  const minLevel = Math.min(...headings.map((h) => h.level));

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-100">
      <div className="px-4 py-3 border-b border-gray-300 bg-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">{t('Table of Contents')}</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ul className="p-3 space-y-1">
          {headings.map((heading) => (
            <li
              key={heading.id}
              style={{
                marginLeft: `${(heading.level - minLevel) * 12}px`,
              }}
            >
              <a
                href={`#${heading.id}`}
                className="text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded px-1 truncate block py-1 transition-colors"
                title={heading.title}
              >
                <span className="text-xs text-gray-400 mr-1">
                  H{heading.level}
                </span>
                {heading.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
