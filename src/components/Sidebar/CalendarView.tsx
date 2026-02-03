import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import type { Diary } from '../../types';
import { formatDate } from '../../utils/date';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Modal } from '../UI/Modal';
import { t } from '../../i18n';

interface CalendarViewProps {
  diaries: Diary[];
  onSelectDiary: (id: string) => void;
  onCreateDiary: (date: Date) => void;
  onChangeDiaryDate: (id: string, date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  diaries,
  onSelectDiary,
  onCreateDiary,
  onChangeDiaryDate,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiary, setEditingDiary] = useState<Diary | null>(null);
  const [editDateStr, setEditDateStr] = useState('');

  const openEditDateModal = (diary: Diary) => {
    setEditingDiary(diary);
    setEditDateStr(new Date(diary.createdAt).toISOString().slice(0, 10));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDiary(null);
    setEditDateStr('');
  };

  const handleSaveDate = () => {
    if (!editingDiary || !editDateStr) return;
    const newDate = new Date(editDateStr);
    onChangeDiaryDate(editingDiary.id, newDate);
    closeModal();
  };

  // 按日期分组日记
  const diariesByDate = React.useMemo(() => {
    const map = new Map<string, Diary[]>();
    diaries.forEach(diary => {
      const dateKey = new Date(diary.createdAt).toDateString();
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(diary);
    });
    return map;
  }, [diaries]);

  // 获取某天的日记数量
  const getDiaryCountForDate = (date: Date): number => {
    const dateKey = date.toDateString();
    return diariesByDate.get(dateKey)?.length || 0;
  };

  // 获取选中日期的日记
  const selectedDateDiaries = diariesByDate.get(selectedDate.toDateString()) || [];

  // 自定义日期单元格内容
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const count = getDiaryCountForDate(date);
      if (count > 0) {
        return (
          <div className="flex justify-center mt-1">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
          </div>
        );
      }
    }
    return null;
  };

  // 自定义日期单元格样式
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const count = getDiaryCountForDate(date);
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const isToday = date.toDateString() === new Date().toDateString();

      let classes = 'relative ';
      if (count > 0) classes += 'font-semibold ';
      if (isSelected) classes += 'bg-blue-100 ';
      if (isToday) classes += 'text-blue-600 ';

      return classes;
    }
    return '';
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleCreateDiaryForDate = () => {
    onCreateDiary(selectedDate);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{t('Calendar View')}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="calendar-container mb-4">
          <Calendar
            onChange={(value) => handleDateClick(value as Date)}
            value={selectedDate}
            tileContent={tileContent}
            tileClassName={tileClassName}
            locale="zh-CN"
            className="w-full border-none shadow-sm rounded-lg"
          />
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">
              {formatDate(selectedDate.getTime())}
            </h3>
            <button
              onClick={handleCreateDiaryForDate}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + {t('New Diary')}
            </button>
          </div>

          {selectedDateDiaries.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">{t('No diaries on this date')}</p>
              <button
                onClick={handleCreateDiaryForDate}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                {t('Create one')}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDateDiaries.map(diary => (
                <div
                  key={diary.id}
                  onClick={() => onSelectDiary(diary.id)}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="mr-4 min-w-0">
                      <h4 className="font-medium text-gray-900 mb-1 truncate">
                        {diary.title || t('Untitled')}
                      </h4>
                      {diary.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {diary.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="inline-block px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditDateModal(diary); }}
                        className="text-sm text-gray-500 hover:text-blue-600 p-1 rounded"
                        title={t('Change Date')}
                      >
                        <CalendarIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <Modal isOpen={isModalOpen} onClose={closeModal} title={t('Change Diary Date')}>
                <div>
                  <p className="text-sm text-gray-600 mb-2">{t('Diary:')} <strong>{editingDiary?.title || t('Untitled')}</strong></p>
                  <input
                    type="date"
                    value={editDateStr}
                    onChange={(e) => setEditDateStr(e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={closeModal}
                      className="px-3 py-2 bg-gray-100 rounded"
                    >
                      {t('Cancel')}
                    </button>
                    <button
                      onClick={handleSaveDate}
                      className="px-3 py-2 bg-blue-600 text-white rounded"
                    >
                      {t('Save')}
                    </button>
                  </div>
                </div>
              </Modal>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .calendar-container .react-calendar {
          border: none;
          font-family: inherit;
        }
        .calendar-container .react-calendar__tile {
          padding: 0.75em 0.5em;
          border-radius: 0.375rem;
        }
        .calendar-container .react-calendar__tile:enabled:hover {
          background-color: #f3f4f6;
        }
        .calendar-container .react-calendar__tile--active {
          background-color: #dbeafe !important;
          color: #1e40af;
        }
        .calendar-container .react-calendar__tile--now {
          background-color: #fef3c7;
        }
        .calendar-container .react-calendar__navigation button {
          font-size: 1rem;
          font-weight: 600;
        }
        .calendar-container .react-calendar__navigation button:enabled:hover {
          background-color: #f3f4f6;
        }
        .calendar-container .react-calendar__month-view__weekdays {
          font-size: 0.875rem;
          font-weight: 600;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};
